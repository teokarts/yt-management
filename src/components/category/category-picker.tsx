"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

export function CategoryPicker({
  value,
  onChange,
  categories,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  categories: Category[];
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  if (categories.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-3 text-[13px] text-muted">
        No categories yet — use &quot;New&quot; above to create your first one.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const active = value.includes(cat.id);
        const isSubcategory = Boolean(cat.parent_id);
        return (
          <button
            key={cat.id}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(cat.id)}
            title={isSubcategory ? "Subcategory" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all",
              active
                ? "border-transparent bg-selected text-primary shadow-[0_0_0_1px_var(--border-strong)]"
                : "border-border text-secondary hover:border-border-strong hover:text-primary",
              isSubcategory && "pl-1.5",
            )}
          >
            {isSubcategory && (
              <span className="text-muted" aria-hidden="true">
                ↳
              </span>
            )}
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: cat.color ?? "currentColor" }}
            />
            {cat.name}
            {active && <Check className="h-3.5 w-3.5 text-accent" />}
          </button>
        );
      })}
    </div>
  );
}