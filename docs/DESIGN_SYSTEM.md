# Hi-Time Design System Documentation

Last Updated: January 2, 2026

## Table of Contents
1. [Overview](#overview)
2. [Theme Colors](#theme-colors)
3. [Border Radius System](#border-radius-system)
4. [Color System](#color-system)
5. [Typography](#typography)
6. [Spacing & Layout](#spacing--layout)
7. [Component Patterns](#component-patterns)
8. [Shadows & Elevation](#shadows--elevation)
9. [Interactive States](#interactive-states)
10. [Animations & Transitions](#animations--transitions)
11. [Design Tokens](#design-tokens)
12. [Improvements & Recommendations](#improvements--recommendations)

---

## Overview

Hi-Time is a time tracking application with a focus on clean, modern design. The design system emphasizes:
- **Consistency**: Unified border radius, spacing, and color usage
- **Accessibility**: High contrast ratios, clear visual hierarchy
- **Responsiveness**: Works on desktop and mobile devices
- **Clarity**: Visual elements that communicate purpose
- **Gentleness**: Soft, calming colors with a mint-green theme
- **Smoothness**: Subtle animations and transitions for better UX

---

## Theme Colors

### Gentle Mint-Green Theme

The application uses a **soft emerald-green** color palette that creates a calm, productive atmosphere. This theme matches the Spring season colors from the left panel and provides visual harmony throughout the interface.

#### Primary Theme Colors

| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary Brand** | Emerald 500 | `#10b981` | Primary buttons, links, accents |
| **Primary Hover** | Emerald 600 | `#059669` | Hover states for primary elements |
| **Primary Light** | Emerald 50 | `#ecfdf5` | Backgrounds, banners, highlights |
| **Accent** | Emerald 500 | `#10b981` | Focus rings, borders |

#### Supporting Colors

| Purpose | Color | Tailwind Class | Usage |
|---------|-------|----------------|-------|
| Success | Emerald 600 | `bg-emerald-600` | Success states, confirmations |
| Warning | Amber 500 | `bg-amber-500` | Warnings, alerts |
| Error | Red 500 | `bg-red-500` | Error states, destructive actions |
| Secondary | Gray 100 | `bg-gray-100` | Secondary buttons, backgrounds |

#### Design Philosophy

The emerald-green theme provides:
1. **Visual Harmony**: Perfectly complements the "Rest" category color and Spring season theme
2. **Calm Energy**: Emerald green is associated with growth, balance, and productivity
3. **Modern Feel**: Fresh, contemporary aesthetic that feels natural and organic
4. **Reduced Eye Strain**: Softer than harsh blues, easier on eyes during long time-tracking sessions
5. **Consistency**: Matches the sidebar's Spring theme (emerald-to-teal gradient)

---

## Border Radius System

### Current Standard (Updated Dec 2025)

All UI elements now use a **unified border radius system** for consistency:

| Element Type | Border Radius | Usage |
|--------------|---------------|-------|
| **Primary** | `rounded-xl` (0.75rem / 12px) | Cards, containers, buttons, inputs, modals, panels |
| **Grid Elements** | `rounded-sm` (0.125rem / 2px) | Heatmap squares, legend indicators, tiny UI elements |
| **Circular** | `rounded-full` (9999px) | Badges, rank indicators, icon backgrounds, avatars |

### Implementation

```tsx
// Cards and Containers
<div className="rounded-xl p-6 bg-white shadow-sm">

// Buttons
<button className="rounded-xl px-4 py-2">

// Inputs
<input className="rounded-xl px-4 py-2.5" />

// Grid Elements (Heatmap)
<div className="rounded-sm w-3 h-3" />

// Badges
<span className="rounded-full px-3 py-1" />
```

### Component Examples

| Component | Border Radius | File Location |
|-----------|---------------|---------------|
| Card | `rounded-xl` | `components/shared/Card.tsx` |
| Dashboard Container | `rounded-xl` | `components/Dashboard.tsx` |
| Settings Panel | `rounded-xl` | `components/Settings.tsx` |
| Sidebar | `rounded-xl` | `components/Sidebar.tsx` |
| Modal Dialog | `rounded-xl` | `components/Settings.tsx` (Clear All Modal) |
| Info Banner | `rounded-xl` | `components/dashboard/AnnualDashboard.tsx` |
| Heatmap Cell | `rounded-sm` | `components/dashboard/WeeklyHeatmap.tsx` |
| Rank Badge | `rounded-full` | `components/insights/TopActivitiesBreakdown.tsx` |

---

## Color System

### Category Colors

The app uses a 5-category system with semantic meaning:

| Category | Code | Color | Hex | Purpose |
|----------|------|-------|-----|---------|
| **Rest** | R | Soft Mint Green | `#b5d9c8` | Rest, sleep, relaxation activities |
| **Work** | W | Soft Golden Beige | `#f9e5c1` | Professional work, productive tasks |
| **Play** | G | Soft Sky Blue | `#b5d3e8` | Leisure, hobbies, entertainment |
| **Procrastination** | P | Dusty Rose | `#d9a5a8` | Unproductive activities, distractions |
| **Mandatory** | M | Dusty Lavender | `#c5b8d4` | Required tasks (commute, errands, etc.) |
| **Empty** | - | Light Gray | `#f3f4f6` | Untracked time |

### Subcategory Shades

Each category has **5 progressive shades** for subcategories:

```typescript
// Example: Rest Category Shades
['#d0e8db', '#b5d9c8', '#9acab5', '#7fbba2', '#64ab8e']
```

These shades are used in:
- Settings subcategory input backgrounds
- Border-left indicators in the timesheet
- Visual differentiation in charts

### Ghost (Reference) Colors

For displaying last year's data:
- Same text color as regular cells
- Much lighter background (e.g., `#e5f3ed` vs `#b5d9c8` for Rest)
- Creates subtle visual reference without overwhelming current data

### UI Colors

| Element | Color | Hex/Tailwind |
|---------|-------|--------------|
| Primary Action | Blue | `bg-blue-600` |
| Primary Action Hover | Darker Blue | `bg-blue-700` |
| Success | Green | `bg-green-600` |
| Warning | Amber | `bg-amber-600` |
| Error | Red | `bg-red-600` |
| Text Primary | Gray 900 | `text-gray-900` |
| Text Secondary | Gray 500-600 | `text-gray-500` |
| Border | Gray 200 | `border-gray-200` |
| Background | White | `bg-white` |
| Background Alt | Gray 50 | `bg-gray-50` |

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...
```

### Font Sizes

| Purpose | Tailwind Class | Size |
|---------|----------------|------|
| Page Title | `text-2xl` | 1.5rem / 24px |
| Section Heading | `text-xl` | 1.25rem / 20px |
| Subsection Heading | `text-lg` | 1.125rem / 18px |
| Body Large | `text-base` | 1rem / 16px |
| Body | `text-sm` | 0.875rem / 14px |
| Caption | `text-xs` | 0.75rem / 12px |

### Font Weights

| Purpose | Tailwind Class | Weight |
|---------|----------------|--------|
| Bold Headings | `font-bold` | 700 |
| Semibold | `font-semibold` | 600 |
| Medium | `font-medium` | 500 |
| Regular | `font-normal` | 400 |

### Line Height

- Headings: `leading-tight` or `leading-none`
- Body text: Default (1.5)
- Compact lists: `leading-relaxed`

---

## Spacing & Layout

### Padding System

| Context | Tailwind Class | Size |
|---------|----------------|------|
| Card Large | `p-6` | 1.5rem / 24px |
| Card Medium | `p-4` | 1rem / 16px |
| Card Small | `p-3` | 0.75rem / 12px |
| Button | `px-4 py-2` | 1rem × 0.5rem |
| Input | `px-4 py-2.5` | 1rem × 0.625rem |

### Margin/Gap System

| Context | Tailwind Class | Size |
|---------|----------------|------|
| Section Gap | `space-y-6` | 1.5rem / 24px |
| Component Gap | `space-y-4` | 1rem / 16px |
| Inline Gap | `space-x-2`, `space-x-3` | 0.5-0.75rem |
| Grid Gap | `gap-6` | 1.5rem / 24px |

### Container Widths

| Purpose | Tailwind Class | Max Width |
|---------|----------------|-----------|
| Settings Panel | `max-w-6xl` | 72rem / 1152px |
| Modal | `max-w-md` | 28rem / 448px |

---

## Component Patterns

### 1. Card Component

**Location**: `components/shared/Card.tsx`

```tsx
<div className="rounded-xl p-6 bg-white shadow-sm">
  {children}
</div>
```

**Usage**: Primary content container throughout the app

---

### 1.1. Sync Status Indicator (STANDARD COMPONENT)

**Location**: `components/SyncStatusIndicator.tsx`

**Purpose**: Provides consistent visual feedback for data sync states across all features.

#### Design Principles

1. **Always Visible**: Sync status should be visible without scrolling or hovering
2. **Color Coded**: Use consistent colors across all features for quick recognition
3. **Non-Intrusive**: Don't block user workflow with modals or alerts
4. **Real-time Updates**: Status should update immediately as state changes
5. **Actionable**: Provide retry/save buttons when appropriate

#### Sync Status States

All features use the same 5-state system:

| State | Color | Icon | Text | Meaning |
|-------|-------|------|------|---------|
| **Synced** | 🟢 Green (`text-green-600`) | ✓ | "Synced" | Data successfully saved to database |
| **Pending** | 🟡 Amber (`text-amber-600`) | ● | "Pending..." | Waiting for debounce timer (will auto-save) |
| **Syncing** | 🔵 Emerald (`text-emerald-600`) | ⋯ (animated) | "Syncing..." | Currently sending data to server |
| **Error** | 🔴 Red (`text-red-600`) | ⚠ | "Sync failed" | Failed to save - may need retry |
| **Idle** | ⚪ Gray (`text-gray-500`) | - | "Idle" | No changes yet (initial state) |

#### Color Palette

```typescript
const SYNC_STATUS_COLORS = {
  synced: 'text-green-600',
  pending: 'text-amber-600',
  syncing: 'text-emerald-600',
  error: 'text-red-600',
  idle: 'text-gray-500'
} as const;
```

#### Component Usage

```tsx
import { SyncStatusIndicator } from '../components/SyncStatusIndicator';

<SyncStatusIndicator
  status={syncStatus}
  lastSynced={lastSynced}
  hasUnsavedChanges={hasUnsavedChanges}
  onSyncNow={handleSyncNow}
  compact={false}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `SyncStatus` | ✅ | Current sync state ('synced' \| 'pending' \| 'syncing' \| 'error' \| 'idle') |
| `lastSynced` | `Date \| null` | ❌ | Timestamp of last successful sync |
| `hasUnsavedChanges` | `boolean` | ✅ | Whether there are unsaved changes |
| `onSyncNow` | `() => void` | ❌ | Callback for manual sync trigger |
| `compact` | `boolean` | ❌ | Use compact display (default: false) |

#### Feature Implementation Status

**✅ All Features Using Standard Component:**
- **Timesheet**: Header (global) - Compact with "Save Now" button
- **Settings**: Header - Compact
- **Memories**: Top banner - Compact (✅ Migrated Dec 2025)
- **Weekly Reviews**: Stats bar - Compact (✅ Migrated Dec 2025)
- **Daily Shipping**: Header - Compact (✅ Migrated Dec 2025)

#### Layout Patterns

**Pattern 1: Header Placement** (Timesheet, Settings, Daily Shipping)
```tsx
<div className="flex items-center justify-between">
  <h1>Page Title</h1>
  <SyncStatusIndicator
    status={syncStatus}
    hasUnsavedChanges={hasUnsavedChanges}
    compact={true}
  />
</div>
```

**Pattern 2: Banner Placement** (Memories)
```tsx
<div className="rounded-xl p-4 bg-emerald-50 text-emerald-900">
  <div className="flex items-center space-x-3">
    <Icon className="w-5 h-5" />
    <div>
      <h3 className="font-semibold text-sm">Title</h3>
      <div className="mt-0.5">
        <SyncStatusIndicator
          status={syncStatus}
          lastSynced={lastSynced}
          hasUnsavedChanges={false}
          compact={true}
        />
      </div>
    </div>
  </div>
</div>
```

**Pattern 3: Stats Bar** (Weekly Reviews)
```tsx
<div className="flex items-center justify-between px-4 py-2 bg-white/60 rounded-xl">
  <div className="flex items-center gap-2 text-sm">
    <Calendar className="w-4 h-4 text-gray-400" />
    <span className="text-gray-600">Context Info</span>
  </div>
  <SyncStatusIndicator
    status={syncStatus}
    hasUnsavedChanges={false}
    compact={true}
  />
</div>
```

#### User Feedback Timeline

Visual feedback follows this timeline:

```
1. User makes change:
   └─> localStorage: instant (0ms)
   └─> UI: No status change (already saved locally)

2. Debounce period (5 seconds):
   └─> Status: "Pending..." (amber)

3. Database sync starts:
   └─> Status: "Syncing..." (emerald, animated)

4. Sync completes:
   └─> Status: "Synced" (green)
   └─> lastSynced: Updated timestamp
```

**Total time from edit to "Synced"**: ~5-6 seconds

#### Standardized Text Labels

For consistency, always use these exact labels:

```typescript
function getSyncStatusText(status: SyncStatus): string {
  switch (status) {
    case 'synced':
      return 'Synced'              // Not "Saved" or "✓ Synced"
    case 'syncing':
      return 'Syncing...'          // Not "Saving..."
    case 'pending':
      return 'Pending...'          // Not "Pending sync" or "Unsaved"
    case 'error':
      return 'Sync failed'         // Not "Error" or "✕ Error"
    case 'idle':
      return 'Idle'
    default:
      return 'Unknown'
  }
}
```

#### Animation

- **Syncing State**: Use `animate-pulse` on the ellipsis icon
- **Transitions**: Smooth color transitions with `transition-colors duration-200`

#### Accessibility

```tsx
<div
  role="status"
  aria-live="polite"
  aria-label={`Sync status: ${getSyncStatusText(syncStatus)}`}
>
  <SyncStatusIndicator {...props} />
</div>
```

#### Related Documentation

- [Database Efficiency](../docs/DATABASE_EFFICIENCY.md) - Backend sync patterns and strategies
- [Database Schema](../docs/DATABASE_SCHEMA.md) - Data structure and storage
- TypeScript types: `hooks/useLocalStorageSync.ts`

---

### 1.2. Toast Notification System

**Location**: `components/shared/Toast.tsx`, `components/shared/ToastContext.tsx`

**Features**:
- Global toast notifications positioned top-right
- 4 variants: success (emerald), error (red), warning (amber), info (emerald)
- Auto-dismiss after 4 seconds with countdown bar
- Manual dismiss with X button
- Stacks up to 5 toasts with slide-in animations

**Setup** (already done in App.tsx):
```tsx
import { ToastProvider } from './components/shared/ToastContext'
import { ToastContainer } from './components/shared/Toast'

<ToastProvider>
  <ToastContainer />
  <YourApp />
</ToastProvider>
```

**Usage**:
```tsx
import { useToast } from './components/shared/ToastContext'

function MyComponent() {
  const { showToast } = useToast()

  showToast('Settings saved successfully!', 'success')
  showToast('Please fix validation errors', 'warning')
  showToast('Failed to save', 'error')
  showToast('Processing your request', 'info')
}
```

---

### 1.3. IconButton Component

**Location**: `components/shared/IconButton.tsx`

**Features**:
- 3 sizes: `sm` (28px), `md` (36px), `lg` (44px)
- 3 variants: `default` (gray), `danger` (red), `ghost` (transparent)
- Emerald focus rings for accessibility
- Disabled state support

**Usage**:
```tsx
import { IconButton } from './components/shared/IconButton'

<IconButton
  size="sm"
  variant="danger"
  icon={<XIcon />}
  onClick={handleDelete}
  title="Delete item"
/>
```

---

### 1.4. ClearableInput Component

**Location**: `components/shared/ClearableInput.tsx`

**Features**:
- Built-in clear button (appears only when input has content)
- Character counter with color warnings
- Character limit enforcement
- Custom background color support

**Usage**:
```tsx
import { ClearableInput } from './components/shared/ClearableInput'

<ClearableInput
  value={value}
  onChange={setValue}
  placeholder="Enter text"
  maxLength={30}
  showCharCount={true}
  backgroundColor="#e0f2f1"
/>
```

---

### 1.5. SkeletonLoader Component

**Location**: `components/shared/SkeletonLoader.tsx`

**Features**:
- Shimmer animation with emerald-tinted gradient
- 3 variants: `card`, `grid`, `text`
- GPU-accelerated animations

**Usage**:
```tsx
import { SkeletonLoader } from './components/shared/SkeletonLoader'

// Loading a card
<SkeletonLoader variant="card" height="120px" />

// Loading a grid of inputs
<SkeletonLoader variant="grid" count={5} />

// Loading text lines
<SkeletonLoader variant="text" count={3} />
```

---

### 1.5.1. Loading State Pattern (STANDARD PATTERN)

**Purpose**: Provide consistent loading feedback across all data-fetching components to prevent jarring "zero data suddenly fills in" transitions.

#### Design Principles

1. **Predictable Layout**: Loading skeletons should match the layout of actual content
2. **Smooth Transitions**: Never show empty states before data loads
3. **Single Source**: Use `isLoading` state from hooks (useYearMemories, useWeekReviews, etc.)
4. **Appropriate Sizing**: Skeleton heights should approximate actual content height
5. **Minimal Code**: Leverage existing SkeletonLoader component, no custom implementations

#### Implementation Pattern

**Standard Pattern** (used across all data-fetching components):

```tsx
import { SkeletonLoader } from './components/shared/SkeletonLoader'

function MyComponent() {
  // 1. Extract isLoading from hooks
  const { data, isLoading: isLoadingData } = useDataHook()
  const { otherData, isLoading: isLoadingOther } = useOtherHook()

  // 2. Combine multiple loading states
  const isLoading = isLoadingData || isLoadingOther

  return (
    <div>
      {/* 3. Conditional render with ternary */}
      {isLoading ? (
        <SkeletonLoader variant="card" height="400px" />
      ) : (
        <ActualContent data={data} />
      )}
    </div>
  )
}
```

#### Feature Implementation Status

**✅ All Major Components Using Standard Pattern:**

| Component | Hooks Used | Skeleton Layout | File |
|-----------|-----------|-----------------|------|
| **Memories** | `useYearMemories` | 1 card (600px) | `components/Memories.tsx:60-69` |
| **WeeklyReview** | `useWeekReviews`<br/>`useAnnualReview` | 3 cards (200px, 400px, 400px) | `components/WeeklyReview.tsx:616-661` |
| **AnnualDashboard** | `useYearMemories`<br/>`useWeekReviews`<br/>`useDailyShipping` | 2×300px cards + 400px card + 500px card | `components/dashboard/AnnualDashboard.tsx:223-283` |
| **Settings** | `useLocalStorageSync` | 3 cards (120px, 400px, 200px) | `components/Settings.tsx:252-260` |

#### Layout Patterns

**Pattern 1: Single Content Area** (Memories)
```tsx
{isLoading ? (
  <SkeletonLoader variant="card" height="600px" />
) : (
  <AnnualMemoryCalendar {...props} />
)}
```

**Pattern 2: Multiple Sections** (WeeklyReview)
```tsx
{isLoading ? (
  <div className="space-y-6">
    <SkeletonLoader variant="card" height="200px" />
    <SkeletonLoader variant="card" height="400px" />
    <SkeletonLoader variant="card" height="400px" />
  </div>
) : (
  <>
    <AnnualReviewSection {...props} />
    <SeasonSections {...props} />
  </>
)}
```

**Pattern 3: Preserving Structure** (AnnualDashboard)
```tsx
{isLoading ? (
  <div className="space-y-6">
    <div>
      <h2>📊 Overview</h2>
      <div className="grid grid-cols-2 gap-6">
        <SkeletonLoader variant="card" height="300px" />
        <SkeletonLoader variant="card" height="300px" />
      </div>
    </div>
    <div>
      <h2>📈 Trends</h2>
      <SkeletonLoader variant="card" height="500px" />
    </div>
  </div>
) : (
  <>{/* Actual dashboard content */}</>
)}
```

#### Combining Multiple Loading States

When a component depends on multiple data sources:

```tsx
// ✅ CORRECT: Combine with OR operator
const { memories, isLoading: isLoadingMemories } = useYearMemories(year)
const { reviews, isLoading: isLoadingReviews } = useWeekReviews(year)
const { entries, isLoading: isLoadingShipping } = useDailyShipping(year)

const isLoading = isLoadingMemories || isLoadingReviews || isLoadingShipping

// Show loading until ALL data is ready
return isLoading ? <SkeletonLoader /> : <Content />
```

```tsx
// ❌ INCORRECT: Checking individual states separately
{isLoadingMemories && <SkeletonLoader />}
{isLoadingReviews && <SkeletonLoader />}
// This causes multiple skeletons to appear sequentially
```

#### Skeleton Sizing Guidelines

Match skeleton heights to approximate content:

| Content Type | Recommended Height | Example |
|-------------|-------------------|---------|
| Stats Bar | 60-80px | Settings header |
| Small Card | 120-200px | KPI cards, mini charts |
| Medium Card | 300-400px | Category breakdown, week reviews |
| Large Card | 500-600px | Full calendar, heatmap |

#### User Experience Timeline

```
1. User navigates to page:
   └─> Skeleton loader appears instantly (0ms)

2. Hooks fetch data from database:
   └─> Duration: ~100-500ms (varies by data size)

3. Data loaded, setState called:
   └─> Skeleton disappears, content fades in

Total perceived load time: <1 second
```

#### Anti-Patterns to Avoid

**❌ Don't: Flash empty content before showing data**
```tsx
// BAD: Shows empty state briefly, then fills with data
return <Content data={data || []} />
```

**❌ Don't: Create custom loading components**
```tsx
// BAD: Unnecessary duplication
function MyCustomLoader() {
  return <div className="animate-pulse bg-gray-200 h-96" />
}
```

**❌ Don't: Show loading text instead of skeleton**
```tsx
// BAD: Poor UX, doesn't preserve layout
{isLoading && <p>Loading...</p>}
```

**✅ Do: Use SkeletonLoader with appropriate sizing**
```tsx
// GOOD: Preserves layout, smooth transition
{isLoading ? <SkeletonLoader variant="card" height="400px" /> : <Content />}
```

#### Related Patterns

- **Sync Status Indicator** (Section 1.1): Shows save/sync state after data loads
- **Error Boundaries**: Handle loading errors gracefully
- **Optimistic Updates**: Update UI before API responds

#### Benefits

**User Experience:**
- ✅ No jarring empty-to-full transitions
- ✅ Predictable layout (no content shift)
- ✅ Professional, polished feel

**Developer Experience:**
- ✅ Consistent pattern across all components
- ✅ Minimal code (just ternary + existing component)
- ✅ Easy to maintain and update

**Performance:**
- ✅ GPU-accelerated animations
- ✅ No additional JavaScript overhead
- ✅ Instant rendering (no loading delay)

---

### 1.6. Modal Component

**Location**: `components/shared/Modal.tsx`

**Features**:
- Full keyboard accessibility (ESC to close, focus trap)
- Click outside to dismiss (optional)
- 3 variants: `default`, `danger`, `warning`
- Smooth animations

**Usage**:
```tsx
import { Modal } from './components/shared/Modal'

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Delete"
  description="This action cannot be undone."
  icon={<WarningIcon />}
  variant="danger"
  actions={
    <>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onConfirm}>Delete</button>
    </>
  }
  closeOnBackdrop={true}
/>
```

---

### 2. Dashboard Cards

**Variants**:
- **KPI Cards**: Category breakdowns with progress bars
- **Stat Cards**: Numerical metrics with trends
- **Chart Cards**: Visualization containers

**Pattern**:
```tsx
<div className="rounded-xl p-6 bg-white shadow-sm">
  <h3 className="text-lg font-semibold mb-3 text-gray-900">
    {title}
  </h3>
  <div className="space-y-4">
    {content}
  </div>
</div>
```

---

### 3. Info Banners

**Location**: Throughout dashboards

```tsx
<div className="rounded-xl p-4 bg-blue-50 text-blue-900">
  <div className="flex items-center space-x-3">
    <Icon className="w-5 h-5 text-blue-600" />
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs mt-0.5 opacity-90">{description}</p>
    </div>
  </div>
</div>
```

**Color Variants**:
- Blue: Information/Analysis (`bg-blue-50 text-blue-900`)
- Amber: Warning/Unsaved (`bg-amber-50 text-amber-700`)
- Green: Success (`bg-green-50 text-green-700`)
- Red: Error (`bg-red-50 text-red-700`)

---

### 4. Buttons

**Primary Button**:
```tsx
<button className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors">
  Action
</button>
```

**Secondary Button**:
```tsx
<button className="rounded-xl px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
  Action
</button>
```

**Danger Button**:
```tsx
<button className="rounded-xl px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-sm transition-colors">
  Delete
</button>
```

---

### 5. Form Inputs

**Text Input**:
```tsx
<input
  type="text"
  className="rounded-xl px-4 py-2.5 text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
/>
```

**Select Dropdown**:
```tsx
<select className="rounded-xl px-4 py-2.5 bg-white border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Option</option>
</select>
```

---

### 6. Modal Dialog

**Pattern**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

  {/* Modal */}
  <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
    {content}
  </div>
</div>
```

---

### 7. Sidebar Navigation

**Location**: `components/Sidebar.tsx`

**Features**:
- Season-based week indicator with gradients
- Icon-based navigation items
- Rounded container (`rounded-xl`)
- Active state highlighting

**Season Colors**:
- Spring: Emerald/Teal gradient
- Summer: Amber/Orange gradient
- Fall: Orange/Amber gradient
- Winter: Sky/Blue gradient

---

### 8. Badges & Tags

**Rank Badge** (Circular):
```tsx
<div className="rounded-full w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 font-bold text-sm">
  1
</div>
```

**Category Badge** (Pill):
```tsx
<span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700">
  Work
</span>
```

---

## Shadows & Elevation

### Shadow System

| Level | Tailwind Class | Usage |
|-------|----------------|-------|
| Subtle | `shadow-sm` | Cards, containers, default elevation |
| Medium | `shadow-md` | Hover states, raised elements |
| Large | `shadow-2xl` | Modals, dialogs |
| None | `shadow-none` | Nested elements, flat surfaces |

### Elevation Hierarchy

1. **Base Layer** (`shadow-sm`): Cards, panels
2. **Raised Layer** (`shadow-md`): Buttons on hover
3. **Overlay Layer** (`shadow-2xl`): Modals, dropdowns

---

## Interactive States

### Hover States

**Buttons**:
- Color shift: `bg-blue-600 hover:bg-blue-700`
- Shadow increase: `shadow-sm hover:shadow-md`

**Cards** (if interactive):
- Border highlight: `hover:border-blue-300`
- Shadow increase: `hover:shadow-md`

**Links/Nav Items**:
- Background: `hover:bg-gray-100`
- Color: `hover:text-blue-600`

### Focus States

**All Inputs**:
```tsx
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

**Buttons**:
```tsx
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### Active/Selected States

**Sidebar Item**:
```tsx
// Active
className="bg-blue-50 text-blue-600"

// Inactive
className="text-gray-600 hover:bg-gray-100"
```

### Disabled States

```tsx
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Transitions & Animations

### Standard Transitions

```tsx
transition-colors // Color changes (200ms)
transition-all    // Multiple properties
transition-shadow // Shadow changes
```

### Durations

- Default: 150ms
- Color/background: `duration-200`
- Transform: `duration-300`

### Loading Spinner

```tsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
```

---

---

## Animations & Transitions

### Page Transitions

All major page transitions use smooth fade-in animations:

```tsx
// Applied to all tab content
className="animate-in fade-in duration-200"
```

### Button Micro-interactions

Buttons automatically get smooth color transitions:

```css
/* Applied globally to all interactive elements */
button, a, input, select {
  transition: color 0.2s, background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
}
```

### Animation Utilities

| Animation | Class | Duration | Usage |
|-----------|-------|----------|-------|
| Fade In | `animate-in fade-in` | 200ms | Page transitions, content loading |
| Slide Up | `slide-in-from-bottom` | 300ms | Modals, tooltips |
| Spin | `animate-spin` | Continuous | Loading spinners |

### Performance

- All animations use CSS transforms and opacity for GPU acceleration
- Duration kept under 300ms for snappy feel
- No animations on data tables to maintain performance

---

## Design Tokens

### Location

Centralized design tokens are defined in:
- **`src/constants/designTokens.ts`** - All design system constants
- **`src/constants/colors.ts`** - Category color definitions
- **`src/index.css`** - CSS custom properties and global styles

### Usage Example

```tsx
import { BUTTON, COLORS, RADIUS, SPACING } from '@/constants/designTokens'

// Using pre-defined button styles
<button className={BUTTON.primary}>
  Click Me
</button>

// Composing custom styles
<div className={`${RADIUS.default} ${SPACING.cardLg} ${COLORS.bgWhite}`}>
  Content
</div>
```

### Available Tokens

| Category | Tokens |
|----------|--------|
| **Border Radius** | `RADIUS.sm`, `RADIUS.default`, `RADIUS.full` |
| **Spacing** | `SPACING.cardLg`, `SPACING.sectionGap`, etc. |
| **Colors** | `COLORS.primary`, `COLORS.danger`, `COLORS.info`, etc. |
| **Typography** | `TYPOGRAPHY.size.*`, `TYPOGRAPHY.weight.*` |
| **Shadows** | `SHADOW.sm`, `SHADOW.md`, `SHADOW.xl` |
| **Transitions** | `TRANSITION.colors`, `TRANSITION.all` |
| **Buttons** | `BUTTON.primary`, `BUTTON.secondary`, `BUTTON.danger` |
| **Cards** | `CARD.default`, `CARD.compact` |
| **Inputs** | `INPUT.default` |
| **Banners** | `BANNER.info`, `BANNER.success`, etc. |

---

## Improvements & Recommendations

### ✅ Recently Completed (Dec 2025)

#### 1. Unified Border Radius System
- Standardized **all** UI elements to use consistent border radius values
- Replaced inconsistent usage of `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-2xl`, `rounded-3xl`
- **72 instances** now use `rounded-xl` (cards, buttons, inputs, modals, panels)
- **6 instances** use `rounded-sm` (heatmap cells, legend squares)
- **17 instances** use `rounded-full` (badges, rank indicators, avatars)
- Improved visual consistency across the entire application

#### 2. Emerald-Green Theme Implementation
- Replaced all blue theme colors (`bg-blue-*`, `text-blue-*`, `border-blue-*`) with emerald-green
- Created harmonious color palette inspired by the sidebar's Spring theme
- **100+ color class replacements** across 14+ component files
- Better visual balance with category colors
- Reduced eye strain with calming, natural colors
- Perfectly complements the "Rest" category and Spring season theme

**Why Emerald Green?**
- **Visual Harmony**: Matches the sidebar Spring theme (emerald-to-teal gradient)
- **Calm & Productive**: Associated with balance, growth, and focus
- **Eye Comfort**: Softer than harsh blues, better for extended use
- **Modern & Fresh**: Contemporary, organic feel

#### 3. Design Tokens System
- Created `src/constants/designTokens.ts` - **170 lines** of centralized design constants
- Created `src/utils/animations.ts` - **53 lines** of animation utilities
- Pre-defined component patterns for buttons, cards, inputs, and banners
- Easy to maintain and update
- Consistent usage across components with TypeScript autocomplete
- Update one value, changes propagate everywhere

**Token Categories**:
- Border Radius, Spacing, Colors, Typography
- Shadows, Transitions
- Complete Patterns: `BUTTON.*`, `CARD.*`, `INPUT.*`, `BANNER.*`

#### 4. Smooth Animations & Transitions
- Added page transition animations for all tab switches (`animate-in fade-in duration-200`)
- Global smooth transitions for all interactive elements (buttons, links, inputs)
- Typography improvements with letter-spacing (`tracking-tight` for headings)
- Performance-optimized: uses CSS transforms and opacity (GPU accelerated)
- All animations under 300ms for snappy feel
- No animations on data tables to maintain performance

#### 5. Comprehensive Documentation
- Created this DESIGN_SYSTEM.md - **751 lines** of comprehensive documentation
- Covers all aspects: colors, typography, spacing, components, patterns
- Includes code examples, usage guidelines, and best practices
- Living document that evolves with the application

#### 6. Standardized Sync Status Component (Dec 2025)
- **Migrated all features** to use the standard `SyncStatusIndicator` component
- **Removed 87 lines** of duplicate sync status code across 3 components:
  - Memories: Removed `formatLastSynced()`, `getSyncStatusColor()`, `getSyncStatusText()` (45 lines)
  - Weekly Reviews: Removed `getSyncStatusColor()`, `getSyncStatusText()` (28 lines)
  - Daily Shipping: Removed `getSyncIndicator()` (14 lines)
- **Enhanced component** to support both `'idle'` and non-idle sync states
- **100% consistency** across all 5 features (Timesheet, Settings, Memories, Weekly Reviews, Daily Shipping)
- **Single source of truth** for sync status display and behavior
- **Improved maintainability**: Changes to sync UI now update all features automatically

### Impact Summary

**Code Changes**:
- **3 new files**: designTokens.ts, animations.ts, DESIGN_SYSTEM.md
- **14+ component files** modified with new colors and border radius
- **95 border radius instances** standardized to 3 values
- **100+ color classes** updated to emerald theme
- **87 lines of duplicate code removed** via SyncStatusIndicator migration
- **1 enhanced component** (SyncStatusIndicator) now supports all sync state patterns

**User Experience**:
- ✅ Unified visual language across all pages
- ✅ Subtle animations improve perceived performance
- ✅ Calmer, easier on eyes during long sessions
- ✅ Modern, professional appearance

**Developer Experience**:
- ✅ Centralized design values in constants
- ✅ Comprehensive reference documentation
- ✅ Pre-defined component patterns for efficiency
- ✅ Easy to extend and modify

**Design Principles Applied**:
1. **Consistency Over Novelty**: Unified border radius, single color theme, standardized spacing
2. **Simplicity Over Complexity**: No complex theme switching, no elaborate component library, no unnecessary abstractions
3. **Calm Over Excitement**: Soft emerald colors, subtle animations (200-300ms), generous spacing
4. **Function Over Form**: All improvements serve usability, performance-first approach

### 🎯 Potential Future Improvements

1. **Component Library**
   - Expand `components/shared/` directory
   - Add more reusable components:
     - `Button.tsx` with variants
     - `Input.tsx` with validation states
     - `Badge.tsx` with color variants
     - `Banner.tsx` for info/warning/error messages

2. **Accessibility**
   - ✅ Good: High contrast ratios in category colors
   - ✅ Good: Focus states on all interactive elements
   - ⚠️ Consider: Adding `aria-label` to icon-only buttons
   - ⚠️ Consider: Keyboard navigation improvements

3. **Responsive Design**
   - Current: Grid layouts use `grid-cols-2` with `gap-6`
   - Improvement: Add responsive breakpoints
   ```tsx
   className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
   ```

4. **Dark Mode Support**
   - Current: Light mode only
   - Future: Consider adding dark mode
   - Use Tailwind's `dark:` variant

5. **Enhanced Data Visualization**
   - Smooth data updates in charts
   - Transitions when switching time ranges
   - Interactive tooltips with animations

---

## File Organization

### Component Structure

```
src/
├── components/
│   ├── shared/           # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── Tooltip.tsx
│   │   └── ...
│   ├── layout/           # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── SidebarItem.tsx
│   ├── dashboard/        # Dashboard-specific components
│   ├── insights/         # Analytics/insights components
│   └── calendar/         # Calendar/timesheet components
├── constants/
│   └── colors.ts         # Centralized color definitions
├── utils/
│   └── classNames.ts     # cn() utility for conditional classes
└── ...
```

---

## Design Principles

### 1. Consistency Over Novelty
- Use established patterns
- Unified visual language
- Predictable interactions

### 2. Clarity Over Density
- Generous spacing (p-6, space-y-6)
- Clear visual hierarchy
- Readable font sizes

### 3. Performance Over Perfection
- Efficient re-renders
- Optimized animations
- Fast load times

### 4. Accessibility First
- Keyboard navigation
- Screen reader support
- High contrast ratios

---

## Usage Guidelines

### When to Create New Components

1. **Repeated Patterns**: If a UI pattern appears 3+ times
2. **Complex Logic**: If component has significant state/behavior
3. **Customization**: If multiple variants are needed

### When to Use Existing Components

1. **Card**: Any primary content container
2. **Banner**: Info/warning/error messages
3. **Button Patterns**: All CTAs should follow button patterns

### Naming Conventions

- **Components**: PascalCase (`KPICards.tsx`)
- **Utilities**: camelCase (`classNames.ts`)
- **Constants**: UPPER_SNAKE_CASE (`CATEGORY_COLORS`)

---

## Maintenance

### Regular Reviews

- **Quarterly**: Review for unused styles
- **Per Feature**: Ensure new components follow system
- **Per Release**: Update this documentation

### Version History

- **v1.0** (Dec 2025): Initial design system with unified border radius
- **v1.1** (Jan 2026): Added comprehensive Loading State Pattern documentation

---

## Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Figma Design**: [Add link if available]
- **Style Guide**: This document

---

*This design system is a living document. Update it as the application evolves.*
