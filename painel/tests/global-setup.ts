import type { FullConfig } from "@playwright/test";
import { ADMIN, AUTOR, CONTA_LOGIN_FALHO } from "./dados-teste";

/**
 * global-setup.ts — cria os usuários de teste via API, direto no servidor
 * que já está no ar em PLAYWRIGHT_BASE_URL. Não depende de estado externo:
 * roda antes de toda a suíte e é idempotente (pode rodar de novo contra o
 * mesmo servidor sem quebrar).
 *
 * Autenticação: x-api-key (automação, acesso total — mesmo mecanismo que o
 * Claude Code usa contra o painel real). A chave vem de PLAYWRIGHT_API_KEY,
 * ou de PAINEL_API_KEY (o nome usado no .env do painel) como alternativa,
 * para não obrigar a duplicar a variável. Ver tests/README.md.
 */

type UsuarioTeste = { nome: string; email: string; senha: string; papel: "administrador" | "autor" };

async function ensureUser(baseURL: string, apiKey: string, u: UsuarioTeste) {
  const headers = { "x-api-key": apiKey, "Content-Type": "application/json" };

  const lista = await fetch(`${baseURL}/api/usuarios`, { headers });
  if (!lista.ok) {
    throw new Error(
      `[global-setup] não consegui listar usuários (${lista.status}) — confira PLAYWRIGHT_API_KEY/PAINEL_API_KEY e se o painel de teste está no ar em ${baseURL}.`,
    );
  }
  const { usuarios } = (await lista.json()) as { usuarios: Array<{ id: string; acesso?: { emailLogin?: string } }> };
  const existente = usuarios.find((x) => x.acesso?.emailLogin?.toLowerCase() === u.email.toLowerCase());

  if (existente) {
    // Já existe (rodada anterior): reativa, garante o papel e troca a senha —
    // x-api-key pode trocar a senha de qualquer usuário sem pedir a atual.
    const r = await fetch(`${baseURL}/api/usuarios/${existente.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        acesso: { emailLogin: u.email, papel: u.papel, ativo: true },
        senha: u.senha,
        nome: u.nome,
      }),
    });
    if (!r.ok) throw new Error(`[global-setup] não consegui reativar ${u.email} (${r.status}): ${await r.text()}`);
    return;
  }

  const r = await fetch(`${baseURL}/api/usuarios`, {
    method: "POST",
    headers,
    body: JSON.stringify({ nome: u.nome, email: u.email, senha: u.senha, papel: u.papel }),
  });
  if (!r.ok) throw new Error(`[global-setup] não consegui criar ${u.email} (${r.status}): ${await r.text()}`);
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3210";
  const apiKey = process.env.PLAYWRIGHT_API_KEY || process.env.PAINEL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "[global-setup] defina PLAYWRIGHT_API_KEY (ou PAINEL_API_KEY) com a mesma chave do .env.local do painel de teste — ver painel/tests/README.md.",
    );
  }

  // Primeiro usuário do cadastro: se ainda não existir NENHUM, o POST de
  // bootstrap (sem exigir papel administrador prévio) cria o admin.
  await ensureUser(baseURL, apiKey, ADMIN);
  await ensureUser(baseURL, apiKey, AUTOR);
  await ensureUser(baseURL, apiKey, CONTA_LOGIN_FALHO);

  // Aquecimento: contra `next dev`, cada rota só compila na PRIMEIRA visita
  // (a compilação em si pode passar de 10-15s) — o que parece lentidão de
  // teste é, na real, o custo normal de dev, não um problema do produto.
  // Uma varredura por HTTP puro (sem JS) antes da suíte evita que a
  // primeira spec a tocar cada rota estoure o timeout por isso. Rotas
  // dinâmicas (.../[id]) compilam pelo padrão da rota — o id no fim não
  // precisa existir de verdade.
  const rotasParaAquecer = [
    "/login",
    "/",
    "/posts",
    "/posts/aquecimento",
    "/servicos",
    "/servicos/aquecimento",
    "/usuarios",
    "/usuarios/aquecimento",
    "/usuarios/novo",
    "/midia",
    "/leads",
    "/privacidade/cookies",
    "/aparencia/personalizar",
  ];
  await Promise.all(
    rotasParaAquecer.map((rota) => fetch(`${baseURL}${rota}`).catch(() => null)),
  );
}
