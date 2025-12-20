# 技术架构图 (Architecture Diagram)

```mermaid
graph TD
    User((用户/User))

    subgraph "阿里云 ECS (Ubuntu)"
        subgraph "Docker Container: Nginx"
            Nginx[Nginx 反向代理]
            NginxConf[default.conf]
        end

        subgraph "Docker Container: App"
            subgraph "Frontend (React)"
                UI[React UI 组件]
                Router[路由管理]
                API_Client[API Client]
            end

            subgraph "Backend (Node.js)"
                Express[Express Server]
                Service_AI[AI Service]
                Service_DB[DB Service]
            end
            
            FS[文件系统 File System]
        end
        
        Volume["Docker Volume (Data)"]
        DB[("SQLite: drawer.db")]
    end

    subgraph "External Services"
        Gemini[Google Gemini API]
        Qwen[阿里云 Qwen API]
    end

    %% 连接关系
    User -- "HTTP/HTTPS (Port 80)" --> Nginx
    Nginx -- "Proxy Pass (Port 3001)" --> Express
    
    %% 前后端交互
    UI --> Router
    Router --> API_Client
    API_Client -- "REST API" --> Express
    Express -- "Serve Static Files" --> UI

    %% 后端逻辑
    Express --> Service_AI
    Express --> Service_DB
    
    %% AI 服务调用
    Service_AI -- "Image Analysis / Chat" --> Gemini
    Service_AI -- "Backup / Fallback" --> Qwen

    %% 数据存储
    Service_DB -- "SQL Queries" --> DB
    Volume -.-> DB
    Volume -.-> FS

    %% 样式调整
    classDef container fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef component fill:#fff9c4,stroke:#fbc02d,stroke-width:1px;
    classDef database fill:#e0e0e0,stroke:#616161,stroke-width:2px,stroke-dasharray: 5 5;
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class Nginx,Express,UI container;
    class Service_AI,Service_DB,Router,API_Client component;
    class DB,Volume database;
    class Gemini,Qwen external;
```

## 架构说明

1.  **接入层**: 用户请求首先到达运行在 Docker 中的 **Nginx**，Nginx 负责静态资源缓存配置、请求转发以及端口映射（80 -> 3001）。
2.  **应用层**:
    *   **前端**: React 构建的 SPA (单页应用)，通过 REST API 与后端通信。
    *   **后端**: Express 服务器，负责业务逻辑处理、AI 接口聚合以及数据库操作。
3.  **数据层**: 使用 **SQLite** 本地数据库，通过 Docker Volume 挂载到宿主机，确保持久化存储。
4.  **外部服务**: 集成了 Google Gemini 和 阿里云 Qwen 大模型，用于图片理解和智能对话。
