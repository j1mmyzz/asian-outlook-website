"use client";

import { createClient } from "@/lib/supabase/client";

export default function DeleteContentButton({
  id,
  redirectTo,
  label = "Delete",
  className = "",
}: {
  id: number;
  redirectTo?: string;
  label?: string;
  className?: string;
}) {
  const supabase = createClient();

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?",
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("content_items")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (redirectTo) {
      window.location.href = redirectTo;
      return;
    }

    window.location.reload();
  }

  return (
    <button onClick={handleDelete} className={className} type="button">
      {label}
    </button>
  );
}
