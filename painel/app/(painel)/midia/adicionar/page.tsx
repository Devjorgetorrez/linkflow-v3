"use client";

import { Upload, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { CabecalhoTela } from "@/components/Tela";
import { Botao } from "@/components/ui";

interface ArquivoUpload {
  id: string;
  file: File;
  status: "aguardando" | "enviando" | "ok" | "erro";
  url?: string;
  erro?: string;
}

export default function AdicionarMidiaPage() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const adicionar = useCallback((files: File[]) => {
    const novos: ArquivoUpload[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      status: "aguardando",
    }));
    setArquivos((prev) => [...prev, ...novos]);
  }, []);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) adicionar(Array.from(e.target.files));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files) adicionar(Array.from(e.dataTransfer.files));
  }

  function remover(id: string) {
    setArquivos((prev) => prev.filter((a) => a.id !== id));
  }

  async function enviarTodos() {
    setEnviando(true);
    for (const arq of arquivos.filter((a) => a.status === "aguardando")) {
      setArquivos((prev) =>
        prev.map((a) => (a.id === arq.id ? { ...a, status: "enviando" } : a))
      );
      try {
        const formData = new FormData();
        formData.append("arquivo", arq.file);
        const res = await fetch("/api/midia", { method: "POST", body: formData });
        const data = await res.json();
        if (data.ok) {
          setArquivos((prev) =>
            prev.map((a) => (a.id === arq.id ? { ...a, status: "ok", url: data.url } : a))
          );
        } else {
          setArquivos((prev) =>
            prev.map((a) => (a.id === arq.id ? { ...a, status: "erro", erro: data.erro } : a))
          );
        }
      } catch (err) {
        setArquivos((prev) =>
          prev.map((a) => (a.id === arq.id ? { ...a, status: "erro", erro: String(err) } : a))
        );
      }
    }
    setEnviando(false);
  }

  const pendentes = arquivos.filter((a) => a.status === "aguardando").length;
  const concluidos = arquivos.filter((a) => a.status === "ok").length;

  return (
    <>
      <CabecalhoTela
        titulo="Adicionar mídia"
        acoes={
          <div className="flex gap-2">
            <Botao variante="secundario" onClick={() => router.back()}>
              Voltar
            </Botao>
            {concluidos > 0 && (
              <Botao variante="primario" onClick={() => router.push("/midia")}>
                Ver biblioteca
              </Botao>
            )}
          </div>
        }
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
        className={`mb-4 flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border-2 border-dashed p-12 transition-colors ${
          arrastando ? "border-primary bg-primary/5" : "border-line bg-surface"
        }`}
      >
        <Upload size={32} className="text-ink-muted" />
        <div className="text-center">
          <p className="text-[13px] font-medium text-ink">
            Arraste arquivos aqui ou
          </p>
          <label className="cursor-pointer text-[13px] text-primary hover:underline">
            clique para selecionar
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.mp4,.webm"
              className="sr-only"
              onChange={onInputChange}
            />
          </label>
        </div>
        <p className="text-[11px] text-ink-muted">
          JPG, PNG, WebP, GIF, SVG, PDF, MP4
        </p>
      </div>

      {arquivos.length > 0 && (
        <div className="space-y-2">
          {arquivos.map((arq) => (
            <div
              key={arq.id}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-line bg-surface p-3"
            >
              <div className="shrink-0">
                {arq.status === "ok" && <CheckCircle2 size={16} className="text-success" />}
                {arq.status === "erro" && <AlertCircle size={16} className="text-danger" />}
                {arq.status === "enviando" && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
                {arq.status === "aguardando" && (
                  <div className="h-4 w-4 rounded-full border-2 border-line" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] text-ink">{arq.file.name}</p>
                <p className="text-[10.5px] text-ink-muted">
                  {(arq.file.size / 1024).toFixed(0)} KB
                  {arq.status === "ok" && " · Enviado"}
                  {arq.status === "erro" && ` · Erro: ${arq.erro}`}
                </p>
              </div>
              {arq.status !== "enviando" && (
                <button onClick={() => remover(arq.id)} className="shrink-0 text-ink-muted hover:text-danger">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {pendentes > 0 && (
            <div className="pt-2">
              <Botao variante="primario" onClick={enviarTodos} disabled={enviando}>
                {enviando ? "Enviando…" : `Enviar ${pendentes} arquivo${pendentes > 1 ? "s" : ""}`}
              </Botao>
            </div>
          )}
        </div>
      )}
    </>
  );
}
