# Telemed Aura — Premium Dark Full-Stack Dashboard

A responsive healthcare administration dashboard built with **React + Vite** on the frontend and **Node.js + Express REST API** on the backend. The backend persists data in `data/db.json`, so no native database build tools are required.

## Features

- Premium dark dashboard with clinic statistics, schedule, activity feed and care-team cards
- Appointment creation, search, status filtering, confirmation, completion and cancellation
- Doctor directory with booking shortcut
- Patient directory with search and add-patient form
- REST API validation, conflict checking for doctor/date/time, and JSON persistence
- Responsive desktop, tablet and mobile layout
- No `better-sqlite3` / `node-gyp` dependency

## Requirements

- Node.js 20+ (Node 22 is recommended; Node 24 should also work)
- npm

## Run locally

1. Extract the ZIP.
2. Open the extracted `Telemed_Aura_Premium` folder in VS Code.
3. Open Terminal → New Terminal.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Start frontend and backend together:

   ```bash
   npm run dev
   ```

6. Open **http://localhost:5173** in your browser.

The frontend runs on port `5173`; the API runs on port `4000`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API status |
| GET | `/api/dashboard` | Dashboard statistics and recent activity |
| GET | `/api/appointments` | List appointments; supports `?status=Pending&search=Maya` |
| POST | `/api/appointments` | Create an appointment |
| PATCH | `/api/appointments/:id` | Change appointment status |
| GET | `/api/patients` | List patients; supports `?search=Maya` |
| POST | `/api/patients` | Add a patient |
| GET | `/api/doctors` | List doctors |

## Production build

```bash
npm run build
npm start
```

`npm start` serves the built frontend and API from port `4000` when `NODE_ENV=production` is set. On Windows PowerShell, use:

```powershell
$env:NODE_ENV="production"; npm start
```

## Data storage

Seed data is stored in `data/db.json`. Successful patient and appointment mutations are written back to this file. This simple JSON store is intended for a learning/demo project, not concurrent production workloads or real patient data.

## Important note

This is a portfolio/demo project. Do not enter real protected health information. Authentication, role-based access, audit controls, encryption and a compliant production database would be required before real clinical use.


## Theme update

This build uses a **Blue & White** palette with a minimal, professional healthcare dashboard style. The theme is implemented in `src/style.css`; the React screens and Express REST API remain part of the same project.
