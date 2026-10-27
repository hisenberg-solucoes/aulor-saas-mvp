// ============================================================
// Materiais das aulas (V1). O professor cadastra os materiais de cada aula da
// turma e escolhe quando liberar; a coordenação cadastra também e acompanha o
// que o professor cadastrou (materiais.html); o aluno vê no portal só o que
// já está liberado, mesmo que a aula seja futura.
// A aula é a materializada em turma.aulas (js/aulas-motor.js); a tela que
// cadastra gera as aulas da turma antes, se ainda forem só a prévia da agenda.
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
  const SITUACOES = {
    liberado: { nome: 'Liberado', descricao: 'O aluno já vê no portal.' },
    programado: { nome: 'Programado', descricao: 'Libera sozinho na data marcada.' },
    bloqueado: { nome: 'Não liberado', descricao: 'O aluno ainda não vê.' },
  };

  // Data local (a de UTC vira o dia seguinte às 21h no Brasil e liberaria o material um dia antes).
  const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  function carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (Array.isArray(salvo)) return salvo;
    } catch (_) { /* vazio */ }
    return [];
  }
  const gravar = (lista) => localStorage.setItem(CHAVE, JSON.stringify(lista));

  function situacao(m, hoje = hojeISO()) {
    if (!m.liberarEm) return 'bloqueado';
    return m.liberarEm <= hoje ? 'liberado' : 'programado';
  }
  const liberado = (m, hoje = hojeISO()) => situacao(m, hoje) === 'liberado';

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
    carregar, validar, salvar, liberar, remover, situacao, liberado,
    daTurma: (turmaId, lista = carregar()) => lista.filter((m) => m.turmaId === turmaId),
    daAula: (turmaId, aulaId, lista = carregar()) => lista.filter((m) => m.turmaId === turmaId && m.aulaId === aulaId),
    // O que o aluno vê: só o liberado até hoje.
    doAluno: (turmaId, hoje = hojeISO(), lista = carregar()) => lista.filter((m) => m.turmaId === turmaId && situacao(m, hoje) === 'liberado'),
  };
})();
