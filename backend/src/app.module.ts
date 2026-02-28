import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GamesModule } from './modules/games/games.module';
import { GroupsModule } from './modules/groups/groups.module';
import { HealthController } from './common/health/health.controller';

@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // 限流模块
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => [
                {
                    ttl: (config.get<number>('THROTTLE_TTL') ?? 60) * 1000,
                    limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
                },
            ],
        }),

        // 日志模块
        WinstonModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const winston = require('winston');
                return {
                    level: config.get<string>('LOG_LEVEL', 'info') || 'info',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    ),
                    transports: [
                        new winston.transports.Console({
                            format: winston.format.combine(
                                winston.format.colorize(),
                                winston.format.simple()
                            ),
                        }),
                    ],
                };
            },
        }),

        // Prisma数据库模块
        PrismaModule,

        // 功能模块
        AuthModule,
        UsersModule,
        GamesModule,
        GroupsModule,
    ],
    controllers: [HealthController],
    providers: [],
})
export class AppModule { }
