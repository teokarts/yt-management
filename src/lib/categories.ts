import type { Category } from "@/types/database";

export interface ParentOption {
  id: string;
  name: string;
  depth: number;
}

/**
 * Flattens the category tree into a depth-annotated list suitable for a
 * "nest under" <select>. `excludeIds` removes a branch from the options —
 * used when editing a category so it cannot be nested inside itself or
 * one of its own descendants.
 */
export function buildParentOptions(
  categories: Category[],
  excludeIds: Set<string> = new Set(),
): ParentOption[] {
  const nodes = new Map<string, { cat: Category; children: Category[] }>();
  for (const c of categories) {
    nodes.set(c.id, { cat: c, children: [] });
  }
  const roots: Category[] = [];
  for (const c of categories) {
    if (c.parent_id && nodes.has(c.parent_id) && !excludeIds.has(c.id)) {
      nodes.get(c.parent_id)!.children.push(c);
    } else {
      roots.push(c);
    }
  }

  const options: ParentOption[] = [];
  const walk = (cat: Category, depth: number) => {
    if (excludeIds.has(cat.id)) return;
    options.push({ id: cat.id, name: cat.name, depth });
    for (const child of nodes.get(cat.id)!.children) {
      walk(child, depth + 1);
    }
  };
  for (const root of roots) walk(root, 0);
  return options;
}

/**
 * Returns the full ancestor chain for a category, root-first, ending with the
 * category itself — e.g. [Programming, Web, React]. Guards against cycles and
 * against parents missing from `categories` (returns the deepest known slice).
 */
export function getCategoryPath(categoryId: string, categories: Category[]): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path: Category[] = [];
  const seen = new Set<string>();
  let current = byId.get(categoryId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}
