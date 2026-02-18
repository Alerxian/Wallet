import { IsNotEmpty, IsString, Matches } from "class-validator";

const amountRegex = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

export class CreateApproveIntentDto {
  @IsString()
  @IsNotEmpty()
  marketId!: string;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  walletAddress!: string;

  @IsString()
  @Matches(amountRegex, { message: "amount must be a positive decimal with up to 6 decimals" })
  amount!: string;
}
