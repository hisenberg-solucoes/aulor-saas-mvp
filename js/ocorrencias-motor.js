// ============================================================
// Motor das OCORRÊNCIAS DO ALUNO: regras puras (sem DOM) e persistência.
// Depende de js/ocorrencias-data.js. Não depende de outros motores: quem
// chama resolve aluno/turma/responsável (Clientes, Turmas) e passa nomes.
//
// Uma chave (prototipo-ocorrencias-v1) com a lista inteira, gravada na
// primeira alteração; antes disso vale a semente, relativa ao hoje do navegador.
//
// Uso típico:
//   const lista = Ocorrencias.carregar();
//   const r = Ocorrencias.registrar(lista, { alunoId, turmaId, tipo, texto, canal, responsavelId, em });
//   if (r.erros) …; else Ocorrencias.salvar(r.lista);
//   Ocorrencias.porAluno(lista, alunoId)              // mais recente primeiro
//   Ocorrencias.ultimaDoAluno(lista, alunoId, { tipo: 'contato_frequencia' })
//   Ocorrencias.parametrosNova(location.search)       // { tipo, turmaId } da URL ?nova=&turma=
// ============================================================

const Ocorrencias = (() => {
  const CHAVE = 'aulor-v1-ocorrencias-v1';
  const TEXTO_MAX = 2000;
  const PERIODOS = [
    { id: '7', nome: 'Últimos 7 dias', dias: 7 },
    { id: '30', nome: 'Últimos 30 dias', dias: 30 },
    { id: '90', nome: 'Últimos 90 dias', dias: 90 },
  ];

  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const pad = (n) => String(n).padStart(2, '0');

  // "Hoje"/"agora" = data local do navegador (padrão do projeto desde 08/09/2026).
  function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function agora() {
    const d = new Date();
    return `${hoje()}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const dataDe = (em) => String(em ?? '').slice(0, 10);
  const EM_VALIDO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  const tipoDe = (id) => TIPOS_OCORRENCIA.find((t) => t.id === id) ?? null;
  const canalDe = (id) => CANAIS_OCORRENCIA.find((c) => c.id === id) ?? null;
  const ehContato = (tipo) => String(tipo ?? '').startsWith('contato_');
  const periodoDe = (id) => PERIODOS.find((p) => p.id === String(id)) ?? null;

  // ---------- Persistência ----------

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return clonar(OCORRENCIAS_SEED);
  }
  function salvar(lista) { localStorage.setItem(CHAVE, JSON.stringify(lista)); }

  const porId = (lista, id) => lista.find((o) => o.id === id) ?? null;
  function novoId(lista) {
    let n = lista.length + 1;
    while (lista.some((o) => o.id === `oc${n}`)) n += 1;
    return `oc${n}`;
  }

  // ---------- Regras ----------

  // Normaliza o que veio do formulário: canal só em tipos de contato, responsável só em contato_responsavel.
  function normalizarDados(dados) {
    const tipo = String(dados.tipo ?? '').trim();
    const canal = ehContato(tipo) && dados.canal ? String(dados.canal).trim() : null;
    const responsavelId = tipo === 'contato_responsavel' && dados.responsavelId ? String(dados.responsavelId).trim() : null;
    return {
      alunoId: String(dados.alunoId ?? '').trim(),
      turmaId: dados.turmaId ? String(dados.turmaId).trim() : null,
      tipo,
      texto: String(dados.texto ?? '').trim(),
      canal,
      responsavelId,
      em: dados.em ? String(dados.em).trim().slice(0, 16) : agora(),
    };
  }

  function validar(dados) {
    const erros = [];
    const d = dados ?? {};
    const tipo = String(d.tipo ?? '').trim();
    if (!String(d.alunoId ?? '').trim()) erros.push({ campo: 'alunoId', mensagem: 'Escolha o aluno.' });
    if (!tipo) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo da ocorrência.' });
    else if (!tipoDe(tipo)) erros.push({ campo: 'tipo', mensagem: 'Tipo inválido.' });
    const texto = String(d.texto ?? '').trim();
    if (!texto) erros.push({ campo: 'texto', mensagem: 'Descreva o que aconteceu.' });
    else if (texto.length > TEXTO_MAX) erros.push({ campo: 'texto', mensagem: `Máximo de ${TEXTO_MAX} caracteres.` });
    if (d.canal) {
      if (!ehContato(tipo)) erros.push({ campo: 'canal', mensagem: 'Canal só vale para ocorrências de contato.' });
      else if (!canalDe(d.canal)) erros.push({ campo: 'canal', mensagem: 'Canal inválido.' });
    }
    if (d.responsavelId && tipo !== 'contato_responsavel') erros.push({ campo: 'responsavelId', mensagem: 'Responsável contatado só vale para "Contato com responsável".' });
    if (d.em !== undefined && d.em !== null && d.em !== '') {
      const em = String(d.em).slice(0, 16);
      if (!EM_VALIDO.test(em) || Number.isNaN(new Date(em).getTime())) erros.push({ campo: 'em', mensagem: 'Data e hora inválidas.' });
      else if (em > agora()) erros.push({ campo: 'em', mensagem: 'A ocorrência não pode estar no futuro.' });
    }
    return erros;
  }

  function registrar(lista, dados, autor = AUTOR_PADRAO_OCORRENCIA) {
    const erros = validar(dados);
    if (erros.length) return { erros };
    const d = normalizarDados(dados);
    const ocorrencia = { id: novoId(lista), ...d, autor: { nome: String(autor?.nome ?? AUTOR_PADRAO_OCORRENCIA.nome) }, editadoEm: null };
    return { lista: [...lista, ocorrencia], ocorrencia };
  }

  // Edita campos informados; o autor original fica, `editadoEm` marca a alteração.
  function editar(lista, id, dados) {
    const atual = porId(lista, id);
    if (!atual) return { erros: [{ campo: 'id', mensagem: 'Ocorrência não encontrada.' }] };
    const mesclado = { ...atual, ...dados };
    // Mudou o tipo? Canal/responsável antigos não valem mais para o tipo novo — não são erro do usuário.
    if (!ehContato(mesclado.tipo)) mesclado.canal = null;
    if (mesclado.tipo !== 'contato_responsavel') mesclado.responsavelId = null;
    const erros = validar(mesclado);
    if (erros.length) return { erros };
    const d = normalizarDados(mesclado);
    const ocorrencia = { ...atual, ...d, editadoEm: agora() };
    return { lista: lista.map((o) => (o.id === id ? ocorrencia : o)), ocorrencia };
  }

  const excluir = (lista, id) => lista.filter((o) => o.id !== id);

  // ---------- Consultas ----------

  const maisRecentePrimeiro = (a, b) => String(b.em).localeCompare(String(a.em)) || String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
  const ordenar = (lista) => [...lista].sort(maisRecentePrimeiro);
  const porAluno = (lista, alunoId) => ordenar(lista.filter((o) => o.alunoId === alunoId));
  const porTurma = (lista, turmaId) => ordenar(lista.filter((o) => o.turmaId === turmaId));
  const ultimaDoAluno = (lista, alunoId, { tipo = null } = {}) => porAluno(lista, alunoId).find((o) => !tipo || o.tipo === tipo) ?? null;
  const contarPorAluno = (lista, alunoId) => lista.filter((o) => o.alunoId === alunoId).length;

  // Lista geral com filtros. `textoDe(o)` devolve o texto pesquisável extra (nome do aluno, turma…);
  // `formacaoDaTurma(turmaId)` resolve a formação para o filtro por formação.
  function filtrar(lista, { busca = '', tipo = '', periodo = '', turmaId = '', formacaoId = '', alunoId = '' } = {}, { textoDe = () => '', formacaoDaTurma = () => null, ref = hoje() } = {}) {
    const b = normalizar(busca);
    const p = periodoDe(periodo);
    const limite = p ? (() => { const [a, m, d] = ref.split('-').map(Number); const dt = new Date(a, m - 1, d - p.dias + 1); return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`; })() : null;
    return ordenar(lista.filter((o) => (!tipo || o.tipo === tipo)
      && (!alunoId || o.alunoId === alunoId)
      && (!turmaId || o.turmaId === turmaId)
      && (!formacaoId || (o.turmaId && formacaoDaTurma(o.turmaId) === formacaoId))
      && (!limite || dataDe(o.em) >= limite)
      && (!b || normalizar(`${o.texto} ${tipoDe(o.tipo)?.nome ?? ''} ${o.autor?.nome ?? ''} ${textoDe(o)}`).includes(b))));
  }

  // Parâmetros de URL para abrir o modal já preenchido: aluno.html?id=&aba=ocorrencias&nova=<tipo>&turma=<turmaId>.
  // Devolve null quando não há `nova` ou o tipo é inválido.
  function parametrosNova(search) {
    const p = new URLSearchParams(search ?? '');
    const tipo = p.get('nova');
    if (!tipo || !tipoDe(tipo)) return null;
    return { tipo, turmaId: p.get('turma') || null };
  }

  // ---------- Formatação ----------

  const fmtData = (iso) => (iso ? `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}/${String(iso).slice(0, 4)}` : '—');
  const fmtDataHora = (em) => (em ? `${fmtData(em)} ${String(em).slice(11, 16)}`.trim() : '—');

  return {
    CHAVE, TIPOS: TIPOS_OCORRENCIA, CANAIS: CANAIS_OCORRENCIA, PERIODOS, TEXTO_MAX, AUTOR_PADRAO: AUTOR_PADRAO_OCORRENCIA,
    hoje, agora, normalizar, tipoDe, canalDe, ehContato, periodoDe,
    carregar, salvar, porId, novoId,
    validar, registrar, editar, excluir,
    porAluno, porTurma, ultimaDoAluno, contarPorAluno, filtrar, ordenar, parametrosNova,
    fmtData, fmtDataHora,
  };
})();
