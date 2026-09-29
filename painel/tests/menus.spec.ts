import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico } from "./helpers";

/**
 * Erro 77 (Relatório de Testes 5): a tela de Menus não lia o rodapé
 * (navFooterColunas) — acusava "páginas sem menu" falso e, por não
 * conhecer a estrutura completa, o risco era que salvar apagasse itens
 * do rodapé. A fixture de teste (_astro base, tema HealthCare) tem 3
 * colunas reais no rodapé: "Serviços" (6 itens), "Clínica" (4 itens),
 * "Legal" (2 itens) — mesmo formato do caso real (menu "Tratamentos" com
 * 15 serviços).
 */
test.describe("Menus", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
    await page.goto("/paginas/menus");
  });

  test("lê e mostra as colunas do rodapé (antes invisíveis)", async ({ page }) => {
    await expect(page.getByText("Serviços", { exact: true })).toBeVisible();
    await expect(page.getByText("Rodapé").first()).toBeVisible();
    await expect(page.getByText("Consulta Especializada").first()).toBeVisible();
    await expect(page.getByText("Telemedicina").first()).toBeVisible();
  });

  test("adicionar item numa coluna do rodapé não apaga as outras colunas", async ({ page }) => {
    // Confirma o estado inicial das 3 colunas antes de mexer.
    await expect(page.getByText("Consulta Especializada").first()).toBeVisible();
    await expect(page.getByText("Nossa equipe").first()).toBeVisible();
    await expect(page.getByText("Política de Privacidade").first()).toBeVisible();

    // Adiciona um item externo na coluna "Clínica" (2º painel de rodapé).
    const painelClinica = page.locator("div").filter({ hasText: /^Clínica\s*Rodapé/ }).first();
    await painelClinica.getByRole("button", { name: "Adicionar item" }).click();
    await painelClinica.getByRole("button", { name: "URL externa" }).click();
    const rotulo = nomeUnico("Link teste");
    await painelClinica.getByPlaceholder("Texto do link").fill(rotulo);
    await painelClinica.getByPlaceholder("https://...").fill("https://exemplo.com.br/teste");
    // O PATCH ainda pode estar em voo quando o clique retorna (achado real:
    // reload logo em seguida perdia a mudança — corrigido com aviso de
    // beforeunload). Espera a resposta de rede de verdade, não só o estado
    // otimista da tela, antes de recarregar.
    const respostaPatch = page.waitForResponse(
      (r) => r.url().includes("/api/menus") && r.request().method() === "PATCH",
    );
    await painelClinica.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(rotulo)).toBeVisible();
    await respostaPatch;

    // Recarrega do zero (força reler o config real do disco) — as OUTRAS
    // colunas do rodapé precisam continuar intactas, não só a editada.
    await page.reload();
    await expect(page.getByText(rotulo)).toBeVisible();
    await expect(page.getByText("Consulta Especializada").first()).toBeVisible();
    await expect(page.getByText("Exames Clínicos").first()).toBeVisible();
    await expect(page.getByText("Acompanhamento Preventivo").first()).toBeVisible();
    await expect(page.getByText("Atendimento Familiar").first()).toBeVisible();
    await expect(page.getByText("Pequenas Cirurgias").first()).toBeVisible();
    await expect(page.getByText("Telemedicina").first()).toBeVisible();
    await expect(page.getByText("Política de Privacidade").first()).toBeVisible();
    await expect(page.getByText("Termos de Uso").first()).toBeVisible();
  });
});
