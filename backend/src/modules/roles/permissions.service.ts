import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查群组成员是否有某个权限
   */
  async hasPermission(
    groupMemberId: string,
    permission: Permission
  ): Promise<boolean> {
    const member = await this.prisma.groupMember.findUnique({
      where: { id: groupMemberId },
      include: {
        roleTemplate: {
          include: {
            permissions: {
              select: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return false;
    }

    return member.roleTemplate.permissions.some((p) => p.permission === permission);
  }

  /**
   * 检查用户在群组中是否有某个权限
   */
  async hasPermissionInGroup(
    groupId: string,
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        roleTemplate: {
          include: {
            permissions: {
              select: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return false;
    }

    return member.roleTemplate.permissions.some((p) => p.permission === permission);
  }

  /**
   * 获取用户在群组中的所有权限
   */
  async getUserPermissions(groupId: string, userId: string): Promise<Permission[]> {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        roleTemplate: {
          include: {
            permissions: {
              select: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return [];
    }

    return member.roleTemplate.permissions.map((p) => p.permission);
  }

  /**
   * 检查成员是否可以任命下级
   */
  async canDelegate(groupMemberId: string): Promise<boolean> {
    const member = await this.prisma.groupMember.findUnique({
      where: { id: groupMemberId },
    });

    return member?.canDelegate ?? false;
  }

  /**
   * 检查用户是否是群组成员
   */
  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return !!member;
  }

  /**
   * 检查用户是否是群组创建者
   */
  async isGroupCreator(groupId: string, userId: string): Promise<boolean> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    return group?.creatorId === userId;
  }
}
