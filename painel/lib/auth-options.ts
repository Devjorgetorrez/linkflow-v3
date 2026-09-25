/**
 * lib/auth-options.ts — Configuração do NextAuth
 *
 * Separado do route.ts porque o Next.js App Router não permite
 * exportar nada além dos métodos HTTP (GET, POST, etc.) de um route.ts.
 * Importar daqui em vez de importar do route.ts.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { buscarPorEmail, verificarSenha } from "./usuarios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const usuario = buscarPorEmail(credentials.email);
        if (!usuario || !usuario.acesso?.ativo || !usuario.senhaHash) return null;

        const senhaOk = await verificarSenha(credentials.senha, usuario.senhaHash);
        if (!senhaOk) return null;

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
      return token;
    },
    async session({ session, token }) {
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
