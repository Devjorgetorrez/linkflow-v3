/**
 * tests/dados-teste.ts — fonte única das credenciais de teste.
 *
 * O global-setup usa estas constantes para CRIAR (ou reativar) os usuários
 * via API (x-api-key) no servidor de teste, e as specs usam as mesmas
 * constantes para logar. Nunca depende de usuário criado à mão fora do
 * Playwright — cada rodada cria os próprios dados.
 */

export const ADMIN = {
  nome: "Admin Teste E2E",
  email: "admin.e2e@teste.com",
  senha: "[SENHA-REMOVIDA]",
  papel: "administrador" as const,
};

export const AUTOR = {
  nome: "Autor Teste E2E",
  email: "autor.e2e@teste.com",
  senha: "[SENHA-REMOVIDA]",
  papel: "autor" as const,
};

/**
 * Conta só para os testes de senha errada / bloqueio de 5 tentativas — em
 * conta própria para não derrubar o acesso da ADMIN usada nas outras specs
 * (o limite é por e-mail+IP, em memória no servidor).
 *
 * E-mail com sufixo por rodada: o limitador de tentativas (lib/limite-login.ts)
 * vive em memória no processo do servidor e NUNCA é resetado pela suíte —
 * rodar a suíte várias vezes seguidas contra o mesmo `next dev` sem isso
 * deixaria esta conta bloqueada nas rodadas seguintes (falso negativo, não
 * bug do produto).
 */
export const CONTA_LOGIN_FALHO = {
  nome: "Login Falho E2E",
  email: `login-falho.e2e.${Date.now()}@teste.com`,
  senha: "[SENHA-REMOVIDA]",
  papel: "autor" as const,
};

/** Senha errada de propósito, para o teste de login com falha. */
export const SENHA_ERRADA = "senha-errada-de-proposito";
