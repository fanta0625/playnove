import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 设置任命关系（fromRole 可以任命 toRole）
   */
  async setRoleAppointment(fromRoleId: string, toRoleId: string, canDelegate: boolean) {
    // 检查角色是否存在
    const [fromRole, toRole] = await Promise.all([
      this.prisma.roleTemplate.findUnique({ where: { id: fromRoleId } }),
      this.prisma.roleTemplate.findUnique({ where: { id: toRoleId } }),
    ]);

    if (!fromRole || !toRole) {
      throw new NotFoundException('角色不存在');
    }

    // 确保两个角色在同一群组
    if (fromRole.groupId !== toRole.groupId) {
      throw new ConflictException('角色必须属于同一群组');
    }

    // 检查层级：任命者的级别应该更高（level 更小）
    if (fromRole.level >= toRole.level) {
      throw new ConflictException('只能任命下级角色');
    }

    // 创建或更新任命关系
    const appointment = await this.prisma.roleAppointment.upsert({
      where: {
        fromRoleId_toRoleId: {
          fromRoleId,
          toRoleId,
        },
      },
      create: {
        fromRoleId,
        toRoleId,
        canDelegate,
      },
      update: {
        canDelegate,
      },
    });

    return appointment;
  }

  /**
   * 删除任命关系
   */
  async removeRoleAppointment(fromRoleId: string, toRoleId: string) {
    const existing = await this.prisma.roleAppointment.findUnique({
      where: {
        fromRoleId_toRoleId: {
          fromRoleId,
          toRoleId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('任命关系不存在');
    }

    await this.prisma.roleAppointment.delete({
      where: {
        fromRoleId_toRoleId: {
          fromRoleId,
          toRoleId,
        },
      },
    });

    return { success: true };
  }

  /**
   * 获取群组的所有任命关系
   */
  async getGroupAppointments(groupId: string) {
    const appointments = await this.prisma.roleAppointment.findMany({
      where: {
        fromRole: {
          groupId,
        },
      },
      include: {
        fromRole: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        toRole: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    return appointments;
  }

  /**
   * 获取某个角色可以任命的所有角色
   */
  async getAppointableRoles(roleId: string) {
    const appointments = await this.prisma.roleAppointment.findMany({
      where: {
        fromRoleId: roleId,
      },
      include: {
        toRole: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true,
          },
        },
      },
    });

    return appointments.map((app) => ({
      ...app.toRole,
      canDelegate: app.canDelegate,
    }));
  }

  /**
   * 检查用户 A 是否可以任命用户 B 为某个角色
   */
  async canAppoint(
    appointerId: string,
    targetRoleId: string
  ): Promise<{ canAppoint: boolean; canDelegate: boolean }> {
    // 获取任命者的群组成员信息
    const appointer = await this.prisma.groupMember.findUnique({
      where: { id: appointerId },
      include: {
        roleTemplate: true,
      },
    });

    if (!appointer) {
      return { canAppoint: false, canDelegate: false };
    }

    // 检查任命关系是否存在
    const appointment = await this.prisma.roleAppointment.findUnique({
      where: {
        fromRoleId_toRoleId: {
          fromRoleId: appointer.roleTemplateId,
          toRoleId: targetRoleId,
        },
      },
    });

    if (!appointment) {
      return { canAppoint: false, canDelegate: false };
    }

    return {
      canAppoint: true,
      canDelegate: appointment.canDelegate,
    };
  }
}
