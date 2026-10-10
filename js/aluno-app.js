// ============================================================
// Ficha do aluno: dados, responsável, matrículas (com frequência e
// certificado), parcelas de todas as matrículas e histórico.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');

  function blocoMatricula(m) {
    const t = Aulor.turma(m.turmaId);
    const c = Aulor.curso(t.cursoId);
    const f = Aulor.frequencia(m);
    const parcelas = Aulor.parcelasDaMatricula(m.id);
    const pagas = parcelas.filter((l) => l.status === 'pago').length;
    const vencidas = parcelas.filter((l) => Aulor.situacaoLancamento(l) === 'vencido').length;
    const ativas = parcelas.filter((l) => l.status !== 'cancelado').length;
    const e = Aulor.elegibilidade(m);
    const st = Aulor.STATUS_MATRICULA[m.status];
    const resultado = m.status === 'concluida' ? (m.resultado === 'aprovado' ? 'Aprovado' : 'Reprovado por frequência') : st.nome;
    return `
      <li class="px-5 py-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <a href="matricula.html?id=${m.id}" class="font-medium text-slate-900 dark:text-neutral-100 hover:underline">${esc(c.nome)}</a>
            <p class="text-xs text-slate-500 dark:text-neutral-400">Matrícula ${m.codigo} · <a class="hover:underline" href="turma.html?id=${t.id}">${esc(t.codigo)}</a> · ${dataBr(t.inicio)} a ${dataBr(t.fim)}</p>
          </div>
          ${status(m.status === 'concluida' && m.resultado !== 'aprovado' ? 'perigo' : st.tom, resultado)}
        </div>
        <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><p class="text-xs text-slate-500 dark:text-neutral-400 mb-0.5">Frequência</p>${m.status === 'cancelada' ? '<span class="text-slate-400">—</span>' : barraFrequencia(f, { compacta: true })}</div>
          <div><p class="text-xs text-slate-500 dark:text-neutral-400 mb-0.5">Parcelas</p>${ativas ? `<span class="tabular-nums">${pagas} de ${ativas} pagas</span>${vencidas ? ` · <span class="text-red-700 dark:text-red-400">${vencidas} vencida${vencidas > 1 ? 's' : ''}</span>` : ''}` : '<span class="text-slate-400">—</span>'}</div>
          <div><p class="text-xs text-slate-500 dark:text-neutral-400 mb-0.5">Certificado</p>${e.id === 'emitido' ? `<a class="link text-sm" href="certificado.html?id=${e.certificado.id}">${esc(e.certificado.codigo)}</a>` : status(e.tom, e.nome, '', true)}</div>
        </div>
        ${m.status === 'cancelada' ? `<p class="mt-2 text-xs text-slate-500 dark:text-neutral-400">Cancelada em ${dataBr(m.canceladaEm)} — ${esc(m.motivoCancelamento)}</p>` : ''}
      </li>`;
  }

  function dado(rotulo, valor) {
    return `<div><dt class="text-xs text-slate-500 dark:text-neutral-400">${rotulo}</dt><dd class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valor || '<span class="text-slate-400">—</span>'}</dd></div>`;
  }

  function render() {
    const a = Aulor.aluno(id);
    if (!a) { tela.innerHTML = vazio('Aluno não encontrado', '', '<a class="btn-sec" href="alunos.html">Voltar para Alunos</a>'); return; }
    const s = Aulor.situacaoAluno(a);
    const ms = Aulor.matriculasDoAluno(a.id);
    const parcelas = Aulor.lancamentosDoAluno(a.id).filter((l) => l.status !== 'cancelado');
    const deve = Aulor.estaInadimplente(a.id);
    const idade = Aulor.idade(a.nascimento);
    const verFin = Shell.pode('receber');
    const aberto = parcelas.filter((l) => l.status === 'aberto').reduce((x, l) => x + l.valor, 0);
    const acoes = [
      Shell.pode('alunos', 'editar') ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar</button>` : '',
      Shell.pode('matriculas', 'criar') ? `<a href="matricula-nova.html?aluno=${a.id}" class="btn-pri">${ICONE.mais}Matricular</a>` : '',
    ].join('');
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${parametroUrl('novo') ? `<div class="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2">Cadastro criado. Próximo passo: matricular em uma turma. ${Shell.pode('matriculas', 'criar') ? `<a class="font-semibold underline" href="matricula-nova.html?aluno=${a.id}">Matricular agora</a>` : ''}</div>` : ''}
        ${cabecalhoPagina({ titulo: `${esc(a.nome)} <span class="align-middle ml-1">${pilula(s.tom, s.nome)}</span>${deve && verFin ? ` <span class="align-middle">${pilula('perigo', 'Parcela vencida')}</span>` : ''}`, subtitulo: `${idade != null ? `${idade} anos · ` : ''}aluno desde ${dataBr(a.criadoEm)}`, voltar: { href: 'alunos.html', rotulo: 'Alunos' }, acoes })}
        <div class="grid lg:grid-cols-3 gap-5 items-start">
          <div class="lg:col-span-2 space-y-5">
            <section class="painel">
              <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 class="font-display font-semibold">Matrículas e histórico acadêmico</h3>
                <span class="text-xs text-slate-500 dark:text-neutral-400">${ms.length}</span>
              </div>
              ${ms.length ? `<ul class="divide-y divide-slate-100 dark:divide-neutral-900">${ms.map(blocoMatricula).join('')}</ul>` : vazio('Ainda sem matrícula', 'Matricule o aluno em uma turma para gerar as parcelas e acompanhar a frequência.', Shell.pode('matriculas', 'criar') ? `<a href="matricula-nova.html?aluno=${a.id}" class="btn-pri">Matricular</a>` : '')}
            </section>
            ${verFin ? `
            <section class="painel" data-parcelas>
              <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-display font-semibold">Histórico financeiro</h3>
                <span class="text-xs text-slate-500 dark:text-neutral-400">${aberto ? `${moeda(aberto)} em aberto` : 'Nada em aberto'}</span>
              </div>
              ${tabelaParcelas(parcelas, { mostrarCurso: true })}
            </section>` : ''}
          </div>
          <aside class="painel p-5 space-y-5">
            <dl class="space-y-3">
              ${dado('CPF', cpfFmt(a.cpf))}
              ${dado('Celular', `${telefoneFmt(a.telefone)}${a.telefone ? ` <a class="link text-xs ml-1" target="_blank" rel="noopener" href="https://wa.me/55${a.telefone}">WhatsApp</a>` : ''}`)}
              ${dado('E-mail', esc(a.email))}
              ${dado('Nascimento', a.nascimento ? `${dataBr(a.nascimento)}${idade != null ? ` (${idade} anos)` : ''}` : '')}
            </dl>
            <div class="pt-4 border-t border-slate-100 dark:border-neutral-900">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Responsável financeiro</p>
              ${a.responsavel ? `<dl class="space-y-3">${dado('Nome', `${esc(a.responsavel.nome)}${a.responsavel.parentesco ? ` <span class="text-slate-400">· ${esc(a.responsavel.parentesco)}</span>` : ''}`)}${dado('Celular', telefoneFmt(a.responsavel.telefone))}${dado('CPF', cpfFmt(a.responsavel.cpf))}</dl>` : '<p class="text-sm text-slate-500 dark:text-neutral-400">O próprio aluno.</p>'}
            </div>
            ${a.observacoes ? `<div class="pt-4 border-t border-slate-100 dark:border-neutral-900">${dado('Observações', esc(a.observacoes))}</div>` : ''}
          </aside>
        </div>
      </div>`;
    tela.querySelector('[data-editar]')?.addEventListener('click', () => abrirFormAluno({ aluno: a, aoSalvar: () => { toast('Cadastro atualizado'); render(); } }));
    const p = tela.querySelector('[data-parcelas]');
    if (p) ligarAcoesParcelas(p, render);
  }

  render();
})();
