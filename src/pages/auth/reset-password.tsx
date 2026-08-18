import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel, FieldError } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHasSession(true);
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/app"), 1200);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="text-center">
        <h1 className="font-display text-xl font-bold text-primary">Link invalid or expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          This password reset link isn&apos;t valid anymore. Request a new one to continue.
        </p>
        <Link to="/forgot-password" className="mt-6 inline-block">
          <Button variant="primary">Request a new link</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-bold text-primary">Password updated</h1>
        <p className="mt-2 text-sm text-secondary">Taking you to your library…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-primary">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted">Use at least 8 characters.</p>
      </div>

      <div>
        <FieldLabel htmlFor="new-password">New password</FieldLabel>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-primary"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password"
        />
      </div>

      <FieldError>{error}</FieldError>

      <Button type="submit" variant="primary" className="w-full" loading={busy}>
        <KeyRound className="h-4 w-4" />
        Update password
      </Button>
    </form>
  );
}