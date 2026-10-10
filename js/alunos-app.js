// ============================================================
// Alunos: lista com busca e filtros + cadastro rápido.
// Filtros na URL (?situacao=&curso=&q=) para os atalhos da Visão geral.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: parametroUrl('q') ?? '', situacao: parametroUrl('situacao') ?? 'todos', curso: parametroUrl('curso') ?? 'todos' };

  const SITUACOES = [
    { id: 'todos', nome: 'Todas as situações' },
    { id: 'ativo', nome: 'Com curso em andamento' },
    { id: 'concluiu', nome: 'Concluíram curso' },
    { id: 'sem_matricula', nome: 'Sem matrícula' },
    { id: 'vencido', nome: 'Com parcela vencida' },
  ];

  function linhas() {
    const termo = normalizarTexto(filtro.q);
    const digitosTermo = filtro.q.replace(/\D/g, '');
    return Aulor.alunos()
      .map((a) => ({ a, s: Aulor.situacaoAluno(a), ms: Aulor.matriculasDoAluno(a.id), deve: Aulor.estaInadimplente(a.id) }))
      .filter(({ a, s, ms, deve }) => {
        if (termo && !normalizarTexto(`${a.nome} ${a.email}`).includes(termo) && !(digitosTermo.length >= 3 && (a.cpf.includes(digitosTermo) || a.telefone.includes(digitosTermo)))) return false;
        if (filtro.situacao === 'vencido' && !deve) return false;
        if (!['todos', 'vencido'].includes(filtro.situacao) && s.id !== filtro.situacao) return false;
        if (filtro.curso !== 'todos' && !ms.some((m) => m.status !== 'cancelada' && Aulor.turma(m.turmaId).cursoId === filtro.curso)) return false;
        return true;
      })
      .sort((x, y) => x.a.nome.localeCompare(y.a.nome, 'pt-BR'));
  }

  function cursosDoAluno(ms) {
    const ativas = ms.filter((m) => m.status === 'ativa');
    const lista = (ativas.length ? ativas : ms.filter((m) => m.status === 'concluida')).map((m) => Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome);
    return lista.length ? esc(lista.join(', ')) : '<span class="text-slate-400">—</span>';
  }

  function render() {
    const lista = linhas();
    const total = Aulor.alunos().length;
    const ativos = Aulor.alunosAtivos().length;
    const verFin = Shell.pode('receber');
    const acoes = [
      Shell.pode('matriculas', 'criar') ? '<a href="matricula-nova.html" class="btn-sec">Nova matrícula</a>' : '',
      Shell.pode('alunos', 'criar') ? `<button type="button" data-novo class="btn-pri">${ICONE.mais}Cadastrar aluno</button>` : '',
    ].join('');
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Alunos', subtitulo: `${total} cadastrados · ${ativos} com curso em andamento`, acoes })}
        <div class="flex flex-wrap gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por nome, CPF, e-mail ou celular')}
          ${selectFiltro('f-situacao', SITUACOES.filter((s) => s.id !== 'vencido' || verFin), filtro.situacao, 'Situação')}
          ${selectFiltro('f-curso', [{ id: 'todos', nome: 'Todos os cursos' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.curso, 'Curso')}
        </div>
        <div class="painel overflow-hidden">
          ${lista.length ? `
          <div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Aluno</th><th>Celular</th><th>Curso</th><th>Situação</th>${verFin ? '<th>Financeiro</th>' : ''}</tr></thead>
              <tbody>${lista.map(({ a, s, ms, deve }) => `
                <tr data-href="aluno.html?id=${a.id}">
                  <td><div class="flex items-center gap-3 min-w-[14rem] max-w-[18rem]">${avatar(a.nome)}<div class="min-w-0"><a href="aluno.html?id=${a.id}" class="font-medium text-slate-900 dark:text-neutral-100 hover:underline">${esc(a.nome)}</a><p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(a.email || 'sem e-mail')}${a.responsavel ? ' · com responsável' : ''}</p></div></div></td>
                  <td class="whitespace-nowrap tabular-nums">${telefoneFmt(a.telefone)}</td>
                  <td class="max-w-[11rem] truncate" title="${esc(ms.filter((m) => m.status !== 'cancelada').map((m) => Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome).join(', '))}">${cursosDoAluno(ms)}</td>
                  <td>${status(s.tom, s.nome)}</td>
                  ${verFin ? `<td>${deve ? status('perigo', 'Parcela vencida') : (ms.length ? status('ok', 'Em dia') : '<span class="text-slate-400">—</span>')}</td>` : ''}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <p class="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-900">${lista.length} de ${total} alunos</p>` : vazio('Nenhum aluno encontrado', 'Ajuste a busca ou os filtros.')}
        </div>
      </div>`;
    ligar();
  }

  function atualizarUrl() {
    const url = new URL(location.href);
    Object.entries(filtro).forEach(([k, v]) => (v && v !== 'todos' ? url.searchParams.set(k, v) : url.searchParams.delete(k)));
    url.searchParams.delete('novo');
    history.replaceState(null, '', url);
  }

  function ligar() {
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => {
      filtro.q = busca.value;
      atualizarUrl();
      const pos = busca.selectionStart;
      render();
      const novo = tela.querySelector('#busca');
      novo.focus();
      novo.setSelectionRange(pos, pos);
    });
    tela.querySelector('#f-situacao').addEventListener('change', (e) => { filtro.situacao = e.target.value; atualizarUrl(); render(); });
    tela.querySelector('#f-curso').addEventListener('change', (e) => { filtro.curso = e.target.value; atualizarUrl(); render(); });
    tela.querySelector('[data-novo]')?.addEventListener('click', novo);
  }

  function novo() {
    abrirFormAluno({ aoSalvar: (a) => { location.href = `aluno.html?id=${a.id}&novo=1`; } });
  }

  render();
  if (parametroUrl('novo') && Shell.pode('alunos', 'criar')) novo();
})();
