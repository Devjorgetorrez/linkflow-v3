import { redirect } from "next/navigation";

// O envio de arquivos fica na própria Biblioteca (botão e arrastar); este endereço antigo só redireciona.
export default function AdicionarMidiaPage() {
  redirect("/midia");
}
