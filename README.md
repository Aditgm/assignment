# 🗓️ Wall Calendar — Interactive Date Planner

An award-winning, interactive wall calendar component built with **Next.js 15**, **GSAP**, and **CSS Modules**. Features day range selection, integrated notes, theme switching, and premium animations.

![Wall Calendar Preview](/images/months/april.png)

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Wall Calendar Aesthetic** | Spiral binding, hero image with SVG wave overlay, Playfair Display typography |
| **Day Range Selection** | Click start → click end → visual gradient fill with date count |
| **Integrated Notes** | Per-month notes with lined-paper effect, localStorage persistence |
| **GSAP Animations** | Page-flip on month change, staggered day entrance, hero parallax on mouse move, floating idle motion |
| **Dark/Light Theme** | Toggle with smooth CSS variable transitions, preference saved |
| **Holiday Markers** | Emoji badges with hover tooltips for major holidays |
| **Fully Responsive** | Desktop (side-by-side), Mobile (stacked + notes toggle FAB) |
| **Keyboard Navigation** | Arrow keys for month switching |

## 🛠 Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **GSAP 3** — GPU-accelerated animations
- **CSS Modules** — Zero-runtime scoped styling
- **date-fns** — Lightweight date math
- **Lucide React** — Icons
- **localStorage** — Client-side persistence

## 🚀 Getting Started

```bash
# Clone the repository
git clone <your-repo-url>
cd wall-calendar

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Design tokens, themes, typography
│   ├── layout.tsx           # Root layout with Google Fonts
│   └── page.tsx             # Entry point
├── components/Calendar/
│   └── WallCalendar.tsx     # Main component (all features)
├── data/
│   ├── holidays.ts          # Holiday data with emoji markers
│   └── monthThemes.ts       # Per-month accent colors & imagery
├── styles/
│   └── calendar.module.css  # All calendar styles (500+ lines)
└── utils/
    ├── calendarUtils.ts     # Date grid, range logic
    └── storage.ts           # localStorage wrapper
```

## 🎨 Design Decisions

- **Single-component architecture**: `WallCalendar.tsx` keeps all state collocated for simplicity and easy portability
- **CSS Modules** over Tailwind/CSS-in-JS: zero runtime cost, full CSS power, scoped by default
- **GSAP** over Framer Motion: 10x faster for complex animation timelines, industry standard for Awwwards-level sites
- **Dynamic import** with `ssr: false`: avoids hydration mismatches with GSAP/window-dependent code
- **SVG wave overlay**: replicates the reference image's curved blue accent using pure SVG `<path>` elements

## 📱 Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop** (>1024px) | Notes sidebar + calendar grid side-by-side |
| **Tablet** (768–1024px) | Same layout, adjusted spacing |
| **Mobile** (<768px) | Stacked: hero → grid → nav, notes behind toggle FAB |

## 🏗 Build

```bash
npm run build
```

## 📄 License

MIT
