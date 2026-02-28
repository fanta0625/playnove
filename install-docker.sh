#!/bin/bash

echo "=========================================="
echo "🐳 Docker 安装脚本"
echo "适用于 Debian/Ubuntu 系统"
echo "=========================================="
echo ""

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 sudo 运行此脚本"
    echo ""
    echo "运行命令："
    echo "  sudo bash install-docker.sh"
    echo ""
    exit 1
fi

# 1. 更新包索引并安装必要依赖
echo "📦 更新包索引并安装必要依赖..."
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release

# 2. 创建密钥存放目录并添加 Docker 官方 GPG 密钥
echo "🔑 添加 Docker 官方 GPG 密钥..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# 3. 添加 Docker 仓库源
echo "📚 添加 Docker 仓库源..."
# 注意：这里自动获取你的系统代号 (trixie)，如果官方源暂时没有 trixie 的专用包，
# Docker 官方通常建议暂时使用 "bookworm" (Debian 12) 的包，它们在 trixie 上通常也能完美运行。
# 下面的命令会尝试使用 trixie，如果失败，请参考下方的【备选方案】。
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 再次更新索引以读取新仓库
echo "🔄 更新包索引..."
apt-get update

# 4. 安装 Docker
echo "🐳 安装 Docker..."
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. 启动 Docker 服务
echo "▶️  启动 Docker 服务..."
systemctl start docker
systemctl enable docker

# 6. 验证安装
echo "✅ 验证 Docker 安装..."
docker --version
docker compose version

echo ""
echo "=========================================="
echo "✅ Docker 安装完成！"
echo "=========================================="
echo ""
echo "📋 Docker 版本信息："
echo "  $(docker --version)"
echo "  $(docker compose version)"
echo ""
echo "🚀 快速测试："
echo "  docker run hello-world"
echo ""
echo "📝 下一步："
echo "  返回项目目录运行："
echo "  cd ~/projects/playnove"
echo "  ./start.sh"
echo ""
