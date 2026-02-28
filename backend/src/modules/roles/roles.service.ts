import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建角色模板
   */
  async createRoleTemplate(groupId: string, data: {
    name: string;
    description?: string;
    level?: number;
    permissions?: Permission[];
  }) {
    // 检查角色名是否已存在
    const existing = await this.prisma.roleTemplate.findFirst({
      where: {
        groupId,
        name: data.name,
      },
    });

    if (existing) {
      throw new ConflictException('角色名称已存在');
    }

    // 创建角色
    const role = await this.prisma.roleTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        level: data.level ?? 0,
        groupId,
        isSystem: false,
      },
    });

    // 添加权限
    if (data.permissions && data.permissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: data.permissions.map((permission) => ({
          roleTemplateId: role.id,
          permission,
        })),
      });
    }

    return this.getRoleTemplate(role.id);
  }

  /**
   * 获取角色模板详情
   */
  async getRoleTemplate(roleId: string) {
    const role = await this.prisma.roleTemplate.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          select: {
            permission: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return {
      ...role,
      permissions: role.permissions.map((p) => p.permission),
    };
  }

  /**
   * 获取群组的所有角色
   */
  async getGroupRoles(groupId: string) {
    return this.prisma.roleTemplate.findMany({
      where: {
        groupId,
        isActive: true,
      },
      include: {
        permissions: {
          select: {
            permission: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * 更新角色模板
   */
  async updateRoleTemplate(roleId: string, data: {
    name?: string;
    description?: string;
    level?: number;
    isActive?: boolean;
  }) {
    const role = await this.prisma.roleTemplate.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (role.isSystem) {
      throw new ForbiddenException('系统角色不能修改');
    }

    // 更新基本信息
    const updated = await this.prisma.roleTemplate.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.isActive,
      },
    });

    return this.getRoleTemplate(updated.id);
  }

  /**
   * 删除角色模板
   */
  async deleteRoleTemplate(roleId: string) {
    const role = await this.prisma.roleTemplate.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (role.isSystem) {
      throw new ForbiddenException('系统角色不能删除');
    }

    if (role._count.members > 0) {
      throw new ConflictException('该角色下还有成员，无法删除');
    }

    await this.prisma.roleTemplate.delete({
      where: { id: roleId },
    });

    return { success: true };
  }

  /**
   * 添加权限到角色
   */
  async addPermission(roleId: string, permission: Permission) {
    // 检查角色是否存在
    const role = await this.prisma.roleTemplate.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 检查权限是否已存在
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleTemplateId_permission: {
          roleTemplateId: roleId,
          permission,
        },
      },
    });

    if (existing) {
      throw new ConflictException('该权限已存在');
    }

    await this.prisma.rolePermission.create({
      data: {
        roleTemplateId: roleId,
        permission,
      },
    });

    return this.getRoleTemplate(roleId);
  }

  /**
   * 从角色移除权限
   */
  async removePermission(roleId: string, permission: Permission) {
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleTemplateId_permission: {
          roleTemplateId: roleId,
          permission,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('权限不存在');
    }

    await this.prisma.rolePermission.delete({
      where: {
        roleTemplateId_permission: {
          roleTemplateId: roleId,
          permission,
        },
      },
    });

    return this.getRoleTemplate(roleId);
  }
}
