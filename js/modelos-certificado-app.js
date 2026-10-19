// ============================================================
// Modelos de certificado (templates-certificado.html), na direção Ficha em
// cartões: busca e situação sobre o fundo, tabela no cartão com a miniatura
// da frente no lugar do avatar e o padrão primeiro. Sem ações na linha: ela
// abre o editor (modelo-certificado.html?id=), onde moram padrão, duplicar e
// excluir. O curso escolhe o modelo no cadastro; sem escolha, vale o padrão.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const podeEditar = Shell.pode('configuracoes', 'editar');
  const filtro = { q: '', status: '' };

  // Padrão primeiro; depois ativos, rascunhos e inativos, em ordem alfabética.
  const ORDEM = { ativo: 0, rascunho: 1, inativo: 2 };
  const ordenados = () => [...Aulor.modelosCertificado()].sort((a, b) => (b.padrao - a.padrao) || (ORDEM[a.status] - ORDEM[b.status]) || a.nome.localeCompare(b.nome, 'pt-BR'));
  const visiveis = () => {
    const termo = normalizarTexto(filtro.q);
    return ordenados().filter((m) => (!filtro.status || m.status === filtro.status) && (!termo || normalizarTexto(`${m.nome} ${m.descricao}`).includes(termo)));
  };

  function linha(m) {
    const emitidos = Aulor.emitidosComModelo(m.id).length;
    return `
      <tr data-href="${urlModelo(m.id)}" class="${FOCO_LINHA} ${m.status === 'inativo' ? 'linha-apagada' : ''}">
        <td>
          <div class="flex items-center gap-3 min-w-0">
            ${Certificado.miniatura(m)}
            <div class="min-w-0">
              <p class="flex flex-wrap items-center gap-x-2 gap-y-0.5"><a href="${urlModelo(m.id)}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(m.nome)}</a>${pilulasModelo(m)}</p>
              <p class="text-xs ${APOIO} truncate" title="${esc(m.descricao)}">${esc(m.descricao || aparenciaTexto(m))}</p>
            </div>
          </div>
        </td>
        <td>${usoDoModelo(m)}</td>
        <td class="num">${emitidos || `<span class="${APOIO}">—</span>`}</td>
        <td class="num">${dataBr(m.atualizadoEm)}</td>
      </tr>`;
  }

  function tabela() {
    const todos = Aulor.modelosCertificado().length;
    const lista = visiveis();
    const filtrando = filtro.q || filtro.status;
    return `
      <div class="painel overflow-hidden">
        ${lista.length ? `<div class="overflow-x-auto"><table class="tabela">
          <thead><tr><th>Modelo</th><th class="w-[16rem]">Usado por</th><th class="text-right num w-28">Emitidos</th><th class="text-right num w-28">Atualizado</th></tr></thead>
          <tbody>${lista.map(linha).join('')}</tbody>
        </table></div>` : vazio('Nenhum modelo com esse filtro', '', '<button type="button" data-limpar class="btn-sec">Limpar filtros</button>')}
        <p class="px-4 py-2.5 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">${plural(lista.length, 'modelo', 'modelos')}${filtrando ? ` de ${todos}` : ''}${podeEditar ? '' : ' · somente leitura: seu perfil não edita as configurações'}</p>
      </div>`;
  }

  function atualizarTabela() {
    tela.querySelector('[data-tabela]').innerHTML = tabela();
    ligarLinhasLink(tela.querySelector('[data-tabela]'));
  }

  function render() {
    const todos = Aulor.modelosCertificado();
    const conta = (s) => todos.filter((m) => m.status === s).length;
    const opcoes = [
      { id: '', nome: 'Todos', n: todos.length },
      { id: 'ativo', nome: 'Ativos', n: conta('ativo') },
      { id: 'rascunho', nome: 'Rascunhos', n: conta('rascunho') },
      { id: 'inativo', nome: 'Inativos', n: conta('inativo') },
    ];
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({
          titulo: `Modelos de certificado <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${todos.length}</span>`,
          subtitulo: 'Frente e verso do certificado que a escola emite. O <a class="link" href="cursos.html">curso</a> escolhe o modelo no próprio cadastro; sem escolha, emite com o padrão da escola. Editar um modelo não muda os certificados já emitidos.',
        })}
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por nome ou descrição')}
          ${segmentado('status', opcoes, filtro.status, 'Situação')}
          ${podeEditar ? `<button type="button" data-novo class="btn-pri ml-auto">${ICONE.mais}Novo modelo</button>` : ''}
        </div>
        <div data-tabela>${tabela()}</div>
      </div>`;
    ligarLinhasLink(tela);
  }

  // Delegado no #tela: a tabela é redesenhada a cada letra sem perder o foco da busca.
  tela.addEventListener('input', (e) => {
    if (e.target.id !== 'busca') return;
    filtro.q = e.target.value;
    atualizarTabela();
  });
  tela.addEventListener('click', (e) => {
    const s = e.target.closest('[data-status]');
    if (s) {
      filtro.status = s.dataset.status;
      render();
      tela.querySelector(`[data-status="${filtro.status}"]`)?.focus();
      return;
    }
    if (e.target.closest('[data-novo]')) { abrirNovoModelo(); return; }
    if (e.target.closest('[data-limpar]')) { filtro.q = ''; filtro.status = ''; render(); tela.querySelector('#busca').focus(); }
  });

  render();
  if (parametroUrl('novo') && podeEditar) abrirNovoModelo();
})();
