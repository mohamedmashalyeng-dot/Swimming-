import { ResourceList } from "@/components/admin/ResourceList";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  return <ResourceList resourceKey="sections" searchParams={await searchParams} />;
}
