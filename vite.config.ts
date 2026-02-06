import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { requirementsWatcherPlugin } from "./src/infrastructure/vite-requirements-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), requirementsWatcherPlugin()],
  root: ".",
  build: {
    outDir: "dist-ui",
  },
});
