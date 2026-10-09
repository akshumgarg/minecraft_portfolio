# Minecraft Portfolio

A 3D portfolio that looks like a Minecraft world. It is only frontend: no server, no database.

## How to run it
1. Keep all the files in one folder: `index.html`, `style.css`, `data.js`, `main.js`.
2. Double-click `index.html` to open it in your browser (use the internet the first time, because the 3D library, Three.js, loads from the web).
3. Click the screen to start.

## How to change your information
Open **`data.js`** in any text editor (VS Code is fine). Change the words between the quotes, save, then refresh the browser tab.
Everything on the walls, the chests and the windows comes from this one file.

| What you change in data.js | Where you see it |
| --- | --- |
| `name`, `tagline`, `about` | The big painting on the back wall |
| `skills` | The skills sign on the right wall |
| `achievements` | The 4 boards on the left wall |
| `projects` | The chests in the middle of the room |
| `education` | The sign on the front wall, left of the door |
| `contact` | The contact sign on the right wall |

## Controls
- Computer: W A S D to move, mouse to look, Space to jump, Shift to run, click to use, 1-5 to open the info windows, 6-8 to hold a tool (after you take it from the tool chest).
- Phone: arrow buttons, a jump button, a USE button, and drag the screen to look.

## How to put it online (free)
Upload the folder to GitHub Pages, Netlify or Vercel. No build step is needed.

## What each file does
- `index.html`: the page and the small windows (hotbar, messages, buttons).
- `style.css`: how those windows look.
- `data.js`: your information.
- `main.js`: the 3D world (terrain, house, tools, controls).
