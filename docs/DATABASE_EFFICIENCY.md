# Database Efficiency

## ✅ Timesheet Pattern (Local-First, Incremental Saving)

### Workflow
1. **User edits cell** → Immediate `localStorage` save (instant UX)
2. **Every 30 seconds** → Check for unsaved changes
3. **Safety Check** → Verify database state before overwriting
4. **Sync to database** (if needed)
5. **Update UI status**

### Key Benefits
- **Instant feedback**: `localStorage` is synchronous and provides immediate persistence.
- **Minimal database writes**: Changes are batched and saved every 30 seconds.
- **Resilient**: Warns before tab close and syncs on unmount.
- **User-friendly**: Shows sync status without blocking the UI.
- **Data Safety**: Prevents stale local data from overwriting newer database entries.

---

## 🛡️ Data Loss Prevention (DLP)

The `useLocalStorageSync` hook implements multiple layers of protection to prevent accidental data loss, especially when switching devices or dealing with stale local storage.

### 1. Timestamp-based Staleness Check
- **Implementation**: `localStorage` data is wrapped in a `CachedData` interface with a `timestamp`.
- **Threshold**: 1 hour (`STALENESS_THRESHOLD`).
- **Behavior**: When loading the app, if `localStorage` data is older than 1 hour, it is ignored, and the latest data is fetched from the database.
- **Prevents**: Old local data (possibly with zeros/empty states) from overwriting a more recent database state.

### 2. Pre-Sync Safety Check
- **Implementation**: Before every database write, the hook fetches the *current* database state.
- **Empty Data Guard**: If the local data is "empty" (no categories selected) but the database already contains data, the sync is aborted.
- **Logging**: Clear warnings and errors are logged to the console if a sync conflict or safety block occurs.
- **Prevents**: Network blips or UI errors that might clear local data from accidentally wiping the database.

---

## ✅ Dashboard Pattern (Read-Only, Smart Caching)

### Current Implementation
1. **User opens dashboard tab** → Check in-memory cache (`weekStore`)
2. **Cache hit?**
   - **Yes**: Use cached data (instant!)
   - **No**: Batch fetch missing weeks from DB
3. **Update cache** → Render charts

### Optimizations Applied

#### Smart Caching (`App.tsx:85-110`)
- Checks cache before fetching.
- Only fetches missing weeks (no duplicate API calls).
- **True Batch Fetching**: Uses the dedicated `POST /api/weeks/batch` endpoint to fetch all missing weeks in a single HTTP request and a single database query.
- Significantly reduces network overhead and database load on multi-week views (e.g., Annual Dashboard).

#### Stable Function References
- Fixed `useCallback` to use functional updates (no dependencies).
- Prevents unnecessary re-renders.
- More efficient React reconciliation.

#### Progressive Loading (`Dashboard.tsx:70-75`)
- Shows loading spinner during data fetch.
- User can see existing data while new data loads.

#### Lazy Loading
- Only loads data when switching to a view.
- Doesn't preload all year data on app mount.

---

## ✅ Memories Pattern (Local-First, Debounced Saving)

### Workflow
1. **User adds/edits memory** → Immediate `localStorage` save (instant UX)
2. **After 5 seconds of inactivity** → Debounced sync to database
3. **Database sync** → Update sync status indicator
4. **Fallback on mount** → Load from database if localStorage is empty

### Key Benefits
- **Instant feedback**: `localStorage` provides immediate persistence
- **Debounced writes**: Changes are batched with 5-second debounce to minimize database writes
- **Offline support**: Works offline with localStorage, syncs when connection restored
- **Sync status**: Visual indicator shows sync state (syncing/synced/pending/error)
- **Year-based storage**: Memories organized by year for efficient loading

### Implementation Details
- **Hook**: `useYearMemories` (custom hook)
- **Storage Key**: `memories-{year}` (per-year localStorage)
- **Database Table**: `year_memories` (JSONB column stores all memories for a year)
- **Sync Strategy**: Debounced (5s) + on unmount
- **Offline Resilience**: Falls back to localStorage if database unavailable

---

## ✅ Weekly Reviews Pattern (Local-First, Debounced Saving)

### Workflow
1. **User edits weekly review** → Immediate `localStorage` save (instant UX)
2. **After 5 seconds of inactivity** → Debounced sync to database
3. **Database sync** → Update sync status indicator
4. **Fallback on mount** → Load from database, cache in localStorage

### Key Benefits
- **Instant feedback**: `localStorage` provides immediate persistence
- **Debounced writes**: Changes are batched with 5-second debounce to minimize database writes
- **Individual row storage**: Each week review is a separate database row for efficient querying
- **Sync status**: Visual indicator shows sync state (syncing/synced/pending/error)
- **Year-based fetching**: Fetches all reviews for a year in one query

### Implementation Details
- **Hooks**: `useWeekReviews`, `useAnnualReview` (custom hooks)
- **Storage Key**: `week-reviews-{year}`, `annual-review-{year}` (per-year localStorage)
- **Database Table**: `week_reviews` (one row per week, `week_number=0` for annual review)
- **Sync Strategy**: Debounced (5s) + on unmount
- **API**: `GET /api/reviews/{year}` fetches all reviews for a year with single query
- **Indexes**: Composite indexes on `(user_id, year)` and `(user_id, year, week_number)` for fast lookups

---

## ✅ Daily Shipping Pattern (Local-First, Debounced Saving)

### Workflow
1. **User edits daily shipping entry** → Immediate `localStorage` save (instant UX)
2. **After 5 seconds of inactivity** → Debounced sync to database
3. **Database sync** → Update sync status indicator
4. **Fallback on mount** → Load from database, cache in localStorage

### Key Benefits
- **Instant feedback**: `localStorage` provides immediate persistence
- **Debounced writes**: Changes are batched with 5-second debounce to minimize database writes
- **Individual row storage**: Each day is a separate database row for efficient querying
- **Completion tracking**: Boolean flag for marking items as done
- **Year-based fetching**: Fetches all entries for a year in one query

### Implementation Details
- **Hook**: `useDailyShipping` (custom hook)
- **Storage Key**: `daily-shipping-{year}` (per-year localStorage)
- **Database Table**: `daily_shipping` (one row per day with `shipped` text and `completed` boolean)
- **Sync Strategy**: Debounced (5s) + immediate sync on delete
- **API**: `GET /api/shipping/{year}` fetches all entries for a year with single query
- **Indexes**: Composite indexes on `(user_id, year)` and `(user_id, year, month, day)` for fast lookups

---

## 📊 Caching Strategy Overview

### Data Types and Storage

| Data Type | localStorage Key | Format | Staleness Threshold | Sync Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Weeksheet Data** | `week-{weekKey}` | `CachedData<TimeBlock[][]>` | 1 hour | `useLocalStorageSync` (30s) |
| **Week Metadata** | `week-metadata-{weekKey}` | `CachedData<{startingHour, theme}>` | 1 hour | Coupled with weeksheet sync |
| **User Settings** | `user-settings` | `CachedData<UserSettings>` | 1 hour | `useLocalStorageSync` (30s) |
| **Year Memories** | `memories-{year}` | `YearMemories` | None (always fresh) | Debounced (5s) |
| **Week Reviews** | `week-reviews-{year}` | `YearWeekReviews` | None (always fresh) | Debounced (5s) |
| **Annual Review** | `annual-review-{year}` | `AnnualReview` | None (always fresh) | Debounced (5s) |
| **Daily Shipping** | `daily-shipping-{year}` | `YearDailyShipping` | None (always fresh) | Debounced (5s) |

**CachedData Format**:
```typescript
interface CachedData<T> {
  data: T;
  timestamp: number; // Unix timestamp in milliseconds
}
```

### Staleness Detection

All cached data includes a timestamp and is validated before use:
- **Fresh data** (< 1 hour old): Used immediately from localStorage
- **Stale data** (≥ 1 hour old): Ignored, fetched from database instead
- **Prevents**: Cross-device conflicts, outdated data persisting indefinitely

## 📊 Efficiency Comparison

| Aspect | Timesheet | Week Metadata | User Settings | Memories | Week Reviews | Daily Shipping | Dashboard |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Writes** | Batched every 30s | Coupled with weeksheet | Batched every 30s | Debounced 5s ✅ | Debounced 5s ✅ | Debounced 5s ✅ | None (read-only) ✅ |
| **Reads** | Once on mount, cached | Once on mount, cached | Once on mount, cached | Once on mount, cached | Once on mount, cached | Once on mount, cached | On-demand, cached ✅ |
| **Cache Strategy** | localStorage + in-memory | localStorage + in-memory | localStorage + in-memory | localStorage only | localStorage only | localStorage only | In-memory only |
| **Staleness Check** | ✅ Yes (1 hour) | ✅ Yes (1 hour) | ✅ Yes (1 hour) | ❌ No (always fresh) | ❌ No (always fresh) | ❌ No (always fresh) | N/A |
| **Batch Operations** | Yes (30s intervals) | Yes (with weeksheet) | Yes (30s intervals) | Yes (5s debounce) ✅ | Yes (5s debounce) ✅ | Yes (5s debounce) ✅ | Yes (parallel fetch) ✅ |
| **User Feedback** | Sync status indicator | Visual updates | Sync status indicator | Sync status indicator ✅ | Sync status indicator ✅ | Sync status indicator ✅ | Loading states ✅ |
| **UI Component** | `SyncStatusIndicator` | Visual updates | `SyncStatusIndicator` | Custom (migrate) | Custom (migrate) | Custom (migrate) | Loading spinner |
| **DB Structure** | JSONB (whole week) | Coupled with weeks | JSONB (all settings) | JSONB (year's memories) | Individual rows per week | Individual rows per day | Read-only |
| **Query Pattern** | Single row per week | Part of week row | Single row per user | Single row per year | Year-based batch fetch | Year-based batch fetch | On-demand fetch |

---

## ✅ Recent Improvements (2025)

### 1. Unified Staleness Detection
- **Problem**: Week metadata lacked timestamp-based staleness checks
- **Solution**: All cached data now uses `CachedData<T>` wrapper with timestamps
- **Benefit**: Consistent 1-hour staleness threshold across all data types
- **Location**: `App.tsx:24-62`

### 2. Consolidated Timezone Storage
- **Problem**: Timezone stored redundantly in 3 locations (`userSettings`, `user-timezone`, `user-settings`)
- **Solution**: Single source of truth via `user-settings` (managed by `useLocalStorageSync`)
- **Benefit**: Eliminates desync risk, simpler initialization logic
- **Location**: `App.tsx:67-77`

### 3. Removed Unnecessary Settings Reload
- **Problem**: Settings reloaded every time user switched to "log" tab
- **Solution**: Trust `useLocalStorageSync` to handle updates, load once on mount
- **Benefit**: Fewer API calls, better performance
- **Location**: `App.tsx:147-149`

### 4. Standardized Metadata Loading
- **Problem**: Inconsistent staleness checks across batch fetch, current week load, initial load
- **Solution**: All three paths now check timestamps and use `CachedData` format
- **Benefit**: Predictable behavior regardless of loading path
- **Locations**: `App.tsx:197-220`, `App.tsx:249-323`, `App.tsx:28-62`

## 🎨 UI Feedback & User Experience

All features that save data provide real-time visual feedback to users about sync status. This is documented in detail in the [Design System - Sync Status Indicators](../time-tracker/DESIGN_SYSTEM.md#11-sync-status-indicator-standard-component) section.

### Sync Status Indicator Component

**Standard Component**: `time-tracker/src/components/SyncStatusIndicator.tsx`

All features should use this consistent component for displaying sync status:

| Feature | Current Implementation | Status |
|---------|----------------------|--------|
| Timesheet | ✅ Using `SyncStatusIndicator` | Standard |
| Settings | ✅ Using `SyncStatusIndicator` | Standard |
| Memories | ⚠️ Custom implementation | Should migrate |
| Week Reviews | ⚠️ Custom implementation | Should migrate |
| Daily Shipping | ⚠️ Custom implementation | Should migrate |

### Visual Feedback States

| State | Color | Icon | User Understanding |
|-------|-------|------|-------------------|
| **Synced** | 🟢 Green | ✓ | "My data is safely saved" |
| **Pending** | 🟡 Amber | ● | "Will save automatically soon" |
| **Syncing** | 🔵 Emerald | ⋯ | "Saving right now" |
| **Error** | 🔴 Red | ⚠ | "Something went wrong, may need retry" |

**User Timeline**: Edit → Instant localStorage (0ms) → Pending (5s wait) → Syncing (~1s) → Synced ✓

For detailed UI patterns, component props, and implementation examples, see the [Design System documentation](../time-tracker/DESIGN_SYSTEM.md).

---

## 🎯 Future Optimization Opportunities

The current implementation is highly efficient with smart caching and batch fetching. Consider these optional enhancements:

1. **localStorage Caching for Dashboard Historical Weeks**:
   - Cache frequently accessed historical weeks in `localStorage`
   - Faster dashboard loads on return visits
   - Reduce database reads for read-only historical data
   - Use same `CachedData` wrapper with staleness detection

2. **Prefetching Strategy**:
   - Preload likely-needed weeks in the background
   - E.g., when viewing Current Week, prefetch last 4 weeks for Trends view
   - When viewing Trends, prefetch Annual data in background

3. **Service Worker Cache**:
   - Cache API responses at network layer
   - Offline-first capability for historical data
   - Faster subsequent loads even after localStorage clear
