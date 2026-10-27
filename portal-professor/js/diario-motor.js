// ============================================================
// Motor do DIÁRIO DE AULA (Portal do Professor): regras puras, sem DOM.
// Um registro por turma × data (o registro novo substitui o anterior):
//   { turmaId, aulaId | null, data 'YYYY-MM-DD', conteudo, moduloIds: [],
//     observacoes, registradoEm }
// A aula é casada pela DATA (aulas da prévia da agenda não têm id); quando a
// aula agendada tem id ele fica guardado em `aulaId` só para referência.
// Persistência em localStorage — trocar o sufixo da chave força reset.
// ============================================================

const Diario = (() => {
  const CHAVE = 'prototipo-diario-aula-v1';
  let cache = null;

  const hoje = () => (typeof Turmas !== 'undefined' ? Turmas.hoje() : new Date().toISOString().slice(0, 10));

  function carregar() {
    if (cache) return cache;
    try {
      const salvo = localStorage.getItem(CHAVE);
      cache = salvo ? JSON.parse(salvo) : [];
    } catch (_) { cache = []; }
    if (!Array.isArray(cache)) cache = [];
    return cache;
  }
  function salvar(lista) { localStorage.setItem(CHAVE, JSON.stringify(lista)); cache = lista; }
  const invalidar = () => { cache = null; };

  const dataDe = (aula) => (typeof aula === 'string' ? aula : aula?.data);
  const daAula = (r, aula) => r.data === dataDe(aula);

  // Diário de uma aula (turma × data), ou null.
  const porAula = (turmaId, aula, lista = carregar()) => lista.find((r) => r.turmaId === turmaId && daAula(r, aula)) ?? null;
  const daTurma = (turmaId, lista = carregar()) => lista.filter((r) => r.turmaId === turmaId);

  const ehData = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));

  function validar(d) {
    const erros = [];
    if (!d.turmaId) erros.push({ campo: 'turmaId', mensagem: 'Informe a turma.' });
    if (!ehData(d.data)) erros.push({ campo: 'data', mensagem: 'Informe a data da aula.' });
    if (!String(d.conteudo ?? '').trim() && !(d.moduloIds ?? []).length) erros.push({ campo: 'conteudo', mensagem: 'Descreva o conteúdo ministrado ou marque ao menos um módulo.' });
    return erros;
  }

  function limpar(d) {
    return {
      turmaId: d.turmaId,
      aulaId: d.aulaId ?? null,
      data: d.data,
      conteudo: String(d.conteudo ?? '').trim(),
      moduloIds: Array.from(new Set((d.moduloIds ?? []).filter(Boolean))),
      observacoes: String(d.observacoes ?? '').trim(),
      registradoEm: d.registradoEm ?? new Date().toISOString().slice(0, 19),
    };
  }

  // Grava (ou substitui) o diário da aula. Retorna a lista nova.
  function registrar(lista, d) {
    const novo = limpar(d);
    const resto = lista.filter((r) => !(r.turmaId === novo.turmaId && daAula(r, novo)));
    return [...resto, novo];
  }

  // Aulas já dadas (data ≤ ref, não canceladas) sem diário. Cada aula precisa de `turmaId`
  // (ou `turma.turma.id`, como nas linhas enriquecidas do portal) e `data`.
  function pendentes(aulas, ref = hoje(), lista = carregar()) {
    return (aulas ?? []).filter((a) => {
      if (!a || a.status === 'cancelada' || !a.data || a.data > ref) return false;
      const turmaId = a.turmaId ?? a.turma?.turma?.id ?? a.turma?.id ?? null;
      return turmaId ? !porAula(turmaId, a.data, lista) : false;
    });
  }

  return { CHAVE, carregar, salvar, invalidar, porAula, daTurma, validar, registrar, pendentes };
})();
