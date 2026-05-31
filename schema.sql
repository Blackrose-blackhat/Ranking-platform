-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Institutions
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    head_of_department VARCHAR(255),
    established_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
-- 2a. Users
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'institution_admin',
    'department_coordinator',
    'faculty',
    'auditor'
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'faculty',
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TLR Submissions (Main parent table for a ranking year)
CREATE TABLE IF NOT EXISTS public.tlr_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(institution_id, academic_year)
);

-- 4. TLR Sub-Parameters

-- 4a. Student Strength (SS)
CREATE TABLE IF NOT EXISTS public.tlr_student_strength (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    total_students INT DEFAULT 0,
    ug_students INT DEFAULT 0,
    pg_students INT DEFAULT 0,
    phd_students INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4b. Faculty Student Ratio (FSR)
CREATE TABLE IF NOT EXISTS public.tlr_faculty_student_ratio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    total_faculty INT DEFAULT 0,
    permanent_faculty INT DEFAULT 0,
    student_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4c. Faculty Qualification & Experience (FQE)
CREATE TABLE IF NOT EXISTS public.tlr_faculty_qualification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    faculty_with_phd INT DEFAULT 0,
    total_faculty INT DEFAULT 0,
    avg_experience_years NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4d. Financial Resources and their Utilization (FRU)
CREATE TABLE IF NOT EXISTS public.tlr_financial_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    capital_expenditure NUMERIC(15,2) DEFAULT 0,
    operational_expenditure NUMERIC(15,2) DEFAULT 0,
    total_budget NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4e. Online Education (OE)
CREATE TABLE IF NOT EXISTS public.tlr_online_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    online_courses_offered INT DEFAULT 0,
    lms_usage_percentage NUMERIC(5,2) DEFAULT 0,
    digital_resources_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4f. Multiple Entry/Exit & IKS (MIR)
CREATE TABLE IF NOT EXISTS public.tlr_entry_exit_iks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    multiple_entry_exit_programs INT DEFAULT 0,
    regional_language_courses INT DEFAULT 0,
    iks_courses INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Calculated TLR Scores
CREATE TABLE IF NOT EXISTS public.tlr_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    ss_score NUMERIC(5,2) DEFAULT 0,
    fsr_score NUMERIC(5,2) DEFAULT 0,
    fqe_score NUMERIC(5,2) DEFAULT 0,
    fru_score NUMERIC(5,2) DEFAULT 0,
    oe_score NUMERIC(5,2) DEFAULT 0,
    mir_score NUMERIC(5,2) DEFAULT 0,
    total_score NUMERIC(5,2) DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Evidence Documents
CREATE TABLE IF NOT EXISTS public.evidence_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES public.tlr_submissions(id) ON DELETE CASCADE,
    parameter_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    validation_status VARCHAR(50) DEFAULT 'pending',
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS on all tables (Standard security practice for Supabase)
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_student_strength ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_faculty_student_ratio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_faculty_qualification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_financial_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_online_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_entry_exit_iks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlr_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_documents ENABLE ROW LEVEL SECURITY;

-- Disable RLS enforcement for Service Role (Backend API)
CREATE POLICY "Enable all access for all users" ON public.institutions FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.departments FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_submissions FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_student_strength FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_faculty_student_ratio FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_faculty_qualification FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_financial_resources FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_online_education FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_entry_exit_iks FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.tlr_scores FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.evidence_documents FOR ALL USING (true);
