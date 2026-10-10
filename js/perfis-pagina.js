// ============================================================
// Monta, dentro do shell do MVP, os contêineres que o app de permissões
// reaproveitado (js/permissoes-app.js) espera encontrar na página —
// a mesma marcação estática de perfis.html/perfil.html do original.
// ============================================================

(function () {
  const tela = document.getElementById('tela');
  if (!tela) return;
  const detalhe = document.body.dataset.modo === 'detalhe';
  const gerenciar = Shell.pode('perfis-acesso', 'gerenciar');
  const html = detalhe
    ? '<div id="detalhe-perfil"></div>'
    : `<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Perfis de acesso</h2>
          <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Cada perfil define o que a pessoa vê e faz. O usuário soma os perfis que recebe e pode ter permissões adicionais (em Pessoas › <a class="link" href="usuarios.html">Usuários</a>).</p>
        </div>
        ${gerenciar ? '<button id="btn-novo-perfil" class="btn-pri"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>Novo perfil</button>' : ''}
      </div>
      <div id="troca-visao" class="mb-5 border-b border-slate-200 dark:border-neutral-800"></div>
      <div id="visao-perfis"><div id="lista-perfis"></div></div>
      <div id="visao-matriz" class="hidden"></div>`;
  // Sem acesso: o shell já mostrou o aviso; os contêineres ficam ocultos só para o app não quebrar.
  if (!Shell.permitido) { tela.insertAdjacentHTML('beforeend', `<div hidden>${html}</div>`); return; }
  tela.innerHTML = `<div class="max-w-6xl mx-auto">${html}</div>`;
})();
