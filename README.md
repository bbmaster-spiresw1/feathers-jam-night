# The Feathers Inn - Jam Night Manager

Mobile-first rebuild of the Jam Night Manager for Tuesday nights at The Feathers Inn.

## What is in place

- Mobile calendar for Tuesday jam nights
- Event detail view with house band lineup
- Guest running order with up/down controls
- Per-guest song editor with up/down song ordering
- Band, guests, history, and settings screens
- Convex schema for members, guests, events, lineups, songs, and settings
- Convex mutations drafted for moving guests and songs

## Local development

```bash
npm install --cache ./.npm-cache
npm run dev
```

Open `http://localhost:5173/`.

## Convex setup

When ready to connect the real database:

```bash
npx convex dev
```

Convex will generate `convex/_generated`, create the project, and provide the deployment URL for `.env.local`.

The current frontend uses sample data so the UI can be refined before the live database is connected.

## Vercel hosting

The app is Vercel-ready. Once Convex is connected, add the Convex environment variable in Vercel and deploy.

The intended hosted shape is:

- Vercel: frontend web app
- Convex: realtime database and server functions
- Future auth: member/admin access for adding songs, publishing events, and managing data

## Product improvements planned

- Reorder songs inside each guest booking before PDF export
- Drag-and-drop ordering for phones, with arrow buttons as a reliable fallback
- Song library with search, previous keys, and artist history
- Guest request flow so performers can submit songs without editing the final running order
- Admin approval and publish workflow
- PDF preview before download
- History reports: most played songs, frequent guests, key usage, repeat artists
- Mobile check-in mode for the night itself
