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

  const meta = (rotulo, valor) => `<div class="min-w-0"><dt class="text-xs font-medium text-tinta-2">${rotulo}</dt><dd class="mt-1 text-sm text-tinta">${valor}</dd></div>`;

  function linha(m) {
    const emitidos = Aulor.emitidosComModelo(m.id).length;
    const acoes = podeEditar ? `
      <div class="col-span-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:row-span-2 flex flex-wrap sm:flex-col items-center sm:items-end gap-2 sm:self-start">
        <a href="${urlModelo(m.id)}" class="btn-sec btn-pequeno">${ICONE.editar}Editar</a>
        <div class="flex items-center gap-1">
          ${m.status === 'ativo' && !m.padrao ? `<button type="button" data-padrao="${m.id}" class="btn-fantasma btn-pequeno">Tornar padrão</button>` : ''}
          <button type="button" data-duplicar="${m.id}" class="p-2 rounded-lg text-tinta-2 hover:text-tinta hover:bg-realce transition" title="Duplicar" aria-label="Duplicar ${esc(m.nome)}">${ICONE.copiar}</button>
          ${m.padrao
            ? `<span class="p-2 text-tinta-3 cursor-not-allowed" title="O padrão da escola não pode ser excluído">${ICONE_MODELO.lixeira}</span>`
            : `<button type="button" data-excluir="${m.id}" class="p-2 rounded-lg text-tinta-2 hover:text-ruim hover:bg-ruim/10 transition" title="Excluir" aria-label="Excluir ${esc(m.nome)}">${ICONE_MODELO.lixeira}</button>`}
        </div>
      </div>` : '';
    return `
      <li class="grid grid-cols-[7.5rem_minmax(0,1fr)] sm:grid-cols-[12rem_minmax(0,1fr)_auto] gap-x-4 sm:gap-x-6 gap-y-3 px-4 sm:px-5 py-5 ${m.status === 'inativo' ? 'bg-faixa' : ''}">
        <a href="${urlModelo(m.id)}" class="block sm:row-span-2 rounded-lg transition hover:ring-2 hover:ring-marca-tinta/25 ${m.status === 'inativo' ? 'opacity-60' : ''}" tabindex="-1" aria-hidden="true">${miniaturaModelo(m)}</a>
        <div class="min-w-0 self-center sm:self-end">
          <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <a href="${urlModelo(m.id)}" class="font-display font-semibold text-tinta hover:underline underline-offset-2">${esc(m.nome)}</a>
            ${m.padrao ? seloPadrao() : ''}
          </div>
          ${m.descricao ? `<p class="text-sm text-tinta-2 mt-0.5 line-clamp-2">${esc(m.descricao)}</p>` : ''}
        </div>
        <dl class="col-span-2 sm:col-span-1 sm:col-start-2 self-start grid grid-cols-2 lg:grid-cols-[auto_auto_auto_auto] gap-x-6 lg:gap-x-8 gap-y-3 lg:justify-start">
            ${meta('Situação', statusModelo(m))}
            ${meta('Aparência', aparenciaResumo(m))}
            ${meta('Usado em', usoDoModelo(m))}
            ${meta('Emitidos', `<span class="tabular-nums">${emitidos || '<span class="text-tinta-2">nenhum</span>'}</span> <span class="text-xs text-tinta-2">· atualizado em ${dataBr(m.atualizadoEm)}</span>`)}
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
          <ul class="divide-y divide-linha">${lista.map(linha).join('')}</ul>
          <p class="px-5 py-2.5 text-xs text-tinta-2 border-t border-linha tabular-nums">${plural(lista.length, 'modelo', 'modelos')} · ${plural(ativos, 'ativo', 'ativos')}${podeEditar ? '' : ' · somente leitura: seu perfil não edita as configurações'}</p>
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
