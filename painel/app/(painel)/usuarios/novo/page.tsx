"use client";

/**
 * Abrir esta tela NÃO cria nada: o usuário só passa a existir quando o
 * administrador clica em "Criar usuário" e o servidor aceita.
 */

import { EditorUsuario } from "@/components/usuarios/EditorUsuario";

export default function NovoUsuarioPage() {
  return <EditorUsuario id="" modo="novo" />;
}
