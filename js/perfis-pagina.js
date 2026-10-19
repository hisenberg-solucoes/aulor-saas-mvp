// ============================================================
// Monta, dentro do shell do MVP, os contêineres que o app de permissões
// reaproveitado (js/permissoes-app.js) espera encontrar na página —
// a mesma marcação estática de perfis.html/perfil.html do original
// (Ficha em cartões: título, contagem e frase de contexto sobre o fundo).
// ============================================================

(function () {
  const tela = document.getElementById('tela');
  if (!tela) return;
  const detalhe = document.body.dataset.modo === 'detalhe';
  const gerenciar = Shell.pode('perfis-acesso', 'gerenciar');
  const html = detalhe
    ? '<div id="detalhe-perfil"></div>'
    : `<div class="flex-none mb-4 flex items-end justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h2 class="font-display text-xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100">Quem pode o quê</h2>
          <p id="resumo-perfis" class="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-neutral-400"></p>
          <p class="mt-0.5 text-sm text-slate-600 dark:text-neutral-400">Cada perfil define o que a pessoa vê e faz. O usuário soma os perfis que recebe e pode ter permissões adicionais (em Pessoas › <a class="link" href="usuarios.html">Usuários</a>).</p>
        </div>
        ${gerenciar ? '<button id="btn-novo-perfil" type="button" class="btn-pri shrink-0"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>Novo perfil</button>' : ''}
      </div>
      <div id="troca-visao" class="flex-none"></div>
      <div id="visao-perfis"><div id="lista-perfis"></div></div>
      <div id="visao-matriz" hidden></div>`;
  // Sem acesso: o shell já mostrou o aviso; os contêineres ficam ocultos só para o app não quebrar.
  if (!Shell.permitido) { tela.insertAdjacentHTML('beforeend', `<div hidden>${html}</div>`); return; }
  if (detalhe) { tela.innerHTML = `<div>${html}</div>`; return; }
  // Lista: coluna flexível como o <main> do original; nas matrizes o app trava a altura (min-h-0) para elas rolarem dentro do cartão.
  tela.classList.add('flex', 'flex-col');
  tela.innerHTML = `<div class="w-full flex-1 flex flex-col">${html}</div>`;
})();
