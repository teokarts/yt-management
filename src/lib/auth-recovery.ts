import { supabase } from "@/lib/supabase";

/**
 * Supabase delivers auth tokens in the URL hash, but this app uses HashRouter —
 * which reads the hash as the route. The two collide: the router would treat
 * `#access_token=...` as a path and wipe it before Supabase ever sees it.
 *
 * So we drain the hash ourselves, before the router mounts: establish the
 * session from the tokens, then rewrite the hash to the route we actually want.
 * `detectSessionInUrl` is off in the client for the same reason.
 *
 * Supabase sends tokens two ways depending on the project's email template:
 *   implicit  -> #access_token=...&refresh_token=...&type=recovery
 *   PKCE      -> ?code=...  (or #code=...)
 */
export async function consumeAuthFromUrl(): Promise<void> {
  const rawHash = window.location.hash.replace(/^#/, "");
  const search = window.location.search.replace(/^\?/, "");

  // HashRouter format is `#/route?query`. An auth payload has no leading slash,
  // so anything starting with `/` is an ordinary route — leave it alone.
  const hashIsAuthPayload = rawHash.length > 0 && !rawHash.startsWith("/");
  const hashParams = new URLSearchParams(hashIsAuthPayload ? rawHash : "");
  const searchParams = new URLSearchParams(search);

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const code = searchParams.get("code") ?? hashParams.get("code");
  const type = hashParams.get("type") ?? searchParams.get("type");
  const errorDescription =
    hashParams.get("error_description") ?? searchParams.get("error_description");

  if (!accessToken && !code && !errorDescription) return;

  // Recovery and invite links must land on the password form; everything else
  // (magic link, email confirmation) goes to the app.
  const isRecovery = type === "recovery" || type === "invite";
  let destination = isRecovery ? "/reset-password" : "/app";

  if (errorDescription) {
    destination = "/login?error=" + encodeURIComponent(errorDescription);
  } else if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      destination = "/login?error=" + encodeURIComponent(error.message);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      destination = "/login?error=" + encodeURIComponent(error.message);
    }
  }

  // Drop the tokens from the address bar and hand the router a clean route.
  window.history.replaceState(
    null,
    "",
    window.location.pathname + "#" + destination,
  );
}
