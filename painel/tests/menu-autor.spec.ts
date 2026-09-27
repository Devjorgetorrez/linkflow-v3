import { test, expect } from "@playwright/test";
import { AUTOR } from "./dados-teste";
import { login } from "./helpers";

/**
 * Papel Autor: a Sidebar (components/Sidebar.tsx) usa a mesma matriz de
 * permissões da API (lib/permissoes-paginas.ts) pra desenhar os itens fora
 * do escopo do papel como desabilitados (cinza, role="link" aria-disabled).
 */
test.describe("Menu — papel Autor", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, AUTOR.email, AUTOR.senha);
  });

  test("itens fora do escopo do Autor aparecem desabilitados", async ({ page }) => {
    // Só administrador: usuarios:GET
    const usuarios = page.getByRole("link", { name: "Usuários" });
    await expect(usuarios).toHaveAttribute("aria-disabled", "true");

    // Só administrador: layout:GET
    const aparencia = page.getByRole("link", { name: "Aparência" });
    await expect(aparencia).toHaveAttribute("aria-disabled", "true");

    // Só administrador: config:PATCH
    const privacidade = page.getByRole("link", { name: "Privacidade" });
    await expect(privacidade).toHaveAttribute("aria-disabled", "true");

    const configuracoes = page.getByRole("link", { name: "Configurações" });
    await expect(configuracoes).toHaveAttribute("aria-disabled", "true");

    // Formulários e Leads são ADM_ED — o grupo "Contato" inteiro fica bloqueado.
    const contato = page.getByRole("link", { name: "Contato" });
    await expect(contato).toHaveAttribute("aria-disabled", "true");

    // Dentro do escopo do Autor: Posts continua clicável.
    const posts = page.getByText("Posts", { exact: true }).first();
    await expect(posts).not.toHaveAttribute("aria-disabled", "true");
  });
});
