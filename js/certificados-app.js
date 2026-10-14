// ============================================================
// Certificados: prontos para emitir (aprovados em turmas concluídas),
// emitidos (histórico com código de validação) e bloqueados (motivo).
// A regra de elegibilidade é uma só: Aulor.elegibilidade().
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
    { id: 'prontos', nome: 'Prontos para emitir', n: prontos().length },
    { id: 'emitidos', nome: 'Emitidos', n: emitidos().length },
    { id: 'bloqueados', nome: 'Não liberados', n: bloqueados().length },
  ];
  let aba = ['prontos', 'emitidos', 'bloqueados'].includes(parametroUrl('aba')) ? parametroUrl('aba') : (prontos().length ? 'prontos' : 'emitidos');

  const cursoTurma = (turmaId) => { const t = Aulor.turma(turmaId); return `${esc(Aulor.curso(t.cursoId).nome)}<p class="text-xs text-tinta-2">${esc(t.codigo)} · concluída em ${dataBr(t.concluidaEm)}</p>`; };

  function abaProntos() {
    const lista = prontos();
    const podeEmitir = Shell.pode('certificados', 'emitir');
    if (!lista.length) return `<div class="painel">${vazio('Nenhum certificado pendente', 'Quando uma turma é concluída, os alunos aprovados aparecem aqui.', '<a class="btn-sec" href="turmas.html?situacao=a_concluir">Ver turmas aguardando conclusão</a>')}</div>`;
    return `
      <div class="painel overflow-hidden">
        <div class="overflow-x-auto"><table class="tabela">
          <thead><tr>${podeEmitir ? '<th class="w-10"><input type="checkbox" class="check" data-todos aria-label="Selecionar todos" checked></th>' : ''}<th>Aluno</th><th>Curso</th><th class="num">Frequência</th><th class="num">Carga</th></tr></thead>
          <tbody>${lista.map((m) => `
            <tr>
              ${podeEmitir ? `<td><input type="checkbox" class="check" data-sel value="${m.id}" checked aria-label="Selecionar ${esc(Aulor.aluno(m.alunoId).nome)}"></td>` : ''}
              <td><a class="font-medium text-tinta hover:underline" href="matricula.html?id=${m.id}">${esc(Aulor.aluno(m.alunoId).nome)}</a><p class="text-xs text-tinta-2">CPF ${cpfFmt(Aulor.aluno(m.alunoId).cpf)}</p></td>
              <td>${cursoTurma(m.turmaId)}</td>
              <td class="num">${m.frequenciaFinal}%</td>
              <td class="num">${Aulor.curso(Aulor.turma(m.turmaId).cursoId).cargaHoraria} h</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${podeEmitir ? `<div class="px-4 py-3 border-t border-linha flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-tinta-2">Cada certificado recebe um código único${Aulor.temModulo('validacao_publica') ? ' que pode ser conferido na página pública de validação' : ''}.</p>
          <button type="button" data-emitir class="btn-pri">Emitir selecionados</button>
        </div>` : ''}
      </div>`;
  }

  function abaEmitidos() {
    const lista = emitidos();
    if (!lista.length) return `<div class="painel">${vazio('Nenhum certificado emitido ainda')}</div>`;
    return `
      <div class="painel overflow-hidden"><div class="overflow-x-auto"><table class="tabela">
        <thead><tr><th>Código</th><th>Aluno</th><th>Curso</th><th>Emissão</th><th>Situação</th><th></th></tr></thead>
        <tbody>${lista.map((c) => `
          <tr data-href="certificado.html?id=${c.id}">
            <td class="font-mono text-xs whitespace-nowrap">${esc(c.codigo)}</td>
            <td class="font-medium text-tinta">${esc(c.dados.aluno)}</td>
            <td>${esc(c.dados.curso)}<p class="text-xs text-tinta-2">${esc(c.dados.turma)}</p></td>
            <td class="whitespace-nowrap">${dataBr(c.emitidoEm)}<p class="text-xs text-tinta-2">${esc(c.emitidoPor)}</p></td>
            <td>${c.status === 'valido' ? status('ok', 'Válido') : status('neutro', 'Cancelado', c.motivoCancelamento)}</td>
            <td class="text-right"><a href="certificado.html?id=${c.id}" class="text-xs font-semibold link">Abrir</a></td>
          </tr>`).join('')}
        </tbody></table></div></div>`;
  }

  function abaBloqueados() {
    const lista = bloqueados();
    if (!lista.length) return `<div class="painel">${vazio('Nenhum aluno bloqueado')}</div>`;
    return `
      <div class="painel overflow-hidden"><div class="overflow-x-auto"><table class="tabela">
        <thead><tr><th>Aluno</th><th>Curso</th><th>Motivo</th></tr></thead>
        <tbody>${lista.map((m) => `
          <tr data-href="matricula.html?id=${m.id}">
            <td class="font-medium text-tinta">${esc(Aulor.aluno(m.alunoId).nome)}</td>
            <td>${cursoTurma(m.turmaId)}</td>
            <td>${(() => { const e = Aulor.elegibilidade(m); return status(e.tom, e.nome); })()}</td>
          </tr>`).join('')}
        </tbody></table></div></div>
      <p class="text-xs text-tinta-2 mt-3">Regras em Configurações: frequência mínima (Regras acadêmicas) e bloqueio por parcela vencida (Financeiro).</p>`;
  }

  function render() {
    const t = filtroTurma && Aulor.turma(filtroTurma);
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Certificados', subtitulo: t ? `Turma ${esc(t.codigo)} · <a class="link" href="certificados.html">ver todas</a>` : `Emitidos para quem concluiu com frequência mínima de ${Aulor.config().academico.frequenciaMinima}%.`, acoes: Aulor.temModulo('validacao_publica') ? '<a href="validar.html" class="btn-sec" target="_blank" rel="noopener">Página pública de validação</a>' : '' })}
        ${abasHtml(abas(), aba)}
        ${aba === 'prontos' ? abaProntos() : aba === 'emitidos' ? abaEmitidos() : abaBloqueados()}
      </div>`;
    ligarLinhasLink(tela);
    const todos = tela.querySelector('[data-todos]');
    todos?.addEventListener('change', () => tela.querySelectorAll('[data-sel]').forEach((c) => { c.checked = todos.checked; }));
    tela.querySelector('[data-emitir]')?.addEventListener('click', () => {
      const ids = [...tela.querySelectorAll('[data-sel]:checked')].map((c) => c.value);
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
