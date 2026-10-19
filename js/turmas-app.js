// ============================================================
// Turmas: cada turma é um curso do catálogo acontecendo num período, com
// professor, dias, horário e vagas. Mesmo desenho da lista do protótipo
// original, sem os indicadores financeiros que dependem de integrações.
// Filtros na URL: ?situacao=planejada|em_andamento|a_concluir|concluida|cancelada e ?curso=ID.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const SITUACOES = ['em_andamento', 'planejada', 'a_concluir', 'concluida', 'cancelada'];
  const AJUDA = {
    em_andamento: 'entre a primeira e a última aula',
    planejada: 'abertas para matrícula',
    a_concluir: 'aulas terminaram; falta fechar',
    concluida: 'resultado fechado',
    cancelada: 'fora das matrículas',
  };
  const filtro = {
    q: '',
    cursoId: Aulor.curso(parametroUrl('curso')) ? parametroUrl('curso') : '',
    professorId: '',
    situacao: SITUACOES.includes(parametroUrl('situacao')) ? parametroUrl('situacao') : '',
  };

  // Vagas: ocupadas/capacidade; em risco de não fechar, ocupadas/mínimo e quanto falta.
  function celulaAlunos(t) {
    const r = Aulor.riscoTurma(t);
    if (!r) return ocupacaoHtml(t);
    const tom = r.nivel === 'critico' ? 'text-red-700 dark:text-red-400' : AVISO;
    return `<div title="Em risco de não fechar (${Aulor.RISCO[r.nivel].nome.toLowerCase()}): ${r.ocupadas} de ${r.minimo} alunos mínimos, início ${quando(t.inicio)}">
      ${ocupacaoHtml(t, { minimo: true })}
      <p class="text-xs tabular-nums mt-0.5 ${tom}">${r.faltam === 1 ? 'falta 1' : `faltam ${r.faltam}`} para abrir</p>
    </div>`;
  }

  function render() {
    const todas = Aulor.turmas();
    const sit = new Map(todas.map((t) => [t.id, Aulor.situacaoTurma(t)]));
    const contagem = (id) => todas.filter((t) => sit.get(t.id) === id).length;
    const termo = normalizarTexto(filtro.q);
    const lista = todas.filter((t) => {
      if (filtro.situacao ? sit.get(t.id) !== filtro.situacao : ['concluida', 'cancelada'].includes(sit.get(t.id))) return false;
      if (filtro.cursoId && t.cursoId !== filtro.cursoId) return false;
      if (filtro.professorId && t.professorId !== filtro.professorId) return false;
      return !termo || normalizarTexto(`${t.codigo} ${Aulor.curso(t.cursoId).nome} ${Aulor.professor(t.professorId).nome}`).includes(termo);
    }).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const filtrando = !!(filtro.q || filtro.cursoId || filtro.professorId || filtro.situacao);
    const risco = Aulor.turmasEmRisco();
    const criticas = risco.filter((r) => r.nivel === 'critico').length;
    const pendentes = Aulor.chamadasPendentes();

    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({
          titulo: 'Turmas',
          subtitulo: `${plural(todas.length, 'turma')}. Cada turma é um curso do catálogo acontecendo num período, com professor, agenda e vagas; chamada e conclusão acontecem dentro dela.`,
          acoes: Shell.pode('turmas', 'criar') ? `<button type="button" data-nova class="btn-pri">${ICONE.mais}Nova turma</button>` : '',
        })}

        <div class="grid grid-cols-3 xl:grid-cols-5 gap-3 mb-4" role="group" aria-label="Filtrar por situação">
          ${SITUACOES.map((id) => {
            const n = contagem(id);
            return cartaoNumero({ rotulo: Aulor.SITUACAO_TURMA[id].nome, valor: n, ajuda: AJUDA[id], cor: TOM[Aulor.SITUACAO_TURMA[id].tom].ponto, filtro: id, ativo: filtro.situacao === id, tomValor: id === 'a_concluir' && n ? AVISO : '' });
          }).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por código, curso ou professor')}
          ${selectFiltro('f-curso', [{ id: '', nome: 'Todos os cursos' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.cursoId, 'Curso')}
          ${selectFiltro('f-professor', [{ id: '', nome: 'Todos os professores' }, ...Aulor.professores().map((p) => ({ id: p.id, nome: p.nome }))], filtro.professorId, 'Professor')}
          ${filtrando ? '<button type="button" data-limpar class="text-sm font-medium link">Limpar</button>' : ''}
        </div>

        ${risco.length && !filtrando && Shell.pode('turmas') ? faixa(criticas ? 'erro' : 'aviso', `<span class="font-medium tabular-nums">${plural(risco.length, 'turma em risco', 'turmas em risco')} de não fechar</span>${criticas ? `<span class="tabular-nums"> · ${criticas} ${criticas === 1 ? 'crítica' : 'críticas'}, começam em até ${Aulor.RISCO.critico.dias} dias</span>` : ''}. Ainda não atingiram o mínimo de alunos para abrir.`, '<a href="turmas-risco.html" class="font-medium underline-offset-2 hover:underline">Ver turmas em risco</a>') : ''}

        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela table-fixed">
              <thead><tr><th>Turma</th><th class="w-[156px]">Período e agenda</th><th class="w-[160px]">Professor e local</th><th class="w-[144px]">Alunos</th><th class="w-[124px]">Aulas</th><th class="w-[156px]">Situação</th></tr></thead>
              <tbody>${lista.map((t) => {
                const s = sit.get(t.id);
                const c = Aulor.curso(t.cursoId);
                const pr = Aulor.progressoTurma(t);
                const pend = pendentes.filter((a) => a.turmaId === t.id).length;
                const abaixo = ['em_andamento', 'a_concluir'].includes(s) ? Aulor.matriculasDaTurma(t.id).filter((m) => m.status === 'ativa' && Aulor.frequencia(m).abaixo).length : 0;
                return `<tr data-href="turma.html?id=${t.id}" class="${FOCO_LINHA} ${['concluida', 'cancelada'].includes(s) ? 'linha-apagada' : ''}">
                  <td>
                    <p class="truncate"><span class="font-mono text-xs ${APOIO} mr-1.5">${esc(t.codigo)}</span><a href="turma.html?id=${t.id}" class="${LINK_REGISTRO}" title="${esc(c.nome)}">${esc(c.nome)}</a></p>
                    ${pend ? `<p class="text-xs ${AVISO}">${plural(pend, 'chamada pendente', 'chamadas pendentes')}</p>` : `<p class="text-xs ${APOIO}">${c.cargaHoraria} h · ${esc(nomeModalidade(t.agenda.formato))}</p>`}
                  </td>
                  <td><p class="tabular-nums whitespace-nowrap">${dataCurta(t.inicio)} → ${dataCurta(t.fim)}</p><p class="text-xs ${APOIO} truncate" title="${esc(Agenda.descrever(t.agenda))}">${esc(Agenda.descrever(t.agenda))}</p></td>
                  <td><p class="truncate">${esc(Aulor.professor(t.professorId).nome)}</p><p class="text-xs ${APOIO} truncate" title="${esc(t.local)}">${esc(t.local || 'local a definir')}</p></td>
                  <td>${celulaAlunos(t)}</td>
                  <td><span class="inline-flex items-center gap-2" title="${pr.realizadas} de ${pr.total} aulas com chamada">${medidor(pr.percentual, { largura: 'w-12' })}<span class="text-sm tabular-nums">${pr.realizadas}/${pr.total}</span></span></td>
                  <td>${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome, '', true)}${abaixo ? `<a href="alertas-frequencia.html?turma=${t.id}" class="block text-xs text-red-700 dark:text-red-400 hover:underline tabular-nums">${plural(abaixo, 'aluno abaixo', 'alunos abaixo')} da frequência</a>` : ''}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : vazio(todas.length ? 'Nenhuma turma corresponde aos filtros' : 'Nenhuma turma cadastrada ainda')}
          <p class="px-4 py-2.5 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">${plural(lista.length, 'turma')}${filtrando ? ` de ${todas.length}` : ' em andamento, a iniciar ou aguardando conclusão'}</p>
        </div>
      </div>`;
    ligar();
  }

  function espelharUrl() {
    const url = new URL(location.href);
    [['situacao', filtro.situacao], ['curso', filtro.cursoId]].forEach(([k, v]) => { if (v) url.searchParams.set(k, v); else url.searchParams.delete(k); });
    history.replaceState(null, '', url);
    render();
  }

  function ligar() {
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('#f-curso').addEventListener('change', (e) => { filtro.cursoId = e.target.value; espelharUrl(); });
    tela.querySelector('#f-professor').addEventListener('change', (e) => { filtro.professorId = e.target.value; render(); });
    tela.querySelectorAll('[data-cartao]').forEach((b) => b.addEventListener('click', () => { filtro.situacao = filtro.situacao === b.dataset.cartao ? '' : b.dataset.cartao; espelharUrl(); }));
    tela.querySelector('[data-limpar]')?.addEventListener('click', () => { Object.assign(filtro, { q: '', cursoId: '', professorId: '', situacao: '' }); espelharUrl(); });
    tela.querySelector('[data-nova]')?.addEventListener('click', () => abrirFormTurma({ aoSalvar: (t) => { location.href = `turma.html?id=${t.id}&nova=1`; } }));
  }

  render();
})();
