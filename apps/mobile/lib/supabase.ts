import { createFoundOneSupabaseClient } from "@foundone/shared";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing Expo Supabase environment variables.");
}

export const supabase = createFoundOneSupabaseClient(url, anonKey);
