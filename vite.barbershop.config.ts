import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const ENTRY = "barbershop.html";

/** Fallback de SPA: sem isso o Vite responde as rotas do app (/agendar,
 * /barbeiro…) com o index.html do app principal, e não com o desta entrada. */
function spaFallback(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const path = req.url?.split("?")[0] ?? "";
    const accept = req.headers.accept ?? "";
    const wantsHtml = accept.includes("text/html") || accept.includes("*/*");
    if (wantsHtml && req.method === "GET" && !path.includes(".") && !path.startsWith("/@")) req.url = `/${ENTRY}`;
    next();
  };
  return {
    name: "barbershop-spa-fallback",
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  };
}

// Por enquanto o módulo roda só com dados mockados (src/barbershop/mock), então
// não há proxy para a API.
export default defineConfig({
  plugins: [react(), spaFallback()],
  build: {
    outDir: "dist-barbershop",
    emptyOutDir: true,
    rollupOptions: {
      input: ENTRY,
    },
  },
  // Sem isso o pré-bundle varre todos os .html da raiz (inclusive o do app
  // principal) e otimiza dependências que este módulo nem usa.
  optimizeDeps: {
    entries: [ENTRY],
  },
  server: {
    host: true,
    port: 5175,
  },
  preview: {
    port: 5175,
  },
});
