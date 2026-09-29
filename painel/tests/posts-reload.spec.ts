import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico } from "./helpers";

/**
 * Erro 69 (Relatório de Testes 5): o editor de post quebrava (React "Rendered
 * more hooks than during the previous render") quando a página era aberta
 * DIRETO — recarregando, por link, ou logo após criar — porque `useBaseSite()`
 * era chamado depois de dois `return` condicionais. Só quem chegava clicando
 * na lista não via o bug, porque o post já estava carregado no store.
 * Este teste reproduz o caminho que quebrava: reload da própria página do
 * editor, forçando o carregamento a partir do zero.
 */
test.describe("Editor de post — abrir direto", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("recarregar a página do editor não quebra (erro 69)", async ({ page }) => {
    await page.goto("/posts/novo");
    await page.getByPlaceholder("Título do artigo").fill(nomeUnico("Post reload"));
    await page.getByRole("button", { name: "Criar artigo" }).click();
    await page.waitForURL(/\/posts\/(?!novo$)[^/]+$/, { timeout: 30_000 });
    await expect(page.getByLabel("Título do artigo")).toBeVisible({ timeout: 30_000 });

    // O bug só aparecia numa carga do ZERO (a lista já tinha o post em
    // memória) — reload força exatamente isso.
    await page.reload();

    await expect(page.getByText("Application error: a client-side exception has occurred")).toHaveCount(0);
    await expect(page.getByLabel("Título do artigo")).toBeVisible({ timeout: 30_000 });
  });
});
