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

  function render() {
    const itens = lista();
    const verFin = Shell.pode('receber');
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Matrículas', subtitulo: 'Aluno + turma + condições de pagamento. Ao confirmar, as parcelas entram em Contas a receber.', acoes: Shell.pode('matriculas', 'criar') ? `<a href="matricula-nova.html" class="btn-pri">${ICONE.mais}Nova matrícula</a>` : '' })}
        <div class="flex flex-wrap gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por aluno, código ou turma')}
          ${selectFiltro('f-status', STATUS, filtro.status, 'Situação')}
          ${selectFiltro('f-curso', [{ id: 'todos', nome: 'Todos os cursos' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.curso, 'Curso')}
          ${selectFiltro('f-periodo', PERIODOS, filtro.periodo, 'Data da matrícula')}
        </div>
        <div class="painel overflow-hidden">
          ${itens.length ? `<div class="overflow-x-auto"><table class="tabela">
            <thead><tr><th>Matrícula</th><th>Aluno</th><th>Curso e turma</th><th class="num">Valor</th>${verFin ? '<th>Parcelas</th>' : ''}<th>Situação</th></tr></thead>
            <tbody>${itens.map((m) => {
              const a = Aulor.aluno(m.alunoId);
              const t = Aulor.turma(m.turmaId);
              const ps = Aulor.parcelasDaMatricula(m.id).filter((l) => l.status !== 'cancelado');
              const pagas = ps.filter((l) => l.status === 'pago').length;
              const vencidas = ps.filter((l) => Aulor.situacaoLancamento(l) === 'vencido').length;
              const st = Aulor.STATUS_MATRICULA[m.status];
              return `<tr data-href="matricula.html?id=${m.id}">
                <td class="whitespace-nowrap"><a href="matricula.html?id=${m.id}" class="font-medium text-tinta hover:underline tabular-nums">${m.codigo}</a><p class="text-xs text-tinta-2">${dataBr(m.data)}</p></td>
                <td><div class="flex items-center gap-3 min-w-[12rem]">${avatar(a.nome)}<span>${esc(a.nome)}</span></div></td>
                <td>${esc(Aulor.curso(t.cursoId).nome)}<p class="text-xs text-tinta-2">${esc(t.codigo)}</p></td>
                <td class="num">${moeda(m.valorFinal)}<p class="text-xs text-tinta-3">${m.parcelas}× ${m.desconto ? `· desc. ${moeda(m.desconto)}` : ''}</p></td>
                ${verFin ? `<td class="whitespace-nowrap text-sm">${ps.length ? `<span class="tabular-nums">${pagas}/${ps.length} pagas</span>${vencidas ? `<p class="text-xs text-ruim">${vencidas} vencida${vencidas > 1 ? 's' : ''}</p>` : ''}` : '<span class="text-tinta-3">—</span>'}</td>` : ''}
                <td>${status(m.status === 'concluida' && m.resultado !== 'aprovado' ? 'perigo' : st.tom, m.status === 'concluida' ? (m.resultado === 'aprovado' ? 'Concluída · aprovado' : 'Concluída · reprovado') : st.nome)}</td>
              </tr>`;
            }).join('')}</tbody></table></div>
            <p class="px-4 py-2.5 text-xs text-tinta-2 border-t border-linha">${itens.length} matrículas</p>` : vazio('Nenhuma matrícula encontrada', 'Ajuste a busca ou os filtros.')}
        </div>
      </div>`;
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    [['f-status', 'status'], ['f-curso', 'curso'], ['f-periodo', 'periodo']].forEach(([el, k]) => tela.querySelector(`#${el}`).addEventListener('change', (e) => { filtro[k] = e.target.value; render(); }));
  }

  render();
})();
