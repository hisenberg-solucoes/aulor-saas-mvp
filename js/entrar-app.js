// ============================================================
// Entrada da demonstração: escolher com quem entrar (sem senha).
// Cada pessoa vê só o que o perfil dela libera. Em produção, aqui é o
// login por e-mail/senha com convite (módulo Platform do backend).
// Página pública, sem shell: fundo da página, marca no topo e um cartão.
// ============================================================

(function () {
  const escola = Aulor.escola();
  const ativos = USUARIOS.filter((u) => u.status === 'ativo');
  const grupos = [
    { nome: 'Equipe da escola', usuarios: ativos.filter((u) => u.vinculos.some((v) => v.tipo === 'colaborador')) },
    { nome: 'Professores', usuarios: ativos.filter((u) => u.vinculos.some((v) => v.tipo === 'instrutor')) },
  ];
  // Só páginas locais do próprio sistema (evita redirecionar para fora ou para javascript:).
  const volta = /^[a-z-]+\.html(\?[\w=&%.-]*)?$/.test(parametroUrl('volta') ?? '') ? parametroUrl('volta') : null;
  const LUA = '<svg class="h-5 w-5 dark:hidden" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>';
  const SOL = '<svg class="h-5 w-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>';

  document.body.classList.add('min-h-full', 'bg-fundo', 'dark:bg-black', 'font-sans', 'antialiased', 'text-slate-800', 'dark:text-neutral-100');
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="min-h-screen flex flex-col">
      <header class="h-14 px-4 md:px-6 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="img/aulor-simbolo.svg" alt="" class="h-9 w-9 shrink-0">
          <div class="leading-tight">
            <img src="img/aulor-wordmark-escuro.svg" alt="Aulor" class="h-4 w-auto dark:hidden">
            <img src="img/aulor-wordmark-claro.svg" alt="Aulor" class="h-4 w-auto hidden dark:block">
            <p class="text-xs ${APOIO_FUNDO} mt-1">${esc(escola.nome)}</p>
          </div>
        </div>
        <button type="button" data-toggle-tema title="Tema escuro" class="p-2 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-200/60 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/50">${LUA}${SOL}</button>
      </header>
      <main class="flex-1 flex items-center justify-center px-4 md:px-6 py-10">
        <div class="w-full max-w-3xl">
          <div class="mb-5">
            <h1 class="text-xl font-semibold tracking-[-0.01em] ${TITULO}">Com quem você quer entrar?</h1>
            <p class="text-sm ${APOIO_FUNDO} mt-0.5">Demonstração: cada pessoa da escola vê só o que o perfil de acesso dela permite. Troque de pessoa a qualquer momento pelo seu nome, no topo da tela.</p>
          </div>
          <div class="painel overflow-hidden">
            <div class="grid sm:grid-cols-2">
              ${grupos.map((g, i) => `
                <section class="p-4 ${i ? 'border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-neutral-800' : ''}">
                  <h2 class="text-xs font-medium ${APOIO} px-2 mb-2">${esc(g.nome)} <span class="tabular-nums">${g.usuarios.length}</span></h2>
                  <div class="space-y-0.5">
                    ${g.usuarios.map((u) => `
                      <button type="button" data-entrar="${u.id}" class="group w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-neutral-900 focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)] transition">
                        ${avatar(u.nome, 'h-9 w-9 text-xs')}
                        <span class="min-w-0 flex-1">
                          <span class="block text-sm font-medium ${TITULO}">${esc(u.nome)}</span>
                          <span class="block text-xs ${APOIO} truncate">${esc(u.cargo)} · ${esc(Shell.itensVisiveis(u).map((i) => (i.nomeProfessor && Shell.ehSoProfessor(u) ? i.nomeProfessor : i.nome)).join(', '))}</span>
                        </span>
                        <span class="text-slate-400 dark:text-neutral-500 group-hover:text-petrol-800 dark:group-hover:text-sky-300 transition">${ICONE.seta}</span>
                      </button>`).join('')}
                  </div>
                </section>`).join('')}
            </div>
            <div class="px-4 py-3 bg-slate-50 dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs ${APOIO}">
              <p>Sem senha nesta demonstração. Dados fictícios, salvos só neste navegador.</p>
              <a href="validar.html" class="font-medium link">Validar um certificado</a>
            </div>
          </div>
        </div>
      </main>
    </div>
    <div id="toast-root" class="fixed bottom-5 right-5 z-50"></div>`);

  document.querySelectorAll('[data-entrar]').forEach((b) => b.addEventListener('click', () => {
    Shell.entrar(b.dataset.entrar);
    const u = Shell.usuario();
    const pagina = (volta ?? '').split('?')[0];
    const item = Shell.MENU.find((i) => i.href === pagina);
    location.href = volta && (!item || Shell.podeAlguma(item.features, u)) ? volta : Shell.primeiraPagina(u);
  }));
})();
