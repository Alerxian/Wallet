import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Contract, Interface, InterfaceAbi, JsonRpcProvider, Log, Wallet } from "ethers";
const predictionMarketFactoryAbi = require("./abi/PredictionMarketFactory.json") as InterfaceAbi;
const predictionMarketAbi = require("./abi/PredictionMarket.json") as InterfaceAbi;

export enum MarketStatusValue {
  Open = 0,
  Closed = 1,
  Resolved = 2,
  Cancelled = 3,
}

export type MarketSnapshot = {
  status: number;
  closeTime: number;
  yesPool: string;
  noPool: string;
};

export type UserShareSnapshot = {
  yesShares: string;
  noShares: string;
};

@Injectable()
export class ChainService {
  readonly provider: JsonRpcProvider;
  readonly chainId: number;
  readonly factoryAddress: string;
  readonly creatorPrivateKey: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = new JsonRpcProvider(this.configService.get<string>("rpcUrl"));
    this.chainId = this.configService.get<number>("chainId") || 31337;
    this.factoryAddress = this.configService.get<string>("factoryAddress") || "";
    this.creatorPrivateKey = this.configService.get<string>("creatorPrivateKey") || "";
  }

  getNetwork() {
    return {
      chainId: this.chainId,
      rpcUrl: this.configService.get<string>("rpcUrl"),
      factoryAddress: this.factoryAddress,
    };
  }

  async createMarket(closeTime: number) {
    if (!this.factoryAddress) {
      throw new BadRequestException("FACTORY_ADDRESS is not configured");
    }

    if (!this.creatorPrivateKey) {
      throw new BadRequestException("CREATOR_PRIVATE_KEY is not configured");
    }

    const signer = new Wallet(this.creatorPrivateKey, this.provider);
    const factory = new Contract(this.factoryAddress, predictionMarketFactoryAbi, signer);
    const factoryInterface = new Interface(predictionMarketFactoryAbi);

    const tx = await factory.createMarket(closeTime);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new InternalServerErrorException("Market creation tx receipt missing");
    }

    let createdLog: ReturnType<Interface["parseLog"]> | null = null;

    for (const log of receipt.logs as Log[]) {
      try {
        const parsed = factoryInterface.parseLog(log);
        if (!parsed) {
          continue;
        }
        if (parsed.name === "MarketCreated") {
          createdLog = parsed;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!createdLog) {
      throw new InternalServerErrorException("MarketCreated event missing from tx receipt");
    }

    const marketId = String(createdLog.args.marketId);
    const marketAddress = String(createdLog.args.market);

    return {
      marketId,
      marketAddress,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  async getMarketSnapshot(marketAddress: string): Promise<MarketSnapshot> {
    const market = new Contract(marketAddress, predictionMarketAbi, this.provider);

    const [statusRaw, closeTimeRaw, yesPoolRaw, noPoolRaw] = await Promise.all([
      market.status(),
      market.closeTime(),
      market.yesPool(),
      market.noPool(),
    ]);

    return {
      status: Number(statusRaw),
      closeTime: Number(closeTimeRaw),
      yesPool: yesPoolRaw.toString(),
      noPool: noPoolRaw.toString(),
    };
  }

  async getUserShares(marketAddress: string, walletAddress: string): Promise<UserShareSnapshot> {
    const market = new Contract(marketAddress, predictionMarketAbi, this.provider);

    const [yesSharesRaw, noSharesRaw] = await Promise.all([
      market.yesShares(walletAddress),
      market.noShares(walletAddress),
    ]);

    return {
      yesShares: yesSharesRaw.toString(),
      noShares: noSharesRaw.toString(),
    };
  }

  async getCollateralTokenAddress(): Promise<string> {
    if (!this.factoryAddress) {
      throw new BadRequestException("FACTORY_ADDRESS is not configured");
    }

    const factory = new Contract(this.factoryAddress, predictionMarketFactoryAbi, this.provider);
    const token = await factory.collateralToken();
    return String(token).toLowerCase();
  }

  async getLatestBlockTimestamp(): Promise<number> {
    const block = await this.provider.getBlock("latest");

    if (!block) {
      throw new InternalServerErrorException("Latest block not found");
    }

    return block.timestamp;
  }
}
