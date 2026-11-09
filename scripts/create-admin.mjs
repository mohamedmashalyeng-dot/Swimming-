#!/usr/bin/env node
/**
 * Creates (or promotes) an admin user.
 *
 *   node scripts/create-admin.mjs <email> <password> [role] [full name]
 *   role: super_admin | admin | editor   (default: super_admin)
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from .env.local / .env).
 * The service role key is only used here, on your machine — never in the web app.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./env.mjs";

loadEnv();
const [email, password, role = "super_admin", ...nameParts] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [super_admin|admin|editor] [full name]");
  process.exit(1);
}
if (!["super_admin", "admin", "editor"].includes(role)) {
  console.error("Role must be super_admin, admin or editor");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Use a password with at least 8 characters.");
  process.exit(1);
}
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env.local).");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const { data: created, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  if (!/already|registered|exists/i.test(error.message)) {
    console.error("Could not create user:", error.message);
    process.exit(1);
  }
  // existing user → find it and reset the password
  let page = 1;
  for (;;) {
    const { data, error: e } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (e) { console.error(e.message); process.exit(1); }
    const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) { userId = u.id; break; }
    if (data.users.length < 200) break;
    page++;
  }
  if (!userId) { console.error("User exists but could not be found."); process.exit(1); }
  await sb.auth.admin.updateUserById(userId, { password });
  console.log("User already existed — password updated.");
} else {
  userId = created.user.id;
}

const { error: aErr } = await sb.from("admins").upsert({ id: userId, email, role, full_name: nameParts.join(" ") || null });
if (aErr) {
  console.error("Could not save admin row:", aErr.message);
  process.exit(1);
}
console.log(`✔ ${email} is now ${role}. Sign in at /admin/login`);
