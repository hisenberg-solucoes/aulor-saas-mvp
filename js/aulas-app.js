// ============================================================
// Portal do Professor › Minhas aulas: a agenda das turmas do professor.
// O admin não tem esta tela, como no original: a coordenação vê e corrige
// a chamada pela aba Aulas da turma (permissão "frequencia").
// As turmas e a frequência do professor ficam em meu-dia.html e minhas-turmas.html.
// Pensada para o celular: cartões em lista e botões de 44px abaixo de 640px.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  if (!Shell.ehSoProfessor()) { location.replace('turmas.html'); return; } // endereço antigo de "Aulas e chamadas"
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const meus = new Set(Shell.professorIds());
  const turmasEscopo = Aulor.turmas().filter((t) => t.status !== 'cancelada' && meus.has(t.professorId));
  const idsEscopo = new Set(turmasEscopo.map((t) => t.id));
  const noEscopo = (a) => idsEscopo.has(a.turmaId);
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
          <p class="text-xs ${APOIO}"><span class="font-mono">${esc(t.codigo)}</span> · aula ${a.n} de ${Aulor.progressoTurma(t).total}${t.local ? ` · ${esc(t.local)}` : ''}</p>
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

  tela.innerHTML = `
    <div>
      ${cabecalhoPagina({
        titulo: 'Minhas aulas',
        subtitulo: 'Aulas de hoje, chamadas que ficaram para trás e a próxima semana das suas turmas.',
      })}
      ${abaAgenda()}
    </div>`;
})();
