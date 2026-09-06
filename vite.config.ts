import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,

        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Reenvía la cookie HttpOnly si existe
            if (req.headers.cookie) {
              proxyReq.setHeader("cookie", req.headers.cookie);
            }
          });

          // Logs para depuración
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              `[PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`
            );
          });

          proxy.on("error", (err) => {
            console.error("[PROXY ERROR]", err);
          });
        },
      },
    },
  },
});