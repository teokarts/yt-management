import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Deployed under a subfolder (e.g. https://plinetpierias.gr/youtube-bookmarks).
// Set VITE_BASE_PATH at build time (e.g. "/youtube-bookmarks"). Leave unset for root.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = env.VITE_BASE_PATH || "";
  return {
    base: basePath ? `${basePath}/` : "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});