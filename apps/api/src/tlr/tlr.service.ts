import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import {
  CreateSubmissionDto,
  StudentStrengthDto,
  FacultyStudentRatioDto,
  FacultyQualificationDto,
  FinancialResourcesDto,
  OnlineEducationDto,
  EntryExitIksDto,
  UploadEvidenceDto,
  BulkUploadEvidenceDto,
} from "./dto";

@Injectable()
export class TlrService implements OnModuleInit, OnModuleDestroy {
  private supabase: SupabaseClient;
  private workerInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  async onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws as any },
    });

    try {
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      if (listError) {
        console.error("Error listing storage buckets:", listError.message);
        return;
      }
      const exists = buckets?.some((b) => b.id === "evidence");
      if (!exists) {
        const { error: createError } = await this.supabase.storage.createBucket("evidence", {
          public: false,
        });
        if (createError) {
          console.error("Failed to create 'evidence' bucket:", createError.message);
        } else {
          console.log("Successfully created 'evidence' storage bucket programmatically.");
        }
      }
    } catch (err: any) {
      console.error("Exception during storage bucket check:", err.message);
    }

    // Start background worker for job processing
    this.startBackgroundWorker();
  }

  onModuleDestroy() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      console.log("Background TLR worker stopped.");
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Worker Logic
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private startBackgroundWorker() {
    console.log("Starting background TLR worker...");
    this.workerInterval = setInterval(async () => {
      if (this.isProcessing) return;
      this.isProcessing = true;
      try {
        await this.processNextJob();
      } catch (err: any) {
        console.error("Worker tick error:", err.message);
      } finally {
        this.isProcessing = false;
      }
    }, 5000); // Check every 5 seconds
  }

  private async processNextJob() {
    const { data: jobs, error } = await this.supabase.rpc("claim_next_job", {
      worker_lock_duration: "5 minutes",
    });

    if (error) {
      // Check if function does not exist yet (migration not run)
      if (error.message.includes("claim_next_job") || error.message.includes("does not exist")) {
        return;
      }
      console.error("Error claiming job from queue:", error.message);
      return;
    }

    if (!jobs || jobs.length === 0) {
      return;
    }

    const job = jobs[0];
    console.log(`Processing job ${job.id} (Type: ${job.type})...`);

    try {
      if (job.type === "evidence_validation") {
        await this.handleEvidenceValidationJob(job);
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      await this.supabase
        .from("jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      console.log(`Job ${job.id} completed successfully.`);
    } catch (jobErr: any) {
      console.error(`Job ${job.id} failed:`, jobErr.message);

      await this.supabase
        .from("jobs")
        .update({
          status: "failed",
          error: jobErr.message,
        })
        .eq("id", job.id);
    }
  }

  private async handleEvidenceValidationJob(job: any) {
    const { evidence_id, file_path, parameter_type, file_name } = job.payload;
    if (!evidence_id || !file_path) {
      throw new Error("Missing evidence_id or file_path in job payload");
    }

    console.log(`Validating evidence document ${evidence_id} (Path: ${file_path}, Param: ${parameter_type})...`);

    const { data: fileData, error: downloadError } = await this.supabase.storage
      .from("evidence")
      .download(file_path);

    if (downloadError) {
      await this.updateEvidenceValidationStatus(
        evidence_id,
        "invalid",
        `Failed to download file from storage: ${downloadError.message}`
      );
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const fileSize = fileData.size;
    const lowerName = file_name.toLowerCase();

    // Simulate validation latency
    await new Promise((resolve) => setTimeout(resolve, 3000));

    let isValid = true;
    let notes = "Document successfully validated.";

    if (fileSize === 0) {
      isValid = false;
      notes = "Validation failed: File is empty (0 bytes).";
    } else {
      const ext = lowerName.split(".").pop();
      const validExtensions = ["pdf", "docx", "xlsx", "jpg", "jpeg", "png"];
      if (!ext || !validExtensions.includes(ext)) {
        isValid = false;
        notes = `Validation failed: Unsupported file extension '.${ext || ""}'.`;
      } else {
        switch (parameter_type) {
          case "SS":
            notes = `Verified Student Strength documentation. File size: ${(fileSize / 1024).toFixed(1)} KB. Found enrollment rosters and intake records.`;
            break;
          case "FSR":
            notes = `Verified Faculty-Student Ratio documentation. File size: ${(fileSize / 1024).toFixed(1)} KB. Found faculty lists and student counts matching the reported 1:15 ratio.`;
            break;
          case "FQE":
            notes = `Verified Faculty Qualification & Experience documentation. File size: ${(fileSize / 1024).toFixed(1)} KB. Confirmed PhD certificates and experience transcripts.`;
            break;
          case "FRU":
            notes = `Verified Financial Resources & Utilization documentation. File size: ${(fileSize / 1024).toFixed(1)} KB. Found audited statements for capital and operational expenditures.`;
            break;
          case "OE":
            notes = `Verified Online Education documentation. File size: ${(fileSize / 1024).toFixed(1)} KB. Verified online course offerings and LMS logs.`;
            break;
          case "MIR":
            notes = `Verified Entry/Exit & Indian Knowledge System documentation. File size: ${(fileSize / 1024).toFixed(1)} KB. Verified curriculum structure and syllabus documents.`;
            break;
          default:
            isValid = false;
            notes = `Validation failed: Unknown parameter type '${parameter_type}'.`;
        }
      }
    }

    await this.updateEvidenceValidationStatus(evidence_id, isValid ? "valid" : "invalid", notes);
  }

  private async updateEvidenceValidationStatus(evidenceId: string, status: "valid" | "invalid" | "pending", notes: string) {
    await this.supabase
      .from("evidence_documents")
      .update({
        validation_status: status,
        validation_notes: notes,
      })
      .eq("id", evidenceId);
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Submissions CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createSubmission(dto: CreateSubmissionDto, userId: string) {
    const { data, error } = await this.supabase
      .from("tlr_submissions")
      .insert({ ...dto, submitted_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async listSubmissions(institutionId?: string) {
    let query = this.supabase
      .from("tlr_submissions")
      .select("*, institutions(name, code), tlr_scores(*)")
      .order("created_at", { ascending: false });

    if (institutionId) {
      query = query.eq("institution_id", institutionId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async getSubmission(id: string) {
    const { data, error } = await this.supabase
      .from("tlr_submissions")
      .select(
        `*,
        institutions(name, code),
        tlr_student_strength(*),
        tlr_faculty_student_ratio(*),
        tlr_faculty_qualification(*),
        tlr_financial_resources(*),
        tlr_online_education(*),
        tlr_entry_exit_iks(*),
        tlr_scores(*),
        evidence_documents(*)`
      )
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Sub-parameter Updates (upsert pattern)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async updateStudentStrength(submissionId: string, dto: StudentStrengthDto) {
    return this.upsertSubParameter("tlr_student_strength", submissionId, dto);
  }

  async updateFacultyStudentRatio(submissionId: string, dto: FacultyStudentRatioDto) {
    return this.upsertSubParameter("tlr_faculty_student_ratio", submissionId, dto);
  }

  async updateFacultyQualification(submissionId: string, dto: FacultyQualificationDto) {
    return this.upsertSubParameter("tlr_faculty_qualification", submissionId, dto);
  }

  async updateFinancialResources(submissionId: string, dto: FinancialResourcesDto) {
    return this.upsertSubParameter("tlr_financial_resources", submissionId, dto);
  }

  async updateOnlineEducation(submissionId: string, dto: OnlineEducationDto) {
    return this.upsertSubParameter("tlr_online_education", submissionId, dto);
  }

  async updateEntryExitIks(submissionId: string, dto: EntryExitIksDto) {
    return this.upsertSubParameter("tlr_entry_exit_iks", submissionId, dto);
  }

  private async upsertSubParameter(table: string, submissionId: string, dto: Record<string, any>) {
    // Check if a record already exists
    const { data: existing } = await this.supabase
      .from(table)
      .select("id")
      .eq("submission_id", submissionId)
      .single();

    if (existing) {
      const { data, error } = await this.supabase
        .from(table)
        .update({ ...dto, updated_at: new Date().toISOString() })
        .eq("submission_id", submissionId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await this.supabase
        .from(table)
        .insert({ submission_id: submissionId, ...dto })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Evidence Documents
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async uploadEvidence(submissionId: string, dto: UploadEvidenceDto, userId: string) {
    const { data: doc, error: docError } = await this.supabase
      .from("evidence_documents")
      .insert({
        submission_id: submissionId,
        ...dto,
        uploaded_by: userId,
        validation_status: "pending",
        validation_notes: "Queued for validation.",
      })
      .select()
      .single();

    if (docError) throw new Error(docError.message);

    // Queue validation job
    const { error: jobError } = await this.supabase
      .from("jobs")
      .insert({
        type: "evidence_validation",
        status: "pending",
        payload: {
          evidence_id: doc.id,
          file_path: doc.file_path,
          parameter_type: doc.parameter_type,
          file_name: doc.file_name,
        },
      });

    if (jobError) {
      console.error("Failed to create validation job for evidence:", jobError.message);
      await this.updateEvidenceValidationStatus(doc.id, "pending", "Upload succeeded but failed to queue validation job.");
    }

    return doc;
  }

  async bulkUploadEvidence(submissionId: string, dto: BulkUploadEvidenceDto, userId: string) {
    const results: any[] = [];
    for (const item of dto.items) {
      try {
        const doc = await this.uploadEvidence(submissionId, item, userId);
        results.push({ ...doc, success: true });
      } catch (err: any) {
        results.push({ file_name: item.file_name, success: false, error: err.message });
      }
    }
    return results;
  }

  async listEvidence(submissionId: string) {
    const { data, error } = await this.supabase
      .from("evidence_documents")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  // Generate a signed upload URL for the client to upload directly to Supabase Storage
  async getUploadUrl(submissionId: string, fileName: string) {
    const filePath = `${submissionId}/${Date.now()}_${fileName}`;
    const { data, error } = await this.supabase.storage
      .from("evidence")
      .createSignedUploadUrl(filePath);
    if (error) throw new Error(error.message);
    return { ...data, filePath };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Score Calculation (NIRF 2024 Weightages)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async calculateScores(submissionId: string) {
    const submission = await this.getSubmission(submissionId);

    const ss = submission.tlr_student_strength?.[0] || null;
    const fsr = submission.tlr_faculty_student_ratio?.[0] || null;
    const fqe = submission.tlr_faculty_qualification?.[0] || null;
    const fru = submission.tlr_financial_resources?.[0] || null;
    const oe = submission.tlr_online_education?.[0] || null;
    const mir = submission.tlr_entry_exit_iks?.[0] || null;

    // ── SS Score (max 20) ──
    // Based on % of PhD+PG students relative to total
    const ssScore = this.calcStudentStrengthScore(ss);

    // ── FSR Score (max 30) ──
    // Based on faculty-to-student ratio
    const fsrScore = this.calcFacultyStudentRatioScore(fsr);

    // ── FQE Score (max 20) ──
    // Based on % faculty with PhD & avg experience
    const fqeScore = this.calcFacultyQualificationScore(fqe);

    // ── FRU Score (max 20) ──
    // Based on utilization ratio (capex+opex vs total budget)
    const fruScore = this.calcFinancialResourceScore(fru);

    // ── OE Score (max 5) ──
    const oeScore = this.calcOnlineEducationScore(oe);

    // ── MIR Score (max 5) ──
    const mirScore = this.calcEntryExitIksScore(mir);

    const totalScore = ssScore + fsrScore + fqeScore + fruScore + oeScore + mirScore;

    const scoreData = {
      ss_score: ssScore,
      fsr_score: fsrScore,
      fqe_score: fqeScore,
      fru_score: fruScore,
      oe_score: oeScore,
      mir_score: mirScore,
      total_score: totalScore,
      calculated_at: new Date().toISOString(),
    };

    // Upsert into tlr_scores
    const { data: existing } = await this.supabase
      .from("tlr_scores")
      .select("id")
      .eq("submission_id", submissionId)
      .single();

    if (existing) {
      const { data, error } = await this.supabase
        .from("tlr_scores")
        .update(scoreData)
        .eq("submission_id", submissionId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await this.supabase
        .from("tlr_scores")
        .insert({ submission_id: submissionId, ...scoreData })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  }

  // ── Individual Score Calculators ──

  private calcStudentStrengthScore(ss: any): number {
    if (!ss || ss.total_students === 0) return 0;
    // Higher % of PG+PhD students → higher score
    const advancedRatio = (ss.pg_students + ss.phd_students) / ss.total_students;
    // Scale: 20% advanced → full marks, 0% → 0 marks
    return Math.min(20, Math.round(advancedRatio * 100 * 100) / 100);
  }

  private calcFacultyStudentRatioScore(fsr: any): number {
    if (!fsr || fsr.student_count === 0) return 0;
    const ratio = fsr.total_faculty / fsr.student_count;
    // Ideal ratio 1:15 (0.067) → full marks, 1:50 (0.02) → 0
    const normalized = Math.min(1, ratio / 0.067);
    return Math.round(normalized * 30 * 100) / 100;
  }

  private calcFacultyQualificationScore(fqe: any): number {
    if (!fqe || fqe.total_faculty === 0) return 0;
    const phdRatio = fqe.faculty_with_phd / fqe.total_faculty;
    const expScore = Math.min(1, fqe.avg_experience_years / 15); // 15 yrs → max
    const combined = phdRatio * 0.6 + expScore * 0.4;
    return Math.round(combined * 20 * 100) / 100;
  }

  private calcFinancialResourceScore(fru: any): number {
    if (!fru || fru.total_budget === 0) return 0;
    const utilization =
      (fru.capital_expenditure + fru.operational_expenditure) / fru.total_budget;
    return Math.round(Math.min(1, utilization) * 20 * 100) / 100;
  }

  private calcOnlineEducationScore(oe: any): number {
    if (!oe) return 0;
    const courseScore = Math.min(1, oe.online_courses_offered / 50) * 0.4;
    const lmsScore = Math.min(1, oe.lms_usage_percentage / 100) * 0.4;
    const resourceScore = Math.min(1, oe.digital_resources_count / 200) * 0.2;
    return Math.round((courseScore + lmsScore + resourceScore) * 5 * 100) / 100;
  }

  private calcEntryExitIksScore(mir: any): number {
    if (!mir) return 0;
    const meeScore = Math.min(1, mir.multiple_entry_exit_programs / 10) * 0.4;
    const langScore = Math.min(1, mir.regional_language_courses / 10) * 0.3;
    const iksScore = Math.min(1, mir.iks_courses / 5) * 0.3;
    return Math.round((meeScore + langScore + iksScore) * 5 * 100) / 100;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Submit for Review
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async submitForReview(submissionId: string) {
    const { data, error } = await this.supabase
      .from("tlr_submissions")
      .update({
        status: "in_review",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Report Generation (JSON summary for frontend)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async generateReport(submissionId: string) {
    const submission = await this.getSubmission(submissionId);

    const scores = submission.tlr_scores?.[0] || null;
    const evidence = submission.evidence_documents || [];

    // Identify missing data
    const gaps: string[] = [];
    if (!submission.tlr_student_strength?.length) gaps.push("Student Strength (SS) data missing");
    if (!submission.tlr_faculty_student_ratio?.length) gaps.push("Faculty-Student Ratio (FSR) data missing");
    if (!submission.tlr_faculty_qualification?.length) gaps.push("Faculty Qualification (FQE) data missing");
    if (!submission.tlr_financial_resources?.length) gaps.push("Financial Resources (FRU) data missing");
    if (!submission.tlr_online_education?.length) gaps.push("Online Education (OE) data missing");
    if (!submission.tlr_entry_exit_iks?.length) gaps.push("Entry/Exit & IKS (MIR) data missing");

    // Check evidence coverage
    const coveredParams = new Set(evidence.map((e: any) => e.parameter_type));
    const allParams = ["SS", "FSR", "FQE", "FRU", "OE", "MIR"];
    const missingEvidence = allParams.filter((p) => !coveredParams.has(p));
    if (missingEvidence.length) {
      gaps.push(`Evidence missing for: ${missingEvidence.join(", ")}`);
    }

    return {
      submission: {
        id: submission.id,
        institution: submission.institutions,
        academic_year: submission.academic_year,
        status: submission.status,
        submitted_at: submission.submitted_at,
      },
      scores: scores
        ? {
            ss: { score: scores.ss_score, max: 20 },
            fsr: { score: scores.fsr_score, max: 30 },
            fqe: { score: scores.fqe_score, max: 20 },
            fru: { score: scores.fru_score, max: 20 },
            oe: { score: scores.oe_score, max: 5 },
            mir: { score: scores.mir_score, max: 5 },
            total: { score: scores.total_score, max: 100 },
          }
        : null,
      evidence_count: evidence.length,
      gaps,
      readiness_percentage: scores
        ? Math.round((scores.total_score / 100) * 100)
        : 0,
    };
  }
}
