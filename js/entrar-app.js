// ============================================================
// Entrada da demonstração: escolher com quem entrar (sem senha).
// Cada pessoa vê só o que o perfil dela libera. Em produção, aqui é o
// login por e-mail/senha com convite (módulo Platform do backend).
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

  document.body.classList.add('min-h-full', 'ficha', 'bg-papel', 'font-sans', 'antialiased', 'text-tinta');
  document.body.insertAdjacentHTML('afterbegin', `
    <main class="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div class="w-full max-w-3xl">
        <div class="flex items-center gap-3 mb-6">
          <img src="img/aulor-simbolo.svg" alt="" class="h-10 w-10">
          <div>
            <img src="img/aulor-wordmark-escuro.svg" alt="Aulor" class="h-4 w-auto dark:hidden"><img src="img/aulor-wordmark-claro.svg" alt="Aulor" class="h-4 w-auto hidden dark:block">
            <p class="text-xs text-tinta-3 mt-1">${esc(escola.nome)}</p>
          </div>
        </div>
        <div class="bg-elevado border border-linha rounded-xl overflow-hidden">
          <div class="px-6 py-5 border-b border-linha">
            <p class="text-xs font-medium text-cobre-tinta">Demonstração</p>
            <h1 class="font-display text-xl font-semibold text-tinta mt-0.5">Com quem você quer entrar?</h1>
            <p class="text-sm text-tinta-2 mt-1">Cada pessoa da escola vê só o que o perfil de acesso dela permite. Troque de pessoa a qualquer momento pelo seu nome, no topo da tela.</p>
          </div>
          <div class="grid sm:grid-cols-2">
            ${grupos.map((g, i) => `
              <section class="p-4 sm:p-5 ${i ? 'border-t sm:border-t-0 sm:border-l border-linha' : ''}">
                <h2 class="text-xs font-medium text-tinta-2 px-2 mb-2">${esc(g.nome)}</h2>
                <div class="space-y-1">
                  ${g.usuarios.map((u) => `
                    <button type="button" data-entrar="${u.id}" class="w-full flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-realce transition">
                      ${avatar(u.nome, 'h-9 w-9 text-xs')}
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-medium text-tinta">${esc(u.nome)}</span>
                        <span class="block text-xs text-tinta-2 truncate">${esc(u.cargo)} · ${esc(Shell.itensVisiveis(u).map((i) => (i.nomeProfessor && Shell.ehSoProfessor(u) ? i.nomeProfessor : i.nome)).join(', '))}</span>
                      </span>
                      <span class="text-tinta-3">${ICONE.seta}</span>
                    </button>`).join('')}
                </div>
              </section>`).join('')}
          </div>
          <div class="px-6 py-4 bg-faixa border-t border-linha flex flex-wrap items-center justify-between gap-3 text-xs text-tinta-2">
            <p>Sem senha nesta demonstração. Dados fictícios, salvos só neste navegador.</p>
            <a href="validar.html" class="font-medium text-marca-tinta hover:underline">Validar um certificado</a>
          </div>
        </div>
      </div>
    </main>
    <div id="toast-root" class="fixed bottom-5 right-5 z-50"></div>`);

  document.querySelectorAll('[data-entrar]').forEach((b) => b.addEventListener('click', () => {
    Shell.entrar(b.dataset.entrar);
    const u = Shell.usuario();
    const pagina = (volta ?? '').split('?')[0];
    const item = Shell.MENU.find((i) => i.href === pagina);
    location.href = volta && (!item || Shell.podeAlguma(item.features, u)) ? volta : Shell.primeiraPagina(u);
  }));
})();
