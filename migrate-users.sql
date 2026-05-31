-- 1. Create the new ENUM type
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'institution_admin',
    'department_coordinator',
    'faculty',
    'auditor'
);

-- 2. Create Institutions and Departments tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_of_department VARCHAR(255),
    established_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Modify the existing `users` table
-- Since the `role` column is currently a `text` type, we need to alter it to use the new ENUM.
-- We will also drop the old text fields and add the new relational fields.

ALTER TABLE public.users 
  DROP COLUMN IF EXISTS course,
  DROP COLUMN IF EXISTS college,
  DROP COLUMN IF EXISTS university;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Convert the existing 'role' column from text to the new user_role enum.
-- If someone has a role not in the enum (like 'student'), we default them to 'faculty'
ALTER TABLE public.users 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.user_role 
    USING (
      CASE 
        WHEN role IN ('super_admin', 'institution_admin', 'department_coordinator', 'faculty', 'auditor') 
        THEN role::public.user_role 
        ELSE 'faculty'::public.user_role 
      END
    ),
  ALTER COLUMN role SET DEFAULT 'faculty'::public.user_role;
