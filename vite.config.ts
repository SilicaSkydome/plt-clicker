import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePluginNode } from "vite-plugin-node";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePluginNode({
      adapter: "express",
      appPath: "./server.js",
      exportName: "default",
    }),
  ],
  server: {
    port: 5173,
    middlewareMode: false, // Укажи, что Vite должен обслуживать статические файлы
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, "index.html"), // Явно укажи входной файл
    },
  },
});
