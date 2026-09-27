import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico, PNG_1X1 } from "./helpers";

test.describe("Mídia", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("abrir a biblioteca, enviar um PNG, ver na grade e excluir", async ({ page, request }) => {
    await page.goto("/midia");
    await expect(page.getByRole("heading", { name: "Biblioteca de mídia" })).toBeVisible();

    const nomeArquivo = `${nomeUnico("teste-playwright")}.png`;
    await page.locator('input[type="file"]').setInputFiles({
      name: nomeArquivo,
      mimeType: "image/png",
      buffer: PNG_1X1,
    });

    const item = page.locator(`text=${nomeArquivo}`).first();
    await expect(item).toBeVisible({ timeout: 15_000 });

    // Abre o item (clica na miniatura, que é o card inteiro) e exclui pelo painel de detalhe.
    await item.click();
    const botaoExcluir = page.getByRole("button", { name: /^Excluir/ });
    page.once("dialog", (d) => d.accept());
    await botaoExcluir.click();

    // O nome aparece em mais de um lugar na tela (card da grade + painel de
    // detalhe que estava aberto): checar contagem de texto é frágil. A fonte de
    // verdade de "foi excluído" é a API — confere lá, sem depender de DOM.
    const apiKey = process.env.PLAYWRIGHT_API_KEY ?? process.env.PAINEL_API_KEY ?? "";
    await expect(async () => {
      const r = await request.get("/api/midia", { headers: apiKey ? { "x-api-key": apiKey } : {} });
      const { midia } = (await r.json()) as { midia: Array<{ arquivo: string }> };
      expect(midia.some((m) => m.arquivo === nomeArquivo)).toBe(false);
    }).toPass({ timeout: 10_000 });
  });
});
