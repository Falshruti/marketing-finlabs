# Zoho CRM Lead Dashboard

A real-time, beautiful web dashboard for your Zoho CRM Leads — with KPIs, charts, and a searchable table.

## Features

- 📊 **6 KPI Cards** — Total Leads, This Month, Converted, Hot/Warm/Cold ratings
- 📈 **5 Charts** — Lead Sources (doughnut), Status (bar), Monthly Trend (line), Industry & Country breakdown
- 🔍 **Smart Table** — Search, filter by status/source, sortable columns, pagination
- ⬇️ **CSV Export** — Export filtered leads with one click
- 🔄 **Auto Token Refresh** — Access tokens refresh automatically via refresh token

## Quick Start

### 1. Get Zoho Credentials

1. Go to [https://api-console.zoho.in/](https://api-console.zoho.in/)
2. Click **"Get Started"** → **Server-based Applications**
3. Set Redirect URI to: `http://localhost:3000/oauth/callback`
4. Copy your **Client ID** and **Client Secret**

### 2. Configure `.env`

Edit the `.env` file and fill in:
```env
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=    ← fill after step 3
ZOHO_DOMAIN=zoho.in
PORT=3000
```

### 3. Get Refresh Token (one time)

```bash
npm run auth
```

This opens your browser, you authorize the app, and your refresh token prints in the terminal.
Copy it into your `.env` file.

### 4. Install & Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) 🚀

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/stats` | Aggregated dashboard stats |
| `GET /api/leads` | All leads (paginated from Zoho) |
| `GET /api/leads/search?q=&status=&source=&page=&limit=` | Filtered search |

## Project Structure

```
zoho-lead-dashboard/
├── server.js            # Express API server
├── zoho-auth.js         # OAuth2 token manager
├── get-refresh-token.js # One-time auth helper
├── .env                 # Your credentials (never commit!)
├── package.json
└── public/
    └── index.html       # Dashboard UI
```
