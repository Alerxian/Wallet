import { Module } from "@nestjs/common";
import { ChainModule } from "../chain/chain.module";
import { IndexerController } from "./indexer.controller";
import { IndexerService } from "./indexer.service";

@Module({
  imports: [ChainModule],
  controllers: [IndexerController],
  providers: [IndexerService],
})
export class IndexerModule {}
