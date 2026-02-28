# PlayNova 技术栈和代码风格

## 后端规范 (NestJS)

### Controller 示例
```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
@UseGuards(JwtAuthGuard) // 默认需要认证
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // 标记公开路由
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }
}
```

### 权限控制规范

#### 使用 Guards
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GroupMemberGuard } from '../../common/guards/group-member.guard';
import { GroupCreatorGuard } from '../../common/guards/group-member.guard';

// 单个 Guard
@UseGuards(JwtAuthGuard)

// 多个 Guards（按顺序执行）
@UseGuards(JwtAuthGuard, RolesGuard)
```

#### 角色检查
```typescript
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles('SUPER_ADMIN') // 只有超级管理员可访问
  getAllUsers() {
    // ...
  }

  @Post('reset-password')
  @Roles('SUPER_ADMIN', 'ADMIN') // 多个角色
  resetPassword() {
    // ...
  }
}
```

#### 群组权限
```typescript
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  // 检查是否是群组成员
  @Get(':id')
  @UseGuards(GroupMemberGuard)
  findOne(@Param('id') id: string) {
    // ...
  }

  // 检查是否是群组创建者
  @Put(':id')
  @UseGuards(GroupCreatorGuard)
  updateGroup(@Param('id') id: string) {
    // ...
  }

  // 检查是否有管理权限（canAssign）
  @Post(':groupId/members')
  @UseGuards(GroupAdminGuard)
  addMember(@Param('groupId') groupId: string) {
    // ...
  }
}
```

### Service 示例
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  // Service 层业务逻辑权限验证
  async removeMember(groupId: string, memberId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: memberId,
        },
      },
    });

    // 检查操作者是否有权限
    const currentUserMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!currentUserMembership?.canAssign) {
      throw new ForbiddenException('No permission to remove members');
    }

    // 执行删除
    await this.prisma.groupMember.delete({
      where: { id: memberId },
    });
  }
}
```

### Module 示例
```typescript
import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
```

### DTO 验证
```typescript
import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['CLASS', 'FAMILY', 'INTEREST', 'TRAINING', 'OTHER'])
  type: string;

  @IsOptional()
  maxMembers?: number;
}
```

## 前端规范 (React + TypeScript)

### 组件示例
```typescript
import { useState } from 'react';

interface Props {
  title: string;
  onSubmit: (data: any) => void;
}

export function LoginForm({ title, onSubmit }: Props) {
  const [email, setEmail] = useState('');

  return (
    <div>
      <h1>{title}</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>
  );
}
```

### API 调用
```typescript
import api from './api';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post('/auth/login', data);
  },

  async me() {
    return api.get('/auth/me');
  },
};

export const groupsService = {
  async create(data: CreateGroupRequest): Promise<Group> {
    return api.post('/groups', data);
  },

  async myGroups(): Promise<Group[]> {
    return api.get('/groups/my');
  },

  async addMember(groupId: string, userId: string, role: string) {
    return api.post(`/groups/${groupId}/members`, {
      userId,
      role,
      canInvite: false,
      canAssign: false,
    });
  },
};
```

### 状态管理 (Zustand)
```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

// 使用示例
function UserProfile() {
  const { user, logout } = useAuthStore();
  return <div>{user?.name}</div>;
}
```

## 通用规范

### 命名规范
- API 路径: kebab-case (`/api/auth/refresh-token`, `/api/groups/:groupId/members`)
- 变量和函数: camelCase (`getUserById`, `canInvite`, `canAssign`)
- 类和组件: PascalCase (`AuthService`, `LoginForm`, `GroupMemberGuard`)
- 常量: UPPER_SNAKE_CASE (`API_BASE_URL`, `JWT_SECRET`)
- 数据库表: snake_case (`play_records`, `group_members`, `task_submissions`)
- 装饰器: PascalCase (`@Roles()`, `@Public()`, `@UseGuards()`)

### 文件组织
```
backend/src/modules/
├── module-name/
│   ├── module.controller.ts
│   ├── module.service.ts
│   ├── module.module.ts
│   ├── dto/
│   │   ├── create-dto.ts
│   │   ├── update-dto.ts
│   │   └── index.ts (导出所有 DTO)
│   └── entities/

backend/src/common/
├── decorators/          # 自定义装饰器
│   ├── roles.decorator.ts
│   └── public.decorator.ts
├── guards/              # 守卫
│   ├── roles.guard.ts
│   └── group-member.guard.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── middleware/

frontend/src/
├── pages/           # 页面组件
├── components/      # 可复用组件
├── services/        # API 调用
├── store/           # 状态管理
├── hooks/           # 自定义 hooks
├── types/           # TypeScript 类型
└── core/            # 核心功能（游戏引擎）
```

### 错误处理
```typescript
// 后端统一错误格式
{
  statusCode: 400,
  message: 'Validation failed',
  error: 'Bad Request'
}

// 前端错误处理
try {
  await authService.login(data);
} catch (error) {
  if (error.response?.status === 401) {
    // 处理认证错误
  } else if (error.response?.status === 403) {
    // 处理权限错误
  }
}
```

### 环境变量
```bash
# 后端 .env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
CORS_ORIGIN="http://localhost:5173"
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# 前端 .env
VITE_API_BASE_URL="http://localhost:3000/api"
```

### Git 提交规范
```
feat: 添加用户注册功能
fix: 修复登录 token 过期问题
docs: 更新 README 文档
refactor: 重构 auth service
style: 代码格式化
test: 添加单元测试
chore: 更新依赖
security: 修复安全漏洞
```

## 安全编码规范

### 必须遵守
1. **所有 API 默认需要认证**
   - 使用 `@UseGuards(JwtAuthGuard)` 保护路由
   - 使用 `@Public()` 标记公开路由

2. **统一的用户标识**
   - 始终使用 `user.id`（不是 `user.userId`）
   - JWT Strategy 必须正确设置 `user.id`

3. **Child 账户权限隔离**
   - 必须验证 `child.parentId === user.id`
   - 不允许访问其他人的 Child 账户

4. **密码处理**
   - 使用 bcrypt 加密（salt=10）
   - 不要在日志中记录密码
   - 不要在响应中返回密码

5. **输入验证**
   - 所有 DTO 使用 class-validator
   - 使用 `@IsNotEmpty()`, `@IsEmail()` 等装饰器
   - Service 层也要验证业务逻辑

### 权限检查规范
1. **Guard 层**: 路由级别权限检查
2. **Service 层**: 业务逻辑权限检查
3. **Controller 层**: 使用装饰器声明权限要求

### 群组系统规范
1. **角色**: 自定义字符串（如"班主任"、"爸爸"）
2. **权限**: 使用 `canInvite` 和 `canAssign` 布尔值
3. **邀请码**: 8 位随机字符串
4. **成员验证**: 使用 `GroupMemberGuard`
5. **创建者验证**: 使用 `GroupCreatorGuard`
6. **管理权限**: 使用 `GroupAdminGuard`（检查 canAssign）

---

**最后更新**: 2026-02-28
