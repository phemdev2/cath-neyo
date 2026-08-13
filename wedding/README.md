# Catherine & Niyi — Wedding Save the Date

A Next.js version of the save-the-date site (home, RSVP registration, guest list, contact).

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

- `app/layout.js` — page metadata and Google Fonts
- `app/page.js` — the entire site (nav, hero/countdown, RSVP form, guest list, contact) as one client component
- `app/globals.css` — Tailwind + the custom theme (colors, cards, buttons, form styles)
- `public/couple.jpg` — hero photo

## Notes

- The guest list and RSVP form are in-memory only (no database yet). Wiring the RSVP form up to save real replies — e.g. to a spreadsheet, Airtable, or a small database — is a natural next step whenever you're ready.
- Deploys as-is to Vercel, or `npm run build && npm run start` anywhere that runs Node.
