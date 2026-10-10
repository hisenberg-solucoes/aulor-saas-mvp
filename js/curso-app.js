// ============================================================
// Curso: descrição, carga, módulos e turmas do curso.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');

  function render() {
    const c = Aulor.curso(id);
    if (!c) { tela.innerHTML = vazio('Curso não encontrado', '', '<a class="btn-sec" href="cursos.html">Voltar</a>'); return; }
    const turmas = Aulor.turmas().filter((t) => t.cursoId === c.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
    const modalidade = Aulor.MODALIDADES.find((m) => m.id === c.modalidade)?.nome;
    const acoes = [
      Shell.pode('cursos', 'editar') ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar</button>` : '',
      Shell.pode('turmas', 'criar') ? `<button type="button" data-nova-turma class="btn-pri">${ICONE.mais}Nova turma</button>` : '',
    ].join('');
    const fato = (r, v) => `<div><dt class="text-xs text-slate-500 dark:text-neutral-400">${r}</dt><dd class="text-sm font-medium mt-0.5">${v}</dd></div>`;
    tela.innerHTML = `
      <div class="max-w-5xl mx-auto">
        ${cabecalhoPagina({ titulo: esc(c.nome), subtitulo: `${esc(c.codigo)} · ${esc(c.area || 'sem área')}`, voltar: { href: 'cursos.html', rotulo: 'Cursos' }, acoes })}
        <div class="grid lg:grid-cols-3 gap-5 items-start">
          <section class="painel p-5 lg:col-span-2 space-y-5">
            ${c.descricao ? `<p class="text-sm text-slate-700 dark:text-neutral-300">${esc(c.descricao)}</p>` : ''}
            <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              ${fato('Carga horária', `${c.cargaHoraria} h`)}
              ${fato('Modalidade', modalidade)}
              ${fato('Valor de referência', moeda(c.valor))}
              ${fato('Parcelamento sugerido', `até ${c.parcelasSugeridas}× de ${moeda(c.valor / c.parcelasSugeridas)}`)}
            </dl>
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Módulos</h3>
              ${c.modulos.length ? `<ol class="divide-y divide-slate-100 dark:divide-neutral-900 border-y border-slate-100 dark:border-neutral-900">${c.modulos.map((m, i) => `<li class="flex items-center justify-between py-2 text-sm"><span><span class="text-slate-400 tabular-nums mr-2">${i + 1}.</span>${esc(m.nome)}</span><span class="tabular-nums text-slate-500">${m.cargaHoraria} h</span></li>`).join('')}</ol>` : '<p class="text-sm text-slate-500 dark:text-neutral-400">Curso sem módulos: o certificado mostra só o curso e a carga horária.</p>'}
            </div>
          </section>
          <section class="painel">
            <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold">Turmas</h3></div>
            ${turmas.length ? `<ul class="divide-y divide-slate-100 dark:divide-neutral-900">${turmas.map((t) => {
              const s = Aulor.situacaoTurma(t);
              const o = Aulor.ocupacao(t);
              return `<li><a href="turma.html?id=${t.id}" class="block px-5 py-3 hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                <div class="flex items-center justify-between gap-2"><span class="font-medium text-sm">${esc(t.codigo)}</span>${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome)}</div>
                <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(Agenda.descrever(t.agenda))} · ${dataCurta(t.inicio)} a ${dataCurta(t.fim)} · ${o.ocupadas}/${o.capacidade} alunos</p>
              </a></li>`;
            }).join('')}</ul>` : vazio('Nenhuma turma ainda')}
          </section>
        </div>
      </div>`;
    tela.querySelector('[data-editar]')?.addEventListener('click', () => abrirFormCurso({ curso: c, aoSalvar: () => { toast('Curso atualizado'); render(); } }));
    tela.querySelector('[data-nova-turma]')?.addEventListener('click', () => abrirFormTurma({ cursoId: c.id, aoSalvar: (t) => { location.href = `turma.html?id=${t.id}&nova=1`; } }));
  }

  render();
})();
