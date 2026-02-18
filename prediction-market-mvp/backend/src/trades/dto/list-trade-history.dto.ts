import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class ListTradeHistoryDto {
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  walletAddress!: string;

  @IsOptional()
  @IsString()
  marketId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  @Max(100)
  limit?: number;
}
