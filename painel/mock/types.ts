import type { JsonldBloco } from "@/lib/html-pagina";

export type StatusPost = "publicado" | "rascunho" | "revisao" | "agendado" | "lixeira";

export type TipoPagina = "home" | "money" | "pilar" | "supporting" | "institucional";
export type Intencao = "T" | "C" | "I" | "N";

export interface Autor {
  id: string;
  nome: string;
  slug: string;
  foto: string;
  cargo: string;
  bioCurta: string;
  bioLonga: string;
  conselho: string;
  registro: string;
  especialidades: string[];
  formacao: string[];
  emailPublico: string;
  redes: {
    instagram: string;
    linkedin: string;
    facebook: string;
    x?: string;
    youtube?: string;
    tiktok?: string;
    site?: string;
    lattes?: string;
  };
  urlExterna: string;
  fotoAlt?: string;
  ativo?: boolean;
  destaque?: boolean;
  usuarioId?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  seoTitle: string;
  metaDescription: string;
  imagem: string;
  paiId: string | null;
  ordem: number;
  cluster: string;
  intencao: Intencao | "";
  origemLinkFlow?: boolean;
}

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface Fonte {
  id: string;
  titulo: string;
  url: string;
}

export interface Post {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  corpo: string;
  autorId: string;
  categoriaId: string;
  data: string;
  /** Data (AAAA-MM-DD) da última gravação no arquivo — ver Relatório de Testes 4, erro 37. */
  atualizadoEm?: string;
  status: StatusPost;
  destaque: boolean;
  seoTitle: string;
  metaDescription: string;
  canonical: string;
  noindex: boolean;
  ogImagem: string;
  schemaTipo: "Article" | "FAQPage" | "HowTo" | "Recipe";
  faq: FaqItem[];
  capa: string;
  capaAlt: string;
  fontes: Fonte[];
  palavras: number;
  kwPrimaria?: string;
  /** Palavras-chave secundárias (uso interno; não aparecem no site). */
  kwSecundarias?: string[];
  /** Slugs de posts escolhidos à mão para "Posts relacionados" (até 3). Vazio = automático por categoria. */
  relacionados?: string[];
  /** Slug da página de serviço/pilar que o artigo apoia (link interno no fim do artigo). Vazio = nenhuma. */
  pilar?: string;
  /** Nome do autor resolvido pelo servidor (vazio = não reconhecido). */
  autorNome?: string;
  /** false = o `autor` gravado no arquivo não é um autor conhecido (valor antigo/inválido). */
  autorReconhecido?: boolean;
  /** Marcador real no frontmatter (geradoPorIA: true): so ele liga o selo IA na lista. */
  geradoPorIA?: boolean;
  /**
   * JSON-LD REAL do HTML publicado deste artigo (lib/html-pagina.ts via
   * /api/posts). null = o artigo ainda não tem HTML publicado (rascunho) ou
   * o site ainda não foi gerado — não é erro, é ausência de origem.
   */
  real?: { origem: "publicado" | "previa"; jsonldBlocosDetalhe: JsonldBloco[] } | null;
}

export type CampoSecao =
  | { chave: string; label: string; tipo: "texto" | "url" | "textarea" | "icone" | "imagem" }
  | { chave: string; label: string; tipo: "lista"; itemCampos: CampoSecao[] };

export interface SecaoItem {
  id: string;
  [chave: string]: string;
}

export interface Secao {
  id: string;
  nome: string;
  tipo: string;
  campos: Record<string, string>;
  itens?: SecaoItem[];
}

/**
 * O que o HTML PUBLICADO da página realmente diz (lib/html-pagina.ts, lido por
 * /api/paginas). Só existe em páginas vindas da API; nada aqui é inferido.
 */
export interface DadosPaginaReal {
  /** de onde o HTML foi lido: site publicado ou última prévia local (dist) */
  origem: "publicado" | "previa";
  /** metas robots/googlebot como estão no HTML; vazio = página sem meta robots */
  robotsMeta: string[];
  noindex: boolean;
  nofollow: boolean;
  canonical: string | null;
  /** tipos do JSON-LD (achatados, inclusive @graph); vazio = sem dados estruturados */
  schemaTipos: string[];
  jsonldBlocos: number;
  jsonldInvalidos: number;
  /**
   * Cada bloco <script type="application/ld+json"> como o site REALMENTE
   * emite (não é o "previsto" pelo painel): objeto completo (`dado`, com
   * @graph intacto) quando válido, texto cru + motivo do erro quando não.
   */
  jsonldBlocosDetalhe: JsonldBloco[];
  og: { title: string | null; description: string | null; image: string | null; type: string | null };
  palavras: number;
  imagens: { total: number; semAlt: number };
  linksEnviados: number;
  /** rastreadores que o HTML carrega de fato (Google Analytics, GTM, Meta Pixel) */
  rastreadores: string[];
  /**
   * Só para Money Page (coleção `servicos`): o arquivo de conteúdo pede noindex
   * (rascunho até a Fase 3)? null = a página não tem arquivo em content/.
   */
  noindexNoConteudo: boolean | null;
  /** HTML maior que o limite de leitura: title/meta/palavras podem estar incompletos */
  parcial?: boolean;
  /** o arquivo não pôde ser lido: os campos vêm vazios, e a tela diz isso */
  erroLeitura?: string;
}

export interface Pagina {
  id: string;
  titulo: string;
  url: string;
  paiId: string | null;
  tipo: TipoPagina;
  /** só existe se vier de fonte real (o HTML não traz); a API de páginas não preenche */
  intencao?: Intencao;
  status: "publicado" | "rascunho";
  h1: string;
  seoTitle: string;
  metaDescription: string;
  schema: string;
  composicao: string;
  secoes: Secao[];
  cluster?: string;
  nivel: number;
  linksRecebidos: number;
  node_id?: string;
  links_internos_obrigatorios?: string[]; // node_ids que esta página é responsável por linkar
  ultimaMod?: string; // ISO date (YYYY-MM-DD) da última atualização real — usado pelo sitemap
  /** dados lidos do HTML publicado (ausente em páginas de demonstração/mock) */
  real?: DadosPaginaReal;
}

export interface Midia {
  id: string;
  arquivo: string;
  url: string;
  alt: string;
  titulo: string;
  legenda: string;
  credito: string;
  largura: number;
  altura: number;
  bytes: number;
  formato: string;
  pasta: string;
  tags: string[];
  usadaEm: string[];
  gradiente: string;
  /** Data real do envio (ISO), do sidecar ou do mtime do arquivo. */
  criadoEm?: string;
  /** Quem enviou; nome "—" quando o arquivo é antigo e não tem registro. */
  enviadoPor?: { id: string; nome: string };
}

export interface Redirect {
  id: string;
  origem: string;
  destino: string;
  codigo: 301 | 302 | 410;
  criadoPor: "manual" | "slug-alterado";
  hits: number;
  data: string;
}

export interface ItemSaude {
  id: string;
  label: string;
  valor: string;
  estado: "ok" | "aviso";
  detalhe: string;
}

export interface UrlSitemap {
  loc: string;
  ultimaMod: string;
  status: "indexada" | "descoberta" | "excluida";
  prioridade: string;
}

export interface Verificacao {
  id: string;
  servico: string;
  identificador: string;
  conectado: boolean;
}

export type TipoCampo =
  | "nome" | "email" | "telefone" | "assunto" | "mensagem"
  | "data" | "selecao" | "checkbox" | "anexo";

export interface CampoFormulario {
  id: string;
  tipo: TipoCampo;
  rotulo: string;
  obrigatorio: boolean;
  ajuda: string;
  opcoes?: string[];
}

export interface Formulario {
  /** Identificador estável = `formularioId` que o site envia em /api/submissao. */
  id: string;
  nome: string;
  campos: CampoFormulario[];
  msgSucesso: string;
  msgErro: string;
  /** Se true, o envio exige `lgpdAceite: true` (o site precisa exibir a caixa). */
  exigeLgpd: boolean;
  lgpdTexto: string;
  lgpdPoliticaUrl: string;
  usadoEm: string[];
  /** Calculado a partir dos leads reais (últimos 30 dias). */
  envios30d: number;
  ativo: boolean;
}

export type StatusLead = "novo" | "em_contato" | "convertido" | "descartado";

export interface Lead {
  id: string;
  formularioId: string;
  formularioNome: string;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  paginaOrigem: string;
  data: string;
  status: StatusLead;
  utm: {
    source: string;
    medium: string;
    campaign: string;
    term: string;
    content: string;
  };
  lgpdAceite: boolean;
  lgpdData: string;
  camposExtras: Record<string, string>;
}

export interface ItemMenu {
  id: string;
  label: string;
  url: string;
  filhos?: ItemMenu[];
}

export interface Menu {
  id: string;
  nome: string;
  local: string;
  itens: ItemMenu[];
}

export interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  conectado: boolean;
  conta: string;
}

export type PapelUsuario = "administrador" | "editor" | "autor";

export interface UsuarioAcesso {
  emailLogin: string;
  papel: PapelUsuario;
  ativo: boolean;
}

export interface UsuarioAutoria {
  nomePublico: string;
  slug: string;
  foto: string;
  fotoAlt?: string;
  cargo: string;
  bioCurta: string;
  bioLonga: string;
  conselho: string;
  registro: string;
  especialidades: string[];
  formacao: string[];
  emailPublico: string;
  redes: {
    instagram: string;
    linkedin: string;
    facebook: string;
    x?: string;
    youtube?: string;
    tiktok?: string;
    site?: string;
    lattes?: string;
  };
  urlExterna: string;
  destaque?: boolean;
}

export interface Usuario {
  id: string;
  podeAcessar: boolean;
  acesso?: UsuarioAcesso;
  podeAssinar: boolean;
  autoria?: UsuarioAutoria;
}

// ── Tarefas (antes em mock/tarefas.ts, junto com dados de demonstração) ──
export type StatusTarefa = "nao-iniciado" | "em-andamento" | "bloqueado" | "concluido";
export type PrioridadeTarefa = "alta" | "media" | "baixa";

export interface Tarefa {
  id: string;
  titulo: string;
  projeto: string;
  descricao: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  responsavelId: string;
  prazo: string;
  origem: "linkflow" | "manual";
  checklist: { id: string; label: string; feito: boolean }[];
}
