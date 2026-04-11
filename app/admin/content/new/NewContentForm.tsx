"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewContentForm({
  initialType,
}: {
  initialType: string;
}) {
  const supabase = createClient();

  const [form, setForm] = useState({
    type: initialType,
    title: "",
    slug: "",
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function uploadMagazineAssets(slug: string) {
    if (!pdfFile) throw new Error("PDF required.");
    if (!coverFile) throw new Error("Cover image required.");

    const now = Date.now();
    const pdfPath = `${slug}/${now}-${pdfFile.name}`;
    const coverPath = `${slug}/${now}-${coverFile.name}`;

    const { error: pdfError } = await supabase.storage
      .from("magazines")
      .upload(pdfPath, pdfFile);

    if (pdfError) throw new Error(pdfError.message);

    const { error: coverError } = await supabase.storage
      .from("covers")
      .upload(coverPath, coverFile);

    if (coverError) throw new Error(coverError.message);

    return { pdfPath, coverPath };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const slug = form.slug.trim();
      const title = form.title.trim();

      if (!form.type) {
        throw new Error("Please select a content type.");
      }

      if (!title) {
        throw new Error("Title is required.");
      }

      if (!slug) {
        throw new Error("Slug is required.");
      }

      let pdf_path: string | null = null;
      let cover_image_path: string | null = null;

      if (form.type === "magazine") {
        const uploaded = await uploadMagazineAssets(slug);
        pdf_path = uploaded.pdfPath;
        cover_image_path = uploaded.coverPath;
      }

      const { error } = await supabase.from("content_items").insert({
        type: form.type,
        title,
        slug,
        description: null,
        pdf_path,
        cover_image_path,
        is_published: true,
      });

      if (error) throw new Error(error.message);

      window.location.href =
        form.type === "magazine"
          ? "/magazines"
          : form.type === "blog"
            ? "/blogs"
            : form.type === "newsletter"
              ? "/newsletters"
              : "/media-production";
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">New Content</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-6"
      >
        <select
          value={form.type}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, type: e.target.value }))
          }
          className="w-full rounded border px-3 py-2"
          required
        >
          <option value="" disabled>
            Select type
          </option>
          <option value="magazine">Magazine</option>
          <option value="blog">Blog</option>
          <option value="newsletter">Newsletter</option>
          <option value="media">Media</option>
        </select>

        <input
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Title"
          className="w-full rounded border px-3 py-2"
          required
        />

        <input
          value={form.slug}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, slug: e.target.value }))
          }
          placeholder="Slug (example: semester-year-issueNumber, spring-2025-1)"
          className="w-full rounded border px-3 py-2"
          required
        />

        {form.type === "magazine" && (
          <>
            <div>
              <label className="text-sm font-medium">PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full"
                required
              />
            </div>
          </>
        )}

        {errorMessage && (
          <div className="text-sm text-red-600">{errorMessage}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-950 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </main>
  );
}
