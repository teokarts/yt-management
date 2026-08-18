import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel, FieldError } from "@/components/ui/input";
import { signUp } from "@/lib/api";

export function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const res = await signUp({ email, password, displayName });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not create account.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center">
        <h1 className="font-display text-xl font-bold text-primary">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          We&apos;ve sent a confirmation link to <span className="font-medium text-primary">{email}</span>.
          Open it to activate your account, then sign in.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="primary" className="w-full">Go to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-primary">Create your library</h1>
        <p className="mt-1 text-sm text-muted">Start collecting videos worth keeping.</p>
      </div>

      <div>
        <FieldLabel htmlFor="display-name">Name (optional)</FieldLabel>
        <Input
          id="display-name"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Alex Doe"
          maxLength={60}
        />
      </div>

      <div>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
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
        <UserPlus className="h-4 w-4" />
        Create account
      </Button>

      <p className="text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent-strong hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}