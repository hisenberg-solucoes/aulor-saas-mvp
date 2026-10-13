// ============================================================
// Modelos de certificado (templates-certificado.html): cada modelo com a
// miniatura real da frente, situação, aparência e quantos cursos o usam.
// O curso escolhe o modelo no cadastro; sem escolha, vale o padrão da escola.
// O editor de cada modelo fica em modelo-certificado.html?id=.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const podeEditar = Shell.pode('configuracoes', 'editar');

  // Padrão primeiro; depois ativos, rascunhos e inativos, em ordem alfabética.
  const ORDEM = { ativo: 0, rascunho: 1, inativo: 2 };
  const ordenados = () => [...Aulor.modelosCertificado()].sort((a, b) => (b.padrao - a.padrao) || (ORDEM[a.status] - ORDEM[b.status]) || a.nome.localeCompare(b.nome, 'pt-BR'));

  const meta = (rotulo, valor) => `<div class="min-w-0"><dt class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">${rotulo}</dt><dd class="mt-1 text-sm text-slate-700 dark:text-neutral-200">${valor}</dd></div>`;

  function linha(m) {
    const emitidos = Aulor.emitidosComModelo(m.id).length;
    const acoes = podeEditar ? `
      <div class="col-span-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:row-span-2 flex flex-wrap sm:flex-col items-center sm:items-end gap-2 sm:self-start">
        <a href="${urlModelo(m.id)}" class="btn-sec btn-pequeno">${ICONE.editar}Editar</a>
        <div class="flex items-center gap-1">
          ${m.status === 'ativo' && !m.padrao ? `<button type="button" data-padrao="${m.id}" class="btn-fantasma btn-pequeno">Tornar padrão</button>` : ''}
          <button type="button" data-duplicar="${m.id}" class="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30" title="Duplicar" aria-label="Duplicar ${esc(m.nome)}">${ICONE.copiar}</button>
          ${m.padrao
            ? `<span class="p-2 text-slate-300 dark:text-neutral-700 cursor-not-allowed" title="O padrão da escola não pode ser excluído">${ICONE_MODELO.lixeira}</span>`
            : `<button type="button" data-excluir="${m.id}" class="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 dark:text-neutral-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30" title="Excluir" aria-label="Excluir ${esc(m.nome)}">${ICONE_MODELO.lixeira}</button>`}
        </div>
      </div>` : '';
    return `
      <li class="grid grid-cols-[7.5rem_minmax(0,1fr)] sm:grid-cols-[12rem_minmax(0,1fr)_auto] gap-x-4 sm:gap-x-6 gap-y-3 px-4 sm:px-5 py-5 ${m.status === 'inativo' ? 'bg-slate-50/60 dark:bg-neutral-900/30' : ''}">
        <a href="${urlModelo(m.id)}" class="block sm:row-span-2 rounded-lg transition hover:ring-2 hover:ring-petrol-800/25 dark:hover:ring-sky-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 ${m.status === 'inativo' ? 'opacity-60' : ''}" tabindex="-1" aria-hidden="true">${miniaturaModelo(m)}</a>
        <div class="min-w-0 self-center sm:self-end">
          <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <a href="${urlModelo(m.id)}" class="font-display font-semibold text-slate-900 dark:text-neutral-100 hover:underline underline-offset-2">${esc(m.nome)}</a>
            ${m.padrao ? seloPadrao() : ''}
          </div>
          ${m.descricao ? `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5 line-clamp-2">${esc(m.descricao)}</p>` : ''}
        </div>
        <dl class="col-span-2 sm:col-span-1 sm:col-start-2 self-start grid grid-cols-2 lg:grid-cols-[auto_auto_auto_auto] gap-x-6 lg:gap-x-8 gap-y-3 lg:justify-start">
            ${meta('Situação', statusModelo(m))}
            ${meta('Aparência', aparenciaResumo(m))}
            ${meta('Usado em', usoDoModelo(m))}
            ${meta('Emitidos', `<span class="tabular-nums">${emitidos || '<span class="text-slate-500 dark:text-neutral-400">nenhum</span>'}</span> <span class="text-xs text-slate-500 dark:text-neutral-400">· atualizado em ${dataBr(m.atualizadoEm)}</span>`)}
        </dl>
        ${acoes}
      </li>`;
  }

  function render() {
    const lista = ordenados();
    const ativos = lista.filter((m) => m.status === 'ativo').length;
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({
          titulo: 'Modelos de certificado',
          subtitulo: 'O curso escolhe o modelo no próprio cadastro; sem escolha, emite com o padrão da escola. Cada certificado emitido guarda o modelo da emissão, então editar aqui não muda os já emitidos.',
          acoes: podeEditar ? `<button type="button" data-novo class="btn-pri">${ICONE.mais}Novo modelo</button>` : '',
        })}
        <section class="painel overflow-hidden">
          <ul class="divide-y divide-slate-200 dark:divide-neutral-800">${lista.map(linha).join('')}</ul>
          <p class="px-5 py-2.5 text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-200 dark:border-neutral-800 tabular-nums">${plural(lista.length, 'modelo', 'modelos')} · ${plural(ativos, 'ativo', 'ativos')}${podeEditar ? '' : ' · somente leitura: seu perfil não edita as configurações'}</p>
        </section>
      </div>`;
    tela.querySelector('[data-novo]')?.addEventListener('click', abrirNovoModelo);
    tela.querySelectorAll('[data-padrao]').forEach((b) => b.addEventListener('click', () => confirmarPadrao(Aulor.modeloCertificado(b.dataset.padrao), render)));
    tela.querySelectorAll('[data-excluir]').forEach((b) => b.addEventListener('click', () => confirmarExclusaoModelo(Aulor.modeloCertificado(b.dataset.excluir), render)));
    tela.querySelectorAll('[data-duplicar]').forEach((b) => b.addEventListener('click', () => {
      const r = Aulor.duplicarModelo(b.dataset.duplicar);
      if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
      toast(`Cópia criada como rascunho: "${r.modelo.nome}"`);
      render();
    }));
  }

  render();
  if (parametroUrl('novo') && podeEditar) abrirNovoModelo();
})();
