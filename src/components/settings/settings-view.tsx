import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { updateProfile, pinTag, deleteTag, signOut } from "@/lib/api";
import { useAppData } from "@/context/app-data-context";
import { SORT_OPTIONS, CARD_DENSITIES } from "@/lib/constants";
import type { SortOption, CardDensity } from "@/lib/constants";
import { TagCloud } from "@/components/tag/tag-cloud";
import type { Profile, TagWithCount } from "@/types/database";

export function SettingsView({
  profile,
  email,
  tags,
}: {
  profile: Profile | null;
  email: string;
  tags: TagWithCount[];
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh } = useAppData();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [defaultSort, setDefaultSort] = useState<SortOption>(
    (profile?.default_sort as SortOption) ?? "recently_added",
  );
  const [cardDensity, setCardDensity] = useState<CardDensity>(
    profile?.card_density ?? "comfortable",
  );
  const [localTags, setLocalTags] = useState<TagWithCount[]>(tags);
  const [savingProfile, setSavingProfile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagWithCount | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateProfile({ displayName: displayName.trim() || null });
    setSavingProfile(false);
    if (!res.ok) return toast("Could not save profile", { variant: "error" });
    toast("Profile saved");
    await refresh();
  };

  const changeSort = async (value: string) => {
    const res = await updateProfile({ defaultSort: value });
    if (!res.ok) return toast("Could not save setting", { variant: "error" });
    setDefaultSort(value as SortOption);
    await refresh();
  };

  const changeDensity = async (value: CardDensity) => {
    const res = await updateProfile({ cardDensity: value });
    if (!res.ok) return toast("Could not save setting", { variant: "error" });
    setCardDensity(value);
    toast("Card density updated");
    await refresh();
  };

  const togglePin = async (tag: TagWithCount) => {
    const res = await pinTag({ id: tag.id, isPinned: !tag.is_pinned });
    if (!res.ok) return toast("Could not update tag", { variant: "error" });
    setLocalTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, is_pinned: !tag.is_pinned } : t)),
    );
    toast(tag.is_pinned ? "Tag unpinned" : "Tag pinned to sidebar");
    await refresh();
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    const res = await deleteTag({ id: tagToDelete.id });
    if (!res.ok) return toast("Could not delete tag", { variant: "error" });
    setLocalTags((prev) => prev.filter((t) => t.id !== tagToDelete.id));
    setTagToDelete(null);
    toast("Tag deleted");
    await refresh();
  };

  const initial = (displayName || email).slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-primary">Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage your profile and preferences.</p>

      <div className="mt-8 space-y-8">
        {/* Profile */}
        <section className="rounded-xl border border-border bg-elevated p-6">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
            <User className="h-4 w-4 text-muted" /> Profile
          </h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-contrast">
                {initial}
              </span>
              <div className="flex-1 space-y-1">
                <FieldLabel htmlFor="display-name">Display name</FieldLabel>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input value={email} disabled className="text-muted" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={savingProfile}>
                Save profile
              </Button>
            </div>
          </form>
        </section>

        {/* Defaults */}
        <section className="rounded-xl border border-border bg-elevated p-6">
          <h2 className="font-display text-sm font-semibold text-primary">Defaults</h2>
          <div className="mt-4 space-y-5">
            <div>
              <FieldLabel htmlFor="default-sort">Default sorting</FieldLabel>
              <select
                id="default-sort"
                value={defaultSort}
                onChange={(e) => changeSort(e.target.value as SortOption)}
                className="h-10 w-full rounded-md border border-border bg-sunken px-3 text-sm text-primary transition-colors hover:border-border-strong focus:border-accent/60 focus:outline-none"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Video card density</FieldLabel>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {CARD_DENSITIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => changeDensity(d.value as CardDensity)}
                    aria-pressed={cardDensity === d.value}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      cardDensity === d.value
                        ? "border-accent/60 bg-accent-soft"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <p className="text-[13px] font-semibold text-primary">{d.label}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tags */}
        <section className="rounded-xl border border-border bg-elevated p-6">
          <h2 className="font-display text-sm font-semibold text-primary">Tags</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Sized by how often you use them. Select a tag to browse its videos, or hover to pin
            it to your sidebar as a quick filter.
          </p>
          {localTags.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted">
              Tags you add to videos will appear here.
            </p>
          ) : (
            <div className="mt-5">
              <TagCloud
                tags={localTags}
                onTogglePin={togglePin}
                onDelete={setTagToDelete}
              />
            </div>
          )}
        </section>

        {/* Account */}
        <section className="rounded-xl border border-border bg-elevated p-6">
          <h2 className="font-display text-sm font-semibold text-primary">Account</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-[13px] text-muted">
              Sign out of this device. You&apos;ll need to sign back in to access your library.
            </p>
            <Button
              variant="danger"
              onClick={async () => {
                setSigningOut(true);
                await signOut();
                navigate("/");
              }}
              loading={signingOut}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={tagToDelete !== null}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleDeleteTag}
        title="Delete this tag?"
        description={
          <>
            The tag <span className="font-medium text-primary">#{tagToDelete?.name}</span> will be
            removed from every video. Videos themselves are not deleted.
          </>
        }
        confirmLabel="Delete tag"
      />
    </div>
  );
}