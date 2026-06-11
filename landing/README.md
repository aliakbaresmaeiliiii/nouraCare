# DoreHealth Landing Page

Marketing landing page for **DoreHealth** (دوره), inspired by [Karafs Health](https://karafshealth.com/) and styled with the app's brand palette.

Built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**.

## Getting started

```bash
cd landing
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build for production

```bash
npm run build
npm start
```

## Structure

- `src/app/` — App Router pages and layout
- `src/components/` — Header, Hero, feature carousel, footer
- `src/lib/brand.ts` — Brand name, colors (aligned with `client/src/theme/variables.scss`)
- `src/app/logo.png` — App logo (header, footer, phone mockup, favicon, Open Graph)

## Customization

- Update store download URLs in `src/components/DownloadButtons.tsx`
- Edit copy in `src/lib/brand.ts` and `src/lib/content.ts`
