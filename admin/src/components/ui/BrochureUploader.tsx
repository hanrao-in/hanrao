import React, { useState } from "react";
import { FileText, Upload, Eye, Download, X, Loader2 } from "lucide-react";
import { validateDocumentFile } from "@/lib/imagePipeline";
import { toast } from "sonner";

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

export function BrochureUploader({ value = "", onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFile = (file: File) => {
    const val = validateDocumentFile(file, 15);
    if (!val.valid) {
      toast.error(val.error);
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setLoading(false);
      toast.error("Failed to read file.");
    };
    reader.onload = (e) => {
      setLoading(false);
      const res = e.target?.result as string;
      if (res) {
        onChange(res);
        toast.success(`Brochure "${file.name}" attached.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const isPdf = value.includes("application/pdf") || value.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Project Brochure (PDF / PNG / JPG)
        </label>
        {value && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              download="Project-Brochure"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-destructive font-medium hover:underline"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        )}
      </div>

      {value ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">
                {isPdf ? "PDF Document Brochure" : "Image Brochure"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate font-mono">
                {value.startsWith("data:") ? "Base64 payload ready for upload" : value}
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-secondary transition-colors shrink-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-primary" />}
            <span>Replace File</span>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/10 p-4 text-center cursor-pointer hover:bg-secondary/30 transition-colors">
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <FileText className="h-6 w-6 text-muted-foreground/60" />
          <p className="mt-1 text-xs font-medium text-foreground">
            Click to upload Brochure PDF or Image
          </p>
          <p className="text-[10px] text-muted-foreground">PDF, PNG, JPG up to 15MB</p>
        </label>
      )}

      {/* Preview Modal */}
      {previewOpen && value && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl bg-card p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-base font-semibold">Brochure Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-full p-1 hover:bg-secondary"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden pt-4 min-h-[400px]">
              {isPdf ? (
                <iframe src={value} title="Brochure PDF" className="h-full w-full rounded-lg border border-border" />
              ) : (
                <img src={value} alt="Brochure Preview" className="h-full w-full object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
