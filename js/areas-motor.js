// ============================================================
// Motor da tela "Áreas": regras puras (sem DOM).
// Persistência em localStorage — trocar o sufixo da chave força reset.
// Cursos (curso.areaId) e formações (formacao.areaId) apontam para cá.
// ============================================================

const Areas = (() => {
  const CHAVE = 'prototipo-areas-v2';

  const clonar = (x) => JSON.parse(JSON.stringify(x));

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo).map((a) => (CORES_AREA_MIGRADAS[a.cor] ? { ...a, cor: CORES_AREA_MIGRADAS[a.cor] } : a));
    } catch (_) { /* volta para a semente */ }
    return clonar(AREAS_SEED);
  }

  function salvar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  }

  const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const porId = (lista, id) => lista.find((a) => a.id === id) ?? null;
  const nomeDe = (lista, id) => porId(lista, id)?.nome ?? (id ? 'Área removida' : '');
  const cor = (area) => CORES_AREA.find((c) => c.id === area?.cor) ?? COR_AREA_REMOVIDA;
  const ordenar = (lista) => [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  // Opções para selects: ativas + a já escolhida (mesmo inativa), em ordem alfabética.
  const opcoes = (lista, idAtual = null) => ordenar(lista.filter((a) => a.status === 'ativa' || a.id === idAtual));

  function novoId(lista) {
    let n = lista.length + 1;
    while (lista.some((a) => a.id === `ar${n}`)) n += 1;
    return `ar${n}`;
  }

  function filtrar(lista, { busca = '', status = '' } = {}) {
    const termo = normalizar(busca);
    return ordenar(lista)
      .filter((a) => !termo || normalizar(`${a.nome} ${a.descricao}`).includes(termo))
      .filter((a) => !status || a.status === status);
  }

  // Quantos cursos e formações apontam para a área.
  function uso(id, cursos = [], formacoes = []) {
    const c = cursos.filter((x) => x.areaId === id);
    const f = formacoes.filter((x) => x.areaId === id);
    return { cursos: c.length, formacoes: f.length, total: c.length + f.length, cursosAtivos: c.filter((x) => x.status === 'ativo').length, formacoesAtivas: f.filter((x) => x.status === 'ativo').length };
  }

  // RN2: excluir só sem uso (nem histórico). Com uso, inativar.
  const podeExcluir = (id, cursos, formacoes) => uso(id, cursos, formacoes).total === 0;

  function validar(dados, lista, idAtual = null) {
    const erros = [];
    const outras = lista.filter((a) => a.id !== idAtual);
    const nome = String(dados.nome ?? '').trim();
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome da área.' });
    else if (nome.length < 2 || nome.length > 60) erros.push({ campo: 'nome', mensagem: 'Use de 2 a 60 caracteres.' });
    else if (outras.some((a) => normalizar(a.nome) === normalizar(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe uma área com esse nome.' });
    if (!CORES_AREA.some((c) => c.id === dados.cor)) erros.push({ campo: 'cor', mensagem: 'Escolha uma cor.' });
    if (dados.status && !STATUS_AREA.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    return erros;
  }

  function limpar(dados) {
    return {
      nome: String(dados.nome).trim(),
      descricao: String(dados.descricao ?? '').trim(),
      cor: dados.cor,
      ...(dados.status ? { status: dados.status } : {}),
    };
  }

  function incluir(lista, dados) {
    const area = { id: novoId(lista), status: 'ativa', ...limpar(dados) };
    return { lista: [...lista, area], area };
  }

  const atualizar = (lista, id, dados) => lista.map((a) => (a.id === id ? { ...a, ...limpar(dados) } : a));
  const alterarStatus = (lista, id, status) => lista.map((a) => (a.id === id ? { ...a, status } : a));
  const remover = (lista, id) => lista.filter((a) => a.id !== id);

  return { CHAVE, carregar, salvar, normalizar, porId, nomeDe, cor, ordenar, opcoes, filtrar, uso, podeExcluir, validar, incluir, atualizar, alterarStatus, remover };
})();
