// ============================================================
// Monta, no MVP, o que as telas de Pessoas trazidas do protótipo original
// (colaboradores-app.js, instrutores-app.js e o cadastro público do
// instrutor) esperam encontrar na página — a mesma marcação estática das
// páginas do original. Carregar logo antes do app.
//
// Sistema da escola: o shell já montou #tela, #modal-root e #toast-root; falta
// o #drawer-root. Perfil que só visualiza (sem "gerenciar") vê a tela sem os
// botões que alteram dados (CSS em styles.css) e não grava nada.
// Página pública (data-sem-layout): cabeçalho do cadastro, #tela e #toast-root.
// ============================================================

(function () {
  if (document.body.hasAttribute('data-sem-layout')) {
    document.body.classList.add('min-h-full', 'bg-areia', 'dark:bg-black', 'font-sans', 'text-slate-800', 'dark:text-neutral-100', 'antialiased');
    document.body.insertAdjacentHTML('afterbegin', `
      <header class="h-14 bg-petrol-950 dark:bg-petrol-900 text-slate-300 border-b border-white/10 px-4 md:px-6 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="img/aulor-simbolo.svg" alt="" class="h-10 w-10 shrink-0">
          <div class="leading-tight">
            <img src="img/aulor-wordmark-claro.svg" alt="Aulor" class="h-4 w-auto">
            <p class="text-[11px] text-slate-400 mt-1">Cadastro do instrutor · ${esc(Aulor.escola().nome)}</p>
          </div>
        </div>
        <button type="button" data-toggle-tema title="Tema escuro" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition">
          <svg class="h-5 w-5 dark:hidden" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
          <svg class="h-5 w-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
        </button>
      </header>
      <main class="max-w-3xl mx-auto p-4 md:p-8"><div id="tela"></div></main>
      <div id="toast-root" class="fixed bottom-5 right-5 z-50 space-y-2"></div>`);
    return;
  }

  document.body.insertAdjacentHTML('beforeend', '<div id="drawer-root"></div>');
  const tela = document.getElementById('tela');
  if (!tela) return; // sem sessão: o shell já está levando para entrar.html
  // Sem acesso: o shell já mostrou o aviso; o app desenha num #tela oculto só para não quebrar.
  if (!Shell.permitido) {
    tela.id = 'tela-shell';
    tela.insertAdjacentHTML('beforeend', '<div id="tela" hidden></div>');
    return;
  }
  if (!Shell.pode(document.body.dataset.acesso, 'gerenciar')) {
    document.body.dataset.soLeitura = '';
    const bloquear = () => { toast('Seu perfil só visualiza esta tela.'); throw new Error('Somente leitura'); };
    Instrutores.salvar = bloquear;
    if (typeof Colaboradores !== 'undefined') Colaboradores.salvar = bloquear;
  }
})();
