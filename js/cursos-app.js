// ============================================================
// Cursos: o catálogo da escola. Turmas e professores têm telas próprias
// (turmas.html, professores.html), como no protótipo original.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: '', modalidade: '' };
  const abertas = (c) => Aulor.turmas().filter((t) => t.cursoId === c.id && ['planejada', 'em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(t))).length;

  function render() {
    const todos = Aulor.cursos();
    const termo = normalizarTexto(filtro.q);
    const lista = todos.filter((c) => (!filtro.modalidade || c.modalidade === filtro.modalidade) && (!termo || normalizarTexto(`${c.nome} ${c.codigo} ${c.area}`).includes(termo)));
    const filtrando = !!(filtro.q || filtro.modalidade);
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Cursos', subtitulo: 'O catálogo da escola: carga horária, modalidade e valor de referência. Cada curso pode ter várias <a class="link" href="turmas.html">turmas</a>.', acoes: Shell.pode('cursos', 'criar') ? `<button type="button" data-novo class="btn-pri">${ICONE.mais}Novo curso</button>` : '' })}
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por nome, código ou área')}
          ${selectFiltro('f-modalidade', [{ id: '', nome: 'Todas as modalidades' }, ...Aulor.MODALIDADES], filtro.modalidade, 'Modalidade')}
          ${filtrando ? '<button type="button" data-limpar class="text-sm font-medium link">Limpar</button>' : ''}
        </div>
        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Curso</th><th>Área</th><th class="num">Carga</th><th>Modalidade</th><th class="num">Valor</th><th class="num">Turmas abertas</th></tr></thead>
              <tbody>${lista.map((c) => `<tr data-href="curso.html?id=${c.id}">
                <td><a href="curso.html?id=${c.id}" class="font-medium text-slate-900 dark:text-neutral-100 hover:underline">${esc(c.nome)}</a><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(c.codigo)} · ${c.modulos.length ? `${c.modulos.length} módulos` : 'sem módulos'}</p></td>
                <td>${esc(c.area || '—')}</td>
                <td class="num">${c.cargaHoraria} h</td>
                <td>${nomeModalidade(c.modalidade)}</td>
                <td class="num">${moeda(c.valor)}<p class="text-xs text-slate-400">até ${c.parcelasSugeridas}×</p></td>
                <td class="num">${abertas(c) || '<span class="text-slate-400">nenhuma</span>'}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>` : vazio('Nenhum curso corresponde aos filtros')}
          <p class="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-900 tabular-nums">${lista.length} ${lista.length === 1 ? 'curso' : 'cursos'}${filtrando ? ` de ${todos.length}` : ''}</p>
        </div>
      </div>`;
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('#f-modalidade').addEventListener('change', (e) => { filtro.modalidade = e.target.value; render(); });
    tela.querySelector('[data-limpar]')?.addEventListener('click', () => { filtro.q = ''; filtro.modalidade = ''; render(); });
    tela.querySelector('[data-novo]')?.addEventListener('click', () => abrirFormCurso({ aoSalvar: (c) => { location.href = `curso.html?id=${c.id}`; } }));
  }

  render();
})();
