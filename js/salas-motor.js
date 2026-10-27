// ============================================================
// Motor da tela "Salas": regras puras (sem DOM).
// Persistência em localStorage — trocar o sufixo da chave força reset.
// ============================================================

const Salas = (() => {
  const CHAVE = 'prototipo-salas-v4';

  function clonar(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return clonar(SALAS_SEED);
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
    return lista.find((s) => s.id === id) ?? null;
  }

  function numero(v) {
    if (v === '' || v == null) return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  const ehFisica = (tipo) => tipo !== 'virtual';
  const ehLaboratorio = (tipo) => tipo === 'laboratorio';

  // ---------- Lista ----------

  function filtrar(lista, { busca = '', unidadeId = '', tipo = '', status = '' } = {}) {
    const termo = normalizar(busca);
    return lista
      .filter((s) => !termo || normalizar(`${s.codigo} ${s.nome} ${s.localizacao.andar} ${s.localizacao.referencia}`).includes(termo))
      .filter((s) => !unidadeId || s.unidadeId === unidadeId)
      .filter((s) => !tipo || s.tipo === tipo)
      .filter((s) => !status || s.status === status)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // Resumo por status para o cabeçalho da lista.
  function contagem(lista) {
    return STATUS_SALA.reduce((acc, s) => ({ ...acc, [s.id]: lista.filter((x) => x.status === s.id).length }), { total: lista.length });
  }

  // ---------- Pendências ----------

  // Avisos que não bloqueiam, mas mostram o que falta para a sala ficar "completa".
  function pendencias(sala) {
    const p = [];
    if (!sala.capacidade.alunos) p.push('Capacidade de alunos');
    if (ehFisica(sala.tipo)) {
      if (!sala.localizacao.andar) p.push('Andar/localização');
      if (!sala.capacidade.layout) p.push('Layout');
      if (!sala.recursos.length) p.push('Recursos');
    }
    if (ehLaboratorio(sala.tipo)) {
      if (!sala.maquinas?.quantidade) p.push('Quantidade de máquinas');
      else if (sala.maquinas.quantidade < sala.capacidade.alunos) p.push('Menos máquinas que alunos');
      if (!sala.maquinas?.softwares?.length) p.push('Softwares instalados');
    }
    if (sala.tipo === 'virtual' && !sala.virtual.link) p.push('Link da sala');
    return p;
  }

  // ---------- Validações ----------

  function validarDados(dados, lista, idAtual = null) {
    const erros = [];
    const outros = lista.filter((s) => s.id !== idAtual);
    const codigo = String(dados.codigo ?? '').trim();
    const nome = String(dados.nome ?? '').trim();
    if (!codigo) erros.push({ campo: 'codigo', mensagem: 'Informe o código da sala.' });
    else if (!/^[A-Za-z0-9-]{2,12}$/.test(codigo)) erros.push({ campo: 'codigo', mensagem: 'Use de 2 a 12 letras/números/hífen, sem espaços.' });
    else if (outros.some((s) => normalizar(s.codigo) === normalizar(codigo))) erros.push({ campo: 'codigo', mensagem: 'Já existe uma sala com esse código.' });
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome da sala.' });
    else if (outros.some((s) => normalizar(s.nome) === normalizar(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe uma sala com esse nome.' });
    if (!dados.tipo) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo.' });
    if (!dados.unidadeId) erros.push({ campo: 'unidadeId', mensagem: 'Escolha a unidade.' });
    const cap = numero(dados.alunos);
    if (cap == null || Number.isNaN(cap) || cap < 1 || !Number.isInteger(cap)) erros.push({ campo: 'alunos', mensagem: 'Capacidade: número inteiro maior que zero.' });
    if (dados.status && !STATUS_SALA.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    return erros;
  }

  function validarEspaco(dados) {
    const erros = [];
    const area = numero(dados.area);
    if (area != null && (Number.isNaN(area) || area <= 0)) erros.push({ campo: 'area', mensagem: 'Área em m², maior que zero.' });
    return erros;
  }

  function validarMaquinas(dados) {
    const erros = [];
    const q = numero(dados.quantidade);
    if (q == null || Number.isNaN(q) || q < 1 || !Number.isInteger(q)) erros.push({ campo: 'quantidade', mensagem: 'Número inteiro de máquinas (≥ 1).' });
    const mem = numero(dados.memoria);
    if (mem != null && (Number.isNaN(mem) || mem <= 0)) erros.push({ campo: 'memoria', mensagem: 'Memória em GB, maior que zero.' });
    const mon = numero(dados.monitores);
    if (mon != null && (Number.isNaN(mon) || mon < 1 || !Number.isInteger(mon))) erros.push({ campo: 'monitores', mensagem: 'Número inteiro (≥ 1).' });
    return erros;
  }

  function validarVirtual(dados) {
    const erros = [];
    if (!String(dados.plataforma ?? '').trim()) erros.push({ campo: 'plataforma', mensagem: 'Informe a plataforma (Teams, Zoom…).' });
    const link = String(dados.link ?? '').trim();
    if (link && !/^https?:\/\/\S+$/i.test(link)) erros.push({ campo: 'link', mensagem: 'Link deve começar com http:// ou https://.' });
    return erros;
  }

  // ---------- CRUD ----------

  function salaNova(dados) {
    return {
      localizacao: { andar: '', referencia: '' },
      capacidade: { alunos: null, layout: null, area: null },
      recursos: [],
      maquinas: null,
      virtual: { plataforma: '', link: '' },
      manutencao: null,
      observacoes: '',
      ...dados,
    };
  }

  function limparDados(dados) {
    return {
      codigo: String(dados.codigo).trim().toUpperCase(),
      nome: String(dados.nome).trim(),
      tipo: dados.tipo,
      unidadeId: dados.unidadeId,
      ...(dados.status ? { status: dados.status } : {}),
    };
  }

  function incluir(lista, dados) {
    const sala = salaNova({ id: novoId(lista, 's'), status: 'ativa', ...limparDados(dados) });
    sala.capacidade.alunos = numero(dados.alunos);
    if (ehLaboratorio(sala.tipo)) sala.maquinas = maquinasVazias();
    return { lista: [...lista, sala], sala };
  }

  function maquinasVazias() {
    return { quantidade: null, processador: '', memoria: null, armazenamento: '', sistema: null, monitores: 1, softwares: [] };
  }

  function atualizar(lista, id, patch) {
    return lista.map((s) => (s.id === id ? { ...s, ...patch } : s));
  }

  // Ao trocar o tipo, ajusta o que faz sentido: laboratório ganha bloco de máquinas; virtual perde layout/recursos.
  function atualizarDados(lista, id, dados) {
    const atual = porId(lista, id);
    const limpo = limparDados(dados);
    const patch = { ...limpo, capacidade: { ...atual.capacidade, alunos: numero(dados.alunos) } };
    if (ehLaboratorio(limpo.tipo) && !atual.maquinas) patch.maquinas = maquinasVazias();
    if (!ehLaboratorio(limpo.tipo)) patch.maquinas = null;
    if (!ehFisica(limpo.tipo)) { patch.recursos = []; patch.capacidade = { ...patch.capacidade, layout: null, area: null }; patch.localizacao = { andar: '', referencia: '' }; }
    return atualizar(lista, id, patch);
  }

  function remover(lista, id) {
    return lista.filter((s) => s.id !== id);
  }

  function nomeDeCopia(lista, nome) {
    const base = `Cópia de ${nome}`;
    if (!lista.some((s) => normalizar(s.nome) === normalizar(base))) return base;
    let n = 2;
    while (lista.some((s) => normalizar(s.nome) === normalizar(`${base} (${n})`))) n += 1;
    return `${base} (${n})`;
  }

  function codigoDeCopia(lista, codigo) {
    let n = 2;
    const raiz = codigo.replace(/-\d+$/, '').slice(0, 9);
    while (lista.some((s) => normalizar(s.codigo) === normalizar(`${raiz}-${n}`))) n += 1;
    return `${raiz}-${n}`;
  }

  // Duplicar: cópia de tudo (recursos, máquinas, softwares); útil para labs iguais.
  function duplicar(lista, origemId, { codigo, nome }) {
    const copia = clonar(porId(lista, origemId));
    copia.id = novoId(lista, 's');
    copia.codigo = String(codigo).trim().toUpperCase();
    copia.nome = String(nome).trim();
    copia.status = 'ativa';
    copia.manutencao = null;
    return { lista: [...lista, copia], sala: copia };
  }

  // ---------- Seções ----------

  function atualizarEspaco(lista, id, dados) {
    const atual = porId(lista, id);
    return atualizar(lista, id, {
      localizacao: { andar: String(dados.andar ?? '').trim(), referencia: String(dados.referencia ?? '').trim() },
      capacidade: { ...atual.capacidade, layout: dados.layout || null, area: numero(dados.area) },
    });
  }

  function definirRecursos(lista, id, recursos) {
    return atualizar(lista, id, { recursos: RECURSOS.map((r) => r.id).filter((r) => recursos.includes(r)) });
  }

  function atualizarMaquinas(lista, id, dados) {
    return atualizar(lista, id, {
      maquinas: {
        quantidade: numero(dados.quantidade),
        processador: String(dados.processador ?? '').trim(),
        memoria: numero(dados.memoria),
        armazenamento: String(dados.armazenamento ?? '').trim(),
        sistema: dados.sistema || null,
        monitores: numero(dados.monitores) ?? 1,
        softwares: String(dados.softwares ?? '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
      },
    });
  }

  function atualizarVirtual(lista, id, dados) {
    return atualizar(lista, id, { virtual: { plataforma: String(dados.plataforma ?? '').trim(), link: String(dados.link ?? '').trim() } });
  }

  function atualizarObservacoes(lista, id, texto) {
    return atualizar(lista, id, { observacoes: String(texto ?? '').trim() });
  }

  // Sair da manutenção (para ativa ou inativa) limpa motivo e previsão.
  function alterarStatus(lista, id, status) {
    return atualizar(lista, id, { status, manutencao: null });
  }

  // `hoje` em ISO (aaaa-mm-dd): previsão de volta, quando há, não fica no passado.
  function validarManutencao(dados, hoje) {
    const erros = [];
    const previsao = String(dados.previsao ?? '').trim();
    if (!String(dados.motivo ?? '').trim()) erros.push({ campo: 'motivo', mensagem: 'Diga o motivo da manutenção.' });
    if (previsao && !/^\d{4}-\d{2}-\d{2}$/.test(previsao)) erros.push({ campo: 'previsao', mensagem: 'Data inválida.' });
    else if (previsao && previsao < hoje) erros.push({ campo: 'previsao', mensagem: 'A previsão não pode ficar antes de hoje.' });
    return erros;
  }

  function porEmManutencao(lista, id, dados) {
    return atualizar(lista, id, { status: 'manutencao', manutencao: { motivo: String(dados.motivo).trim(), previsao: String(dados.previsao ?? '').trim() || null } });
  }

  return {
    carregar, salvar, normalizar, porId, numero, ehFisica, ehLaboratorio,
    filtrar, contagem, pendencias,
    validarDados, validarEspaco, validarMaquinas, validarVirtual,
    incluir, atualizarDados, remover, nomeDeCopia, codigoDeCopia, duplicar,
    atualizarEspaco, definirRecursos, atualizarMaquinas, atualizarVirtual, atualizarObservacoes, alterarStatus, validarManutencao, porEmManutencao,
  };
})();
