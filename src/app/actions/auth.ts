"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function signIn(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      ok: false,
      error:
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect(input.next && input.next.startsWith("/") ? input.next : "/app");
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: input.displayName?.trim() ? { display_name: input.displayName.trim() } : undefined,
    },
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message.toLowerCase().includes("already registered")
          ? "An account with this email already exists."
          : error.message,
    };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<ActionResult> {
  const email = z.string().trim().email().safeParse(input.email);
  if (!email.success) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const supabase = await createServerSupabase();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
