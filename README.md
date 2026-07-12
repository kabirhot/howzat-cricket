# HOWZAT Cricket Tournament 🏏

A real-time **6-over cricket tournament scorer** built with React 19, Vite, and Tailwind CSS. Perfect for tracking live matches on mobile devices.

## Features ✨

- **Live Match Scoring**: Real-time ball-by-ball scoring with an intuitive console
- **Free Hit Mechanic**: No-ball rules enforce automatic free hits on next delivery
- **Smart Strike Rotation**: Handles odd runs from regular deliveries, no-balls, and byes correctly
- **Undo Functionality**: Pop the last ball instantly if there's a mis-tap
- **Match Persistence**: Auto-saves in-progress matches to localStorage; resume on refresh
- **NRR Calculations**: Real net run rate formulas (not dummy values)
- **Comprehensive Scorecards**: Full batting & bowling stats tracked per player
- **Tournament Standings**: Auto-updated points table sorted by points & NRR
- **Accessibility**: ARIA labels, linked form inputs, semantic HTML

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tournament Rules

### Howzat T6 Format
1. **Match Duration**: Exactly 6 overs (36 legal deliveries) per innings
2. **Max Bowler Overs**: 2 overs per bowler (enforced when implementing multi-over tracking)
3. **Powerplay**: First 2 overs—max 2 fielders outside the circle
4. **Extras**: 
   - Wide or no-ball = 1 run to batting team + re-bowled
   - No-ball = followed by automatic free hit on next delivery
5. **Dismissals**: 6 wickets = innings end (not 10)
6. **Chase**: 2nd innings team must exceed 1st innings score within 6 overs

## Build & Lint

```bash
npm run build    # Production build
npm run lint     # Oxlint checks
npm run lint:fix # Auto-fix linting issues
```

## Key Fixes & Improvements

### Bugs Fixed
✅ Byes now rotate strike correctly (odd runs trigger swap)  
✅ No-ball boundaries supported (4 & 6 off a no-ball)  
✅ Strike rotation properly handles all delivery types  

### Features Added
✅ **Undo Last Ball**: Ball history snapshots—pop the last delivery instantly  
✅ **localStorage Autosave**: In-progress matches persist across browser refresh  
✅ **Resume on Load**: Prompts to resume if a match in-progress is detected  
✅ **Real NRR**: Calculated from runs/balls, not hardcoded ±0.5  
✅ **Toast Notifications**: Replaces native alerts; integrates with UI theme  
✅ **Accessibility**: Form labels linked to inputs, semantic HTML, ARIA hints  

### Code Quality
✅ Fixed undefined `animate-fade-in` in Tailwind v4 (added to index.css)  
✅ Removed unused imports (`Clock` from lucide-react)  
✅ Refactored celebration modal to use custom toast system  
✅ `index.css` cleanup (removed empty App.css reference)  

## File Structure

```
src/
├── App.jsx          # Main component + scoring engine
├── mockData.js      # Teams, schedule, rules data
├── index.css        # Tailwind v4 + custom animations
└── main.jsx         # Entry point
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Roadmap

- Multi-overs per bowler tracking & validation
- Player stats export (CSV)
- Dark/light mode toggle
- Multiplayer real-time sync (Firebase)
- Lineup field editing (playing 11)

## Built With

- **React 19** – UI framework
- **Vite** – Build tool (fast HMR)
- **Tailwind CSS v4** – Styling
- **Lucide Icons** – SVG icons
- **Oxlint** – Fast linting

---

**Made for Howzat Cricket Tournament 2026** 🏆  
*Fast cricket, high stakes, live scoreboard.*
