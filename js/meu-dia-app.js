// ============================================================
// Portal do Professor › Início (home.html do portal original): a aula de
// hoje com o atalho da chamada, o que ficou pendente, quem está abaixo da
// frequência mínima, as turmas e as aulas da semana. Tudo é leitura das
// turmas do professor logado; ele só escreve na chamada (chamada.html) e
// nas notas finais (aba Alunos da turma).
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const min = Aulor.config().academico.frequenciaMinima;
  const meus = new Set(Shell.professorIds());
  const turmas = Aulor.turmas().filter((t) => meus.has(t.professorId) && t.status !== 'cancelada');
  const ids = new Set(turmas.map((t) => t.id));
  const minha = (a) => ids.has(a.turmaId);
  const sit = new Map(turmas.map((t) => [t.id, Aulor.situacaoTurma(t)]));
  const emCurso = turmas.filter((t) => ['em_andamento', 'a_concluir'].includes(sit.get(t.id)));
  const deHoje = Aulor.aulasDoDia(hoje).filter(minha);
  const LISTA = 'mt-3 border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900';
  const nada = (texto) => `<p class="px-4 pt-2 pb-4 text-sm ${APOIO}">${texto}</p>`;
  const mais = (n, href, rotulo) => (n > 0 ? `<p class="px-4 py-2.5 border-t border-slate-100 dark:border-neutral-900"><a href="${href}" class="${BOTAO_LINK}">${rotulo(n)}</a></p>` : '');
  const nomesCurtos = (nomes, max = 6) => nomes.slice(0, max).join(', ') + (nomes.length > max ? ` e mais ${nomes.length - max}` : '');

  // Dia da aula num bloco (como as "Próximas aulas" do portal original).
  const diaAula = (iso) => `
    <span class="w-11 shrink-0 rounded-lg border border-slate-200 dark:border-neutral-800 py-1 text-center" aria-hidden="true">
      <span class="block text-base font-semibold leading-5 tabular-nums ${iso === hoje ? 'text-petrol-800 dark:text-sky-300' : TITULO}">${dataObj(iso).getDate()}</span>
      <span class="block text-[11px] leading-4 ${APOIO}">${diaSemana(iso)}</span>
    </span>`;

  // A aula em foco: a primeira de hoje ainda sem chamada; depois, a última de hoje; sem aula hoje, a próxima.
  function cartaoAula() {
    const a = deHoje.find((x) => x.status === 'prevista') ?? deHoje[deHoje.length - 1] ?? Aulor.proximasAulas(hoje, Infinity).find(minha);
    if (!a) return cartao({ titulo: 'Aula de hoje', corpo: nada('Nenhuma aula agendada nas suas turmas.') });
    const t = Aulor.turma(a.turmaId);
    const c = Aulor.curso(t.cursoId);
    const ehHoje = a.data === hoje;
    const feita = a.status === 'realizada';
    const alunos = feita ? Object.keys(a.presencas).map((id) => Aulor.matricula(id)) : Aulor.participantes(a);
    const presentes = feita ? Object.values(a.presencas).filter((v) => v === 'P').length : 0;
    const outras = deHoje.length - 1;
    const acao = feita ? `<a href="chamada.html?aula=${a.id}" class="btn-sec">Ver a chamada</a>`
      : ehHoje && Shell.podeChamada(t) ? `<a href="chamada.html?aula=${a.id}" class="btn-pri">Fazer a chamada</a>`
        : `<a href="chamada.html?aula=${a.id}" class="btn-sec">Ver a lista de alunos</a>`;
    return cartao({
      titulo: ehHoje ? 'Aula de hoje' : 'Próxima aula',
      contexto: ehHoje ? (feita ? `Chamada feita: ${presentes} de ${plural(alunos.length, 'aluno')} presentes` : 'Chamada ainda não feita') : `${dataLonga(a.data)}, ${quando(a.data)}. A chamada abre no dia.`,
      classe: 'flex flex-col',
      corpo: `
        <div class="px-4 pt-3 pb-4 flex flex-1 flex-col">
          <a href="turma.html?id=${t.id}" class="text-base font-semibold leading-6 ${TITULO} hover:underline underline-offset-2">${esc(c.nome)}</a>
          <p class="mt-0.5 text-sm ${APOIO} tabular-nums"><span class="font-mono">${esc(t.codigo)}</span> · ${a.inicio}–${a.fim} · aula ${a.n} de ${Aulor.progressoTurma(t).total}</p>
          ${t.local ? `<p class="mt-0.5 text-sm ${APOIO} truncate" title="${esc(t.local)}">${esc(t.local)}</p>` : ''}
          <p class="mt-3 text-sm text-slate-700 dark:text-neutral-200">${plural(alunos.length, 'aluno')}${alunos.length ? `: <span class="${APOIO}">${esc(nomesCurtos(alunos.map((m) => Aulor.aluno(m.alunoId).nome.split(' ')[0])))}</span>` : ''}</p>
          <div class="mt-auto pt-4 flex flex-wrap items-center gap-2">
            ${acao}<a href="turma.html?id=${t.id}" class="btn-sec">Ver a turma</a>
            ${outras > 0 ? `<a href="aulas.html" class="${BOTAO_LINK} ml-auto">Mais ${plural(outras, 'aula')} hoje</a>` : ''}
          </div>
        </div>`,
    });
  }

  // O que o sistema deduz das turmas, sem ninguém alimentar (cartão de pendências do original), uma linha por turma.
  function cartaoPendencias() {
    const itens = [];
    turmas.filter((t) => sit.get(t.id) === 'a_concluir' && Aulor.temNota(Aulor.curso(t.cursoId)) && Shell.podeChamada(t))
      .forEach((t) => {
        const faltam = Aulor.matriculasDaTurma(t.id).filter((m) => m.status === 'ativa' && m.notaFinal == null).length;
        if (faltam) itens.push({ tom: 'atencao', texto: `Lançar ${faltam === 1 ? 'a nota final de 1 aluno' : `as notas finais de ${faltam} alunos`}`, t, href: `turma.html?id=${t.id}&aba=alunos` });
      });
    emCurso.forEach((t) => {
      const pend = Aulor.aulasDaTurma(t.id).filter((a) => Aulor.chamadaPendente(a));
      if (pend.length) itens.push({ tom: 'atencao', texto: pend.length === 1 ? `Chamada de ${dataCurta(pend[0].data)} pendente` : `${pend.length} chamadas pendentes`, t, href: pend.length === 1 ? `chamada.html?aula=${pend[0].id}` : `turma.html?id=${t.id}&aba=aulas` });
      const semDiario = Aulor.aulasDaTurma(t.id).filter((a) => a.status === 'realizada' && !String(a.conteudo ?? '').trim());
      if (semDiario.length) itens.push({ tom: 'neutro', texto: semDiario.length === 1 ? `Diário de ${dataCurta(semDiario[0].data)} em branco` : `${semDiario.length} diários em branco`, t, href: semDiario.length === 1 ? `chamada.html?aula=${semDiario[0].id}` : `turma.html?id=${t.id}&aba=aulas` });
    });
    const VISIVEIS = 5;
    return cartao({
      titulo: `Pendências${itens.length ? ` <span class="ml-1 text-xs font-semibold ${AVISO} tabular-nums">${itens.length}</span>` : ''}`,
      contexto: itens.length ? 'Chamadas, diários e notas que faltam nas suas turmas.' : '',
      corpo: itens.length ? `<ul class="${LISTA}">${itens.slice(0, VISIVEIS).map((x) => `
          <li><a href="${x.href}" class="group flex items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)]">
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ${TOM[x.tom].ponto}" aria-hidden="true"></span>
            <span class="min-w-0 text-sm"><span class="${TITULO} group-hover:underline underline-offset-2">${esc(x.texto)}</span><span class="block text-xs ${APOIO} truncate"><span class="font-mono">${esc(x.t.codigo)}</span> · ${esc(Aulor.curso(x.t.cursoId).nome)}</span></span>
          </a></li>`).join('')}</ul>${mais(itens.length - VISIVEIS, 'minhas-turmas.html', (n) => `E mais ${n} nas suas turmas`)}`
        : nada('Nada pendente: chamadas, diários e notas em dia.'),
    });
  }

  function cartaoFrequencia() {
    // Só turma com aula pela frente: na que espera a conclusão, a conversa já não muda o resultado.
    const abaixo = emCurso.filter((t) => sit.get(t.id) === 'em_andamento').flatMap((t) => Aulor.matriculasDaTurma(t.id).filter((m) => m.status === 'ativa').map((m) => ({ m, t, f: Aulor.frequencia(m) })))
      .filter((x) => x.f.abaixo).sort((a, b) => a.f.percentual - b.f.percentual);
    const VISIVEIS = 4;
    return cartao({
      titulo: `Abaixo da frequência mínima${abaixo.length ? ` <span class="ml-1 text-xs font-semibold text-red-700 dark:text-red-400 tabular-nums">${abaixo.length}</span>` : ''}`,
      contexto: `O certificado pede ${min}% de presença. Converse com o aluno antes de a turma acabar.`,
      corpo: abaixo.length ? `<ul class="${LISTA}">${abaixo.slice(0, VISIVEIS).map(({ m, t, f }) => `
          <li class="flex items-center gap-3 px-4 py-2.5">
            <span class="min-w-0 flex-1">
              <a href="turma.html?id=${t.id}&aba=alunos" class="block truncate text-sm font-medium ${TITULO} hover:underline underline-offset-2">${esc(Aulor.aluno(m.alunoId).nome)}</a>
              <span class="block text-xs ${APOIO} tabular-nums truncate"><span class="font-mono">${esc(t.codigo)}</span> · ${plural(f.faltas, 'falta')} em ${plural(f.total, 'aula')}${f.semChance ? ' · não alcança mais' : ''}</span>
            </span>
            ${barraFrequencia(f, { compacta: true })}
          </li>`).join('')}</ul>${mais(abaixo.length - VISIVEIS, 'minhas-turmas.html', (n) => `E mais ${plural(n, 'aluno')}`)}`
        : nada(turmas.some((t) => sit.get(t.id) === 'em_andamento') ? `Todos os alunos das suas turmas em andamento estão com ${min}% ou mais.` : 'Nenhuma turma em andamento.'),
    });
  }

  function secaoTurmas() {
    const conta = (s) => turmas.filter((t) => sit.get(t.id) === s).length;
    const ordem = { em_andamento: 0, a_concluir: 0, planejada: 1 };
    const lista = turmas.filter((t) => sit.get(t.id) in ordem).sort((a, b) => ordem[sit.get(a.id)] - ordem[sit.get(b.id)] || a.inicio.localeCompare(b.inicio));
    const resumo = [[conta('em_andamento') + conta('a_concluir'), 'em andamento', 'em andamento'], [conta('planejada'), 'a iniciar', 'a iniciar'], [conta('concluida'), 'concluída', 'concluídas']]
      .filter(([n]) => n).map(([n, um, varios]) => `${n} ${n === 1 ? um : varios}`).join(' · ');
    return `
      <div class="mt-6 mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 class="text-[15px] font-semibold ${TITULO}">Minhas turmas</h3>
        <p class="text-sm ${APOIO_FUNDO} tabular-nums">${resumo ? `${resumo} · ` : ''}<a href="minhas-turmas.html" class="link">Ver todas</a></p>
      </div>
      <div class="painel overflow-hidden">${lista.length ? tabelaTurmasProfessor(lista) : vazio('Nenhuma turma em andamento ou a iniciar', turmas.length ? 'As turmas concluídas continuam em Minhas turmas.' : 'Quando a coordenação colocar você como professor de uma turma, ela aparece aqui.')}</div>`;
  }

  function cartaoProximas() {
    const proximas = Aulor.proximasAulas(hoje, Infinity).filter(minha).slice(0, 5);
    return cartao({
      titulo: 'Próximas aulas',
      contexto: 'Depois de hoje, em ordem.',
      acao: '<a href="aulas.html" class="btn-fantasma">Agenda</a>',
      corpo: proximas.length ? `<ul class="${LISTA}">${proximas.map((a) => {
        const t = Aulor.turma(a.turmaId);
        return `<li class="flex items-center gap-3 px-4 py-2.5">
          ${diaAula(a.data)}
          <span class="min-w-0 flex-1">
            <a href="turma.html?id=${t.id}" class="block truncate text-sm font-medium ${TITULO} hover:underline underline-offset-2">${esc(Aulor.curso(t.cursoId).nome)}</a>
            <span class="block text-xs ${APOIO} tabular-nums truncate"><span class="font-mono">${esc(t.codigo)}</span> · ${a.inicio}–${a.fim}${t.local ? ` · ${esc(t.local)}` : ''}</span>
          </span>
          <span class="shrink-0 text-xs ${APOIO} tabular-nums">${plural(Aulor.participantes(a).length, 'aluno')}</span>
        </li>`;
      }).join('')}</ul>` : nada('Nenhuma aula agendada depois de hoje.'),
    });
  }

  // Para corrigir uma presença ou completar o diário sem procurar a aula na turma.
  function cartaoUltimas() {
    const feitas = turmas.flatMap((t) => Aulor.aulasDaTurma(t.id)).filter((a) => a.status === 'realizada')
      .sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio)).slice(0, 5);
    return cartao({
      titulo: 'Últimas chamadas',
      contexto: 'Abra para corrigir uma presença ou completar o diário.',
      corpo: feitas.length ? `<ul class="${LISTA}">${feitas.map((a) => {
        const t = Aulor.turma(a.turmaId);
        const n = Object.keys(a.presencas).length;
        const presentes = Object.values(a.presencas).filter((v) => v === 'P').length;
        const diario = String(a.conteudo ?? '').trim();
        return `<li><a href="chamada.html?aula=${a.id}" class="group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)]">
          ${diaAula(a.data)}
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium ${TITULO} group-hover:underline underline-offset-2">${esc(Aulor.curso(t.cursoId).nome)}</span>
            <span class="block text-xs truncate ${APOIO}" ${diario ? `title="${esc(diario)}"` : ''}><span class="font-mono">${esc(t.codigo)}</span> · aula ${a.n} · ${diario ? esc(diario) : `<span class="${AVISO}">diário em branco</span>`}</span>
          </span>
          <span class="shrink-0 text-xs ${APOIO} tabular-nums">${presentes}/${n} presentes</span>
        </a></li>`;
      }).join('')}</ul>` : nada('Nenhuma chamada registrada ainda.'),
    });
  }

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  tela.innerHTML = `
    <div>
      ${cabecalhoPagina({
        titulo: `${saudacao}, ${esc(Shell.nome().split(' ')[0])}`,
        subtitulo: `${dataLonga(hoje)} · ${deHoje.length ? `${plural(deHoje.length, 'aula')} hoje` : 'sem aula hoje'}`,
      })}
      <div class="grid gap-4 lg:grid-cols-3">
        ${cartaoAula()}
        ${cartaoPendencias()}
        ${cartaoFrequencia()}
      </div>
      ${secaoTurmas()}
      <div class="mt-6 grid gap-4 xl:grid-cols-2">
        ${cartaoProximas()}
        ${cartaoUltimas()}
      </div>
    </div>`;
  ligarLinhasLink(tela);
})();
