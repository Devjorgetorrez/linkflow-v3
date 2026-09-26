/**
 * middleware.ts — Proteção de rotas do painel
 *
 * Rotas protegidas: tudo exceto /login e /api/auth
 * Sem sessão válida → redireciona para /login
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Rotas de API que fazem a PRÓPRIA autenticação (sessão OU x-api-key, em
 * lib/auth.ts → verificarAcesso). O middleware deixa passar; o handler barra.
 *
 * Lista ÚNICA, usada nos dois pontos abaixo. Rota de API nova precisa entrar
 * aqui, senão o agente (que usa x-api-key, sem sessão) é redirecionado para o
 * login. (Antes eram duas listas copiadas à mão, e rota nova ficava de fora.)
 */
const ROTAS_API_PROPRIAS = [
  "/api/posts",
  "/api/config",
  "/api/build",
  "/api/usuarios",
  "/api/stats",
  "/api/robots",
  "/api/llms",
  "/api/menus",
  "/api/midia",
  "/api/leads",
  "/api/formularios",
  "/api/submissao",
  "/api/tarefas",
  "/api/redirects",
  "/api/paginas",
  "/api/autores",
  "/api/categorias",
  "/api/layout",
  "/api/links-internos",
];

function ehRotaApiPropria(pathname: string): boolean {
  return ROTAS_API_PROPRIAS.some((rota) => pathname.startsWith(rota));
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (ehRotaApiPropria(pathname)) {
      return NextResponse.next();
    }

    // Verificar papel para rotas administrativas
    if (pathname.startsWith("/usuarios") || pathname.startsWith("/configuracoes")) {
      if (token?.papel !== "administrador") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rotas públicas (login e as APIs que se autenticam sozinhas)
        if (pathname.startsWith("/login") ||
            pathname.startsWith("/api/auth") ||
            ehRotaApiPropria(pathname)) {
          return true;
        }

        // Todo o resto precisa de autenticação
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
