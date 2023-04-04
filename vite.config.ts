import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/formacloud-storage-cdn-stg/demo-app-hosting/r3f-variants-poc",
});
