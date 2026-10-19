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
  const COR = { critico: 'bg-red-500', alerta: 'bg-amber-500', atencao: 'bg-slate-400 dark:bg-neutral-500' };
  const AJUDA = {
    critico: `começa em até ${R.critico.dias} dias`,
    alerta: `começa em até ${R.alerta.dias} dias`,
    atencao: `mais longe, abaixo de ${R.atencao.ocupacaoMax}% das vagas`,
  };
  const emDias = (n) => (n === 0 ? 'hoje' : n === 1 ? 'amanhã' : `em ${n} dias`);

  function render() {
    const todas = Aulor.turmasEmRisco();
    const lista = todas.filter((r) => !nivel || r.nivel === nivel);
    const emJogo = todas.reduce((s, r) => s + r.valorEmJogo, 0);
    const podeMatricular = Shell.pode('matriculas', 'criar');
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({ titulo: `Turmas em risco de não fechar <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${todas.length}</span>`, subtitulo: 'Turmas a iniciar que ainda não atingiram o mínimo de alunos. Foto de hoje, para quem vende saber cedo onde falta matrícula.' })}

        <div class="grid grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
          ${['critico', 'alerta', 'atencao'].map((id) => cartaoNumero({ rotulo: R[id].nome, valor: todas.filter((r) => r.nivel === id).length, ajuda: AJUDA[id], cor: COR[id], filtro: id, ativo: nivel === id })).join('')}
          ${cartaoNumero({ rotulo: 'Em jogo', valor: moedaCurta(emJogo), ajuda: 'vagas que faltam × valor do curso' })}
        </div>

        <div class="painel overflow-hidden">
          <div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Turma</th><th>Início</th><th>Professor</th><th class="num">Matrículas / mínimo</th><th class="num">Vagas</th><th class="num">Em jogo</th><th>Nível</th>${podeMatricular ? '<th></th>' : ''}</tr></thead>
              <tbody>${lista.length ? lista.map((r) => {
                const t = r.turma;
                const curso = Aulor.curso(t.cursoId).nome;
                return `<tr data-href="turma.html?id=${t.id}" class="${FOCO_LINHA}">
                  <td><span class="font-mono text-xs ${APOIO} mr-1.5 whitespace-nowrap">${esc(t.codigo)}</span><a href="turma.html?id=${t.id}" class="${LINK_REGISTRO}">${esc(curso)}</a></td>
                  <td class="whitespace-nowrap tabular-nums">${dataBr(t.inicio)}<p class="text-xs ${APOIO}">${emDias(r.diasParaInicio)}</p></td>
                  <td>${esc(Aulor.professor(t.professorId).nome)}</td>
                  <td class="num" title="${t.minimoAlunos ? 'Mínimo definido na turma' : 'Sem mínimo na turma: metade das vagas'}">${r.ocupadas} / ${r.minimo}${t.minimoAlunos ? '' : '*'}<p class="text-xs ${TOM[R[r.nivel].tom].texto}">${r.faltam === 1 ? 'falta 1' : `faltam ${r.faltam}`}</p></td>
                  <td class="num">${t.capacidade}<p class="text-xs ${APOIO}">${r.ocupacaoPct}% ocupada</p></td>
                  <td class="num">${moeda(r.valorEmJogo)}</td>
                  <td>${status(R[r.nivel].tom, R[r.nivel].nome)}</td>
                  ${podeMatricular ? `<td class="text-right whitespace-nowrap"><a class="${BOTAO_LINK}" href="matricula-nova.html?turma=${t.id}">Nova venda</a></td>` : ''}
                </tr>`;
              }).join('') : `
                <tr><td colspan="${podeMatricular ? 8 : 7}" class="py-10 text-center text-sm ${APOIO}">${nivel ? `Nenhuma turma neste nível. <button type="button" data-cartao="" class="${BOTAO_LINK} ml-1">Ver todos os níveis</button>` : 'Nenhuma turma em risco: as turmas a iniciar já têm o mínimo de alunos ou começam daqui a muito tempo.'}</td></tr>`}</tbody>
            </table>
          </div>
          <p class="${RODAPE_TABELA}">${lista.length} ${lista.length === 1 ? 'turma' : 'turmas'}${nivel ? ` de ${todas.length}` : ''}</p>
        </div>

        <details class="mt-4 text-sm ${APOIO_FUNDO}">
          <summary class="cursor-pointer w-fit text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2">Como calculamos</summary>
          <ul class="mt-2 ml-5 list-disc space-y-1">
            <li>Entram as turmas que ainda não começaram e têm menos alunos que o mínimo para abrir. O mínimo é definido na turma; sem ele (*), vale metade das vagas.</li>
            <li><b class="font-medium">Crítico</b>: ${AJUDA.critico}. <b class="font-medium">Alerta</b>: ${AJUDA.alerta}. <b class="font-medium">Atenção</b>: ${AJUDA.atencao}.</li>
            <li><b class="font-medium">Em jogo</b>: alunos que faltam × valor de referência do curso.</li>
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
