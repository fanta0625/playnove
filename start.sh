#!/bin/bash

set -e  # 遇到错误立即退出
set -u  # 使用未定义变量时报错

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
    cp backend/.env.example backend/.env
    echo "✅ backend/.env文件已创建"
    echo ""
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
(
    cd backend || exit 1

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
)

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    (
        cd frontend || exit 1
        npm install
    )
    echo "✅ 前端依赖安装完成"
    echo ""
fi

echo "=========================================="
echo "✅ 开发环境准备完成！"
echo "=========================================="
echo ""

# 停止可能正在运行的服务
echo "🛑 停止现有服务..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# 启动后端服务（后台）
echo "🚀 启动后端服务..."
cd backend
nohup npm run start:dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# 启动前端服务（后台）
echo "🚀 启动前端服务..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 8

# 检查服务状态
echo ""
echo "📊 服务状态检查："
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ 后端服务运行中 (PID: $BACKEND_PID)"
else
    echo "   ⚠️  后端服务启动中..."
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ 前端服务运行中 (PID: $FRONTEND_PID)"
else
    echo "   ⚠️  前端服务启动中..."
fi

echo ""
echo "=========================================="
echo "🎉 所有服务已启动！"
echo "=========================================="
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
echo "   - 查看后端日志: tail -f logs/backend.log"
echo "   - 查看前端日志: tail -f logs/frontend.log"
echo "   - 停止所有服务: ./stop.sh"
echo "   - 查看数据库日志: $COMPOSE_CMD logs -f postgres redis"
echo "   - 停止数据库: $COMPOSE_CMD down"
echo ""
echo "📚 查看文档："
echo "   README.md        - 项目文档"
echo "   .context/        - AI 开发配置"
echo ""
