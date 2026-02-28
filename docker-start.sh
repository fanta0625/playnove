#!/bin/bash

echo "=========================================="
echo "🐳 PlayNova Docker 一键启动"
echo "=========================================="
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo ""
    echo "请先安装Docker："
    echo "  Ubuntu/Debian:"
    echo "    curl -fsSL https://get.docker.com | sh"
    echo "    sudo systemctl start docker"
    echo "    sudo systemctl enable docker"
    echo ""
    exit 1
fi

# 检查用户是否在docker组
if ! groups $USER | grep -q docker; then
    echo "⚠️  警告：当前用户不在docker组"
    echo ""
    echo "需要sudo权限运行Docker命令。"
    echo "建议将用户添加到docker组："
    echo "  sudo usermod -aG docker $USER"
    echo "  newgrp docker"
    echo ""
    echo "或者继续使用sudo运行..."
    COMPOSE_CMD="sudo docker compose"
else
    echo "✅ 用户已在docker组，无需sudo"
    echo ""
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif docker-compose --version &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo "❌ Docker Compose 未安装"
        echo ""
        exit 1
    fi
fi

echo "✅ Docker Compose 已安装"
echo ""

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在"
    echo ""
    echo "请先创建 .env 文件："
    echo "  cp .env.example .env"
    echo ""
    exit 1
fi

echo "✅ 环境变量配置完成"
echo ""

# 停止现有容器
echo "🛑 停止现有容器..."
$COMPOSE_CMD down

# 构建并启动所有服务
echo "🚀 构建并启动所有服务..."
$COMPOSE_CMD up -d --build

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态："
$COMPOSE_CMD ps

echo ""
echo "=========================================="
echo "✅ 所有服务已启动！"
echo "=========================================="
echo ""
echo "🌐 访问地址："
echo ""
echo "   前端应用: http://localhost:3000"
echo "   后端API:  http://localhost:3001"
echo "   Nginx:    http://localhost:8080"
echo "   HTTPS:     https://localhost (需要SSL证书)"
echo ""
echo "📊 数据库信息："
echo ""
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo ""
echo "📋 常用命令："
echo ""
echo "   查看日志: $COMPOSE_CMD logs -f"
echo "   查看状态: $COMPOSE_CMD ps"
echo "   停止服务: $COMPOSE_CMD down"
echo "   重启服务: $COMPOSE_CMD restart"
echo ""
echo "💡 提示："
echo "   - 首次启动可能需要几分钟构建镜像"
echo "   - 如遇到问题，请查看日志: $COMPOSE_CMD logs -f [服务名]"
echo ""
