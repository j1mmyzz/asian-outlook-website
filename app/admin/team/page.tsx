import { createClient } from "@/lib/supabase/server";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("team_members")
    .select("*")
    .order("display_order");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Team</h1>

      <div className="space-y-4">
        {data?.map((member) => (
          <div
            key={member.id}
            className="border p-4 rounded-xl flex justify-between"
          >
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-sm text-gray-500">{member.role}</p>
            </div>

            <a href={`/admin/team/${member.id}/edit`} className="text-blue-600">
              Edit
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
