# Claude Code 使用指南

## 项目信息
- **名称**: PlayNova
- **描述**: 儿童教育游戏平台
- **技术栈**: React 18 + NestJS + Prisma + PostgreSQL

## 自动检查规则
在执行任务前，你必须自动：
1. 阅读 .context/SUMMARY.md
2. 用 @codebase 或 grep 搜索相关代码
3. 参考 .context/STACK.md

## 我只需要说需求
直接说："实现XXX功能"

你应该自动：
- ✅ 检查是否已存在
- ✅ 参考现有代码风格
- ✅ 生成代码

## 禁止行为
❌ 重复生成已有功能
❌ 不检查直接新建文件
❌ 无视项目代码风格

## 项目快速定位
- 已有 API: `grep -r '@Get\|@Post' backend/src --include='*.ts'`
- 数据模型: `backend/prisma/schema.prisma`
- 架构文档: `ARCHITECTURE.md`
