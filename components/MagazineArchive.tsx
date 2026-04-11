"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteContentButton from "@/components/admin/DeleteContentButton";

type ContentItem = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
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

function MagazineCard({ item, admin }: { item: ContentItem; admin: boolean }) {
  return (
    <div className="group overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/magazines/${item.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={getImageUrl(item.cover_image_path)}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Magazine
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">
              {item.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/magazines/${item.slug}`}
            className="inline-block text-sm font-medium text-neutral-900"
          >
            View Issue
          </Link>

          {admin && (
            <Link
              href={`/admin/content/${item.id}/edit`}
              className="inline-block text-sm font-medium text-blue-950"
            >
              Edit
            </Link>
          )}

          {admin && (
            <DeleteContentButton
              id={item.id}
              redirectTo="/magazines"
              label="Delete"
              className="inline-block text-sm font-medium text-red-600"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function MagazineArchive({
  items,
  admin,
}: {
  items: ContentItem[];
  admin: boolean;
}) {
  const INITIAL_COUNT = 6;
  const LOAD_MORE_COUNT = 6;

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-8 text-neutral-600">
        No archived magazines yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <MagazineCard key={item.id} item={item} admin={admin} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={() =>
              setVisibleCount((prev) =>
                Math.min(prev + LOAD_MORE_COUNT, items.length),
              )
            }
            className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
          >
            Show More
          </button>
        </div>
      )}
    </>
  );
}
