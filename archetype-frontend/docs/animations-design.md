# Animazioni Background — Design Doc

## Perché

Le pagine attuali sono statiche. Su un sito "gamer/vibrante" questo si sente.
L'obiettivo è dare vita alla UI senza impattare performance o leggibilità.

**Principi:**
- Animazioni **in background** — non distraggono dal contenuto
- **Leggere** — niente flash, niente movimento aggressivo
- **Gamers** — glow morbidi, particles sottili, gradient shifts lenti
- **Colori della palette** — vivid-royal, golden-glow, tangerine-dream
- **Facilmente modificabili** — tutto in CSS custom properties
- **Facilmente rimovibili** — una class CSS per feature, toggle via `[data-animations]`

## Tecnica

**Approach: Pure CSS + Canvas leggero**

Nessuna libreria animazione. Nessun JS pesante per le animazioni di sfondo.

1. **CSS animations** — gradient shifts, float, glow pulse, subtle parallax
2. **CSS `@property`** — per animazioni fluide di colori (oklch interpolation)
3. **Canvas layer opzionale** — particles solo dove serve davvero (homepage)

## Features

### 1. `gradient-shift` (global, default: ON)
**Cosa:** Lo sfondo anima un gradiente lento che cicla tra brand → accent → brand.
**Dove:** `<body>` sempre attivo.
**Perché:** Dà "vita" senza distrarre. Sta sotto tutto.
**Rollback:** Rimuovere la classe, torna sfondo statico.

```css
body[data-animations="true"]::before {
  content: '';
  position: fixed; inset: 0;
  background: linear-gradient(
    var(--anim-angle, 135deg),
    var(--color-brand) 0%,
    var(--color-accent) 50%,
    var(--color-brand) 100%
  );
  opacity: 0.08;
  animation: gradientShift 20s linear infinite;
  z-index: 0;
  pointer-events: none;
}

@keyframes gradientShift {
  0% { --anim-angle: 135deg; }
  50% { --anim-angle: 225deg; }
  100% { --anim-angle: 315deg; }
}
```

---

### 2. `float-orbs` (homepage, default: OFF)
**Cora:** Cerchi colorati che fluttuano sullo sfondo come sfere luminose sfocate.
**Dove:** Solo homepage / pagine "cercio" (non su game-detail o login).
**Perché:** Effetto "ambiente gaming" — rich, ma sfocato e 5% opacity.
**Rollback:** Toggle `data-float-orbs="true"`.

```css
[data-float-orbs="true"] .orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.05;
  animation: orbDrift 25s ease-in-out infinite;
}

@keyframes orbDrift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.1); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
}
```

---

### 3. `glow-pulse` (brand elements, default: ON)
**Cosa:** I pulsanti brand e i titoli hanno un glow morbido che pulsa.
**Dove:** `.btn-brand`, `h1, h2`, elementi `.glow`.
**Perché:** Attira l'occhio su elementi chiave senza sembrare un pop-up 90s.
**Rollback:** Set `--glow-intensity: 0`.

```css
@property --glow-opacity {
  syntax: '<number>';
  initial-value: 0.3;
  inherits: false;
}

[data-glow="true"] .glow {
  --glow-opacity: 0.3;
  box-shadow: 0 0 calc(20px * var(--glow-intensity, 1))
              oklch(from var(--color-brand) l c h / var(--glow-opacity));
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { --glow-opacity: 0.2; }
  50% { --glow-opacity: 0.5; }
}
```

---

### 4. `card-entrance` (pagine con liste, default: ON)
**Cosa:** Le card entrano con un fade+slide sfalsato (stagger).
**Dove:** Griglie di giochi, wishlist, libreria.
**Perché:** Dà rhythm alla lista senza sembrare caricamento lento.
**Rollback:** Rimuovere classe, tutto statico.

```css
[data-stagger="true"] .card {
  animation: cardEnter 0.4s ease-out both;
}

[data-stagger="true"] .card:nth-child(1) { animation-delay: 0ms; }
[data-stagger="true"] .card:nth-child(2) { animation-delay: 50ms; }
[data-stagger="true"] .card:nth-child(3) { animation-delay: 100ms; }
/* ... continuare fino a N, poi usare nth-child(n+X) per overflow */

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

### 5. `particles-canvas` (homepage hero, default: OFF)
**Cosa:** Canvas layer con particelle luminose che si muovono lentamente.
**Dove:** Solo la hero section della homepage.
**Perché:** Effetto "premium gaming" — vari showreel, streamer, merch.
**Performance:** Canvas con `requestAnimationFrame`, pausa quando tab non visibile.
**Rollback:** Rimuovere il `<canvas>`.

---

## Palette mappa

| Token CSS | Uso animazione | Colore originale |
|-----------|----------------|-------------------|
| `--color-brand` | gradient-shift, glow, orbs | vivid-royal `#141aad` |
| `--color-accent` | gradient-shift, orbs | golden-glow `#ead94c` |
| `--color-brand-glow` | particles, glow pulse | brand-glow cyan |
| `--color-status-wishlist` | accent orbs (opzionale) | magenta |

## File da creare/modificare

```
archetype-frontend/src/
├── styles/
│   ├── animations/          # NEW — un file per feature
│   │   ├── gradient.ts
│   │   ├── orbs.ts
│   │   ├── glow.ts
│   │   ├── entrance.ts
│   │   └── particles.ts     # CSS-only fallback
│   └── animations.css       # Aggregator
├── components/
│   └── AnimationProvider.tsx # NEW — context/toggle
└── styles.css               # MOD — import aggregator
```

## Toggle globale

Un singolo attributo `[data-animations="true"]` su `<html>` controlla tutto.
Default: `true` (tutto attivo, tranne particles e orbs che sono opt-in via data attr locali).

```tsx
// Nel Layout principale
<html data-animations={animationsEnabled} data-float-orbs={orbsEnabled}>
```

**Preferenza utente:**
- Salva in `localStorage` la preferenza dell'utente
- Toggle nascosto nelle Impostazioni utente: "Animazioni background: ON/OFF"
- Rispetta `prefers-reduced-motion: reduce` (imedia query disattiva tutto)

## Browser support

- Chrome/Edge 119%+: pieno supporto (`@property`, oklch)
- Firefox 132+: pieno supporto
- Safari 17+: oklch OK, `@property` OK
- Fallback: se `@property` non supportato, animazioni restano funzionanti con valori statici
