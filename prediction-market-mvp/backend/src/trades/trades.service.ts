import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { Interface, InterfaceAbi, isAddress, parseUnits } from "ethers";
const predictionMarketAbi = require("../chain/abi/PredictionMarket.json") as InterfaceAbi;
const erc20Abi = ["function approve(address spender, uint256 amount)"];
import { ChainService, MarketStatusValue } from "../chain/chain.service";
import { MarketsService } from "../markets/markets.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApproveIntentDto } from "./dto/create-approve-intent.dto";
import { CreateTradeIntentDto, TradeAction, TradeSide } from "./dto/create-trade-intent.dto";
import { ListTradeHistoryDto } from "./dto/list-trade-history.dto";

type TradeState = "PENDING" | "CONFIRMED" | "INDEXED" | "FAILED";

@Injectable()
export class TradesService {
  private readonly marketInterface = new Interface(predictionMarketAbi);
  private readonly erc20Interface = new Interface(erc20Abi);

  constructor(
    private readonly marketsService: MarketsService,
    private readonly chainService: ChainService,
    private readonly prismaService: PrismaService,
  ) {}

  async createIntent(dto: CreateTradeIntentDto) {
    this.ensureDatabase();
    const market = await this.marketsService.getById(dto.marketId);

    if (!market.marketAddress) {
      throw new BadRequestException("Market address not attached yet");
    }

    const [snapshot, latestTimestamp] = await Promise.all([
      this.chainService.getMarketSnapshot(market.marketAddress),
      this.chainService.getLatestBlockTimestamp(),
    ]);

    if (snapshot.status !== MarketStatusValue.Open) {
      throw new BadRequestException("Market is not open for trading");
    }

    if (latestTimestamp >= snapshot.closeTime) {
      throw new BadRequestException("Market is closed by time");
    }

    const amount = this.parseAmount(dto.amount);

    if (amount <= 0n) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    if (dto.action === TradeAction.SELL) {
      const shares = await this.chainService.getUserShares(market.marketAddress, dto.walletAddress);
      const available = dto.side === TradeSide.YES ? BigInt(shares.yesShares) : BigInt(shares.noShares);

      if (available < amount) {
        throw new BadRequestException("Insufficient shares to sell");
      }
    }

    const functionName = this.getTradeFunctionName(dto.action, dto.side);
    const data = this.marketInterface.encodeFunctionData(functionName, [amount]);

    return {
      marketId: dto.marketId,
      marketAddress: market.marketAddress,
      walletAddress: dto.walletAddress.toLowerCase(),
      amount: amount.toString(),
      action: dto.action,
      side: dto.side,
      tx: {
        to: market.marketAddress,
        data,
        value: "0",
      },
      note:
        dto.action === TradeAction.BUY
          ? "User must approve USDC allowance before sending buy transaction"
          : "Sell transaction does not require ERC20 approval",
    };
  }

  async createApproveIntent(dto: CreateApproveIntentDto) {
    this.ensureDatabase();
    const market = await this.marketsService.getById(dto.marketId);

    if (!market.marketAddress || !isAddress(market.marketAddress)) {
      throw new BadRequestException("Market address not available for approval");
    }

    const collateralTokenAddress = await this.chainService.getCollateralTokenAddress();
    const amount = this.parseAmount(dto.amount);

    if (amount <= 0n) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    const data = this.erc20Interface.encodeFunctionData("approve", [market.marketAddress, amount]);

    return {
      marketId: dto.marketId,
      walletAddress: dto.walletAddress.toLowerCase(),
      amount: amount.toString(),
      collateralTokenAddress,
      tx: {
        to: collateralTokenAddress,
        data,
        value: "0",
      },
      note: "Send this approval transaction before BUY action",
    };
  }

  async listHistory(query: ListTradeHistoryDto) {
    this.ensureDatabase();
    const walletAddress = query.walletAddress.toLowerCase();
    const limit = query.limit || 30;

    const rows = await this.prismaService.db.indexedTrade.findMany({
      where: {
        walletAddress,
        market: query.marketId ? { marketId: query.marketId } : undefined,
      },
      include: {
        market: {
          select: {
            marketId: true,
            question: true,
          },
        },
      },
      orderBy: [{ blockNumber: "desc" }, { id: "desc" }],
      take: limit,
    });

    return rows.map((row) => ({
      txHash: row.txHash,
      marketId: row.market.marketId,
      marketQuestion: row.market.question || "",
      marketAddress: row.marketAddress,
      walletAddress: row.walletAddress,
      action: row.action,
      side: row.side,
      amount: row.amount,
      blockNumber: Number(row.blockNumber),
      state: "INDEXED" as TradeState,
      timestampHint: Number(row.blockNumber),
    }));
  }

  async listPositions(walletAddressInput: string) {
    this.ensureDatabase();
    const walletAddress = walletAddressInput.toLowerCase();

    const touchedMarkets = await this.prismaService.db.indexedTrade.findMany({
      where: { walletAddress },
      distinct: ["marketAddress"],
      select: { marketAddress: true },
    });

    if (!touchedMarkets.length) {
      return [];
    }

    const touchedAddresses = touchedMarkets.map((row) => row.marketAddress);

    const markets = await this.prismaService.db.indexedMarket.findMany({
      where: {
        marketAddress: {
          in: touchedAddresses,
        },
      },
      orderBy: [{ createBlock: "desc" }, { marketId: "desc" }],
      select: {
        marketId: true,
        question: true,
        closeTime: true,
        status: true,
        marketAddress: true,
      },
    });

    const chunkSize = 8;
    const results: Array<
      | {
          marketId: string;
          marketAddress: string;
          question: string;
          status: string;
          closeTime: number;
          yesShares: string;
          noShares: string;
          yesPool: string;
          noPool: string;
        }
      | null
    > = [];

    for (let i = 0; i < markets.length; i += chunkSize) {
      const chunk = markets.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (market) => {
          let shares: { yesShares: string; noShares: string };
          let snapshot: { yesPool: string; noPool: string };

        try {
          [shares, snapshot] = await Promise.all([
            this.chainService.getUserShares(market.marketAddress, walletAddress),
            this.chainService.getMarketSnapshot(market.marketAddress),
          ]);
        } catch {
          return null;
        }

        const yesShares = shares.yesShares;
        const noShares = shares.noShares;
        const hasPosition = yesShares !== "0" || noShares !== "0";

        if (!hasPosition) {
          return null;
        }

        return {
          marketId: market.marketId,
          marketAddress: market.marketAddress,
          question: market.question || "",
          status: market.status,
          closeTime: Number(market.closeTime),
          yesShares,
          noShares,
          yesPool: snapshot.yesPool,
          noPool: snapshot.noPool,
        };
        }),
      );

      results.push(...chunkResults);
    }

    return results.filter(Boolean);
  }

  async getTradeStatus(txHash: string) {
    this.ensureDatabase();
    const normalized = txHash.toLowerCase();
    const txCandidates = Array.from(new Set([txHash, normalized]));

    const [indexedTrade, indexedClaim, receipt] = await Promise.all([
      this.prismaService.db.indexedTrade.findFirst({ where: { txHash: { in: txCandidates } } }),
      this.prismaService.db.indexedClaim.findFirst({ where: { txHash: { in: txCandidates } } }),
      this.chainService.provider.getTransactionReceipt(normalized),
    ]);

    if (indexedTrade || indexedClaim) {
      return {
        txHash: normalized,
        state: "INDEXED" as TradeState,
        includedBlock: indexedTrade ? Number(indexedTrade.blockNumber) : Number(indexedClaim?.blockNumber || 0),
      };
    }

    if (!receipt) {
      return {
        txHash: normalized,
        state: "PENDING" as TradeState,
      };
    }

    const latestBlock = await this.chainService.provider.getBlockNumber();

    if (receipt.status === 0) {
      return {
        txHash: normalized,
        state: "FAILED" as TradeState,
        includedBlock: receipt.blockNumber,
        confirmations: Math.max(0, latestBlock - receipt.blockNumber),
      };
    }

    return {
      txHash: normalized,
      state: "CONFIRMED" as TradeState,
      includedBlock: receipt.blockNumber,
      confirmations: Math.max(0, latestBlock - receipt.blockNumber),
    };
  }

  private getTradeFunctionName(action: TradeAction, side: TradeSide) {
    if (action === TradeAction.BUY && side === TradeSide.YES) return "buyYes";
    if (action === TradeAction.BUY && side === TradeSide.NO) return "buyNo";
    if (action === TradeAction.SELL && side === TradeSide.YES) return "sellYes";
    return "sellNo";
  }

  private parseAmount(value: string) {
    try {
      return parseUnits(value, 6);
    } catch {
      throw new BadRequestException("Invalid amount format for USDC decimals");
    }
  }

  private ensureDatabase() {
    if (!this.prismaService.isEnabled) {
      throw new ServiceUnavailableException("DATABASE_URL is required for trade APIs");
    }
  }
}
