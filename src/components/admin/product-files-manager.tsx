"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
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
  fileName: string;
  progress: "uploading" | "success" | "error";
  error?: string;
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

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || disabled) return;

      const newUploads: UploadState[] = Array.from(selectedFiles).map(
        (f) => ({
          fileName: f.name,
          progress: "uploading" as const,
        })
      );

      setUploads((prev) => [...prev, ...newUploads]);

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Client-side validation
        if (!isAllowedProductFileType(file.type)) {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === newUploads.length + i - newUploads.length + i
                ? { ...u, progress: "error" as const, error: "File type not allowed" }
                : u
            )
          );
          continue;
        }

        if (file.size > 100 * 1024 * 1024) {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === i
                ? { ...u, progress: "error" as const, error: "File too large (max 100 MB)" }
                : u
            )
          );
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadProductFileAction(productId, formData);

        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === i
              ? {
                  ...u,
                  progress: result.success ? "success" : "error",
                  error: result.error,
                }
              : u
          )
        );

        if (result.success && result.fileId) {
          // Add the new file to the list
          const newFile: ProductFile = {
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
          onFilesChange([...files, newFile]);
        }
      }

      // Clear uploads after 3 seconds
      setTimeout(() => setUploads([]), 3000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [productId, files, onFilesChange, disabled]
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      if (disabled) return;
      const result = await deleteProductFileAction(fileId, productId);
      if (result.success) {
        onFilesChange(files.filter((f) => f.id !== fileId));
      }
    },
    [productId, files, onFilesChange, disabled]
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
          <label className="text-sm font-semibold text-foreground">
            Product Files
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload private product files (PDF, ZIP, TXT — max 100 MB each)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Add Files
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.zip,.txt"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          isDragOver
            ? "border-foreground bg-foreground/5"
            : "border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or{" "}
          <button
            type="button"
            className="font-semibold text-foreground underline underline-offset-2 hover:text-foreground/80"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </button>
        </p>
      </div>

      {/* Existing files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
            >
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.original_file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file_size)}
                  {file.version && ` · v${file.version}`}
                  {!file.is_active && " · Inactive"}
                </p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-1.5">
          {uploads.map((upload, i) => (
            <div
              key={`${upload.fileName}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              {upload.progress === "uploading" && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              )}
              {upload.progress === "success" && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              {upload.progress === "error" && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="truncate text-muted-foreground">
                {upload.fileName}
              </span>
              {upload.error && (
                <span className="text-xs text-destructive">
                  {upload.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
