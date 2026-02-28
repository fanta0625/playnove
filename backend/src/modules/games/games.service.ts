import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GamesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.game.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { levels: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const game = await this.prisma.game.findUnique({
            where: { id },
            include: {
                levels: {
                    where: { isActive: true },
                    orderBy: { levelNumber: 'asc' },
                },
            },
        });

        if (!game) {
            throw new Error('Game not found');
        }

        return game;
    }

    async getLevels(gameId: string) {
        return this.prisma.level.findMany({
            where: { gameId, isActive: true },
            orderBy: { levelNumber: 'asc' },
            include: {
                _count: {
                    select: { questions: true },
                },
            },
        });
    }

    async getLevel(gameId: string, levelId: string) {
        const level = await this.prisma.level.findFirst({
            where: { id: levelId, gameId },
            include: {
                questions: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!level) {
            throw new Error('Level not found');
        }

        return level;
    }

    async createRecord(userId: string, recordData: any) {
        return this.prisma.playRecord.create({
            data: {
                userId,
                ...recordData,
            },
        });
    }

    async getRecords(userId: string, filters?: any) {
        const where: any = { userId };

        if (filters?.gameId) {
            where.gameId = filters.gameId;
        }

        if (filters?.childId) {
            where.childId = filters.childId;
        }

        return this.prisma.playRecord.findMany({
            where,
            include: {
                game: true,
                level: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async getStats(userId: string) {
        const records = await this.prisma.playRecord.groupBy({
            by: ['gameId'],
            where: { userId },
            _count: { id: true },
            _avg: { score: true },
            _max: { score: true },
        });

        const totalPlayTime = await this.prisma.playRecord.aggregate({
            where: { userId },
            _sum: { duration: true },
        });

        return {
            totalGames: records.length,
            totalPlays: records.reduce((sum, r) => sum + r._count.id, 0),
            totalPlayTime: totalPlayTime._sum.duration || 0,
            byGame: records,
        };
    }
}
