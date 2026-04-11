import NewContentForm from "./NewContentForm";

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const initialType = params.type ?? "";

  return <NewContentForm initialType={initialType} />;
}
