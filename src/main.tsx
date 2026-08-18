import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./styles/globals.css";
import App from "./App";
import { consumeAuthFromUrl } from "@/lib/auth-recovery";

// Must settle before the router mounts, so it never sees the token in the hash.
void consumeAuthFromUrl().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});