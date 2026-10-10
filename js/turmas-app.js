// ============================================================
// Turmas: cada turma é um curso do catálogo acontecendo num período, com
// professor, dias, horário e vagas. Mesmo desenho da tela do protótipo
// original, sem os indicadores financeiros que dependem de integrações.
// Filtros na URL: ?situacao=planejada|em_andamento|a_concluir|concluida|todas.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const SITUACOES = ['planejada', 'em_andamento', 'a_concluir', 'concluida', 'cancelada'];
  const filtro = { q: '', cursoId: '', professorId: '', situacao: SITUACOES.includes(parametroUrl('situacao')) ? parametroUrl('situacao') : '' };
  const CARTOES = [
    { id: 'em_andamento', rotulo: 'Em andamento', ajuda: 'entre a primeira e a última aula', cor: 'bg-emerald-500' },
    { id: 'planejada', rotulo: 'A iniciar', ajuda: 'abertas para matrícula', cor: 'bg-sky-500' },
    { id: 'a_concluir', rotulo: 'Aguardando conclusão', ajuda: 'aulas terminaram; falta fechar', cor: 'bg-amber-500' },
    { id: 'concluida', rotulo: 'Concluídas', ajuda: 'histórico' },
  ];

  function render() {
    const todas = Aulor.turmas();
    const sit = new Map(todas.map((t) => [t.id, Aulor.situacaoTurma(t)]));
    const contagem = (id) => todas.filter((t) => sit.get(t.id) === id).length;
    const termo = normalizarTexto(filtro.q);
    const lista = todas.filter((t) => {
      if (filtro.situacao ? sit.get(t.id) !== filtro.situacao : ['concluida', 'cancelada'].includes(sit.get(t.id))) return false;
      if (filtro.cursoId && t.cursoId !== filtro.cursoId) return false;
      if (filtro.professorId && t.professorId !== filtro.professorId) return false;
      return !termo || normalizarTexto(`${t.codigo} ${Aulor.curso(t.cursoId).nome} ${Aulor.professor(t.professorId).nome}`).includes(termo);
    }).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const filtrando = !!(filtro.q || filtro.cursoId || filtro.professorId || filtro.situacao);
    const risco = Aulor.turmasEmRisco();
    const pendentes = Aulor.chamadasPendentes();

    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Turmas', subtitulo: 'Cada turma é um curso do catálogo acontecendo num período: professor, dias, horário e vagas. As aulas são geradas pela carga horária; chamada e conclusão acontecem dentro da turma.', acoes: Shell.pode('turmas', 'criar') ? `<button type="button" data-nova class="btn-pri">${ICONE.mais}Nova turma</button>` : '' })}

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          ${CARTOES.map((c) => cartaoNumero({ ...c, valor: contagem(c.id), filtro: c.id, ativo: filtro.situacao === c.id })).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por código, curso ou professor')}
          ${selectFiltro('f-curso', [{ id: '', nome: 'Todos os cursos' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.cursoId, 'Curso')}
          ${selectFiltro('f-professor', [{ id: '', nome: 'Todos os professores' }, ...Aulor.professores().map((p) => ({ id: p.id, nome: p.nome }))], filtro.professorId, 'Professor')}
          ${selectFiltro('f-situacao', [{ id: '', nome: 'Em andamento e a iniciar' }, ...SITUACOES.map((id) => ({ id, nome: Aulor.SITUACAO_TURMA[id].nome }))], filtro.situacao, 'Situação')}
          ${filtrando ? '<button type="button" data-limpar class="text-sm font-medium link">Limpar</button>' : ''}
        </div>

        ${risco.length && !filtrando && Shell.pode('turmas') ? `
        <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 painel px-3 py-2 text-sm text-slate-700 dark:text-neutral-200">
          <span class="h-2 w-2 rounded-full ${risco.some((r) => r.nivel === 'critico') ? 'bg-red-500' : 'bg-amber-500'}"></span>
          <span><strong class="tabular-nums">${risco.length}</strong> ${risco.length === 1 ? 'turma ainda não atingiu' : 'turmas ainda não atingiram'} o mínimo de alunos para abrir</span>
          <a href="turmas-risco.html" class="ml-auto text-sm font-semibold link">Ver turmas em risco</a>
        </div>` : ''}

        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Turma</th><th>Dias e horário</th><th>Professor</th><th>Período · aulas</th><th>Alunos</th><th>Situação</th></tr></thead>
              <tbody>${lista.map((t) => {
                const s = sit.get(t.id);
                const pr = Aulor.progressoTurma(t);
                const pend = pendentes.filter((a) => a.turmaId === t.id).length;
                return `<tr data-href="turma.html?id=${t.id}">
                  <td><a href="turma.html?id=${t.id}" class="font-medium text-slate-900 dark:text-neutral-100 hover:underline whitespace-nowrap">${esc(t.codigo)}</a><p class="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-[10rem]" title="${esc(Aulor.curso(t.cursoId).nome)}">${esc(Aulor.curso(t.cursoId).nome)}</p></td>
                  <td><span class="whitespace-nowrap">${esc(Agenda.descrever(t.agenda))}</span><p class="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-[11rem]" title="${esc(t.local)}">${nomeModalidade(t.agenda.formato)}${t.local ? ` · ${esc(t.local)}` : ''}</p></td>
                  <td>${esc(Aulor.professor(t.professorId).nome)}</td>
                  <td class="whitespace-nowrap tabular-nums text-sm">${dataCurta(t.inicio)} → ${dataCurta(t.fim)}<p class="text-xs text-slate-500 dark:text-neutral-400">${pr.realizadas} de ${pr.total} aulas${pend ? `<span class="ml-1 inline-flex align-text-bottom text-amber-600 dark:text-amber-400" title="${pend} ${pend === 1 ? 'chamada pendente' : 'chamadas pendentes'}">${ICONE.alerta}</span>` : ''}</p></td>
                  <td>${ocupacaoHtml(t)}</td>
                  <td>${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome, '', true)}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : vazio(todas.length ? 'Nenhuma turma corresponde aos filtros' : 'Nenhuma turma cadastrada ainda')}
          <p class="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-900 tabular-nums">${lista.length} ${lista.length === 1 ? 'turma' : 'turmas'}${filtrando ? ` de ${todas.length}` : ''}</p>
        </div>
      </div>`;
    ligar();
  }

  function definirSituacao(valor) {
    filtro.situacao = valor;
    const url = new URL(location.href);
    if (valor) url.searchParams.set('situacao', valor); else url.searchParams.delete('situacao');
    history.replaceState(null, '', url);
    render();
  }

  function ligar() {
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('#f-curso').addEventListener('change', (e) => { filtro.cursoId = e.target.value; render(); });
    tela.querySelector('#f-professor').addEventListener('change', (e) => { filtro.professorId = e.target.value; render(); });
    tela.querySelector('#f-situacao').addEventListener('change', (e) => definirSituacao(e.target.value));
    tela.querySelectorAll('[data-cartao]').forEach((b) => b.addEventListener('click', () => definirSituacao(filtro.situacao === b.dataset.cartao ? '' : b.dataset.cartao)));
    tela.querySelector('[data-limpar]')?.addEventListener('click', () => { filtro.q = ''; filtro.cursoId = ''; filtro.professorId = ''; definirSituacao(''); });
    tela.querySelector('[data-nova]')?.addEventListener('click', () => abrirFormTurma({ aoSalvar: (t) => { location.href = `turma.html?id=${t.id}&nova=1`; } }));
  }

  render();
})();
