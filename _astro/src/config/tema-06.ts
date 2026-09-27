/* ─────────────────────────────────────────────────────────────────────────
   Tema 06 — Hidroponto Institucional
   Nicho: serviço técnico de emergência (caça vazamento, desentupidora,
   elétrica, refrigeração, manutenção predial).

   Conteúdo 100% fictício. Empresa, endereço, telefone, CNPJ, números e
   depoimentos são de exemplo. Nenhum texto foi copiado da referência
   visual usada na composição.
   ───────────────────────────────────────────────────────────────────────── */

export const site = {
  nome:        'Hidroponto',
  nomeLongo:   'Hidroponto Caça Vazamentos e Encanador',
  nomeBreve:   'Hidroponto',
  slogan:      'Acha o ponto exato antes de quebrar',
  dominio:     'https://hidroponto.com.br',

  /* Formulário de contato e WhatsApp.
     painelUrl: URL https do painel do cliente (ex.: 'https://painel.seudominio.com.br').
       Vazio na prévia local — o formulário mostra um aviso e não envia. É preenchido
       na publicação (fase2-site-astro ETAPA 6.2 / novo-cliente.sh); nunca inventar.
     whatsappFlutuante: botão fixo no canto da tela; só aparece se nap.whatsapp existir.
     whatsappMensagem: texto inicial do botão flutuante; vazio = mensagem neutra padrão. */
  painelUrl:         '',
  whatsappFlutuante: true,
  whatsappMensagem:  '',
  cnpj:        '44.555.666/0001-77',
  anoFundacao: 2012,

  descricao:   'Detecção de vazamento sem quebrar, desentupimento e reparo hidráulico em Goiânia e região, com laudo técnico e plantão de emergência.',
  schemaTipo:  ['Plumber', 'LocalBusiness'],
  funcionamento: [
    { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], abre: '07:00', fecha: '19:00' },
    { dias: ['sab'], abre: '08:00', fecha: '13:00' },
  ],
  areaAtendimento: [
    'Goiânia — Setor Bueno', 'Setor Oeste', 'Jardim Goiás', 'Setor Marista', 'Alto da Glória',
    'Setor Sul', 'Campinas', 'Vila Nova', 'Aparecida de Goiânia', 'Senador Canedo',
    'Trindade', 'Goianira', 'Anápolis', 'Hidrolândia',
  ],

  nap: {
    logradouro:  'Rua T-27, 890',
    complemento: 'Sala 4',
    bairro:      'Setor Bueno',
    cidade:      'Goiânia',
    uf:          'GO',
    cep:         '74215-060',
    enderecoFormatado: 'Rua T-27, 890 — Sala 4, Setor Bueno, Goiânia — GO · CEP 74215-060',
    telefone:    '(62) 3241-8800',
    telefone2:   '(62) 3241-8801',
    whatsapp:    '5562992418800',
    email:       'contato@hidroponto.com.br',
  },

  mapaSrc: 'https://www.google.com/maps?q=' +
           encodeURIComponent('Setor Bueno, Goiânia - GO') +
           '&output=embed',

  horarios: [
    { dia: 'Segunda a Sexta', hora: '7h às 19h' },
    { dia: 'Sábado',          hora: '8h às 13h' },
    { dia: 'Emergência',      hora: 'Plantão até 22h, todos os dias' },
  ],

  redes: [
    { nome: 'Instagram', href: 'https://instagram.com/hidroponto' },
    { nome: 'Facebook',  href: 'https://facebook.com/hidroponto' },
    { nome: 'YouTube',   href: 'https://youtube.com/@hidroponto' },
  ],

  nav: [
    { label: 'Home',            href: '/tema-06' },
    { label: 'Quem somos',      href: '/tema-06/sobre' },
    { label: 'Serviços',        href: '/tema-06/servicos' },
    { label: 'Blog',            href: '/tema-06/blog' },
    { label: 'Contato',         href: '/tema-06/contato' },
  ],

  navFooterColunas: [
    {
      titulo: 'Serviços',
      itens: [
        { label: 'Caça Vazamento',        href: '/tema-06/caca-vazamento' },
        { label: 'Detecção de Infiltração', href: '/tema-06/deteccao-de-infiltracao' },
        { label: 'Vazamento em Piscina',  href: '/tema-06/vazamento-em-piscina' },
        { label: 'Desentupimento',        href: '/tema-06/desentupimento' },
        { label: 'Reparo Hidráulico',     href: '/tema-06/reparo-hidraulico' },
        { label: 'Videoinspeção',         href: '/tema-06/videoinspecao' },
      ],
    },
    {
      titulo: 'A empresa',
      itens: [
        { label: 'Quem somos',        href: '/tema-06/sobre' },
        { label: 'Como funciona',     href: '/tema-06/caca-vazamento' },
        { label: 'Blog',              href: '/tema-06/blog' },
        { label: 'Onde atendemos',    href: '/tema-06/contato' },
      ],
    },
    {
      titulo: 'Legal',
      itens: [
        { label: 'Política de Privacidade', href: '/tema-06/politica-de-privacidade' },
        { label: 'Termos de Uso',           href: '/tema-06/termos-de-uso' },
      ],
    },
  ],

  /* Faixa de selos abaixo do hero */
  selos: [
    { icone: 'lupa',     titulo: 'Detecção sem quebra',      descricao: 'Termografia, geofone e gás traçador localizam o ponto antes de encostar na parede.' },
    { icone: 'usuario',  titulo: 'Técnico com registro',     descricao: 'Equipe própria, uniformizada e com responsável técnico identificado na ordem de serviço.' },
    { icone: 'relogio',  titulo: 'Atendimento no mesmo dia', descricao: 'Emergência com plantão até as 22h. Vazamento não espera pela agenda comercial.' },
  ],

  /* Diferenciais — 6 cards */
  diferenciais: [
    { icone: 'lupa',        titulo: 'Tecnologia de detecção',  descricao: 'Câmera termográfica, geofone eletrônico e gás traçador. Cada equipamento serve a um tipo de vazamento diferente.' },
    { icone: 'escudo',      titulo: 'Menos quebra, menos obra', descricao: 'Localizar o ponto exato reduz o reparo a um trecho pequeno, em vez de abrir metros de piso ou parede.' },
    { icone: 'calculadora', titulo: 'Conta de água conferida',  descricao: 'Comparamos o consumo faturado com o real medido no hidrômetro para dimensionar a perda antes do serviço.' },
    { icone: 'documento',   titulo: 'Laudo técnico ao final',   descricao: 'Relatório com fotos, ponto localizado e método usado. Serve para seguro, condomínio e negociação com a construtora.' },
    { icone: 'engrenagem',  titulo: 'Reparo pela mesma equipe', descricao: 'Quem encontra é quem conserta. Não repassamos o reparo para terceiro que não viu o diagnóstico.' },
    { icone: 'check',       titulo: 'Orçamento antes de agir',  descricao: 'Valor fechado apresentado depois da inspeção e antes de qualquer intervenção. Sem surpresa no fim.' },
  ],

  /* Passo a passo — o processo de atendimento */
  passos: [
    { numero: '01', titulo: 'Averiguar',  descricao: 'Fechamos o registro geral, lemos o hidrômetro e isolamos os trechos para confirmar que existe perda e onde ela pode estar.' },
    { numero: '02', titulo: 'Localizar',  descricao: 'Termografia, geofone e gás traçador entram conforme o tipo de tubulação e o piso. É a etapa que evita quebra desnecessária.' },
    { numero: '03', titulo: 'Orçar',      descricao: 'Com o ponto identificado, apresentamos o reparo necessário e o valor fechado, com foto do que foi encontrado.' },
    { numero: '04', titulo: 'Reparar',    descricao: 'Abertura mínima, troca do trecho comprometido, teste de estanqueidade e acabamento do ponto aberto.' },
  ],

  /* Bloco Numeros */
  numeros: [
    { valor: '+13',    rotulo: 'anos de campo',              detalhe: 'Atendendo Goiânia e região desde 2012' },
    { valor: '+7.400', rotulo: 'atendimentos realizados',    detalhe: 'Residencial, comercial e condomínio' },
    { valor: '92%',    rotulo: 'localizados sem quebra',     detalhe: 'Ponto identificado antes de abrir piso ou parede' },
    { valor: '3h',     rotulo: 'tempo médio de chegada',     detalhe: 'Em chamados de emergência dentro de Goiânia' },
  ],
  numerosNota: 'Indicadores da operação apurados em janeiro de 2026. Tempo de chegada e taxa de localização variam conforme região, tipo de imóvel e complexidade do caso.',

  /* Regiões atendidas */

  regioesBullets: [
    'Atendimento em Goiânia e região metropolitana',
    'Plantão de emergência até as 22h, inclusive fim de semana',
    'Equipe própria, uniformizada e com responsável técnico',
    'Sem taxa de deslocamento dentro de Goiânia',
  ],

  /* Galeria de trabalhos — bloco Infraestrutura */
  trabalhos: [
    {
      src: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&h=420&fit=crop&auto=format',
      alt: 'Tubulação exposta durante reparo hidráulico',
      legenda: 'Reparo pontual em ramal de água fria, com abertura mínima no piso',
    },
    {
      src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=420&fit=crop&auto=format',
      alt: 'Técnico trabalhando em instalação hidráulica',
      legenda: 'Substituição de trecho comprometido em coluna de prédio residencial',
    },
    {
      src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=420&fit=crop&auto=format',
      alt: 'Inspeção com equipamento de medição',
      legenda: 'Inspeção termográfica em parede de banheiro, antes de qualquer quebra',
    },
    {
      src: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=420&fit=crop&auto=format',
      alt: 'Equipe técnica em atendimento',
      legenda: 'Teste de estanqueidade após o reparo, com registro em laudo',
    },
  ],

  /* Diretrizes — accordion do bloco Faq:com-imagem na home */
  diretrizes: [
    {
      pergunta: 'Tempo de especialidade',
      resposta: 'Treze anos atendendo só hidráulica e detecção. Não fazemos elétrica, pintura nem reforma — quando o cliente precisa disso, indicamos alguém em vez de improvisar.',
    },
    {
      pergunta: 'Experiência e agilidade',
      resposta: 'Chamado de emergência dentro de Goiânia costuma ser atendido no mesmo dia. A equipe sai com o equipamento completo, o que evita a segunda visita só para levar o aparelho certo.',
    },
    {
      pergunta: 'Tecnologia',
      resposta: 'Câmera termográfica para diferença de temperatura, geofone eletrônico para o som do escape e gás traçador para tubulação vazia. Nenhum deles resolve sozinho: o método é escolhido depois de ver o imóvel.',
    },
    {
      pergunta: 'Sustentabilidade',
      resposta: 'Um vazamento pequeno e contínuo desperdiça mais água por mês do que a maioria das famílias imagina. Localizar cedo economiza água e evita o dano estrutural que vem depois.',
    },
    {
      pergunta: 'Honestidade e transparência',
      resposta: 'O orçamento sai depois da inspeção, com foto do que foi encontrado. Quando o problema não é vazamento — e às vezes não é — dizemos isso e cobramos só a visita técnica.',
    },
  ],

  avaliacao: { nota: '4,9', total: '+210', fonte: 'avaliações no Google' },

  tags: [
    { label: '#CaçaVazamento',     href: '/tema-06/caca-vazamento' },
    { label: '#Infiltração',       href: '/tema-06/deteccao-de-infiltracao' },
    { label: '#VazamentoEmPiscina', href: '/tema-06/vazamento-em-piscina' },
    { label: '#Desentupimento',    href: '/tema-06/desentupimento' },
    { label: '#Videoinspeção',     href: '/tema-06/videoinspecao' },
    { label: '#ContaDeÁguaAlta',   href: '/tema-06/conta-de-agua-alta-o-que-verificar' },
    { label: '#Goiânia',           href: '/tema-06/contato' },
    { label: '#SemQuebrar',        href: '/tema-06/caca-vazamento' },
  ],

  buscasFrequentes: [
    { label: 'caça vazamento goiânia',              href: '/tema-06/caca-vazamento' },
    { label: 'encanador 24 horas goiânia',          href: '/tema-06/contato' },
    { label: 'detectar vazamento sem quebrar piso', href: '/tema-06/caca-vazamento' },
    { label: 'conta de água veio muito alta',       href: '/tema-06/conta-de-agua-alta-o-que-verificar' },
    { label: 'infiltração na parede do vizinho',    href: '/tema-06/deteccao-de-infiltracao' },
    { label: 'vazamento em piscina de alvenaria',   href: '/tema-06/vazamento-em-piscina' },
    { label: 'desentupimento de esgoto goiânia',    href: '/tema-06/desentupimento' },
    { label: 'laudo de vazamento para seguro',      href: '/tema-06/videoinspecao' },
    { label: 'caça vazamento aparecida de goiânia', href: '/tema-06/contato' },
    { label: 'mancha de umidade no teto',           href: '/tema-06/mancha-de-umidade-o-que-significa' },
  ],

  faq: [
    {
      pergunta: 'Vocês precisam quebrar a parede para achar o vazamento?',
      resposta: 'Na maior parte dos casos, não. A detecção é feita com termografia, geofone e gás traçador, que apontam o ponto antes de qualquer abertura. Quando a quebra é inevitável, ela fica restrita ao trecho identificado — normalmente alguns centímetros, e não metros de piso.',
    },
    {
      pergunta: 'Quanto tempo demora para localizar?',
      resposta: 'Um imóvel residencial comum leva de uma a três horas entre isolamento dos trechos e localização. Casos com piso aquecido, laje impermeabilizada ou tubulação muito antiga podem exigir uma segunda visita, e avisamos isso antes de começar.',
    },
    {
      pergunta: 'Como sei que tenho vazamento se não vejo água?',
      resposta: 'Os sinais mais comuns são conta de água subindo sem mudança de hábito, hidrômetro girando com tudo fechado, mancha de umidade que reaparece depois de pintar, azulejo solto e mofo recorrente no mesmo canto. Qualquer um deles já justifica uma inspeção.',
    },
    {
      pergunta: 'Vocês emitem laudo técnico?',
      resposta: 'Sim. O laudo traz fotos, o ponto localizado, o método usado e o reparo executado. É o documento que costuma ser pedido por seguradora, síndico e em discussão com construtora dentro do prazo de garantia.',
    },
    {
      pergunta: 'Atendem condomínio e imóvel comercial?',
      resposta: 'Sim. Em condomínio a inspeção costuma envolver mais de uma unidade, porque a origem raramente está onde a mancha aparece. Nesses casos alinhamos o acesso com a administração antes de agendar.',
    },
    {
      pergunta: 'E se não encontrarem nada?',
      resposta: 'Acontece, e é uma informação útil. Às vezes a umidade vem de condensação, de falha de impermeabilização ou de infiltração pela fachada, não de vazamento. Nesses casos explicamos a origem provável, cobramos apenas a visita técnica e indicamos o profissional certo.',
    },
  ],

  /* §6.2 do MD — preenchido com EXEMPLO por ser tema de referência */
  legal: {
    exemplo: true,
    versaoPolitica: '1.0',
    atualizadaEm:   '2026-09-01',

    controlador: {
      razaoSocial: 'Hidroponto Serviços Hidráulicos Ltda.',
      cnpj:        '44.555.666/0001-77',
      endereco:    'Rua T-27, 890 — Sala 4, Setor Bueno, Goiânia — GO, CEP 74215-060',
    },

    encarregado: {
      nomeado: false,
      canal:   'privacidade@hidroponto.com.br',
      observacao: 'Agente de pequeno porte — canal de atendimento ao titular em vez de encarregado nomeado, conforme Resolução CD/ANPD nº 2/2022.',
    },

    canalTitular: 'privacidade@hidroponto.com.br · (62) 3241-8800, de segunda a sexta, das 7h às 19h',

    basesLegais: [
      { finalidade: 'Agendamento e execução do serviço contratado',     base: 'Execução de contrato (art. 7º, V)' },
      { finalidade: 'Emissão de nota fiscal e laudo técnico',           base: 'Cumprimento de obrigação legal (art. 7º, II)' },
      { finalidade: 'Resposta a pedido de orçamento pelo site',         base: 'Procedimentos preliminares de contrato (art. 7º, V)' },
      { finalidade: 'Registro fotográfico do serviço para o laudo',     base: 'Execução de contrato (art. 7º, V)' },
      { finalidade: 'Medição de audiência do site',                     base: 'Consentimento (art. 7º, I)' },
    ],

    retencao: [
      { finalidade: 'Cadastro de cliente e histórico de atendimento', prazo: '5 anos após o último serviço prestado' },
      { finalidade: 'Laudo técnico e registro fotográfico',           prazo: '5 anos, por poder ser requisitado em seguro ou perícia' },
      { finalidade: 'Documentos fiscais',                             prazo: '5 anos, por exigência fiscal' },
      { finalidade: 'Pedido de orçamento não convertido',             prazo: '12 meses a partir do contato' },
      { finalidade: 'Registro de consentimento de cookies',           prazo: '5 anos a partir do registro' },
    ],

    compartilhamento: [
      { destinatario: 'Prefeitura de Goiânia e Receita Federal', finalidade: 'Emissão de nota fiscal de serviço' },
      { destinatario: 'Seguradora ou administradora de condomínio', finalidade: 'Somente quando o próprio cliente solicita o envio do laudo' },
      { destinatario: 'Provedor de hospedagem do site',           finalidade: 'Armazenamento das páginas e dos formulários' },
      { destinatario: 'Operadora de meio de pagamento',           finalidade: 'Processamento de pagamento por cartão ou Pix' },
    ],

    transferenciaInternacional: 'Há transferência internacional limitada. A ferramenta de medição de audiência e o serviço de mensagem têm servidores nos Estados Unidos, com base em cláusulas contratuais padrão do fornecedor, e alcançam apenas dados de navegação e o contato informado no formulário. Endereço do imóvel atendido, laudo técnico e fotos do serviço permanecem em território nacional.',

    cookies: [
      { categoria: 'Necessários', finalidade: 'Manter a sessão, lembrar a escolha do banner de cookies e proteger o formulário contra envio automatizado.', retencao: '12 meses', base: 'Legítimo interesse', compartilhamento: 'Nenhum' },
      { categoria: 'Analíticos',  finalidade: 'Contar visitas e medir quais serviços são mais procurados.', retencao: '14 meses', base: 'Consentimento', compartilhamento: 'Ferramenta de medição de audiência' },
      { categoria: 'Marketing',   finalidade: 'Medir o resultado de anúncios de emergência e evitar repetir o mesmo anúncio para quem já é cliente.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Plataformas de anúncio contratadas' },
      { categoria: 'Funcionais',  finalidade: 'Guardar preferências de exibição, como a região selecionada.', retencao: '6 meses', base: 'Consentimento', compartilhamento: 'Nenhum' },
    ],

    formularios: [
      { nome: 'Pedido de orçamento', campos: 'Nome, telefone ou WhatsApp, bairro, tipo de imóvel e descrição do problema', finalidade: 'Dimensionar o atendimento e agendar a visita técnica' },
      { nome: 'Chamado de emergência', campos: 'Nome, telefone e endereço do imóvel', finalidade: 'Despachar a equipe de plantão para o local' },
    ],

    medicao: [
      { ferramenta: 'Medição de audiência do site', dado: 'Páginas visitadas, origem do acesso e tipo de dispositivo. Sem coleta de IP completo.' },
    ],

    /* Termos de Uso (obrigatório) — lido por <ConteudoLegal documento="termos">.
       Campo vazio bloqueia a publicação, igual aos campos da política. */
    termos: {
      naoSubstitui:  'O conteúdo deste site tem finalidade informativa e não substitui vistoria técnica, laudo ou orçamento sobre um caso concreto. A prestação de serviços é regida pelo orçamento e pelo contrato aceitos por cada cliente, que prevalecem em caso de divergência com estes termos.',
      foro:          { cidade: 'Goiânia', uf: 'GO' },
      vigenciaDesde: '2026-09-01',
    },
  },
}
