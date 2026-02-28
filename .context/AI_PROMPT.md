# 通用 AI Prompt（适用于任何 AI 工具）

## 复制以下内容作为新对话的开头

```
我正在开发 PlayNova（儿童教育游戏平台），请按以下规则协助：

## 项目上下文
- 项目摘要：.context/SUMMARY.md
- 技术规范：.context/STACK.md
- 代码规则：.cursorrules 或 .claude/CLAUDE.md

## 工作流程
1. 我说需求 → 你搜索现有代码 → 确认不存在 → 按风格生成

## 示例对话
我：实现用户登录
你：[用 @codebase 或 grep 搜索 login] → [读取现有代码] → [生成]

## 快捷搜索命令
- 搜索 API: `grep -r '@Get\|@Post' backend/src --include='*.ts'`
- 搜索模块: `find backend/src/modules -name '*.ts'`
- 查看模型: `cat backend/prisma/schema.prisma`

## 禁止
- ❌ 不检查直接生成
- ❌ 重复已有功能
- ❌ 改变代码风格
- ❌ 假设数据结构，先查 schema.prisma
```

## 各 AI 工具快捷方式

### Cursor（推荐）
- 内置遵守 .cursorrules
- 使用 @codebase 搜索
- 直接说需求即可

### Claude Code
- 内置遵守 .claude/CLAUDE.md
- 直接说需求即可

### ChatGPT/Claude Web
- 复制上方 Prompt 到新对话
- 粘贴代码时先让 AI 检查

### Continue.dev
- 按 Cmd+Shift+P
- 输入 "Continue: New Context"
- 粘贴 .context/ 的内容
