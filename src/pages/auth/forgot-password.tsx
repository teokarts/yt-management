import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel, FieldError } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await requestPasswordReset({ email });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not send reset email.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-bold text-primary">Reset link sent</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          If an account exists for <span className="font-medium text-primary">{email}</span>,
          you&apos;ll receive an email with a link to reset your password.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="secondary">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-primary">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </p>
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

      <FieldError>{error}</FieldError>

      <Button type="submit" variant="primary" className="w-full" loading={busy}>
        <Send className="h-4 w-4" />
        Send reset link
      </Button>

      <p className="text-center text-ui text-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-accent-strong hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}