"use client";

import { useParams } from "next/navigation";

import { EditorUsuario } from "@/components/usuarios/EditorUsuario";

export default function EditorUsuarioPage() {
  const { id } = useParams<{ id: string }>();
  return <EditorUsuario id={id} modo="editar" />;
}
