import { expect, type Page } from "@playwright/test";

/** Loga pela tela de login de verdade (não por storageState) e espera a sessão abrir. */
export async function login(page: Page, email: string, senha: string) {
  await page.goto("/login");
  // app/login/page.tsx usa <Campo label="…"> (rótulo visual, sem htmlFor) —
  // getByLabel não associa. Os campos têm name= de verdade, então usamos isso.
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="senha"]').fill(senha);
  await page.getByRole("button", { name: /Entrar no painel/i }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 });
}

/** PNG 1x1 vermelho válido — pequeno o bastante para nascer embutido no teste (sem fixture externa). */
export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

export function nomeUnico(prefixo: string) {
  return `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
