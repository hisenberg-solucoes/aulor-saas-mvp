// ============================================================
// Ponte entre as telas de Pessoas trazidas do protótipo original
// (colaboradores, instrutores, calendário do instrutor) e a base única do MVP
// (js/aulor.js). Os motores originais leem turmas e cursos por `Cursos` e o
// calendário lê `PortalProfessor`, `Turmas`, `Eventos`, `Presencas` e
// `Diario`; aqui cada um responde com os registros do MVP, sem copiar nada.
//
// Diferenças do MVP: a turma aponta `professorId` (o instrutor), não há
// formações, salas, eventos nem gravações, e a chamada e o diário moram na
// própria aula (`aula.presencas`, `aula.conteudo`).
// ============================================================

// Turma no formato do protótipo original: instrutorId = professorId, vagas = capacidade.
function turmaParaPessoas(t) {
  const curso = Aulor.curso(t.cursoId);
  return { ...t, instrutorId: t.professorId, vagas: t.capacidade, formato: t.agenda?.formato ?? curso?.modalidade, tipo: 'aberta', formacaoId: null, meetLink: null };
}

const Cursos = {
  // Habilitado = já deu ou vai dar aula numa turma do curso (o MVP não tem lista de habilitados).
  carregar: () => Aulor.cursos().map((c) => ({
    ...c,
    instrutorIds: [...new Set(Aulor.turmas().filter((t) => t.cursoId === c.id && t.status !== 'cancelada').map((t) => t.professorId))],
  })),
  todasTurmas: () => Aulor.turmas().map(turmaParaPessoas),
};

// ---------- Calendário do instrutor (js/calendario-instrutor-ui.js) ----------

const Turmas = {
  hoje: () => Aulor.hoje(),
  horasAula: (a) => { const [hi, mi] = a.inicio.split(':').map(Number); const [hf, mf] = a.fim.split(':').map(Number); return (hf * 60 + mf - hi * 60 - mi) / 60; },
  duracaoTexto: (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`),
};

const PortalProfessor = {
  turmas: (instrutorId, ref = Aulor.hoje()) => Aulor.turmasDoProfessor(instrutorId)
    .filter((t) => t.status !== 'cancelada')
    .map((t) => {
      const aulas = Aulor.aulasDaTurma(t.id).filter((a) => a.status !== 'cancelada');
      const realizadas = aulas.filter((a) => a.data < ref).length;
      return {
        turma: turmaParaPessoas(t), curso: Aulor.curso(t.cursoId), formacao: null, sala: t.local ? { nome: t.local } : null,
        aulas, realizadas, progresso: aulas.length ? Math.round((realizadas / aulas.length) * 100) : 0,
        situacao: Aulor.situacaoTurma(t, ref),
        alunos: Aulor.matriculasDaTurma(t.id).map((m) => Aulor.aluno(m.alunoId)),
        gravacoes: [],
      };
    }),
};

// O MVP não tem eventos: a grade do mês continua valendo, as listas vêm vazias.
const TIPOS_EVENTO = [];
const Eventos = (() => {
  const pad = (n) => String(n).padStart(2, '0');
  function gradeDoMes(ano, mes) {
    const ym = `${ano}-${pad(mes)}`;
    const primeiro = `${ym}-01`;
    const offset = (new Date(`${primeiro}T12:00:00`).getDay() + 6) % 7; // segunda = 0
    const dias = [];
    for (let i = offset; i > 0; i -= 1) dias.push({ iso: Aulor.somarDias(primeiro, -i), doMes: false });
    const total = new Date(ano, mes, 0).getDate();
    for (let d = 1; d <= total; d += 1) dias.push({ iso: `${ym}-${pad(d)}`, doMes: true });
    let prox = Aulor.somarDias(dias.at(-1).iso, 1);
    while (dias.length % 7) { dias.push({ iso: prox, doMes: false }); prox = Aulor.somarDias(prox, 1); }
    const semanas = [];
    for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
    return semanas;
  }
  const nada = () => [];
  return {
    carregar: nada, carregarInscricoes: nada, paraTurmas: nada, porDia: nada, proximos: nada, inscritos: nada, gradeDoMes,
    tipoDe: () => ({ nome: 'Evento' }), horarioTexto: () => '', restricaoTexto: () => '',
    fmtData: (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR'),
    fmtMoeda: (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  };
})();

// Chamada e diário ficam na aula do MVP (só contam depois de registrada).
const Presencas = {
  porAula: (_turmaId, a) => (a.status === 'realizada' ? Object.values(a.presencas ?? {}).map((status) => ({ status })) : []),
  conta: (status) => status === 'P' || (status === 'J' && Aulor.config().academico.justificadaContaPresenca),
};
const Diario = {
  porAula: (turmaId, data) => {
    const a = Aulor.aulasDaTurma(turmaId).find((x) => x.data === data && x.conteudo);
    return a ? { conteudo: a.conteudo } : null;
  },
};
