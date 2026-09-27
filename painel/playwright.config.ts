import { defineConfig, devices } from "@playwright/test";

/**
 * playwright.config.ts — suíte e2e do painel SiteFlow.
 *
 * Roda contra uma cópia (local, dev ou VPS) já no ar em PLAYWRIGHT_BASE_URL.
 * Este arquivo NUNCA sobe o painel sozinho — quem sobe é quem chama
 * `npx playwright test` (ver tests/README.md para como preparar a cópia de
 * teste). O global-setup só CRIA os usuários de teste via API
 * (x-api-key) contra o servidor que já estiver rodando nessa URL.
 */
export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false, // as specs compartilham o mesmo usuarios.json/posts/servicos do servidor de teste
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Generosos de propósito: contra `next dev`, a PRIMEIRA visita a cada rota
  // (em especial rotas dinâmicas como /posts/[id]) paga o custo de compilar
  // aquele bundle na hora — não é lentidão do produto em produção.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3210",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
