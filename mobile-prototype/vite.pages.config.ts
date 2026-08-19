import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    emptyOutDir: true,
    modulePreload: false,
    outDir: "../mobile",
  },
  plugins: [react()],
});
