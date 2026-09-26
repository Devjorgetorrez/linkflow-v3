/* ─────────────────────────────────────────────────────────────────────────
   Tema 07 — Vereda Institucional
   Nicho: intermediação e corretagem (planos de saúde, seguros, consórcio,
   crédito).

   Conteúdo 100% fictício. Corretora, endereço, telefone, CNPJ, registro na
   SUSEP/ANS, números e depoimentos são de exemplo. As operadoras e os
   hospitais citados também são inventados — tema de referência não deve
   embutir marca de terceiro real.
   ───────────────────────────────────────────────────────────────────────── */

export const site = {
  nome:        'Vereda Corretora',
  nomeLongo:   'Vereda Corretora de Planos de Saúde',
  nomeBreve:   'Vereda',
  slogan:      'A gente compara, você escolhe',
  dominio:     'https://veredacorretora.com.br',
  cnpj:        '55.666.777/0001-88',
  registro:    'SUSEP 20.123456',
  anoFundacao: 2009,

  nap: {
    logradouro:  'Av. Barão de Tatuí, 620',
    complemento: 'Sala 1503',
    bairro:      'Vila Santana',
    cidade:      'Sorocaba',
    uf:          'SP',
    cep:         '18040-410',
    enderecoFormatado: 'Av. Barão de Tatuí, 620 — Sala 1503, Vila Santana, Sorocaba — SP · CEP 18040-410',
    telefone:    '(15) 3231-9400',
    telefone2:   '(15) 3231-9401',
    whatsapp:    '5515991319400',
    email:       'contato@veredacorretora.com.br',
  },

  mapaSrc: 'https://www.google.com/maps?q=' +
           encodeURIComponent('Vila Santana, Sorocaba - SP') +
           '&output=embed',

  horarios: [
    { dia: 'Segunda a Sexta', hora: '8h30 às 18h' },
    { dia: 'Sábado',          hora: '9h às 13h' },
    { dia: 'Domingo',         hora: 'Fechado' },
  ],

  redes: [
    { nome: 'Instagram', href: 'https://instagram.com/veredacorretora' },
    { nome: 'LinkedIn',  href: 'https://linkedin.com/company/veredacorretora' },
    { nome: 'Facebook',  href: 'https://facebook.com/veredacorretora' },
  ],

  nav: [
    { label: 'Home',              href: '/tema-07' },
    { label: 'Quem somos',        href: '/tema-07/sobre' },
    { label: 'Planos',            href: '/tema-07/planos' },
    { label: 'Como escolher',     href: '/tema-07/como-escolher-plano-de-saude' },
    { label: 'Blog',              href: '/tema-07/blog' },
    { label: 'Contato',           href: '/tema-07/contato' },
  ],

  navFooterColunas: [
    {
      titulo: 'Tipos de plano',
      itens: [
        { label: 'Plano Empresarial',       href: '/tema-07/planos/plano-empresarial' },
        { label: 'Plano Individual',        href: '/tema-07/planos/plano-individual-familiar' },
        { label: 'Plano por Adesão',        href: '/tema-07/planos/plano-por-adesao' },
        { label: 'Plano Odontológico',      href: '/tema-07/planos/plano-odontologico' },
        { label: 'Plano Sênior',            href: '/tema-07/planos/plano-senior' },
        { label: 'Portabilidade',           href: '/tema-07/planos/portabilidade-de-carencia' },
      ],
    },
    {
      titulo: 'A corretora',
      itens: [
        { label: 'Quem somos',       href: '/tema-07/sobre' },
        { label: 'Como escolher',    href: '/tema-07/como-escolher-plano-de-saude' },
        { label: 'Blog',             href: '/tema-07/blog' },
        { label: 'Cidades atendidas', href: '/tema-07/contato' },
      ],
    },
    {
      titulo: 'Legal',
      itens: [
        { label: 'Política de Privacidade', href: '/tema-07/politica-de-privacidade' },
        { label: 'Termos de Uso',           href: '/tema-07/termos-de-uso' },
      ],
    },
  ],

  /* Faixa de selos abaixo do hero */
  selos: [
    { icone: 'balanca',  titulo: 'Comparamos, não empurramos', descricao: 'Trabalhamos com várias operadoras. A recomendação segue o seu caso, não a comissão da vez.' },
    { icone: 'usuario',  titulo: 'Um corretor do começo ao fim', descricao: 'A mesma pessoa faz a cotação, acompanha a implantação e resolve o problema depois da contratação.' },
    { icone: 'documento', titulo: 'Cotação sem custo',          descricao: 'A corretora é remunerada pela operadora. Você paga o mesmo valor de tabela, com assessoria incluída.' },
  ],

  /* Diferenciais — 6 cards */
  diferenciais: [
    { icone: 'balanca',     titulo: 'Comparativo lado a lado',   descricao: 'Você recebe as opções em uma tabela única, com rede, carência e reajuste histórico. Não é uma proposta só, é a comparação.' },
    { icone: 'lupa',        titulo: 'Rede conferida por endereço', descricao: 'Antes de indicar, checamos se o hospital e o laboratório que você usa estão na rede daquele plano, na sua cidade.' },
    { icone: 'calculadora', titulo: 'Simulação de reajuste',     descricao: 'Mostramos o histórico de reajuste dos últimos anos de cada operadora. É o número que decide o plano no terceiro ano, não no primeiro.' },
    { icone: 'documento',   titulo: 'Implantação acompanhada',   descricao: 'Cuidamos do cadastro, das declarações de saúde e da emissão das carteirinhas. Você não fica sozinho no processo.' },
    { icone: 'escudo',      titulo: 'Suporte depois da venda',   descricao: 'Negativa de autorização, reembolso e inclusão de dependente continuam com a gente. É o que separa corretor de vendedor.' },
    { icone: 'engrenagem',  titulo: 'Revisão anual do contrato', descricao: 'Todo ano, antes do aniversário do contrato, revisamos se ainda é a melhor opção para o seu perfil.' },
  ],

  /* Passo a passo */
  passos: [
    { numero: '01', titulo: 'Entender o perfil',   descricao: 'Quantas vidas, faixas etárias, cidade de atendimento, se há CNPJ e quais médicos e hospitais você não abre mão.' },
    { numero: '02', titulo: 'Comparar operadoras', descricao: 'Levantamos as opções elegíveis ao seu perfil e montamos o comparativo com preço, rede, carência e reajuste histórico.' },
    { numero: '03', titulo: 'Apresentar e explicar', descricao: 'Uma conversa para ler o comparativo junto, com as diferenças que costumam passar despercebidas na tabela.' },
    { numero: '04', titulo: 'Contratar e implantar', descricao: 'Cadastro, declaração de saúde, boleto e carteirinha. Acompanhamos até o plano estar ativo e utilizável.' },
  ],

  /* Bloco Numeros */
  numeros: [
    { valor: '+16',    rotulo: 'anos de corretagem',       detalhe: 'Atuando em Sorocaba e região desde 2009' },
    { valor: '+4.800', rotulo: 'contratos acompanhados',   detalhe: 'Pessoa física, PME e coletivo por adesão' },
    { valor: '9',      rotulo: 'operadoras na carteira',   detalhe: 'Comparação real, não representação única' },
    { valor: '24h',    rotulo: 'prazo de retorno',         detalhe: 'Tempo médio para devolver o comparativo' },
  ],
  numerosNota: 'Indicadores da operação da corretora apurados em janeiro de 2026. Preço, carência e cobertura variam conforme operadora, perfil e cidade — a cotação é sempre individual.',

  /* Operadoras parceiras — TODAS FICTÍCIAS */
  operadoras: [
    { icone: '', titulo: 'Vitalis Saúde',    descricao: 'Rede ampla em Sorocaba e região' },
    { icone: '', titulo: 'Cordis Med',       descricao: 'Forte em plano empresarial' },
    { icone: '', titulo: 'Meridiano Saúde',  descricao: 'Opções com coparticipação' },
    { icone: '', titulo: 'Aliança Saúde',    descricao: 'Entrada a partir de 2 vidas' },
    { icone: '', titulo: 'Prisma Saúde',     descricao: 'Cobertura estadual' },
    { icone: '', titulo: 'Núcleo Vida',      descricao: 'Adesão por entidade de classe' },
    { icone: '', titulo: 'Serena Odonto',    descricao: 'Odontológico e combinado' },
    { icone: '', titulo: 'Âncora Seguros',   descricao: 'Seguro saúde com reembolso' },
  ],

  /* Hospitais e laboratórios credenciados — TODOS FICTÍCIOS */
  credenciados: [
    { icone: '', titulo: 'Hospital Santa Vereda', descricao: 'Pronto-socorro 24h · Sorocaba' },
    { icone: '', titulo: 'Instituto Coração Novo', descricao: 'Cardiologia e diagnóstico' },
    { icone: '', titulo: 'Hospital Bom Retiro',   descricao: 'Maternidade e pediatria' },
    { icone: '', titulo: 'Laboratório Analitec',  descricao: 'Coleta domiciliar na região' },
  ],

  /* Cidades atendidas */
  cidades: [
    'Sorocaba', 'Votorantim', 'Itu', 'Salto', 'Porto Feliz', 'Boituva', 'Tatuí',
    'Piedade', 'Araçoiaba da Serra', 'Iperó', 'Capela do Alto', 'Cerquilho',
    'Tietê', 'Alumínio', 'Mairinque', 'São Roque', 'Ibiúna', 'Indaiatuba',
  ],

  cidadesBullets: [
    'Atendimento presencial em Sorocaba e remoto em toda a região',
    'Cotação devolvida em até um dia útil',
    'Corretor designado, com contato direto',
    'Suporte pós-venda incluído, sem custo adicional',
  ],

  avaliacao: { nota: '4,9', total: '+320', fonte: 'avaliações no Google' },

  tags: [
    { label: '#PlanoEmpresarial',   href: '/tema-07/planos/plano-empresarial' },
    { label: '#PlanoIndividual',    href: '/tema-07/planos/plano-individual-familiar' },
    { label: '#PlanoPorAdesão',     href: '/tema-07/planos/plano-por-adesao' },
    { label: '#Portabilidade',      href: '/tema-07/planos/portabilidade-de-carencia' },
    { label: '#Carência',           href: '/tema-07/blog/carencia-e-cpt-o-que-muda' },
    { label: '#Reajuste',           href: '/tema-07/blog/reajuste-de-plano-de-saude' },
    { label: '#Coparticipação',     href: '/tema-07/blog/coparticipacao-vale-a-pena' },
    { label: '#Sorocaba',           href: '/tema-07/contato' },
  ],

  buscasFrequentes: [
    { label: 'plano de saúde empresarial sorocaba',   href: '/tema-07/planos/plano-empresarial' },
    { label: 'plano de saúde individual sorocaba',    href: '/tema-07/planos/plano-individual-familiar' },
    { label: 'plano de saúde 2 vidas cnpj',           href: '/tema-07/planos/plano-empresarial' },
    { label: 'portabilidade de carência como funciona', href: '/tema-07/planos/portabilidade-de-carencia' },
    { label: 'plano de saúde para idoso',             href: '/tema-07/planos/plano-senior' },
    { label: 'plano odontológico empresarial',        href: '/tema-07/planos/plano-odontologico' },
    { label: 'coparticipação vale a pena',            href: '/tema-07/blog/coparticipacao-vale-a-pena' },
    { label: 'reajuste anual plano de saúde',         href: '/tema-07/blog/reajuste-de-plano-de-saude' },
    { label: 'corretora de plano de saúde votorantim', href: '/tema-07/contato' },
    { label: 'plano de saúde por adesão sindicato',   href: '/tema-07/planos/plano-por-adesao' },
  ],

  faq: [
    {
      pergunta: 'Contratar pela corretora sai mais caro?',
      resposta: 'Não. O preço é o de tabela da operadora, o mesmo que você pagaria indo direto. A corretora é remunerada pela operadora, não por você — o que muda é que a assessoria na escolha e o suporte depois da venda vêm junto.',
    },
    {
      pergunta: 'Preciso de CNPJ para contratar plano empresarial?',
      resposta: 'Sim, e ele precisa estar ativo. Muitas operadoras aceitam a partir de duas vidas, incluindo MEI, e algumas exigem comprovação de vínculo entre os titulares. Verificamos a elegibilidade antes de montar a cotação.',
    },
    {
      pergunta: 'O que é carência e quando ela não se aplica?',
      resposta: 'Carência é o período entre a contratação e a liberação de cada tipo de atendimento. Em contrato empresarial com número maior de vidas, boa parte costuma ser reduzida ou dispensada. Quem já tem plano ativo pode aproveitar o tempo cumprido por portabilidade, dentro das regras da ANS.',
    },
    {
      pergunta: 'Coparticipação compensa?',
      resposta: 'Depende do uso. A mensalidade é menor e você paga um percentual por consulta e exame realizados. Para quem usa pouco, tende a compensar; para quem faz acompanhamento frequente, costuma sair mais caro no ano. Simulamos os dois cenários com o seu histórico.',
    },
    {
      pergunta: 'Como funciona o reajuste?',
      resposta: 'Há dois: o anual, que em plano individual segue o teto da ANS e em coletivo é negociado com a operadora, e o por mudança de faixa etária, previsto em contrato. No comparativo mostramos o histórico de reajuste de cada operadora dos últimos anos, porque é isso que define o custo no médio prazo.',
    },
    {
      pergunta: 'Vocês ajudam depois que o plano está ativo?',
      resposta: 'Sim, e essa é a parte que mais usamos. Negativa de autorização, dúvida sobre reembolso, inclusão de dependente e segunda via de carteirinha continuam conosco. Você não precisa ligar para a central da operadora.',
    },
  ],

  /* §6.2 do MD — preenchido com EXEMPLO por ser tema de referência */
  legal: {
    exemplo: true,
    versaoPolitica: '1.0',
    atualizadaEm:   '2026-09-04',

    controlador: {
      razaoSocial: 'Vereda Corretora de Seguros Ltda.',
      cnpj:        '55.666.777/0001-88',
      endereco:    'Av. Barão de Tatuí, 620 — Sala 1503, Vila Santana, Sorocaba — SP, CEP 18040-410',
    },

    encarregado: {
      nomeado: true,
      canal:   'privacidade@veredacorretora.com.br',
      observacao: 'Encarregado nomeado, dado o volume de dados de saúde tratados na atividade de corretagem.',
    },

    canalTitular: 'privacidade@veredacorretora.com.br · (15) 3231-9400, de segunda a sexta, das 8h30 às 18h',

    basesLegais: [
      { finalidade: 'Elaboração de cotação a pedido do interessado',        base: 'Procedimentos preliminares de contrato (art. 7º, V)' },
      { finalidade: 'Intermediação e implantação do contrato com a operadora', base: 'Execução de contrato (art. 7º, V)' },
      { finalidade: 'Tratamento de dados de saúde na declaração de saúde',  base: 'Tutela da saúde em procedimento por profissional de saúde (art. 11, II, "f")' },
      { finalidade: 'Guarda de proposta e documentos do contrato',          base: 'Cumprimento de obrigação legal e regulatória (art. 7º, II)' },
      { finalidade: 'Medição de audiência do site',                          base: 'Consentimento (art. 7º, I)' },
    ],

    retencao: [
      { finalidade: 'Proposta de adesão e documentos do contrato', prazo: '5 anos após o encerramento do contrato, por exigência regulatória' },
      { finalidade: 'Declaração de saúde e dados de dependentes',  prazo: '5 anos após o encerramento, em ambiente de acesso restrito' },
      { finalidade: 'Cotação solicitada e não contratada',         prazo: '12 meses a partir do envio' },
      { finalidade: 'Documentos fiscais e de comissionamento',     prazo: '5 anos, por exigência fiscal' },
      { finalidade: 'Registro de consentimento de cookies',        prazo: '5 anos a partir do registro' },
    ],

    compartilhamento: [
      { destinatario: 'Operadoras de plano de saúde cotadas',   finalidade: 'Elaboração da cotação e implantação do contrato escolhido' },
      { destinatario: 'Administradora de benefícios',           finalidade: 'Contratos coletivos por adesão, quando aplicável' },
      { destinatario: 'Receita Federal e órgão regulador',      finalidade: 'Obrigações fiscais e regulatórias da corretagem' },
      { destinatario: 'Provedor de hospedagem do site',         finalidade: 'Armazenamento das páginas e dos formulários' },
    ],

    transferenciaInternacional: 'Há transferência internacional limitada. A ferramenta de medição de audiência e o serviço de e-mail têm servidores nos Estados Unidos, com base em cláusulas contratuais padrão do fornecedor, e alcançam apenas dados de navegação e o e-mail informado no formulário. Declaração de saúde, documentos de dependentes e dados de contrato permanecem em território nacional.',

    cookies: [
      { categoria: 'Necessários', finalidade: 'Manter a sessão, lembrar a escolha do banner de cookies e proteger o formulário de cotação contra envio automatizado.', retencao: '12 meses', base: 'Legítimo interesse', compartilhamento: 'Nenhum' },
      { categoria: 'Analíticos',  finalidade: 'Contar visitas e medir quais tipos de plano são mais procurados.', retencao: '14 meses', base: 'Consentimento', compartilhamento: 'Ferramenta de medição de audiência' },
      { categoria: 'Marketing',   finalidade: 'Medir o resultado de anúncios e evitar repetir o mesmo anúncio para quem já contratou.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Plataformas de anúncio contratadas' },
      { categoria: 'Funcionais',  finalidade: 'Guardar preferências de exibição, como a cidade selecionada na cotação.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Nenhum' },
    ],

    formularios: [
      { nome: 'Formulário de cotação', campos: 'Nome, sobrenome, celular ou WhatsApp, data de nascimento, e-mail, cidade, quantidade de vidas, existência de CNPJ e de plano ativo', finalidade: 'Elaborar o comparativo de planos elegíveis ao perfil informado' },
      { nome: 'Contato institucional', campos: 'Nome, e-mail, telefone e mensagem', finalidade: 'Responder à solicitação e direcionar ao corretor responsável' },
    ],

    medicao: [
      { ferramenta: 'Medição de audiência do site', dado: 'Páginas visitadas, origem do acesso e tipo de dispositivo. Sem coleta de IP completo.' },
    ],
  },
}
