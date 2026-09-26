/**
 * lib/midia-cliente.ts — envio de arquivo para a biblioteca (navegador).
 * A validação de verdade é do servidor (POST /api/midia); aqui só se evita
 * mandar o que já se sabe que será recusado e se traduz a falha em texto claro.
 */

export type FinalidadeEnvio = "geral" | "avatar";

export const TIPOS_IMAGEM_ACEITOS = "image/jpeg,image/png,image/webp,image/gif";

export interface ResultadoEnvio {
  ok: boolean;
  /** O servidor já tinha este mesmo arquivo e o reaproveitou (não criou cópia). */
  duplicado?: boolean;
  erro?: string;
  id?: string;
  url?: string;
}

export async function enviarMidia(file: File, finalidade: FinalidadeEnvio): Promise<ResultadoEnvio> {
  const limite = finalidade === "avatar" ? 2 : 5;
  if (finalidade === "avatar" && !file.type.startsWith("image/")) {
    return { ok: false, erro: "Escolha uma imagem (JPG, PNG, WebP ou GIF)." };
  }
  if (file.size > limite * 1024 * 1024) {
    return { ok: false, erro: `"${file.name}" tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O máximo é ${limite} MB.` };
  }
  try {
    const fd = new FormData();
    fd.append("arquivo", file);
    if (finalidade === "avatar") fd.append("finalidade", "avatar");
    const res = await fetch("/api/midia", { method: "POST", body: fd });
    let data: { ok?: boolean; erro?: string; id?: string; url?: string; duplicado?: boolean } = {};
    try {
      data = await res.json();
    } catch {
      /* corpo não-JSON */
    }
    if (res.ok && data.ok) return { ok: true, id: data.id, url: data.url, duplicado: data.duplicado };
    if (res.status === 401) return { ok: false, erro: "Sua sessão expirou. Entre de novo e tente outra vez." };
    if (res.status === 403) return { ok: false, erro: data.erro ?? "Seu papel não tem permissão para enviar arquivos." };
    return { ok: false, erro: data.erro ?? `Falha no envio (código ${res.status}).` };
  } catch {
    return { ok: false, erro: "Não foi possível falar com o servidor. Verifique a conexão e tente de novo." };
  }
}
