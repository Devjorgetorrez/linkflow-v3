import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico } from "./helpers";

test.describe("Posts", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("criar nasce rascunho, editar título muda slug/URL, salva e vai pra lixeira/restaura", async ({ page }) => {
    // ── Criar: /posts/novo cria no servidor e já redireciona pro editor ──
    await page.goto("/posts/novo");
    // (?!novo$): "/posts/novo" também bate no padrão — sem excluir, o
    // waitForURL resolveria na hora, sem esperar o redirect de verdade.
    await page.waitForURL(/\/posts\/(?!novo$)[^/]+$/, { timeout: 30_000 });

    // Primeira visita à rota dinâmica /posts/[id] nesta rodada — contra
    // `next dev` a compilação do bundle pode levar mais que o timeout padrão
    // de expect(); esperar o campo de título é o sinal de que carregou.
    const campoTitulo = page.getByLabel("Título do artigo");
    await expect(campoTitulo).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("rascunho", { exact: true })).toBeVisible();

    // ── Editar título: o slug/URL acompanham até ser editado à mão ──
    const titulo = nomeUnico("Post automatizado");
    await campoTitulo.fill(titulo);
    await campoTitulo.blur();

    // ── Salvar: "Salvando…" some e vira "Salvo" (autosave, sem botão) ──
    await expect(page.getByRole("status").filter({ hasText: "Salvando" })).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByRole("status").filter({ hasText: /^Salvo/ })).toBeVisible({ timeout: 10_000 });

    // URL mostrada no cabeçalho reflete o slug derivado do título
    const slugEsperado = titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    await expect(page.locator("span.font-mono").first()).toContainText(slugEsperado);

    // Aba SEO → o campo Slug (input dedicado) tem o mesmo valor.
    // "SEO" sozinho é ambíguo (também existe na Sidebar e no card de
    // análise) — a aba fica dentro do painel #painel-seo.
    await page.locator("#painel-seo").getByRole("button", { name: "SEO" }).click();
    const campoSlug = page.locator('input[placeholder="slug-do-post"]');
    await expect(campoSlug).toHaveValue(slugEsperado);

    // ── Mover para a lixeira (aceita o confirm(), se aparecer) ──
    page.once("dialog", (d) => d.accept());
    await page.goto("/posts");
    const linha = page.getByRole("row", { name: new RegExp(titulo) });
    await expect(linha).toBeVisible();
    await linha.getByRole("checkbox").check();
    await page.locator("select").filter({ hasText: "Ações em massa" }).selectOption("lixeira");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByRole("row", { name: new RegExp(titulo) })).toHaveCount(0);

    // ── Restaurar, na aba Lixeira ──
    await page.getByRole("button", { name: /Lixeira/ }).click();
    const linhaLixeira = page.getByRole("row", { name: new RegExp(titulo) });
    await expect(linhaLixeira).toBeVisible();
    // O botão "Restaurar" só existe no DOM (display:none → flex) com o mouse em
    // cima da linha (classe Tailwind `hidden group-hover:flex`) — sem o hover, o
    // botão não está na árvore de acessibilidade e o click nunca encontra o alvo.
    await linhaLixeira.hover();
    await linhaLixeira.getByRole("button", { name: "Restaurar" }).click();
    await expect(page.getByText(/voltou para os posts/)).toBeVisible();
  });
});
