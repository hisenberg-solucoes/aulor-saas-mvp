// ============================================================
// Editor de um modelo de certificado (modelo-certificado.html?id=).
// Abas: Aparência | Frente | Verso | Onde é usado. Os campos editam um
// rascunho em memória com prévia ao vivo (dados de exemplo); "Salvar"
// valida e grava no motor, "Descartar" volta ao que estava salvo.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');
  const podeEditar = Shell.pode('configuracoes', 'editar');
  const ABAS = [
    { id: 'aparencia', nome: 'Aparência' },
    { id: 'frente', nome: 'Frente' },
    { id: 'verso', nome: 'Verso' },
    { id: 'usos', nome: 'Onde é usado' },
  ];
  // Combinações de cor que funcionam em papel branco, para quem não quer escolher do zero.
  const PALETAS = [
    { nome: 'Petróleo e cobre', primaria: '#0F3D4E', destaque: '#C47A3A' },
    { nome: 'Ardósia e ciano', primaria: '#1E293B', destaque: '#0E7490' },
    { nome: 'Bordô e dourado', primaria: '#5B2333', destaque: '#A8844A' },
    { nome: 'Floresta e âmbar', primaria: '#1F3B2D', destaque: '#B7791F' },
    { nome: 'Grafite e vermelho', primaria: '#27272A', destaque: '#B91C1C' },
  ];
  const estado = {
    aba: ABAS.some((a) => a.id === parametroUrl('aba')) ? parametroUrl('aba') : 'frente',
    rascunho: null,
    sujo: false,
    ultimoCampo: null,
  };

  const modelo = () => Aulor.modeloCertificado(id);
  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const ler = (caminho) => caminho.split('.').reduce((o, k) => o?.[k], estado.rascunho);
  const gravar = (caminho, valor) => {
    const ks = caminho.split('.');
    const ultimo = ks.pop();
    ks.reduce((o, k) => o[k], estado.rascunho)[ultimo] = valor;
  };
  const doRascunho = () => ({ ...modelo(), ...estado.rascunho });
  function iniciarRascunho() {
    const m = modelo();
    estado.rascunho = clonar({ aparencia: m.aparencia, frente: m.frente, verso: m.verso });
    estado.sujo = false;
  }

  // ---------- Campos (editam o rascunho pelo caminho no name) ----------

  const OPCIONAL = '<span class="normal-case font-normal tracking-normal text-slate-500 dark:text-neutral-400">— opcional</span>';
  const OPCAO = 'relative cursor-pointer rounded-lg border p-3 transition border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-petrol-800/30 dark:has-[:focus-visible]:ring-sky-400/40 has-[:disabled]:opacity-60 has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:border-slate-300';

  function campoTexto(caminho, rotulo, { opcional = false, linhas = 0, max = 200, dica = '', placeholder = '' } = {}) {
    const attrs = `id="c-${caminho}" name="${caminho}" maxlength="${max}" data-texto placeholder="${esc(placeholder)}"`;
    return `
      <div>
        <label class="rotulo" for="c-${caminho}">${rotulo}${opcional ? ` ${OPCIONAL}` : ''}</label>
        ${linhas ? `<textarea ${attrs} rows="${linhas}" class="campo resize-y leading-relaxed">${esc(ler(caminho) ?? '')}</textarea>` : `<input ${attrs} value="${esc(ler(caminho) ?? '')}" class="campo">`}
        ${dica ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">${dica}</p>` : ''}
        ${ERRO(caminho)}
      </div>`;
  }

  function caixa(caminho, rotulo, dica = '') {
    return `
      <label class="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="${caminho}" class="check mt-0.5" ${ler(caminho) ? 'checked' : ''}>
        <span class="text-sm text-slate-800 dark:text-neutral-100">${rotulo}${dica ? `<span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${dica}</span>` : ''}</span>
      </label>`;
  }

  function campoCor(caminho, rotulo) {
    const v = ler(caminho);
    return `
      <div>
        <label class="rotulo" for="c-${caminho}">${rotulo}</label>
        <div class="flex items-center gap-2">
          <input type="color" value="${esc(v)}" data-cor-de="${caminho}" aria-label="${rotulo}: abrir o seletor de cor" class="h-[38px] w-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-1">
          <input id="c-${caminho}" name="${caminho}" value="${esc(v)}" maxlength="7" spellcheck="false" autocomplete="off" class="campo font-mono uppercase tabular-nums" placeholder="#RRGGBB">
        </div>
        ${ERRO(caminho)}
      </div>`;
  }

  function grupoOpcoes(campo, rotulo, desenho, { colunas = 'grid-cols-2', extra = '' } = {}) {
    const valor = ler(`aparencia.${campo}`);
    return `
      <fieldset ${extra}>
        <legend class="rotulo">${rotulo}</legend>
        <div class="grid ${colunas} gap-2">${Aulor.OPCOES_MODELO[campo].map((o) => `
          <label class="${OPCAO} flex flex-col gap-2.5">
            <input type="radio" name="aparencia.${campo}" value="${o.id}" class="sr-only" ${valor === o.id ? 'checked' : ''}>
            ${desenho(o)}
            <span><span class="block text-sm font-semibold text-slate-800 dark:text-neutral-100">${esc(o.nome)}</span><span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(o.descricao)}</span></span>
          </label>`).join('')}
        </div>
        ${ERRO(`aparencia.${campo}`)}
      </fieldset>`;
  }

  const secao = (titulo, descricao, corpo) => `
    <section class="painel">
      <div class="px-4 py-3 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold text-sm text-slate-900 dark:text-neutral-100">${titulo}</h3>
        ${descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${descricao}</p>` : ''}
      </div>
      <div class="p-4 space-y-4">${corpo}</div>
    </section>`;

  function painelVariaveis() {
    return secao('Variáveis', 'Clique para inserir no campo em que você estava escrevendo. Na emissão, cada uma vira o dado do aluno.', `
      <ul class="grid sm:grid-cols-2 gap-x-3 -mx-2 -my-1">${Certificado.VARIAVEIS.map(([v, nome]) => `
        <li><button type="button" data-variavel="${v}" class="w-full flex items-baseline gap-2 rounded-md px-2 py-1 text-left hover:bg-slate-50 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:pointer-events-none">
          <code class="shrink-0 font-mono text-xs text-petrol-800 dark:text-sky-300">{{${v}}}</code><span class="truncate text-xs text-slate-500 dark:text-neutral-400">${esc(nome)}</span>
        </button></li>`).join('')}
      </ul>`);
  }

  // ---------- Abas do formulário ----------

  function formAparencia() {
    const a = estado.rascunho.aparencia;
    const folhinha = (o) => `<span class="flex h-9 items-end text-slate-400 dark:text-neutral-500"><span class="block rounded-[3px] border-2 border-current bg-white dark:bg-neutral-950" style="${o.id === 'retrato' ? 'width:24px;height:34px' : 'width:34px;height:24px'}"></span></span>`;
    const letras = (o) => `<span class="block h-9 text-[1.75rem] leading-9 text-slate-800 dark:text-neutral-100" style="font-family:${esc(Certificado.FONTES[o.id])}">Aa</span>`;
    // Moldura desenhada com o mesmo CSS da folha, nas cores do modelo (variáveis no fieldset).
    const moldura = (o) => `<span class="relative block aspect-[297/210] w-full overflow-hidden rounded-[3px] bg-white ring-1 ring-slate-900/10 text-[5px]">${o.id === 'nenhuma' ? '' : `<span class="cert-moldura-${o.id}"></span>`}<span class="absolute left-[30%] right-[30%] top-[40%] h-[3px] rounded-full bg-slate-300"></span><span class="absolute left-[38%] right-[38%] top-[56%] h-[2px] rounded-full bg-slate-200"></span></span>`;
    return `
      ${secao('Página', 'Vale para a frente e para o verso.', `
        ${grupoOpcoes('orientacao', 'Orientação', folhinha)}
        ${grupoOpcoes('fonte', 'Fonte', letras)}
        ${grupoOpcoes('moldura', 'Moldura', moldura, { extra: `data-amostras style="--cert-primaria:${esc(a.corPrimaria)};--cert-destaque:${esc(a.corDestaque)}"` })}`)}
      ${secao('Cores', 'A principal pinta título, moldura e negritos; a de destaque, filetes, faixa e monograma.', `
        <div class="grid grid-cols-2 gap-3">
          ${campoCor('aparencia.corPrimaria', 'Principal')}
          ${campoCor('aparencia.corDestaque', 'Destaque')}
        </div>
        <div>
          <p class="rotulo">Combinações prontas</p>
          <div class="flex flex-wrap gap-1.5">${PALETAS.map((p, i) => `
            <button type="button" data-paleta="${i}" class="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-neutral-800 py-1 pl-1.5 pr-2.5 text-xs text-slate-600 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30">
              <span class="inline-flex -space-x-1"><span class="h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-neutral-950" style="background:${p.primaria}"></span><span class="h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-neutral-950" style="background:${p.destaque}"></span></span>${p.nome}
            </button>`).join('')}
          </div>
        </div>`)}`;
  }

  function formFrente() {
    const ass = estado.rascunho.frente.assinaturas;
    return `
      ${secao('Cabeçalho', 'Iniciais, nome e cidade da escola vêm de <a class="link" href="configuracoes.html">Escola e regras</a>.',
        campoTexto('frente.rotuloTopo', 'Rótulo no canto', { opcional: true, max: 60, placeholder: 'Certificado de conclusão' }))}
      ${secao('Texto principal', 'O nome do aluno entra sozinho, entre a introdução e o texto.', `
        ${campoTexto('frente.titulo', 'Título', { max: 40, placeholder: 'Certificado' })}
        ${campoTexto('frente.introducao', 'Introdução', { opcional: true, max: 120, placeholder: 'Certificamos que' })}
        ${caixa('frente.mostrarCpf', 'Mostrar o CPF abaixo do nome')}
        ${campoTexto('frente.corpo', 'Texto', { linhas: 4, max: 600, dica: 'Diga o que foi concluído, quando e com que carga horária. <code class="font-mono">**trecho**</code> sai em negrito.' })}`)}
      ${secao('Rodapé e assinaturas', 'O código de validação sai sempre, abaixo do local e data.', `
        ${campoTexto('frente.localData', 'Local e data', { opcional: true, max: 120, placeholder: '{{cidade}}, {{dataEmissao}}.' })}
        <div>
          <p class="rotulo">Assinaturas ${OPCIONAL.replace('opcional', 'de 1 a 3')}</p>
          <ol class="space-y-3">${ass.map((s, i) => `
            <li class="grid grid-cols-[1.5rem_minmax(0,1fr)_2.25rem] gap-x-2 items-start">
              <span class="mt-[1.65rem] h-6 w-6 grid place-items-center rounded-full bg-slate-100 dark:bg-neutral-900 text-xs font-semibold tabular-nums text-slate-500 dark:text-neutral-400">${i + 1}</span>
              <div class="grid sm:grid-cols-2 gap-x-3 gap-y-2">
                ${campoTexto(`frente.assinaturas.${i}.nome`, 'Nome', { max: 80, placeholder: i ? '{{professor}}' : 'Nome de quem assina' })}
                ${campoTexto(`frente.assinaturas.${i}.cargo`, 'Cargo', { opcional: true, max: 80, placeholder: i ? 'Professor(a) do curso' : 'Diretora' })}
              </div>
              ${ass.length > 1 ? `<button type="button" data-remover-assinatura="${i}" class="mt-[1.4rem] p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30" aria-label="Remover assinatura ${i + 1}">${ICONE_MODELO.lixeira}</button>` : ''}
            </li>`).join('')}
          </ol>
          ${ass.length < 3 ? `<button type="button" data-add-assinatura class="mt-3 ml-8 text-sm font-medium link">+ Adicionar assinatura</button>` : ''}
          ${ERRO('frente.assinaturas')}
        </div>`)}
      ${painelVariaveis()}`;
  }

  function formVerso() {
    const v = estado.rascunho.verso;
    return `
      ${secao('Verso', 'Folha seguinte, com os módulos do curso e os requisitos cumpridos pelo aluno.', `
        ${caixa('verso.mostrar', 'Imprimir verso', 'Desligado, o certificado sai só com a frente.')}
        <div data-grupo="verso.mostrar" class="space-y-4 ${v.mostrar ? '' : 'hidden'}">
          ${campoTexto('verso.titulo', 'Título', { max: 60, placeholder: 'Conteúdo programático' })}
          ${caixa('verso.mostrarCargaPorItem', 'Mostrar as horas de cada módulo')}
          ${caixa('verso.mostrarRequisitos', 'Mostrar os requisitos cumpridos', 'Frequência, carga horária e turma do aluno, calculadas na emissão.')}
          ${campoTexto('verso.textoLivre', 'Texto livre', { opcional: true, linhas: 3, max: 800, placeholder: 'Base legal, observações, parcerias…' })}
        </div>`)}
      <div data-grupo="verso.mostrar" class="${v.mostrar ? '' : 'hidden'}">${painelVariaveis()}</div>`;
  }

  // ---------- Prévia ----------

  function previa() {
    const m = doRascunho();
    const dados = Certificado.dadosExemplo();
    const retrato = m.aparencia.orientacao === 'retrato';
    const lados = estado.aba === 'frente' ? ['frente'] : estado.aba === 'verso' ? ['verso'] : ['frente', 'verso'];
    const folhas = lados.map((lado) => {
      const html = Certificado.folhas(dados, { modelo: m, lados: [lado] });
      return `<figure class="min-w-0">${lados.length > 1 ? `<figcaption class="mb-1.5 text-xs text-slate-500 dark:text-neutral-400">${lado === 'frente' ? 'Frente' : 'Verso'}</figcaption>` : ''}${html || `
        <div class="grid ${retrato ? 'aspect-[210/297]' : 'aspect-[297/210]'} place-items-center rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Sem verso: o certificado sai só com a frente.</div>`}</figure>`;
    });
    const orientacao = Aulor.OPCOES_MODELO.orientacao.find((o) => o.id === m.aparencia.orientacao)?.nome;
    return `
      <div class="mb-2 flex items-baseline justify-between gap-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Prévia com dados de exemplo</p>
        <p class="text-xs text-slate-500 dark:text-neutral-400">${orientacao} · A4</p>
      </div>
      <div class="${retrato && lados.length > 1 ? 'grid grid-cols-2 gap-4' : retrato ? 'max-w-md mx-auto' : 'space-y-4'}">${folhas.join('')}</div>`;
  }

  // ---------- Onde é usado ----------

  function abaUsos(m) {
    const escolheram = Aulor.cursosDoModelo(m.id);
    const emitidos = Aulor.emitidosComModelo(m.id).sort((a, b) => b.emitidoEm.localeCompare(a.emitidoEm));
    const itemCurso = (c, nota = '') => `<li class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5"><a href="curso.html?id=${c.id}" class="text-sm font-medium link">${esc(c.nome)}</a><span class="text-xs text-slate-500 dark:text-neutral-400">${nota || `${esc(c.codigo)} · ${c.cargaHoraria} h`}</span></li>`;
    const lista = (itens, vazioTxt) => itens.length ? `<ul class="-my-2.5 divide-y divide-slate-100 dark:divide-neutral-900">${itens.join('')}</ul>` : `<p class="text-sm text-slate-500 dark:text-neutral-400">${vazioTxt}</p>`;
    const descEscolha = m.status === 'ativo' ? 'A escolha fica no cadastro do curso, em Editar.' : `Enquanto o modelo estiver ${m.status === 'rascunho' ? 'em rascunho' : 'inativo'}, estes cursos emitem com o padrão da escola.`;
    return `
      <div class="grid lg:grid-cols-2 gap-5 items-start">
        <div class="space-y-5">
          ${secao('Cursos que escolheram este modelo', descEscolha, lista(escolheram.map((c) => itemCurso(c)), 'Nenhum curso escolheu este modelo ainda.'))}
          ${m.padrao ? secao('Cursos sem modelo próprio', 'Emitem com o padrão da escola, que é este.', lista(cursosNoPadrao().map((c) => itemCurso(c, c.modeloCertificadoId ? 'escolheu um modelo fora de uso' : '')), 'Todos os cursos escolheram um modelo próprio.')) : ''}
        </div>
        ${secao('Certificados emitidos com este modelo', 'Cada um guarda a cópia do modelo do dia da emissão: editar aqui não muda nenhum deles.', `
          ${lista(emitidos.slice(0, 8).map((c) => `<li class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5"><a href="certificado.html?id=${c.id}" class="text-sm font-medium link">${esc(c.dados.aluno)}</a><span class="text-xs text-slate-500 dark:text-neutral-400">${esc(c.dados.curso)} · ${dataBr(c.emitidoEm)}${c.status === 'valido' ? '' : ' · cancelado'}</span></li>`), 'Nenhum certificado emitido com este modelo ainda.')}
          ${emitidos.length > 8 ? `<p class="text-xs text-slate-500 dark:text-neutral-400">E mais ${emitidos.length - 8}. <a class="link" href="certificados.html?aba=emitidos">Ver todos os emitidos</a></p>` : ''}`)}
      </div>`;
  }

  // ---------- Página ----------

  function cabecalho(m) {
    const imprimir = `<button type="button" data-imprimir class="btn-sec">${ICONE.imprimir}Imprimir prévia</button>`;
    const acoes = podeEditar ? [
      imprimir,
      m.status === 'ativo' && !m.padrao ? `<button type="button" data-padrao class="btn-sec">${ICONE_MODELO.estrela}Tornar padrão</button>` : '',
      `<button type="button" data-dados class="btn-sec">${ICONE.editar}Nome e situação</button>`,
      `<button type="button" data-duplicar class="btn-sec">${ICONE.copiar}Duplicar</button>`,
      m.padrao ? '' : `<button type="button" data-excluir class="btn-sec px-2.5 text-red-700 dark:text-red-400" title="Excluir modelo" aria-label="Excluir modelo">${ICONE_MODELO.lixeira}</button>`,
    ].join('') : imprimir;
    return cabecalhoPagina({
      titulo: `${esc(m.nome)}${m.padrao ? ` <span class="align-middle ml-1.5">${seloPadrao()}</span>` : ''}`,
      subtitulo: `<span class="inline-flex flex-wrap items-center gap-x-2 gap-y-1">${statusModelo(m)}<span aria-hidden="true">·</span><span>Usado em ${usoDoModelo(m)}</span><span aria-hidden="true">·</span><span>atualizado em ${dataBr(m.atualizadoEm)}</span></span>${m.descricao ? `<span class="block mt-1">${esc(m.descricao)}</span>` : ''}`,
      voltar: { href: 'templates-certificado.html', rotulo: 'Modelos de certificado' },
      acoes,
    });
  }

  function aviso(m) {
    if (!podeEditar) return '<p class="mb-5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-4 py-3 text-sm text-slate-700 dark:text-neutral-300">Somente leitura: seu perfil não edita as configurações. A prévia e a impressão continuam disponíveis.</p>';
    if (m.status === 'ativo') return '';
    const rascunho = m.status === 'rascunho';
    return `
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${rascunho ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200' : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'}">
        <p>${rascunho ? '<b class="font-semibold">Rascunho.</b> Os cursos ainda não podem escolher este modelo. Ative quando a prévia estiver como você quer.' : '<b class="font-semibold">Inativo.</b> Cursos que o escolheram emitem com o padrão da escola.'}</p>
        ${podeEditar ? `<button type="button" data-ativar class="btn-sec btn-pequeno">${rascunho ? 'Ativar modelo' : 'Reativar'}</button>` : ''}
      </div>`;
  }

  function abas(m) {
    const emUso = Aulor.cursosDoModelo(m.id).length + (m.padrao ? cursosNoPadrao().length : 0);
    return `
      <div class="mb-5 border-b border-slate-200 dark:border-neutral-800">
        <nav class="flex gap-5 overflow-x-auto overflow-y-hidden [scrollbar-width:none]" aria-label="Partes do modelo">
          ${ABAS.map((a) => `<button type="button" data-aba="${a.id}" ${a.id === estado.aba ? 'aria-current="page"' : ''} class="aba ${a.id === estado.aba ? 'aba-ativa' : ''} rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/40">${a.nome}${a.id === 'usos' ? ` <span class="ml-1 text-xs tabular-nums text-slate-500 dark:text-neutral-400">${emUso}</span>` : ''}</button>`).join('')}
        </nav>
      </div>`;
  }

  const barraSalvar = () => (podeEditar ? `
    <div data-barra-salvar class="${estado.sujo ? '' : 'hidden'} pointer-events-none sticky bottom-0 z-20 mt-6 pb-1">
      <div class="toast-anim pointer-events-auto mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl bg-petrol-950 dark:bg-neutral-900 dark:ring-1 dark:ring-white/10 px-4 py-2.5 text-sm text-white shadow-[0_10px_30px_-8px_rgba(7,30,44,.55)]">
        <span role="status" class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-laranja"></span>Alterações não salvas</span>
        <span class="flex items-center gap-1.5">
          <button type="button" data-descartar class="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Descartar</button>
          <button type="button" data-salvar class="btn-pri py-1.5" title="Salvar (Ctrl+S ou ⌘S)">Salvar</button>
        </span>
      </div>
    </div>` : '');

  function render() {
    const m = modelo();
    if (!m) {
      tela.innerHTML = `<div class="painel max-w-xl mx-auto">${vazio('Modelo não encontrado', 'Ele pode ter sido excluído.', '<a class="btn-sec" href="templates-certificado.html">Voltar para os modelos</a>')}</div>`;
      return;
    }
    const formulario = { aparencia: formAparencia, frente: formFrente, verso: formVerso }[estado.aba];
    tela.innerHTML = `
      <div class="max-w-7xl mx-auto">
        ${cabecalho(m)}
        ${aviso(m)}
        ${abas(m)}
        ${formulario ? `
          <div class="grid xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] gap-6 items-start">
            <form id="form-modelo" novalidate class="min-w-0"><fieldset class="space-y-5 min-w-0" ${podeEditar ? '' : 'disabled'}>${formulario()}</fieldset></form>
            <div class="order-first xl:order-none xl:sticky xl:top-0 min-w-0"><div data-previa>${previa()}</div></div>
          </div>` : abaUsos(m)}
        ${barraSalvar()}
      </div>`;
    ligar();
  }

  let timerPrevia = null;
  const agendarPrevia = () => {
    clearTimeout(timerPrevia);
    timerPrevia = setTimeout(() => { const p = tela.querySelector('[data-previa]'); if (p) p.innerHTML = previa(); }, 100);
  };
  function marcarSujo() {
    estado.sujo = true;
    tela.querySelector('[data-barra-salvar]')?.classList.remove('hidden');
  }

  function trocarAba(aba) {
    estado.aba = aba;
    history.replaceState(null, '', urlModelo(id, aba));
    render();
    tela.querySelector(`[data-aba="${aba}"]`)?.focus();
  }

  function aoEditar(e) {
    const form = e.currentTarget;
    const c = e.target;
    let caminho = c.name;
    if (c.dataset.corDe) {
      caminho = c.dataset.corDe;
      form.querySelector(`[name="${caminho}"]`).value = c.value.toUpperCase();
      gravar(caminho, c.value.toUpperCase());
    } else if (!caminho) {
      return;
    } else if (c.type === 'checkbox') {
      gravar(caminho, c.checked);
      tela.querySelectorAll(`[data-grupo="${caminho}"]`).forEach((g) => g.classList.toggle('hidden', !c.checked));
    } else if (c.type === 'radio') {
      if (!c.checked) return;
      gravar(caminho, c.value);
    } else {
      gravar(caminho, c.value);
      const seletor = form.querySelector(`[data-cor-de="${caminho}"]`);
      if (seletor && /^#[0-9a-f]{6}$/i.test(c.value)) seletor.value = c.value;
    }
    if (caminho.startsWith('aparencia.cor')) atualizarAmostras();
    marcarSujo();
    agendarPrevia();
  }

  function atualizarAmostras() {
    const a = estado.rascunho.aparencia;
    const el = tela.querySelector('[data-amostras]');
    if (!el) return;
    if (/^#[0-9a-f]{6}$/i.test(a.corPrimaria)) el.style.setProperty('--cert-primaria', a.corPrimaria);
    if (/^#[0-9a-f]{6}$/i.test(a.corDestaque)) el.style.setProperty('--cert-destaque', a.corDestaque);
  }

  function inserirVariavel(form, variavel) {
    const campo = (estado.ultimoCampo && form.querySelector(`[name="${estado.ultimoCampo}"]`)) || form.querySelector('[name="frente.corpo"], [name="verso.textoLivre"]');
    if (!campo) return;
    const token = `{{${variavel}}}`;
    const ini = campo.selectionStart ?? campo.value.length;
    const fim = campo.selectionEnd ?? ini;
    campo.value = campo.value.slice(0, ini) + token + campo.value.slice(fim);
    campo.focus();
    campo.setSelectionRange(ini + token.length, ini + token.length);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function ligar() {
    tela.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.aba)));
    tela.querySelector('[data-imprimir]')?.addEventListener('click', () => Certificado.imprimir(Certificado.dadosExemplo(), doRascunho()));
    tela.querySelector('[data-padrao]')?.addEventListener('click', () => confirmarPadrao(modelo(), render));
    tela.querySelector('[data-dados]')?.addEventListener('click', () => abrirDadosModelo(modelo(), () => { toast('Dados do modelo salvos'); render(); }));
    tela.querySelector('[data-ativar]')?.addEventListener('click', ativar);
    tela.querySelector('[data-duplicar]')?.addEventListener('click', duplicar);
    tela.querySelector('[data-excluir]')?.addEventListener('click', () => confirmarExclusaoModelo(modelo(), () => { estado.sujo = false; location.href = 'templates-certificado.html'; }));
    tela.querySelector('[data-salvar]')?.addEventListener('click', salvar);
    tela.querySelector('[data-descartar]')?.addEventListener('click', () => confirmar({
      titulo: 'Descartar alterações',
      mensagem: 'O que você mudou desde o último salvamento será perdido.',
      rotulo: 'Descartar',
      tom: 'perigo',
      aoConfirmar: () => { iniciarRascunho(); render(); toast('Alterações descartadas', 'alerta'); },
    }));

    const form = tela.querySelector('#form-modelo');
    if (!form) return;
    form.addEventListener('input', aoEditar);
    form.addEventListener('submit', (e) => { e.preventDefault(); salvar(); });
    form.querySelectorAll('[data-texto]').forEach((c) => c.addEventListener('focus', () => { estado.ultimoCampo = c.name; }));
    form.querySelectorAll('[data-variavel]').forEach((b) => b.addEventListener('mousedown', (e) => e.preventDefault())); // não tira o foco do campo
    form.querySelectorAll('[data-variavel]').forEach((b) => b.addEventListener('click', () => inserirVariavel(form, b.dataset.variavel)));
    form.querySelectorAll('[data-paleta]').forEach((b) => b.addEventListener('click', () => {
      const p = PALETAS[Number(b.dataset.paleta)];
      Object.assign(estado.rascunho.aparencia, { corPrimaria: p.primaria, corDestaque: p.destaque });
      [['aparencia.corPrimaria', p.primaria], ['aparencia.corDestaque', p.destaque]].forEach(([nome, cor]) => {
        form.querySelector(`[name="${nome}"]`).value = cor;
        form.querySelector(`[data-cor-de="${nome}"]`).value = cor.toLowerCase();
      });
      atualizarAmostras();
      marcarSujo();
      agendarPrevia();
    }));
    form.querySelector('[data-add-assinatura]')?.addEventListener('click', () => {
      const ass = estado.rascunho.frente.assinaturas;
      ass.push({ nome: '', cargo: '' });
      marcarSujo();
      render();
      tela.querySelector(`[name="frente.assinaturas.${ass.length - 1}.nome"]`)?.focus();
    });
    form.querySelectorAll('[data-remover-assinatura]').forEach((b) => b.addEventListener('click', () => {
      estado.rascunho.frente.assinaturas.splice(Number(b.dataset.removerAssinatura), 1);
      marcarSujo();
      render();
    }));
  }

  function salvar() {
    const r = Aulor.salvarConteudoModelo(id, estado.rascunho);
    if (r.erros) {
      const aba = r.erros[0].campo.split('.')[0];
      if (aba !== estado.aba) trocarAba(aba);
      mostrarErros(tela.querySelector('#form-modelo'), r.erros.filter((x) => x.campo.startsWith(`${aba}.`)));
      toast(r.erros.length === 1 ? 'Um campo precisa de ajuste' : `${r.erros.length} campos precisam de ajuste`, 'erro');
      return;
    }
    iniciarRascunho();
    render();
    toast('Modelo salvo');
  }

  function ativar() {
    const m = modelo();
    const r = Aulor.atualizarDadosModelo(m.id, { nome: m.nome, descricao: m.descricao, status: 'ativo' });
    if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
    toast('Modelo ativo: os cursos já podem escolhê-lo');
    render();
  }

  function duplicar() {
    if (estado.sujo) { toast('Salve ou descarte as alterações antes de duplicar', 'alerta'); return; }
    const r = Aulor.duplicarModelo(id);
    if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
    location.href = urlModelo(r.modelo.id);
  }

  if (modelo()) iniciarRascunho();
  render();
  window.addEventListener('beforeunload', (e) => { if (estado.sujo) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', (e) => {
    if (!podeEditar || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 's') return;
    e.preventDefault();
    if (estado.sujo) salvar();
  });
})();
