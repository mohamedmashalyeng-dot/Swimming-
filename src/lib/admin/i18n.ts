import type { Locale } from "../types";

const en = {
  dashboard: "Dashboard",
  brandAdmin: "Admin Dashboard",
  viewSite: "View website",
  signOut: "Sign out",
  language: "العربية",
  nav: {
    overview: "Overview", about: "About Captain Amir", courses: "Courses", videos: "Videos", lessons: "Learning Lessons",
    "age-groups": "Age Groups", equipment: "Equipment", locations: "Locations", schedules: "Schedules",
    registrations: "Registrations", students: "Students", reviews: "Reviews", faqs: "FAQs", content: "Website Content",
    media: "Media Library", seo: "SEO Settings", settings: "General Settings",
  },
  login: {
    title: "Sign in to the dashboard", email: "Email", password: "Password", submit: "Sign in", signingIn: "Signing in…",
    invalid: "Invalid email or password.", notAdmin: "This account does not have admin access.",
    notConfigured: "Supabase is not configured. Set the environment variables first (see README).",
    back: "Back to website",
  },
  common: {
    add: "Add new", edit: "Edit", delete: "Delete", save: "Save changes", saving: "Saving…", cancel: "Cancel",
    search: "Search…", publish: "Publish", unpublish: "Unpublish", published: "Published", draft: "Hidden",
    moveUp: "Move up", moveDown: "Move down", confirmDelete: "Delete this item?", confirmDeleteBody: "This action cannot be undone.",
    yes: "Yes, delete", saved: "Saved successfully.", deleted: "Deleted.", error: "Something went wrong.",
    empty: "No items yet.", emptySearch: "No items match your search.", back: "Back", actions: "Actions",
    page: "Page", of: "of", prev: "Previous", next: "Next", total: "total", demo: "Demo", none: "—",
    arabic: "Arabic", english: "English", required: "Required", upload: "Upload", library: "Library",
    choose: "Choose", remove: "Remove", uploading: "Uploading…", preview: "Preview", all: "All", filter: "Filter",
    exportCsv: "Export CSV", details: "Details", close: "Close", approve: "Approve", reject: "Reject",
    yesNo: ["No", "Yes"],
  },
  overview: {
    welcome: "Welcome back", totalRegs: "Total registrations", newRegs: "New registrations", approved: "Approved bookings",
    pending: "Pending bookings", courses: "Courses", videos: "Videos", locations: "Locations", reviews: "Reviews",
    sessions: "Open sessions", students: "Students", upcoming: "Upcoming sessions", recentRegs: "Recent registrations",
    latestReviews: "Latest reviews", regsChart: "Registrations — last 14 days", statusChart: "By status",
    byCourse: "Registrations by course", viewAll: "View all", demoBanner: "The site currently contains demo records. Replace or delete them from each section (filter: Demo).",
    pendingReviews: "reviews waiting for approval",
  },
  regs: {
    reference: "Ref.", student: "Student", parent: "Parent", age: "Age", phone: "Phone", email: "Email", course: "Course",
    location: "Location", session: "Session", day: "Preferred day", time: "Preferred time", experience: "Experience",
    notes: "Student notes", internal: "Internal notes", status: "Status", created: "Submitted", updateStatus: "Update",
    seatNote: "Registrations linked to a session hold a seat while New, Pending or Approved.",
    full: "This session is full — the status change was refused.",
    times: { any: "Any time", morning: "Morning", afternoon: "Afternoon", evening: "Evening", session: "Specific session" },
    whatsapp: "WhatsApp", call: "Call",
  },
  media: {
    title: "Media Library", upload: "Upload images", folder: "Folder", copy: "Copy URL", copied: "Copied!", replace: "Replace",
    hint: "JPG, PNG, WebP, AVIF, GIF or SVG — up to 10 MB.", empty: "No media uploaded yet.", alt: "Alt text",
    inUseWarning: "Make sure this image is not used anywhere before deleting it.",
  },
  settings: { saved: "Settings saved.", title: "General Settings", seoTitle: "SEO Settings", managerOnly: "Only admins can change settings." },
  forbidden: "You don't have permission to view this page.",
};

type AdminDict = typeof en;

const ar: AdminDict = {
  dashboard: "لوحة التحكم",
  brandAdmin: "لوحة الإدارة",
  viewSite: "عرض الموقع",
  signOut: "تسجيل الخروج",
  language: "English",
  nav: {
    overview: "نظرة عامة", about: "عن كابتن أمير", courses: "الكورسات", videos: "الفيديوهات", lessons: "دروس التعلّم",
    "age-groups": "الفئات العمرية", equipment: "الأدوات", locations: "أماكن التدريب", schedules: "جدول التدريب",
    registrations: "طلبات التسجيل", students: "المتدربون", reviews: "آراء العملاء", faqs: "الأسئلة الشائعة", content: "محتوى الموقع",
    media: "مكتبة الوسائط", seo: "إعدادات SEO", settings: "الإعدادات العامة",
  },
  login: {
    title: "تسجيل الدخول إلى لوحة التحكم", email: "البريد الإلكتروني", password: "كلمة المرور", submit: "دخول", signingIn: "جارٍ الدخول…",
    invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.", notAdmin: "هذا الحساب لا يملك صلاحية الإدارة.",
    notConfigured: "لم يتم ضبط Supabase بعد. اضبط متغيرات البيئة أولاً (راجع README).",
    back: "العودة للموقع",
  },
  common: {
    add: "إضافة جديد", edit: "تعديل", delete: "حذف", save: "حفظ التغييرات", saving: "جارٍ الحفظ…", cancel: "إلغاء",
    search: "بحث…", publish: "نشر", unpublish: "إخفاء", published: "منشور", draft: "مخفي",
    moveUp: "تحريك لأعلى", moveDown: "تحريك لأسفل", confirmDelete: "حذف هذا العنصر؟", confirmDeleteBody: "لا يمكن التراجع عن هذا الإجراء.",
    yes: "نعم، احذف", saved: "تم الحفظ بنجاح.", deleted: "تم الحذف.", error: "حدث خطأ ما.",
    empty: "لا توجد عناصر بعد.", emptySearch: "لا توجد نتائج مطابقة.", back: "رجوع", actions: "إجراءات",
    page: "صفحة", of: "من", prev: "السابق", next: "التالي", total: "إجمالي", demo: "تجريبي", none: "—",
    arabic: "العربية", english: "الإنجليزية", required: "مطلوب", upload: "رفع", library: "المكتبة",
    choose: "اختيار", remove: "إزالة", uploading: "جارٍ الرفع…", preview: "معاينة", all: "الكل", filter: "تصفية",
    exportCsv: "تصدير CSV", details: "التفاصيل", close: "إغلاق", approve: "اعتماد", reject: "رفض",
    yesNo: ["لا", "نعم"],
  },
  overview: {
    welcome: "مرحباً بعودتك", totalRegs: "إجمالي طلبات التسجيل", newRegs: "طلبات جديدة", approved: "حجوزات مقبولة",
    pending: "حجوزات قيد المراجعة", courses: "الكورسات", videos: "الفيديوهات", locations: "الأماكن", reviews: "الآراء",
    sessions: "الحصص المفتوحة", students: "المتدربون", upcoming: "الحصص القادمة", recentRegs: "أحدث طلبات التسجيل",
    latestReviews: "أحدث الآراء", regsChart: "طلبات التسجيل — آخر 14 يوماً", statusChart: "حسب الحالة",
    byCourse: "التسجيلات حسب الكورس", viewAll: "عرض الكل", demoBanner: "الموقع يحتوي حالياً على بيانات تجريبية. استبدلها أو احذفها من كل قسم (فلتر: تجريبي).",
    pendingReviews: "آراء في انتظار الموافقة",
  },
  regs: {
    reference: "الرقم", student: "المتدرب", parent: "ولي الأمر", age: "العمر", phone: "الهاتف", email: "البريد", course: "الكورس",
    location: "المكان", session: "الحصة", day: "اليوم المفضل", time: "الوقت المفضل", experience: "الخبرة",
    notes: "ملاحظات المتدرب", internal: "ملاحظات داخلية", status: "الحالة", created: "تاريخ الإرسال", updateStatus: "تحديث",
    seatNote: "الطلبات المرتبطة بحصة تحجز مقعداً طالما حالتها جديد أو قيد المراجعة أو مقبول.",
    full: "هذه الحصة مكتملة — تم رفض تغيير الحالة.",
    times: { any: "أي وقت", morning: "صباحاً", afternoon: "بعد الظهر", evening: "مساءً", session: "حصة محددة" },
    whatsapp: "واتساب", call: "اتصال",
  },
  media: {
    title: "مكتبة الوسائط", upload: "رفع صور", folder: "المجلد", copy: "نسخ الرابط", copied: "تم النسخ!", replace: "استبدال",
    hint: "JPG أو PNG أو WebP أو AVIF أو GIF أو SVG — حتى 10 ميجابايت.", empty: "لا توجد وسائط بعد.", alt: "النص البديل",
    inUseWarning: "تأكد أن الصورة غير مستخدمة في أي مكان قبل حذفها.",
  },
  settings: { saved: "تم حفظ الإعدادات.", title: "الإعدادات العامة", seoTitle: "إعدادات SEO", managerOnly: "تعديل الإعدادات متاح للمدراء فقط." },
  forbidden: "ليست لديك صلاحية لعرض هذه الصفحة.",
};

export function adminDict(locale: Locale): AdminDict {
  return locale === "ar" ? ar : en;
}
export type { AdminDict };
