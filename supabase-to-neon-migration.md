# Supabase to Neon PostgreSQL Migration Plan

## Objective
Completely remove Supabase dependencies across the EcoSync project (frontend and backend) and migrate to Neon PostgreSQL, utilizing custom FastAPI JWT authentication.

## Phases

### 1. Database Schema Initialization (Neon)
- Define modern SQLAlchemy 2.0 models for all tables.
- Tables to create: `users`, `sensor_data`, `ml_logs`, `alerts`.
- Run Alembic or SQLAlchemy `create_all` against the Neon `DATABASE_URL`.

### 2. Authentication Replacement Context Setup
- Define FastAPI authentication endpoints: `/auth/register`, `/token`, `/auth/me`.
- Switch `passlib` bcrypt and `python-jose` for JWT validation.
- Implement `get_current_user` dependency.

### 3. Frontend Authentication Overhaul
- Strip `@supabase/supabase-js`.
- Refactor `AuthContext.jsx` to rely exclusively on local JWT token operations.
- Ensure API headers attach `Authorization: Bearer <token>`.

### 4. Codebase Supabase Eradication
- Backend: Strip `supabase-py` related logic inside the ML Pipeline and API endpoints. Update all database calls to use standard SQLAlchemy queries.
- Frontend: Ensure all Supabase references and `lib/supabase.js` are deleted.

### 5. Data Migration Scripts
- Develop a Python script using the existing Supabase client (temporarily) to download all rows of `users`, `sensor_data`, `ml_logs` and stream/insert them into the new Neon database.

### 6. Validation and Final Checks
- Verify Socratic checklist (`python .agent/scripts/checklist.py .`).
- Test user flows and ML pipeline.
