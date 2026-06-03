# hermes-agent-cluster-plugin

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Plugin](https://img.shields.io/badge/Plugin-v2.1.0-orange)

**Hermes Agent 分布式集群协调插件** — 一行命令安装，多个 Hermes Agent 实例自动协同工作。

```bash
hermes plugins install HughesCuit/hermes-agent-cluster-plugin
```

---

## 这是什么

一个 [Hermes Agent](https://github.com/nousresearch/hermes-agent) 插件，注册 9 个 `kanban_cluster_*` 工具，实现分布式多节点任务协调。

**纯 Python 实现，不需要 Go 编译，不需要下载二进制。** 安装后重启 Hermes 即可使用。

功能：
- **多节点任务协调** — 主节点分配，工作节点执行
- **能力感知调度** — 按节点能力（coding/gpu/browser 等）自动路由任务
- **任务依赖链** — 工作流自动推进（A→B→C）
- **租约管理** — 防止重复执行
- **故障检测与恢复** — 节点离线自动重调度
- **Web Dashboard** — 实时集群状态可视化
- **Full Hermes Agent Execution** — Workers execute tasks with complete toolset (Phase 3)

---

## 安装

### 方式一：Hermes CLI（推荐）

```bash
# 1. 安装插件
hermes plugins install HughesCuit/hermes-agent-cluster-plugin

# 2. 重启 Hermes Agent
hermes gateway restart

# 3. 验证（在 Hermes 对话中）
# 使用 kanban_cluster_init 工具初始化集群
```

### 方式二：手动安装

```bash
git clone https://github.com/HughesCuit/hermes-agent-cluster-plugin.git
cp -r hermes-agent-cluster-plugin/ ~/.hermes/plugins/hermes-agent-cluster/
hermes gateway restart
```

---

## 快速开始

### 1. 初始化集群（主节点）

```yaml
# ~/.hermes/config.yaml
model:
  provider: custom
  custom_provider: groq
  model: meta-llama/llama-4-scout-17b-16e-instruct
  max_tokens: 4096
  base_url: https://api.groq.com/openai/v1
  api_key: gsk_your_key_here

fallback_model:
  provider: zai
  model: glm-4.7-flash

agent:
  enabled_toolsets:
    - terminal
    - web
    - kanban

plugins:
  enabled:
    - hermes-agent-cluster
```

```bash
# ~/.hermes/.env
HERMES_CLUSTER_AUTO_START=1
HERMES_CLUSTER_PORT=8787
HERMES_CLUSTER_ID=hermes-mesh-cluster
HERMES_CLUSTER_NODE_ID=amy-main
HERMES_CLUSTER_MAIN_ENDPOINT=http://100.66.15.65:8787
GROQ_API_KEY=gsk_your_key_here
GLM_API_KEY=your_zai_key_here
```

### 2. 添加工作节点

在另一台机器上，相同的配置但不同的 `HERMES_CLUSTER_NODE_ID` 和端口。

### 3. 提交任务

```bash
kanban_cluster_submit --title "实现用户认证模块" --requires '["coding"]' --priority 1
```

### 4. 查看集群状态

```bash
kanban_cluster_list
kanban_cluster_nodes
kanban_cluster_status
```

---

## 插件工具

| 工具 | 说明 |
|------|------|
| `kanban_cluster_init` | 初始化集群（创建主节点） |
| `kanban_cluster_join` | 加入已有集群 |
| `kanban_cluster_submit` | 提交任务（自动调度到匹配节点） |
| `kanban_cluster_list` | 查看任务列表 |
| `kanban_cluster_claim` | 认领任务 |
| `kanban_cluster_complete` | 标记任务完成 |
| `kanban_cluster_nodes` | 查看节点状态 |
| `kanban_cluster_heartbeat` | 发送心跳（保持节点在线） |
| `kanban_cluster_status` | 查看集群状态 |
| `kanban_cluster_config` | 获取/更新集群配置 |

---

## Dashboard

插件安装后，访问 `http://<node-ip>:8787/dashboard/` 查看实时集群状态。

---

## 架构

```
┌─────────────────────────────────────────────┐
│                Hermes Agent                  │
│  ┌─────────────────────────────────────────┐│
│  │  hermes_cluster/ (Python)              ││
│  │  ├── state/cluster_store.py (SQLite)   ││
│  │  ├── core/cluster_core.py (调度+工作流) ││
│  │  ├── core/watchdog.py (心跳监控)       ││
│  │  ├── core/recovery.py (故障恢复)       ││
│  │  └── models/ (Pydantic 模型)          ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │  __init__.py (9 个 kanban_cluster_* 工具)││
│  │  dashboard/plugin_api.py (FastAPI 路由)  ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │  dashboard/dist/index.js (React SPA)   ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**没有外部进程，没有 Go 二进制，没有 HTTP 代理。** 所有逻辑在 Hermes Agent 进程内运行，通过 SQLite 持久化。

---

## Provider Configuration

### Groq (Primary)

```yaml
model:
  provider: custom
  custom_provider: groq
  model: meta-llama/llama-4-scout-17b-16e-instruct
  max_tokens: 4096
  base_url: https://api.groq.com/openai/v1
  api_key: gsk_...
```

**IMPORTANT:** Use `model.api_key` (inline), NOT `api_key_env` or `custom_providers:` list. Hermes v0.15.1 bug drops the key in CLI subprocess context.

### Z.ai GLM-4.7-Flash (Fallback)

```yaml
fallback_model:
  provider: zai
  model: glm-4.7-flash
```

- Free tier, 200K context
- Function/tool calling supported
- Disable reasoning: `enable_thinking: false`

---

## 常见问题

### Q: 需要安装 Go 吗？

**不需要。** v2.0.0 起，所有逻辑在 Python 中运行。

### Q: 数据存在哪里？

SQLite 数据库在 `~/.hermes/agent-cluster/cluster.db`，自动创建。

### Q: 多节点怎么通信？

通过 Tailscale 网络 + HTTP API。所有节点必须在同一 Tailscale 网络中。

### Q: Dashboard 看不到？

确认 `HERMES_CLUSTER_STATIC_DIR` 环境变量指向正确的静态文件目录，或检查 `hermes_cluster/static/` 是否存在。

---

## 版本历史

- **v2.1.0** (2026-06-04) — Phase 3: Full Hermes agent execution, Z.ai fallback, provider config fix
- **v2.0.2** (2026-05-14) — Dashboard Config tab fix
- **v2.0.0** (2026-05-16) — Python rewrite, removed Go dependency
- v1.0.0 — Stable release with Go binary

---

## 许可证

MIT License. 详见 [LICENSE](LICENSE)。
