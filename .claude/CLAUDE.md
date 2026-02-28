# Claude Code 使用指南

## 项目信息
- **名称**: PlayNova (启玩星球)
- **描述**: 为3-6岁儿童设计的优质教育互动游戏平台
- **技术栈**: React 18 + NestJS + Prisma + PostgreSQL
- **开发阶段**: MVP Phase 5-6（家长控制台已完成）

## 自动检查规则

在执行任务前，你必须自动：
1. ✅ 阅读 `.context/SUMMARY.md` 了解项目状态
2. ✅ 用 `@codebase` 或 `grep` 搜索相关代码确认不存在
3. ✅ 参考 `.context/STACK.md` 的代码风格
4. ✅ 检查 `backend/prisma/schema.prisma` 了解数据模型

## 我只需要说需求
直接说："实现XXX功能"

你应该自动：
- ✅ 检查是否已存在
- ✅ 参考现有代码风格
- ✅ 生成符合规范的代码

## 禁止行为
❌ 重复生成已有功能
❌ 不检查直接新建文件
❌ 无视项目代码风格
❌ 假设数据结构，先查 schema.prisma

## 项目快速定位
- 已有 API: `grep -r '@Get\|@Post' backend/src --include='*.ts'`
- 数据模型: `backend/prisma/schema.prisma`
- 架构文档: `ARCHITECTURE.md`
- 功能详情: `FEATURES.md`
- 安全规范: `SECURITY.md`
- MVP 指南: `MVP-GUIDE.md`

---

## MVP 阶段约束（严格遵守）

### ❌ 当前应避免实现的功能

这些功能在 MVP 后才考虑，现在不要实现：

#### 功能类
- [ ] 订阅付费系统
- [ ] AI 分析功能
- [ ] WebSocket 实时通信
- [ ] 邮件服务
- [ ] 微信登录（UI 已预留，但后端待实现）
- [ ] 数据导出（Excel/PDF）

#### 前端优化类
- [ ] 复杂动画系统（使用 CSS 动画代替）
- [ ] 音频系统（使用 HTML5 Audio 代替）
- [ ] 成就系统
- [ ] 排行榜
- [ ] 多语言支持
- [ ] 主题切换
- [ ] 离线功能

#### 基础设施类
- [ ] ELK 日志聚合（使用本地日志文件）
- [ ] Kibana 可视化
- [ ] 多区域部署
- [ ] 负载均衡
- [ ] 自动扩缩容
- [ ] 消息队列
- [ ] 全文搜索

### ✅ 必须遵守的开发规范

#### 安全规范
1. **所有 API 默认需要认证**
   - 使用 `@UseGuards(JwtAuthGuard)` 保护路由
   - 使用 `@Public()` 标记公开路由（登录、注册）

2. **统一的用户标识**
   - 始终使用 `user.id`（不是 `user.userId`）
   - JWT Strategy 必须正确设置

3. **Child 账户权限隔离**
   - 必须验证 `child.parentId === user.id`
   - 不允许访问其他人的 Child 账户

4. **密码处理**
   - 使用 bcrypt 加密（salt=10）
   - 不要在日志中记录密码

5. **输入验证**
   - 所有 DTO 使用 class-validator
   - 使用 `@IsNotEmpty()`, `@IsEmail()` 等

#### 权限检查规范
- **Guard 层**: 路由级别权限检查
- **Service 层**: 业务逻辑权限检查
- **Controller 层**: 使用装饰器声明权限要求

#### 代码质量规范
- TypeScript 严格模式
- ESLint 无警告
- 统一的错误处理
- 统一的 API 响应格式

---

## 权限系统使用规范

### Guards 使用顺序
```typescript
// 1. 基础认证
@UseGuards(JwtAuthGuard)

// 2. 角色检查
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')

// 3. 群组权限
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@UseGuards(JwtAuthGuard, GroupCreatorGuard)
@UseGuards(JwtAuthGuard, GroupAdminGuard)
```

### 权限检查流程
```
用户请求
    ↓
JwtAuthGuard（验证 JWT）
    ↓
RolesGuard（检查全局角色）
    ↓
GroupMemberGuard（检查群组成员）
    ↓
GroupAdminGuard（检查群组权限）
    ↓
Service 层业务逻辑验证
    ↓
执行操作
```

### 群组权限规范
- **角色**: 自定义字符串（如"班主任"、"爸爸"）
- **权限字段**: `canInvite`（邀请成员）、`canAssign`（管理成员）
- **成员验证**: `GroupMemberGuard`
- **创建者验证**: `GroupCreatorGuard`
- **管理权限**: `GroupAdminGuard`（检查 `canAssign`）

---

## 群组系统快速参考

### 群组类型
- `CLASS` - 班级
- `FAMILY` - 家庭
- `INTEREST` - 兴趣小组
- `TRAINING` - 培训班
- `OTHER` - 其他

### 角色（完全自定义）
- 班级："班主任"、"老师"、"学生"
- 家庭："爸爸"、"妈妈"、"孩子"
- 兴趣小组："组长"、"成员"

### 权限矩阵
| 操作 | 创建者 | canAssign | canInvite | 普通成员 |
|------|--------|-----------|-----------|----------|
| 修改群组 | ✅ | ❌ | ❌ | ❌ |
| 删除群组 | ✅ | ❌ | ❌ | ❌ |
| 添加成员 | ✅ | ✅ | ❌ | ❌ |
| 修改成员 | ✅ | ✅ | ❌ | ❌ |
| 移除成员 | ✅ | ✅ | ❌ | ❌ |
| 创建邀请码 | ✅ | ✅ | ✅ | ❌ |
| 创建任务 | ✅ | ✅ | ✅ | ✅ |
| 提交任务 | ✅ | ✅ | ✅ | ✅ |

### 主要 API
- `POST /groups` - 创建群组
- `GET /groups/my` - 我的群组
- `POST /groups/:groupId/invitations` - 创建邀请码
- `POST /groups/invitations/accept/:code` - 使用邀请码加入
- `POST /groups/:groupId/tasks` - 创建任务

---

## 游戏模块规范

### 数据模型
- `games` - 游戏类型（DRAG, MATCH, COUNT, PUZZLE, SORT）
- `levels` - 关卡配置
- `questions` - 题库（JSON 格式）
- `play_records` - 游戏记录

### 主要 API
- `GET /games` - 获取游戏列表
- `GET /games/:id/levels` - 获取关卡列表
- `POST /games/records` - 提交游戏记录
- `GET /games/stats/me` - 我的游戏统计

### 前端游戏引擎
- `GameManager` - 游戏生命周期管理
- `EventBus` - 事件驱动通信
- `ScoreSystem` - 得分与统计
- 位置：`frontend/src/core/game/`

---

## 数据库快速查询

```bash
# 查看所有表
cat backend/prisma/schema.prisma | grep "model.*{" | sed 's/model //;s/ {//'

# 查看某个表的字段
cat backend/prisma/schema.prisma | grep -A 20 "model User {"

# 搜索某个字段在哪些表
cat backend/prisma/schema.prisma | grep -B 5 "userId"
```

---

## 常用命令

```bash
# 生成 API 列表
./scripts/gen-api-list.sh

# 列出所有模块
./scripts/list-modules.sh

# 检查功能是否存在
./scripts/check-api.sh "功能名"

# 搜索代码
grep -r "关键词" backend/src --include='*.ts'

# 搜索 API 装饰器
grep -r '@Get\|@Post' backend/src --include='*.ts'
```

---

## 文档结构

- `README.md` - 项目概览
- `ARCHITECTURE.md` - 技术架构
- `FEATURES.md` - 功能模块详解
- `SECURITY.md` - 安全设计
- `DEPLOYMENT.md` - 部署指南
- `SETUP.md` - 环境设置
- `MVP-GUIDE.md` - MVP 开发指南
- `PERMISSION-AUDIT-REPORT.md` - 权限审查报告

---

**最后更新**: 2026-02-28
