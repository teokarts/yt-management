"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  createCategorySchema,
  deleteCategorySchema,
  renameCategorySchema,
} from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./videos";

export async function createCategory(input: {
  name: string;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();

  const { data: maxRow } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: parsed.data.name.trim(),
      slug: slugify(parsed.data.name),
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      description: parsed.data.description ?? null,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A category with this name already exists." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function renameCategory(input: {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = renameCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name.trim(),
      slug: slugify(parsed.data.name),
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      description: parsed.data.description ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A category with this name already exists." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteCategory(input: { id: string }): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = deleteCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function reorderCategories(input: { ids: string[] }): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createServerSupabase();
  for (const [index, id] of input.ids.entries()) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}
