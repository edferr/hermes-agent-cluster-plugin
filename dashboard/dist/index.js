/**
 * hermes-agent-cluster Dashboard Plugin
 *
 * Hermes Plugin SDK Component for the Cluster Management tab.
 * Loaded by Hermes Admin UI via dashboard/manifest.json entry.
 *
 * Usage with SDK:
 *   window.__HERMES_PLUGIN_SDK__ — React, hooks, components, api, fetchJSON
 *   window.__HERMES_PLUGINS__.register('agent-cluster', Component)
 */
(function () {
  'use strict';

  var SDK = window.__HERMES_PLUGIN_SDK__;
  if (!SDK) {
    console.warn('[agent-cluster] Plugin SDK not found — skipping registration');
    return;
  }

  var React = SDK.React;
  var h = React.createElement;
  var hooks = SDK.hooks;
  var comp = SDK.components;
  var utils = SDK.utils;
  var fetchJSON = SDK.fetchJSON;

  // -----------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------

  var styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    },
    stat: {
      fontSize: '1.8rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    statLabel: {
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      opacity: 0.6,
      marginTop: '4px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.8rem',
    },
    th: {
      textAlign: 'left',
      padding: '8px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      fontWeight: 500,
      textTransform: 'uppercase',
      fontSize: '0.65rem',
      letterSpacing: '0.08em',
      opacity: 0.5,
    },
    td: {
      padding: '8px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      verticalAlign: 'middle',
    },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontWeight: 500,
    },
    badgeOnline: { background: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    badgeDegraded: { background: 'rgba(234,179,8,0.15)', color: '#eab308' },
    badgeOffline: { background: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    badgePending: { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    badgeRunning: { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
    badgeCompleted: { background: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    badgeFailed: { background: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    badgeBlocked: { background: 'rgba(234,179,8,0.15)', color: '#eab308' },
    capChip: {
      display: 'inline-block',
      padding: '1px 6px',
      margin: '1px 4px 1px 0',
      borderRadius: '3px',
      fontSize: '0.65rem',
      background: 'rgba(255,255,255,0.06)',
    },
    sectionTitle: {
      fontSize: '0.8rem',
      fontWeight: 600,
      marginBottom: '8px',
      letterSpacing: '0.04em',
    },
  };

  // -----------------------------------------------------------------------
  // Helper Components
  // -----------------------------------------------------------------------

  function StatusBadge(type, value) {
    var style = Object.assign({}, styles.badge);
    if (type === 'node') {
      if (value === 'online') Object.assign(style, styles.badgeOnline);
      else if (value === 'degraded') Object.assign(style, styles.badgeDegraded);
      else Object.assign(style, styles.badgeOffline);
    } else if (type === 'task') {
      if (value === 'completed') Object.assign(style, styles.badgeCompleted);
      else if (value === 'running' || value === 'assigned') Object.assign(style, styles.badgeRunning);
      else if (value === 'failed') Object.assign(style, styles.badgeFailed);
      else if (value === 'blocked') Object.assign(style, styles.badgeBlocked);
      else Object.assign(style, styles.badgePending);
    }
    return h('span', { style: style }, value);
  }

  function CapChips(caps) {
    if (!caps || caps.length === 0) return h('span', { style: { opacity: 0.4, fontSize: '0.7rem' } }, '—');
    return h('span', null,
      caps.map(function (c) { return h('span', { key: c, style: styles.capChip }, c); })
    );
  }

  function StatCard(label, value, color) {
    return h(comp.Card, null,
      h(comp.CardContent, null,
        h('div', { style: { padding: '4px 0' } },
          h('div', { style: Object.assign({}, styles.stat, color ? { color: color } : {}) },
            typeof value === 'number' ? value.toLocaleString() : (value || '—')
          ),
          h('div', { style: styles.statLabel }, label)
        )
      )
    );
  }

  function EmptyState(msg) {
    return h('div', {
      style: {
        textAlign: 'center',
        padding: '40px 20px',
        opacity: 0.4,
        fontSize: '0.85rem',
      }
    }, msg || 'No data');
  }

  // -----------------------------------------------------------------------
  // Main Dashboard Component
  // -----------------------------------------------------------------------

  function ClusterDashboard() {
    var state = hooks.useState({
      status: null,
      nodes: null,
      tasks: null,
      leases: null,
      config: null,
      loading: true,
      error: null,
      editEndpoint: false,
      endpointInput: '',
    });
    var status = state[0];
    var setState = state[1];
    var s = function (k) { return status[k]; };

    var refresh = hooks.useCallback(function () {
      setState(function (prev) { return Object.assign({}, prev, { loading: true, error: null }); });

      var base = '/api/plugins/agent-cluster';
      Promise.all([
        fetchJSON(base + '/status').catch(function (e) { return null; }),
        fetchJSON(base + '/nodes').catch(function (e) { return null; }),
        fetchJSON(base + '/tasks').catch(function (e) { return null; }),
        fetchJSON(base + '/leases').catch(function (e) { return null; }),
        fetchJSON(base + '/config').catch(function (e) { return null; }),
      ]).then(function (results) {
        setState(function (prev) {
          return Object.assign({}, prev, {
            status: results[0],
            nodes: results[1],
            tasks: results[2],
            leases: results[3],
            config: results[4],
            loading: false,
            error: null,
            endpointInput: results[4] && results[4].endpoint ? results[4].endpoint : prev.endpointInput,
          });
        });
      }).catch(function (err) {
        setState(function (prev) {
          return Object.assign({}, prev, { loading: false, error: err.message || 'Failed to load cluster data' });
        });
      });
    }, []);

    hooks.useEffect(function () { refresh(); }, []);

    // --- Config Endpoint ---
    var saveEndpoint = function () {
      var ep = status.endpointInput;
      fetchJSON('/api/plugins/agent-cluster/config', {
        method: 'POST',
        body: JSON.stringify({ endpoint: ep }),
        headers: { 'Content-Type': 'application/json' },
      }).then(function (r) {
        setState(function (prev) { return Object.assign({}, prev, { editEndpoint: false, config: r }); });
        refresh();
      }).catch(function (err) {
        console.warn('[agent-cluster] Failed to save endpoint:', err);
      });
    };

    // --- Connection status ---
    var isConnected = status && status.status && status.status.ok === true;
    var statusData = isConnected && status.status;

    // Render
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' } },

      // === Header + Config ===
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('div', null,
          h('h2', { style: { margin: 0, fontSize: '1.2rem', fontWeight: 600 } }, 'Cluster Dashboard'),
          status.config && h('div', { style: { fontSize: '0.7rem', opacity: 0.5, marginTop: '4px' } },
            'Endpoint: ', status.config.endpoint || 'http://127.0.0.1:8787'
          ),
        ),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
          status.editEndpoint ? (function () {
            return h(React.Fragment, null,
              h(comp.Input, {
                value: status.endpointInput,
                onChange: function (e) {
                  setState(function (p) { return Object.assign({}, p, { endpointInput: e.target.value }); });
                },
                placeholder: 'http://host:port',
                style: { width: '220px' },
              }),
              h(comp.Button, { size: 'sm', onClick: saveEndpoint }, 'Save'),
              h(comp.Button, {
                size: 'sm',
                variant: 'ghost',
                onClick: function () { setState(function (p) { return Object.assign({}, p, { editEndpoint: false }); }); }
              }, 'Cancel'),
            );
          })() : h(comp.Button, {
            size: 'sm',
            variant: 'ghost',
            onClick: function () { setState(function (p) { return Object.assign({}, p, { editEndpoint: true }); }); }
          }, '⚙ Configure'),

          h(comp.Button, {
            size: 'sm',
            onClick: refresh,
            disabled: status.loading,
          }, status.loading ? '↻ Loading...' : '↻ Refresh'),
        )
      ),

      // === Error Banner ===
      status.error ? h('div', {
        style: {
          padding: '12px 16px',
          borderRadius: '6px',
          background: 'rgba(239,68,68,0.1)',
          color: '#ef4444',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }
      },
        h('span', null, '⚠ ', status.error),
        h(comp.Button, {
          size: 'sm',
          variant: 'ghost',
          onClick: function () { setState(function (p) { return Object.assign({}, p, { error: null }); }); }
        }, '✕'),
      ) : null,

      // === Not Connected ===
      !status.loading && !statusData && !status.error ? h(comp.Card, null,
        h(comp.CardContent, { style: { textAlign: 'center', padding: '40px' } },
          h('div', { style: { fontSize: '2rem', marginBottom: '12px' } }, '🌐'),
          h('div', { style: { fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' } },
            'Cluster Service Not Connected'
          ),
          h('div', { style: { fontSize: '0.8rem', opacity: 0.6, marginBottom: '16px' } },
            'Make sure hermes-cluster is running, then configure the endpoint above.'
          ),
          h(comp.Button, { size: 'sm', onClick: function () {
            setState(function (p) { return Object.assign({}, p, { editEndpoint: true }); });
          }}, 'Configure Endpoint'),
        )
      ) : null,

      // === Summary Cards ===
      statusData ? (function () {
        var summary = statusData.summary || {};
        var totalTasks = summary.total_tasks || 0;
        var tasksByStatus = summary.tasks_by_status || {};

        return h(React.Fragment, null,

          h('div', { style: styles.grid },
            StatCard('Nodes Online', (summary.online_nodes || 0) + ' / ' + (summary.total_nodes || 0), '#22c55e'),
            StatCard('Total Tasks', totalTasks, '#3b82f6'),
            StatCard('Running', tasksByStatus.running || tasksByStatus.assigned || 0, '#8b5cf6'),
            StatCard('Completed', tasksByStatus.completed || 0, '#22c55e'),
            StatCard('Pending', tasksByStatus.pending || tasksByStatus.ready || 0, '#3b82f6'),
            StatCard('Active Leases', summary.active_leases || 0, '#eab308'),
          ),

          // === Nodes Table ===
          status.nodes && status.nodes.length > 0 ? h(comp.Card, null,
            h(comp.CardHeader, null,
              h(comp.CardTitle, { style: { fontSize: '0.9rem' } }, 'Nodes (', status.nodes.length, ')'),
            ),
            h(comp.CardContent, { style: { padding: 0, overflowX: 'auto' } },
              h('table', { style: styles.table },
                h('thead', null,
                  h('tr', null,
                    h('th', { style: styles.th }, 'Name'),
                    h('th', { style: styles.th }, 'Status'),
                    h('th', { style: styles.th }, 'Capabilities'),
                    h('th', { style: styles.th }, 'Heartbeat'),
                  )
                ),
                h('tbody', null,
                  status.nodes.map(function (node) {
                    var hb = node.last_heartbeat ? utils.isoTimeAgo ? utils.isoTimeAgo(node.last_heartbeat) : node.last_heartbeat : '—';
                    return h('tr', { key: node.id },
                      h('td', { style: styles.td },
                        h('div', null, node.name || node.id),
                        h('div', { style: { fontSize: '0.65rem', opacity: 0.4 } }, node.id),
                      ),
                      h('td', { style: styles.td }, StatusBadge('node', node.status)),
                      h('td', { style: styles.td }, CapChips(node.capabilities)),
                      h('td', { style: Object.assign({}, styles.td, { fontSize: '0.7rem', opacity: 0.6 }) }, hb),
                    );
                  })
                )
              )
            )
          ) : null,

          // === Tasks Table ===
          status.tasks && status.tasks.length > 0 ? h(comp.Card, null,
            h(comp.CardHeader, null,
              h(comp.CardTitle, { style: { fontSize: '0.9rem' } }, 'Tasks (', status.tasks.length, ')'),
            ),
            h(comp.CardContent, { style: { padding: 0, overflowX: 'auto' } },
              h('table', { style: styles.table },
                h('thead', null,
                  h('tr', null,
                    h('th', { style: styles.th }, 'ID'),
                    h('th', { style: styles.th }, 'Title'),
                    h('th', { style: styles.th }, 'Status'),
                    h('th', { style: styles.th }, 'Assigned To'),
                    h('th', { style: styles.th }, 'Requires'),
                    h('th', { style: styles.th }, 'Dependencies'),
                  )
                ),
                h('tbody', null,
                  status.tasks.map(function (task) {
                    var deps = task.depends_on && task.depends_on.length > 0 ? task.depends_on.join(', ') : '—';
                    return h('tr', { key: task.id },
                      h('td', { style: Object.assign({}, styles.td, { fontFamily: 'monospace', fontSize: '0.7rem' }) },
                        task.id
                      ),
                      h('td', { style: styles.td }, task.title || '—'),
                      h('td', { style: styles.td }, StatusBadge('task', task.status)),
                      h('td', { style: Object.assign({}, styles.td, { fontSize: '0.75rem' }) },
                        task.assigned_to || '—'
                      ),
                      h('td', { style: styles.td }, CapChips(task.requires)),
                      h('td', { style: Object.assign({}, styles.td, { fontSize: '0.7rem', opacity: 0.7 }) }, deps),
                    );
                  })
                )
              )
            )
          ) : null,

          // === Leases ===
          status.leases && status.leases.length > 0 ? h(comp.Card, null,
            h(comp.CardHeader, null,
              h(comp.CardTitle, { style: { fontSize: '0.9rem' } }, 'Active Leases (', status.leases.length, ')'),
            ),
            h(comp.CardContent, { style: { padding: 0, overflowX: 'auto' } },
              h('table', { style: styles.table },
                h('thead', null,
                  h('tr', null,
                    h('th', { style: styles.th }, 'Task ID'),
                    h('th', { style: styles.th }, 'Node'),
                    h('th', { style: styles.th }, 'Expires'),
                    h('th', { style: styles.th }, 'Status'),
                  )
                ),
                h('tbody', null,
                  status.leases.map(function (l) {
                    return h('tr', { key: l.id },
                      h('td', { style: Object.assign({}, styles.td, { fontFamily: 'monospace', fontSize: '0.7rem' }) },
                        l.task_id || l.id
                      ),
                      h('td', { style: Object.assign({}, styles.td, { fontSize: '0.75rem' }) },
                        l.node_id || l.owner_node || '—'
                      ),
                      h('td', { style: Object.assign({}, styles.td, { fontSize: '0.7rem', opacity: 0.6 }) },
                        l.lease_until || l.expires_at || '—'
                      ),
                      h('td', { style: styles.td }, StatusBadge('task', l.status || 'active')),
                    );
                  })
                )
              )
            )
          ) : null,
        );
      })() : null,
    );
  }

  // -----------------------------------------------------------------------
  // Register with Hermes Dashboard
  // -----------------------------------------------------------------------

  window.__HERMES_PLUGINS__.register('agent-cluster', ClusterDashboard);
  console.log('[agent-cluster] Dashboard plugin registered');
})();
