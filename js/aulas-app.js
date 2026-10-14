// ============================================================
// Aulas e chamadas (para o professor: "Minhas aulas").
// Escopo pela permissão: "frequencia" vê a agenda de todas as turmas (a
// frequência dos alunos fica em alertas-frequencia.html e as turmas em
// turmas.html); só "minhas-aulas" vê as próprias turmas, com abas.
// Pensada para funcionar no celular (lista em blocos, botões grandes).
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

  function cartaoAula(a, { destaque = false } = {}) {
    const t = Aulor.turma(a.turmaId);
    const c = Aulor.curso(t.cursoId);
    const feita = a.status === 'realizada';
    const presentes = Object.values(a.presencas).filter((v) => v === 'P').length;
    const n = feita ? Object.keys(a.presencas).length : Aulor.participantes(a).length;
    return `
      <li class="${destaque ? 'painel p-4' : 'px-4 py-3'} flex flex-wrap items-center gap-x-4 gap-y-2">
        <div class="w-20 shrink-0">
          <p class="font-display ${destaque ? 'text-xl' : 'text-base'} font-semibold tabular-nums text-tinta">${a.inicio}</p>
          <p class="text-xs text-tinta-2">${destaque ? `até ${a.fim}` : `${diaSemana(a.data)} ${dataCurta(a.data)}`}</p>
        </div>
        <div class="flex-1 min-w-[12rem]">
          <p class="text-sm font-medium text-tinta">${esc(c.nome)}</p>
          <p class="text-xs text-tinta-2">${esc(t.codigo)} · aula ${a.n} de ${Aulor.progressoTurma(t).total} · ${esc(t.local || '')}${todas ? ` · ${esc(Aulor.professor(t.professorId).nome)}` : ''}</p>
        </div>
        <div class="w-full sm:w-auto">
          ${feita
            ? `<a href="chamada.html?aula=${a.id}" class="btn-sec w-full sm:w-auto">${ICONE.check}${presentes} de ${n} presentes</a>`
            : a.data <= hoje && Shell.podeChamada(t)
              ? `<a href="chamada.html?aula=${a.id}" class="btn-pri w-full sm:w-auto py-2.5">Fazer chamada · ${n} alunos</a>`
              : `<span class="text-xs text-tinta-2">${n} alunos</span>`}
        </div>
      </li>`;
  }

  function abaAgenda() {
    const deHoje = Aulor.aulasDoDia(hoje).filter(noEscopo);
    const pendentes = Aulor.chamadasPendentes().filter(noEscopo);
    const proximas = Aulor.proximasAulas(hoje, 100).filter(noEscopo).filter((a) => Aulor.diasEntre(hoje, a.data) <= 7);
    return `
      <section class="mb-6">
        <h3 class="text-xs font-medium text-tinta-2 mb-2">Hoje · ${dataLonga(hoje)}</h3>
        ${deHoje.length ? `<ul class="space-y-3">${deHoje.map((a) => cartaoAula(a, { destaque: true })).join('')}</ul>` : '<p class="painel px-4 py-5 text-sm text-tinta-2">Nenhuma aula hoje.</p>'}
      </section>
      ${pendentes.length ? `
      <section class="mb-6">
        <h3 class="text-xs font-medium text-aviso mb-2">Chamadas pendentes</h3>
        <ul class="painel divide-y divide-linha">${pendentes.map((a) => cartaoAula(a)).join('')}</ul>
      </section>` : ''}
      <section>
        <h3 class="text-xs font-medium text-tinta-2 mb-2">Próximos 7 dias</h3>
        ${proximas.length ? `<ul class="painel divide-y divide-linha">${proximas.map((a) => cartaoAula(a)).join('')}</ul>` : '<p class="painel px-4 py-5 text-sm text-tinta-2">Sem aulas na próxima semana.</p>'}
      </section>`;
  }

  function abaFrequencia() {
    const min = Aulor.config().academico.frequenciaMinima;
    const emCurso = turmasEscopo.filter((t) => ['em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(t)));
    const blocos = emCurso.map((t) => {
      const lista = Aulor.matriculasDaTurma(t.id).filter((m) => m.status === 'ativa').map((m) => ({ m, f: Aulor.frequencia(m) })).filter(({ f }) => f.total >= 1 && f.percentual < min + 10).sort((a, b) => a.f.percentual - b.f.percentual);
      return { t, lista };
    });
    const total = blocos.reduce((s, b) => s + b.lista.filter((x) => x.f.abaixo).length, 0);
    return `
      <p class="text-sm text-tinta-2 mb-4">${total} ${total === 1 ? 'aluno está' : 'alunos estão'} abaixo da frequência mínima de ${min}%. Também aparecem os que estão a menos de 10 pontos do mínimo.</p>
      <div class="space-y-4">${blocos.map(({ t, lista }) => `
        <section class="painel">
          <div class="px-4 py-3 border-b border-linha flex items-center justify-between gap-2">
            <a href="turma.html?id=${t.id}" class="font-medium hover:underline">${esc(t.codigo)} <span class="font-normal text-tinta-2">· ${esc(Aulor.curso(t.cursoId).nome)}</span></a>
            <span class="text-xs text-tinta-2">${Aulor.progressoTurma(t).realizadas} aulas dadas</span>
          </div>
          ${lista.length ? `<ul class="divide-y divide-linha">${lista.map(({ m, f }) => `
            <li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
              <span class="flex-1 min-w-[10rem] text-sm">${Shell.pode('matriculas') ? `<a class="hover:underline" href="matricula.html?id=${m.id}">${esc(Aulor.aluno(m.alunoId).nome)}</a>` : esc(Aulor.aluno(m.alunoId).nome)}</span>
              <span class="text-xs text-tinta-2 tabular-nums">${f.faltas} falta${f.faltas === 1 ? '' : 's'}${f.justificadas ? ` + ${f.justificadas} just.` : ''}</span>
              ${barraFrequencia(f)}
              ${f.semChance ? pilula('perigo', 'não alcança mais') : f.abaixo ? pilula('atencao', 'abaixo do mínimo') : pilula('neutro', 'perto do limite')}
            </li>`).join('')}</ul>` : '<p class="px-4 py-3 text-sm text-tinta-2">Todos com frequência confortável.</p>'}
        </section>`).join('') || vazio('Nenhuma turma em andamento')}
      </div>`;
  }

  function abaTurmas() {
    const lista = turmasEscopo.filter((t) => Aulor.situacaoTurma(t) !== 'concluida').sort((a, b) => a.inicio.localeCompare(b.inicio));
    return lista.length ? `<ul class="painel divide-y divide-linha">${lista.map((t) => {
      const s = Aulor.situacaoTurma(t);
      const pr = Aulor.progressoTurma(t);
      return `<li><a href="turma.html?id=${t.id}" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-realce">
        <span class="flex-1 min-w-[12rem]"><span class="block text-sm font-medium">${esc(Aulor.curso(t.cursoId).nome)}</span><span class="block text-xs text-tinta-2">${esc(t.codigo)} · ${esc(Agenda.descrever(t.agenda))}</span></span>
        <span class="text-xs text-tinta-2 tabular-nums">${pr.realizadas}/${pr.total} aulas · ${Aulor.ocupacao(t).ocupadas} alunos</span>
        ${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome)}
      </a></li>`;
    }).join('')}</ul>` : vazio('Nenhuma turma');
  }

  const titulo = todas ? 'Aulas e chamadas' : 'Minhas aulas';
  if (!todas) document.querySelector('header h1').textContent = titulo;
  tela.innerHTML = `
    <div class="max-w-4xl mx-auto">
      ${cabecalhoPagina({ titulo, subtitulo: todas ? 'Aulas de hoje, chamadas que ficaram para trás e a próxima semana de todas as turmas.' : `Olá, ${esc(Shell.nome().split(' ')[0])}. Suas turmas, chamadas e diário.` })}
      ${todas ? '' : abasHtml(abas, aba)}
      ${aba === 'agenda' ? abaAgenda() : aba === 'frequencia' ? abaFrequencia() : abaTurmas()}
    </div>`;
})();
