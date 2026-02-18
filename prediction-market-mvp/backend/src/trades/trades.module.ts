import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ChainModule } from "../chain/chain.module";
import { MarketsModule } from "../markets/markets.module";
import { TradesController } from "./trades.controller";
import { TradesService } from "./trades.service";

@Module({
  imports: [MarketsModule, ChainModule, AuthModule],
  controllers: [TradesController],
  providers: [TradesService],
})
export class TradesModule {}
