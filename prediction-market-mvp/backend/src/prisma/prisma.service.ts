import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: PrismaClient;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>("databaseUrl") || "";
    this.enabled = databaseUrl.length > 0;
    this.client = new PrismaClient();
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn("DATABASE_URL missing, Prisma disabled");
      return;
    }

    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get db(): PrismaClient {
    return this.client;
  }

  get isEnabled() {
    return this.enabled;
  }
}
