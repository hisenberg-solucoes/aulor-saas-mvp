// ============================================================
// Motor do Aulor MVP: UMA base de dados demonstrativa para a escola inteira
// + as regras de negócio que mantêm os módulos coerentes entre si.
//
//   matrícula ─► parcelas (contas a receber) ─► recebimento / inadimplência
//       │
//       └─► turma (lista de alunos) ─► chamada (frequência) ─► conclusão ─► certificado
//
// Persistência local (localStorage) só para a demonstração: NÃO é isolamento
// de escolas, segurança nem multi-tenancy. "Restaurar" gera a semente de novo
// a partir da data de hoje (js/semente.js).
//
// Toda mutação valida e devolve { erros: [{ campo, mensagem }] } ou o registro.
// Depende de Agenda (js/agenda.js), Documento (js/documento.js) e Semente.
// ============================================================

const Aulor = (() => {
  const CHAVE = 'aulor-mvp-dados-v3'; // v3: vários modelos de certificado

  // ---------- Datas e números ----------

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dataDe = (s) => new Date(`${s}T12:00:00`);
  let hojeFixo = null;
  const hoje = () => hojeFixo ?? iso(new Date());
  const ehData = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? '')) && !Number.isNaN(dataDe(s).getTime());
  const somarDias = (s, n) => { const d = dataDe(s); d.setDate(d.getDate() + n); return iso(d); };
  const diasEntre = (a, b) => Math.round((dataDe(b) - dataDe(a)) / 86400000);
  // Mesmo dia `n` meses depois, limitado ao último dia do mês.
  function somarMeses(s, n, dia = Number(s.slice(8, 10))) {
    const [y, m] = s.split('-').map(Number);
    const d = new Date(y, m - 1 + n, 1);
    const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(Math.min(dia, ultimo))}`;
  }
  const arred = (v) => Math.round((Number(v) || 0) * 100) / 100;
  const texto = (v) => String(v ?? '').trim();
  const digitos = (v) => String(v ?? '').replace(/\D/g, '');
  const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const horas = (inicio, fim) => {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fim.split(':').map(Number);
    return Math.max(0, (hf * 60 + mf - hi * 60 - mi) / 60);
  };
  const ehEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ---------- Catálogos fixos ----------

  const MODALIDADES = [
    { id: 'presencial', nome: 'Presencial' },
    { id: 'online', nome: 'Online ao vivo' },
    { id: 'hibrido', nome: 'Híbrido' },
  ];
  const FORMAS_PAGAMENTO = [
    { id: 'pix', nome: 'Pix' },
    { id: 'boleto', nome: 'Boleto' },
    { id: 'cartao_credito', nome: 'Cartão de crédito' },
    { id: 'cartao_debito', nome: 'Cartão de débito' },
    { id: 'dinheiro', nome: 'Dinheiro' },
    { id: 'transferencia', nome: 'Transferência' },
  ];
  const CATEGORIAS = {
    receber: ['Mensalidades de cursos', 'Taxa de matrícula', 'Material didático', 'Outras receitas'],
    pagar: ['Aluguel e condomínio', 'Professores', 'Salários e encargos', 'Energia, água e internet', 'Marketing', 'Material e insumos', 'Serviços (contabilidade, sistemas)', 'Impostos e taxas', 'Outras despesas'],
  };
  const SITUACAO_TURMA = {
    planejada: { nome: 'A iniciar', tom: 'info' },
    em_andamento: { nome: 'Em andamento', tom: 'ok' },
    a_concluir: { nome: 'Aguardando conclusão', tom: 'atencao' },
    concluida: { nome: 'Concluída', tom: 'neutro' },
    cancelada: { nome: 'Cancelada', tom: 'neutro' },
  };
  const SITUACAO_LANCAMENTO = {
    a_vencer: { nome: 'A vencer', tom: 'info' },
    vencido: { nome: 'Vencido', tom: 'perigo' },
    pago: { nome: 'Pago', tom: 'ok' },
    cancelado: { nome: 'Cancelado', tom: 'neutro' },
  };
  const STATUS_MATRICULA = {
    ativa: { nome: 'Cursando', tom: 'ok' },
    concluida: { nome: 'Concluída', tom: 'neutro' },
    cancelada: { nome: 'Cancelada', tom: 'neutro' },
  };
  const PRESENCA = { P: 'Presente', F: 'Falta', J: 'Falta justificada' };

  // Modelos de certificado: textos aceitam {{variável}} e **negrito**.
  const VARIAVEIS_CERTIFICADO = [
    ['aluno', 'Nome do aluno'], ['cpf', 'CPF do aluno'], ['curso', 'Curso'], ['modalidade', 'Modalidade'], ['cargaHoraria', 'Carga horária'],
    ['inicio', 'Início'], ['fim', 'Término'], ['frequencia', 'Frequência final'], ['professor', 'Professor'], ['turma', 'Código da turma'],
    ['matricula', 'Código da matrícula'], ['cidade', 'Cidade da escola'], ['dataEmissao', 'Data de emissão'], ['codigoValidacao', 'Código de validação'],
  ];
  const STATUS_MODELO = {
    ativo: { nome: 'Ativo', tom: 'ok', descricao: 'Aparece no cadastro dos cursos e emite certificados.' },
    rascunho: { nome: 'Rascunho', tom: 'atencao', descricao: 'Em construção: ainda não aparece para os cursos.' },
    inativo: { nome: 'Inativo', tom: 'neutro', descricao: 'Guardado. Cursos que o escolheram emitem com o padrão.' },
  };
  const OPCOES_MODELO = {
    orientacao: [
      { id: 'paisagem', nome: 'Paisagem', descricao: 'A4 deitado, o formato clássico.' },
      { id: 'retrato', nome: 'Retrato', descricao: 'A4 em pé, sóbrio e com mais espaço no verso.' },
    ],
    fonte: [
      { id: 'moderna', nome: 'Moderna', descricao: 'A mesma fonte do sistema.' },
      { id: 'classica', nome: 'Clássica', descricao: 'Serifada, com ar de diploma.' },
    ],
    moldura: [
      { id: 'dupla', nome: 'Dupla', descricao: 'Borda larga na cor principal e filete na de destaque.' },
      { id: 'simples', nome: 'Filete', descricao: 'Um filete fino na cor principal.' },
      { id: 'lateral', nome: 'Faixa lateral', descricao: 'Faixa vertical na cor de destaque.' },
      { id: 'nenhuma', nome: 'Sem moldura', descricao: 'Para papel já impresso com arte.' },
    ],
  };

  // ---------- Persistência ----------

  let db = null;

  function carregar() {
    if (db) return db;
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) { db = JSON.parse(salvo); return db; }
    } catch (_) { /* volta para a semente */ }
    db = Semente.gerar(hoje());
    salvar();
    ['aulor-mvp-dados-v1', 'aulor-mvp-dados-v2'].forEach((k) => localStorage.removeItem(k)); // formatos anteriores
    return db;
  }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (e) { console.error('Não foi possível salvar os dados da demonstração', e); }
  }
  function restaurar() {
    db = Semente.gerar(hoje());
    salvar();
  }
  // Testes: injeta uma base e uma data fixa.
  function usar(dados, dataHoje = null) { db = dados; hojeFixo = dataHoje; }

  const D = () => carregar();
  const novoId = (prefixo, lista) => {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  };
  const porId = (lista, id) => lista.find((x) => x.id === id) ?? null;

  // ---------- Consultas básicas ----------

  const escola = () => D().escola;
  const config = () => D().config;
  const assinatura = () => D().assinatura;
  const alunos = () => D().alunos;
  const cursos = () => D().cursos;
  const turmas = () => D().turmas;
  const professores = () => D().professores;
  const matriculas = () => D().matriculas;
  const lancamentos = () => D().lancamentos;
  const certificados = () => D().certificados;
  const modelosCertificado = () => D().modelosCertificado;
  const aluno = (id) => porId(alunos(), id);
  const curso = (id) => porId(cursos(), id);
  const turma = (id) => porId(turmas(), id);
  const professor = (id) => porId(professores(), id);
  const matricula = (id) => porId(matriculas(), id);
  const lancamento = (id) => porId(lancamentos(), id);
  const certificado = (id) => porId(certificados(), id);
  const modeloCertificado = (id) => porId(modelosCertificado(), id);
  const aula = (id) => D().aulas.find((a) => a.id === id) ?? null;

  const aulasDaTurma = (turmaId) => D().aulas.filter((a) => a.turmaId === turmaId).sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
  const matriculasDaTurma = (turmaId, { incluirCanceladas = false } = {}) => matriculas()
    .filter((m) => m.turmaId === turmaId && (incluirCanceladas || m.status !== 'cancelada'))
    .sort((a, b) => aluno(a.alunoId).nome.localeCompare(aluno(b.alunoId).nome, 'pt-BR'));
  const matriculasDoAluno = (alunoId) => matriculas().filter((m) => m.alunoId === alunoId).sort((a, b) => b.data.localeCompare(a.data));
  const parcelasDaMatricula = (matriculaId) => lancamentos().filter((l) => l.matriculaId === matriculaId).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const lancamentosDoAluno = (alunoId) => lancamentos().filter((l) => l.alunoId === alunoId).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const certificadoDaMatricula = (matriculaId) => certificados().find((c) => c.matriculaId === matriculaId && c.status === 'valido') ?? null;
  const turmasDoProfessor = (professorId) => turmas().filter((t) => t.professorId === professorId);

  function idade(nascimento, ref = hoje()) {
    if (!ehData(nascimento)) return null;
    const [y, m, d] = nascimento.split('-').map(Number);
    const [ry, rm, rd] = ref.split('-').map(Number);
    return ry - y - (rm < m || (rm === m && rd < d) ? 1 : 0);
  }

  // ---------- Turmas e aulas ----------

  // Aulas a partir de `inicio` pela agenda até completar a carga horária do curso.
  function gerarDatasAulas(agenda, inicio, cargaHoraria) {
    const datas = Agenda.datasAulas(agenda, inicio, somarDias(inicio, 730));
    const lista = [];
    let total = 0;
    for (const d of datas) {
      if (total >= cargaHoraria - 0.01) break;
      lista.push(d);
      total += horas(d.inicio, d.fim);
    }
    return lista.map((d, i) => ({ ...d, n: i + 1 }));
  }

  function situacaoTurma(t, ref = hoje()) {
    if (t.status === 'concluida' || t.status === 'cancelada') return t.status;
    if (t.inicio > ref) return 'planejada';
    const validas = aulasDaTurma(t.id).filter((a) => a.status !== 'cancelada');
    const ultima = validas.length ? validas[validas.length - 1].data : t.fim;
    return ultima < ref ? 'a_concluir' : 'em_andamento';
  }

  function ocupacao(t) {
    const ocupadas = matriculas().filter((m) => m.turmaId === t.id && m.status !== 'cancelada').length;
    return { ocupadas, capacidade: t.capacidade, livres: Math.max(0, t.capacidade - ocupadas), lotada: ocupadas >= t.capacidade };
  }

  // ---------- Risco de não fechar (regra do protótipo original, RN11) ----------
  // Turma a iniciar que ainda não tem o mínimo de alunos. Mínimo: o da turma ou,
  // sem ele, metade das vagas. Crítico: começa em até 15 dias; alerta: até 45;
  // atenção: mais longe, mas com ocupação abaixo de 30%.
  const RISCO = {
    critico: { id: 'critico', nome: 'Crítico', ordem: 0, dias: 15, tom: 'perigo' },
    alerta: { id: 'alerta', nome: 'Alerta', ordem: 1, dias: 45, tom: 'atencao' },
    atencao: { id: 'atencao', nome: 'Atenção', ordem: 2, ocupacaoMax: 30, tom: 'neutro' },
  };
  const minimoAlunos = (t) => t.minimoAlunos || Math.max(1, Math.ceil(t.capacidade / 2));

  function riscoTurma(t, ref = hoje()) {
    if (situacaoTurma(t, ref) !== 'planejada') return null;
    const minimo = minimoAlunos(t);
    const { ocupadas } = ocupacao(t);
    const faltam = Math.max(0, minimo - ocupadas);
    if (!faltam) return null;
    const diasParaInicio = diasEntre(ref, t.inicio);
    const ocupacaoPct = Math.round((ocupadas / t.capacidade) * 100);
    const nivel = diasParaInicio <= RISCO.critico.dias ? 'critico' : diasParaInicio <= RISCO.alerta.dias ? 'alerta' : ocupacaoPct < RISCO.atencao.ocupacaoMax ? 'atencao' : null;
    if (!nivel) return null;
    return { turma: t, nivel, minimo, ocupadas, faltam, diasParaInicio, ocupacaoPct, valorEmJogo: arred(faltam * curso(t.cursoId).valor) };
  }

  const turmasEmRisco = (ref = hoje()) => turmas().map((t) => riscoTurma(t, ref)).filter(Boolean)
    .sort((a, b) => RISCO[a.nivel].ordem - RISCO[b.nivel].ordem || a.diasParaInicio - b.diasParaInicio);

  function progressoTurma(t) {
    const aulas = aulasDaTurma(t.id).filter((a) => a.status !== 'cancelada');
    const realizadas = aulas.filter((a) => a.status === 'realizada').length;
    return { total: aulas.length, realizadas, percentual: aulas.length ? Math.round((realizadas / aulas.length) * 100) : 0 };
  }

  // Quem deve estar na chamada desta aula: matrículas não canceladas feitas até a data da aula.
  const participantes = (a) => matriculasDaTurma(a.turmaId).filter((m) => m.data <= a.data);

  const chamadaPendente = (a, ref = hoje()) => a.status === 'prevista' && a.data < ref;

  function chamadasPendentes(ref = hoje()) {
    const ativas = new Set(turmas().filter((t) => !['concluida', 'cancelada'].includes(t.status)).map((t) => t.id));
    return D().aulas.filter((a) => ativas.has(a.turmaId) && chamadaPendente(a, ref)).sort((a, b) => a.data.localeCompare(b.data));
  }

  const aulasDoDia = (data = hoje()) => D().aulas
    .filter((a) => a.data === data && a.status !== 'cancelada' && turma(a.turmaId)?.status !== 'cancelada')
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  function proximasAulas(ref = hoje(), limite = 8) {
    return D().aulas.filter((a) => a.data > ref && a.status === 'prevista').sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio)).slice(0, limite);
  }

  // ---------- Frequência ----------

  // Percentual = presenças (+ justificadas, se a escola configurar) ÷ aulas com chamada registrada
  // desde a data da matrícula. Aula sem chamada não conta (aparece como pendência à parte).
  function frequencia(m) {
    const cfg = config().academico;
    const doAluno = aulasDaTurma(m.turmaId).filter((a) => a.data >= m.data && a.status !== 'cancelada');
    const realizadas = doAluno.filter((a) => a.status === 'realizada');
    let presentes = 0;
    let justificadas = 0;
    let faltas = 0;
    realizadas.forEach((a) => {
      const v = a.presencas?.[m.id];
      if (v === 'P') presentes += 1;
      else if (v === 'J') justificadas += 1;
      else faltas += 1;
    });
    const validas = presentes + (cfg.justificadaContaPresenca ? justificadas : 0);
    const total = realizadas.length;
    const restantes = m.status === 'ativa' ? doAluno.filter((a) => a.status === 'prevista').length : 0;
    const percentual = total ? Math.round((validas / total) * 100) : null;
    const melhorCaso = total + restantes ? Math.round(((validas + restantes) / (total + restantes)) * 100) : null;
    const minimo = cfg.frequenciaMinima;
    return {
      total, presentes, justificadas, faltas, validas, restantes, percentual, minimo,
      abaixo: percentual != null && percentual < minimo,
      semChance: melhorCaso != null && melhorCaso < minimo,
    };
  }

  // Matrículas cursando abaixo do mínimo (com pelo menos 3 chamadas, para não alarmar no começo).
  function alunosEmRisco() {
    return matriculas()
      .filter((m) => m.status === 'ativa')
      .map((m) => ({ m, f: frequencia(m) }))
      .filter(({ f }) => f.total >= 3 && f.abaixo)
      .sort((a, b) => a.f.percentual - b.f.percentual);
  }

  // ---------- Financeiro ----------

  function situacaoLancamento(l, ref = hoje()) {
    if (l.status === 'pago' || l.status === 'cancelado') return l.status;
    return l.vencimento < ref ? 'vencido' : 'a_vencer';
  }
  const diasAtraso = (l, ref = hoje()) => (situacaoLancamento(l, ref) === 'vencido' ? diasEntre(l.vencimento, ref) : 0);

  // Multa + juros pró-rata pela configuração da escola (sugestão no recebimento; editável).
  function encargos(l, dataPagamento = hoje()) {
    const cfg = config().financeiro;
    if (l.tipo !== 'receber' || dataPagamento <= l.vencimento) return { multa: 0, juros: 0, total: arred(l.valor) };
    const dias = diasEntre(l.vencimento, dataPagamento);
    const multa = arred((l.valor * cfg.multaPercentual) / 100);
    const juros = arred((l.valor * cfg.jurosMensalPercentual * dias) / 3000);
    return { multa, juros, total: arred(l.valor + multa + juros), dias };
  }

  // Valor dividido em parcelas iguais; centavos que sobram vão para a 1ª. Vencimentos mensais no mesmo dia.
  function gerarParcelas(valor, n, primeiroVencimento) {
    const qtd = Math.max(1, Number(n) || 1);
    const total = arred(valor);
    const cada = Math.floor((total * 100) / qtd) / 100;
    const resto = arred(total - cada * qtd);
    const dia = Number(primeiroVencimento.slice(8, 10));
    return Array.from({ length: qtd }, (_, i) => ({
      n: i + 1,
      de: qtd,
      vencimento: somarMeses(primeiroVencimento, i, dia),
      valor: arred(i === 0 ? cada + resto : cada),
    }));
  }

  function inadimplentes(ref = hoje()) {
    const porAluno = new Map();
    lancamentos().forEach((l) => {
      if (l.tipo !== 'receber' || !l.alunoId || situacaoLancamento(l, ref) !== 'vencido') return;
      const item = porAluno.get(l.alunoId) ?? { aluno: aluno(l.alunoId), parcelas: [], total: 0, maiorAtraso: 0 };
      item.parcelas.push(l);
      item.total = arred(item.total + l.valor);
      item.maiorAtraso = Math.max(item.maiorAtraso, diasAtraso(l, ref));
      porAluno.set(l.alunoId, item);
    });
    return [...porAluno.values()].sort((a, b) => b.total - a.total);
  }

  const estaInadimplente = (alunoId, ref = hoje()) => lancamentos().some((l) => l.alunoId === alunoId && l.tipo === 'receber' && situacaoLancamento(l, ref) === 'vencido');

  // Totais de um mês (AAAA-MM): previsto/recebido/aberto a receber e a pagar.
  function resumoMes(mes, ref = hoje()) {
    const r = { receberPrevisto: 0, recebido: 0, receberAberto: 0, vencido: 0, pagarPrevisto: 0, pago: 0, pagarAberto: 0 };
    lancamentos().forEach((l) => {
      if (l.status === 'cancelado') return;
      const s = situacaoLancamento(l, ref);
      const doMes = l.vencimento.startsWith(mes);
      if (l.tipo === 'receber') {
        if (doMes) r.receberPrevisto += l.valor;
        if (l.status === 'pago' && l.pagoEm?.startsWith(mes)) r.recebido += l.valorPago ?? l.valor;
        if (doMes && s !== 'pago') r.receberAberto += l.valor;
        if (s === 'vencido') r.vencido += l.valor;
      } else {
        if (doMes) r.pagarPrevisto += l.valor;
        if (l.status === 'pago' && l.pagoEm?.startsWith(mes)) r.pago += l.valorPago ?? l.valor;
        if (s !== 'pago' && (doMes || s === 'vencido')) r.pagarAberto += l.valor;
      }
    });
    Object.keys(r).forEach((k) => { r[k] = arred(r[k]); });
    return r;
  }

  // ---------- Situação do aluno ----------

  function situacaoAluno(a) {
    const ms = matriculasDoAluno(a.id);
    if (ms.some((m) => m.status === 'ativa')) return { id: 'ativo', nome: 'Ativo', tom: 'ok' };
    if (ms.some((m) => m.status === 'concluida')) return { id: 'concluiu', nome: 'Concluiu curso', tom: 'neutro' };
    if (ms.length) return { id: 'cancelado', nome: 'Sem curso ativo', tom: 'neutro' };
    return { id: 'sem_matricula', nome: 'Sem matrícula', tom: 'atencao' };
  }
  const alunosAtivos = () => alunos().filter((a) => matriculas().some((m) => m.alunoId === a.id && m.status === 'ativa'));

  // ---------- Aluno: dados, responsáveis, endereço e pagamento ----------
  // Como no protótipo original: o aluno tem vários responsáveis, cada um com
  // papéis (legal = assina pelo menor; financeiro = quem paga, só um por aluno;
  // emergência = recebe avisos). Simplificação: o responsável fica dentro do
  // aluno (no original é um cadastro próprio, compartilhado entre irmãos).

  const ORIGENS = ['Indicação', 'Instagram', 'Google', 'WhatsApp', 'Passou na frente', 'Empresa ou parceria', 'Outro'];
  const PAPEIS_RESPONSAVEL = [
    { id: 'legal', nome: 'Legal', descricao: 'Responde e assina pelo aluno menor de idade.' },
    { id: 'financeiro', nome: 'Financeiro', descricao: 'Quem paga. Só um por aluno.' },
    { id: 'emergencia', nome: 'Emergência', descricao: 'Recebe avisos de falta e ocorrências.' },
  ];
  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

  const ehMenor = (a) => (idade(a.nascimento) ?? 99) < 18;
  const responsaveisDe = (a) => a.responsaveis ?? [];
  const responsavelFinanceiro = (a) => responsaveisDe(a).find((r) => r.papeis.includes('financeiro')) ?? null;
  // Com quem a escola fala sobre o aluno menor (frequência, ocorrências).
  const responsavelPrincipal = (a) => ['legal', 'financeiro', 'emergencia'].map((p) => responsaveisDe(a).find((r) => r.papeis.includes(p))).find(Boolean) ?? null;
  // Para quem vai a cobrança: o responsável financeiro, se é ele quem paga; senão o aluno.
  const contatoCobranca = (a) => (a.cobranca?.pagador === 'responsavel' && responsavelFinanceiro(a)) || a;

  // `campo` traduz o nome do dado para o nome do campo no formulário (ex.: nome → respNome).
  function validarPessoa(p, campo = (k) => k) {
    const erros = [];
    if (texto(p.nome).split(/\s+/).filter(Boolean).length < 2) erros.push({ campo: campo('nome'), mensagem: 'Informe nome e sobrenome.' });
    const tel = digitos(p.telefone);
    if (tel.length < 10 || tel.length > 11) erros.push({ campo: campo('telefone'), mensagem: 'Celular com DDD (10 ou 11 dígitos).' });
    if (digitos(p.cpf) && Documento.erroCpf(digitos(p.cpf))) erros.push({ campo: campo('cpf'), mensagem: Documento.erroCpf(digitos(p.cpf)) });
    if (texto(p.email) && !ehEmail(texto(p.email))) erros.push({ campo: campo('email'), mensagem: 'E-mail inválido.' });
    return erros;
  }
  const respRapido = (d) => ({ nome: d.respNome, cpf: d.respCpf, telefone: d.respTelefone, parentesco: d.respParentesco });

  function validarAluno(d, idAtual = null) {
    const erros = [];
    const nome = texto(d.nome);
    if (nome.split(/\s+/).filter(Boolean).length < 2) erros.push({ campo: 'nome', mensagem: 'Informe nome e sobrenome.' });
    const cpf = digitos(d.cpf);
    if (!cpf) erros.push({ campo: 'cpf', mensagem: 'Informe o CPF (sai no certificado).' });
    else if (Documento.erroCpf(cpf)) erros.push({ campo: 'cpf', mensagem: Documento.erroCpf(cpf) });
    else if (alunos().some((a) => a.id !== idAtual && a.cpf === cpf)) erros.push({ campo: 'cpf', mensagem: 'Já existe um aluno com este CPF.' });
    const tel = digitos(d.telefone);
    if (tel.length < 10 || tel.length > 11) erros.push({ campo: 'telefone', mensagem: 'Celular com DDD (10 ou 11 dígitos).' });
    if (texto(d.email) && !ehEmail(texto(d.email))) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    if (d.nascimento && (!ehData(d.nascimento) || d.nascimento > hoje())) erros.push({ campo: 'nascimento', mensagem: 'Data de nascimento inválida.' });
    if (d.origem && !ORIGENS.includes(d.origem)) erros.push({ campo: 'origem', mensagem: 'Escolha uma opção da lista.' });
    const menor = idade(d.nascimento) != null && idade(d.nascimento) < 18;
    if (idAtual) {
      // Na edição, os responsáveis ficam na aba própria; só confere a regra do menor.
      if (menor && !responsaveisDe(aluno(idAtual)).some((r) => r.papeis.includes('legal'))) erros.push({ campo: 'nascimento', mensagem: 'Aluno menor de idade: cadastre antes um responsável legal na aba Responsáveis.' });
      return erros;
    }
    const temResp = texto(d.respNome) || digitos(d.respTelefone) || digitos(d.respCpf);
    if (menor || temResp) {
      const re = validarPessoa(respRapido(d), (k) => `resp${k[0].toUpperCase()}${k.slice(1)}`);
      if (menor && !texto(d.respNome)) re[0].mensagem = 'Aluno menor de idade: informe o responsável.';
      erros.push(...re);
    }
    return erros;
  }

  const dadosAluno = (d) => ({
    nome: texto(d.nome),
    cpf: digitos(d.cpf),
    rg: texto(d.rg),
    nascimento: d.nascimento || null,
    email: texto(d.email).toLowerCase(),
    telefone: digitos(d.telefone),
    origem: d.origem || '',
    observacoes: texto(d.observacoes),
  });
  const novaPessoa = (p) => ({ nome: texto(p.nome), cpf: digitos(p.cpf), telefone: digitos(p.telefone), email: texto(p.email).toLowerCase(), parentesco: texto(p.parentesco) });
  const ENDERECO_VAZIO = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

  // Cadastro rápido: o responsável informado já entra como legal e financeiro, e é ele quem paga.
  function criarAluno(d, usuario = '') {
    const erros = validarAluno(d);
    if (erros.length) return { erros };
    const resp = texto(d.respNome) ? [{ id: 'r1', ...novaPessoa(respRapido(d)), papeis: ['legal', 'financeiro'] }] : [];
    const a = {
      id: novoId('al', alunos()), ...dadosAluno(d), responsaveis: resp, endereco: { ...ENDERECO_VAZIO },
      cobranca: { pagador: resp.length ? 'responsavel' : 'aluno', formaPreferida: '', diaVencimento: null },
      criadoEm: hoje(), criadoPor: usuario,
    };
    alunos().push(a);
    salvar();
    return { aluno: a };
  }

  function atualizarAluno(id, d) {
    const a = aluno(id);
    if (!a) return { erros: [{ campo: 'nome', mensagem: 'Aluno não encontrado.' }] };
    const erros = validarAluno(d, id);
    if (erros.length) return { erros };
    Object.assign(a, dadosAluno(d));
    salvar();
    return { aluno: a };
  }

  // Inclui (sem respId) ou altera um responsável. Marcar "financeiro" tira o papel de quem tinha.
  function salvarResponsavel(alunoId, d, respId = null) {
    const a = aluno(alunoId);
    if (!a) return { erros: [{ campo: 'nome', mensagem: 'Aluno não encontrado.' }] };
    const papeis = PAPEIS_RESPONSAVEL.map((p) => p.id).filter((p) => d[`papel_${p}`]);
    const erros = validarPessoa(d);
    if (!papeis.length) erros.push({ campo: 'papeis', mensagem: 'Escolha ao menos um papel.' });
    const lista = responsaveisDe(a);
    const atual = respId ? lista.find((r) => r.id === respId) : null;
    if (respId && !atual) erros.push({ campo: 'nome', mensagem: 'Responsável não encontrado.' });
    if (atual && ehMenor(a) && atual.papeis.includes('legal') && !papeis.includes('legal') && !lista.some((r) => r !== atual && r.papeis.includes('legal'))) {
      erros.push({ campo: 'papeis', mensagem: 'Aluno menor de idade precisa de um responsável legal.' });
    }
    if (atual && atual.papeis.includes('financeiro') && !papeis.includes('financeiro') && a.cobranca?.pagador === 'responsavel') {
      erros.push({ campo: 'papeis', mensagem: 'É quem paga as matrículas. Marque outro responsável como financeiro ou mude "Quem paga" em Endereço e pagamento.' });
    }
    if (erros.length) return { erros };
    if (papeis.includes('financeiro')) lista.forEach((r) => { if (r !== atual) r.papeis = r.papeis.filter((p) => p !== 'financeiro'); });
    const dados = { ...novaPessoa(d), papeis };
    if (atual) Object.assign(atual, dados);
    else lista.push({ id: novoId('r', lista), ...dados });
    a.responsaveis = lista;
    salvar();
    return { aluno: a };
  }

  function removerResponsavel(alunoId, respId) {
    const a = aluno(alunoId);
    const r = responsaveisDe(a).find((x) => x.id === respId);
    if (!r) return { erro: 'Responsável não encontrado.' };
    if (ehMenor(a) && r.papeis.includes('legal') && !responsaveisDe(a).some((x) => x !== r && x.papeis.includes('legal'))) return { erro: 'Aluno menor de idade precisa de um responsável legal. Cadastre outro antes de remover.' };
    if (r.papeis.includes('financeiro') && a.cobranca?.pagador === 'responsavel') return { erro: `${r.nome.split(' ')[0]} é quem paga. Marque outro responsável como financeiro ou mude "Quem paga" em Endereço e pagamento.` };
    a.responsaveis = responsaveisDe(a).filter((x) => x !== r);
    salvar();
    return { aluno: a };
  }

  function atualizarEnderecoPagamento(alunoId, d) {
    const a = aluno(alunoId);
    if (!a) return { erros: [{ campo: 'cep', mensagem: 'Aluno não encontrado.' }] };
    const erros = [];
    const cep = digitos(d.cep);
    if (cep && cep.length !== 8) erros.push({ campo: 'cep', mensagem: 'CEP com 8 dígitos.' });
    const uf = texto(d.uf).toUpperCase();
    if (uf && !UFS.includes(uf)) erros.push({ campo: 'uf', mensagem: 'UF inválida.' });
    if (!['aluno', 'responsavel'].includes(d.pagador)) erros.push({ campo: 'pagador', mensagem: 'Escolha quem paga.' });
    else if (d.pagador === 'responsavel' && !responsavelFinanceiro(a)) erros.push({ campo: 'pagador', mensagem: 'Cadastre um responsável financeiro na aba Responsáveis.' });
    if (d.formaPreferida && !FORMAS_PAGAMENTO.some((f) => f.id === d.formaPreferida)) erros.push({ campo: 'formaPreferida', mensagem: 'Forma inválida.' });
    const dia = d.diaVencimento === '' || d.diaVencimento == null ? null : Number(d.diaVencimento);
    if (dia != null && (!Number.isInteger(dia) || dia < 1 || dia > 28)) erros.push({ campo: 'diaVencimento', mensagem: 'Dia entre 1 e 28.' });
    if (erros.length) return { erros };
    a.endereco = { cep, logradouro: texto(d.logradouro), numero: texto(d.numero), complemento: texto(d.complemento), bairro: texto(d.bairro), cidade: texto(d.cidade), uf };
    a.cobranca = { pagador: d.pagador, formaPreferida: d.formaPreferida || '', diaVencimento: dia };
    salvar();
    return { aluno: a };
  }

  function validarCurso(d, idAtual = null) {
    const erros = [];
    const nome = texto(d.nome);
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Dê um nome ao curso.' });
    else if (cursos().some((c) => c.id !== idAtual && norm(c.nome) === norm(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe um curso com este nome.' });
    const codigo = texto(d.codigo).toUpperCase();
    if (!/^[A-Z0-9-]{2,10}$/.test(codigo)) erros.push({ campo: 'codigo', mensagem: 'Sigla de 2 a 10 letras/números (ex.: EXC).' });
    else if (cursos().some((c) => c.id !== idAtual && c.codigo === codigo)) erros.push({ campo: 'codigo', mensagem: 'Sigla já usada por outro curso.' });
    const carga = Number(d.cargaHoraria);
    if (!(carga > 0) || carga > 2000) erros.push({ campo: 'cargaHoraria', mensagem: 'Carga horária em horas (maior que zero).' });
    if (!MODALIDADES.some((m) => m.id === d.modalidade)) erros.push({ campo: 'modalidade', mensagem: 'Escolha a modalidade.' });
    if (d.modeloCertificadoId && !modeloCertificado(d.modeloCertificadoId)) erros.push({ campo: 'modeloCertificadoId', mensagem: 'Modelo de certificado não encontrado.' });
    const valor = Number(d.valor);
    if (!(valor >= 0)) erros.push({ campo: 'valor', mensagem: 'Valor de referência inválido.' });
    const modulos = (d.modulos ?? []).filter((m) => texto(m.nome) || Number(m.cargaHoraria));
    if (modulos.some((m) => !texto(m.nome) || !(Number(m.cargaHoraria) > 0))) erros.push({ campo: 'modulos', mensagem: 'Cada módulo precisa de nome e horas.' });
    else if (modulos.length) {
      const soma = modulos.reduce((s, m) => s + Number(m.cargaHoraria), 0);
      if (carga > 0 && Math.abs(soma - carga) > 0.01) erros.push({ campo: 'modulos', mensagem: `A soma dos módulos (${soma} h) precisa bater com a carga horária (${carga} h).` });
    }
    return erros;
  }

  function dadosCurso(d) {
    return {
      nome: texto(d.nome),
      codigo: texto(d.codigo).toUpperCase(),
      area: texto(d.area),
      descricao: texto(d.descricao),
      cargaHoraria: Number(d.cargaHoraria),
      modalidade: d.modalidade,
      valor: arred(d.valor),
      parcelasSugeridas: Math.max(1, Math.min(config().financeiro.parcelasMaximas, Number(d.parcelasSugeridas) || 1)),
      modulos: (d.modulos ?? []).filter((m) => texto(m.nome)).map((m) => ({ nome: texto(m.nome), cargaHoraria: Number(m.cargaHoraria) })),
      modeloCertificadoId: d.modeloCertificadoId || null,
    };
  }

  function criarCurso(d) {
    const erros = validarCurso(d);
    if (erros.length) return { erros };
    const c = { id: novoId('cu', cursos()), ...dadosCurso(d), ativo: true };
    cursos().push(c);
    salvar();
    return { curso: c };
  }

  function atualizarCurso(id, d) {
    const c = curso(id);
    if (!c) return { erros: [{ campo: 'nome', mensagem: 'Curso não encontrado.' }] };
    const erros = validarCurso(d, id);
    if (erros.length) return { erros };
    Object.assign(c, dadosCurso(d));
    if (typeof d.ativo === 'boolean') c.ativo = d.ativo;
    salvar();
    return { curso: c };
  }

  function validarProfessor(d) {
    const erros = [];
    if (texto(d.nome).split(/\s+/).filter(Boolean).length < 2) erros.push({ campo: 'nome', mensagem: 'Informe nome e sobrenome.' });
    if (!ehEmail(texto(d.email))) erros.push({ campo: 'email', mensagem: 'E-mail válido (usado no acesso do professor).' });
    const tel = digitos(d.telefone);
    if (tel && (tel.length < 10 || tel.length > 11)) erros.push({ campo: 'telefone', mensagem: 'Celular com DDD.' });
    return erros;
  }
  const dadosProfessor = (d) => ({ nome: texto(d.nome), email: texto(d.email).toLowerCase(), telefone: digitos(d.telefone), especialidade: texto(d.especialidade) });

  function criarProfessor(d) {
    const erros = validarProfessor(d);
    if (erros.length) return { erros };
    const p = { id: novoId('pr', professores()), ...dadosProfessor(d), ativo: true };
    professores().push(p);
    salvar();
    return { professor: p };
  }
  function atualizarProfessor(id, d) {
    const p = professor(id);
    const erros = validarProfessor(d);
    if (erros.length) return { erros };
    Object.assign(p, dadosProfessor(d));
    salvar();
    return { professor: p };
  }

  // ---------- Turmas ----------

  function turmaTemChamada(turmaId) {
    return D().aulas.some((a) => a.turmaId === turmaId && a.status === 'realizada');
  }

  function validarTurma(d, t = null) {
    const erros = [];
    const travada = t && turmaTemChamada(t.id);
    const c = curso(d.cursoId ?? t?.cursoId);
    if (!c) erros.push({ campo: 'cursoId', mensagem: 'Escolha o curso.' });
    if (!professor(d.professorId)) erros.push({ campo: 'professorId', mensagem: 'Escolha o professor.' });
    const cap = Number(d.capacidade);
    if (!Number.isInteger(cap) || cap < 1 || cap > 200) erros.push({ campo: 'capacidade', mensagem: 'Capacidade entre 1 e 200 alunos.' });
    else if (t && cap < ocupacao(t).ocupadas) erros.push({ campo: 'capacidade', mensagem: `A turma já tem ${ocupacao(t).ocupadas} alunos.` });
    const min = d.minimoAlunos === '' || d.minimoAlunos == null ? null : Number(d.minimoAlunos);
    if (min != null && (!Number.isInteger(min) || min < 1 || (Number.isInteger(cap) && min > cap))) erros.push({ campo: 'minimoAlunos', mensagem: 'Entre 1 e a capacidade da turma.' });
    if (!travada) {
      if (!ehData(d.inicio)) erros.push({ campo: 'inicio', mensagem: 'Informe a data da primeira aula.' });
      const agErros = Agenda.validar(d.agenda);
      erros.push(...agErros);
      if (!agErros.length && ehData(d.inicio) && c && !gerarDatasAulas(Agenda.normalizar(d.agenda), d.inicio, c.cargaHoraria).length) {
        erros.push({ campo: 'ag-periodos', mensagem: 'Nenhuma aula cai nos dias escolhidos a partir da data de início.' });
      }
    }
    return erros;
  }

  function proximoCodigoTurma(c, inicio) {
    const ano = inicio.slice(0, 4);
    let n = turmas().filter((t) => t.cursoId === c.id && t.inicio.startsWith(ano)).length + 1;
    while (turmas().some((t) => t.codigo === `${c.codigo}-${ano}-${n}`)) n += 1;
    return `${c.codigo}-${ano}-${n}`;
  }

  function substituirAulas(t) {
    const c = curso(t.cursoId);
    D().aulas = D().aulas.filter((a) => a.turmaId !== t.id);
    const datas = gerarDatasAulas(t.agenda, t.inicio, c.cargaHoraria);
    datas.forEach((d) => D().aulas.push({ id: `${t.id}-a${d.n}`, turmaId: t.id, n: d.n, data: d.data, inicio: d.inicio, fim: d.fim, status: 'prevista', conteudo: '', presencas: {}, registradaEm: null, registradaPor: null }));
    t.fim = datas[datas.length - 1]?.data ?? t.inicio;
  }

  function criarTurma(d) {
    const erros = validarTurma(d);
    if (erros.length) return { erros };
    const c = curso(d.cursoId);
    const t = {
      id: novoId('tu', turmas()),
      codigo: proximoCodigoTurma(c, d.inicio),
      cursoId: c.id,
      professorId: d.professorId,
      agenda: Agenda.normalizar(d.agenda),
      inicio: d.inicio,
      fim: d.inicio,
      capacidade: Number(d.capacidade),
      minimoAlunos: Number(d.minimoAlunos) || null,
      local: texto(d.local),
      status: 'ativa',
      concluidaEm: null,
    };
    turmas().push(t);
    substituirAulas(t);
    salvar();
    return { turma: t };
  }

  // Depois da primeira chamada, agenda e início ficam travados (as aulas já têm histórico).
  function atualizarTurma(id, d) {
    const t = turma(id);
    if (!t) return { erros: [{ campo: 'professorId', mensagem: 'Turma não encontrada.' }] };
    if (['concluida', 'cancelada'].includes(t.status)) return { erros: [{ campo: 'professorId', mensagem: 'Turma encerrada não pode ser alterada.' }] };
    const erros = validarTurma(d, t);
    if (erros.length) return { erros };
    t.professorId = d.professorId;
    t.capacidade = Number(d.capacidade);
    t.minimoAlunos = Number(d.minimoAlunos) || null;
    t.local = texto(d.local);
    if (!turmaTemChamada(t.id)) {
      t.agenda = Agenda.normalizar(d.agenda);
      t.inicio = d.inicio;
      substituirAulas(t);
    }
    salvar();
    return { turma: t };
  }

  // ---------- Matrícula ----------

  function descontoDe(d) {
    const valorCurso = arred(d.valorCurso);
    const informado = Number(String(d.desconto ?? '').replace(',', '.')) || 0;
    const valor = d.descontoTipo === 'percentual' ? arred((valorCurso * informado) / 100) : arred(informado);
    return { valor, percentual: valorCurso ? (valor / valorCurso) * 100 : 0, informado };
  }

  function validarMatricula(d) {
    const erros = [];
    const a = aluno(d.alunoId);
    const t = turma(d.turmaId);
    if (!a) erros.push({ campo: 'alunoId', mensagem: 'Escolha o aluno.' });
    if (!t) erros.push({ campo: 'turmaId', mensagem: 'Escolha a turma.' });
    else {
      const s = situacaoTurma(t);
      if (!['planejada', 'em_andamento'].includes(s)) erros.push({ campo: 'turmaId', mensagem: `Turma ${SITUACAO_TURMA[s].nome.toLowerCase()}: não recebe novas matrículas.` });
      else if (ocupacao(t).lotada) erros.push({ campo: 'turmaId', mensagem: `Turma lotada (${t.capacidade} vagas).` });
      else if (a && matriculas().some((m) => m.alunoId === a.id && m.turmaId === t.id && m.status === 'ativa')) erros.push({ campo: 'turmaId', mensagem: 'O aluno já está matriculado nesta turma.' });
    }
    const valorCurso = Number(d.valorCurso);
    if (!(valorCurso > 0)) erros.push({ campo: 'valorCurso', mensagem: 'Informe o valor do curso.' });
    const desc = descontoDe(d);
    const max = config().financeiro.descontoMaximoPercentual;
    if (desc.informado < 0) erros.push({ campo: 'desconto', mensagem: 'Desconto não pode ser negativo.' });
    else if (valorCurso > 0 && desc.valor > valorCurso) erros.push({ campo: 'desconto', mensagem: 'Desconto maior que o valor do curso.' });
    else if (valorCurso > 0 && desc.percentual > max + 0.001) erros.push({ campo: 'desconto', mensagem: `Acima do desconto máximo da escola (${max}%). Ajuste em Configurações › Financeiro.` });
    const n = Number(d.parcelas);
    const maxParc = config().financeiro.parcelasMaximas;
    if (!Number.isInteger(n) || n < 1 || n > maxParc) erros.push({ campo: 'parcelas', mensagem: `Entre 1 e ${maxParc} parcelas.` });
    if (!ehData(d.primeiroVencimento)) erros.push({ campo: 'primeiroVencimento', mensagem: 'Informe o primeiro vencimento.' });
    if (!FORMAS_PAGAMENTO.some((f) => f.id === d.formaPagamento)) erros.push({ campo: 'formaPagamento', mensagem: 'Escolha a forma de pagamento.' });
    if (d.pagador === 'responsavel' && a && !responsavelFinanceiro(a)) erros.push({ campo: 'pagador', mensagem: 'O aluno não tem responsável financeiro cadastrado.' });
    return erros;
  }

  // Prévia das parcelas para a tela (mesma regra que a gravação usa).
  function simularMatricula(d) {
    const valorCurso = arred(d.valorCurso);
    const desc = descontoDe(d);
    const valorFinal = arred(Math.max(0, valorCurso - desc.valor));
    const n = Number(d.parcelas);
    const parcelas = valorFinal > 0 && Number.isInteger(n) && n >= 1 && ehData(d.primeiroVencimento) ? gerarParcelas(valorFinal, n, d.primeiroVencimento) : [];
    return { valorCurso, desconto: desc.valor, valorFinal, parcelas };
  }

  function proximoCodigoMatricula() {
    const ano = hoje().slice(0, 4);
    const doAno = matriculas().filter((m) => m.codigo.startsWith(ano)).map((m) => Number(m.codigo.slice(5)) || 0);
    return `${ano}-${pad(Math.max(0, ...doAno) + 1).padStart(4, '0')}`;
  }

  function matricular(d, usuario = '') {
    const erros = validarMatricula(d);
    if (erros.length) return { erros };
    const t = turma(d.turmaId);
    const c = curso(t.cursoId);
    const sim = simularMatricula(d);
    const m = {
      id: novoId('ma', matriculas()),
      codigo: proximoCodigoMatricula(),
      alunoId: d.alunoId,
      turmaId: t.id,
      data: hoje(),
      valorCurso: sim.valorCurso,
      desconto: sim.desconto,
      valorFinal: sim.valorFinal,
      parcelas: Number(d.parcelas),
      primeiroVencimento: d.primeiroVencimento,
      formaPagamento: d.formaPagamento,
      pagador: d.pagador === 'responsavel' ? 'responsavel' : 'aluno',
      status: 'ativa',
      resultado: null,
      frequenciaFinal: null,
      concluidaEm: null,
      canceladaEm: null,
      motivoCancelamento: '',
      criadaPor: usuario,
    };
    matriculas().push(m);
    sim.parcelas.forEach((p) => {
      lancamentos().push({
        id: novoId('lc', lancamentos()),
        tipo: 'receber',
        descricao: `${c.nome} · parcela ${p.n}/${p.de}`,
        categoria: 'Mensalidades de cursos',
        valor: p.valor,
        vencimento: p.vencimento,
        status: 'aberto',
        pagoEm: null, valorPago: null, forma: d.formaPagamento,
        matriculaId: m.id, alunoId: m.alunoId, parcela: { n: p.n, de: p.de },
        fornecedor: '', observacao: '', cobranca: null, criadoEm: hoje(), criadoPor: usuario, baixadoPor: null,
      });
    });
    if (d.pagarPrimeira && sim.parcelas.length) {
      const primeira = parcelasDaMatricula(m.id)[0];
      baixar(primeira, { data: hoje(), valor: primeira.valor, forma: d.formaPagamento }, usuario);
    }
    salvar();
    return { matricula: m };
  }

  // Cancela a matrícula e as parcelas ainda não pagas (pagas ficam no histórico).
  function cancelarMatricula(id, motivo, usuario = '') {
    const m = matricula(id);
    if (!m || m.status !== 'ativa') return { erros: [{ campo: 'motivo', mensagem: 'Só matrículas em curso podem ser canceladas.' }] };
    if (!texto(motivo)) return { erros: [{ campo: 'motivo', mensagem: 'Informe o motivo do cancelamento.' }] };
    m.status = 'cancelada';
    m.canceladaEm = hoje();
    m.motivoCancelamento = texto(motivo);
    m.canceladaPor = usuario;
    let canceladas = 0;
    parcelasDaMatricula(id).forEach((l) => {
      if (l.status === 'aberto') { l.status = 'cancelado'; l.canceladoEm = hoje(); canceladas += 1; }
    });
    salvar();
    return { matricula: m, canceladas };
  }

  // ---------- Recebimentos e contas ----------

  function baixar(l, { data, valor, forma }, usuario) {
    l.status = 'pago';
    l.pagoEm = data;
    l.valorPago = arred(valor);
    l.forma = forma;
    l.baixadoPor = usuario;
  }

  function registrarBaixa(id, d, usuario = '') {
    const l = lancamento(id);
    const erros = [];
    if (!l || l.status !== 'aberto') erros.push({ campo: 'data', mensagem: 'Lançamento não está em aberto.' });
    if (!ehData(d.data)) erros.push({ campo: 'data', mensagem: 'Informe a data.' });
    else if (d.data > hoje()) erros.push({ campo: 'data', mensagem: 'Não registre pagamento com data futura.' });
    if (!(Number(d.valor) > 0)) erros.push({ campo: 'valor', mensagem: 'Valor maior que zero.' });
    if (!FORMAS_PAGAMENTO.some((f) => f.id === d.forma)) erros.push({ campo: 'forma', mensagem: 'Escolha a forma.' });
    if (erros.length) return { erros };
    baixar(l, { data: d.data, valor: Number(d.valor), forma: d.forma }, usuario);
    salvar();
    return { lancamento: l };
  }

  function estornar(id) {
    const l = lancamento(id);
    if (!l || l.status !== 'pago') return { erros: [{ campo: 'data', mensagem: 'Só lançamentos pagos podem ser estornados.' }] };
    if (l.matriculaId && matricula(l.matriculaId)?.status === 'cancelada') return { erros: [{ campo: 'data', mensagem: 'Matrícula cancelada: o estorno precisa ser tratado à parte.' }] };
    Object.assign(l, { status: 'aberto', pagoEm: null, valorPago: null, baixadoPor: null });
    salvar();
    return { lancamento: l };
  }

  function lancarConta(d, usuario = '') {
    const tipo = d.tipo === 'receber' ? 'receber' : 'pagar';
    const erros = [];
    if (!texto(d.descricao)) erros.push({ campo: 'descricao', mensagem: 'Descreva o lançamento.' });
    if (!CATEGORIAS[tipo].includes(d.categoria)) erros.push({ campo: 'categoria', mensagem: 'Escolha a categoria.' });
    if (!(Number(d.valor) > 0)) erros.push({ campo: 'valor', mensagem: 'Valor maior que zero.' });
    if (!ehData(d.vencimento)) erros.push({ campo: 'vencimento', mensagem: 'Informe o vencimento.' });
    if (d.alunoId && !aluno(d.alunoId)) erros.push({ campo: 'alunoId', mensagem: 'Aluno não encontrado.' });
    if (erros.length) return { erros };
    const l = {
      id: novoId('lc', lancamentos()), tipo, descricao: texto(d.descricao), categoria: d.categoria, valor: arred(d.valor), vencimento: d.vencimento,
      status: 'aberto', pagoEm: null, valorPago: null, forma: null, matriculaId: null, alunoId: d.alunoId || null, parcela: null,
      fornecedor: texto(d.fornecedor), observacao: texto(d.observacao), cobranca: null, criadoEm: hoje(), criadoPor: usuario, baixadoPor: null,
    };
    lancamentos().push(l);
    if (d.jaPago) baixar(l, { data: d.vencimento <= hoje() ? d.vencimento : hoje(), valor: l.valor, forma: d.forma || 'pix' }, usuario);
    salvar();
    return { lancamento: l };
  }

  function cancelarLancamento(id) {
    const l = lancamento(id);
    if (!l || l.status !== 'aberto') return { erros: [{ campo: 'data', mensagem: 'Só lançamentos em aberto podem ser cancelados.' }] };
    l.status = 'cancelado';
    l.canceladoEm = hoje();
    salvar();
    return { lancamento: l };
  }

  // ---------- Chamada ----------

  function registrarChamada(aulaId, { presencas, conteudo }, usuario = '') {
    const a = aula(aulaId);
    if (!a) return { erros: [{ campo: 'presencas', mensagem: 'Aula não encontrada.' }] };
    const t = turma(a.turmaId);
    if (['concluida', 'cancelada'].includes(t.status)) return { erros: [{ campo: 'presencas', mensagem: 'Turma encerrada: a chamada não pode mais ser alterada.' }] };
    if (a.status === 'cancelada') return { erros: [{ campo: 'presencas', mensagem: 'Aula cancelada.' }] };
    if (a.data > hoje()) return { erros: [{ campo: 'presencas', mensagem: 'A chamada só pode ser feita no dia da aula ou depois.' }] };
    const lista = participantes(a);
    const faltando = lista.filter((m) => !PRESENCA[presencas?.[m.id]]);
    if (faltando.length) return { erros: [{ campo: 'presencas', mensagem: `Marque todos os alunos (${faltando.length} sem marcação).` }] };
    a.presencas = Object.fromEntries(lista.map((m) => [m.id, presencas[m.id]]));
    a.conteudo = texto(conteudo);
    a.status = 'realizada';
    a.registradaEm = hoje();
    a.registradaPor = usuario;
    salvar();
    return { aula: a };
  }

  // ---------- Conclusão da turma ----------

  function previaConclusao(turmaId) {
    const t = turma(turmaId);
    const aulas = aulasDaTurma(turmaId);
    const pendentes = aulas.filter((a) => chamadaPendente(a));
    const futuras = aulas.filter((a) => a.status === 'prevista' && a.data >= hoje());
    const alunosT = matriculasDaTurma(turmaId).filter((m) => m.status === 'ativa').map((m) => {
      const f = frequencia(m);
      return { m, aluno: aluno(m.alunoId), f, resultado: f.percentual != null && f.percentual >= f.minimo ? 'aprovado' : 'reprovado_frequencia' };
    });
    return { turma: t, pendentes, futuras, alunos: alunosT, aprovados: alunosT.filter((x) => x.resultado === 'aprovado').length };
  }

  // Encerra a turma: cada matrícula em curso vira concluída, aprovada ou reprovada por frequência.
  function concluirTurma(turmaId, usuario = '') {
    const t = turma(turmaId);
    if (!t || ['concluida', 'cancelada'].includes(t.status)) return { erros: [{ campo: 'turma', mensagem: 'Turma já encerrada.' }] };
    const p = previaConclusao(turmaId);
    if (p.pendentes.length) return { erros: [{ campo: 'turma', mensagem: `Há ${p.pendentes.length} chamada(s) pendente(s). Registre antes de concluir.` }] };
    if (p.futuras.length) return { erros: [{ campo: 'turma', mensagem: `Ainda há ${p.futuras.length} aula(s) prevista(s). A turma só pode ser concluída depois da última aula.` }] };
    p.alunos.forEach(({ m, f, resultado }) => {
      m.status = 'concluida';
      m.resultado = resultado;
      m.frequenciaFinal = f.percentual;
      m.concluidaEm = hoje();
    });
    t.status = 'concluida';
    t.concluidaEm = hoje();
    t.concluidaPor = usuario;
    salvar();
    return { turma: t, aprovados: p.aprovados, reprovados: p.alunos.length - p.aprovados };
  }

  // ---------- Certificados ----------

  function elegibilidade(m) {
    const c = certificadoDaMatricula(m.id);
    if (c) return { id: 'emitido', nome: 'Emitido', tom: 'ok', certificado: c };
    if (m.status === 'cancelada') return { id: 'bloqueado', nome: 'Matrícula cancelada', tom: 'neutro' };
    if (m.status === 'ativa') return { id: 'aguardando', nome: 'Aguardando conclusão da turma', tom: 'info' };
    if (m.resultado === 'reprovado_frequencia') return { id: 'bloqueado', nome: `Frequência ${m.frequenciaFinal ?? 0}% (mínimo ${config().academico.frequenciaMinima}%)`, tom: 'perigo' };
    if (config().financeiro.bloquearCertificadoInadimplente && parcelasDaMatricula(m.id).some((l) => situacaoLancamento(l) === 'vencido')) {
      return { id: 'bloqueado', nome: 'Parcelas vencidas em aberto', tom: 'atencao' };
    }
    return { id: 'elegivel', nome: 'Pronto para emitir', tom: 'atencao' };
  }

  const prontosParaEmitir = () => matriculas().filter((m) => m.status === 'concluida' && elegibilidade(m).id === 'elegivel');

  // Código curto e estável: sigla da escola + ano + hash (djb2) da matrícula e da emissão.
  function codigoCertificado(m, sequencia) {
    let h = 5381;
    for (const ch of `${m.id}|${m.alunoId}|${sequencia}`) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
    const base = h.toString(36).toUpperCase().padStart(8, '0').slice(-8);
    return `${escola().sigla}-${hoje().slice(0, 4)}-${base.slice(0, 4)}-${base.slice(4)}`;
  }

  function dadosCertificado(m) {
    const t = turma(m.turmaId);
    const c = curso(t.cursoId);
    const a = aluno(m.alunoId);
    return {
      aluno: a.nome,
      cpf: a.cpf,
      curso: c.nome,
      modalidade: MODALIDADES.find((x) => x.id === c.modalidade)?.nome ?? '',
      cargaHoraria: c.cargaHoraria,
      inicio: t.inicio,
      fim: t.fim,
      turma: t.codigo,
      professor: professor(t.professorId)?.nome ?? '',
      frequencia: m.frequenciaFinal,
      matricula: m.codigo,
      modulos: c.modulos.map((x) => ({ nome: x.nome, cargaHoraria: x.cargaHoraria })),
    };
  }

  function emitirCertificado(matriculaId, usuario = '') {
    const m = matricula(matriculaId);
    if (!m) return { erros: [{ campo: 'matricula', mensagem: 'Matrícula não encontrada.' }] };
    const e = elegibilidade(m);
    if (e.id !== 'elegivel') return { erros: [{ campo: 'matricula', mensagem: `Não é possível emitir: ${e.nome.toLowerCase()}.` }] };
    let seq = certificados().length + 1;
    let codigo = codigoCertificado(m, seq);
    while (certificados().some((c) => c.codigo === codigo)) codigo = codigoCertificado(m, (seq += 1));
    const c = {
      id: novoId('ce', certificados()), codigo, matriculaId: m.id, alunoId: m.alunoId, turmaId: m.turmaId,
      emitidoEm: hoje(), emitidoPor: usuario, status: 'valido', canceladoEm: null, motivoCancelamento: '',
      dados: dadosCertificado(m), modelo: copiaDoModelo(modeloDoCurso(curso(turma(m.turmaId).cursoId))),
    };
    certificados().push(c);
    salvar();
    return { certificado: c };
  }

  function emitirLote(ids, usuario = '') {
    const emitidos = [];
    const falhas = [];
    ids.forEach((id) => {
      const r = emitirCertificado(id, usuario);
      if (r.erros) falhas.push({ id, motivo: r.erros[0].mensagem }); else emitidos.push(r.certificado);
    });
    return { emitidos, falhas };
  }

  function cancelarCertificado(id, motivo, usuario = '') {
    const c = certificado(id);
    if (!c || c.status !== 'valido') return { erros: [{ campo: 'motivo', mensagem: 'Certificado não está válido.' }] };
    if (!texto(motivo)) return { erros: [{ campo: 'motivo', mensagem: 'Informe o motivo.' }] };
    Object.assign(c, { status: 'cancelado', canceladoEm: hoje(), motivoCancelamento: texto(motivo), canceladoPor: usuario });
    salvar();
    return { certificado: c };
  }

  const certificadoPorCodigo = (codigo) => certificados().find((c) => c.codigo.toUpperCase() === texto(codigo).toUpperCase()) ?? null;

  // ---------- Modelos de certificado ----------
  // Um é o padrão da escola; o curso pode escolher outro (ativo). Na emissão o
  // certificado guarda uma cópia do modelo, então editar não muda os emitidos.

  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const modeloPadrao = () => modelosCertificado().find((m) => m.padrao) ?? modelosCertificado()[0];
  function modeloDoCurso(c) {
    const m = modeloCertificado(c?.modeloCertificadoId);
    return m?.status === 'ativo' ? m : modeloPadrao();
  }
  const modeloDoCertificado = (c) => c.modelo ?? modeloPadrao(); // emitidos antes dos modelos não têm cópia
  const copiaDoModelo = (m) => clonar({ id: m.id, nome: m.nome, aparencia: m.aparencia, frente: m.frente, verso: m.verso });
  const cursosDoModelo = (id) => cursos().filter((c) => c.modeloCertificadoId === id);
  const emitidosComModelo = (id) => certificados().filter((c) => c.modelo?.id === id);

  function modeloEmBranco() {
    const e = escola();
    return {
      aparencia: { orientacao: 'paisagem', fonte: 'moderna', moldura: 'simples', corPrimaria: '#0F3D4E', corDestaque: '#C47A3A' },
      frente: {
        rotuloTopo: 'Certificado de conclusão', titulo: 'Certificado', introducao: 'Certificamos que', mostrarCpf: true,
        corpo: 'concluiu o curso livre **{{curso}}**, com carga horária de **{{cargaHoraria}}**.', localData: '{{cidade}}, {{dataEmissao}}.',
        assinaturas: [{ nome: e.diretor || 'Direção', cargo: e.cargoDiretor || '' }],
      },
      verso: { mostrar: false, titulo: 'Conteúdo programático', mostrarCargaPorItem: true, mostrarRequisitos: true, textoLivre: '' },
    };
  }

  function validarDadosModelo(d, idAtual = null) {
    const erros = [];
    const nome = texto(d.nome);
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Dê um nome ao modelo.' });
    else if (modelosCertificado().some((m) => m.id !== idAtual && norm(m.nome) === norm(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe um modelo com este nome.' });
    if (d.status !== undefined && !STATUS_MODELO[d.status]) erros.push({ campo: 'status', mensagem: 'Escolha a situação.' });
    if (idAtual && modeloCertificado(idAtual)?.padrao && d.status && d.status !== 'ativo') erros.push({ campo: 'status', mensagem: 'É o modelo padrão: defina outro como padrão antes de tirá-lo de uso.' });
    return erros;
  }

  function validarConteudoModelo({ aparencia: a = {}, frente: f = {}, verso: v = {} }) {
    const erros = [];
    Object.entries(OPCOES_MODELO).forEach(([k, ops]) => { if (!ops.some((o) => o.id === a[k])) erros.push({ campo: `aparencia.${k}`, mensagem: 'Escolha uma opção.' }); });
    ['corPrimaria', 'corDestaque'].forEach((k) => { if (!/^#[0-9a-f]{6}$/i.test(a[k] ?? '')) erros.push({ campo: `aparencia.${k}`, mensagem: 'Cor no formato #RRGGBB.' }); });
    if (!texto(f.titulo)) erros.push({ campo: 'frente.titulo', mensagem: 'Informe o título.' });
    if (!texto(f.corpo)) erros.push({ campo: 'frente.corpo', mensagem: 'O texto diz o que o aluno concluiu; não pode ficar vazio.' });
    const ass = f.assinaturas ?? [];
    if (!ass.length || ass.length > 3) erros.push({ campo: 'frente.assinaturas', mensagem: 'De 1 a 3 assinaturas.' });
    ass.forEach((s, i) => { if (!texto(s.nome)) erros.push({ campo: `frente.assinaturas.${i}.nome`, mensagem: 'Nome de quem assina.' }); });
    if (v.mostrar && !texto(v.titulo)) erros.push({ campo: 'verso.titulo', mensagem: 'Informe o título do verso.' });
    const textos = {
      'frente.rotuloTopo': f.rotuloTopo, 'frente.titulo': f.titulo, 'frente.introducao': f.introducao, 'frente.corpo': f.corpo, 'frente.localData': f.localData,
      ...Object.fromEntries(ass.map((s, i) => [`frente.assinaturas.${i}.nome`, `${s.nome} ${s.cargo}`])), 'verso.titulo': v.titulo, 'verso.textoLivre': v.textoLivre,
    };
    Object.entries(textos).forEach(([campo, t]) => {
      const invalidas = [...String(t ?? '').matchAll(/\{\{\s*([a-zA-Z]+)\s*\}\}/g)].map((x) => x[1]).filter((x) => !VARIAVEIS_CERTIFICADO.some(([id]) => id === x));
      if (invalidas.length && !erros.some((e) => e.campo === campo)) erros.push({ campo, mensagem: `Variável que não existe: ${invalidas.map((x) => `{{${x}}}`).join(', ')}.` });
    });
    return erros;
  }

  // `copiarDe`: id de um modelo existente; vazio começa do modelo em branco. Nasce como rascunho.
  function criarModelo(d) {
    const erros = validarDadosModelo(d);
    const origem = d.copiarDe ? modeloCertificado(d.copiarDe) : null;
    if (d.copiarDe && !origem) erros.push({ campo: 'copiarDe', mensagem: 'Modelo de origem não encontrado.' });
    if (erros.length) return { erros };
    const base = origem ? clonar({ aparencia: origem.aparencia, frente: origem.frente, verso: origem.verso }) : modeloEmBranco();
    const m = { id: novoId('mc', modelosCertificado()), nome: texto(d.nome), descricao: texto(d.descricao), padrao: false, status: 'rascunho', ...base, atualizadoEm: hoje() };
    modelosCertificado().push(m);
    salvar();
    return { modelo: m };
  }

  function atualizarDadosModelo(id, d) {
    const m = modeloCertificado(id);
    if (!m) return { erros: [{ campo: 'nome', mensagem: 'Modelo não encontrado.' }] };
    const erros = validarDadosModelo(d, id);
    if (erros.length) return { erros };
    Object.assign(m, { nome: texto(d.nome), descricao: texto(d.descricao), status: d.status ?? m.status, atualizadoEm: hoje() });
    salvar();
    return { modelo: m };
  }

  function salvarConteudoModelo(id, { aparencia, frente, verso }) {
    const m = modeloCertificado(id);
    if (!m) return { erros: [{ campo: 'frente.titulo', mensagem: 'Modelo não encontrado.' }] };
    const erros = validarConteudoModelo({ aparencia, frente, verso });
    if (erros.length) return { erros };
    Object.assign(m, clonar({ aparencia, frente, verso }), { atualizadoEm: hoje() });
    salvar();
    return { modelo: m };
  }

  function duplicarModelo(id) {
    const o = modeloCertificado(id);
    if (!o) return { erros: [{ campo: 'nome', mensagem: 'Modelo não encontrado.' }] };
    let nome = `${o.nome} (cópia)`;
    for (let n = 2; modelosCertificado().some((m) => norm(m.nome) === norm(nome)); n += 1) nome = `${o.nome} (cópia ${n})`;
    return criarModelo({ nome, descricao: o.descricao, copiarDe: id });
  }

  function definirModeloPadrao(id) {
    const m = modeloCertificado(id);
    if (m?.status !== 'ativo') return { erros: [{ campo: 'status', mensagem: 'Só um modelo ativo pode ser o padrão.' }] };
    modelosCertificado().forEach((x) => { x.padrao = x.id === id; });
    salvar();
    return { modelo: m };
  }

  // Cursos que o escolheram voltam para o padrão; os emitidos guardam a própria cópia.
  function excluirModelo(id) {
    const m = modeloCertificado(id);
    if (!m) return { erros: [{ campo: 'nome', mensagem: 'Modelo não encontrado.' }] };
    if (m.padrao) return { erros: [{ campo: 'nome', mensagem: 'O modelo padrão não pode ser excluído. Defina outro como padrão antes.' }] };
    cursosDoModelo(id).forEach((c) => { c.modeloCertificadoId = null; });
    D().modelosCertificado = modelosCertificado().filter((x) => x.id !== id);
    salvar();
    return { modelo: m };
  }

  // ---------- Escola, configurações e plano ----------

  function atualizarEscola(d) {
    const erros = [];
    if (!texto(d.nome)) erros.push({ campo: 'nome', mensagem: 'Informe o nome da escola.' });
    if (!/^[A-Z]{2,5}$/.test(texto(d.sigla).toUpperCase())) erros.push({ campo: 'sigla', mensagem: 'Sigla de 2 a 5 letras (usada no código dos certificados).' });
    if (texto(d.cnpj) && Documento.erroCnpj(d.cnpj)) erros.push({ campo: 'cnpj', mensagem: Documento.erroCnpj(d.cnpj) });
    if (texto(d.email) && !ehEmail(texto(d.email))) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    if (!texto(d.cidade)) erros.push({ campo: 'cidade', mensagem: 'Informe a cidade (sai no certificado).' });
    if (erros.length) return { erros };
    Object.assign(escola(), {
      nome: texto(d.nome), sigla: texto(d.sigla).toUpperCase(), cnpj: Documento.limpar(d.cnpj), telefone: digitos(d.telefone),
      email: texto(d.email).toLowerCase(), endereco: texto(d.endereco), cidade: texto(d.cidade), uf: texto(d.uf).toUpperCase().slice(0, 2), site: texto(d.site),
      diretor: texto(d.diretor), cargoDiretor: texto(d.cargoDiretor),
    });
    salvar();
    return { escola: escola() };
  }

  function atualizarConfig(secao, d) {
    const erros = [];
    const cfg = config();
    if (secao === 'academico') {
      const f = Number(d.frequenciaMinima);
      if (!Number.isInteger(f) || f < 0 || f > 100) erros.push({ campo: 'frequenciaMinima', mensagem: 'Percentual inteiro entre 0 e 100.' });
      if (erros.length) return { erros };
      Object.assign(cfg.academico, { frequenciaMinima: f, justificadaContaPresenca: !!d.justificadaContaPresenca });
    } else if (secao === 'financeiro') {
      const num = (campo, min, max, inteiro = false) => {
        const v = Number(String(d[campo]).replace(',', '.'));
        if (Number.isNaN(v) || v < min || v > max || (inteiro && !Number.isInteger(v))) erros.push({ campo, mensagem: `Entre ${min} e ${max}.` });
        return v;
      };
      const dia = num('diaVencimentoPadrao', 1, 28, true);
      const parc = num('parcelasMaximas', 1, 24, true);
      const multa = num('multaPercentual', 0, 2);
      const juros = num('jurosMensalPercentual', 0, 1);
      const desc = num('descontoMaximoPercentual', 0, 100);
      if (erros.length) return { erros };
      Object.assign(cfg.financeiro, { diaVencimentoPadrao: dia, parcelasMaximas: parc, multaPercentual: multa, jurosMensalPercentual: juros, descontoMaximoPercentual: desc, bloquearCertificadoInadimplente: !!d.bloquearCertificadoInadimplente });
    }
    salvar();
    return { config: cfg };
  }

  function definirPlano(planoId) {
    if (!Planos.plano(planoId)) return;
    assinatura().planoId = planoId;
    salvar();
  }
  const temModulo = (moduloId) => Planos.tem(assinatura(), moduloId);

  return {
    CHAVE, MODALIDADES, FORMAS_PAGAMENTO, CATEGORIAS, SITUACAO_TURMA, SITUACAO_LANCAMENTO, STATUS_MATRICULA, PRESENCA,
    VARIAVEIS_CERTIFICADO, STATUS_MODELO, OPCOES_MODELO,
    hoje, somarDias, somarMeses, diasEntre, ehData, arred,
    carregar, salvar, restaurar, usar,
    escola, config, assinatura, alunos, cursos, turmas, professores, matriculas, lancamentos, certificados,
    aluno, curso, turma, professor, matricula, lancamento, certificado, aula,
    aulasDaTurma, matriculasDaTurma, matriculasDoAluno, parcelasDaMatricula, lancamentosDoAluno, certificadoDaMatricula, turmasDoProfessor,
    idade, gerarDatasAulas, situacaoTurma, ocupacao, RISCO, minimoAlunos, riscoTurma, turmasEmRisco, progressoTurma, participantes, chamadaPendente, chamadasPendentes, aulasDoDia, proximasAulas,
    frequencia, alunosEmRisco,
    situacaoLancamento, diasAtraso, encargos, gerarParcelas, inadimplentes, estaInadimplente, resumoMes,
    situacaoAluno, alunosAtivos,
    validarAluno, criarAluno, atualizarAluno, salvarResponsavel, removerResponsavel, atualizarEnderecoPagamento,
    ORIGENS, PAPEIS_RESPONSAVEL, UFS, ehMenor, responsavelFinanceiro, responsavelPrincipal, contatoCobranca, criarCurso, atualizarCurso, criarProfessor, atualizarProfessor,
    turmaTemChamada, criarTurma, atualizarTurma,
    validarMatricula, simularMatricula, matricular, cancelarMatricula,
    registrarBaixa, estornar, lancarConta, cancelarLancamento,
    registrarChamada, previaConclusao, concluirTurma,
    elegibilidade, prontosParaEmitir, emitirCertificado, emitirLote, cancelarCertificado, certificadoPorCodigo,
    modelosCertificado, modeloCertificado, modeloPadrao, modeloDoCurso, modeloDoCertificado, cursosDoModelo, emitidosComModelo,
    validarConteudoModelo, criarModelo, atualizarDadosModelo, salvarConteudoModelo, duplicarModelo, definirModeloPadrao, excluirModelo,
    atualizarEscola, atualizarConfig, definirPlano, temModulo,
  };
})();
