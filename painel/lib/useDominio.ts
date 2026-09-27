/**
 * lib/useDominio.ts — Hook para carregar o domínio real do config
 * Usado em qualquer tela que precise exibir URLs do site.
 * Devolve o domínio SEM protocolo (ex: "cliente.com.br").
 */
import { useState, useEffect } from "react";

/**
 * Endereço-base para os botões "Ver": no computador onde o site é construído
 * (painel em modo desenvolvimento) é a prévia local (localhost:4321), porque o
 * domínio ainda não aponta para lugar nenhum; no servidor é https://<domínio>.
 * Sobrescrevível por LINKFLOW_PREVIA_URL (o /api/config devolve `previaUrl`).
 */
export function useBaseSite(): { base: string; previa: boolean } {
  const [estado, setEstado] = useState({ base: "", previa: false });
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        const previa = String(d.config?.previaUrl ?? "");
        const host = String(d.config?.dominioHost ?? "");
        if (previa) setEstado({ base: previa.replace(/\/+$/, ""), previa: true });
        else if (host) setEstado({ base: `https://${host}`, previa: false });
      })
      .catch(console.error);
  }, []);
  return estado;
}

export function useDominio(): string {
  const [dominio, setDominio] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.config?.dominioHost) setDominio(data.config.dominioHost); })
      .catch(console.error);
  }, []);

  return dominio;
}
