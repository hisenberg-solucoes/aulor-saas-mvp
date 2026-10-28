// ============================================================
// Materiais das aulas (V1). O professor cadastra os materiais de cada aula da
// turma e escolhe quando liberar; a coordenação cadastra também e acompanha o
// que o professor cadastrou (aba Aulas da turma); o aluno vê no portal só o que
// já está liberado, mesmo que a aula seja futura.
// A aula é a materializada em turma.aulas (js/aulas-motor.js): na prévia da
// agenda não há material, nem no administrativo nem no portal do professor;
// quem grava as aulas é o Gerar aulas da coordenação.
// Liberação: `liberarEm` (data ISO) — nula é "ainda não liberado"; até hoje,
// liberado; depois de hoje, programado.
// Arquivo: na V1 real fica em armazenamento privado com link assinado; aqui é
// só o nome do arquivo. Persistência: localStorage, chave própria.
// ============================================================

const Materiais = (() => {
  const CHAVE = 'aulor-v1-materiais-v1';
  const TIPOS = [
    { id: 'arquivo', nome: 'Arquivo' },
    { id: 'link', nome: 'Link' },
  ];
  // Tom da pílula (DESIGN.md): liberado é o estado bom; programado é informação (neutra); não liberado
  // espera alguém liberar (aviso). Fica aqui para o administrativo e o Portal do Professor mostrarem igual.
  const SITUACOES = {
    liberado: { nome: 'Liberado', descricao: 'O aluno já vê no portal.', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', ponto: 'bg-emerald-500' },
    programado: { nome: 'Programado', descricao: 'Libera sozinho na data marcada.', cls: 'bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300', ponto: 'bg-slate-500 dark:bg-neutral-400' },
    bloqueado: { nome: 'Não liberado', descricao: 'O aluno ainda não vê.', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300', ponto: 'bg-amber-500' },
  };

  // Data local (a de UTC vira o dia seguinte às 21h no Brasil e liberaria o material um dia antes).
  const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // Semente: a PY1 N da formação FPS-01, em andamento (aulas gravadas em cursos-data.js, AULAS_GRAVADAS_SEED),
  // com material de cada situação, do professor e da coordenação; a aula 3 fica sem nada. [sup.] títulos e datas meus.
  const PROFESSOR = { nome: 'Rogério Vidal Trindade', papel: 'professor' };
  const SEMENTE = [
    { id: 'mat-s1', aulaId: 'a1', titulo: 'Apostila — Introdução ao Python', descricao: '', tipo: 'arquivo', arquivo: 'py1-apostila-introducao.pdf', url: '', liberarEm: '2026-10-21', autor: PROFESSOR, criadoEm: '2026-10-19T13:10:00.000Z' },
    { id: 'mat-s2', aulaId: 'a2', titulo: 'Lista de exercícios 1 — Sintaxe e tipos', descricao: 'Entregar até a aula 3.', tipo: 'arquivo', arquivo: 'py1-exercicios-01.pdf', url: '', liberarEm: '2026-10-23', autor: PROFESSOR, criadoEm: '2026-10-22T21:40:00.000Z' },
    { id: 'mat-s3', aulaId: 'a4', titulo: 'Slides — Funções', descricao: 'Para revisar antes da aula.', tipo: 'link', arquivo: '', url: 'https://slides.exemplo.com/python/funcoes', liberarEm: '2026-10-28', autor: PROFESSOR, criadoEm: '2026-10-26T22:05:00.000Z' },
    { id: 'mat-s4', aulaId: 'a5', titulo: 'Lista de exercícios 3 — Exceções e arquivos', descricao: '', tipo: 'arquivo', arquivo: 'py1-exercicios-03.pdf', url: '', liberarEm: null, autor: PROFESSOR, criadoEm: '2026-10-26T22:12:00.000Z' },
    { id: 'mat-s5', aulaId: 'a5', titulo: 'Guia de estilo PEP 8', descricao: 'Leitura recomendada pela coordenação.', tipo: 'link', arquivo: '', url: 'https://peps.python.org/pep-0008/', liberarEm: '2026-10-30', autor: { nome: 'Bruno Lima', papel: 'coordenacao' }, criadoEm: '2026-10-27T12:30:00.000Z' },
  ].map((m) => ({ turmaId: 'fpsa-py1', ...m }));

  function carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (Array.isArray(salvo)) return salvo;
    } catch (_) { /* volta para a semente */ }
    return JSON.parse(JSON.stringify(SEMENTE));
  }
  const gravar = (lista) => localStorage.setItem(CHAVE, JSON.stringify(lista));

  function situacao(m, hoje = hojeISO()) {
    if (!m.liberarEm) return 'bloqueado';
    return m.liberarEm <= hoje ? 'liberado' : 'programado';
  }
  const liberado = (m, hoje = hojeISO()) => situacao(m, hoje) === 'liberado';
  const rotulo = (m, hoje = hojeISO()) => (situacao(m, hoje) === 'programado' ? `Libera em ${m.liberarEm.slice(8, 10)}/${m.liberarEm.slice(5, 7)}` : SITUACOES[situacao(m, hoje)].nome);
  // Só textos fixos e a data: dispensa escape.
  function pilula(m, hoje = hojeISO()) {
    const s = SITUACOES[situacao(m, hoje)];
    return `<span title="${s.descricao}" class="pilula inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${s.cls}"><span class="h-1.5 w-1.5 rounded-full ${s.ponto}" aria-hidden="true"></span>${rotulo(m, hoje)}</span>`;
  }

  function validar(d) {
    const erros = {};
    if (!d.turmaId) erros.turmaId = 'Escolha a turma.';
    if (!d.aulaId) erros.aulaId = 'Escolha a aula.';
    if (!String(d.titulo ?? '').trim()) erros.titulo = 'Informe o título.';
    if (!TIPOS.some((t) => t.id === d.tipo)) erros.tipo = 'Escolha arquivo ou link.';
    if (d.tipo === 'arquivo' && !String(d.arquivo ?? '').trim()) erros.arquivo = 'Escolha o arquivo.';
    if (d.tipo === 'link' && !/^https?:\/\/\S+\.\S+/.test(String(d.url ?? '').trim())) erros.url = 'Informe um link que comece com http:// ou https://.';
    if (d.liberarEm && !/^\d{4}-\d{2}-\d{2}$/.test(d.liberarEm)) erros.liberarEm = 'Data inválida.';
    return erros;
  }

  // Cria (sem id) ou atualiza. `autor` = { nome, papel: 'professor' | 'coordenacao' }. Devolve { erros } ou { material }.
  function salvar(dados, lista = carregar()) {
    const erros = validar(dados);
    if (Object.keys(erros).length) return { erros };
    const limpo = {
      turmaId: dados.turmaId,
      aulaId: dados.aulaId,
      titulo: String(dados.titulo).trim(),
      descricao: String(dados.descricao ?? '').trim(),
      tipo: dados.tipo,
      arquivo: dados.tipo === 'arquivo' ? String(dados.arquivo).trim() : '',
      url: dados.tipo === 'link' ? String(dados.url).trim() : '',
      liberarEm: dados.liberarEm || null,
    };
    const agora = new Date().toISOString();
    let material;
    if (dados.id && lista.some((m) => m.id === dados.id)) {
      lista = lista.map((m) => (m.id === dados.id ? (material = { ...m, ...limpo, alteradoEm: agora }) : m));
    } else {
      material = { id: `mat-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, ...limpo, autor: dados.autor ?? null, criadoEm: agora };
      lista = [...lista, material];
    }
    gravar(lista);
    return { material };
  }

  function liberar(id, data = hojeISO(), lista = carregar()) {
    gravar(lista.map((m) => (m.id === id ? { ...m, liberarEm: data } : m)));
  }
  function remover(id, lista = carregar()) {
    gravar(lista.filter((m) => m.id !== id));
  }

  return {
    CHAVE, TIPOS, SITUACOES, hojeISO,
    carregar, validar, salvar, liberar, remover, situacao, liberado, rotulo, pilula,
    daTurma: (turmaId, lista = carregar()) => lista.filter((m) => m.turmaId === turmaId),
    daAula: (turmaId, aulaId, lista = carregar()) => lista.filter((m) => m.turmaId === turmaId && m.aulaId === aulaId),
    // O que o aluno vê: só o liberado até hoje.
    doAluno: (turmaId, hoje = hojeISO(), lista = carregar()) => lista.filter((m) => m.turmaId === turmaId && situacao(m, hoje) === 'liberado'),
  };
})();
