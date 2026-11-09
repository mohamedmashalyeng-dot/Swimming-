export type Locale = "ar" | "en";
export type Level = "beginner" | "intermediate" | "advanced" | "all";
export type CourseType = "group" | "private" | "kids" | "adults" | "professional" | "safety";
export type VideoCategory = "beginner" | "techniques" | "breathing" | "exercises" | "pro_tips" | "water_safety";
export type Experience = "none" | "basic" | "intermediate" | "advanced";
export type RegistrationStatus = "new" | "pending" | "approved" | "rejected" | "completed";
export type ReviewStatus = "pending" | "approved" | "rejected";

interface Base {
  id: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}
interface Orderable {
  is_published: boolean;
  sort_order: number;
}

export interface SiteSettings {
  id: number;
  brand_name_ar: string; brand_name_en: string;
  tagline_ar: string | null; tagline_en: string | null;
  footer_about_ar: string | null; footer_about_en: string | null;
  logo_url: string | null; favicon_url: string | null;
  phone: string | null; whatsapp: string | null;
  whatsapp_message_ar: string | null; whatsapp_message_en: string | null;
  email: string | null;
  address_ar: string | null; address_en: string | null;
  facebook_url: string | null; instagram_url: string | null; youtube_url: string | null;
  tiktok_url: string | null; x_url: string | null;
  currency_ar: string; currency_en: string;
  show_demo_badge: boolean;
  site_url: string | null;
  seo_title_ar: string | null; seo_title_en: string | null;
  seo_description_ar: string | null; seo_description_en: string | null;
  seo_keywords_ar: string | null; seo_keywords_en: string | null;
  og_image_url: string | null;
  google_site_verification: string | null;
  is_demo: boolean;
}

export type SectionKey =
  | "hero" | "about" | "courses" | "videos" | "learning" | "age_groups" | "equipment"
  | "locations" | "schedule" | "reviews" | "faq" | "contact" | "footer";

export interface WebsiteSection extends Base, Orderable {
  key: SectionKey;
  eyebrow_ar: string | null; eyebrow_en: string | null;
  title_ar: string; title_en: string;
  subtitle_ar: string | null; subtitle_en: string | null;
  body_ar: string | null; body_en: string | null;
  cta_primary_ar: string | null; cta_primary_en: string | null;
  cta_secondary_ar: string | null; cta_secondary_en: string | null;
  image_url: string | null; video_url: string | null;
  highlights_ar: string[]; highlights_en: string[];
  notes_ar: string[]; notes_en: string[];
}

export interface Coach extends Base, Orderable {
  name_ar: string; name_en: string;
  title_ar: string | null; title_en: string | null;
  photo_url: string | null;
  bio_ar: string | null; bio_en: string | null;
  philosophy_ar: string | null; philosophy_en: string | null;
  specialties_ar: string[]; specialties_en: string[];
  certifications_ar: string[]; certifications_en: string[];
  achievements_ar: string[]; achievements_en: string[];
  years_experience: number; students_trained: number; programs_count: number; satisfaction_rate: number;
  phone: string | null; email: string | null;
  is_primary: boolean;
}

export interface AgeGroup extends Base, Orderable {
  name_ar: string; name_en: string;
  age_min: number; age_max: number | null;
  icon: string; image_url: string | null;
  approach_ar: string | null; approach_en: string | null;
  objectives_ar: string[]; objectives_en: string[];
  considerations_ar: string[]; considerations_en: string[];
  requires_guardian: boolean;
}

export interface Location extends Base, Orderable {
  name_ar: string; name_en: string;
  image_url: string | null; gallery_urls: string[];
  address_ar: string | null; address_en: string | null;
  city_ar: string | null; city_en: string | null;
  map_url: string | null; map_embed_url: string | null;
  facilities_ar: string[]; facilities_en: string[];
  training_days: number[];
  working_hours_ar: string | null; working_hours_en: string | null;
  phone: string | null; whatsapp: string | null; email: string | null;
}

export interface Course extends Base, Orderable {
  slug: string;
  title_ar: string; title_en: string;
  image_url: string | null;
  summary_ar: string | null; summary_en: string | null;
  description_ar: string | null; description_en: string | null;
  level: Level; course_type: CourseType;
  age_min: number; age_max: number | null;
  duration_weeks: number; session_minutes: number; sessions_count: number;
  objectives_ar: string[]; objectives_en: string[];
  requirements_ar: string[]; requirements_en: string[];
  price: number | null;
  price_note_ar: string | null; price_note_en: string | null;
  is_featured: boolean;
  location_ids?: string[];
}

export interface Video extends Base, Orderable {
  title_ar: string; title_en: string;
  description_ar: string | null; description_en: string | null;
  category: VideoCategory; level: Level;
  video_url: string; provider: "youtube" | "vimeo"; provider_video_id: string;
  thumbnail_url: string | null; duration_seconds: number | null;
  is_featured: boolean;
}

export interface Lesson extends Base, Orderable {
  title_ar: string; title_en: string;
  icon: string; image_url: string | null; video_url: string | null;
  description_ar: string | null; description_en: string | null;
  level: Level; estimated_minutes: number | null;
  steps_ar: string[]; steps_en: string[];
  tips_ar: string[]; tips_en: string[];
  video_ids?: string[];
}

export interface Equipment extends Base, Orderable {
  name_ar: string; name_en: string;
  description_ar: string | null; description_en: string | null;
  icon: string; image_url: string | null;
  category: "essential" | "recommended";
}

export interface Schedule extends Base, Orderable {
  course_id: string; location_id: string;
  coach_id: string | null; age_group_id: string | null;
  day_of_week: number; start_time: string; end_time: string;
  capacity: number; booked_count: number;
  status: "open" | "closed" | "cancelled";
  notes_ar: string | null; notes_en: string | null;
}

export interface Review extends Base {
  customer_name: string; photo_url: string | null; rating: number;
  text_ar: string | null; text_en: string | null;
  course_id: string | null; review_date: string;
  status: ReviewStatus; source: "admin" | "website"; sort_order: number;
}

export interface Faq extends Base, Orderable {
  question_ar: string; question_en: string;
  answer_ar: string; answer_en: string;
}

export interface Registration extends Base {
  reference: string;
  student_id: string | null; course_id: string | null; location_id: string | null; schedule_id: string | null;
  student_name: string; parent_name: string | null; age: number; phone: string; email: string | null;
  experience: Experience; preferred_day: number | null;
  preferred_time: "any" | "morning" | "afternoon" | "evening" | "session" | null;
  notes: string | null; locale: Locale; status: RegistrationStatus; internal_notes: string | null;
}

export interface Student extends Base {
  full_name: string; parent_name: string | null; age: number | null; phone: string;
  email: string | null; experience: Experience | null; notes: string | null;
}

export interface MediaItem extends Base {
  bucket: string; path: string; url: string; file_name: string;
  mime_type: string | null; size_bytes: number | null; folder: string;
  alt_ar: string | null; alt_en: string | null;
}

export interface SiteData {
  settings: SiteSettings;
  sections: Partial<Record<SectionKey, WebsiteSection>>;
  coach: Coach | null;
  courses: Course[];
  videos: Video[];
  lessons: Lesson[];
  ageGroups: AgeGroup[];
  equipment: Equipment[];
  locations: Location[];
  schedules: Schedule[];
  reviews: Review[];
  faqs: Faq[];
}
