import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { SessionGuard } from "../auth/session.guard";
import { CreateApproveIntentDto } from "./dto/create-approve-intent.dto";
import { CreateTradeIntentDto } from "./dto/create-trade-intent.dto";
import { GetTradeStatusDto } from "./dto/get-trade-status.dto";
import { ListPositionsDto } from "./dto/list-positions.dto";
import { ListTradeHistoryDto } from "./dto/list-trade-history.dto";
import { TradesService } from "./trades.service";

type SessionRequest = Request & {
  sessionAddress?: string;
};

@Controller("trades")
@UseGuards(SessionGuard)
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post("intent")
  async createIntent(@Body() dto: CreateTradeIntentDto, @Req() req: SessionRequest) {
    this.assertWalletMatchesSession(dto.walletAddress, req);
    return this.tradesService.createIntent(dto);
  }

  @Post("approve-intent")
  async createApproveIntent(@Body() dto: CreateApproveIntentDto, @Req() req: SessionRequest) {
    this.assertWalletMatchesSession(dto.walletAddress, req);
    return this.tradesService.createApproveIntent(dto);
  }

  @Get("history")
  async listHistory(@Query() query: ListTradeHistoryDto, @Req() req: SessionRequest) {
    this.assertWalletMatchesSession(query.walletAddress, req);
    return this.tradesService.listHistory(query);
  }

  @Get("positions")
  async listPositions(@Query() query: ListPositionsDto, @Req() req: SessionRequest) {
    this.assertWalletMatchesSession(query.walletAddress, req);
    return this.tradesService.listPositions(query.walletAddress);
  }

  @Get("status/:txHash")
  async getTradeStatus(@Param() params: GetTradeStatusDto) {
    return this.tradesService.getTradeStatus(params.txHash);
  }

  private assertWalletMatchesSession(walletAddress: string, req: SessionRequest) {
    const sessionAddress = (req.sessionAddress || "").toLowerCase();
    const normalizedWallet = walletAddress.toLowerCase();

    if (!sessionAddress || normalizedWallet !== sessionAddress) {
      throw new ForbiddenException("Wallet address does not match authenticated session");
    }
  }
}
