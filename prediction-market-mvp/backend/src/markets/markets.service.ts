import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ChainService } from "../chain/chain.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMarketDto } from "./dto/create-market.dto";

type MarketView = {
  id: string;
  question: string;
  closeTime: number;
  status: "OPEN" | "CLOSED" | "RESOLVED" | "CANCELLED";
  marketAddress: string;
  createTxHash: string;
  yesPool?: string;
  noPool?: string;
};

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);

  constructor(
    private readonly chainService: ChainService,
    private readonly prismaService: PrismaService,
  ) {}

  async list() {
    this.ensureDatabase();
    const rows = await this.prismaService.db.indexedMarket.findMany({
      orderBy: [{ createBlock: "desc" }, { marketId: "desc" }],
    });

    return rows.map((row) => this.toView(row));
  }

  async getById(id: string) {
    this.ensureDatabase();
    const marketId = String(id || "").trim();
    const market = await this.prismaService.db.indexedMarket.findUnique({
      where: { marketId: marketId },
    });

    if (!market) {
      throw new NotFoundException("Market not found");
    }

    const view = this.toView(market);

    if (!view.marketAddress) {
      return {
        ...view,
        yesPool: "0",
        noPool: "0",
      };
    }

    try {
      const snapshot = await this.chainService.getMarketSnapshot(view.marketAddress);

      return {
        ...view,
        yesPool: snapshot.yesPool,
        noPool: snapshot.noPool,
        closeTime: snapshot.closeTime,
      };
    } catch (error) {
      this.logger.warn(`Market snapshot unavailable for market ${view.id}: ${error instanceof Error ? error.message : "unknown error"}`);
      return {
        ...view,
        yesPool: "0",
        noPool: "0",
      };
    }
  }

  async create(dto: CreateMarketDto) {
    this.ensureDatabase();
    const chainCreated = await this.chainService.createMarket(dto.closeTime);

    const saved = await this.prismaService.db.indexedMarket.upsert({
      where: { marketId: chainCreated.marketId },
      update: {
        question: dto.question,
        closeTime: BigInt(dto.closeTime),
        marketAddress: chainCreated.marketAddress.toLowerCase(),
        status: "OPEN",
        createTxHash: chainCreated.txHash,
        createBlock: BigInt(chainCreated.blockNumber),
      },
      create: {
        marketId: chainCreated.marketId,
        question: dto.question,
        closeTime: BigInt(dto.closeTime),
        marketAddress: chainCreated.marketAddress.toLowerCase(),
        status: "OPEN",
        createTxHash: chainCreated.txHash,
        createBlock: BigInt(chainCreated.blockNumber),
      },
    });

    return this.toView(saved);
  }

  async attachAddress(id: string, marketAddress: string) {
    this.ensureDatabase();
    const existing = await this.prismaService.db.indexedMarket.findUnique({ where: { marketId: id } });

    if (!existing) {
      throw new NotFoundException("Market not found");
    }

    const updated = await this.prismaService.db.indexedMarket.update({
      where: { marketId: id },
      data: { marketAddress: marketAddress.toLowerCase() },
    });

    return this.toView(updated);
  }

  private toView(row: {
    marketId: string;
    question: string | null;
    closeTime: bigint;
    status: string;
    marketAddress: string;
    createTxHash: string | null;
  }): MarketView {
    return {
      id: row.marketId,
      question: row.question || "",
      closeTime: Number(row.closeTime),
      status: (row.status as MarketView["status"]) || "OPEN",
      marketAddress: row.marketAddress,
      createTxHash: row.createTxHash || "",
    };
  }

  private ensureDatabase() {
    if (!this.prismaService.isEnabled) {
      throw new ServiceUnavailableException("DATABASE_URL is required for market APIs");
    }
  }
}
