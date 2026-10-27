// ============================================================
// Helpers de UI do DOSSIÊ DO ALUNO, compartilhados pelo admin (dossies.html,
// dossie.html, templates-dossie.html, template-dossie.html, abas em aluno/turma)
// e pelo Portal do Professor (dossies.html, dossie.html, aba na turma).
//
// Um ÚNICO global (`DossiesUi`), sem `const` de topo: js/turmas-app.js e
// js/clientes-app.js já declaram BOTAO_PRI/CARTAO/TH e redeclarar quebraria a
// página. Não depende de avaliacoes-ui.js (o portal não o carrega): `esc`,
// `fmtData` etc. são locais. Depende de dossies-data.js e dossies-motor.js.
//
//   DossiesUi.ESTILO.BOTAO_PRI …            classes prontas (cópia de templates-certificado-ui.js)
//   DossiesUi.campoFormHtml(campo, valor)   controle de preenchimento por tipo (name="campo-<id>")
//   DossiesUi.lerRespostas(form, template)  FormData → { campoId: valor tipado }
//   DossiesUi.consolidadoHtml(item)         seções em leitura + pareceres (item = Dossies.montar)
// ============================================================

const DossiesUi = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtData = (iso) => (iso ? `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}/${String(iso).slice(0, 4)}` : '—');
  const fmtDataHora = (iso) => (iso ? `${fmtData(iso)} ${String(iso).slice(11, 16)}`.trim() : '—');
  const plural = (n, s, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
  const fmtNum = (n, casas = 1) => (n == null || Number.isNaN(n) ? '—' : Number(n).toFixed(casas).replace('.', ','));
  const nomeAluno = (a) => (a ? a.nomeSocial || a.nome || '' : '');
  const iniciais = (nome) => String(nome ?? '').trim().split(/\s+/).filter(Boolean).map((p) => p[0]).filter((_, i, arr) => i === 0 || i === arr.length - 1).join('').toUpperCase() || '?';
  const vazio = (v) => v === undefined || v === null || v === '';

  const ESTILO = {
    BOTAO_SEC: 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none',
    BOTAO_PRI: 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 disabled:opacity-40 disabled:pointer-events-none',
    BOTAO_CANCELAR: 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition',
    BOTAO_LINK: 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline',
    BOTAO_ICONE: 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-30 disabled:pointer-events-none',
    BOTAO_PERIGO: 'px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40',
    CAMPO_BUSCA: 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20',
    SELECT_FILTRO: 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400',
    CARTAO: 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm',
    CARTAO_OPCAO: 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition',
    ABA_PRINCIPAL: (ativa) => `px-1 pb-2.5 -mb-px border-b-2 text-sm font-medium transition whitespace-nowrap ${ativa ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}`,
    TH: 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900',
    TD: 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300 align-middle',
    ERRO: (campo) => `<p data-erro="${esc(campo)}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`,
    OPCIONAL: '<span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>',
  };
  ESTILO.BOTAO_ICONE_VERMELHO = `${ESTILO.BOTAO_ICONE} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;

  const svg = (paths, classe = 'h-4 w-4', largura = '1.8') => `<svg class="${classe}" fill="none" viewBox="0 0 24 24" stroke-width="${largura}" stroke="currentColor">${paths}</svg>`;
  const path = (d) => `<path stroke-linecap="round" stroke-linejoin="round" d="${d}" />`;
  const ICONE = {
    lapis: svg(path('M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z')),
    lixeira: svg(path('M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0')),
    mais: svg(path('M12 4.5v15m7.5-7.5h-15'), 'h-4 w-4', '2'),
    lupa: svg(path('M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z'), 'h-4 w-4', '2'),
    fechar: svg(path('M6 18L18 6M6 6l12 12'), 'h-5 w-5', '2'),
    copiar: svg(path('M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75')),
    estrela: svg(path('M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z')),
    estrelaCheia: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" /></svg>',
    imprimir: svg(path('M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z')),
    seta: svg(path('M8.25 4.5l7.5 7.5-7.5 7.5'), 'h-3.5 w-3.5 text-slate-300 dark:text-neutral-600', '2'),
    externo: svg(path('M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'), 'h-3.5 w-3.5', '2'),
    enviar: svg(path('M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5')),
    sobe: svg(path('M4.5 15.75l7.5-7.5 7.5 7.5')),
    desce: svg(path('M19.5 8.25l-7.5 7.5-7.5-7.5')),
    olho: svg(path('M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z') + path('M15 12a3 3 0 11-6 0 3 3 0 016 0z')),
    dossie: svg(path('M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z')),
  };

  const TEXTO_ROTULO = 'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400';
  const CAMPO = 'campo w-full';

  // ---------- Catálogos ----------

  const situacaoDe = (id) => SITUACOES_DOSSIE.find((s) => s.id === id) ?? SITUACOES_DOSSIE[0];
  const situacaoHtml = (situacao, { texto = null } = {}) => {
    const s = situacaoDe(situacao);
    return `<span title="${esc(s.descricao)}" class="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 rounded-full shrink-0 ${s.ponto}"></span>${esc(texto ?? s.nome)}</span>`;
  };
  const statusTemplateHtml = (status) => {
    const s = STATUS_TEMPLATE_DOSSIE.find((x) => x.id === status) ?? STATUS_TEMPLATE_DOSSIE[1];
    return `<span title="${esc(s.descricao)}" class="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 rounded-full shrink-0 ${s.ponto}"></span>${esc(s.nome)}</span>`;
  };
  const periodicidadeNome = (id) => PERIODICIDADES_DOSSIE.find((p) => p.id === id)?.nome ?? id ?? '';
  const tipoCampoNome = (id) => TIPOS_CAMPO_DOSSIE.find((t) => t.id === id)?.nome ?? id ?? '';
  const escalaDe = (v) => ESCALA_DOSSIE.find((e) => e.valor === Math.round(Number(v))) ?? null;
  const PONTO_FREQ = { ok: 'bg-emerald-500', atencao: 'bg-amber-500', risco: 'bg-red-500', reprovado_frequencia: 'bg-red-500', sem_aulas: 'bg-slate-400' };
  const NOME_FREQ = { ok: 'Em dia', atencao: 'Atenção', risco: 'Em risco', reprovado_frequencia: 'Reprovado por frequência', sem_aulas: 'Sem aulas' };
  const INICIAL_P = { presente: 'P', atraso: 'A', justificada: 'J', ausente: 'F' };
  const COR_P = { P: 'text-emerald-600 dark:text-emerald-400', A: 'text-amber-600 dark:text-amber-400', J: 'text-sky-600 dark:text-sky-300', F: 'text-red-600 dark:text-red-400' };
  const NOME_P = { presente: 'Presente', atraso: 'Atraso', justificada: 'Falta justificada', ausente: 'Falta' };

  // ---------- Frequência ----------

  // 4 cartões: aulas no período · presenças válidas · faltas · % (ponto pelo status). `freq` = Dossies.frequenciaPeriodo (ou null).
  function frequenciaCardsHtml(freq, { minimo = null } = {}) {
    const cartao = (rotulo, valor, extra = '') => `<div class="${ESTILO.CARTAO} p-3"><p class="${TEXTO_ROTULO}">${rotulo}</p><p class="mt-1 text-xl font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-2">${valor}</p>${extra}</div>`;
    if (!freq) return `<div class="grid grid-cols-2 md:grid-cols-4 gap-3">${cartao('Aulas no período', '—')}${cartao('Presenças válidas', '—')}${cartao('Faltas', '—')}${cartao('Frequência', '—', '<p class="text-xs text-slate-400 mt-0.5">Presenças indisponíveis</p>')}</div>`;
    const min = minimo ?? freq.minimo;
    const pct = freq.percentual == null ? '—' : `${freq.percentual}%`;
    return `<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${cartao('Aulas no período', String(freq.dadas))}
      ${cartao('Presenças válidas', String(freq.validas), freq.atrasos || freq.justificadas ? `<p class="text-xs text-slate-400 mt-0.5">${[freq.atrasos ? plural(freq.atrasos, 'atraso') : '', freq.justificadas ? plural(freq.justificadas, 'justificada') : ''].filter(Boolean).join(' · ')}</p>` : '')}
      ${cartao('Faltas', String(freq.faltas), freq.semRegistro ? `<p class="text-xs text-slate-400 mt-0.5">${plural(freq.semRegistro, 'aula sem chamada', 'aulas sem chamada')}</p>` : '')}
      ${cartao('Frequência', `<span class="h-2.5 w-2.5 rounded-full shrink-0 ${PONTO_FREQ[freq.status] ?? 'bg-slate-400'}"></span>${pct}`, `<p class="text-xs text-slate-400 mt-0.5">${esc(NOME_FREQ[freq.status] ?? '')}${min ? ` · mínimo ${min}%` : ''}</p>`)}
    </div>`;
  }

  // Tabela data · conteúdo · P/A/J/F das aulas do período. `freq.aulas` = [{ aula, registro }]; `conteudo` opcional = Dossies.conteudoDoPeriodo.
  function aulasPeriodoHtml(freq, { conteudo = [] } = {}) {
    const aulas = freq?.aulas ?? [];
    if (!aulas.length) return `<div class="${ESTILO.CARTAO} p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma aula dada no período.</div>`;
    const conteudoDe = (data) => conteudo.find((c) => c.data === data);
    const linhas = aulas.map(({ aula, registro }) => {
      const ini = registro ? INICIAL_P[registro.status] ?? 'F' : 'F';
      const c = conteudoDe(aula.data);
      const texto = c ? (c.conteudo || c.modulos.join(', ')) : (aula.conteudo || '');
      return `<tr>
        <td class="${ESTILO.TD} whitespace-nowrap">${fmtData(aula.data)}${aula.n ? `<span class="text-xs text-slate-400 ml-1.5">aula ${aula.n}</span>` : ''}</td>
        <td class="${ESTILO.TD}">${texto ? esc(texto) : '<span class="text-slate-400">—</span>'}</td>
        <td class="${ESTILO.TD} text-center"><span title="${esc(registro ? NOME_P[registro.status] ?? '' : 'Sem chamada (conta como falta)')}" class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-neutral-900 text-sm font-semibold ${COR_P[ini]}">${ini}</span></td>
      </tr>`;
    });
    return `<div class="${ESTILO.CARTAO} overflow-hidden"><table class="w-full"><thead><tr><th class="${ESTILO.TH}">Data</th><th class="${ESTILO.TH}">Conteúdo</th><th class="${ESTILO.TH} text-center">Presença</th></tr></thead>
      <tbody class="[&>tr]:border-t [&>tr]:border-slate-100 dark:[&>tr]:border-neutral-900 [&>tr:nth-child(even)]:bg-slate-50/70 dark:[&>tr:nth-child(even)]:bg-neutral-900/50">${linhas.join('')}</tbody></table>
      <p class="px-4 py-2 text-xs text-slate-400 border-t border-slate-100 dark:border-neutral-900">P presente · A atraso · J falta justificada · F falta</p></div>`;
  }

  // ---------- Formulário de preenchimento ----------

  // Controle por tipo. name="campo-<id>", wrapper data-campo, <p data-erro="<id>"> para mostrarErros.
  function campoFormHtml(campo, valor = undefined, { erro = '', desabilitado = false } = {}) {
    const name = `campo-${campo.id}`;
    const dis = desabilitado ? 'disabled' : '';
    const req = campo.obrigatorio ? '<span class="text-red-500 ml-0.5" title="Obrigatório">*</span>' : '';
    const v = vazio(valor) ? undefined : valor;
    let controle = '';
    if (campo.tipo === 'escala') {
      controle = `<div class="grid grid-cols-5 gap-1.5" role="radiogroup">${ESCALA_DOSSIE.map((e) => `
        <label class="cursor-pointer rounded-lg border border-slate-300 dark:border-neutral-700 px-1 py-2 text-center transition hover:border-slate-400 dark:hover:border-neutral-500 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:disabled]:cursor-default has-[:disabled]:opacity-70" title="${esc(e.rotulo)}">
          <input type="radio" name="${name}" value="${e.valor}" class="sr-only" ${Number(v) === e.valor ? 'checked' : ''} ${dis}>
          <span class="block text-base font-semibold text-slate-800 dark:text-neutral-100">${e.valor}</span>
          <span class="block text-[11px] leading-tight text-slate-500 dark:text-neutral-400 truncate">${esc(e.curto)}</span>
        </label>`).join('')}</div>`;
    } else if (campo.tipo === 'nota') {
      controle = `<input type="number" name="${name}" min="0" max="10" step="0.5" inputmode="decimal" class="${CAMPO} max-w-[8rem]" value="${v === undefined ? '' : esc(v)}" placeholder="0 a 10" ${dis}>`;
    } else if (campo.tipo === 'sim_nao') {
      const op = (val, rotulo) => `<label class="${ESTILO.CARTAO_OPCAO} text-center has-[:disabled]:cursor-default has-[:disabled]:opacity-70"><input type="radio" name="${name}" value="${val}" class="sr-only" ${v === (val === 'true') ? 'checked' : ''} ${dis}><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span></label>`;
      controle = `<div class="grid grid-cols-2 gap-2 max-w-xs">${op('true', 'Sim')}${op('false', 'Não')}</div>`;
    } else if (campo.tipo === 'opcoes') {
      controle = `<select name="${name}" class="${CAMPO}" ${dis}><option value="">Escolha…</option>${(campo.opcoes ?? []).map((o) => `<option value="${esc(o)}" ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    } else if (campo.tipo === 'texto_curto') {
      controle = `<input type="text" name="${name}" maxlength="140" class="${CAMPO}" value="${v === undefined ? '' : esc(v)}" placeholder="Até 140 caracteres" ${dis}>`;
    } else {
      const texto = v === undefined ? '' : String(v);
      controle = `<textarea name="${name}" rows="4" maxlength="2000" class="${CAMPO} resize-y" data-contador placeholder="Até 2.000 caracteres" ${dis}>${esc(texto)}</textarea>
        <p class="text-[11px] text-slate-400 text-right mt-0.5"><span data-contador-de="${name}">${texto.length}</span>/2000</p>`;
    }
    return `<div data-campo="${esc(campo.id)}" class="space-y-1.5">
      <label class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(campo.rotulo)}${req}</label>
      ${campo.descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400 -mt-1">${esc(campo.descricao)}</p>` : ''}
      ${controle}
      <p data-erro="${esc(campo.id)}" class="text-xs text-red-600 dark:text-red-400 mt-1 ${erro ? '' : 'hidden'}">${esc(erro)}</p>
    </div>`;
  }

  // Liga os contadores dos textarea (chamar depois de injetar o HTML do formulário).
  function ligarContadores(raiz) {
    if (!raiz || typeof raiz.querySelectorAll !== 'function') return;
    raiz.querySelectorAll('textarea[data-contador]').forEach((ta) => {
      const alvo = raiz.querySelector(`[data-contador-de="${ta.name}"]`);
      if (alvo) ta.addEventListener('input', () => { alvo.textContent = String(ta.value.length); });
    });
  }

  // FormData → { campoId: valor tipado }; vazio → chave omitida. `form` = elemento <form> ou FormData.
  function lerRespostas(form, template) {
    const fd = typeof FormData !== 'undefined' && form instanceof FormData ? form : new FormData(form);
    const respostas = {};
    Dossies.campos(template).forEach((c) => {
      const bruto = fd.get(`campo-${c.id}`);
      if (bruto === null || bruto === undefined) return;
      const s = String(bruto).trim();
      if (!s) return;
      if (c.tipo === 'escala') respostas[c.id] = Number.parseInt(s, 10);
      else if (c.tipo === 'nota') respostas[c.id] = Number(s.replace(',', '.'));
      else if (c.tipo === 'sim_nao') respostas[c.id] = s === 'true';
      else respostas[c.id] = s;
    });
    return respostas;
  }

  // Marca erros de Dossies.validarRegistro no formulário (portal não carrega ui-form.js). Devolve true se houve erro.
  function mostrarErros(form, erros) {
    form.querySelectorAll('[data-erro]').forEach((p) => { p.classList.add('hidden'); p.textContent = ''; });
    form.querySelectorAll('.campo-erro').forEach((c) => c.classList.remove('campo-erro'));
    if (!erros.length) return false;
    erros.forEach((e) => {
      const p = form.querySelector(`[data-erro="${e.campo}"]`);
      if (p) { p.textContent = e.mensagem; p.classList.remove('hidden'); }
      form.querySelector(`[name="campo-${e.campo}"]:not([type="radio"])`)?.classList.add('campo-erro');
    });
    form.querySelector(`[data-campo="${erros[0].campo}"]`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    return true;
  }

  // ---------- Leitura / consolidação ----------

  const valorTexto = (campo, v) => {
    if (vazio(v)) return '—';
    if (campo.tipo === 'escala') { const e = escalaDe(v); return e ? `${e.valor} — ${e.rotulo}` : String(v); }
    if (campo.tipo === 'nota') return fmtNum(v);
    if (campo.tipo === 'sim_nao') return v ? 'Sim' : 'Não';
    return String(v);
  };
  // ---------- Leitura no admin (dossie.html, direção Ficha em cartões) ----------
  // Só o admin usa: o Portal do Professor mostra o registro dos outros pelo próprio formulário.
  const CARTAO_FICHA = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)] p-4';
  const APOIO = 'text-slate-500 dark:text-neutral-400';
  const VALOR = 'text-sm text-slate-800 dark:text-neutral-100';
  // Medidor em tinta; abaixo de "Adequado" (3 de 5, 6 de 10) vira cobre, a cor do que pede atenção.
  const medidorHtml = (valor, de) => {
    const baixo = valor / de < 0.6;
    return `<span class="inline-block h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800" aria-hidden="true"><span class="block h-full rounded-full ${baixo ? 'bg-[color:var(--f-cobre-tinta)] dark:bg-[color:var(--f-cobre)]' : 'bg-slate-800 dark:bg-neutral-100'}" style="width:${Math.max(0, Math.min(100, (valor / de) * 100))}%"></span></span>`;
  };

  // Um campo consolidado (item.consolidado[].campos[]): rótulo e valor, sem caixa; média e, com mais de um professor, o de cada um.
  function campoLeituraHtml(cc) {
    const c = cc.campo;
    const por = (fmt) => `<ul class="mt-1 space-y-0.5 text-xs ${APOIO}">${cc.valores.map((v) => `<li><span class="text-slate-700 dark:text-neutral-200">${esc(v.instrutorNome)}:</span> ${fmt(v.valor)}</li>`).join('')}</ul>`;
    const varios = cc.valores.length > 1;
    let corpo;
    if (!cc.valores.length) corpo = `<p class="text-sm ${APOIO}">Sem resposta</p>`;
    else if (c.tipo === 'escala') {
      const e = escalaDe(cc.media);
      corpo = `<p class="flex items-center gap-2.5 ${VALOR}"><span class="font-semibold tabular-nums">${fmtNum(cc.media)}</span>${medidorHtml(cc.media, 5)}<span>${esc(e?.rotulo ?? '')}</span></p>${varios ? por((v) => esc(valorTexto(c, v))) : ''}`;
    } else if (c.tipo === 'nota') {
      corpo = `<p class="flex items-center gap-2.5 ${VALOR}"><span class="font-semibold tabular-nums">${fmtNum(cc.media)}</span>${medidorHtml(cc.media, 10)}<span class="${APOIO}">de 10</span></p>${varios ? por((v) => fmtNum(v)) : ''}`;
    } else if (c.tipo === 'sim_nao') {
      corpo = `<p class="${VALOR}">${esc(cc.resumo)}</p>${varios ? por((v) => (v ? 'Sim' : 'Não')) : ''}`;
    } else {
      // Texto é o conteúdo do campo: cada professor no tamanho de valor, com o nome em cima.
      corpo = varios
        ? `<ul class="space-y-2">${cc.valores.map((v) => `<li><span class="block text-xs ${APOIO}">${esc(v.instrutorNome)}</span><span class="block ${VALOR} whitespace-pre-line">${esc(v.valor)}</span></li>`).join('')}</ul>`
        : `<p class="${VALOR} whitespace-pre-line">${esc(cc.valores[0].valor)}</p>`;
    }
    return `<div class="${c.tipo === 'texto_longo' ? 'col-span-2' : ''}"><p class="text-xs font-medium ${APOIO}">${esc(c.rotulo)}</p><div class="mt-1">${corpo}</div></div>`;
  }

  // Um cartão por seção (rótulo e valor em duas colunas) + o cartão dos pareceres. `item` = Dossies.montar.
  function consolidadoHtml(item) {
    const titulo = (texto, contexto) => `<h3 class="text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100">${texto}</h3>${contexto ? `<p class="text-xs ${APOIO} mt-0.5">${contexto}</p>` : ''}`;
    const secoes = (item.consolidado ?? []).map((s) => `<section class="${CARTAO_FICHA}">
      ${titulo(esc(s.secao.titulo), esc(s.secao.descricao ?? ''))}
      <div class="grid grid-cols-2 gap-4 mt-4">${s.campos.map(campoLeituraHtml).join('')}</div>
    </section>`);
    const regs = (item.registros ?? []).filter((r) => r.parecer);
    const blocos = item.template?.blocos ?? {};
    const pareceres = blocos.parecer === false ? '' : `<section class="${CARTAO_FICHA} xl:col-span-2">
      ${titulo(`Parecer ${regs.length > 1 ? 'dos professores' : 'do professor'}`, 'Texto livre de cada professor ao fim do registro.')}
      ${regs.length ? `<div class="mt-3 divide-y divide-slate-100 dark:divide-neutral-900">${regs.map((r) => `<figure class="py-3 first:pt-0 last:pb-0"><blockquote class="max-w-[75ch] ${VALOR} whitespace-pre-line">${esc(r.parecer)}</blockquote><figcaption class="mt-1 text-xs ${APOIO}">${esc(r.instrutorNome)} · ${fmtDataHora(r.atualizadoEm)}</figcaption></figure>`).join('')}</div>` : `<p class="mt-3 text-sm ${APOIO}">Sem parecer registrado.</p>`}
    </section>`;
    if (!secoes.length && !pareceres) return `<div class="${CARTAO_FICHA} text-center text-sm ${APOIO}">O modelo não tem campos.</div>`;
    return `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${secoes.join('')}${pareceres}</div>`;
  }

  // Formulário desabilitado com dados de exemplo (editor de template).
  function previaTemplateHtml(template) {
    const exemplo = (c, i) => {
      if (c.tipo === 'escala') return 3 + (i % 3);
      if (c.tipo === 'nota') return 7 + ((i % 3) * 0.5);
      if (c.tipo === 'sim_nao') return i % 3 !== 2;
      if (c.tipo === 'opcoes') return (c.opcoes ?? [])[i % Math.max(1, (c.opcoes ?? []).length)];
      if (c.tipo === 'texto_curto') return FRASES_DOSSIE.fortes[i % FRASES_DOSSIE.fortes.length];
      return FRASES_DOSSIE.desenvolver[i % FRASES_DOSSIE.desenvolver.length];
    };
    const blocos = template.blocos ?? {};
    const secoes = (template.secoes ?? []).map((s, si) => `<section class="${ESTILO.CARTAO} p-4">
      <h3 class="text-sm font-semibold text-slate-800 dark:text-neutral-100">${esc(s.titulo)}</h3>
      ${s.descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(s.descricao)}</p>` : ''}
      ${(s.campos ?? []).length ? `<div class="mt-3 space-y-4">${s.campos.map((c, ci) => campoFormHtml(c, exemplo(c, si + ci), { desabilitado: true })).join('')}</div>` : '<p class="mt-2 text-sm text-slate-400 italic">Seção sem campos.</p>'}
    </section>`);
    const auto = [blocos.frequencia !== false ? 'Frequência do período' : '', blocos.conteudo !== false ? 'Conteúdo trabalhado' : ''].filter(Boolean);
    const parecer = blocos.parecer === false ? '' : `<section class="${ESTILO.CARTAO} p-4"><h3 class="text-sm font-semibold text-slate-800 dark:text-neutral-100">Parecer do professor</h3><textarea rows="3" class="${CAMPO} mt-3 resize-y" disabled>${esc(FRASES_DOSSIE.pareceres[0])}</textarea></section>`;
    return `<div class="space-y-4">
      ${auto.length ? `<div class="rounded-lg border border-dashed border-slate-300 dark:border-neutral-700 p-3 text-sm text-slate-500 dark:text-neutral-400">Blocos automáticos (o professor não preenche): ${esc(auto.join(' · '))}.</div>` : ''}
      ${secoes.length ? secoes.join('') : `<div class="${ESTILO.CARTAO} p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma seção ainda — adicione seções e campos na aba Campos.</div>`}
      ${parecer}
    </div>`;
  }

  return {
    ESTILO, ICONE, esc, fmtData, fmtDataHora, fmtNum, plural, nomeAluno, iniciais,
    situacaoHtml, statusTemplateHtml, periodicidadeNome, tipoCampoNome, escalaDe, valorTexto,
    frequenciaCardsHtml, aulasPeriodoHtml, campoFormHtml, ligarContadores, lerRespostas, mostrarErros,
    campoLeituraHtml, consolidadoHtml, previaTemplateHtml,
  };
})();
