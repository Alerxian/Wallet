import { Controller, Get } from "@nestjs/common";
import { ChainService } from "./chain.service";

@Controller("chain")
export class ChainController {
  constructor(private readonly chainService: ChainService) {}

  @Get("config")
  getConfig() {
    return this.chainService.getNetwork();
  }
}
