"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeletePhotoButtonProps {
  photoId: string;
  redirectTo?: string;
}

export function DeletePhotoButton({ photoId, redirectTo }: DeletePhotoButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      setError("Failed to delete photo.");
      return;
    }

    setOpen(false);
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Delete"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/50 text-white backdrop-blur hover:bg-[var(--destructive)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete photo</DialogTitle>
          <DialogDescription>
            Permanently delete this photo? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
