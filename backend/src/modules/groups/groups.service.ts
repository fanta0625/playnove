import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
    CreateGroupDto,
    UpdateGroupDto,
    CreateGroupInvitationDto,
    UpdateGroupInvitationDto,
    AddGroupMemberDto,
    UpdateGroupMemberDto,
    CreateGroupTaskDto,
    UpdateGroupTaskDto,
} from './dto';
import * as crypto from 'crypto';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    // ========== 群组管理 ==========

    async createGroup(userId: string, createGroupDto: CreateGroupDto) {
        const group = await this.prisma.group.create({
            data: {
                name: createGroupDto.name,
                description: createGroupDto.description,
                type: createGroupDto.type || 'OTHER',
                creatorId: userId,
                maxMembers: createGroupDto.maxMembers || 100,
            },
        });

        // 自动将创建者添加为群组成员，并赋予完全权限
        await this.prisma.groupMember.create({
            data: {
                groupId: group.id,
                userId,
                role: '创建者',
                canInvite: true,
                canAssign: true,
            },
        });

        return group;
    }

    async getMyGroups(userId: string) {
        // 获取用户创建的群组
        const createdGroups = await this.prisma.group.findMany({
            where: { creatorId: userId },
            orderBy: { createdAt: 'desc' },
        });

        // 获取用户加入的群组
        const joinedGroups = await this.prisma.groupMember.findMany({
            where: { userId },
            include: { group: true },
            orderBy: { joinedAt: 'desc' },
        });

        return {
            created: createdGroups,
            joined: joinedGroups.map(m => m.group),
        };
    }

    async getGroup(groupId: string, userId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                    orderBy: { joinedAt: 'desc' },
                    take: 20,
                },
                _count: {
                    select: { members: true, tasks: true },
                },
            },
        });

        if (!group) {
            throw new NotFoundException('群组不存在');
        }

        return group;
    }

    async updateGroup(
        groupId: string,
        userId: string,
        updateGroupDto: UpdateGroupDto,
    ) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('群组不存在');
        }

        if (group.creatorId !== userId) {
            throw new ForbiddenException('只有群组创建者可以修改群组');
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: updateGroupDto,
        });
    }

    async deleteGroup(groupId: string, userId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('群组不存在');
        }

        if (group.creatorId !== userId) {
            throw new ForbiddenException('只有群组创建者可以删除群组');
        }

        return this.prisma.group.delete({
            where: { id: groupId },
        });
    }

    // ========== 群组成员管理 ==========

    async addMember(
        groupId: string,
        userId: string, // 操作者ID
        addGroupMemberDto: AddGroupMemberDto,
    ) {
        // 检查操作者是否有权限
        const operator = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!operator) {
            throw new ForbiddenException('你不是该群组成员');
        }

        if (!operator.canAssign) {
            throw new ForbiddenException('你没有权限添加成员');
        }

        // 检查目标用户是否已存在
        const existingMember = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId: addGroupMemberDto.userId },
            },
        });

        if (existingMember) {
            throw new ForbiddenException('该用户已是群组成员');
        }

        return this.prisma.groupMember.create({
            data: {
                groupId,
                userId: addGroupMemberDto.userId,
                role: addGroupMemberDto.role,
                canInvite: addGroupMemberDto.canInvite || false,
                canAssign: addGroupMemberDto.canAssign || false,
            },
        });
    }

    async updateMemberRole(
        groupId: string,
        memberId: string,
        userId: string, // 操作者ID
        updateGroupMemberDto: UpdateGroupMemberDto,
    ) {
        // 检查操作者是否有权限
        const operator = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!operator) {
            throw new ForbiddenException('你不是该群组成员');
        }

        if (!operator.canAssign) {
            throw new ForbiddenException('你没有权限修改成员角色');
        }

        const member = await this.prisma.groupMember.findUnique({
            where: { id: memberId },
        });

        if (!member) {
            throw new NotFoundException('成员不存在');
        }

        if (member.groupId !== groupId) {
            throw new NotFoundException('成员不在此群组');
        }

        return this.prisma.groupMember.update({
            where: { id: memberId },
            data: updateGroupMemberDto,
        });
    }

    async removeMember(
        groupId: string,
        memberId: string,
        userId: string, // 操作者ID
    ) {
        // 检查操作者是否有权限
        const operator = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!operator) {
            throw new ForbiddenException('你不是该群组成员');
        }

        if (!operator.canAssign) {
            throw new ForbiddenException('你没有权限移除成员');
        }

        const member = await this.prisma.groupMember.findUnique({
            where: { id: memberId },
        });

        if (!member) {
            throw new NotFoundException('成员不存在');
        }

        if (member.groupId !== groupId) {
            throw new NotFoundException('成员不在此群组');
        }

        return this.prisma.groupMember.delete({
            where: { id: memberId },
        });
    }

    async leaveGroup(groupId: string, userId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('群组不存在');
        }

        if (group.creatorId === userId) {
            throw new ForbiddenException('群组创建者不能退出群组');
        }

        return this.prisma.groupMember.delete({
            where: {
                groupId_userId: { groupId, userId },
            },
        });
    }

    // ========== 群组邀请码管理 ==========

    async createInvitation(
        groupId: string,
        userId: string, // 操作者ID
        createGroupInvitationDto: CreateGroupInvitationDto,
    ) {
        // 检查操作者是否有权限
        const operator = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!operator) {
            throw new ForbiddenException('你不是该群组成员');
        }

        if (!operator.canInvite) {
            throw new ForbiddenException('你没有权限创建邀请码');
        }

        // 生成唯一邀请码
        const code = this.generateInvitationCode();

        return this.prisma.groupInvitation.create({
            data: {
                groupId,
                invitedById: userId,
                code,
                maxUses: createGroupInvitationDto.maxUses,
                expiresAt: createGroupInvitationDto.expiresAt
                    ? new Date(createGroupInvitationDto.expiresAt)
                    : null,
                defaultRole: createGroupInvitationDto.defaultRole || '成员',
            },
        });
    }

    async getGroupInvitations(groupId: string, userId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('群组不存在');
        }

        // 检查是否是成员
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('你不是该群组成员');
        }

        return this.prisma.groupInvitation.findMany({
            where: { groupId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateInvitation(
        invitationId: string,
        userId: string, // 操作者ID
        updateGroupInvitationDto: UpdateGroupInvitationDto,
    ) {
        const invitation = await this.prisma.groupInvitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new NotFoundException('邀请码不存在');
        }

        // 检查操作者是否有权限
        const operator = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: invitation.groupId, userId },
            },
        });

        if (!operator) {
            throw new ForbiddenException('你不是该群组成员');
        }

        if (!operator.canInvite) {
            throw new ForbiddenException('你没有权限管理邀请码');
        }

        return this.prisma.groupInvitation.update({
            where: { id: invitationId },
            data: updateGroupInvitationDto,
        });
    }

    async deleteInvitation(invitationId: string, userId: string) {
        const invitation = await this.prisma.groupInvitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            throw new NotFoundException('邀请码不存在');
        }

        // 检查操作者是否有权限
        const operator = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: invitation.groupId, userId },
            },
        });

        if (!operator) {
            throw new ForbiddenException('你不是该群组成员');
        }

        if (!operator.canInvite) {
            throw new ForbiddenException('你没有权限删除邀请码');
        }

        return this.prisma.groupInvitation.delete({
            where: { id: invitationId },
        });
    }

    async acceptInvitation(code: string, userId: string) {
        const invitation = await this.prisma.groupInvitation.findUnique({
            where: { code },
        });

        if (!invitation) {
            throw new NotFoundException('邀请码不存在');
        }

        if (!invitation.isActive) {
            throw new ForbiddenException('邀请码已失效');
        }

        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            throw new ForbiddenException('邀请码已过期');
        }

        if (invitation.usedCount >= invitation.maxUses) {
            throw new ForbiddenException('邀请码使用次数已达上限');
        }

        // 检查是否已经是成员
        const existingMember = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: invitation.groupId,
                    userId,
                },
            },
        });

        if (existingMember) {
            throw new ForbiddenException('你已经是该群组成员了');
        }

        // 创建成员记录
        await this.prisma.groupMember.create({
            data: {
                groupId: invitation.groupId,
                userId,
                role: invitation.defaultRole || '成员',
                canInvite: false,
                canAssign: false,
            },
        });

        // 更新邀请码使用次数
        await this.prisma.groupInvitation.update({
            where: { id: invitation.id },
            data: { usedCount: { increment: 1 } },
        });

        // 获取群组名称用于返回
        const group = await this.prisma.group.findUnique({
            where: { id: invitation.groupId },
            select: { name: true },
        });

        return {
            message: '成功加入群组',
            groupName: group?.name || '未知群组',
            role: invitation.defaultRole || '成员',
        };
    }

    // ========== 群组任务管理 ==========

    async createTask(
        groupId: string,
        userId: string, // 操作者ID
        createGroupTaskDto: CreateGroupTaskDto,
    ) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('群组不存在');
        }

        // 检查是否是成员
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('你不是该群组成员');
        }

        return this.prisma.groupTask.create({
            data: {
                groupId,
                createdById: userId,
                title: createGroupTaskDto.title,
                description: createGroupTaskDto.description,
                type: createGroupTaskDto.type || 'HOMEWORK',
                gameId: createGroupTaskDto.gameId,
                levelId: createGroupTaskDto.levelId,
                dueDate: createGroupTaskDto.dueDate
                    ? new Date(createGroupTaskDto.dueDate)
                    : null,
            },
        });
    }

    async getGroupTasks(groupId: string, userId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('群组不存在');
        }

        // 检查是否是成员
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('你不是该群组成员');
        }

        return this.prisma.groupTask.findMany({
            where: { groupId },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { id: true, name: true } },
                _count: {
                    select: { submissions: true },
                },
            },
        });
    }

    async getGroupTask(taskId: string, userId: string) {
        const task = await this.prisma.groupTask.findUnique({
            where: { id: taskId },
            include: {
                group: true,
                createdBy: { select: { id: true, name: true } },
                submissions: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        // 检查是否是成员
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: task.groupId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('你不是该群组成员');
        }

        return task;
    }

    async updateTask(
        taskId: string,
        userId: string, // 操作者ID
        updateGroupTaskDto: UpdateGroupTaskDto,
    ) {
        const task = await this.prisma.groupTask.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        if (task.createdById !== userId) {
            throw new ForbiddenException('只有任务创建者可以修改任务');
        }

        return this.prisma.groupTask.update({
            where: { id: taskId },
            data: updateGroupTaskDto,
        });
    }

    async deleteTask(taskId: string, userId: string) {
        const task = await this.prisma.groupTask.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        if (task.createdById !== userId) {
            throw new ForbiddenException('只有任务创建者可以删除任务');
        }

        return this.prisma.groupTask.delete({
            where: { id: taskId },
        });
    }

    // ========== 任务提交管理 ==========

    async getMyTasks(userId: string) {
        // 获取用户所有群组
        const memberships = await this.prisma.groupMember.findMany({
            where: { userId },
            select: { groupId: true },
        });

        const groupIds = memberships.map(m => m.groupId);

        // 获取这些群组的任务
        const tasks = await this.prisma.groupTask.findMany({
            where: {
                groupId: { in: groupIds },
                isPublished: true,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                group: { select: { name: true, type: true } },
                createdBy: { select: { name: true } },
                submissions: {
                    where: { userId },
                },
            },
        });

        return tasks.map(task => ({
            ...task,
            isSubmitted: task.submissions.length > 0,
            submission: task.submissions[0] || null,
        }));
    }

    async submitTask(
        userId: string,
        taskId: string,
        score?: number,
        maxScore?: number,
    ) {
        const task = await this.prisma.groupTask.findUnique({
            where: { id: taskId },
            include: { group: true },
        });

        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        if (!task.isPublished) {
            throw new ForbiddenException('任务尚未发布');
        }

        // 检查是否是群组成员
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: task.groupId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('你不是该群组成员');
        }

        // 检查是否已提交
        const existing = await this.prisma.taskSubmission.findUnique({
            where: {
                taskId_userId: { taskId, userId },
            },
        });

        if (existing) {
            return this.prisma.taskSubmission.update({
                where: { id: existing.id },
                data: {
                    score,
                    maxScore,
                    completed: true,
                    submittedAt: new Date(),
                },
            });
        }

        return this.prisma.taskSubmission.create({
            data: {
                taskId,
                userId,
                score,
                maxScore,
                completed: true,
                submittedAt: new Date(),
            },
        });
    }

    // ========== 工具方法 ==========

    private generateInvitationCode(): string {
        // 生成8位随机邀请码
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
}
