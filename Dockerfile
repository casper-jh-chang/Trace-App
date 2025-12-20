# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm install

# 复制源代码
COPY . .

# 接收构建参数 (API Keys)
ARG VITE_GEMINI_API_KEY
ARG VITE_DASHSCOPE_API_KEY

# 设置环境变量供构建使用
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_DASHSCOPE_API_KEY=$VITE_DASHSCOPE_API_KEY

# 构建前端
RUN npm run build

# 运行阶段
FROM node:20-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 只安装生产依赖
RUN npm install --only=production

# 从构建阶段复制构建好的前端文件
COPY --from=builder /app/dist ./dist

# 复制后端代码
COPY --from=builder /app/server ./server

# 创建数据目录（用于持久化 SQLite 数据库）
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_FILE=/app/data/drawer.db

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
