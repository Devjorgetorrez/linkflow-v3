/**
 * lib/status-post.ts — leitura do `status` do frontmatter de um post.
 *
 * Mesma regra do site (_astro/src/lib/publicacao.ts): só fica FORA do ar o
 * que está marcado explicitamente como não pronto — rascunho, revisão,
 * agendado ou lixeira. Status ausente, "publicado" ou "pronto" (termo que a
 * skill site-publicar usa) = publicado. Assim o painel nunca mostra como
 * rascunho um post que está no ar, nem o contrário.
 */
import type { StatusPost } from "@/mock/types";

export function lerStatusPost(bruto: unknown): StatusPost {
  const s = String(bruto ?? "").trim().toLowerCase();
  if (s === "rascunho") return "rascunho";
  if (s === "revisao" || s === "revisão") return "revisao";
  if (s === "agendado") return "agendado";
  if (s === "lixeira") return "lixeira";
  return "publicado";
}
