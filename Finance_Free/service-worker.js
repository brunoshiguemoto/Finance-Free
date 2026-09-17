// ============================================================
// FINANCE FREE — SERVICE WORKER (PWA)
// Responsável por: cache offline, instalação e atualização
// ============================================================

// Nome e versão do cache — incremente ao fazer deploy de updates
const CACHE_NAME = "finance-free-v37";

// Arquivos essenciais que serão cacheados na instalação
const ARQUIVOS_PARA_CACHE = [
  "/Finance-Free/",
  "/Finance-Free/index.html",
  "/Finance-Free/styles.css",
  "/Finance-Free/app.js",
  "/Finance-Free/bancos_brasil.js",
  "/Finance-Free/manifest.json",
  "/Finance-Free/icons/icon-192.png",
  "/Finance-Free/icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

// ─────────────────────────────────────────
// EVENTO: install
// Ocorre quando o SW é registrado pela 1ª vez
// Cacheia todos os arquivos essenciais
// ─────────────────────────────────────────
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cacheando arquivos essenciais...");
      return cache.addAll(ARQUIVOS_PARA_CACHE);
    })
  );
  // Força ativação imediata sem esperar aba fechar
  self.skipWaiting();
});

// ─────────────────────────────────────────
// EVENTO: activate
// Ocorre após install — limpa caches antigos
// ─────────────────────────────────────────
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((cachesList) => {
      return Promise.all(
        cachesList
          .filter((nome) => nome !== CACHE_NAME)
          .map((nomeAntigo) => {
            console.log("[SW] Removendo cache antigo:", nomeAntigo);
            return caches.delete(nomeAntigo);
          })
      );
    })
  );
  // Assume controle de todas as abas abertas imediatamente
  self.clients.claim();
});

// ─────────────────────────────────────────
// EVENTO: fetch
// Intercepta requisições de rede
// Estratégia: Cache First para assets locais,
//             Network First para a API do Google
// ─────────────────────────────────────────
self.addEventListener("fetch", (evento) => {
  const url = evento.request.url;

  // Requisições para a API do Google sempre vão para a rede
  // (dados financeiros precisam estar sempre atualizados)
  if (
    url.includes("script.google.com") ||
    url.includes("googleapis.com")
  ) {
    evento.respondWith(
      fetch(evento.request).catch(() => {
        // Se offline, retorna mensagem de erro estruturada
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Sem conexão. Verifique sua internet e tente novamente."
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Para todos os outros assets (HTML, CSS, JS, ícones):
  // tenta o cache primeiro, cai na rede se não encontrar
  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      if (respostaCache) {
        return respostaCache;
      }
      // Não está no cache — busca na rede e cacheia dinamicamente
      return fetch(evento.request).then((respostaRede) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(evento.request, respostaRede.clone());
          return respostaRede;
        });
      });
    })
  );
});
