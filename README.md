# hermes-agent-cluster-plugin

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Plugin](https://img.shields.io/badge/Plugin-v2.1.0-orange)

**Distributed Cluster Extension for Hermes Agent** — Multi-cloud agent mesh with task coordination, capability-aware scheduling, and fault recovery.

```bash
hermes plugins install HughesCuit/hermes-agent-cluster-plugin
```

---

## What This Is

A [Hermes Agent](https://github.com/nousresearch/hermes-agent) plugin that registers 9 `kanban_cluster_*` tools to enable distributed multi-node task coordination.

**Pure Python implementation.** No Go compilation, no binary downloads required. Just install and restart Hermes.

Features:
- **Multi-node Task Coordination** — Coordinator distributes, workers execute
- **Capability-Aware Scheduling** — Route tasks based on node capabilities (e.g., coding, gpu, browser)
- **Task Dependencies** — Workflows automatically progress through DAGs (A → B → C)
- **Lease Management** — Prevent duplicate execution on multiple nodes
- **Fault Recovery** — Auto-reschedule tasks if a worker node goes offline
- **Web Dashboard** — Real-time visualization of cluster status
- **Full Hermes Agent Execution** — Workers execute tasks with complete toolset (Phase 3)

---

## Installation

### Method 1: Hermes CLI (Recommended)

```bash
# 1. Install the plugin
hermes plugins install HughesCuit/hermes-agent-cluster-plugin

# 2. Restart Hermes Agent
hermes gateway restart

# 3. Verify tool loading
# Use the kanban_cluster_init tool in a chat session to verify
```

### Method 2: Manual Installation

```bash
git clone https://github.com/HughesCuit/hermes-agent-cluster-plugin.git
cp -r hermes-agent-cluster-plugin/ ~/.hermes/plugins/hermes-agent-cluster/
hermes gateway restart
```

---

## Quick Start

### 1. Configure Main Node (Coordinator)

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

### 2. Configure Worker Nodes

Set up the same config on your worker machines, but use a unique `HERMES_CLUSTER_NODE_ID` and different ports if running on the same host/network.

### 3. Submit a Task

```bash
kanban_cluster_submit --title "Implement user authentication" --requires '["coding"]' --priority 1
```

### 4. Check Cluster Status

```bash
kanban_cluster_list
kanban_cluster_nodes
kanban_cluster_status
```

---

## Plugin Tools

| Tool | Description |
|------|-------------|
| `kanban_cluster_init` | Initialize cluster (coordinator node) |
| `kanban_cluster_join` | Join existing cluster (worker node) |
| `kanban_cluster_submit` | Submit task to cluster queue |
| `kanban_cluster_list` | List all tasks |
| `kanban_cluster_claim` | Claim a pending task |
| `kanban_cluster_complete` | Mark task as completed |
| `kanban_cluster_nodes` | List cluster nodes |
| `kanban_cluster_heartbeat` | Send node heartbeat |
| `kanban_cluster_status` | Get cluster status summary |
| `kanban_cluster_config` | Get/update cluster configuration |

---

## Dashboard

Once installed and running, access the real-time cluster visualization dashboard at `http://<node-ip>:8787/dashboard/`.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                Hermes Agent                  │
│  ┌─────────────────────────────────────────┐│
│  │  hermes_cluster/ (Python)              ││
│  │  ├── state/cluster_store.py (SQLite)   ││
│  │  ├── core/cluster_core.py (Scheduler)  ││
│  │  ├── core/watchdog.py (Heartbeat)      ││
│  │  ├── core/recovery.py (Fault Recovery) ││
│  │  └── models/ (Pydantic Models)         ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │  __init__.py (9 kanban_cluster_* tools)  ││
│  │  dashboard/plugin_api.py (FastAPI)      ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │  dashboard/dist/index.js (React SPA)    ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**No external processes, no Go binaries, no HTTP proxies.** All logic runs in-process inside the Hermes Agent gateway, persisting to a local thread-safe SQLite database.

---

## Provider Configuration Note

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

**IMPORTANT:** Use `model.api_key` (inline), NOT `api_key_env` or `custom_providers:` list. Hermes v0.15.1 has a bug where `custom_providers:` with `key_env` silently drops the API key in CLI subprocess context ([GitHub #14065](https://github.com/NousResearch/hermes-agent/issues/14065)).

### Z.ai GLM-4.7-Flash (Fallback)

```yaml
fallback_model:
  provider: zai
  model: glm-4.7-flash
```

- Free tier (both input and output)
- 200K context, 128K max output
- Function/tool calling supported
- Disable reasoning: `enable_thinking: false`

---

## FAQ

### Q: Do I need to install Go?

**No.** Since v2.0.0, all backend logic runs in pure Python.

### Q: Where is the data stored?

In a local SQLite database at `~/.hermes/agent-cluster/cluster.db`.

### Q: How do nodes communicate?

Via HTTP APIs over Tailscale. All nodes must be on the same Tailscale network.

---

## Changelog

- **v2.1.0** (2026-06-04) — Phase 3: Full Hermes agent execution, Z.ai fallback, provider config bug fix
- **v2.0.2** (2026-05-14) — Dashboard Config tab fix
- **v2.0.0** (2026-05-16) — Python rewrite, removed Go dependency
- **v1.0.0** — Stable release with Go binary

---

## License

MIT License. See [LICENSE](LICENSE).
