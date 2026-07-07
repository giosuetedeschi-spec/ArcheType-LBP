# Language Switch (i18n) — Implementation

## Overview

Three-language support (English, Italian, French) using JSON translation files and a React context. No external i18n library — ~50 lines of logic, instant switching, localStorage persistence.

## How It Works

### Architecture

```
localStorage["lang"]  →  I18nProvider  →  provides { lang, setLang, t }
                                     ↓
                              t("home.whatToPlay")  →  "What to Play?" / "Cosa giocare?" / "À quoi jouer ?"
                                     ↓
                              Components use { t } from useI18n()
```

### Translation Resolution

1. Look up key in current language JSON
2. If missing, fall back to English
3. If key not found, return key name (dev debug)
4. Variable interpolation: `t("home.abandonedCount", { count: 5 })` → "You have 5 abandoned games."

## Files Changed

| File | Change |
|------|--------|
| `src/i18n/locales/en.json` | New — English translations |
| `src/i18n/locales/it.json` | New — Italian translations |
| `src/i18n/locales/fr.json` | New — French translations |
| `src/i18n/I18nContext.tsx` | New — Provider + `useI18n()` hook + `t()` function |
| `src/components/LanguageToggle.tsx` | New — EN/IT/FR dropdown in header |
| `src/routes/__root.tsx` | Wrap app with `<I18nProvider>` |
| `src/components/AppLayout.tsx` | Add `<LanguageToggle />` to header |
| `src/routes/index.tsx` | Use `t()` for all visible text |

## Translation Structure

Nested JSON with dot-notation keys:

```json
{
  "home": {
    "whatToPlay": "What to play?",
    "exploreCatalog": "Explore Catalog"
  },
  "game": {
    "status": {
      "playing": "Playing",
      "finished": "Finished"
    }
  }
}
```

Usage: `t("home.whatToPlay")` → `"What to play?"`

### Variable Interpolation

```json
"abandonedCount": "You have {count} abandoned games."
```

```tsx
t("home.abandonedCount", { count: 5 })
// → "You have 5 abandoned games."
```

## Supported Languages

| Code | Language | Notes |
|------|----------|-------|
| `en` | English | Default/fallback |
| `it` | Italian | Primary user language |
| `fr` | French | Secondary |

## Adding a New Language

1. Create `src/i18n/locales/{code}.json` with same structure as `en.json`
2. Add to `messages` object in `I18nContext.tsx`:
   ```ts
   import es from "./locales/es.json";
   const messages = { en, it, fr, es } as const;
   ```
3. Add option to `LanguageToggle.tsx`:
   ```ts
   { value: "es", label: "ES" }
   ```

## Why This Approach (Ponytail)

| Alternative | Why Not |
|-------------|---------|
| `react-i18next` + `i18next` | 2 packages, 50+ lines config, overkill for 3 languages |
| `next-intl` | Next.js only, not applicable |
| AI runtime translation | Latency, cost, inconsistency |
| JSON + Context ✅ | ~50 lines, zero deps, instant switch, type-safe |

## Browser Language Detection

Not implemented (YAGNI). If needed:

```tsx
const browserLang = navigator.language.slice(0, 2) as Lang;
const [lang, setLang] = useState<Lang>(
  () => (localStorage.getItem("lang") as Lang) || browserLang || "en"
);
```

Add when: user feedback requests auto-detection.

## Testing Checklist

- [ ] Switch EN → IT → FR — all text changes
- [ ] Refresh page — language persists
- [ ] Missing key falls back to English
- [ ] Variable interpolation works (`{count}`, `{price}`)
- [ ] HTML `lang` attribute updates on switch
- [ ] No layout overflow from longer translations (French is ~20% longer)


---
*Last project status update: 2026-07-03*