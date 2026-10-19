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

  // Curso em andamento é o comum: só o nome. O resto (concluiu, sem curso, sem matrícula) vai em apoio ou ponto.
  function cursosDoAluno(s, ms) {
    const nomes = (st) => ms.filter((m) => m.status === st).map((m) => Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome).join(', ');
    if (s.id === 'ativo') return `<span class="block truncate" title="${esc(nomes('ativa'))}">${esc(nomes('ativa'))}</span>`;
    if (s.id === 'concluiu') return `<span class="block truncate ${APOIO}" title="${esc(nomes('concluida'))}">Concluiu ${esc(nomes('concluida'))}</span>`;
    if (s.id === 'sem_matricula') return status('atencao', 'Sem matrícula');
    return `<span class="${APOIO}">${esc(s.nome)}</span>`;
  }

  // Cabeçalho que ordena a lista: Aluno (A–Z) ou Em atraso (maior valor vencido primeiro).
  function thOrdem(rotulo, ordem, classe = '') {
    const ativo = filtro.ordem === ordem;
    return `<th class="${classe}" ${ativo ? `aria-sort="${ordem ? 'descending' : 'ascending'}"` : ''}><button type="button" data-ordem="${ordem}" class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-neutral-100 [&_svg]:h-3 [&_svg]:w-3 ${ativo ? 'text-slate-900 dark:text-neutral-100' : ''}" title="${ordem ? 'Maior valor vencido primeiro' : 'Ordem alfabética'}">${rotulo}${ativo ? (ordem ? ICONE.baixo : ICONE.cima) : ''}</button></th>`;
  }

  // Só a dívida aparece; "em dia" é o comum e não se anuncia.
  function emAtraso(deve) {
    if (!deve) return `<span class="${APOIO}">—</span>`;
    return `<span class="font-medium tabular-nums text-red-700 dark:text-red-400" title="${deve.parcelas.length} ${deve.parcelas.length === 1 ? 'parcela vencida' : 'parcelas vencidas'}; a mais antiga há ${deve.maiorAtraso} dias">${moeda(deve.total)}</span><p class="text-xs ${APOIO}">há ${deve.maiorAtraso} ${deve.maiorAtraso === 1 ? 'dia' : 'dias'}</p>`;
  }

  function linha({ a, s, ms, deve }, verFin) {
    const idade = Aulor.idade(a.nascimento);
    return `
      <tr data-href="aluno.html?id=${a.id}" class="${FOCO_LINHA}">
        <td><div class="flex items-center gap-3 min-w-[15rem]">${avatar(a.nome, 'h-9 w-9 text-xs')}<div class="min-w-0">
          <p class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"><a href="aluno.html?id=${a.id}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(a.nome)}</a>${Aulor.ehMenor(a) ? pilula('atencao', 'Menor', `${idade} anos`) : ''}</p>
          <p class="text-xs ${APOIO} truncate"><span class="font-mono">${cpfFmt(a.cpf)}</span>${idade != null ? ` · ${idade} anos` : ''}</p>
        </div></div></td>
        <td class="max-w-[16rem]"><span class="block truncate">${a.email ? esc(a.email) : `<span class="${APOIO}">sem e-mail</span>`}</span><span class="block text-xs ${APOIO} tabular-nums">${telefoneFmt(a.telefone)}</span></td>
        <td class="max-w-[14rem]">${cursosDoAluno(s, ms)}</td>
        ${verFin ? `<td class="num">${emAtraso(deve)}</td>` : ''}
      </tr>`;
  }

  function render() {
    const lista = linhas();
    const visiveis = lista.slice(0, limite);
    const restantes = lista.length - visiveis.length;
    const total = Aulor.alunos().length;
    const ativos = Aulor.alunosAtivos().length;
    const verFin = Shell.pode('receber');
    const filtrando = filtro.q || filtro.situacao !== 'todos' || filtro.curso !== 'todos';
    const acoes = [
      Shell.pode('matriculas', 'criar') ? '<a href="matricula-nova.html" class="btn-sec">Nova matrícula</a>' : '',
      Shell.pode('alunos', 'criar') ? `<button type="button" data-novo class="btn-pri">${ICONE.mais}Cadastrar aluno</button>` : '',
    ].join('');
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: `Alunos <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${total}</span>`, subtitulo: `Quem se matricula na escola: dados do contrato, responsáveis, matrículas e parcelas. ${ativos} com curso em andamento.`, acoes })}
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por nome, CPF, e-mail ou celular')}
          <div class="ml-auto flex flex-wrap items-center gap-2">
            ${selectFiltro('f-situacao', SITUACOES.filter((s) => s.id !== 'vencido' || verFin), filtro.situacao, 'Situação')}
            ${selectFiltro('f-curso', [{ id: 'todos', nome: 'Todos os cursos' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.curso, 'Curso')}
            ${filtrando ? '<button type="button" data-limpar class="btn-fantasma">Limpar</button>' : ''}
          </div>
        </div>
        <div class="painel overflow-hidden">
          ${lista.length ? `
          <div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr>${thOrdem('Aluno', '')}<th>Contato</th><th>Curso</th>${verFin ? thOrdem('Em atraso', 'vencido', 'text-right') : ''}</tr></thead>
              <tbody>${visiveis.map((x) => linha(x, verFin)).join('')}</tbody>
            </table>
          </div>
          <div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">
            <p>${restantes ? `Mostrando ${visiveis.length} de ${lista.length} alunos` : `${lista.length} de ${total} alunos`}</p>
            ${restantes ? `<button type="button" data-mais class="btn-sec btn-pequeno">Mostrar mais ${Math.min(POR_PAGINA, restantes)}</button>` : ''}
          </div>` : vazio('Nenhum aluno encontrado', filtrando ? 'Nenhum aluno corresponde à busca e aos filtros.' : 'Cadastre o primeiro aluno para matricular.', filtrando ? '<button type="button" data-limpar class="btn-sec">Limpar filtros</button>' : '')}
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
      tela.querySelectorAll('tbody tr')[primeiroNovo]?.querySelector('.link-registro')?.focus();
    });
    tela.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => {
      Object.assign(filtro, { q: '', situacao: 'todos', curso: 'todos' });
      limite = POR_PAGINA;
      atualizarUrl();
      render();
      tela.querySelector('#busca').focus();
    }));
    tela.querySelector('[data-novo]')?.addEventListener('click', novo);
  }

  function novo() {
    abrirFormAluno({ aoSalvar: (a) => { location.href = `aluno.html?id=${a.id}&novo=1`; } });
  }

  render();
  if (parametroUrl('novo') && Shell.pode('alunos', 'criar')) novo();
})();
