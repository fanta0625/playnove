# PlayNova 项目摘要

> 本文件自动生成于 2026-02-28

## 项目
- **名称**: PlayNova (启玩星球)
- **描述**: 为3-6岁儿童设计的优质教育互动游戏平台
- **技术栈**: React 18 + NestJS + Prisma + PostgreSQL
- **开发阶段**: MVP Phase 5-6（家长控制台已完成）

## 快速导航
- 技术规范：.context/STACK.md
- 架构设计：ARCHITECTURE.md
- 功能详情：FEATURES.md
- 安全规范：SECURITY.md
- MVP 指南：MVP-GUIDE.md
- 权限审查：PERMISSION-AUDIT-REPORT.md
- API 列表：运行 `./scripts/gen-api-list.sh` 获取

## 已实现模块

### 后端 (NestJS)

#### 认证模块 (`backend/src/modules/auth/`)
- ✅ JWT + Refresh Token 双令牌认证
- ✅ bcrypt 密码加密
- ✅ POST /auth/register - 用户注册
- ✅ POST /auth/login - 用户登录
- ✅ POST /auth/refresh - 刷新 Token
- ✅ POST /auth/logout - 用户登出
- ✅ GET /auth/me - 获取当前用户

#### 用户模块 (`backend/src/modules/users/`)
- ✅ GET /users - 获取用户列表
- ✅ GET /users/:id - 获取用户详情
- ✅ GET /users/children - 获取孩子列表
- ✅ POST /users/children - 添加孩子账户
- ✅ PUT /users/:id - 更新用户
- ✅ DELETE /users/children/:id - 删除孩子账户
- ✅ Child 账户权限隔离（只能访问自己的）

#### 游戏模块 (`backend/src/modules/games/`)
- ✅ GET /games - 获取游戏列表
- ✅ GET /games/:id - 获取游戏详情
- ✅ GET /games/:id/levels - 获取关卡列表
- ✅ GET /games/:id/levels/:levelId - 获取关卡详情
- ✅ POST /games/records - 提交游戏记录
- ✅ GET /games/records/me - 我的游戏记录
- ✅ GET /games/stats/me - 我的游戏统计

#### 群组模块 (`backend/src/modules/groups/`)
- ✅ 通用群组系统（支持班级、家庭、兴趣小组、培训班）
- ✅ 自定义角色（班主任、老师、学生、爸爸、妈妈等）
- ✅ 权限控制（canInvite、canAssign）
- ✅ 邀请码机制
- ✅ POST /groups - 创建群组
- ✅ GET /groups/my - 我的群组
- ✅ GET /groups/:id - 群组详情
- ✅ PUT /groups/:id - 更新群组
- ✅ DELETE /groups/:id - 删除群组
- ✅ POST /groups/:groupId/members - 添加成员
- ✅ PUT /groups/:groupId/members/:memberId - 修改成员
- ✅ DELETE /groups/:groupId/members/:memberId - 移除成员
- ✅ POST /groups/:groupId/leave - 退出群组
- ✅ POST /groups/:groupId/invitations - 创建邀请码
- ✅ GET /groups/:groupId/invitations - 邀请码列表
- ✅ POST /groups/invitations/accept/:code - 使用邀请码加入
- ✅ POST /groups/:groupId/tasks - 创建任务
- ✅ GET /groups/:groupId/tasks - 任务列表
- ✅ GET /groups/tasks/:id - 任务详情
- ✅ POST /groups/tasks/:id/submit - 提交任务
- ✅ GET /groups/my-tasks - 我的任务

### 前端 (React + Vite)
- ✅ 认证页面（`frontend/src/pages/Login.tsx`, `Register.tsx`）
- ✅ 首页（`frontend/src/pages/Home.tsx`）
- ✅ 群组列表（`frontend/src/pages/GroupList.tsx`）
- ✅ 群组详情（`frontend/src/pages/GroupDetail.tsx`）
- ✅ 加入群组（`frontend/src/pages/JoinGroup.tsx`）
- ✅ 游戏引擎核心（`frontend/src/core/game/`）
  - GameManager - 游戏生命周期管理
  - EventBus - 事件驱动通信
  - ScoreSystem - 得分与统计
  - DragGame - 拖拽游戏实现

### 数据库 (Prisma)
主要表：
- `users` - 用户表（家长/管理员）
- `children` - 儿童账户表
- `games` - 游戏类型表
- `levels` - 关卡配置表
- `questions` - 题库表
- `play_records` - 游戏记录表
- `groups` - 群组表
- `group_members` - 群组成员表
- `group_invitations` - 邀请码表
- `group_tasks` - 任务表
- `task_submissions` - 任务提交表
- `refresh_tokens` - 刷新令牌表
- `audit_logs` - 审计日志表

Schema 详见: `backend/prisma/schema.prisma`

## 安全机制

### 已实现
- ✅ JWT + Refresh Token 双令牌认证
- ✅ bcrypt 密码加密（salt=10）
- ✅ 基于角色的访问控制（RBAC）
  - `@Roles()` 装饰器
  - `RolesGuard` 守卫
  - 全局角色：USER, PARENT, SUPER_ADMIN
- ✅ 群组权限管理
  - `GroupMemberGuard` - 成员检查
  - `GroupCreatorGuard` - 创建者检查
  - `GroupAdminGuard` - 管理权限检查（canAssign）
- ✅ Child 账户权限隔离
- ✅ 请求限流（60次/分钟）
- ✅ Helmet 安全头
- ✅ CORS 策略配置
- ✅ 输入验证（class-validator）
- ✅ Prisma ORM 防止 SQL 注入

详细安全设计见: `SECURITY.md` 和 `PERMISSION-AUDIT-REPORT.md`

## MVP 阶段约束

### 当前应避免实现（MVP 后考虑）
- ❌ 订阅付费系统
- ❌ AI 分析功能
- ❌ WebSocket 实时通信
- ❌ 邮件服务
- ❌ 微信登录（UI 已预留，待实现）
- ❌ 复杂动画系统（使用 CSS 动画代替）
- ❌ 音频系统（使用 HTML5 Audio 代替）
- ❌ 成就系统
- ❌ 排行榜
- ❌ 多语言支持
- ❌ 主题切换
- ❌ 离线功能
- ❌ 数据导出（Excel/PDF）
- ❌ ELK 日志聚合
- ❌ 负载均衡

### 必须遵守的规范
- ✅ 所有 API 默认需要认证（除登录注册）
- ✅ 使用 `@Public()` 标记公开路由
- ✅ 使用 `@Roles()` 标记角色要求
- ✅ Service 层进行业务逻辑权限检查
- ✅ Guard 层用于路由级别权限控制
- ✅ 统一使用 `user.id`（不是 `user.userId`）
- ✅ Child 账户必须验证 `child.parentId === user.id`

详细 MVP 指南见: `MVP-GUIDE.md`

## 🚧 正在开发

### 用户系统和权限重构
- [ ] 重命名 `children` → `member_profiles`（成员档案）
- [ ] 实现完全自定义层级权限系统
- [ ] 角色模板（RoleTemplate）：自定义角色名
- [ ] 任命权传递（canDelegate）：控制是否可以继续任命下级
- [ ] 权限检查 Guards

**设计要点：**
- `children` → `member_profiles`（更通用）
- `RoleTemplate` 表：存储角色模板（班主任、老师、课代表等）
- `RolePermission` 表：定义每个角色的权限
- `RoleAppointment` 表：定义任命关系 + canDelegate（是否传递任命权）
- `GroupMember.canDelegate`：继承自 RoleAppointment，控制该成员能否继续任命

**示例场景：**
```
班主任 → 任命老师 → canDelegate: true ✅ 老师可继续任命
老师 → 任命课代表 → canDelegate: true ✅ 课代表可继续任命
课代表 → 任命学生 → canDelegate: false ❌ 学生不能任命
```

## 待开发功能（按优先级）

### Phase 6: 优化与测试
- [ ] 性能优化（代码分割、图片懒加载）
- [ ] 单元测试（核心业务逻辑）
- [ ] 集成测试（API 端点）
- [ ] E2E 测试（关键用户流程）
- [ ] API 文档（Swagger）
- [ ] 错误监控（Sentry）

### v1.1 (MVP 后 1 个月)
- [ ] 计数游戏模块
- [ ] 拼图游戏模块
- [ ] 音频系统完善
- [ ] 审计日志系统

### v1.2 (MVP 后 2 个月)
- [ ] 排序游戏模块
- [ ] 排行榜系统
- [ ] 邮件通知
- [ ] Web 端微信扫码登录

### v2.0 (MVP 后 3-6 个月)
- [ ] 微信小程序版本
- [ ] 订阅系统
- [ ] AI 分析功能
- [ ] WebSocket 实时对战

## 技术债务记录

### 高优先级（必须在 v1.1 解决）
1. **错误监控**: 缺少生产环境错误监控（Sentry）
   - 影响: 问题定位困难
   - 工作量: 1 天

2. **API 文档**: Swagger 文档不完整
   - 影响: 团队协作
   - 工作量: 2 天

### 中优先级（v1.2 考虑）
1. **缓存策略**: 当前仅有基础 Redis 缓存
   - 影响: 性能
   - 工作量: 3 天

2. **单元测试覆盖率**: 当前覆盖率不足 50%
   - 影响: 代码质量
   - 工作量: 5 天

## 质量标准

### 性能标准
| 指标 | 目标值 |
|------|--------|
| 首屏加载时间 | < 2s |
| API 响应时间 P95 | < 200ms |
| 页面 FPS | > 55 |
| 数据库查询 P95 | < 50ms |

### 代码质量标准
| 指标 | 目标值 |
|------|--------|
| TypeScript 覆盖率 | 100% |
| ESLint 警告数 | 0 |
| 单元测试覆盖率 | > 60% |

---

**最后更新**: 2026-02-28
