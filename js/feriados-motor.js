// ============================================================
// Motor da tela "Feriados": regras puras (sem DOM).
// Persistência em localStorage — trocar o sufixo da chave força reset.
// Aulas.feriado(iso) delega para Feriados.nome(iso) quando este motor está
// carregado; por isso feriados-data/motor entram ANTES de aulas-motor.js.
// ============================================================

const Feriados = (() => {
  const CHAVE = 'aulor-v1-feriados-v1';
  const clonar = (x) => JSON.parse(JSON.stringify(x));

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return clonar(FERIADOS_SEED);
  }
  function salvar(l) { localStorage.setItem(CHAVE, JSON.stringify(l)); invalidar(); }

  // Cache da lista para consultas de outras telas (Aulas.feriado) sem reler o storage a cada chamada.
  let cache = null;
  const memoAno = new Map();
  const lista = () => (cache ??= carregar());
  const invalidar = () => { cache = null; memoAno.clear(); };

  const pad = (n) => String(n).padStart(2, '0');
  const ehData = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
  const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const porId = (l, id) => l.find((f) => f.id === id) ?? null;
  const tipoDe = (id) => TIPOS_FERIADO.find((t) => t.id === id) ?? TIPOS_FERIADO[0];
  const addDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const diaSemana = (iso) => new Date(`${iso}T12:00:00`).getDay();
  const diasNoMes = (ano, mes) => new Date(ano, mes, 0).getDate();

  function novoId(l) {
    let n = l.length + 1;
    while (l.some((f) => f.id === `fe${n}`)) n += 1;
    return `fe${n}`;
  }

  // Dias (ISO) que um cadastro ocupa num dado ano. Recorrente: mesmo dia/mês
  // em qualquer ano (período recorrente mantém a duração). 29/02 em ano
  // comum cai em 28/02.
  function diasNoAno(f, ano) {
    let ini = f.data;
    let fim = f.dataFim || f.data;
    if (f.recorrente) {
      const delta = Math.round((new Date(`${fim}T12:00:00`) - new Date(`${ini}T12:00:00`)) / 86400000);
      const md = ini.slice(5);
      ini = `${ano}-${md === '02-29' && diasNoMes(ano, 2) === 28 ? '02-28' : md}`;
      fim = addDias(ini, delta);
    }
    if (ini.slice(0, 4) !== String(ano) && fim.slice(0, 4) !== String(ano)) return [];
    const dias = [];
    for (let d = ini; d <= fim; d = addDias(d, 1)) if (d.slice(0, 4) === String(ano)) dias.push(d);
    return dias;
  }

  // Mapa iso → [feriado] de um ano.
  function porDia(l, ano) {
    const m = new Map();
    l.forEach((f) => diasNoAno(f, ano).forEach((d) => { if (!m.has(d)) m.set(d, []); m.get(d).push(f); }));
    return m;
  }

  // Ocorrências de um ano ordenadas por data (uma linha por cadastro, com a data daquele ano).
  // inicio/fim/dias ficam dentro do ano; de/ate/total são o período inteiro (o recesso que vira o ano).
  function ocorrencias(l, ano) {
    return l.map((f) => {
      const ds = diasNoAno(f, ano);
      if (!ds.length) return null;
      const [de, ate] = f.recorrente ? [ds[0], ds.at(-1)] : [f.data, f.dataFim || f.data];
      const total = Math.round((new Date(`${ate}T12:00:00`) - new Date(`${de}T12:00:00`)) / 86400000) + 1;
      return { ...f, inicio: ds[0], fim: ds.at(-1), dias: ds.length, de, ate, total };
    })
      .filter(Boolean)
      .sort((a, b) => a.inicio.localeCompare(b.inicio) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // Consulta usada pelo motor de aulas: nome do feriado (ou null).
  function nome(iso) {
    if (!ehData(iso)) return null;
    const ano = Number(iso.slice(0, 4));
    if (!memoAno.has(ano)) memoAno.set(ano, porDia(lista(), ano));
    const fs = memoAno.get(ano).get(iso);
    return fs?.length ? fs.map((f) => f.nome).join(' · ') : null;
  }
  const emFeriado = (iso) => nome(iso) !== null;

  function anos(l) {
    const s = new Set();
    l.forEach((f) => { s.add(Number(f.data.slice(0, 4))); if (f.dataFim) s.add(Number(f.dataFim.slice(0, 4))); });
    return [...s].sort();
  }

  function filtrar(l, ano, { busca = '', tipo = '' } = {}) {
    const termo = normalizar(busca);
    return ocorrencias(l, ano)
      .filter((f) => !termo || normalizar(`${f.nome} ${f.observacao}`).includes(termo))
      .filter((f) => !tipo || f.tipo === tipo);
  }

  function gradeDoMes(ano, mes) {
    const ym = `${ano}-${pad(mes)}`;
    const dias = [];
    for (let i = 0; i < diaSemana(`${ym}-01`); i += 1) dias.push(null);
    for (let d = 1; d <= diasNoMes(ano, mes); d += 1) dias.push(`${ym}-${pad(d)}`);
    while (dias.length % 7) dias.push(null);
    const semanas = [];
    for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
    return semanas;
  }

  function validar(dados, l, idAtual = null) {
    const erros = [];
    const nome = String(dados.nome ?? '').trim();
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome do feriado.' });
    else if (nome.length > 80) erros.push({ campo: 'nome', mensagem: 'Use até 80 caracteres.' });
    if (!TIPOS_FERIADO.some((t) => t.id === dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo.' });
    if (!ehData(dados.data)) erros.push({ campo: 'data', mensagem: 'Informe a data.' });
    if (dados.dataFim) {
      if (!ehData(dados.dataFim)) erros.push({ campo: 'dataFim', mensagem: 'Data final inválida.' });
      else if (ehData(dados.data) && dados.dataFim < dados.data) erros.push({ campo: 'dataFim', mensagem: 'A data final deve ser igual ou depois da inicial.' });
      else if (dados.recorrente && ehData(dados.data) && dados.dataFim.slice(0, 4) !== dados.data.slice(0, 4)) erros.push({ campo: 'dataFim', mensagem: 'Um período recorrente não pode virar o ano.' });
    }
    if (ehData(dados.data) && !erros.some((e) => e.campo === 'data')) {
      const repetido = l.filter((f) => f.id !== idAtual).some((f) => {
        const mesmoNome = normalizar(f.nome) === normalizar(nome);
        const mesmoDia = dados.recorrente || f.recorrente ? f.data.slice(5) === dados.data.slice(5) : f.data === dados.data;
        return mesmoNome && mesmoDia;
      });
      if (repetido) erros.push({ campo: 'nome', mensagem: 'Já existe um feriado com esse nome nessa data.' });
    }
    return erros;
  }

  function limpar(dados) {
    return {
      nome: String(dados.nome).trim(),
      tipo: dados.tipo,
      data: dados.data,
      dataFim: dados.dataFim && dados.dataFim !== dados.data ? dados.dataFim : null,
      recorrente: Boolean(dados.recorrente),
      observacao: String(dados.observacao ?? '').trim(),
    };
  }

  function incluir(l, dados) {
    const feriado = { id: novoId(l), ...limpar(dados) };
    invalidar();
    return { lista: [...l, feriado], feriado };
  }
  function atualizar(l, id, dados) { invalidar(); return l.map((f) => (f.id === id ? { ...f, ...limpar(dados) } : f)); }
  function remover(l, id) { invalidar(); return l.filter((f) => f.id !== id); }

  // Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano).
  function pascoa(ano) {
    const a = ano % 19; const b = Math.floor(ano / 100); const c = ano % 100;
    const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    return `${ano}-${pad(mes)}-${pad(((h + l - 7 * m + 114) % 31) + 1)}`;
  }
  // Datas móveis pelo nome: dias a partir da Páscoa. O resto copia o mesmo dia/mês.
  const MOVEIS = { carnaval: -48, 'quarta-feira de cinzas': -46, 'sexta-feira santa': -2, pascoa: 0, 'corpus christi': 60 };
  const mudarAno = (iso, delta) => {
    const ano = Number(iso.slice(0, 4)) + delta;
    return `${ano}-${iso.slice(5) === '02-29' && diasNoMes(ano, 2) === 28 ? '02-28' : iso.slice(5)}`;
  };

  // Cadastros só-daquele-ano que existiam em `de` e ainda não existem em `para` (pelo nome, pelo ano em que começam).
  function faltando(l, de, para) {
    const doAno = (ano) => l.filter((f) => !f.recorrente && f.data.slice(0, 4) === String(ano));
    const existentes = new Set(doAno(para).map((f) => normalizar(f.nome)));
    return doAno(de).filter((f) => !existentes.has(normalizar(f.nome)));
  }

  // Copia o que falta de um ano para outro — atalho para "montar o ano que vem".
  // Móveis seguem a Páscoa do ano novo (mantendo a duração); os demais, o mesmo dia/mês.
  function copiarAno(l, de, para) {
    const novos = [];
    let lista2 = [...l];
    faltando(l, de, para).forEach((f) => {
      const offset = MOVEIS[normalizar(f.nome)];
      const data = offset === undefined ? mudarAno(f.data, para - de) : addDias(pascoa(para), offset);
      const duracao = f.dataFim ? Math.round((new Date(`${f.dataFim}T12:00:00`) - new Date(`${f.data}T12:00:00`)) / 86400000) : 0;
      const r = incluir(lista2, { ...f, data, dataFim: duracao ? addDias(data, duracao) : null });
      lista2 = r.lista; novos.push(r.feriado);
    });
    return { lista: lista2, novos };
  }

  return {
    CHAVE, carregar, salvar, invalidar, porId, tipoDe, ehData, addDias,
    diasNoAno, porDia, ocorrencias, nome, emFeriado, anos, filtrar, gradeDoMes,
    validar, incluir, atualizar, remover, pascoa, faltando, copiarAno,
  };
})();
