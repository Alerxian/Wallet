import { IsNotEmpty, IsString } from "class-validator";

export class SiweVerifyDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  signature!: string;
}
