type TradeHistoryRow = {
  txHash: string;
  marketId: string;
  state: "PENDING" | "CONFIRMED" | "INDEXED" | "FAILED";
};

type PositionRow = {
  marketId: string;
  yesShares: string;
  noShares: string;
};

async function checkEndpoint<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${JSON.stringify(data)}`);
  }

  return data as T;
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const apiBase = process.env.API_BASE || "http://127.0.0.1:3001";
  const token = process.env.AUTH_TOKEN || "";
  const walletAddress = (process.env.WALLET_ADDRESS || "").toLowerCase();

  if (!token) {
    throw new Error("AUTH_TOKEN is required");
  }

  if (!walletAddress) {
    throw new Error("WALLET_ADDRESS is required");
  }

  const [history, positions] = await Promise.all([
    checkEndpoint<TradeHistoryRow[]>(
      `${apiBase}/trades/history?walletAddress=${encodeURIComponent(walletAddress)}&limit=20`,
      token,
    ),
    checkEndpoint<PositionRow[]>(
      `${apiBase}/trades/positions?walletAddress=${encodeURIComponent(walletAddress)}`,
      token,
    ),
  ]);

  assert(Array.isArray(history), "History must be an array");
  assert(Array.isArray(positions), "Positions must be an array");

  for (const row of history) {
    assert(Boolean(row.txHash), "History row missing txHash");
    assert(Boolean(row.marketId), "History row missing marketId");
    assert(
      row.state === "PENDING" || row.state === "CONFIRMED" || row.state === "INDEXED" || row.state === "FAILED",
      "History row has invalid state",
    );
  }

  for (const row of positions) {
    assert(Boolean(row.marketId), "Position row missing marketId");
    assert(typeof row.yesShares === "string", "Position row yesShares must be string");
    assert(typeof row.noShares === "string", "Position row noShares must be string");
  }

  console.log(
    `QA read-model passed. wallet=${walletAddress} history=${history.length} positions=${positions.length}`,
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
