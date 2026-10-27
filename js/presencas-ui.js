// ============================================================
// UI compartilhada de PRESENÇAS no portal administrativo (só leitura).
// A chamada é registrada pelo professor (Portal do Professor → aula.html);
// as telas do admin (turmas/turma, agendamento, aluno, formação) só exibem
// frequência e situação. Cálculos no motor (js/presencas-motor.js);
// esc/dataCurta vêm de js/avaliacoes-ui.js.
// ============================================================

const PresencasUi = (() => {
  const INICIAL_PRESENCA = { presente: 'P', atraso: 'A', justificada: 'J', ausente: 'F' };

  const minimoDe = (curso) => curso?.certificado?.frequenciaMinima ?? FREQUENCIA_MINIMA;
  const pct = (n) => (n == null ? '—' : `${n}%`);
  const nDe = (n, singular, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`;

  // Frequência de todos os alunos de uma turma (linhas de Turmas.matriculas, sem
  // canceladas nem congeladas — quem pausou fica fora das contas), em ordem alfabética. `alunoDe` resolve o cadastro do aluno;
  // `registros` inclui o registro de cada aula dada (grade aluno × aula).
  function resumoTurma(t, curso, alunoDe, { ref = Turmas.hoje(), registros = true } = {}) {
    const aulas = Turmas.aulas(t);
    const dadas = Presencas.aulasDadas(aulas, ref);
    const minimo = minimoDe(curso);
    const situacao = Turmas.situacao(t);
    const linhas = (Turmas.matriculas(t)?.linhas ?? [])
      .filter((l) => l.matricula.status !== 'cancelada' && l.matricula.status !== 'congelada')
      .map((l) => ({
        ...l,
        aluno: alunoDe ? alunoDe(l.alunoId) : null,
        frequencia: Presencas.frequencia(t.id, l.alunoId, aulas, ref, { concluido: situacao === 'concluida' || l.matricula.status !== 'matriculado', minimo }),
        registros: registros ? dadas.map((a) => Presencas.registroDe(t.id, l.alunoId, a)) : null,
      }))
      .sort((a, b) => (a.aluno?.nomeSocial || a.aluno?.nome || '').localeCompare(b.aluno?.nomeSocial || b.aluno?.nome || '', 'pt-BR'));
    const com = linhas.filter((l) => l.frequencia.dadas > 0);
    const media = com.length ? Math.round(com.reduce((s, l) => s + l.frequencia.percentual, 0) / com.length) : null;
    const conta = (s) => linhas.filter((l) => l.frequencia.status === s).length;
    const [ok, atencao, risco, reprovados] = ['ok', 'atencao', 'risco', 'reprovado_frequencia'].map(conta);
    return { aulas, dadas, minimo, linhas, media, ok, atencao, risco, reprovados, abaixo: risco + reprovados, alertas: atencao + risco + reprovados };
  }

  // Chamada de uma aula: contagem por status entre as matrículas dadas (sem canceladas).
  function resumoAula(t, aula, linhas) {
    const n = { presente: 0, atraso: 0, justificada: 0, ausente: 0, semRegistro: 0 };
    linhas.forEach((l) => {
      const r = Presencas.registroDe(t.id, l.alunoId, aula);
      if (!r) n.semRegistro += 1;
      else n[r.status] = (n[r.status] ?? 0) + 1;
    });
    return { ...n, total: linhas.length, validas: n.presente + n.atraso + n.justificada, faltas: n.ausente + n.semRegistro };
  }

  // Texto do balão com a conta da frequência (aceita também o consolidado de Presencas.consolidar).
  function dicaFrequencia(f) {
    if (!f || !f.dadas) return 'Nenhuma aula realizada ainda.';
    const s = Presencas.statusFrequenciaDe(f.status);
    const partes = [
      f.presentes ? nDe(f.presentes, 'presença') : '',
      f.atrasos ? nDe(f.atrasos, 'atraso') : '',
      f.justificadas ? nDe(f.justificadas, 'falta justificada', 'faltas justificadas') : '',
      f.faltas ? `${nDe(f.faltas, 'falta')}${f.semRegistro ? ` (${f.semRegistro} sem registro)` : ''}` : '',
    ].filter(Boolean).join(' · ');
    return `${f.validas} de ${nDe(f.dadas, 'aula dada', 'aulas dadas')} contam como presença — ${partes}. Mínimo ${f.minimo}% · ${s?.nome ?? f.status}: ${s?.descricao ?? ''}`;
  }

  // Balão da chamada de uma aula (resumoAula).
  function dicaAula(r) {
    const partes = [
      r.presente ? nDe(r.presente, 'presente') : '',
      r.atraso ? nDe(r.atraso, 'atraso') : '',
      r.justificada ? nDe(r.justificada, 'falta justificada', 'faltas justificadas') : '',
      r.ausente ? nDe(r.ausente, 'falta') : '',
      r.semRegistro ? `${r.semRegistro} sem registro (conta como falta)` : '',
    ].filter(Boolean).join(' · ');
    return `Chamada: ${r.validas} de ${nDe(r.total, 'aluno')} contam como presença — ${partes}.`;
  }

  // "92% · Em dia" — percentual + situação como texto com ponto colorido (sem chip).
  function situacaoHtml(f, { comPercentual = true } = {}) {
    if (!f || !f.dadas) return '<span class="text-xs text-slate-400" title="Nenhuma aula realizada ainda">sem aulas</span>';
    const s = Presencas.statusFrequenciaDe(f.status);
    const ruim = f.status === 'risco' || f.status === 'reprovado_frequencia';
    const corTexto = ruim ? 'text-red-600 dark:text-red-400' : f.status === 'atencao' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-neutral-400';
    return `<span class="inline-flex items-center gap-1.5 whitespace-nowrap" title="${esc(dicaFrequencia(f))}">${comPercentual ? `<span class="tabular-nums text-sm font-medium ${ruim ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-neutral-100'}">${pct(f.percentual)}</span>` : ''}<span class="h-2 w-2 rounded-full ${s?.ponto ?? 'bg-slate-400'}"></span><span class="text-xs ${corTexto}">${esc(s?.nome ?? f.status)}</span></span>`;
  }

  // Fundo das bolinhas com letra branca: tom 700 para passar AA (o 500 do ponto dava de 2,1:1 a 3,8:1).
  const FUNDO_CELULA = { presente: 'bg-emerald-700', atraso: 'bg-amber-700', justificada: 'bg-sky-700', ausente: 'bg-red-700' };

  // Bolinha P/A/J/F da grade aluno × aula (sem registro = tracejada, conta como falta).
  function celulaHtml(reg, aula) {
    if (!reg) return `<span class="inline-grid place-items-center h-6 w-6 rounded-full border border-slate-300 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 text-[11px]" title="${esc(`${dataCurta(aula.data)} · sem registro na chamada — conta como falta`)}">—</span>`;
    const s = Presencas.statusDe(reg.status);
    const extra = reg.status === 'atraso' && reg.minutos ? ` (${reg.minutos} min)` : '';
    const hor = Presencas.horarioTexto(reg);
    const obs = `${hor ? ` · ${hor}` : ''}${reg.observacao ? ` · ${reg.observacao}` : ''}`;
    return `<span class="inline-grid place-items-center h-6 w-6 rounded-full ${FUNDO_CELULA[reg.status] ?? 'bg-slate-600'} text-white text-[11px] font-semibold" title="${esc(`${dataCurta(reg.data)} · ${s?.nome ?? reg.status}${extra}${obs}`)}">${INICIAL_PRESENCA[reg.status] ?? '?'}</span>`;
  }

  function legendaHtml() {
    return STATUS_PRESENCA.map((s) => `<span class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400"><span class="h-4 w-4 rounded-full ${FUNDO_CELULA[s.id] ?? s.ponto} text-white text-[10px] font-semibold grid place-items-center">${INICIAL_PRESENCA[s.id]}</span>${esc(s.nome)}</span>`).join('')
      + '<span class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400"><span class="h-4 w-4 rounded-full border border-slate-300 dark:border-neutral-700 grid place-items-center text-[9px]">—</span>Sem registro (conta como falta)</span>';
  }

  return { INICIAL_PRESENCA, minimoDe, pct, resumoTurma, resumoAula, dicaFrequencia, dicaAula, situacaoHtml, celulaHtml, legendaHtml };
})();
