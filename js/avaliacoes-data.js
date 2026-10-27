// ============================================================
// Dados de exemplo da tela "Feedback diário" (avaliação diária, exclusiva da ProWay).
// Estrutura: GRUPOS → INDICADORES (perguntas fechadas), TURMAS_AVALIACAO e
// AVALIACOES (uma por aluno por dia). Escala de resposta fechada:
// Ótimo = 5, Bom = 4, Regular = 3, Ruim = 1 (ver docs/avaliacoes.md).
// ============================================================

const ESCALA = [
  { id: 'otimo', rotulo: 'Ótimo', valor: 5 },
  { id: 'bom', rotulo: 'Bom', valor: 4 },
  { id: 'regular', rotulo: 'Regular', valor: 3 },
  { id: 'ruim', rotulo: 'Ruim', valor: 1 },
];

// Formulário da AVALIAÇÃO DIÁRIA (o que o aluno responde ao fim de cada aula), na ordem
// do formulário atual. A avaliação FINAL (14 perguntas, ao fim do curso) fica fora deste protótipo.
const GRUPOS = [
  {
    id: 'aula', nome: 'Aula de hoje',
    indicadores: [
      { id: 'aula-hoje', nome: 'Como foi a aula de hoje' },
    ],
  },
  {
    id: 'instrutor', nome: 'Instrutor',
    indicadores: [
      { id: 'metodologia', nome: 'Metodologia aplicada' },
      { id: 'postura', nome: 'Postura didática' },
      { id: 'dominio', nome: 'Domínio do conteúdo' },
    ],
  },
  {
    id: 'estrutura', nome: 'Estrutura',
    indicadores: [
      { id: 'ambiente', nome: 'Condições físicas e ambientais', descricao: 'Luz, temperatura, som etc.' },
      { id: 'equipamentos', nome: 'Computadores e equipamentos' },
      { id: 'recepcao', nome: 'Atendimento da recepção' },
    ],
  },
];

const INDICADORES = GRUPOS.flatMap((g) => g.indicadores.map((i) => ({ ...i, grupoId: g.id })));

// Perguntas abertas do formulário diário ("Observações").
const PERGUNTAS_ABERTAS = [
  { id: 'comentario', rotulo: 'Comentários' },
];

// Turnos (períodos) em que as turmas acontecem — ordem de exibição.
const TURNOS = [
  { id: 'matutino', nome: 'Matutino' },
  { id: 'vespertino', nome: 'Vespertino' },
  { id: 'noturno', nome: 'Noturno' },
  { id: 'integral', nome: 'Integral' },
];

// Instrutores (entidade própria — a tela de instrutor agrega as turmas dele).
const INSTRUTORES_AVALIACAO = [
  { id: 'andre', nome: 'André Fontoura Bastos', email: 'andre.bastos@proway.com.br' },
  { id: 'tatiana', nome: 'Tatiana Bezerra Sartori', email: 'tatiana.sartori@proway.com.br' },
  { id: 'otavio', nome: 'Otávio Rangel Delgado', email: 'otavio.delgado@proway.com.br' },
  { id: 'adriana', nome: 'Adriana Vilela Moraes', email: 'adriana.moraes@proway.com.br' },
  { id: 'rogerio', nome: 'Rogério Vidal Trindade', email: 'rogerio.trindade@proway.com.br' },
  { id: 'juliana', nome: 'Juliana Petry Andrade', email: 'juliana.andrade@proway.com.br' },
  { id: 'patricia', nome: 'Patrícia Wolff Baumgarten', email: 'patricia.baumgarten@proway.com.br' },
];

// `cadastroId` liga a turma da semente à turma do cadastro (Turmas, js/turmas-motor.js) — a aba
// Avaliações de turma.html?id= e o pedagógico usam esse vínculo. Código, curso, instrutor, dias, sala e alunos copiam a turma do
// cadastro; `inicio`/`fim` = 1ª e última aula (com reposições) e `semAula` = dias da semana dela sem aula (canceladas):
// só há avaliação em dia de aula real (tests/avaliacoes-semente.test.mjs confere com o cadastro). t7–t12 são edições
// anteriores dos mesmos instrutores, para o histórico de 12 meses do pedagógico; t13–t15 têm aula na semana de 24/08.
// `segmento: 'b2b'` marca turma corporativa (treinamento vendido a empresa) para o corte B2B × B2C dos indicadores
// pedagógicos; sem a marca, o motor decide pela turma real (in company ou maioria das matrículas paga por empresa) e cai em B2C [sup.].
const TURMAS_AVALIACAO = [
  { id: 't1', cadastroId: 'sup10-ht5', codigo: 'HT5 N', nome: 'HTML5', turno: 'noturno', instrutorId: 'andre', diasSemana: [1, 2], inicio: '2026-08-17', fim: '2026-08-24', humorBase: 0.9, instrutor: 'André Fontoura Bastos', periodo: 'Seg/Ter · Noturno', sala: 'PROWAY · Silver', modalidade: 'Híbrido', tipoAvaliacao: 'Diária', alunos: 8 },
  { id: 't2', cadastroId: 'sup09-msq', codigo: 'MSQ N', nome: 'Banco de Dados: MySQL', turno: 'noturno', instrutorId: 'tatiana', diasSemana: [1, 3, 5], inicio: '2026-07-29', fim: '2026-08-14', semAula: ['2026-08-03', '2026-08-07'], humorBase: 0.8, instrutor: 'Tatiana Bezerra Sartori', periodo: 'Seg/Qua/Sex · Noturno', sala: 'PROWAY · Red', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 12 },
  { id: 't3', cadastroId: 'sup08-jva', codigo: 'JVA M', nome: 'Java Fundamentos', turno: 'integral', instrutorId: 'otavio', diasSemana: [6], inicio: '2026-06-20', fim: '2026-07-18', humorBase: 0.88, instrutor: 'Otávio Rangel Delgado', periodo: 'Sábado · Integral', sala: 'PROWAY · Gold', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 13 },
  { id: 't4', cadastroId: 'sup07-pp360', codigo: 'PP360 N', nome: 'Perfil Profissional 360: Gerenciando sua Carreira', turno: 'noturno', instrutorId: 'adriana', diasSemana: [1, 3, 5], inicio: '2026-02-23', fim: '2026-03-09', semAula: ['2026-02-27'], humorBase: 0.93, instrutor: 'Adriana Vilela Moraes', periodo: 'Seg/Qua/Sex · Noturno', sala: 'PROWAY · Blue (Fundos)', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 9 },
  { id: 't5', cadastroId: 'ta240', codigo: 'PBI · WEG', nome: 'Power BI: Análise e Visualização de Dados', segmento: 'b2b', turno: 'vespertino', instrutorId: 'juliana', diasSemana: [1, 3], inicio: '2026-06-22', fim: '2026-07-29', humorBase: 0.86, instrutor: 'Juliana Petry Andrade', periodo: 'Seg/Qua · Vespertino', sala: 'PROWAY · Yellow', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 10 },
  { id: 't6', cadastroId: 'ta168', codigo: 'AD3 M1', nome: 'Análise de Dados em Python', turno: 'matutino', instrutorId: 'rogerio', diasSemana: [6], inicio: '2026-07-18', fim: '2026-09-19', humorBase: 0.87, instrutor: 'Rogério Vidal Trindade', periodo: 'Sábado · Matutino', sala: 'PROWAY · Yellow', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 4 },
  { id: 't7', cadastroId: 'sup08-ht5', codigo: 'HT5 M', nome: 'HTML5', turno: 'integral', instrutorId: 'andre', diasSemana: [6], inicio: '2025-09-20', fim: '2025-10-04', humorBase: 0.89, instrutor: 'André Fontoura Bastos', periodo: 'Sábado · Integral', sala: 'PROWAY · Gold', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 15 },
  { id: 't8', cadastroId: 'ta139', codigo: 'PBI N1', nome: 'Power BI: Análise e Visualização de Dados', turno: 'noturno', instrutorId: 'juliana', diasSemana: [1, 3], inicio: '2025-10-06', fim: '2025-11-12', humorBase: 0.84, instrutor: 'Juliana Petry Andrade', periodo: 'Seg/Qua · Noturno', sala: 'PROWAY · Yellow', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 7 },
  { id: 't9', cadastroId: 'sup07-msq', codigo: 'MSQ N', nome: 'Banco de Dados: MySQL', turno: 'noturno', instrutorId: 'tatiana', diasSemana: [1, 3, 5], inicio: '2025-11-19', fim: '2025-12-03', humorBase: 0.82, instrutor: 'Tatiana Bezerra Sartori', periodo: 'Seg/Qua/Sex · Noturno', sala: 'PROWAY · Blue (Fundos)', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 10 },
  { id: 't10', cadastroId: 'sup08-pjs', codigo: 'PJS M', nome: 'JavaScript e Lógica de Programação', turno: 'integral', instrutorId: 'andre', diasSemana: [6], inicio: '2025-12-13', fim: '2026-03-07', humorBase: 0.9, instrutor: 'André Fontoura Bastos', periodo: 'Sábado · Integral', sala: 'PROWAY · Gold', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 15 },
  { id: 't11', cadastroId: 'sup07-stc', codigo: 'STC N', nome: 'TCC (Desenvolvimento)', turno: 'noturno', instrutorId: 'rogerio', diasSemana: [1, 3, 5], inicio: '2026-03-18', fim: '2026-08-17', humorBase: 0.85, instrutor: 'Rogério Vidal Trindade', periodo: 'Seg/Qua/Sex · Noturno', sala: 'PROWAY · Blue (Fundos)', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 9 },
  { id: 't12', cadastroId: 'ta241', codigo: 'ECS · Cremer', nome: 'Comunicação Eficiente', segmento: 'b2b', turno: 'noturno', instrutorId: 'patricia', diasSemana: [1, 3], inicio: '2026-05-04', fim: '2026-05-13', humorBase: 0.91, instrutor: 'Patrícia Wolff Baumgarten', periodo: 'Seg/Qua · Noturno', sala: 'PROWAY · White', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 14 },
  { id: 't13', cadastroId: 'sup09-py2', codigo: 'PY2 N', nome: 'Python: Banco de Dados e ORM', turno: 'noturno', instrutorId: 'rogerio', diasSemana: [1, 3, 5], inicio: '2026-08-12', fim: '2026-08-28', semAula: ['2026-08-14', '2026-08-19'], humorBase: 0.83, instrutor: 'Rogério Vidal Trindade', periodo: 'Seg/Qua/Sex · Noturno', sala: 'PROWAY · Red', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 11 },
  { id: 't14', cadastroId: 'ta171', codigo: 'EXB T1', nome: 'Excel: Fundamentos', turno: 'vespertino', instrutorId: 'juliana', diasSemana: [1, 3], inicio: '2026-08-17', fim: '2026-08-24', humorBase: 0.88, instrutor: 'Juliana Petry Andrade', periodo: 'Seg/Qua · Vespertino', sala: 'PROWAY · Yellow', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 7 },
  { id: 't15', cadastroId: 'ta206', codigo: 'JSA M1', nome: 'JavaScript Avançado: Desenvolvimento Web', turno: 'matutino', instrutorId: 'andre', diasSemana: [1, 3], inicio: '2026-08-24', fim: '2026-09-07', humorBase: 0.9, instrutor: 'André Fontoura Bastos', periodo: 'Seg/Qua · Matutino', sala: 'PROWAY · Green', modalidade: 'Presencial', tipoAvaliacao: 'Diária', alunos: 5 },
];

const NOMES = [
  'Alexandre Hister', 'Bianca Vermohlen', 'João Vitor Meneghelli', 'William Machado', 'Clarice Morgado de Melo',
  'Davi Schiele Mann', 'Heitor Boaventura Arns', 'João Fernando Schleckmann', 'José Henrique Schneider', 'João Paulo Coelho Fernandes',
  'Larissa Kuhn', 'Mateus Petry', 'Ana Beatriz Tomio', 'Rafael Dalmolin', 'Isabela Fronza', 'Gustavo Kretzer',
  'Letícia Zimmermann', 'Pedro Bittencourt', 'Manuela Odebrecht', 'Thiago Rutsatz', 'Júlia Hoffmann', 'Eduardo Schmitt',
  'Carolina Wippel', 'Felipe Zanella', 'Sofia Reinert', 'Bruno Kohler', 'Marina Duarte', 'Vinícius Sasse',
];

// Comentários por "tom" — usados na geração do campo aberto "Comentários".
const COMENTARIOS = {
  positivo: [
    'Tudo ótimo!',
    'Professor domina muito o assunto e explica com calma.',
    'Aula dinâmica, gostei bastante dos exercícios práticos.',
    'Conteúdo muito relevante para o meu trabalho.',
    'Café top, ambiente agradável e a aula foi excelente.',
    'Explicação clara, consegui acompanhar tudo.',
    'Melhor curso que já fiz na área.',
  ],
  atencao: [
    'Falta melhorar o aplicativo para avaliar a aula. Ele não salva nosso login.',
    'A sala estava muito fria hoje, difícil se concentrar.',
    'O projetor ficou desfocado boa parte da aula.',
    'Poderia ter mais tempo de prática e menos slides.',
    'Os micros do laboratório travam bastante.',
    'O ritmo foi um pouco rápido para quem está começando.',
    'A conexão do Teams caiu duas vezes durante a aula.',
    'Faltou material impresso para acompanhar.',
  ],
  sugestao: [
    'Seria legal ter um resumo em PDF ao final de cada aula.',
    'Sugiro abordar mais exemplos do mercado.',
    'Poderiam gravar as aulas para revisão depois.',
  ],
};

// ---------- Geração determinística das avaliações ----------
// Cada dia recebe um "cenário" (quais turmas tiveram aula e o humor de cada uma),
// para a navegação entre dias mostrar situações diferentes.

function criarRandom(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Perfil de cada turma no dia: "humor" = chance de Ótimo (o resto se divide em Bom/Regular/Ruim);
// "problemas" força humor pior em indicadores específicos; "distribuicao" substitui tudo por
// pesos explícitos Ótimo/Bom/Regular/Ruim (usado para simular dias muito ruins).
const CENARIOS = {
  '2026-08-24': [
    { turmaId: 't1', respondentes: 7, humor: 0.92 },
    { turmaId: 't13', respondentes: 9, humor: 0.78, problemas: { equipamentos: 0.15, ambiente: 0.35 } },
    // Último dia ruim para a EXB T1 → turma em VERMELHO.
    { turmaId: 't14', respondentes: 6, distribuicao: { otimo: 0.05, bom: 0.1, regular: 0.25, ruim: 0.6 } },
    // JSA M1 no 1º dia, com problemas de estrutura e material → turma em LARANJA (Regular).
    { turmaId: 't15', respondentes: 5, distribuicao: { otimo: 0.1, bom: 0.3, regular: 0.4, ruim: 0.2 } },
  ],
};

// Dias anteriores (01/09/2025 a 23/08/2026): gerados nos dias de aula de cada turma (temAula) com humor base +
// problemas esporádicos e um deslocamento de humor por mês (HUMOR_POR_MES [sup.]) que dá forma ao gráfico
// "Satisfação por mês" dos indicadores pedagógicos.
const HUMOR_POR_MES = { '2025-09': -0.04, '2025-10': 0, '2025-11': -0.08, '2025-12': -0.14, '2026-01': 0.02, '2026-02': -0.03, '2026-03': 0.03, '2026-04': -0.06, '2026-05': -0.11, '2026-06': -0.03, '2026-07': 0, '2026-08': 0.02 };
// Dia de aula real da turma do cadastro (diasSemana: 0=Dom … 6=Sáb).
const temAula = (t, iso, dia) => iso >= t.inicio && iso <= t.fim && t.diasSemana.includes(dia) && !t.semAula?.includes(iso);
function gerarCenariosEntre(seed, de, ate) {
  const rnd = criarRandom(seed);
  const inicio = new Date(`${de}T12:00:00`);
  const fim = new Date(`${ate}T12:00:00`);
  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const cenario = [];
    TURMAS_AVALIACAO.forEach((t) => {
      if (!temAula(t, iso, d.getDay())) return;
      if (rnd() < 0.12) return; // aula sem avaliação respondida
      const humor = Math.min(0.97, Math.max(0.55, t.humorBase + (HUMOR_POR_MES[iso.slice(0, 7)] ?? 0) + (rnd() - 0.5) * 0.16));
      const respondentes = Math.max(3, Math.round(t.alunos * (0.6 + rnd() * 0.35)));
      const c = { turmaId: t.id, respondentes, humor };
      if (rnd() < 0.3) {
        const ind = INDICADORES[Math.floor(rnd() * INDICADORES.length)].id;
        c.problemas = { [ind]: 0.1 + rnd() * 0.3 };
      }
      cenario.push(c);
    });
    CENARIOS[iso] = cenario;
  }
}
gerarCenariosEntre(20250901, '2025-09-01', '2026-08-23');

function sortearResposta(rnd, humor, distribuicao = null) {
  const x = rnd();
  if (distribuicao) {
    let acumulado = 0;
    for (const e of ESCALA) {
      acumulado += distribuicao[e.id] ?? 0;
      if (x < acumulado) return e.id;
    }
    return 'ruim';
  }
  if (x < humor) return 'otimo';
  if (x < humor + (1 - humor) * 0.5) return 'bom';
  if (x < humor + (1 - humor) * 0.9) return 'regular';
  return 'ruim';
}

function gerarAvaliacoes() {
  const lista = [];
  let seq = 1;
  Object.entries(CENARIOS).forEach(([data, cenario]) => {
    cenario.forEach((c, ci) => {
      const rnd = criarRandom(Number(data.replace(/-/g, '')) + ci * 7919);
      const turma = TURMAS_AVALIACAO.find((t) => t.id === c.turmaId);
      const inicioNomes = (ci * 5 + Number(data.slice(-2))) % NOMES.length;
      // Nunca mais respostas que alunos (a semana 17–24/08 foi escrita à mão).
      for (let a = 0; a < Math.min(c.respondentes, turma.alunos); a++) {
        const respostas = {};
        INDICADORES.forEach((ind) => {
          const humor = c.problemas?.[ind.id] ?? c.humor;
          // Recepção fica em branco com alguma frequência (aluno online não passa pela recepção).
          if (ind.id === 'recepcao' && rnd() < 0.2) return;
          respostas[ind.id] = sortearResposta(rnd, humor, c.distribuicao ?? null);
        });
        const media = mediaRespostas(respostas);
        const tom = media < 3.6 ? 'atencao' : rnd() < 0.25 ? 'atencao' : rnd() < 0.3 ? 'sugestao' : 'positivo';
        const abertas = {};
        if (rnd() < 0.6) abertas.comentario = escolher(rnd, COMENTARIOS[tom]);
        lista.push({
          id: `av-${seq++}`,
          data,
          turmaId: turma.id,
          aluno: {
            matricula: String(990000 + seq * 37),
            nome: NOMES[(inicioNomes + a) % NOMES.length],
            // Alguns alunos sem telefone cadastrado (como acontece na base real).
            telefone: rnd() < 0.15 ? null : `47 9${String(8000 + Math.floor(rnd() * 1999))}-${String(1000 + Math.floor(rnd() * 8999))}`,
          },
          respostas,
          abertas,
          enviadaEm: `${String(18 + Math.floor(rnd() * 4)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`,
        });
      }
    });
  });
  return lista;
}

function escolher(rnd, arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

function mediaRespostas(respostas) {
  const valores = Object.values(respostas).map((id) => ESCALA.find((e) => e.id === id).valor);
  return valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
}

const AVALIACOES = gerarAvaliacoes();
