/**
 * lib/useDominio.ts — Hook para carregar o domínio real do config
 * Usado em qualquer tela que precise exibir URLs do site.
 * Devolve o domínio SEM protocolo (ex: "cliente.com.br").
 */
import { useState, useEffect } from "react";

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
