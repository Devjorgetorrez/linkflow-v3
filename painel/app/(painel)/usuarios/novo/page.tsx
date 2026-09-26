"use client";

/**
 * app/(painel)/usuarios/novo/page.tsx
 *
 * Formulário LOCAL: abrir a tela não cria nada. O usuário só passa a existir
 * quando o administrador clica em "Criar usuário" e o servidor aceita (a API
 * valida e-mail, unicidade, senha e nome). Depois de criado, segue para a
 * tela completa (/usuarios/[id]) para foto, bio, redes etc.
 */

import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alternador, Botao, Campo, Entrada } from "@/components/ui";
import { gerarSenhaSegura, SENHA_MIN, validarNovoUsuario, type UsuarioMin } from "@/lib/usuarios-regras";
import { slugify } from "@/lib/utils";

type Papel = "administrador" | "editor" | "autor";

export default function NovoUsuarioPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<Papel>("autor"); // papel padrão: o menos privilegiado
  const [podeAcessar, setPodeAcessar] = useState(true);
  const [podeAssinar, setPodeAssinar] = useState(true);
  const [contaAtiva, setContaAtiva] = useState(true);
  const [existentes, setExistentes] = useState<UsuarioMin[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Só LEITURA (idempotente, seguro no StrictMode): para avisar e-mail repetido antes de enviar.
  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((d) => { if (d.ok && Array.isArray(d.usuarios)) setExistentes(d.usuarios); })
      .catch(() => {});
  }, []);

  async function criar() {
    if (salvando) return;
    const problema = validarNovoUsuario(
      { podeAcessar, emailLogin: email.trim(), senha: senha || undefined, ativo: contaAtiva, nome },
      existentes,
    );
    if (!podeAcessar && !podeAssinar) {
      setErro("Marque pelo menos uma faceta (acessar o painel ou assinar conteúdo).");
      return;
    }
    if (problema) {
      setErro(problema.erro);
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const r = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podeAcessar,
          podeAssinar,
          acesso: podeAcessar ? { emailLogin: email.trim(), papel, ativo: contaAtiva } : undefined,
          senha: podeAcessar && senha ? senha : undefined,
          autoria: {
            nomePublico: nome.trim(),
            slug: podeAssinar ? slugify(nome) : "",
            foto: "",
            cargo: "",
            bioCurta: "",
            bioLonga: "",
            conselho: "Nenhum",
            registro: "",
            especialidades: [],
            formacao: [],
            emailPublico: "",
            redes: { instagram: "", linkedin: "", facebook: "" },
            urlExterna: "",
            destaque: false,
          },
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok || !data.usuario?.id) {
        setErro(data.erro ?? `Não foi possível criar o usuário (erro ${r.status}).`);
        setSalvando(false);
        return;
      }
      router.replace(`/usuarios/${data.usuario.id}`);
    } catch {
      setErro("Não foi possível falar com o servidor. Tente de novo.");
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-[560px] p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/usuarios" className="shrink-0 text-ink-muted hover:text-ink">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-ink">Novo usuário</h1>
          <p className="text-[12px] text-ink-muted">Só é criado quando você clicar em “Criar usuário”.</p>
        </div>
      </div>

      <div className="space-y-4 rounded-[var(--radius)] border border-line bg-surface p-5">
        <Campo label="Nome" obrigatorio>
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
        </Campo>

        <div className="space-y-2">
          <Alternador ativo={podeAcessar} onChange={setPodeAcessar} label="Pode acessar o painel" descricao="Tem login e senha" />
          <Alternador ativo={podeAssinar} onChange={setPodeAssinar} label="Pode assinar conteúdo" descricao="Aparece como autor no site" />
        </div>

        {podeAcessar && (
          <>
            <Campo label="E-mail de login" obrigatorio dica="Usado apenas para entrar no painel. Nunca aparece no site.">
              <Entrada type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="login@dominio.com.br" />
            </Campo>
            <Campo label="Senha" obrigatorio dica={`Mínimo ${SENHA_MIN} caracteres.`}>
              <div className="flex gap-2">
                <Entrada type="text" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
                <Botao type="button" onClick={() => setSenha(gerarSenhaSegura())}>
                  <RefreshCw size={12} /> Gerar
                </Botao>
              </div>
            </Campo>
            <Campo label="Papel">
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value as Papel)}
                className="w-full rounded-[var(--radius)] border border-line bg-transparent px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="autor">Autor — só os próprios posts, não publica</option>
                <option value="editor">Editor — publica conteúdo de qualquer autor</option>
                <option value="administrador">Administrador — tudo no painel</option>
              </select>
            </Campo>
            <Alternador ativo={contaAtiva} onChange={setContaAtiva} label="Conta ativa" />
          </>
        )}

        {erro && (
          <p role="alert" className="text-[12.5px] text-[var(--danger)]">{erro}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" onClick={criar} disabled={salvando}>
            {salvando ? "Criando…" : "Criar usuário"}
          </Botao>
          <Link href="/usuarios">
            <Botao type="button">Cancelar</Botao>
          </Link>
        </div>
      </div>
    </div>
  );
}
