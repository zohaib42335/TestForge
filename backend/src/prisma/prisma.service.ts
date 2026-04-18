import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxConnectionRetries = 5;
  private readonly retryDelayMs = 1500;

  async onModuleInit(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxConnectionRetries; attempt += 1) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        if (attempt === this.maxConnectionRetries) {
          throw error;
        }

        const waitMs = this.retryDelayMs * attempt;
        this.logger.warn(
          `Prisma connection attempt ${attempt}/${this.maxConnectionRetries} failed. Retrying in ${waitMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
