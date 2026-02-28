# PlayNova 技术栈和代码风格

## 后端规范 (NestJS)

### Controller 示例
```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

### Service 示例
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(loginDto: LoginDto) {
    // 业务逻辑
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email }
    });
    return user;
  }
}
```

### Module 示例
```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

### DTO 验证
```typescript
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
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
```

## 通用规范

### 命名规范
- API 路径: kebab-case (`/api/auth/refresh-token`)
- 变量和函数: camelCase (`getUserById`)
- 类和组件: PascalCase (`AuthService`, `LoginForm`)
- 常量: UPPER_SNAKE_CASE (`API_BASE_URL`)
- 数据库表: snake_case (`play_records`, `group_members`)

### 文件组织
```
backend/src/modules/
├── module-name/
│   ├── module.controller.ts
│   ├── module.service.ts
│   ├── module.module.ts
│   ├── dto/
│   │   ├── create-dto.ts
│   │   └── update-dto.ts
│   └── entities/

frontend/src/
├── pages/           # 页面组件
├── components/      # 可复用组件
├── services/        # API 调用
├── store/           # 状态管理
├── hooks/           # 自定义 hooks
└── types/           # TypeScript 类型
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
  }
}
```

### 环境变量
```bash
# 后端 .env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
CORS_ORIGIN="http://localhost:5173"

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
```
