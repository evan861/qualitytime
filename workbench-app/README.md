# Workbench — Session Starter

Personal OS front end for a philosopher-builder. Express backend (port 3001)
streams Anthropic completions over SSE to a Vite + React frontend (port 5173).
Sessions persist to a local JSON file.

## Setup

```bash
cd workbench-app
cp .env.example .env       # then add ANTHROPIC_API_KEY
npm install
npm run dev
```

Visit http://localhost:5173.

## Layout

```
workbench-app/
  .env                     # ANTHROPIC_API_KEY, ANTHROPIC_MODEL, PORT
  package.json             # workspace root + `npm run dev`
  server/
    index.js               # Express, port 3001
    chat.js                # POST /api/chat — SSE relay to Anthropic
    sessions.js            # JSON persistence (swap for Notion/Fireflies later)
    systemPrompt.js        # session-start companion prompt
    data/store.json        # local session log
  client/
    vite.config.js         # /api proxied to :3001
    src/SessionStarter.jsx # primary view (migrated from v2 HTML)
    src/useChatStream.js   # SSE consumer hook
```

## Endpoints

- `POST /api/chat` — body `{ intent, activePursuits, edgeHint }`, returns SSE
  stream of Anthropic events. Saves a session record on completion.
- `GET  /api/sessions` — list saved sessions (most recent first).
- `GET  /api/health` — sanity check.

## Persistence adapter

`server/sessions.js` is the only place that touches storage. To swap to
Notion / Fireflies, replace the read / write functions there — the
`saveSession` / `listSessions` / `getSession` interface stays the same.
