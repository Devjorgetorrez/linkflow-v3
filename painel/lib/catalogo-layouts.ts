/**
 * GERADO por scripts/gerar_catalogo_layouts.py — NÃO edite à mão.
 * Fonte: _astro/src/config/catalogo-layouts.json (validada contra
 * _astro/public/tema*.json e scripts/promover_tema.py).
 */

export interface LayoutCatalogo {
  /** Nome da base no motor: base | tema-03 … tema-07 (é o `tema_pasta` do projeto). */
  tema: string;
  nome: string;
  nicho: string;
  exemplos: string;
  resumo: string;
  cor: string;
  acento: string;
  fonteTitulo: string;
  fonteCorpo: string;
  /** Rota da demonstração no motor de referência ("/" = tema base). */
  rota: string;
}

export const CATALOGO_LAYOUTS: LayoutCatalogo[] = [
  {
    "tema": "base",
    "nome": "HealthCare Institucional",
    "nicho": "Clínicas e serviços de saúde",
    "exemplos": "clínica, dentista, psicólogo, fisioterapeuta, nutrição",
    "resumo": "Paleta verde médica e tom acolhedor, pensado para quem procura um profissional de saúde de confiança.",
    "cor": "#0D7A62",
    "acento": "#2DC4A4",
    "fonteTitulo": "Plus Jakarta Sans",
    "fonteCorpo": "Inter",
    "rota": "/"
  },
  {
    "tema": "tema-03",
    "nome": "Vértice Institucional",
    "nicho": "Serviço profissional",
    "exemplos": "contabilidade, consultoria, engenharia",
    "resumo": "Tom sóbrio, prova textual e credencial em evidência. O visitante compara antes de decidir.",
    "cor": "#1B4B8F",
    "acento": "#B5762F",
    "fonteTitulo": "Source Serif 4",
    "fonteCorpo": "Inter",
    "rota": "/tema-03"
  },
  {
    "tema": "tema-04",
    "nome": "Renovar Serviço Local",
    "nicho": "Serviço local com resultado visual",
    "exemplos": "higienização, desentupidora, dedetização, pintura",
    "resumo": "Prova por foto, cobertura por bairro, preço e prazo à vista, ação de WhatsApp a cada dobra.",
    "cor": "#0B5FD0",
    "acento": "#16A34A",
    "fonteTitulo": "Poppins",
    "fonteCorpo": "Inter",
    "rota": "/tema-04"
  },
  {
    "tema": "tema-05",
    "nome": "Amparo Institucional",
    "nicho": "Profissão regulamentada",
    "exemplos": "advocacia, medicina, odontologia",
    "resumo": "Autoridade e método no lugar de preço. Sem promessa de resultado, com credencial visível e números que descrevem a operação.",
    "cor": "#16324F",
    "acento": "#A8823C",
    "fonteTitulo": "Archivo",
    "fonteCorpo": "Inter",
    "rota": "/tema-05"
  },
  {
    "tema": "tema-06",
    "nome": "Hidroponto Institucional",
    "nicho": "Serviço técnico de emergência",
    "exemplos": "caça vazamento, desentupidora, elétrica, refrigeração",
    "resumo": "Urgência e método. Sinais do problema antes da venda, processo em quatro etapas e laudo técnico como entregável.",
    "cor": "#0E7490",
    "acento": "#5C930C",
    "fonteTitulo": "Rubik",
    "fonteCorpo": "Inter",
    "rota": "/tema-06"
  },
  {
    "tema": "tema-07",
    "nome": "Vereda Institucional",
    "nicho": "Intermediação e corretagem",
    "exemplos": "corretora de planos de saúde, seguros, consórcio",
    "resumo": "A página não vende o produto, vende a comparação. Formulário de cotação no centro e credibilidade emprestada dos parceiros.",
    "cor": "#4338CA",
    "acento": "#EA580C",
    "fonteTitulo": "Manrope",
    "fonteCorpo": "Inter",
    "rota": "/tema-07"
  }
];
