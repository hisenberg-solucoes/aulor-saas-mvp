// ============================================================
// Venda, no desenho da Venda do original (contrato.html): cabeçalho com o
// código, abas Resumo · Aluno e turma · Cobrança · Histórico. No MVP a venda
// é um aluno num curso; dela saem a matrícula na turma e as parcelas.
// Recebimentos e estornos feitos aqui são os mesmos lançamentos do
// Financeiro (não há cópia). "Mais" leva a troca de turma (mesmas parcelas,
// frequência conta na turma nova) e o cancelamento.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');
  let nova = !!parametroUrl('nova');
  if (nova) { const u = new URL(location.href); u.searchParams.delete('nova'); history.replaceState(null, '', u); } // a faixa não volta ao recarregar
  const verFin = Shell.pode('receber');
  const ABAS = ['resumo', 'turma', 'cobranca', 'historico'].filter((x) => x !== 'cobranca' || verFin);
  const aba = ABAS.includes(parametroUrl('aba')) ? parametroUrl('aba') : 'resumo';

  // Turmas do mesmo curso que recebem a matrícula agora: com vaga e sem outra matrícula ativa do aluno.
  const destinosTroca = (m) => Aulor.turmasParaTroca(m).filter((t) => !Aulor.ocupacao(t).lotada
    && !Aulor.matriculasDoAluno(m.alunoId).some((x) => x.id !== m.id && x.turmaId === t.id && x.status === 'ativa'));
  const linkTurma = (tid) => { const tt = Aulor.turma(tid); return tt ? `<a class="link" href="turma.html?id=${tt.id}">${esc(tt.codigo)}</a>` : '—'; };

  // Tudo o que aconteceu com a venda, do mais novo ao mais antigo (aba Histórico).
  function eventos(m, parcelas) {
    const lista = [{ data: m.data, texto: `Venda confirmada: ${plural(m.parcelas, 'parcela lançada', 'parcelas lançadas')} em Contas a receber`, por: m.criadaPor }];
    (m.trocas ?? []).forEach((x) => lista.push({ data: x.data, texto: `Trocou de turma: de ${linkTurma(x.de)} para ${linkTurma(x.para)}`, por: x.por }));
    if (verFin) parcelas.filter((l) => l.status === 'pago' && l.pagoEm).forEach((l) => lista.push({ data: l.pagoEm, texto: `Parcela ${l.parcela ? `${l.parcela.n}/${l.parcela.de}` : ''} recebida · <span class="tabular-nums">${moeda(l.valorPago ?? l.valor)}</span>`, por: l.baixadoPor }));
    if (m.status === 'concluida') lista.push({ data: m.concluidaEm ?? Aulor.turma(m.turmaId).fim, texto: `Turma concluída: ${esc(Aulor.RESULTADO[m.resultado].nome.toLowerCase())}` });
    const cert = Aulor.certificadoDaMatricula(m.id);
    if (cert) lista.push({ data: cert.emitidoEm, texto: `Certificado emitido · <a class="link font-mono text-xs" href="certificado.html?id=${cert.id}">${esc(cert.codigo)}</a>`, por: cert.emitidoPor });
    if (m.status === 'cancelada') lista.push({ data: m.canceladaEm, texto: `Venda cancelada: ${esc(m.motivoCancelamento)}`, por: m.canceladaPor });
    // No mesmo dia, o que foi registrado depois vem antes (a venda fica abaixo do recebimento no ato).
    return lista.map((x, i) => ({ ...x, i })).sort((a, b) => b.data.localeCompare(a.data) || b.i - a.i);
  }

  function render() {
    const m = Aulor.matricula(id);
    if (!m) { tela.innerHTML = `<div class="painel">${vazio('Venda não encontrada', 'Ela pode ter sido removida ou o link está incompleto.', `<a class="${BOTAO_LINK} text-sm" href="matriculas.html">Voltar para as vendas</a>`)}</div>`; return; }
    const a = Aulor.aluno(m.alunoId);
    const t = Aulor.turma(m.turmaId);
    const c = Aulor.curso(t.cursoId);
    const f = Aulor.frequencia(m);
    const e = Aulor.elegibilidade(m);
    const parcelas = Aulor.parcelasDaMatricula(m.id);
    const st = Aulor.STATUS_MATRICULA[m.status];
    const r = m.status === 'concluida' ? Aulor.RESULTADO[m.resultado] : null;
    const ativas = parcelas.filter((l) => l.status !== 'cancelado');
    const vencidas = ativas.filter((l) => Aulor.situacaoLancamento(l) === 'vencido');
    const pago = ativas.filter((l) => l.status === 'pago').reduce((s, l) => s + (l.valorPago ?? l.valor), 0);
    const aberto = ativas.filter((l) => l.status === 'aberto').reduce((s, l) => s + l.valor, 0);
    const vencido = vencidas.reduce((s, l) => s + l.valor, 0);
    const resp = m.pagador === 'responsavel' ? Aulor.responsavelFinanceiro(a) : null;
    const nomePagador = resp?.nome ?? a.nome;
    const podeEmitir = Shell.pode('certificados', 'emitir');
    const destinos = m.status === 'ativa' ? destinosTroca(m) : [];
    const motivoTroca = m.status !== 'ativa' ? 'Só vendas em curso trocam de turma'
      : !Shell.pode('matriculas', 'trocar') ? 'Seu perfil não pode trocar de turma'
      : !destinos.length ? `Não há outra turma de ${c.nome} com vaga` : '';
    const motivoCancelar = m.status !== 'ativa' ? `Venda ${st.nome.toLowerCase()}` : !Shell.pode('matriculas', 'cancelar') ? 'Seu perfil não pode cancelar vendas' : '';
    const mais = [
      e.id === 'elegivel' && !podeEmitir && { nome: 'Emitir certificado', desabilitado: true, detalhe: 'Seu perfil não pode emitir certificados', acao: () => {} },
      { nome: 'Trocar de turma', detalhe: motivoTroca || 'Mesmas parcelas; a frequência passa a contar na turma nova', desabilitado: !!motivoTroca, acao: () => trocar(m) },
      Shell.pode('alunos') && { nome: 'Abrir o aluno', detalhe: 'Cadastro, responsáveis e outras vendas', acao: () => { location.href = `aluno.html?id=${a.id}`; } },
      'sep',
      { nome: 'Cancelar venda', perigo: true, detalhe: motivoCancelar, desabilitado: !!motivoCancelar, acao: () => cancelar(m) },
    ].filter(Boolean);
    const acoes = e.id === 'elegivel' && podeEmitir ? '<button type="button" data-emitir class="btn-pri">Emitir certificado</button>'
      : e.id === 'emitido' ? `<a href="certificado.html?id=${e.certificado.id}" class="btn-sec">Ver certificado</a>` : '';
    // Em curso é o comum; cancelada vira faixa neutra. Sem verde no cabeçalho: aprovada sai como "Concluída".
    const pilulas = r ? pilula(r.tom === 'perigo' ? 'perigo' : 'neutro', m.resultado === 'aprovado' ? 'Concluída' : r.nome) : '';
    const antiga = vencidas.reduce((x, l) => (!x || l.vencimento < x.vencimento ? l : x), null);
    const hist = eventos(m, parcelas);

    const faixas = [
      nova && faixa('passo', `<span class="font-medium">Venda confirmada.</span> ${plural(ativas.length, 'parcela lançada', 'parcelas lançadas')} em Contas a receber e ${esc(a.nome.split(' ')[0])} já aparece na lista da turma ${esc(t.codigo)}.`,
        `<span class="flex gap-3">${verFin ? `<a class="${BOTAO_LINK}" href="matricula.html?id=${m.id}&aba=cobranca">Ver as parcelas</a>` : ''}<a class="${BOTAO_LINK}" href="turma.html?id=${t.id}">Ver a turma</a></span>`),
      m.status === 'cancelada' && faixa('neutra', `<span class="font-medium">Cancelada em ${dataBr(m.canceladaEm)}.</span> ${esc(m.motivoCancelamento)}. Parcelas não pagas foram canceladas; as pagas ficam no histórico.`),
      verFin && antiga && faixa('erro', `<span class="font-medium">${plural(vencidas.length, 'parcela vencida', 'parcelas vencidas')} · ${moeda(vencido)}</span>, a mais antiga há ${plural(Aulor.diasAtraso(antiga), 'dia', 'dias')}. Paga: ${esc(nomePagador)}.`,
        Shell.pode('receber', 'registrar') ? `<button type="button" data-baixar="${antiga.id}" class="${BOTAO_LINK}">Receber ${dataCurta(antiga.vencimento)}</button>` : ''),
    ].filter(Boolean).join('');

    // ---------- Resumo ----------
    const cartaoContratante = cartao({
      titulo: 'Contratante e responsável financeiro', contexto: 'Contra quem sai a cobrança das parcelas.',
      corpo: `<div class="p-4 pt-3 space-y-4">
        ${campoValor('Contratante', 'Particular · 1 aluno')}
        ${campoValor('Responsável financeiro', `${Shell.pode('alunos') ? `<a class="link font-medium" href="aluno.html?id=${a.id}">${esc(nomePagador)}</a>` : `<span class="font-medium">${esc(nomePagador)}</span>`}
          <p class="text-xs ${APOIO} mt-0.5">${resp
            ? `responsável por ${esc(a.nome)}${resp.cpf ? ` · <span class="font-mono">${cpfFmt(resp.cpf)}</span>` : ''}${resp.telefone ? ` · ${telefoneFmt(resp.telefone)}` : ''}`
            : `o próprio aluno · <span class="font-mono">${cpfFmt(a.cpf)}</span>${a.email ? ` · ${esc(a.email)}` : ''}`}</p>`)}
      </div>`,
    });
    const cartaoValores = cartao({
      titulo: 'Valores', contexto: 'Valor do curso, desconto e como foi parcelado.',
      corpo: `<div class="p-4 pt-3">
        <table class="w-full text-sm"><thead><tr class="text-xs font-medium ${APOIO}"><th class="text-left font-medium pb-1.5">Curso</th><th class="text-right font-medium pb-1.5">Valor</th></tr></thead>
          <tbody><tr><td class="py-1 pr-3"><span class="${TITULO}">${esc(c.nome)}</span><p class="text-xs ${APOIO}">${esc(t.codigo)} · ${c.cargaHoraria} h</p></td><td class="py-1 text-right tabular-nums align-top">${moeda(m.valorCurso)}</td></tr></tbody></table>
        <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
          ${campoValor('Total base', `<span class="tabular-nums">${moeda(m.valorCurso)}</span>`)}
          ${campoValor('Desconto', m.desconto ? `<span class="tabular-nums">− ${moeda(m.desconto)}</span>` : '')}
          <div class="col-span-2">${campoValor('Total final', `<span class="font-display text-xl font-semibold tabular-nums ${TITULO}">${moeda(m.valorFinal)}</span>`)}</div>
          <div class="col-span-2">${campoValor('Cobrança', `${m.parcelas}× de <span class="tabular-nums">${moeda(m.valorFinal / m.parcelas)}</span> · ${esc(nomeForma(m.formaPagamento))} · 1º venc. ${dataBr(m.primeiroVencimento)}
            ${verFin ? `<p class="text-xs ${APOIO} mt-0.5 tabular-nums">Pago ${moeda(pago)} · em aberto ${moeda(aberto)}${vencido ? ` · <span class="font-medium text-red-700 dark:text-red-400">${moeda(vencido)} vencido</span>` : ''}</p>` : ''}`)}</div>
        </div>
      </div>`,
    });
    // Andamento: o caminho da venda até o certificado (no original, o fluxo comercial → administrativo).
    const passos = [
      { feito: true, nome: 'Venda confirmada', apoio: `${dataBr(m.data)}${m.criadaPor ? ` · ${esc(m.criadaPor)}` : ''}` },
      { feito: m.status !== 'cancelada' && t.inicio <= Aulor.hoje(), nome: 'Aluno em aula', apoio: m.status === 'cancelada' ? 'venda cancelada' : t.inicio <= Aulor.hoje() ? `na turma ${esc(t.codigo)} desde ${dataBr(Aulor.entradaNaTurma(m))}` : `a turma começa em ${dataBr(t.inicio)}` },
      { feito: m.status === 'concluida', nome: 'Turma concluída', apoio: r ? esc(r.nome) : m.status === 'ativa' ? `termina em ${dataBr(t.fim)}` : '' },
      { feito: e.id === 'emitido', nome: 'Certificado emitido', apoio: e.id === 'emitido' ? `<span class="font-mono">${esc(e.certificado.codigo)}</span> · ${dataBr(e.certificado.emitidoEm)}` : esc(e.nome) },
    ];
    const cartaoAndamento = cartao({
      titulo: 'Andamento', contexto: 'Da venda ao certificado.',
      corpo: `<ol class="p-4 pt-3 space-y-3">${passos.map((p) => `
        <li class="flex items-start gap-2.5">
          <span class="mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center ${p.feito ? 'bg-petrol-800 text-white dark:bg-sky-400 dark:text-black' : 'border-2 border-slate-300 dark:border-neutral-700'}" aria-hidden="true">${p.feito ? '<svg class="h-3 w-3" fill="none" viewBox="0 0 16 16" stroke-width="2.4" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.5 8.5l3 3 6-6.5"/></svg>' : ''}</span>
          <span class="min-w-0"><span class="block text-sm ${p.feito ? `font-medium ${TITULO}` : 'text-slate-600 dark:text-neutral-300'}">${p.nome}<span class="sr-only">${p.feito ? ' (feito)' : ' (pendente)'}</span></span>${p.apoio ? `<span class="block text-xs ${APOIO}">${p.apoio}</span>` : ''}</span>
        </li>`).join('')}</ol>`,
    });

    // ---------- Aluno e turma ----------
    const cartaoTurma = cartao({
      titulo: 'Turma', contexto: 'Onde e quando o aluno tem aula.',
      acao: `<a class="btn-fantasma" href="turma.html?id=${t.id}">Ver turma</a>`,
      corpo: gradeCampos([
        campoValor('Aluno', Shell.pode('alunos') ? `<a class="link" href="aluno.html?id=${a.id}">${esc(a.nome)}</a>` : esc(a.nome)),
        campoValor('Turma', `${esc(t.codigo)} · ${esc(c.nome)}`),
        campoValor('Professor', esc(Aulor.professor(t.professorId).nome)),
        campoValor('Dias e horário', esc(Agenda.descrever(t.agenda))),
        campoValor('Período', `${dataBr(t.inicio)} a ${dataBr(t.fim)}`),
        campoValor('Local ou link', esc(t.local)),
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
      corpo: `<ol class="p-4 space-y-2 text-sm text-slate-700 dark:text-neutral-200">${m.trocas.map((x) => `<li><span class="tabular-nums ${APOIO}">${dataBr(x.data)}</span> · de ${linkTurma(x.de)} para ${linkTurma(x.para)}${x.por ? ` <span class="text-xs ${APOIO}">· por ${esc(x.por)}</span>` : ''}</li>`).join('')}</ol>`,
    });

    // ---------- Cobrança ----------
    const cartaoParcelas = verFin && cartao({
      titulo: `Parcelas <span class="ml-1 text-xs font-normal ${APOIO} tabular-nums">${ativas.length}</span>`,
      contexto: `${moeda(pago)} recebido · ${moeda(aberto)} em aberto${vencido ? ` · <span class="font-medium text-red-700 dark:text-red-400">${moeda(vencido)} vencido</span>` : ''} · paga: ${esc(nomePagador)}`,
      classe: 'overflow-hidden',
      atributos: 'data-parcelas',
      corpo: `<div class="mt-3">${tabelaParcelas(parcelas)}</div>`,
    });

    // ---------- Histórico ----------
    const cartaoHistorico = cartao({
      titulo: 'Histórico', contexto: 'Do mais recente ao mais antigo.',
      corpo: `<ol class="mt-3 border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">${hist.map((x) => `
        <li class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <span class="w-24 shrink-0 tabular-nums ${APOIO}">${dataBr(x.data)}</span>
          <span class="min-w-0 text-slate-700 dark:text-neutral-200">${x.texto}${x.por ? ` <span class="text-xs ${APOIO}">· ${esc(x.por)}</span>` : ''}</span>
        </li>`).join('')}</ol>`,
    });

    const conteudo = {
      resumo: `<div class="grid gap-4 xl:grid-cols-2">${cartaoContratante}${cartaoValores}${cartaoAndamento}</div>`,
      turma: `<div class="grid gap-4 xl:grid-cols-2">${[cartaoTurma, cartaoFrequencia, cartaoResultado, cartaoTrocas].filter(Boolean).join('')}</div>`,
      cobranca: cartaoParcelas || '',
      historico: cartaoHistorico,
    }[aba];

    tela.innerHTML = `
      ${cabecalhoFicha({
        trilha: [{ rotulo: 'Vendas', href: 'matriculas.html' }, { rotulo: `<span class="font-mono">${esc(m.codigo)}</span>` }],
        avatar: `<div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center">${ICONE.documento.replace('h-3.5 w-3.5', 'h-6 w-6')}</div>`,
        nome: `Venda <span class="tabular-nums">${esc(m.codigo)}</span>`,
        pilulas,
        descricao: esc(c.nome),
        chips: [
          chip(ICONE.pessoa, `${esc(nomePagador)} · <span class="font-mono">${cpfFmt(resp?.cpf ?? a.cpf)}</span>`, 'Responsável financeiro · CPF'),
          chip(ICONE.pessoas, `1 aluno · <a class="hover:underline" href="turma.html?id=${t.id}">${esc(t.codigo)}</a>`, 'Aluno e turma'),
          chip(ICONE.tag, `<span class="tabular-nums">${moeda(m.valorFinal)}</span>`, 'Valor final'),
          chip(ICONE.calendario, `${dataBr(m.data)}${m.criadaPor ? ` · ${esc(m.criadaPor)}` : ''}`, 'Vendida em · por'),
        ],
        acoes,
        mais,
      })}
      <div data-faixas>${faixas}</div>
      ${abasHtml([
        { id: 'resumo', nome: 'Resumo' },
        { id: 'turma', nome: 'Aluno e turma', n: 1 },
        verFin && { id: 'cobranca', nome: 'Cobrança', n: vencidas.length || ativas.length, atencao: vencidas.length > 0 },
        { id: 'historico', nome: 'Histórico', n: hist.length },
      ].filter(Boolean), aba)}
      ${conteudo}`;

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
        toast(`Aluno movido de ${res.de.codigo} para ${res.para.codigo}`);
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
      titulo: 'Cancelar venda',
      subtitulo: `${Aulor.aluno(m.alunoId).nome} · ${Aulor.turma(m.turmaId).codigo}`,
      rotulo: 'Cancelar venda',
      largura: 'md',
      corpo: `
        <p class="text-sm text-slate-600 dark:text-neutral-300">${abertas.length ? `${abertas.length} parcela${abertas.length > 1 ? 's' : ''} em aberto (${moeda(abertas.reduce((s, l) => s + l.valor, 0))}) ${abertas.length > 1 ? 'serão canceladas' : 'será cancelada'}.` : 'Não há parcelas em aberto.'} As parcelas pagas continuam no histórico. A matrícula sai da turma e a vaga é liberada.</p>
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
        toast('Venda cancelada');
        nova = false;
        render();
        return [];
      },
    });
  }

  render();
})();
