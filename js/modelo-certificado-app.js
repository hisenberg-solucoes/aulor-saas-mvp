// ============================================================
// Editor de um modelo de certificado (modelo-certificado.html?id=).
// Abas: Aparência | Frente | Verso | Onde é usado. Os campos editam um
// rascunho em memória com prévia ao vivo (dados de exemplo); "Salvar"
// valida e grava no motor, "Descartar" volta ao que estava salvo.
// Cabeçalho da ficha: miniatura da frente no lugar do avatar, "Editar dados"
// à vista e o resto no "Mais".
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

  const OPCAO = 'relative cursor-pointer rounded-lg border p-3 transition border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--f-foco)] has-[:disabled]:opacity-60 has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:border-slate-300 dark:has-[:disabled]:hover:border-neutral-700';
  const ajuda = (texto) => (texto ? `<p class="text-xs ${APOIO} mt-1">${texto}</p>` : '');

  function campoTexto(caminho, rotulo, { opcional = false, linhas = 0, max = 200, dica = '', placeholder = '' } = {}) {
    const attrs = `id="c-${caminho}" name="${caminho}" maxlength="${max}" data-texto placeholder="${esc(placeholder)}"`;
    return `
      <div>
        <label class="rotulo" for="c-${caminho}">${rotulo}${opcional ? ` ${OPCIONAL}` : ''}</label>
        ${linhas ? `<textarea ${attrs} rows="${linhas}" class="campo resize-y leading-relaxed">${esc(ler(caminho) ?? '')}</textarea>` : `<input ${attrs} value="${esc(ler(caminho) ?? '')}" class="campo">`}
        ${ajuda(dica)}
        ${ERRO(caminho)}
      </div>`;
  }

  function caixa(caminho, rotulo, dica = '') {
    return `
      <label class="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" name="${caminho}" class="check mt-0.5" ${ler(caminho) ? 'checked' : ''}>
        <span><span class="text-sm text-slate-800 dark:text-neutral-100">${rotulo}</span>${dica ? `<span class="block text-xs ${APOIO}">${dica}</span>` : ''}</span>
      </label>`;
  }

  function campoCor(caminho, rotulo) {
    const v = ler(caminho);
    return `
      <div>
        <label class="rotulo" for="c-${caminho}">${rotulo}</label>
        <div class="flex items-center gap-2">
          <input type="color" value="${esc(v)}" data-cor-de="${caminho}" aria-label="${rotulo}: abrir o seletor de cor" class="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-0.5">
          <input id="c-${caminho}" name="${caminho}" value="${esc(v)}" maxlength="7" spellcheck="false" autocomplete="off" class="campo font-mono uppercase tabular-nums min-w-0" placeholder="#RRGGBB">
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
            <span><span class="block text-sm font-medium ${TITULO}">${esc(o.nome)}</span><span class="block text-xs ${APOIO} mt-0.5">${esc(o.descricao)}</span></span>
          </label>`).join('')}
        </div>
        ${ERRO(`aparencia.${campo}`)}
      </fieldset>`;
  }

  // Cartão do formulário: título, frase de contexto e os campos; sem divisória entre cabeçalho e corpo.
  const secao = (titulo, contexto, corpo) => cartao({ titulo, contexto, corpo: `<div class="p-4 space-y-4">${corpo}</div>` });

  // Variáveis ao lado da prévia: clique insere no último campo de texto focado.
  function painelVariaveis() {
    return `
      <section class="painel p-4 mt-4">
        <h3 class="text-[15px] font-semibold ${TITULO}">Variáveis</h3>
        <p class="mt-0.5 text-xs ${APOIO}">Clique para inserir no campo em que você estava escrevendo. Na emissão, cada uma vira o dado do aluno.</p>
        <ul class="mt-3 flex flex-wrap gap-1.5">${Certificado.VARIAVEIS.map(([v, nome]) => `
          <li><button type="button" data-variavel="${v}" title="${esc(nome)}" class="inline-flex items-center h-7 px-2 rounded-md bg-[color:var(--f-etiqueta)] text-[color:var(--f-etiqueta-tinta)] font-mono text-xs hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-[color:var(--f-selecao)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/40 disabled:pointer-events-none disabled:opacity-60" ${podeEditar ? '' : 'disabled'}>{{${v}}}</button></li>`).join('')}
        </ul>
      </section>`;
  }

  // ---------- Abas do formulário ----------

  function formAparencia() {
    const a = estado.rascunho.aparencia;
    const folhinha = (o) => `<span class="flex h-9 items-end text-slate-400 dark:text-neutral-500"><span class="block rounded-[3px] border-2 border-current bg-white dark:bg-neutral-950" style="${o.id === 'retrato' ? 'width:24px;height:34px' : 'width:34px;height:24px'}"></span></span>`;
    // A amostra da fonte é conteúdo da folha: usa a fonte do modelo, não a do sistema.
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
            <button type="button" data-paleta="${i}" class="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-neutral-800 h-7 pl-1.5 pr-2.5 text-xs text-slate-600 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/40">
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
        ${campoTexto('frente.corpo', 'Texto', { linhas: 4, max: 600, dica: 'Diga o que foi concluído, quando e com que carga horária. <code class="font-mono">**trecho**</code> sai em negrito. As variáveis estão ao lado da prévia.' })}`)}
      ${secao('Rodapé', 'O código de validação sai sempre, abaixo do local e data.',
        campoTexto('frente.localData', 'Local e data', { opcional: true, max: 120, placeholder: '{{cidade}}, {{dataEmissao}}.' }))}
      ${secao('Assinaturas', 'De 1 a 3. Nome e cargo aceitam variáveis (ex.: {{professor}}).', `
        <div class="divide-y divide-slate-100 dark:divide-neutral-900 -my-4">
          ${ass.map((s, i) => `
            <div class="py-4 space-y-3">
              <div class="flex items-center justify-between gap-2 min-h-8"><p class="text-sm font-medium ${TITULO}">Assinatura ${i + 1}</p>${ass.length > 1 ? `<button type="button" data-remover-assinatura="${i}" class="btn-fantasma -mr-2.5 text-red-700 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40">Remover</button>` : ''}</div>
              <div class="grid grid-cols-2 gap-3">
                ${campoTexto(`frente.assinaturas.${i}.nome`, 'Nome', { max: 80, placeholder: i ? '{{professor}}' : 'Nome de quem assina' })}
                ${campoTexto(`frente.assinaturas.${i}.cargo`, 'Cargo', { opcional: true, max: 80, placeholder: i ? 'Professor(a) do curso' : 'Diretora' })}
              </div>
            </div>`).join('')}
          ${ass.length < 3 ? `<div class="py-4"><button type="button" data-add-assinatura class="btn-sec">${ICONE.mais}Adicionar assinatura</button></div>` : ''}
        </div>
        ${ERRO('frente.assinaturas')}`)}`;
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
        </div>`)}`;
  }

  // ---------- Prévia ----------

  // A folha fica direto sobre o fundo, como papel na mesa; retrato limita a largura para caber na altura da tela.
  function folhasPrevia() {
    const m = doRascunho();
    const dados = Certificado.dadosExemplo();
    const retrato = m.aparencia.orientacao === 'retrato';
    const lados = estado.aba === 'frente' ? ['frente'] : estado.aba === 'verso' ? ['verso'] : ['frente', 'verso'];
    const largura = retrato ? 'style="max-width: calc((100vh - 240px) * 210 / 297)"' : '';
    return `<div class="space-y-4">${lados.map((lado) => {
      const html = Certificado.folhas(dados, { modelo: m, lados: [lado] });
      return `<figure class="mx-auto min-w-0" ${largura}>${lados.length > 1 ? `<figcaption class="mb-1 text-xs font-medium ${APOIO_FUNDO}">${lado === 'frente' ? 'Frente' : 'Verso'}</figcaption>` : ''}${html || `
        <div class="grid ${retrato ? 'aspect-[210/297]' : 'aspect-[297/210]'} place-items-center rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 p-6 text-center text-sm ${APOIO_FUNDO}">Sem verso: o certificado sai só com a frente.</div>`}</figure>`;
    }).join('')}</div>`;
  }

  function previa() {
    const orientacao = Aulor.OPCOES_MODELO.orientacao.find((o) => o.id === doRascunho().aparencia.orientacao)?.nome;
    return `
      <div class="mb-2 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-medium ${TITULO}">Prévia${estado.aba === 'frente' ? ' da frente' : estado.aba === 'verso' ? ' do verso' : ''}</h3>
          <p class="text-xs ${APOIO_FUNDO}">Com dados de exemplo · ${esc(orientacao)}, A4</p>
        </div>
        <button type="button" data-imprimir class="btn-fantasma -mr-2.5" title="Abre a impressão com a frente e o verso, como estão agora">${ICONE.imprimir}Imprimir prévia</button>
      </div>
      <div data-folhas>${folhasPrevia()}</div>`;
  }

  // ---------- Onde é usado ----------

  function abaUsos(m) {
    const escolheram = Aulor.cursosDoModelo(m.id);
    const emitidos = Aulor.emitidosComModelo(m.id).sort((a, b) => b.emitidoEm.localeCompare(a.emitidoEm));
    const item = (href, nome, extra) => `<li class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0"><a href="${href}" class="text-sm font-medium link">${esc(nome)}</a><span class="text-xs ${APOIO}">${extra}</span></li>`;
    const itemCurso = (c, nota = '') => item(`curso.html?id=${c.id}`, c.nome, nota || `<span class="font-mono">${esc(c.codigo)}</span> · ${c.cargaHoraria} h`);
    const lista = (itens, vazioTxt) => (itens.length ? `<ul class="divide-y divide-slate-100 dark:divide-neutral-900">${itens.join('')}</ul>` : `<p class="text-sm ${APOIO}">${vazioTxt}</p>`);
    const aviso = m.status !== 'ativo' && escolheram.length ? `<p class="text-xs ${AVISO}">Enquanto ${m.status === 'rascunho' ? 'for rascunho' : 'estiver inativo'}, estes cursos emitem com o padrão da escola.</p>` : '';
    return `
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        ${secao('Como o modelo é escolhido', '', `
          <ol class="text-sm text-slate-700 dark:text-neutral-200 space-y-1.5 list-decimal pl-5 marker:text-slate-500 dark:marker:text-neutral-400">
            <li>O curso escolhe o modelo no próprio cadastro, em Editar.</li>
            <li>Sem escolha, ou com o escolhido em rascunho ou inativo, vale o padrão da escola${m.padrao ? ', que é este' : ''}.</li>
            <li>Cada certificado guarda a cópia do modelo do dia da emissão: editar aqui não muda nenhum deles.</li>
          </ol>`)}
        ${m.padrao ? secao('Cursos sem modelo próprio', 'Emitem com o padrão da escola, que é este.', lista(cursosNoPadrao().map((c) => itemCurso(c, c.modeloCertificadoId ? 'escolheu um modelo fora de uso' : '')), 'Todos os cursos escolheram um modelo próprio.')) : ''}
        ${secao('Cursos que escolheram este modelo', '', `${lista(escolheram.map((c) => itemCurso(c)), 'Nenhum curso escolheu este modelo ainda.')}${aviso}`)}
        ${secao('Certificados emitidos com este modelo', plural(emitidos.length, 'certificado', 'certificados'), `
          ${lista(emitidos.slice(0, 8).map((c) => item(`certificado.html?id=${c.id}`, c.dados.aluno, `${esc(c.dados.curso)} · ${dataBr(c.emitidoEm)}${c.status === 'valido' ? '' : ' · cancelado'}`)), 'Nenhum certificado emitido com este modelo ainda.')}
          ${emitidos.length > 8 ? `<p class="text-xs ${APOIO}">E mais ${emitidos.length - 8}. <a class="link" href="certificados.html?aba=emitidos">Ver todos os emitidos</a></p>` : ''}`)}
      </div>`;
  }

  // ---------- Página ----------

  // Uma ação à vista ("Editar dados"); padrão, duplicar e excluir no "Mais", com o motivo quando travados.
  function itensMais(m) {
    const motivo = motivoNaoExcluir(m);
    return [
      m.padrao
        ? { nome: 'Definir como padrão', desabilitado: true, detalhe: 'Já é o padrão da escola', acao: () => {} }
        : m.status !== 'ativo'
          ? { nome: 'Definir como padrão', desabilitado: true, detalhe: 'Ative o modelo antes', acao: () => {} }
          : { nome: 'Definir como padrão', detalhe: 'Vale para todo curso que não escolheu outro modelo', acao: () => confirmarPadrao(modelo(), render) },
      estado.sujo
        ? { nome: 'Duplicar', desabilitado: true, detalhe: 'Salve ou descarte as alterações antes: a cópia sai do que está salvo', acao: () => {} }
        : { nome: 'Duplicar', detalhe: 'Cópia em rascunho com a mesma aparência, frente e verso', acao: duplicar },
      'sep',
      { nome: 'Excluir modelo', perigo: true, desabilitado: Boolean(motivo), detalhe: motivo || 'Cursos que o escolheram voltam ao padrão; os emitidos não mudam', acao: () => confirmarExclusaoModelo(modelo(), () => { estado.sujo = false; location.href = 'templates-certificado.html'; }) },
    ];
  }

  function cabecalho(m) {
    const emitidos = Aulor.emitidosComModelo(m.id).length;
    return cabecalhoFicha({
      trilha: [{ rotulo: 'Modelos de certificado', href: 'templates-certificado.html' }, { rotulo: esc(m.nome) }],
      avatar: `<div data-miniatura>${Certificado.miniatura(doRascunho(), { altura: 48 })}</div>`,
      nome: esc(m.nome),
      pilulas: pilulasModelo(m, { status: false }), // rascunho e inativo vão na faixa (Regra do Dito uma Vez)
      descricao: esc(m.descricao ?? ''),
      chips: [
        chip(ICONE.pessoas, esc(usoResumo(m))),
        chip(ICONE.tag, emitidos ? plural(emitidos, 'certificado emitido', 'certificados emitidos') : 'Nenhum emitido'),
        chip(ICONE.relogio, `Atualizado em ${dataBr(m.atualizadoEm)}`),
      ],
      acoes: podeEditar ? `<button type="button" data-dados class="btn-sec">${ICONE.editar}Editar dados</button>` : '',
      mais: podeEditar ? itensMais(m) : null,
    });
  }

  // Faixa só quando alguém precisa agir: rascunho pede a ativação; inativo, a reativação.
  function faixaStatus(m) {
    if (!podeEditar) return `<p class="mb-4 text-sm ${APOIO_FUNDO}">Somente leitura: seu perfil não edita as configurações. A prévia e a impressão continuam disponíveis.</p>`;
    if (m.status === 'rascunho') return faixa('passo', '<span class="font-medium">Rascunho:</span> os cursos ainda não podem escolher este modelo. Ative quando a prévia estiver como você quer.', '<button type="button" data-ativar class="btn-pri btn-pequeno">Ativar</button>');
    if (m.status === 'inativo') return faixa('neutra', '<span class="font-medium">Inativo:</span> cursos que o escolheram emitem com o padrão da escola.', '<button type="button" data-ativar class="btn-sec btn-pequeno">Reativar</button>');
    return '';
  }

  // Abas sobre a linha de 1px; o aviso de alterações não salvas fica na mesma linha, fixo no topo ao rolar.
  function abas(m) {
    const emUso = Aulor.cursosDoModelo(m.id).length + (m.padrao ? cursosNoPadrao().length : 0);
    return `
      <div class="sticky -top-4 md:-top-6 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 mb-4 bg-fundo dark:bg-black">
        <nav class="flex items-end gap-4 overflow-x-auto overflow-y-hidden [scrollbar-width:none] shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800" aria-label="Partes do modelo">
          ${ABAS.map((a) => `<button type="button" data-aba="${a.id}" ${a.id === estado.aba ? 'aria-current="page"' : ''} class="aba ${a.id === estado.aba ? 'aba-ativa' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/40">${a.nome}${a.id === 'usos' && emUso ? ` <span class="ml-1 text-xs tabular-nums text-slate-600 dark:text-neutral-400">${emUso}</span>` : ''}</button>`).join('')}
          ${podeEditar ? `
          <div data-barra-salvar class="ml-auto pb-1.5 flex items-center gap-2 ${estado.sujo ? '' : 'invisible'}">
            <span role="status" class="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${AVISO}"><span class="h-1.5 w-1.5 rounded-full bg-[color:var(--f-cobre)]" aria-hidden="true"></span>Alterações não salvas</span>
            <button type="button" data-descartar class="btn-fantasma">Descartar</button>
            <button type="button" data-salvar class="btn-pri btn-pequeno" title="Salvar (Ctrl+S ou ⌘S)">Salvar</button>
          </div>` : ''}
        </nav>
      </div>`;
  }

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
        ${faixaStatus(m)}
        ${abas(m)}
        ${formulario ? `
          <div class="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
            <form id="form-modelo" novalidate class="xl:col-span-2 min-w-0"><fieldset class="space-y-4 min-w-0" ${podeEditar ? '' : 'disabled'}>${formulario()}</fieldset></form>
            <div class="xl:col-span-3 xl:sticky xl:top-10 min-w-0">
              <div data-previa>${previa()}</div>
              ${estado.aba === 'aparencia' ? '' : `<div ${estado.aba === 'verso' ? `data-grupo="verso.mostrar" class="${estado.rascunho.verso.mostrar ? '' : 'hidden'}"` : ''}>${painelVariaveis()}</div>`}
            </div>
          </div>` : abaUsos(m)}
      </div>`;
    ligar();
  }

  let timerPrevia = null;
  const agendarPrevia = () => {
    clearTimeout(timerPrevia);
    timerPrevia = setTimeout(() => {
      const f = tela.querySelector('[data-folhas]');
      if (f) f.innerHTML = folhasPrevia();
      const mini = tela.querySelector('[data-miniatura]');
      if (mini) mini.innerHTML = Certificado.miniatura(doRascunho(), { altura: 48 });
    }, 100);
  };
  function marcarSujo() {
    estado.sujo = true;
    tela.querySelector('[data-barra-salvar]')?.classList.remove('invisible');
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
    tela.querySelector('[data-mais]')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais(modelo())));
    tela.querySelector('[data-dados]')?.addEventListener('click', () => abrirDadosModelo(modelo(), () => { toast('Dados do modelo salvos'); render(); }));
    tela.querySelector('[data-ativar]')?.addEventListener('click', ativar);
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
    tela.querySelectorAll('[data-variavel]').forEach((b) => b.addEventListener('mousedown', (e) => e.preventDefault())); // não tira o foco do campo
    tela.querySelectorAll('[data-variavel]').forEach((b) => b.addEventListener('click', () => inserirVariavel(form, b.dataset.variavel)));
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
