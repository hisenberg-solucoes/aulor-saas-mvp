// ============================================================
// Matrícula: o elo entre aluno, turma, parcelas, frequência e certificado,
// na direção "Ficha em cartões". Recebimentos e estornos feitos aqui são os
// mesmos lançamentos do Financeiro (não há cópia). "Mais" leva a troca de
// turma (mesmas parcelas, frequência conta na turma nova) e o cancelamento.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');
  let nova = !!parametroUrl('nova');

  // Turmas do mesmo curso que recebem a matrícula agora: com vaga e sem outra matrícula ativa do aluno.
  const destinosTroca = (m) => Aulor.turmasParaTroca(m).filter((t) => !Aulor.ocupacao(t).lotada
    && !Aulor.matriculasDoAluno(m.alunoId).some((x) => x.id !== m.id && x.turmaId === t.id && x.status === 'ativa'));

  function render() {
    const m = Aulor.matricula(id);
    if (!m) { tela.innerHTML = vazio('Matrícula não encontrada', '', '<a class="btn-sec" href="matriculas.html">Voltar</a>'); return; }
    const a = Aulor.aluno(m.alunoId);
    const t = Aulor.turma(m.turmaId);
    const c = Aulor.curso(t.cursoId);
    const f = Aulor.frequencia(m);
    const e = Aulor.elegibilidade(m);
    const parcelas = Aulor.parcelasDaMatricula(m.id);
    const st = Aulor.STATUS_MATRICULA[m.status];
    const r = m.status === 'concluida' ? Aulor.RESULTADO[m.resultado] : null;
    const verFin = Shell.pode('receber');
    const ativas = parcelas.filter((l) => l.status !== 'cancelado');
    const vencidas = ativas.filter((l) => Aulor.situacaoLancamento(l) === 'vencido');
    const pago = ativas.filter((l) => l.status === 'pago').reduce((s, l) => s + (l.valorPago ?? l.valor), 0);
    const aberto = ativas.filter((l) => l.status === 'aberto').reduce((s, l) => s + l.valor, 0);
    const vencido = vencidas.reduce((s, l) => s + l.valor, 0);
    const pagador = m.pagador === 'responsavel' ? (Aulor.responsavelFinanceiro(a)?.nome ?? 'Responsável financeiro') : 'O aluno';
    const podeEmitir = Shell.pode('certificados', 'emitir');
    const destinos = m.status === 'ativa' ? destinosTroca(m) : [];
    const motivoTroca = m.status !== 'ativa' ? 'Só matrículas em curso trocam de turma'
      : !Shell.pode('matriculas', 'trocar') ? 'Seu perfil não pode trocar de turma'
      : !destinos.length ? `Não há outra turma de ${c.nome} com vaga` : '';
    const motivoCancelar = m.status !== 'ativa' ? `Matrícula ${st.nome.toLowerCase()}` : !Shell.pode('matriculas', 'cancelar') ? 'Seu perfil não pode cancelar matrículas' : '';
    const mais = [
      e.id === 'elegivel' && !podeEmitir && { nome: 'Emitir certificado', desabilitado: true, detalhe: 'Seu perfil não pode emitir certificados', acao: () => {} },
      { nome: 'Trocar de turma', detalhe: motivoTroca || 'Mesmas parcelas; a frequência passa a contar na turma nova', desabilitado: !!motivoTroca, acao: () => trocar(m) },
      'sep',
      { nome: 'Cancelar matrícula', perigo: true, detalhe: motivoCancelar, desabilitado: !!motivoCancelar, acao: () => cancelar(m) },
    ];
    const acoes = e.id === 'elegivel' && podeEmitir ? '<button type="button" data-emitir class="btn-pri">Emitir certificado</button>'
      : e.id === 'emitido' ? `<a href="certificado.html?id=${e.certificado.id}" class="btn-sec">Ver certificado</a>` : '';
    // Cursando é o comum; cancelada vira faixa neutra. Sem verde no cabeçalho: aprovada sai como "Concluída".
    const pilulas = r ? pilula(r.tom === 'perigo' ? 'perigo' : 'neutro', m.resultado === 'aprovado' ? 'Concluída' : r.nome) : '';
    const antiga = vencidas.reduce((x, l) => (!x || l.vencimento < x.vencimento ? l : x), null);

    const faixas = [
      nova && faixa('passo', `<span class="font-medium">Matrícula confirmada.</span> ${plural(ativas.length, 'parcela lançada', 'parcelas lançadas')} em Contas a receber e ${esc(a.nome.split(' ')[0])} já aparece na lista da turma ${esc(t.codigo)}.`,
        `<span class="flex gap-2">${verFin ? '<a class="btn-sec btn-pequeno" href="financeiro.html?situacao=a_vencer">Ver no financeiro</a>' : ''}<a class="btn-sec btn-pequeno" href="turma.html?id=${t.id}">Ver turma</a></span>`),
      m.status === 'cancelada' && faixa('neutra', `<span class="font-medium">Cancelada em ${dataBr(m.canceladaEm)}.</span> ${esc(m.motivoCancelamento)}. Parcelas não pagas foram canceladas; as pagas ficam no histórico.`),
      verFin && antiga && faixa('erro', `<span class="font-medium">${plural(vencidas.length, 'parcela vencida', 'parcelas vencidas')} · ${moeda(vencido)}</span>, a mais antiga há ${plural(Aulor.diasAtraso(antiga), 'dia', 'dias')}. Quem paga: ${esc(pagador)}.`,
        Shell.pode('receber', 'registrar') ? `<button type="button" data-baixar="${antiga.id}" class="btn-sec btn-pequeno">Receber ${dataCurta(antiga.vencimento)}</button>` : ''),
    ].filter(Boolean).join('');

    const cartaoTurma = cartao({
      titulo: 'Turma', contexto: 'Onde e quando o aluno tem aula.',
      acao: `<a class="btn-fantasma" href="turma.html?id=${t.id}">Ver turma</a>`,
      corpo: gradeCampos([
        campoValor('Curso', esc(c.nome)),
        campoValor('Turma', esc(t.codigo)),
        campoValor('Professor', esc(Aulor.professor(t.professorId).nome)),
        campoValor('Dias e horário', esc(Agenda.descrever(t.agenda))),
        campoValor('Período', `${dataBr(t.inicio)} a ${dataBr(t.fim)}`),
        campoValor('Local ou link', esc(t.local)),
      ]),
    });
    const cartaoCondicoes = cartao({
      titulo: 'Condições de pagamento', contexto: 'Combinadas na matrícula; geraram as parcelas abaixo.',
      corpo: gradeCampos([
        campoValor('Valor do curso', `<span class="tabular-nums">${moeda(m.valorCurso)}</span>`),
        campoValor('Desconto', m.desconto ? `<span class="tabular-nums">− ${moeda(m.desconto)}</span>` : ''),
        campoValor('Total', `<span class="font-semibold tabular-nums">${moeda(m.valorFinal)}</span>`),
        campoValor('Parcelamento', `${m.parcelas}× · 1º venc. ${dataBr(m.primeiroVencimento)}`),
        campoValor('Forma', esc(nomeForma(m.formaPagamento))),
        campoValor('Quem paga', esc(pagador)),
      ]),
    });
    const cartaoFrequencia = m.status === 'ativa' && cartao({
      titulo: 'Frequência',
      contexto: `Mínimo para aprovar: ${f.minimo}%.${m.trocas?.length ? ` Conta em ${esc(t.codigo)} desde ${dataBr(Aulor.entradaNaTurma(m))}.` : ''}`,
      corpo: `<div class="p-4">${f.total ? `${barraFrequencia(f)}
        <p class="text-sm text-slate-600 dark:text-neutral-300 mt-2">${f.presentes} presenças, ${f.faltas} faltas${f.justificadas ? `, ${f.justificadas} justificadas` : ''} em ${f.total} aulas com chamada.</p>`
        : `<p class="text-sm text-slate-600 dark:text-neutral-300">Nenhuma chamada registrada ainda${t.inicio > Aulor.hoje() ? ` — a turma começa em ${dataBr(t.inicio)}` : ''}.</p>`}
        ${f.restantes ? `<p class="text-xs ${APOIO} mt-1">${plural(f.restantes, 'aula restante', 'aulas restantes')}.${f.semChance ? ' <span class="text-red-700 dark:text-red-400">Mesmo indo a todas, não alcança o mínimo.</span>' : ''}</p>` : ''}</div>`,
    });
    const cartaoResultado = r && cartao({
      titulo: 'Resultado', contexto: `Turma concluída em ${dataBr(m.concluidaEm ?? t.fim)}.`,
      corpo: gradeCampos([
        campoValor('Resultado', status(r.tom, r.nome)),
        campoValor('Frequência final', `<span class="tabular-nums">${m.frequenciaFinal ?? f.percentual ?? 0}%</span> <span class="text-xs ${APOIO}">· mínimo ${f.minimo}%</span>`),
        campoValor('Nota final', Aulor.temNota(c) ? `<span class="tabular-nums">${Aulor.fmtNota(m.notaFinal)}</span> <span class="text-xs ${APOIO}">· mínimo ${Aulor.fmtNota(c.notaMinima)}</span>` : `<span class="${APOIO}">Curso sem nota: aprova só por frequência</span>`),
        campoValor('Certificado', e.id === 'emitido' ? `<a class="link font-mono text-xs" href="certificado.html?id=${e.certificado.id}">${esc(e.certificado.codigo)}</a> <span class="text-xs ${APOIO}">· ${dataBr(e.certificado.emitidoEm)}</span>` : status(e.tom, e.nome, '', true)),
      ]),
    });
    const cartaoTrocas = m.trocas?.length && cartao({
      titulo: 'Trocas de turma', contexto: 'As parcelas não mudaram; as presenças de antes ficam no histórico da turma antiga.',
      corpo: `<ol class="p-4 space-y-2 text-sm text-slate-700 dark:text-neutral-200">${m.trocas.map((x) => {
        const link = (tid) => { const tt = Aulor.turma(tid); return tt ? `<a class="link" href="turma.html?id=${tt.id}">${esc(tt.codigo)}</a>` : '—'; };
        return `<li><span class="tabular-nums ${APOIO}">${dataBr(x.data)}</span> · de ${link(x.de)} para ${link(x.para)}${x.por ? ` <span class="text-xs ${APOIO}">· por ${esc(x.por)}</span>` : ''}</li>`;
      }).join('')}</ol>`,
    });
    const cartaoParcelas = verFin && cartao({
      titulo: 'Parcelas',
      contexto: `${moeda(pago)} recebido · ${moeda(aberto)} em aberto${vencido ? ` · <span class="font-medium text-red-700 dark:text-red-400">${moeda(vencido)} vencido</span>` : ''}`,
      classe: 'overflow-hidden xl:col-span-2',
      atributos: 'data-parcelas',
      corpo: `<div class="mt-3">${tabelaParcelas(parcelas)}</div>`,
    });

    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoFicha({
          trilha: [{ rotulo: 'Matrículas', href: 'matriculas.html' }, { rotulo: esc(m.codigo) }],
          avatar: avatarRegistro(c.codigo, c.nome),
          nome: `Matrícula <span class="tabular-nums">${esc(m.codigo)}</span>`,
          pilulas,
          chips: [
            chip(ICONE.pessoa, Shell.pode('alunos') ? `<a class="hover:underline" href="aluno.html?id=${a.id}">${esc(a.nome)}</a>` : esc(a.nome), 'Aluno'),
            chip(ICONE.pessoas, `<a class="hover:underline" href="turma.html?id=${t.id}">${esc(t.codigo)}</a> · ${esc(Agenda.descrever(t.agenda))}`, 'Turma · dias e horário'),
            chip(ICONE.tag, esc(c.nome), 'Curso'),
            chip(ICONE.calendario, `${dataBr(m.data)}${m.criadaPor ? ` · ${esc(m.criadaPor)}` : ''}`, 'Feita em · por'),
          ],
          acoes,
          mais,
        })}
        <div data-faixas>${faixas}</div>
        <div class="grid gap-4 xl:grid-cols-2">
          ${[cartaoTurma, cartaoCondicoes, cartaoFrequencia, cartaoResultado, cartaoTrocas, cartaoParcelas].filter(Boolean).join('')}
        </div>
      </div>`;

    const aoMudar = () => { nova = false; render(); };
    tela.querySelector('[data-mais]')?.addEventListener('click', (ev) => abrirMenu(ev.currentTarget, mais));
    ligarAcoesParcelas(tela.querySelector('[data-faixas]'), aoMudar);
    const p = tela.querySelector('[data-parcelas]');
    if (p) ligarAcoesParcelas(p, aoMudar);
    tela.querySelector('[data-emitir]')?.addEventListener('click', () => {
      const res = Aulor.emitirCertificado(m.id, Shell.nome());
      if (res.erros) { toast(res.erros[0].mensagem, 'erro'); return; }
      location.href = `certificado.html?id=${res.certificado.id}&emitido=1`;
    });
  }

  // Diz o efeito antes de gravar (Regra do Motivo Escrito): parcelas iguais, frequência na turma nova.
  function trocar(m) {
    const de = Aulor.turma(m.turmaId);
    const c = Aulor.curso(de.cursoId);
    const opcoes = destinosTroca(m);
    const lotadas = Aulor.turmasParaTroca(m).filter((t) => Aulor.ocupacao(t).lotada);
    modalFormulario({
      id: 'form-trocar',
      titulo: 'Trocar de turma',
      subtitulo: `${Aulor.aluno(m.alunoId).nome} · hoje em ${de.codigo}`,
      rotulo: 'Trocar de turma',
      largura: 'lg',
      foco: '[name="turmaId"]',
      corpo: `
        <fieldset>
          <legend class="rotulo">Turma nova de ${esc(c.nome)} <span class="text-red-600 dark:text-red-400">*</span></legend>
          <div class="space-y-2">${opcoes.map((t) => {
            const o = Aulor.ocupacao(t);
            return `
            <label class="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2.5 cursor-pointer transition hover:border-petrol-800 dark:hover:border-sky-400 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40">
              <input type="radio" name="turmaId" value="${t.id}" class="mt-1 accent-petrol-800 dark:accent-sky-400">
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-baseline justify-between gap-x-3"><span class="font-medium ${TITULO}">${esc(t.codigo)}</span><span class="text-xs tabular-nums ${APOIO}">${plural(o.livres, 'vaga livre', 'vagas livres')}</span></span>
                <span class="block text-sm text-slate-600 dark:text-neutral-300">${esc(Agenda.descrever(t.agenda))}</span>
                <span class="block text-xs ${APOIO}">${Aulor.situacaoTurma(t) === 'planejada' ? `Começa em ${dataBr(t.inicio)}` : `Em andamento desde ${dataBr(t.inicio)}`} · ${esc(Aulor.professor(t.professorId).nome)}</span>
              </span>
            </label>`;
          }).join('')}</div>
          ${ERRO('turmaId')}
          ${lotadas.length ? `<p class="text-xs ${APOIO} mt-2">Lotadas (fora da lista): ${lotadas.map((t) => esc(t.codigo)).join(', ')}.</p>` : ''}
        </fieldset>
        <div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-3 py-2.5 text-sm">
          <p class="font-medium ${TITULO}">O que muda</p>
          <ul class="mt-1 list-disc pl-5 space-y-0.5 text-slate-600 dark:text-neutral-300">
            <li>As parcelas não mudam: mesmos valores e vencimentos.</li>
            <li>A frequência passa a contar na turma nova a partir de hoje (${dataBr(Aulor.hoje())}). As presenças de ${esc(de.codigo)} ficam no histórico dela.</li>
            <li>A vaga em ${esc(de.codigo)} é liberada.</li>
            ${m.notaFinal != null ? '<li>A nota já lançada é apagada: a nota é da turma.</li>' : ''}
          </ul>
        </div>`,
      aoSalvar: (fd) => {
        const res = Aulor.trocarTurma(m.id, fd.get('turmaId'), Shell.nome());
        if (res.erros) return res.erros;
        toast(`Matrícula movida de ${res.de.codigo} para ${res.para.codigo}`);
        nova = false;
        render();
        return [];
      },
    });
  }

  function cancelar(m) {
    const abertas = Aulor.parcelasDaMatricula(m.id).filter((l) => l.status === 'aberto');
    modalFormulario({
      id: 'form-cancelar',
      titulo: 'Cancelar matrícula',
      subtitulo: `${Aulor.aluno(m.alunoId).nome} · ${Aulor.turma(m.turmaId).codigo}`,
      rotulo: 'Cancelar matrícula',
      largura: 'md',
      corpo: `
        <p class="text-sm text-slate-600 dark:text-neutral-300">${abertas.length ? `${abertas.length} parcela${abertas.length > 1 ? 's' : ''} em aberto (${moeda(abertas.reduce((s, l) => s + l.valor, 0))}) ${abertas.length > 1 ? 'serão canceladas' : 'será cancelada'}.` : 'Não há parcelas em aberto.'} As parcelas pagas continuam no histórico. A vaga na turma é liberada.</p>
        <div>
          <label class="rotulo" for="f-motivo">Motivo <span class="text-red-600 dark:text-red-400">*</span></label>
          <input id="f-motivo" name="motivo" class="campo" placeholder="Ex.: mudou de cidade, conflito de horário">
          ${ERRO('motivo')}
        </div>
        <p class="text-xs ${APOIO}">Multas, devoluções e acordos de rescisão ficam fora do MVP: trate à parte e registre no motivo.</p>`,
      foco: '#f-motivo',
      aoSalvar: (fd) => {
        const r = Aulor.cancelarMatricula(m.id, fd.get('motivo'), Shell.nome());
        if (r.erros) return r.erros;
        toast('Matrícula cancelada');
        nova = false;
        render();
        return [];
      },
    });
  }

  render();
})();
