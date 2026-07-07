# Haidar Esber — Interactive 3D Portfolio

Personal portfolio built as an **interactive 3D room** rendered with WebGL. Visitors
"enter the room" and click objects (laptop, monitors, whiteboard, certificates, contact)
to open info panels covering about, projects, research, and certifications. Includes a
bilingual **FR/EN** interface, smooth-scroll panels, a custom cursor, ambient audio, and a
hidden "Haidar · Invaders" arcade mini-game.

## Tech Stack

- **JavaScript (ES modules)**
- **Vite 5** — dev server and build tooling
- **Three.js** (`three`) — WebGL 3D scene / room
- **GSAP** — animation
- **Lenis** — smooth scrolling
- **split-type** — text splitting for animated typography
- HTML5 `<canvas>`, CSS (`src/style.css`), Google Fonts (Space Grotesk, Inter, JetBrains Mono)

## Features

- Interactive 3D room scene with clickable objects and hover tooltips (`src/experience/`)
- Loading screen with progress bar and an "Enter the room" gate
- Bilingual FR/EN switching via a lightweight i18n module (`src/modules/i18n.js`)
- Info panels for About, Projects, Research, Certifications, Contact (`src/modules/panels.js`, `src/data/content.js`)
- Custom animated cursor and mobile navigation dock
- Ambient sound toggle (`src/modules/audio.js`)
- Playable arcade mini-game overlay (`src/experience/arcadeGame.js`)

## Project Structure

```
portfolio/
├── index.html                 # App shell: canvas, loader, HUD, panels, arcade
├── vite.config.js             # base './', dev port 5173, build → dist/
├── package.json
├── public/images/             # Portfolio/project images (served as-is)
├── src/
│   ├── main.js                # Boot: cursor, i18n, experience, arcade
│   ├── style.css
│   ├── data/content.js        # FR/EN content for panels & sections
│   ├── experience/            # Experience.js, Room.js, screenDraws.js, arcadeGame.js
│   └── modules/               # i18n.js, panels.js, ui.js, audio.js
└── legacy/                    # Older version (not part of the Vite build)
```

## Getting Started

Requires Node.js and npm.

```bash
npm install       # install dependencies

npm run dev       # start Vite dev server (opens http://localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## Notes

- Content and metadata are primarily in **French** (`<html lang="fr">`), with an EN toggle.
- A `legacy/` folder holds a previous iteration and is not wired into the current Vite entry (`src/main.js`).
- No `LICENSE` file is present.
