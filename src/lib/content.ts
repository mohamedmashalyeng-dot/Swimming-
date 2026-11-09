import "server-only";
import { cache } from "react";
import { createSupabasePublicClient } from "./supabase/server";
import { isSupabaseConfigured } from "./env";
import type {
  AgeGroup, Coach, Course, Equipment, Faq, Lesson, Location, Review, Schedule,
  SiteData, SiteSettings, Video, WebsiteSection,
} from "./types";

export class ContentError extends Error {}

/** Loads every published record needed by the one-page site in parallel. */
export const getSiteData = cache(async (): Promise<SiteData | null> => {
  if (!isSupabaseConfigured()) return null;
  const sb = createSupabasePublicClient();

  const [settings, sections, coaches, courses, courseLocs, videos, lessons, lessonVids, ages,
    equipment, locations, schedules, reviews, faqs] = await Promise.all([
    sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("website_sections").select("*").eq("is_published", true),
    sb.from("coaches").select("*").eq("is_published", true).order("is_primary", { ascending: false }).order("sort_order"),
    sb.from("courses").select("*").eq("is_published", true).order("sort_order"),
    sb.from("course_locations").select("course_id, location_id"),
    sb.from("videos").select("*").eq("is_published", true).order("sort_order"),
    sb.from("lessons").select("*").eq("is_published", true).order("sort_order"),
    sb.from("lesson_videos").select("lesson_id, video_id"),
    sb.from("age_groups").select("*").eq("is_published", true).order("sort_order"),
    sb.from("equipment").select("*").eq("is_published", true).order("sort_order"),
    sb.from("locations").select("*").eq("is_published", true).order("sort_order"),
    sb.from("schedules").select("*").eq("is_published", true).order("day_of_week").order("start_time"),
    sb.from("reviews").select("*").eq("status", "approved").order("sort_order").order("review_date", { ascending: false }),
    sb.from("faqs").select("*").eq("is_published", true).order("sort_order"),
  ]);

  const firstError = [settings, sections, coaches, courses, courseLocs, videos, lessons, lessonVids, ages,
    equipment, locations, schedules, reviews, faqs].find((r) => r.error)?.error;
  if (firstError) throw new ContentError(firstError.message);

  const locsByCourse = new Map<string, string[]>();
  for (const r of (courseLocs.data ?? []) as { course_id: string; location_id: string }[]) {
    locsByCourse.set(r.course_id, [...(locsByCourse.get(r.course_id) ?? []), r.location_id]);
  }
  const vidsByLesson = new Map<string, string[]>();
  for (const r of (lessonVids.data ?? []) as { lesson_id: string; video_id: string }[]) {
    vidsByLesson.set(r.lesson_id, [...(vidsByLesson.get(r.lesson_id) ?? []), r.video_id]);
  }

  const sectionMap: SiteData["sections"] = {};
  for (const s of (sections.data ?? []) as WebsiteSection[]) sectionMap[s.key] = s;

  const publishedCourseIds = new Set(((courses.data ?? []) as Course[]).map((c) => c.id));
  const publishedLocationIds = new Set(((locations.data ?? []) as Location[]).map((l) => l.id));

  return {
    settings: (settings.data ?? fallbackSettings()) as SiteSettings,
    sections: sectionMap,
    coach: ((coaches.data ?? [])[0] as Coach) ?? null,
    courses: ((courses.data ?? []) as Course[]).map((c) => ({
      ...c,
      price: c.price == null ? null : Number(c.price),
      location_ids: (locsByCourse.get(c.id) ?? []).filter((id) => publishedLocationIds.has(id)),
    })),
    videos: (videos.data ?? []) as Video[],
    lessons: ((lessons.data ?? []) as Lesson[]).map((l) => ({ ...l, video_ids: vidsByLesson.get(l.id) ?? [] })),
    ageGroups: (ages.data ?? []) as AgeGroup[],
    equipment: (equipment.data ?? []) as Equipment[],
    locations: (locations.data ?? []) as Location[],
    schedules: ((schedules.data ?? []) as Schedule[]).filter(
      (s) => publishedCourseIds.has(s.course_id) && publishedLocationIds.has(s.location_id),
    ),
    reviews: (reviews.data ?? []) as Review[],
    faqs: (faqs.data ?? []) as Faq[],
  };
});

export const getSettings = cache(async (): Promise<SiteSettings | null> => {
  if (!isSupabaseConfigured()) return null;
  const { data } = await createSupabasePublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (data as SiteSettings) ?? null;
});

function fallbackSettings(): Partial<SiteSettings> {
  return {
    id: 1,
    brand_name_ar: "كابتن أمير سلامي",
    brand_name_en: "Captain Amir Salami",
    currency_ar: "ج.م",
    currency_en: "EGP",
    show_demo_badge: true,
  };
}
