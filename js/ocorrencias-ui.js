// ============================================================
// Helpers de UI das OCORRÊNCIAS DO ALUNO, compartilhados pela lista geral
// (ocorrencias.html) e pela aba Ocorrências do aluno (aluno.html).
//
// Um ÚNICO global (`OcorrenciasUi`), sem `const` de topo: js/clientes-app.js
// declara BOTAO_PRI/CARTAO/TH/TD/PILULA/ICONE no escopo global e redeclarar
// quebraria a página. Depende de ocorrencias-data.js, ocorrencias-motor.js e
// de abrirModal/fecharModal (js/avaliacoes-ui.js). Se js/ui-form.js estiver
// carregado, o seletor de aluno usa o combobox com busca (campoCombo).
//
//   OcorrenciasUi.tipoHtml(tipo)                       chip colorido do tipo (o único chip da linha)
//   OcorrenciasUi.linhaTempoHtml(itens, ctx)           linha do tempo da aba do aluno
//   OcorrenciasUi.abrirFormulario({ … })               modal de nova/editar ocorrência
//   OcorrenciasUi.confirmarExclusao({ … })             modal vermelho de exclusão
// ============================================================

const OcorrenciasUi = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, s, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
  const nomeAluno = (a) => (a ? a.nomeSocial || a.nome || '' : '');
  const { fmtData, fmtDataHora } = Ocorrencias;

  const ESTILO = {
    BOTAO_SEC: 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none',
    BOTAO_PRI: 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 disabled:opacity-40 disabled:pointer-events-none',
    BOTAO_CANCELAR: 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition',
    BOTAO_LINK: 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline',
    BOTAO_ICONE: 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-30 disabled:pointer-events-none',
    BOTAO_PERIGO: 'px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40',
    CAMPO_BUSCA: 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20',
    SELECT_FILTRO: 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400',
    CARTAO: 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]',
    TH: 'px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900',
    TD: 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300 align-top',
    ERRO: (campo) => `<p data-erro="${esc(campo)}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`,
    OPCIONAL: '<span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>',
  };
  ESTILO.BOTAO_ICONE_VERMELHO = `${ESTILO.BOTAO_ICONE} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;

  const svg = (paths, classe = 'h-4 w-4', largura = '1.8') => `<svg class="${classe}" fill="none" viewBox="0 0 24 24" stroke-width="${largura}" stroke="currentColor" aria-hidden="true">${paths}</svg>`;
  const path = (d) => `<path stroke-linecap="round" stroke-linejoin="round" d="${d}" />`;
  const ICONE = {
    lapis: svg(path('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z')),
    lixeira: svg(path('M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0')),
    mais: svg(path('M12 4.5v15m7.5-7.5h-15'), 'h-4 w-4', '2'),
    lupa: svg(path('M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z'), 'h-4 w-4', '2'),
    fechar: svg(path('M6 18L18 6M6 6l12 12'), 'h-5 w-5', '2'),
    externo: svg(path('M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'), 'h-3.5 w-3.5', '2'),
    pessoa: svg(path('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'), 'h-3.5 w-3.5'),
    conversa: svg(path('M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z'), 'h-3.5 w-3.5'),
  };

  // Cor do chip por tipo (TIPOS_OCORRENCIA[].cor). Um chip por linha: só o tipo.
  const PILULA_COR = {
    violeta: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    ambar: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    petrol: 'bg-petrol-800/10 text-petrol-800 border-petrol-800/20 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    vermelha: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    verde: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    rosa: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800',
    neutra: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700',
  };
  function tipoHtml(tipo) {
    const t = Ocorrencias.tipoDe(tipo) ?? { nome: tipo, descricao: '', cor: 'neutra' };
    return `<span title="${esc(t.descricao)}" class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${PILULA_COR[t.cor] ?? PILULA_COR.neutra}">${esc(t.nome)}</span>`;
  }
  const canalNome = (id) => Ocorrencias.canalDe(id)?.nome ?? '';

  // ---------- Formulário ----------

  const rotulo = (texto, opcional = false) => `<label class="rotulo">${texto} ${opcional ? ESTILO.OPCIONAL : ''}</label>`;
  const select = (name, opcoes, valor, { vazio = 'Escolha', vazioValor = '', desabilitado = false, id = `f-oc-${name}` } = {}) => `
    <select id="${id}" name="${name}" class="campo" ${desabilitado ? 'disabled' : ''}>
      <option value="${esc(vazioValor)}" ${valor ? '' : 'selected'}>${esc(vazio)}</option>
      ${opcoes.map((o) => `<option value="${esc(o.id)}" ${valor === o.id ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>`;

  const opcoesTurma = (turmas) => turmas.map((t) => ({ id: t.id, nome: `${t.codigo}${t.curso ? ` · ${t.curso}` : ''}` }));
  const selectTurma = (turmas, valor) => (turmas.length
    ? select('turmaId', opcoesTurma(turmas), valor ?? '', { vazio: 'Sem turma específica' })
    : select('turmaId', [], '', { vazio: 'Sem turma específica' }));
  const selectResponsavel = (responsaveis, valor) => (responsaveis.length
    ? select('responsavelId', responsaveis.map((r) => ({ id: r.id, nome: r.nome })), valor ?? '', { vazio: 'Não informado' })
    : select('responsavelId', [], '', { vazio: 'Nenhum responsável vinculado', desabilitado: true }));

  // Seletor de aluno: combobox com busca (js/ui-form.js) quando disponível; senão um <select>.
  function campoAluno(alunos, valor) {
    const opcoes = alunos.map((a) => ({ id: a.id, nome: nomeAluno(a), descricao: a.cpf ? String(a.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '' }));
    if (typeof campoCombo === 'function') return campoCombo('alunoId', opcoes, valor ?? '', { id: 'f-oc-alunoId', vazio: 'Buscar aluno por nome ou CPF' });
    return select('alunoId', opcoes, valor ?? '', { vazio: 'Escolha o aluno', id: 'f-oc-alunoId' });
  }

  // Corpo do modal. `registro` = ocorrência em edição (ou null); `inicial` = pré-preenchimento vindo da URL.
  function formularioHtml({ registro = null, inicial = {}, aluno = null, alunos = [], turmas = [], responsaveis = [] }) {
    const v = { tipo: '', turmaId: '', canal: '', responsavelId: '', texto: '', em: Ocorrencias.agora(), ...inicial, ...(registro ?? {}) };
    const contato = Ocorrencias.ehContato(v.tipo);
    const autor = registro ? `Registrado por <strong class="text-slate-700 dark:text-neutral-200">${esc(registro.autor?.nome ?? '')}</strong>${registro.editadoEm ? ` · editado em ${fmtDataHora(registro.editadoEm)}` : ''}` : `Registrado por <strong class="text-slate-700 dark:text-neutral-200">${esc(Ocorrencias.AUTOR_PADRAO.nome)}</strong>`;
    return `
      ${aluno ? `<input type="hidden" name="alunoId" value="${esc(aluno.id)}">` : `
      <div>
        ${rotulo('Aluno')}
        ${campoAluno(alunos, v.alunoId)}
        ${ESTILO.ERRO('alunoId')}
      </div>`}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          ${rotulo('Tipo')}
          ${select('tipo', Ocorrencias.TIPOS, v.tipo, { vazio: 'Escolha o tipo' })}
          ${ESTILO.ERRO('tipo')}
        </div>
        <div>
          ${rotulo('Data e hora')}
          <input id="f-oc-em" name="em" type="datetime-local" class="campo" value="${esc(v.em)}" max="${esc(Ocorrencias.agora())}">
          ${ESTILO.ERRO('em')}
        </div>
        <div>
          ${rotulo('Turma', true)}
          <div data-oc-turma>${selectTurma(turmas, v.turmaId)}</div>
          ${ESTILO.ERRO('turmaId')}
        </div>
        <div data-oc-canal class="${contato ? '' : 'hidden'}">
          ${rotulo('Canal', true)}
          ${select('canal', Ocorrencias.CANAIS, v.canal ?? '', { vazio: 'Não informado' })}
          ${ESTILO.ERRO('canal')}
        </div>
        <div data-oc-responsavel class="sm:col-span-2 ${v.tipo === 'contato_responsavel' ? '' : 'hidden'}">
          ${rotulo('Responsável contatado', true)}
          <div data-oc-responsavel-campo>${selectResponsavel(responsaveis, v.responsavelId)}</div>
          ${ESTILO.ERRO('responsavelId')}
        </div>
      </div>
      <div>
        ${rotulo('O que aconteceu')}
        <textarea id="f-oc-texto" name="texto" rows="5" maxlength="${Ocorrencias.TEXTO_MAX}" class="campo resize-y" placeholder="Quem falou com quem, o que foi combinado, prazos.">${esc(v.texto)}</textarea>
        ${ESTILO.ERRO('texto')}
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400">${autor}</p>`;
  }

  // Mostra/esconde canal e responsável conforme o tipo; troca turmas/responsáveis quando muda o aluno (lista geral).
  function ligarFormulario(form, { turmasDe = null, responsaveisDe = null } = {}) {
    const tipo = form.querySelector('[name="tipo"]');
    const aplicarTipo = () => {
      const t = tipo.value;
      form.querySelector('[data-oc-canal]').classList.toggle('hidden', !Ocorrencias.ehContato(t));
      form.querySelector('[data-oc-responsavel]').classList.toggle('hidden', t !== 'contato_responsavel');
    };
    tipo.addEventListener('change', aplicarTipo);
    const alunoCampo = form.querySelector('[name="alunoId"]');
    const escolhivel = alunoCampo && (alunoCampo.type !== 'hidden' || alunoCampo.closest('[data-combo]'));
    if (escolhivel) {
      alunoCampo.addEventListener('change', () => {
        const id = alunoCampo.value;
        if (turmasDe) form.querySelector('[data-oc-turma]').innerHTML = selectTurma(turmasDe(id), '');
        if (responsaveisDe) form.querySelector('[data-oc-responsavel-campo]').innerHTML = selectResponsavel(responsaveisDe(id), '');
      });
    }
  }

  // Só os campos visíveis entram (canal/responsável escondidos não vão para o motor).
  function lerFormulario(form) {
    const fd = new FormData(form);
    const tipo = String(fd.get('tipo') ?? '');
    const dados = { alunoId: String(fd.get('alunoId') ?? ''), tipo, turmaId: String(fd.get('turmaId') ?? '') || null, texto: String(fd.get('texto') ?? ''), em: String(fd.get('em') ?? '') };
    dados.canal = Ocorrencias.ehContato(tipo) ? (String(fd.get('canal') ?? '') || null) : null;
    dados.responsavelId = tipo === 'contato_responsavel' ? (String(fd.get('responsavelId') ?? '') || null) : null;
    return dados;
  }

  function mostrarErros(form, erros) {
    form.querySelectorAll('[data-erro]').forEach((p) => { p.classList.add('hidden'); p.textContent = ''; });
    form.querySelectorAll('.campo-erro').forEach((c) => c.classList.remove('campo-erro'));
    if (!erros.length) return false;
    const alvo = (campo) => (campo?.type === 'hidden' ? campo.closest('[data-combo]')?.querySelector('[data-combo-gatilho]') : campo);
    erros.forEach((erro) => {
      const p = form.querySelector(`[data-erro="${erro.campo}"]`);
      if (p) { p.textContent = erro.mensagem; p.classList.remove('hidden'); }
      alvo(form.querySelector(`[name="${erro.campo}"]`))?.classList.add('campo-erro');
    });
    alvo(form.querySelector(`[name="${erros[0].campo}"]`))?.focus();
    return true;
  }

  // Modal-formulário próprio (centralizado), em cima de abrirModal (avaliacoes-ui.js): a lista e a aba do
  // aluno têm modalFormulario diferentes (ui-form.js × clientes-app.js), então este não depende de nenhum.
  function modalFormulario({ id, titulo, subtitulo, corpo, rotulo: rotuloBotao, largura = 'max-w-2xl', aoSalvar, foco }) {
    const root = abrirModal(`
      <form id="${id}" novalidate class="flex flex-col max-h-[calc(100vh-2rem)] min-h-0">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
          <div>
            <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
          </div>
          <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">${corpo}</div>
        <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
          <button type="button" data-fechar-modal class="${ESTILO.BOTAO_CANCELAR}">Cancelar</button>
          <button type="submit" class="${ESTILO.BOTAO_PRI}">${rotuloBotao}</button>
        </div>
      </form>`, largura);
    const form = root.querySelector(`#${id}`);
    if (typeof ativarCombos === 'function') ativarCombos(form);
    const fechar = () => { if (typeof fecharCombo === 'function') fecharCombo(); fecharModal(); };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const erros = aoSalvar(form) ?? [];
      if (mostrarErros(form, erros)) return;
      fechar();
    });
    if (foco) form.querySelector(foco)?.focus();
    return { form, fechar };
  }

  // Nova ou editar. `aluno` fixo (aba do aluno) OU `alunos` para escolher (lista geral, com busca).
  // `turmasDe(alunoId)` → [{ id, codigo, curso }], `responsaveisDe(alunoId)` → [{ id, nome }].
  // `aoSalvar(dados)` devolve erros[] (fica aberto) ou nada (fecha).
  function abrirFormulario({ registro = null, inicial = {}, aluno = null, alunos = [], turmasDe = () => [], responsaveisDe = () => [], aoSalvar }) {
    const alunoId = aluno?.id ?? registro?.alunoId ?? '';
    const editando = Boolean(registro);
    const { form } = modalFormulario({
      id: 'form-ocorrencia',
      titulo: editando ? 'Editar ocorrência' : 'Nova ocorrência',
      subtitulo: aluno ? `Registro da coordenação sobre <strong>${esc(nomeAluno(aluno))}</strong>. Não aparece nos portais do aluno nem do professor.` : 'Registro da coordenação sobre um aluno. Não aparece nos portais do aluno nem do professor.',
      rotulo: editando ? 'Salvar' : 'Registrar',
      corpo: formularioHtml({ registro, inicial, aluno, alunos, turmas: alunoId ? turmasDe(alunoId) : [], responsaveis: alunoId ? responsaveisDe(alunoId) : [] }),
      aoSalvar: (f) => aoSalvar(lerFormulario(f)),
      foco: aluno || editando ? '[name="tipo"]' : null,
    });
    ligarFormulario(form, { turmasDe, responsaveisDe });
    if (!aluno && !editando) form.querySelector('#f-oc-alunoId')?.focus();
    return form;
  }

  function confirmarExclusao({ registro, nomeAluno: nome, aoConfirmar }) {
    const t = Ocorrencias.tipoDe(registro.tipo);
    const root = abrirModal(`
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir ocorrência</h3></div>
      <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
        <p>Excluir a ocorrência <strong>${esc(t?.nome ?? registro.tipo)}</strong> de <strong>${esc(nome)}</strong>, registrada em ${fmtDataHora(registro.em)} por ${esc(registro.autor?.nome ?? '')}?</p>
        <p class="text-slate-500 dark:text-neutral-400">O registro some do histórico do aluno. Não dá para desfazer.</p>
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${ESTILO.BOTAO_CANCELAR}">Cancelar</button>
        <button type="button" id="btn-confirmar-oc" class="${ESTILO.BOTAO_PERIGO}">Excluir</button>
      </div>`);
    root.querySelector('#btn-confirmar-oc').addEventListener('click', () => { fecharModal(); aoConfirmar(); });
  }

  // ---------- Linha do tempo (aba do aluno) ----------

  // `ctx.turmaDe(id)` → { id, codigo, curso } | null; `ctx.responsavelDe(id)` → { id, nome } | null.
  function linhaTempoHtml(itens, { turmaDe = () => null, responsavelDe = () => null } = {}) {
    if (!itens.length) return `<div class="${ESTILO.CARTAO} p-10 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma ocorrência registrada para este aluno.</div>`;
    const item = (o) => {
      const t = o.turmaId ? turmaDe(o.turmaId) : null;
      const r = o.responsavelId ? responsavelDe(o.responsavelId) : null;
      const meta = [
        `<span title="Quem registrou">${ICONE.pessoa} ${esc(o.autor?.nome ?? '')}</span>`,
        t ? `<span title="${esc(t.curso ?? '')}"><a href="turma.html?id=${encodeURIComponent(t.id)}" target="_blank" class="font-mono text-petrol-800 dark:text-sky-300 hover:underline">${esc(t.codigo)}</a></span>` : (o.turmaId ? `<span class="font-mono">${esc(o.turmaId)}</span>` : ''),
        o.canal ? `<span title="Canal">${ICONE.conversa} ${esc(canalNome(o.canal))}</span>` : '',
        r ? `<span title="Responsável contatado">com <a href="responsavel.html?id=${encodeURIComponent(r.id)}" target="_blank" class="text-petrol-800 dark:text-sky-300 hover:underline">${esc(r.nome)}</a></span>` : (o.responsavelId ? `<span>com ${esc(o.responsavelId)}</span>` : ''),
        o.editadoEm ? `<span class="text-slate-400" title="Editado em ${esc(fmtDataHora(o.editadoEm))}">editado</span>` : '',
      ].filter(Boolean).join('<span class="text-slate-300 dark:text-neutral-700">·</span>');
      return `
        <li class="relative pl-6" data-ocorrencia="${esc(o.id)}">
          <span class="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-petrol-800 dark:bg-sky-400 ring-4 ring-white dark:ring-neutral-950"></span>
          <div class="${ESTILO.CARTAO} px-4 py-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium tabular-nums text-slate-800 dark:text-neutral-100">${fmtDataHora(o.em)}</span>
                ${tipoHtml(o.tipo)}
              </div>
              <div class="flex items-center gap-0.5">
                <button type="button" data-oc-editar="${esc(o.id)}" class="${ESTILO.BOTAO_ICONE}" title="Editar ocorrência">${ICONE.lapis}</button>
                <button type="button" data-oc-excluir="${esc(o.id)}" class="${ESTILO.BOTAO_ICONE_VERMELHO}" title="Excluir ocorrência">${ICONE.lixeira}</button>
              </div>
            </div>
            <p class="mt-2 text-sm text-slate-700 dark:text-neutral-200 whitespace-pre-line">${esc(o.texto)}</p>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1">${meta}</div>
          </div>
        </li>`;
    };
    return `<ol class="relative space-y-3 before:absolute before:left-[4px] before:top-3 before:bottom-3 before:w-px before:bg-slate-200 dark:before:bg-neutral-800">${itens.map(item).join('')}</ol>`;
  }

  return { ESTILO, ICONE, PILULA_COR, esc, plural, nomeAluno, fmtData, fmtDataHora, tipoHtml, canalNome, formularioHtml, ligarFormulario, lerFormulario, mostrarErros, modalFormulario, abrirFormulario, confirmarExclusao, linhaTempoHtml };
})();
