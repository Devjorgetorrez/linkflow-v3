import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login } from "./helpers";

/**
 * Smoke test: cada tela do menu (Sidebar) abre sem erro 500 nem tela em
 * branco. Não valida conteúdo específico — isso é papel das outras specs.
 */
const ROTAS = [
  "/",
  "/posts",
  "/categorias",
  "/servicos",
  "/paginas",
  "/paginas/estrutura",
  "/paginas/menus",
  "/paginas-fixas",
  "/midia",
  "/formularios",
  "/leads",
  "/aparencia/temas",
  "/aparencia/personalizar",
  "/seo",
  "/seo/sitemap",
  "/seo/dados-estruturados",
  "/seo/robots",
  "/seo/llms",
  "/seo/verificacoes",
  "/privacidade/cookies",
  "/privacidade/politica",
  "/privacidade/termos",
  "/usuarios",
  "/configuracoes/identidade",
  "/configuracoes/contato",
  "/configuracoes/redes",
  "/configuracoes/integracoes",
  "/perfil",
];

test.describe("Navegação — smoke test do menu", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  for (const rota of ROTAS) {
    test(`${rota} abre sem erro`, async ({ page }) => {
      const resposta = await page.goto(rota);
      expect(resposta?.status(), `status HTTP de ${rota}`).toBeLessThan(400);

      // Next.js mostra esse texto no overlay de erro de runtime não pego pela tela.
      await expect(page.getByText("Application error: a client-side exception has occurred")).toHaveCount(0);
      // Tela em branco: o layout do painel sempre desenha a Sidebar.
      await expect(page.locator("aside")).toBeVisible();
    });
  }
});
