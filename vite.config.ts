// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // Use repo name for builds (gh-pages), root for dev (localhost)
  base: command === "build" ? "mindar/" : "/",
  plugins: [tailwindcss()],
}));
