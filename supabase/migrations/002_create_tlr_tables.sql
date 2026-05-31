-- =============================================
-- Migration 002: Create TLR Module Tables
-- NIRF Ranking Management System
-- =============================================

-- 1. Institutions
create table if not exists public.institutions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique,
  type text check (type in ('university', 'college', 'institute')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.institutions enable row level security;

create policy "institutions_read_authenticated"
  on public.institutions for select to authenticated using (true);
create policy "institutions_service_role"
  on public.institutions for all to service_role using (true) with check (true);

-- 2. Departments
create table if not exists public.departments (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  name text not null,
  code text,
  created_at timestamptz default now()
);

alter table public.departments enable row level security;

create policy "departments_read_authenticated"
  on public.departments for select to authenticated using (true);
create policy "departments_service_role"
  on public.departments for all to service_role using (true) with check (true);

-- 3. TLR Submissions (one per institution per academic year)
create table if not exists public.tlr_submissions (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institutions on delete cascade not null,
  academic_year text not null,
  status text default 'draft' check (status in ('draft', 'in_review', 'approved', 'rejected')),
  submitted_by uuid references auth.users,
  reviewed_by uuid references auth.users,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(institution_id, academic_year)
);

alter table public.tlr_submissions enable row level security;

create policy "tlr_submissions_read_authenticated"
  on public.tlr_submissions for select to authenticated using (true);
create policy "tlr_submissions_service_role"
  on public.tlr_submissions for all to service_role using (true) with check (true);

-- 4. Student Strength (SS)
create table if not exists public.tlr_student_strength (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null unique,
  total_students int default 0,
  ug_students int default 0,
  pg_students int default 0,
  phd_students int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tlr_student_strength enable row level security;

create policy "tlr_ss_read_authenticated"
  on public.tlr_student_strength for select to authenticated using (true);
create policy "tlr_ss_service_role"
  on public.tlr_student_strength for all to service_role using (true) with check (true);

-- 5. Faculty-Student Ratio (FSR)
create table if not exists public.tlr_faculty_student_ratio (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null unique,
  total_faculty int default 0,
  permanent_faculty int default 0,
  student_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tlr_faculty_student_ratio enable row level security;

create policy "tlr_fsr_read_authenticated"
  on public.tlr_faculty_student_ratio for select to authenticated using (true);
create policy "tlr_fsr_service_role"
  on public.tlr_faculty_student_ratio for all to service_role using (true) with check (true);

-- 6. Faculty Qualification & Experience (FQE)
create table if not exists public.tlr_faculty_qualification (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null unique,
  faculty_with_phd int default 0,
  total_faculty int default 0,
  avg_experience_years numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tlr_faculty_qualification enable row level security;

create policy "tlr_fqe_read_authenticated"
  on public.tlr_faculty_qualification for select to authenticated using (true);
create policy "tlr_fqe_service_role"
  on public.tlr_faculty_qualification for all to service_role using (true) with check (true);

-- 7. Financial Resource Utilization (FRU)
create table if not exists public.tlr_financial_resources (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null unique,
  capital_expenditure numeric(15,2) default 0,
  operational_expenditure numeric(15,2) default 0,
  total_budget numeric(15,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tlr_financial_resources enable row level security;

create policy "tlr_fru_read_authenticated"
  on public.tlr_financial_resources for select to authenticated using (true);
create policy "tlr_fru_service_role"
  on public.tlr_financial_resources for all to service_role using (true) with check (true);

-- 8. Online Education (OE)
create table if not exists public.tlr_online_education (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null unique,
  online_courses_offered int default 0,
  lms_usage_percentage numeric(5,2) default 0,
  digital_resources_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tlr_online_education enable row level security;

create policy "tlr_oe_read_authenticated"
  on public.tlr_online_education for select to authenticated using (true);
create policy "tlr_oe_service_role"
  on public.tlr_online_education for all to service_role using (true) with check (true);

-- 9. Entry Exit & IKS (MIR)
create table if not exists public.tlr_entry_exit_iks (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null unique,
  multiple_entry_exit_programs int default 0,
  regional_language_courses int default 0,
  iks_courses int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tlr_entry_exit_iks enable row level security;

create policy "tlr_mir_read_authenticated"
  on public.tlr_entry_exit_iks for select to authenticated using (true);
create policy "tlr_mir_service_role"
  on public.tlr_entry_exit_iks for all to service_role using (true) with check (true);

-- 10. Evidence Documents
create table if not exists public.evidence_documents (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null,
  parameter_type text not null check (parameter_type in ('SS', 'FSR', 'FQE', 'FRU', 'OE', 'MIR')),
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references auth.users,
  validation_status text default 'pending' check (validation_status in ('pending', 'valid', 'invalid')),
  validation_notes text,
  created_at timestamptz default now()
);

alter table public.evidence_documents enable row level security;

create policy "evidence_read_authenticated"
  on public.evidence_documents for select to authenticated using (true);
create policy "evidence_service_role"
  on public.evidence_documents for all to service_role using (true) with check (true);

-- 11. Calculated TLR Scores
create table if not exists public.tlr_scores (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.tlr_submissions on delete cascade not null unique,
  ss_score numeric(5,2) default 0,
  fsr_score numeric(5,2) default 0,
  fqe_score numeric(5,2) default 0,
  fru_score numeric(5,2) default 0,
  oe_score numeric(5,2) default 0,
  mir_score numeric(5,2) default 0,
  total_score numeric(6,2) default 0,
  calculated_at timestamptz default now()
);

alter table public.tlr_scores enable row level security;

create policy "tlr_scores_read_authenticated"
  on public.tlr_scores for select to authenticated using (true);
create policy "tlr_scores_service_role"
  on public.tlr_scores for all to service_role using (true) with check (true);

-- 12. Create Supabase Storage bucket for evidence uploads
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Storage policies for evidence bucket
create policy "evidence_upload_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence');

create policy "evidence_read_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'evidence');

create policy "evidence_delete_authenticated"
  on storage.objects for delete to authenticated
  using (bucket_id = 'evidence');
