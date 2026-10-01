import { test, expect } from "@playwright/test";
import { ADMIN, CONTA_LOGIN_FALHO, SENHA_ERRADA } from "./dados-teste";
import { login } from "./helpers";

async function preencherLogin(page: import("@playwright/test").Page, email: string, senha: string) {
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="senha"]').fill(senha);
  await page.getByRole("button", { name: /Entrar no painel/i }).click();
}

test.describe("Login", () => {
  test("login com sucesso leva ao dashboard", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
    await expect(page).toHaveURL("/");
  });

  test("senha errada mostra erro e não entra", async ({ page }) => {
    await page.goto("/login");
    await preencherLogin(page, CONTA_LOGIN_FALHO.email, SENHA_ERRADA);

    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("5 tentativas erradas bloqueiam por um tempo", async ({ page }) => {
    // Conta dedicada (ver dados-teste.ts) para não derrubar o acesso usado
    // pelas outras specs — o limite é por e-mail+IP, em memória no servidor.
    await page.goto("/login");
    for (let i = 0; i < 5; i++) {
      await preencherLogin(page, CONTA_LOGIN_FALHO.email, SENHA_ERRADA);
      await expect(page.getByText(/incorretos|tentativas/i)).toBeVisible();
    }

    // 6ª tentativa (mesmo com a senha CERTA) — já deve estar bloqueado.
    await preencherLogin(page, CONTA_LOGIN_FALHO.email, CONTA_LOGIN_FALHO.senha);

    await expect(page.getByText("Muitas tentativas. Tente em alguns minutos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
