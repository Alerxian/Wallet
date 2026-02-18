import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "crypto";
import { getAddress, verifyMessage } from "ethers";
import { PrismaService } from "../prisma/prisma.service";
import { SiweVerifyDto } from "./dto/siwe-verify.dto";

type ParsedSiwe = {
  domain: string;
  address: string;
  uri: string;
  chainId: number;
  nonce: string;
  issuedAt: Date;
  expirationTime: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async createNonce(address: string) {
    this.ensureDatabase();
    const normalized = this.normalizeAddress(address);
    const ttlMs = 5 * 60 * 1000;
    const nonce = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + ttlMs);
    const chainId = this.configService.get<number>("chainId") || 31337;
    const uri = this.configService.get<string>("siweUri") || "http://127.0.0.1:3001";
    const domain = this.getExpectedDomain(uri);

    await this.prismaService.db.authNonce.create({
      data: {
        address: normalized,
        nonce,
        chainId,
        domain,
        uri,
        expiresAt,
      },
    });

    await this.prismaService.db.authNonce.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return { nonce, expiresAt: expiresAt.getTime() };
  }

  async verify(dto: SiweVerifyDto) {
    this.ensureDatabase();
    const parsed = this.parseSiweMessage(dto.message);

    const recovered = this.normalizeAddress(verifyMessage(dto.message, dto.signature));
    const declaredAddress = this.normalizeAddress(parsed.address);

    if (recovered !== declaredAddress) {
      throw new UnauthorizedException("SIWE signature address mismatch");
    }

    const expectedUri = this.configService.get<string>("siweUri") || "http://127.0.0.1:3001";
    const expectedDomain = this.getExpectedDomain(expectedUri);
    const expectedChainId = this.configService.get<number>("chainId") || 31337;

    if (parsed.domain.toLowerCase() !== expectedDomain) {
      throw new UnauthorizedException("SIWE domain mismatch");
    }

    if (this.normalizeUri(parsed.uri) !== this.normalizeUri(expectedUri)) {
      throw new UnauthorizedException("SIWE URI mismatch");
    }

    if (parsed.chainId !== expectedChainId) {
      throw new UnauthorizedException("SIWE chain ID mismatch");
    }

    const nowMs = Date.now();
    const issuedAtMs = parsed.issuedAt.getTime();
    const expirationMs = parsed.expirationTime.getTime();
    const maxIssuedAtWindowMs = (this.configService.get<number>("siweIssuedAtWindowSeconds") || 300) * 1000;

    if (!Number.isFinite(issuedAtMs) || Math.abs(nowMs - issuedAtMs) > maxIssuedAtWindowMs) {
      throw new UnauthorizedException("SIWE issuedAt outside accepted time window");
    }

    if (!Number.isFinite(expirationMs) || expirationMs <= nowMs) {
      throw new UnauthorizedException("SIWE message expired");
    }

    const nonceRecord = await this.prismaService.db.authNonce.findFirst({
      where: {
        nonce: parsed.nonce,
        address: declaredAddress,
        consumedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!nonceRecord) {
      throw new UnauthorizedException("Nonce not found for address");
    }

    if (nonceRecord.expiresAt.getTime() < nowMs) {
      throw new UnauthorizedException("Nonce expired");
    }

    if (
      nonceRecord.domain.toLowerCase() !== expectedDomain ||
      this.normalizeUri(nonceRecord.uri) !== this.normalizeUri(expectedUri) ||
      nonceRecord.chainId !== expectedChainId
    ) {
      throw new UnauthorizedException("Nonce context mismatch");
    }

    const ttlMs = (this.configService.get<number>("siweSessionTtlSeconds") || 3600) * 1000;
    const maxSessionExpiryMs = nowMs + ttlMs;
    const sessionExpiresAt = new Date(Math.min(expirationMs, maxSessionExpiryMs));

    const token = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);

    await this.prismaService.db.$transaction([
      this.prismaService.db.authNonce.update({
        where: { id: nonceRecord.id },
        data: { consumedAt: new Date(nowMs) },
      }),
      this.prismaService.db.authSession.create({
        data: {
          tokenHash,
          address: declaredAddress,
          chainId: parsed.chainId,
          domain: parsed.domain,
          uri: parsed.uri,
          issuedAt: parsed.issuedAt,
          expiresAt: sessionExpiresAt,
        },
      }),
    ]);

    const expiresIn = Math.max(0, Math.floor((sessionExpiresAt.getTime() - nowMs) / 1000));

    return {
      address: declaredAddress,
      session: {
        token,
        expiresIn,
        expiresAt: sessionExpiresAt.getTime(),
      },
    };
  }

  async validateSession(token: string) {
    this.ensureDatabase();
    const tokenHash = this.hashToken(token);
    const now = Date.now();
    const session = await this.prismaService.db.authSession.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException("Session not found");
    }

    if (session.expiresAt.getTime() <= now) {
      await this.prismaService.db.authSession.update({
        where: { tokenHash },
        data: { revokedAt: new Date(now) },
      });
      throw new UnauthorizedException("Session expired");
    }

    return {
      token,
      address: session.address,
      expiresAt: session.expiresAt.getTime(),
    };
  }

  async revokeSession(token: string) {
    this.ensureDatabase();
    await this.prismaService.db.authSession.updateMany({
      where: { tokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private normalizeAddress(address: string) {
    if (!address) {
      throw new BadRequestException("Invalid wallet address");
    }

    try {
      return getAddress(address).toLowerCase();
    } catch {
      throw new BadRequestException("Invalid wallet address");
    }
  }

  private ensureDatabase() {
    if (!this.prismaService.isEnabled) {
      throw new ServiceUnavailableException("DATABASE_URL is required for SIWE auth");
    }
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private parseSiweMessage(message: string): ParsedSiwe {
    const lines = message.split("\n");
    const domainSuffix = " wants you to sign in with your Ethereum account:";
    const firstLine = lines[0] || "";

    if (!firstLine.endsWith(domainSuffix)) {
      throw new UnauthorizedException("SIWE domain line missing");
    }

    const domain = firstLine.slice(0, firstLine.length - domainSuffix.length).trim();
    const address = (lines[1] || "").trim();

    if (!domain || !address) {
      throw new UnauthorizedException("SIWE domain/address missing");
    }

    const version = this.extractField(lines, "Version");
    if (version !== "1") {
      throw new UnauthorizedException("Unsupported SIWE version");
    }

    const uri = this.extractField(lines, "URI");
    const chainIdValue = Number(this.extractField(lines, "Chain ID"));
    const nonce = this.extractField(lines, "Nonce");
    const issuedAt = new Date(this.extractField(lines, "Issued At"));
    const expirationTime = new Date(this.extractField(lines, "Expiration Time"));

    if (!Number.isInteger(chainIdValue) || chainIdValue <= 0) {
      throw new UnauthorizedException("Invalid SIWE chain ID");
    }

    if (!/^[a-f0-9]{32}$/i.test(nonce)) {
      throw new UnauthorizedException("SIWE nonce invalid");
    }

    return {
      domain,
      address,
      uri,
      chainId: chainIdValue,
      nonce,
      issuedAt,
      expirationTime,
    };
  }

  private extractField(lines: string[], key: string) {
    const prefix = `${key}:`;
    const line = lines.find((value) => value.startsWith(prefix));
    const fieldValue = line?.slice(prefix.length).trim();

    if (!fieldValue) {
      throw new UnauthorizedException(`SIWE ${key} missing`);
    }

    return fieldValue;
  }

  private getExpectedDomain(uri: string) {
    const configuredDomain = (this.configService.get<string>("siweDomain") || "").trim();
    if (configuredDomain) {
      return configuredDomain.toLowerCase();
    }

    try {
      return new URL(uri).host.toLowerCase();
    } catch {
      throw new BadRequestException("Invalid SIWE_URI configuration");
    }
  }

  private normalizeUri(value: string) {
    return value.trim().replace(/\/+$/, "");
  }
}
