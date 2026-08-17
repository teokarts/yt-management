"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FieldLabel, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createCategory, renameCategory } from "@/app/actions/categories";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ICON_KEYS } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { CategoryWithCount } from "@/types/database";

export function CategoryDialog({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  category?: CategoryWithCount | null;
}) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(category?.icon ?? "book");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
        const res = await renameCategory({ id: category.id, name, color, icon, description });
        if (!res.ok) {
          setError(res.error ?? "Could not update category.");
          return;
        }
        toast("Category updated");
      } else {
        const res = await createCategory({ name, color, icon, description });
        if (!res.ok) {
          setError(res.error ?? "Could not create category.");
          return;
        }
        toast("Category created", { description: name.trim() });
      }
      setName("");
      setDescription("");
      setColor(CATEGORY_COLORS[0]);
      setIcon("book");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit category" : "New category"}
      description={isEdit ? "Update how this category looks." : "Create a category for your videos."}
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
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}