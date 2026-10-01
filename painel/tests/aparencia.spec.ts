import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login } from "./helpers";

test.describe("Aparência", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("aba Cores é somente-leitura (sem botão Salvar)", async ({ page }) => {
    await page.goto("/aparencia/personalizar");
    await page.getByRole("button", { name: "Cores" }).click();

    // Somente-leitura: a tela não mostra o botão de salvar enquanto a aba
    // Cores estiver ativa (app/(painel)/aparencia/personalizar/page.tsx).
    await expect(page.getByRole("button", { name: /^Salvar$|^Salvando…$/ })).toHaveCount(0);
  });
});
