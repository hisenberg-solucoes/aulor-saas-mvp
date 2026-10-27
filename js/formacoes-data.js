// ============================================================
// Dados da tela "Formações". Uma FORMAÇÃO é um conjunto ordenado de
// cursos do catálogo (js/cursos-data.js), de áreas diferentes
// (front-end, back-end, carreira, TCC…), com carga horária total,
// certificado próprio e preço de referência. Os cursos são lidos de
// Cursos.carregar().
//
// Semente: cada EDIÇÃO do Super DEV (formação Full Stack de 450 h da
// ProWay) é uma formação com o próprio código — SUP07 e SUP09 (Python,
// noturno), SUP08 (Java, sábado) e SUP10 (.NET/C#, noturno híbrido).
// ============================================================

const STATUS_FORMACAO = [
  { id: 'ativo', nome: 'Ativa', descricao: 'Pode ser vendida e ter turmas.' },
  { id: 'rascunho', nome: 'Rascunho', descricao: 'Em montagem — não aparece para o comercial.' },
  { id: 'inativo', nome: 'Inativa', descricao: 'Fora do catálogo; alunos em andamento concluem normalmente.' },
];

function formacaoSeed(dados) {
  return {
    resumo: '', descricao: '', publicoAlvo: '', itens: [],
    areaId: 'dev', // área de negócio (js/areas-data.js) — edições do Super DEV são Desenvolvimento
    agenda: Agenda.vazia(), // quando as aulas acontecem (js/agenda.js); as turmas da formação herdam
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: null, parcelasMax: null, publicadoSite: false },
    ...dados,
  };
}

const item = (cursoId, obrigatorio = true) => ({ cursoId, obrigatorio });

// Ids iguais aos de `FORMACOES_CURSO` (js/cursos-data.js), que é o fallback da tela de cursos.
const FORMACOES_SEED = [
  formacaoSeed({
    id: 'sup07', agenda: AGENDAS_EDICAO.sup07, codigo: 'SUP07', nome: 'Super DEV 7 — Full Stack Python', status: 'inativo',
    resumo: 'Edição noturna (Seg/Qua/Sex), 30/06/2025 a 18/08/2026 — concluída.',
    descricao: 'Trilha completa de 450 h para formar desenvolvedores full stack com back-end em Python: alicerces web (HTML5, CSS3, Git e JavaScript com lógica), Angular e TypeScript, pré-TCC, Python (fundamentos, orientação a objetos, MySQL, ORM e API RESTful com Angular), Machine Learning, carreira (Perfil Profissional 360), TCC e aulões temáticos. Edição encerrada em 18/08/2026 com a banca de TCC; inativa para novas vendas.',
    publicoAlvo: 'Iniciantes em programação e profissionais em transição de carreira que querem atuar como desenvolvedor full stack.',
    itens: [item('ht5'), item('css'), item('git'), item('pjs'), item('ajs'), item('stc1'), item('py1'), item('pyo'), item('msq'), item('py2'), item('pya'), item('mlp'), item('pp360'), item('stc'), item('aul', false)],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 8900, parcelasMax: 24, publicadoSite: false },
  }),
  formacaoSeed({
    id: 'sup08', agenda: AGENDAS_EDICAO.sup08, codigo: 'SUP08', nome: 'Super DEV 8 — Full Stack Java', status: 'ativo',
    resumo: 'Edição de sábado (integral), 20/09/2025 a 31/07/2027 — em andamento.',
    descricao: 'Trilha completa de 450 h com back-end em Java: alicerces web (HTML5, CSS3, Git e JavaScript com lógica), Angular e TypeScript, pré-TCC, Java (fundamentos, PostgreSQL, orientação a objetos, JPA/Hibernate e API RESTful com Spring Boot e Angular), carreira, TCC e aulões. Carga horária dos módulos Java espelhada na trilha .NET (24 · 24 · 28 · 28 · 62).',
    publicoAlvo: 'Iniciantes em programação e profissionais em transição de carreira que querem atuar como desenvolvedor full stack.',
    itens: [item('ht5'), item('css'), item('git'), item('pjs'), item('ajs'), item('stc1'), item('jva'), item('ptg'), item('jvo'), item('jv2'), item('jvs'), item('pp360'), item('stc'), item('aul', false)],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 9400, parcelasMax: 24, publicadoSite: true },
  }),
  formacaoSeed({
    id: 'sup09', agenda: AGENDAS_EDICAO.sup09, codigo: 'SUP09', nome: 'Super DEV 9 — Full Stack Python', status: 'ativo',
    resumo: 'Edição noturna (Seg/Qua/Sex), 04/03/2026 a 30/03/2027 — em andamento.',
    descricao: 'Trilha completa de 450 h para formar desenvolvedores full stack com back-end em Python: alicerces web (HTML5, CSS3, Git e JavaScript com lógica), Angular e TypeScript, pré-TCC, Python (fundamentos, orientação a objetos, MySQL, ORM e API RESTful com Angular), Machine Learning, carreira (Perfil Profissional 360), TCC e aulões temáticos.',
    publicoAlvo: 'Iniciantes em programação e profissionais em transição de carreira que querem atuar como desenvolvedor full stack.',
    itens: [item('ht5'), item('css'), item('git'), item('pjs'), item('ajs'), item('stc1'), item('py1'), item('pyo'), item('msq'), item('py2'), item('pya'), item('mlp'), item('pp360'), item('stc'), item('aul', false)],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 9900, parcelasMax: 24, publicadoSite: true },
  }),
  formacaoSeed({
    id: 'sup10', agenda: AGENDAS_EDICAO.sup10, codigo: 'SUP10', nome: 'Super DEV 10 — Full Stack .NET (C#)', status: 'ativo',
    resumo: 'Edição noturna híbrida (Seg/Ter), 17/08/2026 a 29/10/2027 — começou em agosto.',
    descricao: 'Proposta curricular .NET de 450 h em 4 fases intercalando front-end e back-end, com 3 marcos de integração. Fase 1 — Alicerces Web (134 h): HTML5, CSS3, Git e GitHub, JavaScript e Lógica. Fase 2 — Pensamento Back-end (104 h): C# Fundamentos, PostgreSQL, C# OO e EF Core. Fase 3 — Integração (102 h): Angular e TypeScript, C# API RESTful com Angular. Fase 4 — Profissionalização (110 h): Perfil Profissional 360, Pré-TCC, TCC e aulões. Distribuição: Front-end 154 h · Back-end 166 h · Carreira 24 h · TCC 70 h · Complementar 36 h.',
    publicoAlvo: 'Iniciantes em programação e profissionais em transição de carreira que querem atuar como desenvolvedor full stack.',
    itens: [item('ht5'), item('css'), item('git'), item('pjs'), item('csf'), item('ptg'), item('cso'), item('cs2'), item('ajs'), item('csa'), item('pp360'), item('stc1'), item('stc'), item('aul', false)],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 10900, parcelasMax: 24, publicadoSite: true },
  }),
];

// >>> CATALOGO-PROWAY formacoes (gerado por _tools/semente-catalogo/gerar.py — não editar à mão)
FORMACOES_SEED.push(
  formacaoSeed({
    id: 'dg3a', agenda: AGENDAS_EDICAO.dg3a, codigo: 'DG3-01', nome: 'Design Gráfico do Zero 1 — Illustrator e Photoshop', status: 'inativo', areaId: 'design',
    resumo: 'Ter/Qui 18:15–22:15, 03/03/2026 a 07/05/2026 — concluída.',
    descricao: 'Esta formação capacita o(a) aluno(a) a iniciar sua jornada no design gráfico, desenvolvendo habilidades práticas no Adobe Illustrator e Photoshop. Ao longo da formação, o(a) participante aprende desde os fundamentos até recursos mais avançados, construindo uma base sólida para criação de peças visuais com qualidade profissional.',
    publicoAlvo: 'Esta formação é destinado a pessoas que desejam iniciar no design gráfico, mesmo sem experiência prévia, além de estudantes, profissionais em transição de carreira e empreendedores que buscam criar suas próprias peças visuais com qualidade.',
    itens: [item('ill'), item('ila'), item('psb'), item('psa')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 2790, parcelasMax: 12, publicadoSite: false },
    site: 'https://www.proway.com.br/curso/design-grafico-do-zero-illustrator-e-photoshop',
  }),
  formacaoSeed({
    id: 'dg3b', agenda: AGENDAS_EDICAO.dg3b, codigo: 'DG3-02', nome: 'Design Gráfico do Zero 2 — Illustrator e Photoshop', status: 'ativo', areaId: 'design',
    resumo: 'Seg/Qua 18:15–22:15, 03/08/2026 a 07/10/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a iniciar sua jornada no design gráfico, desenvolvendo habilidades práticas no Adobe Illustrator e Photoshop. Ao longo da formação, o(a) participante aprende desde os fundamentos até recursos mais avançados, construindo uma base sólida para criação de peças visuais com qualidade profissional.',
    publicoAlvo: 'Esta formação é destinado a pessoas que desejam iniciar no design gráfico, mesmo sem experiência prévia, além de estudantes, profissionais em transição de carreira e empreendedores que buscam criar suas próprias peças visuais com qualidade.',
    itens: [item('ill'), item('ila'), item('psb'), item('psa')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 2790, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/design-grafico-do-zero-illustrator-e-photoshop',
  }),
  formacaoSeed({
    id: 'dg3c', agenda: AGENDAS_EDICAO.dg3c, codigo: 'DG3-03', nome: 'Design Gráfico do Zero 3 — Illustrator e Photoshop', status: 'ativo', areaId: 'design',
    resumo: 'Sáb 13:00–17:00, 03/10/2026 a 13/02/2027 — próxima turma.',
    descricao: 'Esta formação capacita o(a) aluno(a) a iniciar sua jornada no design gráfico, desenvolvendo habilidades práticas no Adobe Illustrator e Photoshop. Ao longo da formação, o(a) participante aprende desde os fundamentos até recursos mais avançados, construindo uma base sólida para criação de peças visuais com qualidade profissional.',
    publicoAlvo: 'Esta formação é destinado a pessoas que desejam iniciar no design gráfico, mesmo sem experiência prévia, além de estudantes, profissionais em transição de carreira e empreendedores que buscam criar suas próprias peças visuais com qualidade.',
    itens: [item('ill'), item('ila'), item('psb'), item('psa')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 2790, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/design-grafico-do-zero-illustrator-e-photoshop',
  }),
  formacaoSeed({
    id: 'dg2a', agenda: AGENDAS_EDICAO.dg2a, codigo: 'DG2-01', nome: 'Design Gráfico Profissional 1 — Illustrator, Photoshop e InDesign', status: 'ativo', areaId: 'design',
    resumo: 'Sáb 08:00–12:00, 07/02/2026 a 29/08/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a desenvolver projetos de design gráfico com qualidade profissional, utilizando o Adobe Illustrator, Photoshop e InDesign. A formação integra criação vetorial, edição de imagens e diagramação, preparando o(a) participante para atuar com segurança e versatilidade em diferentes demandas do mercado.',
    publicoAlvo: 'Esta formação é destinado a estudantes, profissionais e iniciantes que já possuem conhecimentos básicos em design gráfico e desejam evoluir para um nível profissional, ampliando suas habilidades na criação, edição e diagramação de materiais visuais.',
    itens: [item('ill'), item('ila'), item('psb'), item('psa'), item('idb'), item('ida')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 3990, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/design-grafico-profissional-com-illustrator-photoshop-e-indesign',
  }),
  formacaoSeed({
    id: 'xdpa', agenda: AGENDAS_EDICAO.xdpa, codigo: 'XDP-01', nome: 'Excel Profissional 1 — Da Planilha ao Dashboard', status: 'ativo', areaId: 'produtividade',
    resumo: 'Ter/Qui 08:00–12:00, 11/08/2026 a 06/10/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a superar desafios relacionados à organização, análise e apresentação de informações utilizando Excel no ambiente profissional. Ao longo da jornada, o(a) participante evolui desde os fundamentos da construção de planilhas até o desenvolvimento de dashboards e relatórios visuais, desenvolvendo competências para transformar dados em informações claras, apoiar decisões e aumentar produtividade.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais e pessoas que desejam iniciar ou ampliar seus conhecimentos em Excel, organização de informações, análise de dados e construção de dashboards aplicados às demandas atuais do mercado',
    itens: [item('exb'), item('exi'), item('ex1'), item('exd')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 2390, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/excel-profissional-da-planilha-ao-dashboard',
  }),
  formacaoSeed({
    id: 'expa', agenda: AGENDAS_EDICAO.expa, codigo: 'EXP-01', nome: 'Excel Profissional 1 — Do Zero ao Avançado', status: 'inativo', areaId: 'produtividade',
    resumo: 'Seg/Qua 13:30–17:30, 04/05/2026 a 15/06/2026 — concluída.',
    descricao: 'Esta formação capacita o(a) aluno(a) a superar desafios relacionados à organização, análise e tratamento de informações utilizando Excel no ambiente profissional. Ao longo da jornada, o(a) participante evolui desde os fundamentos das planilhas até recursos avançados de análise e automação, desenvolvendo competências para aumentar produtividade, otimizar rotinas e apoiar tomadas de decisão.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais e pessoas que desejam iniciar ou ampliar seus conhecimentos em Excel, desenvolvendo competências para organização de informações, produtividade e análise aplicada às demandas do mercado.',
    itens: [item('exb'), item('exi'), item('ex1')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 1890, parcelasMax: 12, publicadoSite: false },
    site: 'https://www.proway.com.br/curso/excel-profissional-do-zero-ao-avancado',
  }),
  formacaoSeed({
    id: 'expb', agenda: AGENDAS_EDICAO.expb, codigo: 'EXP-02', nome: 'Excel Profissional 2 — Do Zero ao Avançado', status: 'ativo', areaId: 'produtividade',
    resumo: 'Ter/Qui 18:15–22:15 · online, 01/09/2026 a 13/10/2026 — próxima turma.',
    descricao: 'Esta formação capacita o(a) aluno(a) a superar desafios relacionados à organização, análise e tratamento de informações utilizando Excel no ambiente profissional. Ao longo da jornada, o(a) participante evolui desde os fundamentos das planilhas até recursos avançados de análise e automação, desenvolvendo competências para aumentar produtividade, otimizar rotinas e apoiar tomadas de decisão.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais e pessoas que desejam iniciar ou ampliar seus conhecimentos em Excel, desenvolvendo competências para organização de informações, produtividade e análise aplicada às demandas do mercado.',
    itens: [item('exb'), item('exi'), item('ex1')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 1690, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/excel-profissional-do-zero-ao-avancado',
  }),
  formacaoSeed({
    id: 'cada', agenda: AGENDAS_EDICAO.cada, codigo: 'CAD-01', nome: 'Formação AutoCAD 1 — Do 2D ao 3D', status: 'ativo', areaId: 'engenharia',
    resumo: 'Sáb 08:00–12:00, 06/06/2026 a 29/08/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a desenvolver projetos técnicos digitais utilizando o AutoCAD Autodesk®, explorando desde a criação e documentação de desenhos em 2D até a construção e modelagem tridimensional em 3D. Ao longo da formação, o(a) participante desenvolve domínio progressivo das ferramentas, organização técnica e compreensão espacial aplicadas ao desenvolvimento de projetos com precisão e qualidade.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais e iniciantes das áreas de engenharia, arquitetura, interiores, design, construção civil e demais interessados em desenvolver competências em desenho técnico digital e modelagem tridimensional.',
    itens: [item('aub'), item('aua')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 1990, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/formacao-autocad-autodesk-do-2d-ao-3d',
  }),
  formacaoSeed({
    id: 'rpia', agenda: AGENDAS_EDICAO.rpia, codigo: 'RPI-01', nome: 'REVIT Profissional 1 — Projetos, Famílias e Instalações', status: 'ativo', areaId: 'engenharia',
    resumo: 'Ter/Qui 18:15–22:15, 04/08/2026 a 20/10/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a desenvolver projetos utilizando o ecossistema REVIT Autodesk®, integrando modelagem arquitetônica, criação de famílias paramétricas e desenvolvimento de instalações prediais. Ao longo da formação, o(a) participante evolui da construção e organização de modelos digitais para a especialização em sistemas hidráulicos, elétricos e de climatização, aplicando práticas utilizadas no mercado para criação, coordenação e documentação de projetos.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais e iniciantes das áreas de arquitetura, engenharia, interiores, construção civil e demais interessados em desenvolver competências em modelagem digital, parametrização e desenvolvimento de projetos integrados utilizando o ecossistema REVIT Autodesk®.',
    itens: [item('rvt'), item('rvf'), item('rvh'), item('rve'), item('rvc')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 3290, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/revit-profissional-autodesk-projetos-familias-e-instalacoes',
  }),
  formacaoSeed({
    id: 'md1a', agenda: AGENDAS_EDICAO.md1a, codigo: 'MD1-01', nome: 'Marketing Digital Profissional 1 — Estratégia, Conteúdo e Performance', status: 'ativo', areaId: 'marketing',
    resumo: 'Seg/Qua 18:15–22:15, 01/06/2026 a 28/09/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a planejar, executar e otimizar estratégias de marketing digital com foco em resultados reais e mensuráveis. Ao longo do curso, o(a) participante desenvolve competências em criação de conteúdo, gestão de redes sociais, tráfego pago, análise de dados e otimização de performance, integrando ferramentas e estratégias para fortalecer a presença digital de marcas e negócios.',
    publicoAlvo: 'Este curso é destinado a estudantes, profissionais, empreendedores e iniciantes que desejam atuar com marketing digital ou fortalecer a presença online de seus negócios, desenvolvendo estratégias eficientes de conteúdo, tráfego e performance.',
    itens: [item('mkd'), item('smd'), item('gda'), item('trp'), item('gla'), item('seo')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 4490, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/marketing-digital-profissional-estrategia-conteudo-e-performance',
  }),
  formacaoSeed({
    id: 'avpa', agenda: AGENDAS_EDICAO.avpa, codigo: 'AVP-01', nome: 'Produção Audiovisual Profissional 1 — Premiere e After Effects', status: 'ativo', areaId: 'design',
    resumo: 'Ter/Qui 18:15–22:15, 07/07/2026 a 29/09/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a atuar de forma completa na produção audiovisual, desde o planejamento e captação até a edição, finalização e criação de animações e efeitos visuais. Ao longo do curso, o(a) participante desenvolve domínio técnico em Adobe Premiere e After Effects, integrando processos criativos e técnicos para produzir conteúdos com qualidade profissional.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais, criadores de conteúdo e iniciantes que desejam atuar na área audiovisual, produzindo vídeos com qualidade profissional para redes sociais, projetos institucionais e produções criativas.',
    itens: [item('ppv'), item('fpv'), item('afe'), item('afp'), item('afa')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 3490, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/producao-audiovisual-profissional-premiere-e-after-effects',
  }),
  formacaoSeed({
    id: 'tx2a', agenda: AGENDAS_EDICAO.tx2a, codigo: 'TX2-01', nome: 'Design de Estampas Têxteis 1 — Criação e Finalização', status: 'ativo', areaId: 'moda',
    resumo: 'Seg/Qua 08:00–12:00, 24/08/2026 a 28/10/2026 — em andamento.',
    descricao: 'Esta formação capacita o(a) aluno(a) a criar e finalizar estampas têxteis digitais, integrando fundamentos do design com o uso prático do Illustrator e do Photoshop. Ao longo do curso, o(a) participante desenvolve habilidades para construir padrões, aplicar teoria das cores e preparar artes para produção, conectando criação e viabilidade técnica de forma objetiva.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais de moda, designers e iniciantes que desejam atuar com estamparia têxtil, desenvolvendo estampas com qualidade técnica e estética para aplicação em produtos e coleções.',
    itens: [item('ill'), item('psb'), item('dmd'), item('dma')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 2790, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/design-de-estampas-texteis-criacao-e-finalizacao',
  }),
  formacaoSeed({
    id: 'fpsa', agenda: AGENDAS_EDICAO.fpsa, codigo: 'FPS-01', nome: 'Full Stack Python Start 1', status: 'ativo', areaId: 'dev',
    resumo: 'Seg/Qua/Sex 18:15–22:15, 10/08/2026 a 16/12/2026 — em andamento.',
    descricao: 'A Formação Full Stack Python Start prepara o(a) aluno(a) para ingressar no desenvolvimento de software, construindo uma base sólida em programação, desenvolvimento web e banco de dados. Ao longo da formação, desenvolve competências em lógica de programação, HTML, CSS, MySQL e Python, aprendendo a criar interfaces, integrar dados e desenvolver aplicações web alinhadas às necessidades do mercado de tecnologia.',
    publicoAlvo: 'Indicado para alunos(as), estudantes, profissionais em transição de carreira e entusiastas da tecnologia que desejam iniciar sua trajetória no desenvolvimento de software, adquirindo conhecimentos fundamentais para atuar na criação de aplicações web.',
    itens: [item('zla'), item('ht5'), item('css'), item('msq'), item('py1'), item('py2'), item('py3')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 6900, parcelasMax: 24, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/formacao-full-stack-python-start',
  }),
  formacaoSeed({
    id: 'fdsa', agenda: AGENDAS_EDICAO.fdsa, codigo: 'FDS-01', nome: 'Data Analytics Start 1', status: 'ativo', areaId: 'dev',
    resumo: 'Sáb 08:00–12:00 + Sáb 13:00–19:00, 07/03/2026 a 19/09/2026 — em andamento.',
    descricao: 'A Formação Data Analytics Start desenvolve competências para coletar, organizar, analisar e interpretar dados utilizando ferramentas amplamente adotadas pelo mercado. Ao longo da jornada, o(a) aluno(a) aprende Power BI, SQL, Python, automação de processos e fundamentos de Machine Learning, transformando dados em informações estratégicas para apoiar decisões e gerar valor para organizações.',
    publicoAlvo: 'Indicado para estudantes, profissionais de negócios, analistas, gestores e interessados em desenvolver competências em análise de dados, visualização de informações, automação de processos e inteligência artificial aplicada ao contexto organizacional.',
    itens: [item('pbi'), item('zla'), item('msq'), item('py1'), item('py2'), item('ad3'), item('ad1'), item('ad4')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 7900, parcelasMax: 24, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/formacao-data-analytics-start',
  }),
  formacaoSeed({
    id: 'brpa', agenda: AGENDAS_EDICAO.brpa, codigo: 'BRP-01', nome: 'Branding Profissional 1 — Estratégia e Identidade de Marca', status: 'ativo', areaId: 'gestao',
    resumo: 'Ter/Qui 13:30–17:30, 01/09/2026 a 01/10/2026 — próxima turma.',
    descricao: 'Esta formação capacita o(a) aluno(a) a desenvolver marcas de forma completa, integrando estratégia e identidade visual. Ao longo do curso, o(a) participante aprende a definir posicionamento, público e proposta de valor, além de criar identidades visuais consistentes e aplicáveis ao mercado, conectando pensamento estratégico e execução criativa.',
    publicoAlvo: 'Esta formação é destinada a estudantes, profissionais de design, marketing, comunicação, empreendedores e iniciantes que desejam criar ou fortalecer marcas, desenvolvendo tanto o pensamento estratégico quanto a construção visual.',
    itens: [item('bre'), item('brv')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 1490, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/branding-profissional-estrategia-e-identidade-de-marca',
  }),
  formacaoSeed({
    id: 'md1b', agenda: AGENDAS_EDICAO.md1b, codigo: 'MD1-02', nome: 'Marketing Digital Profissional 2 — Estratégia, Conteúdo e Performance', status: 'ativo', areaId: 'marketing',
    resumo: 'Ter/Qui 18:15–22:15, 06/10/2026 a 04/02/2027 — próxima turma.',
    descricao: 'Esta formação capacita o(a) aluno(a) a planejar, executar e otimizar estratégias de marketing digital com foco em resultados reais e mensuráveis. Ao longo do curso, o(a) participante desenvolve competências em criação de conteúdo, gestão de redes sociais, tráfego pago, análise de dados e otimização de performance, integrando ferramentas e estratégias para fortalecer a presença digital de marcas e negócios.',
    publicoAlvo: 'Este curso é destinado a estudantes, profissionais, empreendedores e iniciantes que desejam atuar com marketing digital ou fortalecer a presença online de seus negócios, desenvolvendo estratégias eficientes de conteúdo, tráfego e performance.',
    itens: [item('mkd'), item('smd'), item('gda'), item('trp'), item('gla'), item('seo')],
    certificado: { emite: true, exigeTodosObrigatorios: true, minimoOptativos: 0 },
    comercial: { precoReferencia: 4490, parcelasMax: 12, publicadoSite: true },
    site: 'https://www.proway.com.br/curso/marketing-digital-profissional-estrategia-conteudo-e-performance',
  }),
);
// <<< CATALOGO-PROWAY formacoes
