// ============================================================
// Modo de compartilhamento de tela do Portal do Professor.
// Quando o professor projeta a tela para os alunos, oculta o que é
// pessoal dele: financeiro (pagamentos, contratos), avaliações e meus dados.
//
// Estado em localStorage ('prototipo-portal-professor-privacidade-v1' = '1' | ausente),
// aplicado como classe `privacidade` no <html> ANTES do primeiro paint (mesmo
// padrão de tema.js). Carregar logo após tema.js/tooltip.js, de forma síncrona.
//
// Marcações no HTML:
//   [data-privado]          — elemento some com o modo ligado (CSS abaixo).
//   <body data-privado-pagina> — a página inteira é privada: o <main> é escondido
//                             e um painel "Conteúdo oculto" entra no lugar.
// Liga/desliga pelo item "Compartilhar tela" no menu do usuário (injetado em
// #menu-usuario-lista, antes de "Sair"); o chip "Tela compartilhada" no header
// só informa.
// ============================================================

(function () {
  const CHAVE = 'prototipo-portal-professor-privacidade-v1';
  const raiz = document.documentElement;

  function ativa() {
    return localStorage.getItem(CHAVE) === '1';
  }

  // CSS global: some tudo que está marcado como privado. Injetado aqui para não
  // depender de cada página repetir a regra.
  const estilo = document.createElement('style');
  estilo.textContent = 'html.privacidade [data-privado]{display:none !important}';
  document.head.appendChild(estilo);

  const OLHO = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';
  const OLHO_RISCADO = '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>';

  // Chip "Tela compartilhada" no header, à esquerda do botão de tema. Só
  // informativo (sem ação); só com o modo ligado; some em telas < sm.
  function aplicarChip() {
    const ligado = ativa();
    const tema = document.querySelector('header [data-toggle-tema]');
    if (!tema) return;
    let chip = tema.parentElement.querySelector('[data-chip-privacidade]');
    if (ligado && !chip) {
      chip = document.createElement('span');
      chip.setAttribute('data-chip-privacidade', '');
      chip.className = 'hidden sm:inline-flex items-center gap-1.5 rounded-full bg-laranja/20 text-laranja px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap';
      chip.innerHTML = '<span class="h-1.5 w-1.5 rounded-full bg-laranja animate-pulse"></span>Tela compartilhada';
      tema.before(chip);
    } else if (!ligado && chip) {
      chip.remove();
    }
  }

  // Item "Compartilhar tela" no menu do usuário (abre ao clicar no nome), antes
  // do "Sair". Injetado aqui para não repetir o HTML em cada página.
  function aplicarMenu() {
    const lista = document.getElementById('menu-usuario-lista');
    if (!lista) return;
    const ligado = ativa();
    let item = lista.querySelector('[data-menu-privacidade]');
    if (!item) {
      item = document.createElement('button');
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.setAttribute('data-menu-privacidade', '');
      item.className = 'w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900';
      item.addEventListener('click', alternar);
      const sair = document.getElementById('sair');
      const separador = document.createElement('div');
      separador.setAttribute('data-menu-privacidade-separador', '');
      separador.className = 'my-1 border-t border-slate-100 dark:border-neutral-800';
      if (sair) { sair.before(item); sair.before(separador); } else { lista.append(item, separador); }
      lista.classList.replace('w-48', 'w-60');
    }
    const icone = (ligado ? OLHO_RISCADO : OLHO).replace('h-5 w-5', 'h-4 w-4 shrink-0 text-slate-400 dark:text-neutral-500');
    item.innerHTML = `<span class="flex items-center gap-2">${icone}<span class="font-medium">${ligado ? 'Parar de compartilhar' : 'Compartilhar tela'}</span></span>${ligado ? '' : '<span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5 pl-6">Oculta financeiro, avaliações e meus dados</span>'}`;
  }

  // Página inteira privada: esconde o <main> e mostra o painel no lugar.
  function aplicarPagina() {
    if (!document.body?.hasAttribute('data-privado-pagina')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const ligado = ativa();
    let painel = document.getElementById('painel-privacidade');
    if (ligado) {
      main.classList.add('hidden');
      main.setAttribute('aria-hidden', 'true');
      if (!painel) {
        painel = document.createElement('div');
        painel.id = 'painel-privacidade';
        painel.className = 'flex-1 overflow-y-auto p-4 md:p-6 grid place-items-center';
        painel.innerHTML = `
          <div class="cartao max-w-md w-full p-8 text-center">
            <div class="mx-auto h-12 w-12 rounded-full bg-laranja/15 text-laranja grid place-items-center">${OLHO_RISCADO.replace('h-5 w-5', 'h-6 w-6')}</div>
            <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-neutral-100 mt-4">Conteúdo oculto</h2>
            <p class="text-sm text-slate-500 dark:text-neutral-400 mt-2">O modo de compartilhamento de tela está ligado. Estes dados ficam ocultos enquanto você projeta a tela.</p>
            <button type="button" data-mostrar-privacidade class="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-petrol-800 dark:bg-sky-600 text-white text-sm font-medium px-4 py-2 transition hover:bg-petrol-700 dark:hover:bg-sky-500">Mostrar dados</button>
          </div>`;
        painel.querySelector('[data-mostrar-privacidade]').addEventListener('click', alternar);
        main.after(painel);
      }
    } else {
      main.classList.remove('hidden');
      main.removeAttribute('aria-hidden');
      if (painel) painel.remove();
    }
  }

  function aplicar() {
    raiz.classList.toggle('privacidade', ativa());
    aplicarChip();
    aplicarMenu();
    aplicarPagina();
  }

  // Grava e recarrega: as páginas renderizam por JS (home filtra pendências e
  // cartões, aula escolhe a aba), então recarregar é o jeito simples de refletir tudo.
  function alternar() {
    if (ativa()) localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, '1');
    location.reload();
  }

  // Antes do paint.
  raiz.classList.toggle('privacidade', ativa());

  // Alternância feita em outra aba reflete aqui.
  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE) aplicar();
  });

  document.addEventListener('DOMContentLoaded', () => {
    aplicar();
  });

  window.Privacidade = { ativa, alternar, aplicar, CHAVE };
})();
