// ============================================================
// Certificados, na direção Ficha em cartões: prontos para emitir (aprovados
// em turmas concluídas, com emissão em lote), emitidos (histórico com código
// de validação) e não liberados (com o motivo). A regra de elegibilidade é
// uma só: Aulor.elegibilidade(). ?turma= recorta uma turma; ?aba= a visão.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtroTurma = parametroUrl('turma');
  const daTurma = (m) => !filtroTurma || m.turmaId === filtroTurma;

  const prontos = () => Aulor.prontosParaEmitir().filter(daTurma);
  const emitidos = () => [...Aulor.certificados()].filter((c) => !filtroTurma || c.turmaId === filtroTurma).sort((a, b) => b.emitidoEm.localeCompare(a.emitidoEm) || b.id.localeCompare(a.id));
  const bloqueados = () => Aulor.matriculas().filter((m) => m.status === 'concluida' && daTurma(m) && Aulor.elegibilidade(m).id === 'bloqueado');

  const abas = () => [
    { id: 'prontos', nome: 'Prontos para emitir', n: prontos().length, atencao: true },
    { id: 'emitidos', nome: 'Emitidos', n: emitidos().length },
    { id: 'bloqueados', nome: 'Não liberados', n: bloqueados().length },
  ];
  let aba = ['prontos', 'emitidos', 'bloqueados'].includes(parametroUrl('aba')) ? parametroUrl('aba') : (prontos().length ? 'prontos' : 'emitidos');

  const cursoTurma = (turmaId) => { const t = Aulor.turma(turmaId); return `<span class="block truncate">${esc(Aulor.curso(t.cursoId).nome)}</span><span class="block text-xs ${APOIO}"><span class="font-mono">${esc(t.codigo)}</span> · concluída em ${dataBr(t.concluidaEm)}</span>`; };
  const nomeAluno = (href, nome, pilulas = '') => `<p class="flex flex-wrap items-center gap-x-2 gap-y-0.5"><a href="${href}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(nome)}</a>${pilulas}</p>`;
  const nota = (m) => (m.notaFinal == null ? `<span class="${APOIO}">—</span>` : Aulor.fmtNota(m.notaFinal));

  function abaProntos() {
    const lista = prontos();
    const podeEmitir = Shell.pode('certificados', 'emitir');
    if (!lista.length) return `<div class="painel">${vazio('Nenhum certificado pendente', 'Quando uma turma é concluída, os alunos aprovados aparecem aqui.', '<a class="btn-sec" href="turmas.html?situacao=a_concluir">Ver turmas aguardando conclusão</a>')}</div>`;
    return `
      <div class="painel overflow-hidden">
        <div class="overflow-x-auto"><table class="tabela">
          <thead><tr>${podeEmitir ? '<th class="w-12"><input type="checkbox" class="check align-middle" data-todos aria-label="Selecionar todos" checked></th>' : ''}<th>Aluno</th><th>Curso</th><th class="text-right num">Frequência</th><th class="text-right num">Nota</th><th class="text-right num">Carga</th></tr></thead>
          <tbody>${lista.map((m) => {
            const a = Aulor.aluno(m.alunoId);
            return `
            <tr data-href="matricula.html?id=${m.id}" class="${FOCO_LINHA}">
              ${podeEmitir ? `<td class="p-0"><label class="flex h-full items-center px-4 py-2.5 cursor-pointer"><input type="checkbox" class="check" data-sel value="${m.id}" checked aria-label="Selecionar ${esc(a.nome)}"></label></td>` : ''}
              <td>${nomeAluno(`matricula.html?id=${m.id}`, a.nome)}<p class="text-xs ${APOIO}">CPF <span class="font-mono">${cpfFmt(a.cpf)}</span></p></td>
              <td class="max-w-[18rem]">${cursoTurma(m.turmaId)}</td>
              <td class="num">${m.frequenciaFinal}%</td>
              <td class="num">${nota(m)}</td>
              <td class="num">${Aulor.curso(Aulor.turma(m.turmaId).cursoId).cargaHoraria} h</td>
            </tr>`;
          }).join('')}
          </tbody>
        </table></div>
        ${podeEmitir ? `<div class="px-4 py-3 border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs ${APOIO}">Cada certificado recebe um código único${Aulor.temModulo('validacao_publica') ? ' que pode ser conferido na página pública de validação' : ''}.</p>
          <button type="button" data-emitir class="btn-pri">Emitir selecionados <span data-n-sel class="tabular-nums">(${lista.length})</span></button>
        </div>` : ''}
      </div>`;
  }

  // Válido é o comum e não se anuncia; cancelado vira pílula neutra e a linha cai a 60%.
  function abaEmitidos() {
    const lista = emitidos();
    if (!lista.length) return `<div class="painel">${vazio('Nenhum certificado emitido ainda')}</div>`;
    return `
      <div class="painel overflow-hidden"><div class="overflow-x-auto"><table class="tabela">
        <thead><tr><th>Certificado</th><th>Curso</th><th class="text-right num">Emissão</th></tr></thead>
        <tbody>${lista.map((c) => `
          <tr data-href="certificado.html?id=${c.id}" class="${FOCO_LINHA} ${c.status === 'valido' ? '' : 'linha-apagada'}">
            <td>${nomeAluno(`certificado.html?id=${c.id}`, c.dados.aluno, c.status === 'valido' ? '' : pilula('neutro', 'Cancelado', c.motivoCancelamento))}<p class="font-mono text-xs ${APOIO}">${esc(c.codigo)}</p></td>
            <td class="max-w-[20rem]"><span class="block truncate">${esc(c.dados.curso)}</span><span class="block text-xs font-mono ${APOIO}">${esc(c.dados.turma)}</span></td>
            <td class="num">${dataBr(c.emitidoEm)}<p class="text-xs ${APOIO}">${esc(c.emitidoPor)}</p></td>
          </tr>`).join('')}
        </tbody></table></div></div>`;
  }

  // O motivo vem da mesma regra da emissão: frequência, nota abaixo do mínimo ou parcelas vencidas.
  function abaBloqueados() {
    const lista = bloqueados();
    if (!lista.length) return `<div class="painel">${vazio('Nenhum aluno bloqueado', 'Quem concluiu sem alcançar a frequência ou a nota mínima aparece aqui, com o motivo.')}</div>`;
    const config = Shell.pode('configuracoes') ? '<a class="link" href="configuracoes.html">Configurações</a>' : 'Configurações';
    return `
      <div class="painel overflow-hidden"><div class="overflow-x-auto"><table class="tabela">
        <thead><tr><th>Aluno</th><th>Curso</th><th>Motivo</th></tr></thead>
        <tbody>${lista.map((m) => {
          const e = Aulor.elegibilidade(m);
          return `
          <tr data-href="matricula.html?id=${m.id}" class="${FOCO_LINHA}">
            <td>${nomeAluno(`matricula.html?id=${m.id}`, Aulor.aluno(m.alunoId).nome)}<p class="text-xs ${APOIO}">CPF <span class="font-mono">${cpfFmt(Aulor.aluno(m.alunoId).cpf)}</span></p></td>
            <td class="max-w-[18rem]">${cursoTurma(m.turmaId)}</td>
            <td>${status(e.tom, e.nome)}<p class="text-xs ${APOIO} ml-3.5">${m.resultado === 'aprovado' ? 'Aprovado; libera quando quitar' : esc(Aulor.RESULTADO[m.resultado]?.nome ?? '')}</p></td>
          </tr>`;
        }).join('')}
        </tbody></table></div></div>
      <p class="text-xs ${APOIO_FUNDO} mt-3">A frequência mínima e o bloqueio por parcela vencida ficam em ${config}; a nota mínima, no cadastro de cada curso.</p>`;
  }

  function render() {
    const t = filtroTurma && Aulor.turma(filtroTurma);
    const total = emitidos().length;
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({
          titulo: `Certificados <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${total}</span>`,
          subtitulo: t ? `Turma <span class="font-mono">${esc(t.codigo)}</span> · <a class="link" href="certificados.html">ver todas as turmas</a>` : `Emitidos para quem concluiu a turma com frequência mínima de ${Aulor.config().academico.frequenciaMinima}% e, quando o curso pede, a nota mínima.`,
          acoes: Aulor.temModulo('validacao_publica') ? '<a href="validar.html" class="btn-sec" target="_blank" rel="noopener">Página pública de validação</a>' : '',
        })}
        ${abasHtml(abas(), aba)}
        ${aba === 'prontos' ? abaProntos() : aba === 'emitidos' ? abaEmitidos() : abaBloqueados()}
      </div>`;
    ligarLinhasLink(tela);
    const todos = tela.querySelector('[data-todos]');
    const sel = () => [...tela.querySelectorAll('[data-sel]:checked')];
    const contar = () => {
      const n = tela.querySelector('[data-n-sel]');
      if (n) n.textContent = `(${sel().length})`;
      if (todos) todos.checked = sel().length === tela.querySelectorAll('[data-sel]').length;
    };
    todos?.addEventListener('change', () => { tela.querySelectorAll('[data-sel]').forEach((c) => { c.checked = todos.checked; }); contar(); });
    tela.querySelectorAll('[data-sel]').forEach((c) => c.addEventListener('change', contar));
    tela.querySelector('[data-emitir]')?.addEventListener('click', () => {
      const ids = sel().map((c) => c.value);
      if (!ids.length) { toast('Selecione ao menos um aluno', 'alerta'); return; }
      const r = Aulor.emitirLote(ids, Shell.nome());
      toast(`${r.emitidos.length} certificado${r.emitidos.length > 1 ? 's emitidos' : ' emitido'}${r.falhas.length ? ` · ${r.falhas.length} não emitido(s)` : ''}`);
      if (r.emitidos.length === 1) { location.href = `certificado.html?id=${r.emitidos[0].id}&emitido=1`; return; }
      aba = 'emitidos';
      const url = new URL(location.href); url.searchParams.set('aba', 'emitidos'); history.replaceState(null, '', url);
      render();
    });
  }

  render();
})();
