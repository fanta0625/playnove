import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService } from './roles.service';
import { AppointmentsService } from './appointments.service';
import { PermissionsService } from './permissions.service';
import { Permission } from '@prisma/client';

@Controller('groups/:groupId/roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly appointmentsService: AppointmentsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * 创建角色模板
   */
  @Post()
  async createRole(
    @Param('groupId') groupId: string,
    @Body()
    data: {
      name: string;
      description?: string;
      level?: number;
      permissions?: Permission[];
    },
  ) {
    return this.rolesService.createRoleTemplate(groupId, data);
  }

  /**
   * 获取群组的所有角色
   */
  @Get()
  async getGroupRoles(@Param('groupId') groupId: string) {
    return this.rolesService.getGroupRoles(groupId);
  }

  /**
   * 获取角色详情
   */
  @Get(':roleId')
  async getRole(@Param('roleId') roleId: string) {
    return this.rolesService.getRoleTemplate(roleId);
  }

  /**
   * 更新角色模板
   */
  @Put(':roleId')
  async updateRole(
    @Param('roleId') roleId: string,
    @Body()
    data: {
      name?: string;
      description?: string;
      level?: number;
      isActive?: boolean;
    },
  ) {
    return this.rolesService.updateRoleTemplate(roleId, data);
  }

  /**
   * 删除角色模板
   */
  @Delete(':roleId')
  async deleteRole(@Param('roleId') roleId: string) {
    return this.rolesService.deleteRoleTemplate(roleId);
  }

  /**
   * 添加权限到角色
   */
  @Post(':roleId/permissions')
  async addPermission(
    @Param('roleId') roleId: string,
    @Body('permission') permission: Permission,
  ) {
    return this.rolesService.addPermission(roleId, permission);
  }

  /**
   * 从角色移除权限
   */
  @Delete(':roleId/permissions/:permission')
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permission') permission: Permission,
  ) {
    return this.rolesService.removePermission(roleId, permission);
  }

  /**
   * 设置任命关系
   */
  @Post('appointments')
  async setAppointment(
    @Body()
    data: {
      fromRoleId: string;
      toRoleId: string;
      canDelegate: boolean;
    },
  ) {
    return this.appointmentsService.setRoleAppointment(
      data.fromRoleId,
      data.toRoleId,
      data.canDelegate,
    );
  }

  /**
   * 获取群组的所有任命关系
   */
  @Get('appointments')
  async getAppointments(@Param('groupId') groupId: string) {
    return this.appointmentsService.getGroupAppointments(groupId);
  }

  /**
   * 删除任命关系
   */
  @Delete('appointments/:fromRoleId/:toRoleId')
  async removeAppointment(
    @Param('fromRoleId') fromRoleId: string,
    @Param('toRoleId') toRoleId: string,
  ) {
    return this.appointmentsService.removeRoleAppointment(fromRoleId, toRoleId);
  }

  /**
   * 获取某个角色可以任命的所有角色
   */
  @Get(':roleId/appointable')
  async getAppointableRoles(@Param('roleId') roleId: string) {
    return this.appointmentsService.getAppointableRoles(roleId);
  }
}
