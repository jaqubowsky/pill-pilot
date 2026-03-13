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
  /* === Background === */
  --color-surface: #FAF7F2;            /* Cream background — warm off-white */
  --color-surface-alt: #F3EDE4;        /* Slightly darker cream for sections */
  --color-surface-raised: #FFFFFF;      /* Cards, modals */
  --color-surface-sunken: #EDE7DB;      /* Inset elements, inputs */

  /* === Text === */
  --color-content: #2C2417;             /* Dark brown — warmer than black */
  --color-content-muted: #6B5D4F;       /* Medium brown */
  --color-content-faint: #9C8E7E;       /* Light brown, placeholders */
  --color-content-inverse: #FAF7F2;     /* Text on dark background */

  /* === Brand (Sage Green) === */
  --color-brand-50: #F2F5F0;
  --color-brand-100: #E1E8DC;
  --color-brand-200: #C5D4BC;
  --color-brand-300: #A3BC96;
  --color-brand-400: #7FA06E;
  --color-brand-500: #5C8A4A;            /* Main accent */
  --color-brand-600: #4A7039;
  --color-brand-700: #3A5A2D;
  --color-brand-800: #2D4623;
  --color-brand-900: #1E2F18;

  /* === Status === */
  --color-success: #5C8A4A;             /* brand-500, checked off */
  --color-warning: #C4882B;             /* Warm amber, stock alerts */
  --color-danger: #B84233;              /* Muted red, critical medications */
  --color-info: #4A7A8A;                /* Muted teal */

  /* === Status backgrounds (for badges and chips) === */
  --color-success-bg: #E8F0E4;
  --color-warning-bg: #FDF0DC;
  --color-danger-bg: #F5E0DD;
  --color-info-bg: #DFF0F5;

  /* === Borders === */
  --color-edge: #E0D8CC;
  --color-edge-subtle: #EDE7DB;
  --color-edge-strong: #C5BAA8;

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

  /* === Shadows (warm, brown tint) === */
  --shadow-sm: 0 1px 2px rgba(44, 36, 23, 0.05);
  --shadow-md: 0 2px 8px rgba(44, 36, 23, 0.08);
  --shadow-lg: 0 8px 24px rgba(44, 36, 23, 0.12);
  --shadow-xl: 0 20px 60px rgba(44, 36, 23, 0.15);

  /* === Fonts === */
  --font-family-display: 'DM Serif Display', Georgia, serif;
  --font-family-body: 'Plus Jakarta Sans', system-ui, sans-serif;
}
```

### Semantic color usage

| Element | Color | Notes |
|---------|-------|-------|
| Page background | `bg-surface` | Cream, never pure white |
| Card / elevated | `bg-surface-raised` | White with shadow-sm |
| Checked off (✅) | `success` / `brand-500` | Green checkmark + subtle background |
| Unchecked (☐) | `border-edge` | Empty ring |
| Critical medication (🔴) | `danger` | Badge + icon |
| Stock alert (⚠️) | `warning` | Amber badge |
| New supplement (🆕) | `info` | Teal badge |
| Confidence < 0.7 (⚠️) | `warning` | Amber with question mark icon |
| Inactive elements | `text-content-faint` | Grayed out |
| Progress ring/bar | `brand-500` on `brand-100` | Fill on background |
| Bottom nav active | `brand-600` | With subtle bg |
| Bottom nav inactive | `text-content-faint` | No background |

---

## Typography

### Fonts

```tsx
// src/app/layout.tsx — fonts via next/font (self-hosted, zero CLS)
import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google';

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

// <body className={`${dmSerif.variable} ${plusJakarta.variable} font-body`}>
```

| Type | Font | Usage |
|--------|------|--------------|
| **Display / H1** | DM Serif Display | Screen headings, app name in logo, onboarding, empty page |
| **Body / UI** | Plus Jakarta Sans | Entire UI: buttons, labels, inputs, content, navigation |

### Typography scale (Tailwind defaults)

| Token | Usage |
|-------|-------------|
| `text-2xl` | Screen headings (DM Serif Display) |
| `text-xl` | Main sections (DM Serif Display) |
| `text-lg` | Block headings |
| `text-base` | Main text, UI |
| `text-sm` | Lists, UI elements, labels |
| `text-xs` | Badge, status, meta, captions |

### Typography rules

- **Screen headings** → `text-2xl font-display`
- **UI elements** → `font-body` (default)
- **Badge / time blocks** → `text-xs font-semibold uppercase tracking-wide`
- **Numbers** (stock count, progress) → `font-bold`

---

## Spacing and layout

### Spacing tokens

Semantic tokens defined in `@theme`, used as standard Tailwind classes:

| Token | Value | Tailwind class | Usage |
|-------|---------|---------------|-------------|
| `xs` | 4px | `p-xs`, `gap-xs` | Micro gap (icon-text, inside badge) |
| `sm` | 8px | `p-sm`, `gap-sm` | Tight (elements in a row) |
| `md` | 16px | `p-md`, `gap-md` | Card padding, list gap |
| `lg` | 24px | `p-lg`, `gap-lg` | Gap between sections |
| `xl` | 32px | `p-xl`, `gap-xl` | Gap between main sections |
| `2xl` | 48px | `pt-2xl` | Top margin of screen |
| `3xl` | 96px | `pb-3xl` | Bottom margin (above bottom nav) |

### Layout rules

- **Max width:** `max-w-md` (448px), centered on desktop
- **Page padding:** `px-md pt-2xl pb-3xl`
- **Card padding:** `p-md`
- **Card border-radius:** `rounded-xl`
- **Badge, chip:** `rounded-lg`
- **Inputs, buttons:** `rounded-lg`
- **Bottom nav height:** `h-16` + safe area
- **Touch target minimum:** `min-h-11` (44px)

### Grid and composition

- Single column layout on mobile (the only target)
- Accordion blocks: full-width, stacked
- Supplement row: flex, space-between, align-center
- Stock list: stacked cards with subtle separator (border, not gap)

---

## Components — style and behavior

### Cards

```
bg-surface-raised border border-edge-subtle rounded-xl shadow-sm p-md
```

Cards do NOT have a hover effect (mobile-first). Active state: `active:scale-[0.98] transition-transform duration-150`.

### Buttons

Uses `@base-ui/react` Button with `class-variance-authority`. Base: `rounded-lg text-sm font-medium active:translate-y-px`.

**Primary (default):**
```
bg-primary text-primary-foreground
```

**Outline:**
```
border-border bg-background hover:bg-muted
```

**Ghost:**
```
hover:bg-muted hover:text-foreground
```

**Destructive:**
```
bg-destructive/10 text-destructive hover:bg-destructive/20
```

**Sizes:** `xs` (h-6), `sm` (h-7), `default` (h-8), `lg` (h-9), plus icon variants.

**Disabled state (all variants):**
```
opacity-50 pointer-events-none
```

### Checkbox / Toggle

**Supplement checkbox (custom, not native):**
```
Touch area:   min-h-11 min-w-11
Visible:      size-6 rounded-full border-2 border-edge
Checked:      bg-brand-500 border-brand-500, white checkmark (animated)
Transition:   duration-200 ease-out
```

Check animation: checkmark draws via SVG stroke-dashoffset (150ms), circle does a
subtle pulse (scale 1 -> 1.1 -> 1, 200ms).

### Accordion (Time Block)

```
Header:       flex justify-between items-center min-h-12
              Left: block icon + name (text-xs font-semibold uppercase tracking-wide) + startTime
              Right: progress chip + chevron
Expanded:     list of supplements with gap-sm
Chevron:      rotate-180 transition-transform duration-200
Transition:   CSS grid trick (grid-template-rows: 0fr -> 1fr), duration-250
```

### Progress Ring (Dashboard)

```
Size:         size-20 (80px)
Track:        stroke-brand-100, stroke-[6px]
Fill:         stroke-brand-500, stroke-[6px], stroke-linecap-round
Percent:      center, text-lg font-semibold
Label:        below ring, "12/35", text-sm text-content-muted
Animation:    stroke-dashoffset transition duration-600 ease-out on mount
```

### Badge

```
rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide

Variants:
  success:  bg-success-bg text-brand-700
  warning:  bg-warning-bg text-[#8B6914]
  danger:   bg-danger-bg text-danger
  info:     bg-info-bg text-[#2D6070]
  neutral:  bg-surface-sunken text-content-muted
```

### Bottom Navigation

```
fixed bottom-0 inset-x-0 bg-surface-raised/90 backdrop-blur-md
border-t border-edge-subtle h-16 pb-[env(safe-area-inset-bottom)]
3 items: flex-1 flex flex-col items-center justify-center gap-xs
Active:   text-brand-600 + dot indicator (size-1 rounded-full bg-brand-500)
Inactive: text-content-faint
Label:    text-xs font-semibold
Icon:     size-6 stroke-[1.5] (Lucide via shadcn)
Transition: transition-colors duration-150
```

### Input / Form fields

```
bg-surface-sunken border border-edge rounded-lg px-md py-sm text-base
placeholder:text-content-faint
focus:border-brand-400 focus:ring-2 focus:ring-focus-ring
Label:   text-sm text-content-muted mb-xs
Error:   border-danger + text-sm text-danger mt-xs
```

### Dialogs / Modals (shadcn Dialog, @base-ui/react)

```
Overlay:  bg-black/10 backdrop-blur-xs
Content:  bg-background rounded-xl p-4 max-w-sm ring-1 ring-foreground/10
Animation: fade + zoom (zoom-in-95 -> 1), duration-100
```

### Toast / Snackbar

```
fixed top-16 inset-x-md mx-auto max-w-sm
bg-content text-content-inverse rounded-lg shadow-lg
Animation: slide-down + fade, auto-dismiss 3s
```

---

## Icons

Lucide Icons (provided by shadcn/ui). Style:

- **Stroke width:** `stroke-[1.5]` (lighter, fits the aesthetic)
- **Size:** `size-5` (UI), `size-6` (navigation), `size-4` (inline/badge)
- **Color:** inherits from text (`currentColor`)

### Time block icons (defaults)

Default icons — user can change to any Lucide icon.

| Block | Lucide icon | Description |
|------|-------------|------|
| Fasting | `Sunrise` | Sunrise |
| Breakfast | `Coffee` | Cup |
| Lunch | `Sun` | Sun (midday) |
| Dinner | `Sunset` | Sunset |
| Before bed | `Moon` | Moon |

### Navigation icons

| Tab | Icon | Active |
|-----|-------|--------|
| Today | `CalendarCheck` | filled variant |
| Stock | `Package` | filled variant |
| Settings | `Settings` | filled variant |

---

## Animations and motion

### Rules

- **Purpose:** motion serves feedback and orientation, NOT decoration
- **Duration:** 100-300ms for UI, 400-800ms for page transitions
- **Easing:** `ease-out` for entering, `ease-in` for exiting
- **Reduce motion:** respect `prefers-reduced-motion` — disable animations

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
```

### Animation usage

| Animation | Trigger | Duration |
|----------|---------|---------|
| **Checkbox tap** | check-mark + check-pulse | 200ms ease-out |
| **Progress ring mount** | stroke-dashoffset transition | 600ms ease-out, delay 200ms |
| **Accordion** | grid-template-rows 0fr → 1fr | 250ms ease-out |
| **Page enter** | page-enter keyframe | 250ms ease-out |
| **Staggered list** | opacity + translateY, delay: index * 30ms | 200ms ease-out |
| **Optimistic check** | checkbox animation, row opacity 0.85 | instant |
| **Error shake** | shake keyframe | 300ms (3 cycles) |
| **Toast in** | translateY(-16px) → 0, opacity | 200ms ease-out |
| **Toast out** | opacity → 0 | 150ms ease-in, delay 3s |

---

## Screens — detailed visual description

### Dashboard (main screen)

```
┌─────────────────────────────────────┐
│ status bar (system)                 │
├─────────────────────────────────────┤
│                                     │
│    ◄  Thursday, March 13  ►         │  ← font-display text-xl
│                                     │     Arrows: ghost buttons, brand-600
│         ╭─────────╮                 │
│        │   34%    │                 │  ← Progress ring, size-20
│         ╰─────────╯                 │     Percent: text-lg font-semibold
│         12 of 35 checked off        │  ← text-sm text-content-muted
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☀ FASTING  06:30       ✅ 4/4 ▼│   │  ← Expanded, bg card
│ │                               │   │     Header: icon + name + startTime + progress
│ │  ✅ Pepzin GI Complex  2 caps │   │     Row: checkbox + name + dose
│ │     30 min before meal        │   │     notes: text-xs text-content-faint
│ │  ✅ Licorice DGL       1 caps │   │     Checked: brand text, line-through subtle
│ │  ✅ Propolis           15 drps│   │
│ │  ✅ Nattokinase        1 caps │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☕ BREAKFAST  08:00      2/14  ▼│   │  ← Partially done
│ │                               │   │
│ │  ✅ Emanera            1 caps │   │
│ │  ☐ NAC                2 caps │   │     Unchecked: normal text
│ │  ☐ Ospamox 🔴         1 tabs │   │     Critical: danger badge inline
│ │  ☐ ...                       │   │
│ │                               │   │
│ │  [ ✓ Check off entire block ] │   │  ← Ghost button, full width
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
│ (bottom spacing for nav)            │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │  ← Bottom nav, fixed
│         •                           │     Active: dot indicator
└─────────────────────────────────────┘
```

**Behavior:**
- Expanded by default: active block (by time) + first incomplete
- Completed blocks: header has brand tint (success-bg)
- Progress chip in header: `success` badge when 100%, `neutral` when 0%, plain text when partial
- Date navigation: swipe left/right or arrows

### Onboarding — Upload

```
┌─────────────────────────────────────┐
│                                     │
│     Welcome to PillPilot            │  ← font-display text-2xl
│                                     │
│     Upload your treatment protocol  │  ← text-base text-content-muted
│     — AI will do the rest.          │
│                                     │
│ ┌───────────────────────────────┐   │
│ │                               │   │
│ │     ┌─────────────────┐       │   │  ← Dropzone: dashed border,
│ │     │  📄              │       │   │     border-edge-strong, bg-surface-sunken
│ │     │  Drop file       │       │   │     hover: border brand-400
│ │     │  PDF or Excel    │       │   │
│ │     └─────────────────┘       │   │
│ │                               │   │
│ │  or choose an option:         │   │
│ │                               │   │
│ │  ┌─────────┐ ┌─────────┐     │   │  ← UploadOptionCard: card style
│ │  │ 📄 PDF  │ │ 📊 Excel│     │   │     min-h-12 touch area
│ │  │ Upload  │ │ Upload  │     │   │     touch-friendly
│ │  └─────────┘ └─────────┘     │   │
│ │                               │   │
│ │  ┌─────────────────────┐     │   │  ← [WEEK 1] Third option
│ │  │ ✏️ Add manually      │     │   │     Secondary button, full width
│ │  └─────────────────────┘     │   │
│ │                               │   │
│ └───────────────────────────────┘   │
│                                     │
│                                     │
│  Step 1 of 2    ● ○                 │  ← Step indicator, brand dots
└─────────────────────────────────────┘
```

MVP: 2 steps (upload → preview). WEEK 1: 3 steps (+stock setup).

### Onboarding — Preview (AI parsing)

```
┌─────────────────────────────────────┐
│                                     │
│     Review and approve              │  ← font-display text-2xl
│     Protocol: H. Pylori            │  ← text-base text-content-muted
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☀ FASTING                (4)│   │  ← Block header
│ │                               │   │
│ │ ✅ Pepzin GI Complex  2 caps  │   │  ← Linked: success badge
│ │    → Pepzin (Apollo's) 90pcs  │   │     text-sm text-content-muted
│ │                               │   │
│ │ 🆕 Licorice DGL       1 caps  │   │  ← New: info badge "NEW"
│ │    → will be added            │   │
│ │                               │   │
│ │ ⚠️ Propolis           15 drps  │   │  ← Low confidence: warning badge
│ │    → Propolis non-alc.? Check │   │     "CHECK" — tapable
│ │                         [✏️]  │   │     Edit icon
│ │                               │   │
│ │ ✅ Nattokinase         1 caps  │   │
│ │    → Nattokinase (Apollo's)   │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☕ BREAKFAST              (14)│   │
│ │  ...                          │   │
│ └───────────────────────────────┘   │
│                                     │
│  ⚠️ 1 item requires verification   │  ← Warning bar, sticky bottom
│                                     │
│  [       Approve protocol         ] │  ← Primary button
│                                     │     disabled if ⚠️ not resolved
│  Step 2 of 2    ○ ●                 │
└─────────────────────────────────────┘
```

### Stock

```
┌─────────────────────────────────────┐
│                                     │
│     My stock                        │  ← font-display text-2xl
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Berberine                     │   │  ← stock-item card
│ │ Apollo's Hegemony             │   │     Name: text-sm font-bold
│ │                               │   │     Brand: text-sm text-content-muted
│ │ 12 pcs.              [Restock]│   │     Stock: text-base font-semibold
│ │ ████░░░░░░░░  ~4 days         │   │     Progress bar + forecast [WEEK1]
│ │                    [Adjust]   │   │     Buttons: ghost
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Omega-3                       │   │
│ │ Apollo's Hegemony             │   │
│ │                               │   │
│ │ 45 pcs.              [Restock]│   │
│ │ ████████████░░  ~15 days      │   │
│ │                    [Adjust]   │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ NAC                           │   │
│ │ Apollo's Hegemony             │   │
│ │                               │   │
│ │ 87 pcs.              [Restock]│   │
│ │ ██████████████████  ~29 days  │   │
│ │                    [Adjust]   │   │
│ └───────────────────────────────┘   │
│                                     │
│ ── No tracking ──                   │  ← Separator, text-content-faint
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Propolis (drops)              │   │
│ │ ---                [Set up]   │   │
│ └───────────────────────────────┘   │
│                                     │
│  [ + Add supplement ]               │  ← Secondary button
│                                     │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │
│                  •                  │
└─────────────────────────────────────┘
```

**Stock item behavior:**
- Tap on item → Supplement Edit Sheet
- Swipe left → "Delete" (ghost danger button, slide-in)
- "Add supplement" → same Supplement Edit Sheet, but without data and without "Delete"

### Stock — Empty State

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         ┌─────────────┐             │
│         │  📦          │             │  ← Simple line-art, brand-300
│         │  ~~~         │             │
│         └─────────────┘             │
│                                     │
│     Your cabinet is empty           │  ← font-display text-xl
│                                     │     text-content-muted
│     Upload a protocol or add        │  ← text-sm text-content-faint
│     supplements manually.           │
│                                     │
│  [    Upload protocol     ]         │  ← Primary button
│  [    Add manually        ]         │  ← Ghost button
│                                     │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │
│                  •                  │
└─────────────────────────────────────┘
```

### Login

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│          💊                         │  ← Icon/logo, size-12
│                                     │
│     PillPilot                       │  ← font-display text-2xl
│     Your daily supplement           │  ← text-base text-content-muted
│     pilot                           │
│                                     │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  G  Continue with Google     │  │  ← Google OAuth button
│  └───────────────────────────────┘  │     Card-style, full width, min-h-12
│                                     │     Google logo + text
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Settings [MVP]

```
┌─────────────────────────────────────┐
│                                     │
│     Settings                        │  ← font-display text-2xl
│                                     │
│ ── Protocols ──                     │  ← text-xs uppercase tracking-wide
│                                     │     text-content-faint
│ ┌───────────────────────────────┐   │
│ │ H. Pylori             ACTIVE │   │  ← Protocol card
│ │                               │   │     Name: text-sm font-bold
│ │ ☀ Fasting                     │   │     Status: success badge
│ │   Pepzin 2 caps          ━●  │   │
│ │   Licorice DGL 1 caps   ━●  │   │  ← Schedule list per block
│ │ ☕ Breakfast                   │   │     text-sm, text-content-muted
│ │   NAC 2 caps             ━●  │   │     Switch per schedule (active toggle)
│ │   Emanera 1 caps         ━●  │   │     Tap on schedule → edit sheet
│ │   ...                         │   │
│ │                               │   │
│ │ [ + Add dose ]                │   │  ← Ghost button
│ │                               │   │
│ │ [Archive]                     │   │  ← Ghost danger button
│ └───────────────────────────────┘   │
│                                     │
│ [ + Add new protocol ]              │  ← Primary button, full width
│                                     │     → navigates to upload flow
│                                     │
│ ── Time blocks ──                   │  ← text-xs uppercase tracking-wide
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ☀ Fasting              06:30  │   │  ← time-block-row
│ │ ☕ Breakfast             08:00  │   │     Tap → edit sheet
│ │ ☀ Lunch                13:00  │   │     Icon + name + startTime
│ │ 🌅 Dinner               19:00  │   │
│ │ 🌙 Before bed           22:00  │   │
│ │                               │   │
│ │ [ + Add block ]               │   │  ← Ghost button
│ └───────────────────────────────┘   │
│                                     │
│ ── Account ──                       │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Email                         │   │
│ │ jan@example.com               │   │  ← text-sm text-content-muted
│ │                               │   │
│ │ [Log out]                     │   │  ← Ghost danger button
│ └───────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │
│                           •        │
└─────────────────────────────────────┘
```

**"Add new protocol" (non-onboarding):** Reuse Upload + Preview components, but without step indicator and without changing onboardingStep. Redirect after approval to `/dashboard`.

### AI Parsing — Loading

```
┌─────────────────────────────────────┐
│                                     │
│     Analyzing protocol...           │  ← font-display text-xl
│                                     │
│         ╭─────────╮                 │
│        │  ⟳      │                 │  ← Progress ring, animate-spin
│         ╰─────────╯                 │     brand-500
│                                     │
│     AI is reading your file         │  ← text-sm text-content-muted
│     and recognizing supplements.    │     Centered
│                                     │
│     This may take a few seconds.    │
│                                     │
└─────────────────────────────────────┘
```

After completion: automatic redirect to Preview.
Error: toast with message + return to Upload.

### Supplement Edit Sheet (Stock page → tap)

```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │  ← Sheet from bottom
│ │          ━━━                  │   │     Drag handle, centered
│ │                               │   │
│ │  Edit supplement              │   │  ← text-lg font-semibold
│ │                               │   │
│ │  Name                         │   │  ← Label + Input
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
│ │  │ Supplement         ▼  │    │   │  ← Select
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  ☐ Critical (prescription)    │   │  ← Switch
│ │                               │   │
│ │  Package size (optional)      │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ 90                    │ pcs│   │  ← Input number
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Package price (optional)     │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ 49.99                 │    │   │  ← Input number (no currency)
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  [       Save changes        ]│   │  ← Primary button
│ │                               │   │
│ │  [Delete supplement]          │   │  ← Ghost danger, centered
│ │                               │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Restock — Dialog

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────┐      │
│  │                           │      │  ← Dialog, rounded-2xl
│  │  Restock: NAC             │      │     p-lg
│  │                           │      │
│  │  How many did you buy?    │      │  ← text-sm text-content-muted
│  │  ┌───────────────────┐    │      │
│  │  │ 90                │    │      │  ← Input, type number
│  │  └───────────────────┘    │      │     autofocus
│  │  pcs.                     │      │
│  │                           │      │
│  │  [Cancel]    [Add]        │      │  ← Ghost + Primary
│  │                           │      │
│  └───────────────────────────┘      │
│                                     │
└─────────────────────────────────────┘
```

Similarly Adjust — but label "How many do you have now?" and button "Save" instead of "Add".

### Stock Setup [WEEK 1]

```
┌─────────────────────────────────────┐
│                                     │
│     How much do you have left?      │  ← font-display text-2xl
│                                     │
│     Optional — enter how many       │  ← text-base text-content-muted
│     units you have in your cabinet. │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ NAC                           │   │  ← stock-input-row
│ │ Apollo's Hegemony             │   │     Name + brand
│ │ ┌──────────┐                  │   │
│ │ │ 87       │ pcs.     [Skip]  │   │  ← Input + unit + ghost button
│ │ └──────────┘                  │   │     "Skip" → stock = null
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Pepzin GI Complex             │   │
│ │ Apollo's Hegemony             │   │
│ │ ┌──────────┐                  │   │
│ │ │          │ pcs.     [Skip]  │   │  ← Empty = null
│ │ └──────────┘                  │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Licorice DGL                  │   │
│ │ ┌──────────┐                  │   │
│ │ │          │ pcs.     [Skip]  │   │
│ │ └──────────┘                  │   │
│ └───────────────────────────────┘   │
│                                     │
│ ...                                 │
│                                     │
│ [Skip all]       [Save and continue]│  ← Ghost + Primary
│                                     │
│  Step 3 of 3    ○ ○ ●               │  ← Only when WEEK 1
└─────────────────────────────────────┘
```

### Schedule Edit Sheet (Settings → tap on schedule)

```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │  ← Sheet from bottom
│ │          ━━━                  │   │
│ │                               │   │
│ │  Edit dose                    │   │  ← text-lg font-semibold
│ │  NAC (H. Pylori)              │   │     text-sm text-content-muted
│ │                               │   │
│ │  Dosage                       │   │
│ │  ┌────────┐ ┌────────────┐    │   │
│ │  │ 2      │ │ capsules ▼ │    │   │  ← Input number + Select unit
│ │  └────────┘ └────────────┘    │   │
│ │                               │   │
│ │  Block                        │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ Breakfast          ▼  │    │   │  ← Select
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Notes (optional)             │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ 30 min before meal... │    │   │  ← Input, visible on dashboard
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Active          ━━━━━●       │   │  ← Switch (toggle schedule)
│ │                               │   │
│ │  [       Save changes        ]│   │  ← Primary button
│ │                               │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Time Block Edit Sheet (Settings → tap on block)

```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │  ← Sheet from bottom
│ │          ━━━                  │   │
│ │                               │   │
│ │  Edit block                   │   │  ← text-lg font-semibold
│ │                               │   │
│ │  Name                         │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ Fasting               │    │   │  ← Input
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Icon                         │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ Sunrise            ▼  │    │   │  ← Select (list of Lucide icons)
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  Start time                   │   │
│ │  ┌───────────────────────┐    │   │
│ │  │ 06:30               │    │   │  ← Input time (HH:mm)
│ │  └───────────────────────┘    │   │
│ │                               │   │
│ │  [       Save changes        ]│   │  ← Primary button
│ │                               │   │
│ │  [Delete block]               │   │  ← Ghost danger, disabled if
│ │                               │   │     block has active schedules
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Dashboard — Empty State

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│         ┌─────────────┐             │
│         │  💊          │             │  ← Simple line-art, brand-300
│         │  ~~~         │             │     Pill illustration
│         └─────────────┘             │
│                                     │
│     Add your first                  │  ← font-display text-xl
│     protocol                        │     text-content-muted
│                                     │
│     Upload a supplement plan        │  ← text-sm text-content-faint
│     and start tracking.             │
│                                     │
│  [    Upload protocol     ]         │  ← Primary button
│                                     │
│                                     │
├─────────────────────────────────────┤
│  📅 Today    📦 Stock    ⚙ Sett.  │
│         •                           │
└─────────────────────────────────────┘
```

---

## UI states

### Loading

- **Skeleton:** `rounded-lg bg-surface-sunken animate-pulse`
- **Inline spinner:** `size-4` brand-500, `animate-spin`
- **Full page loader:** Progress ring animation + "Loading..." below

### Empty states

- **Dashboard without protocol:** Illustration (simple line-art in brand-300) + "Add your first protocol" + Primary CTA
- **Stock empty:** "Your cabinet is empty" + "Upload a protocol or add manually"
- Heading text: `font-display text-xl text-content-muted`
- Description text: `text-sm text-content-faint`

### Error states

- **Inline error (form):** Danger text below input, danger border on input
- **Toast error:** Red background (danger), white text
- **Full page error:** "Something went wrong" + retry button
- **Offline indicator:** Subtle bar below status bar, `bg-surface-sunken`, "Offline mode" + `WifiOff` icon

### Confirmations

- **Unchecking a supplement:** Dialog with "Are you sure you want to uncheck?" + "Cancel" / "Uncheck"
- **Check off entire block:** Dialog with list of supplements that will be checked off
- **Bulk delete:** "Delete X supplements?" with list of names

---

## Visual details

### Separators

- Between sections: `border-b border-edge-subtle` — NOT thick lines
- Alternatively: spacing (`gap-lg`) instead of lines where possible
- In lists (stock items): `border-edge-subtle` bottom border, last element `last:border-0`

---

## Responsiveness

### Mobile-first (and nearly the only target)

```html
<div class="mx-auto max-w-md px-md min-h-screen sm:shadow-lg">
```

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

**Out of scope** (per PRD). Application is ONLY in light mode.

---

## Logo and branding

### Logo

- Simple pill/capsule icon in brand-500
- Beside it: "PillPilot" in DM Serif Display
- On splash and login: logo + text vertically
- In UI: not displayed (bottom nav instead)

### Favicon / PWA icon

- Capsule on brand-500 background
- Sizes: 192x192, 512x512

### Theme color (PWA manifest)

```json
{
  "theme_color": "#FAF7F2",
  "background_color": "#FAF7F2"
}
```

---

## shadcn/ui theming

shadcn/ui components adapted to the palette. Key mappings:

```
shadcn background   → bg-surface
shadcn card         → bg-surface-raised
shadcn primary      → brand-500
shadcn destructive  → danger
shadcn muted        → bg-surface-sunken
shadcn border       → border-edge
shadcn ring         → focus-ring
```

---

## shadcn/ui — components

### Required components

| Component | Where used | Customization |
|-----------|--------------|--------------|
| **Button** | Everywhere | 5 variants via CVA: `default` (bg-primary), `outline` (border-border), `ghost`, `destructive` (bg-destructive/10), `link`. Sizes: xs/sm/default/lg + icon variants. Base: `active:translate-y-px`. Uses `@base-ui/react` |
| **Dialog** | Unchecking supplement, check off entire block, bulk delete, confirmations | `rounded-xl p-4 ring-1 ring-foreground/10`. Overlay: `bg-black/10 backdrop-blur-xs`. Uses `@base-ui/react` |
| **Input** | Forms: supplement edit, stock input, email login, stock setup | `bg-surface-sunken border-edge rounded-lg px-md py-sm`. Focus: `border-brand-400 ring-focus-ring` |
| **Label** | Next to inputs | `text-sm text-content-muted` |
| **Select** | Change supplement linking (preview), block selection, category selection, dosage unit selection | `bg-surface-sunken border-edge rounded-lg` |
| **Accordion** | Time blocks on dashboard (dynamic list from database) | Custom: header `min-h-12`, chevron rotation, CSS grid expand trick. Trigger: block icon + name uppercase + startTime + progress chip |
| **Badge** | Linking status (✅🆕⚠️), critical badge, stock warning, progress chip | 5 color variants: success, warning, danger, info, neutral. `rounded-lg px-sm py-xs text-xs font-semibold uppercase tracking-wide` |
| **Skeleton** | Loading states on dashboard, stock list, preview | `rounded-lg bg-surface-sunken animate-pulse` |
| **Sonner** (toast) | Action confirmations, errors, offline sync, AI parsing status | `bg-content text-content-inverse rounded-lg shadow-lg`. Position: top center. Auto-dismiss 3s |
| **Switch** | Toggle schedule active/inactive (settings), push notifications per block [WEEK 1] | Track: `bg-surface-sunken` → `bg-brand-500`. Thumb: white |
| **Separator** | Between stock list sections ("No tracking"), in settings | `border-edge-subtle` |
| **Collapsible** | Alternative to Accordion if simpler — optionally in settings protocol section | Default style, `duration-250` transition |
| **Progress** | Stock progress bar [WEEK 1] | Track: `bg-brand-100`, fill: `bg-brand-500`. Low stock (<7 days): fill `bg-warning`. Critically low (<3 days): fill `bg-danger` |
| **Sheet** | Supplement edit (stock page → tap → edit sheet), adding supplement, schedule form | From bottom (mobile-friendly). `bg-background shadow-lg`. Overlay: `bg-black/10 backdrop-blur-xs`. Uses `@base-ui/react` |

### Not needed from shadcn

| Component | Reason |
|-----------|-------|
| Checkbox | Custom per-feature (supplement-checkbox with SVG animation) |
| Tabs | Custom per-feature (bottom-nav) |
| Table | No tabular views, everything is lists/cards |
| Dropdown Menu | Mobile app — using Sheet from bottom instead of dropdown |
| Navigation Menu | Custom per-feature (bottom-nav) |
| Menubar | Not applicable for mobile PWA |
| Tooltip | Mobile — no hover, makes no sense |
| Hover Card | Same as above |

---

## Summary of rules

1. **Warm, not cold** — cream backgrounds, brown texts, sage green accent
2. **Serif for headings** — DM Serif Display adds character and differentiates from generic apps
3. **Mobile-first, mobile-only** — max-w-md, touch targets min-h-11
4. **Motion with restraint** — checkbox bounce, progress ring, accordion. Nothing more
5. **Organic feel** — rounded corners (rounded-xl cards), warm shadows
6. **Hierarchy through typography** — not through color. Color only for status (success/warning/danger)
7. **One accent** — brand (sage green). Don't mix with other accent colors
8. **Badge not emoji** — in code use badge components, not emoji (emoji only in PRD for readability)
