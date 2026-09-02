import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  "id, type, title, slug, description, body_html, cover_image_path, pdf_path, created_at, is_published";

const contentLabels: Record<
  ContentType,
  { plural: string; singular: string; path: string }
> = {
  magazine: { plural: "Magazines", singular: "Magazine", path: "/magazines" },
  blog: { plural: "Blogs", singular: "Blog", path: "/blogs" },
  newsletter: {
    plural: "Newsletters",
    singular: "Newsletter",
    path: "/newsletters",
  },
  media: {
    plural: "Podcasts",
    singular: "Podcast",
    path: "/podcasts",
  },
};

const teamSections = [
  "Leadership",
  "Editorial Team",
  "Layout Team",
  "Operations",
  "Podcast Team",
  "Additional Staff",
];

const podcastShows = [
  {
    name: "Inside Outlook",
    showId: "79Q5XizKCwj2Zj4EJEBSd8",
  },
  {
    name: "AO After Hours",
    showId: "2SKnRB11NfQVHulSg5MX5A",
  },
  {
    name: "AO Storytime",
    showId: "4VJltDo2cUVOj6FSmonbZZ",
  },
];

const contentCache = new Map<string, ContentItem[]>();

function contentCacheKey(type?: ContentType, limit?: number) {
  return `${type || "all"}:${limit || "all"}`;
}

function useContent(type?: ContentType, limit?: number) {
  const cacheKey = contentCacheKey(type, limit);
  const [items, setItems] = useState<ContentItem[]>(
    () => contentCache.get(cacheKey) || [],
  );
  const [loading, setLoading] = useState(() => !contentCache.has(cacheKey));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const cachedItems = contentCache.get(cacheKey);

    if (cachedItems) {
      setItems(cachedItems);
      setLoading(false);
    } else {
      setItems([]);
      setLoading(true);
    }

    async function loadContent() {
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
      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const nextItems = (data as ContentItem[]) || [];
      contentCache.set(cacheKey, nextItems);
      setItems(nextItems);
      setLoading(false);
    }

    loadContent();
    return () => {
      mounted = false;
    };
  }, [cacheKey, limit, type]);

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

async function editorMetadata() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    last_edited_by: session?.user.email || session?.user.id || "Unknown admin",
    last_edited_at: new Date().toISOString(),
  };
}

function lastEditedText(item: {
  last_edited_by?: string | null;
  last_edited_at?: string | null;
}) {
  if (!item.last_edited_by) return "Last Edited By: Not recorded yet";

  if (!item.last_edited_at) return `Last Edited By: ${item.last_edited_by}`;

  const editedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(item.last_edited_at));

  return `Last Edited By: ${item.last_edited_by} on ${editedDate}`;
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
    <p
      className="rounded-none border border-neutral-200 bg-white p-6 text-neutral-700"
      role="status"
    >
      {label}
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      className="rounded-none border border-red-200 bg-red-50 p-6 text-red-700"
      role="alert"
    >
      {message}
    </p>
  );
}

const allowedHtmlTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "figcaption",
  "figure",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "strong",
  "span",
  "ul",
]);

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 48;
const MIN_LINE_HEIGHT = 1;
const MAX_LINE_HEIGHT = 3;

function normalizeFontSize(value: string) {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) return "";

  const size = Number(match[1]);
  if (!Number.isFinite(size) || size < MIN_FONT_SIZE || size > MAX_FONT_SIZE) {
    return "";
  }

  return `${Math.round(size * 100) / 100}px`;
}

function normalizeLineHeight(value: string) {
  const match = value.trim().match(/^\d+(?:\.\d+)?$/);
  if (!match) return "";

  const lineHeight = Number(match[0]);
  if (
    !Number.isFinite(lineHeight) ||
    lineHeight < MIN_LINE_HEIGHT ||
    lineHeight > MAX_LINE_HEIGHT
  ) {
    return "";
  }

  return String(Math.round(lineHeight * 100) / 100);
}

function safeInlineStyleFromElement(element: HTMLElement) {
  const styles: string[] = [];
  const fontSize = normalizeFontSize(element.style.fontSize);
  const lineHeight = normalizeLineHeight(element.style.lineHeight);

  if (fontSize) styles.push("font-size: " + fontSize + ";");
  if (lineHeight) styles.push("line-height: " + lineHeight + ";");

  return styles.join(" ");
}

function fragmentFromChildren(element: Element) {
  const fragment = document.createDocumentFragment();
  element.childNodes.forEach((child) =>
    fragment.appendChild(child.cloneNode(true)),
  );
  return fragment;
}

function hasBoldStyle(element: HTMLElement) {
  const fontWeight = element.style.fontWeight.trim().toLowerCase();
  return (
    fontWeight === "bold" ||
    fontWeight === "bolder" ||
    /^[6-9]00$/.test(fontWeight)
  );
}

function hasItalicStyle(element: HTMLElement) {
  const fontStyle = element.style.fontStyle.trim().toLowerCase();
  return fontStyle === "italic" || fontStyle === "oblique";
}

function applySemanticInlineStyles(
  node: Node,
  element: HTMLElement,
  tagName: string,
) {
  let nextNode = node;

  if (hasItalicStyle(element) && tagName !== "i" && tagName !== "em") {
    const em = document.createElement("em");
    em.appendChild(nextNode);
    nextNode = em;
  }

  if (hasBoldStyle(element) && tagName !== "b" && tagName !== "strong") {
    const strong = document.createElement("strong");
    strong.appendChild(nextNode);
    nextNode = strong;
  }

  return nextNode;
}

function isSafeUrl(value: string, allowHash = false) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (allowHash && trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("/")) return true;

  try {
    const url = new URL(trimmed, window.location.origin);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeImportedHtml(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;

  function cleanNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (!allowedHtmlTags.has(tagName)) {
      const fragment = document.createDocumentFragment();
      element.childNodes.forEach((child) => {
        const cleanChild = cleanNode(child);
        if (cleanChild) fragment.appendChild(cleanChild);
      });
      return fragment;
    }

    const outputTagName = tagName === "b" ? "strong" : tagName === "i" ? "em" : tagName;
    const cleanElement = document.createElement(outputTagName);

    if (tagName === "a") {
      const href = element.getAttribute("href");
      if (href && isSafeUrl(href, true)) {
        cleanElement.setAttribute("href", href);
        cleanElement.setAttribute("rel", "noreferrer");
      }
    }

    if (tagName === "img") {
      const src = element.getAttribute("src");
      if (!src || !isSafeUrl(src)) return null;
      cleanElement.setAttribute("src", src);
      cleanElement.setAttribute("alt", element.getAttribute("alt") || "");
      cleanElement.setAttribute("loading", "lazy");
    }

    const title = element.getAttribute("title");
    if (title) cleanElement.setAttribute("title", title);

    element.childNodes.forEach((child) => {
      const cleanChild = cleanNode(child);
      if (cleanChild) cleanElement.appendChild(cleanChild);
    });

    if (tagName === "span") {
      const isEditorTextStyle =
        element.getAttribute("data-ao-text-style") === "true";
      const inlineStyle = isEditorTextStyle
        ? safeInlineStyleFromElement(element)
        : "";

      if (!inlineStyle) {
        return applySemanticInlineStyles(
          fragmentFromChildren(cleanElement),
          element,
          tagName,
        );
      }

      cleanElement.setAttribute("data-ao-text-style", "true");
      cleanElement.setAttribute("style", inlineStyle);
    }

    if (
      tagName === "figcaption" &&
      cleanElement.querySelector("p, ol, ul, h2, h3, h4, blockquote")
    ) {
      return fragmentFromChildren(cleanElement);
    }

    if (tagName === "figure" && !cleanElement.querySelector("img")) {
      return fragmentFromChildren(cleanElement);
    }

    return applySemanticInlineStyles(cleanElement, element, tagName);
  }

  const container = document.createElement("div");
  template.content.childNodes.forEach((child) => {
    const cleanChild = cleanNode(child);
    if (cleanChild) container.appendChild(cleanChild);
  });

  return container.innerHTML;
}

function ImportedHtml({ html }: { html: string }) {
  const safeHtml = useMemo(() => sanitizeImportedHtml(html), [html]);

  return (
    <div
      className="wp-content p-8 text-lg leading-8 text-neutral-700 md:p-10"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
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
  const coverUrl =
    publicStorageUrl("covers", item.cover_image_path) || "/magazine_image.jpg";

  return (
    <article className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`${hrefBase}/${item.slug}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
          <SafeImage
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]">
              {fallbackLabel}
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">
              {item.title || fallbackLabel}
            </h3>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-4 p-5">
        <Link
          href={`${hrefBase}/${item.slug}`}
          className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
        >
          View {fallbackLabel}
        </Link>
      </div>
    </article>
  );
}

function HomePage() {
  const magazines = useContent("magazine", 3);
  const newsletters = useContent("newsletter", 3);
  const blogs = useContent("blog", 3);

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
                Union at Binghamton University, we seek to amplify the voices of
                the Asian and Asian American community on our campus and beyond.
                We publish magazines twice a semester filled with student-owned
                media and writing, spread awareness on issues that impact our
                communities through our newsletters, produce podcasts, host
                engaging events and more. Although we are an Asian-interest
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
        {magazines.error && (
          <ErrorMessage message="Failed to load magazines." />
        )}
        {magazines.loading ? (
          <LoadingMessage />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {magazines.items.map((item) => (
              <Link
                key={item.id}
                href={`/magazines/${item.slug}`}
                className="card-link group overflow-hidden"
              >
                <div className="relative min-h-[320px] overflow-hidden bg-neutral-100">
                  <SafeImage
                    src={
                      publicStorageUrl("covers", item.cover_image_path) ||
                      "/magazine_image.jpg"
                    }
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Magazine
                    </p>
                    <h3 className="text-2xl font-semibold leading-tight">
                      {item.title}
                    </h3>
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
        {
          data: newsletters,
          eyebrow: "Updates",
          title: "Latest Newsletters",
          href: "/newsletters",
          label: "Newsletter",
        },
        {
          data: blogs,
          eyebrow: "Writing",
          title: "From the Blog",
          href: "/blogs",
          label: "Blog",
        },
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

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-24">
          <SectionHeader
            eyebrow="Multimedia"
            title="Podcasts"
            description="Listen to the latest episodes from our Spotify shows."
            href="/podcasts"
          />
          <div className="grid gap-8 lg:grid-cols-3">
            {podcastShows.map((show) => {
              const spotifyUrl = `https://open.spotify.com/show/${show.showId}`;
              const embedUrl = `https://open.spotify.com/embed/show/${show.showId}?utm_source=generator`;

              return (
                <article
                  key={show.showId}
                  className="overflow-hidden rounded-none border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5">
                    <h3 className="text-2xl font-bold tracking-tight text-neutral-950">
                      {show.name}
                    </h3>
                  </div>

                  <iframe
                    title={`${show.name} latest Spotify episodes`}
                    src={embedUrl}
                    width="100%"
                    height="352"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="w-full rounded-none border-0"
                  />

                  <a
                    href={spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary mt-5"
                  >
                    Listen on Spotify
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

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

function MagazineCard({
  item,
  admin,
  onDeleted,
}: {
  item: ContentItem;
  admin: boolean;
  onDeleted?: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/magazines/${item.slug}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
          <SafeImage
            src={
              publicStorageUrl("covers", item.cover_image_path) ||
              "/magazine_image.jpg"
            }
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]">
              Magazine
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">
              {item.title}
            </h3>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-4 p-5">
        <Link
          href={`/magazines/${item.slug}`}
          className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
        >
          View Issue
        </Link>
        {admin && (
          <Link
            href={`/admin/content/${item.id}/edit`}
            className="text-sm font-medium text-blue-950 underline-offset-4 hover:underline"
          >
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
          <Link
            href="/admin/content/new?type=magazine"
            className="button-primary"
          >
            Add Magazine
          </Link>
        )
      }
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        {error && <ErrorMessage message="Failed to load magazines." />}
        {loading && <LoadingMessage />}
        {!loading && featured && (
          <article className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[320px] overflow-hidden">
                <SafeImage
                  src={
                    publicStorageUrl("covers", featured.cover_image_path) ||
                    "/magazine_image.jpg"
                  }
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
                  <Link
                    href={`/magazines/${featured.slug}`}
                    className="button-primary"
                  >
                    Open Issue
                  </Link>
                  {isAdmin && (
                    <Link
                      href={`/admin/content/${featured.id}/edit`}
                      className="button-secondary"
                    >
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
          <p className="rounded-none border border-neutral-200 bg-white p-8 text-neutral-600">
            No archived magazines yet.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {visibleArchive.map((item) => (
              <MagazineCard
                key={item.id}
                item={item}
                admin={isAdmin}
                onDeleted={() =>
                  setLocalItems((prev) =>
                    prev.filter((entry) => entry.id !== item.id),
                  )
                }
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
  const { isAdmin } = useIsAdmin();
  const labels = contentLabels[type];
  const [visibleCount, setVisibleCount] = useState(6);
  const featured = items[0];
  const archive = items.slice(1);
  const visibleArchive = archive.slice(0, visibleCount);

  return (
    <PageShell
      title={labels.plural}
      description={`Browse Asian Outlook ${labels.plural.toLowerCase()} entries.`}
      actions={
        isAdmin && (
          <Link
            href={`/admin/content/new?type=${type}`}
            className="button-primary"
          >
            Add {labels.singular}
          </Link>
        )
      }
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        {error && (
          <ErrorMessage
            message={`Failed to load ${labels.plural.toLowerCase()}.`}
          />
        )}
        {loading && <LoadingMessage />}
        {!loading && items.length === 0 && (
          <p className="rounded-none border border-neutral-200 bg-white p-8 text-neutral-600">
            No {labels.plural.toLowerCase()} published yet.
          </p>
        )}
        {!loading && featured && (
          <article className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[320px] overflow-hidden">
                <SafeImage
                  src={
                    publicStorageUrl("covers", featured.cover_image_path) ||
                    "/magazine_image.jpg"
                  }
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
                  Featured {labels.singular}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
                  {featured.title}
                </h2>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`${labels.path}/${featured.slug}`}
                    className="button-primary"
                  >
                    View {labels.singular}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      {!loading && archive.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10 md:pb-24">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-950">
              More {labels.plural}
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {visibleArchive.map((item) => (
              <SimpleCard
                key={item.id}
                item={item}
                hrefBase={labels.path}
                fallbackLabel={labels.singular}
              />
            ))}
          </div>
          {visibleCount < archive.length && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 6)}
                className="button-secondary"
              >
                Show more {labels.plural.toLowerCase()}
              </button>
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}

function PodcastPage() {
  return (
    <PageShell
      title="Podcasts"
      description="Welcome to the podcast and audio department of Asian Outlook. Listen to the latest episodes from Inside Outlook, AO After Hours, and AO Storytime."
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {podcastShows.map((show) => {
            const spotifyUrl = `https://open.spotify.com/show/${show.showId}`;
            const embedUrl = `https://open.spotify.com/embed/show/${show.showId}?utm_source=generator`;

            return (
              <article
                key={show.showId}
                className="overflow-hidden rounded-none border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
                    {show.name}
                  </h2>
                </div>

                <iframe
                  title={`${show.name} latest Spotify episodes`}
                  src={embedUrl}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full rounded-none border-0"
                />

                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary mt-5"
                >
                  Listen on Spotify
                </a>
              </article>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

function ContentDetailPage({
  type,
  slug,
}: {
  type: ContentType;
  slug: string;
}) {
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

  const coverUrl =
    publicStorageUrl("covers", item.cover_image_path) || "/magazine_image.jpg";
  const pdfUrl = publicStorageUrl("magazines", item.pdf_path);
  const fileName = item.pdf_path?.split("/").pop() || `${item.slug}.pdf`;

  return (
    <PageShell
      title={item.title}
      eyebrow={labels.singular}
      description={
        type === "magazine" ? item.description || undefined : undefined
      }
      actions={
        isAdmin && (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/content/${item.id}/edit`}
              className="button-secondary"
            >
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
                className="w-full rounded-none border border-neutral-200 bg-white object-cover shadow-sm"
              />
              <div className="rounded-none border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-neutral-950">
                  Read this issue
                </h2>
                <p className="mt-3 text-base leading-7 text-neutral-700">
                  Read the magazine below, or download the file to read it in
                  your preferred PDF reader.
                </p>
                {pdfUrl ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={pdfUrl}
                      className="button-primary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open PDF in new tab
                    </a>
                    <DownloadPdfButton
                      pdfUrl={pdfUrl}
                      fileName={fileName}
                      className="button-secondary"
                    />
                  </div>
                ) : (
                  <ErrorMessage message="No PDF is available for this issue." />
                )}
              </div>
            </div>
            {pdfUrl && <MagazineFlipbook pdfUrl={pdfUrl} />}
          </>
        ) : (
          <article className="overflow-hidden rounded-none border border-neutral-200 bg-white shadow-sm">
            {coverUrl && (
              <div className="px-8 pt-[50px]">
                <SafeImage
                  src={coverUrl}
                  alt={`Cover image for ${item.title}`}
                  className="mx-auto h-auto max-h-[720px] w-full object-contain bg-white"
                />
              </div>
            )}
            {item.body_html ? (
              <ImportedHtml html={item.body_html} />
            ) : (
              <p className="p-8 text-lg leading-8 text-neutral-700 md:p-10">
                {item.description || "More details will be published soon."}
              </p>
            )}
          </article>
        )}
      </section>
    </PageShell>
  );
}

function fallbackBoardSections() {
  return [
    {
      title: "Leadership",
      members: [
        {
          role: "President",
          names: ["Kate Sum"],
        },
        {
          role: "Vice President",
          names: ["Lauren Jim"],
        },
        {
          role: "Treasurer",
          names: ["Madison Hernandez"],
        },
        {
          role: "Secretary",
          names: ["Jimmy Zheng"],
        },
      ],
    },
    {
      title: "Editorial Team",
      members: [
        {
          role: "Editor in Chief",
          names: ["Ellie Kim"],
        },
        {
          role: "Copy Editors",
          names: ["Lindsay Chen", "Ava Gabriel", "Annie Ngo"],
        },
      ],
    },
    {
      title: "Layout Team",
      members: [
        {
          role: "Conscience Editor",
          names: ["Ianna Choi"],
        },
        {
          role: "Layout Editors",
          names: [
            "Mandy Guan",
            "Reema Kaur",
            "Lise Kubota",
            "Suguru D'Agostino",
          ],
        },
      ],
    },
    {
      title: "Operations",
      members: [
        {
          role: "Publicity Chair",
          names: ["John Michael Mata", "Alison Lou"],
        },
        {
          role: "Event Coordinators",
          names: ["Hoi yau Lam", "Therese Roque"],
        },
        {
          role: "Political Coordinator",
          names: ["Kristen Li", "Andrea Hsu"],
        },
        {
          role: "Fundraising Chair",
          names: ["Fei Chen"],
        },
        {
          role: "Multimedia",
          names: ["Jacky Jiang", "Brady Overtoom"],
        },
      ],
    },
    {
      title: "Podcast Team",
      members: [
        {
          role: "Podcast Director",
          names: ["Lydia Luo", "Madison Lee", "Donovan Lai"],
        },
      ],
    },
    {
      title: "Additional Staff",
      members: [
        {
          role: "Advisors",
          names: [
            "Shirley Zhang",
            "Andy Huang",
            "Kimberly Cheong",
            "Grace Lim",
            "Stephanie Zhou",
          ],
        },
      ],
    },
  ];
}

function teamSectionIndex(section: string) {
  const index = teamSections.indexOf(section);
  return index === -1 ? teamSections.length : index;
}

function sortTeamMembers(entries: TeamMember[]) {
  return [...entries].sort((a, b) => {
    const sectionDifference =
      teamSectionIndex(a.section || "Team") -
      teamSectionIndex(b.section || "Team");
    if (sectionDifference !== 0) return sectionDifference;

    return (
      (a.display_order ?? Number.MAX_SAFE_INTEGER) -
      (b.display_order ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

function groupTeamMembers(members: TeamMember[]) {
  const sectionMap = new Map<string, Map<string, string[]>>();

  sortTeamMembers(members).forEach((member) => {
    const section = member.section?.trim() || "Team";
    const role = member.role.trim();
    if (!sectionMap.has(section)) sectionMap.set(section, new Map());
    const roleMap = sectionMap.get(section)!;
    if (!roleMap.has(role)) roleMap.set(role, []);
    roleMap.get(role)!.push(member.name);
  });

  return Array.from(sectionMap.entries()).map(([title, roleMap]) => ({
    title,
    members: Array.from(roleMap.entries()).map(([role, names]) => ({
      role,
      names,
    })),
  }));
}

function AboutPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("team_members")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        if (!mounted) return;
        setTeamMembers(sortTeamMembers((data as TeamMember[]) || []));
        setLoadingTeam(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const boardSections = teamMembers.length
    ? groupTeamMembers(teamMembers)
    : fallbackBoardSections();

  return (
    <PageShell
      title="About Us"
      description="Asian Outlook serves as the creative, literary, and political arm of the Asian Student Union at Binghamton University."
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-950">
            {teamMembers[0]?.season || "Spring 2026"}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">
            Executive Board
          </h2>
        </div>
        {loadingTeam && <LoadingMessage label="Loading team information..." />}
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {boardSections.map((section) => (
            <section
              key={section.title}
              className="rounded-none border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold tracking-tight text-neutral-950">
                {section.title}
              </h3>
              <dl className="mt-5 space-y-5">
                {section.members.map((member) => (
                  <div key={member.role}>
                    <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-950">
                      {member.role}
                    </dt>
                    <dd className="mt-2 text-base text-neutral-700">
                      {member.names.join(", ")}
                    </dd>
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
          <p className="mt-2 text-5xl font-extrabold text-black md:text-5xl">
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
    <PageShell
      title="Search"
      description="Search published Asian Outlook content."
    >
      <section className="mx-auto max-w-4xl px-6 py-14 md:px-10">
        <label
          htmlFor="site-search"
          className="block text-sm font-semibold text-neutral-900"
        >
          Search terms
        </label>
        <input
          id="site-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-2 w-full rounded-none border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
          placeholder="Search by title, description, or type"
          type="search"
        />
        <div className="mt-8" aria-live="polite">
          {loading && <LoadingMessage label="Loading searchable content..." />}
          {!loading && query && results.length === 0 && (
            <p className="rounded-none border border-neutral-200 bg-white p-6 text-neutral-700">
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

function PasswordSetupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadInviteSession() {
      setError("");
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          if (mounted) {
            setError(sessionError.message);
            setLoading(false);
          }
          return;
        }

        window.history.replaceState({}, "", "/admin/set-password");
      }

      const {
        data: { session },
        error: sessionCheckError,
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setReady(Boolean(session));
      setError(sessionCheckError?.message || "");
      setLoading(false);
    }

    loadInviteSession();
    return () => {
      mounted = false;
    };
  }, []);

  async function handlePasswordUpdate(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    navigate("/admin");
  }

  return (
    <PageShell
      title="Set Password"
      description="Create your password to finish setting up your Asian Outlook admin account."
    >
      <section className="mx-auto max-w-md px-6 py-14">
        {loading ? (
          <LoadingMessage label="Checking invite session..." />
        ) : !ready ? (
          <div className="rounded-none border border-neutral-200 bg-white p-6 shadow-sm">
            <ErrorMessage
              message={
                error ||
                "This invite link is expired or invalid. Ask an existing admin to send a new invite."
              }
            />
            <Link href="/admin/login" className="button-primary mt-4">
              Go to admin login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handlePasswordUpdate}
            className="space-y-4 rounded-none border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-neutral-900"
              >
                New password
              </label>
              <input
                id="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="form-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-sm font-medium text-neutral-900"
              >
                Confirm password
              </label>
              <input
                id="confirm-new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="form-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button
              className="button-primary w-full justify-center"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving password..." : "Set Password"}
            </button>
          </form>
        )}
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
        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-none border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-900"
            >
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-900"
            >
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
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            className="button-primary w-full justify-center"
            disabled={loading}
            type="submit"
          >
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
              <p className="mt-2 text-neutral-600">
                Create, edit, or delete content items.
              </p>
            </Link>
            <Link href="/admin/team" className="card-link p-6">
              <h2 className="text-xl font-semibold">Manage Team</h2>
              <p className="mt-2 text-neutral-600">
                Edit team member information.
              </p>
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
      .select("*")
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
        actions={
          <Link href="/admin/content/new" className="button-primary">
            New Content
          </Link>
        }
      >
        <section className="mx-auto max-w-6xl px-6 py-14">
          {loading ? (
            <LoadingMessage />
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between gap-4 rounded-none border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-center"
                >
                  <div>
                    <h2 className="font-semibold text-neutral-950">
                      {item.title}
                    </h2>
                    <p className="text-sm text-neutral-600">
                      {contentLabels[item.type].singular}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {lastEditedText(item)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/admin/content/${item.id}/edit`}
                      className="text-sm font-medium text-blue-950 underline-offset-4 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteContentButton
                      id={item.id}
                      className="text-sm font-medium text-red-700 underline-offset-4 hover:underline"
                      onDeleted={() =>
                        setItems((prev) =>
                          prev.filter((entry) => entry.id !== item.id),
                        )
                      }
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

function slugSafePath(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-|-$/g, "") || "content"
  );
}

function storageSafeFileName(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? parts.pop() || "" : "";
  const baseName = parts.join(".") || fileName;
  const safeBaseName = slugSafePath(baseName);
  const safeExtension = extension ? slugSafePath(extension) : "";
  return safeExtension ? `${safeBaseName}.${safeExtension}` : safeBaseName;
}

function EditorButton({
  children,
  onClick,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
    >
      {children}
    </button>
  );
}

function RichTextEditor({
  value,
  onChange,
  slug,
  onError,
}: {
  value: string;
  onChange: (value: string) => void;
  slug: string;
  onError: (message: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [fontSizeInput, setFontSizeInput] = useState("22");
  const [lineHeightInput, setLineHeightInput] = useState("1.85");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  function updateValue() {
    onChange(editorRef.current?.innerHTML || "");
  }

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    updateValue();
  }

  function makeHeading(level: "h2" | "h3" | "p") {
    runCommand("formatBlock", level);
  }

  function applySelectedInlineStyle(styles: {
    fontSize?: string;
    lineHeight?: string;
  }) {
    const editor = editorRef.current;
    editor?.focus();

    const selection = window.getSelection();
    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed
    ) {
      onError("Select text before changing its style.");
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      onError("Select text inside the editor before changing its style.");
      return;
    }

    const span = document.createElement("span");
    span.setAttribute("data-ao-text-style", "true");
    if (styles.fontSize) span.style.fontSize = styles.fontSize;
    if (styles.lineHeight) span.style.lineHeight = styles.lineHeight;
    span.appendChild(range.extractContents());
    range.insertNode(span);

    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.addRange(nextRange);

    onError("");
    updateValue();
  }

  function applyFontSize() {
    const fontSize = normalizeFontSize(`${fontSizeInput}px`);
    if (!fontSize) {
      onError(`Enter a font size from ${MIN_FONT_SIZE} to ${MAX_FONT_SIZE}.`);
      return;
    }

    applySelectedInlineStyle({ fontSize });
  }

  function applyLineHeight() {
    const lineHeight = normalizeLineHeight(lineHeightInput);
    if (!lineHeight) {
      onError(
        `Enter line spacing from ${MIN_LINE_HEIGHT} to ${MAX_LINE_HEIGHT}.`,
      );
      return;
    }

    applySelectedInlineStyle({ lineHeight });
  }

  function addLink() {
    const url = window.prompt("Link URL");
    if (!url) return;
    if (!isSafeUrl(url)) {
      onError(
        "Please enter a valid http, https, mailto, or site-relative URL.",
      );
      return;
    }
    runCommand("createLink", url);
  }

  async function uploadInlineImage(file: File) {
    const alt = imageAlt.trim();
    if (!alt) {
      onError("Alt text is required before uploading an inline image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingImage(true);
    onError("");

    try {
      const path = `content/${slugSafePath(slug)}/${Date.now()}-${storageSafeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(path, file);

      if (uploadError) throw new Error(uploadError.message);

      const imageUrl = publicStorageUrl("covers", path);
      if (!imageUrl) throw new Error("Unable to create image URL.");

      editorRef.current?.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<figure><img src="${imageUrl}" alt="${alt.replace(/"/g, "&quot;")}" /><figcaption>${alt}</figcaption></figure><p><br></p>`,
      );
      setImageAlt("");
      updateValue();
    } catch (caught) {
      onError(
        caught instanceof Error ? caught.message : "Unable to upload image.",
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2"
        aria-label="Content formatting toolbar"
        role="toolbar"
      >
        <EditorButton onClick={() => runCommand("bold")}>Bold</EditorButton>
        <EditorButton onClick={() => runCommand("italic")}>Italic</EditorButton>
        <EditorButton onClick={() => makeHeading("h2")}>H2</EditorButton>
        <EditorButton onClick={() => makeHeading("h3")}>H3</EditorButton>
        <EditorButton onClick={() => makeHeading("p")}>Paragraph</EditorButton>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm font-medium text-neutral-900">
            Font size
            <input
              type="number"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step="1"
              value={fontSizeInput}
              onChange={(event) => setFontSizeInput(event.currentTarget.value)}
              className="mt-1 h-10 w-24 border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              aria-label="Font size in pixels"
            />
          </label>
          <EditorButton onClick={applyFontSize}>Apply size</EditorButton>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm font-medium text-neutral-900">
            Line spacing
            <input
              type="number"
              min={MIN_LINE_HEIGHT}
              max={MAX_LINE_HEIGHT}
              step="0.05"
              value={lineHeightInput}
              onChange={(event) =>
                setLineHeightInput(event.currentTarget.value)
              }
              className="mt-1 h-10 w-24 border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              aria-label="Line spacing multiplier"
            />
          </label>
          <EditorButton onClick={applyLineHeight}>Apply spacing</EditorButton>
        </div>
        <EditorButton onClick={() => runCommand("insertUnorderedList")}>
          Bullets
        </EditorButton>
        <EditorButton onClick={() => runCommand("insertOrderedList")}>
          Numbered
        </EditorButton>
        <EditorButton onClick={addLink}>Link</EditorButton>
      </div>

      <div className="grid gap-3 border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label
            htmlFor="inline-image-alt"
            className="block text-sm font-medium text-neutral-900"
          >
            Inline image alt text
          </label>
          <input
            id="inline-image-alt"
            value={imageAlt}
            onChange={(event) => setImageAlt(event.target.value)}
            className="form-input"
            placeholder="Describe the image for screen readers"
          />
        </div>
        <div>
          <input
            ref={fileInputRef}
            id="inline-image-file"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadInlineImage(file);
            }}
            className="sr-only"
          />
          <label
            htmlFor="inline-image-file"
            className="button-secondary h-14 cursor-pointer"
            aria-disabled={uploadingImage}
          >
            {uploadingImage ? "Uploading..." : "Upload Image"}
          </label>
        </div>
      </div>

      <div
        ref={editorRef}
        id="content-body"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Content body"
        onInput={updateValue}
        className="wp-content min-h-[24rem] border border-neutral-300 bg-white p-5 text-base leading-7 text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
      />
    </div>
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
  const [bodyHtml, setBodyHtml] = useState("");
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
          setBodyHtml(item.body_html || "");
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

    if ((type === "blog" || type === "newsletter") && !id && !coverFile) {
      throw new Error(
        "A cover image is required for new blogs and newsletters.",
      );
    }

    if (pdfFile) {
      const path = `${slugSafePath(slug)}/${Date.now()}-${storageSafeFileName(pdfFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("magazines")
        .upload(path, pdfFile);
      if (uploadError)
        throw new Error(`PDF upload failed: ${uploadError.message}`);
      nextPdfPath = path;
    }

    if (coverFile) {
      const path = `${slugSafePath(slug)}/${Date.now()}-${storageSafeFileName(coverFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(path, coverFile);
      if (uploadError)
        throw new Error(`Cover upload failed: ${uploadError.message}`);
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

      if ((type === "blog" || type === "newsletter") && !bodyHtml.trim()) {
        throw new Error("Content is required for blogs and newsletters.");
      }

      const { nextPdfPath, nextCoverPath } = await uploadAssets();
      const sanitizedBody = bodyHtml.trim()
        ? sanitizeImportedHtml(bodyHtml)
        : null;
      const metadata = await editorMetadata();
      const payload = {
        type,
        title: title.trim(),
        slug: slug.trim(),
        description: null,
        body_html: type === "magazine" ? null : sanitizedBody,
        pdf_path: type === "magazine" ? nextPdfPath : null,
        cover_image_path: nextCoverPath,
        is_published: true,
        ...metadata,
      };

      const { error: saveError } = id
        ? await supabase.from("content_items").update(payload).eq("id", id)
        : await supabase.from("content_items").insert(payload);

      if (saveError) throw new Error(saveError.message);
      navigate(type === "magazine" ? "/magazines" : contentLabels[type].path);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save content.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingMessage label="Loading content form..." />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-none border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="content-type"
          className="block text-sm font-medium text-neutral-900"
        >
          Content type
        </label>
        <select
          id="content-type"
          value={type}
          onChange={(event) => setType(event.target.value as ContentType)}
          className="form-input"
          required
        >
          <option value="" disabled>
            Select type
          </option>
          <option value="magazine">Magazine</option>
          <option value="blog">Blog</option>
          <option value="newsletter">Newsletter</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="content-title"
          className="block text-sm font-medium text-neutral-900"
        >
          Title
        </label>
        <input
          id="content-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="form-input"
          required
        />
      </div>
      <div>
        <label
          htmlFor="content-slug"
          className="block text-sm font-medium text-neutral-900"
        >
          Slug
        </label>
        <input
          id="content-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="form-input"
          required
        />
      </div>
      {type === "magazine" && (
        <div>
          <label
            htmlFor="content-pdf"
            className="block text-sm font-medium text-neutral-900"
          >
            {id ? "Replace PDF" : "PDF"}
          </label>
          <input
            id="content-pdf"
            type="file"
            accept="application/pdf"
            onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
            className="mt-2 w-full text-sm"
            required={!id}
          />
          {pdfPath && (
            <p className="mt-2 text-sm text-neutral-600">
              Current PDF: {pdfPath}
            </p>
          )}
        </div>
      )}
      {type && type !== "media" && (
        <div>
          <label
            htmlFor="content-cover"
            className="block text-sm font-medium text-neutral-900"
          >
            {id ? "Replace cover image" : "Cover image"}
          </label>
          <input
            id="content-cover"
            type="file"
            accept="image/*"
            onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
            className="mt-2 w-full text-sm"
            required={
              !id &&
              (type === "magazine" || type === "blog" || type === "newsletter")
            }
          />
          {coverPath && (
            <p className="mt-2 text-sm text-neutral-600">
              Current cover: {coverPath}
            </p>
          )}
        </div>
      )}
      {(type === "blog" || type === "newsletter") && (
        <div>
          <label
            htmlFor="content-body"
            className="block text-sm font-medium text-neutral-900"
          >
            Content
          </label>
          <div className="mt-2">
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              slug={slug}
              onError={setError}
            />
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
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

type TeamFormState = {
  name: string;
  role: string;
  section: string;
  season: string;
  display_order: string;
};

function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<TeamFormState>({
    name: "",
    role: "",
    section: "",
    season: "",
    display_order: "",
  });
  const [newMember, setNewMember] = useState<TeamFormState>({
    name: "",
    role: "",
    section: "",
    season: "",
    display_order: "",
  });

  async function loadMembers() {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("team_members")
      .select("*")
      .order("section", { ascending: true })
      .order("display_order", { ascending: true });

    const nextMembers = (data as TeamMember[]) || [];
    if (queryError) setError(queryError.message);
    else setMembers(sortMembers(nextMembers));
    setLoading(false);
    return queryError ? [] : nextMembers;
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function startEditing(member: TeamMember) {
    setEditingId(member.id);
    setDraft({
      name: member.name,
      role: member.role,
      section: member.section || "",
      season: member.season || "",
      display_order: String(member.display_order ?? ""),
    });
    setError("");
  }

  function teamPayload(form: TeamFormState) {
    if (!form.name.trim()) throw new Error("Name is required.");
    if (!form.role.trim()) throw new Error("Role is required.");
    if (!form.section.trim()) throw new Error("Section is required.");

    const parsedOrder = form.display_order.trim()
      ? Number(form.display_order)
      : null;

    if (parsedOrder !== null && Number.isNaN(parsedOrder)) {
      throw new Error("Display order must be a number.");
    }

    return {
      name: form.name.trim(),
      role: form.role.trim(),
      section: form.section.trim(),
      season: form.season.trim() || null,
      display_order: parsedOrder,
    };
  }

  function memberSection(member: TeamMember) {
    return member.section || "Team";
  }

  function sortMembers(entries: TeamMember[]) {
    return [...entries].sort((a, b) => {
      const sectionDifference =
        teamSectionIndex(memberSection(a)) - teamSectionIndex(memberSection(b));
      if (sectionDifference !== 0) return sectionDifference;

      return (
        (a.display_order ?? Number.MAX_SAFE_INTEGER) -
        (b.display_order ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }

  function sectionMembers(section: string, sourceMembers = members) {
    return sortMembers(
      sourceMembers.filter((member) => memberSection(member) === section),
    );
  }

  async function shiftDisplayOrders(
    section: string,
    order: number,
    excludeId?: number,
    sourceMembers = members,
  ) {
    const rowsToShift = sectionMembers(section, sourceMembers)
      .filter(
        (member) =>
          member.display_order !== null &&
          member.display_order !== undefined &&
          member.display_order >= order &&
          member.id !== excludeId,
      )
      .sort((a, b) => (b.display_order || 0) - (a.display_order || 0));

    for (const member of rowsToShift) {
      const { error: shiftError } = await supabase
        .from("team_members")
        .update({ display_order: (member.display_order || 0) + 1 })
        .eq("id", member.id);

      if (shiftError) throw new Error(shiftError.message);
    }
  }

  async function moveDisplayOrder(
    memberId: number,
    oldSection: string,
    newSection: string,
    oldOrder: number | null | undefined,
    newOrder: number | null,
  ) {
    if (oldSection !== newSection) {
      if (oldOrder !== null && oldOrder !== undefined) {
        await compactSectionAfterRemoval(oldSection, oldOrder, memberId);
      }
      if (newOrder !== null) {
        await shiftDisplayOrders(newSection, newOrder, memberId);
      }
      return;
    }

    if (oldOrder === newOrder) return;

    if (newOrder === null) {
      if (oldOrder === null || oldOrder === undefined) return;
      await compactSectionAfterRemoval(oldSection, oldOrder, memberId);
      return;
    }

    if (oldOrder === null || oldOrder === undefined) {
      await shiftDisplayOrders(newSection, newOrder, memberId);
      return;
    }

    const movingUp = newOrder < oldOrder;
    const rowsToShift = sectionMembers(newSection)
      .filter((member) => {
        if (
          member.id === memberId ||
          member.display_order === null ||
          member.display_order === undefined
        ) {
          return false;
        }

        return movingUp
          ? member.display_order >= newOrder && member.display_order < oldOrder
          : member.display_order > oldOrder && member.display_order <= newOrder;
      })
      .sort((a, b) =>
        movingUp
          ? (b.display_order || 0) - (a.display_order || 0)
          : (a.display_order || 0) - (b.display_order || 0),
      );

    for (const member of rowsToShift) {
      const { error: shiftError } = await supabase
        .from("team_members")
        .update({
          display_order: (member.display_order || 0) + (movingUp ? 1 : -1),
        })
        .eq("id", member.id);

      if (shiftError) throw new Error(shiftError.message);
    }
  }

  async function compactSectionAfterRemoval(
    section: string,
    removedOrder: number,
    removedId?: number,
  ) {
    const rowsToShift = sectionMembers(section)
      .filter(
        (entry) =>
          entry.id !== removedId &&
          entry.display_order !== null &&
          entry.display_order !== undefined &&
          entry.display_order > removedOrder,
      )
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    for (const entry of rowsToShift) {
      const { error: shiftError } = await supabase
        .from("team_members")
        .update({ display_order: (entry.display_order || 0) - 1 })
        .eq("id", entry.id);

      if (shiftError) throw new Error(shiftError.message);
    }
  }

  async function normalizeDisplayOrders(sourceMembers = members) {
    for (const section of teamSections) {
      const orderedMembers = sectionMembers(section, sourceMembers);

      for (let index = 0; index < orderedMembers.length; index += 1) {
        const member = orderedMembers[index];
        const nextOrder = index + 1;
        if (member.display_order === nextOrder) continue;

        const { error: normalizeError } = await supabase
          .from("team_members")
          .update({ display_order: nextOrder })
          .eq("id", member.id);

        if (normalizeError) throw new Error(normalizeError.message);
      }
    }
  }

  async function saveMember(id: number) {
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...teamPayload(draft),
        ...(await editorMetadata()),
      };
      const existingMember = members.find((member) => member.id === id);
      await moveDisplayOrder(
        id,
        existingMember?.section || "Team",
        payload.section,
        existingMember?.display_order,
        payload.display_order,
      );

      const { error: updateError } = await supabase
        .from("team_members")
        .update(payload)
        .eq("id", id);

      if (updateError) throw new Error(updateError.message);
      const latestMembers = await loadMembers();
      await normalizeDisplayOrders(latestMembers);
      await loadMembers();
      setEditingId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  async function addMember(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...teamPayload(newMember),
        ...(await editorMetadata()),
      };
      if (payload.display_order !== null) {
        await shiftDisplayOrders(payload.section, payload.display_order);
      }

      const { error: insertError } = await supabase
        .from("team_members")
        .insert(payload);

      if (insertError) throw new Error(insertError.message);
      const latestMembers = await loadMembers();
      await normalizeDisplayOrders(latestMembers);
      await loadMembers();
      setNewMember({
        name: "",
        role: "",
        section: "",
        season: "",
        display_order: "",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(member: TeamMember) {
    if (!window.confirm(`Delete ${member.name}?`)) return;
    setSaving(true);
    setError("");

    try {
      const deletedOrder = member.display_order;
      const { error: deleteError } = await supabase
        .from("team_members")
        .delete()
        .eq("id", member.id);

      if (deleteError) throw new Error(deleteError.message);

      if (deletedOrder !== null && deletedOrder !== undefined) {
        await compactSectionAfterRemoval(
          member.section || "Team",
          deletedOrder,
          member.id,
        );
      }

      const latestMembers = await loadMembers();
      await normalizeDisplayOrders(latestMembers);
      await loadMembers();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAdmin>
      <PageShell
        title="Team"
        description="Changes here update the About Us executive board section."
      >
        <section className="mx-auto max-w-6xl px-6 py-14">
          {error && <ErrorMessage message={error} />}
          <form
            onSubmit={addMember}
            className="admin-team-form mb-8 grid gap-4 border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_10rem_8rem_auto] lg:items-end"
          >
            <div>
              <label
                htmlFor="new-team-name"
                className="block text-sm font-medium text-neutral-900"
              >
                Name
              </label>
              <input
                id="new-team-name"
                value={newMember.name}
                onChange={(event) =>
                  setNewMember((member) => ({
                    ...member,
                    name: event.target.value,
                  }))
                }
                className="form-input"
                required
              />
            </div>
            <div>
              <label
                htmlFor="new-team-role"
                className="block text-sm font-medium text-neutral-900"
              >
                Role
              </label>
              <input
                id="new-team-role"
                value={newMember.role}
                onChange={(event) =>
                  setNewMember((member) => ({
                    ...member,
                    role: event.target.value,
                  }))
                }
                className="form-input"
                required
              />
            </div>
            <div>
              <label
                htmlFor="new-team-section"
                className="block text-sm font-medium text-neutral-900"
              >
                Section
              </label>
              <select
                id="new-team-section"
                value={newMember.section}
                onChange={(event) =>
                  setNewMember((member) => ({
                    ...member,
                    section: event.target.value,
                  }))
                }
                className="form-input"
                required
              >
                <option value="" disabled>
                  Select section
                </option>
                {teamSections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="new-team-season"
                className="block text-sm font-medium text-neutral-900"
              >
                Season
              </label>
              <input
                id="new-team-season"
                value={newMember.season}
                onChange={(event) =>
                  setNewMember((member) => ({
                    ...member,
                    season: event.target.value,
                  }))
                }
                className="form-input"
                placeholder="Semester Year"
              />
            </div>
            <div>
              <label
                htmlFor="new-team-order"
                className="block text-sm font-medium text-neutral-900"
              >
                Order
              </label>
              <input
                id="new-team-order"
                value={newMember.display_order}
                onChange={(event) =>
                  setNewMember((member) => ({
                    ...member,
                    display_order: event.target.value,
                  }))
                }
                className="form-input"
                inputMode="numeric"
              />
            </div>
            <button type="submit" disabled={saving} className="button-primary">
              Add
            </button>
          </form>

          {loading ? (
            <LoadingMessage label="Loading team members..." />
          ) : members.length === 0 ? (
            <p className="border border-neutral-200 bg-white p-8 text-neutral-600">
              No Supabase team members yet. Run the About Us seed SQL once to
              load the current board.
            </p>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const editing = editingId === member.id;

                return (
                  <article
                    key={member.id}
                    className="border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    {editing ? (
                      <div className="admin-team-form grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_10rem_8rem_auto] lg:items-end">
                        <div>
                          <label
                            htmlFor={`team-name-${member.id}`}
                            className="block text-sm font-medium text-neutral-900"
                          >
                            Name
                          </label>
                          <input
                            id={`team-name-${member.id}`}
                            value={draft.name}
                            onChange={(event) =>
                              setDraft((value) => ({
                                ...value,
                                name: event.target.value,
                              }))
                            }
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`team-role-${member.id}`}
                            className="block text-sm font-medium text-neutral-900"
                          >
                            Role
                          </label>
                          <input
                            id={`team-role-${member.id}`}
                            value={draft.role}
                            onChange={(event) =>
                              setDraft((value) => ({
                                ...value,
                                role: event.target.value,
                              }))
                            }
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`team-section-${member.id}`}
                            className="block text-sm font-medium text-neutral-900"
                          >
                            Section
                          </label>
                          <select
                            id={`team-section-${member.id}`}
                            value={draft.section}
                            onChange={(event) =>
                              setDraft((value) => ({
                                ...value,
                                section: event.target.value,
                              }))
                            }
                            className="form-input"
                            required
                          >
                            <option value="" disabled>
                              Select section
                            </option>
                            {teamSections.map((section) => (
                              <option key={section} value={section}>
                                {section}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor={`team-season-${member.id}`}
                            className="block text-sm font-medium text-neutral-900"
                          >
                            Season
                          </label>
                          <input
                            id={`team-season-${member.id}`}
                            value={draft.season}
                            onChange={(event) =>
                              setDraft((value) => ({
                                ...value,
                                season: event.target.value,
                              }))
                            }
                            className="form-input"
                            placeholder="Semester Year"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`team-order-${member.id}`}
                            className="block text-sm font-medium text-neutral-900"
                          >
                            Order
                          </label>
                          <input
                            id={`team-order-${member.id}`}
                            value={draft.display_order}
                            onChange={(event) =>
                              setDraft((value) => ({
                                ...value,
                                display_order: event.target.value,
                              }))
                            }
                            className="form-input"
                            inputMode="numeric"
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => saveMember(member.id)}
                            disabled={saving}
                            className="button-primary"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                            className="button-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <h2 className="font-semibold text-neutral-950">
                            {member.name}
                          </h2>
                          <p className="text-sm text-neutral-600">
                            {member.role}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {member.section || "Team"} ·{" "}
                            {member.season || "No season"} · Order:{" "}
                            {member.display_order ?? "none"}
                          </p>
                          <p className="mt-2 text-sm text-neutral-600">
                            {lastEditedText(member)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => startEditing(member)}
                            className="text-sm font-medium text-blue-950 underline-offset-4 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMember(member)}
                            disabled={saving}
                            className="text-sm font-medium text-red-700 underline-offset-4 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </PageShell>
    </RequireAdmin>
  );
}
function NotFoundPage() {
  return (
    <PageShell title="Page not found">
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <p className="text-neutral-700">
          We could not find the page you requested.
        </p>
        <div className="mt-6">
          <Link href="/" className="button-primary">
            Back Home
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function RouteSwitch({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);

  if (pathname === "/") return <HomePage />;
  if (pathname === "/magazines") return <MagazinesPage />;
  if (parts[0] === "magazines" && parts[1])
    return <ContentDetailPage type="magazine" slug={parts[1]} />;
  if (pathname === "/blogs") return <ContentListPage type="blog" />;
  if (parts[0] === "blogs" && parts[1])
    return <ContentDetailPage type="blog" slug={parts[1]} />;
  if (pathname === "/newsletters") return <ContentListPage type="newsletter" />;
  if (parts[0] === "newsletters" && parts[1])
    return <ContentDetailPage type="newsletter" slug={parts[1]} />;
  if (pathname === "/podcasts" || pathname === "/media-production")
    return <PodcastPage />;
  if ((parts[0] === "podcasts" || parts[0] === "media-production") && parts[1])
    return <ContentDetailPage type="media" slug={parts[1]} />;
  if (pathname === "/about") return <AboutPage />;
  if (pathname === "/credits") return <CreditsPage />;
  if (pathname === "/search") return <SearchPage />;
  if (pathname === "/admin/login") return <LoginPage />;
  if (pathname === "/admin/set-password") return <PasswordSetupPage />;
  if (pathname === "/admin") return <AdminDashboard />;
  if (pathname === "/admin/content") return <AdminContentPage />;
  if (pathname === "/admin/content/new") return <AdminContentFormPage />;
  if (
    parts[0] === "admin" &&
    parts[1] === "content" &&
    parts[2] &&
    parts[3] === "edit"
  ) {
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

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const type = hashParams.get("type");
    const hasInviteSession =
      Boolean(hashParams.get("access_token")) &&
      Boolean(hashParams.get("refresh_token")) &&
      (type === "invite" || type === "recovery");

    if (hasInviteSession && pathname !== "/admin/set-password") {
      window.history.replaceState(
        {},
        "",
        `/admin/set-password${window.location.hash}`,
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "instant" });
    }
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
