// ============================================================
// Motor de Eventos: regras puras (sem DOM).
// Eventos em localStorage (fallback: EVENTOS_SEED); inscrições dos alunos
// em chave própria. Usado pelo Portal do Aluno (portal-aluno/calendario.html).
// ============================================================

const Eventos = (() => {
  const CHAVE = 'aulor-v1-eventos-v1';
  const CHAVE_INSCRICOES = 'aulor-v1-eventos-inscricoes-v1';
  const clonar = (x) => JSON.parse(JSON.stringify(x));

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return clonar(EVENTOS_SEED);
  }
  const salvar = (l) => localStorage.setItem(CHAVE, JSON.stringify(l));

  function carregarInscricoes() {
    try {
      const salvo = localStorage.getItem(CHAVE_INSCRICOES);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* vazio */ }
    return [];
  }
  const salvarInscricoes = (l) => localStorage.setItem(CHAVE_INSCRICOES, JSON.stringify(l));

  const pad = (n) => String(n).padStart(2, '0');
  const ehData = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
  const ehHora = (v) => /^\d{2}:\d{2}$/.test(String(v ?? ''));
  const porId = (l, id) => l.find((e) => e.id === id) ?? null;
  const tipoDe = (id) => TIPOS_EVENTO.find((t) => t.id === id) ?? TIPOS_EVENTO[0];
  const statusDe = (id) => STATUS_EVENTO.find((s) => s.id === id) ?? STATUS_EVENTO[0];
  const addDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const diasNoMes = (ano, mes) => new Date(ano, mes, 0).getDate();
  const diaInteiro = (e) => !e.inicio;
  const ordenar = (l) => [...l].sort((a, b) => a.data.localeCompare(b.data) || String(a.inicio ?? '').localeCompare(String(b.inicio ?? '')) || a.titulo.localeCompare(b.titulo, 'pt-BR'));

  // Idade em anos numa data de referência (não depende do relógio real, ao contrário de Clientes.idade).
  function idadeEm(nascimento, ref) {
    if (!ehData(nascimento) || !ehData(ref)) return null;
    const n = new Date(`${nascimento}T12:00:00`); const r = new Date(`${ref}T12:00:00`);
    let a = r.getFullYear() - n.getFullYear();
    if (r < new Date(r.getFullYear(), n.getMonth(), n.getDate(), 12)) a -= 1;
    return a;
  }

  // O aluno atende à restrição de idade do evento? Idade contada na data do evento.
  // Sem data de nascimento no cadastro, eventos com restrição ficam escondidos.
  function atendeRestricao(evento, aluno) {
    if (!evento.restricao) return true;
    const idade = idadeEm(aluno?.nascimento, evento.data);
    if (idade == null) return false;
    return evento.restricao === 'adolescentes' ? idade < 18 : idade >= 18;
  }

  // O evento alcança alguma das matrículas do aluno? (linhas de PortalAluno.matriculas)
  function atendePublico(evento, matriculas) {
    const p = evento.publico ?? { tipo: 'todos', ids: [] };
    if (p.tipo === 'todos') return matriculas.length > 0;
    if (p.tipo === 'formacoes') return matriculas.some((m) => p.ids.includes(m.formacao?.id ?? m.turma?.formacaoId));
    if (p.tipo === 'turmas') return matriculas.some((m) => p.ids.includes(m.turma?.id));
    return false;
  }

  // Eventos visíveis para um aluno: público × restrição de idade, sem os cancelados.
  // Cada linha ganha `turmas` (as matrículas alcançadas — vazio quando o público é "todos").
  function paraAluno(eventos, { aluno, matriculas = [] } = {}) {
    const ativas = matriculas.filter((m) => m.situacao !== 'cancelada');
    return ordenar(eventos.filter((e) => e.status !== 'cancelado' && atendePublico(e, ativas) && atendeRestricao(e, aluno)))
      .map((e) => ({
        ...e,
        turmas: e.publico.tipo === 'todos' ? [] : ativas.filter((m) => (e.publico.tipo === 'formacoes' ? e.publico.ids.includes(m.formacao?.id ?? m.turma?.formacaoId) : e.publico.ids.includes(m.turma?.id))),
      }));
  }

  const porMes = (eventos, ano, mes) => ordenar(eventos.filter((e) => e.data.startsWith(`${ano}-${pad(mes)}`)));
  const porDia = (eventos, iso) => ordenar(eventos.filter((e) => e.data === iso));
  const proximos = (eventos, ref, limite = null) => { const l = ordenar(eventos.filter((e) => e.data >= ref)); return limite ? l.slice(0, limite) : l; };

  // ---------- Inscrições ----------

  const inscritos = (inscricoes, eventoId) => inscricoes.filter((i) => i.eventoId === eventoId);
  const inscrito = (inscricoes, alunoId, eventoId) => inscricoes.some((i) => i.alunoId === alunoId && i.eventoId === eventoId);
  const vagasRestantes = (inscricoes, evento) => (evento.inscricao?.vagas ? Math.max(0, evento.inscricao.vagas - inscritos(inscricoes, evento.id).length) : null);
  const prazoEncerrado = (evento, ref) => Boolean(evento.inscricao?.prazo && evento.inscricao.prazo < ref);

  // Motivo pelo qual o aluno NÃO pode se inscrever agora (null = pode).
  function impedimento(inscricoes, alunoId, evento, ref) {
    if (!evento.inscricao?.necessaria) return 'Este evento não precisa de inscrição.';
    if (evento.status === 'cancelado') return 'Evento cancelado.';
    if (inscrito(inscricoes, alunoId, evento.id)) return 'Você já está inscrito.';
    if (evento.data < ref) return 'Evento já aconteceu.';
    if (prazoEncerrado(evento, ref)) return `Inscrições encerradas em ${fmtData(evento.inscricao.prazo)}.`;
    const restantes = vagasRestantes(inscricoes, evento);
    if (restantes === 0) return 'Vagas esgotadas.';
    return null;
  }

  function inscrever(inscricoes, alunoId, evento, ref) {
    const erro = impedimento(inscricoes, alunoId, evento, ref);
    if (erro) return { inscricoes, erro };
    return { inscricoes: [...inscricoes, { alunoId, eventoId: evento.id, em: new Date().toISOString() }], erro: null };
  }

  function cancelarInscricao(inscricoes, alunoId, evento, ref) {
    if (!inscrito(inscricoes, alunoId, evento.id)) return { inscricoes, erro: 'Você não está inscrito neste evento.' };
    if (evento.data < ref) return { inscricoes, erro: 'O evento já aconteceu; a inscrição não pode mais ser cancelada.' };
    return { inscricoes: inscricoes.filter((i) => !(i.alunoId === alunoId && i.eventoId === evento.id)), erro: null };
  }

  // ---------- Grade mensal (seg → dom, com dias dos meses vizinhos) ----------

  function gradeDoMes(ano, mes) {
    const ym = `${ano}-${pad(mes)}`;
    const primeiro = `${ym}-01`;
    const offset = (new Date(`${primeiro}T12:00:00`).getDay() + 6) % 7; // segunda = 0
    const dias = [];
    for (let i = offset; i > 0; i -= 1) dias.push({ iso: addDias(primeiro, -i), doMes: false });
    for (let d = 1; d <= diasNoMes(ano, mes); d += 1) dias.push({ iso: `${ym}-${pad(d)}`, doMes: true });
    let prox = addDias(dias.at(-1).iso, 1);
    while (dias.length % 7) { dias.push({ iso: prox, doMes: false }); prox = addDias(prox, 1); }
    const semanas = [];
    for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
    return semanas;
  }

  // ---------- Formatação ----------

  const fmtData = (iso) => (ehData(iso) ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '');
  const fmtMoeda = (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const horarioTexto = (e) => (diaInteiro(e) ? 'Dia inteiro' : `${e.inicio}${e.fim ? `–${e.fim}` : ''}`);
  const publicoTexto = (e) => ({ todos: 'Todos os alunos', formacoes: 'Formações selecionadas', turmas: 'Turmas selecionadas' }[e.publico?.tipo] ?? '');
  const restricaoTexto = (e) => ({ adolescentes: 'Só para menores de 18 anos', adultos: 'Só para maiores de 18 anos' }[e.restricao] ?? '');

  // ---------- Validação / manutenção (para um futuro cadastro administrativo) ----------

  function validar(dados, l = [], idAtual = null) {
    const erros = [];
    const titulo = String(dados.titulo ?? '').trim();
    if (!titulo) erros.push({ campo: 'titulo', mensagem: 'Informe o título do evento.' });
    else if (titulo.length > 120) erros.push({ campo: 'titulo', mensagem: 'Use até 120 caracteres.' });
    if (!TIPOS_EVENTO.some((t) => t.id === dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo.' });
    if (!ehData(dados.data)) erros.push({ campo: 'data', mensagem: 'Informe a data.' });
    if (dados.inicio && !ehHora(dados.inicio)) erros.push({ campo: 'inicio', mensagem: 'Horário de início inválido.' });
    if (dados.fim && !ehHora(dados.fim)) erros.push({ campo: 'fim', mensagem: 'Horário de término inválido.' });
    else if (dados.inicio && dados.fim && dados.fim <= dados.inicio) erros.push({ campo: 'fim', mensagem: 'O término deve ser depois do início.' });
    const p = dados.publico ?? {};
    if (!['todos', 'formacoes', 'turmas'].includes(p.tipo)) erros.push({ campo: 'publico', mensagem: 'Escolha o público.' });
    else if (p.tipo !== 'todos' && !(p.ids ?? []).length) erros.push({ campo: 'publico', mensagem: p.tipo === 'formacoes' ? 'Escolha ao menos uma formação.' : 'Escolha ao menos uma turma.' });
    if (dados.restricao && !['adolescentes', 'adultos'].includes(dados.restricao)) erros.push({ campo: 'restricao', mensagem: 'Restrição inválida.' });
    const i = dados.inscricao ?? {};
    if (i.necessaria) {
      if (i.vagas != null && (!Number.isInteger(Number(i.vagas)) || Number(i.vagas) <= 0)) erros.push({ campo: 'vagas', mensagem: 'Vagas deve ser um número inteiro maior que zero.' });
      if (i.prazo && !ehData(i.prazo)) erros.push({ campo: 'prazo', mensagem: 'Prazo inválido.' });
      else if (i.prazo && ehData(dados.data) && i.prazo > dados.data) erros.push({ campo: 'prazo', mensagem: 'O prazo de inscrição não pode passar da data do evento.' });
    }
    if (Number(dados.custo ?? 0) < 0) erros.push({ campo: 'custo', mensagem: 'O custo não pode ser negativo.' });
    if (!STATUS_EVENTO.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Escolha o status.' });
    if (titulo && ehData(dados.data) && l.some((e) => e.id !== idAtual && e.data === dados.data && e.titulo.trim().toLowerCase() === titulo.toLowerCase())) {
      erros.push({ campo: 'titulo', mensagem: 'Já existe um evento com esse título nessa data.' });
    }
    return erros;
  }

  function novoId(l) {
    let n = l.length + 1;
    while (l.some((e) => e.id === `ev${n}`)) n += 1;
    return `ev${n}`;
  }
  function limpar(dados) {
    return {
      tipo: dados.tipo, titulo: String(dados.titulo).trim(), descricao: String(dados.descricao ?? '').trim(),
      data: dados.data, inicio: dados.inicio || null, fim: dados.fim || null,
      local: { nome: String(dados.local?.nome ?? '').trim(), endereco: String(dados.local?.endereco ?? '').trim() },
      publico: { tipo: dados.publico?.tipo ?? 'todos', ids: dados.publico?.tipo === 'todos' ? [] : [...(dados.publico?.ids ?? [])] },
      restricao: dados.restricao || null,
      inscricao: { necessaria: Boolean(dados.inscricao?.necessaria), vagas: dados.inscricao?.necessaria && dados.inscricao?.vagas ? Number(dados.inscricao.vagas) : null, prazo: dados.inscricao?.necessaria ? dados.inscricao?.prazo || null : null },
      custo: Number(dados.custo ?? 0), obrigatorio: Boolean(dados.obrigatorio), status: dados.status ?? 'confirmado',
    };
  }
  const incluir = (l, dados) => { const evento = { id: novoId(l), ...limpar(dados) }; return { lista: [...l, evento], evento }; };
  const atualizar = (l, id, dados) => l.map((e) => (e.id === id ? { ...e, ...limpar(dados) } : e));
  const remover = (l, id) => l.filter((e) => e.id !== id);

  return {
    CHAVE, CHAVE_INSCRICOES, carregar, salvar, carregarInscricoes, salvarInscricoes,
    porId, tipoDe, statusDe, ehData, addDias, idadeEm, atendeRestricao, atendePublico, paraAluno, porMes, porDia, proximos, ordenar,
    inscritos, inscrito, vagasRestantes, prazoEncerrado, impedimento, inscrever, cancelarInscricao,
    gradeDoMes, diaInteiro, fmtData, fmtMoeda, horarioTexto, publicoTexto, restricaoTexto,
    validar, incluir, atualizar, remover,
  };
})();
