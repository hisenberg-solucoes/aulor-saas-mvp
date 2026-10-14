// ============================================================
// Turma: alunos matriculados (com frequência e situação financeira),
// aulas/chamadas e conclusão. A lista de alunos vem das matrículas —
// matricular aqui ou em Matrículas dá no mesmo registro.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');
  let aba = parametroUrl('aba') === 'aulas' ? 'aulas' : 'alunos';

  function fatos(t) {
    const pr = Aulor.progressoTurma(t);
    const o = Aulor.ocupacao(t);
    const f = (r, v) => `<div class="px-4 py-3 bg-elevado"><dt class="text-xs text-tinta-2">${r}</dt><dd class="text-sm font-medium mt-0.5">${v}</dd></div>`;
    return `<dl class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px bg-linha border border-linha rounded-xl overflow-hidden mb-5">
      ${f('Professor', esc(Aulor.professor(t.professorId).nome))}
      ${f('Dias e horário', esc(Agenda.descrever(t.agenda)))}
      ${f('Período', `${dataBr(t.inicio)} a ${dataBr(t.fim)}`)}
      ${f('Local', esc(t.local || '—'))}
      ${f('Vagas', `${o.ocupadas} de ${o.capacidade}${o.lotada ? ' · lotada' : ` · ${o.livres} livres`}`)}
      ${f('Aulas', `${pr.realizadas} de ${pr.total} realizadas`)}
    </dl>`;
  }

  function abaAlunos(t) {
    const ms = Aulor.matriculasDaTurma(t.id, { incluirCanceladas: true });
    const verFin = Shell.pode('receber');
    const concluida = t.status === 'concluida';
    if (!ms.length) return `<div class="painel">${vazio('Nenhum aluno matriculado', 'As matrículas feitas para esta turma aparecem aqui.', Shell.pode('matriculas', 'criar') ? `<a class="btn-pri" href="matricula-nova.html?turma=${t.id}">Matricular aluno</a>` : '')}</div>`;
    return `
      <div class="painel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="tabela">
            <thead><tr><th>Aluno</th><th>Frequência</th><th class="num">Faltas</th>${verFin ? '<th>Financeiro</th>' : ''}<th>${concluida ? 'Resultado' : 'Situação'}</th>${concluida ? '<th>Certificado</th>' : ''}</tr></thead>
            <tbody>${ms.map((m) => {
              const a = Aulor.aluno(m.alunoId);
              const f = Aulor.frequencia(m);
              const deve = Aulor.parcelasDaMatricula(m.id).some((l) => Aulor.situacaoLancamento(l) === 'vencido');
              const cancelada = m.status === 'cancelada';
              const situacao = cancelada ? status('neutro', 'Cancelada') : concluida ? (m.resultado === 'aprovado' ? status('ok', 'Aprovado') : status('perigo', 'Reprovado por frequência')) : f.semChance ? status('perigo', 'Não alcança o mínimo') : f.abaixo ? status('atencao', 'Abaixo do mínimo') : status('ok', 'Cursando');
              const e = concluida ? Aulor.elegibilidade(m) : null;
              const link = Shell.pode('matriculas') ? `matricula.html?id=${m.id}` : (Shell.pode('alunos') ? `aluno.html?id=${a.id}` : '');
              return `<tr ${link ? `data-href="${link}"` : ''} class="${cancelada ? 'opacity-60' : ''}">
                <td><div class="flex items-center gap-3 min-w-[13rem]">${avatar(a.nome)}<div class="min-w-0"><p class="font-medium text-tinta">${esc(a.nome)}</p><p class="text-xs text-tinta-2">Matrícula ${m.codigo}${m.data > t.inicio ? ` · entrou em ${dataCurta(m.data)}` : ''}</p></div></div></td>
                <td>${cancelada ? '<span class="text-tinta-3">—</span>' : barraFrequencia(f)}</td>
                <td class="num">${cancelada ? '—' : f.faltas + f.justificadas}</td>
                ${verFin ? `<td>${cancelada ? '<span class="text-tinta-3">—</span>' : deve ? status('perigo', 'Parcela vencida') : status('ok', 'Em dia')}</td>` : ''}
                <td>${situacao}</td>
                ${concluida ? `<td>${e.id === 'emitido' ? `<a class="link text-sm" href="certificado.html?id=${e.certificado.id}">Emitido</a>` : status(e.tom, e.nome)}</td>` : ''}
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
        <p class="px-4 py-2.5 text-xs text-tinta-2 border-t border-linha">Frequência mínima: ${Aulor.config().academico.frequenciaMinima}% das aulas com chamada registrada (a linha vertical na barra). ${Aulor.config().academico.justificadaContaPresenca ? 'Falta justificada conta como presença.' : 'Falta justificada conta como falta.'}</p>
      </div>`;
  }

  function abaAulas(t) {
    const hoje = Aulor.hoje();
    const aulas = Aulor.aulasDaTurma(t.id);
    const participantes = (a) => Aulor.participantes(a).length;
    return `
      <div class="painel overflow-hidden">
        <ul class="divide-y divide-linha">${aulas.map((a) => {
          const pendente = Aulor.chamadaPendente(a);
          const hojeAula = a.data === hoje && a.status === 'prevista';
          const presentes = Object.values(a.presencas).filter((v) => v === 'P').length;
          const estado = a.status === 'realizada' ? status('ok', `${presentes} de ${Object.keys(a.presencas).length} presentes`)
            : a.status === 'cancelada' ? status('neutro', 'Cancelada')
              : pendente ? status('atencao', 'Chamada pendente')
                : hojeAula ? status('info', 'Hoje') : status('neutro', 'Prevista');
          const podeAbrir = a.status === 'realizada' || pendente || hojeAula;
          return `<li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 ${a.data > hoje ? 'text-tinta-2' : ''}">
            <span class="w-8 text-xs tabular-nums text-tinta-3">${a.n}</span>
            <span class="w-36 text-sm tabular-nums">${diaSemana(a.data)} ${dataBr(a.data)}</span>
            <span class="w-24 text-sm tabular-nums">${a.inicio}–${a.fim}</span>
            <span class="flex-1 min-w-[10rem] text-sm truncate">${esc(a.conteudo || '')}</span>
            <span class="w-44">${estado}</span>
            <span class="w-28 text-right">${podeAbrir ? `<a href="chamada.html?aula=${a.id}" class="text-xs font-semibold link">${a.status === 'realizada' ? 'Ver chamada' : 'Fazer chamada'}</a>` : ''}</span>
          </li>`;
        }).join('')}</ul>
      </div>`;
  }

  function render() {
    const t = Aulor.turma(id);
    if (!t || !Shell.podeVerTurma(t)) { tela.innerHTML = vazio('Turma não encontrada', '', '<a class="btn-sec" href="turmas.html">Voltar</a>'); return; }
    const c = Aulor.curso(t.cursoId);
    const s = Aulor.situacaoTurma(t);
    const aberta = ['planejada', 'em_andamento'].includes(s);
    const acoes = [
      Shell.pode('turmas', 'editar') && !['concluida', 'cancelada'].includes(s) ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar</button>` : '',
      Shell.pode('matriculas', 'criar') && aberta && !Aulor.ocupacao(t).lotada ? `<a href="matricula-nova.html?turma=${t.id}" class="btn-sec">${ICONE.mais}Matricular aluno</a>` : '',
      Shell.pode('turmas', 'concluir') && ['em_andamento', 'a_concluir'].includes(s) ? `<button type="button" data-concluir class="${s === 'a_concluir' ? 'btn-pri' : 'btn-sec'}">Concluir turma</button>` : '',
    ].join('');
    const ms = Aulor.matriculasDaTurma(t.id);
    const avisos = [];
    if (parametroUrl('nova')) avisos.push(`<div class="mb-4 rounded-xl border border-bom/30 bg-bom/10 px-4 py-3 text-sm text-tinta">Turma criada com ${Aulor.progressoTurma(t).total} aulas na agenda. Agora é só matricular os alunos.</div>`);
    if (s === 'a_concluir') avisos.push(`<div class="mb-4 rounded-xl border border-cobre/40 bg-cobre/15 px-4 py-3 text-sm text-tinta">A última aula foi em ${dataBr(t.fim)}. Conclua a turma para fechar o resultado de cada aluno e liberar os certificados.</div>`);
    if (s === 'concluida') {
      const prontos = ms.filter((m) => Aulor.elegibilidade(m).id === 'elegivel').length;
      avisos.push(`<div class="mb-4 rounded-xl border border-linha bg-elevado px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2"><span>Turma concluída em ${dataBr(t.concluidaEm)}${t.concluidaPor ? ` por ${esc(t.concluidaPor)}` : ''}. ${ms.filter((m) => m.resultado === 'aprovado').length} aprovados, ${ms.filter((m) => m.resultado === 'reprovado_frequencia').length} reprovados por frequência.</span>${prontos && Shell.pode('certificados') ? `<a class="font-semibold link" href="certificados.html?turma=${t.id}">${prontos} certificado${prontos > 1 ? 's' : ''} para emitir</a>` : ''}</div>`);
    }
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${avisos.join('')}
        ${cabecalhoPagina({ titulo: `${esc(t.codigo)} <span class="align-middle ml-1">${pilula(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome)}</span>`, subtitulo: `<a class="hover:underline" href="${Shell.pode('cursos') ? `curso.html?id=${c.id}` : '#'}">${esc(c.nome)}</a> · ${c.cargaHoraria} h · ${Aulor.MODALIDADES.find((m) => m.id === t.agenda.formato)?.nome}`, voltar: Shell.pode('turmas') ? { href: 'turmas.html', rotulo: 'Turmas' } : { href: 'aulas.html', rotulo: 'Minhas aulas' }, acoes })}
        ${fatos(t)}
        ${abasHtml([{ id: 'alunos', nome: 'Alunos', n: ms.length }, { id: 'aulas', nome: 'Aulas e chamadas', n: Aulor.progressoTurma(t).total }], aba)}
        ${aba === 'alunos' ? abaAlunos(t) : abaAulas(t)}
      </div>`;
    ligarLinhasLink(tela);
    tela.querySelector('[data-editar]')?.addEventListener('click', () => abrirFormTurma({ turma: t, aoSalvar: () => { toast('Turma atualizada'); render(); } }));
    tela.querySelector('[data-concluir]')?.addEventListener('click', () => concluir(t));
  }

  function concluir(t) {
    const p = Aulor.previaConclusao(t.id);
    const bloqueio = p.pendentes.length ? `Há ${p.pendentes.length} chamada(s) pendente(s). Registre a presença antes de concluir.`
      : p.futuras.length ? `Ainda há ${p.futuras.length} aula(s) prevista(s), a última em ${dataBr(p.futuras[p.futuras.length - 1].data)}. A turma pode ser concluída depois da última aula.` : '';
    const reprovados = p.alunos.filter((x) => x.resultado !== 'aprovado');
    const root = abrirModal(`
      <div class="px-5 py-4 border-b border-linha">
        <h3 class="font-display font-semibold text-tinta">Concluir ${esc(t.codigo)}</h3>
        <p class="text-xs text-tinta-2 mt-0.5">Fecha o resultado de cada aluno pela frequência mínima de ${Aulor.config().academico.frequenciaMinima}%.</p>
      </div>
      <div class="px-5 py-4 space-y-4 overflow-y-auto">
        ${bloqueio ? `<p class="rounded-lg bg-cobre/15 border border-cobre/40 px-3 py-2.5 text-sm text-tinta">${esc(bloqueio)}</p>` : ''}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-bom/10 px-3 py-2.5"><dt class="text-xs text-tinta">Aprovados</dt><dd class="font-display text-2xl font-semibold text-tinta">${p.aprovados}</dd></div>
          <div class="rounded-lg bg-ruim/10 px-3 py-2.5"><dt class="text-xs text-tinta">Reprovados por frequência</dt><dd class="font-display text-2xl font-semibold text-tinta">${reprovados.length}</dd></div>
        </dl>
        ${reprovados.length ? `<ul class="text-sm divide-y divide-linha border-y border-linha">${reprovados.map((x) => `<li class="flex justify-between py-2"><span>${esc(x.aluno.nome)}</span><span class="tabular-nums text-ruim">${x.f.percentual ?? 0}%</span></li>`).join('')}</ul>` : ''}
        <p class="text-xs text-tinta-2">Depois de concluída, a chamada não pode mais ser alterada e os aprovados ficam prontos para receber o certificado.</p>
      </div>
      <div class="px-5 py-3 border-t border-linha flex justify-end gap-2">
        <button type="button" data-fechar-modal class="btn-sec">Cancelar</button>
        <button type="button" data-confirmar class="btn-pri" ${bloqueio ? 'disabled' : ''}>Concluir turma</button>
      </div>`, 'max-w-md');
    root.querySelectorAll('[data-fechar-modal]').forEach((b) => b.addEventListener('click', fecharModal));
    root.querySelector('[data-confirmar]').addEventListener('click', () => {
      const r = Aulor.concluirTurma(t.id, Shell.nome());
      fecharModal();
      if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
      toast(`Turma concluída: ${r.aprovados} aprovados, ${r.reprovados} reprovados`);
      render();
    });
  }

  render();
})();
