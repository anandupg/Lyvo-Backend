Behaviour Questions Service

Endpoints
- GET /api/behaviour/questions (auth)
- POST /api/behaviour/answers (auth)

Env
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- USER_SERVICE_JWT_SECRET (must equal user-service JWT_SECRET)

Supabase table
create table if not exists behaviour_answers (
  user_id text primary key,
  answers jsonb not null,
  completed_at timestamptz not null default now()
);

