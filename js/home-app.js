// ============================================================
// Meu dia por perfil + catálogo gerado pelo menu compartilhado.
// Cada papel (administração, diretoria, comercial,
// pedagógico, suporte, financeiro) abre com a resposta à SUA pergunta do
// dia — 4 sinais, pendências acionáveis, agenda e atalhos (a navegação
// completa por módulos fica na sidebar do menu.js, que na home lista
// todos os grupos).
// Conteúdo demonstrativo em js/home-data.js; perfil persiste em
// localStorage e pode vir por ?perfil=. Depende de chamados-graficos.js.
// ============================================================

const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm';
const SELECT_FILTRO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400';
const CHAVE_PERFIL = 'prototipo-home-perfil-v1';

const escH = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const NIVEL = {
  critico: 'bg-red-500', alerta: 'bg-amber-400', info: 'bg-sky-400',
};

function perfilAtual() {
  const url = new URLSearchParams(location.search).get('perfil');
  const salvo = localStorage.getItem(CHAVE_PERFIL);
  const id = url || salvo || 'administracao';
  return HOME_PERFIS.find((p) => p.id === id) ?? HOME_PERFIS[0];
}

function cartaoSecao(titulo, subtitulo, html, extra = '', acao = '') {
  return `
    <section class="${CARTAO} p-4 ${extra}">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div><h3 class="font-display font-semibold text-slate-800 dark:text-neutral-100">${titulo}</h3>${subtitulo ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${subtitulo}</p>` : ''}</div>
        ${acao}
      </div>
      ${html}
    </section>`;
}

function tileHome(t) {
  const html = tile({ rotulo: t.rotulo, valor: t.valor, sufixo: t.sufixo ?? '', tom: t.tom ?? 'neutro', ajuda: t.ajuda ?? '', fundo: true });
  const comTip = t.tip ? html.replace('<div class="', `<div data-tip="${escH(t.tip)}" class="`) : html;
  return t.href ? `<a href="${t.href}" class="block hover:opacity-90 transition">${comTip}</a>` : comTip;
}

function listaPendencias(itens) {
  return `<ul class="divide-y divide-slate-100 dark:divide-neutral-900">${itens.map((p) => `
    <li><a href="${p.href}" class="group flex items-start gap-2.5 py-2.5 -mx-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-900 transition">
      <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full ${NIVEL[p.nivel] ?? NIVEL.info}"></span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${escH(p.texto)}</span>
        ${p.detalhe ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${escH(p.detalhe)}</span>` : ''}
      </span>
      <svg class="h-4 w-4 mt-0.5 shrink-0 text-slate-300 dark:text-neutral-600 group-hover:text-slate-500 dark:group-hover:text-neutral-300 transition" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
    </a></li>`).join('')}</ul>`;
}

function listaHoje(itens) {
  return `<ul class="space-y-2">${itens.map((i) => `
    <li><a href="${i.href}" class="group block rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2 hover:border-petrol-800 dark:hover:border-sky-400 transition">
      <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${escH(i.titulo)}</span>
      <span class="block text-xs text-slate-500 dark:text-neutral-400">${escH(i.sub)}</span>
    </a></li>`).join('')}</ul>`;
}

// Cor do selo por grupo do menu (mesma paleta dos botões da tela do CEO).
const CORES_GRUPO = {
  'diretoria': { selo: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300', hover: 'hover:border-sky-400 dark:hover:border-sky-500' },
  'comercial': { selo: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300', hover: 'hover:border-orange-400 dark:hover:border-orange-500' },
  'pedagogico': { selo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', hover: 'hover:border-emerald-400 dark:hover:border-emerald-500' },
  'financeiro': { selo: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300', hover: 'hover:border-violet-400 dark:hover:border-violet-500' },
  'suporte-e-ti': { selo: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300', hover: 'hover:border-teal-400 dark:hover:border-teal-500' },
  'secretaria-e-operacao': { selo: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', hover: 'hover:border-amber-400 dark:hover:border-amber-500' },
  'pessoas': { selo: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300', hover: 'hover:border-pink-400 dark:hover:border-pink-500' },
  'configuracoes': { selo: 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300', hover: 'hover:border-slate-400 dark:hover:border-neutral-500' },
};
const PADRAO_ATALHO = {
  selo: 'bg-petrol-800/10 text-petrol-800 dark:bg-petrol-700/40 dark:text-sky-300', hover: 'hover:border-petrol-800 dark:hover:border-sky-400',
  icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />',
};

// Ícone e grupo do módulo, reaproveitando MENU_GRUPOS (menu.js já carregou: render roda no DOMContentLoaded).
function infoAtalho(href) {
  let base = href.split('?')[0];
  if (typeof MENU_ALIAS !== 'undefined' && MENU_ALIAS[base]) base = MENU_ALIAS[base]; // páginas de detalhe herdam o item da lista
  if (typeof MENU_GRUPOS !== 'undefined') {
    for (const g of MENU_GRUPOS) {
      const item = g.itens.find((i) => i.href === base);
      if (item) return { icone: item.icone, grupoNome: g.nome, ...(CORES_GRUPO[g.id] ?? {}), ...(CORES_GRUPO[g.id] ? {} : { selo: PADRAO_ATALHO.selo, hover: PADRAO_ATALHO.hover }) };
    }
  }
  return { icone: PADRAO_ATALHO.icone, grupoNome: '', selo: PADRAO_ATALHO.selo, hover: PADRAO_ATALHO.hover };
}

function atalhos(itens) {
  return `<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">${itens.map((a) => {
    const info = infoAtalho(a.href);
    return `
    <a href="${a.href}" class="${CARTAO} group flex items-center gap-3 px-4 py-4 ${info.hover} transition">
      <span class="h-11 w-11 shrink-0 rounded-lg grid place-items-center ${info.selo}">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor">${info.icone}</svg>
      </span>
      <span class="min-w-0 flex-1 leading-tight">
        <span class="block text-sm font-semibold text-slate-800 dark:text-neutral-100">${escH(a.nome)}</span>
        ${info.grupoNome ? `<span class="block text-xs text-slate-500 dark:text-neutral-400 truncate">${escH(info.grupoNome)}</span>` : ''}
      </span>
      <svg class="h-5 w-5 shrink-0 text-slate-300 dark:text-neutral-600 group-hover:text-slate-500 dark:group-hover:text-neutral-300 group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
    </a>`;
  }).join('')}</div>`;
}

function atualizarChip(pessoa) {
  const ini = document.getElementById('chip-iniciais');
  const nome = document.getElementById('chip-nome');
  const papel = document.getElementById('chip-papel');
  if (ini) ini.textContent = pessoa.iniciais;
  if (nome) nome.textContent = pessoa.nome;
  if (papel) papel.textContent = pessoa.papel;
}

function renderHome() {
  const el = document.getElementById('home-tela');
  const p = perfilAtual();
  atualizarChip(p.pessoa);

  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Olá, ${escH(p.pessoa.nome.split(' ')[0])}</h2>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">${escH(p.pergunta)} · terça-feira, 26/08/2026 · valores demonstrativos.</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400" for="home-perfil">Perfil</label>
        <select id="home-perfil" class="${SELECT_FILTRO}">${HOME_PERFIS.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${escH(x.nome)}</option>`).join('')}</select>
      </div>
    </div>

    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">${p.tiles.map(tileHome).join('')}</div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
      ${cartaoSecao('Requer atenção', 'O que precisa da sua ação, do mais urgente para o menos.', listaPendencias(p.pendencias), 'xl:col-span-2')}
      ${cartaoSecao(escH(p.hoje.titulo), 'Posição de hoje.', listaHoje(p.hoje.itens))}
    </div>

    ${atalhos(p.atalhos)}
    <div class="mt-6"></div>`;

  document.getElementById('home-perfil').addEventListener('change', (e) => {
    localStorage.setItem(CHAVE_PERFIL, e.target.value);
    history.replaceState(null, '', location.pathname);
    renderHome();
  });
}

function renderCatalogo() {
  atualizarChip(perfilAtual().pessoa);
  document.getElementById('titulo-pagina').textContent = 'Todos os módulos';
  document.title = 'Aulor · Todos os módulos';
  document.getElementById('home-tela').innerHTML = `
    <div class="mb-5">
      <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Todos os módulos</h2>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Mapa completo da solução, organizado por área.</p>
    </div>
    <div class="space-y-6">${MENU_GRUPOS.map((grupo) => `
      <section aria-labelledby="catalogo-${grupo.id}">
        <h3 id="catalogo-${grupo.id}" class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">${escH(grupo.nome)}</h3>
        ${atalhos(grupo.itens.map((item) => ({ href: item.href, nome: item.nome })))}
      </section>`).join('')}
    </div>`;
}

function iniciarHome() {
  if (new URLSearchParams(location.search).get('visao') === 'modulos') renderCatalogo();
  else renderHome();
}

document.addEventListener('DOMContentLoaded', iniciarHome);
