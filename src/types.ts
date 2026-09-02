export type ContentType = "magazine" | "blog" | "newsletter" | "media";

export type ContentItem = {
  id: number;
  type: ContentType;
  title: string;
  slug: string;
  description: string | null;
  body_html: string | null;
  cover_image_path: string | null;
  pdf_path: string | null;
  created_at: string;
  is_published: boolean;
  last_edited_by?: string | null;
  last_edited_at?: string | null;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  section?: string | null;
  season?: string | null;
  display_order?: number | null;
  last_edited_by?: string | null;
  last_edited_at?: string | null;
};
