import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/isAdmin";
import DeleteContentButton from "@/components/admin/DeleteContentButton";
import MagazineArchive from "@/components/MagazineArchive";

/**
 *  got description but won't use because I initially
 *  started with the idea of adding a magazine description
 *  but realized I don't need it and I don't wanna break
 *  anything so I'm just gonna leave it in the code.
 */

type ContentItem = {
  id: number;
  title: string;
  slug: string;
  description: string | null; // ignore ^^
  cover_image_path: string | null;
  created_at: string;
  type: string;
  is_published: boolean;
};

function getImageUrl(path: string | null) {
  if (!path) return "/placeholder-magazine.jpg";
  if (path.startsWith("http")) return path;

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}`;
}

function getPdfUrl(path: string | null) {
  if (!path) return null;

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/magazines/${path}`;
}

function FeaturedMagazine({
  item,
  admin,
}: {
  item: ContentItem;
  admin: boolean;
}) {
  return (
    <div className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[320px] overflow-hidden">
          <img
            src={getImageUrl(item.cover_image_path)}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col justify-center p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-950">
            Featured Issue
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
            {item.title}
          </h2>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/magazines/${item.slug}`}
              className="inline-flex rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-950"
            >
              Open Issue
            </Link>

            {admin && (
              <Link
                href={`/admin/content/${item.id}/edit`}
                className="inline-flex rounded-full border border-blue-950 px-5 py-3 text-sm font-medium text-blue-950 transition hover:bg-blue-950 hover:text-white"
              >
                Edit Magazine
              </Link>
            )}

            {admin && (
              <DeleteContentButton
                id={item.id}
                redirectTo="/magazines"
                label="Delete Magazine"
                className="inline-flex rounded-full border border-red-600 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function MagazinesPage() {
  const supabase = await createClient();
  const admin = await isAdmin();

  const { data: magazines, error } = await supabase
    .from("content_items")
    .select(
      "id, title, slug, description, cover_image_path, created_at, type, is_published",
    )
    .eq("type", "magazine")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-20 text-neutral-900">
        <div className="mx-auto max-w-7xl">
          <p className="text-red-600">Failed to load magazines.</p>
        </div>
      </main>
    );
  }

  const featured = magazines?.[0];
  const archive = magazines?.slice(1) || [];

  return (
    <main className="min-h-screen bg-slate-100 text-neutral-900">
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
                Asian Outlook
              </p>

              <h1 className="text-5xl font-bold tracking-tight text-neutral-950 md:text-6xl">
                Magazines
              </h1>

              <p className="mt-6 text-lg leading-8 text-neutral-700">
                As the literary, political and creative arm of the Asian Student
                Union, we aim to amplify the voices of students and their
                communities. Check out our past issues below!
              </p>
            </div>

            {admin && (
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/content/new?type=magazine"
                  className="rounded-full bg-blue-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-900"
                >
                  + Add Magazine
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {admin && (
        <section className="mx-auto max-w-7xl mb-6 px-6 pt-8 md:px-10">
          <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-950">
              Admin Mode
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              You are signed in as an admin. Use the add button above or the
              edit links on each magazine card to update this page.
            </p>
          </div>
        </section>
      )}

      {featured && (
        <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
          <FeaturedMagazine item={featured} admin={admin} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10 md:pb-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-950">
              Past Issues
            </h2>
            <p className="mt-3 text-base leading-7 text-neutral-600">
              Browse previous publications and featured issues from the archive.
            </p>
          </div>
        </div>

        <MagazineArchive items={archive} admin={admin} />
      </section>
    </main>
  );
}
