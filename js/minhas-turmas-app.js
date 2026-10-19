// ============================================================
// Portal do Professor › Minhas turmas (turmas.html do portal original):
// só as turmas do professor logado, com busca e filtro por situação.
// Sem formações no MVP, então a lista não agrupa. A turma abre a mesma
// ficha do sistema, limitada ao que o professor pode ver e fazer.
// Filtro na URL: ?situacao=em_andamento|planejada|concluida.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const meus = new Set(Shell.professorIds());
  const turmas = Aulor.turmas().filter((t) => meus.has(t.professorId) && t.status !== 'cancelada');
  // "Em andamento" junta a turma que já deu a última aula e espera a conclusão.
  const grupo = (t) => ({ a_concluir: 'em_andamento' }[Aulor.situacaoTurma(t)] ?? Aulor.situacaoTurma(t));
  const SITUACOES = [
    { id: '', nome: 'Todas as situações' },
    { id: 'em_andamento', nome: 'Em andamento' },
    { id: 'planejada', nome: 'A iniciar' },
    { id: 'concluida', nome: 'Concluídas' },
  ];
  const ORDEM = { em_andamento: 0, planejada: 1, concluida: 2 };
  const filtro = { q: '', situacao: SITUACOES.some((s) => s.id && s.id === parametroUrl('situacao')) ? parametroUrl('situacao') : '' };

  function render() {
    const termo = normalizarTexto(filtro.q);
    const lista = turmas
      .filter((t) => (!filtro.situacao || grupo(t) === filtro.situacao) && (!termo || normalizarTexto(`${t.codigo} ${Aulor.curso(t.cursoId).nome} ${t.local ?? ''}`).includes(termo)))
      .sort((a, b) => ORDEM[grupo(a)] - ORDEM[grupo(b)] || (grupo(a) === 'concluida' ? b.fim.localeCompare(a.fim) : a.inicio.localeCompare(b.inicio)));
    const filtrando = !!(filtro.q || filtro.situacao);
    const resumo = SITUACOES.slice(1).map((s) => [turmas.filter((t) => grupo(t) === s.id).length, s.nome.toLowerCase()]).filter(([n]) => n).map(([n, nome]) => `${n} ${n === 1 ? nome.replace(/s$/, '') : nome}`).join(' · ');
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({
          titulo: 'Minhas turmas',
          subtitulo: turmas.length ? `As turmas em que você dá aula: ${resumo}. Abra uma para ver alunos, frequência e aulas.` : 'As turmas em que você dá aula aparecem aqui.',
        })}
        ${turmas.length ? `
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por código, curso ou local')}
          <div class="ml-auto flex flex-wrap items-center gap-2">
            ${selectFiltro('f-situacao', SITUACOES, filtro.situacao, 'Situação')}
            ${filtrando ? `<button type="button" data-limpar class="${BOTAO_LINK}">Limpar</button>` : ''}
          </div>
        </div>` : ''}
        <div class="painel overflow-hidden">
          ${lista.length ? tabelaTurmasProfessor(lista)
            : turmas.length ? vazio('Nenhuma turma com esses filtros', '', '<button type="button" data-limpar class="btn-sec">Limpar filtros</button>')
              : vazio('Você ainda não tem turmas', 'Quando a coordenação colocar você como professor de uma turma, ela aparece aqui com a agenda e os alunos.')}
          ${turmas.length ? `<p class="${RODAPE_TABELA}">${filtrando ? `${lista.length} de ${plural(turmas.length, 'turma')}` : plural(lista.length, 'turma')}</p>` : ''}
        </div>
      </div>`;
    ligar();
  }

  function ligar() {
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca?.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('#f-situacao')?.addEventListener('change', (e) => definirSituacao(e.target.value));
    tela.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => { filtro.q = ''; definirSituacao(''); }));
  }

  function definirSituacao(valor) {
    filtro.situacao = valor;
    const url = new URL(location.href);
    if (valor) url.searchParams.set('situacao', valor); else url.searchParams.delete('situacao');
    history.replaceState(null, '', url);
    render();
  }

  render();
})();
