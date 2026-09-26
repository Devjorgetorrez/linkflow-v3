/* Configuração central do tema HealthCare Institutional — VitalCare Saúde */

export const site = {
  nome:        'VitalCare Saúde',
  nomeBreve:   'VitalCare',
  slogan:      'Cuidado que transforma vidas',
  dominio:     'https://vitalcaresaude.com.br',
  cnpj:        '45.678.901/0001-23',
  anoFundacao: 2014,

  /* Identidade e dados estruturados (JSON-LD, Open Graph). Todos opcionais:
     campo ausente = a propriedade é omitida. Valores abaixo são de demonstração. */
  descricao:   'Clínica médica com consultas especializadas, exames, medicina preventiva e telemedicina.',
  schemaTipo:  ['MedicalOrganization', 'LocalBusiness'],
  funcionamento: [
    { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], abre: '07:00', fecha: '20:00' },
    { dias: ['sab'],                             abre: '08:00', fecha: '14:00' },
  ],
  areaAtendimento: ['São Paulo'],

  nap: {
    logradouro: 'Av. Paulista, 1966',
    complemento: 'Sala 1201',
    bairro:     'Bela Vista',
    cidade:     'São Paulo',
    uf:         'SP',
    cep:        '01310-100',
    enderecoFormatado: 'Av. Paulista, 1966 — Sala 1201, Bela Vista, São Paulo — SP · CEP 01310-100',
    telefone:   '(11) 3456-7890',
    whatsapp:   '5511934567890',
    email:      'contato@vitalcaresaude.com.br',
  },

  horarios: [
    { dia: 'Segunda a Sexta', hora: '7h às 20h' },
    { dia: 'Sábado',          hora: '8h às 14h' },
    { dia: 'Domingo',         hora: 'Fechado' },
  ],

  redes: [
    { nome: 'Instagram', href: 'https://instagram.com/vitalcaresaude' },
    { nome: 'Facebook',  href: 'https://facebook.com/vitalcaresaude' },
    { nome: 'LinkedIn',  href: 'https://linkedin.com/company/vitalcaresaude' },
    { nome: 'YouTube',   href: 'https://youtube.com/@vitalcaresaude' },
  ],

  nav: [
    { label: 'Home',      href: '/' },
    { label: 'Sobre',     href: '/sobre' },
    {
      label: 'Serviços',  href: '/servicos',
      filhos: [
        { label: 'Consulta Especializada',    href: '/consulta-especializada' },
        { label: 'Exames Clínicos',           href: '/exames-clinicos' },
        { label: 'Acompanhamento Preventivo', href: '/acompanhamento-preventivo' },
        { label: 'Atendimento Familiar',      href: '/atendimento-familiar' },
        { label: 'Pequenas Cirurgias',        href: '/pequenas-cirurgias' },
        { label: 'Telemedicina',              href: '/telemedicina' },
      ],
    },
    { label: 'Contato',   href: '/contato' },
    { label: 'Blog',      href: '/blog' },
  ],

  navFooterColunas: [
    {
      titulo: 'Serviços',
      itens: [
        { label: 'Consulta Especializada',      href: '/consulta-especializada' },
        { label: 'Exames Clínicos',             href: '/exames-clinicos' },
        { label: 'Acompanhamento Preventivo',   href: '/acompanhamento-preventivo' },
        { label: 'Atendimento Familiar',        href: '/atendimento-familiar' },
        { label: 'Pequenas Cirurgias',          href: '/pequenas-cirurgias' },
        { label: 'Telemedicina',                href: '/telemedicina' },
      ],
    },
    {
      titulo: 'Clínica',
      itens: [
        { label: 'Nossa equipe',    href: '/sobre' },
        { label: 'Blog de saúde',  href: '/blog' },
        { label: 'Localização',    href: '/contato' },
        { label: 'Convênios',      href: '/contato#convenios' },
      ],
    },
    {
      titulo: 'Legal',
      itens: [
        { label: 'Política de Privacidade', href: '/politica-de-privacidade' },
        { label: 'Termos de Uso',           href: '/termos-de-uso' },
      ],
    },
  ],

  diferenciais: [
    {
      icone: 'MD',
      titulo: 'Médicos com experiência comprovada',
      descricao: 'Equipe formada por especialistas com mais de 15 anos de atuação clínica e acadêmica.',
    },
    {
      icone: 'AG',
      titulo: 'Agendamento em até 24 horas',
      descricao: 'Consultas disponíveis de segunda a sábado. Confirme online ou pelo WhatsApp.',
    },
    {
      icone: 'PV',
      titulo: 'Planos e convênios aceitos',
      descricao: 'Trabalhamos com os principais convênios e oferecemos opções de pagamento particular.',
    },
    {
      icone: 'DP',
      titulo: 'Prontuário digital integrado',
      descricao: 'Histórico, resultados e receitas acessíveis para paciente e médico em qualquer consulta.',
    },
  ],

  infraestrutura: [
    {
      src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&h=600&fit=crop&auto=format',
      alt: 'Recepção da clínica VitalCare',
      legenda: 'Recepção acolhedora com atendimento personalizado',
    },
    {
      src: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&h=400&fit=crop&auto=format',
      alt: 'Consultório médico equipado',
      legenda: 'Consultórios equipados com tecnologia de ponta',
    },
    {
      src: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&h=400&fit=crop&auto=format',
      alt: 'Sala de exames clínicos',
      legenda: 'Sala de exames e procedimentos ambulatoriais',
    },
  ],

  tags: [
    { label: '#ClínicaMédica',     href: '/servicos' },
    { label: '#MedicinaPreventiva', href: '/acompanhamento-preventivo' },
    { label: '#ConsultaEspecializada', href: '/consulta-especializada' },
    { label: '#Telemedicina',      href: '/telemedicina' },
    { label: '#ExamesClínicos',    href: '/exames-clinicos' },
    { label: '#AtendimentoFamiliar', href: '/atendimento-familiar' },
    { label: '#SaúdeIntegral',     href: '/sobre' },
    { label: '#AvPaulista',        href: '/contato' },
    { label: '#SãoPaulo',          href: '/contato' },
    { label: '#ConvêniosMédicos',  href: '/contato#convenios' },
  ],

  abordagem: [
    {
      icone: 'AI',
      titulo: 'Atendimento integral',
      descricao: 'Da prevenção ao tratamento, acompanhamos você em todas as fases da sua saúde.',
    },
    {
      icone: 'OM',
      titulo: 'Orientação médica',
      descricao: 'Equipe multidisciplinar para orientar diagnóstico e tratamento com segurança.',
    },
    {
      icone: 'AA',
      titulo: 'Ambiente acolhedor',
      descricao: 'Espaço pensado para o conforto e a privacidade de cada paciente.',
    },
    {
      icone: 'CO',
      titulo: 'Consultas online',
      descricao: 'Telemedicina com a mesma qualidade e segurança das consultas presenciais.',
    },
  ],

  buscasFrequentes: [
    { label: 'clínica médica av paulista',         href: '/servicos' },
    { label: 'consulta médica são paulo',           href: '/consulta-especializada' },
    { label: 'médico de família sp',                href: '/atendimento-familiar' },
    { label: 'exame clínico paulista',              href: '/exames-clinicos' },
    { label: 'telemedicina são paulo',              href: '/telemedicina' },
    { label: 'medicina preventiva sp',              href: '/acompanhamento-preventivo' },
    { label: 'pequenas cirurgias ambulatoriais sp', href: '/pequenas-cirurgias' },
    { label: 'clínica unimed paulista',             href: '/contato#convenios' },
    { label: 'agendamento médico online',           href: '/contato' },
    { label: 'clínica médica bela vista sp',        href: '/contato' },
  ],

  /* Benefícios/diferenciais — bloco Beneficios na página de serviço.
     Cada cliente real deve ter os seus, escritos pela Fase 3 — os valores
     abaixo são só o padrão de demonstração do tema. */
  beneficios: [
    { icone: '✅', titulo: 'Equipe qualificada',       texto: 'Profissionais com formação e experiência comprovada na área.' },
    { icone: '📋', titulo: 'Atendimento completo',      texto: 'Do primeiro contato à entrega final, acompanhamento em cada etapa.' },
    { icone: '⏱️', titulo: 'Prazo de resposta rápido', texto: 'Confirmação em poucas horas, sem enrolação.' },
    { icone: '🔒', titulo: 'Confiabilidade',            texto: 'Processos claros e compromisso com o que foi combinado.' },
    { icone: '💬', titulo: 'Comunicação direta',        texto: 'Contato fácil por WhatsApp em todas as etapas do serviço.' },
    { icone: '🤝', titulo: 'Atendimento humanizado',    texto: 'Tempo para ouvir e explicar, sem pressa e sem letra miúda.' },
  ],

  /* Passo a passo — bloco ComoFunciona na página de serviço */
  processo: [
    { numero: '01', titulo: 'Contato inicial',   descricao: 'Você entra em contato pelo WhatsApp ou site e explica o que precisa.' },
    { numero: '02', titulo: 'Avaliação',         descricao: 'Levantamos as informações necessárias para dar um retorno preciso.' },
    { numero: '03', titulo: 'Atendimento',       descricao: 'Executamos o serviço combinado, dentro do prazo alinhado.' },
    { numero: '04', titulo: 'Acompanhamento',    descricao: 'Confirmamos que tudo ficou certo e seguimos disponíveis se precisar de algo.' },
  ],

  faq: [
    {
      pergunta: 'Como faço para agendar uma consulta?',
      resposta: 'Você pode agendar pelo WhatsApp, pelo formulário do site ou ligando diretamente para nossa recepção. Confirmamos disponibilidade em até 2 horas.',
    },
    {
      pergunta: 'A VitalCare aceita planos de saúde?',
      resposta: 'Sim. Trabalhamos com Unimed, Amil, SulAmérica, Bradesco Saúde, Porto Seguro e convênios municipais. Para outros planos, consulte nossa equipe.',
    },
    {
      pergunta: 'O que devo levar na primeira consulta?',
      resposta: 'Documento de identidade, carteirinha do plano (se houver), exames anteriores relacionados ao motivo da consulta e lista de medicamentos em uso.',
    },
    {
      pergunta: 'Atendem crianças e idosos?',
      resposta: 'Sim. Oferecemos atendimento familiar completo — pediatria para crianças de 0 a 12 anos e clínica geral com foco em prevenção para adultos e idosos.',
    },
    {
      pergunta: 'Como funciona a telemedicina?',
      resposta: 'A teleconsulta é realizada por videoconferência segura. Após o agendamento você recebe um link exclusivo. O médico pode emitir receitas e pedidos de exame digitais.',
    },
  ],

  /* ─────────────────────────────────────────────────────────────────
     Campos do §6.2 do MD — preenchidos pelo cliente, sem texto padrão.
     Lidos por <ConteudoLegal> em /politica-de-privacidade e /termos-de-uso.
     Aqui estão PREENCHIDOS COM EXEMPLO porque este é o tema de
     referência (`exemplo: true` exibe o aviso na página). Em site real,
     campo vazio bloqueia a publicação e a página fica com
     `dados_status: ficticio` até o cliente confirmar os dados.
     ───────────────────────────────────────────────────────────────── */
  legal: {
    exemplo: true,
    versaoPolitica: '1.0',
    atualizadaEm:   '2026-09-24',

    controlador: {
      razaoSocial: 'VitalCare Serviços Médicos Ltda.',
      cnpj:        '45.678.901/0001-23',
      endereco:    'Av. Paulista, 1966 — Sala 1201, Bela Vista, São Paulo — SP, CEP 01310-100',
    },

    encarregado: {
      nomeado: false,
      canal:   'privacidade@vitalcaresaude.com.br',
      observacao: 'Agente de pequeno porte — canal de atendimento ao titular em vez de encarregado nomeado, conforme Resolução CD/ANPD nº 2/2022.',
    },

    canalTitular: 'privacidade@vitalcaresaude.com.br · (11) 3456-7890, de segunda a sexta, das 8h às 18h',

    basesLegais: [
      { finalidade: 'Agendamento e prestação do atendimento médico',            base: 'Tutela da saúde, em procedimento realizado por profissional de saúde (art. 11, II, f)' },
      { finalidade: 'Guarda do prontuário do paciente',                          base: 'Cumprimento de obrigação legal ou regulatória (art. 11, II, a)' },
      { finalidade: 'Resposta a formulário de contato do site',                  base: 'Procedimentos preliminares de contrato (art. 7º, V)' },
      { finalidade: 'Medição de audiência do site',                              base: 'Consentimento (art. 7º, I)' },
      { finalidade: 'Comunicação de novidades e conteúdo do blog',               base: 'Consentimento (art. 7º, I)' },
    ],

    retencao: [
      { finalidade: 'Prontuário do paciente',                   prazo: '20 anos a partir do último registro, conforme a Lei nº 13.787/2018' },
      { finalidade: 'Contato enviado pelo formulário do site',  prazo: '24 meses a partir do último contato' },
      { finalidade: 'Registro de consentimento de cookies',     prazo: '5 anos a partir do registro' },
      { finalidade: 'Dados de audiência do site',               prazo: '14 meses' },
    ],

    compartilhamento: [
      { destinatario: 'Operadoras de planos de saúde conveniadas', finalidade: 'Autorização e faturamento de consultas e exames cobertos pelo plano' },
      { destinatario: 'Laboratórios parceiros',                    finalidade: 'Realização de exames solicitados pelo médico' },
      { destinatario: 'Provedor de hospedagem do site',            finalidade: 'Armazenamento das páginas e dos formulários' },
      { destinatario: 'Ferramenta de medição de audiência',        finalidade: 'Estatística de acesso, apenas com consentimento' },
    ],

    transferenciaInternacional: 'Há transferência internacional. A ferramenta de medição de audiência e o serviço de e-mail transacional têm servidores nos Estados Unidos. A transferência ocorre com base em cláusulas contratuais padrão do fornecedor e alcança apenas dados de navegação e o endereço de e-mail informado no formulário. Nenhum dado de saúde ou de prontuário sai do território nacional.',

    cookies: [
      { categoria: 'Necessários', finalidade: 'Manter a sessão, lembrar a escolha do banner de cookies e proteger o formulário contra envio automatizado.', retencao: '12 meses', base: 'Legítimo interesse', compartilhamento: 'Nenhum' },
      { categoria: 'Analíticos',  finalidade: 'Contar visitas, medir quais páginas são lidas e de onde vem o acesso.', retencao: '14 meses', base: 'Consentimento', compartilhamento: 'Ferramenta de medição de audiência' },
      { categoria: 'Marketing',   finalidade: 'Medir o resultado de anúncios e evitar repetir o mesmo anúncio para quem já é paciente.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Plataformas de anúncio contratadas' },
    ],

    formularios: [
      { nome: 'Formulário de contato', campos: 'Nome, e-mail, telefone e mensagem', finalidade: 'Responder à solicitação e, se houver interesse, agendar a consulta' },
      { nome: 'Agendamento de consulta', campos: 'Nome, telefone, e-mail, especialidade desejada e convênio', finalidade: 'Reservar o horário e confirmar a cobertura do plano' },
    ],

    medicao: [
      { ferramenta: 'Medição de audiência do site', dado: 'Páginas visitadas, origem do acesso e tipo de dispositivo. Sem coleta de IP completo.' },
    ],

    /* Termos de Uso (obrigatório) — lido por <ConteudoLegal documento="termos">.
       Campo vazio bloqueia a publicação, igual aos campos da política. */
    termos: {
      naoSubstitui:  'O conteúdo deste site — artigos, orientações e descrições de serviço — tem finalidade informativa e não substitui consulta médica, diagnóstico ou tratamento. Diante de qualquer sintoma, procure atendimento; em emergência, ligue 192 (SAMU).',
      foro:          { cidade: 'São Paulo', uf: 'SP' },
      vigenciaDesde: '2026-09-24',
    },
  },
}
