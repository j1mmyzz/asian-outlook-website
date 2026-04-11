import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteContentButton from "@/components/admin/DeleteContentButton";

export default async function ContentPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">Content</h1>

      <Link
        href="/admin/content/new"
        className="mb-6 inline-block rounded bg-black px-4 py-2 text-white"
      >
        + New Content
      </Link>

      <div className="space-y-4">
        {data?.map((item) => (
          <div
            key={item.id}
            className="flex justify-between rounded-xl border bg-white p-4"
          >
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-500">{item.type}</p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href={`/admin/content/${item.id}/edit`}
                className="text-sm font-medium text-blue-600"
              >
                Edit
              </Link>

              <DeleteContentButton
                id={item.id}
                className="text-sm font-medium text-red-600"
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
