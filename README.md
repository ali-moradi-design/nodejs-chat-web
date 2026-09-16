# nodejs-chat-web

Grok-like realtime chat UI — **Vite + React 19 + TypeScript + Feature-Sliced Design + Tailwind CSS v4**.

Companion backend: [nodejs-chat-socket](https://github.com/ali-moradi-design/nodejs-chat-socket).

## Features

- Dark-first chat layout (near-black / charcoal), optional light toggle
- Sidebar rooms + presence counts (collapsible on mobile)
- Message thread with own/other bubbles, initials avatars, timestamps
- Composer: Enter send / Shift+Enter newline; draft preserved across re-renders
- Typing indicator, connection status pill
- Smooth scroll + “new messages” jump chip
- Display-name gate (localStorage guest session)
- Optimistic send + ACK reconcile / fail rollback
- Dedupe by `clientMsgId` / server id; history resync on reconnect (`afterId`)

## Architecture (FSD)

```
src/app/        providers, styles, App shell
src/pages/      chat page composition
src/widgets/    chat-sidebar, chat-thread, chat-composer
src/features/   send-message, join-room, typing, presence, auth-display-name
src/entities/   message, room, user
src/shared/     ui, lib/socket, lib/chat, config, api
```

Public APIs via `index.ts` barrels. Run `pnpm check:fsd` (or `npm run check:fsd`).

## Run with backend

```bash
# terminal 1 — backend
cd ../nodejs-chat-socket
cp .env.example .env
npm install && npm run dev

# terminal 2 — frontend
cd ../nodejs-chat-web
cp .env.example .env
pnpm install   # or npm install
pnpm dev       # http://localhost:5173
```

Set `VITE_SOCKET_URL` to the backend origin (default `http://localhost:3001`).

```bash
pnpm build
pnpm typecheck
pnpm check:fsd
```

## Security notes

- Guest display names are not verified — treat as untrusted labels.
- Messages are plain text; React escapes rendering. Do not `dangerouslySetInnerHTML`.
- Point `VITE_SOCKET_URL` only at trusted backends; CORS is enforced server-side.

## License

MIT
