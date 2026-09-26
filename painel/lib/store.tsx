"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Tarefa } from "@/mock/types";
import type {
  Autor,
  Categoria,
  Deploy,
  Formulario,
  Lead,
  Menu,
  Midia,
  Pagina,
  Post,
  Redirect,
  Usuario,
} from "@/mock/types";
import { lerStatusPost } from "@/lib/status-post";
import { tituloValido } from "@/lib/posts-regras";

/* ------------------------------------------------------------------ *
 * Dados reais: carregados da API /api/posts e /api/config no boot.   *
 * Se a API falhar, a lista fica vazia — nunca dados de demonstração.  *
 * ------------------------------------------------------------------ */

const txt = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

/** Um post como a API devolve → o Post do painel. Tudo que é texto vira texto (o parser do arquivo lê "2026" como número). */
function postDaApi(p: Record<string, unknown>): Post {
  const slug = txt(p.slug ?? p.id);
  return {
    id: slug,
    slug,
    titulo: txt(p.titulo),
    resumo: txt(p.resumo ?? p.descricao),
    corpo: txt(p.corpo),
    autorId: txt(p.autorId ?? p.autor),
    categoriaId: txt(p.categoriaId ?? p.categoria),
    data: txt(p.data ?? p.publicadoEm).slice(0, 10),
    status: lerStatusPost(p.status),
    destaque: p.destaque === true,
    seoTitle: txt(p.seoTitle ?? p.titulo),
    metaDescription: txt(p.metaDescription ?? p.descricao),
    canonical: txt(p.canonical),
    noindex: p.noindex === true,
    ogImagem: txt(p.ogImagem ?? p.imagemHero),
    schemaTipo: (txt(p.schemaTipo) || "Article") as Post["schemaTipo"],
    capa: txt(p.capa),
    capaAlt: txt(p.capaAlt),
    kwPrimaria: txt(p.kwPrimaria ?? p.palavraChave),
    faq: [],
    fontes: [],
    palavras: Number(p.palavras ?? 0) || 0,
    geradoPorIA: p.geradoPorIA === true,
  };
}

/** Posts vivos (null = a API falhou; a tela mostra o erro, não uma lista vazia de mentira). */
async function carregarPostsReais(): Promise<Post[] | null> {
  try {
    const res = await fetch("/api/posts", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.posts)) return null;
    return data.posts.map((p: Record<string, unknown>) => postDaApi(p));
  } catch {
    return null;
  }
}

/** Posts na lixeira (só administrador/editor; para o autor devolve lista vazia). */
async function carregarLixeiraReal(): Promise<Post[]> {
  try {
    const res = await fetch("/api/posts/lixeira", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.posts)) return [];
    return data.posts.map((p: Record<string, unknown>) => ({ ...postDaApi(p), status: "lixeira" as const }));
  } catch {
    return [];
  }
}

/** Fila de salvamento de UM post: o que falta enviar + o envio em andamento. */
interface FilaPost {
  patch: Record<string, unknown>;
  timer?: ReturnType<typeof setTimeout>;
  emVoo: Promise<boolean> | null;
}

/** Espera entre a última tecla e o envio ao servidor. */
const ESPERA_SALVAR_MS = 900;

export type ResultadoPost = { ok: true; slug: string } | { ok: false; erro: string };

/** Post (campos do painel) → corpo do PATCH. Só o que o servidor grava no arquivo; o resto fica só na tela. */
const CAMPOS_GRAVADOS: Record<string, string> = {
  titulo: "titulo",
  slug: "slug",
  slugAuto: "slugAuto",
  corpo: "corpo",
  metaDescription: "metaDescription",
  status: "status",
  data: "data",
  autorId: "autorId",
  categoriaId: "categoriaId",
  kwPrimaria: "kwPrimaria",
  destaque: "destaque",
};

export interface EstadoSalvamento {
  estado: "ocioso" | "salvando" | "salvo" | "erro";
  /** Mensagem do servidor (ou de rede) quando estado === "erro". */
  erro?: string;
  /** Quando o último salvamento terminou com sucesso. */
  quando?: number;
}

async function carregarLista<T>(url: string, chave: string): Promise<T[] | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data[chave])) return null;
    return data[chave] as T[];
  } catch {
    return null;
  }
}

async function carregarAutoresReais(): Promise<Autor[] | null> {
  try {
    const res = await fetch("/api/autores", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.autores)) return null;
    return data.autores as Autor[];
  } catch {
    return null;
  }
}

async function carregarCategoriasReais(): Promise<Categoria[] | null> {
  try {
    const res = await fetch("/api/categorias", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.categorias)) return null;
    return data.categorias as Categoria[];
  } catch {
    return null;
  }
}

export const CHAVES_TOKENS = [
  "primary",
  "primary-ink",
  "secondary",
  "accent",
  "ink",
  "ink-muted",
  "surface",
  "surface-2",
  "line",
  "success",
  "danger",
] as const;

export type ChaveToken = (typeof CHAVES_TOKENS)[number];
export type Tokens = Record<ChaveToken, string>;

export const TOKENS_ESCURO: Tokens = {
  primary: "#4c8dff",
  "primary-ink": "#06122b",
  secondary: "#1a2436",
  accent: "#f5a524",
  ink: "#e6ecf7",
  "ink-muted": "#8a99b5",
  surface: "#0b1220",
  "surface-2": "#131c2e",
  line: "#22304a",
  success: "#34d399",
  danger: "#f2556c",
};

export const TOKENS_CLARO: Tokens = {
  primary: "#0b5cff",
  "primary-ink": "#ffffff",
  secondary: "#eef2f9",
  accent: "#f5a524",
  ink: "#1b2a4a",
  "ink-muted": "#667694",
  surface: "#f5f7fb",
  "surface-2": "#ffffff",
  line: "#e3e8f0",
  success: "#10b981",
  danger: "#ef3e5c",
};

export const FONTES_DISPLAY = [
  { id: "fraunces", nome: "Fraunces", stack: "'Fraunces', serif", npm: "@fontsource/fraunces" },
  { id: "playfair-display", nome: "Playfair Display", stack: "'Playfair Display', serif", npm: "@fontsource/playfair-display" },
  { id: "lora", nome: "Lora", stack: "'Lora', serif", npm: "@fontsource/lora" },
  { id: "instrument-serif", nome: "Instrument Serif", stack: "'Instrument Serif', serif", npm: "@fontsource/instrument-serif" },
  { id: "bricolage-grotesque", nome: "Bricolage Grotesque", stack: "'Bricolage Grotesque', sans-serif", npm: "@fontsource-variable/bricolage-grotesque" },
  { id: "sora", nome: "Sora", stack: "'Sora', sans-serif", npm: "@fontsource/sora" },
  { id: "outfit", nome: "Outfit", stack: "'Outfit', sans-serif", npm: "@fontsource/outfit" },
  { id: "space-grotesk", nome: "Space Grotesk", stack: "'Space Grotesk', sans-serif", npm: "@fontsource-variable/space-grotesk" },
];

export const FONTES_CORPO = [
  { id: "inter", nome: "Inter", stack: "'Inter', sans-serif", npm: "@fontsource-variable/inter" },
  { id: "manrope", nome: "Manrope", stack: "'Manrope', sans-serif", npm: "@fontsource-variable/manrope" },
  { id: "figtree", nome: "Figtree", stack: "'Figtree', sans-serif", npm: "@fontsource-variable/figtree" },
  { id: "public-sans", nome: "Public Sans", stack: "'Public Sans', sans-serif", npm: "@fontsource/public-sans" },
  { id: "source-sans-3", nome: "Source Sans 3", stack: "'Source Sans 3', sans-serif", npm: "@fontsource-variable/source-sans-3" },
  { id: "karla", nome: "Karla", stack: "'Karla', sans-serif", npm: "@fontsource-variable/karla" },
  { id: "nunito-sans", nome: "Nunito Sans", stack: "'Nunito Sans', sans-serif", npm: "@fontsource-variable/nunito-sans" },
];

export const PARES_FONTE = [
  { id: "fraunces-inter",       display: "fraunces",            corpo: "inter",          nome: "Fraunces + Inter" },
  { id: "instrument-figtree",   display: "instrument-serif",    corpo: "figtree",        nome: "Instrument Serif + Figtree" },
  { id: "playfair-karla",       display: "playfair-display",    corpo: "karla",          nome: "Playfair Display + Karla" },
  { id: "sora-public",          display: "sora",                corpo: "public-sans",    nome: "Sora + Public Sans" },
  { id: "bricolage-manrope",    display: "bricolage-grotesque", corpo: "manrope",        nome: "Bricolage Grotesque + Manrope" },
  { id: "lora-source",          display: "lora",                corpo: "source-sans-3",  nome: "Lora + Source Sans 3" },
];

export const RAIOS = [
  { id: "reto", nome: "Reto", valor: "2px" },
  { id: "suave", nome: "Suave", valor: "8px" },
  { id: "redondo", nome: "Redondo", valor: "16px" },
];

export const DENSIDADES = [
  { id: "compacto", nome: "Compacto", valor: "0.375rem" },
  { id: "confortavel", nome: "Confortável", valor: "0.625rem" },
];

export interface Aparencia {
  temaVisual: string;
  tokensEscuro: Tokens;
  tokensClaro: Tokens;
  fonteDisplay: string;
  fonteCorpo: string;
  raio: string;
  densidade: string;
  logo: string;
  logoAlt: string;
  logoEscura: string;
  logoEscuraAlt: string;
  favicon: string;
  nomeSite: string;
  tagline: string;
  descricaoSite: string;
}

const APARENCIA_INICIAL: Aparencia = {
  temaVisual: "",
  tokensEscuro: TOKENS_ESCURO,
  tokensClaro: TOKENS_CLARO,
  fonteDisplay: "fraunces",
  fonteCorpo: "inter",
  raio: "suave",
  densidade: "compacto",
  logo: "",
  logoAlt: "",
  logoEscura: "",
  logoEscuraAlt: "",
  favicon: "",
  nomeSite: "",
  tagline: "",
  descricaoSite: "",
};

const ROBOTS_INICIAL = `User-agent: *
Allow: /
Disallow: /painel/
Disallow: /*?s=

User-agent: GPTBot
Allow: /

Sitemap: https://seudominio.com.br/sitemap.xml`;

const LLMS_INICIAL = "";

interface Estado {
  usuario: { id: string; nome: string; email: string; iniciais: string };
  autenticado: boolean;
  entrar: (email: string) => void;
  sair: () => void;

  tema: "escuro" | "claro";
  alternarTema: () => void;

  aparencia: Aparencia;
  setAparencia: (patch: Partial<Aparencia>) => void;
  setToken: (chave: ChaveToken, valor: string) => void;
  tokensAtivos: Tokens;

  posts: Post[];
  autores: Autor[];
  categorias: Categoria[];
  paginas: Pagina[];
  midia: Midia[];
  redirects: Redirect[];
  deploys: Deploy[];
  tarefas: Tarefa[];
  atualizarTarefa: (id: string, patch: Partial<Tarefa>) => void;

  formularios: Formulario[];
  criarFormulario: (f: Formulario) => void;
  atualizarFormulario: (id: string, patch: Partial<Formulario>) => void;
  leads: Lead[];
  atualizarLead: (id: string, patch: Partial<Lead>) => void;
  menus: Menu[];
  atualizarMenu: (id: string, patch: Partial<Menu>) => void;

  robots: string;
  setRobots: (v: string) => void;
  llms: string;
  setLlms: (v: string) => void;

  cookieConfig: CookieConfig;
  setCookieConfig: (patch: Partial<Omit<CookieConfig, "categorias">> & { categorias?: Partial<CookieConfig["categorias"]> }) => void;
  politicaPublicada: boolean;
  setPoliticaPublicada: (v: boolean) => void;

  privacidadeConfig: PrivacidadeConfig;
  setPrivacidadeConfig: (patch: Partial<PrivacidadeConfig>) => void;

  termosConfig: TermosConfig;
  setTermosConfig: (patch: Partial<TermosConfig>) => void;

  configIdentidade: ConfigIdentidade;
  setConfigIdentidade: (patch: Partial<ConfigIdentidade>) => void;

  configContato: ConfigContato;
  setConfigContato: (patch: Partial<ConfigContato>) => void;

  configRedes: ConfigRedes;
  setConfigRedes: (patch: Partial<ConfigRedes>) => void;

  /** Posts vivos (a lixeira fica em `postsLixeira`, fora do site). */
  postsLixeira: Post[];
  postsCarregados: boolean;
  /** Mensagem quando a lista de posts não pôde ser lida do servidor. */
  erroPosts: string;
  salvamento: EstadoSalvamento;
  /** Edita na tela na hora e grava no servidor (com espera); o estado aparece em `salvamento`. */
  atualizarPost: (id: string, patch: Partial<Post> & { slugAuto?: boolean }) => void;
  /** Grava AGORA o que estiver pendente do post. true = servidor confirmou. */
  salvarPost: (id: string) => Promise<boolean>;
  /** Id atual de um post (o arquivo muda de nome quando o slug muda). */
  resolverIdPost: (id: string) => string;
  /** Cria um post no servidor (título provisório, rascunho). Devolve o slug ou a mensagem de erro. */
  criarPost: () => Promise<ResultadoPost>;
  duplicarPost: (id: string) => Promise<ResultadoPost>;
  /** Move para a lixeira (some do site). Devolve os ids que realmente foram movidos. */
  moverParaLixeira: (ids: string[]) => Promise<string[]>;
  restaurarPost: (chave: string) => Promise<ResultadoPost>;
  excluirDefinitivo: (chave: string) => Promise<boolean>;
  esvaziarLixeira: () => Promise<boolean>;
  recarregarPosts: () => Promise<void>;
  criarAutor: (autor: Autor) => void;
  atualizarAutor: (id: string, patch: Partial<Autor>) => void;
  usuarios: Usuario[];
  criarUsuario: (u: Usuario) => void;
  atualizarUsuario: (id: string, patch: Partial<Usuario>) => void;
  criarCategoria: (cat: Categoria) => void;
  deletarCategoria: (id: string) => void;
  atualizarCategoria: (id: string, patch: Partial<Categoria>) => void;
  atualizarPagina: (id: string, patch: Partial<Pagina>) => void;
  atualizarMidia: (id: string, patch: Partial<Midia>) => void;
  /** Relê a biblioteca real (após um envio). Devolve a lista nova, ou null se a API falhou. */
  recarregarMidia: () => Promise<Midia[] | null>;
  adicionarRedirect: (r: Redirect) => void;
  deletarRedirect: (id: string) => void;
  publicarAlteracoes: () => void;
  pendentes: number;
  reverterDeploy: (id: string) => void;
}

export interface TermosConfig {
  ativo: boolean;
  naoSubstitui: string;
  foroCidade: string;
  foroUf: string;
  versao: string;
  dataVersao: string;
  avisoDadosSensiveis: boolean;
}

const TERMOS_CONFIG_INICIAL: TermosConfig = {
  ativo: false,
  naoSubstitui: "",
  foroCidade: "",
  foroUf: "",
  versao: "1.0",
  dataVersao: "",
  avisoDadosSensiveis: false,
};

export type BaseLegal =
  | "consentimento"
  | "execucao-contrato"
  | "legitimo-interesse"
  | "obrigacao-legal";

export interface PrivacidadeConfig {
  cnpj: string;
  endereco: string;
  emailContato: string;
  dpNome: string;
  dpEmail: string;
  retencaoFormularios: string;
  retencaoAnaliticos: string;
  retencaoMarketing: string;
  baseLegalFormularios: BaseLegal;
  baseLegalAnaliticos: BaseLegal;
  baseLegalMarketing: BaseLegal;
  transferenciaInternacional: boolean;
  paisesTransferencia: string;
  versao: string;
  dataVersao: string;
}

const PRIVACIDADE_CONFIG_INICIAL: PrivacidadeConfig = {
  cnpj: "",
  endereco: "",
  emailContato: "",
  dpNome: "",
  dpEmail: "",
  retencaoFormularios: "5 anos",
  retencaoAnaliticos: "14 meses",
  retencaoMarketing: "90 dias",
  baseLegalFormularios: "consentimento",
  baseLegalAnaliticos: "legitimo-interesse",
  baseLegalMarketing: "consentimento",
  transferenciaInternacional: false,
  paisesTransferencia: "",
  versao: "1.0",
  dataVersao: "",
};

export interface ConfigRedes {
  instagram: string;
  facebook: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  twitter: string;
  pinterest: string;
  threads: string;
}

const CONFIG_REDES_INICIAL: ConfigRedes = {
  instagram: "",
  facebook: "",
  linkedin: "",
  youtube: "",
  tiktok: "",
  twitter: "",
  pinterest: "",
  threads: "",
};

export interface HorarioFuncionamento {
  id: string;
  dias: string;
  abertura: string;
  fechamento: string;
  fechado: boolean;
}

export interface ConfigContato {
  telefone: string;
  telefone2: string;
  whatsapp: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  horarios: HorarioFuncionamento[];
  areaAtendimento: string;
  atendimentoOnline: boolean;
}

// Vazio de propósito: o contato real vem do config/site.ts (/api/config).
// Valores de exemplo aqui apareciam na tela — e podiam ser salvos no site
// do cliente — enquanto a API carregava ou se ela falhasse.
const CONFIG_CONTATO_INICIAL: ConfigContato = {
  telefone: "",
  telefone2: "",
  whatsapp: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  horarios: [],
  areaAtendimento: "",
  atendimentoOnline: false,
};

export interface ConfigIdentidade {
  tipoNegocio: string;
  razaoSocial: string;
  conselho: string;
  registroProfissional: string;
  responsavelTecnico: string;
  fundadoEm: string;
  medicalSpecialty: string;
  availableService: string;
  priceRange: string;
  ogImagemPadrao: string;
  ogImagemPadraoAlt: string;
}

// Vazio de propósito (ver CONFIG_CONTATO_INICIAL). Antes vinha preenchido
// com dados de uma clínica de psicologia de demonstração.
const CONFIG_IDENTIDADE_INICIAL: ConfigIdentidade = {
  tipoNegocio: "LocalBusiness",
  razaoSocial: "",
  conselho: "",
  registroProfissional: "",
  responsavelTecnico: "",
  fundadoEm: "",
  medicalSpecialty: "",
  availableService: "",
  priceRange: "",
  ogImagemPadrao: "",
  ogImagemPadraoAlt: "",
};

export interface CookieConfig {
  bannerTitulo: string;
  bannerDescricao: string;
  modalDescricao: string;
  posicaoH: "left" | "center" | "right";
  posicaoV: "bottom" | "middle" | "top";
  registroConsentimento: boolean;
  categorias: {
    analiticos: string;
    marketing: string;
    funcionais: string;
  };
}

const COOKIE_CONFIG_INICIAL: CookieConfig = {
  bannerTitulo: "Este site usa cookies",
  bannerDescricao: "",
  modalDescricao:
    "Escolha quais categorias de cookies deseja permitir. Cookies estritamente necessários não podem ser desativados.",
  posicaoH: "center",
  posicaoV: "bottom",
  registroConsentimento: true,
  categorias: {
    analiticos:
      "Google Analytics 4 — mede visitas, origem do tráfego e comportamento de navegação. Dados anonimizados.",
    marketing:
      "Meta Pixel e Google Ads — usados para exibir anúncios relevantes em outras plataformas.",
    funcionais:
      "Incorporações de mapa e vídeo que precisam de cookies para funcionar.",
  },
};

const Ctx = createContext<Estado | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(true);
  const [tema, setTema] = useState<"escuro" | "claro">("claro");
  const [aparencia, setAparenciaState] = useState<Aparencia>(APARENCIA_INICIAL);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLixeira, setPostsLixeira] = useState<Post[]>([]);
  const [postsCarregados, setPostsCarregados] = useState(false);
  const [erroPosts, setErroPosts] = useState("");
  const [salvamento, setSalvamento] = useState<EstadoSalvamento>({ estado: "ocioso" });
  const [postsAlterados, setPostsAlterados] = useState<string[]>([]);
  const renomeados = useRef<Record<string, string>>({});
  const filas = useRef(new Map<string, FilaPost>());
  const confirmados = useRef(new Map<string, { status: Post["status"] }>());
  const [dadosReaisCarregados, setDadosReaisCarregados] = useState(false);
  const [autores, setAutores] = useState<Autor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [midiaLista, setMidia] = useState<Midia[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [deploys, setDeploys] = useState<Deploy[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [formulariosList, setFormularios] = useState<Formulario[]>([]);
  const [leadsList, setLeads] = useState<Lead[]>([]);
  const [menusList, setMenus] = useState<Menu[]>([]);
  const [robots, setRobots] = useState(ROBOTS_INICIAL);
  const [llms, setLlms] = useState(LLMS_INICIAL);
  const [usuariosList, setUsuarios] = useState<Usuario[]>([]);
  const [cookieConfig, setCookieConfigState] = useState<CookieConfig>(COOKIE_CONFIG_INICIAL);
  const [politicaPublicada, setPoliticaPublicada] = useState(false);
  const [privacidadeConfig, setPrivacidadeConfigState] = useState<PrivacidadeConfig>(PRIVACIDADE_CONFIG_INICIAL);
  const [termosConfig, setTermosConfigState] = useState<TermosConfig>(TERMOS_CONFIG_INICIAL);
  const [configIdentidade, setConfigIdentidadeState] = useState<ConfigIdentidade>(CONFIG_IDENTIDADE_INICIAL);
  const [configContato, setConfigContatoState] = useState<ConfigContato>(CONFIG_CONTATO_INICIAL);
  const [configRedes, setConfigRedesState] = useState<ConfigRedes>(CONFIG_REDES_INICIAL);
  const [pendentes, setPendentes] = useState(0);

  const tokensAtivos = tema === "escuro" ? aparencia.tokensEscuro : aparencia.tokensClaro;

  // Carregar dados reais da API no boot
  useEffect(() => {
    if (dadosReaisCarregados) return;

    // Carregar posts reais
    carregarPostsReais().then(async (postsReais) => {
      if (postsReais !== null) {
        setPosts(postsReais);
        postsReais.forEach((p) => confirmados.current.set(p.id, { status: p.status }));
        setErroPosts("");
        const lixeira = await carregarLixeiraReal();
        const legados = new Set(postsReais.filter((p) => p.status === "lixeira").map((p) => p.id));
        setPostsLixeira(lixeira.filter((p) => !legados.has(p.slug)));
      } else {
        setErroPosts("Não consegui ler os posts do servidor. Recarregue a página; se persistir, avise o suporte.");
      }
      setPostsCarregados(true);
      setDadosReaisCarregados(true);
    });

    // Carregar autores reais (derivados de usuarios.json)
    carregarAutoresReais().then((autoresReais) => {
      if (autoresReais !== null) setAutores(autoresReais);
    });

    // Carregar categorias reais
    carregarCategoriasReais().then((categoriasReais) => {
      if (categoriasReais !== null) setCategorias(categoriasReais);
    });

    // Demais listas: SEMPRE da API, nunca de dados de demonstração. Se a API
    // falhar, a lista fica vazia (a tela mostra estado vazio) — nunca um
    // site fictício no lugar do site do cliente.
    carregarLista<Pagina>("/api/paginas", "paginas").then((l) => l && setPaginas(l));
    carregarLista<Midia>("/api/midia", "midia").then((l) => l && setMidia(l));
    carregarLista<Redirect>("/api/redirects", "redirects").then((l) => l && setRedirects(l));
    carregarLista<Tarefa>("/api/tarefas", "tarefas").then((l) => l && setTarefas(l));
    carregarLista<Formulario>("/api/formularios", "formularios").then((l) => l && setFormularios(l));
    carregarLista<Lead>("/api/leads", "leads").then((l) => l && setLeads(l));
    carregarLista<Usuario>("/api/usuarios", "usuarios").then((l) => l && setUsuarios(l));

    // Carregar config real do site para popular aparencia globalmente
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.config) return;
        const c = data.config;
        setAparenciaState((prev) => ({
          ...prev,
          nomeSite: c.nome || prev.nomeSite,
          tagline: c.slogan || c.tagline || prev.tagline,
        }));
      })
      .catch(console.error);
  }, [dadosReaisCarregados]);

  /* aplica tokens e forma no documento */
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.theme = tema === "claro" ? "light" : "dark";
    for (const chave of CHAVES_TOKENS) {
      raiz.style.setProperty(`--${chave}`, tokensAtivos[chave]);
    }
    raiz.style.setProperty(
      "--radius",
      RAIOS.find((r) => r.id === aparencia.raio)?.valor ?? "6px",
    );
    raiz.style.setProperty(
      "--density-y",
      DENSIDADES.find((d) => d.id === aparencia.densidade)?.valor ?? "0.5rem",
    );
    raiz.style.setProperty(
      "--font-display",
      FONTES_DISPLAY.find((f) => f.id === aparencia.fonteDisplay)?.stack ?? "sans-serif",
    );
    raiz.style.setProperty(
      "--font-body",
      FONTES_CORPO.find((f) => f.id === aparencia.fonteCorpo)?.stack ?? "sans-serif",
    );
  }, [tema, tokensAtivos, aparencia.raio, aparencia.densidade, aparencia.fonteDisplay, aparencia.fonteCorpo]);

  const marcarPendente = useCallback(() => setPendentes((n) => n + 1), []);

  const setAparencia = useCallback((patch: Partial<Aparencia>) => {
    setAparenciaState((a) => ({ ...a, ...patch }));
    setPendentes((n) => n + 1);
  }, []);

  const setToken = useCallback(
    (chave: ChaveToken, valor: string) => {
      setAparenciaState((a) =>
        tema === "escuro"
          ? { ...a, tokensEscuro: { ...a.tokensEscuro, [chave]: valor } }
          : { ...a, tokensClaro: { ...a.tokensClaro, [chave]: valor } },
      );
    },
    [tema],
  );

  /* ---------------------------------------------------------------- *
   * Posts: salvamento assíncrono. A tela muda na hora; o servidor       *
   * recebe depois de uma pausa; "Salvo" só aparece quando ele responde   *
   * ok; erro fica visível (nunca engolido).                              *
   * ---------------------------------------------------------------- */

  const resolverIdPost = useCallback((id: string) => {
    let atual = id;
    for (let i = 0; i < 20 && renomeados.current[atual]; i++) atual = renomeados.current[atual];
    return atual;
  }, []);

  const marcarPostAlterado = useCallback((id: string) => {
    setPostsAlterados((l) => (l.includes(id) ? l : [...l, id]));
  }, []);

  const enviarPost = useCallback(async (idEntrada: string): Promise<boolean> => {
    const id = resolverIdPost(idEntrada);
    const fila = filas.current.get(id);
    if (!fila) return true;
    if (fila.timer) {
      clearTimeout(fila.timer);
      fila.timer = undefined;
    }
    if (fila.emVoo) {
      await fila.emVoo; // um envio por vez: o próximo parte do estado que o servidor já confirmou
      return enviarPost(id);
    }
    if (Object.keys(fila.patch).length === 0) return true;

    const patch = fila.patch;
    fila.patch = {};
    const envio: Record<string, unknown> = { ...patch };
    let tituloRuim = false;
    if (envio.titulo !== undefined) {
      if (tituloValido(envio.titulo)) envio.titulo = String(envio.titulo).trim();
      else {
        tituloRuim = true; // 3 a 70 caracteres: não manda, a tela mantém o que foi digitado
        delete envio.titulo;
        if (envio.slugAuto === true) delete envio.slug;
        delete envio.slugAuto;
      }
    }
    if (Object.keys(envio).length === 0) {
      setSalvamento({ estado: "erro", erro: "O título precisa ter de 3 a 70 caracteres para ser salvo." });
      return false;
    }

    setSalvamento({ estado: "salvando" });
    fila.emVoo = (async () => {
      try {
        const res = await fetch(`/api/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(envio),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw Object.assign(new Error(data.erro ?? `O servidor respondeu ${res.status}.`), { status: res.status });
        }
        if (typeof envio.status === "string") {
          confirmados.current.set(id, { status: lerStatusPost(envio.status) });
        }
        const novoId = typeof data.slug === "string" && data.slug ? data.slug : id;
        if (novoId !== id) {
          // O arquivo mudou de nome (slug novo): a fila, o id e o link do editor passam para o novo nome.
          filas.current.delete(id);
          filas.current.set(novoId, fila);
          renomeados.current[id] = novoId;
          const conf = confirmados.current.get(id);
          if (conf) {
            confirmados.current.delete(id);
            confirmados.current.set(novoId, conf);
          }
          const slugPendente = fila.patch.slug !== undefined;
          setPosts((l) =>
            l.map((p) => (p.id === id ? { ...p, id: novoId, slug: slugPendente ? p.slug : novoId } : p)),
          );
          setPostsAlterados((l) => l.map((x) => (x === id ? novoId : x)));
        } else if (envio.slug !== undefined && fila.patch.slug === undefined) {
          setPosts((l) => l.map((p) => (p.id === id ? { ...p, slug: id } : p)));
        }
        return true;
      } catch (err) {
        const status = (err as { status?: number }).status ?? 0;
        const mensagem = err instanceof Error && status ? err.message : "Sem conexão com o servidor. Suas alterações continuam na tela; tente salvar de novo.";
        if (status >= 400 && status < 500 && status !== 401) {
          // Recusa por regra (slug ocupado, meta curta para publicar…): volta o que foi recusado
          // e segue com o resto, para uma recusa não travar o salvamento do texto.
          const restante = { ...patch };
          delete restante.slug;
          delete restante.slugAuto;
          delete restante.status;
          fila.patch = { ...restante, ...fila.patch };
          setPosts((l) =>
            l.map((p) => {
              if (p.id !== id) return p;
              const volta: Partial<Post> = {};
              if (patch.slug !== undefined && fila.patch.slug === undefined) volta.slug = id;
              if (patch.status !== undefined) volta.status = confirmados.current.get(id)?.status ?? p.status;
              return { ...p, ...volta };
            }),
          );
        } else {
          fila.patch = { ...patch, ...fila.patch };
        }
        setSalvamento({ estado: "erro", erro: mensagem });
        return false;
      }
    })();
    const ok = await fila.emVoo;
    fila.emVoo = null;
    if (!ok) return false;
    const idNovo = resolverIdPost(id);
    if (Object.keys(fila.patch).length > 0) return enviarPost(idNovo);
    if (tituloRuim) {
      setSalvamento({ estado: "erro", erro: "O título precisa ter de 3 a 70 caracteres; o resto foi salvo." });
      return false;
    }
    setSalvamento({ estado: "salvo", quando: Date.now() });
    return true;
  }, [resolverIdPost]);

  const atualizarPost = useCallback(
    (idEntrada: string, patch: Partial<Post> & { slugAuto?: boolean }) => {
      const id = resolverIdPost(idEntrada);
      const { slugAuto, ...local } = patch;
      setPosts((l) => l.map((p) => (p.id === id ? { ...p, ...local } : p)));
      const paraServidor: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(patch)) {
        if (CAMPOS_GRAVADOS[k] && v !== undefined) paraServidor[CAMPOS_GRAVADOS[k]] = v;
      }
      if (slugAuto !== undefined) paraServidor.slugAuto = slugAuto;
      if (paraServidor.corpo !== undefined) paraServidor.corpoFormato = "html"; // o editor do painel sempre grava HTML
      if (Object.keys(paraServidor).length === 0) return; // só campo que ainda não é gravado no arquivo
      marcarPostAlterado(id);
      const fila = filas.current.get(id) ?? { patch: {}, emVoo: null };
      filas.current.set(id, fila);
      fila.patch = { ...fila.patch, ...paraServidor };
      if (fila.timer) clearTimeout(fila.timer);
      fila.timer = setTimeout(() => { void enviarPost(id); }, ESPERA_SALVAR_MS);
      setSalvamento((s) => (s.estado === "salvando" ? s : { estado: "salvando" }));
    },
    [enviarPost, marcarPostAlterado, resolverIdPost],
  );

  const salvarPost = useCallback((id: string) => enviarPost(id), [enviarPost]);

  const recarregarPosts = useCallback(async () => {
    const vivos = await carregarPostsReais();
    if (vivos === null) return;
    setErroPosts("");
    setPostsCarregados(true);
    const ativos = new Set(
      [...filas.current.entries()].filter(([, f]) => f.emVoo || Object.keys(f.patch).length > 0).map(([k]) => k),
    );
    setPosts((antes) => vivos.map((p) => (ativos.has(p.id) ? (antes.find((x) => x.id === p.id) ?? p) : p)));
    vivos.forEach((p) => {
      if (!ativos.has(p.id)) confirmados.current.set(p.id, { status: p.status });
    });
    const lixeira = await carregarLixeiraReal();
    const legados = new Set(vivos.filter((p) => p.status === "lixeira").map((p) => p.id));
    setPostsLixeira(lixeira.filter((p) => !legados.has(p.slug)));
  }, []);

  const pedirAoServidor = useCallback(async (url: string, init?: RequestInit): Promise<{ ok: boolean; erro: string; dados: Record<string, unknown> }> => {
    try {
      const res = await fetch(url, init);
      const dados = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok || dados.ok !== true) {
        return { ok: false, erro: typeof dados.erro === "string" ? dados.erro : `O servidor respondeu ${res.status}.`, dados };
      }
      return { ok: true, erro: "", dados };
    } catch {
      return { ok: false, erro: "Sem conexão com o servidor.", dados: {} };
    }
  }, []);

  const criarPost = useCallback(async (): Promise<ResultadoPost> => {
    const r = await pedirAoServidor("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!r.ok || typeof r.dados.slug !== "string") return { ok: false, erro: r.erro || "Não foi possível criar o post." };
    await recarregarPosts();
    marcarPostAlterado(r.dados.slug);
    return { ok: true, slug: r.dados.slug };
  }, [marcarPostAlterado, pedirAoServidor, recarregarPosts]);

  const duplicarPost = useCallback(async (idEntrada: string): Promise<ResultadoPost> => {
    const id = resolverIdPost(idEntrada);
    await enviarPost(id); // duplica o que está na tela, não uma versão antiga do arquivo
    const r = await pedirAoServidor("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duplicarDe: id }),
    });
    if (!r.ok || typeof r.dados.slug !== "string") return { ok: false, erro: r.erro || "Não foi possível duplicar o post." };
    await recarregarPosts();
    marcarPostAlterado(r.dados.slug);
    return { ok: true, slug: r.dados.slug };
  }, [enviarPost, marcarPostAlterado, pedirAoServidor, recarregarPosts, resolverIdPost]);

  const moverParaLixeira = useCallback(async (ids: string[]): Promise<string[]> => {
    const movidos: string[] = [];
    for (const idEntrada of ids) {
      const fila = filas.current.get(resolverIdPost(idEntrada));
      if (fila) {
        if (fila.timer) clearTimeout(fila.timer);
        fila.patch = {}; // o post vai sair: o que faltava enviar não importa
        if (fila.emVoo) await fila.emVoo; // termina o envio em curso antes de mover (o nome pode mudar)
      }
      const id = resolverIdPost(idEntrada);
      const r = await pedirAoServidor(`/api/posts/${id}`, { method: "DELETE" });
      if (r.ok) {
        movidos.push(idEntrada);
        filas.current.delete(id);
        marcarPostAlterado(id);
      } else {
        setSalvamento({ estado: "erro", erro: r.erro });
      }
    }
    await recarregarPosts();
    return movidos;
  }, [marcarPostAlterado, pedirAoServidor, recarregarPosts, resolverIdPost]);

  const restaurarPost = useCallback(async (chave: string): Promise<ResultadoPost> => {
    const r = await pedirAoServidor("/api/posts/lixeira", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: chave }),
    });
    if (!r.ok || typeof r.dados.slug !== "string") return { ok: false, erro: r.erro || "Não foi possível restaurar o post." };
    await recarregarPosts();
    marcarPostAlterado(r.dados.slug);
    return { ok: true, slug: r.dados.slug };
  }, [marcarPostAlterado, pedirAoServidor, recarregarPosts]);

  const excluirDefinitivo = useCallback(async (chave: string): Promise<boolean> => {
    const r = await pedirAoServidor(`/api/posts/lixeira?slug=${encodeURIComponent(chave)}`, { method: "DELETE" });
    if (!r.ok) setSalvamento({ estado: "erro", erro: r.erro });
    await recarregarPosts();
    return r.ok;
  }, [pedirAoServidor, recarregarPosts]);

  const esvaziarLixeira = useCallback(async (): Promise<boolean> => {
    const r = await pedirAoServidor("/api/posts/lixeira?todos=1", { method: "DELETE" });
    if (!r.ok) setSalvamento({ estado: "erro", erro: r.erro });
    await recarregarPosts();
    return r.ok;
  }, [pedirAoServidor, recarregarPosts]);

  // Aba fechada ou escondida com alteração ainda não enviada: avisa / envia.
  useEffect(() => {
    const pendente = () =>
      [...filas.current.values()].some((f) => f.emVoo || Object.keys(f.patch).length > 0);
    const aoSair = (e: BeforeUnloadEvent) => {
      if (pendente()) e.preventDefault();
    };
    const aoEsconder = () => {
      if (document.visibilityState !== "hidden") return;
      for (const id of [...filas.current.keys()]) void enviarPost(id);
    };
    window.addEventListener("beforeunload", aoSair);
    document.addEventListener("visibilitychange", aoEsconder);
    return () => {
      window.removeEventListener("beforeunload", aoSair);
      document.removeEventListener("visibilitychange", aoEsconder);
    };
  }, [enviarPost]);

  const valor: Estado = useMemo(
    () => ({
      usuario: {
        id: "u1",
        nome: "",
        email: "",
        iniciais: "?",
      },
      autenticado,
      entrar: () => setAutenticado(true),
      sair: () => setAutenticado(false),

      tema,
      alternarTema: () => setTema((t) => (t === "escuro" ? "claro" : "escuro")),

      aparencia,
      setAparencia,
      setToken,
      tokensAtivos,

      posts,
      autores,
      categorias,
      paginas,
      midia: midiaLista,
      redirects,
      deploys,
      tarefas,
      atualizarTarefa: (id, patch) =>
        setTarefas((lista) => lista.map((t) => (t.id === id ? { ...t, ...patch } : t))),

      formularios: formulariosList,
      criarFormulario: (f) => setFormularios((lista) => [f, ...lista]),
      atualizarFormulario: (id, patch) =>
        setFormularios((lista) => lista.map((f) => f.id === id ? { ...f, ...patch } : f)),
      leads: leadsList,
      atualizarLead: (id, patch) =>
        setLeads((lista) => lista.map((l) => l.id === id ? { ...l, ...patch } : l)),
      menus: menusList,
      atualizarMenu: (id, patch) =>
        setMenus((lista) => lista.map((m) => m.id === id ? { ...m, ...patch } : m)),

      robots,
      setRobots,
      llms,
      setLlms,
      cookieConfig,
      setCookieConfig: (patch) => setCookieConfigState((c) => ({
        ...c,
        ...patch,
        categorias: { ...c.categorias, ...(patch.categorias ?? {}) },
      })),
      politicaPublicada,
      setPoliticaPublicada,

      privacidadeConfig,
      setPrivacidadeConfig: (patch) => setPrivacidadeConfigState((c) => ({ ...c, ...patch })),

      termosConfig,
      setTermosConfig: (patch) => setTermosConfigState((c) => ({ ...c, ...patch })),

      configIdentidade,
      setConfigIdentidade: (patch) => setConfigIdentidadeState((c) => ({ ...c, ...patch })),

      configContato,
      setConfigContato: (patch) => setConfigContatoState((c) => ({ ...c, ...patch })),

      configRedes,
      setConfigRedes: (patch) => setConfigRedesState((c) => ({ ...c, ...patch })),

      postsLixeira,
      postsCarregados,
      erroPosts,
      salvamento,
      atualizarPost,
      salvarPost,
      resolverIdPost,
      criarPost,
      duplicarPost,
      moverParaLixeira,
      restaurarPost,
      excluirDefinitivo,
      esvaziarLixeira,
      recarregarPosts,
      criarAutor: (autor) => {
        setAutores((lista) => [autor, ...lista]);
        marcarPendente();
      },
      atualizarAutor: (id, patch) => {
        setAutores((lista) => lista.map((a) => (a.id === id ? { ...a, ...patch } : a)));
        marcarPendente();
      },
      usuarios: usuariosList,
      criarUsuario: (u) => {
        setUsuarios((lista) => [u, ...lista]);
        marcarPendente();
      },
      atualizarUsuario: (id, patch) => {
        setUsuarios((lista) => lista.map((u) => (u.id === id ? { ...u, ...patch } : u)));
        marcarPendente();
      },
      criarCategoria: (cat) => {
        setCategorias((lista) => [...lista, cat]);
        marcarPendente();
      },
      deletarCategoria: (id) => {
        setCategorias((lista) => lista.filter((c) => c.id !== id));
        marcarPendente();
      },
      atualizarCategoria: (id, patch) => {
        setCategorias((lista) => lista.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        marcarPendente();
      },
      atualizarPagina: (id, patch) => {
        setPaginas((lista) => lista.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        marcarPendente();
      },
      recarregarMidia: async () => {
        const l = await carregarLista<Midia>("/api/midia", "midia");
        if (l) setMidia(l);
        return l;
      },
      atualizarMidia: (id, patch) => {
        setMidia((lista) => lista.map((m) => (m.id === id ? { ...m, ...patch } : m)));
        marcarPendente();
      },
      adicionarRedirect: (r) => {
        setRedirects((lista) => [r, ...lista]);
        marcarPendente();
      },
      deletarRedirect: (id) => {
        setRedirects((lista) => lista.filter((r) => r.id !== id));
        marcarPendente();
      },
      // Só zera o contador de pendências. O build de verdade é do botão Publicar
      // (Topo.tsx → POST /api/build) e este método só é chamado DEPOIS de o
      // build terminar com sucesso — não dispara build nem inventa deploy.
      publicarAlteracoes: () => {
        setPendentes(0);
        setPostsAlterados([]);
      },
      // Posts: um por post alterado (não uma por tecla). Demais telas seguem contando à parte.
      pendentes: pendentes + postsAlterados.length,
      reverterDeploy: (id) => {
        setDeploys((lista) => lista.map((d) => ({ ...d, atual: d.id === id })));
      },
    }),
    [
      autenticado,
      tema,
      aparencia,
      setAparencia,
      setToken,
      tokensAtivos,
      posts,
      autores,
      usuariosList,
      categorias,
      paginas,
      midiaLista,
      redirects,
      deploys,
      tarefas,
      robots,
      llms,
      pendentes,
      marcarPendente,
      privacidadeConfig,
      termosConfig,
      postsLixeira,
      postsCarregados,
      erroPosts,
      salvamento,
      postsAlterados,
      atualizarPost,
      salvarPost,
      resolverIdPost,
      criarPost,
      duplicarPost,
      moverParaLixeira,
      restaurarPost,
      excluirDefinitivo,
      esvaziarLixeira,
      recarregarPosts,
    ],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}

/** Simula a latência de carregamento das listas do painel. */
export function useCarregando(ms = 420) {
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setCarregando(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return carregando;
}
