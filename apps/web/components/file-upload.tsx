"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelected?: (file: File) => void;
  onFilesSelected?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSizeMB?: number;
  uploading?: boolean;
}

export function FileUpload({
  onFileSelected,
  onFilesSelected,
  multiple = false,
  accept = ".pdf,.docx,.xlsx,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  uploading = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndSelect = useCallback(
    (files: File[]) => {
      const validFiles: File[] = [];
      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`One or more files exceed the maximum size of ${maxSizeMB}MB.`);
          return;
        }
        validFiles.push(file);
      }
      
      if (validFiles.length > 0) {
        if (multiple && onFilesSelected) {
          onFilesSelected(validFiles);
        } else if (onFileSelected) {
          onFileSelected(validFiles[0]);
        }
      }
    },
    [maxSizeMB, multiple, onFileSelected, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) validateAndSelect(files);
    },
    [validateAndSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) validateAndSelect(files);
    },
    [validateAndSelect]
  );

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <svg
          className={cn("w-10 h-10 mb-3", isDragOver ? "text-primary" : "text-muted-foreground")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.073 4.077A4.5 4.5 0 0118.75 19.5H6.75z"
          />
        </svg>
        <p className="text-sm font-medium text-foreground">
          {uploading ? "Uploading..." : multiple ? "Drag & drop files here" : "Drag & drop file here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or <span className="text-primary font-medium underline">browse</span> to choose {multiple ? "files" : "a file"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          PDF, DOCX, XLSX, JPG, PNG • Max {maxSizeMB}MB
        </p>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>

  );
}
