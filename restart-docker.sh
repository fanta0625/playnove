#!/bin/bash
# 重启Docker容器脚本

echo "停止现有容器..."
sudo docker compose down

echo "构建并启动容器..."
sudo docker compose up -d --build

echo "等待服务启动..."
sleep 5

echo "检查容器状态..."
sudo docker compose ps

echo ""
echo "=========================================="
echo "服务访问地址："
echo "前端: http://localhost:3000"
echo "后端: http://localhost:3001"
echo "数据库: localhost:5432"
echo "Redis: localhost:6379"
echo "=========================================="
