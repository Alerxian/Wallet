import { Contract, JsonRpcProvider, Wallet } from "ethers";

type VerifyResponse = {
  address: string;
  session: {
    token: string;
    expiresAt: number;
  };
};

type TradeStatus = "PENDING" | "CONFIRMED" | "INDEXED" | "FAILED";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function getDomain(apiBase: string) {
  return new URL(apiBase).host;
}

function buildSiweMessage(address: string, nonce: string, apiBase: string, chainId: number) {
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const domain = getDomain(apiBase);

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

async function requestJson<T>(url: string, init?: RequestInit): Promise<{ status: number; payload: T }> {
  const response = await fetch(url, init);
  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as T) : ({} as T);
  return {
    status: response.status,
    payload,
  };
}

async function siweLogin(apiBase: string, chainId: number, wallet: Wallet): Promise<VerifyResponse> {
  const nonce = await requestJson<{ nonce: string }>(
    `${apiBase}/auth/siwe/nonce?address=${encodeURIComponent(wallet.address.toLowerCase())}`,
  );
  assert(nonce.status === 200, `nonce failed: ${JSON.stringify(nonce.payload)}`);

  const message = buildSiweMessage(wallet.address.toLowerCase(), nonce.payload.nonce, apiBase, chainId);
  const signature = await wallet.signMessage(message);

  const verify = await requestJson<VerifyResponse>(`${apiBase}/auth/siwe/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });

  assert(verify.status === 200 || verify.status === 201, `verify failed: ${JSON.stringify(verify.payload)}`);
  assert(Boolean(verify.payload.session?.token), "verify session token missing");
  return verify.payload;
}

async function waitForIndexed(apiBase: string, token: string, txHash: string) {
  const started = Date.now();

  while (Date.now() - started < 120000) {
    const res = await requestJson<{ state: TradeStatus }>(`${apiBase}/trades/status/${txHash.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert(res.status === 200, `status endpoint failed: ${JSON.stringify(res.payload)}`);
    if (res.payload.state === "FAILED") {
      throw new Error(`Transaction failed on-chain: ${txHash}`);
    }

    if (res.payload.state === "INDEXED") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Timed out waiting INDEXED for tx=${txHash}`);
}

async function main() {
  const apiBase = process.env.API_BASE || "http://127.0.0.1:3001";
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const chainId = Number(process.env.CHAIN_ID || 31337);
  const adminPrivateKey =
    process.env.QA_ADMIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const userPrivateKey =
    process.env.QA_USER_PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945387dc9e86dae88c7a8412f4603b6b78690d";

  const provider = new JsonRpcProvider(rpcUrl);
  const adminWallet = new Wallet(adminPrivateKey, provider);
  const userWallet = new Wallet(userPrivateKey, provider);
  let nextNonce = await provider.getTransactionCount(adminWallet.address, "pending");

  const sendWithNonce = async (tx: { to: string; data: string; value?: bigint }) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const sent = await adminWallet.sendTransaction({
          to: tx.to,
          data: tx.data,
          value: tx.value || 0n,
          nonce: nextNonce,
        });
        nextNonce += 1;
        await sent.wait();
        return sent;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("nonce too low") && !message.includes("NONCE_EXPIRED")) {
          throw error;
        }

        nextNonce = await provider.getTransactionCount(adminWallet.address, "pending");
      }
    }

    throw new Error("Failed to send tx after nonce retries");
  };

  const adminSession = await siweLogin(apiBase, chainId, adminWallet);
  const userSession = await siweLogin(apiBase, chainId, userWallet);

  const sessionCheck = await requestJson<{ address: string }>(`${apiBase}/auth/siwe/session`, {
    headers: { Authorization: `Bearer ${adminSession.session.token}` },
  });
  assert(sessionCheck.status === 200, `session check failed: ${JSON.stringify(sessionCheck.payload)}`);
  assert(sessionCheck.payload.address.toLowerCase() === adminWallet.address.toLowerCase(), "session address mismatch");

  const closeTime = Math.floor(Date.now() / 1000) + 3600;

  const forbiddenCreate = await requestJson<{ message?: string }>(`${apiBase}/markets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userSession.session.token}`,
    },
    body: JSON.stringify({
      question: `forbidden market ${Date.now()}`,
      closeTime,
    }),
  });
  assert(forbiddenCreate.status === 403, `non-admin create should be 403: ${JSON.stringify(forbiddenCreate.payload)}`);

  const createMarket = await requestJson<{ id: string; marketAddress: string }>(`${apiBase}/markets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminSession.session.token}`,
    },
    body: JSON.stringify({
      question: `qa security market ${Date.now()}`,
      closeTime,
    }),
  });
  assert(createMarket.status === 200 || createMarket.status === 201, `admin create failed: ${JSON.stringify(createMarket.payload)}`);
  assert(Boolean(createMarket.payload.id), "created market id missing");

  const invalidAmount = await requestJson<{ message?: string }>(`${apiBase}/trades/approve-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminSession.session.token}`,
    },
    body: JSON.stringify({
      marketId: createMarket.payload.id,
      walletAddress: adminWallet.address.toLowerCase(),
      amount: "not-a-number",
    }),
  });
  assert(invalidAmount.status === 400, `invalid amount should be 400: ${JSON.stringify(invalidAmount.payload)}`);

  const chainConfig = await requestJson<{ factoryAddress: string }>(`${apiBase}/chain/config`);
  assert(chainConfig.status === 200, `chain config failed: ${JSON.stringify(chainConfig.payload)}`);

  const factory = new Contract(
    chainConfig.payload.factoryAddress,
    ["function collateralToken() view returns (address)"],
    provider,
  );
  const collateralToken = String(await factory.collateralToken()).toLowerCase();
  const usdc = new Contract(
    collateralToken,
    ["function mint(address,uint256)", "function balanceOf(address) view returns (uint256)"],
    adminWallet,
  );

  const minBalance = BigInt(200_000_000);
  const currentBalance = BigInt((await usdc.balanceOf(adminWallet.address)).toString());
  if (currentBalance < minBalance) {
    const mintData = usdc.interface.encodeFunctionData("mint", [adminWallet.address, minBalance * 5n]);
    await sendWithNonce({
      to: collateralToken,
      data: mintData,
      value: 0n,
    });
  }

  const approveIntent = await requestJson<{ tx: { to: string; data: string; value: string } }>(`${apiBase}/trades/approve-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminSession.session.token}`,
    },
    body: JSON.stringify({
      marketId: createMarket.payload.id,
      walletAddress: adminWallet.address.toLowerCase(),
      amount: "25",
    }),
  });
  assert(approveIntent.status === 200 || approveIntent.status === 201, `approve intent failed: ${JSON.stringify(approveIntent.payload)}`);

  await sendWithNonce({
    to: approveIntent.payload.tx.to,
    data: approveIntent.payload.tx.data,
    value: BigInt(approveIntent.payload.tx.value || "0"),
  });

  const tradeIntent = await requestJson<{ tx: { to: string; data: string; value: string } }>(`${apiBase}/trades/intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminSession.session.token}`,
    },
    body: JSON.stringify({
      marketId: createMarket.payload.id,
      walletAddress: adminWallet.address.toLowerCase(),
      amount: "25",
      action: "BUY",
      side: "YES",
    }),
  });
  assert(tradeIntent.status === 200 || tradeIntent.status === 201, `trade intent failed: ${JSON.stringify(tradeIntent.payload)}`);

  const tradeTx = await sendWithNonce({
    to: tradeIntent.payload.tx.to,
    data: tradeIntent.payload.tx.data,
    value: BigInt(tradeIntent.payload.tx.value || "0"),
  });

  await waitForIndexed(apiBase, adminSession.session.token, tradeTx.hash.toLowerCase());

  const history = await requestJson<Array<{ txHash: string }>>(
    `${apiBase}/trades/history?walletAddress=${encodeURIComponent(adminWallet.address.toLowerCase())}&limit=20`,
    {
      headers: { Authorization: `Bearer ${adminSession.session.token}` },
    },
  );
  assert(history.status === 200, `history failed: ${JSON.stringify(history.payload)}`);
  assert(Array.isArray(history.payload) && history.payload.length > 0, "history should not be empty");

  const positions = await requestJson<Array<{ marketId: string }>>(
    `${apiBase}/trades/positions?walletAddress=${encodeURIComponent(adminWallet.address.toLowerCase())}`,
    {
      headers: { Authorization: `Bearer ${adminSession.session.token}` },
    },
  );
  assert(positions.status === 200, `positions failed: ${JSON.stringify(positions.payload)}`);
  assert(Array.isArray(positions.payload) && positions.payload.length > 0, "positions should not be empty");

  console.log(
    [
      "QA auth/markets/trades/indexer E2E passed",
      `admin=${adminWallet.address.toLowerCase()}`,
      `user=${userWallet.address.toLowerCase()}`,
      `marketId=${createMarket.payload.id}`,
      `tradeTx=${tradeTx.hash.toLowerCase()}`,
    ].join(" | "),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
