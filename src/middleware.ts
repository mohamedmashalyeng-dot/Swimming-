import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // "/" → remembered language, else browser preference, else Arabic (default).
  if (pathname === "/") {
    const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
    let locale = isLocale(cookie) ? cookie : defaultLocale;
    if (!cookie) {
      const accept = req.headers.get("accept-language") ?? "";
      const first = accept.split(",")[0]?.trim().slice(0, 2).toLowerCase();
      if (first === "en") locale = "en";
    }
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  // Remember the language of any visited locale page.
  const seg = pathname.split("/")[1];
  if (isLocale(seg)) {
    const res = NextResponse.next();
    if (req.cookies.get(LOCALE_COOKIE)?.value !== seg) {
      res.cookies.set(LOCALE_COOKIE, seg, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  if (pathname.startsWith("/admin")) return adminGuard(req);
  return NextResponse.next();
}

async function adminGuard(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = req.nextUrl.pathname === "/admin/login";
  if (!url || !key) return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", req.url));

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  // Refreshes the session cookie when needed and validates the JWT with Supabase Auth.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const to = new URL("/admin/login", req.url);
    to.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = {
  matcher: ["/", "/(ar|en)", "/(ar|en)/:path*", "/admin", "/admin/:path*"],
};
