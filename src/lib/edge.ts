import { supabase } from "@/lib/supabase";

export interface EdgeError {
  error?: string;
}

function edgeUrl(name: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/functions/v1/${name}`;
}

async function withAuthToken(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  };
}

export class EdgeFunctionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EdgeFunctionError";
  }
}

export async function callEdge<T>(
  name: string,
  body?: unknown,
  { auth = true, method = "POST" }: { auth?: boolean; method?: string } = {},
): Promise<T> {
  const headers = auth ? await withAuthToken() : {};
  const res = await fetch(edgeUrl(name), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data as EdgeError | null)?.error ?? `Request failed (${res.status}).`;
    throw new EdgeFunctionError(message);
  }

  return data as T;
}