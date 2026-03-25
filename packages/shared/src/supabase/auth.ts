import type { SupabaseClient } from "@supabase/supabase-js";

export type BuildUpAuthClient = SupabaseClient;

export type SignUpWithEmailParams = {
  name: string;
  email: string;
  password: string;
};

export type SignInWithEmailParams = {
  email: string;
  password: string;
};

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message === "Email not confirmed") {
      return "Email confirmation is still enabled in Supabase. Turn off Confirm email in Authentication > Providers > Email.";
    }

    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (message === "Email not confirmed") {
      return "Email confirmation is still enabled in Supabase. Turn off Confirm email in Authentication > Providers > Email.";
    }

    if (message) {
      return message;
    }
  }

  return "Authentication failed.";
}

export async function signUpWithEmail(
  client: BuildUpAuthClient,
  params: SignUpWithEmailParams
) {
  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        name: params.name
      }
    }
  });

  if (error) {
    throw error;
  }

  if (data.user && !data.session) {
    throw new Error(
      "Email confirmation is still enabled in Supabase. Turn off Confirm email in Authentication > Providers > Email."
    );
  }

  return data;
}

export async function signInWithEmail(
  client: BuildUpAuthClient,
  params: SignInWithEmailParams
) {
  const { data, error } = await client.auth.signInWithPassword({
    email: params.email,
    password: params.password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser(client: BuildUpAuthClient) {
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function updateCurrentUserPassword(
  client: BuildUpAuthClient,
  nextPassword: string
) {
  const { data, error } = await client.auth.updateUser({
    password: nextPassword
  });

  if (error) {
    throw error;
  }

  return data;
}
