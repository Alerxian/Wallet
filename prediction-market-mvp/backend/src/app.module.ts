import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { MarketsModule } from "./markets/markets.module";
import { TradesModule } from "./trades/trades.module";
import { ChainModule } from "./chain/chain.module";
import { IndexerModule } from "./indexer/indexer.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    MarketsModule,
    TradesModule,
    ChainModule,
    IndexerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
