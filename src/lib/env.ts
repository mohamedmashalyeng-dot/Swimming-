export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("your-project-ref"));
}

export function siteUrl(fromSettings?: string | null) {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || fromSettings || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
