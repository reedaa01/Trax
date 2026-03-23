<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TraX – Copilot Instructions

## Project Overview
TraX is a full-stack SaaS transport platform (Uber for trucks) with:
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS (App Router, `src/` layout)
- **Backend**: FastAPI (Python 3.12) with SQLAlchemy ORM
- **Database**: PostgreSQL 16
- **ML**: scikit-learn Ridge regression for price prediction + weighted scoring for driver recommendation
- **Auth**: JWT (python-jose) with bcrypt passwords, role-based access (client / driver)

## Architecture
```
Trax/
├── src/                    # Next.js frontend
│   ├── app/                # App Router pages
│   ├── components/         # Shared UI components
│   ├── contexts/           # React context (AuthContext)
│   ├── lib/                # API client + services
│   └── types/              # Shared TypeScript types
├── backend/
│   ├── main.py             # FastAPI entry point
│   ├── app/
│   │   ├── api/routes/     # Route handlers (auth, drivers, requests, search)
│   │   ├── core/           # Config + JWT security
│   │   ├── db/             # SQLAlchemy session + seed
│   │   ├── models/         # ORM models (User, DriverProfile, TransportRequest)
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic layer
│   └── ml/
│       └── predictor.py    # Price prediction + driver ranking ML
└── docker-compose.yml
```

## Code Conventions
- **Frontend**: Use `'use client'` directive only when needed. Prefer server components.
- **Backend**: Always go through the service layer from route handlers, never touch DB directly in routes.
- **Types**: All shared types live in `src/types/index.ts`. Keep frontend and backend schemas in sync.
- **Styling**: Use Tailwind utility classes. Custom component classes are in `globals.css` (`btn-primary`, `card`, `input-field`, etc.)
- **Error handling**: API errors return `{ detail: string }`. Frontend catches and shows them inline.
- **ML**: The ML module (`backend/ml/predictor.py`) is intentionally self-contained. It trains at import time for portability.

## Key Patterns
- Auth flow: register → JWT token → stored in localStorage → attached via axios interceptor
- Role guard: `require_role("driver")` / `require_role("client")` FastAPI dependency
- Price estimation: Called server-side on request creation AND client-side for preview
- Driver search: POST `/search/drivers` → returns ranked `DriverSearchResult[]` with scores
