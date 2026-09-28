# SMAC Portal — Local Setup & Verification

This is a Vite + React + Tailwind + Recharts project. The JSX has already been
syntax-checked here (it compiles cleanly), but the full build/run needs to
happen on a machine with internet access, since this sandbox can't reach npm.

## Requirements
- Node.js 18+ (check with `node -v`)
- npm (comes with Node)

## Steps

1. Unzip the project and open a terminal in the folder:
   ```
   cd smac-portal
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the dev server:
   ```
   npm run dev
   ```

4. Open the URL it prints (usually `http://localhost:5173`) in your browser.

## What "working" looks like
- You land on the login screen (blue gradient, SMAC logo, Parent/Admin toggle).
- Type anything into both fields and click "Sign in" — you should land on
  the dashboard with the profile card, stat cards, and a marks table.
- Click between the "Overview", "Grace Marks", and "Remarks"/"Admin Panel"
  tabs at the top — charts should render, admin maxima fields should be
  editable.
- Click the moon/sun icon top-right to confirm dark mode toggles correctly.
- Resize the browser narrow (or open dev tools device toolbar) to confirm
  mobile responsiveness.

## If something breaks
- `npm install` errors about Node version → update Node to 18+.
- Blank white screen → open browser dev tools console, the error there will
  point to the exact line; paste it back to me and I'll fix it.
- Charts not rendering → usually means `recharts` didn't install correctly;
  re-run `npm install`.

## Next steps (not yet wired up)
- Firebase Authentication / Firestore (currently mock login + mock data)
- Live Google Sheets sync
- PDF export / print stylesheet
- PWA manifest + service worker
