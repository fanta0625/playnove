import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    async getProfile(@Request() req) {
        return this.usersService.findById(req.user.id, req.user.id);
    }

    @Put('profile')
    async updateProfile(@Request() req, @Body() updateData: any) {
        return this.usersService.update(req.user.id, req.user.id, updateData);
    }

    @Get('children')
    async getChildren(@Request() req) {
        return this.usersService.getChildren(req.user.id);
    }

    @Post('children')
    async addChild(@Request() req, @Body() childData: any) {
        return this.usersService.addChild(req.user.id, childData);
    }

    @Get('children/:id')
    async getChild(@Request() req, @Param('id') childId: string) {
        return this.usersService.getChildById(req.user.id, childId);
    }

    @Put('children/:id')
    async updateChild(@Request() req, @Param('id') childId: string, @Body() updateData: any) {
        return this.usersService.updateChild(req.user.id, childId, updateData);
    }

    @Delete('children/:id')
    async deleteChild(@Request() req, @Param('id') childId: string) {
        return this.usersService.deleteChild(req.user.id, childId);
    }
}
