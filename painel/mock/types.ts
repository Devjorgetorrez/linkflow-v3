export type StatusPost = "publicado" | "rascunho" | "revisao" | "agendado" | "lixeira";

export type TipoPagina = "money" | "pilar" | "supporting" | "institucional";
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

export interface Pagina {
  id: string;
  titulo: string;
  url: string;
  paiId: string | null;
  tipo: TipoPagina;
  intencao: Intencao;
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

export interface Deploy {
  id: string;
  commit: string;
  mensagem: string;
  autor: string;
  data: string;
  status: "sucesso" | "falhou" | "construindo";
  duracao: string;
  atual: boolean;
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
  id: string;
  nome: string;
  campos: CampoFormulario[];
  destinoEmail: { ativo: boolean; endereco: string; assunto: string };
  destinoWhatsApp: { ativo: boolean; numero: string };
  destinoWebhook: { ativo: boolean; url: string };
  msgSucesso: string;
  msgErro: string;
  paginaObrigado: string;
  honeypot: boolean;
  confirmarMarcacao: boolean;
  lgpdTexto: string;
  lgpdPoliticaUrl: string;
  usadoEm: string[];
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

export interface EventoHistorico {
  id: string;
  acao: string;
  alvo: string;
  autor: string;
  data: string;
  tipo: "criou" | "editou" | "publicou" | "deletou" | "ia";
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
