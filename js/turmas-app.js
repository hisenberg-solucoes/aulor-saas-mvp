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

  // Matrículas: ocupadas/vagas em texto; em risco de não fechar, ponto do nível + ocupadas/mínimo e quanto falta.
  function celulaMatriculas(t) {
    const o = Aulor.ocupacao(t);
    const r = Aulor.riscoTurma(t);
    if (!r) return `<span class="tabular-nums text-xs" title="${o.ocupadas} matrículas em ${o.capacidade} vagas">${o.ocupadas}<span class="${APOIO}">/${o.capacidade}</span></span>`;
    return `<div class="whitespace-nowrap" title="Em risco de não fechar (${Aulor.RISCO[r.nivel].nome.toLowerCase()}): ${r.ocupadas} de ${r.minimo} alunos mínimos, início ${quando(t.inicio)}">
      <p class="flex items-center gap-1.5 text-xs tabular-nums ${r.nivel === 'critico' ? 'text-red-700 dark:text-red-400' : AVISO}"><span class="h-2 w-2 shrink-0 rounded-full ${TOM[Aulor.RISCO[r.nivel].tom].ponto}" aria-hidden="true"></span><span class="font-medium">${r.ocupadas}/${r.minimo}</span><span class="opacity-70">mín.</span></p>
      <p class="text-[11px] ${APOIO} tabular-nums mt-0.5">${r.faltam === 1 ? 'falta 1' : `faltam ${r.faltam}`} · ${o.capacidade} vagas</p>
    </div>`;
  }

  // Aulas: com chamada/previstas e o percentual em cima, o medidor embaixo (barraConclusao do original).
  function celulaAulas(t) {
    const pr = Aulor.progressoTurma(t);
    return `<div title="${pr.realizadas} de ${pr.total} aulas com chamada">
      <div class="flex items-center justify-between text-xs tabular-nums"><span class="text-slate-700 dark:text-neutral-200">${pr.realizadas}/${pr.total}</span><span class="${APOIO}">${pr.percentual}%</span></div>
      <div class="mt-1 flex">${medidor(pr.percentual, { largura: 'w-full' })}</div>
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

    // Os selects ficam em max-w-32, como no original: o nome de curso mais longo não estica a barra.
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({
          titulo: 'Turmas',
          subtitulo: 'Cada turma é um curso do catálogo acontecendo num período, com agenda, professor, local e vagas. Chamada, notas e conclusão acontecem dentro dela.',
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
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <span class="flex max-w-32">${selectFiltro('f-curso', [{ id: '', nome: 'Curso' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.cursoId, 'Curso')}</span>
            <span class="flex max-w-32">${selectFiltro('f-professor', [{ id: '', nome: 'Professor' }, ...Aulor.professores().map((p) => ({ id: p.id, nome: p.nome }))], filtro.professorId, 'Professor')}</span>
            ${filtrando ? `<button type="button" data-limpar class="${BOTAO_LINK}">Limpar</button>` : ''}
          </div>
        </div>

        ${risco.length && !filtrando && Shell.pode('turmas') ? faixa(criticas ? 'erro' : 'aviso', `<span class="font-medium tabular-nums">${plural(risco.length, 'turma em risco', 'turmas em risco')} de não fechar</span>${criticas ? `<span class="tabular-nums"> · ${criticas} ${criticas === 1 ? 'crítica' : 'críticas'}, começam em até ${Aulor.RISCO.critico.dias} dias</span>` : ''}. Ainda não atingiram o mínimo de alunos para abrir.`, '<a href="turmas-risco.html" class="font-medium underline-offset-2 hover:underline">Ver turmas em risco</a>') : ''}

        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela table-fixed">
              <thead><tr><th>Turma</th><th class="w-[168px]">Período e agenda</th><th class="w-[168px]">Professor e local</th><th class="w-[104px]" title="Matrículas que ocupam vaga / vagas. Em risco de não fechar: matrículas / mínimo de alunos.">Matrículas</th><th class="w-[104px]" title="Aulas com chamada / previstas">Aulas</th><th class="w-[144px]">Situação</th></tr></thead>
              <tbody>${lista.map((t) => {
                const s = sit.get(t.id);
                const c = Aulor.curso(t.cursoId);
                const pend = pendentes.filter((a) => a.turmaId === t.id).length;
                const abaixo = ['em_andamento', 'a_concluir'].includes(s) ? Aulor.matriculasDaTurma(t.id).filter((m) => m.status === 'ativa' && Aulor.frequencia(m).abaixo).length : 0;
                return `<tr data-href="turma.html?id=${t.id}" class="${FOCO_LINHA} ${['concluida', 'cancelada'].includes(s) ? 'linha-apagada' : ''}">
                  <td>
                    <p class="truncate"><span class="font-mono text-xs ${APOIO} mr-1.5">${esc(t.codigo)}</span><a href="turma.html?id=${t.id}" class="${LINK_REGISTRO}" title="${esc(c.nome)}">${esc(c.nome)}</a></p>
                    ${pend ? `<p class="text-xs ${AVISO} truncate">${plural(pend, 'chamada pendente', 'chamadas pendentes')}</p>` : `<p class="text-xs ${APOIO} truncate">${c.cargaHoraria} h · ${esc(nomeModalidade(t.agenda.formato))}</p>`}
                  </td>
                  <td><p class="tabular-nums whitespace-nowrap">${dataCurta(t.inicio)} → ${dataCurta(t.fim)}</p><p class="text-xs ${APOIO} truncate" title="${esc(Agenda.descrever(t.agenda))}">${esc(Agenda.descrever(t.agenda))}</p></td>
                  <td><p class="truncate">${esc(Aulor.professor(t.professorId).nome)}</p><p class="text-xs ${APOIO} truncate" title="${esc(t.local)}">${esc(t.local || 'local a definir')}</p></td>
                  <td>${celulaMatriculas(t)}</td>
                  <td>${celulaAulas(t)}</td>
                  <td>${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome, '', true)}${abaixo ? `<a href="alertas-frequencia.html?turma=${t.id}" class="block text-xs text-red-700 dark:text-red-400 hover:underline tabular-nums">${plural(abaixo, 'aluno abaixo', 'alunos abaixo')} da frequência</a>` : ''}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : vazio(todas.length ? 'Nenhuma turma corresponde aos filtros' : 'Nenhuma turma cadastrada ainda')}
          <p class="${RODAPE_TABELA}">${plural(lista.length, 'turma')}${filtrando ? ` de ${todas.length}` : ' em andamento, a iniciar ou aguardando conclusão'}</p>
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
