import type { Post } from "@/mock/types";

// Requisitos por tipo de schema — consumido pela validação de Dados estruturados.
// Cada entrada lista as propriedades obrigatórias e recomendadas para o tipo.

export interface RequisitoCampo {
  prop: string;
  label: string;
  obrigatorio: boolean;
  detalhe?: string;
}

export interface RequisitoSchema {
  tipo: Post["schemaTipo"];
  campos: RequisitoCampo[];
}

export const REQUISITOS_SCHEMA: RequisitoSchema[] = [
  {
    tipo: "Article",
    campos: [
      { prop: "headline",       label: "Título (headline)",          obrigatorio: true  },
      { prop: "datePublished",  label: "Data de publicação",         obrigatorio: true  },
      { prop: "dateModified",   label: "Data de modificação",        obrigatorio: false },
      { prop: "author",         label: "Autor (@type Person)",       obrigatorio: true  },
      { prop: "image",          label: "Imagem de capa",             obrigatorio: true  },
      { prop: "description",    label: "Meta description",           obrigatorio: false },
    ],
  },
  {
    tipo: "FAQPage",
    campos: [
      { prop: "mainEntity",     label: "Perguntas (mainEntity)",     obrigatorio: true,  detalhe: "Ao menos 1 Question + acceptedAnswer" },
      { prop: "headline",       label: "Título (headline)",          obrigatorio: false },
      { prop: "datePublished",  label: "Data de publicação",         obrigatorio: false },
      { prop: "author",         label: "Autor (@type Person)",       obrigatorio: false },
    ],
  },
  {
    tipo: "HowTo",
    campos: [
      { prop: "name",           label: "Nome do passo a passo",      obrigatorio: true  },
      { prop: "step",           label: "Passos (HowToStep)",         obrigatorio: true,  detalhe: "Ao menos 1 passo com name e text" },
      { prop: "image",          label: "Imagem ilustrativa",         obrigatorio: false },
      { prop: "totalTime",      label: "Tempo total (ISO 8601)",     obrigatorio: false },
      { prop: "description",    label: "Descrição",                  obrigatorio: false },
    ],
  },
  {
    tipo: "Recipe",
    campos: [
      { prop: "name",           label: "Nome da receita",            obrigatorio: true  },
      { prop: "image",          label: "Foto da receita",            obrigatorio: true  },
      { prop: "author",         label: "Autor (@type Person)",       obrigatorio: true  },
      { prop: "recipeIngredient", label: "Ingredientes",            obrigatorio: true  },
      { prop: "recipeInstructions", label: "Instruções (HowToStep)", obrigatorio: true },
      { prop: "cookTime",       label: "Tempo de preparo",           obrigatorio: false },
      { prop: "recipeYield",    label: "Porções",                    obrigatorio: false },
      { prop: "description",    label: "Descrição",                  obrigatorio: false },
    ],
  },
];

export function requisitosPorTipo(tipo: Post["schemaTipo"]): RequisitoCampo[] {
  return REQUISITOS_SCHEMA.find((r) => r.tipo === tipo)?.campos ?? [];
}

export function validarSchema(
  tipo: Post["schemaTipo"],
  graph: Record<string, unknown>,
): { ok: boolean; faltando: string[] } {
  const campos = requisitosPorTipo(tipo);
  const faltando = campos
    .filter((c) => c.obrigatorio && !graph[c.prop])
    .map((c) => c.label);
  return { ok: faltando.length === 0, faltando };
}
