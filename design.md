# PillPilot - Design System

Related documents:
- `PRD_PillPilot.md` — product requirements, user stories
- `tech-stack.md` — stack, conventions, folder structure
- `technical-requirements.md` — data model, schemas, business logic
- `ROADMAP.md` — implementation checklist

## Design philosophy: "Apothecary Modern"

Inspiration from old apothecaries and herbalism combined with modern, minimal UI. PillPilot should look like a **warm, trustworthy** wellness app — NOT like a cold, clinical hospital system. Daily use requires visual pleasure and calm, not sterility.

Tone: **warm, organic, confident, calming.**

---

## Color palette

### @theme (Tailwind CSS 4)

```css
@theme {
  --color-*: initial;

  --color-white: #ffffff;
  --color-black: #000000;

  /* === Background === */
  --color-surface: #faf7f2;            /* Cream background — warm off-white */
  --color-surface-alt: #f3ede4;        /* Slightly darker cream for sections */
  --color-surface-raised: #ffffff;      /* Cards, modals */
  --color-surface-sunken: #ede7db;      /* Inset elements, inputs */

  /* === Text === */
  --color-content: #2c2417;             /* Dark brown — warmer than black */
  --color-content-muted: #6b5d4f;       /* Medium brown */
  --color-content-faint: #9c8e7e;       /* Light brown, placeholders */
  --color-content-inverse: #faf7f2;     /* Text on dark background */

  /* === Brand (Sage Green) === */
  --color-brand-50: #f2f5f0;
  --color-brand-100: #e1e8dc;
  --color-brand-200: #c5d4bc;
  --color-brand-300: #a3bc96;
  --color-brand-400: #7fa06e;
  --color-brand-500: #5c8a4a;            /* Main accent */
  --color-brand-600: #4a7039;
  --color-brand-700: #3a5a2d;
  --color-brand-800: #2d4623;
  --color-brand-900: #1e2f18;

  /* === Status === */
  --color-success: #5c8a4a;             /* brand-500, checked off */
  --color-warning: #c4882b;             /* Warm amber, stock alerts */
  --color-danger: #b84233;              /* Muted red, critical medications */
  --color-info: #4a7a8a;                /* Muted teal */

  /* === Status backgrounds (for badges and chips) === */
  --color-success-bg: #e8f0e4;
  --color-warning-bg: #fdf0dc;
  --color-danger-bg: #f5e0dd;
  --color-info-bg: #dff0f5;

  /* === Borders === */
  --color-edge: #e0d8cc;
  --color-edge-subtle: #ede7db;
  --color-edge-strong: #c5baa8;

  /* === Interaction === */
  --color-interactive-hover: rgba(92, 138, 74, 0.08);
  --color-interactive-active: rgba(92, 138, 74, 0.14);
  --color-focus-ring: rgba(92, 138, 74, 0.4);

  /* === Overlay === */
  --color-overlay: rgba(44, 36, 23, 0.5);

  /* === Spacing === */
  --spacing-xs: 4px;      /* micro gap (icon-text, inside badge) */
  --spacing-sm: 8px;      /* tight (elements in a row) */
  --spacing-md: 16px;     /* base (card padding, list gap) */
  --spacing-lg: 24px;     /* gap between sections */
  --spacing-xl: 32px;     /* gap between main sections */
  --spacing-2xl: 48px;    /* top margin of screen */
  --spacing-3xl: 96px;    /* bottom margin (above bottom nav) */

  /* === Max widths (Tailwind defaults overridden) === */
  --max-width-3xs: 16rem;
  --max-width-2xs: 18rem;
  --max-width-xs: 20rem;
  --max-width-sm: 24rem;
  --max-width-md: 28rem;
  /* ... through 7xl */

  /* === Shadows (warm, brown tint) === */
  --shadow-*: initial;
  --shadow-sm: 0 1px 2px rgba(44, 36, 23, 0.05);
  --shadow-md: 0 2px 8px rgba(44, 36, 23, 0.08);
  --shadow-lg: 0 8px 24px rgba(44, 36, 23, 0.12);
  --shadow-xl: 0 20px 60px rgba(44, 36, 23, 0.15);

  /* === Fonts (composed from next/font CSS variables) === */
  --font-display: var(--font-display-face), Georgia, serif;
  --font-body: var(--font-body-face), system-ui, sans-serif;
}
```

### shadcn/ui CSS variables (`:root`)

The `:root` block maps shadcn semantic tokens to the apothecary palette:

```css
:root {
  --background: #faf7f2;      /* = surface */
  --foreground: #2c2417;       /* = content */
  --card: #ffffff;             /* = surface-raised */
  --card-foreground: #2c2417;
  --popover: #ffffff;
  --popover-foreground: #2c2417;
  --primary: #5c8a4a;          /* = brand-500 */
  --primary-foreground: #faf7f2;
  --secondary: #f3ede4;        /* = surface-alt */
  --secondary-foreground: #2c2417;
  --muted: #ede7db;            /* = surface-sunken */
  --muted-foreground: #9c8e7e; /* = content-faint */
  --accent: #e1e8dc;           /* = brand-100 */
  --accent-foreground: #2c2417;
  --destructive: #b84233;      /* = danger */
  --border: #e0d8cc;           /* = edge */
  --input: #ede7db;            /* = surface-sunken */
  --ring: rgba(92, 138, 74, 0.4); /* = focus-ring */
  --radius: 0.5rem;
}
```

The `@theme inline` block exposes these as Tailwind color utilities (`bg-background`, `text-foreground`, `bg-primary`, etc.) and computes radius scale (`--radius-sm` through `--radius-4xl`).

### Semantic color usage

| Element | Color | Notes |
|---------|-------|-------|
| Page background | `bg-surface` | Cream, never pure white |
| Card / elevated | `bg-surface-raised` | White with shadow-sm |
| Checked off | `success` / `brand-500` | Green checkmark + subtle background |
| Unchecked | `border-edge` | Empty ring |
| Critical medication | `danger` | IconBadge with `ShieldAlert` icon |
| Stock alert (low) | `warning` | IconBadge with `AlertTriangle` icon, amber variant |
| Out of stock | `danger` | IconBadge with `AlertTriangle` icon, danger variant |
| Confidence < 0.7 | `warning` | Amber badge in preview |
| Inactive elements | `text-content-faint` | Grayed out, `opacity-50` on disabled rows |
| Progress ring/bar | `brand-500` on `brand-100` | Fill on background |
| Bottom nav active | `brand-600` | With dot indicator |
| Bottom nav inactive | `text-content-faint` | No background |
| Protocol border colors | Indexed color array | Top border color per protocol card and supplement row |

---

## Typography

### Fonts

```tsx
// src/app/layout.tsx — fonts via next/font (self-hosted, zero CLS)
import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google';

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display-face',   // note: -face suffix
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body-face',      // note: -face suffix
});

// globals.css composes:
// --font-display: var(--font-display-face), Georgia, serif;
// --font-body: var(--font-body-face), system-ui, sans-serif;

// <body className={`${dmSerif.variable} ${plusJakarta.variable} font-body bg-surface text-content overflow-x-hidden`}>
```

| Type | Font | Usage |
|--------|------|--------------|
| **Display / H1** | DM Serif Display | Screen headings, app name in logo, empty state titles |
| **Body / UI** | Plus Jakarta Sans | Entire UI: buttons, labels, inputs, content, navigation |

### Typography scale (Tailwind defaults)

| Token | Usage |
|-------|-------------|
| `text-2xl` | Screen headings (DM Serif Display) |
| `text-xl` | Section headings, date navigator (DM Serif Display) |
| `text-lg` | Sheet titles (`font-semibold`), progress ring percent |
| `text-base` | Main text, UI, dialog titles (`font-medium`) |
| `text-sm` | Lists, UI elements, labels, supplement names, button text |
| `text-xs` | Badge, status, time block names, meta, captions |

### Typography rules

- **Screen headings** → `font-display text-2xl text-content`
- **Date headings** → `font-display text-xl text-content` (brand-600 when today)
- **UI elements** → `font-body` (default, via `font-sans`)
- **Time block names** → `text-xs font-semibold uppercase tracking-wide text-content`
- **Section headers (settings)** → `text-xs uppercase tracking-wide text-content-faint font-semibold`
- **Numbers** (stock count, progress percent) → `font-semibold` or `font-bold`

---

## Spacing and layout

### Spacing tokens

Semantic tokens defined in `@theme`, used as standard Tailwind classes:

| Token | Value | Tailwind class | Usage |
|-------|---------|---------------|-------------|
| `xs` | 4px | `p-xs`, `gap-xs` | Micro gap (icon-text, inside badge) |
| `sm` | 8px | `p-sm`, `gap-sm` | Tight (elements in a row, time block entries) |
| `md` | 16px | `p-md`, `gap-md` | Card padding, list gap |
| `lg` | 24px | `p-lg`, `gap-lg` | Gap between sections, sheet padding |
| `xl` | 32px | `p-xl`, `gap-xl` | Gap between main sections |
| `2xl` | 48px | `pt-2xl` | Top margin of screen |
| `3xl` | 96px | `pb-3xl` | Bottom margin (above bottom nav) |

### Layout rules

- **Max width:** `max-w-md` (28rem / 448px), centered via `mx-auto` on `<main>` in app layout
- **Page padding:** `px-md pt-2xl pb-3xl` (applied per page component, not layout)
- **Card padding:** `p-md`
- **Card border-radius:** `rounded-xl`
- **Badge, chip:** `rounded-lg` (semantic badges) or `rounded-4xl` (shadcn Badge)
- **Inputs, buttons:** `rounded-lg`
- **Bottom nav height:** `h-16` + `pb-[env(safe-area-inset-bottom)]`
- **Touch target minimum:** `min-h-11` (44px)
- **Bottom padding for nav:** `pb-16` on content wrapper in main layout

### Grid and composition

- Single column layout on mobile (the only target)
- Time blocks: stacked cards, full-width, CSS grid expand/collapse
- Supplement row: flex, gap-sm, checkbox + info + edit button
- Stock list: stacked cards with gap-md between items
- "No tracking" separator: horizontal lines + centered label text

---

## Components — style and behavior

### Cards

```
bg-surface-raised border-edge-subtle rounded-xl shadow-sm
```

Cards do NOT have a hover effect (mobile-first). Active state on some interactive cards: `active:scale-[0.98] transition-transform`.

Protocol and supplement cards use a colored top border (`border-t-4` or `border-t-[4px]`) for protocol differentiation.

### Buttons

Uses `@base-ui/react` Button with `class-variance-authority`. Base: `rounded-lg text-sm font-medium active:translate-y-px`.

**Primary (default):**
```
bg-primary text-primary-foreground
```

**Outline:**
```
border-border bg-background hover:bg-muted hover:text-foreground
```

**Secondary:**
```
bg-secondary text-secondary-foreground hover:bg-secondary/80
```

**Ghost:**
```
hover:bg-muted hover:text-foreground
```

**Destructive:**
```
bg-destructive/10 text-destructive hover:bg-destructive/20
```

**Link:**
```
text-primary underline-offset-4 hover:underline
```

**Sizes:** `xs` (h-6), `sm` (h-9), `default` (h-11), `lg` (h-12), plus icon variants (`icon` h-11, `icon-xs` size-6, `icon-sm` size-9, `icon-lg` size-11).

**Disabled state (all variants):**
```
opacity-50 pointer-events-none
```

### Checkbox / Toggle

**Supplement checkbox (custom, not native):**
```
Touch area:   min-h-11 min-w-11
Visible:      size-6 rounded-full border-2 border-edge
Checked:      bg-brand-500 border-brand-500, white checkmark (animated SVG)
Transition:   duration-200 ease-out
```

Check animation: checkmark draws via SVG stroke-dashoffset (150ms `check-mark` keyframe), circle does a
subtle pulse (`check-pulse` 200ms ease-out).

Pending state: `opacity-70` on wrapper.

### Time Block (Dashboard accordion-like)

```
Wrapper:      rounded-xl bg-surface-raised shadow-sm, overflow-hidden
Header:       ghost button, full width, no rounded corners
              flex min-h-12 w-full items-center gap-sm rounded-xl p-md
              Left: icon (size-5) + name (xs uppercase semibold tracking-wide) + startTime (xs, content-faint)
              Right: progress chip + chevron (size-4)
Completed:    bg-success-bg on header
Expanded:     CSS grid trick (grid-rows-[0fr] → grid-rows-[1fr]), duration-250 ease-out
Content:      gap-sm px-md pb-md pt-sm
Chevron:      rotate-180 transition-transform duration-200
```

### Time Block Progress Chip

```
rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide

Complete (all done): bg-success-bg text-brand-700
Empty (none done):   bg-edge-subtle text-content-muted
Partial:             bg-brand-50 text-content-muted
```

### Progress Ring (Dashboard)

```
Size:         size-20 (80px), configurable via SIZE constant
Track:        stroke brand-100, strokeWidth 6
Fill:         stroke brand-500, strokeWidth 6, strokeLinecap round
Percent:      center, text-lg font-semibold text-content
Label:        below ring, text-sm text-content-muted, gap-xs
Animation:    stroke-dashoffset transition 600ms ease-out, delay 200ms
SVG:          rotated -90deg for top-start
```

### IconBadge (replaces inline semantic badges)

A Popover-based badge used for status indicators on supplement rows. Tap to reveal label.

```
Trigger:      rounded-lg p-xs, with min-h-11 min-w-11 hit area (via ::after pseudo)
Icon:         size-4 stroke-[1.5]
PopoverContent: w-auto max-w-52 p-sm text-xs

Variants:
  default:  bg-brand-50 text-content-faint
  brand:    bg-brand-100 text-brand-700
  amber:    bg-warning-bg text-[#8B6914]
  muted:    bg-brand-50 text-content-muted
  danger:   bg-danger-bg text-danger
  info:     bg-info-bg text-[#2D6070]
  success:  bg-success-bg text-brand-700
```

### Badge (shadcn/ui)

```
rounded-4xl h-5 px-2 py-0.5 text-xs font-medium

Variants (shadcn standard):
  default:     bg-primary text-primary-foreground
  secondary:   bg-secondary text-secondary-foreground
  destructive: bg-destructive/10 text-destructive
  outline:     border-border text-foreground
  ghost:       hover:bg-muted hover:text-muted-foreground
  link:        text-primary underline

Used in protocol cards with manual className overrides for
semantic colors (bg-success-bg, bg-warning-bg, bg-danger-bg, etc.)
```

### Bottom Navigation

```
fixed bottom-0 inset-x-0 bg-surface-raised/90 backdrop-blur-md
border-t border-edge-subtle h-16 pb-[env(safe-area-inset-bottom)] z-50
view-transition-name: bottom-nav (inline style)

Inner:  mx-auto max-w-md flex h-full
3 items: flex-1 flex flex-col items-center justify-center gap-xs
Active:   text-brand-600 + dot indicator (size-1 rounded-full bg-brand-500)
Inactive: text-content-faint
Label:    text-xs font-semibold
Icon:     size-6 stroke-[1.5] (Lucide)
Transition: transition-colors duration-150
```

### BottomSheet (shared component wrapping Sheet)

```
Uses:      Sheet side="bottom" from shadcn
Content:   rounded-t-2xl bg-surface-raised p-lg
Drag:      mx-auto mb-md h-1 w-10 rounded-full bg-edge-subtle
Title:     text-lg font-semibold text-content
Desc:      text-sm text-content-muted
Scrollable: max-h-[90vh] flex flex-col overflow-hidden, content in overflow-y-auto div
Close:     showCloseButton={false}, initialFocus={false}
Footer:    optional, shrink-0 pt-md
```

### NumberInputDialog (shared component wrapping Dialog)

Used for Restock and Adjust dialogs.

```
Dialog:    rounded-2xl p-lg shadow-xl bg-surface-raised
Title:     text-base font-semibold text-content
Hint:      text-sm text-content-muted
Input:     bg-surface-sunken border-edge rounded-lg px-md py-sm text-base
Unit:      text-sm text-content-muted, beside input
Actions:   flex gap-sm justify-end — Ghost cancel + Primary submit
```

### Input / Form fields

Base shadcn Input:
```
h-11 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base
placeholder:text-muted-foreground
focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
```

LabeledInput (wrapper):
```
bg-surface-sunken border-edge rounded-lg px-md py-sm text-base
placeholder:text-content-faint
focus-visible:border-brand-400 focus-visible:ring-focus-ring
Label:   text-sm text-content-muted, gap-xs above input
Error:   text-sm text-danger mt-xs
```

### Dialogs / Modals (shadcn Dialog, @base-ui/react)

```
Overlay:  bg-black/10 backdrop-blur-xs
Content:  bg-background rounded-xl p-4 max-w-[calc(100%-2rem)] sm:max-w-sm
          ring-1 ring-foreground/10
Animation: fade + zoom (zoom-in-95 → 1), duration-100
Close:    ghost button, icon-sm, top-2 right-2 (optional via showCloseButton)
Footer:   -mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 p-4
```

### AlertDialog (@base-ui/react)

```
Overlay:  same as Dialog (bg-black/10 backdrop-blur-xs)
Content:  rounded-xl p-4 ring-1 ring-foreground/10, max-w-xs or max-w-sm
          Supports size="sm" (grid-cols-2 footer layout)
Animation: same as Dialog
Footer:   -mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 p-4
Optional: AlertDialogMedia (icon slot, size-10 rounded-md bg-muted)
```

### Popover (@base-ui/react)

```
Content:  w-72 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground
          shadow-md ring-1 ring-foreground/10
Animation: zoom-in-95 + fade, slide-in from side, duration-100
```

### Toast / Snackbar (Sonner)

Toasts use `sonner`'s `toast()` function imported directly in hooks. **Note:** No `<Toaster />` component is mounted in the layout — toasts will not render until one is added.

### Sheet (shadcn, @base-ui/react)

```
Overlay:  bg-black/10 backdrop-blur-xs, transition-opacity duration-150
          [view-transition-name:sheet-overlay]
Content:  bg-background shadow-lg, transition duration-200 ease-in-out
          [view-transition-name:sheet-content]
Sides:    top/right/bottom/left with appropriate translate animations
Bottom:   inset-x-0 bottom-0 h-auto border-t, slide-up animation
          Typically used via BottomSheet wrapper (see above)
```

### Switch (@base-ui/react)

```
Default:  h-[18.4px] w-[32px] rounded-full
Small:    h-[14px] w-[24px]
Track:    bg-input (unchecked) → bg-primary (checked)
Thumb:    bg-background, rounded-full, size-4 (default) or size-3 (sm)
Disabled: cursor-not-allowed opacity-50
```

### ToggleRow (shared component)

```
flex items-center justify-between gap-sm min-h-11
Label:   text-sm text-content-muted
Optional: InfoHint popover (Info icon, size-4)
Switch:  at end
```

### Separator (@base-ui/react)

```
bg-border, h-px w-full (horizontal) or w-px self-stretch (vertical)
```

### BackButton (shared component)

```
Ghost button, size sm, self-start -ml-sm text-content-muted
ChevronLeft icon + "Back" text
Uses router.back()
```

---

## Icons

Lucide Icons (provided by shadcn/ui). Style:

- **Stroke width:** `stroke-[1.5]` (lighter, fits the aesthetic)
- **Size:** `size-5` (UI, time block icons), `size-6` (navigation), `size-4` (inline/badge, chevrons)
- **Color:** inherits from text (`currentColor`)

### Time block icons

Default icons stored per time block in DB. User can change via IconPicker in settings.

| Block | Default Lucide icon | Description |
|------|-------------|------|
| Fasting | `Sunrise` | Sunrise |
| Breakfast | `Coffee` | Cup |
| Lunch | `Sun` | Sun (midday) |
| Dinner | `Sunset` | Sunset |
| Before bed | `Moon` | Moon |

Icons are resolved dynamically from `lucide-react` by string name. Fallback: `Clock`.

### Navigation icons

| Tab | Icon |
|-----|-------|
| Today | `CalendarCheck` |
| Stock | `Package` |
| Settings | `Settings` |

Active state uses `text-brand-600`, inactive uses `text-content-faint`. No filled variants.

### Dashboard supplement row icons (via IconBadge)

| State | Icon |
|-------|------|
| Critical | `ShieldAlert` |
| Out of stock | `AlertTriangle` |
| Low stock | `AlertTriangle` |
| Expired | `CheckCircle` |
| Locked / not started | `Lock` |
| Cycling off-phase | `Repeat` |
| Cooldown timer | `Timer` |
| Wait timer | `Hourglass` |

---

## Animations and motion

### Rules

- **Purpose:** motion serves feedback and orientation, NOT decoration
- **Duration:** 100-300ms for UI, 400-800ms for page transitions
- **Easing:** `ease-out` for entering, `ease-in` for exiting
- **Reduce motion:** `@media (prefers-reduced-motion: reduce)` — sets all animation/transition durations to 0.01ms

### Keyframes (in globals.css)

```css
@keyframes check-mark {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}

@keyframes check-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.12); }
  100% { transform: scale(1); }
}

@keyframes page-enter {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes fade-out {
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
}
```

### View transitions (globals.css)

```
viewTransition: true in next.config.ts (experimental)

- root: animation: none (disabled)
- bottom-nav: animation: none (stable across page changes)
- sheet-overlay / sheet-content: animation: none (handled by base-ui transitions)
- main-content: fade-out 150ms ease-out → fade-in 150ms ease-in 50ms delay
- When sheet is open (html:has([data-slot="sheet-overlay"])):
  main-content transitions disabled
```

### Animation usage

| Animation | Trigger | Duration |
|----------|---------|---------|
| **Checkbox tap** | check-mark + check-pulse | 150ms + 200ms ease-out |
| **Progress ring mount** | stroke-dashoffset transition | 600ms ease-out, delay 200ms |
| **Time block expand** | grid-template-rows 0fr → 1fr | 250ms ease-out |
| **View transition** | fade-out / fade-in keyframes | 150ms + 150ms with 50ms delay |
| **Optimistic check** | row opacity-85 while pending | instant |
| **Error shake** | shake keyframe | 300ms (3 cycles) |
| **Dialog/Popover** | zoom-in-95 + fade | 100ms |
| **Sheet** | translate-y + opacity | 200ms ease-in-out |
| **Interactive press** | active:scale-[0.98] or active:scale-[0.97] | CSS transition |

---

## Screens — detailed visual description

### Dashboard (main screen — daily view)

```
┌─────────────────────────────────────┐
│ status bar (system)                 │
├─────────────────────────────────────┤
│                                     │
│ ┌─ Day ── Week ── Month ──────────┐│  ← ViewSwitcher: rounded-lg bg-surface-sunken
│ │  [Day]   Week    Month          ││     Active: bg-surface-raised shadow-sm
│ └─────────────────────────────────┘│
│                                     │
│    ◄  Thursday, March 13  ►         │  ← font-display text-xl
│                                     │     Arrows: ghost icon buttons, brand-600
│         ╭─────────╮                 │     Today's date: text-brand-600
│        │   34%    │                 │  ← Progress ring, size-20
│         ╰─────────╯                 │     Percent: text-lg font-semibold
│         12 of 35 checked off        │  ← text-sm text-content-muted
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☀ FASTING  06:30       ✅ 4/4 ▼│   │  ← Expanded, bg-success-bg header
│ │                               │   │     rounded-xl bg-surface-raised shadow-sm
│ │  ✅ Pepzin GI Complex  2 caps │   │     Row: checkbox + name + dose + badges + edit
│ │     30 min before meal        │   │     notes: text-xs text-content-faint (truncated)
│ │  ✅ Licorice DGL       1 caps │   │     Checked: text-content-faint line-through
│ │  ✅ Propolis           15 drps│   │     border-t-[4px] per protocol color
│ │  ✅ Nattokinase        1 caps │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☕ BREAKFAST  08:00      2/14  ▼│   │  ← Partially done
│ │                               │   │
│ │  ✅ Emanera            1 caps │   │
│ │  ☐ NAC                2 caps │   │     Unchecked: normal text
│ │  ☐ Ospamox [🛡️]       1 tabs │   │     Critical: ShieldAlert IconBadge (danger)
│ │  ☐ ...                       │   │
│ │                               │   │
│ │  [ ✓ Check off entire block ] │   │  ← Ghost button, full width, text-brand-600
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☀ LUNCH   13:00          0/5  ►│   │  ← Collapsed, chevron right
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ 🌅 DINNER  19:00        0/12 ►│   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ 🌙 BEFORE BED  22:00     0/4 ►│   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌─ Active Timers Banner ──────────┐│  ← Fixed bottom-16, above bottom nav
│ │ ⏱ Supplement: 12:34 remaining  ││     rounded-2xl bg-surface-raised shadow-lg
│ │ Expandable: shows all timers    ││     Tap to expand/collapse
│ └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │  ← Bottom nav, fixed
│         •                           │     Active: dot indicator
└─────────────────────────────────────┘
```

**Behavior:**
- ViewSwitcher at top: Day / Week / Month tabs
- Expanded by default: time block at `activeBlockIndex` (determined by server)
- Completed blocks: header has brand tint (`bg-success-bg`)
- Progress chip in header: `bg-success-bg text-brand-700` when 100%, `bg-edge-subtle text-content-muted` when 0%, `bg-brand-50 text-content-muted` when partial
- Date navigation: arrow buttons (ghost)
- Supplement rows show protocol color via `border-t-[4px]`
- Edit pencil button on each row (ghost, icon-sm, `Pencil` icon)
- Status badges are `IconBadge` components (tap to reveal label via Popover)
- "Check off entire block" button only shown when unchecked items exist

### Dashboard — Weekly View

```
┌─────────────────────────────────────┐
│ [Day]  [Week]  [Month]             │  ← ViewSwitcher
│                                     │
│    ◄  1–7 mar 2026  ►              │  ← font-display text-xl
│                                     │
│           85%                       │  ← text-2xl font-bold (no progress ring)
│      35 of 41 checked off           │  ← text-sm text-content-muted
│                                     │
│ ┌ Monday ──────────────── 100% ──┐  │  ← WeekDayCell cards
│ │  Fasting ████  Breakfast ████  │  │     Per-block mini progress bars
│ └────────────────────────────────┘  │     Tap → navigate to that day
│ ┌ Tuesday ─────────────── 80% ──┐   │
│ │  ...                          │   │
│ └────────────────────────────────┘  │
│ ...                                 │
└─────────────────────────────────────┘
```

### Dashboard — Monthly View

```
┌─────────────────────────────────────┐
│ [Day]  [Week]  [Month]             │  ← ViewSwitcher
│                                     │
│    ◄  Marzec 2026  ►               │  ← font-display text-xl
│                                     │
│  Pn  Wt  Śr  Cz  Pt  Sb  Nd       │  ← Weekday labels (text-xs uppercase)
│  ┌──────────────────────────────┐   │
│  │  1   2   3   4   5   6   7   │   │  ← Calendar grid (7 cols)
│  │  8   9  10  11  12  13  14   │   │     Color coded by completion %
│  │ 15  16  17  18  19  20  21   │   │     0%: bg-surface-sunken
│  │ 22  23  24  25  26  27  28   │   │     <50%: bg-brand-100
│  │ 29  30  31                   │   │     <100%: bg-brand-300
│  └──────────────────────────────┘   │     100%: bg-brand-500
│                                     │     Today: ring ring-brand-500
│         22/28                       │     Future: text-content-faint
│      perfect days                   │  ← text-2xl font-bold + text-sm text-content-muted
│                                     │
│  Legend: □ 0%  □ <50%  □ <100%  ■   │  ← size-3 rounded-sm color swatches
└─────────────────────────────────────┘
```

### Upload Step (Protocol creation)

```
┌─────────────────────────────────────┐
│  ← Back                            │  ← BackButton (ghost, sm)
│                                     │
│     Add new protocol                │  ← font-display text-2xl
│     Upload or photograph your       │  ← text-base text-content-muted
│     treatment protocol — AI will    │
│     do the rest.                    │
│                                     │
│ ┌───────────────────────────────┐   │
│ │                               │   │  ← FileDropzone: dashed border-2,
│ │     ┌─────────────────┐       │   │     border-edge-strong, bg-surface-sunken
│ │     │  📄              │       │   │     hover: border brand-400
│ │     │  Drop file       │       │   │     accepts: PDF, Excel, DOCX, TXT, images
│ │     │  or click        │       │   │
│ │     └─────────────────┘       │   │
│ └───────────────────────────────┘   │
│                                     │
│  ────── or ──────                   │  ← Divider with text-xs uppercase
│                                     │
│  ┌─────────────────────────────┐    │  ← Camera button: outline, rounded-xl
│  │ 📷 Take a photo             │    │     h-14, Camera icon + text
│  └─────────────────────────────┘    │     Uses capture="environment"
│                                     │
│  ────── or ──────                   │
│                                     │
│  ┌─────────────────────────────┐    │  ← Manual entry: Link to /protocol/new/manual
│  │ ✏️ Add manually              │    │     rounded-xl border border-edge
│  └─────────────────────────────┘    │     bg-surface-raised shadow-sm h-14
│                                     │
└─────────────────────────────────────┘
```

**Parsing state:** FileDropzone is replaced by a centered loading indicator:
```
rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-xl
Loader2 icon (size-10, animate-spin, text-brand-500)
File name displayed below with FileText icon
```

**After file selection:** Dialog for user instructions (optional context for AI parsing):
```
Dialog with textarea (rounded-xl border-edge bg-surface-raised p-md)
Skip button (outline) + Send button (primary, disabled when empty)
```

### Parsed Preview (AI parsing result)

```
┌─────────────────────────────────────┐
│  ← Back                            │
│                                     │
│     Review and approve              │  ← font-display text-2xl
│     Protocol: H. Pylori            │  ← text-base text-content-muted
│                                     │
│  Start date                         │  ← LabeledInput type="date"
│  ┌───────────────────────┐          │
│  │ 2026-03-16            │          │
│  └───────────────────────┘          │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☀ FASTING                (4)│   │  ← PreviewBlock
│ │                               │   │     DndContext for drag-and-drop reordering
│ │ ✅ Pepzin GI Complex  2 caps  │   │  ← Linked: success badge
│ │    → Pepzin (Apollo's) 90pcs  │   │     text-sm text-content-muted
│ │                               │   │
│ │ 🆕 Licorice DGL       1 caps  │   │  ← New supplement: info badge
│ │    → will be added            │   │
│ │                               │   │
│ │ ⚠️ Propolis           15 drps  │   │  ← Low confidence: warning badge
│ │    → Verify mapping           │   │     Tap to edit via PreviewSupplementSheet
│ │                               │   │
│ │ + Add dose                    │   │  ← Add supplement to block
│ └───────────────────────────────┘   │
│                                     │
│  ⚠️ 1 item requires verification   │  ← Warning bar (scrolls to first unverified)
│                                     │     rounded-xl bg-warning-bg border-warning/20
│  [       Approve protocol         ] │  ← Primary button
│                                     │     disabled if unverified items exist
│  [       Discard draft            ] │  ← Outline button
│                                     │
└─────────────────────────────────────┘
```

### Stock Page

```
┌─────────────────────────────────────┐
│                                     │
│     My stock                        │  ← font-display text-2xl
│                                     │
│ ── Buy soon ──                      │  ← BuySoonList: warning header
│                                     │     text-xs font-semibold uppercase text-warning
│ ┌───────────────────────────────┐   │
│ │ [⚠] Berberine                │   │  ← BuySoonItem card
│ │     Apollo's Hegemony         │   │     AlertTriangle icon in colored bg
│ │     12 pcs · ~4 days          │   │     danger (< 3 days) or warning (< 7 days)
│ │                        [LOW]  │   │     Status badge: CRITICAL or LOW
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Omega-3                       │   │  ← StockItem card
│ │ Apollo's Hegemony             │   │     bg-surface-raised border-edge-subtle
│ │                               │   │     rounded-xl shadow-sm
│ │ 45 / 90 pcs                   │   │     StockQuantity: currentStock/packageSize
│ │ ████████████░░  ~15 days      │   │     StockProgressBar: brand-100 track
│ │                               │   │     fill: brand-500 / warning / danger
│ │ ── Edit ─── Restock ── Adjust │   │  ← Button row at bottom of card
│ └───────────────────────────────┘   │     border-t border-edge-subtle
│                                     │     Ghost buttons, text-brand-600
│ ── No tracking ──                   │  ← Separator with centered text
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Propolis (drops)              │   │
│ │ ── Edit ──                    │   │  ← Only Edit button (no stock)
│ └───────────────────────────────┘   │
│                                     │
│  [ + Add supplement ]               │  ← Primary button, full width
│                                     │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │
│                  •                  │
└─────────────────────────────────────┘
```

**Stock item behavior:**
- Edit button → opens SupplementEditSheet (BottomSheet)
- Restock button → NumberInputDialog ("How many did you buy?")
- Adjust button → NumberInputDialog ("How many do you have now?")

### Stock — Empty State

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         ┌─────────────┐             │
│         │  📦          │             │  ← Package icon (Lucide), size-64
│         └─────────────┘             │     stroke-[1.5], text-brand-300
│                                     │
│     Your cabinet is empty           │  ← font-display text-xl text-content-muted
│                                     │
│     Upload a protocol or add        │  ← text-sm text-content-faint
│     supplements manually.           │
│                                     │
│  [    Upload protocol     ]         │  ← Primary button (bg-brand-500)
│  [    Add manually        ]         │  ← Ghost button (text-brand-600)
│                                     │
└─────────────────────────────────────┘
```

### Login

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│          💊                         │  ← Pill icon (Lucide), size-12
│                                     │     text-brand-500, stroke-[1.5]
│     PillPilot                       │  ← font-display text-2xl text-content
│     Your daily supplement           │  ← text-base text-content-muted
│     pilot                           │
│                                     │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  G  Continue with Google     │  │  ← Outline button, size lg
│  └───────────────────────────────┘  │     min-h-12 gap-sm border-edge
│                                     │     bg-surface-raised shadow-sm
│                                     │     GoogleIcon (custom SVG) + text
│                                     │     active: bg-interactive-active scale-[0.97]
│                                     │     Loading: spinner (border-2 animate-spin)
└─────────────────────────────────────┘
```

### Settings

```
┌─────────────────────────────────────┐
│                                     │
│     Settings                        │  ← font-display text-2xl
│                                     │
│ ── Protocols ──                     │  ← text-xs uppercase tracking-wide
│                                     │     text-content-faint font-semibold mb-sm
│ ┌───────────────────────────────┐   │
│ │ H. Pylori           [✏] ACTIVE│   │  ← ProtocolCard
│ │                               │   │     border-t-4 (protocol color)
│ │ [       Archive             ] │   │     Status badge: ACTIVE/DRAFT/ARCHIVED/
│ └───────────────────────────────┘   │     PROCESSING/FAILED
│                                     │     Edit pencil button (ghost icon-sm)
│ [ + Add new protocol ]              │  ← Primary button, full width
│                                     │
│ ── Time blocks ──                   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☀ Fasting              06:30  │   │  ← TimeBlockRow: ghost button, full width
│ │ ☕ Breakfast             08:00  │   │     border-b border-edge-subtle last:border-0
│ │ ☀ Lunch                13:00  │   │     Icon + name + startTime
│ │ 🌅 Dinner               19:00  │   │     Tap → TimeBlockEditSheet
│ │ 🌙 Before bed           22:00  │   │
│ │                               │   │
│ │ [ + Add block ]               │   │  ← Ghost button, text-brand-600
│ └───────────────────────────────┘   │
│                                     │
│ ── Notifications ──                 │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Enable push           ━━━━━● │   │  ← ToggleRow + Switch
│ │                               │   │
│ │ ━● Fasting            06:30  │   │  ← Per-block notification toggle
│ │ ━● Breakfast           08:00  │   │     Switch + name + time input
│ │                               │   │
│ │ [ Test notification ]         │   │  ← Outline button with Bell icon
│ └───────────────────────────────┘   │
│                                     │
│ ── Account ──                       │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Account                       │   │  ← text-xs uppercase text-content-faint
│ │ jan@example.com               │   │  ← text-sm text-content-muted
│ │                               │   │
│ │ [Log out]                     │   │  ← Destructive button (bg-destructive/10)
│ └───────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │
│                           •        │
└─────────────────────────────────────┘
```

**Protocol card states:**
- **Active:** Edit pencil + ACTIVE badge (bg-success-bg text-brand-700) + Archive button (destructive)
- **Draft:** DRAFT badge (bg-warning-bg text-[#8B6914]) + Continue button + Delete button
- **Processing:** PROCESSING badge (bg-brand-100 text-brand-700) with Loader2 spinner + ProcessingPhrase + Delete button
- **Failed:** FAILED badge (bg-danger-bg text-danger) + Retry button + Delete button
- **Archived:** opacity-60, Edit pencil + Reactivate button (RotateCcw icon, bg-brand-100) + ARCHIVED badge (bg-surface-sunken text-content-muted) + Delete button

### Supplement Edit Sheet (Stock page → Edit)

```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │  ← BottomSheet from bottom
│ │          ━━━                  │   │     Drag handle
│ │                               │   │
│ │  Edit supplement              │   │  ← text-lg font-semibold
│ │                               │   │
│ │  Name                         │   │  ← LabeledInput
│ │  ┌───────────────────────┐    │   │
│ │  │ NAC                   │    │   │
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Brand (optional)             │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ Apollo's Hegemony     │    │   │
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Category                     │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ Supplement         ▼  │    │   │  ← LabeledSelect
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Package size (optional)      │   │
│ │  ┌──────────┐ ┌──────────┐   │   │  ← Input number + Select unit
│ │  │ 90       │ │ pcs.  ▼  │   │   │     Unit select affects all schedules
│ │  └──────────┘ └──────────┘   │   │
│ │                               │   │
│ │  Current stock                │   │
│ │  ┌──────────┐                 │   │  ← Input number + unit label
│ │  │ 45       │ pcs.            │   │
│ │  └──────────┘                 │   │
│ │  📊 Calculator                │   │  ← StockCalculator link (text-xs text-brand-600)
│ │                               │   │     Opens dialog to compute remaining from
│ │  Package price (optional)     │   │     package size + start date
│ │  ┌───────────────────────┐    │   │
│ │  │ 49.99                 │    │   │  ← Input number
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  [       Save changes        ]│   │  ← Primary button
│ │                               │   │
│ │  [Delete supplement]          │   │  ← Ghost, text-danger
│ │                               │   │     → AlertDialog confirmation
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Restock — Dialog

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────┐      │
│  │                           │      │  ← NumberInputDialog
│  │  Restock: NAC             │      │     rounded-2xl p-lg bg-surface-raised
│  │                           │      │
│  │  How many did you buy?    │      │  ← text-sm text-content-muted
│  │  ┌───────────────────┐    │      │
│  │  │ 90                │    │      │  ← Input, type number
│  │  └───────────────────┘    │      │     bg-surface-sunken border-edge
│  │  pcs.                     │      │
│  │                           │      │
│  │  [Cancel]    [Add]        │      │  ← Ghost + Primary (bg-brand-500)
│  │                           │      │
│  └───────────────────────────┘      │
│                                     │
└─────────────────────────────────────┘
```

Adjust — same shape, label "How many do you have now?" and button "Save" instead of "Add".

### Schedule Edit Sheet (Dashboard → pencil icon on row)

```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │  ← BottomSheet from bottom
│ │          ━━━                  │   │
│ │                               │   │
│ │  NAC                          │   │  ← Sheet title = supplement name
│ │                               │   │     Uses PreviewSupplementSheetFields
│ │  Name                         │   │
│ │  Brand                        │   │
│ │  Category                     │   │
│ │  Critical (toggle)            │   │
│ │  Dosage (amount + unit)       │   │  ← Unit is read-only (derived from stockUnit)
│ │  Time block                   │   │  ← Select from available blocks
│ │  Notes (optional)             │   │
│ │  Cycling (toggle + days)      │   │
│ │  Start day offset             │   │
│ │  Duration                     │   │
│ │  Dosage interval              │   │
│ │  Wait after taking            │   │
│ │                               │   │
│ │  [       Save changes        ]│   │  ← Primary button (footer)
│ │                               │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

After save: if sibling schedules exist (same supplement in other time blocks), shows a prompt to apply changes to siblings.

### Time Block Edit Sheet (Settings → tap on block)

```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │  ← BottomSheet from bottom
│ │          ━━━                  │   │
│ │                               │   │
│ │  Edit block                   │   │  ← text-lg font-semibold
│ │                               │   │
│ │  Name                         │   │
│ │  ┌───────────────────────┐    │   │  ← LabeledInput
│ │  │ Fasting               │    │   │
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Icon                         │   │
│ │  ┌───────────────────────┐    │   │  ← IconPicker component
│ │  │ Sunrise            ▼  │    │   │
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Start time                   │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ 06:30               │    │   │  ← Input type="time"
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  [       Save changes        ]│   │  ← Primary button
│ │                               │   │
│ │  [Delete block]               │   │  ← Destructive button
│ │                               │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

If the time block has a notification setting and start time changes, an AlertDialog asks whether to sync the notification time.

### Dashboard — Empty State

```
┌─────────────────────────────────────┐
│                                     │
│ [Day]  [Week]  [Month]             │  ← ViewSwitcher
│                                     │
│ ◄  Thursday, March 13  ►           │  ← DateNavigator
│                                     │
│                                     │
│         ┌─────────────┐             │
│         │  PillBottle  │             │  ← PillBottleIcon (custom SVG)
│         │  (SVG)       │             │     size-16, stroke brand-300
│         └─────────────┘             │     in size-24 rounded-2xl bg-brand-100
│                                     │
│     Add your first                  │  ← font-display text-xl text-content-muted
│     protocol                        │
│                                     │
│     Upload a supplement plan        │  ← text-sm text-content-faint
│     and start tracking.             │
│                                     │
│  [    Upload protocol     ]         │  ← inline link styled as Primary button
│                                     │     (bg-brand-500 rounded-lg)
│                                     │
└─────────────────────────────────────┘
```

Additional empty states:
- **Processing:** PillBottleIcon + "Protocol is being processed" + link to settings
- **Draft:** PillBottleIcon + "You have an unfinished draft" + link to settings

---

## UI states

### Loading

- **Inline spinner:** Loader2 icon, `animate-spin`, brand-500
- **Full page loader (AI parsing):** Loader2 (size-10, animate-spin, brand-500) inside dashed border card
- **No Skeleton component:** Skeleton loading is documented but not yet implemented — no loading.tsx files exist

### Empty states

- **Dashboard without protocol:** PillBottleIcon in brand-100 container + heading + CTA
- **Stock empty:** Package icon (Lucide, size-64, brand-300) + heading + two CTAs
- Heading text: `font-display text-xl text-content-muted`
- Description text: `text-sm text-content-faint`

### Error states

- **Inline error (form):** `text-sm text-danger mt-xs` below input
- **Toast error:** Uses `toast.error()` from sonner (see Toast note above)
- **Error text:** `text-sm text-danger` inline in upload step

### Confirmations

- **Unchecking a supplement:** Dialog with title/description + Cancel (ghost) / Uncheck (destructive)
- **Check off entire block:** Dialog with count of items that will be checked + Cancel / Confirm
- **Delete supplement/protocol:** AlertDialog with title/description + Cancel (outline) / Delete (primary)
- **Archive protocol:** AlertDialog with title/description + Cancel / Archive
- **Timer prompt (after checking supplement with timer):** Dialog asking to start timer or skip

---

## Visual details

### Separators

- Between sections: spacing (`gap-xl` in settings, `gap-lg` in dashboard) instead of lines
- In lists (time block rows): `border-b border-edge-subtle last:border-0`
- Stock "No tracking" separator: `Separator` component + centered text label between two lines
- Stock card internal: `border-t border-edge-subtle` above button row

### Protocol differentiation

Each protocol is assigned a color from a fixed palette (`PROTOCOL_BORDER_COLORS`). This color appears as:
- `border-t-4` on protocol cards in settings
- `border-t-[4px]` on supplement rows in dashboard
- Consistent color assignment via `assignProtocolColors` function

---

## Responsiveness

### Mobile-first (and nearly the only target)

```tsx
// src/app/(app)/layout.tsx
<main className="mx-auto max-w-md">{children}</main>
```

Note: no `sm:shadow-lg` is applied. Desktop simply gets a centered column.

### Safe areas (PWA)

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

Bottom nav: `pb-[env(safe-area-inset-bottom)]`

---

## Dark Mode

**Out of scope** (per PRD). Application is ONLY in light mode. The `@custom-variant dark` is defined in globals.css (from shadcn defaults) but unused.

---

## Logo and branding

### Logo

- `Pill` icon from Lucide (size-12, text-brand-500, stroke-[1.5]) on login page
- Beside it: "PillPilot" in `font-display text-2xl text-content`
- In empty states: `PillBottleIcon` (custom SVG with brand-300 stroke) in a `bg-brand-100 rounded-2xl` container
- In UI: not displayed (bottom nav instead)

### Favicon / PWA icon

- Sizes: 192x192 (`/icon-192x192.png`), 512x512 (`/icon-512x512.png`)

### Theme color (PWA manifest)

```ts
// src/app/manifest.ts
{
  name: "Pill Pilot",
  short_name: "Pill Pilot",
  description: "Twój dzienny pilot suplementów",
  start_url: "/dashboard",
  display: "standalone",
  background_color: "#FAF7F2",
  theme_color: "#FAF7F2",
}
```

---

## shadcn/ui theming

shadcn/ui components adapted to the palette via `:root` CSS variables. Key mappings:

```
shadcn background   → surface (#FAF7F2)
shadcn card         → surface-raised (#FFFFFF)
shadcn primary      → brand-500 (#5C8A4A)
shadcn destructive  → danger (#B84233)
shadcn muted        → surface-sunken (#EDE7DB)
shadcn secondary    → surface-alt (#F3EDE4)
shadcn accent       → brand-100 (#E1E8DC)
shadcn border       → edge (#E0D8CC)
shadcn input        → surface-sunken (#EDE7DB)
shadcn ring         → focus-ring (rgba(92,138,74,0.4))
```

---

## shadcn/ui — components

### Installed components

| Component | Source | Where used | Notes |
|-----------|--------|--------------|-------|
| **Button** | `@base-ui/react` | Everywhere | 6 variants: default, outline, secondary, ghost, destructive, link. Sizes: xs/sm/default/lg + icon/icon-xs/icon-sm/icon-lg |
| **Dialog** | `@base-ui/react` | Uncheck confirm, check-all confirm, timer prompt, file upload instructions, stock calculator | `rounded-xl p-4 ring-1 ring-foreground/10`. Optional close button. Footer with border-t bg-muted/50 |
| **AlertDialog** | `@base-ui/react` | Delete confirm (supplement, protocol), archive confirm, discard draft, time block notification sync | Similar to Dialog. Supports size="sm" with 2-column footer. Has AlertDialogMedia slot |
| **Input** | `@base-ui/react` | All forms | Base: `h-11 bg-transparent border-input`. Wrapped by LabeledInput for styled version |
| **Label** | native `<label>` | Form fields | `text-sm font-medium` |
| **Select** | `@base-ui/react` | Category, dosage unit, time block, stock unit | Trigger with chevron. Positioner + Popup with animations |
| **Badge** | `@base-ui/react` | Protocol status badges in settings | `rounded-4xl h-5 px-2 text-xs font-medium`. Manually styled per status |
| **Switch** | `@base-ui/react` | Schedule active toggle, notification toggles | Default and sm sizes. bg-input → bg-primary |
| **Separator** | `@base-ui/react` | Stock list "No tracking" divider | `bg-border h-px` |
| **Sheet** | `@base-ui/react` | Supplement edit, schedule edit, time block edit | Used via BottomSheet wrapper. side="bottom", view-transition-name |
| **Popover** | `@base-ui/react` | IconBadge tooltips, supplement name overflow, truncated notes | `w-72 rounded-lg bg-popover shadow-md ring-1 ring-foreground/10` |

### Shared wrapper components (not shadcn, but built on top)

| Component | Location | Purpose |
|-----------|----------|---------|
| **BottomSheet** | `shared/components/bottom-sheet.tsx` | Sheet side="bottom" with drag handle, rounded-t-2xl, optional scroll/footer |
| **NumberInputDialog** | `shared/components/number-input-dialog.tsx` | Dialog for numeric input (restock/adjust) |
| **IconBadge** | `shared/components/icon-badge.tsx` | Popover-based status badge with icon + tap-to-reveal label |
| **LabeledInput** | `shared/components/labeled-input.tsx` | Label + styled Input + error |
| **LabeledSelect** | `shared/components/labeled-select.tsx` | Label + styled Select |
| **ToggleRow** | `shared/components/toggle-row.tsx` | Label + optional hint + Switch |
| **BackButton** | `shared/components/back-button.tsx` | Ghost button with ChevronLeft |
| **SupplementInfo** | `shared/components/supplement-info.tsx` | Name (truncated) + dose + badges + notes |
| **TruncatedNote** | `shared/components/truncated-note.tsx` | Notes text with truncation + popover |
| **PillBottleIcon** | `shared/components/pill-bottle-icon.tsx` | Custom SVG bottle illustration |
| **InfoHint** | `shared/components/info-hint.tsx` | Info icon with popover hint |

### Not installed from shadcn

| Component | Reason |
|-----------|-------|
| Skeleton | Not installed. Loading states use inline spinners |
| Accordion | Not installed. Time blocks use custom CSS grid expand/collapse |
| Collapsible | Not installed |
| Progress | Not installed. Stock uses custom StockProgressBar |
| Sonner/Toaster | `sonner` package is installed and `toast()` is used in hooks, but no `<Toaster />` renderer is mounted |
| Checkbox | Custom per-feature (supplement-checkbox with SVG animation) |
| Tabs | Custom per-feature (ViewSwitcher, bottom-nav) |
| Table | No tabular views |
| Dropdown Menu | Mobile — using Sheet/Popover instead |
| Navigation Menu | Custom bottom-nav |
| Tooltip | Mobile — no hover |
| Hover Card | Same as above |

---

## Summary of rules

1. **Warm, not cold** — cream backgrounds, brown texts, sage green accent
2. **Serif for headings** — DM Serif Display adds character and differentiates from generic apps
3. **Mobile-first, mobile-only** — max-w-md, touch targets min-h-11
4. **Motion with restraint** — checkbox bounce, progress ring, grid expand. Nothing more
5. **Organic feel** — rounded corners (rounded-xl cards), warm shadows
6. **Hierarchy through typography** — not through color. Color only for status (success/warning/danger)
7. **One accent** — brand (sage green). Don't mix with other accent colors
8. **IconBadge for status** — tap-to-reveal Popover badges with semantic color variants
9. **Protocol differentiation** — colored top borders from a fixed palette
10. **View transitions** — fade in/out for page changes, disabled during sheet interactions
