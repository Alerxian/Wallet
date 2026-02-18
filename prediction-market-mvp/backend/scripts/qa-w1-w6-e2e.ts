import { Wallet } from "ethers";

type NonceResponse = {
  nonce: string;
};

type VerifyResponse = {
  address: string;
  session: {
    token: string;
    expiresIn: number;
    expiresAt: number;
  };
};

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertStatus(status: number, expected: number[], context: string, payload: unknown) {
  if (!expected.includes(status)) {
    throw new Error(`${context} failed: status=${status} payload=${JSON.stringify(payload)}`);
  }
}

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

async function getJson<T>(url: string, init?: RequestInit): Promise<{ status: number; data: T }> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T;
  return {
    status: response.status,
    data,
  };
}

async function main() {
  const apiBase = process.env.API_BASE || "http://127.0.0.1:3001";
  const privateKey = process.env.QA_PRIVATE_KEY || "";
  const chainId = Number(process.env.CHAIN_ID || 31337);

  if (!privateKey) {
    throw new Error("QA_PRIVATE_KEY is required");
  }

  const wallet = new Wallet(privateKey);
  const walletAddress = wallet.address.toLowerCase();

  const nonceResponse = await getJson<NonceResponse>(
    `${apiBase}/auth/siwe/nonce?address=${encodeURIComponent(walletAddress)}`,
  );
  assertStatus(nonceResponse.status, [200], "SIWE nonce endpoint", nonceResponse.data);
  assert(Boolean(nonceResponse.data.nonce), "SIWE nonce missing");

  const siweMessage = buildSiweMessage(walletAddress, nonceResponse.data.nonce, apiBase, chainId);
  const signature = await wallet.signMessage(siweMessage);

  const verifyResponse = await getJson<VerifyResponse>(`${apiBase}/auth/siwe/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: siweMessage,
      signature,
    }),
  });

  assertStatus(verifyResponse.status, [200, 201], "SIWE verify endpoint", verifyResponse.data);
  assert(verifyResponse.data.address === walletAddress, "SIWE verify address mismatch");
  assert(Boolean(verifyResponse.data.session?.token), "SIWE verify token missing");

  const authHeader = {
    Authorization: `Bearer ${verifyResponse.data.session.token}`,
  };

  const historyResponse = await getJson<unknown[]>(
    `${apiBase}/trades/history?walletAddress=${encodeURIComponent(walletAddress)}&limit=10`,
    { headers: authHeader },
  );
  assertStatus(historyResponse.status, [200], "Trades history endpoint", historyResponse.data);
  assert(Array.isArray(historyResponse.data), "Trades history response is not array");

  const positionsResponse = await getJson<unknown[]>(
    `${apiBase}/trades/positions?walletAddress=${encodeURIComponent(walletAddress)}`,
    { headers: authHeader },
  );
  assertStatus(positionsResponse.status, [200], "Trades positions endpoint", positionsResponse.data);
  assert(Array.isArray(positionsResponse.data), "Trades positions response is not array");

  const mismatchedWallet = "0x000000000000000000000000000000000000dEaD".toLowerCase();
  const forbiddenResponse = await getJson<{ message?: string }>(
    `${apiBase}/trades/positions?walletAddress=${encodeURIComponent(mismatchedWallet)}`,
    { headers: authHeader },
  );
  assertStatus(forbiddenResponse.status, [403], "Wallet/session mismatch check", forbiddenResponse.data);

  console.log(
    [
      "QA W1-W6 E2E passed",
      `wallet=${walletAddress}`,
      `history=${historyResponse.data.length}`,
      `positions=${positionsResponse.data.length}`,
    ].join(" | "),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
