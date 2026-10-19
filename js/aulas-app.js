// ============================================================
// Aulas e chamadas (para o professor: "Minhas aulas").
// Escopo pela permissão: "frequencia" vê a agenda de todas as turmas (a
// frequência dos alunos fica em alertas-frequencia.html e as turmas em
// turmas.html); só "minhas-aulas" vê as próprias turmas, com abas.
// Pensada para o celular: cartões em lista e botões de 44px abaixo de 640px.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const todas = Shell.pode('frequencia');
  const meus = new Set(Shell.professorIds());
  const turmasEscopo = Aulor.turmas().filter((t) => t.status !== 'cancelada' && (todas || meus.has(t.professorId)));
  const idsEscopo = new Set(turmasEscopo.map((t) => t.id));
  const noEscopo = (a) => idsEscopo.has(a.turmaId);
  const abas = [
    { id: 'agenda', nome: 'Agenda' },
    { id: 'frequencia', nome: 'Frequência dos alunos' },
    { id: 'turmas', nome: 'Minhas turmas' },
  ];
  const aba = !todas && abas.some((a) => a.id === parametroUrl('aba')) ? parametroUrl('aba') : 'agenda';
  const TOQUE = 'w-full sm:w-auto max-sm:h-11';
  const lista = (itens) => `<ul class="mt-3 border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">${itens}</ul>`;
  const nada = (texto) => `<p class="px-4 pt-2 pb-4 text-sm ${APOIO}">${texto}</p>`;

  function linhaAula(a, { destaque = false } = {}) {
    const t = Aulor.turma(a.turmaId);
    const c = Aulor.curso(t.cursoId);
    const feita = a.status === 'realizada';
    const presentes = Object.values(a.presencas).filter((v) => v === 'P').length;
    const n = feita ? Object.keys(a.presencas).length : Aulor.participantes(a).length;
    const acao = feita
      ? `<a href="chamada.html?aula=${a.id}" title="Ver a chamada" class="inline-flex items-center gap-2 max-sm:h-11 rounded-sm hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/50">${status('ok', 'Chamada feita')}<span class="text-xs ${APOIO} tabular-nums">${presentes}/${n}</span></a>`
      : a.data <= hoje && Shell.podeChamada(t)
        ? `<a href="chamada.html?aula=${a.id}" class="btn-pri ${TOQUE}">Fazer chamada · ${plural(n, 'aluno')}</a>`
        : `<span class="text-xs ${APOIO}">${plural(n, 'aluno')}</span>`;
    return `
      <li class="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div class="w-16 shrink-0">
          <p class="${destaque ? 'text-lg' : 'text-sm'} font-semibold tabular-nums ${TITULO}">${a.inicio}</p>
          <p class="text-xs ${APOIO} tabular-nums">${destaque ? `até ${a.fim}` : `${diaSemana(a.data)} ${dataCurta(a.data)}`}</p>
        </div>
        <div class="flex-1 min-w-[12rem]">
          <a href="turma.html?id=${t.id}" class="text-sm font-medium ${TITULO} hover:underline underline-offset-2">${esc(c.nome)}</a>
          <p class="text-xs ${APOIO}"><span class="font-mono">${esc(t.codigo)}</span> · aula ${a.n} de ${Aulor.progressoTurma(t).total}${t.local ? ` · ${esc(t.local)}` : ''}${todas ? ` · ${esc(Aulor.professor(t.professorId).nome)}` : ''}</p>
        </div>
        <div class="w-full sm:w-auto">${acao}</div>
      </li>`;
  }

  // Recorte útil: hoje, o que ficou para trás e os próximos 7 dias.
  function abaAgenda() {
    const deHoje = Aulor.aulasDoDia(hoje).filter(noEscopo);
    const pendentes = Aulor.chamadasPendentes().filter(noEscopo);
    const proximas = Aulor.proximasAulas(hoje, 100).filter(noEscopo).filter((a) => Aulor.diasEntre(hoje, a.data) <= 7);
    return `
      <div class="space-y-4">
        ${cartao({ titulo: 'Hoje', contexto: dataLonga(hoje), corpo: deHoje.length ? lista(deHoje.map((a) => linhaAula(a, { destaque: true })).join('')) : nada('Nenhuma aula hoje.') })}
        ${pendentes.length ? cartao({
          titulo: `Chamadas pendentes <span class="ml-1 text-xs font-semibold ${AVISO} tabular-nums">${pendentes.length}</span>`,
          contexto: 'Aulas que já passaram sem chamada. Até o registro, elas não contam na frequência.',
          corpo: lista(pendentes.map((a) => linhaAula(a)).join('')),
        }) : ''}
        ${cartao({ titulo: 'Próximos 7 dias', contexto: proximas.length ? plural(proximas.length, 'aula') : '', corpo: proximas.length ? lista(proximas.map((a) => linhaAula(a)).join('')) : nada('Sem aulas na próxima semana.') })}
      </div>`;
  }

  function abaFrequencia() {
    const min = Aulor.config().academico.frequenciaMinima;
    const emCurso = turmasEscopo.filter((t) => ['em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(t)));
    const blocos = emCurso.map((t) => {
      const alunos = Aulor.matriculasDaTurma(t.id).filter((m) => m.status === 'ativa').map((m) => ({ m, f: Aulor.frequencia(m) })).filter(({ f }) => f.total >= 1 && f.percentual < min + 10).sort((a, b) => a.f.percentual - b.f.percentual);
      return { t, alunos };
    });
    const total = blocos.reduce((s, b) => s + b.alunos.filter((x) => x.f.abaixo).length, 0);
    return `
      <p class="text-sm ${APOIO_FUNDO} mb-4">${plural(total, 'aluno está', 'alunos estão')} abaixo da frequência mínima de ${min}%. Também aparecem os que estão a menos de 10 pontos do mínimo.</p>
      <div class="space-y-4">${blocos.map(({ t, alunos }) => cartao({
        titulo: `<a href="turma.html?id=${t.id}" class="hover:underline underline-offset-2">${esc(Aulor.curso(t.cursoId).nome)}</a>`,
        contexto: `<span class="font-mono">${esc(t.codigo)}</span> · ${plural(Aulor.progressoTurma(t).realizadas, 'aula dada', 'aulas dadas')}`,
        corpo: alunos.length ? lista(alunos.map(({ m, f }) => `
          <li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
            <span class="flex-1 min-w-[10rem] text-sm text-slate-800 dark:text-neutral-100">${Shell.pode('matriculas') ? `<a class="hover:underline underline-offset-2" href="matricula.html?id=${m.id}">${esc(Aulor.aluno(m.alunoId).nome)}</a>` : esc(Aulor.aluno(m.alunoId).nome)}<span class="block text-xs ${APOIO} tabular-nums">${plural(f.faltas, 'falta')}${f.justificadas ? ` + ${f.justificadas} just.` : ''}</span></span>
            ${barraFrequencia(f)}
            <span class="w-40">${f.semChance ? status('perigo', 'Não alcança mais') : f.abaixo ? status('atencao', 'Abaixo do mínimo') : status('neutro', 'Perto do limite')}</span>
          </li>`).join('')) : nada('Todos com frequência confortável.'),
      })).join('') || `<div class="painel">${vazio('Nenhuma turma em andamento')}</div>`}
      </div>`;
  }

  function abaTurmas() {
    const ativas = turmasEscopo.filter((t) => Aulor.situacaoTurma(t) !== 'concluida').sort((a, b) => a.inicio.localeCompare(b.inicio));
    if (!ativas.length) return `<div class="painel">${vazio('Nenhuma turma')}</div>`;
    return `<ul class="painel divide-y divide-slate-100 dark:divide-neutral-900 overflow-hidden">${ativas.map((t) => {
      const s = Aulor.situacaoTurma(t);
      const pr = Aulor.progressoTurma(t);
      return `<li><a href="turma.html?id=${t.id}" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50 dark:hover:bg-neutral-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)]">
        <span class="flex-1 min-w-[12rem]"><span class="block text-sm font-medium ${TITULO}">${esc(Aulor.curso(t.cursoId).nome)}</span><span class="block text-xs ${APOIO}"><span class="font-mono">${esc(t.codigo)}</span> · ${esc(Agenda.descrever(t.agenda))}</span></span>
        <span class="text-xs ${APOIO} tabular-nums">${pr.realizadas}/${pr.total} aulas · ${plural(Aulor.ocupacao(t).ocupadas, 'aluno')}</span>
        ${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome)}
      </a></li>`;
    }).join('')}</ul>`;
  }

  tela.innerHTML = `
    <div>
      ${cabecalhoPagina({
        titulo: todas ? 'Aulas e chamadas' : 'Minhas aulas',
        subtitulo: todas ? 'Aulas de hoje, chamadas que ficaram para trás e a próxima semana de todas as turmas.' : `Olá, ${esc(Shell.nome().split(' ')[0])}. Suas turmas, chamadas e diário.`,
      })}
      ${todas ? '' : abasHtml(abas, aba)}
      ${aba === 'agenda' ? abaAgenda() : aba === 'frequencia' ? abaFrequencia() : abaTurmas()}
    </div>`;
})();
