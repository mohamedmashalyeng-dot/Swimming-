import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { getAdminLocale, requireAdmin } from "@/lib/admin/auth";
import type { MediaItem } from "@/lib/types";

export const metadata = { title: "Media Library" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const { folder } = await searchParams;
  const { supabase } = await requireAdmin();
  const locale = await getAdminLocale();
  let q = supabase.from("media").select("*").order("created_at", { ascending: false }).limit(500);
  if (folder) q = q.eq("folder", folder);
  const { data } = await q;
  return <MediaLibrary locale={locale} items={(data ?? []) as MediaItem[]} folder={folder ?? ""} />;
}
