import type { Locale } from "../types";

/** [arabic, english] label pair */
export type L = [string, string];
export const lbl = (l: L, locale: Locale) => (locale === "ar" ? l[0] : l[1]);

export type FieldType =
  | "text" | "textarea" | "number" | "boolean" | "select" | "image" | "images" | "url" | "email"
  | "time" | "date" | "list" | "relation" | "multi" | "days" | "icon" | "video" | "slug" | "rating";

export interface Option { value: string; label: L }

export interface Field {
  name: string;
  label: L;
  type: FieldType;
  bi?: boolean;           // bilingual: stored as name_ar + name_en
  required?: boolean;
  options?: Option[];
  min?: number;
  max?: number;
  help?: L;
  full?: boolean;         // spans the full form width
  group?: L;              // starts a new titled group in the form
  relation?: { table: string; label: string; bi?: boolean };       // single FK
  join?: { table: string; selfKey: string; otherKey: string; otherTable: string; label: string };
  folder?: string;        // media folder for uploads
  readOnly?: boolean;
}

export type ColumnKind = "image" | "text" | "bi" | "badge" | "bool" | "relation" | "day" | "time" | "capacity" | "rating" | "date" | "number" | "status";
export interface Column { field: string; label: L; kind: ColumnKind; options?: Option[]; relation?: { table: string; label: string } }

export interface Resource {
  key: string;
  table: string;
  title: L;
  singular: L;
  icon: string;
  fields: Field[];
  columns: Column[];
  search: string[];
  orderBy: { column: string; ascending: boolean }[];
  canCreate?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
  publishField?: "is_published" | null;
  managerOnly?: boolean;
  defaults?: Record<string, unknown>;
  description?: L;
}

// ---------- shared option lists ---------------------------------------
export const LEVELS: Option[] = [
  { value: "beginner", label: ["مبتدئ", "Beginner"] },
  { value: "intermediate", label: ["متوسط", "Intermediate"] },
  { value: "advanced", label: ["متقدم", "Advanced"] },
  { value: "all", label: ["كل المستويات", "All levels"] },
];
export const COURSE_TYPES: Option[] = [
  { value: "group", label: ["جماعي", "Group"] },
  { value: "private", label: ["خاص", "Private"] },
  { value: "kids", label: ["أطفال", "Kids"] },
  { value: "adults", label: ["كبار", "Adults"] },
  { value: "professional", label: ["احترافي", "Professional"] },
  { value: "safety", label: ["أمان", "Safety"] },
];
export const VIDEO_CATEGORIES: Option[] = [
  { value: "beginner", label: ["دروس المبتدئين", "Beginner Lessons"] },
  { value: "techniques", label: ["أساليب السباحة", "Swimming Techniques"] },
  { value: "breathing", label: ["تقنيات التنفس", "Breathing Techniques"] },
  { value: "exercises", label: ["تمارين السباحة", "Swimming Exercises"] },
  { value: "pro_tips", label: ["نصائح احترافية", "Professional Tips"] },
  { value: "water_safety", label: ["السلامة في الماء", "Water Safety"] },
];
export const EXPERIENCE: Option[] = [
  { value: "none", label: ["مبتدئ تماماً", "Complete beginner"] },
  { value: "basic", label: ["خبرة بسيطة", "Basic experience"] },
  { value: "intermediate", label: ["متوسط", "Intermediate"] },
  { value: "advanced", label: ["متقدم", "Advanced"] },
];
export const REG_STATUSES: Option[] = [
  { value: "new", label: ["جديد", "New"] },
  { value: "pending", label: ["قيد المراجعة", "Pending"] },
  { value: "approved", label: ["مقبول", "Approved"] },
  { value: "rejected", label: ["مرفوض", "Rejected"] },
  { value: "completed", label: ["مكتمل", "Completed"] },
];
export const REVIEW_STATUSES: Option[] = [
  { value: "pending", label: ["قيد المراجعة", "Pending"] },
  { value: "approved", label: ["معتمد", "Approved"] },
  { value: "rejected", label: ["مرفوض", "Rejected"] },
];
export const SESSION_STATUSES: Option[] = [
  { value: "open", label: ["مفتوح", "Open"] },
  { value: "closed", label: ["مغلق", "Closed"] },
  { value: "cancelled", label: ["ملغي", "Cancelled"] },
];
export const DAYS: L[] = [
  ["السبت", "Saturday"], ["الأحد", "Sunday"], ["الاثنين", "Monday"], ["الثلاثاء", "Tuesday"],
  ["الأربعاء", "Wednesday"], ["الخميس", "Thursday"], ["الجمعة", "Friday"],
];
export const DAY_OPTIONS: Option[] = DAYS.map((d, i) => ({ value: String(i), label: d }));

const published: Field = { name: "is_published", label: ["منشور", "Published"], type: "boolean" };
const order: Field = { name: "sort_order", label: ["الترتيب", "Sort order"], type: "number", min: 0 };
const demo: Field = { name: "is_demo", label: ["بيانات تجريبية", "Demo record"], type: "boolean", help: ["علّم السجلات التجريبية لحذفها لاحقاً بسهولة.", "Flag demo records so they can be removed easily later."] };
const pubCol: Column = { field: "is_published", label: ["منشور", "Published"], kind: "bool" };

// ---------- resources -------------------------------------------------
export const RESOURCES: Record<string, Resource> = {
  courses: {
    key: "courses", table: "courses", icon: "graduation-cap",
    title: ["الكورسات", "Courses"], singular: ["كورس", "Course"],
    search: ["title_ar", "title_en", "slug"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { level: "beginner", course_type: "group", age_min: 6, duration_weeks: 8, session_minutes: 45, sessions_count: 16, is_published: true },
    columns: [
      { field: "image_url", label: ["", ""], kind: "image" },
      { field: "title", label: ["الكورس", "Course"], kind: "bi" },
      { field: "level", label: ["المستوى", "Level"], kind: "badge", options: LEVELS },
      { field: "course_type", label: ["النوع", "Type"], kind: "badge", options: COURSE_TYPES },
      { field: "price", label: ["السعر", "Price"], kind: "number" },
      pubCol,
    ],
    fields: [
      { name: "title", label: ["اسم الكورس", "Course name"], type: "text", bi: true, required: true, group: ["المعلومات الأساسية", "Basics"] },
      { name: "slug", label: ["المعرّف (slug)", "Slug"], type: "slug", required: true, help: ["أحرف إنجليزية صغيرة وشرطات فقط، مثل beginner-swimming", "Lowercase letters, numbers and dashes, e.g. beginner-swimming"] },
      { name: "image_url", label: ["صورة الكورس", "Course image"], type: "image", folder: "courses" },
      { name: "summary", label: ["وصف مختصر", "Short summary"], type: "text", bi: true },
      { name: "description", label: ["الوصف", "Description"], type: "textarea", bi: true },
      { name: "level", label: ["المستوى", "Skill level"], type: "select", options: LEVELS, required: true, group: ["التفاصيل", "Details"] },
      { name: "course_type", label: ["نوع الكورس", "Course type"], type: "select", options: COURSE_TYPES, required: true },
      { name: "age_min", label: ["أقل عمر", "Minimum age"], type: "number", min: 0, max: 100, required: true },
      { name: "age_max", label: ["أقصى عمر (اتركه فارغاً بلا حد)", "Maximum age (blank = no limit)"], type: "number", min: 0, max: 120 },
      { name: "duration_weeks", label: ["المدة (أسابيع)", "Duration (weeks)"], type: "number", min: 1, required: true },
      { name: "sessions_count", label: ["عدد الحصص", "Number of sessions"], type: "number", min: 1, required: true },
      { name: "session_minutes", label: ["مدة الحصة (دقيقة)", "Session length (min)"], type: "number", min: 1, required: true },
      { name: "objectives", label: ["أهداف التدريب (سطر لكل هدف)", "Training objectives (one per line)"], type: "list", bi: true },
      { name: "requirements", label: ["المتطلبات (سطر لكل متطلب)", "Requirements (one per line)"], type: "list", bi: true },
      { name: "price", label: ["السعر", "Price"], type: "number", min: 0, group: ["السعر والأماكن", "Pricing & locations"] },
      { name: "price_note", label: ["ملاحظة السعر", "Price note"], type: "text", bi: true },
      { name: "location_ids", label: ["الأماكن المتاحة", "Available locations"], type: "multi", join: { table: "course_locations", selfKey: "course_id", otherKey: "location_id", otherTable: "locations", label: "name" }, full: true },
      { name: "is_featured", label: ["كورس مميز", "Featured"], type: "boolean", group: ["النشر", "Publishing"] },
      published, order, demo,
    ],
  },

  videos: {
    key: "videos", table: "videos", icon: "play-circle",
    title: ["الفيديوهات", "Videos"], singular: ["فيديو", "Video"],
    search: ["title_ar", "title_en", "video_url"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { category: "beginner", level: "beginner", is_published: true },
    columns: [
      { field: "thumbnail", label: ["", ""], kind: "image" },
      { field: "title", label: ["العنوان", "Title"], kind: "bi" },
      { field: "category", label: ["التصنيف", "Category"], kind: "badge", options: VIDEO_CATEGORIES },
      { field: "provider", label: ["المنصة", "Provider"], kind: "text" },
      { field: "is_featured", label: ["مميز", "Featured"], kind: "bool" },
      pubCol,
    ],
    fields: [
      { name: "video_url", label: ["رابط الفيديو (YouTube أو Vimeo)", "Video URL (YouTube or Vimeo)"], type: "video", required: true, full: true,
        help: ["الصق رابط الفيديو فقط — سيتم التعرف على المنصة والصورة المصغرة تلقائياً.", "Just paste the link — provider and thumbnail are detected automatically."] },
      { name: "title", label: ["العنوان", "Title"], type: "text", bi: true, required: true },
      { name: "description", label: ["الوصف", "Description"], type: "textarea", bi: true },
      { name: "category", label: ["التصنيف", "Category"], type: "select", options: VIDEO_CATEGORIES, required: true },
      { name: "level", label: ["المستوى", "Skill level"], type: "select", options: LEVELS, required: true },
      { name: "duration_seconds", label: ["المدة (بالثواني)", "Duration (seconds)"], type: "number", min: 0 },
      { name: "thumbnail_url", label: ["صورة مصغرة مخصصة (اختياري)", "Custom thumbnail (optional)"], type: "image", folder: "thumbnails" },
      { name: "is_featured", label: ["فيديو مميز", "Featured video"], type: "boolean" },
      published, order, demo,
    ],
  },

  lessons: {
    key: "lessons", table: "lessons", icon: "book-open",
    title: ["دروس التعلّم", "Learning Lessons"], singular: ["درس", "Lesson"],
    search: ["title_ar", "title_en"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { level: "beginner", icon: "waves", is_published: true },
    columns: [
      { field: "image_url", label: ["", ""], kind: "image" },
      { field: "title", label: ["الدرس", "Lesson"], kind: "bi" },
      { field: "level", label: ["المستوى", "Level"], kind: "badge", options: LEVELS },
      { field: "estimated_minutes", label: ["الوقت (د)", "Time (min)"], kind: "number" },
      pubCol,
    ],
    fields: [
      { name: "title", label: ["عنوان الدرس", "Lesson title"], type: "text", bi: true, required: true },
      { name: "icon", label: ["الأيقونة", "Icon"], type: "icon" },
      { name: "image_url", label: ["الصورة", "Image"], type: "image", folder: "lessons" },
      { name: "video_url", label: ["رابط فيديو الدرس (اختياري)", "Lesson video URL (optional)"], type: "url" },
      { name: "description", label: ["الوصف", "Description"], type: "textarea", bi: true },
      { name: "level", label: ["المستوى", "Skill level"], type: "select", options: LEVELS, required: true },
      { name: "estimated_minutes", label: ["الوقت المتوقع (دقيقة)", "Estimated time (min)"], type: "number", min: 1 },
      { name: "steps", label: ["الخطوات (سطر لكل خطوة)", "Steps (one per line)"], type: "list", bi: true },
      { name: "tips", label: ["نصائح مهمة (سطر لكل نصيحة)", "Important tips (one per line)"], type: "list", bi: true },
      { name: "video_ids", label: ["فيديوهات ذات صلة", "Related videos"], type: "multi", join: { table: "lesson_videos", selfKey: "lesson_id", otherKey: "video_id", otherTable: "videos", label: "title" }, full: true },
      published, order, demo,
    ],
  },

  "age-groups": {
    key: "age-groups", table: "age_groups", icon: "users",
    title: ["الفئات العمرية", "Age Groups"], singular: ["فئة عمرية", "Age group"],
    search: ["name_ar", "name_en"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { icon: "users", age_min: 6, is_published: true },
    columns: [
      { field: "image_url", label: ["", ""], kind: "image" },
      { field: "name", label: ["الفئة", "Group"], kind: "bi" },
      { field: "age_min", label: ["من", "From"], kind: "number" },
      { field: "age_max", label: ["إلى", "To"], kind: "number" },
      { field: "requires_guardian", label: ["ولي أمر", "Guardian"], kind: "bool" },
      pubCol,
    ],
    fields: [
      { name: "name", label: ["اسم الفئة", "Group name"], type: "text", bi: true, required: true },
      { name: "age_min", label: ["من عمر", "Age from"], type: "number", min: 0, max: 120, required: true },
      { name: "age_max", label: ["إلى عمر (فارغ = بلا حد)", "Age to (blank = no limit)"], type: "number", min: 0, max: 120 },
      { name: "icon", label: ["الأيقونة", "Icon"], type: "icon" },
      { name: "image_url", label: ["الصورة", "Image"], type: "image", folder: "general" },
      { name: "approach", label: ["أسلوب التعلّم", "Learning approach"], type: "textarea", bi: true },
      { name: "objectives", label: ["أهداف التدريب (سطر لكل هدف)", "Training objectives (one per line)"], type: "list", bi: true },
      { name: "considerations", label: ["اعتبارات خاصة (سطر لكل بند)", "Special considerations (one per line)"], type: "list", bi: true },
      { name: "requires_guardian", label: ["تتطلب بيانات ولي الأمر", "Requires parent/guardian info"], type: "boolean" },
      published, order, demo,
    ],
  },

  equipment: {
    key: "equipment", table: "equipment", icon: "backpack",
    title: ["الأدوات والمتطلبات", "Equipment"], singular: ["أداة", "Equipment item"],
    search: ["name_ar", "name_en"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { icon: "package", category: "essential", is_published: true },
    description: ["تعليمات التحضير ومتطلبات السلامة تُعدّل من: محتوى الموقع ← قسم الأدوات.", "Preparation instructions & safety rules are edited in Website Content → Equipment section."],
    columns: [
      { field: "name", label: ["الأداة", "Item"], kind: "bi" },
      { field: "category", label: ["النوع", "Type"], kind: "badge", options: [{ value: "essential", label: ["أساسي", "Essential"] }, { value: "recommended", label: ["موصى به", "Recommended"] }] },
      { field: "icon", label: ["الأيقونة", "Icon"], kind: "text" },
      pubCol,
    ],
    fields: [
      { name: "name", label: ["الاسم", "Name"], type: "text", bi: true, required: true },
      { name: "description", label: ["الوصف", "Description"], type: "textarea", bi: true },
      { name: "category", label: ["النوع", "Type"], type: "select", options: [{ value: "essential", label: ["أساسي", "Essential"] }, { value: "recommended", label: ["موصى به", "Recommended"] }], required: true },
      { name: "icon", label: ["الأيقونة", "Icon"], type: "icon" },
      { name: "image_url", label: ["صورة (اختياري — تحل محل الأيقونة)", "Image (optional — replaces icon)"], type: "image", folder: "general" },
      published, order, demo,
    ],
  },

  locations: {
    key: "locations", table: "locations", icon: "map-pin",
    title: ["أماكن التدريب", "Locations"], singular: ["مكان", "Location"],
    search: ["name_ar", "name_en", "address_ar", "address_en"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { is_published: true, training_days: [] },
    columns: [
      { field: "image_url", label: ["", ""], kind: "image" },
      { field: "name", label: ["المكان", "Location"], kind: "bi" },
      { field: "city", label: ["المدينة", "City"], kind: "bi" },
      { field: "phone", label: ["الهاتف", "Phone"], kind: "text" },
      pubCol,
    ],
    fields: [
      { name: "name", label: ["اسم المكان", "Location name"], type: "text", bi: true, required: true },
      { name: "image_url", label: ["صورة حمام السباحة", "Pool photo"], type: "image", folder: "locations" },
      { name: "gallery_urls", label: ["معرض الصور (رابط في كل سطر)", "Photo gallery (one URL per line)"], type: "images", folder: "locations", full: true },
      { name: "address", label: ["العنوان", "Address"], type: "text", bi: true },
      { name: "city", label: ["المدينة", "City"], type: "text", bi: true },
      { name: "map_url", label: ["رابط خرائط جوجل", "Google Maps link"], type: "url", help: ["رابط يفتح الموقع في خرائط جوجل.", "A link that opens the place in Google Maps."] },
      { name: "map_embed_url", label: ["رابط تضمين الخريطة", "Map embed URL"], type: "url", help: ["من خرائط جوجل: مشاركة ← تضمين خريطة ← انسخ رابط src، أو استخدم https://www.google.com/maps?q=العنوان&output=embed", "From Google Maps: Share → Embed a map → copy the src URL, or use https://www.google.com/maps?q=ADDRESS&output=embed"] },
      { name: "facilities", label: ["المرافق (سطر لكل مرفق)", "Facilities (one per line)"], type: "list", bi: true },
      { name: "training_days", label: ["أيام التدريب", "Training days"], type: "days", full: true },
      { name: "working_hours", label: ["مواعيد العمل", "Working hours"], type: "text", bi: true },
      { name: "phone", label: ["الهاتف", "Phone"], type: "text" },
      { name: "whatsapp", label: ["واتساب (أرقام فقط بالكود الدولي)", "WhatsApp (digits with country code)"], type: "text" },
      { name: "email", label: ["البريد الإلكتروني", "Email"], type: "email" },
      published, order, demo,
    ],
  },

  schedules: {
    key: "schedules", table: "schedules", icon: "calendar-days",
    title: ["جدول التدريب", "Schedules"], singular: ["حصة", "Session"],
    search: [],
    orderBy: [{ column: "day_of_week", ascending: true }, { column: "start_time", ascending: true }],
    canCreate: true, canDelete: true, canReorder: false, publishField: "is_published",
    defaults: { day_of_week: 0, start_time: "16:00", end_time: "17:00", capacity: 10, booked_count: 0, status: "open", is_published: true },
    description: ["عدد المحجوز يتحدث تلقائياً عند التسجيل أو تغيير حالة الطلب، ولا يمكن أن يتجاوز السعة.", "Booked seats update automatically with registrations and can never exceed capacity."],
    columns: [
      { field: "day_of_week", label: ["اليوم", "Day"], kind: "day" },
      { field: "start_time", label: ["الوقت", "Time"], kind: "time" },
      { field: "course_id", label: ["الكورس", "Course"], kind: "relation", relation: { table: "courses", label: "title" } },
      { field: "location_id", label: ["المكان", "Location"], kind: "relation", relation: { table: "locations", label: "name" } },
      { field: "capacity", label: ["الأماكن", "Seats"], kind: "capacity" },
      { field: "status", label: ["الحالة", "Status"], kind: "badge", options: SESSION_STATUSES },
      pubCol,
    ],
    fields: [
      { name: "course_id", label: ["الكورس", "Course"], type: "relation", relation: { table: "courses", label: "title", bi: true }, required: true },
      { name: "location_id", label: ["المكان", "Location"], type: "relation", relation: { table: "locations", label: "name", bi: true }, required: true },
      { name: "coach_id", label: ["المدرب", "Coach"], type: "relation", relation: { table: "coaches", label: "name", bi: true } },
      { name: "age_group_id", label: ["الفئة العمرية", "Age group"], type: "relation", relation: { table: "age_groups", label: "name", bi: true } },
      { name: "day_of_week", label: ["اليوم", "Day"], type: "select", options: DAY_OPTIONS, required: true },
      { name: "start_time", label: ["وقت البداية", "Start time"], type: "time", required: true },
      { name: "end_time", label: ["وقت النهاية", "End time"], type: "time", required: true },
      { name: "capacity", label: ["السعة القصوى", "Maximum capacity"], type: "number", min: 1, required: true },
      { name: "booked_count", label: ["الأماكن المحجوزة", "Booked seats"], type: "number", min: 0, required: true, help: ["يشمل الحجوزات خارج الموقع. يتحدث تلقائياً مع طلبات التسجيل.", "Includes offline bookings. Updated automatically by registrations."] },
      { name: "status", label: ["حالة الحجز", "Booking status"], type: "select", options: SESSION_STATUSES, required: true },
      { name: "notes", label: ["ملاحظات", "Notes"], type: "text", bi: true },
      published, demo,
    ],
  },

  students: {
    key: "students", table: "students", icon: "user-round", managerOnly: true,
    title: ["المتدربون", "Students"], singular: ["متدرب", "Student"],
    search: ["full_name", "parent_name", "phone", "email"],
    orderBy: [{ column: "created_at", ascending: false }],
    canCreate: true, canDelete: true, canReorder: false, publishField: null,
    columns: [
      { field: "full_name", label: ["الاسم", "Name"], kind: "text" },
      { field: "age", label: ["العمر", "Age"], kind: "number" },
      { field: "phone", label: ["الهاتف", "Phone"], kind: "text" },
      { field: "parent_name", label: ["ولي الأمر", "Parent"], kind: "text" },
      { field: "experience", label: ["الخبرة", "Experience"], kind: "badge", options: EXPERIENCE },
      { field: "created_at", label: ["تاريخ الإضافة", "Added"], kind: "date" },
    ],
    fields: [
      { name: "full_name", label: ["الاسم بالكامل", "Full name"], type: "text", required: true },
      { name: "parent_name", label: ["اسم ولي الأمر", "Parent / guardian"], type: "text" },
      { name: "age", label: ["العمر", "Age"], type: "number", min: 1, max: 100 },
      { name: "phone", label: ["الهاتف", "Phone"], type: "text", required: true },
      { name: "email", label: ["البريد الإلكتروني", "Email"], type: "email" },
      { name: "experience", label: ["الخبرة", "Experience"], type: "select", options: EXPERIENCE },
      { name: "notes", label: ["ملاحظات داخلية", "Internal notes"], type: "textarea", full: true },
      demo,
    ],
  },

  reviews: {
    key: "reviews", table: "reviews", icon: "star",
    title: ["آراء العملاء", "Reviews"], singular: ["رأي", "Review"],
    search: ["customer_name", "text_ar", "text_en"],
    orderBy: [{ column: "sort_order", ascending: true }, { column: "created_at", ascending: false }],
    canCreate: true, canDelete: true, canReorder: true, publishField: null,
    defaults: { rating: 5, status: "approved" },
    description: ["الآراء المرسلة من الموقع تصل بحالة «قيد المراجعة» ولا تظهر حتى تعتمدها.", "Reviews submitted on the website arrive as Pending and stay hidden until you approve them."],
    columns: [
      { field: "customer_name", label: ["العميل", "Customer"], kind: "text" },
      { field: "rating", label: ["التقييم", "Rating"], kind: "rating" },
      { field: "text", label: ["الرأي", "Review"], kind: "bi" },
      { field: "review_date", label: ["التاريخ", "Date"], kind: "date" },
      { field: "status", label: ["الحالة", "Status"], kind: "status", options: REVIEW_STATUSES },
    ],
    fields: [
      { name: "customer_name", label: ["اسم العميل", "Customer name"], type: "text", required: true },
      { name: "photo_url", label: ["الصورة (اختياري)", "Photo (optional)"], type: "image", folder: "reviews" },
      { name: "rating", label: ["التقييم", "Rating"], type: "rating", required: true, min: 1, max: 5 },
      { name: "text", label: ["نص الرأي", "Review text"], type: "textarea", bi: true },
      { name: "course_id", label: ["الكورس", "Course attended"], type: "relation", relation: { table: "courses", label: "title", bi: true } },
      { name: "review_date", label: ["تاريخ الرأي", "Review date"], type: "date", required: true },
      { name: "status", label: ["حالة الموافقة", "Approval status"], type: "select", options: REVIEW_STATUSES, required: true },
      order, demo,
    ],
  },

  faqs: {
    key: "faqs", table: "faqs", icon: "help-circle",
    title: ["الأسئلة الشائعة", "FAQs"], singular: ["سؤال", "Question"],
    search: ["question_ar", "question_en"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { is_published: true },
    columns: [
      { field: "question", label: ["السؤال", "Question"], kind: "bi" },
      pubCol,
    ],
    fields: [
      { name: "question", label: ["السؤال", "Question"], type: "text", bi: true, required: true },
      { name: "answer", label: ["الإجابة", "Answer"], type: "textarea", bi: true, required: true },
      published, order, demo,
    ],
  },

  // ---- singleton-ish resources edited through dedicated menu items ----
  coaches: {
    key: "coaches", table: "coaches", icon: "user-check",
    title: ["عن كابتن أمير", "About Captain Amir"], singular: ["المدرب", "Coach"],
    search: ["name_ar", "name_en"],
    orderBy: [{ column: "is_primary", ascending: false }, { column: "sort_order", ascending: true }],
    canCreate: true, canDelete: true, canReorder: true, publishField: "is_published",
    defaults: { is_published: true },
    columns: [
      { field: "photo_url", label: ["", ""], kind: "image" },
      { field: "name", label: ["الاسم", "Name"], kind: "bi" },
      { field: "is_primary", label: ["المدرب الرئيسي", "Primary"], kind: "bool" },
      pubCol,
    ],
    fields: [
      { name: "name", label: ["الاسم", "Full name"], type: "text", bi: true, required: true, group: ["الملف الشخصي", "Profile"] },
      { name: "title", label: ["المسمى", "Title"], type: "text", bi: true },
      { name: "photo_url", label: ["الصورة الشخصية", "Profile photo"], type: "image", folder: "coach" },
      { name: "bio", label: ["السيرة الذاتية", "Biography"], type: "textarea", bi: true },
      { name: "philosophy", label: ["فلسفة التدريب", "Training philosophy"], type: "textarea", bi: true },
      { name: "specialties", label: ["التخصصات (سطر لكل تخصص)", "Specialties (one per line)"], type: "list", bi: true, group: ["الخبرات", "Expertise"] },
      { name: "certifications", label: ["المؤهلات والشهادات", "Qualifications & certifications"], type: "list", bi: true },
      { name: "achievements", label: ["الإنجازات", "Achievements"], type: "list", bi: true },
      { name: "students_trained", label: ["عدد المتدربين", "Students trained"], type: "number", min: 0, required: true, group: ["الإحصائيات", "Statistics"] },
      { name: "years_experience", label: ["سنوات الخبرة", "Years of experience"], type: "number", min: 0, required: true },
      { name: "programs_count", label: ["عدد البرامج", "Training programs"], type: "number", min: 0, required: true },
      { name: "satisfaction_rate", label: ["نسبة الرضا %", "Customer satisfaction %"], type: "number", min: 0, max: 100, required: true },
      { name: "phone", label: ["الهاتف", "Phone"], type: "text", group: ["التواصل", "Contact"] },
      { name: "email", label: ["البريد الإلكتروني", "Email"], type: "email" },
      { name: "is_primary", label: ["المدرب الرئيسي (يظهر في قسم «عن الكابتن»)", "Primary coach (shown in About)"], type: "boolean" },
      published, order, demo,
    ],
  },

  sections: {
    key: "sections", table: "website_sections", icon: "layout",
    title: ["محتوى الموقع", "Website Content"], singular: ["قسم", "Section"],
    search: ["key", "title_ar", "title_en"],
    orderBy: [{ column: "sort_order", ascending: true }],
    canCreate: false, canDelete: false, canReorder: false, publishField: "is_published",
    description: ["إخفاء قسم يزيله من الصفحة ومن القائمة. ترتيب الأقسام ثابت للحفاظ على تجربة الصفحة الواحدة.", "Unpublishing a section hides it from the page and the menu."],
    columns: [
      { field: "key", label: ["القسم", "Section"], kind: "text" },
      { field: "title", label: ["العنوان", "Heading"], kind: "bi" },
      pubCol,
    ],
    fields: [
      { name: "key", label: ["القسم", "Section key"], type: "text", readOnly: true },
      { name: "eyebrow", label: ["العنوان الصغير", "Eyebrow"], type: "text", bi: true },
      { name: "title", label: ["العنوان الرئيسي", "Heading"], type: "text", bi: true, required: true },
      { name: "subtitle", label: ["الوصف", "Subtitle"], type: "textarea", bi: true },
      { name: "cta_primary", label: ["نص الزر الأساسي", "Primary button text"], type: "text", bi: true, help: ["للقسم الرئيسي (Hero) وقسم التسجيل.", "Used by Hero and Contact sections."] },
      { name: "cta_secondary", label: ["نص الزر الثانوي", "Secondary button text"], type: "text", bi: true },
      { name: "image_url", label: ["صورة الخلفية", "Background image"], type: "image", folder: "general", help: ["للقسم الرئيسي (Hero).", "Used by the Hero section."] },
      { name: "video_url", label: ["فيديو خلفية (رابط mp4 اختياري)", "Background video (optional .mp4 URL)"], type: "url" },
      { name: "highlights", label: ["نقاط مميزة / تعليمات التحضير (سطر لكل بند)", "Highlights / preparation steps (one per line)"], type: "list", bi: true },
      { name: "notes", label: ["متطلبات السلامة (سطر لكل بند)", "Safety requirements (one per line)"], type: "list", bi: true },
      published,
    ],
  },
};

export const SETTINGS_FIELDS: Field[] = [
  { name: "brand_name", label: ["اسم العلامة", "Brand name"], type: "text", bi: true, required: true, group: ["الهوية", "Brand"] },
  { name: "tagline", label: ["الشعار النصي", "Tagline"], type: "text", bi: true },
  { name: "footer_about", label: ["نبذة الفوتر", "Footer description"], type: "textarea", bi: true },
  { name: "logo_url", label: ["الشعار (اختياري)", "Logo (optional)"], type: "image", folder: "brand" },
  { name: "favicon_url", label: ["أيقونة المتصفح", "Favicon"], type: "image", folder: "brand" },
  { name: "phone", label: ["رقم الهاتف", "Phone number"], type: "text", group: ["التواصل", "Contact"] },
  { name: "whatsapp", label: ["رقم واتساب (أرقام بالكود الدولي، مثل 201000000000)", "WhatsApp number (digits incl. country code, e.g. 201000000000)"], type: "text" },
  { name: "whatsapp_message", label: ["رسالة واتساب الافتراضية", "Default WhatsApp message"], type: "text", bi: true },
  { name: "email", label: ["البريد الإلكتروني", "Email"], type: "email" },
  { name: "address", label: ["العنوان", "Address"], type: "text", bi: true },
  { name: "facebook_url", label: ["فيسبوك", "Facebook"], type: "url", group: ["التواصل الاجتماعي", "Social media"] },
  { name: "instagram_url", label: ["إنستجرام", "Instagram"], type: "url" },
  { name: "youtube_url", label: ["يوتيوب", "YouTube"], type: "url" },
  { name: "tiktok_url", label: ["تيك توك", "TikTok"], type: "url" },
  { name: "x_url", label: ["إكس (تويتر)", "X (Twitter)"], type: "url" },
  { name: "currency", label: ["العملة", "Currency"], type: "text", bi: true, required: true, group: ["عام", "General"] },
  { name: "show_demo_badge", label: ["إظهار علامة «تجريبي» على المحتوى التجريبي", "Show “Demo” badges on demo content"], type: "boolean" },
];

export const SEO_FIELDS: Field[] = [
  { name: "site_url", label: ["رابط الموقع الأساسي", "Primary site URL"], type: "url", help: ["مثل https://www.example.com — يُستخدم للروابط الأساسية وخريطة الموقع.", "e.g. https://www.example.com — used for canonical URLs and the sitemap."] },
  { name: "seo_title", label: ["عنوان الصفحة (SEO)", "SEO title"], type: "text", bi: true, required: true },
  { name: "seo_description", label: ["وصف الصفحة (SEO)", "SEO description"], type: "textarea", bi: true, required: true, help: ["يفضّل 150–160 حرفاً.", "Ideally 150–160 characters."] },
  { name: "seo_keywords", label: ["الكلمات المفتاحية (مفصولة بفاصلة)", "Keywords (comma separated)"], type: "text", bi: true },
  { name: "og_image_url", label: ["صورة المشاركة (Open Graph) 1200×630", "Social share image (Open Graph) 1200×630"], type: "image", folder: "brand" },
  { name: "google_site_verification", label: ["كود تحقق Google Search Console", "Google Search Console verification code"], type: "text" },
];

export function getResource(key: string): Resource | null {
  return RESOURCES[key] ?? null;
}
