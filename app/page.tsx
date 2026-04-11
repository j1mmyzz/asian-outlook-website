import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ContentItem = {
  id: number;
  type: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_path: string | null;
  created_at: string;
};

function getCoverUrl(
  supabaseUrl: string | undefined,
  path: string | null,
): string | null {
  if (!supabaseUrl || !path) return null;
  if (path.startsWith("http")) return path;
  return `${supabaseUrl}/storage/v1/object/public/covers/${path}`;
}

function SectionHeader({
  eyebrow,
  title,
  description,
  href,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-950">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-neutral-600">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="inline-flex w-fit items-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
      >
        View all
      </Link>
    </div>
  );
}

function FeaturedMagazineCard({
  item,
  imageUrl,
}: {
  item: ContentItem;
  imageUrl: string | null;
}) {
  return (
    <Link
      href={`/magazines/${item.slug}`}
      className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative min-h-[320px] overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-200 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Magazine
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            Magazine
          </p>
          <h3 className="text-2xl font-semibold leading-tight">{item.title}</h3>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm leading-6 text-neutral-600">
          {item.description || "View Issue"}
        </p>
      </div>
    </Link>
  );
}

function SimpleCard({
  item,
  hrefBase,
  fallbackLabel,
}: {
  item: ContentItem;
  hrefBase: string;
  fallbackLabel: string;
}) {
  return (
    <Link
      href={`${hrefBase}/${item.slug}`}
      className="group rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-neutral-900 hover:shadow-lg"
    >
      <h3 className="text-xl font-semibold text-neutral-900 transition group-hover:text-blue-900">
        {item.title || fallbackLabel}
      </h3>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        {item.description || fallbackLabel}
      </p>
      <span className="mt-5 inline-block text-sm font-medium text-neutral-900">
        Read more →
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const { data: magazines } = await supabase
    .from("content_items")
    .select("id, type, title, slug, description, cover_image_path, created_at")
    .eq("type", "magazine")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: newsletters } = await supabase
    .from("content_items")
    .select("id, type, title, slug, description, cover_image_path, created_at")
    .eq("type", "newsletter")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: blogs } = await supabase
    .from("content_items")
    .select("id, type, title, slug, description, cover_image_path, created_at")
    .eq("type", "blog")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: mediaItems } = await supabase
    .from("content_items")
    .select("id, type, title, slug, description, cover_image_path, created_at")
    .eq("type", "media")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="bg-slate-100 text-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-blue-950">
        <div className="grid min-h-180 items-stretch lg:grid-cols-[0.7fr_1.3fr]">
          <div className="flex items-center px-6 py-20 md:px-10 md:py-28 lg:px-16">
            <div className="max-w-2xl">
              <p className="mb-4 text-[40px] font-semibold uppercase tracking-[0.25em] text-white">
                Asian Outlook
              </p>

              <p className="mt-6 text-lg leading-8 text-white">
                As the creative, literary and political arm of the Asian Student
                Union at Binghamton University, we publish magazines twice each
                semester, produce podcasts, and host events representing the
                Asian student body and beyond. Although we are an Asian-interest
                publication, we are not Asian exclusive and warmly welcome new
                ideas and voices!
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/magazines"
                  className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
                >
                  Explore Magazines
                </Link>
                <Link
                  href="/about"
                  className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px]">
            <img
              src="/magazine_image.jpg"
              alt="Image of a collection of magazines"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        <SectionHeader
          eyebrow="Featured"
          title="Recent Magazines"
          description="The latest published magazine issues from the database."
          href="/magazines"
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {(magazines ?? []).map((item) => (
            <FeaturedMagazineCard
              key={item.id}
              item={item}
              imageUrl={getCoverUrl(supabaseUrl, item.cover_image_path)}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <SectionHeader
            eyebrow="Updates"
            title="Latest Newsletters"
            description="Recent newsletter entries from the database."
            href="/newsletters"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {(newsletters ?? []).map((item) => (
              <SimpleCard
                key={item.id}
                item={item}
                hrefBase="/newsletters"
                fallbackLabel="Newsletter"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <SectionHeader
            eyebrow="Writing"
            title="From the Blog"
            description="Recent blog entries from the database."
            href="/blogs"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {(blogs ?? []).map((item) => (
              <SimpleCard
                key={item.id}
                item={item}
                hrefBase="/blogs"
                fallbackLabel="Blog"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <SectionHeader
            eyebrow="Multimedia"
            title="Media Production"
            description="Recent media entries from the database."
            href="/media-production"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {(mediaItems ?? []).map((item) => (
              <SimpleCard
                key={item.id}
                item={item}
                hrefBase="/media-production"
                fallbackLabel="Media"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-slate-100 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-black">
                Join the community
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Come to our in person events!{" "}
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-900">
                Follow us on Instagram @asianoutlook and submit to our
                magazine!!!
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/about"
                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
              >
                About Us
              </Link>
              <Link
                href="/search"
                className="rounded-full border border-white/25 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-white/10"
              >
                Search the Site
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
