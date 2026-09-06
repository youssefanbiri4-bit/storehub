"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize, isAllowedProductFileType } from "@/lib/storage/product-files";
import { uploadProductFileAction } from "@/actions/product-files/upload";
import { deleteProductFileAction } from "@/actions/product-files/delete";
import type { ProductFile } from "@/types";

interface ProductFilesManagerProps {
  productId: string;
  files: ProductFile[];
  onFilesChange: (files: ProductFile[]) => void;
  disabled?: boolean;
}

interface UploadState {
  id: string;
  fileName: string;
  status: "uploading" | "success" | "error";
  error?: string;
  file?: File;
}

export function ProductFilesManager({
  productId,
  files,
  onFilesChange,
  disabled,
}: ProductFilesManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  // Keep latest files in ref to avoid stale closure (update via effect, not during render)
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || disabled) return;

      const fileArray = Array.from(selectedFiles);
      // Create stable ids for each upload
      const newUploads: UploadState[] = fileArray.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: f.name,
        status: "uploading" as const,
        file: f,
      }));

      setUploads((prev) => [...prev, ...newUploads]);

      // Accumulate successful files locally to avoid stale `files` closure
      let accumulatedFiles = [...filesRef.current];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const uploadId = newUploads[i].id;

        // Client-side validation (server also validates)
        if (!isAllowedProductFileType(file.type)) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, status: "error" as const, error: "File type not allowed (PDF, ZIP, TXT only)" } : u
            )
          );
          continue;
        }

        if (file.size > 100 * 1024 * 1024) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, status: "error" as const, error: "File too large (max 100 MB)" } : u
            )
          );
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const result = await uploadProductFileAction(productId, formData);

          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? {
                    ...u,
                    status: result.success ? "success" : "error",
                    error: result.error,
                  }
                : u
            )
          );

          if (result.success && result.file) {
            // Use server-returned file data, not locally built storage_path
            const serverFile: ProductFile = {
              id: result.file.id,
              product_id: productId,
              storage_path: result.file.storage_path,
              original_file_name: result.file.original_file_name,
              safe_file_name: result.file.safe_file_name,
              file_extension: result.file.file_extension,
              mime_type: result.file.mime_type,
              file_size: result.file.file_size,
              version: null,
              checksum: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            accumulatedFiles = [...accumulatedFiles, serverFile];
            onFilesChange(accumulatedFiles);
          } else if (result.success && result.fileId) {
            // Fallback if server didn't return file object
            const fallback: ProductFile = {
              id: result.fileId,
              product_id: productId,
              storage_path: `${productId}/${file.name}`,
              original_file_name: file.name,
              safe_file_name: file.name,
              file_extension: file.name.split(".").pop() || null,
              mime_type: file.type,
              file_size: file.size,
              version: null,
              checksum: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            accumulatedFiles = [...accumulatedFiles, fallback];
            onFilesChange(accumulatedFiles);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upload failed";
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, status: "error" as const, error: msg } : u))
          );
        }
      }

      // Clear successful uploads after 3s, keep errors for retry
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status === "error"));
      }, 3000);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [productId, onFilesChange, disabled]
  );

  const handleRetry = useCallback(
    async (uploadId: string) => {
      const upload = uploads.find((u) => u.id === uploadId);
      if (!upload?.file) return;
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, status: "uploading" as const, error: undefined } : u)));
      const file = upload.file;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const result = await uploadProductFileAction(productId, formData);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: result.success ? "success" : "error", error: result.error } : u
          )
        );
        if (result.success && result.file) {
          const serverFile: ProductFile = {
            id: result.file.id,
            product_id: productId,
            storage_path: result.file.storage_path,
            original_file_name: result.file.original_file_name,
            safe_file_name: result.file.safe_file_name,
            file_extension: result.file.file_extension,
            mime_type: result.file.mime_type,
            file_size: result.file.file_size,
            version: null,
            checksum: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const nextFiles = [...filesRef.current, serverFile];
          onFilesChange(nextFiles);
          setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== uploadId)), 1000);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, status: "error" as const, error: msg } : u)));
      }
    },
    [uploads, productId, onFilesChange]
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      if (disabled) return;
      // Optimistic: keep previous for rollback
      const prevFiles = [...filesRef.current];
      const nextFiles = prevFiles.filter((f) => f.id !== fileId);
      onFilesChange(nextFiles);
      const result = await deleteProductFileAction(fileId, productId);
      if (!result.success) {
        // Rollback on failure and show error
        onFilesChange(prevFiles);
        // Could toast, but keep minimal UI: re-add to uploads as error
        setUploads((prev) => [
          ...prev,
          { id: `delete-${fileId}`, fileName: prevFiles.find((f) => f.id === fileId)?.original_file_name || "File", status: "error", error: result.error || "Delete failed" },
        ]);
        setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== `delete-${fileId}`)), 3000);
      }
    },
    [productId, onFilesChange, disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-foreground">Product Files</label>
          <p className="mt-0.5 text-xs text-muted-foreground">Upload private product files (PDF, ZIP, TXT — max 100 MB each)</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          Add Files
        </Button>
      </div>

      <input ref={fileInputRef} type="file" multiple accept=".pdf,.zip,.txt" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          isDragOver ? "border-foreground bg-foreground/5" : "border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or{" "}
          <button type="button" className="font-semibold text-foreground underline underline-offset-2 hover:text-foreground/80" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
            browse
          </button>
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{file.original_file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file_size)}
                  {file.version && ` · v${file.version}`}
                  {!file.is_active && " · Inactive"}
                </p>
              </div>
              {!disabled && (
                <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(file.id)} aria-label={`Delete ${file.original_file_name}`}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-1.5" role="status" aria-live="polite">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              {upload.status === "uploading" && <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" aria-hidden="true" />}
              {upload.status === "success" && <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />}
              {upload.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />}
              <span className="truncate text-muted-foreground">{upload.fileName}</span>
              {upload.error && <span className="text-xs text-destructive truncate">{upload.error}</span>}
              {upload.status === "error" && upload.file && (
                <Button type="button" variant="ghost" size="sm" className="ml-auto h-6 text-xs gap-1" onClick={() => handleRetry(upload.id)}>
                  <RotateCcw className="h-3 w-3" /> Retry
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
