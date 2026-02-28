#!/bin/bash

echo "=========================================="
echo "🚀 PlayNova 开发环境快速启动"
echo "=========================================="
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo ""
    echo "请先安装Docker："
    echo "  curl -fsSL https://get.docker.com | sh"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    echo ""
    exit 1
fi

# 检查docker compose是否可用
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif docker-compose --version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose 未安装"
    echo ""
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安装"
echo ""

# 启动数据库服务（PostgreSQL和Redis）
echo "📦 启动数据库服务..."
$COMPOSE_CMD up -d postgres redis

echo "⏳ 等待数据库就绪..."
sleep 3

# 检查数据库状态
echo ""
echo "📊 数据库状态："
$COMPOSE_CMD ps postgres redis
echo ""

# 检查backend/.env是否存在
if [ ! -f "backend/.env" ]; then
    echo "📝 创建backend/.env文件..."
    cd backend
    cp .env.example .env
    cd ..
    echo "✅ backend/.env文件已创建"
    echo ""
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
cd backend

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 生成Prisma Client
echo "🔧 生成Prisma Client..."
npm run prisma:generate

# 推送Schema到数据库
echo "📤 推送Schema到数据库..."
npm run prisma:push

echo "✅ 数据库初始化完成"
echo ""

cd ..

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend
    npm install
    cd ..
    echo "✅ 前端依赖安装完成"
    echo ""
fi

echo "=========================================="
echo "✅ 开发环境准备完成！"
echo "=========================================="
echo ""
echo "📝 现在请打开两个终端启动开发服务器："
echo ""
echo "🖥️  终端1（后端）："
echo "   cd backend"
echo "   npm run start:dev"
echo ""
echo "🖥️  终端2（前端）："
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "🌐 访问应用："
echo "   http://localhost:5173"
echo ""
echo "📊 服务地址："
echo "   - 前端: http://localhost:5173"
echo "   - 后端: http://localhost:3000"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "📋 常用命令："
echo "   - 查看数据库日志: $COMPOSE_CMD logs -f postgres redis"
echo "   - 停止数据库: $COMPOSE_CMD down"
echo "   - 重启数据库: $COMPOSE_CMD restart postgres redis"
echo ""
echo "📚 查看文档："
echo "   README.md        - 项目文档"
echo "   QUICK-START.md   - 快速启动指南"
echo "   ARCHITECTURE.md  - 技术架构"
echo ""
