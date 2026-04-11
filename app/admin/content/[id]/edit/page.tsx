"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ContentItem = {
  id: number;
  type: string;
  title: string;
  slug: string;
  pdf_path: string | null;
  cover_image_path: string | null;
};

export default function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const supabase = createClient();
  const [form, setForm] = useState<ContentItem | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("content_items")
        .select("id, type, title, slug, pdf_path, cover_image_path")
        .eq("id", id)
        .single();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setForm(data);
    }

    fetchData();
  }, [id, supabase]);

  async function uploadReplacementFiles(slug: string) {
    let nextPdfPath = form?.pdf_path ?? null;
    let nextCoverPath = form?.cover_image_path ?? null;

    if (pdfFile) {
      const pdfPath = `${slug}/${Date.now()}-${pdfFile.name}`;

      const { error: pdfError } = await supabase.storage
        .from("magazines")
        .upload(pdfPath, pdfFile);

      if (pdfError) {
        throw new Error(`PDF upload failed: ${pdfError.message}`);
      }

      nextPdfPath = pdfPath;
    }

    if (coverFile) {
      const coverPath = `${slug}/${Date.now()}-${coverFile.name}`;

      const { error: coverError } = await supabase.storage
        .from("covers")
        .upload(coverPath, coverFile);

      if (coverError) {
        throw new Error(`Cover upload failed: ${coverError.message}`);
      }

      nextCoverPath = coverPath;
    }

    return { nextPdfPath, nextCoverPath };
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setLoading(true);
    setErrorMessage("");

    try {
      let pdf_path = form.pdf_path;
      let cover_image_path = form.cover_image_path;

      if (form.type === "magazine" && (pdfFile || coverFile)) {
        const uploaded = await uploadReplacementFiles(form.slug);
        pdf_path = uploaded.nextPdfPath;
        cover_image_path = uploaded.nextCoverPath;
      }

      const { error } = await supabase
        .from("content_items")
        .update({
          title: form.title,
          slug: form.slug,
          pdf_path,
          cover_image_path,
        })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      window.location.href =
        form.type === "magazine"
          ? `/magazines/${form.slug}`
          : form.type === "blog"
            ? "/blogs"
            : form.type === "newsletter"
              ? "/newsletters"
              : "/media-production";
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (errorMessage && !form) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-red-600">{errorMessage}</p>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">Edit Content</h1>

      <form
        onSubmit={handleUpdate}
        className="space-y-4 rounded-xl border bg-white p-6"
      >
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded border px-3 py-2"
          placeholder="Title"
        />

        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full rounded border px-3 py-2"
          placeholder="Slug"
        />

        {form.type === "magazine" && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-800">
                Replace PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              {form.pdf_path && (
                <p className="text-sm text-neutral-500">
                  Current PDF: {form.pdf_path}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-800">
                Replace Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              {form.cover_image_path && (
                <p className="text-sm text-neutral-500">
                  Current cover: {form.cover_image_path}
                </p>
              )}
            </div>
          </>
        )}

        {errorMessage && (
          <div className="text-sm text-red-600">{errorMessage}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-950 px-4 py-2 text-white"
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </form>
    </main>
  );
}
