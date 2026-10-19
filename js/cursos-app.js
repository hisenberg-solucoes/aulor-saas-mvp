// ============================================================
// Cursos: o catálogo da escola. Turmas e professores têm telas próprias
// (turmas.html, professores.html), como no protótipo original.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: '', modalidade: '' };
  const ABERTAS = ['planejada', 'em_andamento', 'a_concluir'];

  function render() {
    const todos = Aulor.cursos();
    const turmas = Aulor.turmas().map((t) => ({ t, s: Aulor.situacaoTurma(t) }));
    const abertas = (c) => turmas.filter(({ t, s }) => t.cursoId === c.id && ABERTAS.includes(s)).length;
    const termo = normalizarTexto(filtro.q);
    const lista = todos.filter((c) => (!filtro.modalidade || c.modalidade === filtro.modalidade) && (!termo || normalizarTexto(`${c.nome} ${c.codigo} ${c.area}`).includes(termo)));
    const filtrando = !!(filtro.q || filtro.modalidade);
    const comNota = todos.filter(Aulor.temNota).length;
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({
          titulo: 'Cursos',
          subtitulo: `${todos.length} ${todos.length === 1 ? 'curso' : 'cursos'} no catálogo. Carga horária, modalidade, aprovação e valor de referência; cada curso vira uma ou mais <a class="link" href="turmas.html">turmas</a>.`,
          acoes: Shell.pode('cursos', 'criar') ? `<button type="button" data-novo class="btn-pri">${ICONE.mais}Novo curso</button>` : '',
        })}

        <div class="grid grid-cols-3 gap-3 mb-4">
          ${cartaoNumero({ rotulo: 'Cursos no catálogo', valor: todos.length, ajuda: `${comNota} com nota mínima, ${todos.length - comNota} só por frequência` })}
          ${cartaoNumero({ rotulo: 'Turmas em andamento', valor: turmas.filter(({ s }) => s === 'em_andamento').length, ajuda: 'entre a primeira e a última aula' })}
          ${cartaoNumero({ rotulo: 'Turmas a iniciar', valor: turmas.filter(({ s }) => s === 'planejada').length, ajuda: 'abertas para matrícula' })}
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por nome, código ou área')}
          ${selectFiltro('f-modalidade', [{ id: '', nome: 'Todas as modalidades' }, ...Aulor.MODALIDADES], filtro.modalidade, 'Modalidade')}
          ${filtrando ? '<button type="button" data-limpar class="text-sm font-medium link">Limpar</button>' : ''}
        </div>

        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Curso</th><th>Modalidade</th><th class="num">Carga</th><th>Aprovação</th><th class="num">Valor de referência</th><th class="num">Turmas abertas</th></tr></thead>
              <tbody>${lista.map((c) => {
                const n = abertas(c);
                return `<tr data-href="curso.html?id=${c.id}" class="${FOCO_LINHA}">
                <td><p><span class="font-mono text-xs ${APOIO} mr-1.5">${esc(c.codigo)}</span><a href="curso.html?id=${c.id}" class="${LINK_REGISTRO}">${esc(c.nome)}</a></p><p class="text-xs ${APOIO}">${esc(c.area || 'sem área')} · ${c.modulos.length ? `${c.modulos.length} ${c.modulos.length === 1 ? 'módulo' : 'módulos'}` : 'sem módulos'}</p></td>
                <td>${nomeModalidade(c.modalidade)}</td>
                <td class="num">${c.cargaHoraria} h</td>
                <td>${Aulor.temNota(c) ? `nota mínima ${Aulor.fmtNota(c.notaMinima)}` : `<span class="${APOIO}">só frequência</span>`}</td>
                <td class="num">${moeda(c.valor)}<p class="text-xs ${APOIO}">até ${c.parcelasSugeridas}×</p></td>
                <td class="num">${n ? `<a class="link" href="turmas.html?curso=${c.id}" title="Ver as turmas deste curso">${n}</a>` : `<span class="${APOIO}">nenhuma</span>`}</td>
              </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : vazio('Nenhum curso corresponde aos filtros')}
          <p class="px-4 py-2.5 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">${lista.length} ${lista.length === 1 ? 'curso' : 'cursos'}${filtrando ? ` de ${todos.length}` : ''}</p>
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
