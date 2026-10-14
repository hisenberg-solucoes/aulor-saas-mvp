// ============================================================
// Turmas em risco de não fechar (grupo Comercial): turmas a iniciar que
// ainda não têm o mínimo de alunos. Regra em Aulor.riscoTurma (a mesma do
// protótipo original). Filtro por nível na URL: ?nivel=critico|alerta|atencao.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const R = Aulor.RISCO;
  let nivel = R[parametroUrl('nivel')] ? parametroUrl('nivel') : '';
  const COR = { critico: 'bg-ruim', alerta: 'bg-cobre', atencao: 'bg-tinta-3/60' };
  const AJUDA = {
    critico: `começa em até ${R.critico.dias} dias`,
    alerta: `começa em até ${R.alerta.dias} dias`,
    atencao: `mais longe, com menos de ${R.atencao.ocupacaoMax}% das vagas`,
  };
  const emDias = (n) => (n === 0 ? 'hoje' : n === 1 ? 'amanhã' : `em ${n} dias`);

  function render() {
    const todas = Aulor.turmasEmRisco();
    const lista = todas.filter((r) => !nivel || r.nivel === nivel);
    const emJogo = todas.reduce((s, r) => s + r.valorEmJogo, 0);
    const podeMatricular = Shell.pode('matriculas', 'criar');
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Turmas em risco de não fechar', subtitulo: 'Turmas a iniciar que ainda não atingiram o mínimo de alunos. Foco de hoje para quem vende: saber cedo onde falta matrícula.' })}

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          ${['critico', 'alerta', 'atencao'].map((id) => cartaoNumero({ rotulo: R[id].nome, valor: todas.filter((r) => r.nivel === id).length, ajuda: AJUDA[id], cor: COR[id], filtro: id, ativo: nivel === id })).join('')}
          ${cartaoNumero({ rotulo: 'Em jogo', valor: moedaCurta(emJogo), ajuda: 'vagas que faltam × valor do curso' })}
        </div>

        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Turma</th><th>Início</th><th>Professor</th><th title="Matrículas / vagas; o traço marca o mínimo para abrir">Alunos</th><th class="num">Em jogo</th><th>Nível</th><th></th></tr></thead>
              <tbody>${lista.map((r) => {
                const t = r.turma;
                return `<tr data-href="turma.html?id=${t.id}">
                  <td><a href="turma.html?id=${t.id}" class="font-medium text-tinta hover:underline whitespace-nowrap">${esc(t.codigo)}</a><p class="text-xs text-tinta-2 truncate max-w-[11rem]" title="${esc(Aulor.curso(t.cursoId).nome)}">${esc(Aulor.curso(t.cursoId).nome)}</p></td>
                  <td class="whitespace-nowrap tabular-nums text-sm">${dataBr(t.inicio)}<p class="text-xs text-tinta-2">${emDias(r.diasParaInicio)}</p></td>
                  <td>${esc(Aulor.professor(t.professorId).nome)}</td>
                  <td>${ocupacaoHtml(t, { minimo: true })}<p class="text-xs ${r.nivel === 'critico' ? 'text-ruim' : 'text-tinta-2'}" title="${t.minimoAlunos ? 'Mínimo definido na turma' : 'Sem mínimo na turma: metade das vagas'}">mínimo ${r.minimo}${t.minimoAlunos ? '' : '*'} · ${r.faltam === 1 ? 'falta 1' : `faltam ${r.faltam}`}</p></td>
                  <td class="num">${moeda(r.valorEmJogo)}</td>
                  <td>${status(R[r.nivel].tom, R[r.nivel].nome)}</td>
                  <td class="text-right whitespace-nowrap">${podeMatricular ? `<a class="btn-sec btn-pequeno" href="matricula-nova.html?turma=${t.id}">Matricular</a>` : ''}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : vazio(nivel ? 'Nenhuma turma neste nível' : 'Nenhuma turma em risco', 'Todas as turmas a iniciar já têm o mínimo de alunos ou começam daqui a muito tempo.')}
          <p class="px-4 py-2.5 text-xs text-tinta-2 border-t border-linha tabular-nums">${lista.length} ${lista.length === 1 ? 'turma' : 'turmas'}${nivel ? ` de ${todas.length}` : ''}</p>
        </div>

        <details class="mt-4 text-sm text-tinta-2">
          <summary class="cursor-pointer font-medium text-tinta">Como calculamos</summary>
          <ul class="mt-2 ml-5 list-disc space-y-1">
            <li>Entram as turmas que ainda não começaram e têm menos alunos que o mínimo para abrir. O mínimo é definido na turma; sem ele (*), vale metade das vagas.</li>
            <li><b>Crítico</b>: ${AJUDA.critico}. <b>Alerta</b>: ${AJUDA.alerta}. <b>Atenção</b>: ${AJUDA.atencao}.</li>
            <li><b>Em jogo</b>: alunos que faltam × valor de referência do curso.</li>
          </ul>
        </details>
      </div>`;
    ligarLinhasLink(tela);
    tela.querySelectorAll('[data-cartao]').forEach((b) => b.addEventListener('click', () => {
      nivel = nivel === b.dataset.cartao ? '' : b.dataset.cartao;
      const url = new URL(location.href);
      if (nivel) url.searchParams.set('nivel', nivel); else url.searchParams.delete('nivel');
      history.replaceState(null, '', url);
      render();
    }));
  }

  render();
})();
