#!/bin/bash

# 抽屉 (Drawer) 自动化部署脚本 (Shell版)
# 适用于 Ubuntu/Debian/CentOS 等 Linux 环境

# 遇到错误立即停止
set -e

echo "🚀 开始部署抽屉 (Drawer)..."

# 1. 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js (v18+)"
    echo "👉 安装指南: https://github.com/nodesource/distributions"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm，请先安装 npm"
    exit 1
fi

# 2. 检查代码与依赖
echo "📦 正在安装依赖..."
npm install

# 3. 检查并配置环境变量
if [ ! -f .env ]; then
    echo "⚠️ 未检测到 .env 文件"
    if [ -f .env.example ]; then
        echo "📄 正在从 .env.example 创建 .env..."
        cp .env.example .env
        echo "========================================================"
        echo "❌ 请务必编辑 .env 文件填入你的 API Key，然后重新运行此脚本！"
        echo "👉 编辑命令: nano .env"
        echo "========================================================"
        exit 1
    else
        echo "❌ 缺少 .env 配置文件，请手动创建"
        exit 1
    fi
fi

# 4. 构建前端
echo "🏗️ 正在构建前端应用..."
# 注意：Vite 会自动读取 .env 中的 VITE_ 开头的变量
npm run build

# 5. 启动服务 (使用 PM2)
if ! command -v pm2 &> /dev/null; then
    echo "🔧 未检测到 PM2，正在全局安装..."
    npm install -g pm2
fi

echo "🚀 正在启动服务..."

# 停止旧进程（如果存在）
pm2 delete drawer-app 2>/dev/null || true

# 启动新进程
# 直接启动 server/index.js
# 后端会托管 dist/ 目录下的静态文件
pm2 start server/index.js --name "drawer-app"

# 保存当前进程列表，以便重启后自动恢复
pm2 save

# 设置开机自启 (需要用户手动运行输出的命令，这里只提示)
# pm2 startup

echo "========================================================"
echo "✅ 部署完成！"
echo "🌍 服务运行在端口 3001 (或者你在 .env 中配置的端口)"
echo "👉 查看日志: pm2 logs drawer-app"
echo "👉 停止服务: pm2 stop drawer-app"
echo "========================================================"
