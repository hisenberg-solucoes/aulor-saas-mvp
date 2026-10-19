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

  // Colunas na ordem das Vendas do original: código (o link), aluno, curso, valor e o que pede ação.
  function linha(m, verFin) {
    const a = Aulor.aluno(m.alunoId);
    const t = Aulor.turma(m.turmaId);
    const curso = Aulor.curso(t.cursoId).nome;
    const ps = Aulor.parcelasDaMatricula(m.id).filter((l) => l.status !== 'cancelado');
    const pagas = ps.filter((l) => l.status === 'pago').length;
    const vencidas = ps.filter((l) => Aulor.situacaoLancamento(l) === 'vencido');
    return `<tr data-href="matricula.html?id=${m.id}" class="${FOCO_LINHA} ${m.status === 'cancelada' ? 'linha-apagada' : ''}">
      <td><a href="matricula.html?id=${m.id}" class="${LINK_REGISTRO} font-mono">${esc(m.codigo)}</a>
        <p class="text-xs ${APOIO} truncate">${dataBr(m.data)}${m.criadaPor ? ` · ${esc(m.criadaPor)}` : ''}</p></td>
      <td><div class="flex items-center gap-2.5">${avatar(a.nome)}<div class="min-w-0">
        <p class="text-sm font-medium ${TITULO} truncate">${esc(a.nome)}</p>
        <p class="text-xs ${APOIO} truncate"><span class="font-mono">${cpfFmt(a.cpf)}</span></p>
      </div></div></td>
      <td><p class="truncate" title="${esc(curso)}">${esc(curso)}</p><p class="text-xs ${APOIO} truncate">${esc(t.codigo)}${m.trocas?.length ? ' · trocou de turma' : ''}</p></td>
      <td class="num">${moeda(m.valorFinal)}${m.desconto ? `<p class="text-xs ${APOIO} line-through">${moeda(m.valorCurso)}</p>` : ''}</td>
      ${verFin ? `<td>${ps.length ? (vencidas.length
        ? `<p class="font-medium text-red-700 dark:text-red-400 tabular-nums">${plural(vencidas.length, 'parcela vencida', 'parcelas vencidas')} · ${moeda(vencidas.reduce((s, l) => s + l.valor, 0))}</p><p class="text-xs ${APOIO} tabular-nums">${pagas} de ${ps.length} pagas</p>`
        : `<span class="tabular-nums">${pagas} de ${ps.length} pagas</span>`) : `<span class="${APOIO}">—</span>`}</td>` : ''}
      <td>${situacao(m)}</td>
    </tr>`;
  }

  function render() {
    const itens = lista();
    const total = Aulor.matriculas().length;
    const verFin = Shell.pode('receber');
    const filtrando = filtro.q || filtro.status !== 'ativa' || filtro.curso !== 'todos' || filtro.periodo !== 'todos';
    const soma = itens.filter((m) => m.status !== 'cancelada').reduce((s, m) => s + m.valorFinal, 0);
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({ titulo: `Matrículas <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${total}</span>`, subtitulo: 'Aluno + turma + condições de pagamento. Ao confirmar, as parcelas entram em Contas a receber.', acoes: Shell.pode('matriculas', 'criar') ? `<a href="matricula-nova.html" class="btn-pri">${ICONE.mais}Nova matrícula</a>` : '' })}
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por aluno, código ou turma')}
          <div class="ml-auto flex flex-wrap items-center gap-2">
            ${selectFiltro('f-status', STATUS, filtro.status, 'Situação')}
            ${selectFiltro('f-curso', [{ id: 'todos', nome: 'Todos os cursos' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.curso, 'Curso')}
            ${selectFiltro('f-periodo', PERIODOS, filtro.periodo, 'Data da matrícula')}
            ${filtrando ? `<button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar</button>` : ''}
          </div>
        </div>
        <div class="painel overflow-hidden">
          <div class="overflow-x-auto"><table class="tabela table-fixed">
            <thead><tr><th class="w-[170px]">Matrícula</th><th class="w-[24%]">Aluno</th><th>Curso e turma</th><th class="num w-[120px]">Valor</th>${verFin ? '<th class="w-[15%]">Parcelas</th>' : ''}<th class="w-[120px]">Situação</th></tr></thead>
            <tbody>${itens.length ? itens.map((m) => linha(m, verFin)).join('') : `
              <tr><td colspan="${verFin ? 6 : 5}" class="py-10 text-center text-sm ${APOIO}">${total ? `Nenhuma matrícula corresponde à busca e aos filtros.${filtrando ? ` <button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar filtros</button>` : ''}` : 'Nenhuma matrícula ainda.'}</td></tr>`}</tbody>
          </table></div>
          <div class="${RODAPE_TABELA} flex flex-wrap items-center justify-between gap-2"><span>${plural(itens.length, 'matrícula')}${itens.length !== total ? ` de ${total}` : ''}</span><span>Soma (sem canceladas): <strong class="font-semibold">${moeda(soma)}</strong></span></div>
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
