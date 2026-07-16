# DailySales — Backend

REST API for a shop management system built for small Indian retail owners. Handles shift-based daily sales tracking, inventory, and profit calculation across multiple workers.

## Tech Stack

Node.js · Express · TypeScript · MongoDB · JWT · Google OAuth

## What it does

- **Auth** — Google OAuth + phone/password login, role-based access (owner vs worker)
- **Shift lifecycle** — start shift, add stock mid-shift, close shift with automatic calculation
- **Calculation engine** — `opening stock + stock added − closing stock = units sold` → revenue → profit
- **Products** — full CRUD with low stock threshold alerts and price override logic
- **Reports** — daily, weekly, monthly, and yearly analytics with top product rankings
- **Alerts** — auto-generated price loss and low stock notifications

## API Overview

```
POST   /api/auth/login
POST   /api/shifts/start
POST   /api/shifts/add-stock
POST   /api/shifts/close
GET    /api/reports/weekly
GET    /api/reports/monthly?year=&month=
GET    /api/reports/yearly?year=
GET    /api/alerts
```

## Local Setup

```bash
git clone https://github.com/akashtyagi03/dailysales-be
cd dailysales-be
npm install
cp .env.example .env   # add MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID
npm run dev
```

## Frontend

Live → [dailysales.vercel.app](https://dailysales.vercel.app) (coming soon) · Repo → [dailysales-fe](https://github.com/akashtyagi03/DailySales_FE)
