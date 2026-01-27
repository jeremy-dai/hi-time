# Hi-Time Design System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Theme Colors](#theme-colors)
3. [Modern Visual Effects](#modern-visual-effects)
4. [Typography](#typography)
5. [Color System](#color-system)
6. [Spacing & Layout](#spacing--layout)
7. [Component Patterns](#component-patterns)
8. [Border Radius System](#border-radius-system)
9. [Animations & Transitions](#animations--transitions)

---

## Overview

The design system uses a **Centralized Token Architecture** to ensure consistency across the application. It adheres to a **"Pro SaaS" Aesthetic**, characterized by high information density, refined typography, and glassmorphism.

**Single Source of Truth**:
- **CSS Variables**: Defined in `src/index.css` (Tailwind v4 Theme)
- **TypeScript Constants**: Defined in `src/constants/designTokens.ts`

### Best Practices
1. **Never Hardcode Values**: Do not use arbitrary values like `w-[170px]` or `text-[10px]`. Always use the semantic utility classes (e.g., `w-sidebar`, `text-2xs`).
2. **Use Shared Components**: Prefer `<Card>` and `<Button>` over raw `div` elements to ensure consistent glassmorphism and interaction states.
3. **Follow the Token Scale**: Use the defined spacing and typography scales.

---

## Theme Colors

### Emerald & Zinc Theme

The application uses a **refined Emerald** color palette that creates a professional, calm, and focused atmosphere. This theme replaces the previous Lime/Chartreuse theme.

#### Primary Theme Colors

| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary Brand** | Emerald 600 | `#059669` | Primary buttons, active states, key indicators |
| **Primary Hover** | Emerald 700 | `#047857` | Hover states for primary elements |
| **Primary Light** | Emerald 50 | `#ecfdf5` | Backgrounds, banners, active item backgrounds |
| **Accent** | Emerald 500 | `#10b981` | Success states, progress bars |
| **Neutral Dark** | Zinc 900 | `#18181b` | Headings, primary text |
| **Neutral Base** | Zinc 600 | `#52525b` | Body text, secondary information |

#### Supporting Colors

| Purpose | Color | Tailwind Class | Usage |
|---------|-------|----------------|-------|
| Success | Emerald 600 | `text-emerald-600` | Success messages, positive trends |
| Warning | Amber 500 | `text-amber-500` | Warnings, alerts |
| Error | Red 600 | `text-red-600` | Error states, destructive actions |
| Secondary | Zinc 100 | `bg-zinc-100` | Secondary buttons, backgrounds |

---

## Modern Visual Effects

### Glassmorphism

The core of the new aesthetic is **True Glassmorphism**. Elements float above the background with semi-transparency and blur.

**Standard Glass Card Style:**
```css
.glass-card {
  background-color: rgba(255, 255, 255, 0.7); /* 70% opacity */
  backdrop-filter: blur(24px); /* backdrop-blur-xl */
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 30px rgba(0,0,0,0.04); /* Soft diffused shadow */
}
```

- **Background**: `bg-white/70`
- **Blur**: `backdrop-blur-xl`
- **Border**: `border-white/40`
- **Shadow**: `shadow-sm` or custom soft shadow

### Surface Style (Banners/Panels)

For lighter elements like banners or secondary panels:
- **Background**: `bg-white/50`
- **Blur**: `backdrop-blur-sm`
- **Border**: `border-emerald-100`

### Mesh Gradients

The global background utilizes a continuous mesh gradient to add depth without distraction. The body background is set to a fixed mesh pattern that remains consistent as the user navigates.

---

## Typography

### Font Family

The application uses **Inter** as the primary font family, providing excellent readability at all sizes.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Typography Scale

| Purpose | Tailwind Class | Style |
|---------|----------------|-------|
| **Primary Data** | `text-4xl font-bold tracking-tight` | Key KPI values |
| Page Title | `text-2xl font-bold tracking-tight` | Tight tracking for headings |
| Section Heading | `text-lg font-semibold tracking-tight` |  |
| Body | `text-sm font-normal text-zinc-600` | Relaxed readability |
| Caption | `text-xs font-medium text-zinc-500` |  |
| **Data Label** | `text-2xs font-bold uppercase tracking-wider` | **10px Pro SaaS Label** |

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

### Ghost Colors

For displaying last year's data:
- Same text color as regular cells
- Much lighter background (e.g., `#e5f3ed` vs `#b5d9c8` for Rest)
- Creates subtle visual reference without overwhelming current data

---

## Spacing & Layout

### Page Layout System (v2.1 - Jan 2026)

All pages use the standardized `PageContainer` and `PageHeader` components which implement a unified white card layout system.

#### PageContainer Component

**Location**: `components/layout/PageContainer.tsx`

**Purpose**: Provides consistent page structure with unified glass/card styling and integrated sidebar support.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sidebar` | `ReactNode` | - | Optional sidebar content |
| `sidebarWidth` | `'narrow' \| 'wide'` | `'wide'` | Sidebar width (w-32 or w-72) |
| `sidebarCollapsible` | `boolean` | `false` | Enable sidebar collapse on desktop |
| `header` | `ReactNode` | - | Page header (usually PageHeader component) |
| `className` | `string` | - | Additional classes |

```typescript
  // Sidebar widths
  sidebarNarrow: 'w-[var(--sidebar-width-collapsed)]',
  sidebarWide: 'w-[var(--sidebar-width)]',
  sidebarCollapsed: 'w-[var(--sidebar-width-collapsed)]',
} as const
```

**Unified Layout:**
All pages now share the same visual foundation:
- **Background**: Glass/White (`bg-white` or `glass-card`)
- **Border Radius**: Extra Large (`rounded-xl`)
- **Shadow**: Small (`shadow-sm`)
- **Padding**: Responsive (`p-3 sm:p-6`)

#### PageHeader Component

**Location**: `components/layout/PageHeader.tsx`

**Purpose**: Provides consistent page headers with title, icon, sync status, and optional actions.

**Unified Header Style:**
- Large title (`text-2xl`, tight tracking)
- Icon support (`text-emerald-600`)
- Sync status on the right
- Year navigation support
- Clean, minimal design

### Legacy Layout Patterns (Pre-v2.0)

**Note**: The patterns below are deprecated. New pages should use `PageContainer` and `PageHeader`.

#### Pattern 1: Gradient Background with Sidebar (Legacy)
Used for pages with rich navigation or sidebar elements: **Learning**, **WeeklyReview**, **QuarterlyPlan**

```tsx
// Outer container
<div className="h-full flex bg-linear-to-br from-gray-50 to-gray-100/50">
  {/* Sidebar and Main Content */}
</div>
```

#### Pattern 2: Card Layout (Legacy)
Used for simpler pages rendered as cards: **Dashboard**, **Memories**

### Padding System

| Context | Tailwind Class | Size |
|---------|----------------|------|
| Card Large | `p-6` | 1.5rem / 24px |
| Card Medium | `p-4` | 1rem / 16px |
| Card Small | `p-3` | 0.75rem / 12px |
| Button | `px-4 py-2` | 1rem × 0.5rem |
| Input | `px-4 py-2.5` | 1rem × 0.625rem |

### Mobile-First Responsive Design (v2.2 - Jan 2026)

Hi-Time uses a **mobile-first approach** where all spacing, typography, and layout patterns default to mobile-optimized values and scale up for larger screens.

#### Core Principles
1. **Start Small, Scale Up**: Design for mobile first, then enhance for desktop.
2. **Consistent Breakpoints**: Use Tailwind's standard breakpoints (sm: 640px, md: 768px, lg: 1024px).
3. **Progressive Enhancement**: Add complexity only where screen space allows.
4. **Touch-Friendly**: Ensure all interactive elements meet minimum touch target sizes.

#### Responsive Spacing Scale

**Container Padding** (cards, panels):
```tsx
// Mobile (default) → Tablet+ (md:)
p-4 md:p-6          // 16px → 24px (standard for cards)
p-3 md:p-4          // 12px → 16px (containers, nested elements)
```

**Section Gaps** (spacing between major sections):
```tsx
// Mobile (default) → Tablet+ (md:)
gap-4 md:gap-6      // 16px → 24px
space-y-4 md:space-y-6   // Vertical spacing
```

**Component Gaps**:
```tsx
// Mobile (default) → Tablet+ (md:)
gap-3 md:gap-4      // 12px → 16px (KPI cards, grids)
gap-2 md:gap-3      // 8px → 12px (small elements, icons)
```

#### Touch Target Guidelines

All interactive elements should meet minimum touch target sizes for mobile usability:

| Element Type | Minimum Size | Recommended Class |
|-------------|--------------|-------------------|
| **Large Buttons** | 44px × 44px | `p-3` or `px-4 py-3` |
| **Regular Buttons** | 40px × 40px | `p-2.5` or `px-3 py-2.5` |
| **Icon Buttons** | 40px × 40px | `p-2.5`, icon size 20px+ |
| **List Items** | 44px height min | `py-3` |

#### Breakpoint Usage Guidelines

| Breakpoint | Size | Usage |
|-----------|------|-------|
| **default** | < 640px | Mobile phones (primary target) |
| **sm:** | ≥ 640px | Large phones, small tablets (text scaling) |
| **md:** | ≥ 768px | Tablets, small laptops (layout changes) |
| **lg:** | ≥ 1024px | Laptops, desktops (grid expansions) |

**Primary Breakpoint**: Use `md:` (768px) for most layout changes (sidebar visibility, grid columns).

### Container Widths

| Purpose | Tailwind Class | Max Width |
|---------|----------------|-----------|
| Settings Panel | `max-w-6xl` | 72rem / 1152px |
| Modal | `max-w-md` | 28rem / 448px |

---

## Component Patterns

### 1. Card Component

**Location**: `components/shared/Card.tsx`

Updated to use glassmorphism by default.

```tsx
<div className="glass-card rounded-xl p-6 transition-all duration-300 hover:shadow-md">
  {children}
</div>
```

### 2. Floating Transparent Sidebar

**Location**: `components/Sidebar.tsx`

- **Style**: Transparent floating panel over mesh background (no longer a solid column).
- **Glass Effect**: `bg-white/40 backdrop-blur-md`
- **Active Item**: 
  - Left border indicator (`w-1 bg-emerald-500`)
  - Transparent background with Emerald text (`text-emerald-700 bg-white/50`)
- **Inactive Item**: Zinc text (`text-zinc-500`), hover effect (`hover:bg-white/50 hover:text-zinc-900`)

### 3. Segmented Controls (Tabs)

**Location**: `components/plan/TodayView.tsx` (and others)

Replaces standard tabs with a pill-shaped button group.

- **Container**: `bg-zinc-100/50 p-1 rounded-lg inline-flex`
- **Active Tab**: `bg-white shadow-sm text-zinc-900 ring-1 ring-black/5`
- **Inactive Tab**: `text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50`

### 4. KPI Cards

**Location**: `components/plan/components/KPICard.tsx`

Designed for high information density and visual interest.

- **Typography**: 
  - Label: `text-2xs font-semibold uppercase tracking-wider text-zinc-500`
  - Value: `text-4xl font-bold tracking-tight text-zinc-900`
- **Visuals**: Faint, rotated background icon (`opacity-10`) for visual texture.
- **Glass**: `glass-card` with `hover:scale-[1.02]` transition.

### 5. Timesheet Grid

**Location**: `src/index.css` (Handsontable overrides)

Simplified for clarity and modern aesthetic.

- **Borders**: No vertical borders between cells.
- **Separators**: Dashed faint horizontal lines (`border-bottom: 1px dashed #f4f4f5`).
- **Headers**: Transparent background.

### 6. Sync Status Indicator

**Location**: `components/SyncStatusIndicator.tsx`

**Purpose**: Provides consistent visual feedback for data sync states across all features.

| State | Color | Icon | Meaning |
|-------|-------|------|---------|
| **Synced** | 🟢 Green (`text-green-600`) | ✓ | Data successfully saved to database |
| **Pending** | 🟠 Orange (`text-orange-600`) | ● | Unsaved changes present (local only) |
| **Syncing** | 🔵 Emerald (`text-emerald-600`) | ⋯ | Currently uploading data |
| **Error** | 🔴 Red (`text-red-600`) | ⚠ | Sync failed, retry available |
| **Idle** | ⚫ Gray (`text-gray-500`) | - | No active changes or syncs |

---

## Border Radius System

All UI elements use a **unified border radius system** for consistency:

| Element Type | Border Radius | Usage |
|--------------|---------------|-------|
| **Primary** | `rounded-xl` (0.75rem / 12px) | Cards, containers, buttons, inputs, modals |
| **Grid Elements** | `rounded-sm` (0.125rem / 2px) | Heatmap squares, legend indicators |
| **Circular** | `rounded-full` (9999px) | Badges, avatars, icon buttons |

---

## Animations & Transitions

### Global Transitions

All interactive elements feature smooth transitions.

```css
* {
  @apply transition-colors duration-200;
}
```

### Hover Effects

- **Cards**: Slight lift and shadow increase (`hover:-translate-y-1 hover:shadow-md`)
- **Buttons**: Opacity change or brightness shift
- **Links**: Underline or color shift
