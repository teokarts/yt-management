import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Deployed under a subfolder (e.g. https://plinetpierias.gr/youtube-bookmarks).
// Set VITE_BASE_PATH at build time (e.g. "/youtube-bookmarks"). Leave unset for root.
// The base path is intentionally ignored by `vite dev` so local development always
// runs from http://localhost:5173/ regardless of the deployment target.
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = command === "build" ? env.VITE_BASE_PATH || "" : "";
  return {
    base: basePath ? `${basePath}/` : "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5173,
      open: false,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
