import { createBuildUpSupabaseClient } from "@build-up/shared";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing Next.js Supabase environment variables.");
}

export const supabase = createBuildUpSupabaseClient(url, anonKey);
