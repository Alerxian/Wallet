import { Contract, JsonRpcProvider, Wallet } from "ethers";

type NonceResponse = { nonce: string };
type VerifyResponse = {
  session: {
    token: string;
    expiresAt: number;
  };
};

type MarketResponse = {
  id: string;
};

type IntentResponse = {
  tx: {
    to: string;
    data: string;
    value: string;
  };
};

type TradeStatusResponse = {
  state: "PENDING" | "CONFIRMED" | "INDEXED" | "FAILED";
};

function buildSiweMessage(address: string, nonce: string, apiBase: string, chainId: number) {
  const domain = new URL(apiBase).host;
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    `URI: ${apiBase}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`,
  ].join("\n");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload as T;
}

async function waitForState(
  apiBase: string,
  token: string,
  txHash: string,
  expected: Array<TradeStatusResponse["state"]>,
): Promise<TradeStatusResponse["state"]> {
  for (let i = 0; i < 20; i += 1) {
    const status = await fetchJson<TradeStatusResponse>(`${apiBase}/trades/status/${txHash}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (expected.includes(status.state)) {
      return status.state;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error(`Timed out waiting for tx state. txHash=${txHash}`);
}

async function main() {
  const apiBase = process.env.API_BASE || "http://127.0.0.1:3001";
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const chainId = Number(process.env.CHAIN_ID || 31337);
  const privateKey = process.env.QA_PRIVATE_KEY || "";

  if (!privateKey) {
    throw new Error("QA_PRIVATE_KEY is required");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const walletAddress = wallet.address.toLowerCase();
  let nextNonce = await provider.getTransactionCount(walletAddress, "latest");

  const sendWithNonce = async (tx: { to: string; data: string; value?: bigint }) => {
    const sent = await wallet.sendTransaction({
      ...tx,
      nonce: nextNonce,
    });
    nextNonce += 1;
    await sent.wait();
    return sent;
  };

  const nonce = await fetchJson<NonceResponse>(`${apiBase}/auth/siwe/nonce?address=${encodeURIComponent(walletAddress)}`);
  const message = buildSiweMessage(walletAddress, nonce.nonce, apiBase, chainId);
  const signature = await wallet.signMessage(message);

  const verify = await fetchJson<VerifyResponse>(`${apiBase}/auth/siwe/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });

  const token = verify.session.token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const chainConfig = await fetchJson<{ factoryAddress: string }>(`${apiBase}/chain/config`);
  const factory = new Contract(
    chainConfig.factoryAddress,
    ["function collateralToken() view returns (address)"],
    provider,
  );
  const collateralToken = String(await factory.collateralToken()).toLowerCase();
  const usdc = new Contract(
    collateralToken,
    [
      "function mint(address to, uint256 amount)",
      "function balanceOf(address account) view returns (uint256)",
    ],
    wallet,
  );

  const balance = BigInt((await usdc.balanceOf(walletAddress)).toString());
  const minRequired = BigInt(50_000_000); // 50 USDC with 6 decimals
  if (balance < minRequired) {
    const mintData = usdc.interface.encodeFunctionData("mint", [walletAddress, minRequired * BigInt(20)]);
    await sendWithNonce({
      to: collateralToken,
      data: mintData,
      value: BigInt(0),
    });
  }

  const closeTime = Math.floor(Date.now() / 1000) + 3600;
  const market = await fetchJson<MarketResponse>(`${apiBase}/markets`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      question: `QA seeded market ${Date.now()}`,
      closeTime,
    }),
  });

  const approveIntent = await fetchJson<IntentResponse>(`${apiBase}/trades/approve-intent`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      marketId: market.id,
      walletAddress,
      amount: "10",
    }),
  });

  await sendWithNonce({
    to: approveIntent.tx.to,
    data: approveIntent.tx.data,
    value: BigInt(approveIntent.tx.value || "0"),
  });

  const tradeIntent = await fetchJson<IntentResponse>(`${apiBase}/trades/intent`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      marketId: market.id,
      walletAddress,
      amount: "10",
      action: "BUY",
      side: "YES",
    }),
  });

  const tradeTx = await sendWithNonce({
    to: tradeIntent.tx.to,
    data: tradeIntent.tx.data,
    value: BigInt(tradeIntent.tx.value || "0"),
  });

  await waitForState(apiBase, token, tradeTx.hash.toLowerCase(), ["CONFIRMED", "INDEXED"]);
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const history = await fetchJson<Array<{ txHash: string }>>(
    `${apiBase}/trades/history?walletAddress=${encodeURIComponent(walletAddress)}&limit=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const positions = await fetchJson<Array<{ marketId: string }>>(
    `${apiBase}/trades/positions?walletAddress=${encodeURIComponent(walletAddress)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (history.length === 0) {
    throw new Error("Expected non-empty history after seeded trade");
  }

  if (positions.length === 0) {
    throw new Error("Expected non-empty positions after seeded trade");
  }

  console.log(`Seed flow passed | wallet=${walletAddress} | marketId=${market.id} | tx=${tradeTx.hash.toLowerCase()}`);
  console.log(`AUTH_TOKEN=${token}`);
  console.log(`WALLET_ADDRESS=${walletAddress}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
