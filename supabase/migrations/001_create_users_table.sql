-- =============================================
-- Migration 001: Create public.users table
-- =============================================

create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text default 'student' not null,
  course text,
  college text,
  university text,
  permissions text[] default '{}'::text[] not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

-- Allow authenticated users to read any profile
create policy "users_select_authenticated"
  on public.users for select
  to authenticated
  using (true);

-- Allow users to update their own profile
create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = id);

-- Allow service_role full access (NestJS backend)
create policy "users_service_role_all"
  on public.users for all
  to service_role
  using (true)
  with check (true);
