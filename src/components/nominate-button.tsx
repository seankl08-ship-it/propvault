"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NominateButtonProps {
  photoId: string;
  month: string;
  alreadyNominated: boolean;
}

export function NominateButton({
  photoId,
  month,
  alreadyNominated,
}: NominateButtonProps) {
  const [nominated, setNominated] = useState(alreadyNominated);
  const [busy, setBusy] = useState(false);

  async function nominate() {
    if (busy || nominated) return;
    setBusy(true);
    try {
      const res = await fetch("/api/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, month }),
      });
      if (res.ok) setNominated(true);
    } finally {
      setBusy(false);
    }
  }

  if (nominated) {
    return (
      <span className="inline-flex items-center gap-1 font-[family-name:var(--font-montserrat)] text-xs font-semibold text-[var(--ink-3)]">
        <Check className="h-3.5 w-3.5" />
        Nominated
      </span>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={nominate} disabled={busy}>
      {busy ? "Nominating…" : "Nominate"}
    </Button>
  );
}
