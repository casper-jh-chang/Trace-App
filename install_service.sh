#!/bin/bash

# 抽屉 (Drawer) Systemd 部署脚本
# 请使用 sudo 运行此脚本

set -e

echo "🚀 开始部署抽屉 (Drawer) 到 Systemd..."

# 1. 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js (v18+)"
    exit 1
fi

# 2. 安装依赖与构建
echo "📦 安装依赖..."
npm install

echo "🏗️ 构建前端..."
npm run build

# 3. 获取配置信息
NODE_EXEC=$(which node)
CURRENT_DIR=$(pwd)

echo "📍 项目路径: $CURRENT_DIR"
echo "📍 Node路径: $NODE_EXEC"

# 4. 创建 Systemd 服务文件
echo "⚙️ 配置 Systemd 服务 (端口: 8080)..."
cat > /etc/systemd/system/drawer.service <<EOF
[Unit]
Description=Drawer App (Trace)
After=network.target

[Service]
# 工作目录
WorkingDirectory=$CURRENT_DIR
# 启动命令
ExecStart=$NODE_EXEC server/index.js
# 环境变量
Environment=NODE_ENV=production
Environment=PORT=8080
# 自动重启配置
Restart=always
RestartSec=10
# 运行用户 (默认 root，可根据需要修改)
User=root

[Install]
WantedBy=multi-user.target
EOF

# 5. 启动服务
echo "🚀 正在启动服务..."
systemctl daemon-reload
systemctl enable drawer
systemctl restart drawer

# 6. 验证状态
echo "🔍 检查服务状态..."
systemctl status drawer --no-pager

echo ""
echo "========================================================"
echo "✅ 部署成功！"
echo "🌍 访问地址: http://服务器IP:8080"
echo "📋 常用命令:"
echo "   - 查看日志: journalctl -u drawer -f"
echo "   - 重启服务: systemctl restart drawer"
echo "   - 停止服务: systemctl stop drawer"
echo "========================================================"
