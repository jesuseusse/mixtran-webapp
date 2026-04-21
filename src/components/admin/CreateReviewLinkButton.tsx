"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreateReviewLinkModal } from "./CreateReviewLinkModal";

/**
 * Thin client wrapper that owns the modal open state.
 * Keeps /dashboard/reviews as a Server Component by isolating
 * the interactive button + modal into this small client island.
 */
export function CreateReviewLinkButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        Crear enlace para reseña
      </Button>
      <CreateReviewLinkModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
