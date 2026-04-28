# PillPilot Redesign — Design Spec
Date: 2026-04-28  
Style: Quiet · Warm · Timeline

## Source of truth
Design mockup: shared by user (6-screen image, Apr 2026)  
Example code: `/Users/kubunito/Desktop/src/` (8 JSX files with inline styles)

## Overview
Full visual redesign of all screens. Color palette stays close to the existing apothecary palette. The key shifts are typography and layout patterns.

---

## Global Changes

### Fonts
Replace current fonts with:
- **Inter Tight** (Google Fonts, weights 400/500/600, italic) — all headings, body, UI elements
- **Geist Mono** (Google Fonts, weights 400/500/600) — times, counts, section labels, meta info

Remove: DM Serif Display, Plus Jakarta Sans.

```tsx
// src/app/layout.tsx
import { Inter_Tight, Geist_Mono } from 'next/font/google';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display-face',  // used for both display and body
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono-face',  // NEW variable for mono
});

// body className: `${interTight.variable} ${geistMono.variable} font-body ...`
```

Add to `globals.css` `@theme` block:
```css
--font-display: var(--font-display-face), system-ui, sans-serif;  /* was Georgia serif */
--font-body: var(--font-display-face), system-ui, sans-serif;     /* same as display — Inter Tight everywhere */
--font-mono: var(--font-mono-face), monospace;                    /* NEW: Geist Mono */
```

Tailwind's `font-mono` utility now maps to Geist Mono. Use `font-mono` on times, section labels, counts. Use `font-display` or `font-body` (both Inter Tight) elsewhere. Remove the `--font-body-face` variable from layout.tsx since body and display share `--font-display-face`.

### Typography pattern — italic accent on headings
Page titles use a mixed italic/accent pattern in Inter Tight:

```tsx
// "28 <em>kwietnia</em>" — month in accent color, same font weight
<h1 className="font-display text-[30px] font-normal tracking-[-0.025em]">
  28 <em className="not-italic text-brand-500">kwietnia</em>
</h1>

// "Mój <em>zapas</em>", "Edytuj <em>suplement</em>", etc.
```

### Section labels (Geist Mono)
Replace all `text-xs uppercase tracking-wide font-semibold text-content-faint` section headers with Geist Mono style:

```
font-mono text-[10px] tracking-[0.09em] uppercase text-content-faint
```

---

## Today / Dashboard Screen

### Header
```
- Day name: font-mono text-[11px] uppercase tracking-[0.08em] text-content-faint
- Date heading: font-display text-[30px] font-normal tracking-[-0.025em], month in text-brand-500
- Streak chip: flame icon + count + "dni" — border border-edge bg-surface-raised rounded-full px-3 py-1.5
```

### Hero card (new — replaces standalone progress ring)
Progress dial + next dose info, side by side in a card:
```
bg-surface-raised border border-edge rounded-[14px] p-[14px] flex gap-4
```

- **Progress dial**: 72×72 SVG, shows `done / total` count (not %) in Inter Tight, track in `theme.line`, fill in brand-500
- **Next dose info**: label (Geist Mono uppercase, brand-500, with pulsing dot), supplement name (Inter Tight 19px), sub (dose · block name, Geist Mono)

### Timeline layout (replaces accordion cards)
Each time block is a row in a vertical timeline:

```
Timeline column (w-8, flex-col, items-center):
  - Circle node (w-8 h-8 rounded-full)
    - active:   bg-brand-500 + ring (box-shadow 0 0 0 4px brand-500/10), white icon
    - done:     bg-brand-500/[0.13] border border-brand-500/[0.27], brand-500 checkmark
    - upcoming: bg-surface border border-edge, dim icon
  - Connecting line (w-px flex-1 mt-1)
    - done: bg-brand-500/[0.33]
    - upcoming: bg-edge

Card area (flex-1, pb-5 on non-last):
  - Collapsed: button, bg transparent (active: bg-surface-raised border border-brand-500/20)
    - Time (Geist Mono text-[11px] tracking-[0.05em] text-content-faint)
    - "· teraz" indicator (Geist Mono text-[9px] uppercase tracking-[0.08em] text-brand-500) — active only
    - Block name (Inter Tight font-display text-[21px] font-normal tracking-[-0.015em])
    - Count chip: bg-surface border border-edge rounded-full px-[10px] py-1 (Geist Mono 12px)
      - done: text-brand-500
    - Chevron (rotates on expand)
  - Expanded: card below header
    - bg-surface-raised border border-edge rounded-[14px] mt-2 p-[4px_16px_12px]
    - Pill rows (see below)
    - Footer: "Zaznacz cały blok" (brand-500) + "Notatka" (dim) dashed border-t

Pill row:
  - Checkbox (w-6 h-6 rounded-full, taken: bg-brand-500, isNext: bg-brand-500/8 border-brand-500)
  - Name (Inter Tight 14px font-medium) + dose (Geist Mono 12px text-content-faint tabular-nums)
  - Cycle icon (Repeat, size-[11px])
  - Note (Geist Mono 11.5px text-content-faint, brand + note combined)
  - More button (3-dot icon)
  - taken: opacity-55
```

---

## Stock / Inventory Screen

### Header
```
"Mój <em>zapas</em>" — Inter Tight 30px font-medium tracking-[-0.02em], "zapas" in brand-500
```

### Summary chips (new)
3 chips in a flex row, each `flex-1 p-[10px_12px] rounded-xl border`:
- **Skończone**: danger tint when > 0 (`bg-danger/[0.06] border-danger/20`, count in `text-danger`)
- **Niski stan**: warning tint when > 0 (`bg-warning/[0.07] border-warning/20`, count in `text-warning`)
- **Łącznie**: neutral (`bg-surface-raised border-edge`)
- Label: Geist Mono 9px uppercase tracking-[0.05em]
- Count: Inter Tight 22px lh-1

### Inventory rows
Cards (`bg-surface-raised border border-edge rounded-[14px] mb-[10px] p-[14px_18px]`):
- Name (Inter Tight 15px font-semibold) + PUSTO/NISKI badge (inline, Geist Mono 9px)
- Brand (11px dim)
- Count: `current/total unit` — Geist Mono 13px tabular-nums, total in dim
- Progress bar: h-1.5 rounded-full, color shifts by urgency (brand-500 → warning → danger)
- Bar labels: percentage (Geist Mono) + days remaining (urgency color when low)
- Button row: Edytuj (neutral) + Uzupełnij (accent when empty, else ghost-accent)

---

## Settings Screen

### Header
```
"<em>Ustawienia</em>" — Inter Tight 30px font-medium, entirely in brand-500 italic
```

### Section headers
Geist Mono 10px uppercase tracking-[0.1em] text-content-faint, with optional action button (brand-500 text, Geist Mono).

### Protocol cards
```
bg-surface-raised border rounded-[14px] p-[14px_16px]
active: border-brand-500/[0.33] + box-shadow 0 0 0 3px brand-500/[0.06]
archived: opacity-60
```
Name (Inter Tight 14.5px font-semibold) + edit icon + status badge (pill rounded-full).
Action buttons: Udostępnij / Archiwizuj (or Przywróć / Usuń for archived).

### Time block rows
```
List in card (bg-surface-raised border border-edge rounded-[14px] overflow-hidden)
Each row: flex items-center gap-3 p-[12px_16px] border-b border-edge last:border-0
  - Icon chip: w-[30px] h-[30px] rounded-lg bg-surface border border-edge, icon inside (14px)
  - Name (Inter Tight 14px font-medium)
  - Time (Geist Mono 13px text-content-faint tabular-nums)
```

### Notification toggles
Each as a card (`bg-surface-raised border border-edge rounded-xl p-[14px_16px]`), not bare rows. Gap between cards.

---

## Shopping Screen

### Header
```
"<em>Zakupy</em>" — Inter Tight 28px font-medium, entirely in brand-500
Subtitle: "N sklep · XX.XX zł" — Geist Mono 12px text-content-faint
```

### Section labels
Geist Mono 10px uppercase tracking-[0.09em] text-content-faint, `paddingLeft: 4px`.

### Store header (inside cards)
Dashed border-b, shop icon in small square, store name (Geist Mono 11px), delivery cost (Geist Mono 11px dim).

### "Do kupienia teraz" cards
Item rows with danger icon badge (w-8 h-8 rounded-lg bg-danger/[0.06] border-danger/20) + price (Geist Mono tabular-nums) + "Pilne" badge.
Footer: dashed border-t, "Produkty" + "Dostawa" lines (Geist Mono tabular-nums).

### "Kończy się wkrótce" section
Inside store card: Geist Mono sub-label, simpler rows (name + date + price).

### Total card
Inter Tight 26px font-medium for the amount, Geist Mono "Łącznie" label.

### Scan basket card
Dashed border `border-edge-strong`, camera icon in square, title + subtitle.

### "Uzupełnij ceny" — price entry rows
Input field with Geist Mono tabular-nums, accent tint when filled. Store selector and edit icon buttons.

---

## Parsed Preview / Edit Protocol Screen

### Header
```
"← Wróć" — back button (Inter Tight, dim)
"Sprawdź i <em>zatwierdź</em>" — Inter Tight 30px font-medium, "zatwierdź" in brand-500
Subtitle: protocol name (13px dim)
```

### Date field
Geist Mono formatted date in styled container (bg-surface-raised border rounded-xl p-[12px_16px]).

### Legend chips
Geist Mono 10px inline chip list (fast / cycle / linked icons with labels).

### Block groups
Card (bg-surface-raised border rounded-[14px] overflow-hidden), header bar (bg-surface bg, Geist Mono uppercase bold), item rows with drag handle + badges + edit/move/delete icons.

### Sticky save bar
Gradient fade (`bg-gradient-to-t from-surface`) + full-width green button with box-shadow.

---

## Edit Supplement Sheet

### Header
```
"Edytuj <em>suplement</em>" — Inter Tight 22px font-medium, "suplement" in brand-500
Close × button
```

### Field labels
Geist Mono 10px uppercase tracking-[0.06em] text-content-faint.

### Text fields
```
bg-surface border border-edge rounded-[10px] p-[11px_14px] text-[14px]
```

### Block selector
Chip row (flex wrap gap-1.5):
```
Selected: bg-brand-500 text-white border-brand-500
Unselected: bg-surface border-edge text-content
rounded-full px-3.5 py-2 text-[12.5px] font-medium
```

### Advanced section
Collapsed toggle section (Geist Mono header + ChevronUp/Down), PropToggleRow items (border-b between, no card wrapper), conditional expanded field (bg-surface rounded-xl p-3.5).

### Footer
Delete button (danger-tinted, with trash icon) + Save button (full-width, bg-brand-500).

---

## Implementation Notes

1. Font swap is global — update `layout.tsx` and CSS vars only, no per-component changes needed for the font family itself.
2. The italic/accent heading pattern needs to be applied per-screen in the heading JSX.
3. Timeline layout for Today is a full rewrite of `BlockCard` and `SupplementRow` components.
4. Geist Mono for numbers/times is a per-component change where currently numeric content appears.
5. Summary chips on Inventory are new components.
6. Protocol cards in Settings get minor styling updates (border/glow, button layout).
7. Shopping screen and Edit Protocol screen get typography + color adjustments, no structural changes.
8. Edit Supplement Sheet gets field label style + chip block selector + advanced toggle section.
9. Keep all existing Tailwind CSS tokens (`bg-surface`, `text-content-faint`, etc.) — just update font faces.
