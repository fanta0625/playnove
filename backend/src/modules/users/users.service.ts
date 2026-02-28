import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(requesterId: string, id: string) {
        // 用户只能查看自己的信息（SUPER_ADMIN除外）
        if (requesterId !== id) {
            const requester = await this.prisma.user.findUnique({
                where: { id: requesterId },
                select: { role: true },
            });

            if (!requester || requester.role !== 'SUPER_ADMIN') {
                throw new NotFoundException('User not found');
            }
        }

        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                emailVerified: true,
                createdAt: true,
                memberProfiles: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async update(requesterId: string, id: string, updateData: any) {
        // 用户只能更新自己的信息（SUPER_ADMIN除外）
        if (requesterId !== id) {
            const requester = await this.prisma.user.findUnique({
                where: { id: requesterId },
                select: { role: true },
            });

            if (!requester || requester.role !== 'SUPER_ADMIN') {
                throw new NotFoundException('User not found');
            }
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
            },
        });
    }

    async addChild(userId: string, childData: any) {
        return this.prisma.memberProfile.create({
            data: {
                ...childData,
                parentId: userId,
            },
        });
    }

    async getChildren(userId: string) {
        // 验证用户存在
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.memberProfile.findMany({
            where: { parentId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getChildById(userId: string, childId: string) {
        // 验证用户是否有权限查看此child账户
        const child = await this.prisma.memberProfile.findUnique({
            where: { id: childId },
        });

        if (!child) {
            throw new NotFoundException('Child not found');
        }

        if (child.parentId !== userId) {
            throw new NotFoundException('Child not found');
        }

        return child;
    }

    async updateChild(userId: string, childId: string, updateData: any) {
        // 验证用户是否有权限更新此child账户
        const child = await this.prisma.memberProfile.findUnique({
            where: { id: childId },
        });

        if (!child) {
            throw new NotFoundException('Child not found');
        }

        if (child.parentId !== userId) {
            throw new NotFoundException('Child not found');
        }

        return this.prisma.memberProfile.update({
            where: { id: childId },
            data: updateData,
        });
    }

    async deleteChild(userId: string, childId: string) {
        // 验证用户是否有权限删除此child账户
        const child = await this.prisma.memberProfile.findUnique({
            where: { id: childId },
        });

        if (!child) {
            throw new NotFoundException('Child not found');
        }

        if (child.parentId !== userId) {
            throw new NotFoundException('Child not found');
        }

        return this.prisma.memberProfile.delete({
            where: { id: childId },
        });
    }
}
