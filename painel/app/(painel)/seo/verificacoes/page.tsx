"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Botao, Entrada } from "@/components/ui";
import { enviarConfig } from "@/lib/site-config-cliente";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type Estado = "nao-configurado" | "configurado" | "verificado";

function EstadoBadge({ estado }: { estado: Estado }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        estado === "verificado" && "bg-success/15 text-success",
        estado === "configurado" && "bg-accent/15 text-accent",
        estado === "nao-configurado" && "bg-line/30 text-ink-muted",
      )}
    >
      {estado === "verificado" && "Verificado"}
      {estado === "configurado" && "Configurado"}
      {estado === "nao-configurado" && "Não configurado"}
    </span>
  );
}

function CopiarBtn({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  function copiar() {
    navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }
  return (
    <button
      onClick={copiar}
      title="Copiar"
      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-ink-muted transition-colors hover:bg-surface hover:text-ink"
    >
      {copiado ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      {copiado ? "Copiado!" : "Copiar"}
    </button>
  );
}

function MonoBox({ valor }: { valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line bg-surface px-3 py-2">
      <code className="break-all font-mono text-[11.5px] text-ink">{valor}</code>
      <CopiarBtn texto={valor} />
    </div>
  );
}

function CardShell({
  titulo,
  estado,
  children,
}: {
  titulo: string;
  estado: Estado;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold text-ink">{titulo}</p>
        <EstadoBadge estado={estado} />
      </div>
      {children}
    </div>
  );
}

function NotaTexto({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[11px] text-ink-muted">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

const GSC_TOKEN = "qT7xR2mB9k";

function CardGSC() {
  return (
    <CardShell titulo="Google Search Console" estado="verificado">
      {/* DNS TXT */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center gap-2">
          <p className="text-[12px] font-medium text-ink">DNS TXT</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Recomendado
          </span>
        </div>
        <p className="mb-2 text-[12px] text-ink-muted">
          Adicione um registro TXT na zona DNS do domínio:
        </p>
        <MonoBox valor={`google-site-verification=${GSC_TOKEN}`} />
        <NotaTexto>
          Sobrevive a migrações e cobre todos os subdomínios. Processado em até 24h.
        </NotaTexto>
      </div>

      {/* Meta tag */}
      <div className="border-t border-line pt-4">
        <p className="mb-1.5 text-[12px] font-medium text-ink">Meta tag no &lt;head&gt;</p>
        <p className="mb-2 text-[12px] text-ink-muted">
          Ou adicione esta tag no &lt;head&gt; de todas as páginas:
        </p>
        <MonoBox
          valor={`<meta name="google-site-verification" content="${GSC_TOKEN}" />`}
        />
        <NotaTexto>
          Mais rápido de verificar, mas falha se o &lt;head&gt; for alterado.
        </NotaTexto>
      </div>

      <p className="mt-4 text-[11px] text-ink-muted">
        Após adicionar, clique em Verificar no Search Console. A verificação é feita pelo
        próprio Google.
      </p>
    </CardShell>
  );
}

function CardBing() {
  const [token, setToken] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(data => {
      if (data.ok && data.config?.bingVerificacao) setToken(data.config.bingVerificacao);
    }).catch(console.error);
  }, []);

  async function salvar() {
    setErroSalvar("");
    const r = await enviarConfig({ bingVerificacao: token });
    if (!r.ok) {
      setErroSalvar(r.erros["bingVerificacao"] || r.erro || "Não foi possível salvar.");
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <CardShell titulo="Bing Webmaster Tools" estado="nao-configurado">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-ink">
            Token de verificação Bing
          </label>
          <Entrada
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="msvalidate.01=..."
          />
        </div>
        <Botao variante="primario" tamanho="sm" onClick={salvar}>
          {salvo ? "Salvo!" : "Salvar"}
        </Botao>
        {erroSalvar && <p className="mt-1.5 text-[11.5px] text-danger">{erroSalvar}</p>}
      </div>
      <NotaTexto>
        Dica: se o GSC já está verificado, importe o site direto no Bing Webmaster Tools
        em vez de verificar de novo. Leva menos de 1 minuto.{" "}
        <a
          href="https://www.bing.com/webmasters/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          Bing Webmaster Tools →
        </a>
      </NotaTexto>
    </CardShell>
  );
}

function gerarChaveHex(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function CardIndexNow() {
  const [chave, setChave] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [dominio, setDominio] = useState("seudominio.com.br");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(data => {
      if (data.ok && data.config?.dominioHost) setDominio(data.config.dominioHost);
    }).catch(console.error);
  }, []);

  function gerarChave() {
    setChave(gerarChaveHex());
  }

  function copiarChave() {
    if (!chave) return;
    navigator.clipboard.writeText(chave).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <CardShell titulo="IndexNow" estado={chave ? "configurado" : "nao-configurado"}>
      <p className="mb-3 text-[11.5px] text-ink-muted">
        IndexNow é um protocolo de notificação em tempo real. Quando uma página muda, o
        servidor avisa Bing, Yandex, Seznam e Naver diretamente. O Google não participa.
      </p>

      {!chave ? (
        <div className="flex items-center gap-3">
          <div className="font-mono text-[11.5px] text-ink-muted">[Chave não gerada]</div>
          <Botao variante="secundario" tamanho="sm" onClick={gerarChave}>
            <RefreshCw size={12} />
            Gerar chave
          </Botao>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink">Chave</label>
            <div className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-line bg-surface px-3 py-2">
              <code className="break-all font-mono text-[11.5px] text-ink">{chave}</code>
              <button
                onClick={copiarChave}
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {copiado ? (
                  <Check size={12} className="text-success" />
                ) : (
                  <Copy size={12} />
                )}
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink">
              URL do arquivo
            </label>
            <MonoBox valor={`https://${dominio}/${chave}.txt`} />
          </div>
          <p className="text-[11px] text-ink-muted">
            O arquivo já é gerado automaticamente pelo servidor. Confirme acessando a URL
            acima.
          </p>
          <Botao variante="fantasma" tamanho="sm" onClick={() => setChave(gerarChaveHex())}>
            <RefreshCw size={12} />
            Regenerar
          </Botao>
        </div>
      )}
    </CardShell>
  );
}

function CardGA4() {
  const [id, setId] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(data => {
      if (data.ok && data.config?.googleAnalyticsId) setId(data.config.googleAnalyticsId);
    }).catch(console.error);
  }, []);

  async function salvar() {
    setErroSalvar("");
    const r = await enviarConfig({ googleAnalyticsId: id });
    if (!r.ok) {
      setErroSalvar(r.erros["googleAnalyticsId"] || r.erro || "Não foi possível salvar.");
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <CardShell titulo="Google Analytics 4" estado="verificado">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-ink">
            Measurement ID
          </label>
          <Entrada
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
          />
          <NotaTexto>O ID começa com G-. Encontre em GA4 › Admin › Fluxos de dados.</NotaTexto>
        </div>
        <Botao variante="primario" tamanho="sm" onClick={salvar}>
          {salvo ? "Salvo!" : "Salvar"}
        </Botao>
        {erroSalvar && <p className="mt-1.5 text-[11.5px] text-danger">{erroSalvar}</p>}
      </div>
    </CardShell>
  );
}

function CardGTM() {
  const [id, setId] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(data => {
      if (data.ok && data.config?.googleTagManagerId) setId(data.config.googleTagManagerId);
    }).catch(console.error);
  }, []);

  async function salvar() {
    setErroSalvar("");
    const r = await enviarConfig({ googleTagManagerId: id });
    if (!r.ok) {
      setErroSalvar(r.erros["googleTagManagerId"] || r.erro || "Não foi possível salvar.");
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <CardShell titulo="Google Tag Manager" estado="configurado">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-ink">
            Container ID
          </label>
          <Entrada
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="GTM-XXXXXXX"
          />
          <NotaTexto>
            O GTM pode conter GA4, Meta Pixel e outros scripts. Se usar o GTM, não
            configure os demais IDs diretamente aqui.
          </NotaTexto>
        </div>
        <Botao variante="primario" tamanho="sm" onClick={salvar}>
          {salvo ? "Salvo!" : "Salvar"}
        </Botao>
        {erroSalvar && <p className="mt-1.5 text-[11.5px] text-danger">{erroSalvar}</p>}
      </div>
    </CardShell>
  );
}

function CardMetaPixel() {
  const [id, setId] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(data => {
      if (data.ok && data.config?.metaPixelId) setId(data.config.metaPixelId);
    }).catch(console.error);
  }, []);

  async function salvar() {
    setErroSalvar("");
    const r = await enviarConfig({ metaPixelId: id });
    if (!r.ok) {
      setErroSalvar(r.erros["metaPixelId"] || r.erro || "Não foi possível salvar.");
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <CardShell titulo="Meta Pixel" estado="nao-configurado">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-ink">Pixel ID</label>
          <Entrada
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="000000000000000"
          />
          <NotaTexto>Exige consentimento do usuário antes de disparar. Veja o aviso acima.</NotaTexto>
        </div>
        <Botao variante="primario" tamanho="sm" onClick={salvar}>
          {salvo ? "Salvo!" : "Salvar"}
        </Botao>
        {erroSalvar && <p className="mt-1.5 text-[11.5px] text-danger">{erroSalvar}</p>}
      </div>
    </CardShell>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function VerificacoesPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <h1 className="text-[14px] font-semibold text-ink">Verificações</h1>
      </div>

      <div className="px-6 py-6 max-w-2xl space-y-4">
        {/* amber warning */}
        <div className="rounded-[var(--radius)] border border-accent/30 bg-accent/8 px-4 py-3">
          <p className="text-[12.5px] text-ink">
            GA4 e Meta Pixel definem cookies de rastreamento e exigem banner de
            consentimento ativo. Configure em{" "}
            <span className="font-medium">Privacidade › Banner de cookies</span> antes de
            ativar.{" "}
            <Link
              href="/privacidade/cookies"
              className="text-primary underline-offset-2 hover:underline"
            >
              Ir para Privacidade →
            </Link>
          </p>
        </div>

        <CardGSC />
        <CardBing />
        <CardIndexNow />
        <CardGA4 />
        <CardGTM />
        <CardMetaPixel />
      </div>
    </div>
  );
}
