// ============================================================
// Componentes de formulário compartilhados pelas telas de cadastro:
//  - modalFormulario: formulário em modal centralizado (sem drawer);
//  - campoCombo / ativarCombos: combobox com busca no lugar de <select>;
//  - mostrarErros: marca erros de validação (inclusive no combobox);
//  - pontoStatus: status em texto com ponto colorido (tabelas sem chip).
// Depende de esc/abrirModal/fecharModal (js/avaliacoes-ui.js) e das
// constantes de estilo da tela (BOTAO_PRI, BOTAO_CANCELAR, CAMPO_BUSCA,
// SELECT_FILTRO), lidas na hora da chamada. Carregar depois de avaliacoes-ui.js
// e antes do *-app.js.
// ============================================================

const UI_ICONE = {
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>',
  check: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
};

function normalizarTexto(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Status em texto com ponto colorido — na tabela, chip só para a área.
const PONTO_STATUS = { ativo: 'bg-emerald-500', rascunho: 'bg-amber-500', inativo: 'bg-slate-400 dark:bg-neutral-600' };
function pontoStatus(status, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 rounded-full shrink-0 ${PONTO_STATUS[status] ?? PONTO_STATUS.inativo}"></span>${esc(texto)}</span>`;
}

function mostrarErros(form, erros) {
  form.querySelectorAll('[data-erro]').forEach((p) => { p.classList.add('hidden'); p.textContent = ''; });
  form.querySelectorAll('.campo-erro').forEach((c) => { c.classList.remove('campo-erro'); c.removeAttribute('aria-invalid'); });
  if (!erros.length) return false;
  erros.forEach((erro) => {
    const p = form.querySelector(`[data-erro="${erro.campo}"]`);
    if (p) { p.textContent = erro.mensagem; p.classList.remove('hidden'); }
    const campo = form.querySelector(`[name="${erro.campo}"]`);
    const alvo = campo?.type === 'hidden' ? campo.closest('[data-combo]')?.querySelector('[data-combo-gatilho]') : campo;
    alvo?.classList.add('campo-erro');
    alvo?.setAttribute('aria-invalid', 'true');
  });
  const primeiro = form.querySelector(`[name="${erros[0].campo}"]`);
  (primeiro?.type === 'hidden' ? primeiro.closest('[data-combo]')?.querySelector('[data-combo-gatilho]') : primeiro)?.focus();
  return true;
}

function cabecalhoModal(titulo, subtitulo) {
  return `
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${UI_ICONE.fechar}</button>
    </div>`;
}

function rodapeModal(rotulo) {
  return `
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="submit" class="${BOTAO_PRI}">${rotulo}</button>
    </div>`;
}

// ---------- CPF / CNPJ ----------
// Máscara e validação vivem em js/documento.js (objeto global `Documento`), carregado ANTES deste arquivo.
// A máscara é delegada no `document`; `ativarMascaras` fica por compatibilidade (formata valores iniciais).
function ativarMascaras(raiz) { if (typeof Documento !== 'undefined') Documento.ativarMascaras(raiz); }

// Monta um modal-formulário: `corpo` = HTML dos campos; `aoSalvar(fd, form)` devolve erros[] ou nada.
// `largura`: 'md' (curto), 'lg' (padrão) ou 'xl' (formulários com grade).
const LARGURA_MODAL = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
function modalFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'lg', aoSalvar, foco }) {
  const root = abrirModal(`
    <form id="${id}" novalidate class="flex flex-col max-h-full min-h-0">
      ${cabecalhoModal(titulo, subtitulo)}
      <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">${corpo}</div>
      ${rodapeModal(rotulo)}
    </form>`, LARGURA_MODAL[largura] ?? largura);
  const form = root.querySelector(`#${id}`);
  ativarCombos(form);
  ativarMascaras(form);
  const fechar = () => { fecharCombo(); fecharModal(); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const erros = aoSalvar(new FormData(form), form) ?? [];
    if (mostrarErros(form, erros)) return;
    fechar();
  });
  if (foco) form.querySelector(foco)?.focus();
  return { form, fechar };
}

// ---------- Combobox com busca ----------
// Substitui todo <select> da tela. Gera um <input type="hidden" name> (entra no FormData) + botão que abre um
// popover fixo (não é cortado pelo scroll do modal) com busca e lista. Chamar `ativarCombos(raiz)` depois de
// injetar o HTML. `opcoes`: [{ id, nome, descricao? }]. `vazio`: rótulo quando nada escolhido (obrigatório) ou
// opção "limpar" (quando `opcional`/filtro).
function campoCombo(name, opcoes, valor, { id = `f-${name}`, vazio = 'Escolha…', opcional = false, filtro = false, classe = '' } = {}) {
  const atual = opcoes.find((o) => o.id === valor);
  const dados = esc(JSON.stringify({ name, opcoes: opcoes.map((o) => ({ id: o.id, nome: o.nome, descricao: o.descricao ?? '', ...(o.logo !== undefined ? { logo: o.logo } : {}) })), vazio, opcional, filtro }));
  const base = filtro ? `${SELECT_FILTRO} inline-flex items-center gap-1.5 ${classe}` : `campo flex items-center gap-2 text-left ${classe}`;
  return `
    <div class="relative" data-combo="${dados}" data-name="${name}">
      <input type="hidden" name="${name}" value="${esc(atual?.id ?? '')}">
      <button type="button" id="${id}" data-combo-gatilho aria-haspopup="listbox" aria-expanded="false" class="${base}">
        <span data-combo-logo class="shrink-0 ${atual && atual.logo !== undefined ? '' : 'hidden'}">${atual && atual.logo !== undefined ? logoInstituicao(atual) : ''}</span>
        <span data-combo-rotulo class="flex-1 min-w-0 truncate ${atual ? '' : (filtro ? '' : 'text-slate-400')}">${esc(atual?.nome ?? vazio)}</span>
        <svg class="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </button>
    </div>`;
}

// Logo de instituição financeira (opção com `logo`): imagem do CDN ou iniciais quando não há logo / falha ao carregar.
function logoInstituicao(o, tamanho = 'h-6 w-6') {
  const iniciais = String(o.nome ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const fallback = `<span class="${tamanho} rounded-md bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 grid place-items-center text-[10px] font-semibold">${esc(iniciais)}</span>`;
  if (!o.logo) return fallback;
  return `<span class="${tamanho} rounded-md overflow-hidden bg-white grid place-items-center border border-slate-200 dark:border-neutral-800"><img src="${esc(o.logo)}" alt="" loading="lazy" class="h-full w-full object-contain" onerror="this.parentElement.outerHTML=${esc(JSON.stringify(fallback))}"></span>`;
}

let comboAberto = null;
function fecharCombo() {
  if (!comboAberto) return;
  comboAberto.popover.remove();
  comboAberto.gatilho.setAttribute('aria-expanded', 'false');
  document.removeEventListener('mousedown', comboAberto.aoClicarFora, true);
  document.removeEventListener('keydown', comboAberto.aoTeclar, true);
  window.removeEventListener('resize', comboAberto.posicionar);
  window.removeEventListener('scroll', comboAberto.posicionar, true);
  comboAberto = null;
}

function abrirCombo(raiz) {
  fecharCombo();
  const cfg = JSON.parse(raiz.dataset.combo);
  const hidden = raiz.querySelector('input[type="hidden"]');
  const gatilho = raiz.querySelector('[data-combo-gatilho]');
  const rotulo = raiz.querySelector('[data-combo-rotulo]');
  const popover = document.createElement('div');
  popover.className = 'fixed z-50 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl p-2';
  popover.setAttribute('role', 'listbox');
  popover.innerHTML = `
    <div class="relative">
      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">${UI_ICONE.lupa}</span>
      <input type="text" data-combo-busca autocomplete="off" placeholder="Buscar…" class="${CAMPO_BUSCA} w-full">
    </div>
    <div data-combo-lista class="max-h-64 overflow-y-auto mt-1.5"></div>`;
  document.body.appendChild(popover);
  const busca = popover.querySelector('[data-combo-busca]');
  const lista = popover.querySelector('[data-combo-lista]');
  let ativo = -1;
  let visiveis = [];

  const escolher = (id) => {
    const o = cfg.opcoes.find((x) => x.id === id) ?? null;
    hidden.value = o?.id ?? '';
    rotulo.textContent = o?.nome ?? cfg.vazio;
    const logoEl = raiz.querySelector('[data-combo-logo]');
    if (logoEl) { const tem = o && o.logo !== undefined; logoEl.classList.toggle('hidden', !tem); logoEl.innerHTML = tem ? logoInstituicao(o) : ''; }
    rotulo.classList.toggle('text-slate-400', !o && !cfg.filtro);
    gatilho.classList.remove('campo-erro');
    fecharCombo();
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
    gatilho.focus();
  };

  const render = () => {
    const termo = normalizarTexto(busca.value);
    visiveis = cfg.opcoes.filter((o) => !termo || normalizarTexto(`${o.nome} ${o.descricao}`).includes(termo));
    const limpar = (cfg.opcional || cfg.filtro) && !termo ? [{ id: '', nome: cfg.filtro ? `Todos · ${cfg.vazio.toLowerCase()}` : cfg.vazio, descricao: '', limpar: true }] : [];
    visiveis = [...limpar, ...visiveis];
    ativo = Math.min(Math.max(ativo, 0), visiveis.length - 1);
    lista.innerHTML = visiveis.length ? visiveis.map((o, i) => `
      <button type="button" role="option" data-combo-opcao="${esc(o.id)}" aria-selected="${o.id === hidden.value}"
        class="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition ${i === ativo ? 'bg-slate-100 dark:bg-neutral-900' : 'hover:bg-slate-50 dark:hover:bg-neutral-900'}">
        ${o.logo !== undefined && !o.limpar ? `<span class="shrink-0">${logoInstituicao(o)}</span>` : ''}
        <span class="flex-1 min-w-0">
          <span class="block text-sm truncate ${o.limpar ? 'text-slate-500 dark:text-neutral-400' : 'text-slate-800 dark:text-neutral-100'}">${esc(o.nome)}</span>
          ${o.descricao ? `<span class="block text-[11px] text-slate-400 truncate">${esc(o.descricao)}</span>` : ''}
        </span>
        ${o.id === hidden.value && !o.limpar ? `<span class="text-petrol-800 dark:text-sky-300 shrink-0">${UI_ICONE.check}</span>` : ''}
      </button>`).join('') : '<p class="text-xs text-slate-400 px-2 py-3 text-center">Nenhum resultado.</p>';
    lista.querySelectorAll('[data-combo-opcao]').forEach((b) => b.addEventListener('click', () => escolher(b.dataset.comboOpcao)));
    lista.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
  };

  const posicionar = () => {
    const r = gatilho.getBoundingClientRect();
    const largura = Math.max(r.width, 224);
    const alturaMax = 320;
    const abaixo = window.innerHeight - r.bottom;
    popover.style.width = `${largura}px`;
    popover.style.left = `${Math.min(r.left, window.innerWidth - largura - 8)}px`;
    if (abaixo < alturaMax && r.top > abaixo) { popover.style.top = ''; popover.style.bottom = `${window.innerHeight - r.top + 4}px`; }
    else { popover.style.bottom = ''; popover.style.top = `${r.bottom + 4}px`; }
  };

  const aoClicarFora = (e) => { if (!popover.contains(e.target) && !raiz.contains(e.target)) fecharCombo(); };
  const aoTeclar = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); fecharCombo(); gatilho.focus(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); ativo = Math.min(ativo + 1, visiveis.length - 1); render(); lista.children[ativo]?.scrollIntoView?.({ block: 'nearest' }); }
    if (e.key === 'ArrowUp') { e.preventDefault(); ativo = Math.max(ativo - 1, 0); render(); lista.children[ativo]?.scrollIntoView?.({ block: 'nearest' }); }
    if (e.key === 'Enter') { e.preventDefault(); if (visiveis[ativo]) escolher(visiveis[ativo].id); }
    if (e.key === 'Tab') fecharCombo();
  };

  comboAberto = { popover, gatilho, aoClicarFora, aoTeclar, posicionar };
  gatilho.setAttribute('aria-expanded', 'true');
  ativo = Math.max(0, visiveis.length ? 0 : 0);
  render();
  const idx = visiveis.findIndex((o) => o.id === hidden.value && o.id !== '');
  ativo = idx >= 0 ? idx : 0;
  render();
  posicionar();
  busca.addEventListener('input', () => { ativo = 0; render(); });
  document.addEventListener('mousedown', aoClicarFora, true);
  document.addEventListener('keydown', aoTeclar, true);
  window.addEventListener('resize', posicionar);
  window.addEventListener('scroll', posicionar, true);
  busca.focus();
}

function ativarCombos(raiz) {
  raiz.querySelectorAll('[data-combo]').forEach((c) => {
    c.querySelector('[data-combo-gatilho]').addEventListener('click', () => (comboAberto?.gatilho === c.querySelector('[data-combo-gatilho]') ? fecharCombo() : abrirCombo(c)));
  });
}

