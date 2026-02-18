import { IsEnum, IsNotEmpty, IsString, Matches } from "class-validator";

const amountRegex = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

export enum TradeSide {
  YES = "YES",
  NO = "NO",
}

export enum TradeAction {
  BUY = "BUY",
  SELL = "SELL",
}

export class CreateTradeIntentDto {
  @IsString()
  @IsNotEmpty()
  marketId!: string;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  walletAddress!: string;

  @IsString()
  @Matches(amountRegex, { message: "amount must be a positive decimal with up to 6 decimals" })
  amount!: string;

  @IsEnum(TradeAction)
  action!: TradeAction;

  @IsEnum(TradeSide)
  side!: TradeSide;
}
