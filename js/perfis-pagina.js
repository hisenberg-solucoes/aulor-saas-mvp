// ============================================================
// Monta, dentro do shell do MVP, os contêineres que o app de permissões
// reaproveitado (js/permissoes-app.js) espera encontrar na página —
// a mesma marcação estática de perfis.html/perfil.html do original
// (direção Ficha: a página vai de borda a borda, sem o recuo do shell).
// ============================================================

(function () {
  const tela = document.getElementById('tela');
  if (!tela) return;
  const detalhe = document.body.dataset.modo === 'detalhe';
  const gerenciar = Shell.pode('perfis-acesso', 'gerenciar');
  const html = detalhe
    ? '<div id="detalhe-perfil"></div>'
    : `<div class="flex-none px-6 pt-5 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-xl font-semibold tracking-[-0.01em]">Quem pode o quê</h2>
          <p id="resumo-perfis" class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-tinta-2"></p>
        </div>
        ${gerenciar ? '<button id="btn-novo-perfil" type="button" class="btn-pri"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>Novo perfil</button>' : ''}
      </div>
      <div id="troca-visao" class="flex-none mt-3 px-6 border-b border-linha"></div>
      <div id="visao-perfis" class="flex-1 min-h-0 flex flex-col">
        <div id="lista-perfis" class="flex-1 min-h-0 flex flex-col"></div>
      </div>
      <div id="visao-matriz" class="flex-1 min-h-0 flex flex-col" hidden></div>`;
  // Sem acesso: o shell já mostrou o aviso; os contêineres ficam ocultos só para o app não quebrar.
  if (!Shell.permitido) { tela.insertAdjacentHTML('beforeend', `<div hidden>${html}</div>`); return; }
  tela.classList.remove('p-4', 'md:p-6');
  // A lista rola por dentro (cabeçalho e abas fixos), como o <main> do original.
  if (!detalhe) { tela.classList.remove('overflow-y-auto'); tela.classList.add('min-h-0', 'flex', 'flex-col'); }
  tela.innerHTML = html;
})();
