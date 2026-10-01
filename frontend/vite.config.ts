import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // the backend serves the built site, so build straight into its folder
  build: {
    outDir: "../backend/frontend",
    emptyOutDir: true,
  },
});
