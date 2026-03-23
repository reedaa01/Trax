# TraX 🚚

**TraX** is a full-stack SaaS transport platform — *Uber for trucks* — connecting clients who need freight shipped with professional drivers. It features ML-powered price estimation, driver recommendation scoring, JWT authentication, and role-based dashboards for both clients and drivers.

---

## ✨ Features

| Area | Details |
|---|---|
| **Auth** | JWT (python-jose) · bcrypt passwords · role-based access (client / driver) |
| **Client dashboard** | Search drivers · live price estimate · send transport requests · cancel requests |
| **Driver dashboard** | Toggle availability · accept / reject incoming requests · view job history |
| **ML pricing** | Ridge regression trained on 2 000 synthetic freight samples (distance × vehicle × load) |
| **ML ranking** | Weighted driver scoring: rating 35 % · experience 25 % · capacity 20 % · proximity 20 % |
| **REST API** | FastAPI with full OpenAPI docs at `/docs` |
| **Database** | PostgreSQL 16 with SQLAlchemy 2.0 ORM, auto-seeded demo data |
| **Docker** | One-command full-stack spin-up with `docker compose up` |

---

## 🏗️ Architecture

```
Trax/
├── src/                         # Next.js 15 frontend (App Router)
│   ├── app/                     # Pages & layouts
│   │   ├── page.tsx             # Landing page
│   │   ├── auth/login           # Login
│   │   ├── auth/register        # Register (client or driver)
│   │   ├── dashboard/client/    # Client dashboard, search, requests
│   │   └── dashboard/driver/    # Driver dashboard, requests, jobs, settings
│   ├── components/              # Shared UI components
│   ├── contexts/AuthContext.tsx # JWT auth state + role-based redirect
│   ├── lib/api.ts               # Axios instance with JWT interceptor
│   ├── lib/services.ts          # Typed API service layer
│   └── types/index.ts           # Shared TypeScript types
│
├── backend/
│   ├── main.py                  # FastAPI entry point + CORS
│   └── app/
│       ├── api/routes/          # auth · drivers · requests · search
│       ├── core/                # JWT security + app config
│       ├── db/                  # SQLAlchemy session + demo seed data
│       ├── models/              # ORM models: User · DriverProfile · TransportRequest
│       ├── schemas/             # Pydantic v2 request/response schemas
│       └── services/            # Business logic (auth · driver · request)
│   └── ml/
│       └── predictor.py         # Ridge regression price model + driver ranker
│
├── docker-compose.yml           # db + backend + frontend + seeder
└── Dockerfile                   # Next.js multi-stage production image
```

---

## 🚀 Quick Start

### Option A — Docker (recommended)

> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

Demo accounts seeded automatically:

| Role | Email | Password |
|---|---|---|
| Client | `karim@client.ma` | `password123` |
| Client | `salma@client.ma` | `password123` |
| Driver | `youssef@trax.ma` — Casablanca, semi-truck | `password123` |
| Driver | `fatima@trax.ma` — Marrakech, truck | `password123` |
| Driver | `khalid@trax.ma` — Tanger, flatbed | `password123` |
| Driver | `meryem@trax.ma` — Agadir, van | `password123` |
| Driver | `omar@trax.ma` — Fès, truck | `password123` |
| Driver | `hassan@trax.ma` — Oujda, semi-truck | `password123` |
| Driver | `nadia@trax.ma` — Rabat, pickup | `password123` |
| Driver | `abdelaziz@trax.ma` — Ouarzazate, flatbed | `password123` |

---

### Option B — Local development

#### Prerequisites

- Node.js ≥ 20
- Python 3.12
- PostgreSQL 16 running locally

#### 1. Frontend

```bash
npm install
cp .env.local.example .env.local   # edit NEXT_PUBLIC_API_URL if needed
npm run dev                         # http://localhost:3000
```

#### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt

# Create a .env (or export variables)
cp .env.example .env   # edit DATABASE_URL and SECRET_KEY

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The database tables are created and demo data is seeded automatically on first start.

---

## 🔑 Environment Variables

### Frontend — `.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI base URL |

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL DSN, e.g. `postgresql://trax:traxpass@localhost:5432/traxdb` |
| `SECRET_KEY` | ✅ | 256-bit random string for JWT signing |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime (24 h default) |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `DEBUG` | `false` | Enables SQLAlchemy query logging |

---

## 📡 API Reference

All endpoints are documented interactively at **`/docs`** (Swagger UI) and **`/redoc`**.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Obtain JWT token |
| `GET` | `/api/auth/me` | Get current user (requires token) |

### Drivers

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/drivers/profile` | Get own driver profile |
| `PUT` | `/api/drivers/profile` | Update profile (vehicle, capacity, phone) |
| `PATCH` | `/api/drivers/availability` | Toggle availability on/off |

### Transport Requests

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/requests/` | Create a transport request |
| `GET` | `/api/requests/` | List requests (filtered by role) |
| `PATCH` | `/api/requests/{id}/respond` | Driver accepts or rejects |
| `PATCH` | `/api/requests/{id}/cancel` | Client cancels a pending request |

### Search & ML

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/search/drivers` | Search & rank available drivers with ML scores |
| `POST` | `/api/search/estimate` | Standalone price estimate (no auth required) |

---

## 🤖 ML Details

### Price Prediction (`backend/ml/predictor.py`)

- **Model**: scikit-learn `Ridge` regression
- **Features**: distance (km), vehicle type (one-hot), load weight (tons)
- **Training**: 2 000 synthetic samples generated at import time — no external data files needed
- **Accuracy**: RMSE ≈ $15–30 on the synthetic set; real-world accuracy improves with production data

### Driver Recommendation

Weighted composite score (0–1):

| Factor | Weight |
|---|---|
| Driver rating (1–5 stars) | 35 % |
| Years of experience | 25 % |
| Vehicle capacity vs. required load | 20 % |
| Proximity to departure city | 20 % |

---

## 🛠️ VS Code Tasks

Open the Command Palette (`Ctrl+Shift+P`) → **Tasks: Run Task**:

| Task | Description |
|---|---|
| `Frontend: dev server` | `npm run dev` with hot reload |
| `Frontend: build` | Production build + type check |
| `Backend: start (uvicorn)` | FastAPI with `--reload` |
| `Backend: install deps` | `pip install -r requirements.txt` |
| `Docker: up (full stack)` | `docker compose up --build` |
| `Docker: down` | `docker compose down` |
| `Type check` | `npx tsc --noEmit` |

---

## 🗂️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 |
| Forms | react-hook-form v7 · Zod v4 · @hookform/resolvers |
| HTTP client | Axios 1.x with JWT interceptor |
| Backend | FastAPI 0.115 · Python 3.12 · Uvicorn |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL 16 |
| Auth | python-jose · passlib / bcrypt |
| ML | scikit-learn · NumPy · pandas |
| Containers | Docker · Docker Compose v3.9 |

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `src/contexts/AuthContext.tsx` | JWT state, login/register/logout, role redirect |
| `src/lib/api.ts` | Axios instance — auto-attaches Bearer token, handles 401 |
| `src/lib/services.ts` | Typed wrappers for every API endpoint |
| `src/types/index.ts` | Shared TypeScript types (User, DriverProfile, TransportRequest, …) |
| `backend/app/core/security.py` | JWT creation/validation, `get_current_user`, `require_role` |
| `backend/app/db/seed.py` | Seeds 5 drivers + 2 clients on first startup |
| `backend/ml/predictor.py` | Self-contained ML module — trains at import, no files needed |

---

## 🧪 Testing the Flow

1. **Register** as a **client** at `/auth/register`
2. Go to **Find Transport** → enter cities, pick a date, hit **Search**
3. Review ranked drivers with estimated prices and match scores
4. Click **Send Request** on a driver
5. Open an incognito window, **register** as a **driver** (`driver1@example.com` / `password123`)
6. Go to **Incoming Requests** → **Accept**
7. Back as client, refresh **My Requests** — status updates to `accepted`

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
