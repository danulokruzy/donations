# Quick Start

Project root:
- `C:\Users\tgkru\Documents\New project`

App path:
- `C:\Users\tgkru\Documents\New project\app`

## Launcher
Run:
- `launcher.cmd`

Menu options:
1. Setup dependencies + Prisma + SQLite seed
2. Run public donation page
3. Run dashboard

## Direct Commands
From `app`:
- `npm install`
- `npm run db:generate`
- `npm run db:push`
- `npm run db:seed`
- `npm run dev:site`
- `npm run build`

## Dashboard Access
Open:
- [dashboard login](/C:/Users/tgkru/Documents/New%20project/app/src/app/dashboard/login/page.tsx)

Default password from `.env`:
- `donatelko`

## Main Pages
- Public donate form: `/`
- Check waiting page: `/check/{id}`
- Dashboard setup: `/dashboard/setup`
- Widgets overlay: `/widget/{slug}`

## Payment Types (V1)
- `UAH` (Monobank jar link)
- `CryptoBOT` (USDT link flow)
- `TonPay` (TON link flow)
