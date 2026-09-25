"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { KeyRound, User, CheckCircle2, AlertCircle } from "lucide-react";
import { CabecalhoTela } from "@/components/Tela";
import { Botao, Campo, Entrada, Girando, Painel, CabecalhoPainel } from "@/components/ui";

type Estado = "idle" | "enviando" | "ok" | "erro";

export default function PerfilPage() {
  const { data: session, update } = useSession();

  const [nome, setNome] = useState(session?.user?.name ?? "");
  const [estadoNome, setEstadoNome] = useState<Estado>("idle");
  const [erroNome, setErroNome] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConf, setSenhaConf] = useState("");
  const [estadoSenha, setEstadoSenha] = useState<Estado>("idle");
  const [erroSenha, setErroSenha] = useState("");

  const userId = (session?.user as { id?: string })?.id;

  // ─── Salvar nome — usa sessão, sem API key ───────────────────────────────────

  async function salvarNome(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !userId) return;
    setEstadoNome("enviando");
    setErroNome("");

    const res = await fetch(`/api/usuarios/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim() }),
    });

    if (res.ok) {
      await update({ name: nome.trim() });
      setEstadoNome("ok");
      setTimeout(() => setEstadoNome("idle"), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setErroNome(data.erro ?? "Erro ao salvar.");
      setEstadoNome("erro");
    }
  }

  // ─── Trocar senha — verifica a atual, depois troca ──────────────────────────

  async function trocarSenha(e: FormEvent) {
    e.preventDefault();
    setEstadoSenha("enviando");
    setErroSenha("");

    if (senhaNova.length < 8) {
      setErroSenha("A nova senha deve ter pelo menos 8 caracteres.");
      setEstadoSenha("erro");
      return;
    }
    if (senhaNova !== senhaConf) {
      setErroSenha("As senhas não coincidem.");
      setEstadoSenha("erro");
      return;
    }

    // 1. Verificar senha atual
    const verificar = await fetch("/api/auth/verificar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session?.user?.email, senha: senhaAtual }),
    });

    if (!verificar.ok) {
      setErroSenha("Senha atual incorreta.");
      setEstadoSenha("erro");
      return;
    }

    // 2. Atualizar a senha — usa sessão, sem API key
    const res = await fetch(`/api/usuarios/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha: senhaNova }),
    });

    if (res.ok) {
      setSenhaAtual("");
      setSenhaNova("");
      setSenhaConf("");
      setEstadoSenha("ok");
      setTimeout(() => setEstadoSenha("idle"), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setErroSenha(data.erro ?? "Erro ao trocar a senha.");
      setEstadoSenha("erro");
    }
  }

  return (
    <>
      <CabecalhoTela titulo="Meu perfil" />

      <div className="grid gap-3 lg:grid-cols-2">
        {/* ── Dados pessoais ── */}
        <Painel>
          <CabecalhoPainel
            titulo="Dados pessoais"
            descricao="Nome exibido no painel e nos posts"
            icone={<User size={14} />}
          />
          <form onSubmit={salvarNome} className="mt-3 space-y-3">
            <Campo label="Nome">
              <Entrada
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </Campo>
            <Campo label="E-mail">
              <Entrada value={session?.user?.email ?? ""} disabled className="opacity-50" />
            </Campo>
            <Campo label="Papel">
              <Entrada
                value={(session?.user as { papel?: string })?.papel ?? ""}
                disabled
                className="opacity-50 capitalize"
              />
            </Campo>

            {estadoNome === "ok" && (
              <p className="flex items-center gap-1.5 text-[11px] text-success">
                <CheckCircle2 size={11} /> Nome atualizado.
              </p>
            )}
            {estadoNome === "erro" && (
              <p className="flex items-center gap-1.5 text-[11px] text-danger">
                <AlertCircle size={11} /> {erroNome}
              </p>
            )}

            <Botao variante="primario" className="h-7 text-[11px]" disabled={estadoNome === "enviando"}>
              {estadoNome === "enviando" ? <Girando label="Salvando…" /> : "Salvar"}
            </Botao>
          </form>
        </Painel>

        {/* ── Trocar senha ── */}
        <Painel>
          <CabecalhoPainel
            titulo="Trocar senha"
            descricao="Mínimo de 8 caracteres"
            icone={<KeyRound size={14} />}
          />
          <form onSubmit={trocarSenha} className="mt-3 space-y-3">
            <Campo label="Senha atual">
              <Entrada
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </Campo>
            <Campo label="Nova senha">
              <Entrada
                type="password"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </Campo>
            <Campo label="Confirmar nova senha">
              <Entrada
                type="password"
                value={senhaConf}
                onChange={(e) => setSenhaConf(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </Campo>

            {estadoSenha === "ok" && (
              <p className="flex items-center gap-1.5 text-[11px] text-success">
                <CheckCircle2 size={11} /> Senha atualizada com sucesso.
              </p>
            )}
            {estadoSenha === "erro" && (
              <p className="flex items-center gap-1.5 text-[11px] text-danger">
                <AlertCircle size={11} /> {erroSenha}
              </p>
            )}

            <Botao variante="primario" className="h-7 text-[11px]" disabled={estadoSenha === "enviando"}>
              {estadoSenha === "enviando" ? <Girando label="Salvando…" /> : "Trocar senha"}
            </Botao>
          </form>
        </Painel>
      </div>
    </>
  );
}
