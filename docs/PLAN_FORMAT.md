# Quarterly Plan JSON Format (V5 - Weeks in Cycles)

This document describes the JSON schema for quarterly plans with a cycle → week → todos structure.

## Structure Overview

The root object contains four main sections:

```json
{
  "plan": { ... },        // Plan metadata
  "work_types": [ ... ],  // Categories of work for KPI tracking
  "cycles": [ ... ],      // Cycles containing weeks
  "templates": { ... }    // Optional reusable templates
}
```

## 1. Plan Metadata (`plan`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the plan |
| `name` | string | Display name of the plan |
| `description` | string | Optional description of the plan's goals |
| `anchor_date` | string | Start date of the plan (YYYY-MM-DD) |
| `timezone` | string | IANA timezone identifier (e.g., "Asia/Shanghai") |

```json
"plan": {
  "id": "q1-2026-growth",
  "name": "Q1 2026 Growth Plan",
  "description": "Focus on product development and audience growth",
  "anchor_date": "2026-01-01",
  "timezone": "Asia/Shanghai"
}
```

## 2. Work Types (`work_types`)

Work types define categories for grouping todos. KPIs are calculated as **completion rates** per work type.

**Format:** Array of objects

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name (e.g., "小红书", "Client Work") |
| `description` | string | Optional description of this work type |

```json
"work_types": [
  {
    "name": "小红书",
    "description": "Social media content creation"
  },
  {
    "name": "Client Work",
    "description": "Consulting projects"
  }
]
```

### KPI Calculation per Work Type

For each work type, the system automatically calculates across **all weeks in all cycles**:
- **Total todos**: Count of todos with `type` matching the work type name
- **Completed todos**: Count of todos with `status: "completed"`
- **Completion rate**: `completed / total * 100%`

Example display:
```
小红书
├─ Total: 12 todos
├─ Completed: 8 todos
└─ Completion Rate: 67%
```

## 3. Cycles (`cycles`)

The plan is divided into cycles. Each cycle contains a list of weeks.

### Cycle Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique cycle ID |
| `name` | string | Cycle name |
| `theme` | string | Optional cycle theme/focus |
| `description` | string | Optional cycle description |
| `status` | string | `"not_started"`, `"in_progress"`, or `"completed"` |
| `weeks` | array | List of Week objects |

### Week Object

Each week represents a planning unit with its own theme, goals, todos, and reflection.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `theme` | string | Yes | Weekly theme or focus |
| `goals` | array | No | Array of goal strings for the week |
| `todos` | array | Yes | List of Todo objects |
| `reflection_questions` | array | No | Questions to reflect on at week's end |

### Todo Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique todo ID within the week |
| `text` | string | Yes | Todo description |
| `type` | string | No | Work type category (must match a `work_types[].name`) |
| `status` | string | Yes | `"pending"`, `"in_progress"`, `"completed"`, or `"blocked"` |
| `priority` | string | No | `"low"`, `"medium"`, or `"high"` |
| `template_id` | string | No | Optional reference to a key in `templates` |

```json
"cycles": [
  {
    "id": "cycle-1",
    "name": "Foundation Phase",
    "theme": "Build core infrastructure",
    "status": "in_progress",
    "weeks": [
      {
        "theme": "Setup & Planning",
        "goals": [
          "Complete project setup",
          "Define success metrics"
        ],
        "todos": [
          {
            "id": "todo-1",
            "text": "Set up development environment",
            "type": "Client Work",
            "status": "completed",
            "priority": "high"
          },
          {
            "id": "todo-2",
            "text": "Write technical specification",
            "type": "Client Work",
            "status": "in_progress",
            "priority": "medium",
            "template_id": "product_spec"
          }
        ],
        "reflection_questions": [
          "What went well this week?",
          "What could be improved?",
          "Are we on track for cycle goals?"
        ]
      }
    ]
  }
]
```

## 4. Templates (`templates`)

Optional reusable markdown templates for todos that have deliverables or standard structures.

**Format:** Dictionary (key-value pairs)

```json
"templates": {
  "weekly_log": "## Highlights\n...\n## Lowlights\n...",
  "product_spec": "## Problem\n...\n## Solution\n...",
  "recurring-weekly": "Weekly recurring task"
}
```

## Full Example

```json
{
  "plan": {
    "id": "2026-q1",
    "name": "Q1 2026 Plan",
    "description": "Focus on product and content growth",
    "anchor_date": "2026-01-01",
    "timezone": "Asia/Shanghai"
  },
  "work_types": [
    {
      "name": "小红书",
      "description": "Social media content creation"
    },
    {
      "name": "Client Work",
      "description": "Consulting projects"
    }
  ],
  "cycles": [
    {
      "id": "cycle-1",
      "name": "Foundation",
      "theme": "Build and ship",
      "status": "in_progress",
      "weeks": [
        {
          "theme": "Setup Week",
          "goals": [
            "Complete infrastructure setup",
            "Ship first prototype"
          ],
          "todos": [
            {
              "id": "todo-1",
              "text": "Set up database schema",
              "type": "Client Work",
              "status": "completed",
              "priority": "high"
            },
            {
              "id": "todo-2",
              "text": "Build authentication flow",
              "type": "Client Work",
              "status": "in_progress",
              "priority": "high"
            },
            {
              "id": "todo-3",
              "text": "Write weekly reflection",
              "status": "pending",
              "priority": "medium",
              "template_id": "weekly_log"
            }
          ],
          "reflection_questions": [
            "What blocked me this week?",
            "What will I focus on next week?",
            "Am I aligned with cycle goals?"
          ]
        },
        {
          "theme": "Content Creation",
          "goals": [
            "Publish 5 posts",
            "Engage with community"
          ],
          "todos": [
            {
              "id": "todo-4",
              "text": "Write post about product launch",
              "type": "小红书",
              "status": "pending",
              "priority": "high"
            },
            {
              "id": "todo-5",
              "text": "Create social media graphics",
              "type": "小红书",
              "status": "pending",
              "priority": "medium"
            }
          ],
          "reflection_questions": [
            "Did my content resonate with the audience?",
            "What topics got the most engagement?"
          ]
        }
      ]
    },
    {
      "id": "cycle-2",
      "name": "Growth Phase",
      "theme": "Scale and optimize",
      "status": "not_started",
      "weeks": [
        {
          "theme": "Optimization",
          "goals": [
            "Improve performance",
            "Reduce load times"
          ],
          "todos": [
            {
              "id": "todo-6",
              "text": "Implement caching strategy",
              "type": "Client Work",
              "status": "pending",
              "priority": "high"
            }
          ],
          "reflection_questions": [
            "What performance gains did we achieve?",
            "Where are the remaining bottlenecks?"
          ]
        }
      ]
    }
  ],
  "templates": {
    "weekly_log": "## Highlights\n- \n\n## Lowlights\n- \n\n## Learnings\n- ",
    "product_spec": "## Problem\n\n## Solution\n\n## Success Criteria\n"
  }
}
```

## UI Requirements

### 1. Cycle Navigation
- Display cycles as collapsible sections
- Show cycle status badge (Active, Done, Upcoming)
- Highlight current/active cycle

### 2. Week Cards
- Display week theme prominently
- Show goals as bullet points
- List todos with checkboxes for status toggling
- Display reflection questions in expandable section

### 3. Todo Status Management
- Checkbox interaction to toggle status
- Visual indicators for different statuses (pending, in_progress, completed, blocked)
- Priority badges (Low/Medium/High)
- Template indicator (🔄) for todos with `template_id`
- Work type tag for categorization

### 4. Timeline View
- Show weeks in chronological order within cycles
- Visual connector lines between weeks and cycles
- Highlight current week based on `anchor_date` + week offset

### 5. KPI Dashboard
- Display work type completion rates
- Show total/completed/pending counts per work type
- Visual progress bars or charts

## Migration Notes (V4 → V5)

**Changes:**
- Added `weeks` array back into cycles
- Each week has: `theme`, `goals`, `todos`, `reflection_questions`
- Removed cycle-level `items` array
- Todos moved inside weeks with full status options restored
- Added `type` field to todos for work type categorization

**Kept:**
- `plan` metadata (id, name, description, anchor_date, timezone)
- `work_types` array for KPI calculation
- `templates` object (dictionary format)
- Cycle structure (id, name, theme, description, status)
