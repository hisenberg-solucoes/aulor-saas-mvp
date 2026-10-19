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
const plural = (n, um, varios = `${um}s`) => `${numero(n)} ${n === 1 ? um : varios}`;

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
const CAMPO_BUSCA = 'h-9 w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20';
const SELECT_FILTRO = 'h-9 max-w-40 truncate rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400';
const FILTRO_ATIVO = 'border-petrol-800 dark:border-sky-400 text-petrol-800 dark:text-sky-300'; // filtro fora do padrão
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/50';
// Rodapé da tabela da lista: contagem sobre o cinza do cabeçalho.
const RODAPE_TABELA = 'px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums';
// Cartão e textos de apoio das telas em cartões (DESIGN.md do original, "Cartões nos dois modos").
const CARTAO = 'painel';
const TITULO = 'text-slate-900 dark:text-neutral-100';
const APOIO = 'text-slate-500 dark:text-neutral-400'; // sobre o cartão
const APOIO_FUNDO = 'text-slate-600 dark:text-neutral-400'; // sobre o fundo da página (o slate-500 dava 4,36:1)
const AVISO = 'text-[color:var(--f-aviso)]'; // cobre-tinta: o que é com você
// Nome que abre o registro na linha da tabela (o foco aparece na linha, via FOCO_LINHA).
const LINK_REGISTRO = 'link-registro text-sm font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none';
// Tag (perfil, tipo): fundo etiqueta, 24px de altura, canto de 4px.
const TAG = 'inline-flex items-center h-6 rounded px-2 text-xs font-medium bg-[color:var(--f-etiqueta)] text-[color:var(--f-etiqueta-tinta)] whitespace-nowrap';
// Linha de tabela que abre o registro: o nome é o link (.link-registro) e a linha ganha o foco dele.
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';

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
  documento: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>',
  email: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>',
  telefone: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>',
  calendario: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>',
  relogio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  local: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>',
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>',
  pessoas: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>',
  tag: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/></svg>',
  whatsapp: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 01-1.45-5.03C2.57 6.8 6.82 2.55 12.05 2.55c2.53 0 4.91.99 6.7 2.78a9.42 9.42 0 012.77 6.7c0 5.23-4.25 9.47-9.47 9.47zm8.06-17.53A11.33 11.33 0 0012.05.63C5.77.63.66 5.74.66 12.02c0 2.01.52 3.97 1.52 5.7L.56 23.62l6.04-1.58a11.37 11.37 0 005.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z"/></svg>',
  reticencias: '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="19" cy="12" r="1.75"/></svg>',
  cadeado: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>',
};

// ---------- Toast ----------

function toast(mensagem, tipo = 'ok') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const ponto = { ok: 'var(--f-bom)', erro: 'var(--f-ruim)', alerta: 'var(--f-aviso)' };
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  // .ficha-inverso: azul profundo com areia no claro, o inverso no escuro.
  el.className = 'ficha-inverso toast-anim flex items-center gap-2.5 bg-[color:var(--f-papel)] text-[color:var(--f-tinta)] text-sm px-4 py-2.5 rounded-lg shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] max-w-sm';
  el.innerHTML = `<span class="h-2 w-2 shrink-0 rounded-full" style="background:${ponto[tipo] ?? ponto.ok}"></span><span></span>`;
  el.lastElementChild.textContent = mensagem;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- Modal ----------

let aoTeclarModal = null;
// Clique no fundo e Esc fecham o modal, mas não descartam um formulário alterado sem perguntar.
// Cancelar e o X (data-fechar-modal) continuam fechando direto: são escolhas explícitas.
function abrirModal(conteudoHtml, largura = 'max-w-lg') {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div data-fundo-modal class="absolute inset-0 bg-[color:var(--f-veu)]"></div>
      <div role="dialog" aria-modal="true" class="modal-anim relative w-full ${largura} max-h-[92vh] flex flex-col bg-white dark:bg-neutral-950 rounded-t-xl sm:rounded-xl border border-slate-200 dark:border-neutral-800 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]">
        ${conteudoHtml}
      </div>
    </div>`;
  root.querySelectorAll('[data-fechar-modal]').forEach((b) => b.addEventListener('click', fecharModal));
  const dialogo = root.querySelector('[role="dialog"]');
  const estado = () => [...dialogo.querySelectorAll('form')].map((f) => new URLSearchParams(new FormData(f)).toString()).join('|');
  let inicial = null;
  const continuar = () => {
    dialogo.querySelector('[data-descartar]')?.remove();
    dialogo.querySelector('input:not([type="hidden"]), textarea, [data-combo-gatilho]')?.focus();
  };
  setTimeout(() => { inicial = estado(); }); // depois que quem abriu preencheu combos e máscaras
  const tentarFechar = () => {
    if (inicial === null || estado() === inicial) return fecharModal();
    if (dialogo.querySelector('[data-descartar]')) return dialogo.querySelector('[data-continuar]').focus();
    dialogo.insertAdjacentHTML('afterbegin', `
      <div data-descartar role="alertdialog" aria-label="Alterações não salvas" class="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-950/40 rounded-t-xl text-sm text-amber-900 dark:text-amber-200">
        <span>Sair sem salvar? O que você preencheu será perdido.</span>
        <span class="flex gap-2"><button type="button" data-continuar class="btn-sec btn-pequeno">Continuar editando</button><button type="button" data-sair class="btn-perigo btn-pequeno">Sair sem salvar</button></span>
      </div>`);
    const aviso = dialogo.querySelector('[data-descartar]');
    aviso.querySelector('[data-continuar]').addEventListener('click', continuar);
    aviso.querySelector('[data-sair]').addEventListener('click', fecharModal);
    aviso.querySelector('[data-continuar]').focus();
  };
  root.querySelector('[data-fundo-modal]').addEventListener('click', tentarFechar);
  if (aoTeclarModal) document.removeEventListener('keydown', aoTeclarModal);
  aoTeclarModal = (e) => {
    if (e.key !== 'Escape') return;
    if (dialogo.querySelector('[data-descartar]')) continuar(); else tentarFechar();
  };
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
      <h3 class="text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${esc(titulo)}</h3>
      <p class="text-sm text-slate-600 dark:text-neutral-300 mt-2">${esc(mensagem)}</p>
      ${detalhe}
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
      <button type="button" data-fechar-modal class="btn-sec">Cancelar</button>
      <button type="button" data-confirmar class="${tom === 'perigo' ? 'btn-perigo' : 'btn-pri'}">${esc(rotulo)}</button>
    </div>`, 'max-w-md');
  root.querySelectorAll('[data-fechar-modal]').forEach((b) => b.addEventListener('click', fecharModal));
  root.querySelector('[data-confirmar]').addEventListener('click', () => { fecharModal(); aoConfirmar(); });
  // Em ação destrutiva, o foco começa no Cancelar: Enter por reflexo não apaga nada.
  root.querySelector(tom === 'perigo' ? '[data-fechar-modal]' : '[data-confirmar]').focus();
}

// ---------- Peças de tela (vocabulário da "Ficha em cartões" do original) ----------

// Trilha: Início / lista / registro. `itens`: [{ rotulo, href? }]; o último é a página atual.
function trilha(itens) {
  const inicio = Shell.primeiraPagina();
  return `
    <nav aria-label="Trilha" class="mb-3 flex items-center gap-1.5 text-sm ${APOIO_FUNDO} min-w-0">
      <a href="${inicio}" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Início</a>
      ${itens.map((it, i) => `<span aria-hidden="true">/</span>${i === itens.length - 1 || !it.href
        ? `<span class="font-medium text-slate-800 dark:text-neutral-100 truncate" ${i === itens.length - 1 ? 'aria-current="page"' : ''}>${it.rotulo}</span>`
        : `<a href="${it.href}" class="hover:text-petrol-800 dark:hover:text-sky-300 transition whitespace-nowrap">${esc(it.rotulo)}</a>`}`).join('')}
    </nav>`;
}

// Topo de uma lista: título, contagem e frase de contexto sobre o fundo; ações à direita.
// `voltar` (página de passo, ex.: Nova venda) vira a trilha acima do título.
function cabecalhoPagina({ titulo, subtitulo = '', acoes = '', voltar = null }) {
  return `
    ${voltar ? trilha([{ rotulo: voltar.rotulo, href: voltar.href }, { rotulo: titulo }]) : ''}
    <div class="mb-4 flex items-start justify-between gap-6">
      <div class="min-w-0">
        <h2 class="font-display text-xl font-semibold ${TITULO}">${titulo}</h2>
        ${subtitulo ? `<p class="max-w-3xl text-sm ${APOIO_FUNDO} mt-0.5">${subtitulo}</p>` : ''}
      </div>
      ${acoes ? `<div class="shrink-0 flex items-center gap-2">${acoes}</div>` : ''}
    </div>`;
}

// Cabeçalho da ficha (registro aberto), sempre na ordem do original: trilha; avatar de 48px, nome em
// serifa com as pílulas de exceção ao lado e a linha de chips embaixo; à direita uma ação à vista e o "Mais".
// `avatar`: HTML pronto (avatarRegistro ou avatar(nome, 'h-12 w-12 text-base')). `mais`: itens de abrirMenu.
function cabecalhoFicha({ trilha: caminho, avatar: av = '', nome, pilulas = '', descricao = '', chips = [], acoes = '', mais = null }) {
  return `
    ${trilha(caminho)}
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        ${av}
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] ${TITULO}">${nome}</h2>
            ${pilulas}
          </div>
          ${descricao ? `<p class="mt-1 text-sm ${APOIO_FUNDO}">${descricao}</p>` : ''}
          ${chips.filter(Boolean).length ? `<div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">${chips.filter(Boolean).join('')}</div>` : ''}
        </div>
      </div>
      ${acoes || mais?.length ? `<div class="flex items-center gap-2 shrink-0">${acoes}${mais?.length ? `<button type="button" data-mais class="btn-sec" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo.replace('h-4 w-4', 'h-3.5 w-3.5')}</button>` : ''}</div>` : ''}
    </div>`;
}

// Quadrado de 48px com o que identifica um registro que não é pessoa (código do curso, da turma…).
function avatarRegistro(texto, titulo = '') {
  const t = String(texto ?? '—');
  return `<div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center px-1 text-center font-mono font-semibold leading-tight break-all ${t.length > 5 ? 'text-xs' : 'text-sm'}" ${titulo ? `title="${esc(titulo)}"` : ''}>${esc(t)}</div>`;
}

// Dado de consulta da linha de chips: texto em 13px e ícone na cor de apoio, sem caixa.
function chip(icone, conteudo, titulo = '') {
  return `<span ${titulo ? `title="${esc(titulo)}"` : ''} class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300"><span class="text-slate-400 dark:text-neutral-500">${icone}</span>${conteudo}</span>`;
}

// Faixa do topo do registro: só quando alguém precisa agir. Sem contorno.
// tom: erro (bloqueia), aviso (falta ou espera alguém), passo (próximo passo previsível), neutra (registro suspenso).
function faixa(tom, html, acao = '') {
  const cores = {
    erro: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200',
    aviso: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    passo: 'bg-petrol-800/10 dark:bg-sky-950/40 text-petrol-900 dark:text-sky-200',
    neutra: 'bg-slate-200/70 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300',
  };
  return `<div class="mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${cores[tom] ?? cores.aviso}"><span class="shrink-0 mt-px">${ICONE.alerta.replace('h-4 w-4', 'h-5 w-5')}</span><div class="min-w-0 flex-1 self-center">${html}</div>${acao ? `<div class="shrink-0 self-center">${acao}</div>` : ''}</div>`;
}

// Cabeçalho de cartão: título, frase de contexto e a ação do cartão em botão fantasma; sem divisória.
function cabecalhoCartao(titulo, contexto = '', acao = '') {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-[15px] font-semibold ${TITULO}">${titulo}</h3>
        ${contexto ? `<p class="mt-0.5 text-xs ${APOIO}">${contexto}</p>` : ''}
      </div>
      ${acao ? `<div class="-mt-1 -mr-1.5 flex shrink-0 items-center gap-1">${acao}</div>` : ''}
    </div>`;
}

// Cartão com cabeçalho. `corpo` já traz o próprio respiro (ex.: grade de campos em p-4, tabela de borda a borda).
function cartao({ titulo, contexto = '', acao = '', corpo = '', classe = '', atributos = '' }) {
  return `<section class="painel ${classe}" ${atributos}>${cabecalhoCartao(titulo, contexto, acao)}${corpo}</section>`;
}

// Campo do cartão: rótulo em label e valor logo abaixo. Vazio vira "—" na cor de apoio.
function campoValor(rotulo, valorHtml, largura = '') {
  const vazioTxt = valorHtml == null || valorHtml === '' || valorHtml === '—';
  return `
    <div class="${largura} min-w-0">
      <p class="text-xs font-medium ${APOIO}">${esc(rotulo)}</p>
      <div class="text-sm mt-0.5 break-words ${vazioTxt ? APOIO : 'text-slate-800 dark:text-neutral-100'}">${vazioTxt ? '—' : valorHtml}</div>
    </div>`;
}

// Grade de campos de duas colunas dentro do cartão.
const gradeCampos = (campos) => `<div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">${campos.filter(Boolean).join('')}</div>`;

// Abas sobre uma linha de 1px; abas: [{ id, nome, n? }] geram links ?aba=id preservando os demais parâmetros.
// A contagem em tinta 2; `atencao: true` pinta a contagem em âmbar (o que espera alguém).
function abasHtml(abas, ativa) {
  return `
    <nav class="mb-4 flex items-center gap-4 overflow-x-auto overflow-y-hidden [scrollbar-width:none] shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800" aria-label="Seções">
      ${abas.map((a) => {
        const url = new URL(location.href);
        url.searchParams.set('aba', a.id);
        const n = a.n == null || a.n === 0 ? '' : a.atencao
          ? ` <span class="ml-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 text-[11px] font-semibold tabular-nums">${a.n}</span>`
          : ` <span class="ml-1 text-xs tabular-nums text-slate-600 dark:text-neutral-400">${a.n}</span>`;
        return `<a href="${url.pathname.split('/').pop()}${url.search}" class="aba ${a.id === ativa ? 'aba-ativa' : ''}" ${a.id === ativa ? 'aria-current="page"' : ''}>${esc(a.nome)}${n}</a>`;
      }).join('')}
    </nav>`;
}

// Controle segmentado: trilho em etiqueta, segmento ativo elevado. opcoes: [{ id, nome, n? }].
function segmentado(nome, opcoes, ativo, rotulo = '') {
  return `
    <div role="radiogroup" ${rotulo ? `aria-label="${esc(rotulo)}"` : ''} class="inline-flex rounded-lg p-0.5 bg-[color:var(--f-etiqueta)]">
      ${opcoes.map((o) => `<button type="button" role="radio" data-${nome}="${esc(o.id)}" aria-checked="${o.id === ativo}"
        class="h-8 px-3 rounded-md text-[12.5px] font-medium whitespace-nowrap transition ${o.id === ativo ? 'bg-[color:var(--f-elevado)] text-[color:var(--f-tinta)] shadow-[0_1px_2px_rgb(7_30_44/0.08)]' : 'text-[color:var(--f-tinta-2)] hover:text-[color:var(--f-tinta)]'}">${esc(o.nome)}${o.n != null ? ` <span class="tabular-nums text-[color:var(--f-tinta-2)]">${o.n}</span>` : ''}</button>`).join('')}
    </div>`;
}

// Tons de estado. Ponto + texto para fase; pílula só para exceção (sem contorno, canto de 6px).
const TOM = {
  ok: { ponto: 'bg-emerald-500', texto: 'text-emerald-700 dark:text-emerald-400', fundo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  info: { ponto: 'bg-sky-600 dark:bg-sky-400', texto: 'text-sky-700 dark:text-sky-300', fundo: 'bg-petrol-800/10 text-petrol-900 dark:bg-sky-950/60 dark:text-sky-200' },
  atencao: { ponto: 'bg-amber-500', texto: 'text-amber-700 dark:text-amber-400', fundo: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  perigo: { ponto: 'bg-red-500', texto: 'text-red-700 dark:text-red-400', fundo: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' },
  neutro: { ponto: 'bg-slate-400 dark:bg-neutral-500', texto: 'text-slate-500 dark:text-neutral-400', fundo: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400' },
  vazado: { ponto: 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500', texto: 'text-slate-500 dark:text-neutral-400', fundo: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400' },
};

function status(tom, texto, titulo = '', quebra = false) {
  const t = TOM[tom] ?? TOM.neutro;
  return `<span ${titulo ? `title="${esc(titulo)}"` : ''} class="inline-flex items-center gap-1.5 text-sm ${quebra ? '' : 'whitespace-nowrap'} text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 rounded-full shrink-0 ${t.ponto}"></span>${esc(texto)}</span>`;
}

function pilula(tom, texto, titulo = '') {
  const t = TOM[tom] ?? TOM.neutro;
  return `<span ${titulo ? `title="${esc(titulo)}"` : ''} class="pilula inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${t.fundo}">${esc(texto)}</span>`;
}

// Cartão de indicador: rótulo, número (algarismos proporcionais, como pede o Indicador do DESIGN.md) e uma linha de apoio. Com `filtro`, vira botão (data-cartao) que
// filtra a lista com aria-pressed; clicar de novo no ativo limpa o filtro. `cor`: ponto antes do rótulo.
function cartaoNumero({ rotulo, valor, ajuda = '', cor = '', filtro = '', ativo = false, tomValor = '' }) {
  const tag = filtro ? 'button' : 'div';
  return `
    <${tag} ${filtro ? `type="button" data-cartao="${esc(filtro)}" aria-pressed="${ativo}" title="${esc(ativo ? 'Mostrar a lista completa' : `Mostrar só: ${rotulo.toLowerCase()}`)}"` : ''}
      class="painel p-4 min-w-0 text-left ${filtro ? 'flex flex-col justify-start transition hover:border-petrol-800 dark:hover:border-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30' : ''} ${ativo ? 'ring-2 ring-petrol-800/30 dark:ring-sky-400/40 border-petrol-800 dark:border-sky-400' : ''}">
      <p class="text-xs font-medium ${APOIO} flex items-center gap-1.5">${cor ? `<span class="h-2 w-2 rounded-full ${cor}"></span>` : ''}${esc(rotulo)}</p>
      <p class="text-2xl font-semibold leading-7 tracking-[-0.02em] whitespace-nowrap mt-1 ${tomValor || 'text-slate-800 dark:text-neutral-100'}">${valor}</p>
      ${ajuda ? `<p class="text-xs ${APOIO} mt-1.5">${ajuda}</p>` : ''}
    </${tag}>`;
}

function vazio(titulo, texto = '', acao = '') {
  return `
    <div class="px-6 py-14 text-center">
      <p class="text-[15px] font-semibold ${TITULO}">${esc(titulo)}</p>
      ${texto ? `<p class="text-sm ${APOIO} mt-1 max-w-md mx-auto">${texto}</p>` : ''}
      ${acao ? `<div class="mt-4">${acao}</div>` : ''}
    </div>`;
}

// Avatar de pessoa: círculo com as iniciais (48px no cabeçalho da ficha: 'h-12 w-12 text-base').
function avatar(nome, tamanho = 'h-8 w-8 text-xs') {
  return `<span class="${tamanho} shrink-0 rounded-full bg-petrol-800 text-white grid place-items-center font-semibold" aria-hidden="true">${esc(iniciais(nome))}</span>`;
}

function campoBusca(id, valor, placeholder, largura = 'w-72') {
  return `
    <label class="relative ${largura} max-w-full">
      <span class="sr-only">${esc(placeholder)}</span>
      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">${ICONE.lupa.replace('h-4 w-4', 'h-3.5 w-3.5')}</span>
      <input id="${id}" type="search" value="${esc(valor)}" placeholder="${esc(placeholder)}" autocomplete="off" class="${CAMPO_BUSCA}">
    </label>`;
}

function selectFiltro(id, opcoes, valor, rotulo = '') {
  // A primeira opção é o padrão; fora dela, o select fica marcado como filtro ativo.
  return `<select id="${id}" ${rotulo ? `aria-label="${esc(rotulo)}"` : ''} class="${SELECT_FILTRO} ${valor !== opcoes[0]?.id ? FILTRO_ATIVO : ''}">${opcoes.map((o) => `<option value="${esc(o.id)}" ${o.id === valor ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}</select>`;
}

// ---------- Menu "Mais" (js/menu-mais.js do original) ----------
// Popover de 256px alinhado pela direita do gatilho. Esc, Tab ou clique fora fecham; setas andam.
// itens: [{ nome, detalhe?, perigo?, desabilitado?, acao }] ou 'sep'. Item desabilitado continua
// focável, com o motivo em `detalhe` (Regra do Motivo Escrito).
let menuAberto = null;
function fecharMenu() {
  if (!menuAberto) return;
  const { el, gatilho, fora, tecla } = menuAberto;
  menuAberto = null;
  el.remove();
  gatilho.setAttribute('aria-expanded', 'false');
  document.removeEventListener('mousedown', fora, true);
  document.removeEventListener('keydown', tecla, true);
  window.removeEventListener('scroll', fecharMenu, true);
  window.removeEventListener('resize', fecharMenu);
}
function abrirMenu(gatilho, itens) {
  if (menuAberto?.gatilho === gatilho) { fecharMenu(); return; }
  fecharMenu();
  itens = itens.filter(Boolean).filter((it, i, arr) => it !== 'sep' || (i > 0 && i < arr.length - 1 && arr[i - 1] !== 'sep'));
  const el = document.createElement('div');
  el.setAttribute('role', 'menu');
  el.className = 'fixed z-50 w-64 rounded-[10px] border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.28)] p-1.5';
  el.innerHTML = itens.map((it, i) => (it === 'sep' ? '<div role="separator" class="my-1 border-t border-slate-100 dark:border-neutral-900"></div>' : `
    <button type="button" role="menuitem" data-i="${i}" ${it.desabilitado ? 'aria-disabled="true"' : ''}
      class="block w-full text-left px-2.5 py-1.5 rounded-md text-sm transition focus:outline-none ${it.desabilitado ? 'cursor-not-allowed text-slate-400 dark:text-neutral-500 focus:bg-slate-100 dark:focus:bg-neutral-900' : it.perigo ? 'text-red-700 dark:text-red-400 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40' : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-neutral-900 dark:focus:bg-neutral-900'}">
      ${esc(it.nome)}${it.detalhe ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(it.detalhe)}</span>` : ''}
    </button>`)).join('');
  // Posição e largura inline: o Tailwind do CDN só gera classe nova depois que ela entra no DOM, e a medida abaixo vem antes.
  el.style.position = 'fixed';
  el.style.width = '16rem';
  document.body.appendChild(el);
  const r = gatilho.getBoundingClientRect();
  el.style.left = `${Math.max(8, Math.min(r.right - el.offsetWidth, window.innerWidth - el.offsetWidth - 8))}px`;
  el.style.top = `${r.bottom + el.offsetHeight + 8 > window.innerHeight && r.top > el.offsetHeight ? r.top - el.offsetHeight - 4 : r.bottom + 4}px`;
  const botoes = [...el.querySelectorAll('[data-i]')];
  // O foco volta ao gatilho antes da ação: o modal que ela abrir devolve o foco para ele ao fechar.
  botoes.forEach((b) => b.addEventListener('click', () => { const it = itens[Number(b.dataset.i)]; if (it.desabilitado) return; fecharMenu(); gatilho.focus(); it.acao(); }));
  const fora = (e) => { if (!el.contains(e.target) && !gatilho.contains(e.target)) fecharMenu(); };
  const tecla = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); fecharMenu(); gatilho.focus(); }
    else if (e.key === 'Tab') { e.preventDefault(); fecharMenu(); gatilho.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = botoes.indexOf(document.activeElement); botoes[(i + (e.key === 'ArrowDown' ? 1 : -1) + botoes.length) % botoes.length].focus(); }
  };
  document.addEventListener('mousedown', fora, true);
  document.addEventListener('keydown', tecla, true);
  window.addEventListener('scroll', fecharMenu, true);
  window.addEventListener('resize', fecharMenu);
  gatilho.setAttribute('aria-expanded', 'true');
  menuAberto = { el, gatilho, fora, tecla };
  botoes[0]?.focus({ preventScroll: true });
}

const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;

// Linhas clicáveis: <tr class="linha-link" data-href="...">. Ponha também o nome como <a class="link-registro">
// e FOCO_LINHA na <tr>, para quem usa o teclado.
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
