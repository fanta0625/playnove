import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        // 检查邮箱是否已存在
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        // 创建用户
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                name: registerDto.name,
            },
        });

        // 生成Token
        const tokens = await this.generateTokens(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            ...tokens,
        };
    }

    async login(loginDto: LoginDto) {
        // 查找用户
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 生成Token
        const tokens = await this.generateTokens(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        // 验证refresh token是否存在于数据库且有效
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!tokenRecord) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (tokenRecord.expiresAt < new Date()) {
            // 删除过期的token
            await this.prisma.refreshToken.delete({
                where: { id: tokenRecord.id },
            });
            throw new UnauthorizedException('Refresh token expired');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: tokenRecord.userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // 生成新tokens
        const tokens = await this.generateTokens(user.id, user.email);

        // 删除旧的refresh token
        await this.prisma.refreshToken.delete({
            where: { id: tokenRecord.id },
        });

        return tokens;
    }

    async logout(userId: string) {
        // 删除所有刷新令牌
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        const { password: _, ...result } = user;
        return result;
    }

    private async generateTokens(userId: string, email: string, role?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const accessToken = this.jwtService.sign(
            { sub: userId, email, role: user.role },
            { expiresIn: '15m' }
        );

        const refreshToken = this.jwtService.sign(
            { sub: userId, type: 'refresh', role: user.role },
            { expiresIn: '7d' }
        );

        // 保存刷新令牌到数据库
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
            },
        });

        return {
            accessToken,
            refreshToken,
        };
    }
}
