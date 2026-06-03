"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadAlbumButtonProps {
  photoIds: string[];
  albumName: string;
}

export function DownloadAlbumButton({ photoIds, albumName }: DownloadAlbumButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (busy || photoIds.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/photos/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds }),
      });
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${albumName.replace(/\s+/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  if (photoIds.length === 0) return null;

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={busy}>
      <Download className="h-4 w-4" />
      {busy ? "Zipping…" : `Download Tagged (${photoIds.length})`}
    </Button>
  );
}
