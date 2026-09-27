import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico } from "./helpers";

test.describe("Serviços", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("criar, editar e ver os campos do schema do tema ativo", async ({ page }) => {
    await page.goto("/servicos/novo");
    // (?!novo$): mesmo cuidado do posts.spec.ts — "/servicos/novo" também
    // bate no padrão sem a exclusão.
    await page.waitForURL(/\/servicos\/(?!novo$)[^/]+$/, { timeout: 30_000 });

    // Primeira visita à rota dinâmica /servicos/[id] nesta rodada — dar
    // tempo pra `next dev` compilar antes de checar o resto da tela.
    const campoTitulo = page.getByLabel("Título do serviço");
    await expect(campoTitulo).toBeVisible({ timeout: 30_000 });

    await expect(page.getByPlaceholder("slug-do-servico")).toBeVisible();

    // Campo do schema do tema ativo: ícone (lib/servicos-fs.ts — todos os
    // temas têm). Fica dentro do painel "Imagem do serviço", recolhido por
    // padrão (PainelRecolhivel inicialAberto={false}) — expande primeiro.
    await page.getByRole("button", { name: "Imagem do serviço" }).click();
    await expect(page.getByPlaceholder(/tooth, scale, wrench/)).toBeVisible();

    const titulo = nomeUnico("Serviço automatizado");
    await campoTitulo.fill(titulo);

    // metaDescription é obrigatória (80–165 chars) — sem ela o Salvar fica bloqueado.
    const metaDescricao =
      "Descrição de teste automatizado gerada pela suíte Playwright, com tamanho suficiente para passar da faixa mínima exigida pelo painel.";
    await page.getByPlaceholder(/Resumo exibido no resultado de busca/).fill(metaDescricao);

    const botaoSalvar = page.getByRole("button", { name: /^Salvar$|^Salvando…$/ });
    await botaoSalvar.click();
    await expect(page.getByRole("status")).toContainText(/Salvo às/, { timeout: 10_000 });
  });
});
