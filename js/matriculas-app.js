// ============================================================
// Matrículas: lista com busca e filtros. Cada matrícula liga aluno,
// turma e as parcelas geradas em Contas a receber.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: parametroUrl('q') ?? '', status: parametroUrl('status') ?? 'ativa', curso: parametroUrl('curso') ?? 'todos', periodo: parametroUrl('periodo') ?? 'todos' };
  const STATUS = [{ id: 'ativa', nome: 'Cursando' }, { id: 'concluida', nome: 'Concluídas' }, { id: 'cancelada', nome: 'Canceladas' }, { id: 'todos', nome: 'Todas' }];
  const PERIODOS = [{ id: 'todos', nome: 'Qualquer data' }, { id: '30', nome: 'Últimos 30 dias' }, { id: 'mes', nome: 'Este mês' }];

  function lista() {
    const termo = normalizarTexto(filtro.q);
    const hoje = Aulor.hoje();
    return Aulor.matriculas().filter((m) => {
      const a = Aulor.aluno(m.alunoId);
      const t = Aulor.turma(m.turmaId);
      if (filtro.status !== 'todos' && m.status !== filtro.status) return false;
      if (filtro.curso !== 'todos' && t.cursoId !== filtro.curso) return false;
      if (filtro.periodo === '30' && Aulor.diasEntre(m.data, hoje) > 30) return false;
      if (filtro.periodo === 'mes' && !m.data.startsWith(hoje.slice(0, 7))) return false;
      if (termo && !normalizarTexto(`${a.nome} ${m.codigo} ${t.codigo}`).includes(termo)) return false;
      return true;
    }).sort((a, b) => b.data.localeCompare(a.data) || b.codigo.localeCompare(a.codigo));
  }

  // Concluída diz o resultado; as outras fases, o nome da situação.
  function situacao(m) {
    const r = m.status === 'concluida' ? Aulor.RESULTADO[m.resultado] : null;
    const st = Aulor.STATUS_MATRICULA[m.status];
    return r ? status(r.tom, r.nome) : status(st.tom, st.nome);
  }

  function linha(m, verFin) {
    const a = Aulor.aluno(m.alunoId);
    const t = Aulor.turma(m.turmaId);
    const ps = Aulor.parcelasDaMatricula(m.id).filter((l) => l.status !== 'cancelado');
    const pagas = ps.filter((l) => l.status === 'pago').length;
    const vencidas = ps.filter((l) => Aulor.situacaoLancamento(l) === 'vencido').length;
    return `<tr data-href="matricula.html?id=${m.id}" class="${FOCO_LINHA} ${m.status === 'cancelada' ? 'linha-apagada' : ''}">
      <td><div class="flex items-center gap-3 min-w-[14rem]">${avatar(a.nome, 'h-9 w-9 text-xs')}<div class="min-w-0">
        <a href="matricula.html?id=${m.id}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(a.nome)}</a>
        <p class="text-xs ${APOIO} tabular-nums">Matrícula ${esc(m.codigo)} · ${dataBr(m.data)}</p>
      </div></div></td>
      <td class="max-w-[16rem]"><span class="block truncate" title="${esc(Aulor.curso(t.cursoId).nome)}">${esc(Aulor.curso(t.cursoId).nome)}</span><p class="text-xs ${APOIO}">${esc(t.codigo)}${m.trocas?.length ? ' · trocou de turma' : ''}</p></td>
      <td class="num">${moeda(m.valorFinal)}<p class="text-xs ${APOIO}">${m.parcelas}×${m.desconto ? ` · desc. ${moeda(m.desconto)}` : ''}</p></td>
      ${verFin ? `<td class="whitespace-nowrap">${ps.length ? `<span class="tabular-nums">${pagas} de ${ps.length} pagas</span>${vencidas ? `<p class="text-xs text-red-700 dark:text-red-400">${vencidas} ${vencidas > 1 ? 'vencidas' : 'vencida'}</p>` : ''}` : `<span class="${APOIO}">—</span>`}</td>` : ''}
      <td>${situacao(m)}</td>
    </tr>`;
  }

  function render() {
    const itens = lista();
    const total = Aulor.matriculas().length;
    const verFin = Shell.pode('receber');
    const filtrando = filtro.q || filtro.status !== 'ativa' || filtro.curso !== 'todos' || filtro.periodo !== 'todos';
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: `Matrículas <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${total}</span>`, subtitulo: 'Aluno + turma + condições de pagamento. Ao confirmar, as parcelas entram em Contas a receber.', acoes: Shell.pode('matriculas', 'criar') ? `<a href="matricula-nova.html" class="btn-pri">${ICONE.mais}Nova matrícula</a>` : '' })}
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por aluno, código ou turma')}
          <div class="ml-auto flex flex-wrap items-center gap-2">
            ${selectFiltro('f-status', STATUS, filtro.status, 'Situação')}
            ${selectFiltro('f-curso', [{ id: 'todos', nome: 'Todos os cursos' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.curso, 'Curso')}
            ${selectFiltro('f-periodo', PERIODOS, filtro.periodo, 'Data da matrícula')}
            ${filtrando ? '<button type="button" data-limpar class="btn-fantasma">Limpar</button>' : ''}
          </div>
        </div>
        <div class="painel overflow-hidden">
          ${itens.length ? `<div class="overflow-x-auto"><table class="tabela">
            <thead><tr><th>Aluno</th><th>Curso e turma</th><th class="text-right">Valor</th>${verFin ? '<th>Parcelas</th>' : ''}<th>Situação</th></tr></thead>
            <tbody>${itens.map((m) => linha(m, verFin)).join('')}</tbody></table></div>
            <p class="px-4 py-2.5 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">${itens.length} de ${total} matrículas</p>` : vazio('Nenhuma matrícula encontrada', 'Nenhuma matrícula corresponde à busca e aos filtros.', filtrando ? '<button type="button" data-limpar class="btn-sec">Limpar filtros</button>' : '')}
        </div>
      </div>`;
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    [['f-status', 'status'], ['f-curso', 'curso'], ['f-periodo', 'periodo']].forEach(([el, k]) => tela.querySelector(`#${el}`).addEventListener('change', (e) => { filtro[k] = e.target.value; render(); tela.querySelector(`#${el}`).focus(); }));
    tela.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => { Object.assign(filtro, { q: '', status: 'ativa', curso: 'todos', periodo: 'todos' }); render(); tela.querySelector('#busca').focus(); }));
  }

  render();
})();
