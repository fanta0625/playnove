# PlayNova 项目摘要

> 本文件自动生成于 2026-02-28

## 项目
- **名称**: PlayNova
- **描述**: 儿童教育游戏平台
- **技术栈**: React 18 + NestJS + Prisma + PostgreSQL

## 快速导航
- 技术规范：.context/STACK.md
- 架构设计：ARCHITECTURE.md
- API 列表：运行 `./scripts/gen-api-list.sh` 获取

## 已实现模块

### 后端 (NestJS)
- ✅ 认证模块 (`backend/src/modules/auth/`)
  - POST /auth/register - 用户注册
  - POST /auth/login - 用户登录
  - POST /auth/refresh - 刷新 Token
  - POST /auth/logout - 用户登出
  - GET /auth/me - 获取当前用户

- ✅ 用户模块 (`backend/src/modules/users/`)
  - GET /users - 获取用户列表
  - GET /users/:id - 获取用户详情
  - PUT /users/:id - 更新用户

- ✅ 游戏模块 (`backend/src/modules/games/`)
  - GET /games - 获取游戏列表
  - GET /games/:id - 获取游戏详情
  - GET /games/:id/levels - 获取关卡列表
  - POST /games/records - 提交游戏记录

- ✅ 群组模块 (`backend/src/modules/groups/`)
  - POST /groups - 创建群组
  - GET /groups - 获取群组列表
  - GET /groups/:id - 获取群组详情
  - POST /groups/:id/join - 加入群组
  - POST /groups/:id/leave - 离开群组

### 前端 (React)
- ✅ 认证页面 (`frontend/src/pages/Login.tsx`, `Register.tsx`)
- ✅ 首页 (`frontend/src/pages/Home.tsx`)
- ✅ 群组相关页面 (`frontend/src/pages/GroupList.tsx`, `GroupDetail.tsx`)

### 数据库 (Prisma)
主要表：users, children, games, levels, questions, play_records, groups, group_members, group_tasks

详细见: `backend/prisma/schema.prisma`

## 待开发功能
- [ ] 文件上传功能
- [ ] WebSocket 实时通信
- [ ] 完善游戏引擎模块
- [ ] 添加单元测试
