import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { Contract, InterfaceAbi, JsonRpcProvider } from "ethers";

const marketAbi = require("../src/chain/abi/PredictionMarket.json") as InterfaceAbi;

type PositionKey = `${string}:${string}`;

function getKey(marketAddress: string, walletAddress: string): PositionKey {
  return `${marketAddress.toLowerCase()}:${walletAddress.toLowerCase()}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const prisma = new PrismaClient();
  const provider = new JsonRpcProvider(rpcUrl);

  try {
    const trades = await prisma.indexedTrade.findMany({
      orderBy: [{ blockNumber: "asc" }, { id: "asc" }],
      select: {
        marketAddress: true,
        walletAddress: true,
        action: true,
        side: true,
        amount: true,
      },
    });

    const positionMap = new Map<
      PositionKey,
      {
        marketAddress: string;
        walletAddress: string;
        yesShares: bigint;
        noShares: bigint;
      }
    >();

    for (const trade of trades) {
      const key = getKey(trade.marketAddress, trade.walletAddress);
      const current =
        positionMap.get(key) ||
        {
          marketAddress: trade.marketAddress.toLowerCase(),
          walletAddress: trade.walletAddress.toLowerCase(),
          yesShares: BigInt(0),
          noShares: BigInt(0),
        };

      const amount = BigInt(trade.amount);
      const direction = trade.action === "BUY" ? BigInt(1) : BigInt(-1);

      if (trade.side === "YES") {
        current.yesShares += direction * amount;
      } else {
        current.noShares += direction * amount;
      }

      positionMap.set(key, current);
    }

    let checked = 0;
    const mismatches: Array<{
      marketAddress: string;
      walletAddress: string;
      expectedYes: string;
      onChainYes: string;
      expectedNo: string;
      onChainNo: string;
    }> = [];

    for (const position of positionMap.values()) {
      checked += 1;
      const market = new Contract(position.marketAddress, marketAbi, provider);

      const [onChainYesRaw, onChainNoRaw] = await Promise.all([
        market.yesShares(position.walletAddress),
        market.noShares(position.walletAddress),
      ]);

      const onChainYes = BigInt(onChainYesRaw.toString());
      const onChainNo = BigInt(onChainNoRaw.toString());

      if (onChainYes !== position.yesShares || onChainNo !== position.noShares) {
        mismatches.push({
          marketAddress: position.marketAddress,
          walletAddress: position.walletAddress,
          expectedYes: position.yesShares.toString(),
          onChainYes: onChainYes.toString(),
          expectedNo: position.noShares.toString(),
          onChainNo: onChainNo.toString(),
        });
      }
    }

    if (mismatches.length) {
      console.error(`Reconciliation failed. Checked ${checked} positions, mismatches: ${mismatches.length}`);
      for (const mismatch of mismatches) {
        console.error(
          [
            mismatch.marketAddress,
            mismatch.walletAddress,
            `YES expected=${mismatch.expectedYes} onchain=${mismatch.onChainYes}`,
            `NO expected=${mismatch.expectedNo} onchain=${mismatch.onChainNo}`,
          ].join(" | "),
        );
      }
      process.exit(1);
    }

    console.log(`Reconciliation passed. Checked ${checked} positions.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
