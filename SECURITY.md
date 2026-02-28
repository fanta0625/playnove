# 启玩星球（PlayNova）安全设计文档

## 1. 认证与授权

### 1.1 JWT + Refresh Token 机制

#### 认证流程

```
1. 用户登录
   ↓
2. 后端验证凭证
   ↓
3. 生成访问令牌（Access Token，15分钟）
   ↓
4. 生成刷新令牌（Refresh Token，7天）
   ↓
5. 访问令牌存储在内存（前端）
   ↓
6. 刷新令牌存储在HttpOnly Cookie
   ↓
7. 访问令牌过期时，使用刷新令牌获取新的访问令牌
```

#### Token 配置

```typescript
// backend/src/config/jwt.config.ts
export const jwtConfig = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};
```

#### Token 存储策略

**Access Token (JWT)**
- 存储位置：内存（Zustand store）
- 有效期：15分钟
- 用途：API请求认证
- 不包含敏感信息

**Refresh Token**
- 存储位置：HttpOnly Cookie
- 有效期：7天
- 用途：刷新访问令牌
- 安全特性：
  - HttpOnly: 防止XSS攻击
  - Secure: 仅HTTPS传输
  - SameSite: CSRF防护

#### 实现代码

```typescript
// backend/src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.access.secret,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, role: payload.role };
  }
}

// backend/src/modules/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.refresh.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken || !payload.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, refreshToken };
  }
}
```

### 1.2 密码加密

```typescript
// backend/src/common/utils/crypto.util.ts
import * as bcrypt from 'bcrypt';

export class CryptoUtil {
  /**
   * 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证密码
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 生成随机token
   */
  static generateToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
```

### 1.3 RBAC权限控制

```typescript
// backend/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// backend/src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// 使用示例
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  @Get('users')
  getAllUsers() {
    // 只有ADMIN角色可以访问
  }
}
```

---

## 2. 接口安全

### 2.1 Rate Limiting（限流）

```typescript
// backend/src/common/guards/rate-limit.guard.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, number[]>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分钟
    const maxRequests = 60; // 最多60次请求

    // 清理过期记录
    const userRequests = this.requests.get(ip) || [];
    const validRequests = userRequests.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests',
      });
    }

    validRequests.push(now);
    this.requests.set(ip, validRequests);
    next();
  }
}

// 使用Redis的限流方案
import { Injectable } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  async checkLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<boolean> {
    const current = await this.redis.get(`rate:${key}`);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
      return false;
    }

    if (count === 0) {
      await this.redis.setex(`rate:${key}`, window, '1');
    } else {
      await this.redis.incr(`rate:${key}`);
    }

    return true;
  }
}
```

### 2.2 输入验证

```typescript
// backend/src/common/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        })),
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

// 全局启用
app.useGlobalPipes(new ValidationPipe());
```

### 2.3 SQL注入防护（Prisma ORM）

Prisma ORM自动防止SQL注入，但仍需注意：

```typescript
// ✅ 正确：使用参数化查询
async findUserById(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
  });
}

// ✅ 正确：使用参数化查询
async findUsersByName(name: string) {
  return this.prisma.user.findMany({
    where: {
      username: {
        contains: name, // Prisma会自动转义
      },
    },
  });
}

// ❌ 错误：不要使用原始SQL
async findUserRaw(id: string) {
  return this.prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;
  // 虽然Prisma支持，但应尽量避免
}
```

---

## 3. 前端安全

### 3.1 XSS防护

```typescript
// backend/src/common/middleware/helmet.middleware.ts
import helmet from 'helmet';
import * as express from 'express';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
];

// 前端XSS防护
// frontend/src/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

// React中自动转义
function UserInput({ content }: { content: string }) {
  // ✅ React自动转义，安全
  return <div>{content}</div>;

  // ❌ 危险：不要使用dangerouslySetInnerHTML
  // return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
```

### 3.2 CSRF防护

```typescript
// backend/src/common/guards/csrf.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as csrf from 'csurf';

@Injectable()
export class CsrfGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler()
    );

    if (isPublic) {
      return true;
    }

    // CSRF token验证逻辑
    const token = request.headers['x-csrf-token'];
    const sessionToken = request.session.csrfToken;

    return token === sessionToken;
  }
}
```

---

## 4. AI接口安全隔离

```typescript
// backend/src/modules/ai/ai.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AIService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get('AI_API_KEY');
    this.apiUrl = this.config.get('AI_API_URL');
  }

  async analyzePlay(playData: any): Promise<any> {
    try {
      // 数据脱敏
      const sanitizedData = this.sanitizeData(playData);

      const response = await axios.post(
        `${this.apiUrl}/analyze`,
        sanitizedData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10秒超时
        }
      );

      return response.data;
    } catch (error) {
      // 不暴露内部错误
      throw new InternalServerErrorException('AI analysis failed');
    }
  }

  /**
   * 数据脱敏：移除敏感信息
   */
  private sanitizeData(data: any): any {
    const { userId, email, ...sanitized } = data;
    return sanitized;
  }
}
```

---

## 5. 日志与审计

### 5.1 日志系统

```typescript
// backend/src/common/utils/logger.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustomLogger implements LoggerService {
  private logPath = path.join(process.cwd(), 'logs');

  log(message: string, context?: string) {
    this.writeLog('LOG', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.writeLog('ERROR', message, context, trace);
  }

  warn(message: string, context?: string) {
    this.writeLog('WARN', message, context);
  }

  debug(message: string, context?: string) {
    this.writeLog('DEBUG', message, context);
  }

  private writeLog(
    level: string,
    message: string,
    context?: string,
    trace?: string
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${context || 'App'}] ${message}\n${
      trace || ''
    }\n`;

    // 写入文件
    const fileName = `${new Date().toISOString().split('T')[0]}.log`;
    const filePath = path.join(this.logPath, fileName);

    fs.appendFileSync(filePath, logEntry);

    // 错误日志额外写入error.log
    if (level === 'ERROR') {
      const errorPath = path.join(this.logPath, 'error.log');
      fs.appendFileSync(errorPath, logEntry);
    }
  }
}
```

### 5.2 审计日志

```typescript
// backend/src/common/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logAudit({
            userId: user?.id,
            action: `${method} ${url}`,
            resource: url,
            status: 'SUCCESS',
            duration,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logAudit({
            userId: user?.id,
            action: `${method} ${url}`,
            resource: url,
            status: 'ERROR',
            error: error.message,
            duration,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          });
        },
      })
    );
  }

  private async logAudit(data: any) {
    // 存储到数据库
    // await this.prisma.auditLog.create({ data });
    
    // 或写入日志文件
    this.logger.log(JSON.stringify(data));
  }
}
```

---

## 6. 环境变量管理

```bash
# backend/.env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/playnova?schema=public"

# JWT
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# 对象存储（S3兼容）
S3_ENDPOINT="https://s3.amazonaws.com"
S3_BUCKET="playnova-assets"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_REGION="us-east-1"

# AI服务
AI_API_KEY="your-ai-api-key"
AI_API_URL="https://api.example.com/ai"

# 应用配置
NODE_ENV="production"
PORT="3000"
API_PREFIX="/api/v1"
CORS_ORIGIN="https://playnova.com"
```

---

## 7. 安全检查清单

### 开发阶段
- [ ] 所有API都需要认证（除了登录、注册）
- [ ] 密码使用bcrypt加密（salt >= 10）
- [ ] 使用参数化查询（Prisma ORM）
- [ ] 敏感数据不存储在JWT中
- [ ] 所有输入都经过验证
- [ ] 输出到HTML的内容经过转义
- [ ] 启用CSP策略
- [ ] 配置CORS白名单
- [ ] API响应不包含敏感信息

### 生产部署
- [ ] 启用HTTPS（TLS 1.2+）
- [ ] 配置HSTS
- [ ] 启用CSRF防护
- [ ] 配置Rate Limiting
- [ ] 启用安全头（Helmet）
- [ ] 定期备份（数据库、日志）
- [ ] 监控异常日志
- [ ] 定期更新依赖包
- [ ] 配置防火墙
- [ ] 数据库连接加密

### 运维阶段
- [ ] 定期审计日志
- [ ] 监控异常请求
- [ ] 定期安全扫描
- [ ] 应急响应计划
- [ ] 数据备份测试
- [ ] 灾难恢复演练
