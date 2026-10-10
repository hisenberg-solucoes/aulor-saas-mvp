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
  const CHAVE = 'aulor-mvp-dados-v1';

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
  const aluno = (id) => porId(alunos(), id);
  const curso = (id) => porId(cursos(), id);
  const turma = (id) => porId(turmas(), id);
  const professor = (id) => porId(professores(), id);
  const matricula = (id) => porId(matriculas(), id);
  const lancamento = (id) => porId(lancamentos(), id);
  const certificado = (id) => porId(certificados(), id);
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

  // ---------- Validações de cadastro ----------

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
    const menor = idade(d.nascimento) != null && idade(d.nascimento) < 18;
    const temResp = texto(d.respNome) || digitos(d.respTelefone) || digitos(d.respCpf);
    if (menor || temResp) {
      if (texto(d.respNome).split(/\s+/).filter(Boolean).length < 2) erros.push({ campo: 'respNome', mensagem: menor ? 'Aluno menor de idade: informe o responsável.' : 'Informe nome e sobrenome do responsável.' });
      const rt = digitos(d.respTelefone);
      if (rt.length < 10 || rt.length > 11) erros.push({ campo: 'respTelefone', mensagem: 'Celular do responsável com DDD.' });
      if (digitos(d.respCpf) && Documento.erroCpf(digitos(d.respCpf))) erros.push({ campo: 'respCpf', mensagem: Documento.erroCpf(digitos(d.respCpf)) });
    }
    return erros;
  }

  function dadosAluno(d) {
    const temResp = texto(d.respNome);
    return {
      nome: texto(d.nome),
      cpf: digitos(d.cpf),
      nascimento: d.nascimento || null,
      email: texto(d.email).toLowerCase(),
      telefone: digitos(d.telefone),
      responsavel: temResp ? { nome: texto(d.respNome), cpf: digitos(d.respCpf), telefone: digitos(d.respTelefone), parentesco: texto(d.respParentesco) } : null,
      observacoes: texto(d.observacoes),
    };
  }

  function criarAluno(d, usuario = '') {
    const erros = validarAluno(d);
    if (erros.length) return { erros };
    const a = { id: novoId('al', alunos()), ...dadosAluno(d), criadoEm: hoje(), criadoPor: usuario };
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
    if (d.pagador === 'responsavel' && a && !a.responsavel) erros.push({ campo: 'pagador', mensagem: 'O aluno não tem responsável cadastrado.' });
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
      dados: dadosCertificado(m),
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
    } else if (secao === 'certificado') {
      if (!texto(d.corpo)) erros.push({ campo: 'corpo', mensagem: 'O texto do certificado não pode ficar vazio.' });
      ['corPrimaria', 'corDestaque'].forEach((k) => { if (!/^#[0-9a-f]{6}$/i.test(d[k])) erros.push({ campo: k, mensagem: 'Cor no formato #RRGGBB.' }); });
      if (erros.length) return { erros };
      Object.assign(cfg.certificado, {
        titulo: texto(d.titulo) || 'Certificado', introducao: texto(d.introducao), corpo: texto(d.corpo),
        corPrimaria: d.corPrimaria, corDestaque: d.corDestaque, mostrarVerso: !!d.mostrarVerso,
        assinaturas: [{ nome: texto(d.ass1Nome), cargo: texto(d.ass1Cargo) }, { nome: texto(d.ass2Nome), cargo: texto(d.ass2Cargo) }].filter((s) => s.nome),
      });
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
    hoje, somarDias, somarMeses, diasEntre, ehData, arred,
    carregar, salvar, restaurar, usar,
    escola, config, assinatura, alunos, cursos, turmas, professores, matriculas, lancamentos, certificados,
    aluno, curso, turma, professor, matricula, lancamento, certificado, aula,
    aulasDaTurma, matriculasDaTurma, matriculasDoAluno, parcelasDaMatricula, lancamentosDoAluno, certificadoDaMatricula, turmasDoProfessor,
    idade, gerarDatasAulas, situacaoTurma, ocupacao, RISCO, minimoAlunos, riscoTurma, turmasEmRisco, progressoTurma, participantes, chamadaPendente, chamadasPendentes, aulasDoDia, proximasAulas,
    frequencia, alunosEmRisco,
    situacaoLancamento, diasAtraso, encargos, gerarParcelas, inadimplentes, estaInadimplente, resumoMes,
    situacaoAluno, alunosAtivos,
    validarAluno, criarAluno, atualizarAluno, criarCurso, atualizarCurso, criarProfessor, atualizarProfessor,
    turmaTemChamada, criarTurma, atualizarTurma,
    validarMatricula, simularMatricula, matricular, cancelarMatricula,
    registrarBaixa, estornar, lancarConta, cancelarLancamento,
    registrarChamada, previaConclusao, concluirTurma,
    elegibilidade, prontosParaEmitir, emitirCertificado, emitirLote, cancelarCertificado, certificadoPorCodigo,
    atualizarEscola, atualizarConfig, definirPlano, temModulo,
  };
})();
