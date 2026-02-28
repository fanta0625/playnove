#!/bin/bash
# init-ai-dev.sh - AI 辅助开发环境初始化脚本
# 使用方法: ./init-ai-dev.sh "项目名称" "项目描述"

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_NAME=${1:-"PlayNova"}
PROJECT_DESC=${2:-"儿童教育游戏平台"}
TECH_STACK=${3:-"React 18 + NestJS + Prisma + PostgreSQL"}

echo -e "${BLUE}🚀 初始化 AI 辅助开发环境...${NC}"
echo ""

# 创建目录
mkdir -p .context
mkdir -p .claude
mkdir -p .vscode
mkdir -p scripts

# ============================================
# 1. 创建 .cursorrules (Cursor)
# ============================================
cat > .cursorrules << 'EOF'
## AI 辅助开发规则

在编写代码前，你必须：
1. 使用 @codebase 搜索相关功能是否已存在
2. 使用 @Symbols 查看类型定义
3. 阅读现有代码保持风格一致
4. 参考 .context/ 下的文档

## 禁止行为
- ❌ 不要重复生成已有的功能
- ❌ 不要假设数据结构，先查文档
- ❌ 不要改变现有代码风格

## 工作流程
用户说需求 → @codebase 搜索 → 参考现有代码 → 生成新代码

EOF

echo -e "${GREEN}✓ .cursorrules${NC}"

# ============================================
# 2. 创建 CLAUDE.md (Claude Code)
# ============================================
cat > .claude/CLAUDE.md << EOF
# Claude Code 使用指南

## 项目信息
- **名称**: ${PROJECT_NAME}
- **描述**: ${PROJECT_DESC}
- **技术栈**: ${TECH_STACK}

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
- 已有 API: \`grep -r '@Get\|@Post' backend/src --include='*.ts'\`
- 数据模型: \`backend/prisma/schema.prisma\`
- 架构文档: \`ARCHITECTURE.md\`
EOF

echo -e "${GREEN}✓ .claude/CLAUDE.md${NC}"

# ============================================
# 3. 创建 SUMMARY.md
# ============================================
cat > .context/SUMMARY.md << EOF
# ${PROJECT_NAME} 项目摘要

> 本文件自动生成于 $(date +%Y-%m-%d)

## 项目
- **名称**: ${PROJECT_NAME}
- **描述**: ${PROJECT_DESC}
- **技术栈**: ${TECH_STACK}

## 快速导航
- 技术规范：.context/STACK.md
- 架构设计：ARCHITECTURE.md
- API 列表：运行 \`./scripts/gen-api-list.sh\` 获取

## 已实现模块

### 后端 (NestJS)
- ✅ 认证模块 (\`backend/src/modules/auth/\`)
  - POST /auth/register - 用户注册
  - POST /auth/login - 用户登录
  - POST /auth/refresh - 刷新 Token
  - POST /auth/logout - 用户登出
  - GET /auth/me - 获取当前用户

- ✅ 用户模块 (\`backend/src/modules/users/\`)
  - GET /users - 获取用户列表
  - GET /users/:id - 获取用户详情
  - PUT /users/:id - 更新用户

- ✅ 游戏模块 (\`backend/src/modules/games/\`)
  - GET /games - 获取游戏列表
  - GET /games/:id - 获取游戏详情
  - GET /games/:id/levels - 获取关卡列表
  - POST /games/records - 提交游戏记录

- ✅ 群组模块 (\`backend/src/modules/groups/\`)
  - POST /groups - 创建群组
  - GET /groups - 获取群组列表
  - GET /groups/:id - 获取群组详情
  - POST /groups/:id/join - 加入群组
  - POST /groups/:id/leave - 离开群组

### 前端 (React)
- ✅ 认证页面 (\`frontend/src/pages/Login.tsx\`, \`Register.tsx\`)
- ✅ 首页 (\`frontend/src/pages/Home.tsx\`)
- ✅ 群组相关页面 (\`frontend/src/pages/GroupList.tsx\`, \`GroupDetail.tsx\`)

### 数据库 (Prisma)
主要表：users, children, games, levels, questions, play_records, groups, group_members, group_tasks

详细见: \`backend/prisma/schema.prisma\`

## 待开发功能
- [ ] 文件上传功能
- [ ] WebSocket 实时通信
- [ ] 完善游戏引擎模块
- [ ] 添加单元测试
EOF

echo -e "${GREEN}✓ .context/SUMMARY.md${NC}"

# ============================================
# 4. 创建 STACK.md
# ============================================
cat > .context/STACK.md << 'EOF'
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
EOF

echo -e "${GREEN}✓ .context/STACK.md${NC}"

# ============================================
# 5. 创建通用 AI Prompt
# ============================================
cat > .context/AI_PROMPT.md << 'EOF'
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
EOF

echo -e "${GREEN}✓ .context/AI_PROMPT.md${NC}"

# ============================================
# 6. 创建 VSCode snippets
# ============================================
cat > .vscode/ai-prompts.code-snippets << 'EOF'
{
  "AI: 实现功能": {
    "prefix": "ai-new",
    "body": [
      "我要实现：$1",
      "",
      "请先检查 .context/SUMMARY.md 并用 @codebase 搜索相关代码，确认不存在后再实现",
      "",
      "要求：",
      "- 参考 .context/STACK.md 的代码风格",
      "- 遵循 .cursorrules 的规则",
      "- 更新相关的 DTO 和 Service"
    ],
    "description": "让 AI 实现新功能"
  },
  "AI: 修复问题": {
    "prefix": "ai-fix",
    "body": [
      "问题：$1",
      "",
      "请用 @codebase 搜索相关代码并参考 .context/STACK.md 修复这个问题"
    ],
    "description": "让 AI 修复问题"
  },
  "AI: 代码审查": {
    "prefix": "ai-review",
    "body": [
      "请审查以下代码：",
      "",
      "$1",
      "",
      "检查点：",
      "- 安全问题",
      "- 性能问题",
      "- 代码风格是否符合 .context/STACK.md",
      "- 潜在 Bug"
    ],
    "description": "AI 代码审查"
  },
  "AI: 添加测试": {
    "prefix": "ai-test",
    "body": [
      "请为以下代码添加单元测试：",
      "",
      "$1",
      "",
      "使用 Jest，参考项目现有测试风格"
    ],
    "description": "让 AI 生成测试"
  }
}
EOF

echo -e "${GREEN}✓ .vscode/ai-prompts.code-snippets${NC}"

# ============================================
# 7. 创建辅助脚本
# ============================================

# API 检查脚本
cat > scripts/check-api.sh << 'EOF'
#!/bin/bash
# 检查功能是否已存在
echo "🔍 搜索 '$1' 相关代码..."
grep -r "$1" backend/src --include='*.ts' -l 2>/dev/null || echo "✅ 未找到相关代码，可以创建"
EOF
chmod +x scripts/check-api.sh

# API 列出生成脚本
cat > scripts/gen-api-list.sh << 'EOF'
#!/bin/bash
# 生成 API 列表
echo "# API 列表"
echo ""
grep -rh '@Get\|@Post\|@Put\|@Delete\|@Patch' backend/src --include='*.ts' | \
  sed 's/.*@//' | sort | uniq | \
  awk '{print "- " $0}'
EOF
chmod +x scripts/gen-api-list.sh

# 快速查看模块脚本
cat > scripts/list-modules.sh << 'EOF'
#!/bin/bash
# 列出所有模块
echo "📁 后端模块："
find backend/src/modules -maxdepth 1 -type d | tail -n +2 | xargs basename -a
echo ""
echo "📁 前端页面："
ls -1 frontend/src/pages/*.tsx 2>/dev/null | xargs basename -a .tsx | sed 's/^/- /'
EOF
chmod +x scripts/list-modules.sh

echo -e "${GREEN}✓ scripts/*.sh${NC}"

# ============================================
# 8. 创建 README 说明
# ============================================
cat > AI_SETUP_README.md << 'EOF'
# 🎉 AI 辅助开发环境已配置完成！

## 📁 生成的文件

```
项目根目录/
├── .cursorrules                  # Cursor 规则（自动生效）
├── .context/
│   ├── SUMMARY.md                # 项目摘要和已有模块
│   ├── STACK.md                  # 技术规范和代码风格
│   └── AI_PROMPT.md              # 通用 AI Prompt
├── .claude/
│   └── CLAUDE.md                 # Claude Code 规则
├── .vscode/
│   └── ai-prompts.code-snippets  # VSCode 快捷代码片段
├── scripts/
│   ├── check-api.sh              # 检查 API 是否存在
│   ├── gen-api-list.sh           # 生成 API 列表
│   └── list-modules.sh           # 列出所有模块
└── init-ai-dev.sh                # 初始化脚本（可用于其他项目）
```

## 🚀 使用方式

### Cursor 用户（最推荐）
✅ 自动遵守 `.cursorrules`
✅ 直接说需求即可

**示例：**
```
实现用户注册功能
```

Cursor 会自动：
- 搜索现有代码
- 参考代码风格
- 生成符合规范的代码

### 其他 AI 工具

**ChatGPT / Claude Web：**
1. 打开 `.context/AI_PROMPT.md`
2. 复制内容到新对话
3. 开始提问

**Continue.dev：**
1. 按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 `Continue: New Context`
3. 选择 `.context/` 目录添加到上下文

### VSCode 快捷键
输入以下内容后按 `Tab`：
- `ai-new` + Tab → 实现新功能模板
- `ai-fix` + Tab → 修复问题模板
- `ai-review` + Tab → 代码审查模板
- `ai-test` + Tab → 生成测试模板

## 🛠️ 辅助脚本

```bash
# 检查功能是否存在
./scripts/check-api.sh "登录"

# 生成 API 列表
./scripts/gen-api-list.sh

# 查看所有模块
./scripts/list-modules.sh
```

## 📝 首次使用前

完成以下检查：

- [ ] 阅读 `.context/SUMMARY.md` 了解项目结构
- [ ] 阅读 `.context/STACK.md` 了解代码规范
- [ ] (可选) 编辑 `.cursorrules` 添加项目特定规则
- [ ] 测试搜索功能：`./scripts/check-api.sh "auth"`

## 🎯 快速开始

### 方式 1：Cursor（推荐）
直接说需求，例如：
```
实现忘记密码功能，发送重置邮件
```

### 方式 2：其他 AI
1. 复制 `.context/AI_PROMPT.md` 内容
2. 粘贴到 AI 对话
3. 提出你的需求

## ✅ 验证配置

运行以下命令验证：

```bash
# 测试 API 搜索
./scripts/check-api.sh "login"

# 查看已有 API
./scripts/gen-api-list.sh

# 查看所有模块
./scripts/list-modules.sh
```

## 💡 下一步

1. 开始开发，直接向 AI 描述需求
2. 定期更新 `.context/SUMMARY.md` 添加新功能
3. 根据项目发展调整 `.context/STACK.md`

## 🔁 其他项目使用

将 `init-ai-dev.sh` 复制到其他项目：

```bash
# 复制脚本
cp init-ai-dev.sh ~/projects/new-project/
cd ~/projects/new-project
./init-ai-dev.sh "新项目名" "项目描述"

# 或设置全局别名
cp init-ai-dev.sh ~/.local/bin/init-ai-dev
# 然后任何目录都可以运行：init-ai-dev "项目名"
```

---

**🎊 现在开始享受高效的 AI 辅助开发吧！**
EOF

echo -e "${GREEN}✓ AI_SETUP_README.md${NC}"

# ============================================
# 完成
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ AI 辅助开发环境初始化完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📁 生成的文件：${NC}"
echo "  ✓ .cursorrules                (Cursor 规则)"
echo "  ✓ .claude/CLAUDE.md          (Claude Code 规则)"
echo "  ✓ .context/SUMMARY.md        (项目摘要)"
echo "  ✓ .context/STACK.md          (技术规范)"
echo "  ✓ .context/AI_PROMPT.md      (通用 Prompt)"
echo "  ✓ .vscode/ai.code-snippets   (VSCode 片段)"
echo "  ✓ scripts/*.sh               (辅助脚本)"
echo "  ✓ AI_SETUP_README.md         (使用说明)"
echo ""
echo -e "${YELLOW}📖 查看使用说明：${NC}"
echo "  cat AI_SETUP_README.md"
echo ""
echo -e "${YELLOW}🚀 开始使用：${NC}"
echo "  Cursor 用户：直接说需求即可"
echo "  其他用户：查看 .context/AI_PROMPT.md"
echo ""
echo -e "${YELLOW}🧪 验证配置：${NC}"
echo "  ./scripts/gen-api-list.sh    # 生成 API 列表"
echo "  ./scripts/list-modules.sh    # 列出所有模块"
echo ""
