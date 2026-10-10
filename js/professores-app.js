// ============================================================
// Professores (grupo Pessoas): quem dá aulas, as turmas abertas de cada um
// e o acesso ao Aulor. ?professor=<id> abre a edição.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: '' };
  const usuarioDe = (p) => USUARIOS.find((u) => u.vinculos.some((v) => v.tipo === 'instrutor' && v.id === p.id));
  const editar = (id) => abrirFormProfessor({ professor: Aulor.professor(id), aoSalvar: () => { toast('Professor atualizado'); render(); } });

  function render() {
    const todos = Aulor.professores();
    const termo = normalizarTexto(filtro.q);
    const lista = todos.filter((p) => !termo || normalizarTexto(`${p.nome} ${p.especialidade} ${p.email}`).includes(termo));
    const gerencia = Shell.pode('professores', 'gerenciar');
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Professores', subtitulo: 'Quem dá aulas na escola. Com acesso ao Aulor, o professor vê só as próprias turmas e faz a chamada pelo celular.', acoes: gerencia ? `<button type="button" data-novo class="btn-pri">${ICONE.mais}Novo professor</button>` : '' })}
        <div class="flex flex-wrap items-center gap-2 mb-4">${campoBusca('busca', filtro.q, 'Buscar por nome, especialidade ou e-mail')}</div>
        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Professor</th><th>Especialidade</th><th>Contato</th><th>Turmas abertas</th><th>Acesso ao Aulor</th></tr></thead>
              <tbody>${lista.map((p) => {
                const turmas = Aulor.turmasDoProfessor(p.id).filter((t) => !['concluida', 'cancelada'].includes(Aulor.situacaoTurma(t)));
                const u = usuarioDe(p);
                const acesso = !u ? status('neutro', 'Sem acesso') : u.status === 'ativo' ? status('ok', 'Ativo') : u.status === 'convidado' ? status('atencao', 'Convite enviado') : status('neutro', 'Inativo');
                return `<tr ${gerencia ? `data-editar="${p.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900/60"` : ''}>
                  <td><div class="flex items-center gap-3">${avatar(p.nome)}<span class="font-medium text-slate-900 dark:text-neutral-100">${esc(p.nome)}</span></div></td>
                  <td>${esc(p.especialidade || '—')}</td>
                  <td class="text-sm">${esc(p.email)}<p class="text-xs text-slate-500 dark:text-neutral-400">${telefoneFmt(p.telefone)}</p></td>
                  <td class="text-sm">${turmas.length ? turmas.map((t) => `<a class="link" href="turma.html?id=${t.id}">${esc(t.codigo)}</a>`).join(', ') : '<span class="text-slate-400">—</span>'}</td>
                  <td>${acesso}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : vazio('Nenhum professor encontrado')}
          <p class="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-900 tabular-nums">${lista.length} ${lista.length === 1 ? 'professor' : 'professores'}${filtro.q ? ` de ${todos.length}` : ''}</p>
        </div>
      </div>`;
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('[data-novo]')?.addEventListener('click', () => abrirFormProfessor({ aoSalvar: () => { toast('Professor cadastrado'); render(); } }));
    tela.querySelectorAll('[data-editar]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a')) editar(tr.dataset.editar); }));
  }

  render();
  const id = parametroUrl('professor');
  if (id && Aulor.professor(id) && Shell.pode('professores', 'gerenciar')) editar(id);
})();
