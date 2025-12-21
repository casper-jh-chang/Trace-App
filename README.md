# 抽屉Trace - 你的 AI 找物小帮手

**抽屉Trace**
- **AI 赋能收纳管理**：一款帮助（代替）用户记录并记忆物品存放位置的智能 App。旨在填平收纳者和使用者之间始终存在一道信息鸿沟。收纳完成后，信息应该被共享。通过 AI 智能输入、自动归类与自然语言检索，大幅简化使用流程，以极低的学习成本解决“找不到物品”和“忘记自己拥有哪些物品”的问题。
- **支持特征描述（模糊词）检索**：用户可通过不精确的描述快速定位物品，有效降低记忆与思考负担。
- **适用于多种场景**：面向个人、家庭、职业&团队收纳需求，覆盖日常生活与专业场景。

## ✨ 核心功能

*   **📷 智能记录 (记东西)**
    *   拍摄或上传物品/收纳空间的照片。
    *   **AI 自动分析**：自动识别照片中的物品，并建议所属的空间分类（如“客厅”、“书房”）。
    *   支持手动编辑物品详情和分类。

*   **🔍 自然语言搜索 (找东西)**
    *   **语音/文字交互**：直接问“我的护照在哪里？”或“看看书房里有什么”。
    *   **多模态 AI 回复**：基于已存储的物品数据，AI 智能回答你的问题。

*   **📦 百宝箱 (物品管理)**
    *   可视化管理所有收纳空间和物品。
    *   支持拖拽整理、分类管理、批量操作。

*   **🧠 多模型支持**
    *   支持切换 **Google Gemini** 或 **阿里通义千问 (Qwen)** 作为底层 AI 模型。

## 🛠️ 技术栈

*   **前端**：React 19, TypeScript, Vite, Tailwind CSS
*   **后端**：Node.js, Express
*   **数据库**：SQLite
*   **AI 服务**：Google Generative AI SDK, Alibaba Cloud Qwen SDK

## 🚀 快速开始

### 前置要求

*   Node.js (v18+)
*   npm 或 yarn

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录下创建一个 `.env` 文件（参考 `.env.example` 或根据代码逻辑），并填入你的 AI 模型 API Key：

```env
# Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Alibaba Qwen API Key
VITE_DASHSCOPE_API_KEY=your_qwen_api_key_here
```

### 3. 启动开发服务

Trace 需要同时启动前端和后端服务。

**启动后端 API 服务：**

```bash
npm run server
```
*后端服务默认运行在 `http://localhost:3000`*

**启动前端开发服务器：**

```bash
npm run dev
```
*前端服务默认运行在 `http://localhost:5173`*

现在，访问 `http://localhost:5173` 即可开始使用 Trace。

## 🐳 Docker 部署

本项目包含 Docker 支持，可以一键启动。

```bash
docker-compose up -d
```

这将会启动前端 Nginx 容器和后端 Node.js 容器。

## 📄 许可证

MIT License
