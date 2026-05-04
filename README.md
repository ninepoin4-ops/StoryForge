# StoryForge
<img width="825" height="845" alt="局部截取_20260504_133017" src="https://github.com/user-attachments/assets/2188eca8-650d-4859-a704-00cf3d2cccba" />

AI 短篇小说工坊 — 选定作家风格，生成大纲、创作正文、三轮审查、一键导出。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Python FastAPI + SQLAlchemy (async) + SQLite |
| AI | OpenAI 兼容 API（支持任意模型） |

## 快速启动

```bash
# 1. 安装后端依赖
cd backend
pip install -r requirements.txt

# 2. 安装前端依赖
cd frontend
npm install

# 3. 启动后端（端口 8000）
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# 4. 启动前端（新终端，端口 3000）
cd frontend
npm run dev
```

打开 http://localhost:3000，点击右上角「配置」填入 API Key、Base URL 和模型名。

## 功能流程

1. **标题页** — 输入小说标题、选择作家（51位，经典/现代分类）、设定字数
2. **大纲生成** — AI 生成 3 个大纲方案，含梗概、转折、吸睛钩子
3. **打字机生成** — SSE 流式输出正文，≥24000 字时分段续写
4. **三轮审查** — 吸睛与转折 → 终审点评 → 风格审查，可跳过
5. **浏览导出** — 全文浏览、编辑模式、导出 TXT / Markdown / 长图

## 51 位作家

- **32 位经典**：海明威、张爱玲、鲁迅、马尔克斯、村上春树、金庸、博尔赫斯、卡夫卡、菲茨杰拉德、托尔金、莫言、余华、王小波、古龙、汪曾祺……
- **19 位现代**：马伯庸、猫腻、天下霸唱、周德东、东野圭吾、唐家三少、Priest、八月长安、烽火戏诸侯、匪我思存、蝴蝶蓝、九把刀、尾鱼、步非烟、郭敬明……

每位作家含：角色扮演式 style_prompt、6 维度结构化风格约束（句式/用词/叙事/对话/节奏/禁令）、2 段 few-shot 示例、5 维风格评分标准。

## 项目结构

```
storyforge/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置加载/持久化
│   │   ├── models/              # SQLAlchemy 模型 + Pydantic schema
│   │   ├── prompts/             # 提示词模板
│   │   ├── routers/             # API 路由
│   │   ├── services/            # 业务逻辑（生成/审查/导出）
│   │   └── writers/             # 51 位作家 JSON 配置
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/               # 5 个创作流程页面
│       ├── components/          # 共享组件
│       ├── stores/              # Zustand 状态管理
│       └── services/            # API 调用 + SSE 流处理
├── data/                        # 运行时数据（config.json, SQLite）
├── start-backend.bat
└── start-frontend.bat
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/config` | GET/PUT | 配置管理 |
| `/api/outlines/generate` | POST | AI 生成大纲 |
| `/api/novel/generate` | POST | SSE 流式生成正文 |
| `/api/review` | POST | 执行单轮审查 |
| `/api/optimize` | POST | 根据审查意见优化段落 |
| `/api/polish` | POST | 全文润色 |
| `/api/export` | POST | 导出 TXT/Markdown/长图 |
| `/api/writers` | GET | 获取作家列表 |
| `/api/projects` | GET/POST | 创作历史管理 |
| `/api/projects/{id}` | GET/DELETE | 单个作品操作 |

API 文档：启动后端后访问 http://localhost:8000/docs
