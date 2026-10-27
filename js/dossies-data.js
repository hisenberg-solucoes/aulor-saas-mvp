// ============================================================
// Dados do DOSSIÊ DO ALUNO: catálogos fixos, semente dos templates e
// geradores determinísticos da semente de dossiês e de envios.
//
// Um TEMPLATE define a periodicidade (mensal, quinzenal ou um por curso), as
// seções/campos que o professor preenche, os blocos automáticos (frequência,
// conteúdo trabalhado, parecer livre) e onde se aplica (turmas, cursos,
// formações ou padrão). Um DOSSIÊ é (aluno × turma × período) e guarda um
// REGISTRO por professor (respostas por id de campo + parecer).
//
// A SEMENTE de dossiês NÃO é um literal: é gerada em tempo de carga
// (Dossies.carregar → gerarSementeDossies) a partir das turmas, matrículas e
// períodos da semente atual, com um hash simples dos ids (determinístico, sem
// Math.random) — mesmo desenho de js/presencas-data.js. Só as diferenças da
// semente vão para o localStorage.
// ============================================================

const TIPOS_CAMPO_DOSSIE = [
  { id: 'escala', nome: 'Escala 1–5', descricao: 'Cinco níveis, de Insuficiente a Excelente. Consolida pela média.' },
  { id: 'nota', nome: 'Nota 0–10', descricao: 'Número de 0 a 10 com meio ponto. Consolida pela média.' },
  { id: 'sim_nao', nome: 'Sim / Não', descricao: 'Pergunta fechada. Consolida como "N de M professores: sim".' },
  { id: 'opcoes', nome: 'Opções', descricao: 'Uma escolha numa lista que você define (ex.: Apto / Apto com ressalvas / Não apto).' },
  { id: 'texto_curto', nome: 'Texto curto', descricao: 'Uma linha de até 140 caracteres.' },
  { id: 'texto_longo', nome: 'Texto longo', descricao: 'Parágrafo de até 2.000 caracteres.' },
];

// Escala usada pelos campos do tipo 'escala' (valor gravado = inteiro 1–5).
const ESCALA_DOSSIE = [
  { valor: 1, rotulo: 'Insuficiente', curto: 'Insuf.', cor: 'bg-red-500', texto: 'text-red-600 dark:text-red-400' },
  { valor: 2, rotulo: 'Abaixo do esperado', curto: 'Abaixo', cor: 'bg-amber-500', texto: 'text-amber-600 dark:text-amber-400' },
  { valor: 3, rotulo: 'Adequado', curto: 'Adequado', cor: 'bg-sky-500', texto: 'text-sky-700 dark:text-sky-300' },
  { valor: 4, rotulo: 'Bom', curto: 'Bom', cor: 'bg-emerald-500', texto: 'text-emerald-700 dark:text-emerald-400' },
  { valor: 5, rotulo: 'Excelente', curto: 'Excel.', cor: 'bg-emerald-600', texto: 'text-emerald-800 dark:text-emerald-300' },
];

const PERIODICIDADES_DOSSIE = [
  { id: 'mensal', nome: 'Mensal', descricao: 'Um dossiê por mês-calendário em que a turma teve aula.' },
  { id: 'quinzenal', nome: 'Quinzenal', descricao: 'Dois dossiês por mês: dias 1–15 e 16 até o fim do mês.' },
  { id: 'curso', nome: 'Um por curso', descricao: 'Um único dossiê ao fim da turma (fechamento do curso).' },
];

const STATUS_TEMPLATE_DOSSIE = [
  { id: 'ativo', nome: 'Ativo', descricao: 'Em uso: gera dossiês nas turmas onde se aplica.', ponto: 'bg-emerald-500' },
  { id: 'rascunho', nome: 'Rascunho', descricao: 'Em construção — ainda não se aplica a nenhuma turma.', ponto: 'bg-amber-500' },
  { id: 'inativo', nome: 'Inativo', descricao: 'Guardado no histórico; as turmas voltam para o padrão.', ponto: 'bg-slate-400' },
];

// Situação DERIVADA do dossiê (Dossies.situacao): nunca é gravada.
const SITUACOES_DOSSIE = [
  { id: 'pendente', nome: 'Pendente', descricao: 'Nenhum professor preencheu ainda.', ponto: 'bg-slate-400' },
  { id: 'parcial', nome: 'Parcial', descricao: 'Falta algum professor esperado ou há campo obrigatório vazio.', ponto: 'bg-amber-500' },
  { id: 'completo', nome: 'Completo', descricao: 'Todos os professores esperados preencheram.', ponto: 'bg-emerald-500' },
  { id: 'fechado', nome: 'Fechado', descricao: 'Fechado pela secretaria — o professor não edita mais.', ponto: 'bg-petrol-800 dark:bg-sky-400' },
];

const TIPOS_ENVIO_DOSSIE = [
  { id: 'mensal', nome: 'Mensal', descricao: 'Dossiês de um período (mês/quinzena) dos alunos de uma empresa.' },
  { id: 'consolidado', nome: 'Consolidado', descricao: 'Todos os períodos dos alunos de uma empresa (ou de uma formação) num único documento.' },
  { id: 'individual', nome: 'Individual', descricao: 'Dossiê de um aluno específico.' },
];

const TEMPLATES_DOSSIE_SEED = [
  {
    id: 'td1', nome: 'Acompanhamento mensal',
    descricao: 'Dossiê mensal com frequência, conteúdo trabalhado, desempenho técnico, postura e observações. Vale para toda turma sem modelo próprio.',
    status: 'ativo', padrao: true, periodicidade: 'mensal',
    blocos: { frequencia: true, conteudo: true, parecer: true },
    turmaIds: [], cursoIds: [], formacaoIds: [],
    secoes: [
      {
        id: 's1', titulo: 'Desempenho técnico', descricao: 'Como o aluno está absorvendo e aplicando o conteúdo do período.',
        campos: [
          { id: 'c1', tipo: 'escala', rotulo: 'Domínio do conteúdo', descricao: 'Entende e explica os conceitos trabalhados no período.', obrigatorio: true, opcoes: [] },
          { id: 'c2', tipo: 'escala', rotulo: 'Aplicação prática', descricao: 'Resolve os exercícios e projetos usando o que foi ensinado.', obrigatorio: true, opcoes: [] },
          { id: 'c3', tipo: 'nota', rotulo: 'Exercícios e entregas', descricao: 'Nota de 0 a 10 pelo conjunto das atividades do período.', obrigatorio: true, opcoes: [] },
          { id: 'c4', tipo: 'sim_nao', rotulo: 'Entregou as atividades no prazo', descricao: '', obrigatorio: false, opcoes: [] },
        ],
      },
      {
        id: 's2', titulo: 'Postura e participação', descricao: 'Comportamento em sala e com os colegas.',
        campos: [
          { id: 'c5', tipo: 'escala', rotulo: 'Participação em aula', descricao: 'Pergunta, responde e se envolve nas dinâmicas.', obrigatorio: true, opcoes: [] },
          { id: 'c6', tipo: 'escala', rotulo: 'Trabalho em equipe', descricao: 'Colabora nas atividades em grupo.', obrigatorio: false, opcoes: [] },
          { id: 'c7', tipo: 'opcoes', rotulo: 'Autonomia', descricao: 'Quanto precisa do professor para andar.', obrigatorio: true, opcoes: ['Precisa de acompanhamento constante', 'Resolve com orientação', 'Autônomo'] },
        ],
      },
      {
        id: 's3', titulo: 'Observações', descricao: 'Texto livre para a empresa e para a coordenação.',
        campos: [
          { id: 'c8', tipo: 'texto_curto', rotulo: 'Ponto forte do período', descricao: 'Uma linha.', obrigatorio: false, opcoes: [] },
          { id: 'c9', tipo: 'texto_longo', rotulo: 'Pontos a desenvolver e recomendações', descricao: 'O que a empresa pode reforçar no dia a dia.', obrigatorio: false, opcoes: [] },
        ],
      },
    ],
    criadoEm: '2026-08-01', atualizadoEm: '2026-08-01',
  },
  {
    id: 'td2', nome: 'Fechamento do curso',
    descricao: 'Um único dossiê ao fim da turma: nota final, recomendação e destaque do aluno. Vincule aos cursos que fecham com parecer.',
    status: 'ativo', padrao: false, periodicidade: 'curso',
    blocos: { frequencia: true, conteudo: true, parecer: true },
    turmaIds: [], cursoIds: [], formacaoIds: [],
    secoes: [
      {
        id: 's1', titulo: 'Resultado do curso', descricao: '',
        campos: [
          { id: 'c1', tipo: 'nota', rotulo: 'Nota final', descricao: 'Média das avaliações do curso.', obrigatorio: true, opcoes: [] },
          { id: 'c2', tipo: 'opcoes', rotulo: 'Recomendação', descricao: 'Parecer final do professor.', obrigatorio: true, opcoes: ['Apto', 'Apto com ressalvas', 'Não apto'] },
          { id: 'c3', tipo: 'texto_longo', rotulo: 'Destaque do aluno', descricao: 'O que mais chamou atenção ao longo do curso.', obrigatorio: false, opcoes: [] },
        ],
      },
    ],
    criadoEm: '2026-08-01', atualizadoEm: '2026-08-01',
  },
  {
    id: 'td3', nome: 'Quinzenal — bootcamp',
    descricao: 'Acompanhamento curto a cada quinze dias para turmas intensivas. Em construção.',
    status: 'rascunho', padrao: false, periodicidade: 'quinzenal',
    blocos: { frequencia: true, conteudo: false, parecer: true },
    turmaIds: [], cursoIds: [], formacaoIds: [],
    secoes: [
      {
        id: 's1', titulo: 'Ritmo', descricao: '',
        campos: [
          { id: 'c1', tipo: 'escala', rotulo: 'Ritmo de aprendizado', descricao: 'Acompanha o ritmo intensivo da turma.', obrigatorio: true, opcoes: [] },
          { id: 'c2', tipo: 'sim_nao', rotulo: 'Precisa de reforço', descricao: '', obrigatorio: true, opcoes: [] },
          { id: 'c3', tipo: 'texto_curto', rotulo: 'Observação', descricao: '', obrigatorio: false, opcoes: [] },
        ],
      },
    ],
    criadoEm: '2026-08-20', atualizadoEm: '2026-08-20',
  },
];

// Banco de frases da semente (texto_curto, texto_longo e parecer). Genéricas de propósito:
// servem para qualquer área do catálogo.
const FRASES_DOSSIE = {
  fortes: [
    'Raciocínio lógico rápido e boa leitura de enunciados.',
    'Faz perguntas certeiras e ajuda os colegas.',
    'Organização das entregas acima da média.',
    'Muita curiosidade: vai além do que é pedido em aula.',
    'Boa comunicação ao apresentar os exercícios.',
    'Persistente nos problemas mais difíceis.',
    'Atenção aos detalhes nas atividades práticas.',
    'Assimila rápido o que é demonstrado em aula.',
  ],
  desenvolver: [
    'Precisa revisar a base antes de cada aula para acompanhar melhor os exercícios mais longos. Sugiro reservar 30 minutos por semana para os materiais complementares.',
    'Tende a se dispersar nas atividades individuais; rende muito mais em dupla. Vale a empresa reforçar rotinas de foco no dia a dia.',
    'Boa evolução no período, mas ainda entrega no limite do prazo. Recomendo começar os exercícios no mesmo dia da aula.',
    'Domina a prática, mas tem dificuldade em explicar o raciocínio. Praticar apresentações curtas para o time ajudaria bastante.',
    'Evoluiu bem na segunda metade do período. Manter o ritmo e trazer dúvidas do trabalho para a aula.',
    'Faltou em aulas importantes do período; recomendo assistir às gravações e refazer os exercícios antes da próxima etapa.',
  ],
  destaques: [
    'Projeto final bem acima do esperado para o nível da turma.',
    'Melhor evolução da turma entre o início e o fim do curso.',
    'Ajudou colegas com dificuldade sem prejudicar as próprias entregas.',
    'Aplicou o conteúdo em um problema real da empresa já durante o curso.',
  ],
  pareceres: [
    'Aluno participativo e comprometido; acompanhou bem o conteúdo do período.',
    'Boa evolução técnica. Recomendo seguir para a próxima etapa sem ressalvas.',
    'Rende bem nas atividades práticas; precisa de um pouco mais de atenção na parte teórica.',
    'Período regular: cumpriu as entregas, mas participou pouco das discussões em aula.',
    'Destaque da turma neste período — organizado, curioso e colaborativo.',
    'Evoluiu bem apesar de algumas faltas; recomendo reforçar a frequência no próximo período.',
    'Tem potencial acima da média; falta constância nas entregas.',
  ],
};

// Hash FNV-1a simplificado → inteiro 0..(mod-1) (determinístico por texto).
function hashDossie(texto, mod = 100) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h % mod;
}

// Data ISO + n dias (sem fuso).
function somarDiasDossie(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Respostas de um registro da semente para o template (por hash de sem + id do campo).
function respostasSementeDossie(template, sem, { incompleto = false } = {}) {
  const respostas = {};
  let pulouObrigatorio = false;
  (template.secoes ?? []).forEach((s) => (s.campos ?? []).forEach((c) => {
    const h = hashDossie(`${sem}|${c.id}`, 1000);
    // Campo opcional fica vazio em ~15% dos registros.
    if (!c.obrigatorio && h % 100 < 15) return;
    // Registro "salvo pela metade": o primeiro obrigatório fica vazio → dossiê parcial.
    if (incompleto && c.obrigatorio && !pulouObrigatorio) { pulouObrigatorio = true; return; }
    if (c.tipo === 'escala') respostas[c.id] = 3 + (h % 3);                       // 3–5
    else if (c.tipo === 'nota') respostas[c.id] = 6 + ((h % 9) * 0.5);            // 6, 6,5 … 10
    else if (c.tipo === 'sim_nao') respostas[c.id] = h % 100 < 80;
    else if (c.tipo === 'opcoes') respostas[c.id] = c.opcoes[Math.min(c.opcoes.length - 1, Math.floor((h % 100) / 40))] ?? c.opcoes[0]; // pesa as primeiras
    else if (c.tipo === 'texto_curto') respostas[c.id] = FRASES_DOSSIE.fortes[h % FRASES_DOSSIE.fortes.length];
    else if (c.tipo === 'texto_longo') {
      const banco = /destaque/i.test(c.rotulo) ? FRASES_DOSSIE.destaques : FRASES_DOSSIE.desenvolver;
      respostas[c.id] = banco[h % banco.length];
    }
  }));
  return respostas;
}

// Semente de dossiês. `ctx` = Dossies.contexto() (sem `dossies`): turmas, cursos, instrutores,
// templateDe(turma), matriculasDe(turma), cursoDe(id), instrutorDe(id). Para cada turma em andamento
// ou concluída nos últimos 90 dias, com instrutor: nos períodos ENCERRADOS ~70% dos alunos recebem o
// registro do instrutor da turma (~12% deles "pela metade" → parcial) e ~15% um segundo registro de
// outro instrutor do curso (ou da mesma área); dossiês completos com mais de 45 dias ficam fechados em
// ~40%. No período atual só ~20% (para o professor ter o que preencher). Depende de Dossies (períodos).
function gerarSementeDossies(ctx, ref) {
  const lista = [];
  if (!ctx || typeof Dossies === 'undefined' || !Array.isArray(ctx.turmas)) return lista;
  const limite = somarDiasDossie(ref, -90);
  const limiteFechado = somarDiasDossie(ref, -45);
  // Instrutores por área (via turmas × cursos), para o "segundo professor" quando o curso só habilita um.
  const porArea = new Map();
  ctx.turmas.forEach((t) => {
    const area = ctx.cursoDe(t.cursoId)?.areaId;
    if (!area || !t.instrutorId) return;
    if (!porArea.has(area)) porArea.set(area, new Set());
    porArea.get(area).add(t.instrutorId);
  });
  ctx.turmas.forEach((t) => {
    if (t.status === 'cancelada' || !t.instrutorId || !t.inicio || !t.fim) return;
    if (t.inicio > ref || t.fim < limite) return;
    const template = ctx.templateDe(t);
    if (!template) return;
    const periodos = Dossies.periodos(t, template, ref);
    if (!periodos.length) return;
    const linhas = (ctx.matriculasDe(t) ?? []).filter((l) => l.matricula.status === 'matriculado' || l.matricula.status === 'concluido');
    if (!linhas.length) return;
    const curso = ctx.cursoDe(t.cursoId);
    const titular = ctx.instrutorDe(t.instrutorId);
    let outros = (curso?.instrutorIds ?? []).filter((id) => id !== t.instrutorId).map((id) => ctx.instrutorDe(id)).filter(Boolean);
    if (!outros.length && curso?.areaId) outros = [...(porArea.get(curso.areaId) ?? [])].filter((id) => id !== t.instrutorId).sort().map((id) => ctx.instrutorDe(id)).filter(Boolean);
    periodos.forEach((p) => {
      linhas.forEach(({ alunoId }) => {
        const sem = `${t.id}|${alunoId}|${p.id}`;
        const h = hashDossie(sem);
        if (h >= (p.encerrado ? 70 : 20)) return;
        // Preenchido 1–3 dias depois do fim do período (ou até "hoje", no período atual).
        let data = somarDiasDossie(p.fim, 1 + (h % 3));
        if (data > ref) data = ref;
        const incompleto = p.encerrado && hashDossie(`${sem}|parcial`) < 12;
        const registros = [{
          instrutorId: t.instrutorId, instrutorNome: titular?.nome ?? t.instrutorId,
          respostas: respostasSementeDossie(template, `${sem}|${t.instrutorId}`, { incompleto }),
          parecer: template.blocos?.parecer ? FRASES_DOSSIE.pareceres[hashDossie(`${sem}|parecer`, FRASES_DOSSIE.pareceres.length)] : '',
          atualizadoEm: `${data}T${String(18 + (h % 4)).padStart(2, '0')}:${String((h * 7) % 60).padStart(2, '0')}:00`,
        }];
        if (outros.length && p.encerrado && hashDossie(`${sem}|outro`) < 15) {
          const o = outros[hashDossie(`${sem}|quem`, outros.length)];
          registros.push({
            instrutorId: o.id, instrutorNome: o.nome,
            respostas: respostasSementeDossie(template, `${sem}|${o.id}`),
            parecer: template.blocos?.parecer ? FRASES_DOSSIE.pareceres[hashDossie(`${sem}|${o.id}|parecer`, FRASES_DOSSIE.pareceres.length)] : '',
            atualizadoEm: `${somarDiasDossie(data, 1) > ref ? ref : somarDiasDossie(data, 1)}T20:10:00`,
          });
        }
        const fechado = !incompleto && p.encerrado && p.fim < limiteFechado && hashDossie(`${sem}|fechado`) < 40;
        lista.push({
          id: Dossies.chaveDe(t.id, alunoId, p.id), turmaId: t.id, alunoId, periodoId: p.id, templateId: template.id, registros,
          fechadoEm: fechado ? `${somarDiasDossie(p.fim, 7 + (h % 5))}T11:30:00` : null, fechadoPor: fechado ? 'Secretaria' : null,
        });
      });
    });
  });
  return lista;
}

// Semente de envios: 3–5 envios `mensal` do mês anterior a `ref`, um por empresa com alunos que têm
// dossiê naquele mês (empresa = contrato da matrícula > aluno.empresaId, via ctx). Determinístico.
function gerarSementeEnvios(ctx, dossies, ref) {
  const lista = [];
  if (!ctx || typeof Dossies === 'undefined' || !Array.isArray(dossies)) return lista;
  const [ano, mes] = ref.slice(0, 7).split('-').map(Number);
  const anterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, '0')}`;
  const porEmpresa = new Map();
  dossies.filter((d) => d.periodoId === anterior).forEach((d) => {
    const e = Dossies.empresaDoAluno(ctx, d.alunoId, d.turmaId);
    if (!e) return;
    if (!porEmpresa.has(e.id)) porEmpresa.set(e.id, { empresa: e, itens: [] });
    porEmpresa.get(e.id).itens.push({ turmaId: d.turmaId, alunoId: d.alunoId, periodoId: d.periodoId });
  });
  const empresas = [...porEmpresa.values()].sort((a, b) => b.itens.length - a.itens.length || a.empresa.id.localeCompare(b.empresa.id)).slice(0, 5);
  const primeiroDia = `${ref.slice(0, 7)}-01`;
  empresas.forEach(({ empresa, itens }, i) => {
    const dia = somarDiasDossie(primeiroDia, 1 + (i % 3));
    const nome = empresa.nomeFantasia || empresa.razaoSocial || '';
    lista.push({
      id: `env${i + 1}`, em: `${dia > ref ? ref : dia}T${String(9 + i).padStart(2, '0')}:15:00`, tipo: 'mensal',
      empresaId: empresa.id, empresaNome: nome, destinatarios: Dossies.destinatariosDaEmpresa(empresa),
      periodoId: anterior, turmaId: null, formacaoId: null,
      itens, assunto: `Dossiê de ${Dossies.nomeMes(anterior)} — ${nome}`, mensagem: '', enviadoPor: 'Secretaria',
    });
  });
  return lista;
}
