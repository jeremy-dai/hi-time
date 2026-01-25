# Database Efficiency & Data Persistence Patterns

## Core Philosophy

The application follows a **local-first architecture** with smart synchronization strategies:

1. **Instant UX**: All changes save to localStorage immediately for zero-latency feedback
2. **Smart Sync**: Different data types use different sync strategies based on their usage patterns
3. **Conflict Prevention**: Built-in safeguards prevent data loss from stale writes
4. **Consistent UI**: All features use the standard `SyncStatusIndicator` component

---

## Three Sync Patterns

### Pattern 1: Incremental Sync (Timesheet, Settings)

**Use for**: Frequently edited data requiring multi-device consistency

**Hook**: [`useLocalStorageSync`](../time-tracker/src/hooks/useLocalStorageSync.ts)

**Strategy**:
- Save to localStorage immediately on every change
- Batch sync to database every 30 seconds (configurable)
- Timestamp-based staleness detection (1-hour threshold)
- Pre-sync conflict detection to prevent overwrites
- "Newer version available" notification for users

**Features**:
- ✅ `CachedData<T>` wrapper with timestamps for staleness detection
- ✅ Safety check: Prevents empty data from overwriting non-empty database
- ✅ Safety check: Prevents older timestamps from overwriting newer data
- ✅ Warns user before closing tab if unsaved changes exist
- ✅ Instant load from localStorage, then background DB check

**When staleness detected**:
- User sees notification: "Newer version available"
- User can choose to load the newer version or keep local changes
- No automatic overwrite - user stays in control

**Example Usage**:
```typescript
const { data, setData, syncStatus, hasNewerVersion, loadNewerVersion } = useLocalStorageSync({
  storageKey: 'week-2025-W01',
  syncInterval: 30000,
  syncToDatabase: async (data) => await putWeek(weekKey, data),
  loadFromDatabase: async () => await getWeek(weekKey)
})
```

---

### Pattern 2: Debounced Sync (Memories, Weekly Reviews)

**Use for**: Text content that's edited infrequently

**Hooks**:
- [`useYearMemories`](../time-tracker/src/hooks/useYearMemories.ts)
- [`useWeekReviews`](../time-tracker/src/hooks/useWeekReviews.ts)

**Strategy**:
- Load from localStorage first for instant UI (if available)
- Fetch from database in background to sync with latest data
- Save to localStorage immediately on every change
- Debounce database sync for 5 seconds after last edit

**Features**:
- ✅ Instant load from localStorage cache (zero-latency UI)
- ✅ Background database sync ensures data freshness across devices
- ✅ 5-second debounce reduces API calls during active typing
- ✅ localStorage cache for offline resilience
- ⚠️ No staleness check: Database silently updates cache in background

**Cross-device behavior**:
- Device A edits offline → changes stay in localStorage
- Device B opens app → loads from localStorage cache instantly, then syncs with DB in background
- Device A comes online → debounced sync pushes changes to database
- Device B refreshes → sees cached data instantly, then Device A's changes appear after DB sync

**Example Usage**:
```typescript
const { memories, updateMemory, syncStatus, syncNow } = useYearMemories(2025)

// Update saves to localStorage immediately, syncs to DB after 5s
updateMemory('2025-01-15', { text: 'Great day!', tags: ['work'] })
```

---

### Pattern 3: Optimistic Updates (Daily Shipping)

**Use for**: Discrete actions (button clicks, checkboxes, form submissions)

**Hooks**:
- [`useDailyShipping`](../time-tracker/src/hooks/useDailyShipping.ts)

**Strategy**:
- Update UI and localStorage immediately (optimistic)
- Sync to database instantly (no delay)
- Rollback UI and localStorage on failure
- Show error state if sync fails

**Features**:
- ✅ Zero-latency UI updates (instant feedback)
- ✅ Automatic rollback on API failure
- ✅ Clear error indication with retry option
- ✅ Individual row storage (not batch)

**Why optimistic?**
- User expects instant feedback on button clicks/checkboxes
- Operations are discrete (not continuous typing)
- Rollback on failure is acceptable UX for these actions

**Example Usage**:
```typescript
const { updateShipping, syncStatus } = useDailyShipping(2025)

// Instantly updates UI, syncs to DB, rolls back if fails
await updateShipping('2025-01-15', { shipped: 'Launched v1.0', completed: true })
```

---

### Pattern 4: Database-Only (Session History)

**Use for**: Historical snapshots that need to persist across devices and browser sessions

**Hook**: [`useHistory`](../time-tracker/src/hooks/useHistory.ts)

**Strategy**:
- Load snapshots from database on mount (database is source of truth)
- Save directly to database on each operation (no localStorage cache)
- Auto-save throttle: 30 minutes between auto-saves
- Maximum 50 snapshots per entity (oldest auto-deleted)

**Features**:
- ✅ Cross-device sync (history available on any device)
- ✅ Survives browser data clearing
- ✅ No localStorage quota usage
- ✅ Automatic cleanup of old snapshots
- ✅ Sync status indicator in History Modal

**Why database-only?**
- History is important data users expect to persist
- Not frequently edited (saves are discrete actions)
- Cross-device access is valuable for recovery scenarios
- localStorage-only approach risked data loss on browser clear

**Example Usage**:
```typescript
const { snapshots, saveSnapshot, deleteSnapshot, clearHistory, syncStatus } = useHistory('2025-W01')

// Save a snapshot (syncs to DB immediately)
await saveSnapshot(weekData, metadata, 'Before major changes', 'manual')

// Auto-saves are throttled (30-minute minimum interval)
await saveSnapshot(weekData, metadata, 'Auto Save', 'auto')
```

**Snapshot Types**:
- `manual`: User-initiated via History Modal
- `auto`: Automatic before bulk edits or CSV imports
- `restore`: Created when restoring from a previous snapshot

---

## Choosing the Right Pattern

```
┌─────────────────────────────────────┐
│ What kind of data are you saving?  │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
    Editing        Discrete
    content?       actions?
       │                │
       │         ┌──────┴──────┐
       │         │             │
       │     Needs         Standard
       │     persistence?  CRUD?
       │         │             │
       │         └──→ Pattern 4   └──→ Pattern 3
       │         (DB-Only)        (Optimistic)
       │
   ┌───┴────┐
   │        │
Multiple    Single
devices?    device?
   │        │
   │        └──────→ Pattern 1: Incremental Sync
   │
   └─────────────→ Pattern 2: Debounced Sync
```

**Decision criteria**:

| Criteria | Pattern 1 | Pattern 2 | Pattern 3 | Pattern 4 |
|----------|-----------|-----------|-----------|-----------|
| **Edit frequency** | High (continuous) | Low (occasional) | Low (discrete) | Very low (snapshots) |
| **Multi-device** | Yes, critical | Yes, but DB is source | Less critical | Yes, important |
| **Staleness detection** | Required | Not needed | Not needed | Not needed |
| **Sync timing** | Batched (30s) | Debounced (5s) | Instant | Instant |
| **Data size** | Large (weeks) | Medium (year data) | Small (individual rows) | Medium (snapshots) |
| **User interaction** | Editing cells | Typing text | Clicking buttons | Manual saves |
| **localStorage** | Yes (cache) | Yes (cache) | Yes (cache) | No |

---

## Data Storage Overview

| Feature | localStorage Key | Database Table | Staleness Check | Sync Strategy |
|---------|-----------------|----------------|-----------------|---------------|
| **Timesheet** | `week-{weekKey}` | `weeks` (JSONB) | ✅ 1 hour | Incremental (30s) |
| **Week Metadata** | `week-metadata-{weekKey}` | Coupled with `weeks` | ✅ 1 hour | Coupled with timesheet |
| **Dashboard Week Cache** | `week-data-{weekKey}` | `weeks` (JSONB) | ✅ 1 hour | Read-only cache |
| **User Settings** | `user-settings` | `user_settings` (JSONB) | ✅ 1 hour | Incremental (30s) |
| **Year Memories** | `year-memories-{year}` | `year_memories` (JSONB) | ❌ Cache-first | Debounced (5s) |
| **Week Reviews** | `week-reviews-{year}` | `week_reviews` (rows) | ❌ Cache-first | Debounced (5s) |
| **Annual Review** | `annual-review-{year}` | `week_reviews` (week=0) | ❌ Cache-first | Debounced (5s) |
| **Quarterly Goals** | `quarterly-goals-{year}-Q{quarter}` | `quarterly_goals` + `goal_milestones` | ❌ DB first | Optimistic (instant) |
| **Daily Shipping** | `daily-shipping-{year}` | `daily_shipping` (rows) | ❌ DB first | Optimistic (instant) |
| **Session History** | ❌ None | `data_snapshots` (rows) | ❌ DB first | Optimistic (instant) |

### Staleness Detection

**What is it?**
- Pattern 1 wraps data in `CachedData<T>` with a timestamp
- If localStorage data is >1 hour old, it's considered "stale"
- Stale data is ignored, and fresh data is fetched from database

**Why only Pattern 1?**
- Timesheet and Settings are edited frequently and need multi-device consistency with conflict detection
- Pattern 2 loads from cache but syncs with DB in background (no staleness threshold, just overwrites cache)
- Pattern 3 always loads from database on mount, so it doesn't need staleness checks
- Patterns 2-4 use simpler cache invalidation strategies without staleness detection

**CachedData Format**:
```typescript
interface CachedData<T> {
  data: T
  timestamp: number // Unix timestamp in milliseconds
}
```

---

## UI Feedback - Sync Status Indicator

All features use the **standardized** [`SyncStatusIndicator`](../time-tracker/src/components/SyncStatusIndicator.tsx) component.

### Visual States

| State | Color | Icon | Meaning |
|-------|-------|------|---------|
| **Synced** | 🟢 Green | ✓ | Data is safely saved to database |
| **Pending** | 🟡 Amber | ● | Will save automatically soon |
| **Syncing** | 🔵 Emerald | ⋯ | Saving to database right now |
| **Error** | 🔴 Red | ⚠ | Save failed, retry available |

### User Timelines

**Pattern 1 (Incremental)**:
```
Edit → localStorage (0ms) → Pending (wait up to 30s) → Syncing (~1s) → Synced ✓
```

**Pattern 2 (Debounced)**:
```
Edit → localStorage (0ms) → Pending (5s wait) → Syncing (~1s) → Synced ✓
```

**Pattern 3 (Optimistic)**:
```
Click → Optimistic UI + localStorage (0ms) → Syncing (~1s) → Synced ✓ or Rollback
```

### Implementation

All hooks return the same interface:
```typescript
{
  syncStatus: SyncStatus // 'idle' | 'synced' | 'pending' | 'syncing' | 'error'
  lastSynced: Date | null
  hasUnsavedChanges: boolean
  syncNow: () => Promise<void> // Manual sync trigger
}
```

All components use the same indicator:
```tsx
<SyncStatusIndicator
  status={syncStatus}
  lastSynced={lastSynced}
  hasUnsavedChanges={hasUnsavedChanges}
  onSyncNow={syncNow}
  compact={false}
/>
```

**Current Status**:
- ✅ Timesheet: Using `SyncStatusIndicator`
- ✅ Settings: Using `SyncStatusIndicator`
- ✅ Memories: Using `SyncStatusIndicator`
- ✅ Daily Shipping: Using `SyncStatusIndicator`
- ✅ Weekly Review: Using `SyncStatusIndicator`
- ✅ Quarterly Goals: Using `SyncStatusIndicator` (in component)

---

## Code Organization

### Shared Types & Utilities

**[`useSyncState.ts`](../time-tracker/src/hooks/useSyncState.ts)**:
- Exports the standard `SyncStatus` type used across all hooks
- Provides utility functions for sync state management (future use)

**[`SyncStatusIndicator.tsx`](../time-tracker/src/components/SyncStatusIndicator.tsx)**:
- Standard component for displaying sync status
- Supports both full and compact modes
- Handles all 5 sync states consistently

### Hook Implementations

Each pattern has its own hook with specialized logic:

1. **`useLocalStorageSync.ts`**: Generic hook for Pattern 1 (incremental sync with staleness)
2. **`useYearMemories.ts`**: Memories-specific hook for Pattern 2 (debounced sync)
3. **`useWeekReviews.ts`**: Reviews-specific hook for Pattern 2 (debounced sync)
4. **`useDailyShipping.ts`**: Shipping-specific hook for Pattern 3 (optimistic updates)
5. **`useHistory.ts`**: History-specific hook for Pattern 4 (database-only with throttled auto-save)

---

## Conflict Resolution & Data Safety

### Pattern 1: Multi-Layer Protection

1. **Staleness Check**: Ignores localStorage data >1 hour old
2. **Empty Data Guard**: Refuses to sync if local data is empty but database has data
3. **Timestamp Comparison**: Refuses to sync if database timestamp is newer
4. **User Notification**: Shows "Newer version available" instead of auto-overwriting

### Pattern 2: Cache-First with Background Sync

- Loads from localStorage cache immediately (instant UI)
- Syncs with database in background and silently updates cache
- No staleness detection (database always overwrites cache)
- Last-write-wins for concurrent edits

### Pattern 3 & 4: Database as Source of Truth

- No staleness detection needed
- Always loads fresh data from database on mount
- Last-write-wins for concurrent edits
- Optimistic rollback on API failure (Pattern 3)

### Cross-Device Scenarios

**Scenario 1: Edit on Device A, then Device B**
- Pattern 1: Device B sees "Newer version available" if A's changes synced
- Pattern 2: Device B loads cached data instantly, then A's changes appear after background sync
- Pattern 3: Device B loads A's changes from database
- Pattern 4: Device B loads A's changes from database

**Scenario 2: Edit offline on Device A, online on Device B**
- Pattern 1: Both have unsaved changes, conflict detected on next sync
- Pattern 2: Device A's changes stay local until online, Device B wins on conflict (overwrites cache in background)
- Pattern 3: Device A's changes stay local until online, Device B wins on conflict
- Pattern 4: Device A's changes stay local until online, Device B wins on conflict

---

## Dashboard (Read-Only Pattern)

The Dashboard is **read-only** and uses both in-memory and localStorage caching for optimal performance.

**Strategy**:
1. User opens Dashboard → Check in-memory cache (`weekStore`)
2. Cache miss → Check localStorage cache (with staleness detection)
3. Fresh cache hit → Load from localStorage instantly
4. Stale/missing cache → Batch fetch from database
5. Update both caches → Render charts

**Optimizations**:
- ✅ Batch API endpoint: `POST /api/weeks/batch` fetches multiple weeks in one query
- ✅ In-memory cache prevents redundant fetches during session
- ✅ localStorage cache with staleness detection (1-hour threshold, same as Pattern 1)
- ✅ Lazy loading: Only loads data when switching to dashboard views
- ✅ Progressive loading: Shows loading spinner during fetch
- ✅ Cache invalidation: Week data updates immediately refresh localStorage cache

**localStorage Caching** (key: `week-data-{weekKey}`):
- Uses `CachedData` wrapper with timestamp for staleness detection
- Fresh data (< 1 hour old) loads instantly from cache
- Stale data triggers API fetch and cache refresh
- Updated whenever week data is edited (cells, CSV imports, theme changes)

---

## Future Optimization Opportunities

1. **Service Worker Cache**:
   - Cache API responses at network layer
   - Offline-first capability for historical data
   - Faster subsequent loads even after localStorage clear

2. **Predictive Prefetching**:
   - When viewing Current Week, prefetch last 4 weeks for Trends
   - When viewing Trends, prefetch Annual data in background

---

## Summary

| Aspect | Pattern 1 (Incremental) | Pattern 2 (Debounced) | Pattern 3 (Optimistic) | Pattern 4 (DB-Only) |
|--------|-------------------------|----------------------|------------------------|---------------------|
| **Examples** | Timesheet, Settings | Memories, Reviews | Goals, Shipping | Session History |
| **localStorage** | With timestamp | Plain data | Plain data | None |
| **Staleness** | ✅ 1 hour | ❌ Cache-first | ❌ DB first | ❌ DB first |
| **Sync timing** | Batched (30s) | Debounced (5s) | Instant | Instant (throttled auto) |
| **Conflict detection** | ✅ Pre-sync check | ❌ Last-write-wins | ❌ Last-write-wins | ❌ Last-write-wins |
| **Error recovery** | Shows warning | Logs error | Rollback + retry | Shows error state |
| **Multi-device** | ✅ Staleness + notification | ✅ Cache + DB sync | ✅ DB source of truth | ✅ DB source of truth |
| **Best for** | Frequent edits, multi-device | Occasional text edits | Discrete actions | Version history/backup |

**Key Takeaway**: Each pattern is optimized for its specific use case. Choose based on how users interact with the data, not just technical preferences.
