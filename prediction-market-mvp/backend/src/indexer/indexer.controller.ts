import { Controller, Get } from "@nestjs/common";
import { IndexerService } from "./indexer.service";

@Controller("indexer")
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Get("markets")
  listIndexedMarkets() {
    return this.indexerService.listIndexedMarkets();
  }
}
