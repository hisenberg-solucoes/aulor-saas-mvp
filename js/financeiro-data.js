// ============================================================
// Financeiro por turma — parâmetros e semente dos custos lançados.
//
// Cada turma tem custos LANÇADOS (não derivados): material didático,
// coffee break e outros, mais a alíquota de imposto aplicada sobre a
// receita da turma. O custo do instrutor NÃO é lançado aqui: sai do
// contrato do instrutor (js/instrutores-data.js) ou, sem contrato, da
// tabela de valor-hora dele.
//
// A semente é gerada a partir das turmas (vagas × encontros) só para o
// protótipo ter números; na tela da turma tudo é editável.
// ============================================================

const FINANCEIRO_PARAMETROS = {
  impostoPct: 34,                 // Simples/Lucro presumido + ISS, conforme a reunião ("impostos 34%")
  materialPorAluno: 38,           // apostila impressa + certificado
  coffeePorAlunoEncontro: 7.5,    // presencial/híbrido; online não tem
  valorHoraEstimado: 100,         // instrutor sem contrato e sem tabela de valor-hora
};

// Gera { [turmaId]: { material, coffee, outros, impostoPct, observacao } } para todas as turmas da semente.
function gerarCustosTurmaSeed(turmas, cursos) {
  const arred = (n) => Math.round(n * 100) / 100;
  const mapa = {};
  turmas.forEach((t) => {
    const curso = cursos.find((c) => c.id === t.cursoId);
    const carga = Number(curso?.cargaHoraria) || 0;
    const encontros = Number(curso?.encontros) || Math.max(1, Math.ceil(carga / 4));
    const alunos = Math.max(1, Math.round((Number(t.vagas) || 0) * 0.8));
    const presencial = t.formato !== 'online';
    const material = arred(alunos * FINANCEIRO_PARAMETROS.materialPorAluno);
    const coffee = presencial ? arred(alunos * encontros * FINANCEIRO_PARAMETROS.coffeePorAlunoEncontro) : 0;
    // Outros: licença/laboratório em cursos longos, plataforma nos online.
    const outros = !presencial ? 120 : carga >= 60 ? 250 : 0;
    mapa[t.id] = { material, coffee, outros, impostoPct: FINANCEIRO_PARAMETROS.impostoPct, observacao: '' };
  });
  return mapa;
}
