import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateMarketDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsInt()
  @Min(1)
  closeTime!: number;
}
