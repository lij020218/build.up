import { createBuildUpSupabaseClient } from "@build-up/shared";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing Expo Supabase environment variables.");
}

export const supabase = createBuildUpSupabaseClient(url, anonKey);
