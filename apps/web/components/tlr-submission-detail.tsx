"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "@/components/score-card";
import { NumberField } from "@/components/number-field";
import { ParameterTabContent } from "@/components/parameter-tab-content";
import { toast } from "sonner";

export interface Submission {
  id: string;
  institutions?: { name: string };
  status: string;
  academic_year: string;
  tlr_student_strength?: Array<any>;
  tlr_faculty_student_ratio?: Array<any>;
  tlr_faculty_qualification?: Array<any>;
  tlr_financial_resources?: Array<any>;
  tlr_online_education?: Array<any>;
  tlr_entry_exit_iks?: Array<any>;
  tlr_scores?: Array<any>;
}

const parameterConfig = [
  { key: "ss", label: "Student Strength", abbr: "SS", color: "blue" },
  { key: "fsr", label: "Faculty-Student Ratio", abbr: "FSR", color: "emerald" },
  { key: "fqe", label: "Faculty Qualification", abbr: "FQE", color: "amber" },
  { key: "fru", label: "Financial Resources", abbr: "FRU", color: "violet" },
  { key: "oe", label: "Online Education", abbr: "OE", color: "rose" },
  { key: "mir", label: "Entry/Exit & IKS", abbr: "MIR", color: "cyan" },
];

interface FormState {
  [key: string]: number | null | undefined;
  total_students?: number | null;
  ug_students?: number | null;
  pg_students?: number | null;
  phd_students?: number | null;
  total_faculty?: number | null;
  permanent_faculty?: number | null;
  student_count?: number | null;
  faculty_with_phd?: number | null;
  avg_experience_years?: number | null;
  capital_expenditure?: number | null;
  operational_expenditure?: number | null;
  total_budget?: number | null;
  online_courses_offered?: number | null;
  lms_usage_percentage?: number | null;
  digital_resources_count?: number | null;
  multiple_entry_exit_programs?: number | null;
  regional_language_courses?: number | null;
  iks_courses?: number | null;
}

interface SubmissionDetailProps {
  submissionId: string;
}

export function TLRSubmissionDetail({ submissionId }: SubmissionDetailProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [ssForm, setSsForm] = useState<FormState>({});
  const [fsrForm, setFsrForm] = useState<FormState>({});
  const [fqeForm, setFqeForm] = useState<FormState>({});
  const [fruForm, setFruForm] = useState<FormState>({});
  const [oeForm, setOeForm] = useState<FormState>({});
  const [mirForm, setMirForm] = useState<FormState>({});

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  async function fetchSubmission() {
    setLoading(true);
    try {
      const data = await apiFetch(`/tlr/submissions/${submissionId}`);
      setSubmission(data);
      populateFormState();
    } catch (e: any) {
      console.error(e);
      toast.error(`Error loading submission: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (submission) {
      populateFormState();
    }
  }, [submission]);

  function populateFormState() {
    if (!submission) return;

    if (submission.tlr_student_strength?.[0]) {
      const d = submission.tlr_student_strength[0];
      setSsForm({
        total_students: d.total_students,
        ug_students: d.ug_students,
        pg_students: d.pg_students,
        phd_students: d.phd_students,
      });
    }
    if (submission.tlr_faculty_student_ratio?.[0]) {
      const d = submission.tlr_faculty_student_ratio[0];
      setFsrForm({
        total_faculty: d.total_faculty,
        permanent_faculty: d.permanent_faculty,
        student_count: d.student_count,
      });
    }
    if (submission.tlr_faculty_qualification?.[0]) {
      const d = submission.tlr_faculty_qualification[0];
      setFqeForm({
        faculty_with_phd: d.faculty_with_phd,
        total_faculty: d.total_faculty,
        avg_experience_years: d.avg_experience_years,
      });
    }
    if (submission.tlr_financial_resources?.[0]) {
      const d = submission.tlr_financial_resources[0];
      setFruForm({
        capital_expenditure: d.capital_expenditure,
        operational_expenditure: d.operational_expenditure,
        total_budget: d.total_budget,
      });
    }
    if (submission.tlr_online_education?.[0]) {
      const d = submission.tlr_online_education[0];
      setOeForm({
        online_courses_offered: d.online_courses_offered,
        lms_usage_percentage: d.lms_usage_percentage,
        digital_resources_count: d.digital_resources_count,
      });
    }
    if (submission.tlr_entry_exit_iks?.[0]) {
      const d = submission.tlr_entry_exit_iks[0];
      setMirForm({
        multiple_entry_exit_programs: d.multiple_entry_exit_programs,
        regional_language_courses: d.regional_language_courses,
        iks_courses: d.iks_courses,
      });
    }
  }

  async function saveParameter(paramKey: string) {
    setSaving(true);

    const formData: Record<string, any> = {
      ss: ssForm,
      fsr: fsrForm,
      fqe: fqeForm,
      fru: fruForm,
      oe: oeForm,
      mir: mirForm,
    };

    try {
      await apiFetch(`/tlr/submissions/${submissionId}/${paramKey}`, {
        method: "PUT",
        body: JSON.stringify(formData[paramKey]),
      });

      toast.success(`${paramKey.toUpperCase()} data saved successfully!`);
      const updated = await apiFetch(`/tlr/submissions/${submissionId}`);
      setSubmission(updated);
    } catch (err: any) {
      toast.error(`Error saving data: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCalculate() {
    setCalculating(true);

    try {
      await apiFetch(`/tlr/submissions/${submissionId}/calculate`, {
        method: "POST",
      });

      toast.success("Scores calculated successfully!");
      const updated = await apiFetch(`/tlr/submissions/${submissionId}`);
      setSubmission(updated);
    } catch (err: any) {
      toast.error(`Error calculating scores: ${err.message}`);
    } finally {
      setCalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Submission not found.</p>
        <Link href="/dashboard/tlr" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to TLR →
        </Link>
      </div>
    );
  }

  const scores = submission.tlr_scores?.[0];
  console.log("Scores:", scores);
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/tlr" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {submission.institutions?.name || "Submission"}
            </h1>
            <Badge variant={submission.status === "approved" ? "default" : "outline"}>
              {submission.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Academic Year: {submission.academic_year}</p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/dashboard/tlr/${submissionId}/evidence`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
            Evidence
          </Link>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {calculating ? "Calculating..." : "Calculate Scores"}
          </button>
        </div>
      </div>

      {/* Score Cards */}
      {scores && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {parameterConfig.map((p) => (
            <ScoreCard
              key={p.key}
              label={p.label}
              abbreviation={p.abbr}
              score={scores[`${p.key}_score`] || 0}
              max={p.key === "fsr" ? 30 : p.key === "oe" || p.key === "mir" ? 5 : 20}
              color={p.color}
            />
          ))}
        </div>
      )}

      {scores && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Total TLR Score
                </p>
                <p className="text-4xl font-extrabold text-foreground mt-1">
                  {scores.total_score}
                  <span className="text-lg font-medium text-muted-foreground">/100</span>
                </p>
              </div>
              <div className="w-48">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${scores.total_score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">{scores.total_score}% readiness</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameter Entry Tabs */}
      <Tabs defaultValue="ss" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {parameterConfig.map((p) => (
            <TabsTrigger key={p.key} value={p.key} className="text-xs sm:text-sm">
              {p.abbr}
            </TabsTrigger>
          ))}
        </TabsList>

        <ParameterTabContent
          paramKey="ss"
          title="Student Strength (SS)"
          fields={[
            { label: "Total Students", key: "total_students" },
            { label: "UG Students", key: "ug_students" },
            { label: "PG Students", key: "pg_students" },
            { label: "PhD Students", key: "phd_students" },
          ]}
          formData={ssForm}
          onFieldChange={(key, value) => setSsForm({ ...ssForm, [key]: value })}
          onSave={() => saveParameter("ss")}
          saving={saving}
        />

        <ParameterTabContent
          paramKey="fsr"
          title="Faculty-Student Ratio (FSR)"
          fields={[
            { label: "Total Faculty", key: "total_faculty" },
            { label: "Permanent Faculty", key: "permanent_faculty" },
            { label: "Student Count", key: "student_count" },
          ]}
          formData={fsrForm}
          onFieldChange={(key, value) => setFsrForm({ ...fsrForm, [key]: value })}
          onSave={() => saveParameter("fsr")}
          saving={saving}
        />

        <ParameterTabContent
          paramKey="fqe"
          title="Faculty Qualification & Experience (FQE)"
          fields={[
            { label: "Faculty with PhD", key: "faculty_with_phd" },
            { label: "Total Faculty", key: "total_faculty" },
            { label: "Avg Experience (Years)", key: "avg_experience_years" },
          ]}
          formData={fqeForm}
          onFieldChange={(key, value) => setFqeForm({ ...fqeForm, [key]: value })}
          onSave={() => saveParameter("fqe")}
          saving={saving}
        />

        <ParameterTabContent
          paramKey="fru"
          title="Financial Resource Utilization (FRU)"
          fields={[
            { label: "Capital Expenditure (₹)", key: "capital_expenditure" },
            { label: "Operational Expenditure (₹)", key: "operational_expenditure" },
            { label: "Total Budget (₹)", key: "total_budget" },
          ]}
          formData={fruForm}
          onFieldChange={(key, value) => setFruForm({ ...fruForm, [key]: value })}
          onSave={() => saveParameter("fru")}
          saving={saving}
        />

        <ParameterTabContent
          paramKey="oe"
          title="Online Education (OE)"
          fields={[
            { label: "Online Courses Offered", key: "online_courses_offered" },
            { label: "LMS Usage (%)", key: "lms_usage_percentage" },
            { label: "Digital Resources Count", key: "digital_resources_count" },
          ]}
          formData={oeForm}
          onFieldChange={(key, value) => setOeForm({ ...oeForm, [key]: value })}
          onSave={() => saveParameter("oe")}
          saving={saving}
        />

        <ParameterTabContent
          paramKey="mir"
          title="Entry/Exit & IKS (MIR)"
          fields={[
            { label: "Multiple Entry/Exit Programs", key: "multiple_entry_exit_programs" },
            { label: "Regional Language Courses", key: "regional_language_courses" },
            { label: "IKS Courses", key: "iks_courses" },
          ]}
          formData={mirForm}
          onFieldChange={(key, value) => setMirForm({ ...mirForm, [key]: value })}
          onSave={() => saveParameter("mir")}
          saving={saving}
        />
      </Tabs>
    </div>
  );
}
