-- 003_create_jobs_table.sql

-- Create the jobs table if it doesn't exist
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  type text not null, -- e.g. 'evidence_validation'
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  error text,
  attempts int not null default 0,
  max_attempts int not null default 3,
  created_at timestamptz default now() not null,
  started_at timestamptz,
  completed_at timestamptz,
  locked_until timestamptz
);

-- Indexing for fast queue operations
create index if not exists idx_jobs_status_locked_created
  on public.jobs (status, locked_until, created_at)
  where status in ('pending', 'failed');

-- Enable RLS and create a policy for the service role
alter table public.jobs enable row level security;

create policy "jobs_service_role" on public.jobs
  for all to service_role
  using (true)
  with check (true);

-- Concurrency-safe plpgsql function to claim the next pending/retryable job using FOR UPDATE SKIP LOCKED
create or replace function public.claim_next_job(worker_lock_duration interval)
returns setof public.jobs as $$
declare
  claimed_job_id uuid;
begin
  -- Find and lock the next eligible job
  select id into claimed_job_id
  from public.jobs
  where (status = 'pending' or (status = 'failed' and attempts < max_attempts))
    and (locked_until is null or locked_until < now())
  order by created_at asc
  limit 1
  for update skip locked;

  if claimed_job_id is not null then
    return query
    update public.jobs
    set status = 'processing',
        started_at = now(),
        attempts = attempts + 1,
        locked_until = now() + worker_lock_duration
    where id = claimed_job_id
    returning *;
  end if;
end;
$$ language plpgsql security definer;
