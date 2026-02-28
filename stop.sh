#!/bin/bash

echo "=========================================="
echo "🛑 停止 PlayNova 开发环境"
echo "=========================================="
echo ""

# 停止前后端服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🛑 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🛑 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm logs/frontend.pid
fi

# 强制停止可能残留的进程
pkill -f "nest start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo ""
echo "✅ 开发服务已停止"
echo ""

# 询问是否停止数据库
read -p "是否停止数据库？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 停止数据库..."
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    echo "✅ 数据库已停止"
fi

echo ""
echo "=========================================="
echo "✅ 完成"
echo "=========================================="
