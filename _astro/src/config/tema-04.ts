/* ─────────────────────────────────────────────────────────────────────────
   Tema 04 — Renovar Serviço Local
   Nicho: serviço local com resultado visual (higienização, desentupidora,
   dedetização, pintura, jardinagem).

   Conteúdo 100% fictício. Empresa, endereço, telefone, CNPJ e depoimentos
   são de exemplo. Nenhum texto foi copiado da referência visual usada
   na composição.
   ───────────────────────────────────────────────────────────────────────── */

export const site = {
  nome:        'Renovar Higienização',
  nomeBreve:   'Renovar',
  slogan:      'Seu estofado como no primeiro dia',
  dominio:     'https://renovarhigienizacao.com.br',
  cnpj:        '22.333.444/0001-55',
  anoFundacao: 2013,

  nap: {
    logradouro:  'Rua das Acácias, 415',
    complemento: 'Galpão 2',
    bairro:      'Jardim Proença',
    cidade:      'Campinas',
    uf:          'SP',
    cep:         '13026-330',
    enderecoFormatado: 'Rua das Acácias, 415 — Galpão 2, Jardim Proença, Campinas — SP · CEP 13026-330',
    telefone:    '(19) 3255-7080',
    telefone2:   '(19) 3255-7081',
    whatsapp:    '5519991557080',
    email:       'contato@renovarhigienizacao.com.br',
  },

  mapaSrc: 'https://www.google.com/maps?q=' +
           encodeURIComponent('Jardim Proença, Campinas - SP') +
           '&output=embed',

  horarios: [
    { dia: 'Segunda a Sexta', hora: '8h às 18h' },
    { dia: 'Sábado',          hora: '8h às 14h' },
    { dia: 'Domingo',         hora: 'Fechado' },
  ],

  redes: [
    { nome: 'Instagram', href: 'https://instagram.com/renovarhigienizacao' },
    { nome: 'Facebook',  href: 'https://facebook.com/renovarhigienizacao' },
    { nome: 'YouTube',   href: 'https://youtube.com/@renovarhigienizacao' },
  ],

  nav: [
    { label: 'Home',         href: '/tema-04' },
    { label: 'Sobre',        href: '/tema-04/sobre' },
    { label: 'Serviços',     href: '/tema-04/servicos' },
    { label: 'Higienização', href: '/tema-04/higienizacao-de-estofados' },
    { label: 'Blog',         href: '/tema-04/blog' },
    { label: 'Contato',      href: '/tema-04/contato' },
  ],

  navFooterColunas: [
    {
      titulo: 'Serviços',
      itens: [
        { label: 'Higienização de Sofás',    href: '/tema-04/higienizacao-de-sofas' },
        { label: 'Limpeza de Colchões',      href: '/tema-04/limpeza-de-colchoes' },
        { label: 'Lavagem de Tapetes',       href: '/tema-04/lavagem-de-tapetes' },
        { label: 'Impermeabilização',        href: '/tema-04/impermeabilizacao' },
        { label: 'Higienização Automotiva',  href: '/tema-04/higienizacao-automotiva' },
        { label: 'Limpeza de Cadeiras',      href: '/tema-04/limpeza-de-cadeiras' },
      ],
    },
    {
      titulo: 'A empresa',
      itens: [
        { label: 'Quem somos',          href: '/tema-04/sobre' },
        { label: 'Como funciona',       href: '/tema-04/higienizacao-de-estofados' },
        { label: 'Blog',                href: '/tema-04/blog' },
        { label: 'Regiões atendidas',   href: '/tema-04/contato' },
      ],
    },
    {
      titulo: 'Legal',
      itens: [
        { label: 'Política de Privacidade', href: '/tema-04/politica-de-privacidade' },
        { label: 'Termos de Uso',           href: '/tema-04/termos-de-uso' },
      ],
    },
  ],

  /* Faixa de selos logo abaixo do hero — 3 promessas */
  selos: [
    { icone: 'AT', titulo: 'Atendimento em domicílio',  descricao: 'A equipe vai até você. Agendamento com hora marcada, sem janela de espera.' },
    { icone: 'PR', titulo: 'Produtos seguros',          descricao: 'Biodegradáveis, sem cheiro forte, liberados para casa com criança e animal.' },
    { icone: 'GA', titulo: 'Garantia de 90 dias',       descricao: 'Se a mancha voltar dentro do prazo, refazemos o serviço sem cobrar.' },
  ],

  /* Diferenciais — faixa escura */
  diferenciais: [
    { icone: 'EQ', titulo: 'Equipamento profissional',  descricao: 'Extratora industrial que recolhe a sujeira dissolvida em vez de empurrar para dentro da espuma.' },
    { icone: 'SE', titulo: 'Secagem em até 12 horas',   descricao: 'Extração potente reduz a umidade retida. Sem cheiro de mofo depois.' },
    { icone: 'EX', titulo: '12 anos de rua',            descricao: 'Mais de 9 mil peças higienizadas em Campinas e região desde 2013.' },
    { icone: 'OR', titulo: 'Orçamento na hora',         descricao: 'Manda a foto no WhatsApp e recebe o valor fechado, sem visita técnica cobrada.' },
  ],

  /* Processo — bloco Passos */
  processo: [
    { numero: '01', titulo: 'Avaliação da peça',      descricao: 'Identificamos o tipo de tecido, o grau de sujeira e as manchas. Cada material pede uma técnica diferente, e isso define o produto usado.' },
    { numero: '02', titulo: 'Aspiração e pré-tratamento', descricao: 'Aspiração profunda para tirar o particulado seco, seguida da aplicação do produto direto nos pontos de mancha.' },
    { numero: '03', titulo: 'Extração com máquina',   descricao: 'A extratora injeta a solução e recolhe no mesmo movimento, levando embora ácaros, bactérias e resíduo de produto.' },
    { numero: '04', titulo: 'Secagem e entrega',      descricao: 'Retiramos o máximo de umidade possível na própria extração e orientamos a ventilação. A peça volta ao uso em 8 a 12 horas.' },
  ],

  /* Regiões atendidas — bloco AreaAtendida */
  regioes: [
    'Campinas — Centro', 'Cambuí', 'Jardim Proença', 'Barão Geraldo', 'Taquaral',
    'Nova Campinas', 'Swiss Park', 'Valinhos', 'Vinhedo', 'Paulínia',
    'Sumaré', 'Hortolândia', 'Indaiatuba', 'Americana',
  ],

  regioesBullets: [
    'Atendimento em domicílio em toda a região metropolitana',
    'Agendamento com hora marcada, inclusive aos sábados',
    'Equipe uniformizada e identificada',
    'Sem taxa de deslocamento dentro de Campinas',
  ],

  /* Antes e depois — bloco AntesDepois */
  antesDepois: [
    {
      titulo: 'Sofá de tecido claro',
      legenda: 'Manchas de café e uso diário em sofá de linho bege.',
      antes:  'https://images.unsplash.com/photo-1550226891-ef816aed4a98?w=600&h=700&fit=crop&auto=format',
      depois: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=700&fit=crop&auto=format',
      antesAlt:  'Sofá de tecido claro antes da higienização, com manchas visíveis',
      depoisAlt: 'O mesmo sofá depois da higienização, com o tecido uniforme',
    },
    {
      titulo: 'Colchão de casal',
      legenda: 'Ácaros e marcas de transpiração acumuladas em colchão sem higienização.',
      antes:  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=700&fit=crop&auto=format',
      depois: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=700&fit=crop&auto=format',
      antesAlt:  'Colchão antes da higienização, com manchas de transpiração',
      depoisAlt: 'O mesmo colchão depois da higienização profunda',
    },
    {
      titulo: 'Tapete de sala',
      legenda: 'Trama saturada de poeira e pelo de animal em tapete de alto tráfego.',
      antes:  'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&h=700&fit=crop&auto=format',
      depois: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&h=700&fit=crop&auto=format',
      antesAlt:  'Tapete antes da lavagem, com a trama escurecida',
      depoisAlt: 'O mesmo tapete depois da lavagem, com a cor recuperada',
    },
  ],

  /* Prova social agregada — usada no badge de Depoimentos */
  avaliacao: {
    nota: '4,9',
    total: '+180',
    fonte: 'avaliações no Google',
  },

  tags: [
    { label: '#HigienizaçãoDeSofá',   href: '/tema-04/higienizacao-de-sofas' },
    { label: '#LimpezaDeColchão',     href: '/tema-04/limpeza-de-colchoes' },
    { label: '#LavagemDeTapete',      href: '/tema-04/lavagem-de-tapetes' },
    { label: '#Impermeabilização',    href: '/tema-04/impermeabilizacao' },
    { label: '#HigienizaçãoAutomotiva', href: '/tema-04/higienizacao-automotiva' },
    { label: '#Ácaros',               href: '/tema-04/acaros-no-sofa-e-alergia' },
    { label: '#Campinas',             href: '/tema-04/contato' },
    { label: '#EstofadoLimpo',        href: '/tema-04/higienizacao-de-estofados' },
  ],

  buscasFrequentes: [
    { label: 'higienização de sofá campinas',      href: '/tema-04/higienizacao-de-sofas' },
    { label: 'lavagem de sofá a seco',             href: '/tema-04/higienizacao-de-estofados' },
    { label: 'limpeza de colchão campinas',        href: '/tema-04/limpeza-de-colchoes' },
    { label: 'impermeabilização de sofá preço',    href: '/tema-04/impermeabilizacao' },
    { label: 'lavagem de tapete em domicílio',     href: '/tema-04/lavagem-de-tapetes' },
    { label: 'higienização automotiva campinas',   href: '/tema-04/higienizacao-automotiva' },
    { label: 'tirar cheiro de xixi do sofá',       href: '/tema-04/cheiro-de-animal-no-estofado' },
    { label: 'quanto tempo o sofá demora pra secar', href: '/tema-04/higienizacao-de-estofados' },
    { label: 'empresa de higienização valinhos',   href: '/tema-04/contato' },
    { label: 'limpeza de sofá barão geraldo',      href: '/tema-04/contato' },
  ],

  faq: [
    {
      pergunta: 'De quanto em quanto tempo devo higienizar o sofá?',
      resposta: 'A cada seis meses no uso comum. Onde há criança pequena, animal ou alguém com alergia respiratória, o intervalo cai para três a quatro meses — é o tempo em que o ácaro volta a se acumular na espuma.',
    },
    {
      pergunta: 'Quanto tempo leva o serviço e a secagem?',
      resposta: 'A higienização de um sofá de três lugares leva de uma a duas horas. A secagem completa fica entre 8 e 12 horas, dependendo do tecido, do clima e da ventilação do ambiente. Você pode usar a peça no dia seguinte.',
    },
    {
      pergunta: 'Vocês limpam qualquer tipo de tecido?',
      resposta: 'Atendemos tecido sintético, linho, chenille, veludo, suede e couro. Cada um pede produto e umidade diferentes. Camurça e seda natural exigem processo a seco específico — nesses casos avaliamos antes de fechar o orçamento.',
    },
    {
      pergunta: 'O serviço é feito na minha casa?',
      resposta: 'Sim. Levamos a extratora e a água até você, e o serviço é feito no local, sem precisar desmontar nem transportar a peça. Só precisamos de um ponto de energia e espaço para trabalhar em volta do móvel.',
    },
    {
      pergunta: 'É seguro para criança e animal de estimação?',
      resposta: 'Os produtos são biodegradáveis e registrados, sem cheiro forte residual. Depois da secagem não há risco de contato. Recomendamos apenas manter o animal longe do móvel enquanto a peça estiver úmida.',
    },
    {
      pergunta: 'Vocês garantem que a mancha vai sair?',
      resposta: 'Não prometemos isso, e desconfie de quem promete. Mancha antiga de tinta, caneta, alvejante ou ferrugem pode ter alterado a fibra de forma permanente. Na avaliação dizemos o que sai, o que clareia e o que não tem retorno, antes de você fechar.',
    },
  ],

  /* §6.2 do MD — preenchido com EXEMPLO por ser tema de referência */
  legal: {
    exemplo: true,
    versaoPolitica: '1.0',
    atualizadaEm:   '2026-08-20',

    controlador: {
      razaoSocial: 'Renovar Serviços de Higienização Ltda.',
      cnpj:        '22.333.444/0001-55',
      endereco:    'Rua das Acácias, 415 — Galpão 2, Jardim Proença, Campinas — SP, CEP 13026-330',
    },

    encarregado: {
      nomeado: false,
      canal:   'privacidade@renovarhigienizacao.com.br',
      observacao: 'Agente de pequeno porte — canal de atendimento ao titular em vez de encarregado nomeado, conforme Resolução CD/ANPD nº 2/2022.',
    },

    canalTitular: 'privacidade@renovarhigienizacao.com.br · (19) 3255-7080, de segunda a sexta, das 8h às 18h',

    basesLegais: [
      { finalidade: 'Agendamento e execução do serviço contratado',       base: 'Execução de contrato (art. 7º, V)' },
      { finalidade: 'Emissão de nota fiscal e obrigações fiscais',        base: 'Cumprimento de obrigação legal (art. 7º, II)' },
      { finalidade: 'Resposta a pedido de orçamento pelo site',           base: 'Procedimentos preliminares de contrato (art. 7º, V)' },
      { finalidade: 'Medição de audiência do site',                       base: 'Consentimento (art. 7º, I)' },
      { finalidade: 'Lembrete de nova higienização e promoções',          base: 'Consentimento (art. 7º, I)' },
    ],

    retencao: [
      { finalidade: 'Cadastro de cliente e histórico de atendimento', prazo: '5 anos após o último serviço prestado' },
      { finalidade: 'Documentos fiscais',                             prazo: '5 anos, por exigência fiscal' },
      { finalidade: 'Pedido de orçamento não convertido',             prazo: '18 meses a partir do contato' },
      { finalidade: 'Fotos de antes e depois do serviço',             prazo: '24 meses, e apenas com autorização por escrito do cliente' },
      { finalidade: 'Registro de consentimento de cookies',           prazo: '5 anos a partir do registro' },
    ],

    compartilhamento: [
      { destinatario: 'Prefeitura de Campinas e Receita Federal', finalidade: 'Emissão de nota fiscal de serviço' },
      { destinatario: 'Provedor de hospedagem do site',           finalidade: 'Armazenamento das páginas e dos formulários' },
      { destinatario: 'Ferramenta de medição de audiência',       finalidade: 'Estatística de acesso, apenas com consentimento' },
      { destinatario: 'Operadora de meio de pagamento',           finalidade: 'Processamento de pagamento por cartão ou Pix' },
    ],

    transferenciaInternacional: 'Há transferência internacional. A ferramenta de medição de audiência e o serviço de mensagem têm servidores nos Estados Unidos. A transferência ocorre com base em cláusulas contratuais padrão do fornecedor e alcança apenas dados de navegação e o contato informado no formulário. Endereço de atendimento e histórico de serviço não saem do território nacional.',

    cookies: [
      { categoria: 'Necessários', finalidade: 'Manter a sessão, lembrar a escolha do banner de cookies e proteger o formulário contra envio automatizado.', retencao: '12 meses', base: 'Legítimo interesse', compartilhamento: 'Nenhum' },
      { categoria: 'Analíticos',  finalidade: 'Contar visitas, medir quais serviços são mais procurados e de onde vem o acesso.', retencao: '14 meses', base: 'Consentimento', compartilhamento: 'Ferramenta de medição de audiência' },
      { categoria: 'Marketing',   finalidade: 'Medir o resultado de anúncios e evitar repetir o mesmo anúncio para quem já é cliente.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Plataformas de anúncio contratadas' },
      { categoria: 'Funcionais',  finalidade: 'Guardar preferências de exibição, como a região selecionada na busca de atendimento.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Nenhum' },
    ],

    formularios: [
      { nome: 'Pedido de orçamento',  campos: 'Nome, telefone ou WhatsApp, bairro, tipo de peça e mensagem', finalidade: 'Calcular o orçamento e agendar a visita' },
      { nome: 'Busca por região',     campos: 'Bairro ou cidade selecionada', finalidade: 'Informar se a região é atendida e qual o prazo de agendamento' },
    ],

    medicao: [
      { ferramenta: 'Medição de audiência do site', dado: 'Páginas visitadas, origem do acesso e tipo de dispositivo. Sem coleta de IP completo.' },
    ],

    /* Termos de Uso (obrigatório) — lido por <ConteudoLegal documento="termos">.
       Campo vazio bloqueia a publicação, igual aos campos da política. */
    termos: {
      naoSubstitui:  'As orientações publicadas neste site sobre limpeza, secagem e cuidados com estofados têm finalidade informativa e não substituem a avaliação técnica feita na visita. Preço, prazo e garantia de cada serviço valem conforme o orçamento aprovado.',
      foro:          { cidade: 'Campinas', uf: 'SP' },
      vigenciaDesde: '2026-08-15',
    },
  },
}
