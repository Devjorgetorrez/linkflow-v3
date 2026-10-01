import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login } from "./helpers";

test.describe("Leads", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("abre a lista (pode estar vazia)", async ({ page }) => {
    const resposta = page.waitForResponse((r) => r.url().includes("/api/leads") && r.request().method() === "GET");
    await page.goto("/leads");
    await resposta;

    // Ou mostra a lista, ou o estado vazio — nunca erro/tela em branco.
    const vazio = page.getByText("Nenhum lead recebido ainda.");
    const tabela = page.locator("table");
    await expect(vazio.or(tabela)).toBeVisible({ timeout: 10_000 });
  });
});
