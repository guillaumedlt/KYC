"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, CheckCircle, FileText, X, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  status: "uploading" | "extracting" | "done" | "error";
  details?: string;
}

interface DocumentDropzoneProps {
  /** Supabase entity ID to attach documents to */
  entityId?: string;
  /** Callback when files are processed */
  onFilesProcessed?: (files: { name: string; type: string; base64: string; extraction?: Record<string, unknown> }[]) => void;
  /** Run AI extraction on uploaded files */
  aiExtract?: boolean;
  /** AI extraction action type */
  extractAction?: "identity" | "address" | "funds" | "company";
  /** Label shown in the dropzone */
  label?: string;
  /** Sublabel */
  sublabel?: string;
  /** Accept file types */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Compact mode (smaller height) */
  compact?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) { reject(new Error("encode failed")); return; }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export function DocumentDropzone({
  entityId,
  onFilesProcessed,
  aiExtract = false,
  extractAction = "identity",
  label = "Glissez-déposez vos documents",
  sublabel = "PDF, JPG, PNG — max 20 Mo",
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  multiple = true,
  compact = false,
}: DocumentDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return;

    const entry: UploadedFile = { file, status: aiExtract ? "extracting" : "uploading" };
    setFiles((prev) => [...prev, entry]);

    try {
      const base64 = await fileToBase64(file);

      if (aiExtract) {
        const res = await fetch("/api/ai-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: extractAction, base64, mediaType: file.type }),
        });

        const result = res.ok ? await res.json() : null;

        setFiles((prev) => prev.map((f) =>
          f.file === file
            ? { ...f, status: result?.confidence > 0 ? "done" : "error", details: result?.confidence ? `Confiance ${result.confidence}%` : "Extraction limitée" }
            : f
        ));

        onFilesProcessed?.([{ name: file.name, type: file.type, base64, extraction: result }]);
      } else {
        setFiles((prev) => prev.map((f) =>
          f.file === file ? { ...f, status: "done" } : f
        ));
        onFilesProcessed?.([{ name: file.name, type: file.type, base64 }]);
      }
    } catch {
      setFiles((prev) => prev.map((f) =>
        f.file === file ? { ...f, status: "error", details: "Erreur" } : f
      ));
    }
  }, [aiExtract, extractAction, onFilesProcessed]);

  function handleFiles(fileList: FileList) {
    const arr = multiple ? Array.from(fileList) : [fileList[0]];
    arr.forEach(processFile);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed transition-all",
          compact ? "px-4 py-3" : "flex-col justify-center px-6 py-6",
          dragOver ? "border-foreground bg-foreground/5 scale-[1.01]" :
          "border-border bg-card hover:border-foreground/20 hover:bg-muted/10",
        )}
      >
        <Upload className={cn("text-muted-foreground", compact ? "h-4 w-4" : "h-6 w-6")} />
        <div className={compact ? "" : "text-center"}>
          <p className={cn("font-medium text-foreground", compact ? "text-[12px]" : "text-[13px]")}>{label}</p>
          <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "mt-0.5 text-[11px]")}>{sublabel}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-md border border-border bg-card divide-y divide-border/50">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                {f.status === "extracting" || f.status === "uploading" ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-foreground" />
                ) : f.status === "done" ? (
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
                <span className="truncate text-[11px] text-foreground">{f.file.name}</span>
                <span className="shrink-0 font-data text-[9px] text-muted-foreground">{(f.file.size / 1024).toFixed(0)} Ko</span>
                {f.status === "extracting" && <span className="shrink-0 text-[9px] text-muted-foreground">Analyse IA...</span>}
                {f.details && f.status !== "extracting" && (
                  <span className={cn("shrink-0 text-[9px]", f.status === "done" ? "text-emerald-600" : "text-amber-600")}>{f.details}</span>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
