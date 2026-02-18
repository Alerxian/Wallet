import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException } from "@nestjs/common";
import { IsNotEmpty, IsString } from "class-validator";
import { AuthService } from "./auth.service";
import { SiweVerifyDto } from "./dto/siwe-verify.dto";

class NonceQuery {
  @IsString()
  @IsNotEmpty()
  address!: string;
}

@Controller("auth/siwe")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("nonce")
  async getNonce(@Query() query: NonceQuery) {
    return this.authService.createNonce(query.address);
  }

  @Post("verify")
  async verify(@Body() dto: SiweVerifyDto) {
    return this.authService.verify(dto);
  }

  @Get("session")
  async getSession(@Headers("authorization") authorization?: string) {
    const token = this.parseBearerToken(authorization);
    return this.authService.validateSession(token);
  }

  @Post("logout")
  async logout(@Headers("authorization") authorization?: string) {
    const token = this.parseBearerToken(authorization);
    await this.authService.revokeSession(token);
    return {
      ok: true,
    };
  }

  private parseBearerToken(authorization?: string) {
    const header = authorization || "";

    if (!header.toLowerCase().startsWith("bearer ")) {
      throw new UnauthorizedException("Bearer token required");
    }

    const token = header.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException("Invalid bearer token");
    }

    return token;
  }
}
