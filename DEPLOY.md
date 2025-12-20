# 抽屉 (Drawer) 项目部署指南

本指南将帮助你在阿里云 ECS 服务器（推荐 Ubuntu 22.04）上部署本项目。

## 1. 购买并配置服务器

1.  **购买 ECS**：
    *   **操作系统**：选择 Ubuntu 22.04 64位。
    *   **配置**：最低 2核 2G 即可运行。
2.  **配置安全组**：
    *   进入阿里云控制台 -> ECS 实例 -> 安全组。
    *   添加入方向规则，开放以下端口：
        *   `22` (SSH 远程连接)
        *   `80` (HTTP 网页访问)

## 2. 连接服务器

使用 SSH 工具（如 Windows 自带的 CMD/PowerShell，或 Mac 的终端）连接服务器：

```bash
# 将 1.2.3.4 替换为你的服务器公网 IP
ssh root@1.2.3.4
```

## 3. 安装 Docker 环境

在服务器终端中依次执行以下命令：

```bash
# 1. 更新软件源
apt-get update

# 2. 安装 Docker
curl -fsSL https://get.docker.com | bash

# 3. 验证 Docker 是否安装成功
docker --version
# 应该输出 Docker version 20.x.x...

# 4. 安装 Docker Compose (如果上面的命令没有自动安装)
apt-get install -y docker-compose-plugin
```

## 4. 上传代码

你需要将本地的代码上传到服务器。

**方法 A：使用 Git（推荐，最快）**
如果你的代码在 GitHub/GitLab 上：
```bash
git clone <你的仓库地址>
cd <你的项目目录>
```

**方法 B：使用 SCP 直接上传（本地终端执行）**
在你的**本地电脑**的项目根目录下执行：
```bash
# 将代码上传到服务器的 /root/drawer 目录
# 注意：排除 node_modules 和 dist 目录以节省时间
scp -r . root@1.2.3.4:/root/drawer
```

## 5. 启动服务

回到**服务器终端**，进入项目目录并启动：

```bash
# 进入目录
cd /root/drawer

# 启动服务 (后台运行)
docker compose up -d --build
```

等待几分钟，直到构建完成。

## 6. 配置域名解析

1.  去阿里云控制台 -> 域名。
2.  添加一条 `A` 记录：
    *   主机记录：`@` (或 `www`)
    *   记录值：你的服务器公网 IP。

## 7. 访问验证

打开浏览器，访问 `http://你的域名`。
如果看到登录界面或主页，恭喜你，部署成功！

---

## 常用运维命令

```bash
# 查看容器运行状态
docker compose ps

# 查看日志 (排查报错用)
docker compose logs -f

# 停止服务
docker compose down

# 更新代码后重新部署
# 1. 拉取新代码 (如果是 git)
git pull
# 2. 重新构建并启动
docker compose up -d --build
```

## 数据备份

你的数据（数据库文件和图片）保存在服务器的 `/root/drawer/data` 目录下。
建议定期将该目录备份到本地或 OSS。
