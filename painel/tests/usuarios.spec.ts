import { test, expect } from "@playwright/test";
import { ADMIN } from "./dados-teste";
import { login, nomeUnico } from "./helpers";

test.describe("Usuários", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
  });

  test("criar usuário com todos os campos e depois editar", async ({ page }) => {
    await page.goto("/usuarios/novo");

    const nome = nomeUnico("Usuario Teste");
    const email = `${nomeUnico("usuario-teste")}@teste.com`;

    await page.getByPlaceholder("Nome completo").fill(nome);
    await page.getByPlaceholder("login@dominio.com.br").fill(email);
    await page.getByPlaceholder("Mínimo 8 caracteres").fill("Senha@Teste123");

    // Papel: editor (select dedicado, com as 3 opções administrador/editor/autor)
    await page.locator("select").filter({ hasText: "Editor" }).selectOption("editor");

    await page.getByRole("button", { name: "Criar usuário" }).click();
    // Com senha preenchida, a criação NÃO navega direto — mostra a senha uma
    // única vez ("Anote agora — não será exibida de novo") e só sai dali
    // quando o usuário clica "Abrir o usuário" (EditorUsuario.tsx).
    await page.getByRole("button", { name: "Abrir o usuário" }).click();
    // (?!novo$): "/usuarios/novo" TAMBÉM bate em /\/usuarios\/[^/]+$/, então
    // sem excluir "novo" o waitForURL resolve de imediato (já estamos nela)
    // em vez de esperar o redirect de verdade pro id criado.
    await page.waitForURL(/\/usuarios\/(?!novo$)[^/]+$/, { timeout: 15_000 });
    await expect(page.getByPlaceholder("login@dominio.com.br")).toHaveValue(email);

    // ── Editar: muda o nome e salva ──
    const nomeEditado = `${nome} (editado)`;
    await page.getByPlaceholder("Nome completo").fill(nomeEditado);
    await page.getByRole("button", { name: /^Salvar$/ }).click();
    await expect(page.getByRole("button", { name: "Salvo" })).toBeVisible({ timeout: 10_000 });
  });

  test("trava do último admin: tentar rebaixar falha visualmente", async ({ page, request }) => {
    // Só faz sentido num servidor onde o ADMIN de teste é o ÚNICO administrador ativo.
    // Numa cópia compartilhada/de longa duração (ex.: alguém testando manualmente ao
    // mesmo tempo), pode haver outro admin — a trava não dispararia para nenhum dos
    // dois, e isso não é bug, é a mesma regra funcionando certo com 2+ admins. A suíte
    // não mexe em conta que não criou, então só pula o teste em vez de forçar o estado.
    const apiKey = process.env.PLAYWRIGHT_API_KEY ?? process.env.PAINEL_API_KEY ?? "";
    const resp = await request.get("/api/usuarios", { headers: apiKey ? { "x-api-key": apiKey } : {} });
    const { usuarios } = (await resp.json()) as {
      usuarios: Array<{ acesso?: { papel?: string; ativo?: boolean } }>;
    };
    const admins = usuarios.filter((u) => u.acesso?.papel === "administrador" && u.acesso?.ativo !== false);
    test.skip(admins.length !== 1, `Servidor tem ${admins.length} administradores ativos (precisa ser exatamente 1 para este teste fazer sentido) — provavelmente uma cópia de teste compartilhada, não um servidor limpo só para a suíte.`);

    await page.goto("/usuarios");
    const linhaAdmin = page.getByRole("row", { name: new RegExp(ADMIN.email) });
    await linhaAdmin.getByRole("link", { name: "Editar" }).click();
    await page.waitForURL(/\/usuarios\/[^/]+$/);

    await expect(
      page.getByText("Este é o único Administrador ativo. Não é possível rebaixar, desativar ou remover o acesso."),
    ).toBeVisible();

    // Trava dupla: o <select> de papel vem DESABILITADO (e o onChange também
    // ignora a troca, por segurança) — não dá nem para tentar mudar na tela.
    const selectPapel = page.locator("select").filter({ hasText: "Administrador" });
    await expect(selectPapel).toHaveValue("administrador");
    await expect(selectPapel).toBeDisabled();
  });
});
