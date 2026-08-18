import { Suspense, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel, FieldError } from "@/components/ui/input";
import { signIn } from "@/lib/api";

function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn({ email, password });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not sign in.");
      return;
    }
    const next = searchParams.get("next") ?? (res.data?.isSuperAdmin ? "/admin" : "/app");
    navigate(next);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-primary">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your library.</p>
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
            autoComplete="current-password"
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

      <FieldError>{error}</FieldError>

      <Button type="submit" variant="primary" className="w-full" loading={busy}>
        <LogIn className="h-4 w-4" />
        Sign in
      </Button>

      <div className="flex items-center justify-between text-[13px]">
        <Link to="/signup" className="font-medium text-accent-strong hover:underline">
          Create an account
        </Link>
        <Link to="/forgot-password" className="text-muted transition-colors hover:text-primary">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

export function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}