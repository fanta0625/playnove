# 启玩星球（PlayNova）技术架构文档

## 1. 总体架构设计

### 1.1 架构层次图

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端层                                  │
├──────────────────┬──────────────────┬────────────────────────────┤
│  Web Frontend    │  微信小程序       │   抖音小程序 / App        │
│  (React + Vite)  │  (React适配)      │   (未来扩展)              │
└────────┬─────────┴────────┬─────────┴──────────────────────────┘
         │                  │
         └──────────────────┴──────────────┐
                  HTTPS / WebSocket       │
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         反向代理层                               │
│                    Nginx + SSL + CDN                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   API Gateway  │  │  静态资源CDN │  │   WebSocket服务   │
│  (NestJS)      │  │  (图片/音频) │  │  (实时对战/推送)  │
└────────┬───────┘  └──────────────┘  └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       应用服务层 (NestJS)                         │
├──────────────────┬──────────────────┬────────────────────────────┤
│   Auth Module    │   User Module   │     Game Module           │
│   (JWT/刷新)     │  (用户管理)     │   (游戏逻辑/关卡)         │
├──────────────────┼──────────────────┼────────────────────────────┤
│  Level Module    │ Analytics Module│   Admin Module             │
│  (关卡管理)      │  (数据统计)     │   (后台管理/RBAC)         │
├──────────────────┴──────────────────┴────────────────────────────┤
│                  Common Layer (共享层)                           │
│          日志 | 缓存(Redis) | 消息队列 | 工具类                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   PostgreSQL   │  │    Redis     │  │   对象存储S3     │
│  (主数据库)     │  │   (缓存)      │   (游戏资源)       │
└────────────────┘  └──────────────┘  └──────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   AI扩展层 (预留)    │
                 │  · 玩法分析         │
                 │  · 学习建议         │
                 │  · 自适应难度       │
                 └─────────────────────┘
```

### 1.2 技术栈选择理由

#### 前端技术栈
- **React + Vite**: 快速开发，HMR热更新，生态系统成熟
- **TypeScript**: 类型安全，减少运行时错误
- **Zustand**: 轻量级状态管理，适合游戏场景
- **PixiJS**: 高性能2D渲染引擎，支持Canvas和WebGL
- **模块化游戏引擎**: 可复用到小程序

#### 后端技术栈
- **NestJS**: 企业级Node.js框架，支持依赖注入、模块化
- **PostgreSQL**: 关系型数据库，支持复杂查询、事务、JSONB
- **Prisma ORM**: 类型安全，自动生成类型定义
- **Redis**: 缓存、会话管理、限流
- **JWT + Refresh Token**: 无状态认证

### 1.3 核心设计原则

1. **单体优先**: MVP阶段采用单体架构，降低复杂度和运维成本
2. **高内聚低耦合**: 模块间通过接口通信，依赖注入
3. **可插拔设计**: 游戏引擎支持动态加载新模块
4. **跨平台复用**: 游戏逻辑与平台无关，方便迁移小程序
5. **安全第一**: 全链路安全防护，数据加密，权限控制
6. **可观测性**: 完整的日志、监控、审计体系

---

## 2. 前端目录结构设计

### 2.1 完整目录树

```
frontend/
├── public/                          # 静态资源
│   ├── favicon.ico
│   └── assets/                      # 不需要构建的资源
├── src/
│   ├── core/                        # 核心游戏引擎层（跨平台可复用）
│   │   ├── engine/                  # 游戏引擎核心
│   │   │   ├── GameManager.ts       # 游戏管理器
│   │   │   ├── EventBus.ts          # 事件总线
│   │   │   ├── ScoreSystem.ts       # 积分系统
│   │   │   ├── TimerSystem.ts       # 计时器系统
│   │   │   └── AudioSystem.ts       # 音频系统
│   │   ├── interfaces/              # 核心接口定义
│   │   │   ├── GameModule.ts        # 游戏模块接口
│   │   │   ├── LevelConfig.ts       # 关卡配置接口
│   │   │   ├── GameState.ts         # 游戏状态接口
│   │   │   └── AssetLoader.ts       # 资源加载器接口
│   │   └── utils/                   # 引擎工具函数
│   │       ├── collision.ts         # 碰撞检测
│   │       ├── animation.ts          # 动画工具
│   │       └── math.ts              # 数学工具
│   │
│   ├── games/                       # 具体游戏模块
│   │   ├── drag-drop/               # 拖拽游戏
│   │   │   ├── components/          # 游戏组件
│   │   │   │   ├── DraggableItem.tsx
│   │   │   │   ├── DropZone.tsx
│   │   │   │   └── GameCanvas.tsx
│   │   │   ├── game.ts              # 游戏主逻辑（实现GameModule接口）
│   │   │   ├── config.ts            # 游戏配置
│   │   │   └── assets/              # 游戏资源
│   │   │
│   │   ├── sorting/                  # 排序游戏
│   │   │   ├── components/
│   │   │   ├── game.ts
│   │   │   └── config.ts
│   │   │
│   │   ├── matching/                 # 配对游戏
│   │   │   ├── components/
│   │   │   ├── game.ts
│   │   │   └── config.ts
│   │   │
│   │   ├── puzzle/                   # 拼图游戏
│   │   │   ├── components/
│   │   │   ├── game.ts
│   │   │   └── config.ts
│   │   │
│   │   └── counting/                 # 计数游戏
│   │       ├── components/
│   │       ├── game.ts
│   │       └── config.ts
│   │
│   ├── components/                   # 通用UI组件
│   │   ├── common/                   # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/                   # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── game/                     # 游戏相关UI
│   │       ├── ScoreBoard.tsx
│   │       ├── Timer.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── StarRating.tsx
│   │       └── VictoryScreen.tsx
│   │
│   ├── pages/                        # 页面组件
│   │   ├── Home.tsx                  # 首页
│   │   ├── GameSelect.tsx            # 游戏选择
│   │   ├── LevelSelect.tsx           # 关卡选择
│   │   ├── GamePlay.tsx              # 游戏进行页
│   │   ├── Result.tsx                # 结算页
│   │   ├── Profile.tsx               # 个人中心
│   │   ├── Login.tsx                 # 登录页
│   │   ├── Register.tsx              # 注册页
│   │   └── ParentDashboard.tsx       # 家长控制台
│   │
│   ├── store/                        # 状态管理（Zustand）
│   │   ├── index.ts                  # Store入口
│   │   ├── gameStore.ts              # 游戏状态
│   │   ├── userStore.ts              # 用户状态
│   │   ├── levelStore.ts             # 关卡进度
│   │   └── uiStore.ts                # UI状态
│   │
│   ├── services/                     # API服务层
│   │   ├── api.ts                    # Axios配置
│   │   ├── auth.service.ts           # 认证服务
│   │   ├── user.service.ts           # 用户服务
│   │   ├── game.service.ts           # 游戏服务
│   │   ├── level.service.ts          # 关卡服务
│   │   └── analytics.service.ts      # 统计服务
│   │
│   ├── hooks/                        # 自定义Hooks
│   │   ├── useGame.ts                # 游戏逻辑Hook
│   │   ├── useAuth.ts                # 认证Hook
│   │   ├── useLevel.ts               # 关卡Hook
│   │   ├── useAudio.ts               # 音频Hook
│   │   └── useWindowSize.ts          # 窗口尺寸Hook
│   │
│   ├── utils/                        # 工具函数
│   │   ├── format.ts                 # 格式化工具
│   │   ├── validation.ts             # 表单验证
│   │   ├── storage.ts                # 本地存储封装
│   │   ├── logger.ts                 # 日志工具
│   │   └── constants.ts              # 常量定义
│   │
│   ├── types/                        # TypeScript类型定义
│   │   ├── index.ts                  # 统一导出
│   │   ├── user.ts                   # 用户类型
│   │   ├── game.ts                   # 游戏类型
│   │   ├── api.ts                    # API响应类型
│   │   └── common.ts                 # 通用类型
│   │
│   ├── styles/                       # 样式文件
│   │   ├── global.css                # 全局样式
│   │   ├── variables.css             # CSS变量
│   │   ├── themes/                   # 主题
│   │   │   ├── default.css
│   │   │   └── dark.css
│   │   └── components/               # 组件样式
│   │
│   ├── assets/                       # 资源文件
│   │   ├── images/                   # 图片
│   │   │   ├── common/
│   │   │   └── games/
│   │   ├── sounds/                   # 音效
│   │   │   ├── bgm/
│   │   │   ├── sfx/
│   │   │   └── voice/
│   │   └── fonts/                    # 字体
│   │
│   ├── router/                       # 路由配置
│   │   ├── index.tsx                 # 路由入口
│   │   ├── routes.ts                 # 路由定义
│   │   └── guards.ts                 # 路由守卫
│   │
│   ├── App.tsx                       # 根组件
│   ├── main.tsx                      # 应用入口
│   └── vite-env.d.ts                 # Vite类型声明
│
├── .env                              # 环境变量
├── .env.development
├── .env.production
├── .eslintrc.cjs                     # ESLint配置
├── .prettierrc                       # Prettier配置
├── tsconfig.json                     # TypeScript配置
├── tsconfig.node.json                # Node环境TypeScript配置
├── vite.config.ts                    # Vite配置
├── package.json
├── package-lock.json
└── README.md
```

### 2.2 目录职责说明

#### core/ - 核心游戏引擎层
**设计理念**: 这一层是平台无关的，可以复用到小程序、App等不同平台。

- **engine/**: 游戏引擎核心逻辑
  - `GameManager`: 游戏生命周期管理、模块加载、状态机
  - `EventBus`: 发布订阅模式的事件系统，解耦模块通信
  - `ScoreSystem`: 积分计算、连击奖励、成就系统
  - `TimerSystem`: 游戏计时、倒计时、暂停/恢复
  - `AudioSystem`: 音效管理、BGM播放、音量控制

- **interfaces/**: 核心接口定义，确保模块可插拔
  - 所有游戏模块必须实现 `GameModule` 接口
  - 统一的配置格式 `LevelConfig`
  - 状态定义接口，支持序列化和持久化

- **utils/**: 引擎工具函数
  - 碰撞检测算法
  - 动画插值函数
  - 数学计算工具

#### games/ - 具体游戏模块
每个游戏都是一个独立模块，包含：
- **components/**: React UI组件
- **game.ts**: 实现GameModule接口的游戏逻辑
- **config.ts**: 游戏配置常量
- **assets/**: 游戏专属资源

**重要**: `game.ts` 中的逻辑是纯JS/TS，不依赖React，可迁移到小程序。

#### components/ - UI组件层
- **common/**: 可复用的通用UI组件
- **layout/**: 页面布局组件
- **game/**: 游戏相关的UI组件（分数板、计时器等）

#### store/ - 状态管理
使用Zustand进行轻量级状态管理，每个模块一个store文件。

#### services/ - API服务层
封装所有后端API调用，统一错误处理和请求拦截。

#### hooks/ - 自定义Hooks
封装可复用的逻辑，如游戏状态管理、认证、音频控制等。

#### pages/ - 页面组件
应用的主要页面，通过路由进行导航。

#### types/ - 类型定义
集中管理所有TypeScript类型定义，确保类型安全。

#### styles/ - 样式管理
使用CSS Modules或CSS-in-JS方案，支持主题切换。

#### assets/ - 资源管理
按类型和游戏模块组织资源文件。

---

## 3. 游戏引擎基础接口设计

### 3.1 核心接口定义

#### GameModule - 游戏模块接口

```typescript
/**
 * 游戏模块接口 - 所有游戏必须实现此接口
 * 设计原则：不依赖React，可在小程序复用
 */
export interface GameModule {
  /**
   * 模块唯一标识符
   */
  readonly id: string;
  
  /**
   * 模块名称
   */
  readonly name: string;
  
  /**
   * 模块版本
   */
  readonly version: string;
  
  /**
   * 初始化游戏模块
   * @param config 游戏配置
   * @param eventBus 事件总线（用于模块间通信）
   */
  init(config: GameConfig, eventBus: EventBus): void | Promise<void>;
  
  /**
   * 启动游戏
   */
  start(): void | Promise<void>;
  
  /**
   * 暂停游戏
   */
  pause(): void | Promise<void>;
  
  /**
   * 恢复游戏
   */
  resume(): void | Promise<void>;
  
  /**
   * 重置游戏到初始状态
   */
  reset(): void | Promise<void>;
  
  /**
   * 销毁游戏，释放资源
   */
  destroy(): void | Promise<void>;
  
  /**
   * 获取当前游戏状态
   */
  getState(): GameState;
  
  /**
   * 设置游戏状态（用于恢复存档）
   */
  setState(state: GameState): void | Promise<void>;
  
  /**
   * 处理用户输入
   */
  handleInput(input: GameInput): void;
}
```

#### GameConfig - 游戏配置接口

```typescript
/**
 * 游戏配置接口
 */
export interface GameConfig {
  /**
   * 游戏类型ID
   */
  gameId: string;
  
  /**
   * 关卡配置
   */
  level: LevelConfig;
  
  /**
   * 难度等级 (1-10)
   */
  difficulty: number;
  
  /**
   * 是否允许提示
   */
  allowHints: boolean;
  
  /**
   * 是否启用音效
   */
  enableSound: boolean;
  
  /**
   * 游戏超时时间（秒），0表示无限制
   */
  timeLimit?: number;
  
  /**
   * 自定义配置参数（JSON格式）
   */
  customParams?: Record<string, any>;
}
```

#### LevelConfig - 关卡配置接口

```typescript
/**
 * 关卡配置接口
 */
export interface LevelConfig {
  /**
   * 关卡ID
   */
  levelId: string;
  
  /**
   * 关卡名称
   */
  name: string;
  
  /**
   * 关卡描述
   */
  description?: string;
  
  /**
   * 关卡顺序
   */
  order: number;
  
  /**
   * 目标分数
   */
  targetScore: number;
  
  /**
   * 题目数据（JSON格式，支持不同游戏类型）
   */
  questions: QuestionData[];
  
  /**
   * 关卡奖励配置
   */
  rewards: {
    /**
     * 星级评定标准
     */
    stars: {
      one: number;
      two: number;
      three: number;
    };
    
    /**
     * 奖励物品
     */
    items?: string[];
  };
  
  /**
   * 关卡解锁条件
   */
  unlockCondition?: {
    type: 'level' | 'score' | 'achievement';
    value: number | string;
  };
}

/**
 * 题目数据（使用联合类型支持不同游戏）
 */
export type QuestionData =
  | DragDropQuestion
  | SortingQuestion
  | MatchingQuestion
  | PuzzleQuestion
  | CountingQuestion;

// 各类型题目定义
export interface DragDropQuestion {
  type: 'drag-drop';
  items: Array<{
    id: string;
    label: string;
    imageUrl?: string;
    correctTargetId: string;
  }>;
  dropZones: Array<{
    id: string;
    label: string;
  }>;
}

export interface SortingQuestion {
  type: 'sorting';
  items: Array<{
    id: string;
    label: string;
    imageUrl?: string;
    correctOrder: number;
  }>;
  sortBy: 'size' | 'number' | 'color' | 'alphabetical';
}

export interface MatchingQuestion {
  type: 'matching';
  pairs: Array<{
    id: string;
    left: {
      id: string;
      label: string;
      imageUrl?: string;
    };
    right: {
      id: string;
      label: string;
      imageUrl?: string;
    };
  }>;
}

export interface PuzzleQuestion {
  type: 'puzzle';
  imageUrl: string;
  pieces: number; // 拼图块数 (2x2, 3x3, 4x4)
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CountingQuestion {
  type: 'counting';
  imageUrl: string;
  correctCount: number;
  options: number[];
}
```

#### GameState - 游戏状态接口

```typescript
/**
 * 游戏状态接口（支持序列化和持久化）
 */
export interface GameState {
  /**
   * 游戏ID
   */
  gameId: string;
  
  /**
   * 关卡ID
   */
  levelId: string;
  
  /**
   * 当前状态
   */
  status: 'idle' | 'playing' | 'paused' | 'completed' | 'failed';
  
  /**
   * 当前分数
   */
  score: number;
  
  /**
   * 当前关卡进度（0-1）
   */
  progress: number;
  
  /**
   * 已用时（秒）
   */
  elapsedTime: number;
  
  /**
   * 当前题目索引
   */
  currentQuestionIndex: number;
  
  /**
   * 已完成的题目ID列表
   */
  completedQuestions: string[];
  
  /**
   * 剩余提示次数
   */
  remainingHints: number;
  
  /**
   * 游戏特定数据（JSON格式）
   */
  customData?: Record<string, any>;
  
  /**
   * 时间戳
   */
  timestamp: number;
}
```

#### GameInput - 游戏输入接口

```typescript
/**
 * 游戏输入接口
 */
export interface GameInput {
  /**
   * 输入类型
   */
  type: 'click' | 'drag' | 'drop' | 'key' | 'gesture';
  
  /**
   * 输入坐标（对于触摸/鼠标事件）
   */
  position?: { x: number; y: number };
  
  /**
   * 目标元素ID
   */
  targetId?: string;
  
  /**
   * 拖拽相关数据
   */
  dragData?: {
    itemId: string;
    fromPosition: { x: number; y: number };
    toPosition: { x: number; y: number };
  };
  
  /**
   * 键盘事件数据
   */
  keyData?: {
    code: string;
    shift: boolean;
    ctrl: boolean;
  };
  
  /**
   * 手势数据
   */
  gestureData?: {
    type: 'swipe' | 'pinch' | 'rotate';
    direction?: 'up' | 'down' | 'left' | 'right';
    scale?: number;
    rotation?: number;
  };
}
```

### 3.2 核心类实现

#### GameManager - 游戏管理器

```typescript
/**
 * 游戏管理器 - 管理游戏生命周期和模块加载
 */
export class GameManager {
  private currentModule: GameModule | null = null;
  private eventBus: EventBus;
  private scoreSystem: ScoreSystem;
  private timerSystem: TimerSystem;
  
  constructor() {
    this.eventBus = new EventBus();
    this.scoreSystem = new ScoreSystem(this.eventBus);
    this.timerSystem = new TimerSystem(this.eventBus);
  }
  
  /**
   * 加载游戏模块
   */
  async loadModule(module: GameModule, config: GameConfig): Promise<void> {
    // 卸载当前模块
    if (this.currentModule) {
      await this.currentModule.destroy();
    }
    
    // 初始化新模块
    this.currentModule = module;
    await this.currentModule.init(config, this.eventBus);
    
    // 发送模块加载事件
    this.eventBus.emit('module:loaded', { moduleId: module.id });
  }
  
  /**
   * 启动游戏
   */
  async startGame(): Promise<void> {
    if (!this.currentModule) {
      throw new Error('No game module loaded');
    }
    
    await this.currentModule.start();
    this.timerSystem.start();
    this.eventBus.emit('game:started');
  }
  
  /**
   * 暂停游戏
   */
  async pauseGame(): Promise<void> {
    if (!this.currentModule) return;
    
    await this.currentModule.pause();
    this.timerSystem.pause();
    this.eventBus.emit('game:paused');
  }
  
  /**
   * 恢复游戏
   */
  async resumeGame(): Promise<void> {
    if (!this.currentModule) return;
    
    await this.currentModule.resume();
    this.timerSystem.resume();
    this.eventBus.emit('game:resumed');
  }
  
  /**
   * 重置游戏
   */
  async resetGame(): Promise<void> {
    if (!this.currentModule) return;
    
    await this.currentModule.reset();
    this.scoreSystem.reset();
    this.timerSystem.reset();
    this.eventBus.emit('game:reset');
  }
  
  /**
   * 销毁游戏管理器
   */
  async destroy(): Promise<void> {
    if (this.currentModule) {
      await this.currentModule.destroy();
      this.currentModule = null;
    }
    
    this.timerSystem.destroy();
    this.eventBus.destroy();
  }
  
  /**
   * 获取事件总线
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }
  
  /**
   * 获取积分系统
   */
  getScoreSystem(): ScoreSystem {
    return this.scoreSystem;
  }
  
  /**
   * 获取计时器系统
   */
  getTimerSystem(): TimerSystem {
    return this.timerSystem;
  }
}
```

---

## 5. 数据库表设计

### 5.1 Prisma Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// 用户相关表
// ============================================================================

/// 用户表
model User {
  id          String    @id @default(cuid())
  username    String    @unique
  email       String    @unique
  password    String    // bcrypt加密
  avatar      String?   // 头像URL
  role        UserRole  @default(USER)
  status      UserStatus @default(ACTIVE)
  
  // 家长账户关联
  parentId    String?
  parent      User?     @relation("ParentChildren", fields: [parentId], references: [id], onDelete: SetNull)
  children    User[]    @relation("ParentChildren")
  
  // 游戏统计
  level       Int       @default(1)
  totalScore  Int       @default(0)
  playCount   Int       @default(0)
  
  // 订阅信息
  subscriptionStatus SubscriptionStatus @default(FREE)
  subscriptionExpiresAt DateTime?
  
  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  lastLoginAt DateTime?
  
  // 关联
  playRecords PlayRecord[]
  levelProgress LevelProgress[]
  
  @@index([email])
  @@index([parentId])
  @@index([role])
  @@map("users")
}

enum UserRole {
  USER        // 普通用户（儿童）
  PARENT      // 家长
  ADMIN       // 管理员
}

enum UserStatus {
  ACTIVE      // 活跃
  INACTIVE    // 非活跃
  BANNED      // 封禁
}

enum SubscriptionStatus {
  FREE        // 免费版
  PREMIUM     // 付费版
  EXPIRED     // 已过期
}

// ============================================================================
// 游戏相关表
// ============================================================================

/// 游戏表
model Game {
  id          String    @id @default(cuid())
  name        String
  description String?
  type        GameType  // 游戏类型
  thumbnail   String?   // 缩略图URL
  
  // 配置
  minLevel    Int       @default(1)
  maxLevel    Int
  difficulty  GameDifficulty @default(EASY)
  
  // 统计
  playCount   Int       @default(0)
  avgScore    Float     @default(0)
  avgTime     Int       @default(0) // 秒
  
  // 状态
  isPublished Boolean   @default(false)
  order       Int       @default(0)
  
  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // 关联
  levels      Level[]
  playRecords PlayRecord[]
  
  @@index([type])
  @@index([isPublished])
  @@index([order])
  @@map("games")
}

enum GameType {
  DRAG_DROP   // 拖拽
  SORTING     // 排序
  MATCHING    // 配对
  PUZZLE      // 拼图
  COUNTING    // 计数
}

enum GameDifficulty {
  EASY
  MEDIUM
  HARD
}

/// 关卡表
model Level {
  id          String    @id @default(cuid())
  gameId      String
  name        String
  description String?
  order       Int       // 关卡顺序
  
  // 配置
  targetScore Int
  timeLimit   Int?      // 秒，null表示无限制
  difficulty  Int       @default(1) // 1-10
  
  // 奖励配置（JSONB）
  rewards     Json      @default("{}")
  
  // 解锁条件（JSONB）
  unlockCondition Json?
  
  // 状态
  isPublished Boolean   @default(false)
  
  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // 关联
  game        Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  questions   Question[]
  levelProgress LevelProgress[]
  playRecords PlayRecord[]
  
  @@unique([gameId, order])
  @@index([gameId])
  @@index([order])
  @@map("levels")
}

/// 题目表
model Question {
  id          String    @id @default(cuid())
  levelId     String
  type        QuestionType
  order       Int       // 题目顺序
  
  // 题目内容（JSONB，支持不同类型题目）
  content     Json
  options     Json?     // 选项（对于选择题）
  
  // 正确答案
  answer      Json
  
  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // 关联
  level       Level     @relation(fields: [levelId], references: [id], onDelete: Cascade)
  
  @@index([levelId])
  @@index([order])
  @@map("questions")
}

enum QuestionType {
  SINGLE_CHOICE    // 单选题
  MULTIPLE_CHOICE  // 多选题
  DRAG_DROP       // 拖拽
  SORTING         // 排序
  MATCHING        // 配对
  PUZZLE          // 拼图
  COUNTING        // 计数
}

// ============================================================================
// 游戏记录表
// ============================================================================

/// 游戏记录表
model PlayRecord {
  id          String    @id @default(cuid())
  userId      String
  gameId      String
  levelId     String
  
  // 游戏结果
  score       Int
  stars       Int       // 1-3星
  timeSpent   Int       // 秒
  status      GameStatus
  
  // 答题详情（JSONB）
  answers     Json
  
  // 自定义数据（JSONB）
  customData  Json?
  
  // 时间戳
  createdAt   DateTime  @default(now())
  
  // 关联
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  game        Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  level       Level     @relation(fields: [levelId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([gameId])
  @@index([levelId])
  @@index([createdAt])
  @@index([userId, gameId])
  @@map("play_records")
}

enum GameStatus {
  COMPLETED
  FAILED
  TIMEOUT
  ABANDONED
}

/// 关卡进度表
model LevelProgress {
  id          String    @id @default(cuid())
  userId      String
  levelId     String
  
  // 进度
  isUnlocked  Boolean   @default(false)
  bestScore   Int       @default(0)
  bestStars   Int       @default(0)
  playCount   Int       @default(0)
  
  // 时间戳
  firstPlayedAt DateTime?
  lastPlayedAt DateTime?
  updatedAt   DateTime  @updatedAt
  createdAt   DateTime  @default(now())
  
  // 关联
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  level       Level     @relation(fields: [levelId], references: [id], onDelete: Cascade)
  
  @@unique([userId, levelId])
  @@index([userId])
  @@index([levelId])
  @@map("level_progress")
}

// ============================================================================
// 订阅表（预留）
// ============================================================================

/// 订阅表
model Subscription {
  id          String    @id @default(cuid())
  userId      String
  
  // 订阅信息
  plan        SubscriptionPlan
  status      SubscriptionStatus
  
  // 时间
  startDate   DateTime  @default(now())
  endDate     DateTime
  
  // 支付信息（预留）
  paymentId   String?
  amount      Decimal?
  
  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
  @@map("subscriptions")
}

enum SubscriptionPlan {
  MONTHLY
  QUARTERLY
  YEARLY
}

// ============================================================================
// AI报告表（预留）
// ============================================================================

/// AI分析报告表
model AIReport {
  id          String    @id @default(cuid())
  userId      String
  playRecordId String?   // 关联游戏记录
  
  // 报告类型
  reportType  AIReportType
  
  // 分析结果（JSONB）
  analysis    Json
  
  // 建议
  suggestions Json?
  
  // 时间戳
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId])
  @@index([playRecordId])
  @@index([reportType])
  @@map("ai_reports")
}

enum AIReportType {
  LEARNING_PROGRESS     // 学习进度
  STRENGTH_WEAKNESS     // 优势与弱点
  PERSONALIZED_SUGGESTION // 个性化建议
  DIFFICULTY_ADJUSTMENT // 难度调整
}

// ============================================================================
// 审计日志表
// ============================================================================

/// 审计日志表
model AuditLog {
  id          String    @id @default(cuid())
  userId      String?
  action      String
  resource    String?
  details     Json?
  
  // 请求信息
  method      String?
  path        String?
  ip          String?
  userAgent   String?
  
  // 时间戳
  createdAt   DateTime  @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 5.2 索引设计说明

#### 1. 用户表 (users)
- **email**: 唯一索引，用于登录查询
- **parentId**: 普通索引，用于查询家长的孩子列表
- **role**: 普通索引，用于按角色筛选用户

#### 2. 游戏表 (games)
- **type**: 普通索引，用于按游戏类型筛选
- **isPublished**: 普通索引，用于查询已发布游戏
- **order**: 普通索引，用于排序

#### 3. 关卡表 (levels)
- **gameId**: 普通索引，用于查询游戏的所有关卡
- **order**: 普通索引，用于关卡排序
- **唯一索引 (gameId, order)**: 确保同一游戏中关卡顺序唯一

#### 4. 题目表 (questions)
- **levelId**: 普通索引，用于查询关卡的所有题目
- **order**: 普通索引，用于题目排序

#### 5. 游戏记录表 (play_records)
- **userId**: 普通索引，用于查询用户游戏历史
- **gameId**: 普通索引，用于查询游戏的所有记录
- **levelId**: 普通索引，用于查询关卡的所有记录
- **createdAt**: 普通索引，用于按时间查询记录
- **复合索引 (userId, gameId)**: 用于查询用户在特定游戏中的记录

#### 6. 关卡进度表 (level_progress)
- **userId**: 普通索引，用于查询用户所有关卡进度
- **levelId**: 普通索引，用于查询关卡所有用户进度
- **唯一索引 (userId, levelId)**: 确保用户对每个关卡只有一条进度记录

#### 7. 订阅表 (subscriptions)
- **userId**: 普通索引，用于查询用户订阅
- **status**: 普通索引，用于查询有效订阅

#### 8. AI报告表 (ai_reports)
- **userId**: 普通索引，用于查询用户AI报告
- **playRecordId**: 普通索引，用于关联游戏记录
- **reportType**: 普通索引，用于按报告类型筛选

#### 9. 审计日志表 (audit_logs)
- **userId**: 普通索引，用于查询用户操作日志
- **action**: 普通索引，用于按操作类型筛选
- **createdAt**: 普通索引，用于按时间查询日志

### 5.3 字段设计说明

#### 用户表 (users)
- **id**: 使用CUID（Collision-resistant Unique Identifier），比UUID更短且有序
- **password**: 使用bcrypt加密，存储hash值而非明文
- **role**: 枚举类型，区分普通用户、家长和管理员
- **level/totalScore/playCount**: 用于游戏进度和成就系统
- **subscriptionStatus/subscriptionExpiresAt**: 用于订阅管理

#### 关卡表 (levels)
- **rewards**: JSONB类型，存储星级评定标准、奖励物品等
- **unlockCondition**: JSONB类型，存储解锁条件（如完成前置关卡、达到目标分数）
- **timeLimit**: 可为null，表示无时间限制

#### 题目表 (questions)
- **content/answer/options**: 使用JSONB类型，支持不同类型的题目结构
- **order**: 题目在关卡中的顺序

#### 游戏记录表 (play_records)
- **answers**: JSONB类型，存储用户答题详情
- **customData**: JSONB类型，存储游戏特定数据
- **status**: 枚举类型，区分完成、失败、超时、放弃

#### 关卡进度表 (level_progress)
- **bestScore/bestStars**: 记录用户最佳成绩
- **playCount**: 记录用户游玩次数

#### AI报告表 (ai_reports)
- **analysis/suggestions**: JSONB类型，存储AI分析结果和建议
- **reportType**: 枚举类型，区分不同类型的报告

### 5.4 JSONB字段示例

#### rewards (Level表)
```json
{
  "stars": {
    "one": 60,
    "two": 80,
    "three": 100
  },
  "items": ["star_badge", "level_complete"],
  "coins": 10
}
```

#### unlockCondition (Level表)
```json
{
  "type": "level",
  "value": "previous_level_id",
  "requiredStars": 2
}
```

#### content (Question表 - 拖拽题目)
```json
{
  "type": "drag-drop",
  "items": [
    {
      "id": "item1",
      "label": "苹果",
      "imageUrl": "https://cdn.example.com/apple.png"
    }
  ],
  "dropZones": [
    {
      "id": "zone1",
      "label": "水果"
    }
  ]
}
```

#### answers (PlayRecord表)
```json
{
  "question1": {
    "userAnswer": "option_a",
    "isCorrect": true,
    "timeSpent": 15
  },
  "question2": {
    "userAnswer": "option_b",
    "isCorrect": false,
    "timeSpent": 20
  }
}
```

#### analysis (AIReport表)
```json
{
  "strengths": ["数学运算", "逻辑思维"],
  "weaknesses": ["注意力集中"],
  "learningSpeed": 0.8,
  "accuracy": 0.75,
  "recommendation": "建议增加专注力训练游戏"
}
```

#### EventBus - 事件总线

```typescript
/**
 * 事件类型定义
 */
export type GameEventType = 
  | 'game:started'
  | 'game:paused'
  | 'game:resumed'
  | 'game:completed'
  | 'game:failed'
  | 'game:reset'
  | 'score:changed'
  | 'level:completed'
  | 'module:loaded'
  | 'question:answered'
  | 'hint:used';

/**
 * 事件监听器类型
 */
type EventListener = (data: any) => void;

/**
 * 事件总线 - 实现发布订阅模式，解耦模块通信
 */
export class EventBus {
  private listeners: Map<GameEventType, Set<EventListener>> = new Map();
  
  /**
   * 订阅事件
   */
  on(event: GameEventType, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // 返回取消订阅函数
    return () => this.off(event, listener);
  }
  
  /**
   * 取消订阅
   */
  off(event: GameEventType, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }
  
  /**
   * 发布事件
   */
  emit(event: GameEventType, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * 只订阅一次
   */
  once(event: GameEventType, listener: EventListener): void {
    const onceListener = (data: any) => {
      listener(data);
      this.off(event, onceListener);
    };
    
    this.on(event, onceListener);
  }
  
  /**
   * 清除所有监听器
   */
  destroy(): void {
    this.listeners.clear();
  }
}
```

#### ScoreSystem - 积分系统

```typescript
/**
 * 积分配置
 */
export interface ScoreConfig {
  basePoints: number;          // 基础分
  timeBonusMultiplier: number;  // 时间加成系数
  comboMultiplier: number;      // 连击加成系数
  maxCombo: number;            // 最大连击数
}

/**
 * 积分系统 - 管理游戏得分、连击、成就
 */
export class ScoreSystem {
  private eventBus: EventBus;
  private currentScore: number = 0;
  private combo: number = 0;
  private config: ScoreConfig = {
    basePoints: 10,
    timeBonusMultiplier: 0.1,
    comboMultiplier: 0.5,
    maxCombo: 10
  };
  
  constructor(eventBus: EventBus, config?: Partial<ScoreConfig>) {
    this.eventBus = eventBus;
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }
  
  /**
   * 增加分数
   */
  addScore(basePoints?: number): void {
    const points = basePoints || this.config.basePoints;
    const comboBonus = this.calculateComboBonus();
    const totalPoints = Math.floor(points + comboBonus);
    
    this.currentScore += totalPoints;
    this.eventBus.emit('score:changed', {
      score: this.currentScore,
      added: totalPoints,
      combo: this.combo
    });
  }
  
  /**
   * 计算连击奖励
   */
  private calculateComboBonus(): number {
    const maxCombo = this.config.maxCombo;
    const normalizedCombo = Math.min(this.combo, maxCombo);
    return Math.floor(
      this.config.basePoints * 
      (normalizedCombo / maxCombo) * 
      this.config.comboMultiplier
    );
  }
  
  /**
   * 增加连击
   */
  incrementCombo(): void {
    this.combo = Math.min(this.combo + 1, this.config.maxCombo);
  }
  
  /**
   * 重置连击
   */
  resetCombo(): void {
    this.combo = 0;
  }
  
  /**
   * 获取当前分数
   */
  getScore(): number {
    return this.currentScore;
  }
  
  /**
   * 获取当前连击数
   */
  getCombo(): number {
    return this.combo;
  }
  
  /**
   * 重置积分系统
   */
  reset(): void {
    this.currentScore = 0;
    this.combo = 0;
  }
}
```

#### TimerSystem - 计时器系统

```typescript
/**
 * 计时器配置
 */
export interface TimerConfig {
  interval: number;  // 更新间隔（毫秒）
  onTick?: (elapsed: number) => void;
  onComplete?: () => void;
}

/**
 * 计时器系统 - 管理游戏时间
 */
export class TimerSystem {
  private eventBus: EventBus;
  private timer: number | null = null;
  private elapsed: number = 0;
  private isRunning: boolean = false;
  private timeLimit: number = 0;  // 0表示无限制
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }
  
  /**
   * 设置时间限制
   */
  setTimeLimit(seconds: number): void {
    this.timeLimit = seconds;
  }
  
  /**
   * 启动计时器
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const startTime = Date.now() - this.elapsed * 1000;
    
    this.timer = window.setInterval(() => {
      this.elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // 检查是否超时
      if (this.timeLimit > 0 && this.elapsed >= this.timeLimit) {
        this.stop();
        this.eventBus.emit('game:failed', { reason: 'timeout' });
      }
    }, 100);
  }
  
  /**
   * 暂停计时器
   */
  pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }
  
  /**
   * 恢复计时器
   */
  resume(): void {
    this.start();
  }
  
  /**
   * 停止计时器
   */
  stop(): void {
    this.pause();
  }
  
  /**
   * 重置计时器
   */
  reset(): void {
    this.stop();
    this.elapsed = 0;
  }
  
  /**
   * 获取已用时间（秒）
   */
  getElapsed(): number {
    return this.elapsed;
  }
  
  /**
   * 获取剩余时间（秒）
   */
  getRemaining(): number {
    if (this.timeLimit === 0) return Infinity;
    return Math.max(0, this.timeLimit - this.elapsed);
  }
  
  /**
   * 是否正在运行
   */
  isActive(): boolean {
    return this.isRunning;
  }
  
  /**
   * 销毁计时器
   */
  destroy(): void {
    this.stop();
  }
}
```

---

## 4. 后端目录结构设计

### 4.1 完整目录树

```
backend/
├── src/
│   ├── main.ts                       # 应用入口
│   ├── app.module.ts                 # 根模块
│   │
│   ├── config/                       # 配置管理
│   │   ├── index.ts                  # 配置入口
│   │   ├── database.config.ts        # 数据库配置
│   │   ├── redis.config.ts           # Redis配置
│   │   ├── jwt.config.ts             # JWT配置
│   │   ├── s3.config.ts              # 对象存储配置
│   │   └── ai.config.ts              # AI服务配置（预留）
│   │
│   ├── common/                       # 公共模块
│   │   ├── decorators/               # 装饰器
│   │   │   ├── roles.decorator.ts    # 角色装饰器
│   │   │   ├── public.decorator.ts   # 公共路由装饰器
│   │   │   └── logger.decorator.ts   # 日志装饰器
│   │   │
│   │   ├── filters/                  # 异常过滤器
│   │   │   ├── http-exception.filter.ts
│   │   │   └── validation.filter.ts
│   │   │
│   │   ├── interceptors/             # 拦截器
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   │
│   │   ├── guards/                   # 守卫
│   │   │   ├── jwt-auth.guard.ts     # JWT认证守卫
│   │   │   ├── roles.guard.ts        # 角色守卫
│   │   │   └── rate-limit.guard.ts   # 限流守卫
│   │   │
│   │   ├── pipes/                    # 管道
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-int.pipe.ts
│   │   │
│   │   ├── middleware/               # 中间件
│   │   │   ├── logger.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   └── helmet.middleware.ts
│   │   │
│   │   ├── utils/                    # 工具函数
│   │   │   ├── crypto.util.ts        # 加密工具
│   │   │   ├── date.util.ts          # 日期工具
│   │   │   ├── string.util.ts        # 字符串工具
│   │   │   └── pagination.util.ts    # 分页工具
│   │   │
│   │   ├── constants/                # 常量定义
│   │   │   ├── index.ts
│   │   │   ├── errors.ts             # 错误常量
│   │   │   └── roles.ts              # 角色常量
│   │   │
│   │   └── dto/                      # 公共DTO
│   │       ├── pagination.dto.ts
│   │       ├── response.dto.ts
│   │       └── error-response.dto.ts
│   │
│   ├── database/                     # 数据库相关
│   │   ├── prisma/                   # Prisma相关
│   │   │   ├── schema.prisma         # 数据库Schema
│   │   │   ├── migrations/           # 迁移文件
│   │   │   └── seed.ts               # 数据填充
│   │   │
│   │   └── repositories/             # 数据访问层
│   │       ├── base.repository.ts    # 基础仓储
│   │       ├── user.repository.ts
│   │       ├── game.repository.ts
│   │       └── analytics.repository.ts
│   │
│   ├── modules/                      # 业务模块
│   │   │
│   │   ├── auth/                     # 认证模块
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   └── logout.dto.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   └── guards/
│   │   │       └── jwt-auth.guard.ts
│   │   │
│   │   ├── user/                     # 用户模块
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   ├── get-user.dto.ts
│   │   │   │   └── user-profile.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── game/                     # 游戏模块
│   │   │   ├── game.module.ts
│   │   │   ├── game.controller.ts
│   │   │   ├── game.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── start-game.dto.ts
│   │   │   │   ├── submit-answer.dto.ts
│   │   │   │   ├── game-progress.dto.ts
│   │   │   │   └── game-result.dto.ts
│   │   │   └── entities/
│   │   │       └── game.entity.ts
│   │   │
│   │   ├── level/                    # 关卡模块
│   │   │   ├── level.module.ts
│   │   │   ├── level.controller.ts
│   │   │   ├── level.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-level.dto.ts
│   │   │   │   ├── update-level.dto.ts
│   │   │   │   └── get-level.dto.ts
│   │   │   └── entities/
│   │   │       └── level.entity.ts
│   │   │
│   │   ├── analytics/                # 数据统计模块
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── play-record.dto.ts
│   │   │   │   ├── statistics.dto.ts
│   │   │   │   └── report.dto.ts
│   │   │   └── entities/
│   │   │       └── analytics.entity.ts
│   │   │
│   │   ├── subscription/             # 订阅模块（预留）
│   │   │   ├── subscription.module.ts
│   │   │   ├── subscription.controller.ts
│   │   │   ├── subscription.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-subscription.dto.ts
│   │   │   │   └── get-subscription.dto.ts
│   │   │   └── entities/
│   │   │       └── subscription.entity.ts
│   │   │
│   │   └── ai/                       # AI模块（预留）
│   │       ├── ai.module.ts
│   │       ├── ai.controller.ts
│   │       ├── ai.service.ts
│   │       ├── dto/
│   │       │   ├── analyze-play.dto.ts
│   │       │   ├── get-suggestion.dto.ts
│   │       │   └── ai-report.dto.ts
│   │       └── entities/
│   │           └── ai-report.entity.ts
│   │
│   ├── admin/                        # 后台管理模块
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   ├── dto/
│   │   │   ├── bulk-create-levels.dto.ts
│   │   │   ├── bulk-create-questions.dto.ts
│   │   │   └── user-management.dto.ts
│   │   └── entities/
│   │       └── admin.entity.ts
│   │
│   └── cache/                        # 缓存模块
│       ├── cache.module.ts
│       ├── cache.service.ts
│       └── decorators/
│           └── cache.decorator.ts
│
├── test/                             # 测试文件
│   ├── unit/
│   ├── e2e/
│   └── fixtures/
│
├── prisma/                           # Prisma配置
│   └── schema.prisma
│
├── logs/                             # 日志目录
│
├── .env                              # 环境变量
├── .env.development
├── .env.production
├── .env.test
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── package-lock.json
├── ts-node.json
└── README.md
```

### 4.2 目录职责说明

#### config/ - 配置管理
集中管理所有配置，使用NestJS的ConfigModule。
- 支持环境变量覆盖
- 配置验证（使用Joi或class-validator）
- 类型安全的配置访问

#### common/ - 公共模块
提供跨模块共享的功能：
- **decorators/**: 自定义装饰器，简化代码
- **filters/**: 全局异常处理，统一错误响应格式
- **interceptors/**: 请求/响应拦截器（日志、转换、缓存）
- **guards/**: 认证和授权守卫
- **pipes/**: 数据验证和转换管道
- **middleware/**: HTTP中间件
- **utils/**: 工具函数库
- **constants/**: 常量定义
- **dto/**: 公共DTO类型

#### database/ - 数据库相关
- **prisma/**: Prisma ORM配置和迁移
- **repositories/**: 数据访问层（Repository模式）
  - 封装Prisma Client
  - 提供复用的查询方法
  - 处理事务

#### modules/ - 业务模块
每个业务模块独立，遵循单一职责原则：

##### auth/ - 认证模块
- JWT访问令牌和刷新令牌
- 密码加密（bcrypt）
- 会话管理
- 令牌刷新机制

##### user/ - 用户模块
- 用户CRUD操作
- 用户资料管理
- 家长账户关联
- 用户状态管理

##### game/ - 游戏模块
- 游戏配置获取
- 游戏进度记录
- 游戏结果提交
- 实时游戏状态同步

##### level/ - 关卡模块
- 关卡CRUD操作
- 关卡解锁逻辑
- 难度配置
- 关卡推荐

##### analytics/ - 数据统计模块
- 游戏记录收集
- 学习数据分析
- 进度统计
- 报告生成

##### subscription/ - 订阅模块（预留）
- 订阅计划管理
- 支付集成
- 订阅状态管理

##### ai/ - AI模块（预留）
- 玩法分析
- 学习建议
- 自适应难度调整
- AI报告生成

#### admin/ - 后台管理模块
- RBAC权限控制
- 批量操作
- 数据导出
- 审计日志

#### cache/ - 缓存模块
- Redis集成
- 缓存装饰器
- 缓存失效策略

### 4.3 模块分层架构

每个业务模块遵循以下分层：

```
Module (模块)
  ├── Controller (控制器)
  │   └── 接收HTTP请求，参数验证
  │
  ├── Service (服务层)
  │   ├── 业务逻辑
  │   ├── 调用Repository
  │   └── 调用其他Service
  │
  ├── DTO (数据传输对象)
  │   ├── CreateDto
  │   ├── UpdateDto
  │   └── QueryDto
  │
  ├── Entity/Model (实体模型)
  │   └── Prisma模型定义
  │
  └── Repository (数据访问层)
      ├── 基础CRUD操作
      ├── 复杂查询
      └── 事务处理
```

### 4.4 DTO设计示例

```typescript
// auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  parentId?: string;  // 关联家长账户
}

// game/dto/start-game.dto.ts
import { IsString, IsNumber, Min, Max } from 'class-validator';

export class StartGameDto {
  @IsString()
  gameId: string;

  @IsString()
  levelId: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  difficulty: number;
}

// analytics/dto/play-record.dto.ts
import { IsString, IsNumber, IsObject } from 'class-validator';

export class CreatePlayRecordDto {
  @IsString()
  userId: string;

  @IsString()
  gameId: string;

  @IsString()
  levelId: string;

  @IsNumber()
  score: number;

  @IsNumber()
  timeSpent: number;  // 秒

  @IsNumber()
  stars: number;

  @IsObject()
  answers: Record<string, any>;

  @IsObject()
  @IsOptional()
  customData?: Record<string, any>;
}
```

### 4.5 Service与Controller分离

```typescript
// user/user.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateProfile(user.id, updateUserDto);
  }

  @Get('children')
  getChildren(@CurrentUser() user: User) {
    return this.userService.getChildren(user.id);
  }
}

// user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
      },
    });
  }

  async getChildren(parentId: string) {
    return this.prisma.user.findMany({
      where: { parentId },
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        totalScore: true,
      },
    });
  }
}
```
