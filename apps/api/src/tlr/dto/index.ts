// ── TLR Sub-parameter DTOs ──────────────────

export class CreateSubmissionDto {
  institution_id: string;
  academic_year: string;
}

export class StudentStrengthDto {
  total_students: number;
  ug_students: number;
  pg_students: number;
  phd_students: number;
}

export class FacultyStudentRatioDto {
  total_faculty: number;
  permanent_faculty: number;
  student_count: number;
}

export class FacultyQualificationDto {
  faculty_with_phd: number;
  total_faculty: number;
  avg_experience_years: number;
}

export class FinancialResourcesDto {
  capital_expenditure: number;
  operational_expenditure: number;
  total_budget: number;
}

export class OnlineEducationDto {
  online_courses_offered: number;
  lms_usage_percentage: number;
  digital_resources_count: number;
}

export class EntryExitIksDto {
  multiple_entry_exit_programs: number;
  regional_language_courses: number;
  iks_courses: number;
}

export class UploadEvidenceDto {
  parameter_type: "SS" | "FSR" | "FQE" | "FRU" | "OE" | "MIR";
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

export class BulkUploadEvidenceItem {
  parameter_type: "SS" | "FSR" | "FQE" | "FRU" | "OE" | "MIR";
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

export class BulkUploadEvidenceDto {
  items: BulkUploadEvidenceItem[];
}

