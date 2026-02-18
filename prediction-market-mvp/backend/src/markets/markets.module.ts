import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ChainModule } from "../chain/chain.module";
import { MarketsController } from "./markets.controller";
import { MarketsService } from "./markets.service";

@Module({
  imports: [ChainModule, AuthModule],
  controllers: [MarketsController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}
