# Asian Outlook

Website for Asian Outlook, built with Vite and deployed as a static
site on Netlify.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build outputs to `dist/`, which Netlify publishes using
`netlify.toml`.

## Environment Variables

Create these variables locally and in Netlify:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Accessibility

The app includes semantic landmarks, a skip link, visible focus states,
form labels, status/error regions, current-page navigation state, and
keyboard-accessible controls.
