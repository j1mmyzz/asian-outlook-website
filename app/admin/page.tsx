import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-4">
        <a href="/admin/content" className="border p-4 rounded-xl">
          Manage Content
        </a>
        <a href="/admin/team" className="border p-4 rounded-xl">
          Manage Team
        </a>
      </div>
    </main>
  );
}
