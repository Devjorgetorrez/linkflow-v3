/* ─────────────────────────────────────────────────────────────────────────
   Tema 05 — Amparo Institucional
   Nicho: advocacia e profissão regulamentada (autoridade e credencial
   pesam mais que preço).

   Conteúdo 100% fictício. Escritório, sócios, OAB, endereço, telefone,
   CNPJ, números e depoimentos são de exemplo. Nenhum texto foi copiado
   da referência visual usada na composição.

   Nota de conformidade: o Provimento 205/2021 da OAB veda captação de
   clientela, mercantilização e promessa de resultado. Por isso o conteúdo
   deste tema não traz preço, não promete ganho de causa e não usa verbo
   de venda — os números descrevem a operação, não o resultado do cliente.
   ───────────────────────────────────────────────────────────────────────── */

export const site = {
  nome:        'Amparo Advocacia',
  nomeLongo:   'Amparo Advocacia Previdenciária',
  nomeBreve:   'Amparo Advocacia',
  slogan:      'Direito previdenciário com técnica e acompanhamento',
  dominio:     'https://amparoadvocacia.adv.br',
  cnpj:        '33.444.555/0001-66',
  oab:         'OAB/MG 8.472',
  anoFundacao: 2011,

  nap: {
    logradouro:  'Av. Getúlio Vargas, 1420',
    complemento: 'Sala 1108',
    bairro:      'Funcionários',
    cidade:      'Belo Horizonte',
    uf:          'MG',
    cep:         '30112-021',
    enderecoFormatado: 'Av. Getúlio Vargas, 1420 — Sala 1108, Funcionários, Belo Horizonte — MG · CEP 30112-021',
    telefone:    '(31) 3227-6400',
    telefone2:   '(31) 3227-6401',
    whatsapp:    '5531988276400',
    email:       'contato@amparoadvocacia.adv.br',
  },

  mapaSrc: 'https://www.google.com/maps?q=' +
           encodeURIComponent('Av. Getúlio Vargas, 1420, Funcionários, Belo Horizonte - MG') +
           '&output=embed',

  horarios: [
    { dia: 'Segunda a Sexta', hora: '9h às 18h' },
    { dia: 'Sábado',          hora: 'Atendimento agendado' },
    { dia: 'Domingo',         hora: 'Fechado' },
  ],

  redes: [
    { nome: 'LinkedIn',  href: 'https://linkedin.com/company/amparoadvocacia' },
    { nome: 'Instagram', href: 'https://instagram.com/amparoadvocacia.adv' },
    { nome: 'YouTube',   href: 'https://youtube.com/@amparoadvocacia' },
  ],

  nav: [
    { label: 'Home',            href: '/tema-05' },
    { label: 'O escritório',    href: '/tema-05/sobre' },
    { label: 'Atuação',         href: '/tema-05/servicos' },
    { label: 'Direito do INSS', href: '/tema-05/direito-previdenciario' },
    { label: 'Blog',            href: '/tema-05/blog' },
    { label: 'Contato',         href: '/tema-05/contato' },
  ],

  navFooterColunas: [
    {
      titulo: 'Áreas de atuação',
      itens: [
        { label: 'Aposentadoria por Idade',        href: '/tema-05/servicos/aposentadoria-por-idade' },
        { label: 'Aposentadoria por Tempo',        href: '/tema-05/servicos/aposentadoria-por-tempo-de-contribuicao' },
        { label: 'BPC / LOAS',                     href: '/tema-05/servicos/bpc-loas' },
        { label: 'Auxílio por Incapacidade',       href: '/tema-05/servicos/auxilio-por-incapacidade' },
        { label: 'Pensão por Morte',               href: '/tema-05/servicos/pensao-por-morte' },
        { label: 'Servidores Públicos',            href: '/tema-05/servicos/servidores-publicos' },
      ],
    },
    {
      titulo: 'O escritório',
      itens: [
        { label: 'Quem somos',        href: '/tema-05/sobre' },
        { label: 'Direito do INSS',   href: '/tema-05/direito-previdenciario' },
        { label: 'Publicações',       href: '/tema-05/blog' },
        { label: 'Onde estamos',      href: '/tema-05/contato' },
      ],
    },
    {
      titulo: 'Legal',
      itens: [
        { label: 'Política de Privacidade', href: '/tema-05/politica-de-privacidade' },
        { label: 'Termos de Uso',           href: '/tema-05/termos-de-uso' },
      ],
    },
  ],

  /* Faixa de selos abaixo do hero */
  selos: [
    { icone: 'usuario', titulo: 'Atendimento pelo advogado',  descricao: 'Quem estuda o seu caso é quem conversa com você. Não há triagem por atendente.' },
    { icone: 'balanca', titulo: 'Atuação exclusiva',          descricao: 'O escritório trabalha só com direito previdenciário desde 2011. Nenhuma outra área.' },
    { icone: 'documento', titulo: 'Andamento por escrito',      descricao: 'Relatório mensal do que aconteceu no processo, em linguagem sem termo técnico.' },
  ],

  /* Diferenciais — grade de 6 */
  diferenciais: [
    { icone: 'lupa', titulo: 'Análise antes de protocolar',  descricao: 'Levantamos CNIS, carnês e vínculos antes de qualquer pedido. Requerimento mal instruído vira indeferimento e reinicia a fila.' },
    { icone: 'escudo', titulo: 'Perícia acompanhada',          descricao: 'Preparação prévia para a perícia médica do INSS, com organização dos laudos e orientação sobre o que a autarquia avalia.' },
    { icone: 'calculadora', titulo: 'Cálculo conferido',            descricao: 'Recalculamos a renda mensal inicial e conferimos contra o que o INSS apurou. Divergência de cálculo é frequente e passível de revisão.' },
    { icone: 'check', titulo: 'Via administrativa primeiro',  descricao: 'Quando o caso comporta, buscamos a concessão sem processo judicial. É mais rápido e menos desgastante para a família.' },
    { icone: 'balanca', titulo: 'Servidor público',             descricao: 'Regime próprio tem regra distinta do RGPS. Atuamos nos dois, incluindo revisão de tempo especial e averbação.' },
    { icone: 'grafico', titulo: 'Relatório mensal',             descricao: 'Todo mês você recebe o que andou, o que está pendente e qual é o próximo prazo. Sem precisar cobrar.' },
  ],

  /* Bloco Numeros — descrevem a operação, nunca o resultado do cliente */
  numeros: [
    { valor: '+14',     rotulo: 'anos de atuação exclusiva', detalhe: 'Somente direito previdenciário desde 2011' },
    { valor: '+9.200',  rotulo: 'processos acompanhados',    detalhe: 'Administrativos e judiciais somados' },
    { valor: '4',       rotulo: 'advogados na equipe',       detalhe: 'Todos inscritos na OAB/MG' },
    { valor: '3',       rotulo: 'estados atendidos',         detalhe: 'MG, SP e ES, presencial e remoto' },
  ],
  numerosNota: 'Números da operação do escritório, apurados em janeiro de 2026. Não representam garantia nem previsão de resultado em caso individual.',

  /* Passo a passo — compartilhado por todos os serviços */
  passos: [
    { numero: '01', titulo: 'Conversa inicial',        descricao: 'Uma hora com o advogado para entender a história de trabalho, a situação de saúde e o que já foi tentado no INSS.' },
    { numero: '02', titulo: 'Levantamento de provas',  descricao: 'Extração do CNIS, busca de vínculos não registrados, carnês, laudos médicos e documentos de atividade especial.' },
    { numero: '03', titulo: 'Cálculo prévio',          descricao: 'Simulamos as regras aplicáveis e a renda estimada em cada uma, para decidir qual caminho faz sentido antes de protocolar.' },
    { numero: '04', titulo: 'Requerimento instruído',  descricao: 'Protocolo no INSS com a documentação completa. Requerimento incompleto é a causa mais comum de indeferimento evitável.' },
    { numero: '05', titulo: 'Acompanhamento e perícia', descricao: 'Monitoramento das exigências, preparação para perícia médica e resposta às intimações dentro do prazo.' },
    { numero: '06', titulo: 'Recurso ou ação',          descricao: 'Indeferido, avaliamos recurso administrativo ou ação judicial, com parecer honesto sobre a chance de cada via.' },
  ],

  tags: [
    { label: '#DireitoPrevidenciário',  href: '/tema-05/direito-previdenciario' },
    { label: '#BPCLOAS',                href: '/tema-05/servicos/bpc-loas' },
    { label: '#AposentadoriaPorIdade',  href: '/tema-05/servicos/aposentadoria-por-idade' },
    { label: '#AuxílioPorIncapacidade', href: '/tema-05/servicos/auxilio-por-incapacidade' },
    { label: '#PensãoPorMorte',         href: '/tema-05/servicos/pensao-por-morte' },
    { label: '#ServidorPúblico',        href: '/tema-05/servicos/servidores-publicos' },
    { label: '#RevisãoDeBenefício',     href: '/tema-05/blog/revisao-de-beneficio-quando-cabe' },
    { label: '#BeloHorizonte',          href: '/tema-05/contato' },
  ],

  buscasFrequentes: [
    { label: 'advogado previdenciário belo horizonte', href: '/tema-05/servicos' },
    { label: 'bpc loas quem tem direito',              href: '/tema-05/servicos/bpc-loas' },
    { label: 'inss negou meu benefício o que fazer',   href: '/tema-05/direito-previdenciario' },
    { label: 'aposentadoria por idade regra 2026',     href: '/tema-05/servicos/aposentadoria-por-idade' },
    { label: 'auxílio doença perícia negada',          href: '/tema-05/servicos/auxilio-por-incapacidade' },
    { label: 'pensão por morte quanto tempo dura',     href: '/tema-05/servicos/pensao-por-morte' },
    { label: 'revisão da vida toda advogado',          href: '/tema-05/blog/revisao-de-beneficio-quando-cabe' },
    { label: 'aposentadoria servidor público mg',      href: '/tema-05/servicos/servidores-publicos' },
    { label: 'tempo especial insalubridade inss',      href: '/tema-05/blog/tempo-especial-e-insalubridade' },
    { label: 'escritório previdenciário funcionários bh', href: '/tema-05/contato' },
  ],

  faq: [
    {
      pergunta: 'O INSS negou meu pedido. Ainda dá para reverter?',
      resposta: 'Na maioria dos casos, sim. O indeferimento tem prazo de 30 dias para recurso administrativo, e mesmo perdido esse prazo a via judicial continua aberta. O primeiro passo é ler a carta de indeferimento: o motivo apontado ali define se o caminho é juntar documento, refazer perícia ou discutir a interpretação da regra.',
    },
    {
      pergunta: 'Quanto tempo demora um processo previdenciário?',
      resposta: 'Na via administrativa, o INSS tem prazos legais que variam conforme o benefício, mas a média real costuma passar disso. Na via judicial, depende da vara e do estado. Não damos previsão fechada porque ela não depende do escritório — o que fazemos é informar o andamento todo mês, sem você precisar perguntar.',
    },
    {
      pergunta: 'Preciso ir até o escritório?',
      resposta: 'Não. A primeira conversa pode ser por vídeo e os documentos entram por portal. Atendemos presencialmente em Belo Horizonte para quem prefere, e a perícia médica é sempre presencial, na agência indicada pelo INSS.',
    },
    {
      pergunta: 'Como funcionam os honorários?',
      resposta: 'Seguem a tabela da OAB/MG e são acertados por contrato escrito na contratação, antes de qualquer providência. Explicamos a forma de cobrança na primeira conversa. Por vedação do Provimento 205/2021 da OAB, não divulgamos valores no site.',
    },
    {
      pergunta: 'Vocês garantem que eu vou receber o benefício?',
      resposta: 'Não, e nenhum advogado pode garantir. Promessa de resultado é vedada pelo Código de Ética da OAB. O que fazemos é analisar o seu caso e dizer com honestidade se ele tem fundamento, quais são os pontos frágeis e o que a jurisprudência tem decidido em situações parecidas.',
    },
    {
      pergunta: 'Atuam para servidor público estatutário?',
      resposta: 'Sim. O regime próprio de previdência tem regras diferentes do INSS, especialmente em tempo especial, averbação de tempo de contribuição e paridade. Atuamos nos dois regimes e em contagem recíproca entre eles.',
    },
  ],

  /* §6.2 do MD — preenchido com EXEMPLO por ser tema de referência */
  legal: {
    exemplo: true,
    versaoPolitica: '1.0',
    atualizadaEm:   '2026-08-28',

    controlador: {
      razaoSocial: 'Amparo Sociedade de Advogados',
      cnpj:        '33.444.555/0001-66',
      endereco:    'Av. Getúlio Vargas, 1420 — Sala 1108, Funcionários, Belo Horizonte — MG, CEP 30112-021',
    },

    encarregado: {
      nomeado: true,
      canal:   'privacidade@amparoadvocacia.adv.br',
      observacao: 'Encarregado nomeado, dado o volume de dados sensíveis de saúde tratados na atividade.',
    },

    canalTitular: 'privacidade@amparoadvocacia.adv.br · (31) 3227-6400, de segunda a sexta, das 9h às 18h',

    basesLegais: [
      { finalidade: 'Análise de viabilidade e patrocínio da causa',          base: 'Execução de contrato (art. 7º, V)' },
      { finalidade: 'Tratamento de dados de saúde para instruir o pedido',   base: 'Exercício regular de direito em processo (art. 11, II, "d")' },
      { finalidade: 'Guarda de documentos do processo',                      base: 'Cumprimento de obrigação legal (art. 7º, II)' },
      { finalidade: 'Resposta a contato enviado pelo site',                  base: 'Procedimentos preliminares de contrato (art. 7º, V)' },
      { finalidade: 'Medição de audiência do site',                          base: 'Consentimento (art. 7º, I)' },
    ],

    retencao: [
      { finalidade: 'Autos e documentos do processo',        prazo: '5 anos após o encerramento, conforme prazo de guarda do Estatuto da Advocacia' },
      { finalidade: 'Laudos e documentos médicos do cliente', prazo: '5 anos após o encerramento do caso, em ambiente de acesso restrito' },
      { finalidade: 'Contrato de honorários e faturamento',   prazo: '5 anos, por exigência fiscal' },
      { finalidade: 'Contato enviado pelo site sem contratação', prazo: '12 meses a partir do último contato' },
      { finalidade: 'Registro de consentimento de cookies',   prazo: '5 anos a partir do registro' },
    ],

    compartilhamento: [
      { destinatario: 'INSS, Poder Judiciário e órgãos previdenciários', finalidade: 'Instrução do requerimento e do processo' },
      { destinatario: 'Peritos e assistentes técnicos contratados',      finalidade: 'Elaboração de parecer técnico no caso' },
      { destinatario: 'Advogados correspondentes em outras comarcas',    finalidade: 'Prática de ato processual fora de Belo Horizonte' },
      { destinatario: 'Provedor de hospedagem do site',                  finalidade: 'Armazenamento das páginas e dos formulários' },
    ],

    transferenciaInternacional: 'Há transferência internacional limitada. A ferramenta de medição de audiência e o serviço de e-mail têm servidores nos Estados Unidos, com base em cláusulas contratuais padrão do fornecedor, e alcançam apenas dados de navegação e o e-mail informado no formulário. Documento de processo, laudo médico e dado sensível de saúde permanecem em território nacional e não são enviados a fornecedor estrangeiro.',

    cookies: [
      { categoria: 'Necessários', finalidade: 'Manter a sessão, lembrar a escolha do banner de cookies e proteger o formulário contra envio automatizado.', retencao: '12 meses', base: 'Legítimo interesse', compartilhamento: 'Nenhum' },
      { categoria: 'Analíticos',  finalidade: 'Contar visitas e medir quais conteúdos são lidos, para orientar as publicações.', retencao: '14 meses', base: 'Consentimento', compartilhamento: 'Ferramenta de medição de audiência' },
      { categoria: 'Marketing',   finalidade: 'Medir o alcance de publicações institucionais. Não usamos remarketing, por vedação do Provimento 205/2021 da OAB à captação de clientela.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Plataformas contratadas' },
      { categoria: 'Funcionais',  finalidade: 'Guardar preferências de exibição, como conteúdo já lido no blog.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Nenhum' },
    ],

    formularios: [
      { nome: 'Contato institucional', campos: 'Nome, e-mail, telefone e mensagem', finalidade: 'Responder à solicitação e agendar conversa inicial' },
      { nome: 'Agendamento de atendimento', campos: 'Nome, telefone, cidade e resumo da situação previdenciária', finalidade: 'Avaliar competência para o caso e marcar a conversa com o advogado' },
    ],

    medicao: [
      { ferramenta: 'Medição de audiência do site', dado: 'Páginas visitadas, origem do acesso e tipo de dispositivo. Sem coleta de IP completo.' },
    ],
  },
}
