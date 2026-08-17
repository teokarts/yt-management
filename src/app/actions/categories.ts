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

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>;

/**
 * Resolves a requested parent category, verifying ownership and rejecting
 * self/descendant nesting so the tree can never form a cycle.
 */
async function resolveParent(
  supabase: Supabase,
  userId: string,
  parentId: string | null | undefined,
  selfId?: string,
): Promise<{ ok: true; parentId: string | null } | { ok: false; error: string }> {
  if (!parentId) return { ok: true, parentId: null };

  if (selfId && parentId === selfId) {
    return { ok: false, error: "A category cannot be nested inside itself." };
  }

  const { data: parent, error } = await supabase
    .from("categories")
    .select("id, parent_id")
    .eq("id", parentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!parent) return { ok: false, error: "Parent category not found." };

  if (selfId) {
    let cursor: { id: string; parent_id: string | null } | null = parent;
    const seen = new Set<string>([parentId]);
    while (cursor?.parent_id) {
      if (cursor.parent_id === selfId) {
        return { ok: false, error: "A category cannot be nested inside itself." };
      }
      if (seen.has(cursor.parent_id)) break;
      seen.add(cursor.parent_id);
      const { data: ancestor } = (await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("id", cursor.parent_id)
        .eq("user_id", userId)
        .maybeSingle()) as {
        data: { id: string; parent_id: string | null } | null;
      };
      cursor = ancestor;
    }
  }

  return { ok: true, parentId };
}

export async function createCategory(input: {
  name: string;
  parentId?: string | null;
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

  const parent = await resolveParent(supabase, user.id, parsed.data.parentId);
  if (!parent.ok) return parent;

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
      parent_id: parent.parentId,
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
  parentId?: string | null;
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

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Category not found." };
  }

  const parent = await resolveParent(supabase, user.id, parsed.data.parentId, parsed.data.id);
  if (!parent.ok) return parent;

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name.trim(),
      slug: slugify(parsed.data.name),
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      description: parsed.data.description ?? null,
      parent_id: parent.parentId,
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