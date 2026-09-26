"use client";

import { LogIn, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, Suspense } from "react";

import { BotaoCopiar } from "@/components/BotaoCopiar";
import { Marca } from "@/components/Marca";
import { Botao, Campo, Entrada, Girando } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erro = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [esqueci, setEsqueci] = useState(false);

  async function submeter(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErroLocal(null);

    const resultado = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (resultado?.error) {
      setErroLocal("E-mail ou senha incorretos.");
      setEnviando(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  // Pedido pronto para colar no Claude Code. Usa o e-mail já digitado no
  // campo; sem ele, deixa o espaço para preencher (nunca inventa o e-mail).
  const emailDoPedido = email.trim() || "[seu e-mail de login]";
  const pedidoSenha = `Esqueci a senha do painel do meu site. Redefina a senha do usuário ${emailDoPedido}.`;

  const mensagemErro = erroLocal ?? (erro ? "Sessão expirada. Faça login novamente." : null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[320px]">
        <div className="mb-6 flex flex-col items-center">
          <Marca tamanho={38} variante="completa" />
        </div>

        <form
          onSubmit={submeter}
          className="space-y-3 rounded-[var(--radius)] border border-line bg-surface-2 p-4"
        >
          {mensagemErro && (
            <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] text-danger">
              <AlertCircle size={12} className="shrink-0" />
              {mensagemErro}
            </div>
          )}

          <Campo label="E-mail">
            <Entrada
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@dominio.com.br"
              autoComplete="email"
              required
            />
          </Campo>

          <Campo label="Senha">
            <Entrada
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Campo>

          <Botao variante="primario" className="h-8 w-full" disabled={enviando}>
            {enviando ? (
              <Girando label="Entrando…" />
            ) : (
              <>
                <LogIn size={12} /> Entrar no painel
              </>
            )}
          </Botao>
        </form>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setEsqueci((v) => !v)}
            className="text-[11.5px] text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        {esqueci && (
          <div className="mt-3 space-y-2 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
            <p className="text-[11.5px] leading-relaxed text-ink-muted">
              Por segurança, a senha do painel não é redefinida por e-mail. Quem redefine é o Claude
              Code, na conversa onde o seu site foi criado. Cole este pedido lá:
            </p>
            <pre className="whitespace-pre-wrap rounded border border-line bg-surface p-2.5 text-[11.5px] leading-relaxed text-ink">
              {pedidoSenha}
            </pre>
            {!email.trim() && (
              <p className="text-[11px] text-ink-muted">
                Dica: digite seu e-mail no campo acima e o pedido já sai completo.
              </p>
            )}
            <BotaoCopiar texto={pedidoSenha} />
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Se outro administrador do painel conseguir entrar, ele também pode trocar a sua senha
              em Usuários.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
