import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ["rockfish-desolate-concierge.ngrok-free.dev"],
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
