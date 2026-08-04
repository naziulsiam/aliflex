# AliFlex

A full-screen live-stream player built with Next.js. AliFlex supports HLS playback, channel switching, responsive controls, loading states, and a server-side proxy route for compatible streams.

## Features

- HLS playback through hls.js
- Multiple selectable channels
- Play, pause, mute, volume, and fullscreen controls
- Auto-hiding player controls
- Live connection and error states
- Responsive layout

## Tech stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- hls.js
- Framer Motion
- Zustand

## Run locally

```bash
git clone https://github.com/naziulsiam/aliflex.git
cd aliflex
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Streaming notes

Stream availability is controlled by third-party sources and may change without notice. Browsers may block insecure HTTP streams on HTTPS pages. Only use content you own or have permission to view and redistribute.
