// ============================================================
// Motor do DOSSIÊ DO ALUNO: regras puras (sem DOM, exceto imprimir/injetarEstilos),
// persistência em localStorage e render do documento A4 (HTML com CSS próprio,
// padrão do certificado). Depende de js/dossies-data.js. Os motores externos
// (Turmas, Cursos, Formacoes, Clientes, Contratos, Instrutores, Presencas, Diario)
// são opcionais: sem eles a semente é vazia e tudo continua funcionando.
//
// Três chaves: templates (lista inteira), dossiês (SÓ as diferenças da semente
// gerada, merge por chave turma|aluno|período — padrão de Presencas) e envios
// (idem, merge por id).
//
// Uso típico:
//   const ctx = Dossies.contexto();                         // tudo carregado + índices
//   const itens = Dossies.listar(ctx, { turmaId, periodoId }); // (aluno × turma × período) montados
//   const item = Dossies.montar(ctx, turma, alunoId, periodoId);
//   Dossies.registrar(Dossies.carregar(), { turmaId, alunoId, periodoId, templateId }, registro)
//   Dossies.injetarEstilos(); el.innerHTML = Dossies.htmlDossie(item);
//   Dossies.imprimir(Dossies.htmlDocumento(itens, { titulo, capa: true }));
// ============================================================

const Dossies = (() => {
  const CHAVE_TEMPLATES = 'prototipo-templates-dossie-v1';
  const CHAVE = 'prototipo-dossies-v1';
  const CHAVE_ENVIOS = 'prototipo-dossies-envios-v1';

  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const hoje = () => (typeof Turmas !== 'undefined' ? Turmas.hoje() : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const agoraIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  const fmtData = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');
  const fmtNum = (n, casas = 1) => (n == null || Number.isNaN(n) ? '—' : Number(n).toFixed(casas).replace('.', ','));
  const vazio = (v) => v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v));
  const ehEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim());
  // Motores externos são `const` de topo (não ficam em globalThis): só `typeof` enxerga.
  const tem = (nome) => {
    switch (nome) {
      case 'Turmas': return typeof Turmas !== 'undefined';
      case 'Cursos': return typeof Cursos !== 'undefined';
      case 'Formacoes': return typeof Formacoes !== 'undefined';
      case 'Clientes': return typeof Clientes !== 'undefined';
      case 'Contratos': return typeof Contratos !== 'undefined';
      case 'Instrutores': return typeof Instrutores !== 'undefined';
      case 'INSTRUTORES': return typeof INSTRUTORES !== 'undefined';
      case 'Presencas': return typeof Presencas !== 'undefined';
      case 'Diario': return typeof Diario !== 'undefined';
      case 'FREQUENCIA_MINIMA': return typeof FREQUENCIA_MINIMA !== 'undefined';
      default: return false;
    }
  };

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const nomeMes = (ym) => { const [a, m] = String(ym ?? '').split('-').map(Number); return m ? `${MESES[m - 1]} de ${a}` : ''; };
  const mesCurto = (ym) => { const [a, m] = String(ym ?? '').split('-').map(Number); return m ? `${MESES_CURTOS[m - 1]}/${String(a).slice(2)}` : ''; };
  const diasNoMes = (ym) => { const [a, m] = ym.split('-').map(Number); return new Date(a, m, 0).getDate(); };
  const proximoMes = (ym) => { const [a, m] = ym.split('-').map(Number); return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`; };
  const capitalizar = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const tipoCampoDe = (id) => TIPOS_CAMPO_DOSSIE.find((t) => t.id === id) ?? null;
  const periodicidadeDe = (id) => PERIODICIDADES_DOSSIE.find((p) => p.id === id) ?? null;
  const statusTemplateDe = (id) => STATUS_TEMPLATE_DOSSIE.find((s) => s.id === id) ?? null;
  const situacaoDe = (id) => SITUACOES_DOSSIE.find((s) => s.id === id) ?? null;
  const tipoEnvioDe = (id) => TIPOS_ENVIO_DOSSIE.find((t) => t.id === id) ?? null;

  // =====================================================================
  // Templates
  // =====================================================================

  let cacheTemplates = null;
  function carregarTemplates() {
    if (cacheTemplates) return cacheTemplates;
    try {
      const salvo = localStorage.getItem(CHAVE_TEMPLATES);
      if (salvo) { cacheTemplates = JSON.parse(salvo); return cacheTemplates; }
    } catch (_) { /* volta para a semente */ }
    cacheTemplates = clonar(TEMPLATES_DOSSIE_SEED);
    return cacheTemplates;
  }
  function salvarTemplates(l) { localStorage.setItem(CHAVE_TEMPLATES, JSON.stringify(l)); cacheTemplates = l; }

  const templatePorId = (l, id) => l.find((t) => t.id === id) ?? null;
  function novoIdTemplate(l) {
    let n = l.length + 1;
    while (l.some((t) => t.id === `td${n}`)) n += 1;
    return `td${n}`;
  }
  // Ids de seção/campo únicos dentro do template.
  function novoIdEm(itens, prefixo) {
    let n = itens.length + 1;
    while (itens.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  }
  const campos = (t) => (t?.secoes ?? []).flatMap((s) => (s.campos ?? []).map((c) => ({ ...c, secaoId: s.id, secaoTitulo: s.titulo })));
  const blocosDe = (b) => ({ frequencia: b?.frequencia !== false, conteudo: b?.conteudo !== false, parecer: b?.parecer !== false });

  function filtrarTemplates(l, { busca = '', periodicidade = '', status = '' } = {}) {
    const b = normalizar(busca);
    return l.filter((t) => (!periodicidade || t.periodicidade === periodicidade) && (!status || t.status === status) && (!b || normalizar(`${t.nome} ${t.descricao}`).includes(b)))
      .sort((a, x) => (x.padrao - a.padrao) || a.nome.localeCompare(x.nome, 'pt-BR'));
  }

  function validarTemplate(dados, l, idAtual = null) {
    const erros = [];
    const nome = String(dados.nome ?? '').trim();
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Dê um nome ao modelo.' });
    else if (nome.length > 80) erros.push({ campo: 'nome', mensagem: 'Máximo de 80 caracteres.' });
    else if (l.some((t) => t.id !== idAtual && normalizar(t.nome) === normalizar(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe um modelo com esse nome.' });
    if (!periodicidadeDe(dados.periodicidade)) erros.push({ campo: 'periodicidade', mensagem: 'Escolha a periodicidade.' });
    if (dados.status !== undefined && !statusTemplateDe(dados.status)) erros.push({ campo: 'status', mensagem: 'Situação inválida.' });
    if (idAtual) {
      const atual = templatePorId(l, idAtual);
      if (atual?.padrao && dados.status && dados.status !== 'ativo') erros.push({ campo: 'status', mensagem: 'Este é o modelo padrão — defina outro padrão antes de tirá-lo do ar.' });
    }
    return erros;
  }

  function incluirTemplate(l, dados) {
    const d = hoje();
    const template = {
      id: novoIdTemplate(l), nome: String(dados.nome).trim(), descricao: String(dados.descricao ?? '').trim(),
      status: statusTemplateDe(dados.status) ? dados.status : 'rascunho', padrao: false,
      periodicidade: dados.periodicidade, blocos: blocosDe(dados.blocos),
      turmaIds: [], cursoIds: [], formacaoIds: [], secoes: [], criadoEm: d, atualizadoEm: d,
    };
    return { lista: [...l, template], template };
  }

  const tocar = (l, id, fn) => l.map((t) => (t.id === id ? { ...fn(t), atualizadoEm: hoje() } : t));

  function atualizarTemplate(l, id, dados) {
    return tocar(l, id, (t) => ({
      ...t,
      ...(dados.nome !== undefined ? { nome: String(dados.nome).trim() } : {}),
      ...(dados.descricao !== undefined ? { descricao: String(dados.descricao ?? '').trim() } : {}),
      ...(dados.periodicidade !== undefined ? { periodicidade: dados.periodicidade } : {}),
      ...(dados.status !== undefined ? { status: dados.status } : {}),
      ...(dados.blocos !== undefined ? { blocos: blocosDe({ ...t.blocos, ...dados.blocos }) } : {}),
    }));
  }

  function duplicarTemplate(l, id) {
    const o = templatePorId(l, id);
    if (!o) return { lista: l, template: null };
    let nome = `${o.nome} (cópia)`;
    let n = 2;
    while (l.some((t) => normalizar(t.nome) === normalizar(nome))) { nome = `${o.nome} (cópia ${n})`; n += 1; }
    const d = hoje();
    const template = { ...clonar(o), id: novoIdTemplate(l), nome, status: 'rascunho', padrao: false, turmaIds: [], cursoIds: [], formacaoIds: [], criadoEm: d, atualizadoEm: d };
    return { lista: [...l, template], template };
  }

  // Um único padrão; só um template ativo pode ser o padrão.
  function definirPadrao(l, id) {
    const t = templatePorId(l, id);
    if (!t || t.status !== 'ativo') return l;
    return l.map((x) => ({ ...x, padrao: x.id === id, ...(x.id === id ? { atualizadoEm: hoje() } : {}) }));
  }

  function podeRemoverTemplate(l, id, dossies = []) {
    const t = templatePorId(l, id);
    // Motivos sem ponto final: aparecem na segunda linha do item travado do menu "Mais".
    if (!t) return { pode: false, motivo: 'Modelo não encontrado' };
    if (t.padrao) return { pode: false, motivo: 'É o padrão — defina outro padrão antes' };
    const vinculos = [[t.turmaIds, 'turma', 'turmas'], [t.cursoIds, 'curso', 'cursos'], [t.formacaoIds, 'formação', 'formações']]
      .filter(([ids]) => ids?.length).map(([ids, s, p]) => `${ids.length} ${ids.length === 1 ? s : p}`);
    if (vinculos.length) return { pode: false, motivo: `Vinculado a ${vinculos.join(' e ')} — desvincule ou inative` };
    const n = (dossies ?? []).filter((d) => d.templateId === id).length;
    if (n) return { pode: false, motivo: `${n} dossiê${n === 1 ? '' : 's'} preenchido${n === 1 ? '' : 's'} com ele — inative em vez de excluir` };
    return { pode: true, motivo: '' };
  }
  const removerTemplate = (l, id) => l.filter((t) => t.id !== id);

  // ---------- Seções ----------

  function validarSecao(dados) {
    const erros = [];
    const titulo = String(dados.titulo ?? '').trim();
    if (!titulo) erros.push({ campo: 'titulo', mensagem: 'Dê um título à seção.' });
    else if (titulo.length > 80) erros.push({ campo: 'titulo', mensagem: 'Máximo de 80 caracteres.' });
    return erros;
  }
  function incluirSecao(l, id, { titulo, descricao = '' }) {
    let secao = null;
    const lista = tocar(l, id, (t) => {
      secao = { id: novoIdEm(t.secoes ?? [], 's'), titulo: String(titulo ?? '').trim(), descricao: String(descricao ?? '').trim(), campos: [] };
      return { ...t, secoes: [...(t.secoes ?? []), secao] };
    });
    return { lista, secao };
  }
  const atualizarSecao = (l, id, secaoId, dados) => tocar(l, id, (t) => ({
    ...t,
    secoes: t.secoes.map((s) => (s.id === secaoId ? { ...s, ...(dados.titulo !== undefined ? { titulo: String(dados.titulo).trim() } : {}), ...(dados.descricao !== undefined ? { descricao: String(dados.descricao ?? '').trim() } : {}) } : s)),
  }));
  const removerSecao = (l, id, secaoId) => tocar(l, id, (t) => ({ ...t, secoes: t.secoes.filter((s) => s.id !== secaoId) }));
  function moverSecao(l, id, secaoId, direcao) {
    return tocar(l, id, (t) => {
      const i = t.secoes.findIndex((s) => s.id === secaoId);
      const j = i + direcao;
      if (i < 0 || j < 0 || j >= t.secoes.length) return t;
      const copia = [...t.secoes];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return { ...t, secoes: copia };
    });
  }

  // ---------- Campos ----------

  function validarCampo(dados) {
    const erros = [];
    const rotulo = String(dados.rotulo ?? '').trim();
    if (!rotulo) erros.push({ campo: 'rotulo', mensagem: 'Informe o rótulo do campo.' });
    else if (rotulo.length > 80) erros.push({ campo: 'rotulo', mensagem: 'Máximo de 80 caracteres.' });
    if (!tipoCampoDe(dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo do campo.' });
    if (dados.tipo === 'opcoes') {
      const ops = limparOpcoes(dados.opcoes);
      if (ops.length < 2) erros.push({ campo: 'opcoes', mensagem: 'Informe ao menos 2 opções (uma por linha).' });
    }
    return erros;
  }
  // Aceita array ou texto com uma opção por linha; tira vazias e repetidas.
  function limparOpcoes(v) {
    const arr = Array.isArray(v) ? v : String(v ?? '').split(/\r?\n|;/);
    return [...new Set(arr.map((o) => String(o ?? '').trim()).filter(Boolean))];
  }
  const limparCampo = (dados, base = {}) => ({
    ...base,
    tipo: dados.tipo ?? base.tipo,
    rotulo: String(dados.rotulo ?? base.rotulo ?? '').trim(),
    descricao: String(dados.descricao ?? base.descricao ?? '').trim(),
    obrigatorio: dados.obrigatorio !== undefined ? dados.obrigatorio === true || dados.obrigatorio === 'on' || dados.obrigatorio === 'true' : (base.obrigatorio ?? false),
    opcoes: (dados.tipo ?? base.tipo) === 'opcoes' ? limparOpcoes(dados.opcoes !== undefined ? dados.opcoes : base.opcoes) : [],
  });

  function incluirCampo(l, id, secaoId, dados) {
    let campo = null;
    const lista = tocar(l, id, (t) => {
      campo = { id: novoIdEm(campos(t), 'c'), ...limparCampo(dados) };
      return { ...t, secoes: t.secoes.map((s) => (s.id === secaoId ? { ...s, campos: [...(s.campos ?? []), campo] } : s)) };
    });
    return { lista, campo };
  }
  const atualizarCampo = (l, id, campoId, dados) => tocar(l, id, (t) => ({
    ...t, secoes: t.secoes.map((s) => ({ ...s, campos: (s.campos ?? []).map((c) => (c.id === campoId ? { ...limparCampo(dados, c), id: c.id } : c)) })),
  }));
  const removerCampo = (l, id, campoId) => tocar(l, id, (t) => ({ ...t, secoes: t.secoes.map((s) => ({ ...s, campos: (s.campos ?? []).filter((c) => c.id !== campoId) })) }));
  // Só dentro da seção. direcao = -1 sobe, +1 desce.
  function moverCampo(l, id, campoId, direcao) {
    return tocar(l, id, (t) => ({
      ...t,
      secoes: t.secoes.map((s) => {
        const i = (s.campos ?? []).findIndex((c) => c.id === campoId);
        const j = i + direcao;
        if (i < 0 || j < 0 || j >= s.campos.length) return s;
        const copia = [...s.campos];
        [copia[i], copia[j]] = [copia[j], copia[i]];
        return { ...s, campos: copia };
      }),
    }));
  }

  // ---------- Vínculos e aplicação ----------

  const CHAVE_ALVO = { turma: 'turmaIds', curso: 'cursoIds', formacao: 'formacaoIds' };
  function vincular(l, id, alvo, alvoId) {
    const k = CHAVE_ALVO[alvo];
    if (!k || !alvoId) return l;
    return tocar(l, id, (t) => ((t[k] ?? []).includes(alvoId) ? t : { ...t, [k]: [...(t[k] ?? []), alvoId] }));
  }
  function desvincular(l, id, alvo, alvoId) {
    const k = CHAVE_ALVO[alvo];
    if (!k) return l;
    return tocar(l, id, (t) => ({ ...t, [k]: (t[k] ?? []).filter((x) => x !== alvoId) }));
  }

  // Template de uma turma: turma > curso > formação > padrão ativo > null. Só status 'ativo'.
  function templatePara(turma, curso, formacao, l = carregarTemplates()) {
    const ativos = l.filter((t) => t.status === 'ativo');
    const cursoId = curso?.id ?? turma?.cursoId ?? null;
    const formacaoId = formacao?.id ?? turma?.formacaoId ?? null;
    return (turma && ativos.find((t) => (t.turmaIds ?? []).includes(turma.id)))
      ?? (cursoId && ativos.find((t) => (t.cursoIds ?? []).includes(cursoId)))
      ?? (formacaoId && ativos.find((t) => (t.formacaoIds ?? []).includes(formacaoId)))
      ?? ativos.find((t) => t.padrao)
      ?? null;
  }

  function usos(template, turmas = [], cursos = [], formacoes = [], dossies = null) {
    const ds = dossies ?? (tem('Turmas') ? carregar() : []);
    return {
      turmas: turmas.filter((t) => (template.turmaIds ?? []).includes(t.id)),
      cursos: cursos.filter((c) => (template.cursoIds ?? []).includes(c.id)),
      formacoes: formacoes.filter((f) => (template.formacaoIds ?? []).includes(f.id)),
      dossies: ds.filter((d) => d.templateId === template.id).length,
    };
  }

  // =====================================================================
  // Períodos (calculados, nunca gravados)
  // =====================================================================

  // Períodos da turma até min(turma.fim, ref) — nunca gera período futuro; recorta pelo início/fim da turma.
  function periodos(turma, template, ref = hoje()) {
    if (!turma?.inicio || !turma?.fim) return [];
    const fimRef = turma.fim < ref ? turma.fim : ref;
    if (turma.inicio > fimRef) return [];
    const per = template?.periodicidade ?? 'mensal';
    if (per === 'curso') {
      return [{ id: 'curso', rotulo: 'Fechamento do curso', curto: 'curso', inicio: turma.inicio, fim: turma.fim, encerrado: turma.fim < ref }];
    }
    const brutos = [];
    let ym = turma.inicio.slice(0, 7);
    const ymFim = fimRef.slice(0, 7);
    while (ym <= ymFim) {
      const ultimo = String(diasNoMes(ym)).padStart(2, '0');
      if (per === 'quinzenal') {
        brutos.push({ id: `${ym}-q1`, rotulo: `1ª quinzena de ${nomeMes(ym)}`, curto: `${mesCurto(ym)} · 1ª q.`, inicio: `${ym}-01`, fim: `${ym}-15` });
        brutos.push({ id: `${ym}-q2`, rotulo: `2ª quinzena de ${nomeMes(ym)}`, curto: `${mesCurto(ym)} · 2ª q.`, inicio: `${ym}-16`, fim: `${ym}-${ultimo}` });
      } else {
        brutos.push({ id: ym, rotulo: capitalizar(nomeMes(ym)), curto: mesCurto(ym), inicio: `${ym}-01`, fim: `${ym}-${ultimo}` });
      }
      ym = proximoMes(ym);
    }
    return brutos
      .map((p) => ({ ...p, inicio: p.inicio < turma.inicio ? turma.inicio : p.inicio, fim: p.fim > turma.fim ? turma.fim : p.fim }))
      .filter((p) => p.inicio <= fimRef && p.inicio <= p.fim)
      .map((p) => ({ ...p, encerrado: p.fim < ref }));
  }
  // O período que contém `ref`, ou o último.
  function periodoAtual(turma, template, ref = hoje()) {
    const ps = periodos(turma, template, ref);
    return ps.find((p) => p.inicio <= ref && ref <= p.fim) ?? ps[ps.length - 1] ?? null;
  }
  const periodoPorId = (turma, template, id, ref = hoje()) => periodos(turma, template, ref).find((p) => p.id === id) ?? null;

  // =====================================================================
  // Dossiês (semente gerada + diferenças salvas)
  // =====================================================================

  const chaveDe = (turmaId, alunoId, periodoId) => `ds-${turmaId}-${alunoId}-${periodoId}`;
  let semente = null;
  let cache = null;
  function sementeAtual(base = null) {
    if (!semente) {
      semente = (typeof gerarSementeDossies === 'function' && tem('Turmas') && tem('Contratos'))
        ? gerarSementeDossies(base ?? contextoBase(), hoje()) : [];
    }
    return semente;
  }
  function carregar(base = null) {
    if (cache) return cache;
    let salvos = [];
    try { salvos = JSON.parse(localStorage.getItem(CHAVE) ?? '[]'); } catch (_) { salvos = []; }
    if (!Array.isArray(salvos)) salvos = [];
    const porChave = new Map(salvos.map((d) => [d.id, d]));
    const sem = sementeAtual(base);
    const lista = sem.map((d) => porChave.get(d.id) ?? d);
    const vistos = new Set(lista.map((d) => d.id));
    cache = [...lista, ...salvos.filter((d) => !vistos.has(d.id))];
    return cache;
  }
  // Grava só o que difere da semente (comparação por JSON).
  function salvar(lista) {
    const daSemente = new Map(sementeAtual().map((d) => [d.id, JSON.stringify(d)]));
    const diferentes = lista.filter((d) => daSemente.get(d.id) !== JSON.stringify(d));
    localStorage.setItem(CHAVE, JSON.stringify(diferentes));
    cache = lista;
  }
  const invalidar = () => { cache = null; semente = null; cacheTemplates = null; cacheEnvios = null; sementeEnvios = null; };

  const obter = (turmaId, alunoId, periodoId, lista = carregar()) => lista.find((d) => d.id === chaveDe(turmaId, alunoId, periodoId)) ?? null;
  const registroDe = (dossie, instrutorId) => dossie?.registros?.find((r) => r.instrutorId === instrutorId) ?? null;

  // Erros do registro contra o template: obrigatórios vazios e tipos/limites.
  function validarRegistro(template, registro) {
    const erros = [];
    const r = registro?.respostas ?? {};
    campos(template).forEach((c) => {
      const v = r[c.id];
      if (vazio(v)) { if (c.obrigatorio) erros.push({ campo: c.id, mensagem: 'Campo obrigatório.' }); return; }
      if (c.tipo === 'escala' && !(Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 5)) erros.push({ campo: c.id, mensagem: 'Escolha um nível de 1 a 5.' });
      else if (c.tipo === 'nota' && !(Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 10)) erros.push({ campo: c.id, mensagem: 'Nota de 0 a 10.' });
      else if (c.tipo === 'sim_nao' && typeof v !== 'boolean') erros.push({ campo: c.id, mensagem: 'Responda Sim ou Não.' });
      else if (c.tipo === 'opcoes' && !(c.opcoes ?? []).includes(v)) erros.push({ campo: c.id, mensagem: 'Escolha uma das opções.' });
      else if (c.tipo === 'texto_curto' && String(v).length > 140) erros.push({ campo: c.id, mensagem: 'Máximo de 140 caracteres.' });
      else if (c.tipo === 'texto_longo' && String(v).length > 2000) erros.push({ campo: c.id, mensagem: 'Máximo de 2.000 caracteres.' });
    });
    return erros;
  }

  const nomeInstrutor = (id) => {
    if (tem('Instrutores')) { const i = Instrutores.porId(Instrutores.carregar(), id); if (i) return i.nome; }
    if (tem('INSTRUTORES')) { const i = INSTRUTORES.find((x) => x.id === id); if (i) return i.nome; }
    return id ?? '';
  };
  function limparRegistro(reg) {
    const respostas = {};
    Object.entries(reg.respostas ?? {}).forEach(([k, v]) => { if (!vazio(v)) respostas[k] = v; });
    return {
      instrutorId: reg.instrutorId, instrutorNome: reg.instrutorNome || nomeInstrutor(reg.instrutorId),
      respostas, parecer: String(reg.parecer ?? '').trim(), atualizadoEm: reg.atualizadoEm ?? agoraIso(),
    };
  }
  // Cria o dossiê se não existe; substitui o registro daquele instrutor; throw Error('fechado') se fechado.
  function registrar(lista, { turmaId, alunoId, periodoId, templateId }, registro) {
    const id = chaveDe(turmaId, alunoId, periodoId);
    const atual = lista.find((d) => d.id === id) ?? null;
    if (atual?.fechadoEm) throw new Error('fechado');
    const novo = limparRegistro(registro);
    if (!atual) return [...lista, { id, turmaId, alunoId, periodoId, templateId, registros: [novo], fechadoEm: null, fechadoPor: null }];
    const existe = atual.registros.some((r) => r.instrutorId === novo.instrutorId);
    const registros = existe ? atual.registros.map((r) => (r.instrutorId === novo.instrutorId ? novo : r)) : [...atual.registros, novo];
    return lista.map((d) => (d.id === id ? { ...d, templateId: d.templateId ?? templateId, registros } : d));
  }
  const fechar = (lista, chave, por = 'Secretaria') => lista.map((d) => (d.id === chave ? { ...d, fechadoEm: agoraIso(), fechadoPor: String(por ?? '') } : d));
  const reabrir = (lista, chave) => lista.map((d) => (d.id === chave ? { ...d, fechadoEm: null, fechadoPor: null } : d));

  // Aulas da turma (agendadas ou prévia) — `aulas` pré-carregadas evitam recalcular por item.
  const aulasDaTurma = (turma, aulas = null) => aulas ?? (tem('Turmas') ? Turmas.aulas(turma) : (turma.aulas ?? []));
  // Aulas dadas no período: não canceladas, inicio ≤ data ≤ fim e data < ref.
  const aulasDoPeriodo = (turma, periodo, ref = hoje(), aulas = null) => aulasDaTurma(turma, aulas)
    .filter((a) => a.status !== 'cancelada' && a.data >= periodo.inicio && a.data <= periodo.fim && a.data < ref);

  // Instrutores das aulas do período (aula.instrutorId, senão o da turma); sem aulas → instrutor da turma.
  function professoresEsperados(turma, periodo, ref = hoje(), aulas = null) {
    const conta = new Map();
    aulasDoPeriodo(turma, periodo, ref, aulas).forEach((a) => {
      const id = a.instrutorId || turma.instrutorId || null;
      if (id) conta.set(id, (conta.get(id) ?? 0) + 1);
    });
    if (!conta.size && turma.instrutorId) conta.set(turma.instrutorId, 0);
    return [...conta.entries()].map(([instrutorId, n]) => ({ instrutorId, aulas: n }));
  }

  function situacao(dossie, esperados = [], template = null) {
    if (dossie?.fechadoEm) return 'fechado';
    const regs = dossie?.registros ?? [];
    if (!regs.length) return 'pendente';
    const validos = regs.filter((r) => !template || !validarRegistro(template, r).length);
    const ids = new Set(validos.map((r) => r.instrutorId));
    const todos = (esperados ?? []).every((e) => ids.has(e.instrutorId));
    return todos && validos.length === regs.length ? 'completo' : 'parcial';
  }

  // Frequência do aluno só com as aulas do período (+ `aulas: [{ aula, registro }]`), ou null sem Presencas.
  function frequenciaPeriodo(turma, alunoId, periodo, { minimo, ref = hoje(), aulas = null, lista = null, concluido = false } = {}) {
    if (!tem('Presencas')) return null;
    const as = aulasDoPeriodo(turma, periodo, ref, aulas);
    const opts = { concluido, ...(minimo != null ? { minimo } : {}), ...(lista ? { lista } : {}) };
    const f = Presencas.frequencia(turma.id, alunoId, as, ref, opts);
    return { ...f, aulas: as.map((a) => ({ aula: a, registro: lista ? (lista.find((r) => r.alunoId === alunoId && (r.aulaId && a.id ? r.aulaId === a.id : r.data === a.data)) ?? null) : Presencas.registroDe(turma.id, alunoId, a) })) };
  }

  // Conteúdo trabalhado no período: Diario.porAula quando existe, senão aula.conteudo / módulos da aula.
  function conteudoDoPeriodo(turma, periodo, { curso = null, ref = hoje(), aulas = null } = {}) {
    const modulosCurso = curso?.modulos ?? [];
    const tituloModulo = (id) => modulosCurso.find((m) => m.id === id)?.titulo ?? id;
    return aulasDoPeriodo(turma, periodo, ref, aulas).map((a) => {
      const diario = tem('Diario') ? Diario.porAula(turma.id, a) : null;
      const moduloIds = diario?.moduloIds?.length ? diario.moduloIds : (a.moduloIds ?? []);
      return { data: a.data, n: a.n ?? null, conteudo: diario?.conteudo || a.conteudo || '', moduloIds, modulos: moduloIds.map(tituloModulo), diario: !!diario };
    });
  }

  // Consolidação por seção/campo: média (escala/nota), contagem (sim_nao) e valores por professor.
  function consolidarRespostas(template, dossie) {
    const regs = dossie?.registros ?? [];
    return (template?.secoes ?? []).map((s) => ({
      secao: s,
      campos: (s.campos ?? []).map((c) => {
        const valores = regs.filter((r) => !vazio(r.respostas?.[c.id])).map((r) => ({ instrutorId: r.instrutorId, instrutorNome: r.instrutorNome, valor: r.respostas[c.id] }));
        let media = null; let sim = null; let resumo = '';
        if (c.tipo === 'escala' || c.tipo === 'nota') {
          const nums = valores.map((v) => Number(v.valor)).filter((n) => Number.isFinite(n));
          media = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
          resumo = media == null ? '' : (c.tipo === 'escala' ? `${fmtNum(media)} — ${ESCALA_DOSSIE.find((e) => e.valor === Math.round(media))?.rotulo ?? ''}` : `Média ${fmtNum(media)}`);
        } else if (c.tipo === 'sim_nao') {
          sim = valores.filter((v) => v.valor === true).length;
          resumo = valores.length ? (sim > 0 ? `${sim} de ${valores.length}: Sim` : `${valores.length} de ${valores.length}: Não`) : '';
        } else if (c.tipo === 'opcoes') {
          const conta = new Map();
          valores.forEach((v) => conta.set(v.valor, (conta.get(v.valor) ?? 0) + 1));
          resumo = [...conta.entries()].map(([k, n]) => (valores.length > 1 ? `${k} (${n})` : k)).join(' · ');
        } else {
          resumo = valores.length === 1 ? String(valores[0].valor) : (valores.length ? `${valores.length} registros` : '');
        }
        return { campo: c, media, sim, total: valores.length, valores, resumo };
      }),
    }));
  }

  // =====================================================================
  // Contexto e montagem
  // =====================================================================

  // Carrega tudo o que está disponível + índices (matrículas por turma, aulas por turma, presenças por aluno×turma).
  function contextoBase(ref = hoje()) {
    const turmas = tem('Turmas') ? Turmas.carregar() : [];
    const cursos = tem('Cursos') ? Cursos.carregar() : [];
    const formacoes = tem('Formacoes') ? Formacoes.carregar() : [];
    const clientes = tem('Clientes') ? Clientes.carregar() : { alunos: [], empresas: [] };
    const instrutores = tem('Instrutores') ? Instrutores.carregar() : (tem('INSTRUTORES') ? INSTRUTORES : []);
    const contratos = tem('Contratos') ? Contratos.carregar() : [];
    const templates = carregarTemplates();
    const mapa = (l) => new Map(l.map((x) => [x.id, x]));
    const mTurmas = mapa(turmas); const mCursos = mapa(cursos); const mFormacoes = mapa(formacoes);
    const mAlunos = mapa(clientes.alunos ?? []); const mEmpresas = mapa(clientes.empresas ?? []); const mInstrutores = mapa(instrutores);
    // Matrículas por turma (itens de contrato de vínculos aprovados), como Turmas.matriculas().linhas.
    const matriculasPorTurma = new Map();
    if (tem('Contratos')) {
      contratos.forEach((c) => Contratos.itensMatriculados(c).forEach((item) => {
        if (!item.turmaId) return;
        if (!matriculasPorTurma.has(item.turmaId)) matriculasPorTurma.set(item.turmaId, []);
        matriculasPorTurma.get(item.turmaId).push({ contrato: c, item, matricula: item, alunoId: item.alunoId });
      }));
    }
    const aulasPorTurma = new Map();
    let presencasPorChave = null;
    const templatesPorTurma = new Map();
    const ctx = {
      hoje: ref, turmas, cursos, formacoes, alunos: clientes.alunos ?? [], empresas: clientes.empresas ?? [], instrutores, contratos, templates,
      turmaDe: (id) => mTurmas.get(id) ?? null, cursoDe: (id) => mCursos.get(id) ?? null, formacaoDe: (id) => (id ? mFormacoes.get(id) ?? null : null),
      alunoDe: (id) => mAlunos.get(id) ?? null, empresaDe: (id) => (id ? mEmpresas.get(id) ?? null : null), instrutorDe: (id) => (id ? mInstrutores.get(id) ?? null : null),
      matriculasDe: (turma) => matriculasPorTurma.get(turma?.id) ?? [],
      aulasDe: (turma) => {
        if (!aulasPorTurma.has(turma.id)) aulasPorTurma.set(turma.id, aulasDaTurma(turma));
        return aulasPorTurma.get(turma.id);
      },
      presencasDe: (turmaId, alunoId) => {
        if (!tem('Presencas')) return [];
        if (!presencasPorChave) {
          presencasPorChave = new Map();
          Presencas.carregar().forEach((r) => { const k = `${r.turmaId}|${r.alunoId}`; if (!presencasPorChave.has(k)) presencasPorChave.set(k, []); presencasPorChave.get(k).push(r); });
        }
        return presencasPorChave.get(`${turmaId}|${alunoId}`) ?? [];
      },
      templateDe: (turma) => {
        if (!templatesPorTurma.has(turma.id)) templatesPorTurma.set(turma.id, templatePara(turma, mCursos.get(turma.cursoId) ?? null, turma.formacaoId ? mFormacoes.get(turma.formacaoId) ?? null : null, templates));
        return templatesPorTurma.get(turma.id);
      },
    };
    return ctx;
  }
  function contexto(ref = hoje()) {
    const ctx = contextoBase(ref);
    ctx.dossies = carregar(ctx);
    return ctx;
  }

  // Empresa do dossiê: contrato da matrícula (contratante empresa) > aluno.empresaId.
  function empresaDoAluno(ctx, alunoId, turmaId) {
    const linha = ctx.matriculasDe({ id: turmaId }).find((l) => l.alunoId === alunoId) ?? null;
    const c = linha?.contrato ?? null;
    if (c && c.contratante === 'empresa' && c.empresaId) { const e = ctx.empresaDe(c.empresaId); if (e) return e; }
    return ctx.empresaDe(ctx.alunoDe(alunoId)?.empresaId ?? null);
  }
  const nomeEmpresa = (e) => (e ? e.nomeFantasia || e.razaoSocial || '' : '');
  const nomeAluno = (a) => (a ? a.nomeSocial || a.nome || '' : '');
  const minimoDe = (curso) => curso?.certificado?.frequenciaMinima ?? (tem('FREQUENCIA_MINIMA') ? FREQUENCIA_MINIMA : 75);

  // Item completo de um dossiê (aluno × turma × período): o que as telas e o documento consomem. null sem template/período.
  function montar(ctx, turma, alunoId, periodoId, { ref = ctx.hoje ?? hoje() } = {}) {
    if (!turma) return null;
    const template = ctx.templateDe(turma);
    if (!template) return null;
    const periodo = periodoPorId(turma, template, periodoId, ref);
    if (!periodo) return null;
    const curso = ctx.cursoDe(turma.cursoId);
    const formacao = ctx.formacaoDe(turma.formacaoId);
    const aluno = ctx.alunoDe(alunoId);
    const empresa = empresaDoAluno(ctx, alunoId, turma.id);
    const linha = ctx.matriculasDe(turma).find((l) => l.alunoId === alunoId) ?? null;
    const codigoMatricula = linha && tem('Contratos') ? Contratos.codigoMatricula(linha.contrato, alunoId) : (linha?.matricula?.codigo ?? '');
    const aulas = ctx.aulasDe(turma);
    const dossie = obter(turma.id, alunoId, periodo.id, ctx.dossies ?? []);
    const registros = dossie?.registros ?? [];
    const esperados = professoresEsperados(turma, periodo, ref, aulas).map((e) => {
      const i = ctx.instrutorDe(e.instrutorId);
      const registro = registroDe(dossie, e.instrutorId);
      return { ...e, instrutor: i, nome: i?.nome ?? registro?.instrutorNome ?? e.instrutorId, registro, preencheu: !!registro };
    });
    const concluido = tem('Turmas') ? Turmas.situacao(turma, ref) === 'concluida' : turma.fim < ref;
    const frequencia = template.blocos?.frequencia !== false
      ? frequenciaPeriodo(turma, alunoId, periodo, { minimo: minimoDe(curso), ref, aulas, lista: ctx.presencasDe(turma.id, alunoId), concluido }) : null;
    const conteudo = template.blocos?.conteudo !== false ? conteudoDoPeriodo(turma, periodo, { curso, ref, aulas }) : [];
    return {
      chave: chaveDe(turma.id, alunoId, periodo.id), turma, curso, formacao, aluno, empresa, template, periodo, dossie,
      esperados, situacao: situacao(dossie, esperados, template), frequencia, conteudo,
      consolidado: consolidarRespostas(template, dossie), registros,
      matricula: linha?.matricula ?? null, codigoMatricula, minimo: minimoDe(curso),
      nomeAluno: nomeAluno(aluno), nomeEmpresa: nomeEmpresa(empresa),
      professores: [...new Map([...esperados.map((e) => [e.instrutorId, e.nome]), ...registros.map((r) => [r.instrutorId, r.instrutorNome])]).values()],
    };
  }

  // Todos os (aluno × turma × período) esperados nas turmas não canceladas (matrículas matriculado|concluido), filtrados.
  // `instrutorId`: turmas em que o instrutor é o da turma ou é esperado no período. Ordem: período mais recente, turma, aluno.
  function listar(ctx, { formacaoId = '', turmaId = '', empresaId = '', alunoId = '', periodoId = '', situacao: sit = '', busca = '', instrutorId = '', ref = ctx.hoje ?? hoje() } = {}) {
    const b = normalizar(busca);
    const itens = [];
    ctx.turmas.forEach((turma) => {
      if (turma.status === 'cancelada') return;
      if (turmaId && turma.id !== turmaId) return;
      if (formacaoId && (formacaoId === '__avulsa' ? !!turma.formacaoId : turma.formacaoId !== formacaoId)) return;
      const template = ctx.templateDe(turma);
      if (!template) return;
      const ps = periodos(turma, template, ref).filter((p) => !periodoId || p.id === periodoId);
      if (!ps.length) return;
      const linhas = ctx.matriculasDe(turma).filter((l) => (l.matricula.status === 'matriculado' || l.matricula.status === 'concluido') && (!alunoId || l.alunoId === alunoId));
      if (!linhas.length) return;
      ps.forEach((p) => {
        if (instrutorId && turma.instrutorId !== instrutorId && !professoresEsperados(turma, p, ref, ctx.aulasDe(turma)).some((e) => e.instrutorId === instrutorId)) return;
        linhas.forEach((l) => {
          const item = montar(ctx, turma, l.alunoId, p.id, { ref });
          if (!item) return;
          if (empresaId && (item.empresa?.id ?? '') !== empresaId) return;
          if (sit && item.situacao !== sit) return;
          if (b && !normalizar(`${item.nomeAluno} ${item.aluno?.nome ?? ''} ${item.codigoMatricula} ${turma.codigo} ${item.curso?.nome ?? ''} ${item.nomeEmpresa}`).includes(b)) return;
          itens.push(item);
        });
      });
    });
    return itens.sort((a, x) => x.periodo.inicio.localeCompare(a.periodo.inicio) || (a.turma.codigo ?? '').localeCompare(x.turma.codigo ?? '', 'pt-BR') || a.nomeAluno.localeCompare(x.nomeAluno, 'pt-BR'));
  }

  // Períodos únicos dos itens, do mais recente ao mais antigo.
  function periodosDisponiveis(itens) {
    const m = new Map();
    itens.forEach((it) => { if (!m.has(it.periodo.id)) m.set(it.periodo.id, { id: it.periodo.id, rotulo: it.periodo.rotulo, curto: it.periodo.curto, inicio: it.periodo.inicio }); });
    return [...m.values()].sort((a, b) => b.inicio.localeCompare(a.inicio)).map(({ id, rotulo, curto }) => ({ id, rotulo, curto }));
  }

  // Home do portal do professor: período atual de cada turma em andamento do instrutor → quantos alunos ainda sem o registro dele.
  function pendentesDoInstrutor(ctx, instrutorId, ref = ctx.hoje ?? hoje()) {
    const saida = [];
    ctx.turmas.forEach((turma) => {
      if (turma.status === 'cancelada') return;
      const emAndamento = tem('Turmas') ? Turmas.situacao(turma, ref) === 'em_andamento' : (turma.inicio <= ref && turma.fim >= ref);
      if (!emAndamento) return;
      const template = ctx.templateDe(turma);
      if (!template) return;
      const periodo = periodoAtual(turma, template, ref);
      if (!periodo) return;
      const aulas = ctx.aulasDe(turma);
      if (turma.instrutorId !== instrutorId && !professoresEsperados(turma, periodo, ref, aulas).some((e) => e.instrutorId === instrutorId)) return;
      const linhas = ctx.matriculasDe(turma).filter((l) => l.matricula.status === 'matriculado' || l.matricula.status === 'concluido');
      if (!linhas.length) return;
      const pendentes = linhas.filter((l) => { const d = obter(turma.id, l.alunoId, periodo.id, ctx.dossies ?? []); return !d?.fechadoEm && !registroDe(d, instrutorId); }).length;
      saida.push({ turma, curso: ctx.cursoDe(turma.cursoId), periodo, pendentes, alunos: linhas.length });
    });
    return saida.sort((a, b) => b.pendentes - a.pendentes || a.turma.inicio.localeCompare(b.turma.inicio));
  }

  // =====================================================================
  // Documento (HTML A4 retrato com CSS próprio)
  // =====================================================================

  const CSS = `
.dossie-folha{position:relative;overflow:hidden;width:100%;aspect-ratio:210/297;background:#fff;color:#1e293b;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;container-type:inline-size;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 0 0 1px rgba(15,23,42,.06);line-height:1.35;--dossie-primaria:#0f3b4c;--dossie-destaque:#f26a21}
.dossie-folha>.dossie-corpo{position:absolute;inset:0;font-size:1.75cqw;display:flex;flex-direction:column;padding:5% 6% 4%}
.dossie-folha[data-denso="1"]>.dossie-corpo{font-size:1.5cqw}
.dossie-topo{display:flex;align-items:center;justify-content:space-between;gap:1em;border-bottom:2px solid var(--dossie-primaria);padding-bottom:.6em}
.dossie-marca{display:flex;align-items:center;gap:.6em}
.dossie-logo{width:2.3em;height:2.3em;border-radius:.45em;background:var(--dossie-destaque);color:#fff;display:grid;place-items:center;font-weight:700;font-size:.95em}
.dossie-marca b{display:block;font-weight:600;color:var(--dossie-primaria);font-size:1.05em;line-height:1.15}
.dossie-marca small{display:block;font-size:.72em;opacity:.7}
.dossie-periodo{text-align:right}
.dossie-periodo small{display:block;font-size:.66em;text-transform:uppercase;letter-spacing:.18em;opacity:.6}
.dossie-periodo b{font-weight:600;font-size:1.1em;color:var(--dossie-primaria)}
.dossie-ident{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5em;padding:.9em 0 .7em}
.dossie-ident h1{margin:0;font-size:1.7em;font-weight:600;line-height:1.15}
.dossie-ident .dossie-sub{font-size:.85em;opacity:.75;margin-top:.15em}
.dossie-dl{display:grid;grid-template-columns:auto 1fr;gap:.12em .8em;font-size:.8em;min-width:38%}
.dossie-dl dt{opacity:.6;white-space:nowrap}
.dossie-dl dd{margin:0;font-weight:500}
.dossie-secao{margin-top:.75em}
.dossie-secao h2{margin:0 0 .4em;font-size:.72em;font-weight:600;text-transform:uppercase;letter-spacing:.14em;color:var(--dossie-primaria);border-bottom:1px solid rgba(15,59,76,.18);padding-bottom:.25em}
.dossie-secao h2 span{font-weight:400;text-transform:none;letter-spacing:0;opacity:.65;margin-left:.6em}
.dossie-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.6em}
.dossie-kpi{border:1px solid rgba(15,23,42,.12);border-radius:.5em;padding:.45em .7em}
.dossie-kpi small{display:block;font-size:.68em;opacity:.65}
.dossie-kpi b{font-size:1.35em;font-weight:600;line-height:1.1;display:flex;align-items:center;gap:.35em}
.dossie-ponto{width:.5em;height:.5em;border-radius:50%;background:#94a3b8;flex:0 0 auto}
.dossie-ponto[data-status="ok"]{background:#10b981}.dossie-ponto[data-status="atencao"]{background:#f59e0b}.dossie-ponto[data-status="risco"],.dossie-ponto[data-status="reprovado_frequencia"]{background:#ef4444}
.dossie-aulas{display:flex;flex-wrap:wrap;gap:.3em;margin-top:.6em}
.dossie-aula{display:flex;flex-direction:column;align-items:center;min-width:3.3em;border:1px solid rgba(15,23,42,.12);border-radius:.35em;padding:.2em .3em;font-size:.72em;line-height:1.2}
.dossie-aula b{font-weight:700;font-size:1.1em;margin-top:.1em}
.dossie-aula[data-p="P"] b{color:#059669}.dossie-aula[data-p="A"] b{color:#d97706}.dossie-aula[data-p="J"] b{color:#0284c7}.dossie-aula[data-p="F"] b{color:#dc2626}
.dossie-conteudo{list-style:none;margin:0;padding:0;font-size:.82em;columns:2;column-gap:1.6em}
.dossie-conteudo li{break-inside:avoid;display:flex;gap:.5em;padding:.12em 0;border-bottom:1px dotted rgba(0,0,0,.1)}
.dossie-conteudo li span{flex:0 0 3.4em;opacity:.6;font-variant-numeric:tabular-nums}
.dossie-campos{display:grid;grid-template-columns:1fr 1fr;gap:.45em .9em}
.dossie-campo{border:1px solid rgba(15,23,42,.1);border-radius:.45em;padding:.4em .6em;break-inside:avoid}
.dossie-campo[data-largo="1"]{grid-column:1/-1}
.dossie-campo-rotulo{font-size:.78em;opacity:.7}
.dossie-campo-valor{display:flex;align-items:center;gap:.6em;margin-top:.15em}
.dossie-campo-valor b{font-size:1.25em;font-weight:600;color:var(--dossie-primaria);line-height:1.1}
.dossie-campo-valor small{font-size:.75em;opacity:.7}
.dossie-barra{display:flex;gap:.15em;flex:0 0 auto}
.dossie-barra i{display:block;width:1.1em;height:.5em;border-radius:.15em;background:rgba(15,23,42,.12)}
.dossie-barra i[data-on="1"]{background:var(--dossie-destaque)}
.dossie-por{margin:.2em 0 0;padding:0;list-style:none;font-size:.74em;opacity:.8}
.dossie-por li{padding:.05em 0}
.dossie-por li b{font-weight:600}
.dossie-texto{font-size:.85em;line-height:1.45;white-space:pre-line}
.dossie-vazio{font-size:.8em;opacity:.55;font-style:italic}
.dossie-pareceres{display:flex;flex-direction:column;gap:.5em}
.dossie-parecer{border-left:.25em solid var(--dossie-destaque);padding:.25em .7em;font-size:.85em;line-height:1.45}
.dossie-parecer small{display:block;font-size:.8em;opacity:.65;margin-top:.15em}
.dossie-rodape{margin-top:auto;padding-top:.6em;border-top:1px solid rgba(0,0,0,.12);font-size:.68em;opacity:.6;display:flex;justify-content:space-between}
.dossie-capa .dossie-capa-titulo{margin:1.2em 0 .1em;font-size:2em;font-weight:600;color:var(--dossie-primaria);line-height:1.1}
.dossie-capa .dossie-capa-sub{font-size:1em;opacity:.75;margin-bottom:.3em}
.dossie-capa .dossie-capa-emp{font-size:.9em;margin-bottom:1.2em}
.dossie-capa .dossie-capa-emp b{font-weight:600}
.dossie-tabela{width:100%;border-collapse:collapse;font-size:.76em}
.dossie-tabela th{text-align:left;font-weight:600;font-size:.85em;text-transform:uppercase;letter-spacing:.08em;opacity:.65;padding:.35em .5em;border-bottom:1px solid rgba(15,23,42,.25)}
.dossie-tabela td{padding:.32em .5em;border-bottom:1px solid rgba(15,23,42,.08);vertical-align:top}
.dossie-tabela td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dossie-tabela small{display:block;opacity:.65}
.dossie-totais{display:grid;grid-template-columns:repeat(4,1fr);gap:.6em;margin:1em 0 .6em}
@media print{
  body>:not(#dossie-impressao){display:none!important}
  #dossie-impressao{display:block!important;position:static}
  #dossie-impressao .dossie-folha{width:100vw;height:100vh;aspect-ratio:auto;border-radius:0;box-shadow:none;break-after:page;page-break-after:always}
  #dossie-impressao .dossie-folha:last-child{break-after:auto;page-break-after:auto}
}`;

  let estilosInjetados = false;
  function injetarEstilos() {
    if (estilosInjetados || typeof document === 'undefined') return;
    if (document.getElementById('dossie-estilos')) { estilosInjetados = true; return; }
    const s = document.createElement('style');
    s.id = 'dossie-estilos';
    s.textContent = CSS;
    document.head.appendChild(s);
    estilosInjetados = true;
  }

  const INICIAL = { presente: 'P', atraso: 'A', justificada: 'J', ausente: 'F' };
  const abrirFolha = (extra = '', denso = false) => `<div class="dossie-folha ${extra}" ${denso ? 'data-denso="1"' : ''}><div class="dossie-corpo">`;
  const fecharFolha = () => '</div></div>';
  const topoHtml = (rotulo, valor) => `<header class="dossie-topo"><div class="dossie-marca"><span class="dossie-logo">PW</span><div><b>ProWay</b><small>Dossiê do aluno</small></div></div><div class="dossie-periodo"><small>${esc(rotulo)}</small><b>${esc(valor)}</b></div></header>`;
  const rodapeHtml = (numeroPagina, ref) => `<footer class="dossie-rodape"><span>Gerado em ${fmtData(ref)} · Aulor</span><span>${numeroPagina ? `Página ${numeroPagina}` : 'ProWay Informática · Blumenau'}</span></footer>`;

  function campoDocHtml(cc) {
    const c = cc.campo;
    const por = cc.valores.length > 1 || (cc.valores.length === 1 && (c.tipo === 'escala' || c.tipo === 'nota'));
    const listaPor = (fmt) => `<ul class="dossie-por">${cc.valores.map((v) => `<li><b>${esc(v.instrutorNome)}:</b> ${fmt(v.valor)}</li>`).join('')}</ul>`;
    let corpo = '';
    if (!cc.valores.length) corpo = '<p class="dossie-vazio">Sem resposta.</p>';
    else if (c.tipo === 'escala') {
      const arred = Math.round(cc.media);
      corpo = `<div class="dossie-campo-valor"><b>${fmtNum(cc.media)}</b><span class="dossie-barra">${[1, 2, 3, 4, 5].map((n) => `<i data-on="${n <= arred ? 1 : 0}"></i>`).join('')}</span><small>${esc(ESCALA_DOSSIE.find((e) => e.valor === arred)?.rotulo ?? '')}</small></div>${por ? listaPor((v) => `${v} — ${esc(ESCALA_DOSSIE.find((e) => e.valor === Number(v))?.rotulo ?? '')}`) : ''}`;
    } else if (c.tipo === 'nota') {
      corpo = `<div class="dossie-campo-valor"><b>${fmtNum(cc.media)}</b><span class="dossie-barra">${[1, 2, 3, 4, 5].map((n) => `<i data-on="${n <= Math.round(cc.media / 2) ? 1 : 0}"></i>`).join('')}</span><small>de 10</small></div>${por ? listaPor((v) => fmtNum(v)) : ''}`;
    } else if (c.tipo === 'sim_nao') {
      corpo = `<div class="dossie-campo-valor"><b>${esc(cc.resumo)}</b></div>${cc.valores.length > 1 ? listaPor((v) => (v ? 'Sim' : 'Não')) : ''}`;
    } else if (c.tipo === 'opcoes') {
      corpo = cc.valores.length > 1 ? listaPor((v) => esc(v)) : `<div class="dossie-campo-valor"><b>${esc(cc.valores[0].valor)}</b></div>`;
    } else {
      corpo = cc.valores.length > 1 ? listaPor((v) => esc(v)) : `<p class="dossie-texto">${esc(cc.valores[0].valor)}</p>`;
    }
    const largo = c.tipo === 'texto_longo' || (c.tipo === 'texto_curto' && cc.valores.length > 1);
    return `<div class="dossie-campo" data-largo="${largo ? 1 : 0}"><div class="dossie-campo-rotulo">${esc(c.rotulo)}</div>${corpo}</div>`;
  }

  // Uma página A4 com o dossiê do item (Dossies.montar).
  function htmlDossie(item, { numeroPagina = null, ref = hoje() } = {}) {
    const t = item.template ?? { blocos: {} };
    const blocos = blocosDe(t.blocos);
    const f = item.frequencia;
    const nAulas = f?.aulas?.length ?? 0;
    const nCampos = campos(t).length;
    const denso = nAulas > 12 || nCampos > 9 || (item.registros ?? []).length > 2;
    const cursoTurma = [item.curso?.nome, item.turma?.codigo].filter(Boolean).join(' · ');
    const ident = `<section class="dossie-ident">
      <div><h1>${esc(item.nomeAluno || item.aluno?.nome || item.dossie?.alunoId || '')}</h1><p class="dossie-sub">${esc(cursoTurma)}</p></div>
      <dl class="dossie-dl">
        ${item.codigoMatricula ? `<dt>Matrícula</dt><dd>${esc(item.codigoMatricula)}</dd>` : ''}
        ${item.nomeEmpresa ? `<dt>Empresa</dt><dd>${esc(item.nomeEmpresa)}</dd>` : ''}
        ${item.formacao ? `<dt>Formação</dt><dd>${esc(item.formacao.nome)}</dd>` : ''}
        <dt>Período</dt><dd>${esc(fmtData(item.periodo.inicio))} a ${esc(fmtData(item.periodo.fim))}</dd>
        <dt>${(item.professores ?? []).length === 1 ? 'Professor' : 'Professores'}</dt><dd>${esc((item.professores ?? []).join(', ') || '—')}</dd>
      </dl>
    </section>`;
    let freq = '';
    if (blocos.frequencia) {
      const kpi = (rotulo, valor, status = null) => `<div class="dossie-kpi"><small>${rotulo}</small><b>${status ? `<span class="dossie-ponto" data-status="${esc(status)}"></span>` : ''}${valor}</b></div>`;
      const corpo = f ? `<div class="dossie-kpis">${kpi('Aulas no período', f.dadas)}${kpi('Presenças válidas', f.validas)}${kpi('Faltas', f.faltas)}${kpi('Frequência', f.percentual == null ? '—' : `${f.percentual}%`, f.status)}</div>
        ${nAulas ? `<div class="dossie-aulas">${f.aulas.map(({ aula, registro }) => `<span class="dossie-aula" data-p="${registro ? INICIAL[registro.status] ?? 'F' : 'F'}"><span>${esc(aula.data.slice(8, 10))}/${esc(aula.data.slice(5, 7))}</span><b>${registro ? INICIAL[registro.status] ?? 'F' : 'F'}</b></span>`).join('')}</div>` : '<p class="dossie-vazio">Nenhuma aula dada no período.</p>'}` : '<p class="dossie-vazio">Frequência indisponível.</p>';
      freq = `<section class="dossie-secao"><h2>Frequência no período${f && f.minimo ? `<span>mínimo ${f.minimo}%</span>` : ''}</h2>${corpo}</section>`;
    }
    let cont = '';
    if (blocos.conteudo) {
      const lis = (item.conteudo ?? []).map((c) => `<li><span>${esc(c.data.slice(8, 10))}/${esc(c.data.slice(5, 7))}</span><div>${esc(c.conteudo || c.modulos.join(', ') || '—')}</div></li>`);
      cont = `<section class="dossie-secao"><h2>Conteúdo trabalhado</h2>${lis.length ? `<ul class="dossie-conteudo">${lis.join('')}</ul>` : '<p class="dossie-vazio">Sem conteúdo registrado no período.</p>'}</section>`;
    }
    const secoes = (item.consolidado ?? []).map((s) => `<section class="dossie-secao"><h2>${esc(s.secao.titulo)}</h2><div class="dossie-campos">${s.campos.map(campoDocHtml).join('')}</div></section>`).join('');
    let pareceres = '';
    if (blocos.parecer) {
      const regs = (item.registros ?? []).filter((r) => r.parecer);
      pareceres = `<section class="dossie-secao"><h2>Parecer ${regs.length === 1 ? 'do professor' : 'dos professores'}</h2>${regs.length ? `<div class="dossie-pareceres">${regs.map((r) => `<blockquote class="dossie-parecer">${esc(r.parecer)}<small>${esc(r.instrutorNome)} · ${fmtData(String(r.atualizadoEm).slice(0, 10))}</small></blockquote>`).join('')}</div>` : `<p class="dossie-vazio">${item.situacao === 'pendente' ? 'Dossiê ainda não preenchido.' : 'Sem parecer registrado.'}</p>`}</section>`;
    }
    return `${abrirFolha('', denso)}${topoHtml('Período', item.periodo.rotulo)}${ident}${freq}${cont}${secoes}${pareceres}${rodapeHtml(numeroPagina, ref)}${fecharFolha()}`;
  }

  // Capa/sumário do consolidado: título, subtítulo, empresa, tabela (aluno · curso/turma · período · frequência · situação) e totais.
  function htmlCapa(itens, { titulo = 'Dossiê consolidado', subtitulo = '', empresa = null, ref = hoje() } = {}) {
    const empresaNome = typeof empresa === 'string' ? empresa : nomeEmpresa(empresa);
    const linhas = itens.map((it, i) => `<tr><td>${esc(it.nomeAluno)}${it.codigoMatricula ? `<small>${esc(it.codigoMatricula)}</small>` : ''}</td><td>${esc(it.curso?.nome ?? '')}<small>${esc(it.turma?.codigo ?? '')}</small></td><td>${esc(it.periodo.rotulo)}</td><td class="num">${it.frequencia?.percentual == null ? '—' : `${it.frequencia.percentual}%`}</td><td>${esc(situacaoDe(it.situacao)?.nome ?? it.situacao)}</td><td class="num">${i + 2}</td></tr>`);
    const conta = (s) => itens.filter((it) => it.situacao === s).length;
    const alunos = new Set(itens.map((it) => it.aluno?.id ?? it.dossie?.alunoId)).size;
    const comFreq = itens.filter((it) => it.frequencia?.percentual != null);
    const mediaFreq = comFreq.length ? Math.round(comFreq.reduce((s, it) => s + it.frequencia.percentual, 0) / comFreq.length) : null;
    const kpi = (r, v) => `<div class="dossie-kpi"><small>${r}</small><b>${v}</b></div>`;
    const denso = itens.length > 22;
    return `${abrirFolha('dossie-capa', denso)}${topoHtml('Emitido em', fmtData(ref))}
      <h1 class="dossie-capa-titulo">${esc(titulo)}</h1>
      ${subtitulo ? `<p class="dossie-capa-sub">${esc(subtitulo)}</p>` : ''}
      ${empresaNome ? `<p class="dossie-capa-emp">Empresa: <b>${esc(empresaNome)}</b></p>` : ''}
      <div class="dossie-totais">${kpi('Dossiês', itens.length)}${kpi('Alunos', alunos)}${kpi('Frequência média', mediaFreq == null ? '—' : `${mediaFreq}%`)}${kpi('Completos / fechados', conta('completo') + conta('fechado'))}</div>
      <table class="dossie-tabela"><thead><tr><th>Aluno</th><th>Curso · turma</th><th>Período</th><th>Freq.</th><th>Situação</th><th>Pág.</th></tr></thead><tbody>${linhas.join('')}</tbody></table>
      ${rodapeHtml(1, ref)}${fecharFolha()}`;
  }

  function htmlDocumento(itens, { titulo = 'Dossiê consolidado', subtitulo = '', capa = true, empresa = null, ref = hoje() } = {}) {
    const lista = itens ?? [];
    const paginas = lista.map((it, i) => htmlDossie(it, { numeroPagina: capa ? i + 2 : (lista.length > 1 ? i + 1 : null), ref }));
    return (capa ? htmlCapa(lista, { titulo, subtitulo, empresa, ref }) : '') + paginas.join('');
  }

  // Imprime só as folhas (uma por página, A4 retrato) — cópia adaptada de TemplatesCertificado.imprimir.
  function imprimir(html) {
    if (typeof document === 'undefined') return;
    injetarEstilos();
    document.getElementById('dossie-impressao')?.remove();
    document.getElementById('dossie-pagina')?.remove();
    const pagina = document.createElement('style');
    pagina.id = 'dossie-pagina';
    pagina.textContent = '@page{size:A4 portrait;margin:0}';
    document.head.appendChild(pagina);
    const area = document.createElement('div');
    area.id = 'dossie-impressao';
    area.style.display = 'none';
    area.innerHTML = html;
    document.body.appendChild(area);
    const limpar = () => { area.remove(); pagina.remove(); window.removeEventListener('afterprint', limpar); };
    window.addEventListener('afterprint', limpar);
    window.print();
  }

  // =====================================================================
  // Envios (simulados)
  // =====================================================================

  let sementeEnvios = null;
  let cacheEnvios = null;
  function sementeEnviosAtual() {
    if (!sementeEnvios) {
      sementeEnvios = (typeof gerarSementeEnvios === 'function' && tem('Turmas') && tem('Contratos')) ? gerarSementeEnvios(contextoBase(), carregar(), hoje()) : [];
    }
    return sementeEnvios;
  }
  function carregarEnvios() {
    if (cacheEnvios) return cacheEnvios;
    let salvos = [];
    try { salvos = JSON.parse(localStorage.getItem(CHAVE_ENVIOS) ?? '[]'); } catch (_) { salvos = []; }
    if (!Array.isArray(salvos)) salvos = [];
    const porId = new Map(salvos.map((e) => [e.id, e]));
    const sem = sementeEnviosAtual();
    const lista = sem.map((e) => porId.get(e.id) ?? e);
    const vistos = new Set(lista.map((e) => e.id));
    cacheEnvios = [...lista, ...salvos.filter((e) => !vistos.has(e.id))];
    return cacheEnvios;
  }
  function salvarEnvios(lista) {
    const daSemente = new Map(sementeEnviosAtual().map((e) => [e.id, JSON.stringify(e)]));
    localStorage.setItem(CHAVE_ENVIOS, JSON.stringify(lista.filter((e) => daSemente.get(e.id) !== JSON.stringify(e))));
    cacheEnvios = lista;
  }

  // E-mails únicos da empresa: cobrança, contatos RH/gestor/principal e o e-mail geral.
  function destinatariosDaEmpresa(empresa) {
    if (!empresa) return [];
    const brutos = [
      empresa.cobranca?.emailCobranca,
      ...(empresa.contatos ?? []).filter((c) => c.papel === 'rh' || c.papel === 'gestor' || c.principal).map((c) => c.email),
      empresa.email,
    ];
    const vistos = new Set();
    return brutos.map((e) => String(e ?? '').trim()).filter((e) => ehEmail(e) && !vistos.has(e.toLowerCase()) && vistos.add(e.toLowerCase()));
  }

  function validarEnvio(dados) {
    const erros = [];
    if (!tipoEnvioDe(dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo do envio.' });
    if (!dados.empresaId && !dados.alunoId) erros.push({ campo: 'empresaId', mensagem: 'Informe a empresa (ou o aluno) destinatária.' });
    const dest = (dados.destinatarios ?? []).map((e) => String(e ?? '').trim()).filter(Boolean);
    if (!dest.length) erros.push({ campo: 'destinatarios', mensagem: 'Informe ao menos um destinatário.' });
    else if (dest.some((e) => !ehEmail(e))) erros.push({ campo: 'destinatarios', mensagem: `E-mail inválido: ${dest.filter((e) => !ehEmail(e)).join(', ')}.` });
    if (!(dados.itens ?? []).length) erros.push({ campo: 'itens', mensagem: 'Selecione ao menos um dossiê.' });
    if (!String(dados.assunto ?? '').trim()) erros.push({ campo: 'assunto', mensagem: 'Informe o assunto.' });
    return erros;
  }

  function registrarEnvio(lista, dados) {
    let n = lista.length + 1;
    while (lista.some((e) => e.id === `env${n}`)) n += 1;
    const vistos = new Set();
    const envio = {
      id: `env${n}`, em: dados.em ?? agoraIso(), tipo: dados.tipo,
      empresaId: dados.empresaId ?? null, empresaNome: String(dados.empresaNome ?? '').trim(),
      alunoId: dados.alunoId ?? null, alunoNome: String(dados.alunoNome ?? '').trim(),
      destinatarios: (dados.destinatarios ?? []).map((e) => String(e ?? '').trim()).filter((e) => e && !vistos.has(e.toLowerCase()) && vistos.add(e.toLowerCase())),
      periodoId: dados.periodoId ?? null, turmaId: dados.turmaId ?? null, formacaoId: dados.formacaoId ?? null,
      itens: (dados.itens ?? []).map((it) => ({ turmaId: it.turmaId, alunoId: it.alunoId, periodoId: it.periodoId })),
      assunto: String(dados.assunto ?? '').trim(), mensagem: String(dados.mensagem ?? '').trim(),
      enviadoPor: String(dados.enviadoPor ?? 'Secretaria').trim() || 'Secretaria',
    };
    return { lista: [...lista, envio], envio };
  }

  function assuntoSugerido({ tipo = 'mensal', periodo = null, empresa = null, aluno = null, formacao = null } = {}) {
    const emp = typeof empresa === 'string' ? empresa : nomeEmpresa(empresa);
    const al = typeof aluno === 'string' ? aluno : nomeAluno(aluno);
    const per = periodo ? (periodo.id === 'curso' ? periodo.rotulo.toLowerCase() : periodo.rotulo.charAt(0).toLowerCase() + periodo.rotulo.slice(1)) : '';
    if (tipo === 'individual') return `Dossiê do aluno ${al || ''}${per ? ` — ${per}` : ''}${emp ? ` — ${emp}` : ''}`.trim();
    if (tipo === 'consolidado') return `Dossiê consolidado${formacao ? ` — ${formacao.nome ?? formacao}` : ''}${emp ? ` — ${emp}` : ''}`;
    return `Dossiê de ${per || 'período'}${emp ? ` — ${emp}` : ''}`;
  }

  const enviosDe = (lista, { empresaId = '', alunoId = '', turmaId = '' } = {}) => lista
    .filter((e) => (!empresaId || e.empresaId === empresaId) && (!alunoId || e.alunoId === alunoId || (e.itens ?? []).some((it) => it.alunoId === alunoId)) && (!turmaId || e.turmaId === turmaId || (e.itens ?? []).some((it) => it.turmaId === turmaId)))
    .sort((a, b) => String(b.em).localeCompare(String(a.em)));

  return {
    // Templates
    CHAVE_TEMPLATES, carregarTemplates, salvarTemplates, templatePorId, filtrarTemplates, validarTemplate, incluirTemplate, atualizarTemplate, duplicarTemplate, definirPadrao, podeRemoverTemplate, removerTemplate,
    validarSecao, incluirSecao, atualizarSecao, removerSecao, moverSecao, validarCampo, incluirCampo, atualizarCampo, removerCampo, moverCampo, vincular, desvincular, templatePara, campos, usos,
    tipoCampoDe, periodicidadeDe, statusTemplateDe, situacaoDe, tipoEnvioDe,
    // Períodos
    periodos, periodoAtual, periodoPorId, nomeMes, mesCurto,
    // Dossiês
    CHAVE, carregar, salvar, invalidar, chaveDe, obter, registroDe, validarRegistro, registrar, fechar, reabrir, professoresEsperados, situacao, aulasDoPeriodo, frequenciaPeriodo, conteudoDoPeriodo, consolidarRespostas,
    // Montagem
    contexto, empresaDoAluno, montar, listar, periodosDisponiveis, pendentesDoInstrutor, nomeAluno, nomeEmpresa, fmtNum, fmtData,
    // Documento
    CSS, injetarEstilos, htmlDossie, htmlCapa, htmlDocumento, imprimir,
    // Envios
    CHAVE_ENVIOS, carregarEnvios, salvarEnvios, destinatariosDaEmpresa, validarEnvio, registrarEnvio, assuntoSugerido, enviosDe,
  };
})();
