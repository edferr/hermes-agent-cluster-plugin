"""
hermes-agent-cluster dashboard plugin — backend API routes.

Mounts at /api/plugins/agent-cluster/ via the Hermes Dashboard plugin system.
Proxies requests to the hermes-cluster Go service.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# Default cluster endpoint (can be overridden via POST /config)
_CLUSTER_ENDPOINT = "http://127.0.0.1:8787"


def _proxy(method: str, path: str, data: dict = None) -> Any:
    """Proxy an API call to the hermes-cluster Go service."""
    url = f"{_CLUSTER_ENDPOINT}{path}"
    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, timeout=10) as resp:
            raw = resp.read().decode()
            if raw.strip():
                return json.loads(raw)
            return {}
    except URLError as e:
        raise HTTPException(status_code=502, detail=f"Cluster proxy error: {e.reason}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cluster proxy error: {e}")


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------


class ConfigBody(BaseModel):
    endpoint: str


@router.post("/config")
async def set_config(body: ConfigBody):
    """Set the hermes-cluster Go service endpoint URL."""
    global _CLUSTER_ENDPOINT
    _CLUSTER_ENDPOINT = body.endpoint.rstrip("/")
    logger.info("Cluster endpoint set to %s", _CLUSTER_ENDPOINT)
    return {"ok": True, "endpoint": _CLUSTER_ENDPOINT}


@router.get("/config")
async def get_config():
    """Get the current hermes-cluster Go service endpoint URL."""
    return {"ok": True, "endpoint": _CLUSTER_ENDPOINT}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@router.get("/health")
async def health():
    """Check if the cluster service is reachable."""
    try:
        result = _proxy("GET", "/api/v1/nodes")
        return {"ok": True, "nodes": len(result) if isinstance(result, list) else 0}
    except HTTPException:
        return {"ok": False, "error": "Cluster service unreachable"}


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------


@router.get("/nodes")
async def list_nodes():
    """List all cluster nodes."""
    return _proxy("GET", "/api/v1/nodes")


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


@router.get("/tasks")
async def list_tasks():
    """List all cluster tasks."""
    return _proxy("GET", "/api/v1/tasks")


# ---------------------------------------------------------------------------
# Leases
# ---------------------------------------------------------------------------


@router.get("/leases")
async def list_leases():
    """List all active leases."""
    return _proxy("GET", "/api/v1/leases")


# ---------------------------------------------------------------------------
# Global Status
# ---------------------------------------------------------------------------


@router.get("/status")
async def get_status(
    node: str = "",
    status: str = "",
    capability: str = "",
):
    """Get global cluster status view with optional filters."""
    params = []
    if node:
        params.append(f"node={node}")
    if status:
        params.append(f"status={status}")
    if capability:
        params.append(f"capability={capability}")
    qs = "?" + "&".join(params) if params else ""
    return _proxy("GET", f"/api/v1/status{qs}")


# ---------------------------------------------------------------------------
# Cluster Visualization
# ---------------------------------------------------------------------------


@router.get("/topology")
async def get_topology():
    """Get cluster topology."""
    return _proxy("GET", "/api/v1/cluster/topology")


@router.get("/cluster-metrics")
async def get_cluster_metrics():
    """Get aggregated cluster metrics."""
    return _proxy("GET", "/api/v1/cluster/metrics")


@router.get("/timeline")
async def get_timeline():
    """Get cluster event timeline."""
    return _proxy("GET", "/api/v1/cluster/timeline")


# ---------------------------------------------------------------------------
# Workflow Graph
# ---------------------------------------------------------------------------


@router.get("/workflow/graph")
async def get_workflow_graph():
    """Get workflow dependency graph."""
    return _proxy("GET", "/api/v1/workflow/graph")
