import { IsString, Matches } from "class-validator";

export class GetTradeStatusDto {
  @IsString()
  @Matches(/^0x([A-Fa-f0-9]{64})$/)
  txHash!: string;
}
