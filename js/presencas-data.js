// ============================================================
// Dados de PRESENÇA (chamada) das aulas: constantes + semente.
// Um registro por turma × aula × aluno:
//   { turmaId, aulaId (id da aula agendada, ou null na prévia da agenda),
//     data 'YYYY-MM-DD', alunoId, status, minutos (atraso, opcional),
//     chegada / saida ('HH:MM', opcionais, só para presente/atraso — 08/09/2026),
//     observacao, registradoEm }
// A aula é casada pelo `aulaId` quando existe e pela `data` como fallback —
// assim o registro sobrevive à geração do agendamento (Aulas.gerar cria ids
// novos) e vale também enquanto a turma só tem a prévia da agenda.
//
// A SEMENTE é gerada em tempo de carga (Presencas.carregar → gerarSementePresencas)
// percorrendo turmas × matrículas × aulas já realizadas, com um hash simples
// do id (determinístico, sem Math.random). Assim não há literal gigante e ela
// acompanha as turmas/matrículas da semente atual. Alguns casos são forçados
// (PRESENCAS_CASOS) para a demonstração: atenção, risco e reprovação por frequência.
// ============================================================

const STATUS_PRESENCA = [
  { id: 'presente', nome: 'Presente', descricao: 'Compareceu à aula inteira.', ponto: 'bg-emerald-500', conta: true },
  { id: 'atraso', nome: 'Atraso', descricao: 'Chegou depois do início; conta como presença.', ponto: 'bg-amber-500', conta: true },
  { id: 'justificada', nome: 'Falta justificada', descricao: 'Faltou com justificativa aceita pela secretaria (atestado etc.); conta como presença.', ponto: 'bg-sky-500', conta: true },
  { id: 'ausente', nome: 'Falta', descricao: 'Não compareceu.', ponto: 'bg-red-500', conta: false },
];

// [sup.] 75% é a frequência mínima usual em cursos livres e a que já consta em
// curso.certificado.frequenciaMinima na semente de cursos. Quando o curso define
// o próprio número, ele vence este padrão.
const FREQUENCIA_MINIMA = 75;

// Situação da frequência do aluno num curso (texto + ponto colorido, sem chips).
const STATUS_FREQUENCIA = [
  { id: 'ok', nome: 'Em dia', descricao: 'Frequência com folga acima do mínimo.', ponto: 'bg-emerald-500' },
  { id: 'atencao', nome: 'Atenção', descricao: 'Acima do mínimo, mas com menos de 10 pontos de folga.', ponto: 'bg-amber-500' },
  { id: 'risco', nome: 'Em risco', descricao: 'Abaixo do mínimo com o curso em andamento — ainda dá para recuperar.', ponto: 'bg-red-500' },
  { id: 'reprovado_frequencia', nome: 'Reprovado por frequência', descricao: 'Curso encerrado com frequência abaixo do mínimo.', ponto: 'bg-red-500' },
  { id: 'sem_aulas', nome: 'Sem aulas', descricao: 'Nenhuma aula realizada ainda.', ponto: 'bg-slate-400' },
];

// Casos forçados na semente (índice = posição da aula entre as REALIZADAS da turma, a partir de 0).
// [sup.] O pedido era um aluno "em risco" na SUP09-PYA, mas essa turma começa em 26/08/2026 (= hoje da
// semente) e não tem aula realizada; o caso de risco foi para a SUP10-HT5, única turma em andamento com
// aulas já dadas. A SUP09 ganhou o caso de "atenção" (a3 no PJS) e a reprovação por frequência (a1 no PY2).
const PRESENCAS_CASOS = [
  // a1 (Gustavo Queiroz) · SUP09 · PY2 (curso concluído mais recente, 6 aulas): 2 faltas + 1 justificada → 67%.
  { turmaId: 'sup09-py2', alunoId: 'a1', aulas: { 1: 'ausente', 3: 'justificada', 4: 'ausente' } },
  // a3 (Elias Zimmermann) · SUP09 · PJS (19 aulas): 4 faltas → 79% → atenção.
  { turmaId: 'sup09-pjs', alunoId: 'a3', aulas: { 2: 'ausente', 7: 'ausente', 11: 'ausente', 15: 'ausente' } },
  // a42 · SUP10 · HT5 (em andamento, 4 aulas dadas): 2 faltas → 50% → em risco.
  { turmaId: 'sup10-ht5', alunoId: 'a42', aulas: { 1: 'ausente', 3: 'ausente' } },
];

// Hash FNV-1a simplificado → inteiro 0..99 (determinístico por texto).
function hashPresenca(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100;
}

// Percorre turmas × matrículas (matriculado/concluído/desistiu) × aulas realizadas (data < ref, não canceladas).
// Distribuição geral: ~91% presente, 3% atraso, 3% justificada e faltas por MÊS (FALTAS_POR_MES, 2–9%),
// para o gráfico "Frequência por mês" ter forma (inverno e dezembro faltam mais). Nos cursos curtos de
// 6 aulas uma falta já derruba para 83% = "atenção", por isso o teto de faltas aleatórias é baixo.
// [sup.] percentuais de falta por mês (calendário), sem base em dado real.
const FALTAS_POR_MES = { '01': 5, '02': 4, '03': 2, '04': 3, '05': 4, '06': 6, '07': 8, '08': 3, '09': 3, '10': 4, '11': 6, '12': 9 };
function gerarSementePresencas(turmas, ref) {
  const lista = [];
  const casos = new Map(PRESENCAS_CASOS.map((c) => [`${c.turmaId}|${c.alunoId}`, c.aulas]));
  turmas.forEach((t) => {
    if (t.status === 'cancelada') return;
    const dadas = Turmas.aulas(t).filter((a) => a.data < ref);
    if (!dadas.length) return;
    const ms = Turmas.matriculas(t);
    if (!ms) return;
    ms.linhas.forEach(({ alunoId, matricula }) => {
      const forcadas = casos.get(`${t.id}|${alunoId}`);
      let faltasHash = 0;
      dadas.forEach((a, i) => {
        // Desistente/congelado: presenças até sair, depois faltas (aproximação — não há data da mudança na semente).
        let status;
        if (forcadas) status = forcadas[i] ?? 'presente'; // caso forçado: só as aulas listadas fogem da presença
        else if ((matricula.status === 'desistiu' || matricula.status === 'congelada') && i >= Math.ceil(dadas.length / 2)) status = 'ausente';
        else {
          const h = hashPresenca(`${t.id}|${a.data}|${alunoId}`);
          const falta = FALTAS_POR_MES[a.data.slice(5, 7)] ?? 3;
          status = h < 100 - falta - 6 ? 'presente' : h < 100 - falta - 3 ? 'atraso' : h < 100 - falta ? 'justificada' : 'ausente';
          // Teto de faltas "aleatórias" por aluno × turma (1 em cursos curtos, 2 a partir de 12 aulas): a excedente vira
          // atraso (cursos de 6 aulas cairiam abaixo do mínimo sem querer; os casos abaixo do mínimo são só os de PRESENCAS_CASOS).
          if (status === 'ausente' && ++faltasHash > (dadas.length >= 12 ? 2 : 1)) status = 'atraso';
        }
        lista.push({
          turmaId: t.id, aulaId: a.id ?? null, data: a.data, alunoId, status,
          minutos: status === 'atraso' ? 10 + hashPresenca(`${a.data}|${alunoId}`) % 25 : null,
          observacao: status === 'justificada' ? 'Atestado entregue à secretaria' : '',
          registradoEm: `${a.data}T${a.fim ?? '22:00'}:00`,
        });
      });
    });
  });
  return lista;
}
