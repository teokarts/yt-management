"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FieldLabel, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createCategory, renameCategory } from "@/app/actions/categories";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ICON_KEYS } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Category, CategoryWithCount } from "@/types/database";

interface ParentOption {
  id: string;
  name: string;
  depth: number;
}

function buildParentOptions(categories: Category[], excludeIds: Set<string>): ParentOption[] {
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

export function CategoryDialog({
  open,
  onClose,
  category,
  categories,
  defaultParentId,
}: {
  open: boolean;
  onClose: () => void;
  category?: CategoryWithCount | null;
  categories?: Category[] | null;
  defaultParentId?: string | null;
}) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(category?.icon ?? "book");
  const [parentId, setParentId] = useState<string | null>(
    category?.parent_id ?? defaultParentId ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setColor(category?.color ?? CATEGORY_COLORS[0]);
      setIcon(category?.icon ?? "book");
      setParentId(category?.parent_id ?? defaultParentId ?? null);
      setError(null);
    }
  }

  const excludeIds = new Set<string>();
  if (category) {
    const all = categories ?? [];
    const children = new Map<string, string[]>();
    for (const c of all) {
      if (c.parent_id) {
        const list = children.get(c.parent_id) ?? [];
        list.push(c.id);
        children.set(c.parent_id, list);
      }
    }
    const queue = [category.id];
    excludeIds.add(category.id);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const child of children.get(cur) ?? []) {
        if (!excludeIds.has(child)) {
          excludeIds.add(child);
          queue.push(child);
        }
      }
    }
  }

  const parentOptions = buildParentOptions(categories ?? [], excludeIds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give the category a name.");
      return;
    }
    setBusy(true);
    try {
      if (isEdit && category) {
        const res = await renameCategory({
          id: category.id,
          name,
          color,
          icon,
          description,
          parentId,
        });
        if (!res.ok) {
          setError(res.error ?? "Could not update category.");
          return;
        }
        toast("Category updated");
      } else {
        const res = await createCategory({ name, color, icon, description, parentId });
        if (!res.ok) {
          setError(res.error ?? "Could not create category.");
          return;
        }
        toast(parentId ? "Subcategory created" : "Category created", { description: name.trim() });
      }
      setName("");
      setDescription("");
      setColor(CATEGORY_COLORS[0]);
      setIcon("book");
      setParentId(null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        isEdit ? "Edit category" : parentId ? "New subcategory" : "New category"
      }
      description={
        isEdit
          ? "Update how this category looks."
          : parentId
            ? "Add a subcategory to organize this group further."
            : "Create a category for your videos."
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="px-6 py-5">
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="category-name">Name</FieldLabel>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Development"
              autoFocus
              maxLength={40}
            />
          </div>

          {categories && categories.length > 0 && (
            <div>
              <FieldLabel htmlFor="category-parent">Parent category</FieldLabel>
              <select
                id="category-parent"
                value={parentId ?? ""}
                onChange={(e) => setParentId(e.target.value || null)}
                className="h-10 w-full rounded-md border border-border bg-sunken px-3 text-sm text-primary transition-colors hover:border-border-strong focus:border-accent/60 focus:outline-none"
              >
                <option value="">No parent (top level)</option>
                {parentOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {"\u00A0\u00A0".repeat(o.depth)}
                    {o.depth > 0 ? "↳ " : ""}
                    {o.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                Leave empty for a top-level category. Subcategories are nested under their parent.
              </p>
            </div>
          )}

          <div>
            <FieldLabel>Accent color</FieldLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform hover:scale-110",
                    color === c && "ring-2 ring-primary ring-offset-2 ring-offset-elevated",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Icon</FieldLabel>
            <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Icon">
              {CATEGORY_ICON_KEYS.map((key) => {
                const Icon = CATEGORY_ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={icon === key}
                    aria-label={key}
                    onClick={() => setIcon(key)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md border transition-colors",
                      icon === key
                        ? "border-accent bg-accent-soft text-accent-strong"
                        : "border-border text-muted hover:border-border-strong hover:text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="category-description">Description (optional)</FieldLabel>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What belongs here?"
              rows={2}
              maxLength={300}
            />
          </div>

          <FieldError>{error}</FieldError>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            {isEdit ? "Save changes" : parentId ? "Create subcategory" : "Create category"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}