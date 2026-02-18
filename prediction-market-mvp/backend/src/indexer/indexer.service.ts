import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { Interface, InterfaceAbi, Log } from "ethers";
import { ChainService } from "../chain/chain.service";
import { PrismaService } from "../prisma/prisma.service";

const factoryAbi = require("../chain/abi/PredictionMarketFactory.json") as InterfaceAbi;
const marketAbi = require("../chain/abi/PredictionMarket.json") as InterfaceAbi;

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private readonly factoryInterface = new Interface(factoryAbi);
  private readonly marketInterface = new Interface(marketAbi);

  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly chainService: ChainService,
    private readonly prismaService: PrismaService,
  ) {}

  async onModuleInit() {
    if (!this.prismaService.isEnabled) {
      this.logger.warn("DATABASE_URL missing, indexer disabled");
      return;
    }

    await this.ensureCursor();
    await this.syncOnce();

    const intervalMs = this.configService.get<number>("indexerPollIntervalMs") || 3000;
    this.timer = setInterval(() => {
      void this.syncOnce();
    }, intervalMs);
  }

  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async listIndexedMarkets() {
    if (!this.prismaService.isEnabled) {
      return [];
    }

    const rows = await this.prismaService.db.indexedMarket.findMany({
      orderBy: [{ createBlock: "desc" }, { marketId: "desc" }],
    });

    return rows.map((row) => ({
      marketId: row.marketId,
      question: row.question,
      marketAddress: row.marketAddress,
      closeTime: Number(row.closeTime),
      status: row.status,
      resolvedOutcome: row.resolvedOutcome,
      createTxHash: row.createTxHash,
      createBlock: row.createBlock ? Number(row.createBlock) : null,
    }));
  }

  private async syncOnce() {
    if (!this.prismaService.isEnabled || this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const lastIndexedBlock = await this.getCursor();
      const latestBlock = await this.chainService.provider.getBlockNumber();
      const confirmations = this.configService.get<number>("indexerConfirmations") || 0;
      const targetBlock = Math.max(0, latestBlock - confirmations);

      if (targetBlock <= lastIndexedBlock) {
        return;
      }

      const fromBlock = lastIndexedBlock + 1;

      await this.indexFactoryEvents(fromBlock, targetBlock);
      await this.indexMarketEvents(fromBlock, targetBlock);
      await this.setCursor(targetBlock);
    } catch (error) {
      this.logger.error("Indexer sync failed", error instanceof Error ? error.stack : undefined);
    } finally {
      this.isSyncing = false;
    }
  }

  private async indexFactoryEvents(fromBlock: number, toBlock: number) {
    if (!this.chainService.factoryAddress) {
      return;
    }

    await this.forEachLogBatch(
      {
        address: this.chainService.factoryAddress,
      },
      fromBlock,
      toBlock,
      async (logs) => {
        const writes = logs
          .map((log) => ({ log, parsed: this.tryParseFactoryLog(log) }))
          .filter((row) => row.parsed?.name === "MarketCreated")
          .map(({ log, parsed }) => {
            const marketId = String(parsed!.args.marketId);
            const marketAddress = String(parsed!.args.market).toLowerCase();
            const closeTime = Number(parsed!.args.closeTime);
            const txHash = log.transactionHash.toLowerCase();

            return this.prismaService.db.indexedMarket.upsert({
              where: { marketId },
              update: {
                marketAddress,
                closeTime: BigInt(closeTime),
                status: "OPEN",
                createTxHash: txHash,
                createBlock: BigInt(log.blockNumber),
              },
              create: {
                marketId,
                question: null,
                marketAddress,
                closeTime: BigInt(closeTime),
                status: "OPEN",
                createTxHash: txHash,
                createBlock: BigInt(log.blockNumber),
              },
            });
          });

        if (writes.length) {
          await this.prismaService.db.$transaction(writes);
        }
      },
    );
  }

  private async indexMarketEvents(fromBlock: number, toBlock: number) {
    const markets = await this.prismaService.db.indexedMarket.findMany({
      select: { marketAddress: true },
    });

    const addresses = markets.map((row) => row.marketAddress);

    if (addresses.length === 0) {
      return;
    }

    await this.forEachLogBatch(
      {
        address: addresses,
      },
      fromBlock,
      toBlock,
      async (logs) => {
        const writes: Prisma.PrismaPromise<unknown>[] = [];

        for (const log of logs) {
          const parsed = this.tryParseMarketLog(log);
          if (!parsed) {
            continue;
          }

          const marketAddress = log.address.toLowerCase();

          if (parsed.name === "Traded") {
            const side = parsed.args.isYes ? "YES" : "NO";
            const action = parsed.args.isBuy ? "BUY" : "SELL";
            const txHash = log.transactionHash.toLowerCase();

            writes.push(
              this.prismaService.db.indexedTrade.upsert({
                where: {
                  txHash_logIndex: {
                    txHash,
                    logIndex: log.index,
                  },
                },
                update: {},
                create: {
                  marketAddress,
                  walletAddress: String(parsed.args.user).toLowerCase(),
                  action,
                  side,
                  amount: String(parsed.args.amount),
                  txHash,
                  logIndex: log.index,
                  blockNumber: BigInt(log.blockNumber),
                },
              }),
            );
          }

          if (parsed.name === "MarketClosed") {
            writes.push(
              this.prismaService.db.indexedMarket.updateMany({
                where: { marketAddress },
                data: { status: "CLOSED" },
              }),
            );
          }

          if (parsed.name === "MarketResolved") {
            writes.push(
              this.prismaService.db.indexedMarket.updateMany({
                where: { marketAddress },
                data: {
                  status: "RESOLVED",
                  resolvedOutcome: Number(parsed.args.outcome),
                },
              }),
            );
          }

          if (parsed.name === "MarketCancelled") {
            writes.push(
              this.prismaService.db.indexedMarket.updateMany({
                where: { marketAddress },
                data: { status: "CANCELLED" },
              }),
            );
          }

          if (parsed.name === "Claimed") {
            const txHash = log.transactionHash.toLowerCase();
            writes.push(
              this.prismaService.db.indexedClaim.upsert({
                where: {
                  txHash_logIndex: {
                    txHash,
                    logIndex: log.index,
                  },
                },
                update: {},
                create: {
                  marketAddress,
                  walletAddress: String(parsed.args.user).toLowerCase(),
                  payout: String(parsed.args.payout),
                  txHash,
                  logIndex: log.index,
                  blockNumber: BigInt(log.blockNumber),
                },
              }),
            );
          }
        }

        if (writes.length) {
          await this.prismaService.db.$transaction(writes);
        }
      },
    );
  }

  private tryParseFactoryLog(log: Log) {
    try {
      return this.factoryInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private tryParseMarketLog(log: Log) {
    try {
      return this.marketInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private async ensureCursor() {
    const confirmations = this.configService.get<number>("indexerConfirmations") || 0;
    const configuredStartBlock = this.configService.get<number>("indexerStartBlock") || -1;
    const latestBlock = await this.chainService.provider.getBlockNumber();
    const safeLatest = Math.max(0, latestBlock - confirmations);
    const initialBlock = configuredStartBlock >= 0 ? configuredStartBlock : safeLatest;

    await this.prismaService.db.indexerCursor.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        lastBlock: BigInt(initialBlock),
      },
    });
  }

  private async getCursor(): Promise<number> {
    const cursor = await this.prismaService.db.indexerCursor.findUnique({
      where: { id: "default" },
    });

    return cursor ? Number(cursor.lastBlock) : 0;
  }

  private async setCursor(block: number) {
    await this.prismaService.db.indexerCursor.upsert({
      where: { id: "default" },
      update: { lastBlock: BigInt(block) },
      create: {
        id: "default",
        lastBlock: BigInt(block),
      },
    });
  }

  private async forEachLogBatch(
    filter: { address: string | string[] },
    fromBlock: number,
    toBlock: number,
    handler: (logs: Log[]) => Promise<void>,
  ) {
    const rangeSize = Math.max(50, this.configService.get<number>("indexerBlockRange") || 1000);

    for (let start = fromBlock; start <= toBlock; start += rangeSize) {
      const end = Math.min(toBlock, start + rangeSize - 1);
      const logs = await this.chainService.provider.getLogs({
        address: filter.address,
        fromBlock: start,
        toBlock: end,
      });

      if (logs.length) {
        await handler(logs);
      }
    }
  }
}
