import { ResourceList } from "@/components/admin/ResourceList";

export default async function ResourcePage({ params, searchParams }: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ q?: string; page?: string; demo?: string; status?: string }>;
}) {
  const { resource } = await params;
  return <ResourceList resourceKey={resource} searchParams={await searchParams} />;
}
