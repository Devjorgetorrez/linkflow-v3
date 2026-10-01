import { ShieldOff } from "lucide-react";
import Link from "next/link";

import { Vazio } from "@/components/ui";

export default function SemPermissaoPage() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-[var(--radius)] border border-line bg-surface">
      <Vazio
        icone={<ShieldOff size={22} />}
        titulo="Você não tem permissão para acessar esta área"
        descricao="Seu papel não inclui esta tela. Se precisar dela, peça a um administrador do site para ajustar o seu acesso."
        acao={
          <Link href="/" className="text-[12.5px] text-primary hover:underline">
            Voltar ao painel
          </Link>
        }
      />
    </div>
  );
}
