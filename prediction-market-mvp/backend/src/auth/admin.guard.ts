import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getAddress } from "ethers";
import { Request } from "express";

type SessionRequest = Request & {
  sessionAddress?: string;
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const sessionAddress = this.normalizeAddress(request.sessionAddress || "");
    const configured = this.configService.get<string>("adminAddresses") || "";
    const allowed = configured
      .split(",")
      .map((value) => this.normalizeAddress(value))
      .filter(Boolean);

    if (!allowed.length) {
      throw new ForbiddenException("ADMIN_ADDRESSES is not configured");
    }

    if (!sessionAddress || !allowed.includes(sessionAddress)) {
      throw new ForbiddenException("Admin role required");
    }

    return true;
  }

  private normalizeAddress(value: string) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "";
    }

    try {
      return getAddress(trimmed).toLowerCase();
    } catch {
      return "";
    }
  }
}
