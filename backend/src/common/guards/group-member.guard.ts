import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupMemberGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { user, params } = request;

        // 获取groupId（从params或body）
        const groupId = params.groupId || params.id || request.body?.groupId;

        if (!groupId) {
            throw new ForbiddenException('Group ID is required');
        }

        // 检查群组是否存在
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // 检查用户是否是群组成员
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: user.id,
                },
            },
        });

        if (!member) {
            throw new ForbiddenException('You are not a member of this group');
        }

        // 将member信息附加到request中供后续使用
        request.groupMember = member;

        return true;
    }
}

@Injectable()
export class GroupCreatorGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { user, params } = request;

        // 获取groupId
        const groupId = params.groupId || params.id;

        if (!groupId) {
            throw new ForbiddenException('Group ID is required');
        }

        // 检查群组是否存在
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // 检查用户是否是群组创建者
        if (group.creatorId !== user.id) {
            throw new ForbiddenException('Only group creator can perform this action');
        }

        return true;
    }
}

@Injectable()
export class GroupAdminGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { user, params } = request;

        // 获取groupId
        const groupId = params.groupId || params.id;

        if (!groupId) {
            throw new ForbiddenException('Group ID is required');
        }

        // 检查群组是否存在
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // 创建者总是拥有管理员权限
        if (group.creatorId === user.id) {
            return true;
        }

        // 检查用户是否是管理员
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: user.id,
                },
            },
        });

        if (!member || !member.canAssign) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
