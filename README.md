# Red King

A multiplayer online memory card game built with React, Node.js, and Socket.IO.

Play it here: https://sama-shah.github.io/red-king/?p=%2Fred-king%2Flobby

## How to Play

Red King is a memory card game for 2–8 players. Each player is dealt 4 face-down cards in a 2×2 grid. The goal is to have the **lowest total score** when the round ends.

### Setup
- Each player peeks at 2 of their 4 cards at the start
- One card is flipped to start the discard pile

### Card Values
| Card | Value |
|------|-------|
| Red King (♥K / ♦K) | **-1** |
| Ace | 1 |
| 2–10 | Face value |
| Jack | 10 |
| Queen | 10 |
| Black King (♠K / ♣K) | 13 |

### On Your Turn
Choose one action:
- **Draw** from the draw pile, then swap it into your grid, discard it, or use its power
- **Take** the top discard card and swap it with one of your grid cards
- **Tap Self** — claim one of your cards matches the top discard (by rank). Correct = discard it and draw a replacement. Wrong = draw a penalty card
- **Tap Other** — claim another player's card matches the top discard. Correct = discard their card, give them one of yours, draw a replacement. Wrong = penalty
- **Call** — end the round. All other players get one final turn, then everyone reveals and scores

### Power Cards (only when drawn from the draw pile)
| Card | Power |
|------|-------|
| 7 | Peek at one of your own cards |
| 8 | Peek at another player's card |
| 9 | Swap one of your cards with another player's card |
| 10 | Look at any 2 cards |
| Jack | Blind swap any 2 cards on the table |
| Queen | Permanently reveal one of your own cards |
| Black King | Look at any 2 cards, then swap any 2 cards |

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + Socket.IO
- **Shared:** TypeScript types and game constants (npm workspaces monorepo)

## Project Structure

```
red-king/
├── shared/     # Shared types, events, constants
├── server/     # Game server (Express + Socket.IO)
├── client/     # React frontend
└── .github/    # GitHub Actions deploy workflow
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### Install & Run

```bash
npm install
npm run dev
```

This starts both the server (port 3001) and client (port 5173). Open http://localhost:5173 in multiple browser tabs to test multiplayer.

### Build

```bash
npm run build
```

## Deployment

The client auto-deploys to GitHub Pages via GitHub Actions on push to `main`.

The game server requires a WebSocket-capable host (Render, Railway, Fly.io, etc.). After deploying the server, set the `VITE_SERVER_URL` environment variable to your server URL before building the client.

## License

MIT
