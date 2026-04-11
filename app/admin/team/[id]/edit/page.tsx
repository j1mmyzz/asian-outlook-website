"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EditTeam({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", params.id)
        .single();

      setForm(data);
    }

    fetchData();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    await supabase.from("team_members").update(form).eq("id", params.id);

    alert("Updated!");
  }

  if (!form) return <p>Loading...</p>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Edit Member</h1>

      <form onSubmit={handleUpdate} className="space-y-4 border p-6 rounded-xl">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border px-3 py-2"
        />

        <input
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full border px-3 py-2"
        />

        <button className="bg-black text-white px-4 py-2 rounded">
          Update
        </button>
      </form>
    </main>
  );
}
