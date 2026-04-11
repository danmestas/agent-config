---
name: signoz-dashboard-builder
description: Use when creating or updating SigNoz dashboards via the MCP API. Triggers on requests to build dashboards, add panels, visualize metrics/logs/traces in SigNoz, or debug dashboard queries that show "No Data" or "Something went wrong". Also use when working with Claude Code telemetry in SigNoz.
---

# SigNoz Dashboard Builder

Build working SigNoz dashboards via the MCP API. This skill encodes hard-won lessons about query formats, filter syntax, and panel configuration that the official docs don't cover.

## Critical: Read MCP Resources First

Before creating or updating any dashboard, read these resources via `ReadMcpResourceTool`:

```
signoz://dashboard/instructions
signoz://dashboard/widgets-instructions
signoz://dashboard/widgets-examples
```

Plus the relevant query-type resource:
- PromQL: `signoz://dashboard/promql-example`
- Query Builder: `signoz://dashboard/query-builder-example`
- ClickHouse SQL: `signoz://dashboard/clickhouse-schema-for-logs`

## Query Builder: What Actually Works

### Use structured `filters`, NOT `filter.expression`

The `filter.expression` string format appears in docs but **does not trigger query execution** in dashboard panels on self-hosted SigNoz. Always use the structured `filters` format:

```json
"filters": {
  "op": "AND",
  "items": [
    {
      "key": {"key": "tool_name", "dataType": "string"},
      "op": "EXISTS",
      "value": ""
    }
  ]
}
```

**Never** use `filter: { expression: "..." }` alone — panels will render but queries won't fire.

### Dotted attribute names break the filter parser

Attributes with dots (e.g., `event.name`, `service.name`, `k8s.pod.name`) cause `key 'name' not found` errors in the search expression parser. The parser splits on `.` and treats the last segment as the key.

**Workaround:** Filter on non-dotted attributes instead. For Claude Code events:
- Use `model EXISTS` instead of `event.name = 'api_request'`
- Use `tool_name EXISTS` instead of `event.name = 'tool_result'`
- Use `prompt_length EXISTS` instead of `event.name = 'user_prompt'`
- Use `speed EXISTS` to identify API request events

If you must filter on a dotted attribute, use ClickHouse SQL queries instead of the query builder.

### `body` column requires special handling

The log `body` field is a top-level column, not a tag attribute. Filtering on it with `CONTAINS` via structured filters needs `isColumn: true`:

```json
{
  "key": {"key": "body", "dataType": "string", "isColumn": true},
  "op": "CONTAINS",
  "value": "claude_code"
}
```

However, this is fragile across SigNoz versions. Prefer filtering on unique attributes instead of body content.

### GroupBy on `body` needs `isColumn: true`

```json
"groupBy": [{"key": "body", "dataType": "string", "type": "tag", "isColumn": true}]
```

## Panel Type Reference

### Value panels (KPIs)
- No `groupBy` — causes multiple values instead of single number
- Best filters: existence checks on unique attributes (`model EXISTS`, `tool_name EXISTS`)

### Pie charts
- **Require** `groupBy` and `legend` with `{{attribute_name}}` syntax
- PromQL pie charts are unreliable — use query builder with logs dataSource

### Bar charts (stacked)
- Set `panelTypes: "bar"`, `isStacked: true`, `stackedBarChart: true`
- Always include `legend` matching `groupBy` keys

### Table panels
- Use `count() as 'Column Name'` for readable column headers
- Include `orderBy: [{"columnName": "#SIGNOZ_VALUE", "order": "desc"}]` for ranked results

### List panels
- **Must** include `selectColumns` with `name`, `fieldContext`, `signal` fields
- Missing `selectColumns` causes **frontend crash** when opening the dashboard editor
- Use `name` (not `key`) in selectColumns

### Graph/timeseries panels
- Include `legend` when `groupBy` is used, or SigNoz shows raw identifiers like "A"

## PromQL Metrics: Known Issues

On self-hosted SigNoz (tested v0.117.1), PromQL queries for OTEL metrics may show "No Data" even when metrics exist and are queryable via the `signoz_query_metrics` MCP tool. If PromQL panels consistently show "No Data":

1. Verify metrics exist via `signoz_list_metrics`
2. Verify data via `signoz_query_metrics` with `requestType: scalar`
3. If API returns data but dashboard doesn't, switch to log-based queries as a workaround

## Required Widget Fields

Every widget must include these fields or the dashboard may crash:

```json
{
  "id": "unique_id",
  "panelTypes": "value|graph|bar|pie|table|list",
  "title": "Panel Title",
  "query": { ... },
  "selectedLogFields": [
    {"fieldContext": "log", "name": "timestamp", "signal": "logs", "type": "log"},
    {"fieldContext": "log", "name": "body", "signal": "logs", "type": "log"}
  ],
  "selectedTracesFields": [
    {"fieldContext": "resource", "fieldDataType": "string", "name": "service.name", "signal": "traces"},
    {"fieldContext": "span", "fieldDataType": "string", "name": "name", "signal": "traces"},
    {"fieldContext": "span", "name": "duration_nano", "signal": "traces"}
  ],
  "thresholds": [],
  "contextLinks": {"linksData": []}
}
```

## Query Structure Template

```json
{
  "queryType": "builder",
  "promql": [{"query": "", "name": "A", "disabled": true, "legend": ""}],
  "clickhouse_sql": [{"query": "", "name": "A", "disabled": true, "legend": ""}],
  "builder": {
    "queryData": [{
      "queryName": "A",
      "dataSource": "logs",
      "expression": "A",
      "stepInterval": 60,
      "aggregations": [{"expression": "count()"}],
      "filters": {
        "op": "AND",
        "items": [
          {"key": {"key": "attr_name", "dataType": "string"}, "op": "EXISTS", "value": ""}
        ]
      },
      "groupBy": [],
      "orderBy": [],
      "selectColumns": [],
      "functions": []
    }],
    "queryFormulas": []
  }
}
```

## Layout Grid System

- 12-column grid. `x` + `w` must not exceed 12.
- Value panels: `h=3`, Charts: `h=7`, Tables: `h=8-9`
- Always set `minW` and `minH` to prevent collapse
- KPI row pattern: 3-4 value panels at `y=0, h=3, w=3 or w=4`

## Validation Workflow

**Always test after creating/updating a dashboard:**

1. Open the dashboard URL in a browser
2. Wait 8-10 seconds for panels to load
3. Check for:
   - "No Data" — query returned empty results (check time range, filters)
   - "Something went wrong" — query syntax error (check filter keys, dotted names)
   - Red error icon — panel configuration error
   - Blank panels with no message — queries not firing (check `filters` vs `filter` format)
   - Full page crash — likely a list panel missing `selectColumns`
4. Verify KPI values match what the MCP query tools return
5. Check that charts show data points, not just axes

## Claude Code Telemetry Reference

### Available Metrics (OTEL metrics pipeline)
| Metric | Type | Attributes |
|--------|------|------------|
| `claude_code.cost.usage` | sum (delta, monotonic) | `model` |
| `claude_code.token.usage` | sum (delta, monotonic) | `type` (input, output, cacheRead, cacheCreation), `model` |
| `claude_code.session.count` | sum (delta, monotonic) | — |
| `claude_code.active_time.total` | sum (delta, monotonic) | `type` (user, cli) |
| `claude_code.lines_of_code.count` | sum (delta, monotonic) | `type` (added, removed) |
| `claude_code.commit.count` | sum (delta, monotonic) | — |
| `claude_code.pull_request.count` | sum (delta, monotonic) | — |
| `claude_code.code_edit_tool.decision` | sum (delta, monotonic) | `tool_name`, `decision`, `source`, `language` |

### Available Events (OTEL logs pipeline)
| Event (body) | Key Attributes (no dots) |
|---|---|
| `claude_code.api_request` | `model`, `cost_usd`, `duration_ms`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `speed` |
| `claude_code.tool_result` | `tool_name`, `success`, `duration_ms`, `error` |
| `claude_code.tool_decision` | `tool_name`, `decision`, `source` |
| `claude_code.user_prompt` | `prompt_length` |
| `claude_code.api_error` | `model`, `error`, `status_code`, `duration_ms`, `attempt` |

### Identifying Events Without Dotted Keys
Since `event.name` can't be used as a filter, use unique attributes to identify event types:
- **api_request**: `model EXISTS` or `speed EXISTS`
- **tool_result**: `tool_name EXISTS`
- **user_prompt**: `prompt_length EXISTS`
- **api_error**: `status_code EXISTS`
- **tool_decision**: `decision EXISTS AND tool_name EXISTS AND success NOT EXISTS`
