# Colorblind Mode — Implementation

## Overview

Colorblind mode replaces the default color palette with CVD-safe alternatives using pure CSS custom properties. No JavaScript color manipulation, no canvas rewriting — one attribute swap on `<html>` re-skins the entire app.

## How It Works

### Architecture

```
localStorage["colorblind"]  →  ColorblindProvider  →  document.documentElement.setAttribute("data-colorblind", mode")
                                     ↓
                              CSS [data-colorblind="*"] selectors override CSS variables
                                     ↓
                              All components use var(--status-*) → get new colors automatically
```

### Three Types of Color Vision Deficiency

| Mode | Condition | Colors Affected | Strategy |
|------|-----------|----------------|----------|
| `protanopia` | No red cones | Red-green | Shift reds toward orange, increase blue-yellow contrast |
| `deuteranopia` | No green cones | Red-green (most common) | Shift greens toward blue, increase luminance contrast |
| `tritanopia` | No blue cones | Blue-yellow | Shift blues toward cyan, reds toward orange |

Color palette based on **Wong (2011), Nature Methods** — colorblind-safe for all three types.

## Files Changed

| File | Change |
|------|--------|
| `src/styles.css` | Added `[data-colorblind="*"]` blocks with overridden CSS variables |
| `src/contexts/ColorblindContext.tsx` | New — React context + localStorage persistence |
| `src/components/ColorblindToggle.tsx` | New — dropdown selector in header |
| `src/routes/__root.tsx` | Wrap app with `<ColorblindProvider>` |
| `src/components/AppLayout.tsx` | Add `<ColorblindToggle />` to header |

## Implementation Details

### 1. CSS Variables Override

All app colors use CSS custom properties. Colorblind mode overrides them:

```css
[data-colorblind="protanopia"] {
  --status-playing: oklch(0.60 0.14 170);    /* was green → teal */
  --status-finished: oklch(0.55 0.16 280);   /* was blue → violet */
  --status-abandoned: oklch(0.60 0.18 55);    /* was red → orange */
  --status-wishlist: oklch(0.65 0.10 320);   /* was magenta → muted purple */
  --destructive: oklch(0.55 0.18 40);         /* was red → brown-orange */
}
```

### 2. Non-Color Differentiation

Status badges get additional visual cues beyond color:

```css
[data-colorblind] .status-badge {
  border-width: 2px;  /* thicker border for visibility */
}

[data-colorblind] .status-badge::before {
  content: "";
  width: 6px; height: 6px;
  border-radius: 50%;  /* colored dot as secondary indicator */
  margin-right: 6px;
}
```

### 3. Persistence

```tsx
// Reads from localStorage on mount
const [mode, setMode] = useState(
  () => localStorage.getItem("colorblind") || "off"
);

// Writes to localStorage + sets DOM attribute
useEffect(() => {
  document.documentElement.setAttribute("data-colorblind", mode);
  localStorage.setItem("colorblind", mode);
}, [mode]);
```

### 4. Toggle UI

Simple `<select>` in the header nav:
- Normal | Protanopia | Deuteranopia | Tritanopia

No modal, no settings page — one click to switch.

## Why This Approach (Ponytail)

| Alternative | Why Not |
|-------------|---------|
| Separate CSS bundle | Doubles CSS size, doesn't cascade |
| JS color manipulation at runtime | Expensive, flashes on page load |
| CSS `filter: hue-rotate()` | Imprecise, doesn't actually help CVD users |
| `data-attribute` + CSS variables ✅ | Zero JS cost, instant switch, persists, works without JS |

## Browser Support

CSS custom properties work in all modern browsers (IE11 excluded — not supported by React/Tailwind anyway).

## Testing Checklist

- [ ] Toggle each mode — all status colors change visibly
- [ ] Refresh page — mode persists
- [ ] Status badges show colored dots in colorblind modes
- [ ] Charts (Recharts) respect colorblind colors via CSS
- [ ] No color-only information (icons/text always present alongside colors)


---
*Last project status update: 2026-07-03*