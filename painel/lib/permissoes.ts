/**
 * lib/permissoes.ts — matriz rota × papel da API (PURA, sem imports).
 *
 * Fonte única: cada rota chama `exigirPapel(req, MATRIZ["<rota>:<MÉTODO>"])`.
 * x-api-key (automação) tem acesso total, fora desta matriz.
 * Baseada na tabela "O que cada papel pode fazer" da tela de usuários; onde a
 * tabela é silenciosa, vale o mais restritivo (administrador).
 */

export type Papel = "administrador" | "editor" | "autor";

const ADM: Papel[] = ["administrador"];
const ADM_ED: Papel[] = ["administrador", "editor"];
const TODOS: Papel[] = ["administrador", "editor", "autor"];

export const MATRIZ = {
  // Posts: autor cria/edita só os PRÓPRIOS (a rota confere a autoria) e não publica.
  "posts:GET": TODOS,
  "posts:POST": TODOS,
  "posts/[slug]:GET": TODOS,
  "posts/[slug]:PATCH": TODOS,
  "posts/[slug]:DELETE": ADM_ED,
  // Lixeira de posts: ver, restaurar e excluir de vez — administrador e editor.
  "posts/lixeira:GET": ADM_ED,
  "posts/lixeira:POST": ADM_ED,
  "posts/lixeira:DELETE": ADM_ED,
  // Categorias e mídia: autor só lê (precisa para escolher no post).
  "categorias:GET": TODOS,
  "categorias:POST": ADM_ED,
  "categorias/[id]:PATCH": ADM_ED,
  "categorias/[id]:DELETE": ADM_ED,
  "midia:GET": TODOS,
  "midia:POST": ADM_ED,
  // Foto de perfil: qualquer papel envia, mas a rota só aceita imagem até 2 MB na pasta "avatares"
  // (finalidade=avatar). Não dá ao autor upload geral nem PATCH/DELETE na biblioteca.
  "midia:POST:avatar": TODOS,
  "midia/[id]:GET": TODOS,
  "midia/[id]:PATCH": ADM_ED,
  "midia/[id]:DELETE": ADM_ED,
  // Leitura auxiliar das telas de edição
  "autores:GET": TODOS,
  "links-internos:GET": TODOS,
  "paginas:GET": TODOS,
  "stats:GET": TODOS,
  // config: as telas (domínio, nome do site) leem para todos os papéis; só o admin altera.
  "config:GET": TODOS,
  "config:PATCH": ADM,
  // Publicar (build) = publicar posts: administrador e editor.
  "build:POST": ADM_ED,
  "build:GET": ADM_ED,
  // Aparência, SEO técnico, menus e redirects: só administrador.
  "layout:GET": ADM,
  "menus:GET": ADM,
  "menus:PATCH": ADM,
  "robots:GET": ADM,
  "robots:PATCH": ADM,
  "llms:GET": ADM,
  "llms:PATCH": ADM,
  "redirects:GET": ADM,
  "redirects:POST": ADM,
  "redirects/[id]:DELETE": ADM,
  // Leads e tarefas (tabela silenciosa): administrador e editor; formulários, só admin altera.
  "leads:GET": ADM_ED,
  "leads:POST": ADM_ED,
  "leads/[id]:PATCH": ADM_ED,
  "leads/[id]:DELETE": ADM_ED,
  "tarefas:GET": ADM_ED,
  "tarefas:POST": ADM_ED,
  "tarefas/[id]:PATCH": ADM_ED,
  "tarefas/[id]:DELETE": ADM_ED,
  "formularios:GET": ADM_ED,
  "formularios:POST": ADM,
  "formularios/[id]:PATCH": ADM,
  "formularios/[id]:DELETE": ADM,
  // Usuários: listar/criar/remover só admin (PATCH do próprio perfil é tratado na rota).
  "usuarios:GET": ADM,
  "usuarios:POST": ADM,
  "usuarios/[id]:DELETE": ADM,
} as const satisfies Record<string, readonly Papel[]>;

export type ChaveMatriz = keyof typeof MATRIZ;

export function papelPermitido(chave: ChaveMatriz, papel: string | undefined): boolean {
  return (MATRIZ[chave] as readonly string[]).includes(papel ?? "");
}
