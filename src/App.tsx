import { FormEvent, useEffect, useMemo, useState } from "react";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { DeleteContentButton } from "./components/DeleteContentButton";
import { DownloadPdfButton } from "./components/DownloadPdfButton";
import { MagazineFlipbook } from "./components/MagazineFlipbook";
import { SafeImage } from "./components/SafeImage";
import { Link, navigate, useLocation } from "./lib/router";
import { publicStorageUrl, supabase } from "./lib/supabase";
import type { ContentItem, ContentType, TeamMember } from "./types";

const contentSelect =
  "id, type, title, slug, description, cover_image_path, pdf_path, created_at, is_published";

const contentLabels: Record<ContentType, { plural: string; singular: string; path: string }> = {
  magazine: { plural: "Magazines", singular: "Magazine", path: "/magazines" },
  blog: { plural: "Blogs", singular: "Blog", path: "/blogs" },
  newsletter: {
    plural: "Newsletters",
    singular: "Newsletter",
    path: "/newsletters",
  },
  media: {
    plural: "Media Production",
    singular: "Media",
    path: "/media-production",
  },
};

function useContent(type?: ContentType, limit?: number) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadContent() {
      setLoading(true);
      setError("");

      let query = supabase
        .from("content_items")
        .select(contentSelect)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (type) query = query.eq("type", type);
      if (limit) query = query.limit(limit);

      const { data, error: queryError } = await query;

      if (!mounted) return;
      if (queryError) setError(queryError.message);
      setItems((data as ContentItem[]) || []);
      setLoading(false);
    }

    loadContent();
    return () => {
      mounted = false;
    };
  }, [type, limit]);

  return { items, loading, error };
}

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      setAdminError("");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setSignedIn(false);
          setLoading(false);
        }
        return;
      }

      if (mounted) setSignedIn(true);

      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mounted) {
        setIsAdmin(!error && Boolean(data));
        setAdminError(error?.message || "");
        setLoading(false);
      }
    }

    checkAdmin();
    return () => {
      mounted = false;
    };
  }, []);

  return { adminError, isAdmin, loading, signedIn };
}

function PageShell({
  eyebrow = "Asian Outlook",
  title,
  description,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-100 text-neutral-900">
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
                {eyebrow}
              </p>
              <h1 className="text-5xl font-bold tracking-tight text-neutral-950 md:text-6xl">
                {title}
              </h1>
              {description && (
                <p className="mt-6 text-lg leading-8 text-neutral-700">
                  {description}
                </p>
              )}
            </div>
            {actions}
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}

function LoadingMessage({ label = "Loading content..." }: { label?: string }) {
  return (
    <p className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-700" role="status">
      {label}
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700" role="alert">
      {message}
    </p>
  );
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
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-neutral-600">
          {description}
        </p>
      </div>
      <Link href={href} className="button-secondary">
        View all
      </Link>
    </div>
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
    <Link href={`${hrefBase}/${item.slug}`} className="card-link group p-6">
      <h3 className="text-xl font-semibold text-neutral-900 transition group-hover:text-blue-900">{item.title || fallbackLabel}</h3>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        {item.description || fallbackLabel}
      </p>
      <span className="mt-5 inline-block text-sm font-medium text-neutral-900">
        Read more →
      </span>
    </Link>
  );
}

function HomePage() {
  const magazines = useContent("magazine", 3);
  const newsletters = useContent("newsletter", 3);
  const blogs = useContent("blog", 3);
  const media = useContent("media", 3);

  return (
    <main className="bg-slate-100 text-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-blue-950">
        <div className="grid min-h-[720px] items-stretch lg:grid-cols-[0.7fr_1.3fr]">
          <div className="flex items-center px-6 py-20 md:px-10 md:py-28 lg:px-16">
            <div className="max-w-2xl">
              <h1 className="text-[40px] font-semibold uppercase tracking-[0.25em] text-white">
                Asian Outlook
              </h1>
              <p className="mt-6 text-lg leading-8 text-white">
                As the creative, literary and political arm of the Asian Student
                Union at Binghamton University, we publish magazines twice each
                semester, produce podcasts, and host events representing the
                Asian student body and beyond. Although we are an Asian-interest
                publication, we are not Asian exclusive and warmly welcome new
                ideas and voices!
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/magazines" className="button-light">
                  Explore Magazines
                </Link>
                <Link href="/about" className="button-light">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
          <div className="relative min-h-[420px]">
            <img
              src="/magazine_image.jpg"
              alt="A collection of Asian Outlook magazines"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
        <SectionHeader
          eyebrow="Featured"
          title="Recent Magazines"
          description="The latest published magazine issues from the database."
          href="/magazines"
        />
        {magazines.error && <ErrorMessage message="Failed to load magazines." />}
        {magazines.loading ? (
          <LoadingMessage />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {magazines.items.map((item) => (
              <Link key={item.id} href={`/magazines/${item.slug}`} className="card-link group overflow-hidden">
                <div className="relative min-h-[320px] overflow-hidden bg-neutral-100">
                  <SafeImage
                    src={publicStorageUrl("covers", item.cover_image_path) || "/magazine_image.jpg"}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Magazine
                    </p>
                    <h3 className="text-2xl font-semibold leading-tight">{item.title}</h3>
                  </div>
                </div>
                <p className="p-6 text-sm leading-6 text-neutral-600">
                  {item.description || "View issue"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {[
        { data: newsletters, eyebrow: "Updates", title: "Latest Newsletters", href: "/newsletters", label: "Newsletter" },
        { data: blogs, eyebrow: "Writing", title: "From the Blog", href: "/blogs", label: "Blog" },
        { data: media, eyebrow: "Multimedia", title: "Media Production", href: "/media-production", label: "Media" },
      ].map((section, index) => (
        <section
          key={section.href}
          className={`border-t border-neutral-200 ${index % 2 === 0 ? "bg-white" : "bg-slate-100"}`}
        >
          <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
            <SectionHeader
              eyebrow={section.eyebrow}
              title={section.title}
              description={`Recent ${section.label.toLowerCase()} entries from the database.`}
              href={section.href}
            />
            {section.data.loading ? (
              <LoadingMessage />
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {section.data.items.map((item) => (
                  <SimpleCard
                    key={item.id}
                    item={item}
                    hrefBase={section.href}
                    fallbackLabel={section.label}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      <section className="border-t border-neutral-200 bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
                Join the community
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Come to our in person events!
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-900">
                Follow us on Instagram @asianoutlook and submit to our
                magazine!!!
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/about" className="button-primary">
                About Us
              </Link>
              <Link href="/search" className="button-secondary">
                Search the Site
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MagazineCard({ item, admin, onDeleted }: { item: ContentItem; admin: boolean; onDeleted?: () => void }) {
  return (
    <article className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/magazines/${item.slug}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950">
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
          <SafeImage
            src={publicStorageUrl("covers", item.cover_image_path) || "/magazine_image.jpg"}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]">Magazine</p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">{item.title}</h3>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-4 p-5">
        <Link href={`/magazines/${item.slug}`} className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline">
          View Issue
        </Link>
        {admin && (
          <Link href={`/admin/content/${item.id}/edit`} className="text-sm font-medium text-blue-950 underline-offset-4 hover:underline">
            Edit
          </Link>
        )}
        {admin && (
          <DeleteContentButton
            id={item.id}
            redirectTo="/magazines"
            label="Delete"
            className="text-sm font-medium text-red-700 underline-offset-4 hover:underline"
            onDeleted={onDeleted}
          />
        )}
      </div>
    </article>
  );
}

function MagazinesPage() {
  const { items, loading, error } = useContent("magazine");
  const { isAdmin } = useIsAdmin();
  const [visibleCount, setVisibleCount] = useState(6);
  const [localItems, setLocalItems] = useState<ContentItem[]>([]);

  useEffect(() => setLocalItems(items), [items]);

  const featured = localItems[0];
  const archive = localItems.slice(1);
  const visibleArchive = archive.slice(0, visibleCount);

  return (
    <PageShell
      title="Magazines"
      description="As the literary, political and creative arm of the Asian Student Union, we aim to amplify the voices of students and their communities. Check out our past issues below."
      actions={
        isAdmin && (
          <Link href="/admin/content/new?type=magazine" className="button-primary">
            Add Magazine
          </Link>
        )
      }
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        {error && <ErrorMessage message="Failed to load magazines." />}
        {loading && <LoadingMessage />}
        {featured && (
          <article className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[320px] overflow-hidden">
                <SafeImage
                  src={publicStorageUrl("covers", featured.cover_image_path) || "/magazine_image.jpg"}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
                  Featured Issue
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
                  {featured.title}
                </h2>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={`/magazines/${featured.slug}`} className="button-primary">
                    Open Issue
                  </Link>
                  {isAdmin && (
                    <Link href={`/admin/content/${featured.id}/edit`} className="button-secondary">
                      Edit Magazine
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10 md:pb-24">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-950">
            Past Issues
          </h2>
          <p className="mt-3 text-base leading-7 text-neutral-600">
            Browse previous publications and featured issues from the archive.
          </p>
        </div>
        {archive.length === 0 && !loading ? (
          <p className="rounded-[1.75rem] border border-neutral-200 bg-white p-8 text-neutral-600">
            No archived magazines yet.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {visibleArchive.map((item) => (
              <MagazineCard
                key={item.id}
                item={item}
                admin={isAdmin}
                onDeleted={() => setLocalItems((prev) => prev.filter((entry) => entry.id !== item.id))}
              />
            ))}
          </div>
        )}
        {visibleCount < archive.length && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 6)}
              className="button-secondary"
            >
              Show more magazines
            </button>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function ContentListPage({ type }: { type: Exclude<ContentType, "magazine"> }) {
  const { items, loading, error } = useContent(type);
  const labels = contentLabels[type];

  return (
    <PageShell
      title={labels.plural}
      description={`Browse Asian Outlook ${labels.plural.toLowerCase()} entries.`}
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        {error && <ErrorMessage message={`Failed to load ${labels.plural.toLowerCase()}.`} />}
        {loading ? (
          <LoadingMessage />
        ) : items.length === 0 ? (
          <p className="rounded-[1.75rem] border border-neutral-200 bg-white p-8 text-neutral-600">
            No {labels.plural.toLowerCase()} published yet.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {items.map((item) => (
              <SimpleCard
                key={item.id}
                item={item}
                hrefBase={labels.path}
                fallbackLabel={labels.singular}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function ContentDetailPage({ type, slug }: { type: ContentType; slug: string }) {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAdmin } = useIsAdmin();
  const labels = contentLabels[type];

  useEffect(() => {
    let mounted = true;

    async function loadItem() {
      const { data, error: queryError } = await supabase
        .from("content_items")
        .select(contentSelect)
        .eq("type", type)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (!mounted) return;
      setItem((data as ContentItem) || null);
      setError(queryError?.message || "");
      setLoading(false);
    }

    loadItem();
    return () => {
      mounted = false;
    };
  }, [slug, type]);

  if (loading) {
    return (
      <PageShell title={labels.singular}>
        <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <LoadingMessage />
        </section>
      </PageShell>
    );
  }

  if (error || !item) {
    return (
      <PageShell title="Not found">
        <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <ErrorMessage message="This item could not be found." />
        </section>
      </PageShell>
    );
  }

  const coverUrl = publicStorageUrl("covers", item.cover_image_path) || "/magazine_image.jpg";
  const pdfUrl = publicStorageUrl("magazines", item.pdf_path);
  const fileName = item.pdf_path?.split("/").pop() || `${item.slug}.pdf`;

  return (
    <PageShell
      title={item.title}
      eyebrow={labels.singular}
      description={item.description || undefined}
      actions={
        isAdmin && (
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/content/${item.id}/edit`} className="button-secondary">
              Edit
            </Link>
            <DeleteContentButton
              id={item.id}
              redirectTo={labels.path}
              label="Delete"
              className="rounded-full border border-red-700 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            />
          </div>
        )
      }
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        {type === "magazine" ? (
          <>
            <div className="grid gap-8 lg:grid-cols-[0.45fr_0.55fr]">
              <SafeImage
                src={coverUrl}
                alt={`Cover for ${item.title}`}
                className="w-full rounded-lg border border-neutral-200 bg-white object-cover shadow-sm"
              />
              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-neutral-950">Read this issue</h2>
                <p className="mt-3 text-base leading-7 text-neutral-700">
                  Use the accessible PDF controls below, or download the file to
                  read it in your preferred PDF reader.
                </p>
                {pdfUrl ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={pdfUrl} className="button-primary" target="_blank" rel="noreferrer">
                      Open PDF in new tab
                    </a>
                    <DownloadPdfButton pdfUrl={pdfUrl} fileName={fileName} className="button-secondary" />
                  </div>
                ) : (
                  <ErrorMessage message="No PDF is available for this issue." />
                )}
              </div>
            </div>
            {pdfUrl && <MagazineFlipbook pdfUrl={pdfUrl} />}
          </>
        ) : (
          <article className="rounded-[1.75rem] border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-lg leading-8 text-neutral-700">
              {item.description || "More details will be published soon."}
            </p>
          </article>
        )}
      </section>
    </PageShell>
  );
}

function AboutPage() {
  const boardSections = [
    { title: "Leadership", members: [{ role: "President", names: ["Rui Zheng"] }, { role: "Vice President", names: ["Anderson Li"] }, { role: "Secretary", names: ["Stephanie Zhou"] }] },
    { title: "Editorial Team", members: [{ role: "Editor-In-Chief", names: ["Kate Sum"] }, { role: "Conscience Editor", names: ["Shirley Zhang"] }, { role: "Copy Editors", names: ["Annie Ngo", "Ellie Kim", "Lauren Jim"] }, { role: "Copy Interns", names: ["Ava Gabriel", "Lindsay Chen"] }] },
    { title: "Layout Team", members: [{ role: "Layout Editors", names: ["Ianna Choi", "Jimmy Zheng", "Kimberly Cheong", "Mandy Guan"] }, { role: "Layout Interns", names: ["Lise Kubota", "Reema Kaur"] }] },
    { title: "Operations", members: [{ role: "Publicity Chairs", names: ["Kristen Li", "Suguru D'Agostino"] }, { role: "Fundraising Chair", names: ["Madison Hernandez"] }, { role: "Event Coordinators", names: ["Andy Huang", "Madison Lee"] }, { role: "Political Coordinator", names: ["Grace Lim"] }, { role: "Historians", names: ["Jacky Jiang", "Lia Tsin"] }] },
    { title: "Media Team", members: [{ role: "Media Producers", names: ["Brady Overtoom", "Donovan Lai", "Jasmin Pais", "Lydia Luo"] }] },
    { title: "Additional Staff", members: [{ role: "Senior Advisor", names: ["Carmen Tan"] }, { role: "General Interns", names: ["Andrea Hsu", "Gabriel Marasigan", "Ryan Shin", "Scarlett Kennedy"] }] },
  ];

  return (
    <PageShell
      title="About Us"
      description="Asian Outlook serves as the creative, literary, and political arm of the Asian Student Union at Binghamton University."
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
            Spring 2026
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
            Executive Board
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {boardSections.map((section) => (
            <section key={section.title} className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold tracking-tight text-neutral-950">{section.title}</h3>
              <dl className="mt-5 space-y-5">
                {section.members.map((member) => (
                  <div key={member.role}>
                    <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-950">
                      {member.role}
                    </dt>
                    <dd className="mt-2 text-base text-neutral-700">{member.names.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function CreditsPage() {
  return (
    <PageShell title="Credits">
      <section className="flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <p className="text-lg text-neutral-700">Site made by</p>
          <p className="mt-2 text-5xl font-extrabold text-black md:text-7xl">
            Jimmy Zheng
          </p>
          <p className="mt-6 text-lg text-neutral-700">
            Thank you to everyone who contributed to the magazine.
          </p>
          <div className="mt-10">
            <Link href="/" className="button-primary">
              Back Home
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const { items, loading } = useContent();
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return items.filter((item) =>
      [item.title, item.description, item.type]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    );
  }, [items, query]);

  return (
    <PageShell title="Search" description="Search published Asian Outlook content.">
      <section className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <label htmlFor="site-search" className="block text-sm font-semibold text-neutral-900">
          Search terms
        </label>
        <input
          id="site-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
          placeholder="Search by title, description, or type"
          type="search"
        />
        <div className="mt-8" aria-live="polite">
          {loading && <LoadingMessage label="Loading searchable content..." />}
          {!loading && query && results.length === 0 && (
            <p className="rounded-lg border border-neutral-200 bg-white p-6 text-neutral-700">
              No results found.
            </p>
          )}
          <div className="grid gap-4">
            {results.map((item) => (
              <SimpleCard
                key={item.id}
                item={item}
                hrefBase={contentLabels[item.type].path}
                fallbackLabel={contentLabels[item.type].singular}
              />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (loginError) {
      setError(loginError.message);
      return;
    }

    navigate("/admin");
  }

  return (
    <PageShell title="Admin Login">
      <section className="mx-auto max-w-md px-6 py-14">
        <form onSubmit={handleLogin} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
              Email
            </label>
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
              Password
            </label>
            <input
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button className="button-primary w-full justify-center" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </PageShell>
  );
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { adminError, isAdmin, loading, signedIn } = useIsAdmin();

  if (loading) {
    return (
      <PageShell title="Admin">
        <section className="mx-auto max-w-5xl px-6 py-14">
          <LoadingMessage label="Checking admin access..." />
        </section>
      </PageShell>
    );
  }

  if (!signedIn) {
    return (
      <PageShell title="Admin access required">
        <section className="mx-auto max-w-5xl px-6 py-14">
          <ErrorMessage message="Please sign in with an admin account to access this page." />
          <div className="mt-6">
            <Link href="/admin/login" className="button-primary">
              Go to admin login
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell title="Admin access required">
        <section className="mx-auto max-w-5xl px-6 py-14">
          <ErrorMessage
            message={
              adminError
                ? `You are signed in, but admin access could not be verified: ${adminError}`
                : "You are signed in, but this account is not listed as an admin."
            }
          />
        </section>
      </PageShell>
    );
  }

  return <>{children}</>;
}

function AdminDashboard() {
  return (
    <RequireAdmin>
      <PageShell title="Admin Dashboard">
        <section className="mx-auto max-w-5xl px-6 py-14">
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin/content" className="card-link p-6">
              <h2 className="text-xl font-semibold">Manage Content</h2>
              <p className="mt-2 text-neutral-600">Create, edit, or delete content items.</p>
            </Link>
            <Link href="/admin/team" className="card-link p-6">
              <h2 className="text-xl font-semibold">Manage Team</h2>
              <p className="mt-2 text-neutral-600">Edit team member information.</p>
            </Link>
          </div>
        </section>
      </PageShell>
    </RequireAdmin>
  );
}

function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("content_items")
      .select(contentSelect)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as ContentItem[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <RequireAdmin>
      <PageShell
        title="Content"
        actions={<Link href="/admin/content/new" className="button-primary">New Content</Link>}
      >
        <section className="mx-auto max-w-6xl px-6 py-14">
          {loading ? <LoadingMessage /> : (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="flex flex-col justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                  <div>
                    <h2 className="font-semibold text-neutral-950">{item.title}</h2>
                    <p className="text-sm text-neutral-600">{contentLabels[item.type].singular}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/admin/content/${item.id}/edit`} className="text-sm font-medium text-blue-950 underline-offset-4 hover:underline">
                      Edit
                    </Link>
                    <DeleteContentButton
                      id={item.id}
                      className="text-sm font-medium text-red-700 underline-offset-4 hover:underline"
                      onDeleted={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </RequireAdmin>
  );
}

function ContentForm({ id }: { id?: string }) {
  const searchParams = new URLSearchParams(window.location.search);
  const initialType = (searchParams.get("type") || "") as ContentType | "";
  const [type, setType] = useState<ContentType | "">(initialType);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("content_items")
      .select(contentSelect)
      .eq("id", id)
      .single()
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        if (data) {
          const item = data as ContentItem;
          setType(item.type);
          setTitle(item.title);
          setSlug(item.slug);
          setPdfPath(item.pdf_path);
          setCoverPath(item.cover_image_path);
        }
        setLoading(false);
      });
  }, [id]);

  async function uploadAssets() {
    let nextPdfPath = pdfPath;
    let nextCoverPath = coverPath;

    if (type === "magazine" && !id && (!pdfFile || !coverFile)) {
      throw new Error("PDF and cover image are required for new magazines.");
    }

    if (pdfFile) {
      const path = `${slug}/${Date.now()}-${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage.from("magazines").upload(path, pdfFile);
      if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`);
      nextPdfPath = path;
    }

    if (coverFile) {
      const path = `${slug}/${Date.now()}-${coverFile.name}`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, coverFile);
      if (uploadError) throw new Error(`Cover upload failed: ${uploadError.message}`);
      nextCoverPath = path;
    }

    return { nextPdfPath, nextCoverPath };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!type) throw new Error("Please select a content type.");
      if (!title.trim()) throw new Error("Title is required.");
      if (!slug.trim()) throw new Error("Slug is required.");

      const { nextPdfPath, nextCoverPath } = await uploadAssets();
      const payload = {
        type,
        title: title.trim(),
        slug: slug.trim(),
        description: null,
        pdf_path: nextPdfPath,
        cover_image_path: nextCoverPath,
        is_published: true,
      };

      const { error: saveError } = id
        ? await supabase.from("content_items").update(payload).eq("id", id)
        : await supabase.from("content_items").insert(payload);

      if (saveError) throw new Error(saveError.message);
      navigate(type === "magazine" ? "/magazines" : contentLabels[type].path);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save content.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingMessage label="Loading content form..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="content-type" className="block text-sm font-medium text-neutral-900">Content type</label>
        <select id="content-type" value={type} onChange={(event) => setType(event.target.value as ContentType)} className="form-input" required>
          <option value="" disabled>Select type</option>
          <option value="magazine">Magazine</option>
          <option value="blog">Blog</option>
          <option value="newsletter">Newsletter</option>
          <option value="media">Media</option>
        </select>
      </div>
      <div>
        <label htmlFor="content-title" className="block text-sm font-medium text-neutral-900">Title</label>
        <input id="content-title" value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" required />
      </div>
      <div>
        <label htmlFor="content-slug" className="block text-sm font-medium text-neutral-900">Slug</label>
        <input id="content-slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="form-input" required />
      </div>
      {type === "magazine" && (
        <>
          <div>
            <label htmlFor="content-pdf" className="block text-sm font-medium text-neutral-900">
              {id ? "Replace PDF" : "PDF"}
            </label>
            <input id="content-pdf" type="file" accept="application/pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} className="mt-2 w-full text-sm" required={!id} />
            {pdfPath && <p className="mt-2 text-sm text-neutral-600">Current PDF: {pdfPath}</p>}
          </div>
          <div>
            <label htmlFor="content-cover" className="block text-sm font-medium text-neutral-900">
              {id ? "Replace cover image" : "Cover image"}
            </label>
            <input id="content-cover" type="file" accept="image/*" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className="mt-2 w-full text-sm" required={!id} />
            {coverPath && <p className="mt-2 text-sm text-neutral-600">Current cover: {coverPath}</p>}
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" disabled={saving} className="button-primary">
        {saving ? "Saving..." : id ? "Update Content" : "Save Content"}
      </button>
    </form>
  );
}

function AdminContentFormPage({ id }: { id?: string }) {
  return (
    <RequireAdmin>
      <PageShell title={id ? "Edit Content" : "New Content"}>
        <section className="mx-auto max-w-3xl px-6 py-14">
          <ContentForm id={id} />
        </section>
      </PageShell>
    </RequireAdmin>
  );
}

function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    supabase
      .from("team_members")
      .select("*")
      .order("display_order")
      .then(({ data }) => setMembers((data as TeamMember[]) || []));
  }, []);

  return (
    <RequireAdmin>
      <PageShell title="Team">
        <section className="mx-auto max-w-5xl px-6 py-14">
          <div className="space-y-4">
            {members.map((member) => (
              <article key={member.id} className="flex justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div>
                  <h2 className="font-semibold">{member.name}</h2>
                  <p className="text-sm text-neutral-600">{member.role}</p>
                </div>
                <Link href={`/admin/team/${member.id}/edit`} className="text-blue-950 underline-offset-4 hover:underline">
                  Edit
                </Link>
              </article>
            ))}
          </div>
        </section>
      </PageShell>
    </RequireAdmin>
  );
}

function NotFoundPage() {
  return (
    <PageShell title="Page not found">
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <p className="text-neutral-700">We could not find the page you requested.</p>
        <div className="mt-6">
          <Link href="/" className="button-primary">Back Home</Link>
        </div>
      </section>
    </PageShell>
  );
}

function RouteSwitch({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);

  if (pathname === "/") return <HomePage />;
  if (pathname === "/magazines") return <MagazinesPage />;
  if (parts[0] === "magazines" && parts[1]) return <ContentDetailPage type="magazine" slug={parts[1]} />;
  if (pathname === "/blogs") return <ContentListPage type="blog" />;
  if (parts[0] === "blogs" && parts[1]) return <ContentDetailPage type="blog" slug={parts[1]} />;
  if (pathname === "/newsletters") return <ContentListPage type="newsletter" />;
  if (parts[0] === "newsletters" && parts[1]) return <ContentDetailPage type="newsletter" slug={parts[1]} />;
  if (pathname === "/media-production") return <ContentListPage type="media" />;
  if (parts[0] === "media-production" && parts[1]) return <ContentDetailPage type="media" slug={parts[1]} />;
  if (pathname === "/about") return <AboutPage />;
  if (pathname === "/credits") return <CreditsPage />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/admin/login") return <LoginPage />;
  if (pathname === "/admin") return <AdminDashboard />;
  if (pathname === "/admin/content") return <AdminContentPage />;
  if (pathname === "/admin/content/new") return <AdminContentFormPage />;
  if (parts[0] === "admin" && parts[1] === "content" && parts[2] && parts[3] === "edit") {
    return <AdminContentFormPage id={parts[2]} />;
  }
  if (pathname === "/admin/team") return <AdminTeamPage />;
  return <NotFoundPage />;
}

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = "Asian Outlook";
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-neutral-900">
      <Navbar pathname={pathname} />
      <div id="main-content" className="flex-1" tabIndex={-1}>
        <RouteSwitch pathname={pathname} />
      </div>
      <Footer />
    </div>
  );
}
