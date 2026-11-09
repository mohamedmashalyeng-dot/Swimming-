#!/usr/bin/env node
/**
 * Loads the demo data (supabase/seed.sql) into the database referenced by
 * DATABASE_URL. Safe to re-run: rows with fixed ids are skipped, but list
 * tables (equipment, reviews, FAQs, registrations) would be duplicated, so
 * by default the script refuses to run when demo data already exists.
 *
 *   npm run seed            # load demo data
 *   npm run seed -- --reset # delete existing demo rows (is_demo = true) first
 *   npm run seed -- --clear # ONLY delete demo rows, do not insert
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { loadEnv } from "./env.mjs";

loadEnv();
const args = new Set(process.argv.slice(2));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (Supabase → Project Settings → Database → Connection string).");
  process.exit(1);
}

const DEMO_TABLES = ["registrations", "students", "schedules", "reviews", "faqs", "equipment", "lesson_videos", "lessons",
  "videos", "course_locations", "courses", "locations", "age_groups", "coaches", "website_sections", "media"];

const client = new pg.Client({ connectionString: url, ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : { rejectUnauthorized: false } });
await client.connect();
try {
  if (args.has("--reset") || args.has("--clear")) {
    await client.query("begin");
    for (const t of DEMO_TABLES) {
      if (t === "course_locations" || t === "lesson_videos") continue; // cascade
      const { rowCount } = await client.query(`delete from public.${t} where is_demo`);
      if (rowCount) console.log(`  removed ${rowCount} demo rows from ${t}`);
    }
    await client.query("update public.site_settings set is_demo = false where id = 1");
    await client.query("commit");
    console.log("✔ Demo rows removed.");
    if (args.has("--clear")) process.exit(0);
  }
  const { rows } = await client.query("select count(*)::int as n from public.courses where is_demo");
  if (rows[0].n > 0) {
    console.error("Demo data already present. Use `npm run seed -- --reset` to reload it.");
    process.exit(1);
  }
  const sql = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log("✔ Demo data loaded.");
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("Seed failed:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
