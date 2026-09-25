/**
 * middleware.ts — Proteção de rotas do painel
 *
 * Rotas protegidas: tudo exceto /login e /api/auth
 * Sem sessão válida → redireciona para /login
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Rotas de API internas (protegidas por API key, não por sessão)
    if (pathname.startsWith("/api/posts") ||
        pathname.startsWith("/api/config") ||
        pathname.startsWith("/api/build") ||
        pathname.startsWith("/api/usuarios") ||
        pathname.startsWith("/api/stats") ||
        pathname.startsWith("/api/robots") ||
        pathname.startsWith("/api/llms") ||
        pathname.startsWith("/api/menus") ||
        pathname.startsWith("/api/build") ||
        pathname.startsWith("/api/midia") ||
        pathname.startsWith("/api/leads") ||
        pathname.startsWith("/api/formularios") ||
        pathname.startsWith("/api/submissao") ||
        pathname.startsWith("/api/tarefas") ||
        pathname.startsWith("/api/redirects") ||
        pathname.startsWith("/api/paginas") ||
        pathname.startsWith("/api/autores") ||
        pathname.startsWith("/api/categorias")) {
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

        // Rotas públicas
        if (pathname.startsWith("/login") ||
            pathname.startsWith("/api/auth") ||
            pathname.startsWith("/api/posts") ||
            pathname.startsWith("/api/config") ||
            pathname.startsWith("/api/build") ||
            pathname.startsWith("/api/usuarios") ||
        pathname.startsWith("/api/stats") ||
        pathname.startsWith("/api/robots") ||
        pathname.startsWith("/api/llms") ||
        pathname.startsWith("/api/menus") ||
        pathname.startsWith("/api/build") ||
        pathname.startsWith("/api/midia") ||
        pathname.startsWith("/api/leads") ||
        pathname.startsWith("/api/formularios") ||
        pathname.startsWith("/api/submissao") ||
        pathname.startsWith("/api/tarefas") ||
        pathname.startsWith("/api/redirects") ||
        pathname.startsWith("/api/paginas") ||
        pathname.startsWith("/api/autores") ||
        pathname.startsWith("/api/categorias")) {
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
