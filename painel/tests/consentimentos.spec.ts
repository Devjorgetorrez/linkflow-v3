import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico } from "./helpers";

/**
 * Erro 71 (Relatório de Testes 5): a tela de Consentimentos existia, mas um
 * consentimento dado de verdade no banner do site não aparecia nela — "Nenhum
 * registro ainda". Simula o que o banner faz (POST público em
 * /api/consentimentos, mesma origem que o motor usa em desenvolvimento —
 * ver lib/formularios-dados.ts) e confere que a tela lê o mesmo lugar onde
 * a API grava.
 */
test.describe("Consentimentos", () => {
  test("um consentimento dado no site aparece na tela do painel", async ({ page, request }) => {
    const paginaOrigem = `https://e2e-teste.exemplo.com.br/${nomeUnico("pagina")}`;

    const resposta = await request.post("/api/consentimentos", {
      headers: { Origin: "http://localhost:4321", "Content-Type": "application/json" },
      data: {
        escolha: "aceito",
        categorias: { analiticos: true, marketing: false, funcionais: true },
        paginaOrigem,
        visitanteId: nomeUnico("visitante"),
      },
    });
    expect(resposta.ok()).toBeTruthy();
    expect((await resposta.json()).ok).toBe(true);

    await login(page, ADMIN.email, ADMIN.senha);
    await page.goto("/privacidade/consentimentos");

    await expect(page.getByText("Nenhum registro")).toHaveCount(0);
    await expect(page.getByText(paginaOrigem)).toBeVisible();
  });
});
