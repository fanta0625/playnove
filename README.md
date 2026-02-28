# 启玩星球 (PlayNova)

为3-6岁儿童设计的优质教育互动游戏平台

## 项目概述

PlayNova是一个功能完整的儿童教育游戏平台，提供多种类型的益智游戏，帮助儿童在游戏中学习成长。

### 核心功能

- 🎮 **多种游戏类型**：拖拽、配对、计数、拼图、排序
- 📚 **关卡系统**：科学的难度递进设计
- 📊 **数据统计**：详细的游戏记录和学习分析
- 👨‍👩‍👧 **家长账户**：完善的家长监控系统
- 🔒 **安全保障**：JWT认证、限流、审计日志
- 🚀 **高性能**：React + NestJS + PostgreSQL

## 技术架构

### 前端技术栈

- **框架**：React 18 + TypeScript
- **构建工具**：Vite
- **状态管理**：Zustand
- **路由**：React Router
- **UI框架**：Tailwind CSS
- **HTTP客户端**：Axios
- **动画引擎**：Canvas API（可扩展PixiJS）

### 后端技术栈

- **框架**：NestJS
- **语言**：TypeScript
- **数据库**：PostgreSQL
- **ORM**：Prisma
- **认证**：JWT + Passport
- **验证**：class-validator
- **日志**：Winston
- **限流**：@nestjs/throttler

### 游戏引擎

- **架构**：模块化、可插拔设计
- **核心组件**：
  - `GameManager`：游戏生命周期管理
  - `EventBus`：事件驱动通信
  - `ScoreSystem`：得分与统计
  - `GameModule`：统一的游戏模块接口

## 项目结构

```
playnove/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── core/            # 游戏引擎核心
│   │   │   └── game/       # 游戏引擎
│   │   │       ├── types.ts          # 类型定义
│   │   │       ├── EventBus.ts       # 事件总线
│   │   │       ├── GameManager.ts    # 游戏管理器
│   │   │       ├── ScoreSystem.ts    # 得分系统
│   │   │       └── modules/        # 游戏模块
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   ├── store/           # 状态管理
│   │   ├── services/        # API服务
│   │   ├── hooks/           # 自定义Hooks
│   │   └── styles/          # 样式文件
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                 # 后端API
│   ├── src/
│   │   ├── modules/         # 功能模块
│   │   │   ├── auth/       # 认证模块
│   │   │   ├── users/      # 用户模块
│   │   │   └── games/      # 游戏模块
│   │   └── common/         # 公共模块
│   │       └── prisma/     # 数据库
│   ├── prisma/
│   │   └── schema.prisma    # 数据库Schema
│   └── Dockerfile
│
├── docker-compose.yml        # Docker编排
├── .gitignore
└── README.md
```

## 快速开始

详细的安装和配置指南请查看 [SETUP.md](./SETUP.md)

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 数据库：Docker PostgreSQL / 本地PostgreSQL / 在线数据库

### 快速启动

```bash
# 1. 安装依赖
npm install              # 根目录依赖
cd frontend && npm install
cd ../backend && npm install

# 2. 配置环境变量
cd backend
cp .env.example .env
# 编辑.env文件配置数据库连接

# 3. 初始化数据库
npm run prisma:generate
npm run prisma:push

# 4. 启动开发服务器（两个终端）
# 终端1
npm run start:dev        # 后端（端口3000）

# 终端2
cd ../frontend
npm run dev             # 前端（端口5173）
```

访问 http://localhost:5173 查看应用

### 🚀 开发模式一键启动（推荐）

使用开发模式启动脚本，只需Docker启动数据库，前后端本地运行：

```bash
# 一键准备开发环境（启动数据库 + 初始化数据库 + 安装依赖）
./start.sh
```

然后打开两个终端分别启动后端和前端：

**终端1 - 启动后端：**
```bash
cd backend
npm run start:dev
```

**终端2 - 启动前端：**
```bash
cd frontend
npm run dev
```

访问 http://localhost:5173 查看应用

**开发模式优势：**
- ✅ 前后端代码热更新
- ✅ 调试更方便
- ✅ 数据库使用Docker，环境一致
- ✅ 快速启动，无需构建镜像

**停止开发环境：**
```bash
# 停止数据库
docker compose down
```

### 安装方案

| 方案 | 适用人群 | 难度 | 说明 |
|------|---------|------|------|
| **Docker** | 有Docker经验 | ⭐⭐ | 推荐团队协作 |
| **本地数据库** | 本地开发 | ⭐⭐⭐ | 性能最好 |
| **在线数据库** | 新手学习 | ⭐ | 最简单 |

详细安装步骤请查看 [SETUP.md](./SETUP.md)

### Docker一键启动

#### 方式一：使用一键启动脚本（推荐）

```bash
# 一键启动所有服务（包括前端、后端、数据库、Redis、Nginx）
./docker-start.sh
```

启动后访问：
- 前端应用: http://localhost:3000
- 后端API: http://localhost:3001
- Nginx: http://localhost:8080

#### 方式二：手动使用Docker Compose

```bash
# 1. 启动数据库服务
docker compose up -d postgres redis

# 2. 构建并启动所有服务
docker compose up -d --build

# 3. 查看服务状态
docker compose ps

# 4. 查看日志
docker compose logs -f

# 5. 停止服务
docker compose down

# 6. 停止并删除数据卷（谨慎使用）
docker compose down -v
```

#### Docker服务说明

docker-compose.yml包含以下服务：
- **postgres** - PostgreSQL数据库（端口5432）
- **redis** - Redis缓存（端口6379）
- **backend** - 后端API服务（端口3001）
- **frontend** - 前端Web应用（端口3000）
- **nginx** - Nginx反向代理（端口8080/443）

#### 常用Docker命令

```bash
# 查看所有容器状态
docker compose ps

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# 重启特定服务
docker compose restart backend

# 进入容器
docker compose exec backend bash
docker compose exec postgres psql -U postgres

# 更新服务（重新构建）
docker compose up -d --build backend

# 完全清理（删除所有容器和数据）
docker compose down -v
```

## 数据库设计

### 核心表结构

- **users**: 用户表（家长/管理员）
- **children**: 儿童账户表
- **games**: 游戏类型表
- **levels**: 关卡配置表
- **questions**: 题库表
- **play_records**: 游戏记录表
- **subscriptions**: 订阅表（预留）
- **ai_reports**: AI分析报告表（预留）
- **refresh_tokens**: 刷新令牌表
- **audit_logs**: 审计日志表

详细Schema请参考 `backend/prisma/schema.prisma`

## 游戏引擎使用

### 基本用法

```typescript
import GameManager from '@/core/game/GameManager';
import DragGame from '@/core/game/modules/DragGame';
import { eventBus } from '@/core/game/EventBus';

// 创建游戏管理器
const gameManager = new GameManager({
    width: 800,
    height: 600,
    background: '#f0f0f0',
});

// 创建游戏模块
const dragGame = new DragGame();

// 设置游戏模块
gameManager.setModule(dragGame);

// 加载关卡
gameManager.loadLevel(levelConfig);

// 订阅事件
eventBus.on('game:complete', (event) => {
    console.log('游戏完成！', event.payload);
});

// 开始游戏
gameManager.start();
```

### 创建自定义游戏模块

```typescript
import { GameModule, GameConfig } from '@/core/game/GameManager';

class MyGame implements GameModule {
    init(config: GameConfig): void {
        // 初始化游戏
    }

    start(): void {
        // 开始游戏
    }

    pause(): void {
        // 暂停游戏
    }

    resume(): void {
        // 继续游戏
    }

    stop(): void {
        // 停止游戏
    }

    destroy(): void {
        // 清理资源
    }
}
```

## API文档

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新Token
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 游戏接口

- `GET /api/games` - 获取游戏列表
- `GET /api/games/:id` - 获取游戏详情
- `GET /api/games/:id/levels` - 获取关卡列表
- `GET /api/games/:id/levels/:levelId` - 获取关卡详情
- `POST /api/games/records` - 提交游戏记录
- `GET /api/games/records` - 获取用户游戏记录
- `GET /api/games/stats` - 获取游戏统计

## 安全特性

- ✅ JWT + Refresh Token双令牌机制
- ✅ 密码bcrypt加密
- ✅ 接口级别限流
- ✅ SQL注入防护（Prisma ORM）
- ✅ XSS防护
- ✅ CORS配置
- ✅ 输入验证（class-validator）
- ✅ 审计日志

## MVP简化建议

### 第一阶段必须实现

- [x] 基础用户认证系统
- [x] 游戏引擎核心框架
- [x] 至少一个游戏类型（拖拽）
- [x] 基础关卡系统
- [x] 游戏记录存储
- [x] 管理员后台

### 暂时可省略

- [ ] 小程序端（Web MVP之后）
- [ ] AI分析功能
- [ ] 订阅付费系统
- [ ] 社交功能
- [ ] 成就系统
- [ ] 实时多人游戏

### 必须规范

- [x] 完整的类型定义
- [x] 数据库Schema设计
- [x] 安全机制
- [x] 错误处理
- [x] 日志记录
- [x] Docker配置
- [x] 环境变量管理

## 扩展计划

### 短期（3-6个月）

- 完善所有游戏类型
- 添加更多关卡
- 实现家长报告系统
- 优化移动端体验

### 中期（6-12个月）

- 微信小程序版本
- 抖音小程序版本
- AI学习能力分析
- 社交功能

### 长期（1年+）

- 移动App
- 实时多人游戏
- VR/AR游戏支持
- 国际化支持

## 贡献指南

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

- 项目主页：[GitHub]
- 问题反馈：[Issues]
- 邮箱：contact@playnove.com

---

**启玩星球 - 让每个孩子都能快乐学习！** 🚀
