import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    @Get()
    async findAll() {
        return this.gamesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.gamesService.findOne(id);
    }

    @Get(':gameId/levels')
    async getLevels(@Param('gameId') gameId: string) {
        return this.gamesService.getLevels(gameId);
    }

    @Get(':gameId/levels/:levelId')
    async getLevel(
        @Param('gameId') gameId: string,
        @Param('levelId') levelId: string
    ) {
        return this.gamesService.getLevel(gameId, levelId);
    }

    @Post('records')
    async createRecord(@Request() req, @Body() recordData: any) {
        return this.gamesService.createRecord(req.user.id, recordData);
    }

    @Get('records/me')
    async getRecords(
        @Request() req,
        @Query('gameId') gameId?: string,
        @Query('childId') childId?: string
    ) {
        const filters = {};
        if (gameId) filters['gameId'] = gameId;
        if (childId) filters['childId'] = childId;
        return this.gamesService.getRecords(req.user.id, filters);
    }

    @Get('stats/me')
    async getStats(@Request() req) {
        return this.gamesService.getStats(req.user.id);
    }
}
