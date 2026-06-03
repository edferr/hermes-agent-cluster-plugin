# Contributing to hermes-agent-cluster-plugin

Thank you for your interest in contributing! This guide covers development setup, testing, and pull request process.

---

## Development Setup

### Prerequisites

- Python 3.10+
- Hermes Agent v0.15.1+ installed
- Git
- Tailscale (for multi-node testing)

### Getting Started

```bash
# Clone the repo (or your fork)
git clone https://github.com/HughesCuit/hermes-agent-cluster.git
cd hermes-agent-cluster

# Symlink plugin into Hermes plugins directory
ln -sf $(pwd)/hermes-agent-cluster-plugin ~/.hermes/plugins/hermes-agent-cluster

# Restart Hermes to load development version
hermes gateway restart

# Verify plugin loaded
hermes plugins list
```

---

## Project Structure

```
hermes-agent-cluster-plugin/
├── __init__.py              # Plugin entry — 9 kanban_cluster_* tool handlers
├── plugin.yaml              # Plugin manifest (name, version, hooks)
├── hermes_cluster/          # Python package (editable install)
│   ├── core/
│   │   ├── cluster_core.py  # Cluster orchestration
│   │   ├── watchdog.py       # Heartbeat monitoring
│   │   └── recovery.py       # Fault recovery
│   ├── state/
│   │   └── cluster_store.py  # SQLite persistence (WAL mode)
│   ├── models/              # Pydantic data models
│   ├── routers/             # FastAPI routes
│   ├── plugin.py            # FastAPI server lifecycle
│   └── static/              # Dashboard frontend
└── dashboard/
    ├── plugin_api.py        # FastAPI router for Hermes Dashboard
    └── manifest.json        # Dashboard widget manifest
```

### Key Points

- `__init__.py` defines all 9 `kanban_cluster_*` tool handlers
- The plugin runs as pure Python in the Hermes Agent process (no Go binary)
- No external Python dependencies — uses only standard library + FastAPI (from Hermes)
- Tool schemas follow the JSON Schema format used by Hermes Agent

---

## Code Style

- Python 3.10+ syntax (type hints with `X | None`, `dict`, `list`)
- No external dependencies — use only Python standard library
- Log with `logging.getLogger(__name__)`
- Tool handlers return JSON strings (not dicts)
- Follow existing code patterns in `__init__.py`

---

## Testing

### Manual Testing

```bash
# Restart Hermes to load the plugin
hermes gateway restart

# Test tool registration
# In Hermes chat:
kanban_cluster_init --cluster_id test --role main --node_name my-node
kanban_cluster_submit --title "Test task" --requires '["coding"]' --priority 1
kanban_cluster_list
kanban_cluster_nodes
kanban_cluster_status
```

### With Multiple Nodes

```bash
# Node 1 (coordinator)
HERMES_CLUSTER_PORT=8787 hermes gateway run

# Node 2 (worker)
HERMES_CLUSTER_PORT=8788 HERMES_CLUSTER_MAIN_ENDPOINT=http://node1-ip:8787 hermes gateway run

# Submit task from node 1
kanban_cluster_submit --title "Distributed task"
```

---

## Pull Request Process

1. **Create a branch** from `main`:
```bash
git checkout -b feat/your-feature-name
```

2. **Make changes** following the code style above.

3. **Update documentation** if adding/changing tools or config options:
   - Update `README.md` (English and Chinese sections)
   - Update `CHANGELOG.md` with your changes
   - Update `CONTRIBUTING.md` if process changed

4. **Test manually** with Hermes Agent to verify tools work end-to-end.

5. **Commit** with a clear message:
```bash
git commit -m "feat: add awesome new feature"
```

Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

6. **Push and create a PR**:
```bash
git push origin feat/your-feature-name
```

7. In your PR description:
   - Describe what changed and why
   - Include screenshots if changing Dashboard
   - Reference any related issues

---

## Reporting Issues

Use the GitHub issue templates:
- **Bug Report** — for bugs and unexpected behavior
- **Feature Request** — for new features and improvements

---

## Provider Configuration Note

When adding provider support, use `model.api_key` inline in config, NOT `api_key_env` or `custom_providers:`. Hermes v0.15.1 has a bug where `custom_providers:` with `key_env` silently drops the API key in CLI subprocess context.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.