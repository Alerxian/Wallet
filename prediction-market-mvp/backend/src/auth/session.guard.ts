import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";

type SessionRequest = Request & {
  sessionAddress?: string;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const authHeader = request.header("authorization") || "";

    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      throw new UnauthorizedException("Bearer token required");
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException("Invalid bearer token");
    }

    const session = await this.authService.validateSession(token);
    request.sessionAddress = session.address;
    return true;
  }
}
