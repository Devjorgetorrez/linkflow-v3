/**
 * lib/auth-options.ts — Configuração do NextAuth
 *
 * Separado do route.ts porque o Next.js App Router não permite
 * exportar nada além dos métodos HTTP (GET, POST, etc.) de um route.ts.
 * Importar daqui em vez de importar do route.ts.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { buscarPorEmail, buscarPorId, hashSenha, verificarSenha } from "./usuarios";
import { criarLimitador, MENSAGEM_BLOQUEIO } from "./limite-login";

// globalThis: sobrevive a recarga de módulo em dev e a cópias do módulo entre bundles.
const g = globalThis as unknown as { __painelLimiteLogin?: ReturnType<typeof criarLimitador> };
const limiteLogin = (g.__painelLimiteLogin ??= criarLimitador());

// Hash de descarte: o tempo de resposta é o mesmo com e-mail existente ou não.
let hashDescarte: Promise<string> | null = null;
const HASH_DESCARTE = () => (hashDescarte ??= hashSenha("descarte-tempo-constante"));

function ipDe(req: unknown): string {
  const h = (req as { headers?: Record<string, string | string[] | undefined> } | undefined)?.headers ?? {};
  const xff = h["x-forwarded-for"];
  const bruto = Array.isArray(xff) ? xff.join(",") : xff;
  // Último item: é o que o proxy (Nginx) acrescenta; o primeiro pode vir forjado do cliente.
  const ip = bruto?.split(",").map((s) => s.trim()).filter(Boolean).pop();
  const real = h["x-real-ip"];
  return ip || (Array.isArray(real) ? real[0] : real) || "desconhecido";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.senha) return null;

        // 5 falhas por e-mail+IP → 15 min de bloqueio. Mesma resposta exista o e-mail ou não.
        const chave = `${credentials.email.trim().toLowerCase()}|${ipDe(req)}`;
        if (limiteLogin.bloqueado(chave)) throw new Error(MENSAGEM_BLOQUEIO);

        let usuario;
        try {
          usuario = buscarPorEmail(credentials.email.trim());
        } catch (err) {
          console.error("[auth] cadastro de usuários ilegível:", err);
          return null;
        }
        const hash = usuario?.senhaHash ?? (await HASH_DESCARTE());
        const senhaOk = await verificarSenha(credentials.senha, hash);
        if (!usuario || !usuario.acesso?.ativo || usuario.podeAcessar === false || !usuario.senhaHash || !senhaOk) {
          limiteLogin.falha(chave);
          return null;
        }
        limiteLogin.sucesso(chave);

        return {
          id: usuario.id,
          name: usuario.autoria?.nomePublico || usuario.acesso?.emailLogin || "",
          email: usuario.acesso?.emailLogin ?? "",
          image: usuario.autoria?.foto ?? null,
          papel: usuario.acesso?.papel ?? "autor",
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.papel = (user as { papel?: string }).papel;
      }
      // Revalida a cada requisição: o papel vem do usuarios.json (não do login
      // antigo) e conta desativada/removida deixa de valer na hora.
      if (token.sub) {
        try {
          const u = buscarPorId(token.sub);
          if (!u || !u.acesso?.ativo || u.podeAcessar === false) {
            token.invalido = true;
          } else {
            token.invalido = false;
            token.papel = u.acesso.papel;
          }
        } catch (err) {
          console.error("[auth] cadastro de usuários ilegível:", err);
          token.invalido = true; // sem como conferir: não confia
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.invalido) return { expires: session.expires } as typeof session; // sem user = sem sessão
      if (session.user) {
        (session.user as { papel?: string }).papel = token.papel as string;
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
