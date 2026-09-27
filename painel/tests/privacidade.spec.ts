import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico } from "./helpers";

test.describe("Privacidade — Cookies", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("abrir a tela e editar um campo", async ({ page }) => {
    await page.goto("/privacidade/cookies");
    await expect(page.getByRole("heading", { name: "Banner de cookies" })).toBeVisible();

    const titulo = nomeUnico("Este site usa cookies");
    const campoTitulo = page.getByPlaceholder("Este site usa cookies");
    await campoTitulo.fill(titulo);
    await expect(campoTitulo).toHaveValue(titulo);
  });

  test("botão fica desabilitado enquanto a Política de Privacidade não está completa", async ({ page, request }) => {
    const apiKey = process.env.PLAYWRIGHT_API_KEY ?? process.env.PAINEL_API_KEY ?? "";
    const headers = apiKey ? { "x-api-key": apiKey } : {};
    const antes = await (await request.get("/api/config", { headers })).json();
    const original = antes.config?.legalPainel ?? {};
    test.skip(
      !!(original.cnpj && original.endereco && original.emailContato),
      "Servidor já tem a Política de Privacidade preenchida (provavelmente uma cópia de teste compartilhada) — este teste precisa começar com ela incompleta.",
    );

    await page.goto("/privacidade/cookies");
    await expect(
      page.getByText("O banner precisa levar a algum lugar. Publique a política de privacidade antes de ativar o banner."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar configuração" })).toBeDisabled();
  });

  // Não desfaz no final: a API rejeita voltar `atualizadaEm` pra vazio de
  // propósito (não dá pra "despublicar" uma política já datada — regra de
  // negócio real em lib/legal-site.ts, validarLegal). Depois deste teste
  // rodar uma vez, o servidor fica com a Política completa — o mesmo que
  // aconteceria com um cliente de verdade, e é por isso que o teste
  // anterior se auto-pula quando já está assim.
  test("completar a Política de Privacidade libera o botão Salvar configuração", async ({ page, request }) => {
    const apiKey = process.env.PLAYWRIGHT_API_KEY ?? process.env.PAINEL_API_KEY ?? "";
    const headers = apiKey ? { "x-api-key": apiKey } : {};

    await request.patch("/api/config", {
      headers,
      data: {
        legalPainel: {
          cnpj: "nao possui",
          endereco: "Rua Teste, 123 — Jundiaí/SP",
          emailContato: "contato@teste.com",
          retencaoFormularios: "5 anos",
          retencaoAnaliticos: "14 meses",
          retencaoMarketing: "90 dias",
          versaoPolitica: "1.0",
          atualizadaEm: new Date().toISOString().slice(0, 10),
        },
      },
    });

    await page.goto("/privacidade/cookies");
    await expect(
      page.getByText("O banner precisa levar a algum lugar. Publique a política de privacidade antes de ativar o banner."),
    ).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar configuração" })).toBeEnabled();
  });
});
