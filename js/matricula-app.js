// ============================================================
// Matrícula: o elo entre aluno, turma, parcelas, frequência e certificado.
// Recebimentos e estornos feitos aqui são os mesmos lançamentos do
// Financeiro (não há cópia).
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');
  let nova = !!parametroUrl('nova');

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
    const verFin = Shell.pode('receber');
    const ativas = parcelas.filter((l) => l.status !== 'cancelado');
    const pago = ativas.filter((l) => l.status === 'pago').reduce((s, l) => s + (l.valorPago ?? l.valor), 0);
    const aberto = ativas.filter((l) => l.status === 'aberto').reduce((s, l) => s + l.valor, 0);
    const vencido = ativas.filter((l) => Aulor.situacaoLancamento(l) === 'vencido').reduce((s, l) => s + l.valor, 0);
    const acoes = [
      e.id === 'elegivel' && Shell.pode('certificados', 'emitir') ? '<button type="button" data-emitir class="btn-pri">Emitir certificado</button>' : '',
      e.id === 'emitido' ? `<a href="certificado.html?id=${e.certificado.id}" class="btn-sec">Ver certificado</a>` : '',
      m.status === 'ativa' && Shell.pode('matriculas', 'cancelar') ? '<button type="button" data-cancelar class="btn-sec text-ruim">Cancelar matrícula</button>' : '',
    ].join('');
    const dado = (r, v) => `<div><dt class="text-xs text-tinta-2">${r}</dt><dd class="text-sm mt-0.5">${v}</dd></div>`;
    const resultado = m.status === 'concluida' ? (m.resultado === 'aprovado' ? 'Concluída · aprovado' : 'Concluída · reprovado por frequência') : st.nome;

    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${nova ? `<div class="mb-4 rounded-xl border border-bom/30 bg-bom/10 px-4 py-3 text-sm text-tinta flex flex-wrap items-center justify-between gap-2">
          <span><b>Matrícula confirmada.</b> ${ativas.length} parcela${ativas.length === 1 ? '' : 's'} lançada${ativas.length === 1 ? '' : 's'} em Contas a receber e ${esc(a.nome.split(' ')[0])} já aparece na lista da turma ${esc(t.codigo)}.</span>
          <span class="flex gap-3 font-semibold">${verFin ? '<a class="underline" href="financeiro.html?situacao=a_vencer">Ver no financeiro</a>' : ''}<a class="underline" href="turma.html?id=${t.id}">Ver turma</a></span>
        </div>` : ''}
        ${cabecalhoPagina({ titulo: `Matrícula ${m.codigo} <span class="align-middle ml-1">${pilula(m.status === 'concluida' && m.resultado !== 'aprovado' ? 'perigo' : st.tom, resultado)}</span>`, subtitulo: `Feita em ${dataBr(m.data)}${m.criadaPor ? ` por ${esc(m.criadaPor)}` : ''}`, voltar: { href: 'matriculas.html', rotulo: 'Matrículas' }, acoes })}
        ${m.status === 'cancelada' ? `<p class="mb-4 rounded-xl bg-etiqueta px-4 py-3 text-sm">Cancelada em ${dataBr(m.canceladaEm)} — ${esc(m.motivoCancelamento)}. Parcelas não pagas foram canceladas; as pagas ficam no histórico.</p>` : ''}
        <div class="grid lg:grid-cols-3 gap-5 items-start">
          <div class="lg:col-span-2 space-y-5">
            <section class="painel p-5">
              <dl class="grid sm:grid-cols-3 gap-4">
                ${dado('Aluno', Shell.pode('alunos') ? `<a class="link font-medium" href="aluno.html?id=${a.id}">${esc(a.nome)}</a>` : esc(a.nome))}
                ${dado('Curso', esc(c.nome))}
                ${dado('Turma', `<a class="link" href="turma.html?id=${t.id}">${esc(t.codigo)}</a>`)}
                ${dado('Professor', esc(Aulor.professor(t.professorId).nome))}
                ${dado('Dias e horário', esc(Agenda.descrever(t.agenda)))}
                ${dado('Período', `${dataBr(t.inicio)} a ${dataBr(t.fim)}`)}
              </dl>
            </section>
            ${verFin ? `
            <section class="painel" data-parcelas>
              <div class="px-5 py-4 border-b border-linha flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-display font-semibold">Parcelas</h3>
                <span class="text-xs text-tinta-2">${moeda(pago)} recebido · ${moeda(aberto)} em aberto${vencido ? ` · <span class="text-ruim">${moeda(vencido)} vencido</span>` : ''}</span>
              </div>
              ${tabelaParcelas(parcelas)}
            </section>` : ''}
          </div>
          <div class="space-y-5">
            <section class="painel p-5">
              <h3 class="font-display font-semibold mb-3">Condições</h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-tinta-2">Valor do curso</dt><dd class="tabular-nums">${moeda(m.valorCurso)}</dd></div>
                ${m.desconto ? `<div class="flex justify-between"><dt class="text-tinta-2">Desconto</dt><dd class="tabular-nums text-bom">− ${moeda(m.desconto)}</dd></div>` : ''}
                <div class="flex justify-between font-semibold"><dt>Total</dt><dd class="tabular-nums">${moeda(m.valorFinal)}</dd></div>
                <div class="flex justify-between pt-2 border-t border-linha"><dt class="text-tinta-2">Parcelamento</dt><dd>${m.parcelas}× · 1º venc. ${dataCurta(m.primeiroVencimento)}</dd></div>
                <div class="flex justify-between"><dt class="text-tinta-2">Forma</dt><dd>${esc(nomeForma(m.formaPagamento))}</dd></div>
                <div class="flex justify-between"><dt class="text-tinta-2">Quem paga</dt><dd>${m.pagador === 'responsavel' ? esc(Aulor.responsavelFinanceiro(a)?.nome ?? 'Responsável financeiro') : 'O aluno'}</dd></div>
              </dl>
            </section>
            <section class="painel p-5">
              <h3 class="font-display font-semibold mb-3">Frequência</h3>
              ${m.status === 'cancelada' ? '<p class="text-sm text-tinta-2">—</p>' : `
                ${f.total ? `${barraFrequencia(f)}
                <p class="text-sm text-tinta-2 mt-2">${f.presentes} presenças, ${f.faltas} faltas${f.justificadas ? `, ${f.justificadas} justificadas` : ''} em ${f.total} aulas com chamada. Mínimo: ${f.minimo}%.</p>` : `<p class="text-sm text-tinta-2">Nenhuma chamada registrada ainda${t.inicio > Aulor.hoje() ? ` — a turma começa em ${dataBr(t.inicio)}` : ''}. Mínimo: ${f.minimo}%.</p>`}
                ${m.status === 'ativa' && f.restantes ? `<p class="text-xs text-tinta-2 mt-1">${f.restantes} aulas restantes.${f.semChance ? ' <span class="text-ruim">Mesmo indo a todas, não alcança o mínimo.</span>' : ''}</p>` : ''}`}
            </section>
            <section class="painel p-5">
              <h3 class="font-display font-semibold mb-2">Certificado</h3>
              ${e.id === 'emitido' ? `<p class="text-sm">Emitido em ${dataBr(e.certificado.emitidoEm)} · <a class="link font-mono text-xs" href="certificado.html?id=${e.certificado.id}">${e.certificado.codigo}</a></p>` : status(e.tom, e.nome)}
            </section>
          </div>
        </div>
      </div>`;

    const p = tela.querySelector('[data-parcelas]');
    if (p) ligarAcoesParcelas(p, () => { nova = false; render(); });
    tela.querySelector('[data-emitir]')?.addEventListener('click', () => {
      const r = Aulor.emitirCertificado(m.id, Shell.nome());
      if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
      location.href = `certificado.html?id=${r.certificado.id}&emitido=1`;
    });
    tela.querySelector('[data-cancelar]')?.addEventListener('click', () => cancelar(m));
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
        <p class="text-sm text-tinta-2">${abertas.length ? `${abertas.length} parcela${abertas.length > 1 ? 's' : ''} em aberto (${moeda(abertas.reduce((s, l) => s + l.valor, 0))}) ${abertas.length > 1 ? 'serão canceladas' : 'será cancelada'}.` : 'Não há parcelas em aberto.'} As parcelas pagas continuam no histórico. A vaga na turma é liberada.</p>
        <div>
          <label class="rotulo" for="f-motivo">Motivo <span class="text-ruim">*</span></label>
          <input id="f-motivo" name="motivo" class="campo" placeholder="Ex.: mudou de cidade, conflito de horário">
          ${ERRO('motivo')}
        </div>
        <p class="text-xs text-tinta-2">Multas, devoluções e acordos de rescisão ficam fora do MVP: trate à parte e registre no motivo.</p>`,
      foco: '#f-motivo',
      aoSalvar: (fd) => {
        const r = Aulor.cancelarMatricula(m.id, fd.get('motivo'), Shell.nome());
        if (r.erros) return r.erros;
        toast('Matrícula cancelada');
        render();
        return [];
      },
    });
  }

  render();
})();
