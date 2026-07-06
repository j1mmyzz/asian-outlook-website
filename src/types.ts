export type ContentType = "magazine" | "blog" | "newsletter" | "media";

export type ContentItem = {
  id: number;
  type: ContentType;
  title: string;
  slug: string;
  description: string | null;
  cover_image_path: string | null;
  pdf_path: string | null;
  created_at: string;
  is_published: boolean;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  display_order?: number;
};
