"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UploadPhotosButton({ albumId }: { albumId?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    const total = files.length;
    setProgress({ done: 0, total });

    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      if (albumId) formData.append("albumId", albumId);

      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) failed++;
      setProgress({ done: i + 1, total });
    }

    setUploading(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    if (failed > 0) {
      setError(`${failed} of ${total} upload(s) failed.`);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Upload className="h-4 w-4" />}
        {uploading && progress
          ? `Uploading ${progress.done}/${progress.total}…`
          : "Upload"}
      </Button>
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
}
