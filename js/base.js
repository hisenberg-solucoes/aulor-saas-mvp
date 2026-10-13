// ============================================================
// Helpers de apresentação compartilhados pelas telas (exceto perfis.html e
// perfil.html, que usam o app de permissões com helpers próprios).
// Formatação pt-BR, toast, modal, confirmação, abas, pílulas e estados vazios.
// Carregar depois de shell.js e antes de ui-form.js e do *-app.js da tela.
// ============================================================

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function normalizarTexto(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function parametroUrl(nome) {
  return new URLSearchParams(location.search).get(nome);
}

// ---------- Formatação ----------

const FMT_MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moeda = (v) => FMT_MOEDA.format(Number(v) || 0).replace(/ /g, ' ');
const moedaCurta = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return moeda(n);
};
const numero = (v) => (Number(v) || 0).toLocaleString('pt-BR');
const pct = (v) => (v == null ? '—' : `${v}%`);

const dataObj = (iso) => new Date(`${iso}T12:00:00`);
const dataBr = (iso) => (iso ? dataObj(iso).toLocaleDateString('pt-BR') : '—');
const dataCurta = (iso) => (iso ? dataObj(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—');
const diaSemana = (iso) => dataObj(iso).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
function dataLonga(iso) {
  const t = dataObj(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const mesAno = (iso) => {
  const t = dataObj(`${iso.slice(0, 7)}-15`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
function quando(iso, ref = Aulor.hoje()) {
  const d = Aulor.diasEntre(ref, iso);
  if (d === 0) return 'hoje';
  if (d === -1) return 'ontem';
  if (d === 1) return 'amanhã';
  if (d < 0) return `há ${-d} dias`;
  return `em ${d} dias`;
}
const telefoneFmt = (t) => {
  const d = String(t ?? '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t || '—';
};
const cpfFmt = (c) => (c ? Documento.fmtCpf(c) : '—');

function iniciais(nome) {
  const p = String(nome ?? '').trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

// ---------- Estilos usados por ui-form.js ----------

const BOTAO_PRI = 'btn-pri';
const BOTAO_CANCELAR = 'btn-sec';
const CAMPO_BUSCA = 'campo pl-8';
const SELECT_FILTRO = 'rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400';

// ---------- Ícones (heroicons outline) ----------

const ICONE = {
  cima: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m5 15 7-7 7 7"/></svg>',
  baixo: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7"/></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>',
  seta: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>',
  voltar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>',
  check: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>',
  alerta: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>',
  imprimir: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/></svg>',
  copiar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/></svg>',
  editar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>',
  cadeado: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>',
};

// ---------- Toast ----------

function toast(mensagem, tipo = 'ok') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const cores = { ok: 'bg-petrol-900', erro: 'bg-red-700', alerta: 'bg-slate-700' };
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = `toast-anim ${cores[tipo] ?? cores.ok} text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-sm`;
  el.textContent = mensagem;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- Modal ----------

let aoTeclarModal = null;
function abrirModal(conteudoHtml, largura = 'max-w-lg') {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div data-fechar-modal class="absolute inset-0 bg-slate-900/50 dark:bg-black/70"></div>
      <div role="dialog" aria-modal="true" class="modal-anim relative w-full ${largura} max-h-[92vh] flex flex-col bg-white dark:bg-neutral-950 rounded-t-xl sm:rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xl">
        ${conteudoHtml}
      </div>
    </div>`;
  root.querySelectorAll('[data-fechar-modal]').forEach((b) => b.addEventListener('click', fecharModal));
  if (aoTeclarModal) document.removeEventListener('keydown', aoTeclarModal);
  aoTeclarModal = (e) => { if (e.key === 'Escape') fecharModal(); };
  document.addEventListener('keydown', aoTeclarModal);
  return root;
}

function fecharModal() {
  document.getElementById('modal-root').innerHTML = '';
  if (aoTeclarModal) document.removeEventListener('keydown', aoTeclarModal);
  aoTeclarModal = null;
}

// Confirmação simples. `detalhe` aceita HTML já escapado.
function confirmar({ titulo, mensagem, detalhe = '', rotulo = 'Confirmar', tom = 'pri', aoConfirmar }) {
  const root = abrirModal(`
    <div class="p-5">
      <h3 class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100">${esc(titulo)}</h3>
      <p class="text-sm text-slate-600 dark:text-neutral-400 mt-2">${esc(mensagem)}</p>
      ${detalhe}
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
      <button type="button" data-fechar-modal class="btn-sec">Cancelar</button>
      <button type="button" data-confirmar class="${tom === 'perigo' ? 'btn-perigo' : 'btn-pri'}">${esc(rotulo)}</button>
    </div>`, 'max-w-md');
  root.querySelectorAll('[data-fechar-modal]').forEach((b) => b.addEventListener('click', fecharModal));
  root.querySelector('[data-confirmar]').addEventListener('click', () => { fecharModal(); aoConfirmar(); });
  root.querySelector('[data-confirmar]').focus();
}

// ---------- Peças de tela ----------

function cabecalhoPagina({ titulo, subtitulo = '', acoes = '', voltar = null }) {
  return `
    <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div class="min-w-0">
        ${voltar ? `<a href="${voltar.href}" class="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-petrol-800 dark:text-neutral-400 dark:hover:text-sky-300 mb-1">${ICONE.voltar}${esc(voltar.rotulo)}</a>` : ''}
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h2>
        ${subtitulo ? `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>` : ''}
      </div>
      ${acoes ? `<div class="flex flex-wrap items-center gap-2">${acoes}</div>` : ''}
    </div>`;
}

// abas: [{ id, nome, n? }]; gera links ?aba=id preservando os demais parâmetros.
function abasHtml(abas, ativa) {
  return `
    <nav class="flex gap-5 border-b border-slate-200 dark:border-neutral-800 mb-5 overflow-x-auto overflow-y-hidden [scrollbar-width:none]" aria-label="Seções">
      ${abas.map((a) => {
        const url = new URL(location.href);
        url.searchParams.set('aba', a.id);
        return `<a href="${url.pathname.split('/').pop()}${url.search}" class="aba ${a.id === ativa ? 'aba-ativa' : ''}" ${a.id === ativa ? 'aria-current="page"' : ''}>${esc(a.nome)}${a.n != null ? ` <span class="ml-1 text-xs tabular-nums text-slate-400">${a.n}</span>` : ''}</a>`;
      }).join('')}
    </nav>`;
}

// Tons de status: ponto colorido + texto (sem chip), como no padrão do Aulor.
const TOM = {
  ok: { ponto: 'bg-emerald-500', texto: 'text-emerald-700 dark:text-emerald-400', fundo: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
  info: { ponto: 'bg-sky-500', texto: 'text-sky-700 dark:text-sky-300', fundo: 'bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300' },
  atencao: { ponto: 'bg-amber-500', texto: 'text-amber-700 dark:text-amber-400', fundo: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  perigo: { ponto: 'bg-red-500', texto: 'text-red-700 dark:text-red-400', fundo: 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300' },
  neutro: { ponto: 'bg-slate-400 dark:bg-neutral-500', texto: 'text-slate-500 dark:text-neutral-400', fundo: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-300' },
};

function status(tom, texto, titulo = '', quebra = false) {
  const t = TOM[tom] ?? TOM.neutro;
  return `<span ${titulo ? `title="${esc(titulo)}"` : ''} class="inline-flex items-center gap-1.5 text-sm ${quebra ? '' : 'whitespace-nowrap'} text-slate-700 dark:text-neutral-200"><span class="h-2 w-2 rounded-full shrink-0 ${t.ponto}"></span>${esc(texto)}</span>`;
}

function pilula(tom, texto) {
  const t = TOM[tom] ?? TOM.neutro;
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${t.fundo}">${esc(texto)}</span>`;
}

// Cartão de contagem no padrão do protótipo original. Com `filtro`, vira botão
// (data-cartao) que filtra a lista; clicar de novo no ativo limpa o filtro.
function cartaoNumero({ rotulo, valor, ajuda = '', cor = '', filtro = '', ativo = false }) {
  const tag = filtro ? 'button' : 'div';
  return `
    <${tag} ${filtro ? `type="button" data-cartao="${esc(filtro)}" aria-pressed="${ativo}" title="${esc(ativo ? 'Mostrar a lista completa' : `Mostrar só: ${rotulo.toLowerCase()}`)}"` : ''}
      class="painel p-4 text-left ${filtro ? 'transition hover:border-petrol-800 dark:hover:border-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30' : ''} ${ativo ? 'ring-2 ring-petrol-800/40 dark:ring-sky-400/50 border-petrol-800 dark:border-sky-400' : ''}">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">${cor ? `<span class="h-2 w-2 rounded-full ${cor}"></span>` : ''}${esc(rotulo)}</p>
      <p class="font-display text-2xl font-semibold tabular-nums leading-none mt-1.5 text-slate-900 dark:text-neutral-100">${valor}</p>
      ${ajuda ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">${ajuda}</p>` : ''}
    </${tag}>`;
}

function vazio(titulo, texto = '', acao = '') {
  return `
    <div class="px-6 py-12 text-center">
      <p class="font-medium text-slate-700 dark:text-neutral-200">${esc(titulo)}</p>
      ${texto ? `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">${texto}</p>` : ''}
      ${acao ? `<div class="mt-4">${acao}</div>` : ''}
    </div>`;
}

function avatar(nome, tamanho = 'h-8 w-8 text-xs') {
  return `<span class="${tamanho} shrink-0 rounded-full bg-petrol-800/10 text-petrol-800 dark:bg-sky-400/15 dark:text-sky-300 grid place-items-center font-semibold">${esc(iniciais(nome))}</span>`;
}

function campoBusca(id, valor, placeholder) {
  return `
    <div class="relative flex-1 min-w-[14rem]">
      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">${ICONE.lupa}</span>
      <input id="${id}" type="search" value="${esc(valor)}" placeholder="${esc(placeholder)}" autocomplete="off" class="campo pl-8">
    </div>`;
}

function selectFiltro(id, opcoes, valor, rotulo = '') {
  return `<select id="${id}" ${rotulo ? `aria-label="${esc(rotulo)}"` : ''} class="${SELECT_FILTRO}">${opcoes.map((o) => `<option value="${esc(o.id)}" ${o.id === valor ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}</select>`;
}

const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;

// Linhas clicáveis: <tr class="linha-link" data-href="...">.
function ligarLinhasLink(raiz = document) {
  raiz.querySelectorAll('tr[data-href]').forEach((tr) => {
    tr.classList.add('linha-link');
    tr.addEventListener('click', (e) => {
      if (e.target.closest('a, button, input, select, label')) return;
      location.href = tr.dataset.href;
    });
  });
}

// Botão desabilitado com explicação quando o usuário não tem a permissão.
function botaoPermitido(pode, html, motivo = 'Seu perfil não tem esta permissão') {
  if (pode) return html;
  return html.replace(/<(button|a)\b/, `<$1 disabled aria-disabled="true" title="${esc(motivo)}"`).replace(/href="[^"]*"/, '');
}

async function copiarTexto(texto, aviso = 'Copiado') {
  try { await navigator.clipboard.writeText(texto); toast(aviso); } catch (_) { toast('Não foi possível copiar', 'erro'); }
}
