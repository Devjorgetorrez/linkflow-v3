"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Facebook,
  Globe,
  Instagram,
  KeyRound,
  Linkedin,
  Lock,
  Music2,
  PenLine,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Twitter,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { SeletorMidia } from "@/components/SeletorMidia";
import { Alternador, AreaTexto, Campo, Contador, Entrada, Rotulo } from "@/components/ui";
import { caminhoDaMidia, urlPreviaMidia } from "@/lib/site-config-cliente";
import { useStore } from "@/lib/store";
import { SENHA_MIN, ehUltimoAdminAtivo, emailValido, gerarSenhaSegura, validarNovoUsuario, type UsuarioMin } from "@/lib/usuarios-regras";
import type { PapelUsuario, Usuario } from "@/mock/types";
import { cn, slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

interface FormacaoItem {
  id: string;
  curso: string;
  instituicao: string;
  ano: string;
}

function parseFormacao(str: string): FormacaoItem {
  const SEP = " — ";
  const idx = str.indexOf(SEP);
  const curso = idx >= 0 ? str.slice(0, idx).trim() : str;
  const resto = idx >= 0 ? str.slice(idx + SEP.length).trim() : "";
  const anoMatch = resto.match(/\((\d{4})\)\s*$/);
  const ano = anoMatch?.[1] ?? "";
  const instituicao = anoMatch
    ? resto.slice(0, resto.lastIndexOf(`(${ano})`)).trim()
    : resto;
  return { id: `f${Math.random().toString(36).slice(2)}`, curso, instituicao, ano };
}

function formatFormacao(item: FormacaoItem): string {
  return `${item.curso} — ${item.instituicao}${item.ano ? ` (${item.ano})` : ""}`;
}

/* ------------------------------------------------------------------ */
/* Sub-componentes                                                        */
/* ------------------------------------------------------------------ */

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Chips({ chips, onChange }: { chips: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const adicionar = () => {
    const v = input.trim();
    if (v && !chips.includes(v)) onChange([...chips, v]);
    setInput("");
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11.5px] text-ink"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(chips.filter((c) => c !== chip))}
              className="text-ink-muted hover:text-danger"
              aria-label={`Remover ${chip}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); adicionar(); }
          }}
          placeholder="Especialidade… Enter para adicionar"
          className="flex-1 rounded-[var(--radius)] border border-line bg-transparent px-2.5 py-1.5 text-[12.5px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

function ListaFormacao({ items, onChange }: { items: FormacaoItem[]; onChange: (v: FormacaoItem[]) => void }) {
  const mover = (idx: number, dir: -1 | 1) => {
    const novo = [...items];
    [novo[idx], novo[idx + dir]] = [novo[idx + dir], novo[idx]];
    onChange(novo);
  };
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-start gap-2 rounded-[var(--radius)] border border-line bg-secondary/30 p-2.5">
          <div className="flex flex-col gap-0.5 pt-1">
            <button type="button" onClick={() => mover(idx, -1)} disabled={idx === 0} className="text-ink-muted hover:text-ink disabled:opacity-25" aria-label="Mover para cima"><ChevronUp size={13} /></button>
            <button type="button" onClick={() => mover(idx, 1)} disabled={idx === items.length - 1} className="text-ink-muted hover:text-ink disabled:opacity-25" aria-label="Mover para baixo"><ChevronDown size={13} /></button>
          </div>
          <div className="flex-1 space-y-1.5">
            <input type="text" value={item.curso} onChange={(e) => onChange(items.map((i) => i.id === item.id ? { ...i, curso: e.target.value } : i))} placeholder="Curso ou título" className="w-full rounded border border-line bg-transparent px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <div className="flex gap-1.5">
              <input type="text" value={item.instituicao} onChange={(e) => onChange(items.map((i) => i.id === item.id ? { ...i, instituicao: e.target.value } : i))} placeholder="Instituição" className="flex-1 rounded border border-line bg-transparent px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary/30" />
              <input type="text" value={item.ano} onChange={(e) => onChange(items.map((i) => i.id === item.id ? { ...i, ano: e.target.value } : i))} placeholder="Ano" maxLength={4} className="w-16 rounded border border-line bg-transparent px-2 py-1 text-[12.5px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
          <button type="button" onClick={() => onChange(items.filter((i) => i.id !== item.id))} className="mt-1 text-ink-muted hover:text-danger" aria-label="Remover"><Trash2 size={13} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { id: `f${Date.now()}`, curso: "", instituicao: "", ano: "" }])} className="flex items-center gap-1.5 text-[12.5px] text-primary hover:underline">
        <Plus size={13} /> Adicionar formação
      </button>
    </div>
  );
}

function CampoRede({ Icon, label, value, onChange, placeholder }: { Icon: React.ElementType; label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={14} className="shrink-0 text-ink-muted" aria-label={label} />
      <Entrada type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1" />
    </div>
  );
}

function PreviewBox({ nome, cargo, bioCurta, redes }: { nome: string; cargo: string; bioCurta: string; redes: Record<string, string> }) {
  const letras = nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const ICONES: Record<string, React.ElementType> = { instagram: Instagram, linkedin: Linkedin, facebook: Facebook, x: Twitter, youtube: Youtube };
  const redesAtivas = Object.entries(redes).filter(([, v]) => !!v);
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 text-base font-bold text-white">
          {letras || "?"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[13.5px] text-ink">{nome || "Nome do autor"}</p>
          <p className="text-[11.5px] text-ink-muted">{cargo}</p>
        </div>
      </div>
      {bioCurta && <p className="mt-2.5 line-clamp-3 text-[12px] leading-relaxed text-ink">{bioCurta}</p>}
      {redesAtivas.length > 0 && (
        <div className="mt-2.5 flex gap-2">
          {redesAtivas.map(([rede]) => { const Icon = ICONES[rede]; return Icon ? <Icon key={rede} size={13} className="text-ink-muted" /> : null; })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FacetaCard — toggle card para cada faceta                            */
/* ------------------------------------------------------------------ */

function FacetaCard({
  Icone,
  titulo,
  descricao,
  ativo,
  onChange,
}: {
  Icone: React.ElementType;
  titulo: string;
  descricao: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!ativo)}
      className={cn(
        "flex flex-1 items-start gap-3 rounded-[var(--radius)] border p-4 text-left transition-colors",
        ativo
          ? "border-primary bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
          : "border-line bg-surface hover:border-primary/40",
      )}
    >
      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", ativo ? "bg-primary text-primary-ink" : "bg-secondary text-ink-muted")}>
        <Icone size={14} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-[13px] font-medium", ativo ? "text-ink" : "text-ink-muted")}>{titulo}</p>
          <div className={cn("h-4 w-8 rounded-full transition-colors", ativo ? "bg-primary" : "bg-line")}>
            <span className={cn("block h-3.5 w-3.5 translate-y-[1px] rounded-full bg-white shadow transition-transform", ativo ? "translate-x-[18px]" : "translate-x-[1px]")} />
          </div>
        </div>
        <p className="mt-0.5 text-[11.5px] text-ink-muted">{descricao}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Constantes                                                            */
/* ------------------------------------------------------------------ */

const CONSELHOS = ["CFP", "CRM", "CRO", "OAB", "CRC", "CREA", "CAU", "SUSEP", "Outro", "Nenhum"];

const PAPEIS: { value: PapelUsuario; label: string; descricao: string }[] = [
  { value: "administrador", label: "Administrador", descricao: "Tudo no painel: conteúdo, mídia, aparência, configurações e gestão de usuários." },
  { value: "editor", label: "Editor", descricao: "Edita e publica conteúdo de qualquer autor. Sem acesso a aparência ou configurações." },
  { value: "autor", label: "Autor", descricao: "Cria e edita somente os próprios posts. Não publica." },
];

const TABELA_PERMISSOES = [
  { acao: "Criar e editar posts próprios", admin: true, editor: true, autor: true },
  { acao: "Editar posts de outros autores", admin: true, editor: true, autor: false },
  { acao: "Publicar posts", admin: true, editor: true, autor: false },
  { acao: "Gerenciar categorias e mídia", admin: true, editor: true, autor: false },
  { acao: "Editar aparência e tema", admin: true, editor: false, autor: false },
  { acao: "Alterar configurações do site", admin: true, editor: false, autor: false },
  { acao: "Gerenciar usuários", admin: true, editor: false, autor: false },
];

function forcaSenha(s: string): { nivel: number; label: string; cor: string } {
  let pts = 0;
  if (s.length >= 8) pts++;
  if (s.length >= 14) pts++;
  if (/[A-Z]/.test(s)) pts++;
  if (/[0-9]/.test(s)) pts++;
  if (/[^A-Za-z0-9]/.test(s)) pts++;
  if (pts <= 1) return { nivel: 1, label: "Fraca", cor: "var(--danger)" };
  if (pts <= 2) return { nivel: 2, label: "Razoável", cor: "var(--accent)" };
  if (pts <= 3) return { nivel: 3, label: "Boa", cor: "var(--success)" };
  return { nivel: 4, label: "Forte", cor: "var(--success)" };
}

const STATUS_COR: Record<string, string> = {
  publicado: "text-success", rascunho: "text-ink-muted", revisao: "text-accent", agendado: "text-primary",
};
const STATUS_LABEL: Record<string, string> = {
  publicado: "Publicado", rascunho: "Rascunho", revisao: "Em revisão", agendado: "Agendado",
};

/* ------------------------------------------------------------------ */
/* Página                                                                */
/* ------------------------------------------------------------------ */

export type ModoEditorUsuario = "editar" | "novo" | "perfil";

export function EditorUsuario({ id, modo = "editar" }: { id: string; modo?: ModoEditorUsuario }) {
  const router = useRouter();
  const { posts, atualizarUsuario } = useStore();
  const { data: sessao, update: atualizarSessao } = useSession();

  const NOVO = modo === "novo";
  const PERFIL = modo === "perfil";
  const usuario = undefined as Usuario | undefined; // valores vêm do fetch (edição/perfil) ou ficam vazios (novo)
  const [carregandoUsuario, setCarregandoUsuario] = useState(!NOVO);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(false);
  const [nomeSimples, setNomeSimples] = useState(""); // nome quando NÃO assina (sem autoria)
  const [slugEditado, setSlugEditado] = useState(false);
  const [criado, setCriado] = useState<{ id: string; senha: string | null } | null>(null);

  /* -- Facetas -- */
  const [podeAcessar, setPodeAcessar] = useState(usuario?.podeAcessar ?? true);
  const [podeAssinar, setPodeAssinar] = useState(usuario?.podeAssinar ?? true);

  /* -- Acesso -- */
  const [emailLogin, setEmailLogin] = useState(usuario?.acesso?.emailLogin ?? "");
  const [papel, setPapel] = useState<PapelUsuario>(usuario?.acesso?.papel ?? "autor");
  const [contaAtiva, setContaAtiva] = useState(usuario?.acesso?.ativo !== false);

  /* -- Senha -- */
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senhaDefinidaEm] = useState(() => (NOVO ? null : "sim")); // o cadastro não guarda a data
  const [senhaRevealed, setSenhaRevealed] = useState<string | null>(null);

  /* -- Autoria -- */
  const autoria = usuario?.autoria as Usuario["autoria"] | undefined;
  const [nomePublico, setNomePublico] = useState(autoria?.nomePublico ?? "");
  const [slug, setSlug] = useState(autoria?.slug ?? "");
  const [cargo, setCargo] = useState(autoria?.cargo ?? "");
  const [fotoAlt, setFotoAlt] = useState(autoria?.fotoAlt ?? "");
  const [bioCurta, setBioCurta] = useState(autoria?.bioCurta ?? "");
  const [bioLonga, setBioLonga] = useState(autoria?.bioLonga ?? "");
  const [conselho, setConselho] = useState(autoria?.conselho ?? "Nenhum");
  const [registro, setRegistro] = useState(autoria?.registro ?? "");
  const [especialidades, setEspecialidades] = useState<string[]>(autoria?.especialidades ?? []);
  const [formacao, setFormacao] = useState<FormacaoItem[]>(() => (autoria?.formacao ?? []).map(parseFormacao));
  const [emailPublico, setEmailPublico] = useState(autoria?.emailPublico ?? "");
  const [instagram, setInstagram] = useState(autoria?.redes?.instagram ?? "");
  const [linkedin, setLinkedin] = useState(autoria?.redes?.linkedin ?? "");
  const [facebook, setFacebook] = useState(autoria?.redes?.facebook ?? "");
  const [xUrl, setXUrl] = useState(autoria?.redes?.x ?? "");
  const [youtube, setYoutube] = useState(autoria?.redes?.youtube ?? "");
  const [tiktok, setTiktok] = useState(autoria?.redes?.tiktok ?? "");
  const [siteUrl, setSiteUrl] = useState(autoria?.redes?.site ?? "");
  const [lattes, setLattes] = useState(autoria?.redes?.lattes ?? "");
  const [urlExterna, setUrlExterna] = useState(autoria?.urlExterna ?? "");
  const [destaque, setDestaque] = useState(autoria?.destaque ?? false);
  // States para valores originais da API — usados em comparações e no payload de save
  const [slugOriginal, setSlugOriginal] = useState("");
  const [fotoAtual, setFotoAtual] = useState("");

  const [salvo, setSalvo] = useState(false);
  const [sessaoEncerrada, setSessaoEncerrada] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [seletorFotoAberto, setSeletorFotoAberto] = useState(false);
  // Lista FRESCA do servidor (o store guarda uma cópia velha, com rascunhos): base da trava de "único admin".
  const [listaFresca, setListaFresca] = useState<UsuarioMin[] | null>(null);

  /* Lista de usuários (só leitura): e-mail repetido no "novo" e trava de último admin na edição. */
  useEffect(() => {
    if (PERFIL) return;
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((d) => { if (d.ok && Array.isArray(d.usuarios)) setListaFresca(d.usuarios); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Carregar dados reais do usuário da API ao editar */
  useEffect(() => {
    if (NOVO) return;
    if (!id) { setCarregandoUsuario(false); return; }
    fetch(`/api/usuarios/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok || !data.usuario) return;
        setUsuarioEncontrado(true);
        const u = data.usuario;
        // Preencher campos de acesso
        if (u.acesso?.emailLogin) setEmailLogin(u.acesso.emailLogin);
        if (u.acesso?.papel) setPapel(u.acesso.papel);
        if (u.acesso?.ativo !== undefined) setContaAtiva(u.acesso.ativo);
        if (u.podeAcessar !== undefined) setPodeAcessar(u.podeAcessar);
        if (u.podeAssinar !== undefined) setPodeAssinar(u.podeAssinar);
        // Preencher campos de autoria
        const a = u.autoria;
        if (!a) return;
        setNomeSimples(a.nomePublico ?? "");
        if (a.nomePublico) setNomePublico(a.nomePublico);
        if (a.slug) { setSlug(a.slug); setSlugOriginal(a.slug); }
        if (a.cargo) setCargo(a.cargo);
        if (a.fotoAlt) setFotoAlt(a.fotoAlt);
        if (a.bioCurta) setBioCurta(a.bioCurta);
        if (a.bioLonga) setBioLonga(a.bioLonga);
        if (a.conselho) setConselho(a.conselho);
        if (a.registro) setRegistro(a.registro);
        if (a.especialidades) setEspecialidades(a.especialidades);
        if (a.formacao) setFormacao(a.formacao.map(parseFormacao));
        if (a.emailPublico) setEmailPublico(a.emailPublico);
        if (a.urlExterna) setUrlExterna(a.urlExterna);
        if (a.destaque !== undefined) setDestaque(a.destaque);
        if (a.foto) setFotoAtual(a.foto);
        if (a.redes) {
          if (a.redes.instagram) setInstagram(a.redes.instagram);
          if (a.redes.linkedin) setLinkedin(a.redes.linkedin);
          if (a.redes.facebook) setFacebook(a.redes.facebook);
          if (a.redes.x) setXUrl(a.redes.x);
          if (a.redes.youtube) setYoutube(a.redes.youtube);
          if (a.redes.tiktok) setTiktok(a.redes.tiktok);
          if (a.redes.site) setSiteUrl(a.redes.site);
          if (a.redes.lattes) setLattes(a.redes.lattes);
        }
      })
      .catch(console.error)
      .finally(() => setCarregandoUsuario(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!NOVO && carregandoUsuario) return <div className="flex h-full items-center justify-center p-8"><p className="text-[13px] text-ink-muted">Carregando…</p></div>;
  if (!NOVO && !usuarioEncontrado) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-ink-muted">Usuário não encontrado.</p>
          {!PERFIL && <Link href="/usuarios" className="mt-2 block text-[13px] text-primary hover:underline">← Voltar para Usuários</Link>}
        </div>
      </div>
    );
  }

  const postsDoAutor = NOVO ? [] : posts.filter((p) => p.autorId === id);
  const slugAlterado = slug !== slugOriginal && !!slugOriginal;

  /* Trava: nunca ficar sem Administrador (o servidor recusa com 409; aqui é só o aviso).
     Só avisa se ESTE usuário está entre os admins ativos e é o único, pela lista fresca. */
  const eUltimoAdmin = !NOVO && !PERFIL && listaFresca ? ehUltimoAdminAtivo(listaFresca, id) : false;
  const sameAs = [instagram, linkedin, facebook, xUrl, youtube, tiktok, siteUrl, lattes].filter(Boolean);

  /* Avisos E-E-A-T */
  const avisos = podeAssinar
    ? [
        !fotoAtual && "Foto de perfil não definida",
        !bioCurta.trim() && "Bio curta não preenchida",
        !instagram && !linkedin && !facebook && !xUrl && !youtube && !tiktok && "Nenhuma rede social preenchida",
      ].filter(Boolean) as string[]
    : [];

  /* JSON-LD Person */
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: nomePublico,
    url: `/autor/${slug}`, // página do autor no site (o domínio entra no build)
  };
  if (cargo) jsonLd.jobTitle = cargo;
  if (bioCurta) jsonLd.description = bioCurta;
  if (emailPublico) jsonLd.email = emailPublico;
  if (conselho !== "Nenhum" && registro) jsonLd.credential = `${conselho} ${registro}`;
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;
  if (urlExterna) jsonLd.identifier = urlExterna;

  const nomeExibicao = nomePublico || nomeSimples || emailLogin || "Usuário";

  const isOwnAccount = !NOVO && (PERFIL || (!!sessao?.user && (sessao.user as { id?: string }).id === id)); // id da SESSÃO

  const montarAutoria = () => ({
    nomePublico,
    slug,
    foto: fotoAtual,
    fotoAlt: fotoAlt || undefined,
    cargo,
    bioCurta,
    bioLonga,
    conselho,
    registro,
    especialidades,
    formacao: formacao.map(formatFormacao),
    emailPublico,
    redes: { instagram, linkedin, facebook, x: xUrl || undefined, youtube: youtube || undefined, tiktok: tiktok || undefined, site: siteUrl || undefined, lattes: lattes || undefined },
    urlExterna,
    destaque,
  });

  /* Só o botão "Criar usuário" cria; abrir a tela não grava nada. */
  const criar = async () => {
    if (salvando) return;
    if (!podeAcessar && !podeAssinar) {
      setErroSalvar("Marque pelo menos uma faceta (acessar o painel ou assinar conteúdo).");
      return;
    }
    const nome = (podeAssinar ? nomePublico : nomeSimples).trim();
    const problema = validarNovoUsuario(
      { podeAcessar, emailLogin: emailLogin.trim(), senha: novaSenha || undefined, ativo: contaAtiva, nome },
      listaFresca ?? [],
    );
    if (problema) {
      setErroSalvar(problema.erro);
      return;
    }
    setErroSalvar(null);
    setSalvando(true);
    try {
      const autoriaNovo = podeAssinar
        ? { ...montarAutoria(), nomePublico: nome }
        : { ...montarAutoria(), nomePublico: nome, slug: "" };
      const r = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podeAcessar,
          podeAssinar,
          acesso: podeAcessar ? { emailLogin: emailLogin.trim(), papel, ativo: contaAtiva } : undefined,
          senha: podeAcessar && novaSenha ? novaSenha : undefined,
          autoria: autoriaNovo,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok || !data.usuario?.id) {
        setErroSalvar(data.erro ?? `Não foi possível criar o usuário (erro ${r.status}).`);
        return;
      }
      setCriado({ id: data.usuario.id, senha: podeAcessar && novaSenha ? novaSenha : null });
    } catch {
      setErroSalvar("Não foi possível falar com o servidor. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  const salvar = async () => {
    if (NOVO) return criar();
    if (salvando || (!podeAcessar && !podeAssinar)) return;

    // Validação no cliente (o servidor valida de novo)
    if (!PERFIL && podeAcessar && (contaAtiva || emailLogin) && !emailValido(emailLogin.trim())) {
      setErroSalvar("Informe um e-mail de login válido.");
      return;
    }
    const trocandoSenha = alterandoSenha && !!novaSenha;
    if (trocandoSenha && novaSenha.length < SENHA_MIN) {
      setErroSalvar(`A nova senha deve ter pelo menos ${SENHA_MIN} caracteres.`);
      return;
    }
    if (trocandoSenha && isOwnAccount && !senhaAtual) {
      setErroSalvar("Informe a senha atual para trocar a sua senha.");
      return;
    }

    const autoriaPayload = podeAssinar ? montarAutoria() : undefined;

    setErroSalvar(null);
    setSalvando(true);
    try {
      // Persistir na API — modelo completo (acesso + autoria) — e ler a resposta de verdade
      const r = await fetch(`/api/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Em modo perfil NÃO se enviam facetas nem acesso (só o administrador altera): apenas nome, autoria e a própria senha.
        body: JSON.stringify({
          ...(PERFIL
            ? (!podeAssinar && nomeSimples.trim() ? { nome: nomeSimples.trim() } : {})
            : {
                podeAcessar,
                podeAssinar,
                acesso: podeAcessar ? { emailLogin: emailLogin.trim(), papel, ativo: contaAtiva } : undefined,
              }),
          autoria: autoriaPayload,
          ...(trocandoSenha ? { senha: novaSenha, ...(isOwnAccount ? { senhaAtual } : {}) } : {}),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        setErroSalvar(data.erro ?? `Não foi possível salvar (erro ${r.status}).`);
        return;
      }

      // Servidor aceitou: agora sim atualiza o store local e a tela
      if (PERFIL) {
        const novoNome = (podeAssinar ? nomePublico : nomeSimples).trim();
        if (novoNome && novoNome !== sessao?.user?.name) await atualizarSessao?.({ name: novoNome }).catch(() => {});
      } else {
        atualizarUsuario?.(id, {
          podeAcessar,
          acesso: podeAcessar ? { emailLogin: emailLogin.trim(), papel, ativo: contaAtiva } : undefined,
          podeAssinar,
          autoria: autoriaPayload,
        });
      }
      if (trocandoSenha) {
        setSenhaRevealed(novaSenha);
        setAlterandoSenha(false);
        setNovaSenha("");
        setSenhaAtual("");
      } else {
        setSalvo(true);
        setTimeout(() => setSalvo(false), 2000);
      }
    } catch {
      setErroSalvar("Não foi possível falar com o servidor. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  if (criado) {
    return (
      <div className="mx-auto max-w-[560px] p-6">
        <div className="space-y-3 rounded-[var(--radius)] border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-success" />
            <p className="text-[13.5px] font-semibold text-ink">Usuário criado</p>
          </div>
          {criado.senha ? (
            <>
              <p className="text-[12.5px] text-ink-muted">Senha definida para {emailLogin.trim()}:</p>
              <div className="flex items-center gap-2 rounded-[var(--radius)] border border-line bg-surface-2 px-3 py-2 font-mono text-[13px] text-ink">
                <span className="flex-1 select-all">{criado.senha}</span>
                <button type="button" onClick={() => { navigator.clipboard.writeText(criado.senha ?? ""); }} className="shrink-0 text-ink-muted hover:text-ink" title="Copiar">
                  <Copy size={13} />
                </button>
              </div>
              <p className="text-[11.5px] text-[color-mix(in_srgb,var(--accent)_80%,var(--ink))]">Anote agora — não será exibida de novo.</p>
            </>
          ) : (
            <p className="text-[12.5px] text-ink-muted">Este usuário não tem acesso ao painel.</p>
          )}
          <button type="button" onClick={() => router.replace(`/usuarios/${criado.id}`)} className="rounded-[var(--radius)] bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-ink hover:opacity-90">
            Abrir o usuário
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-4">
        {!PERFIL && (
          <Link href="/usuarios" className="shrink-0 text-ink-muted hover:text-ink">
            <ArrowLeft size={18} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-ink">
            {NOVO ? "Novo usuário" : PERFIL ? "Meu perfil" : nomeExibicao}
          </h1>
          <p className="text-[12px] text-ink-muted">
            {NOVO ? "Só é criado quando você clicar em “Criar usuário”." : PERFIL ? "Sua conta e sua página de autor" : "Editor de usuário"}
          </p>
        </div>
        {podeAssinar && urlExterna && (
          <a href={urlExterna} target="_blank" rel="noreferrer" className="hidden shrink-0 items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink sm:inline-flex">
            <ExternalLink size={13} /> Registro no conselho
          </a>
        )}
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || (!podeAcessar && !podeAssinar)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors",
            salvo ? "bg-success text-white" : "bg-primary text-primary-ink hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Save size={14} />
          {NOVO ? (salvando ? "Criando…" : "Criar usuário") : salvo ? "Salvo" : "Salvar"}
        </button>
      </div>

      {erroSalvar && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] px-4 py-3">
          <AlertTriangle size={13} className="shrink-0 text-[var(--danger)]" />
          <p className="text-[12.5px] text-[var(--danger)]">{erroSalvar}</p>
        </div>
      )}

      {/* Seletores de faceta */}
      {!PERFIL && <div className="mb-2 flex gap-3">
        <FacetaCard Icone={KeyRound} titulo="Pode acessar o painel" descricao="Credenciais de login, papel e estado da conta" ativo={podeAcessar} onChange={(v) => { if (!v && eUltimoAdmin) return; setPodeAcessar(v); }} />
        <FacetaCard Icone={PenLine} titulo="Pode assinar conteúdo" descricao="Perfil público de autor nos posts" ativo={podeAssinar} onChange={setPodeAssinar} />
      </div>}

      {!podeAcessar && !podeAssinar && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] px-4 py-3">
          <AlertTriangle size={13} className="shrink-0 text-[var(--danger)]" />
          <p className="text-[12.5px] text-[var(--danger)]">
            Marque pelo menos uma faceta para poder salvar.
          </p>
        </div>
      )}

      {eUltimoAdmin && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] px-4 py-3">
          <ShieldCheck size={13} className="shrink-0 text-[color-mix(in_srgb,var(--accent)_80%,var(--ink))]" />
          <p className="text-[12.5px] text-[color-mix(in_srgb,var(--accent)_80%,var(--ink))]">
            Este é o único Administrador ativo. Não é possível rebaixar, desativar ou remover o acesso.
          </p>
        </div>
      )}

      {/* Grade de conteúdo */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) 340px" }}>
        {/* Coluna esquerda */}
        <div className="space-y-4">

          {/* ── Bloco ACESSO ── */}
          {(podeAcessar || PERFIL) && (
            <Secao titulo={PERFIL ? "Minha conta" : "Acesso ao painel"}>
              <div className="space-y-3">
                {(NOVO || PERFIL) && !podeAssinar && (
                  <Campo label="Nome" obrigatorio={NOVO}>
                    <Entrada value={nomeSimples} onChange={(e) => setNomeSimples(e.target.value)} placeholder="Nome completo" />
                  </Campo>
                )}
                <Campo label="E-mail de login" obrigatorio={NOVO} dica="Usado apenas para entrar no painel. Nunca aparece no site.">
                  <Entrada
                    type="email"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    placeholder="login@dominio.com.br"
                    disabled={PERFIL}
                    className={PERFIL ? "opacity-60" : undefined}
                  />
                </Campo>
                {PERFIL && (
                  <Campo label="Papel">
                    <Entrada value={PAPEIS.find((p) => p.value === papel)?.label ?? papel} disabled className="opacity-60" />
                  </Campo>
                )}

                {/* Senha */}
                <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-3">
                  {NOVO ? (
                    <Campo label="Senha" obrigatorio dica={`Mínimo ${SENHA_MIN} caracteres. Anote: não será exibida de novo.`}>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Entrada type="text" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
                        </div>
                        <button type="button" onClick={() => setNovaSenha(gerarSenhaSegura())} className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius)] border border-line px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink">
                          <RefreshCw size={12} />
                          Gerar
                        </button>
                      </div>
                    </Campo>
                  ) : senhaRevealed ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={13} className="shrink-0 text-success" />
                        <p className="text-[12.5px] font-medium text-ink">Senha definida com sucesso</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-[var(--radius)] border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink">
                        <span className="flex-1 select-all">{senhaRevealed}</span>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(senhaRevealed); }}
                          className="shrink-0 text-ink-muted hover:text-ink"
                          title="Copiar"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                      <div className="flex items-start gap-1.5 rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-2">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0 text-[color-mix(in_srgb,var(--accent)_80%,var(--ink))]" />
                        <p className="text-[11.5px] text-[color-mix(in_srgb,var(--accent)_80%,var(--ink))]">
                          Anote agora — não será exibida de novo.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSenhaRevealed(null);
                          if (isOwnAccount) setSessaoEncerrada(true);
                        }}
                        className="text-[11.5px] text-primary hover:underline"
                      >
                        {isOwnAccount ? "Fechar e encerrar sessão" : "Fechar"}
                      </button>
                    </div>
                  ) : alterandoSenha ? (
                    <div className="space-y-3">
                      {isOwnAccount && (
                        <Campo label="Senha atual">
                          <Entrada
                            type="password"
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            placeholder="Digite a senha atual"
                          />
                        </Campo>
                      )}
                      <Campo label="Nova senha">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Entrada
                              type={mostrarSenha ? "text" : "password"}
                              value={novaSenha}
                              onChange={(e) => setNovaSenha(e.target.value)}
                              placeholder="Mínimo 8 caracteres"
                            />
                            <button
                              type="button"
                              onClick={() => setMostrarSenha((v) => !v)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                            >
                              {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNovaSenha(gerarSenhaSegura())}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius)] border border-line px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
                          >
                            <RefreshCw size={12} />
                            Gerar
                          </button>
                        </div>
                      </Campo>
                      {novaSenha && (() => {
                        const f = forcaSenha(novaSenha);
                        return (
                          <div className="space-y-1">
                            <div className="flex gap-1">
                              {[1,2,3,4].map((n) => (
                                <div
                                  key={n}
                                  className="h-1 flex-1 rounded-full transition-colors"
                                  style={{ background: n <= f.nivel ? f.cor : "var(--line)" }}
                                />
                              ))}
                            </div>
                            <p className="text-[11px]" style={{ color: f.cor }}>{f.label}</p>
                          </div>
                        );
                      })()}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={salvar}
                          disabled={!novaSenha || novaSenha.length < 8 || (isOwnAccount && !senhaAtual)}
                          className="rounded-[var(--radius)] bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Salvar senha
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAlterandoSenha(false); setNovaSenha(""); setSenhaAtual(""); }}
                          className="rounded-[var(--radius)] border border-line px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12.5px] font-medium text-ink">Senha</p>
                        <p className="text-[11.5px] text-ink-muted">
                          {senhaDefinidaEm ? "Senha definida" : "Ainda não definida"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlterandoSenha(true)}
                        className="rounded-[var(--radius)] border border-line px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
                      >
                        Alterar senha
                      </button>
                    </div>
                  )}
                </div>

                {/* Papel + Estado */}
                {!PERFIL && <div className="grid grid-cols-2 gap-3">
                  <Campo label="Papel">
                    <select
                      value={papel}
                      onChange={(e) => {
                        if (eUltimoAdmin && e.target.value !== "administrador") return;
                        setPapel(e.target.value as PapelUsuario);
                      }}
                      disabled={eUltimoAdmin}
                      className="w-full rounded-[var(--radius)] border border-line bg-transparent px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {PAPEIS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11.5px] text-ink-muted">
                      {PAPEIS.find((p) => p.value === papel)?.descricao}
                    </p>
                  </Campo>
                  <Campo label="Estado da conta">
                    <div className="pt-1">
                      <Alternador
                        ativo={contaAtiva}
                        onChange={(v) => { if (!v && eUltimoAdmin) return; setContaAtiva(v); }}
                        label="Conta ativa"
                        descricao=""
                      />
                    </div>
                  </Campo>
                </div>}

                {/* Tabela de permissões */}
                {!PERFIL && <details className="mt-1">
                  <summary className="cursor-pointer select-none text-[12px] text-primary hover:underline">
                    O que cada papel pode fazer
                  </summary>
                  <div className="mt-2 overflow-hidden rounded-[var(--radius)] border border-line text-[11.5px]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-surface-2">
                          <th className="px-3 py-2 text-left font-semibold text-ink-muted">Ação</th>
                          <th className="px-3 py-2 text-center font-semibold text-ink-muted">Adm.</th>
                          <th className="px-3 py-2 text-center font-semibold text-ink-muted">Editor</th>
                          <th className="px-3 py-2 text-center font-semibold text-ink-muted">Autor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {TABELA_PERMISSOES.map((row) => (
                          <tr key={row.acao}>
                            <td className="px-3 py-2 text-ink">{row.acao}</td>
                            <td className="px-3 py-2 text-center">{row.admin ? <CheckCheck size={12} className="mx-auto text-success" /> : <span className="text-ink-muted">—</span>}</td>
                            <td className="px-3 py-2 text-center">{row.editor ? <CheckCheck size={12} className="mx-auto text-success" /> : <span className="text-ink-muted">—</span>}</td>
                            <td className="px-3 py-2 text-center">{row.autor ? <CheckCheck size={12} className="mx-auto text-success" /> : <span className="text-ink-muted">—</span>}</td>
                          </tr>
                        ))}
                        <tr className="bg-surface-2">
                          <td colSpan={4} className="px-3 py-2 text-[10.5px] text-ink-muted">
                            Criar página, alterar URL, H1, title, canonical, schema e composição são campos definidos pelo LinkFlow e aparecem travados para todos os papéis.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </details>}
              </div>
            </Secao>
          )}

          {/* ── Bloco AUTORIA ── */}
          {podeAssinar && (
            <>
              {/* Identidade */}
              <Secao titulo="Identidade de autor">
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 text-xl font-bold text-white">
                    {fotoAtual ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urlPreviaMidia(fotoAtual)} alt={fotoAlt || nomePublico} className="h-full w-full object-cover" />
                    ) : (
                      nomePublico.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?"
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button type="button" onClick={() => setSeletorFotoAberto(true)} className="text-[12.5px] text-primary hover:underline">
                      Alterar foto
                    </button>
                    <SeletorMidia
                      aberto={seletorFotoAberto}
                      aoFechar={() => setSeletorFotoAberto(false)}
                      aoEscolher={(m) => setFotoAtual(caminhoDaMidia(m.url))}
                      selecionada={undefined}
                    />
                    <Campo label="Texto alternativo da foto">
                      <Entrada value={fotoAlt} onChange={(e) => setFotoAlt(e.target.value)} placeholder="Ex.: Foto de João Silva" />
                    </Campo>
                  </div>
                </div>
                <div className="space-y-3">
                  <Campo label="Nome de exibição" obrigatorio={NOVO}>
                    <Entrada
                      value={nomePublico}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNomePublico(v);
                        if (!slugOriginal && !slugEditado) setSlug(slugify(v));
                      }}
                      placeholder="Nome completo"
                    />
                  </Campo>
                  <Campo label="Slug">
                    <Entrada
                      value={slug}
                      onChange={(e) => { setSlugEditado(true); setSlug(slugify(e.target.value)); }}
                      className="font-mono text-[12.5px]"
                      placeholder="slug-do-autor"
                    />
                    {slugAlterado && (
                      <p className="mt-1 text-[11.5px] text-amber-600 dark:text-amber-400">
                        Alterar o slug gera um redirect 301 automático.
                      </p>
                    )}
                  </Campo>
                  <Campo label="Cargo / Título profissional">
                    <Entrada value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Cargo ou especialidade" />
                  </Campo>
                </div>
              </Secao>

              {/* Biografia */}
              <Secao titulo="Biografia">
                <div className="space-y-3">
                  <Campo label="Bio curta" dica="Aparece no box de autor abaixo de cada post.">
                    <AreaTexto value={bioCurta} onChange={(e) => setBioCurta(e.target.value)} rows={2} maxLength={150} placeholder="Resumo em até 150 caracteres" />
                    <Contador atual={bioCurta.length} max={150} />
                  </Campo>
                  <Campo label="Bio longa" dica="Aparece na página de autor. Pode usar quebras de linha.">
                    <AreaTexto value={bioLonga} onChange={(e) => setBioLonga(e.target.value)} rows={7} placeholder="Texto de apresentação completo" />
                  </Campo>
                </div>
              </Secao>

              {/* Credenciais */}
              <Secao titulo="Credenciais">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Conselho profissional">
                      <select
                        value={conselho}
                        onChange={(e) => setConselho(e.target.value)}
                        className="w-full rounded-[var(--radius)] border border-line bg-transparent px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {CONSELHOS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Campo>
                    {conselho !== "Nenhum" && (
                      <Campo label="Número de registro">
                        <Entrada value={registro} onChange={(e) => setRegistro(e.target.value)} placeholder="Ex.: 06/128455" className="font-mono" />
                      </Campo>
                    )}
                  </div>
                  <Campo label="Especialidades">
                    <Chips chips={especialidades} onChange={setEspecialidades} />
                  </Campo>
                  <Campo label="Formação acadêmica">
                    <ListaFormacao items={formacao} onChange={setFormacao} />
                  </Campo>
                </div>
              </Secao>

              {/* Contato e presença */}
              <Secao titulo="Contato e presença">
                <p className="mb-3 rounded bg-secondary/60 px-3 py-2 text-[11.5px] text-ink-muted">
                  <strong className="text-ink">E-mail público</strong> é diferente do e-mail de login. Este aparece no site; o de login nunca aparece.
                </p>
                <div className="space-y-2.5">
                  <Campo label="E-mail público">
                    <Entrada type="email" value={emailPublico} onChange={(e) => setEmailPublico(e.target.value)} placeholder="email@dominio.com.br" />
                  </Campo>
                  <Campo label="URL externa" dica="Registro no conselho profissional, site pessoal, etc.">
                    <Entrada type="url" value={urlExterna} onChange={(e) => setUrlExterna(e.target.value)} placeholder="https://cadastro.cfp.org.br/…" />
                  </Campo>
                  <div className="space-y-2 pt-1">
                    <CampoRede Icon={Globe} label="Site pessoal" value={siteUrl} onChange={setSiteUrl} placeholder="https://seusite.com.br" />
                    <CampoRede Icon={Globe} label="Lattes" value={lattes} onChange={setLattes} placeholder="https://lattes.cnpq.br/…" />
                    <CampoRede Icon={Linkedin} label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/…" />
                    <CampoRede Icon={Instagram} label="Instagram" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/…" />
                    <CampoRede Icon={Facebook} label="Facebook" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/…" />
                    <CampoRede Icon={Twitter} label="X / Twitter" value={xUrl} onChange={setXUrl} placeholder="https://x.com/…" />
                    <CampoRede Icon={Youtube} label="YouTube" value={youtube} onChange={setYoutube} placeholder="https://youtube.com/@…" />
                    <CampoRede Icon={Music2} label="TikTok" value={tiktok} onChange={setTiktok} placeholder="https://tiktok.com/@…" />
                  </div>
                </div>
              </Secao>

              {/* Configuração */}
              <Secao titulo="Configuração de autoria">
                <Alternador ativo={destaque} onChange={setDestaque} label="Destaque na página de equipe" descricao="Exibe o autor na seção de equipe do site" />
              </Secao>
            </>
          )}

          {/* Nenhuma faceta ativa */}
          {!podeAcessar && !podeAssinar && (
            <div className="flex items-start gap-3 rounded-[var(--radius)] border border-line bg-surface p-5 text-[13px] text-ink-muted">
              <Lock size={15} className="mt-0.5 shrink-0" />
              <p>Ative pelo menos uma faceta acima para configurar este usuário.</p>
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Avisos E-E-A-T */}
          {avisos.length > 0 && (
            <div className="rounded-[var(--radius)] border border-amber-300 bg-amber-50 p-4 dark:border-amber-600/50 dark:bg-amber-950/20">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-[12.5px] font-semibold text-amber-700 dark:text-amber-400">Sinal E-E-A-T incompleto</p>
              </div>
              <ul className="space-y-1">
                {avisos.map((aviso) => (
                  <li key={aviso} className="flex items-start gap-1.5 text-[12px] text-amber-700 dark:text-amber-400">
                    <span className="mt-px shrink-0">·</span>{aviso}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview do box de autor */}
          {podeAssinar && (
            <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Preview do box</p>
              <PreviewBox nome={nomePublico} cargo={cargo} bioCurta={bioCurta} redes={{ instagram, linkedin, facebook, x: xUrl, youtube }} />
            </div>
          )}

          {/* JSON-LD Person */}
          {podeAssinar && conselho !== "Nenhum" && (
            <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">JSON-LD Person</p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-secondary p-3 text-[10.5px] leading-relaxed text-ink-muted">
                {JSON.stringify(jsonLd, null, 2)}
              </pre>
            </div>
          )}

          {/* Posts assinados */}
          {!NOVO && <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink">
                Posts assinados{" "}
                <span className="ml-1 text-[11px] font-normal text-ink-muted">({postsDoAutor.length})</span>
              </p>
              {postsDoAutor.length > 0 && (
                <Link href={`/posts?autor=${id}`} className="text-[11.5px] text-primary hover:underline">Ver todos</Link>
              )}
            </div>
            {postsDoAutor.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Nenhum post ainda.</p>
            ) : (
              <div className="space-y-2">
                {postsDoAutor.slice(0, 6).map((post) => (
                  <div key={post.id} className="flex items-start justify-between gap-2">
                    <Link href={`/posts/${post.id}`} className="line-clamp-2 flex-1 text-[12px] text-ink hover:text-primary hover:underline">
                      {post.titulo}
                    </Link>
                    <span className={cn("shrink-0 text-[11px]", STATUS_COR[post.status] ?? "text-ink-muted")}>
                      {STATUS_LABEL[post.status] ?? post.status}
                    </span>
                  </div>
                ))}
                {postsDoAutor.length > 6 && <p className="text-[11.5px] text-ink-muted">+{postsDoAutor.length - 6} mais</p>}
              </div>
            )}
          </div>}
        </div>
      </div>

      {/* Overlay de sessão encerrada (C14) */}
      {sessaoEncerrada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface)]/90 backdrop-blur-sm">
          <div className="mx-4 max-w-sm rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]">
              <KeyRound size={22} className="text-[var(--primary)]" />
            </div>
            <h2 className="mb-2 text-[16px] font-semibold text-[var(--ink)]">Sessão encerrada</h2>
            <p className="mb-6 text-[13px] leading-relaxed text-[var(--ink-muted)]">
              Sua senha foi alterada. Entre novamente com a nova senha para continuar.
            </p>
            <Link
              href={PERFIL ? "/perfil" : "/usuarios"}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--primary-ink)] hover:opacity-90"
              onClick={() => setSessaoEncerrada(false)}
            >
              Simular novo login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
