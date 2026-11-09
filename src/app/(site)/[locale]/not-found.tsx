import Link from "next/link";

export default function NotFound() {
  return (
    <main className="water-bg flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center text-white">
      <p className="font-display text-7xl font-extrabold text-turquoise-500">404</p>
      <h1 className="text-2xl font-bold">الصفحة غير موجودة · Page not found</h1>
      <div className="flex gap-3">
        <Link href="/ar" className="btn-primary">الرئيسية</Link>
        <Link href="/en" className="btn-ghost">Home</Link>
      </div>
    </main>
  );
}
