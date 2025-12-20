# 部署指南 (Deployment Guide)

本文档提供了将 Trace (抽屉) 部署到 Linux 服务器 (如阿里云 ECS) 的多种方案。

## 目录
1. [准备工作](#1-准备工作)
2. [方案 A: 全自动 Shell 脚本 (推荐)](#方案-a-全自动-shell-脚本-推荐)
3. [方案 B: Docker 容器化部署](#方案-b-docker-容器化部署)
4. [方案 C: Systemd 服务托管 (稳定)](#方案-c-systemd-服务托管-稳定)

---

## 1. 准备工作

### 1.1 上传代码到服务器
推荐使用 Git 或 scp/zip 上传。

**方式一：Git (推荐)**
在服务器上：
```bash
git clone https://github.com/your-repo/trace.git
cd trace
```

**方式二：Zip 压缩包上传**
在本地：
```bash
# 压缩代码 (排除 node_modules)
zip -r trace.zip . -x "node_modules/*" ".git/*" "dist/*"
# 上传到服务器 (替换 your-server-ip)
scp trace.zip root@your-server-ip:/root/
```

在服务器上：
```bash
unzip trace.zip -d /root/trace
cd /root/trace
```

### 1.2 准备环境变量
在服务器项目根目录创建 `.env` 文件：
```bash
nano .env
```
填入内容：
```env
VITE_GEMINI_API_KEY=你的GeminiKey
VITE_DASHSCOPE_API_KEY=你的QwenKey
```

---

## 方案 A: 全自动 Shell 脚本 (推荐)

这是一个“一键式”方案，适合快速部署。它会自动安装依赖、构建前端并使用 PM2 启动服务。

1.  **赋予执行权限**：
    ```bash
    chmod +x deploy.sh
    ```

2.  **运行脚本**：
    ```bash
    ./deploy.sh
    ```

3.  **常用管理命令**：
    ```bash
    pm2 list          # 查看服务状态
    pm2 logs drawer-app   # 查看日志
    pm2 stop drawer-app   # 停止服务
    pm2 restart drawer-app # 重启服务
    ```

---

## 方案 B: Docker 容器化部署

适合习惯使用 Docker 的环境，环境隔离性最好。

1.  **构建并启动**：
    ```bash
    # 确保已修改 .env 文件
    docker-compose up -d --build
    ```

2.  **查看日志**：
    ```bash
    docker-compose logs -f
    ```

3.  **停止服务**：
    ```bash
    docker-compose down
    ```

---

## 方案 C: Systemd 服务托管 (稳定)

这是 Linux 系统原生的服务管理方式，无需安装 PM2，开机自启最稳定。

### 1. 快速安装命令 (一键运行)
直接在服务器终端复制并运行以下代码块：

```bash
# 1. 停止并清理旧的 PM2 进程 (如果存在)
if command -v pm2 &> /dev/null; then
    pm2 stop drawer-app 2>/dev/null || true
    pm2 delete drawer-app 2>/dev/null || true
    pm2 save 2>/dev/null || true
fi

# 2. 获取 Node.js 的绝对路径
NODE_EXEC=$(which node)
echo "检测到 Node 路径: $NODE_EXEC"

# 3. 生成 Systemd 配置文件
cat > /etc/systemd/system/drawer.service <<EOF
[Unit]
Description=Drawer App (Trace)
After=network.target

[Service]
# 请确保此处路径正确
WorkingDirectory=$(pwd)
# 启动命令
ExecStart=$NODE_EXEC server/index.js
Environment=NODE_ENV=production
Environment=PORT=8080
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

# 4. 启动服务
systemctl daemon-reload
systemctl enable drawer
systemctl restart drawer

# 5. 查看状态
systemctl status drawer --no-pager

### 3. 访问说明
服务默认运行在 **8080** 端口 (避免运营商拦截 80 端口)。
*   浏览器访问: `http://服务器IP:8080`
*   **关键**：请务必去阿里云/腾讯云控制台 -> 安全组 -> 放行 TCP **8080** 端口。

如果想修改端口，请编辑 `/etc/systemd/system/drawer.service`：
```ini
Environment=PORT=你的端口
```
然后运行 `systemctl daemon-reload && systemctl restart drawer`。
```

### 2. 常用管理命令
```bash
systemctl status drawer    # 查看状态
systemctl restart drawer   # 重启服务
systemctl stop drawer      # 停止服务
journalctl -u drawer -f    # 查看实时日志
```
