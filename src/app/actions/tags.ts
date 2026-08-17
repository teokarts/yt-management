"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { createTagSchema, pinTagSchema } from "@/lib/validation";
import { slugify, normalizeTag } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./videos";

export async function createTag(input: { name: string }): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const name = parsed.data.name.trim();
  const normalized = normalizeTag(name);

  const { data, error } = await supabase
    .from("tags")
    .insert({
      user_id: user.id,
      name,
      normalized_name: normalized,
      slug: slugify(normalized),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This tag already exists." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function pinTag(input: { id: string; isPinned: boolean }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = pinTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("tags")
    .update({ is_pinned: parsed.data.isPinned })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteTag(input: { id: string }): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", input.id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true };
}
