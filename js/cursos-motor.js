// ============================================================
// Motor da tela "Cursos": regras puras (sem DOM).
// Persistência em localStorage — trocar o sufixo da chave força reset.
// ============================================================

const Cursos = (() => {
  const CHAVE = 'aulor-v1-cursos-v8'; // v8 (28/10/2026): área em texto livre e sem eixo

  function clonar(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo).map(migrarSoftwares).map(migrarSugestoes);
    } catch (_) { /* volta para a semente */ }
    return clonar(CURSOS_SEED).map(migrarSoftwares).map(migrarSugestoes);
  }

  function urlValida(url) {
    try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:'; } catch (_) { return false; }
  }

  // ---------- Softwares requeridos ----------
  // Item: { softwareId (id do catálogo ou null quando é "fora do catálogo"), nome, observacao, site }.
  // `site` só vale para item fora do catálogo — quem está no catálogo usa o site de SOFTWARES_CATALOGO.
  // Dados antigos guardavam só o nome em texto — casa com o catálogo pelo nome quando dá.

  function chaveSoftware(item) {
    return item.softwareId ?? `livre:${normalizar(item.nome)}`;
  }

  // Nomes antigos (texto livre) que correspondem a itens do catálogo.
  const APELIDOS_SOFTWARE = {
    'python 3.12': 'python', 'jdk 21': 'jdk', '.net sdk 8': 'dotnet', 'node.js': 'node', 'intellij idea': 'intellij',
    'mysql server': 'mysql', 'mysql workbench': 'mysql', 'postgresql': 'postgres', 'dbeaver': 'dbeaver', 'jupyter': 'jupyter',
  };

  function softwareDeTexto(nome) {
    const n = normalizar(nome);
    const cat = typeof SOFTWARES_CATALOGO !== 'undefined' ? SOFTWARES_CATALOGO : [];
    const achado = cat.find((s) => normalizar(s.nome) === n) ?? cat.find((s) => s.id === APELIDOS_SOFTWARE[n]);
    return achado ? { softwareId: achado.id, nome: achado.nome, observacao: '', site: '' } : { softwareId: null, nome: String(nome).trim(), observacao: '', site: '' };
  }

  function migrarSoftwares(curso) {
    const infra = curso.infraestrutura ?? { sala: null, softwares: [], requisitosMaquina: '' };
    const vistos = new Set();
    const softwares = (infra.softwares ?? [])
      .map((s) => (typeof s === 'string' ? softwareDeTexto(s) : { softwareId: s.softwareId ?? null, nome: String(s.nome ?? '').trim(), observacao: String(s.observacao ?? '').trim(), site: String(s.site ?? '').trim() }))
      .filter((s) => s.nome && !vistos.has(chaveSoftware(s)) && vistos.add(chaveSoftware(s)));
    return { ...curso, infraestrutura: { ...infra, softwares } };
  }

  function salvar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  }

  function normalizar(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function novoId(itens, prefixo) {
    let n = itens.length + 1;
    while (itens.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  }

  function porId(lista, id) {
    return lista.find((c) => c.id === id) ?? null;
  }

  function numero(v) {
    if (v === '' || v == null) return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  // ---------- Lista ----------

  function filtrar(lista, { busca = '', area = '', status = '', formato = '', nivel = '' } = {}) {
    const termo = normalizar(busca);
    return lista
      .filter((c) => !termo || normalizar(`${c.codigo} ${c.nome} ${c.resumo}`).includes(termo))
      .filter((c) => !area || normalizar(c.area) === normalizar(area))
      .filter((c) => !status || c.status === status)
      .filter((c) => !formato || c.formatos.includes(formato))
      .filter((c) => !nivel || c.nivel === nivel)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // Área é texto livre (como na API, sem cadastro): sugestões e filtro saem dos nomes já usados, sem repetir por caixa ou acento.
  function areasUsadas(...listas) {
    const porChave = new Map();
    listas.flat().forEach((x) => { const nome = String(x.area ?? '').trim(); if (nome && !porChave.has(normalizar(nome))) porChave.set(normalizar(nome), nome); });
    return [...porChave.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  // ---------- Relações (só leitura) ----------

  // Formações: se a tela de formações já persistiu algo, vale o que está lá; senão, a semente `FORMACOES_CURSO`.
  function fonteFormacoes() {
    try {
      const salvo = localStorage.getItem('aulor-v1-formacoes-v7');
      if (salvo) return JSON.parse(salvo).map((f) => ({ id: f.id, codigo: f.codigo ?? '', nome: f.nome, status: f.status, cursoIds: f.itens.map((i) => i.cursoId) }));
    } catch (_) { /* usa a semente */ }
    // Semente antiga guarda "SIGLA · Nome" num campo só; separa para a sigla sair em coluna própria.
    return FORMACOES_CURSO.map((f) => { const m = /^([A-Z0-9]+) · (.+)$/.exec(f.nome); return m ? { ...f, codigo: m[1], nome: m[2] } : { ...f, codigo: '' }; });
  }

  function formacoesDoCurso(cursoId) {
    return fonteFormacoes().filter((f) => f.cursoIds.includes(cursoId)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // Turmas: se a tela de turmas já persistiu algo, vale o que está lá; senão, a semente `TURMAS_CURSO`.
  function todasTurmas() {
    try {
      const salvo = localStorage.getItem('aulor-v1-turmas-v11');
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* usa a semente */ }
    return TURMAS_CURSO;
  }

  function turmasDoCurso(cursoId) {
    return todasTurmas().filter((t) => t.cursoId === cursoId && t.status !== 'cancelada').sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  function podeExcluir(cursoId) {
    return !todasTurmas().some((t) => t.cursoId === cursoId) && formacoesDoCurso(cursoId).length === 0;
  }

  // ---------- Horas ----------

  function horasDistribuidas(curso) {
    return curso.modulos.reduce((s, m) => s + (Number(m.cargaHoraria) || 0), 0);
  }

  // Situação da distribuição de horas: 'ok' | 'faltam' | 'excede' | 'vazio'.
  function situacaoHoras(curso) {
    if (!curso.modulos.length) return { situacao: 'vazio', distribuidas: 0, diferenca: curso.cargaHoraria };
    const d = horasDistribuidas(curso);
    const diff = curso.cargaHoraria - d;
    return { situacao: diff === 0 ? 'ok' : diff > 0 ? 'faltam' : 'excede', distribuidas: d, diferenca: Math.abs(diff) };
  }

  // Pendências que impedem o curso de ser considerado "completo" para o comercial.
  function pendencias(curso) {
    const p = [];
    if (!curso.descricao.trim()) p.push('Descrição/objetivo');
    if (!curso.modulos.length) p.push('Conteúdo programático');
    else if (situacaoHoras(curso).situacao !== 'ok') p.push('Horas dos módulos ≠ carga horária');
    if (curso.comercial.precoReferencia == null) p.push('Preço de referência');
    return p;
  }

  // ---------- Validações ----------

  function validarDados(dados, lista, idAtual = null) {
    const erros = [];
    const outros = lista.filter((c) => c.id !== idAtual);
    const codigo = String(dados.codigo ?? '').trim();
    const nome = String(dados.nome ?? '').trim();
    if (!codigo) erros.push({ campo: 'codigo', mensagem: 'Informe o código (sigla) do curso.' });
    else if (!/^[A-Za-z0-9-]{2,10}$/.test(codigo)) erros.push({ campo: 'codigo', mensagem: 'Use de 2 a 10 letras/números, sem espaços.' });
    else if (outros.some((c) => normalizar(c.codigo) === normalizar(codigo))) erros.push({ campo: 'codigo', mensagem: 'Já existe um curso com esse código.' });
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome do curso.' });
    else if (outros.some((c) => normalizar(c.nome) === normalizar(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe um curso com esse nome.' });
    if (!dados.nivel) erros.push({ campo: 'nivel', mensagem: 'Escolha o nível.' });
    const ch = numero(dados.cargaHoraria);
    if (ch == null || Number.isNaN(ch) || ch <= 0) erros.push({ campo: 'cargaHoraria', mensagem: 'Carga horária deve ser maior que zero.' });
    const enc = numero(dados.encontros);
    if (enc != null && (Number.isNaN(enc) || enc <= 0 || !Number.isInteger(enc))) erros.push({ campo: 'encontros', mensagem: 'Número inteiro de encontros.' });
    const dur = numero(dados.duracaoAula);
    if (dur != null && (Number.isNaN(dur) || dur <= 0)) erros.push({ campo: 'duracaoAula', mensagem: 'Duração em horas, maior que zero.' });
    if (!dados.formatos?.length) erros.push({ campo: 'formatos', mensagem: 'Marque ao menos um formato.' });
    if (dados.status && !STATUS_CURSO.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    return erros;
  }

  function validarModulo(dados, modulos, idAtual = null) {
    const erros = [];
    const titulo = String(dados.titulo ?? '').trim();
    if (!titulo) erros.push({ campo: 'titulo', mensagem: 'Informe o título do módulo.' });
    else if (modulos.some((m) => m.id !== idAtual && normalizar(m.titulo) === normalizar(titulo))) erros.push({ campo: 'titulo', mensagem: 'Já existe um módulo com esse título.' });
    const ch = numero(dados.cargaHoraria);
    if (ch == null || Number.isNaN(ch) || ch <= 0) erros.push({ campo: 'cargaHoraria', mensagem: 'Carga horária do módulo maior que zero.' });
    return erros;
  }

  function validarCertificado(dados) {
    const erros = [];
    if (!dados.emite) return erros;
    const f = numero(dados.frequenciaMinima);
    if (f == null || Number.isNaN(f) || f < 0 || f > 100) erros.push({ campo: 'frequenciaMinima', mensagem: 'Frequência mínima entre 0 e 100%.' });
    if (dados.exigeAprovacao) {
      const n = numero(dados.notaMinima);
      if (n == null || Number.isNaN(n) || n < 0 || n > 10) erros.push({ campo: 'notaMinima', mensagem: 'Nota mínima entre 0 e 10.' });
    }
    return erros;
  }

  function validarComercial(dados) {
    const erros = [];
    const preco = numero(dados.precoReferencia);
    if (preco != null && (Number.isNaN(preco) || preco < 0)) erros.push({ campo: 'precoReferencia', mensagem: 'Preço inválido.' });
    const parc = numero(dados.parcelasMax);
    if (parc != null && (Number.isNaN(parc) || parc < 1 || !Number.isInteger(parc))) erros.push({ campo: 'parcelasMax', mensagem: 'Número inteiro de parcelas (≥ 1).' });
    const min = numero(dados.vagasMin);
    const max = numero(dados.vagasMax);
    if (min != null && (Number.isNaN(min) || min < 1 || !Number.isInteger(min))) erros.push({ campo: 'vagasMin', mensagem: 'Número inteiro (≥ 1).' });
    if (max != null && (Number.isNaN(max) || max < 1 || !Number.isInteger(max))) erros.push({ campo: 'vagasMax', mensagem: 'Número inteiro (≥ 1).' });
    if (min != null && max != null && !Number.isNaN(min) && !Number.isNaN(max) && min > max) erros.push({ campo: 'vagasMax', mensagem: 'Máximo deve ser maior ou igual ao mínimo.' });
    return erros;
  }

  // ---------- CRUD do curso ----------

  function cursoNovo(dados) {
    return {
      resumo: '', descricao: '', publicoAlvo: '',
      encontros: null, duracaoAula: null, formatos: [], modulos: [],
      certificado: { emite: true, frequenciaMinima: 75, exigeAprovacao: false, notaMinima: null },
      infraestrutura: { sala: null, softwares: [], requisitosMaquina: '' },
      sugestoesRequisitos: [],
      area: '',
      comercial: { precoReferencia: null, parcelasMax: null, vagasMin: null, vagasMax: null },
      ...dados,
    };
  }

  function limparDados(dados) {
    return {
      codigo: String(dados.codigo).trim().toUpperCase(),
      nome: String(dados.nome).trim(),
      area: String(dados.area ?? '').trim(),
      nivel: dados.nivel,
      cargaHoraria: numero(dados.cargaHoraria),
      encontros: numero(dados.encontros),
      duracaoAula: numero(dados.duracaoAula),
      formatos: FORMATOS.map((f) => f.id).filter((f) => dados.formatos.includes(f)),
      resumo: String(dados.resumo ?? '').trim(),
      ...(dados.status ? { status: dados.status } : {}),
    };
  }

  function incluir(lista, dados) {
    const curso = cursoNovo({ id: novoId(lista, 'c'), status: 'rascunho', ...limparDados(dados) });
    return { lista: [...lista, curso], curso };
  }

  function atualizar(lista, id, patch) {
    return lista.map((c) => (c.id === id ? { ...c, ...patch } : c));
  }

  function atualizarDados(lista, id, dados) {
    return atualizar(lista, id, limparDados(dados));
  }

  function remover(lista, id) {
    return lista.filter((c) => c.id !== id);
  }

  // ---------- Módulos (conteúdo programático) ----------

  function limparModulo(dados) {
    return {
      titulo: String(dados.titulo).trim(),
      cargaHoraria: numero(dados.cargaHoraria),
      topicos: String(dados.topicos ?? '').split('\n').map((t) => t.trim()).filter(Boolean),
    };
  }

  function incluirModulo(lista, cursoId, dados) {
    const curso = porId(lista, cursoId);
    const modulo = { id: novoId(curso.modulos, `${cursoId}-m`), ...limparModulo(dados) };
    return atualizar(lista, cursoId, { modulos: [...curso.modulos, modulo] });
  }

  function atualizarModulo(lista, cursoId, moduloId, dados) {
    const curso = porId(lista, cursoId);
    return atualizar(lista, cursoId, { modulos: curso.modulos.map((m) => (m.id === moduloId ? { ...m, ...limparModulo(dados) } : m)) });
  }

  function removerModulo(lista, cursoId, moduloId) {
    const curso = porId(lista, cursoId);
    return atualizar(lista, cursoId, { modulos: curso.modulos.filter((m) => m.id !== moduloId) });
  }

  function moverModulo(lista, cursoId, moduloId, delta) {
    const curso = porId(lista, cursoId);
    const modulos = [...curso.modulos];
    const i = modulos.findIndex((m) => m.id === moduloId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= modulos.length) return lista;
    [modulos[i], modulos[j]] = [modulos[j], modulos[i]];
    return atualizar(lista, cursoId, { modulos });
  }

  // ---------- Seções ----------

  function atualizarDescricao(lista, id, dados) {
    return atualizar(lista, id, {
      resumo: String(dados.resumo ?? '').trim(),
      descricao: String(dados.descricao ?? '').trim(),
      publicoAlvo: String(dados.publicoAlvo ?? '').trim(),
    });
  }

  function atualizarCertificado(lista, id, dados) {
    return atualizar(lista, id, {
      certificado: {
        emite: Boolean(dados.emite),
        frequenciaMinima: dados.emite ? numero(dados.frequenciaMinima) : null,
        exigeAprovacao: Boolean(dados.emite && dados.exigeAprovacao),
        notaMinima: dados.emite && dados.exigeAprovacao ? numero(dados.notaMinima) : null,
        templateId: dados.emite ? (dados.templateId || null) : null, // null = template padrão de curso
      },
    });
  }

  function atualizarInfraestrutura(lista, id, dados) {
    return atualizar(lista, id, {
      infraestrutura: {
        sala: dados.sala || null,
        softwares: porId(lista, id).infraestrutura.softwares,
        requisitosMaquina: String(dados.requisitosMaquina ?? '').trim(),
      },
    });
  }

  function atualizarComercial(lista, id, dados) {
    return atualizar(lista, id, {
      comercial: {
        precoReferencia: numero(dados.precoReferencia),
        parcelasMax: numero(dados.parcelasMax),
        vagasMin: numero(dados.vagasMin),
        vagasMax: numero(dados.vagasMax),
      },
    });
  }

  function definirSoftwares(lista, id, softwares) {
    const curso = porId(lista, id);
    return atualizar(lista, id, { infraestrutura: { ...curso.infraestrutura, softwares: migrarSoftwares({ infraestrutura: { softwares } }).infraestrutura.softwares } });
  }

  function adicionarSoftwaresDoCatalogo(lista, id, softwareIds) {
    const curso = porId(lista, id);
    const novos = softwareIds.map((sid) => softwareDoCatalogo(sid)).filter(Boolean).map((s) => ({ softwareId: s.id, nome: s.nome, observacao: '', site: '' }));
    return definirSoftwares(lista, id, [...curso.infraestrutura.softwares, ...novos]);
  }

  function validarSoftwareLivre(dados, curso) {
    const nome = String(dados.nome ?? '').trim();
    if (!nome) return [{ campo: 'nome', mensagem: 'Informe o nome do software.' }];
    if (nome.length > 80) return [{ campo: 'nome', mensagem: 'No máximo 80 caracteres.' }];
    const ja = curso.infraestrutura.softwares.some((s) => normalizar(s.nome) === normalizar(nome));
    if (ja) return [{ campo: 'nome', mensagem: 'Este software já está na lista.' }];
    const cat = SOFTWARES_CATALOGO.find((s) => normalizar(s.nome) === normalizar(nome));
    if (cat) return [{ campo: 'nome', mensagem: `"${cat.nome}" está no catálogo — use "Adicionar do catálogo".` }];
    return validarSite(dados.site);
  }

  // Site de onde baixar (só para item fora do catálogo): opcional, mas http(s) quando preenchido.
  function validarSite(site) {
    const u = String(site ?? '').trim();
    if (!u) return [];
    return urlValida(u) ? [] : [{ campo: 'site', mensagem: 'Endereço completo, começando com https://.' }];
  }

  function adicionarSoftwareLivre(lista, id, dados) {
    const curso = porId(lista, id);
    return definirSoftwares(lista, id, [...curso.infraestrutura.softwares, { softwareId: null, nome: String(dados.nome).trim(), observacao: String(dados.observacao ?? '').trim(), site: String(dados.site ?? '').trim() }]);
  }

  function atualizarObservacaoSoftware(lista, id, chave, observacao, site = undefined) {
    const curso = porId(lista, id);
    return definirSoftwares(lista, id, curso.infraestrutura.softwares.map((s) => (chaveSoftware(s) === chave
      ? { ...s, observacao: String(observacao ?? '').trim(), ...(site === undefined ? {} : { site: String(site ?? '').trim() }) }
      : s)));
  }

  function removerSoftware(lista, id, chave) {
    const curso = porId(lista, id);
    return definirSoftwares(lista, id, curso.infraestrutura.softwares.filter((s) => chaveSoftware(s) !== chave));
  }

  // ---------- Sugestões dos instrutores (RN9) ----------
  // O instrutor mexe nos requisitos da TURMA dele (docs/turmas.md RN10) e, quando marca
  // "sugerir para o curso", o pedido cai aqui para a coordenação decidir. Aceitar aplica no
  // catálogo do curso (vale para as próximas turmas); recusar guarda o motivo. O que ele fez
  // na turma dele vale de qualquer jeito — a sugestão não trava a aula.
  // Item: { id, tipo: 'incluir'|'remover'|'maquina', softwareId, nome, observacao, texto,
  //         turmaId, turmaCodigo, instrutorId, instrutorNome, em, status: 'pendente'|'aceita'|'recusada', decididoEm, decididoPor, motivo }.

  function migrarSugestoes(curso) {
    return { ...curso, sugestoesRequisitos: curso.sugestoesRequisitos ?? [] };
  }

  // Mais recentes primeiro; pendentes na frente.
  function sugestoesRequisitos(curso, status = null) {
    const l = (curso?.sugestoesRequisitos ?? []).filter((s) => !status || s.status === status);
    return [...l].sort((a, b) => (a.status === b.status ? String(b.em).localeCompare(String(a.em)) : a.status === 'pendente' ? -1 : b.status === 'pendente' ? 1 : 0));
  }

  const sugestoesPendentes = (curso) => sugestoesRequisitos(curso, 'pendente');

  function novoIdSugestao(curso) {
    let n = (curso.sugestoesRequisitos ?? []).length + 1;
    while ((curso.sugestoesRequisitos ?? []).some((s) => s.id === `sg${n}`)) n += 1;
    return `sg${n}`;
  }

  const comSugestoes = (lista, cursoId, fn) => lista.map((c) => (c.id === cursoId ? { ...c, sugestoesRequisitos: fn(migrarSugestoes(c)) } : c));

  // `dados`: { tipo, softwareId, nome, observacao, texto, turmaId, turmaCodigo, instrutorId, instrutorNome, em }.
  function sugerirRequisito(lista, cursoId, dados) {
    const curso = migrarSugestoes(porId(lista, cursoId) ?? {});
    if (!curso.id) return lista;
    const nova = {
      id: novoIdSugestao(curso),
      tipo: dados.tipo,
      softwareId: dados.softwareId ?? null,
      nome: String(dados.nome ?? '').trim(),
      observacao: String(dados.observacao ?? '').trim(),
      site: String(dados.site ?? '').trim(),
      texto: String(dados.texto ?? '').trim(),
      turmaId: dados.turmaId ?? null,
      turmaCodigo: String(dados.turmaCodigo ?? '').trim(),
      instrutorId: dados.instrutorId ?? null,
      instrutorNome: String(dados.instrutorNome ?? '').trim(),
      em: dados.em ?? new Date().toISOString().slice(0, 16),
      status: 'pendente',
      decididoEm: null, decididoPor: '', motivo: '',
    };
    return comSugestoes(lista, cursoId, (c) => [...c.sugestoesRequisitos, nova]);
  }

  // Descreve a sugestão em uma linha (usada na lista do curso e no toast).
  function textoSugestao(s) {
    if (s.tipo === 'incluir') return `Incluir "${s.nome}" nos softwares do curso`;
    if (s.tipo === 'remover') return `Remover "${s.nome}" dos softwares do curso`;
    return 'Alterar os requisitos de máquina do curso';
  }

  const decidirSugestao = (lista, cursoId, sugId, status, autor, motivo = '') => comSugestoes(lista, cursoId, (c) => c.sugestoesRequisitos.map((s) => (s.id === sugId
    ? { ...s, status, decididoEm: new Date().toISOString().slice(0, 16), decididoPor: String(autor ?? '').trim(), motivo: String(motivo ?? '').trim() }
    : s)));

  // Aceitar aplica no catálogo do curso e marca a sugestão.
  function aceitarSugestao(lista, cursoId, sugId, autor = '') {
    const curso = migrarSugestoes(porId(lista, cursoId) ?? {});
    const s = (curso.sugestoesRequisitos ?? []).find((x) => x.id === sugId);
    if (!s || s.status !== 'pendente') return lista;
    let nova = lista;
    if (s.tipo === 'incluir') {
      nova = s.softwareId
        ? adicionarSoftwaresDoCatalogo(nova, cursoId, [s.softwareId])
        : adicionarSoftwareLivre(nova, cursoId, { nome: s.nome, observacao: s.observacao, site: s.site });
    } else if (s.tipo === 'remover') {
      nova = removerSoftware(nova, cursoId, chaveSoftware({ softwareId: s.softwareId, nome: s.nome }));
    } else {
      const c = porId(nova, cursoId);
      nova = atualizar(nova, cursoId, { infraestrutura: { ...c.infraestrutura, requisitosMaquina: s.texto } });
    }
    return decidirSugestao(nova, cursoId, sugId, 'aceita', autor);
  }

  const recusarSugestao = (lista, cursoId, sugId, autor = '', motivo = '') => decidirSugestao(lista, cursoId, sugId, 'recusada', autor, motivo);

  function alterarStatus(lista, id, status) {
    return atualizar(lista, id, { status });
  }

  return {
    carregar, salvar, normalizar, porId, numero,
    filtrar, areasUsadas, formacoesDoCurso, todasTurmas, turmasDoCurso, podeExcluir,
    horasDistribuidas, situacaoHoras, pendencias,
    validarDados, validarModulo, validarCertificado, validarComercial,
    incluir, atualizarDados, remover,
    incluirModulo, atualizarModulo, removerModulo, moverModulo,
    atualizarDescricao, atualizarCertificado, atualizarInfraestrutura, atualizarComercial,
    alterarStatus,
    chaveSoftware, definirSoftwares, adicionarSoftwaresDoCatalogo, validarSoftwareLivre, validarSite, adicionarSoftwareLivre, atualizarObservacaoSoftware, removerSoftware,
    sugestoesRequisitos, sugestoesPendentes, sugerirRequisito, aceitarSugestao, recusarSugestao, textoSugestao,
  };
})();
