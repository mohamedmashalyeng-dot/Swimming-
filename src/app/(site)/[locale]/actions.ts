"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { registrationSchema, reviewSchema } from "@/lib/validation";
import type { Locale } from "@/lib/types";

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string> };

// Best-effort in-memory rate limit per IP (the database enforces its own limits too).
const hits = new Map<string, number[]>();
function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

const KNOWN_DB_ERRORS = [
  "SESSION_FULL", "SESSION_CLOSED", "TOO_MANY_REQUESTS", "INVALID_PHONE", "INVALID_EMAIL", "PARENT_REQUIRED",
];

function mapDbError(message: string | undefined) {
  if (!message) return "generic";
  return KNOWN_DB_ERRORS.find((k) => message.includes(k)) ?? "generic";
}

export async function submitRegistrationAction(
  input: unknown,
  locale: Locale,
): Promise<Result<{ reference: string }>> {
  if (!isSupabaseConfigured()) return { ok: false, error: "notConfigured" };

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] = i.message;
    // Honeypot filled → pretend nothing specific, treat as spam.
    if (fields.website) return { ok: false, error: "SPAM" };
    return { ok: false, error: "validation", fields };
  }
  const v = parsed.data;

  // Bots submit instantly; humans take a few seconds to fill 11 fields.
  if (v.started_at && Date.now() - v.started_at < 2500) return { ok: false, error: "SPAM" };
  if (rateLimited(`reg:${await clientIp()}`, 5, 10 * 60_000)) return { ok: false, error: "TOO_MANY_REQUESTS" };

  const isSession = /^[0-9a-f-]{36}$/i.test(v.schedule_id ?? "");
  const payload = {
    student_name: v.student_name,
    parent_name: v.parent_name || null,
    age: v.age,
    phone: v.phone,
    email: v.email || null,
    experience: v.experience,
    course_id: v.course_id || null,
    location_id: v.location_id || null,
    schedule_id: isSession ? v.schedule_id : null,
    preferred_day: v.preferred_day === "" ? null : v.preferred_day,
    preferred_time: isSession ? "session" : (["morning", "afternoon", "evening"].includes(v.schedule_id ?? "") ? v.schedule_id : "any"),
    notes: v.notes || null,
    locale,
  };

  const { data, error } = await createSupabasePublicClient().rpc("submit_registration", { payload });
  if (error) return { ok: false, error: mapDbError(error.message) };

  if (isSession) {
    // seat counts changed → refresh the public schedule
    revalidatePath("/ar");
    revalidatePath("/en");
  }
  return { ok: true, data: { reference: (data as { reference: string }).reference } };
}

export async function submitReviewAction(input: unknown & { locale?: Locale }): Promise<Result> {
  if (!isSupabaseConfigured()) return { ok: false, error: "notConfigured" };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.path[0] === "website" ? "SPAM" : "generic" };
  if (rateLimited(`rev:${await clientIp()}`, 3, 10 * 60_000)) return { ok: false, error: "TOO_MANY_REQUESTS" };
  const locale = (input as { locale?: Locale }).locale === "en" ? "en" : "ar";
  const { error } = await createSupabasePublicClient().rpc("submit_review", {
    payload: { ...parsed.data, locale },
  });
  if (error) return { ok: false, error: mapDbError(error.message) };
  return { ok: true, data: null };
}
