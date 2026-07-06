import { supabase } from "../lib/supabase";
import { navigate } from "../lib/router";

export function DeleteContentButton({
  id,
  redirectTo,
  label = "Delete",
  className = "",
  onDeleted,
}: {
  id: number;
  redirectTo?: string;
  label?: string;
  className?: string;
  onDeleted?: () => void;
}) {
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone.",
    );

    if (!confirmed) return;

    const { error } = await supabase.from("content_items").delete().eq("id", id);

    if (error) {
      window.alert(error.message);
      return;
    }

    onDeleted?.();
    if (redirectTo) navigate(redirectTo);
  }

  return (
    <button onClick={handleDelete} className={className} type="button">
      {label}
    </button>
  );
}
