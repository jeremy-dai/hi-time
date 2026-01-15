# Quarterly Plan JSON Format (V3)

This document describes the JSON schema for importing quarterly plans into the Time Tracker. The schema allows for flexible, type-driven planning with derived KPIs.

## Structure Overview

The root object contains four main sections:

```json
{
  "plan": { ... },        // Plan metadata
  "work_types": [ ... ],  // Defined categories of work with KPI targets
  "templates": { ... },   // Reusable text templates for deliverables
  "cycles": [ ... ]       // The core plan structure (cycles -> weeks -> todos)
}
```

## 1. Plan Metadata (`plan`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the plan (e.g., "q1-2026") |
| `name` | string | Display name of the plan |
| `description` | string | Optional description of the plan's goals |
| `anchor_date` | string | Start date of the plan (YYYY-MM-DD) |
| `timezone` | string | IANA timezone identifier (e.g., "Asia/Shanghai") |

```json
"plan": {
  "id": "q1-2026-growth",
  "name": "Q1 2026 Growth Plan",
  "description": "Focusing on core product stability and user acquisition",
  "anchor_date": "2026-01-01",
  "timezone": "Asia/Shanghai"
}
```

## 2. Work Types (`work_types`)

Work types define the categories of work you track. KPIs are automatically calculated based on these types.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID referenced by todos/deliverables |
| `name` | string | Display name (e.g., "Engineering", "Writing") |
| `color` | string | Color for UI (blue, purple, green, yellow, red, indigo, emerald) |
| `kpi_target` | object | Optional target for this work type |

**KPI Target Object:**
- `unit`: Label for the unit (e.g., "hours", "posts")
- `weekly_value`: Target value per week

```json
"work_types": [
  {
    "id": "tech",
    "name": "Engineering",
    "color": "blue",
    "kpi_target": { "unit": "hours", "weekly_value": 20 }
  },
  {
    "id": "writing",
    "name": "Content",
    "color": "yellow",
    "kpi_target": { "unit": "posts", "weekly_value": 1 }
  }
]
```

## 3. Templates (`templates`)

Reusable markdown templates for deliverables.

```json
"templates": {
  "spec": "## Problem\n...\n## Solution\n...",
  "weekly_log": "## Highlights\n...\n## Lowlights\n..."
}
```

## 4. Cycles (`cycles`)

The plan is divided into cycles (usually 4-8 weeks), which contain weeks.

### Cycle Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique cycle ID |
| `name` | string | Cycle name |
| `theme` | string | Cycle theme/focus |
| `status` | string | "not_started", "in_progress", "completed" |
| `weeks` | array | List of Week objects |

### Week Object

ISO week keys (e.g., `2025-W03`) are **calculated dynamically** from:
- `plan.anchor_date` + position in the `weeks` array

This design makes plans portable and easy to edit without manual renumbering.

| Field | Type | Description |
|-------|------|-------------|
| `theme` | string | Weekly theme |
| `goals` | array<string> | High-level goals for the week |
| `todos` | array | List of Task objects |
| `deliverables` | array | List of Deliverable objects |
| `reflection_questions` | array<string> | Custom reflection questions for this week |

### Task Object (`todos`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique task ID |
| `title` | string | Task description |
| `type_id` | string | References a `work_type.id` |
| `priority` | string | "high", "medium", "low" |
| `estimate` | number | Estimated effort (e.g., hours) |
| `status` | string | "not_started", "in_progress", "blocked", "done" |
| `dependencies` | array<string> | IDs of tasks that must be completed first |

### Deliverable Object (`deliverables`)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique deliverable ID |
| `title` | string | Deliverable name |
| `type_id` | string | References a `work_type.id` |
| `status` | string | "not_started", "in_progress", "done" |
| `template_id` | string | References a key in `templates` |

## Full Example

```json
{
  "plan": {
    "id": "example-plan",
    "name": "Example Plan",
    "anchor_date": "2026-01-01"
  },
  "work_types": [
    {
      "id": "dev",
      "name": "Development",
      "color": "blue",
      "kpi_target": { "unit": "hours", "weekly_value": 15 }
    }
  ],
  "cycles": [
    {
      "id": "c1",
      "name": "Cycle 1",
      "status": "not_started",
      "weeks": [
        {
          "theme": "Setup",
          "todos": [
            {
              "id": "t1",
              "title": "Init project",
              "type_id": "dev",
              "priority": "high",
              "estimate": 2,
              "status": "not_started"
            }
          ]
        }
      ]
    }
  ]
}
```
