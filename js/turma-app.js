// ============================================================
// Turma (ficha em cartões), nas abas do original: Acompanhamento (resumo,
// dados e aprovação), Aulas (com a chamada de cada uma) e Alunos (frequência
// e nota final). A lista de alunos vem das matrículas — matricular aqui ou em
// Matrículas dá no mesmo registro. O professor abre esta ficha no celular
// para lançar as notas. Aba na URL: ?aba= (a antiga ?aba=dados abre Acompanhamento).
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');
  const ABAS = ['geral', 'aulas', 'alunos'];
  const pedida = parametroUrl('aba') === 'dados' ? 'geral' : parametroUrl('aba');
  let aba = ABAS.includes(pedida) ? pedida : 'geral';
  let lancando = false;
  // ?nova=1 vale só para a primeira visita: sai da URL para as abas não carregarem a faixa adiante.
  const nova = !!parametroUrl('nova');
  if (nova) { const u = new URL(location.href); u.searchParams.delete('nova'); history.replaceState(null, '', u); }
  const LINK_FAIXA = 'font-medium underline underline-offset-2 hover:no-underline';
  const valorNota = (n) => (n == null ? '' : Aulor.fmtNota(n));
  // Lança nota quem registra a chamada desta turma: o professor dela ou a coordenação.
  const podeLancarNota = (t) => Shell.podeChamada(t) && !['concluida', 'cancelada'].includes(t.status);

  // Resumo do topo do Acompanhamento: cada número abre a aba que o explica, como no original.
  function resumo(t, c, ms) {
    const pr = Aulor.progressoTurma(t);
    const cursando = ms.filter((m) => m.status === 'ativa');
    const freqs = ms.map(Aulor.frequencia).filter((f) => f.percentual != null);
    const media = freqs.length ? Math.round(freqs.reduce((s, f) => s + f.percentual, 0) / freqs.length) : null;
    const abaixo = freqs.filter((f) => f.abaixo).length;
    const ultima = Aulor.aulasDaTurma(t.id).filter((a) => a.status === 'realizada').pop();
    const de = (n) => `<span class="text-sm font-normal ${APOIO}"> de ${n}</span>`;
    const item = (rotulo, valor, detalhe, atencao = false, alvo = 'alunos') => `
      <a href="turma.html?id=${t.id}&aba=${alvo}" class="block p-3 sm:p-4 min-w-0 hover:bg-slate-50 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/50">
        <span class="block text-xs font-medium ${APOIO}">${rotulo}</span>
        <span class="block mt-1 text-2xl font-semibold leading-none tabular-nums text-slate-800 dark:text-neutral-100">${valor}</span>
        <span class="block mt-1.5 text-xs ${atencao ? AVISO : APOIO}">${detalhe}</span>
      </a>`;
    let terceiro;
    if (t.status === 'concluida') {
      const aprovados = ms.filter((m) => m.resultado === 'aprovado').length;
      terceiro = item('Aprovados', `${aprovados}${de(ms.length)}`, ms.length - aprovados ? `${plural(ms.length - aprovados, 'reprovado')}` : 'nenhum reprovado');
    } else if (Aulor.temNota(c)) {
      const comNota = cursando.filter((m) => m.notaFinal != null).length;
      terceiro = item('Notas lançadas', `${comNota}${de(cursando.length)}`, `nota mínima ${Aulor.fmtNota(c.notaMinima)}`, Aulor.situacaoTurma(t) === 'a_concluir' && comNota < cursando.length);
    } else {
      const o = Aulor.ocupacao(t);
      terceiro = item('Vagas', `${o.ocupadas}${de(o.capacidade)}`, o.lotada ? 'turma lotada' : `${plural(o.livres, 'vaga livre', 'vagas livres')}`);
    }
    return `
      <section aria-label="Resumo da turma" class="painel mb-4 grid grid-cols-3 divide-x divide-slate-200 dark:divide-neutral-800 overflow-hidden">
        ${item('Aulas com chamada', `${pr.realizadas}${de(pr.total)}`, ultima ? `última em ${dataCurta(ultima.data)}` : 'nenhuma ainda', false, 'aulas')}
        ${item('Frequência média', media == null ? '—' : `${media}%`, abaixo ? `${plural(abaixo, 'aluno abaixo', 'alunos abaixo')} do mínimo` : `mínimo ${Aulor.config().academico.frequenciaMinima}%`, abaixo > 0 && t.status !== 'concluida')}
        ${terceiro}
      </section>`;
  }

  // Situação de quem ainda está cursando; na turma concluída, o resultado gravado.
  function situacaoAluno(m, f, c, s) {
    if (m.status === 'cancelada') return status('neutro', 'Cancelada');
    if (m.status === 'concluida') return m.resultado ? status(Aulor.RESULTADO[m.resultado].tom, Aulor.RESULTADO[m.resultado].nome, '', true) : status('neutro', 'Concluída');
    if (f.semChance) return status('perigo', 'Não alcança o mínimo', '', true);
    if (f.abaixo) return status('atencao', 'Abaixo do mínimo', '', true);
    if (Aulor.temNota(c) && m.notaFinal != null && m.notaFinal < c.notaMinima) return status('atencao', 'Nota abaixo da mínima', '', true);
    if (Aulor.temNota(c) && m.notaFinal == null && s === 'a_concluir') return status('atencao', 'Falta a nota', '', true);
    return ''; // cursando em dia é o comum e não se anuncia
  }

  function abaAlunos(t, c, s) {
    const ms = Aulor.matriculasDaTurma(t.id, { incluirCanceladas: true });
    const verFin = Shell.pode('receber');
    const concluida = t.status === 'concluida';
    const comNota = Aulor.temNota(c);
    const podeNota = comNota && podeLancarNota(t);
    const editando = lancando && podeNota;
    const o = Aulor.ocupacao(t);
    const matricular = Shell.pode('matriculas', 'criar') && ['planejada', 'em_andamento'].includes(s) && !o.lotada
      ? `<a href="matricula-nova.html?turma=${t.id}" class="btn-fantasma">${ICONE.mais}Nova venda</a>` : '';
    if (!ms.length) {
      return cartao({ titulo: 'Alunos matriculados', contexto: 'As matrículas feitas para esta turma aparecem aqui.', acao: matricular, corpo: `<p class="px-4 py-8 text-center text-sm ${APOIO}">Nenhum aluno matriculado nesta turma ainda.</p>` });
    }
    const acao = editando ? '' : `${podeNota ? `<button type="button" data-lancar-notas class="btn-fantasma">${ICONE.editar}Lançar notas</button>` : ''}${matricular}`;
    const linhas = ms.map((m) => {
      const a = Aulor.aluno(m.alunoId);
      const f = Aulor.frequencia(m);
      const cancelada = m.status === 'cancelada';
      const deve = Aulor.parcelasDaMatricula(m.id).some((l) => Aulor.situacaoLancamento(l) === 'vencido');
      const e = concluida ? Aulor.elegibilidade(m) : null;
      const link = editando ? '' : Shell.pode('matriculas') ? `matricula.html?id=${m.id}` : (Shell.pode('alunos') ? `aluno.html?id=${a.id}` : '');
      const nome = link ? `<a href="${link}" class="${LINK_REGISTRO}">${esc(a.nome)}</a>` : `<p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(a.nome)}</p>`;
      const faltas = f.faltas + f.justificadas;
      const nota = !comNota ? ''
        : editando && m.status === 'ativa'
          ? `<td><input name="nota-${m.id}" value="${valorNota(m.notaFinal)}" inputmode="decimal" autocomplete="off" placeholder="0 a 10" aria-label="Nota final de ${esc(a.nome)}" class="campo w-20 text-right tabular-nums">${ERRO(`nota-${m.id}`)}</td>`
          : `<td class="num">${m.notaFinal != null && !cancelada ? Aulor.fmtNota(m.notaFinal) : `<span class="${APOIO}">—</span>`}</td>`;
      return `<tr ${link ? `data-href="${link}"` : ''} class="${link ? FOCO_LINHA : ''} ${cancelada ? 'linha-apagada' : ''}">
        <td>${nome}<p class="text-xs ${APOIO}"><span class="font-mono">${esc(m.codigo)}</span>${Aulor.entradaNaTurma(m) > t.inicio ? ` · entrou em ${dataCurta(Aulor.entradaNaTurma(m))}` : ''}</p></td>
        <td>${cancelada ? `<span class="${APOIO}">—</span>` : `${barraFrequencia(f, { compacta: true })}${f.total ? `<p class="text-xs ${APOIO} tabular-nums">${plural(faltas, 'falta')}${f.justificadas ? ` (${f.justificadas} just.)` : ''}</p>` : ''}`}</td>
        ${nota}
        <td>${situacaoAluno(m, f, c, s)}</td>
        ${verFin ? `<td class="hidden md:table-cell">${deve && !cancelada ? status('perigo', 'Parcela vencida') : `<span class="${APOIO}">—</span>`}</td>` : ''}
        ${concluida ? `<td class="hidden md:table-cell">${e.id === 'emitido' ? `<a class="link text-sm" href="certificado.html?id=${e.certificado.id}">Emitido</a>` : status(e.tom, e.nome, '', true)}</td>` : ''}
      </tr>`;
    }).join('');
    const cfg = Aulor.config().academico;
    const tabela = `
      <div class="mt-3 overflow-x-auto border-t border-slate-200 dark:border-neutral-800">
        <table class="tabela max-sm:[&_td]:px-2 max-sm:[&_th]:px-2">
          <thead><tr><th>Aluno</th><th>Frequência</th>${comNota ? '<th class="num">Nota</th>' : ''}<th>${concluida ? 'Resultado' : 'Situação'}</th>${verFin ? '<th class="hidden md:table-cell">Financeiro</th>' : ''}${concluida ? '<th class="hidden md:table-cell">Certificado</th>' : ''}</tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>`;
    const rodape = `<p class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs ${APOIO}">Frequência mínima: ${cfg.frequenciaMinima}% das aulas com chamada registrada (o traço na barra). ${cfg.justificadaContaPresenca ? 'Falta justificada conta como presença.' : 'Falta justificada conta como falta.'} ${comNota ? `Nota final de 0 a 10; a mínima é ${Aulor.fmtNota(c.notaMinima)}.` : 'Curso sem nota: aprova pela frequência.'}</p>`;
    const corpo = editando ? `
      <form id="form-notas" novalidate>
        ${tabela}
        <div class="px-4 py-3 border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-end gap-2">
          <div class="mr-auto"><p class="text-xs ${APOIO}">Vazio apaga a nota. Use vírgula para a casa decimal (8,5).</p>${ERRO('notas')}</div>
          <button type="button" data-cancelar-notas class="btn-sec">Cancelar</button>
          <button type="submit" class="btn-pri">Salvar notas</button>
        </div>
      </form>` : `${tabela}${rodape}`;
    return cartao({
      titulo: `Alunos matriculados <span class="ml-1 text-xs font-normal ${APOIO} tabular-nums">${ms.filter((m) => m.status !== 'cancelada').length}</span>`,
      contexto: editando ? 'Lance a nota final de cada aluno cursando. Quem reprova por frequência não precisa de nota.' : 'Entram pelas matrículas desta turma.',
      acao,
      corpo,
      classe: 'overflow-hidden',
    });
  }

  function abaAulas(t) {
    const hoje = Aulor.hoje();
    const aulas = Aulor.aulasDaTurma(t.id);
    const pr = Aulor.progressoTurma(t);
    const registra = Shell.podeChamada(t) && !['concluida', 'cancelada'].includes(t.status);
    // Ponto + texto: hoje em petróleo (o "você está aqui"), chamada feita em verde, pendente em cobre.
    const ponto = (cor, txt, cls = 'text-slate-600 dark:text-neutral-300') => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap ${cls}"><span class="h-2 w-2 shrink-0 rounded-full ${cor}"></span>${txt}</span>`;
    const traco = '<span class="text-slate-400 dark:text-neutral-600">—</span>';
    const linhas = aulas.map((a) => {
      const cancelada = a.status === 'cancelada';
      const pendente = Aulor.chamadaPendente(a);
      const ehHoje = !cancelada && a.data === hoje;
      const presentes = Object.values(a.presencas).filter((v) => v === 'P').length;
      const situacao = cancelada ? ponto('bg-red-500', 'Cancelada', 'text-red-700 dark:text-red-400')
        : ehHoje ? ponto('bg-petrol-800 dark:bg-sky-300', 'Hoje', 'font-medium text-petrol-800 dark:text-sky-300')
          : a.data < hoje ? ponto('bg-slate-400 dark:bg-neutral-500', 'Realizada')
            : ponto('bg-slate-200 dark:bg-neutral-700', 'Prevista', APOIO);
      const chamada = a.status === 'realizada' ? `<span class="inline-flex items-center gap-2" title="${presentes} de ${Object.keys(a.presencas).length} presentes">${ponto('bg-emerald-500', 'Feita')}<span class="text-xs ${APOIO} tabular-nums">${presentes}/${Object.keys(a.presencas).length}</span></span>`
        : pendente ? ponto('bg-laranja', 'Pendente', AVISO)
          : ehHoje ? ponto('bg-laranja', 'Aguardando', AVISO) : traco;
      const abre = a.status === 'realizada' || pendente || ehHoje;
      const href = `chamada.html?aula=${a.id}`;
      const chamar = (pendente || (ehHoje && a.status === 'prevista')) && registra;
      return `<tr ${abre ? `data-href="${href}"` : ''} class="${abre ? FOCO_LINHA : ''} ${cancelada ? 'linha-apagada' : ''} ${ehHoje ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''}">
        <td class="num text-xs ${APOIO} hidden sm:table-cell">${a.n}</td>
        <td class="whitespace-nowrap">${abre ? `<a href="${href}" class="${LINK_REGISTRO} tabular-nums">${dataBr(a.data)}</a>` : `<span class="tabular-nums text-slate-800 dark:text-neutral-100 ${cancelada ? 'line-through' : ''}">${dataBr(a.data)}</span>`} <span class="text-xs ${APOIO}">${diaSemana(a.data)}</span><p class="sm:hidden text-xs ${APOIO} tabular-nums">${a.inicio}–${a.fim} · aula ${a.n}</p></td>
        <td class="tabular-nums whitespace-nowrap hidden sm:table-cell">${a.inicio}–${a.fim}</td>
        <td class="hidden md:table-cell max-w-xs"><p class="truncate" title="${esc(a.conteudo || '')}">${a.conteudo ? `<span class="text-slate-700 dark:text-neutral-200">${esc(a.conteudo)}</span>` : traco}</p></td>
        <td class="hidden sm:table-cell">${situacao}</td>
        <td>${chamada}${chamar ? `<div class="mt-1.5 sm:hidden"><a href="${href}" class="btn-pri btn-pequeno whitespace-nowrap max-sm:h-11">Fazer chamada</a></div>` : ''}</td>
        <td class="text-right hidden sm:table-cell">${chamar ? `<a href="${href}" class="${BOTAO_LINK} whitespace-nowrap">Fazer chamada</a>` : ''}</td>
      </tr>`;
    }).join('');
    return cartao({
      titulo: `Aulas e chamadas <span class="ml-1 text-xs font-normal ${APOIO} tabular-nums">${pr.total}</span>`,
      contexto: `${esc(Agenda.descrever(t.agenda))} · ${pr.realizadas} de ${pr.total} com chamada. Aula sem chamada não conta na frequência.`,
      corpo: `
        <div class="mt-3 overflow-x-auto border-t border-slate-200 dark:border-neutral-800">
          <table class="tabela max-sm:[&_td]:px-2 max-sm:[&_th]:px-2">
            <thead><tr><th class="num hidden sm:table-cell">Nº</th><th>Data</th><th class="hidden sm:table-cell">Horário</th><th class="hidden md:table-cell">Conteúdo</th><th class="hidden sm:table-cell">Situação</th><th>Chamada</th><th class="hidden sm:table-cell"><span class="sr-only">Atalho</span></th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>`,
      classe: 'overflow-hidden',
    });
  }

  function abaDados(t, c, s) {
    const o = Aulor.ocupacao(t);
    const cfg = Aulor.config().academico;
    const ms = Aulor.matriculasDaTurma(t.id);
    const conta = (r) => String(ms.filter((m) => m.resultado === r).length);
    const editar = Shell.pode('turmas', 'editar') && !['concluida', 'cancelada'].includes(s) ? `<button type="button" data-editar class="btn-fantasma">${ICONE.editar}Editar</button>` : '';
    return `
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        ${cartao({ titulo: 'Dados da turma', contexto: 'Curso, agenda, professor e vagas desta edição.', acao: editar, corpo: gradeCampos([
          campoValor('Curso', `${Shell.pode('cursos') ? `<a class="link" href="curso.html?id=${c.id}">${esc(c.nome)}</a>` : esc(c.nome)}<p class="text-xs ${APOIO}"><span class="font-mono">${esc(c.codigo)}</span> · ${c.cargaHoraria} h</p>`, 'sm:col-span-2'),
          campoValor('Período', `<span class="tabular-nums">${dataBr(t.inicio)} → ${dataBr(t.fim)}</span>`),
          campoValor('Dias e horário', esc(Agenda.descrever(t.agenda))),
          campoValor('Modalidade', esc(nomeModalidade(t.agenda.formato))),
          campoValor('Local ou link', t.local ? `<span class="break-all">${esc(t.local)}</span>` : ''),
          campoValor('Professor', esc(Aulor.professor(t.professorId).nome)),
          campoValor('Vagas', `<span class="tabular-nums">${o.capacidade}</span><p class="text-xs ${APOIO} tabular-nums">${o.ocupadas} ocupadas · mínimo de ${Aulor.minimoAlunos(t)} para abrir</p>`),
        ]) })}
        ${cartao({ titulo: 'Aprovação', contexto: 'As regras que fecham o resultado de cada aluno na conclusão.', corpo: gradeCampos([
          campoValor('Frequência mínima', `${cfg.frequenciaMinima}%<p class="text-xs ${APOIO}">das aulas com chamada registrada</p>`),
          campoValor('Falta justificada', cfg.justificadaContaPresenca ? 'Conta como presença' : 'Conta como falta'),
          campoValor('Nota mínima', Aulor.temNota(c) ? `${Aulor.fmtNota(c.notaMinima)}<p class="text-xs ${APOIO}">nota final de 0 a 10</p>` : `Sem nota<p class="text-xs ${APOIO}">Aprova pela frequência.</p>`),
          campoValor('Modelo de certificado', esc(Aulor.modeloDoCurso(c).nome)),
        ]) })}
        ${s === 'concluida' ? cartao({ titulo: 'Conclusão', contexto: `Concluída em ${dataBr(t.concluidaEm)}${t.concluidaPor ? ` por ${esc(t.concluidaPor)}` : ''}.`, corpo: gradeCampos([
          campoValor('Aprovados', conta('aprovado')),
          campoValor('Reprovados por frequência', conta('reprovado_frequencia')),
          Aulor.temNota(c) ? campoValor('Reprovados por nota', conta('reprovado_nota')) : '',
          campoValor('Certificados emitidos', String(ms.filter((m) => Aulor.certificadoDaMatricula(m.id)).length)),
        ]) }) : ''}
      </div>`;
  }

  function faixas(t, c, s) {
    const lista = [];
    const o = Aulor.ocupacao(t);
    const aulas = Aulor.aulasDaTurma(t.id);
    const pendentes = aulas.filter((a) => Aulor.chamadaPendente(a));
    const podeMatricular = Shell.pode('matriculas', 'criar') && ['planejada', 'em_andamento'].includes(s) && !o.lotada;
    const matricular = (classe) => (podeMatricular ? `<a href="matricula-nova.html?turma=${t.id}" class="${classe}">Nova venda</a>` : '');
    const r = Aulor.riscoTurma(t);
    if (r) {
      lista.push(faixa(r.nivel === 'critico' ? 'erro' : 'aviso', `<span class="font-medium">Em risco de não fechar (${Aulor.RISCO[r.nivel].nome.toLowerCase()}):</span> <span class="tabular-nums">${r.ocupadas} de ${r.minimo} alunos mínimos, início ${quando(t.inicio)} (${dataCurta(t.inicio)}) · ${r.faltam === 1 ? 'falta 1' : `faltam ${r.faltam}`} · ${moeda(r.valorEmJogo)} em jogo</span>`, matricular(LINK_FAIXA)));
    } else if (nova && !['concluida', 'cancelada'].includes(s)) {
      lista.push(faixa('passo', `Turma criada com ${plural(Aulor.progressoTurma(t).total, 'aula')} na agenda. Agora é só matricular os alunos.`, matricular('btn-pri btn-pequeno')));
    }
    if (!['concluida', 'cancelada'].includes(s) && pendentes.length) {
      const datas = pendentes.slice(0, 4).map((a) => dataCurta(a.data)).join(', ') + (pendentes.length > 4 ? '…' : '');
      lista.push(faixa('aviso', `<span class="font-medium">${plural(pendentes.length, 'chamada pendente', 'chamadas pendentes')}</span> (${datas}). Aula sem chamada não conta na frequência${s === 'a_concluir' ? ', e a turma só é concluída com todas registradas' : ''}.`, aba === 'aulas' ? '' : `<a href="turma.html?id=${t.id}&aba=aulas" class="${LINK_FAIXA}">Ver aulas</a>`));
    }
    if (s === 'a_concluir' && !pendentes.length) {
      const ultima = aulas.filter((a) => a.status !== 'cancelada').pop()?.data ?? t.fim;
      const podeConcluir = Shell.pode('turmas', 'concluir');
      const notas = Aulor.temNota(c) && podeLancarNota(t);
      lista.push(faixa('passo', `<span class="font-medium">Aguardando conclusão.</span> A última aula foi em ${dataBr(ultima)}. ${podeConcluir ? `Conclua para fechar o resultado de cada aluno${Aulor.temNota(c) ? ' com a nota final' : ''} e liberar os certificados.` : `${notas ? 'Lance as notas finais; a' : 'A'} coordenação conclui a turma.`}`,
        podeConcluir ? '<button type="button" data-concluir class="btn-pri btn-pequeno">Concluir turma</button>' : notas && !lancando ? '<button type="button" data-lancar-notas class="btn-pri btn-pequeno">Lançar notas</button>' : ''));
    }
    if (s === 'concluida' && Shell.pode('certificados')) {
      const prontos = Aulor.matriculasDaTurma(t.id).filter((m) => Aulor.elegibilidade(m).id === 'elegivel').length;
      if (prontos) lista.push(faixa('passo', `<span class="font-medium">${plural(prontos, 'certificado pronto', 'certificados prontos')} para emitir.</span> A turma foi concluída em ${dataBr(t.concluidaEm)}.`, `<a href="certificados.html?turma=${t.id}" class="btn-pri btn-pequeno">Emitir certificados</a>`));
    }
    return lista.join('');
  }

  function itensMais(t, s) {
    const o = Aulor.ocupacao(t);
    const aulas = Aulor.aulasDaTurma(t.id);
    const pendentes = aulas.filter((a) => Aulor.chamadaPendente(a)).length;
    const futuras = aulas.filter((a) => a.status === 'prevista' && a.data >= Aulor.hoje());
    const aberta = ['planejada', 'em_andamento'].includes(s);
    return [
      Shell.pode('matriculas', 'criar') && !['concluida', 'cancelada'].includes(s) ? {
        nome: 'Nova venda',
        desabilitado: !aberta || o.lotada,
        detalhe: o.lotada ? 'Turma lotada: aumente as vagas em Editar dados' : !aberta ? 'As aulas terminaram: matricule numa turma aberta' : plural(o.livres, 'vaga livre', 'vagas livres'),
        acao: () => { location.href = `matricula-nova.html?turma=${t.id}`; },
      } : null,
      Shell.pode('turmas', 'concluir') && ['em_andamento', 'a_concluir'].includes(s) ? {
        nome: 'Concluir turma',
        desabilitado: !!(futuras.length || pendentes),
        detalhe: futuras.length ? `Depois da última aula (${dataCurta(futuras[futuras.length - 1].data)})` : pendentes ? `Falta registrar ${plural(pendentes, 'chamada')}` : 'Fecha o resultado e libera os certificados',
        acao: () => concluir(t),
      } : null,
    ].filter(Boolean);
  }

  function render() {
    const t = Aulor.turma(id);
    if (!t || !Shell.podeVerTurma(t)) { tela.innerHTML = vazio('Turma não encontrada', '', '<a class="btn-sec" href="turmas.html">Voltar</a>'); return; }
    const c = Aulor.curso(t.cursoId);
    const s = Aulor.situacaoTurma(t);
    const encerrada = ['concluida', 'cancelada'].includes(s);
    const o = Aulor.ocupacao(t);
    const ms = Aulor.matriculasDaTurma(t.id);
    // A aba Alunos só conta o que é com você: quem está abaixo da frequência mínima (contador da aba Presenças do original).
    const abaixo = encerrada ? 0 : ms.filter((m) => m.status === 'ativa' && Aulor.frequencia(m).abaixo).length;
    const mais = itensMais(t, s);
    const editar = Shell.pode('turmas', 'editar')
      ? `<button type="button" data-editar class="btn-sec" ${encerrada ? `disabled title="Turma ${s === 'concluida' ? 'concluída' : 'cancelada'}: os dados ficam como registro"` : ''}>${ICONE.editar}Editar dados</button>` : '';
    const volta = Shell.ehSoProfessor() ? { rotulo: 'Minhas turmas', href: 'minhas-turmas.html' } : Shell.pode('turmas') ? { rotulo: 'Turmas', href: 'turmas.html' } : { rotulo: 'Aulas e chamadas', href: 'aulas.html' };
    // Aula hoje ainda sem chamada: o atalho fica à vista no topo (como na turma do Portal do Professor do original).
    const aulaHoje = encerrada ? null : Aulor.aulasDoDia().find((a) => a.turmaId === t.id && a.status === 'prevista');
    const chamada = aulaHoje && Shell.podeChamada(t) ? `<a href="chamada.html?aula=${aulaHoje.id}" class="btn-pri">Fazer a chamada · ${aulaHoje.inicio}</a>` : '';
    tela.innerHTML = `
      <div>
        ${cabecalhoFicha({
          trilha: [volta, { rotulo: `<span class="font-mono text-xs mr-1">${esc(t.codigo)}</span>${esc(c.nome)}` }],
          avatar: avatarRegistro(c.codigo, 'Código do curso'),
          nome: esc(c.nome),
          pilulas: encerrada ? pilula('neutro', Aulor.SITUACAO_TURMA[s].nome) : '',
          chips: [
            chip(ICONE.tag, `<span class="font-mono">${esc(t.codigo)}</span>`, 'Código da turma'),
            chip(ICONE.relogio, esc(Agenda.descrever(t.agenda)), 'Dias e horário'),
            chip(ICONE.local, `<span class="inline-block max-w-56 truncate align-bottom">${esc(nomeModalidade(t.agenda.formato))}${t.local ? ` · ${esc(t.local)}` : ''}</span>`, t.local || 'Modalidade'),
            chip(ICONE.pessoa, esc(Aulor.professor(t.professorId).nome), 'Professor'),
            chip(ICONE.calendario, `<span class="tabular-nums">${dataCurta(t.inicio)} → ${dataCurta(t.fim)}</span>`, 'Período'),
            chip(ICONE.pessoas, `<span class="tabular-nums">${o.ocupadas} de ${o.capacidade} vagas</span>`, 'Alunos e vagas'),
          ],
          acoes: chamada + editar,
          mais,
        })}
        ${faixas(t, c, s)}
        ${abasHtml([{ id: 'geral', nome: 'Acompanhamento' }, { id: 'aulas', nome: 'Aulas', n: Aulor.progressoTurma(t).total }, { id: 'alunos', nome: 'Alunos', n: abaixo, atencao: true }], aba)}
        ${aba === 'geral' ? `${resumo(t, c, ms)}${abaDados(t, c, s)}` : aba === 'aulas' ? abaAulas(t) : abaAlunos(t, c, s)}
      </div>`;
    ligarLinhasLink(tela);
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirFormTurma({ turma: t, aoSalvar: () => { toast('Turma atualizada'); render(); } })));
    tela.querySelector('[data-concluir]')?.addEventListener('click', () => concluir(t));
    tela.querySelector('[data-mais]')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, mais));
    tela.querySelectorAll('[data-lancar-notas]').forEach((b) => b.addEventListener('click', () => {
      lancando = true;
      if (aba !== 'alunos') { aba = 'alunos'; const u = new URL(location.href); u.searchParams.set('aba', 'alunos'); history.replaceState(null, '', u); }
      render();
      tela.querySelector('#form-notas input[name^="nota-"]')?.focus();
    }));
    tela.querySelector('[data-cancelar-notas]')?.addEventListener('click', () => { lancando = false; render(); });
    tela.querySelector('#form-notas')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const notas = Object.fromEntries([...form.querySelectorAll('input[name^="nota-"]')].map((i) => [i.name.slice(5), i.value]));
      const r = Aulor.lancarNotas(t.id, notas, Shell.nome());
      if (r.erros) { mostrarErros(form, r.erros); toast(r.erros.length > 1 ? `${r.erros.length} notas fora de 0 a 10` : r.erros[0].mensagem, 'erro'); return; }
      lancando = false;
      toast(`Notas salvas: ${r.lancadas} de ${r.total} alunos com nota`);
      render();
    });
  }

  // Conclusão: por aluno, frequência, nota final (curso com nota) e o resultado previsto, que muda
  // enquanto as notas são digitadas. Quem reprova por frequência não precisa de nota.
  function concluir(t) {
    const p = Aulor.previaConclusao(t.id);
    const c = Aulor.curso(t.cursoId);
    const min = Aulor.config().academico.frequenciaMinima;
    const comNota = p.notaMinima != null;
    const bloqueio = p.pendentes.length ? `Há ${plural(p.pendentes.length, 'chamada pendente', 'chamadas pendentes')}. Registre a presença antes de concluir.`
      : p.futuras.length ? `Ainda há ${plural(p.futuras.length, 'aula prevista', 'aulas previstas')}, a última em ${dataBr(p.futuras[p.futuras.length - 1].data)}. A turma pode ser concluída depois da última aula.` : '';
    const resultadoHtml = (r) => (r === 'sem_nota' ? status('atencao', 'Falta a nota') : status(Aulor.RESULTADO[r].tom, Aulor.RESULTADO[r].nome, '', true));
    const previsto = (x, v) => {
      if (!comNota || x.resultado === 'reprovado_frequencia') return x.resultado;
      const n = Aulor.lerNota(v);
      return n == null ? 'sem_nota' : n >= p.notaMinima ? 'aprovado' : 'reprovado_nota';
    };
    const linhas = p.alunos.map((x) => {
      const precisa = comNota && x.resultado !== 'reprovado_frequencia';
      return `
        <li data-linha="${x.m.id}" class="py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div class="min-w-0 flex-1 basis-40">
            <p class="text-sm font-medium ${TITULO} truncate">${esc(x.aluno.nome)}</p>
            <div class="mt-1">${barraFrequencia(x.f, { compacta: true })}</div>
          </div>
          ${comNota ? `<div class="w-24 shrink-0">${precisa
            ? `<label class="sr-only" for="cn-${x.m.id}">Nota final de ${esc(x.aluno.nome)}</label><input id="cn-${x.m.id}" name="nota-${x.m.id}" value="${valorNota(x.nota)}" inputmode="decimal" autocomplete="off" placeholder="0 a 10" class="campo text-right tabular-nums">${ERRO(`nota-${x.m.id}`)}`
            : `<span class="text-xs ${APOIO}">não precisa</span>`}</div>` : ''}
          <div data-resultado class="w-48 shrink-0"></div>
        </li>`;
    }).join('');
    const regra = comNota
      ? `Aprova quem tem pelo menos ${min}% de frequência e nota final ${Aulor.fmtNota(p.notaMinima)} ou mais. Quem não alcançou a frequência reprova por ela e não precisa de nota.`
      : `Aprova quem tem pelo menos ${min}% de frequência. Este curso não tem nota.`;
    const root = abrirModal(`
      <form id="form-concluir" novalidate class="flex flex-col min-h-0">
        ${cabecalhoModal(`Concluir ${esc(t.codigo)}`, esc(c.nome))}
        <div class="px-5 pb-4 overflow-y-auto space-y-3">
          ${bloqueio ? faixa('aviso', esc(bloqueio)) : ''}
          <p class="text-sm text-slate-600 dark:text-neutral-300">${regra}</p>
          <p data-resumo class="text-sm font-medium ${TITULO} tabular-nums"></p>
          ${p.alunos.length ? `<ul class="divide-y divide-slate-100 dark:divide-neutral-900 border-y border-slate-100 dark:border-neutral-900">${linhas}</ul>` : `<p class="text-sm ${APOIO}">Nenhum aluno cursando nesta turma.</p>`}
          ${ERRO('notas')}${ERRO('turma')}
          <p class="text-xs ${APOIO}">Depois de concluída, a chamada e as notas não podem mais ser alteradas, e os aprovados ficam prontos para o certificado.</p>
        </div>
        <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-2">
          <button type="button" data-fechar-modal class="btn-sec">Cancelar</button>
          <button type="submit" class="btn-pri" ${bloqueio ? 'disabled' : ''}>Concluir turma</button>
        </div>
      </form>`, 'max-w-2xl');
    const form = root.querySelector('#form-concluir');
    const nota = (x) => form.querySelector(`[name="nota-${x.m.id}"]`)?.value;
    const atualizar = () => {
      const n = { aprovado: 0, reprovado_frequencia: 0, reprovado_nota: 0, sem_nota: 0 };
      p.alunos.forEach((x) => {
        const r = previsto(x, nota(x));
        n[r] += 1;
        form.querySelector(`[data-linha="${x.m.id}"] [data-resultado]`).innerHTML = resultadoHtml(r);
      });
      form.querySelector('[data-resumo]').textContent = [
        `${n.aprovado} ${n.aprovado === 1 ? 'aprovado' : 'aprovados'}`,
        n.reprovado_frequencia && `${n.reprovado_frequencia} por frequência`,
        n.reprovado_nota && `${n.reprovado_nota} por nota`,
        n.sem_nota && `${n.sem_nota} sem nota`,
      ].filter(Boolean).join(' · ');
    };
    form.addEventListener('input', atualizar);
    atualizar();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const notas = comNota ? Object.fromEntries(p.alunos.filter((x) => nota(x) != null).map((x) => [x.m.id, nota(x)])) : null;
      const r = Aulor.concluirTurma(t.id, Shell.nome(), notas);
      if (r.erros) { mostrarErros(form, r.erros); return; }
      fecharModal();
      lancando = false;
      toast(`Turma concluída: ${plural(r.aprovados, 'aprovado')}, ${plural(r.reprovados, 'reprovado')}`);
      render();
    });
    form.querySelector('input[name^="nota-"], button[type="submit"]:not([disabled])')?.focus();
  }

  render();
})();
