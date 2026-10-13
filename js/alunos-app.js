// ============================================================
// Alunos: lista com busca e filtros + cadastro rápido.
// Filtros na URL (?situacao=&curso=&q=) para os atalhos da Visão geral.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: parametroUrl('q') ?? '', situacao: parametroUrl('situacao') ?? 'todos', curso: parametroUrl('curso') ?? 'todos', ordem: parametroUrl('ordem') ?? '' };
  // shortcut: "mostrar mais" em memória; com milhares de alunos, paginar no servidor.
  const POR_PAGINA = 30;
  let limite = POR_PAGINA;

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
    const dividas = new Map(Aulor.inadimplentes().map((i) => [i.aluno.id, i]));
    return Aulor.alunos()
      .map((a) => ({ a, s: Aulor.situacaoAluno(a), ms: Aulor.matriculasDoAluno(a.id), deve: dividas.get(a.id) }))
      .filter(({ a, s, ms, deve }) => {
        if (termo && !normalizarTexto(`${a.nome} ${a.email}`).includes(termo) && !(digitosTermo.length >= 3 && (a.cpf.includes(digitosTermo) || a.telefone.includes(digitosTermo)))) return false;
        if (filtro.situacao === 'vencido' && !deve) return false;
        if (!['todos', 'vencido'].includes(filtro.situacao) && s.id !== filtro.situacao) return false;
        if (filtro.curso !== 'todos' && !ms.some((m) => m.status !== 'cancelada' && Aulor.turma(m.turmaId).cursoId === filtro.curso)) return false;
        return true;
      })
      .sort((x, y) => (filtro.ordem === 'vencido' ? (y.deve?.total ?? 0) - (x.deve?.total ?? 0) : 0) || x.a.nome.localeCompare(y.a.nome, 'pt-BR'));
  }

  function cursosDoAluno(ms) {
    const ativas = ms.filter((m) => m.status === 'ativa');
    const lista = (ativas.length ? ativas : ms.filter((m) => m.status === 'concluida')).map((m) => Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome);
    return lista.length ? esc(lista.join(', ')) : '<span class="text-slate-400">—</span>';
  }

  // Cabeçalho que ordena a lista: Aluno (A–Z) ou Financeiro (maior valor vencido primeiro).
  function thOrdem(rotulo, ordem) {
    const ativo = filtro.ordem === ordem;
    return `<th ${ativo ? `aria-sort="${ordem ? 'descending' : 'ascending'}"` : ''}><button type="button" data-ordem="${ordem}" class="inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-900 dark:hover:text-neutral-100 [&_svg]:h-3 [&_svg]:w-3 ${ativo ? 'text-slate-900 dark:text-neutral-100' : ''}" title="${ordem ? 'Maior valor vencido primeiro' : 'Ordem alfabética'}">${rotulo}${ativo ? (ordem ? ICONE.baixo : ICONE.cima) : ''}</button></th>`;
  }

  function financeiro(deve, ms) {
    if (deve) return status('perigo', `${moeda(deve.total)} · há ${deve.maiorAtraso} ${deve.maiorAtraso === 1 ? 'dia' : 'dias'}`, `${deve.parcelas.length} ${deve.parcelas.length === 1 ? 'parcela vencida' : 'parcelas vencidas'}; a mais antiga há ${deve.maiorAtraso} dias`);
    return ms.length ? status('ok', 'Em dia') : '<span class="text-slate-400">—</span>';
  }

  function render() {
    const lista = linhas();
    const visiveis = lista.slice(0, limite);
    const restantes = lista.length - visiveis.length;
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
            <table class="tabela max-sm:block">
              <thead class="max-sm:hidden"><tr>${thOrdem('Aluno', '')}<th>Celular</th><th>Curso</th><th>Situação</th>${verFin ? thOrdem('Financeiro', 'vencido') : ''}</tr></thead>
              <tbody class="max-sm:block">${visiveis.map(({ a, s, ms, deve }) => `
                <tr data-href="aluno.html?id=${a.id}" class="max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-4 max-sm:gap-y-1 max-sm:pl-15 max-sm:pr-4 max-sm:py-3 max-sm:border-b max-sm:border-slate-100 dark:max-sm:border-neutral-900 max-sm:last:border-b-0 max-sm:[&>td]:p-0 max-sm:[&>td]:border-0">
                  <td class="max-sm:w-full max-sm:-ml-11"><div class="flex items-center gap-3 sm:min-w-[14rem] sm:max-w-[18rem]">${avatar(a.nome)}<div class="min-w-0"><a href="aluno.html?id=${a.id}" class="font-medium text-slate-900 dark:text-neutral-100 hover:underline">${esc(a.nome)}</a><p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(a.email || 'sem e-mail')}${Aulor.ehMenor(a) ? ' · menor de idade' : ''}</p></div></div></td>
                  <td class="whitespace-nowrap tabular-nums">${telefoneFmt(a.telefone)}</td>
                  <td class="max-w-[11rem] truncate max-sm:max-w-full" title="${esc(ms.filter((m) => m.status !== 'cancelada').map((m) => Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome).join(', '))}">${cursosDoAluno(ms)}</td>
                  <td>${status(s.tom, s.nome)}</td>
                  ${verFin ? `<td>${financeiro(deve, ms)}</td>` : ''}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-900">
            <p>${restantes ? `Mostrando ${visiveis.length} de ${lista.length} alunos` : `${lista.length} de ${total} alunos`}</p>
            ${restantes ? `<button type="button" data-mais class="btn-sec btn-pequeno">Mostrar mais ${Math.min(POR_PAGINA, restantes)}</button>` : ''}
          </div>` : vazio('Nenhum aluno encontrado', 'Ajuste a busca ou os filtros.')}
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
      limite = POR_PAGINA;
      atualizarUrl();
      const pos = busca.selectionStart;
      render();
      const novo = tela.querySelector('#busca');
      novo.focus();
      novo.setSelectionRange(pos, pos);
    });
    const mudar = (campo, valor) => { filtro[campo] = valor; limite = POR_PAGINA; atualizarUrl(); render(); };
    tela.querySelector('#f-situacao').addEventListener('change', (e) => mudar('situacao', e.target.value));
    tela.querySelector('#f-curso').addEventListener('change', (e) => mudar('curso', e.target.value));
    tela.querySelectorAll('[data-ordem]').forEach((b) => b.addEventListener('click', () => {
      mudar('ordem', b.dataset.ordem);
      tela.querySelector(`[data-ordem="${b.dataset.ordem}"]`).focus();
    }));
    tela.querySelector('[data-mais]')?.addEventListener('click', () => {
      const primeiroNovo = limite;
      limite += POR_PAGINA;
      render();
      tela.querySelectorAll('tbody tr')[primeiroNovo]?.querySelector('a')?.focus();
    });
    tela.querySelector('[data-novo]')?.addEventListener('click', novo);
  }

  function novo() {
    abrirFormAluno({ aoSalvar: (a) => { location.href = `aluno.html?id=${a.id}&novo=1`; } });
  }

  render();
  if (parametroUrl('novo') && Shell.pode('alunos', 'criar')) novo();
})();
