"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./videos";

export async function updateProfile(input: {
  displayName?: string | null;
  defaultSort?: string;
  cardDensity?: "cozy" | "comfortable" | "compact" | "list";
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const update: {
    display_name?: string | null;
    default_sort?: string;
    card_density?: "cozy" | "comfortable" | "compact" | "list";
  } = {};
  if (parsed.data.displayName !== undefined) update.display_name = parsed.data.displayName || null;
  if (parsed.data.defaultSort !== undefined) update.default_sort = parsed.data.defaultSort;
  if (parsed.data.cardDensity !== undefined) update.card_density = parsed.data.cardDensity;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true };
}
