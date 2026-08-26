import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Save, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateProfile, signOut } from "@/lib/api";
import { useAppData } from "@/context/app-data-context";

export function AdminProfile({
  displayName,
  email,
}: {
  displayName: string | null;
  email: string;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh } = useAppData();
  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initial = (displayName || email).slice(0, 1).toUpperCase();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ displayName: name.trim() || null });
    setSaving(false);
    if (!res.ok) return toast("Could not save profile", { variant: "error" });
    toast("Profile saved");
    await refresh();
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        to="/admin"
        className="mb-5 inline-flex items-center gap-1.5 text-ui text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>

      <header className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
            Admin profile
          </h1>
          <p className="mt-0.5 text-sm text-muted">Manage your admin account and sign out.</p>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-elevated p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-contrast">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lead font-semibold text-primary">
              {displayName || "Super admin"}
            </p>
            <p className="truncate text-ui text-muted">{email}</p>
          </div>
          <span className="rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-micro font-semibold text-accent-strong">
            Super admin
          </span>
        </div>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div>
            <FieldLabel htmlFor="admin-name">Display name</FieldLabel>
            <Input
              id="admin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input value={email} disabled className="text-muted" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving}>
              <Save className="h-4 w-4" /> Save profile
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-elevated p-6">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
          <User className="h-4 w-4 text-muted" /> Session
        </h2>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-ui text-muted">
            Sign out of this device. You&apos;ll need to sign back in to view the admin platform.
          </p>
          <Button variant="danger" onClick={handleSignOut} loading={signingOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}