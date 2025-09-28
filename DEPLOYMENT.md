# Deployment Guide

This repository contains both backend (`chat-app-backend`) and frontend (`chat-app-frontend`). The frontend is a Vite + React 19 static app; the backend is an Express + Socket.IO API.

## Frontend Build

- Directory: `chat-app-frontend`
- Build command: `npm run build`
- Output (publish) directory: `chat-app-frontend/dist`

## Required Environment Variables (Frontend)

These are optional because the code has fallbacks, but recommended in production:

- `VITE_API_URL=https://server.buzztalk.me`
- `VITE_SOCKET_URL=https://server.buzztalk.me`

## Netlify

Already provisioned `netlify.toml` at repo root.
Key redirects:

- `/api/*` and `/socket.io/*` proxied to backend.
- SPA fallback `/* -> /index.html`.

Steps:

1. Create a new Netlify site importing this repo.
2. Build settings:
   - Base directory: (leave blank) — Netlify reads `netlify.toml` automatically.
   - Or override manually: Base: `chat-app-frontend`, Build: `npm run build`, Publish: `chat-app-frontend/dist`.
3. Add (optional) environment variables in Site Settings.
4. Deploy.

## Vercel

`vercel.json` provided. Ensure project root is detected properly.

If Vercel UI ignores `rootDirectory`, set it manually to `chat-app-frontend` and set:

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Framework: Vite

Add environment variables under Project Settings → Environment Variables.

## Local Preview

```
cd chat-app-frontend
npm install
npm run build
npm run preview
```

Preview server runs on a local port (default 4173); network requests go to configured `VITE_API_URL`.

## Backend Deployment Notes

- Ensure CORS env vars (`CLIENT_URL`, etc.) include the final deployed frontend origin(s).
- Make sure `JWT_SECRET` and `MONGO_URI` are set.
- If using a reverse proxy for websockets, confirm it supports WebSocket upgrade headers.

## Common Issues

| Symptom                            | Cause                                               | Fix                                                                       |
| ---------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Frontend 404 on deep link          | Missing SPA fallback                                | Ensure `_redirects` (Netlify) or rewrite rule (Vercel) deployed           |
| Socket 400 on production only      | Origin not whitelisted / missing token in handshake | Add origin to backend CORS allowlist; verify `auth.token` sent            |
| API calls return 401 after deploy  | Backend not seeing Authorization header             | Confirm proxy preserves headers and HTTPS endpoint matches `VITE_API_URL` |
| Build fails on host, works locally | Old Node version                                    | Pin Node >= 18 (consider 20)                                              |

## Recommended Enhancements

- Add CI (GitHub Actions) to run `npm ci && npm run build` for both backend and frontend.
- Add health check endpoint monitoring.
- Add environment banner (Dev/Prod) in UI via `VITE_APP_ENV` variable.

---

Updated on: $(date)
