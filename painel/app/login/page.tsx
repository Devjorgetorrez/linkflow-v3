"use client";

import { LogIn, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, Suspense } from "react";

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
