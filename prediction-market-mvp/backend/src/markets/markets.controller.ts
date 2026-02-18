import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { SessionGuard } from "../auth/session.guard";
import { AttachMarketAddressDto } from "./dto/attach-market-address.dto";
import { CreateMarketDto } from "./dto/create-market.dto";
import { MarketsService } from "./markets.service";

@Controller("markets")
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  async list() {
    return this.marketsService.list();
  }

  @Get(":id")
  async byId(@Param("id") id: string) {
    return this.marketsService.getById(id);
  }

  @Post()
  @UseGuards(SessionGuard, AdminGuard)
  async create(@Body() dto: CreateMarketDto) {
    return this.marketsService.create(dto);
  }

  @Post(":id/address")
  @UseGuards(SessionGuard, AdminGuard)
  async attachAddress(@Param("id") id: string, @Body() dto: AttachMarketAddressDto) {
    return this.marketsService.attachAddress(id, dto.marketAddress);
  }
}
