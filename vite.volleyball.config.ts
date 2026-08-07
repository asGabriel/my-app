import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    build: {
      outDir: "dist-volleyball",
      emptyOutDir: true,
      rollupOptions: {
        input: "volleyball.html",
      },
    },
    server: {
      port: 5174,
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
