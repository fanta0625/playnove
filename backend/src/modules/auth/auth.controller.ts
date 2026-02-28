import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Request,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const result = await this.authService.register(registerDto);

        // 设置HttpOnly Cookie
        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
            path: '/',
        });

        // 返回时不包含refreshToken
        const { refreshToken, ...data } = result;
        return data;
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const result = await this.authService.login(loginDto);

        // 设置HttpOnly Cookie
        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
            path: '/',
        });

        // 返回时不包含refreshToken
        const { refreshToken, ...data } = result;
        return data;
    }

    @Public()
    @Post('refresh')
    async refresh(
        @Request() req,
        @Res({ passthrough: true }) res: Response
    ) {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) {
            throw new Error('No refresh token provided');
        }

        // 从refresh token中解析userId
        const result = await this.authService.refreshToken(refreshToken);

        // 设置新的HttpOnly Cookie
        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
            path: '/',
        });

        // 返回时不包含refreshToken
        const { refreshToken: newRefreshToken, ...data } = result;
        return data;
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @Request() req,
        @Res({ passthrough: true }) res: Response
    ) {
        await this.authService.logout(req.user.id);

        // 清除Cookie
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return { message: 'Logged out successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.id);
    }
}
