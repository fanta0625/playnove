# 启玩星球 (PlayNova)

为3-6岁儿童设计的优质教育互动游戏平台

## 简介

PlayNova 是一个儿童教育游戏平台，提供多种类型的益智游戏，帮助儿童在游戏中学习成长。

- 🎮 **多种游戏类型**：拖拽、配对、计数、拼图
- 📚 **关卡系统**：科学的难度递进设计
- 👨‍👩‍👧 **家长账户**：完善的家长监控系统
- 🔒 **安全保障**：JWT认证、权限控制、数据隔离

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **后端**：NestJS + Prisma + PostgreSQL
- **认证**：JWT + Refresh Token
- **游戏引擎**：模块化可插拔设计

## 快速开始

```bash
# 克隆项目
git clone https://github.com/fanta0625/playnove.git
cd playnove

# 一键启动（推荐）
./start.sh

# 或使用 Docker
./docker-start.sh
```

## 项目结构

```
playnove/
├── frontend/          # 前端应用 (React)
├── backend/           # 后端 API (NestJS)
├── .context/          # AI 辅助开发配置
├── .claude/           # Claude Code 配置
└── docker-compose.yml # Docker 编排
```

## 核心功能

### 已实现
- ✅ 用户认证系统 (JWT + Refresh Token)
- ✅ 群组系统（班级、家庭、兴趣小组）
- ✅ 游戏引擎核心框架
- ✅ 拖拽游戏模块
- ✅ 家长控制台
- ✅ 权限管理系统 (RBAC)

### 开发中
- 🚧 更多游戏类型（计数、拼图、排序）
- 🚧 单元测试和集成测试

## 文档

项目使用 AI 辅助开发，关键信息已整合到：

- `.context/SUMMARY.md` - 项目摘要和功能列表
- `.context/STACK.md` - 技术规范和代码风格
- `.claude/CLAUDE.md` - AI 开发约束

## 开发

```bash
# 后端开发
cd backend
npm install
npm run start:dev

# 前端开发
cd frontend
npm install
npm run dev
```

## 许可证

MIT License

---

**启玩星球 - 让每个孩子都能快乐学习！** 🚀
