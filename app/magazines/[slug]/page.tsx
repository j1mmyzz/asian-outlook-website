import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/isAdmin";
import DeleteContentButton from "@/components/admin/DeleteContentButton";
import SafeImage from "@/components/SafeImage";
import MagazineFlipbookClient from "@/components/MagazineFlipbookClient";
import DownloadPdfButton from "@/components/DownloadPdfButton";

type MagazineItem = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image_path: string | null;
  pdf_path: string | null;
  created_at: string;
  is_published: boolean;
};

export default async function MagazineDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const admin = await isAdmin();

  const { data: item, error } = await supabase
    .from("content_items")
    .select(
      "id, title, slug, description, cover_image_path, pdf_path, created_at, is_published",
    )
    .eq("type", "magazine")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !item) {
    notFound();
  }

  const coverUrl = item.cover_image_path
    ? supabase.storage.from("covers").getPublicUrl(item.cover_image_path).data
        .publicUrl
    : "/placeholder-magazine.jpg";

  const pdfUrl = item.pdf_path
    ? supabase.storage.from("magazines").getPublicUrl(item.pdf_path).data
        .publicUrl
    : null;

  const fileName = item.pdf_path
    ? item.pdf_path.split("/").pop() || `${item.slug}.pdf`
    : `${item.slug}.pdf`;

  return (
    <main className="min-h-screen bg-slate-100 text-neutral-900">
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white">
              <SafeImage
                src={coverUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
                Asian Outlook
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-neutral-950 md:text-5xl">
                {item.title}
              </h1>

              <div className="mt-8 flex flex-wrap gap-3">
                {pdfUrl && (
                  <>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-blue-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-900"
                    >
                      Open PDF
                    </a>

                    <DownloadPdfButton
                      pdfUrl={pdfUrl}
                      fileName={fileName}
                      className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                    />
                  </>
                )}

                {admin && (
                  <Link
                    href={`/admin/content/${item.id}/edit`}
                    className="rounded-full border border-blue-950 px-6 py-3 text-sm font-medium text-blue-950 transition hover:bg-blue-950 hover:text-white"
                  >
                    Edit Magazine
                  </Link>
                )}

                {admin && (
                  <DeleteContentButton
                    id={item.id}
                    redirectTo="/magazines"
                    label="Delete Magazine"
                    className="rounded-full border border-red-600 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {pdfUrl && (
        <section className="w-full py-12 md:py-16">
          <div className="rounded-none bg-slate-100 lg:mx-6 lg:rounded-[2rem] xl:mx-10">
            <MagazineFlipbookClient pdfUrl={pdfUrl} />
          </div>
        </section>
      )}
    </main>
  );
}
