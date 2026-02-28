# 开发环境设置指南

本文档提供三种不同的开发环境设置方案，根据您的需求选择最适合的一种。

---

## 🎯 快速选择指南

| 方案 | 适用人群 | 难度 | 推荐度 |
|------|---------|------|--------|
| **Docker** | 有Docker经验、团队协作 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **本地数据库** | 性能要求高、本地开发 | ⭐⭐⭐ | ⭐⭐⭐ |
| **在线数据库** | 新手学习、快速原型 | ⭐ | ⭐⭐⭐⭐ |

**推荐新手使用：在线数据库方案**
**推荐团队使用：Docker方案**

---

## 方案一：使用Docker（推荐）

### 安装Docker

#### Ubuntu/Debian系统

```bash
# 更新包索引
sudo apt update

# 安装必要的依赖
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加Docker官方GPG密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置Docker仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

#### macOS系统

```bash
# 使用Homebrew安装
brew install --cask docker

# 或者下载Docker Desktop
# 访问 https://www.docker.com/products/docker-desktop
```

#### Windows系统

1. 下载Docker Desktop for Windows
2. 访问 https://www.docker.com/products/docker-desktop
3. 运行安装程序并按照提示完成安装
4. 重启计算机

### 安装后配置

```bash
# 将当前用户添加到docker组（可选但推荐）
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证无需sudo即可运行docker
docker ps
```

### 启动数据库服务

```bash
# 返回项目根目录
cd ~/projects/playnove

# 启动PostgreSQL和Redis
docker compose up -d postgres redis

# 验证容器状态
docker compose ps

# 应该能看到 postgres 和 redis 两个容器的状态都是 Up
```

### 验证数据库连接

```bash
# 测试PostgreSQL连接
docker compose exec postgres pg_isready -U postgres

# 测试Redis连接
docker compose exec redis redis-cli ping
# 应该返回 PONG
```

### 配置项目

```bash
# 配置后端环境变量
cd backend
cp .env.example .env

# .env文件中DATABASE_URL已配置为：
# DATABASE_URL="postgresql://postgres:password@localhost:5432/playnove?schema=public"
```

### 初始化数据库

```bash
cd backend

# 安装依赖
npm install

# 生成Prisma Client
npm run prisma:generate

# 推送Schema到数据库
npm run prisma:push
```

### 启动开发服务器

```bash
# 终端1：启动后端（端口3000）
cd backend
npm run start:dev

# 终端2：启动前端（端口5173）
cd frontend
npm install  # 首次运行
npm run dev
```

访问 http://localhost:5173 查看应用！

---

## 方案二：使用本地PostgreSQL

### 安装PostgreSQL

#### Ubuntu/Debian系统

```bash
# 更新包索引
sudo apt update

# 安装PostgreSQL及其扩展
sudo apt install -y postgresql postgresql-contrib

# 启动PostgreSQL服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 验证安装
sudo -u postgres psql --version
```

#### macOS系统

```bash
# 使用Homebrew安装
brew install postgresql@15
brew services start postgresql@15
```

#### Windows系统

1. 下载PostgreSQL安装程序
2. 访问 https://www.postgresql.org/download/windows/
3. 运行安装程序

### 创建数据库

```bash
# 登录到PostgreSQL
sudo -u postgres psql

# 执行以下SQL命令：
CREATE DATABASE playnove;
CREATE USER playnove_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE playnove TO playnove_user;
ALTER DATABASE playnove OWNER TO playnove_user;

# 退出
\q
```

### 配置项目

```bash
cd backend
cp .env.example .env

# 编辑.env文件，修改DATABASE_URL：
# DATABASE_URL="postgresql://playnove_user:your_secure_password@localhost:5432/playnove?schema=public"
```

### 初始化数据库

```bash
cd backend

# 安装依赖
npm install

# 生成Prisma Client
npm run prisma:generate

# 推送Schema到数据库
npm run prisma:push
```

### 启动开发服务器

```bash
# 终端1：启动后端
cd backend
npm run start:dev

# 终端2：启动前端
cd frontend
npm install  # 首次运行
npm run dev
```

---

## 方案三：使用在线数据库（最简单，推荐新手）

### 推荐的免费在线数据库服务

#### 1. Supabase（推荐）

1. 访问 https://supabase.com
2. 注册账号（免费）
3. 创建新项目
   - 项目名称：playnove
   - 数据库密码：设置强密码
   - 区域：选择最近的区域
4. 等待项目创建完成（约1-2分钟）
5. 在项目设置中获取连接字符串：
   - 进入 Settings > Database
   - 复制 Connection string > URI
   - 格式类似：`postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

#### 2. Neon（推荐）

1. 访问 https://neon.tech
2. 注册账号（免费）
3. 创建新项目
4. 复制提供的连接字符串

### 使用在线数据库启动项目

```bash
# 1. 配置后端环境变量
cd backend
cp .env.example .env

# 编辑.env文件，将DATABASE_URL替换为你的连接字符串
# 例如：DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"

# 2. 安装依赖
cd backend
npm install

cd ../frontend
npm install

# 3. 初始化数据库
cd backend
npm run prisma:generate
npm run prisma:push

# 4. 启动开发服务器（两个终端）
# 终端1：后端
cd backend
npm run start:dev

# 终端2：前端
cd frontend
npm run dev
```

---

## 验证安装

### 检查Node.js版本

```bash
node --version  # 应该 >= 18.0.0
npm --version   # 应该 >= 9.0.0
```

如果Node.js版本过低，访问 https://nodejs.org 下载安装最新LTS版本。

### 检查数据库连接

```bash
# 使用Docker
docker compose ps

# 使用本地PostgreSQL
sudo -u postgres psql -c "SELECT version();"

# 使用在线数据库
# 在数据库管理控制台测试连接
```

### 启动测试

```bash
# 后端
cd backend && npm run start:dev
# 应该看到：Application is running on: http://localhost:3000

# 前端
cd frontend && npm run dev
# 应该看到：Local: http://localhost:5173
```

访问 http://localhost:5173 查看应用

---

## 常见问题

### 问题1：npm install失败

```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题2：端口被占用

```bash
# 查看端口占用
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :3000  # 后端
sudo lsof -i :5173  # 前端

# 结束占用端口的进程
sudo kill -9 [PID]
```

### 问题3：Prisma连接失败

```bash
# 检查DATABASE_URL是否正确
cat backend/.env | grep DATABASE_URL

# 测试数据库连接
cd backend
npx prisma db pull

# 重新生成Prisma Client
npm run prisma:generate
npm run prisma:push
```

### 问题4：Docker容器无法启动

```bash
# 查看容器日志
docker compose logs postgres

# 如果端口被占用，检查5432端口
sudo lsof -i :5432

# 重新启动容器
docker compose restart postgres
```

---

## 常用命令

### Docker管理

```bash
# 启动服务
docker compose up -d postgres redis

# 停止服务
docker compose stop

# 查看日志
docker compose logs -f

# 进入PostgreSQL容器
docker compose exec postgres psql -U postgres

# 完全清理
docker compose down -v
```

### 数据库管理（本地PostgreSQL）

```bash
# 登录PostgreSQL
sudo -u postgres psql

# 查看数据库列表
\l

# 连接到playnove数据库
\c playnove

# 查看表结构
\dt

# 退出
\q
```

### 开发服务器

```bash
# 后端
cd backend
npm run start:dev    # 开发模式
npm run start:prod   # 生产模式

# 前端
cd frontend
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
```

---

## 环境变量说明

### 后端环境变量（backend/.env）

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/playnove?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### 前端环境变量（frontend/.env）

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 一键启动脚本

创建 `start.sh` 脚本：

```bash
#!/bin/bash

echo "🚀 启动PlayNova开发环境..."

# 启动数据库（如果使用Docker）
if command -v docker &> /dev/null; then
    echo "📦 启动PostgreSQL和Redis..."
    docker compose up -d postgres redis
    
    # 等待PostgreSQL就绪
    echo "⏳ 等待PostgreSQL就绪..."
    until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
      sleep 1
    done
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
cd backend
npm run prisma:generate > /dev/null 2>&1
npm run prisma:push > /dev/null 2>&1

echo "✅ 数据库初始化完成！"
echo ""
echo "📝 启动开发服务器："
echo "  终端1: cd backend && npm run start:dev"
echo "  终端2: cd frontend && npm run dev"
echo ""
echo "🌐 访问: http://localhost:5173"
```

添加执行权限：
```bash
chmod +x start.sh
./start.sh
```

---

## 下一步

完成环境设置后：

1. 访问 http://localhost:5173 查看应用
2. 阅读 [README.md](./README.md) 了解项目结构
3. 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解技术架构
4. 阅读 [SECURITY.md](./SECURITY.md) 了解安全设计
5. 开始开发你的第一个游戏模块！

---

**需要帮助？**
- 查看项目 [README.md](./README.md)
- 查看故障排除部分
- 提交 [GitHub Issue](https://github.com/your-org/playnova/issues)
