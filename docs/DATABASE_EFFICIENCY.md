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

## 📊 Efficiency Comparison

| Aspect | Timesheet | Dashboard |
| :--- | :--- | :--- |
| **Writes** | Batched every 30s | None (read-only) ✅ |
| **Reads** | Once on mount, then cached | On-demand, cached ✅ |
| **Cache Strategy** | `localStorage` + in-memory | In-memory only |
| **Batch Operations** | Yes (30s intervals) | Yes (parallel fetch) ✅ |
| **User Feedback** | Sync status indicator | Loading states ✅ |

---

## 🎯 Recommendations for Further Optimization

The current implementation is already quite efficient—it minimizes database reads through smart caching and batch fetching. The main difference from the timesheet is that dashboards are read-only (no writes), so we don't need the incremental save mechanism.

### Optional Enhancements

1. **localStorage Caching for Dashboard** (similar to timesheet):
   - Cache frequently accessed weeks in `localStorage`.
   - Faster dashboard loads on return visits.
   - Reduce database reads for historical data.

2. **✅ Staleness Detection** (Implemented in `useLocalStorageSync`):
   - Added timestamps to cached weeks.
   - Auto-refresh data older than 1 hour.
   - Prevents stale data overwrites.

3. **Prefetching Strategy**:
   - Preload likely-needed weeks in the background.
   - E.g., when viewing Current Week, prefetch Annual data.
