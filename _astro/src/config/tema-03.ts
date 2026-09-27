/* ─────────────────────────────────────────────────────────────────────────
   Tema 03 — Vértice Institucional
   Nicho: serviço profissional (contabilidade / consultoria)

   Conteúdo 100% fictício. Escritório, endereço, telefone, CNPJ, CRC e
   depoimentos são de exemplo, criados para o tema de referência.
   Nenhum texto foi copiado da referência visual usada na composição.
   ───────────────────────────────────────────────────────────────────────── */

export const site = {
  nome:        'Vértice Contabilidade',
  nomeBreve:   'Vértice',
  slogan:      'Números claros, decisões seguras',
  dominio:     'https://verticecontabilidade.com.br',

  /* Formulário de contato e WhatsApp.
     painelUrl: URL https do painel do cliente (ex.: 'https://painel.seudominio.com.br').
       Vazio na prévia local — o formulário mostra um aviso e não envia. É preenchido
       na publicação (fase2-site-astro ETAPA 6.2 / novo-cliente.sh); nunca inventar.
     whatsappFlutuante: botão fixo no canto da tela; só aparece se nap.whatsapp existir.
     whatsappMensagem: texto inicial do botão flutuante; vazio = mensagem neutra padrão. */
  painelUrl:         '',
  whatsappFlutuante: true,
  whatsappMensagem:  '',
  cnpj:        '11.222.333/0001-44',
  anoFundacao: 2003,

  /* Identidade e dados estruturados (JSON-LD, Open Graph). Todos opcionais:
     campo ausente = a propriedade é omitida. Valores abaixo são de demonstração. */
  descricao:   'Escritório de contabilidade com contabilidade consultiva, gestão fiscal, departamento pessoal e BPO financeiro.',
  schemaTipo:  ['AccountingService', 'LocalBusiness'],
  credencial:  { conselho: 'CRC-PR', registro: '006.482/O' },
  funcionamento: [
    { dias: ['seg', 'ter', 'qua', 'qui'], abre: '08:00', fecha: '18:00' },
    { dias: ['sex'],                      abre: '08:00', fecha: '17:00' },
  ],
  areaAtendimento: ['Londrina', 'Paraná'],

  nap: {
    logradouro:  'Av. Dom Pedro II, 980',
    complemento: 'Conjunto 1204',
    bairro:      'Centro',
    cidade:      'Londrina',
    uf:          'PR',
    cep:         '86010-450',
    enderecoFormatado: 'Av. Dom Pedro II, 980 — Conjunto 1204, Centro, Londrina — PR · CEP 86010-450',
    telefone:    '(43) 3322-4100',
    telefone2:   '(43) 3322-4108',
    whatsapp:    '5543991224100',
    email:       'contato@verticecontabilidade.com.br',
  },

  /* Mapa embedado — item B da composição. Sem chave de API. */
  mapaSrc: 'https://www.google.com/maps?q=' +
           encodeURIComponent('Av. Dom Pedro II, 980, Centro, Londrina - PR') +
           '&output=embed',

  horarios: [
    { dia: 'Segunda a Quinta', hora: '8h às 12h e 13h30 às 18h' },
    { dia: 'Sexta',            hora: '8h às 12h e 13h30 às 17h' },
    { dia: 'Sábado e Domingo', hora: 'Fechado' },
  ],

  redes: [
    { nome: 'LinkedIn',  href: 'https://linkedin.com/company/verticecontabilidade' },
    { nome: 'Instagram', href: 'https://instagram.com/verticecontabilidade' },
    { nome: 'Facebook',  href: 'https://facebook.com/verticecontabilidade' },
    { nome: 'YouTube',   href: 'https://youtube.com/@verticecontabilidade' },
  ],

  nav: [
    { label: 'Home',        href: '/tema-03' },
    { label: 'Sobre',       href: '/tema-03/sobre' },
    { label: 'Serviços',    href: '/tema-03/servicos' },
    { label: 'Consultoria', href: '/tema-03/contabilidade-consultiva' },
    { label: 'Blog',        href: '/tema-03/blog' },
    { label: 'Contato',     href: '/tema-03/contato' },
  ],

  navFooterColunas: [
    {
      titulo: 'Serviços',
      itens: [
        { label: 'Contabilidade Consultiva',   href: '/tema-03/contabilidade-consultiva' },
        { label: 'Gestão Fiscal e Tributária', href: '/tema-03/gestao-fiscal-tributaria' },
        { label: 'Departamento Pessoal',       href: '/tema-03/departamento-pessoal' },
        { label: 'Abertura de Empresas',       href: '/tema-03/abertura-de-empresas' },
        { label: 'BPO Financeiro',             href: '/tema-03/bpo-financeiro' },
        { label: 'Planejamento Tributário',    href: '/tema-03/planejamento-tributario' },
      ],
    },
    {
      titulo: 'Escritório',
      itens: [
        { label: 'Quem somos',           href: '/tema-03/sobre' },
        { label: 'Contabilidade consultiva', href: '/tema-03/contabilidade-consultiva' },
        { label: 'Blog',                 href: '/tema-03/blog' },
        { label: 'Onde estamos',         href: '/tema-03/contato' },
      ],
    },
    {
      titulo: 'Legal',
      itens: [
        { label: 'Política de Privacidade', href: '/tema-03/politica-de-privacidade' },
        { label: 'Termos de Uso',           href: '/tema-03/termos-de-uso' },
      ],
    },
  ],

  /* Prova — diferenciais (4 cards) */
  diferenciais: [
    {
      icone: 'CT',
      titulo: 'Contador responsável, não atendente',
      descricao: 'Cada cliente tem um contador designado e o contato direto dele. Nada de fila de protocolo para tirar uma dúvida de fechamento.',
    },
    {
      icone: 'PR',
      titulo: 'Obrigações entregues antes do prazo',
      descricao: 'Calendário próprio com folga de cinco dias sobre o prazo legal. Em 22 anos, nenhuma multa por atraso de entrega.',
    },
    {
      icone: 'RG',
      titulo: 'Revisão de regime todo ano',
      descricao: 'Simples, Presumido e Real recalculados sobre o seu faturamento real antes de cada virada de exercício.',
    },
    {
      icone: 'RL',
      titulo: 'Relatório gerencial mensal',
      descricao: 'Margem, ponto de equilíbrio e carga tributária efetiva em uma página, até o quinto dia útil.',
    },
  ],

  /* Abordagem — setores atendidos (bloco escuro) */
  setores: [
    { icone: 'CV', titulo: 'Comércio e varejo',      descricao: 'Substituição tributária, ICMS interestadual e controle de estoque fiscal.' },
    { icone: 'PS', titulo: 'Prestadores de serviço', descricao: 'ISS por município, retenções na fonte e enquadramento de atividade.' },
    { icone: 'IC', titulo: 'Indústria e confecção',  descricao: 'Custo de produção, crédito de insumos e apuração de IPI.' },
    { icone: 'CC', titulo: 'Clínicas e consultórios', descricao: 'Equiparação hospitalar, pró-labore de sócios e folha de plantonistas.' },
    { icone: 'CO', titulo: 'Construção civil',       descricao: 'Regime especial, medição por obra e INSS sobre a nota de serviço.' },
    { icone: 'ND', titulo: 'Negócios digitais',      descricao: 'Receita recorrente, marketplace e faturamento para o exterior.' },
  ],

  /* Pilares — missão, visão, valores (página Sobre) */
  pilares: [
    {
      icone: 'MI',
      titulo: 'Missão',
      corpo: 'Traduzir a contabilidade em informação que o empresário usa para decidir — preço, contratação, investimento e retirada.',
    },
    {
      icone: 'VI',
      titulo: 'Visão',
      corpo: 'Ser o escritório que o cliente consulta antes de decidir, não apenas o que entrega a obrigação depois do fato.',
    },
    {
      icone: 'VA',
      titulo: 'Valores',
      corpo: 'Cinco compromissos que orientam cada atendimento:',
      lista: [
        'Prazo cumprido sem cobrança',
        'Resposta em até um dia útil',
        'Linguagem sem jargão',
        'Sigilo sobre o número do cliente',
        'Recomendar o que serve, não o que rende',
      ],
    },
  ],

  /* Trajetória — página Sobre */
  marcos: [
    { ano: '2003', titulo: 'Abertura do escritório', corpo: 'Duas salas no centro de Londrina e nove clientes, quase todos do comércio da região.' },
    { ano: '2009', titulo: 'Departamento pessoal próprio', corpo: 'A folha sai de fora e passa a ser feita internamente, com equipe dedicada.' },
    { ano: '2015', titulo: 'Consultoria tributária', corpo: 'Revisão anual de regime vira serviço padrão para toda a carteira, sem custo adicional.' },
    { ano: '2019', titulo: 'Escrituração digitalizada', corpo: 'Fim do malote. Documento entra por portal e o cliente acompanha o andamento.' },
    { ano: '2024', titulo: 'BPO financeiro', corpo: 'Contas a pagar e receber passam a ser operados para clientes sem retaguarda administrativa.', atual: true },
  ],

  tags: [
    { label: '#ContabilidadeConsultiva', href: '/tema-03/contabilidade-consultiva' },
    { label: '#PlanejamentoTributário',  href: '/tema-03/planejamento-tributario' },
    { label: '#SimplesNacional',         href: '/tema-03/regime-tributario-simples-ou-presumido' },
    { label: '#DepartamentoPessoal',     href: '/tema-03/departamento-pessoal' },
    { label: '#BPOFinanceiro',           href: '/tema-03/bpo-financeiro' },
    { label: '#AberturaDeEmpresa',       href: '/tema-03/abertura-de-empresas' },
    { label: '#FluxoDeCaixa',            href: '/tema-03/fluxo-de-caixa-para-pequenas-empresas' },
    { label: '#ProLabore',               href: '/tema-03/pro-labore-e-distribuicao-de-lucros' },
    { label: '#Londrina',                href: '/tema-03/contato' },
    { label: '#ContadorPR',              href: '/tema-03/sobre' },
  ],

  buscasFrequentes: [
    { label: 'escritório de contabilidade londrina',   href: '/tema-03/servicos' },
    { label: 'contador para prestador de serviço',     href: '/tema-03/contabilidade-consultiva' },
    { label: 'abrir empresa em londrina',              href: '/tema-03/abertura-de-empresas' },
    { label: 'planejamento tributário pr',             href: '/tema-03/planejamento-tributario' },
    { label: 'trocar de contador',                     href: '/tema-03/contato' },
    { label: 'departamento pessoal terceirizado',      href: '/tema-03/departamento-pessoal' },
    { label: 'bpo financeiro para pequena empresa',    href: '/tema-03/bpo-financeiro' },
    { label: 'simples nacional ou lucro presumido',    href: '/tema-03/regime-tributario-simples-ou-presumido' },
    { label: 'contabilidade para clínica médica',      href: '/tema-03/contabilidade-consultiva' },
    { label: 'contador em londrina centro',            href: '/tema-03/contato' },
  ],

  faq: [
    {
      pergunta: 'Como funciona a troca de contador? Preciso esperar o fim do ano?',
      resposta: 'Não. A troca pode ser feita em qualquer mês. Solicitamos ao escritório anterior os arquivos digitais, os livros e as guias em aberto, e assumimos a partir da competência seguinte. O processo leva de sete a quinze dias e não interrompe nenhuma entrega.',
    },
    {
      pergunta: 'Vocês atendem empresas fora de Londrina?',
      resposta: 'Sim. Cerca de um terço da carteira fica em outras cidades do Paraná e em São Paulo. Documento entra pelo portal e as reuniões são por vídeo, com a mesma periodicidade do atendimento presencial.',
    },
    {
      pergunta: 'O que está incluído na mensalidade?',
      resposta: 'Escrituração contábil e fiscal, apuração e guias, folha de pagamento, obrigações acessórias, balanço anual, revisão de regime tributário e o relatório gerencial mensal. Abertura, alteração contratual e perícia são cobrados à parte.',
    },
    {
      pergunta: 'Quanto tempo demora para abrir uma empresa?',
      resposta: 'Com a documentação completa, de cinco a dez dias úteis para CNPJ, inscrição estadual quando aplicável e alvará provisório. Atividades que exigem licença sanitária ou ambiental dependem do prazo do órgão e podem levar mais.',
    },
    {
      pergunta: 'Meu faturamento é pequeno. Vale a pena sair do MEI?',
      resposta: 'Depende do limite e do tipo de cliente. Acima do teto do MEI a migração é obrigatória, mas ela também compensa antes disso quando você precisa emitir nota para empresa que retém tributo ou contratar mais de um funcionário. Fazemos essa conta na primeira reunião, sem compromisso.',
    },
    {
      pergunta: 'Quem responde quando tenho uma dúvida urgente?',
      resposta: 'O contador responsável pela sua empresa, no WhatsApp direto dele. Não há central de atendimento nem abertura de chamado para pergunta simples.',
    },
  ],

  /* ─────────────────────────────────────────────────────────────────
     Campos do §6.2 do MD — preenchidos pelo cliente, sem texto padrão.
     Aqui estão PREENCHIDOS COM EXEMPLO porque este é o tema de
     referência. Em site real, campo vazio bloqueia a publicação.
     ───────────────────────────────────────────────────────────────── */
  legal: {
    exemplo: true,
    versaoPolitica: '1.0',
    atualizadaEm:   '2026-08-15',

    controlador: {
      razaoSocial: 'Vértice Serviços Contábeis Ltda.',
      cnpj:        '11.222.333/0001-44',
      endereco:    'Av. Dom Pedro II, 980 — Conjunto 1204, Centro, Londrina — PR, CEP 86010-450',
    },

    encarregado: {
      nomeado: false,
      canal:   'privacidade@verticecontabilidade.com.br',
      observacao: 'Agente de pequeno porte — canal de atendimento ao titular em vez de encarregado nomeado, conforme Resolução CD/ANPD nº 2/2022.',
    },

    canalTitular: 'privacidade@verticecontabilidade.com.br · (43) 3322-4100, de segunda a sexta, das 8h às 18h',

    basesLegais: [
      { finalidade: 'Execução do contrato de serviços contábeis',            base: 'Execução de contrato (art. 7º, V)' },
      { finalidade: 'Escrituração e entrega de obrigações acessórias',       base: 'Cumprimento de obrigação legal (art. 7º, II)' },
      { finalidade: 'Resposta a formulário de contato do site',              base: 'Procedimentos preliminares de contrato (art. 7º, V)' },
      { finalidade: 'Medição de audiência do site',                          base: 'Consentimento (art. 7º, I)' },
      { finalidade: 'Comunicação de novidades e conteúdo do blog',           base: 'Consentimento (art. 7º, I)' },
    ],

    retencao: [
      { finalidade: 'Documentos contábeis e fiscais',        prazo: '5 anos após o encerramento do exercício, por exigência fiscal' },
      { finalidade: 'Documentos trabalhistas e de folha',    prazo: '30 anos, conforme prazo previdenciário' },
      { finalidade: 'Contato enviado pelo formulário do site', prazo: '24 meses a partir do último contato' },
      { finalidade: 'Registro de consentimento de cookies',  prazo: '5 anos a partir do registro' },
      { finalidade: 'Dados de audiência do site',            prazo: '14 meses' },
    ],

    compartilhamento: [
      { destinatario: 'Receita Federal, Secretarias de Fazenda e prefeituras', finalidade: 'Entrega de declarações e obrigações acessórias' },
      { destinatario: 'Caixa Econômica Federal e eSocial',                     finalidade: 'Obrigações de folha e FGTS' },
      { destinatario: 'Provedor de hospedagem do site',                        finalidade: 'Armazenamento das páginas e dos formulários' },
      { destinatario: 'Ferramenta de medição de audiência',                    finalidade: 'Estatística de acesso, apenas com consentimento' },
    ],

    transferenciaInternacional: 'Há transferência internacional. A ferramenta de medição de audiência e o serviço de e-mail transacional têm servidores nos Estados Unidos. A transferência ocorre com base em cláusulas contratuais padrão do fornecedor e alcança apenas dados de navegação e o endereço de e-mail informado no formulário. Nenhum documento contábil, fiscal ou trabalhista sai do território nacional.',

    cookies: [
      { categoria: 'Necessários', finalidade: 'Manter a sessão, lembrar a escolha do banner de cookies e proteger o formulário contra envio automatizado.', retencao: '12 meses', base: 'Legítimo interesse', compartilhamento: 'Nenhum' },
      { categoria: 'Analíticos',  finalidade: 'Contar visitas, medir quais páginas são lidas e de onde vem o acesso.', retencao: '14 meses', base: 'Consentimento', compartilhamento: 'Ferramenta de medição de audiência' },
      { categoria: 'Marketing',   finalidade: 'Medir o resultado de anúncios e evitar repetir o mesmo anúncio para quem já é cliente.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Plataformas de anúncio contratadas' },
      { categoria: 'Funcionais',  finalidade: 'Guardar preferências de exibição, como conteúdo já lido no blog.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Nenhum' },
    ],

    formularios: [
      { nome: 'Formulário de contato', campos: 'Nome, e-mail, telefone, assunto e mensagem', finalidade: 'Responder à solicitação e, se houver interesse, apresentar proposta' },
      { nome: 'Solicitação de proposta', campos: 'Nome, e-mail, telefone, empresa, regime tributário atual e número de funcionários', finalidade: 'Dimensionar o serviço e calcular o valor da proposta' },
    ],

    medicao: [
      { ferramenta: 'Medição de audiência do site', dado: 'Páginas visitadas, origem do acesso e tipo de dispositivo. Sem coleta de IP completo.' },
    ],

    /* Termos de Uso (obrigatório) — lido por <ConteudoLegal documento="termos">.
       Campo vazio bloqueia a publicação, igual aos campos da política. */
    termos: {
      naoSubstitui:  'O conteúdo deste site tem finalidade informativa e não substitui parecer contábil, fiscal ou jurídico sobre um caso concreto. A prestação de serviços é regida pelo contrato firmado com cada cliente, que prevalece em caso de divergência com estes termos.',
      foro:          { cidade: 'Londrina', uf: 'PR' },
      vigenciaDesde: '2026-08-15',
    },
  },
}
