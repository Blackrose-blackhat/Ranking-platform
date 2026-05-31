"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";

const API = "http://localhost:8080";

const paramLabels: Record<string, string> = {
  SS: "Student Strength",
  FSR: "Faculty-Student Ratio",
  FQE: "Faculty Qualification",
  FRU: "Financial Resources",
  OE: "Online Education",
  MIR: "Entry/Exit & IKS",
};

export default function EvidencePage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);
  const supabase = createClient();

  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedParam, setSelectedParam] = useState("SS");

  useEffect(() => {
    fetchEvidence();
  }, [submissionId]);

  // Real-time polling effect to monitor background validation status
  useEffect(() => {
    const hasPending = evidence.some((doc) => doc.validation_status === "pending");
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(`/tlr/submissions/${submissionId}/evidence`);
        setEvidence(data);
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [submissionId, evidence]);

  async function fetchEvidence() {
    setLoading(true);
    try {
      const data = await apiFetch(`/tlr/submissions/${submissionId}/evidence`);
      setEvidence(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleFilesSelected(files: File[]) {
    setUploading(true);

    try {
      const items: any[] = [];
      let successCount = 0;

      // Upload all files in parallel
      await Promise.all(
        files.map(async (file) => {
          // 1. Get signed upload URL
          const { signedUrl, filePath } = await apiFetch(`/tlr/submissions/${submissionId}/upload-url`, {
            method: "POST",
            body: JSON.stringify({ fileName: file.name }),
          });

          // 2. Upload to storage
          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadRes.ok) {
            throw new Error(`Failed to upload file ${file.name}`);
          }

          items.push({
            parameter_type: selectedParam,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
          });
          successCount++;
        })
      );

      // 3. Register bulk evidence documents & trigger workers
      if (items.length > 0) {
        await apiFetch(`/tlr/submissions/${submissionId}/evidence/bulk`, {
          method: "POST",
          body: JSON.stringify({ items }),
        });
        toast.success(`Successfully uploaded and queued ${successCount} document(s) for validation.`);
      }

      fetchEvidence();
    } catch (err: any) {
      toast.error(`Error during upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/tlr/${submissionId}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Evidence Documents</h1>
          <p className="text-muted-foreground mt-1">Upload and manage supporting evidence for your TLR submission.</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Parameter Type
            </label>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              {Object.entries(paramLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {key} — {label}
                </option>
              ))}
            </select>
          </div>
          <FileUpload multiple onFilesSelected={handleFilesSelected} uploading={uploading} />
        </CardContent>
      </Card>

      {/* Evidence List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents ({evidence.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : evidence.length > 0 ? (
            <div className="divide-y divide-border">
              {evidence.map((doc: any) => (
                <div key={doc.id} className="flex items-start justify-between py-4 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mt-0.5">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {paramLabels[doc.parameter_type] || doc.parameter_type} •{" "}
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "—"} •{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.validation_notes && (
                        <p className="text-xs text-muted-foreground mt-1 bg-accent/40 p-1.5 rounded border border-border/50 max-w-xl">
                          {doc.validation_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      doc.validation_status === "valid"
                        ? "default"
                        : doc.validation_status === "invalid"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {doc.validation_status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              <p className="text-sm text-muted-foreground">No evidence uploaded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
