# Changelog

All notable changes to hermes-agent-cluster-plugin are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2.1.0] — 2026-06-04

### Added
- **Full Hermes agent task execution**: Poller spawns `hermes chat -q` subprocess per task with full toolset (terminal, web, gbrain-shared-worker, kanban)
- **Z.ai GLM-4.7-Flash fallback provider**: Free tier, 200K context, tool calling verified
- **Provider config fix**: Use `model.api_key` directly instead of `api_key_env` or `custom_providers:` list (Hermes v0.15.1 bug workaround)
- **Removed .env sourcing from plugin**: No longer needed with `model.api_key` in config

### Changed
- Plugin no longer sources `~/.hermes/.env` before `hermes chat` invocation
- Worker configs use `model.api_key` (inline) instead of `api_key_env`
- All 3 nodes configured with Z.ai fallback provider

### Known Issues
- `complete_task` endpoint accepts no result body — structured results not persisted
- Groq tool schema strictness: `watch_patterns` parameter can cause validation errors
- Dashboard requires CDN access (React 18 + Babel loaded from CDN)

---

## [2.0.2] — 2026-05-14

### Fixed
- **Dashboard Config tab blank page**: ConfigPanel `useState` variable shadowing — `var state = state[0]` referenced itself due to JS hoisting. Fixed to `var state = _useState[0]`.

---

## [2.0.0] — 2026-05-16

### Breaking Changes
- **Go binary removed** — plugin no longer requires or downloads the `hermes-cluster` Go binary
- All backend logic now runs in pure Python inside the Hermes Agent process

### Added
- `hermes_cluster/state/cluster_store.py` — persistent SQLite storage layer (WAL mode, thread-safe, 10 tables)
- `hermes_cluster/core/cluster_core.py` — full cluster orchestration
- `hermes_cluster/core/watchdog.py` — heartbeat watchdog
- `hermes_cluster/core/recovery.py` — recovery pipeline
- `hermes_cluster/models/` — Pydantic models
- `dashboard/plugin_api.py` — FastAPI routes
- 186 tests passing

### Removed
- Go binary dependency
- HTTP proxy pattern

---

## [1.0.0] — 2026-05-14

### Added
- Plugin SDK (Webhook)
- Dynamic scheduler
- Multi-cluster federation
- WAN cluster support
- Dashboard configuration panel
