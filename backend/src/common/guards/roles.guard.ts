import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 获取所需的角色
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        );

        // 如果没有指定角色要求，则允许访问
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // 获取请求中的用户信息
        const { user } = context.switchToHttp().getRequest();

        // 检查用户是否存在
        if (!user || !user.role) {
            throw new ForbiddenException('Access denied');
        }

        // 检查用户角色是否在允许的角色列表中
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Access denied');
        }

        return true;
    }
}
