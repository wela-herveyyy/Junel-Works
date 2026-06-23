# Playful Neo-Brutalism — Design System

Junel uses a **Playful Neo-Brutalism** design language: loud, joyful, tactile UI with comic-book clarity. Every interactive surface reads as physical—thick strokes, hard shadows, and oversized touch targets.

---

## Brand & Personality

The aesthetic targets users who need **high-energy engagement** and **obvious affordances**. We combine neo-brutalist structure (heavy borders, drop-block shadows) with a primary-school palette (sunny yellow, bright blue, lime green). There are no glossy gradients, blurs, or soft ambient shadows—depth is structural only.

**Emotional goal:** confidence and fun. The UI should feel like a sticker book you can press, not a fragile glass panel.

---

## Color Palette

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Background | `background` | `#fff9e6` | Page canvas (cream) |
| On background | `on-background` | `#1d1c10` | Body text |
| Primary | `primary` | `#686000` | Primary text on yellow |
| Primary container | `primary-container` | `#ffec00` | **Sunny Yellow** — primary actions, highlights |
| Secondary container | `secondary-container` | `#0266ff` | **Bright Blue** — secondary actions, links |
| Tertiary container | `tertiary-container` | `#b8fd4b` | **Lime Green** — success, growth |
| Error | `error` | `#ba1a1a` | Errors |
| Stroke | `nb-stroke` (CSS) | `#000000` | Universal 4px borders & shadows |

### Functional mapping

- **Sunny Yellow** (`primary-container`) — primary buttons, key highlights, code accents
- **Bright Blue** (`secondary`, `secondary-container`) — links, secondary CTAs, focus rings
- **Lime Green** (`tertiary-container`) — success states
- **Punchy Orange** — reserved for warnings/high-priority alerts (add when needed)

Surfaces stack from `surface-container-lowest` (white cards) through `surface-container-highest` (muted cream) for hierarchy without opacity tricks.

---

## Typography

**Font:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) — friendly geometry, rounded terminals.

| Style | Size | Weight | Line height | Use |
|-------|------|--------|-------------|-----|
| Headline XL | 48px | 800 | 1.1 | Hero titles |
| Headline LG | 36px | 800 | 1.2 | Section titles |
| Headline MD | 28px | 700 | 1.3 | Card headings |
| Body LG | 20px | 500 | 1.5 | Lead copy |
| Body MD | 18px | 500 | 1.5 | **Minimum body size** |
| Label Bold | 16px | 700 | 1.2 | Buttons, nav, labels |

Headlines use ExtraBold (800) to match chunky borders. Body text stays **≥ 18px** for readability. Labels use slightly increased letter-spacing.

Utility classes: `font-headline-md`, `font-body-md`, `font-label-bold`, etc. (see `app/globals.css`).

---

## Spacing & Layout

Base unit: **8px**.

| Token | Value |
|-------|-------|
| `xs` | 8px |
| `sm` | 16px |
| `md` | 32px |
| `lg` | 48px |
| `xl` | 80px |
| `gutter` | 24px |
| `margin` | 32px |

- **Desktop:** 12-column mental grid; wide gutters so 4px borders don’t collide
- **Mobile:** 4-column grid; bottom nav height 72px+
- Touch targets: **minimum 48px** (buttons), **64px** (inputs)

> **Tailwind caveat:** Custom `@theme` spacing overrides Tailwind’s default `max-w-md`, `max-w-sm`, etc. Use explicit widths like `max-w-[28rem]` and `max-w-[48rem]`.

---

## Elevation & Depth

No blur or gradient elevation. Use **hard black shadows** only:

| Size | Offset | Use |
|------|--------|-----|
| Small | `4px 4px 0 #000` | Chips, small controls (`.nb-shadow-sm`) |
| Medium | `8px 8px 0 #000` | Buttons, inputs (`.nb-shadow-md`) |
| Large | `12px 12px 0 #000` | Cards (`.nb-shadow-lg` / `.nb-card`) |

**Press interaction:** On `:active`, shadow goes to `0 0 0` and the element translates by the shadow offset (`.nb-press-sm` / `.nb-press-md`) to simulate a physical button press.

**Focus:** Inputs may use a blue hard shadow (`.nb-shadow-focus-blue`) instead of black.

---

## Shapes & Borders

- **Border:** 4px solid black on all interactive/containing elements (`.nb-border`)
- **Radius:** `rounded-lg` (1rem) for cards/inputs; `rounded-xl` (1.5rem) for chips/pills
- **Decorative:** circles, stars, squiggles (6px stroke) — background only, often without shadow

---

## Components

### Buttons

- 4px black border, bold centered label
- Primary: `primary-container` background + 8px shadow
- Secondary: `secondary-container` background
- Press: translate + shadow collapse (built into `Button` variants)

### Cards (`.nb-card`)

- White (`surface-container-lowest`) background
- 4px border + 12px hard shadow
- Headlines: Headline MD or LG

### Inputs (`.nb-input`)

- White background, 4px black border
- Min height **64px**
- Focus: blue hard shadow

### Chips (`.nb-chip`)

- Pill shape (`rounded-xl`), 4px border, 4px shadow
- Sticker/reward labels

### Checkboxes & Radios

- Min **32×32px** touch area
- 4px border; checked state fills with vibrant color + bold mark

### Chat bubbles

- User: cream surface + black border + small shadow
- Assistant: white card styling, avatar with yellow accent

---

## CSS Utilities (globals.css)

| Class | Purpose |
|-------|---------|
| `.nb-border` | 4px black stroke |
| `.nb-shadow-sm` / `-md` / `-lg` | Hard drop-block shadows |
| `.nb-press-sm` / `-md` | Active press animation |
| `.nb-card` | Card shell |
| `.nb-input` | Form fields |
| `.nb-chip` | Pill tags |

---

## Implementation Files

- **Tokens & utilities:** `app/globals.css`
- **Font loading:** `app/layout.tsx` (Plus Jakarta Sans 500/700/800)
- **Button primitive:** `components/ui/button.tsx`

When adding new UI, prefer existing tokens and `.nb-*` classes over one-off styles. Keep contrast ratios WCAG-friendly on cream backgrounds.
