import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private readonly maxRetries = 5;
    private readonly retryDelay = 5000; // 5秒

    async onModuleInit() {
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                await this.$connect();
                this.logger.log('Database connected successfully');
                return;
            } catch (error) {
                retries++;
                this.logger.warn(
                    `Failed to connect to database (attempt ${retries}/${this.maxRetries}). Retrying in ${this.retryDelay / 1000}s...`,
                );
                if (retries >= this.maxRetries) {
                    this.logger.error('Failed to connect to database after maximum retries', error);
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }
}
