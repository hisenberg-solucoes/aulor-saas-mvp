// ============================================================
// Nova matrícula em uma tela: aluno → turma → condições → confirmar.
// O resumo à direita mostra as parcelas exatamente como serão lançadas
// (mesma regra do motor: Aulor.simularMatricula / Aulor.matricular).
// Atalhos: ?aluno=ID e ?turma=ID já vêm preenchidos.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  if (!Shell.pode('matriculas', 'criar')) { document.getElementById('tela').innerHTML = vazio('Seu perfil não pode criar matrículas', 'Peça ao administrador para liberar "Matrículas › Matricular".', '<a class="btn-sec" href="matriculas.html">Ver matrículas</a>'); return; }
  const tela = document.getElementById('tela');
  const cfg = Aulor.config().financeiro;
  const hoje = Aulor.hoje();

  function proximoVencimento(dia = cfg.diaVencimentoPadrao) {
    const desteMes = `${hoje.slice(0, 8)}${String(dia).padStart(2, '0')}`;
    return desteMes > hoje ? desteMes : Aulor.somarMeses(desteMes, 1, dia);
  }

  const opcoesAlunos = () => [...Aulor.alunos()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((a) => {
    const atual = Aulor.matriculasDoAluno(a.id).find((m) => m.status === 'ativa');
    return { id: a.id, nome: a.nome, descricao: `CPF ${Documento.fmtCpf(a.cpf)}${atual ? ` · cursando ${Aulor.curso(Aulor.turma(atual.turmaId).cursoId).nome}` : ''}` };
  });
  const turmasAbertas = () => Aulor.turmas().filter((t) => ['planejada', 'em_andamento'].includes(Aulor.situacaoTurma(t)));
  const opcoesTurmas = () => turmasAbertas().filter((t) => !Aulor.ocupacao(t).lotada).sort((a, b) => a.inicio.localeCompare(b.inicio)).map((t) => {
    const o = Aulor.ocupacao(t);
    const s = Aulor.situacaoTurma(t);
    return { id: t.id, nome: `${Aulor.curso(t.cursoId).nome} · ${t.codigo}`, descricao: `${Agenda.descrever(t.agenda)} · ${s === 'planejada' ? `começa ${dataCurta(t.inicio)}` : `começou ${dataCurta(t.inicio)}`} · ${o.livres} vaga${o.livres > 1 ? 's' : ''}` };
  });
  const lotadas = () => turmasAbertas().filter((t) => Aulor.ocupacao(t).lotada);

  const secao = (n, titulo, corpo, extra = '') => `
    <section class="painel p-5">
      <div class="flex items-center justify-between gap-2 mb-4">
        <h3 class="font-display font-semibold flex items-center gap-2"><span class="h-6 w-6 rounded-full bg-marca text-sobre-marca grid place-items-center text-xs">${n}</span>${titulo}</h3>
        ${extra}
      </div>
      ${corpo}
    </section>`;

  function htmlAluno(alunoId) {
    return `
      <div data-bloco-aluno>
        ${campoCombo('alunoId', opcoesAlunos(), alunoId ?? '', { vazio: 'Buscar aluno por nome…' })}
        ${ERRO('alunoId')}
        <div data-info-aluno class="mt-3"></div>
      </div>`;
  }

  function render() {
    const alunoId = Aulor.aluno(parametroUrl('aluno')) ? parametroUrl('aluno') : '';
    const turmaId = opcoesTurmas().some((o) => o.id === parametroUrl('turma')) ? parametroUrl('turma') : '';
    const lot = lotadas();
    tela.innerHTML = `
      <form id="form-matricula" novalidate class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Nova matrícula', subtitulo: 'Três passos. As parcelas são lançadas em Contas a receber ao confirmar.', voltar: { href: 'matriculas.html', rotulo: 'Matrículas' } })}
        <div class="grid lg:grid-cols-3 gap-5 items-start">
          <div class="lg:col-span-2 space-y-5">
            ${secao(1, 'Aluno', htmlAluno(alunoId), Shell.pode('alunos', 'criar') ? '<button type="button" data-novo-aluno class="text-sm font-medium link">+ Cadastrar novo aluno</button>' : '')}
            ${secao(2, 'Curso e turma', `
              ${campoCombo('turmaId', opcoesTurmas(), turmaId, { vazio: 'Escolha a turma' })}
              ${ERRO('turmaId')}
              ${lot.length ? `<p class="text-xs text-tinta-2 mt-2">Lotadas (fora da lista): ${lot.map((t) => esc(t.codigo)).join(', ')}.</p>` : ''}
              <div data-info-turma class="mt-3"></div>`)}
            ${secao(3, 'Condições de pagamento', `
              <div class="grid sm:grid-cols-2 gap-4">
                ${campo('valorCurso', 'Valor do curso (R$)', '', { tipo: 'number', obrigatorio: true, extra: 'step="0.01" min="0"' })}
                <div>
                  <label for="f-desconto" class="rotulo">Desconto</label>
                  <div class="flex gap-2">
                    <select name="descontoTipo" aria-label="Tipo de desconto" class="${SELECT_FILTRO} w-24"><option value="percentual">%</option><option value="valor">R$</option></select>
                    <input id="f-desconto" name="desconto" type="number" min="0" step="0.01" value="0" class="campo">
                  </div>
                  <p class="text-xs text-tinta-3 mt-1">Máximo da escola: ${cfg.descontoMaximoPercentual}%.</p>
                  ${ERRO('desconto')}
                </div>
                <div>
                  <label for="f-parcelas" class="rotulo">Parcelas <span class="text-ruim">*</span></label>
                  <select id="f-parcelas" name="parcelas" class="campo">${Array.from({ length: cfg.parcelasMaximas }, (_, i) => `<option value="${i + 1}">${i + 1}× ${i === 0 ? '(à vista)' : ''}</option>`).join('')}</select>
                  ${ERRO('parcelas')}
                </div>
                ${campo('primeiroVencimento', '1º vencimento', proximoVencimento(), { tipo: 'date', obrigatorio: true, dica: `Demais parcelas no mesmo dia dos meses seguintes. Padrão da escola: dia ${cfg.diaVencimentoPadrao}.` })}
                <div>
                  <label class="rotulo" for="f-formaPagamento">Forma de pagamento <span class="text-ruim">*</span></label>
                  ${campoCombo('formaPagamento', Aulor.FORMAS_PAGAMENTO, 'pix')}
                  ${ERRO('formaPagamento')}
                </div>
                <div data-pagador></div>
              </div>
              <label class="mt-4 flex items-start gap-3 text-sm cursor-pointer">
                <input type="checkbox" name="pagarPrimeira" value="1" class="check mt-0.5">
                <span>Registrar agora o pagamento da 1ª parcela <span class="block text-xs text-tinta-2">Quando o aluno já paga no ato da matrícula.</span></span>
              </label>`)}
          </div>
          <aside class="painel lg:sticky lg:top-0">
            <div data-resumo></div>
            <div class="px-5 py-4 border-t border-linha space-y-3">
              <button type="submit" class="btn-pri w-full">Confirmar matrícula</button>
              <p class="text-xs text-tinta-2">Cobrança manual nesta versão: a secretaria envia boleto/Pix e registra o recebimento. Integração com provedor de pagamento prevista.</p>
            </div>
          </aside>
        </div>
      </form>`;
    const form = tela.querySelector('#form-matricula');
    ativarCombos(form);
    form.addEventListener('change', (e) => {
      if (e.target.name === 'turmaId') aplicarCurso(form);
      atualizar(form);
    });
    form.addEventListener('input', () => atualizar(form));
    form.querySelector('[data-novo-aluno]')?.addEventListener('click', () => abrirFormAluno({
      aoSalvar: (a) => {
        const bloco = form.querySelector('[data-bloco-aluno]');
        bloco.outerHTML = htmlAluno(a.id);
        ativarCombos(form.querySelector('[data-bloco-aluno]'));
        toast('Aluno cadastrado e selecionado');
        atualizar(form);
      },
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      const r = Aulor.matricular(d, Shell.nome());
      if (mostrarErros(form, r.erros ?? [])) { toast('Revise os campos destacados', 'erro'); return; }
      location.href = `matricula.html?id=${r.matricula.id}&nova=1`;
    });
    if (turmaId) aplicarCurso(form);
    atualizar(form);
  }

  // Ao escolher a turma, sugere valor e parcelamento do curso.
  function aplicarCurso(form) {
    const t = Aulor.turma(form.querySelector('[name="turmaId"]').value);
    if (!t) return;
    const c = Aulor.curso(t.cursoId);
    form.querySelector('[name="valorCurso"]').value = c.valor.toFixed(2);
    form.querySelector('[name="parcelas"]').value = String(c.parcelasSugeridas);
  }

  function atualizar(form) {
    const d = Object.fromEntries(new FormData(form).entries());
    const a = Aulor.aluno(d.alunoId);
    const t = Aulor.turma(d.turmaId);
    const info = (pares) => `<dl class="grid sm:grid-cols-3 gap-3 rounded-lg bg-faixa px-3 py-2.5">${pares.map(([r, v]) => `<div><dt class="text-xs text-tinta-2">${r}</dt><dd class="text-sm">${v}</dd></div>`).join('')}</dl>`;

    const infoAluno = form.querySelector('[data-info-aluno]');
    if (a) {
      const ativas = Aulor.matriculasDoAluno(a.id).filter((m) => m.status === 'ativa');
      const deve = Aulor.estaInadimplente(a.id);
      infoAluno.innerHTML = info([['Celular', telefoneFmt(a.telefone)], ['Responsável financeiro', Aulor.responsavelFinanceiro(a) ? esc(Aulor.responsavelFinanceiro(a).nome) : 'O próprio aluno'], ['Cursando agora', ativas.length ? esc(ativas.map((m) => Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome).join(', ')) : 'Nenhum curso']])
        + (deve && Shell.pode('receber') ? '<p class="mt-2 text-xs text-ruim">Atenção: este aluno tem parcela vencida em outra matrícula.</p>' : '');
    } else infoAluno.innerHTML = '';

    const infoTurma = form.querySelector('[data-info-turma]');
    infoTurma.innerHTML = t ? info([['Professor', esc(Aulor.professor(t.professorId).nome)], ['Período', `${dataBr(t.inicio)} a ${dataBr(t.fim)}`], ['Local', esc(t.local || '—')]]) : '';

    // "Quem paga" só é remontado quando o aluno muda (assim a escolha não se perde a cada tecla).
    // Nessa hora também aplica as preferências da aba "Endereço e pagamento" do aluno.
    const pagador = form.querySelector('[data-pagador]');
    if (pagador.dataset.montado !== (a?.id ?? '-')) {
      pagador.dataset.montado = a?.id ?? '-';
      const fin = a && Aulor.responsavelFinanceiro(a);
      const pagaResp = fin && a.cobranca?.pagador !== 'aluno';
      pagador.innerHTML = fin ? `
      <fieldset><legend class="rotulo">Quem paga</legend>
        <div class="flex gap-4 text-sm pt-1.5">
          <label class="flex items-center gap-2"><input type="radio" name="pagador" value="responsavel" ${pagaResp ? 'checked' : ''}>${esc(fin.nome.split(' ')[0])} (responsável)</label>
          <label class="flex items-center gap-2"><input type="radio" name="pagador" value="aluno" ${pagaResp ? '' : 'checked'}>O aluno</label>
        </div>
      </fieldset>` : '<input type="hidden" name="pagador" value="aluno">';
      const forma = Aulor.FORMAS_PAGAMENTO.find((f) => f.id === a?.cobranca?.formaPreferida);
      if (forma) {
        form.querySelector('[name="formaPagamento"]').value = forma.id;
        form.querySelector('[data-name="formaPagamento"] [data-combo-rotulo]').textContent = forma.nome;
      }
      if (a?.cobranca?.diaVencimento) form.querySelector('[name="primeiroVencimento"]').value = proximoVencimento(a.cobranca.diaVencimento);
    }

    const sim = Aulor.simularMatricula({ ...d, valorCurso: d.valorCurso || 0 });
    const linhaR = (r, v, cls = '') => `<div class="flex justify-between gap-3 text-sm ${cls}"><span class="text-tinta-2">${r}</span><span class="tabular-nums text-right">${v}</span></div>`;
    form.querySelector('[data-resumo]').innerHTML = `
      <div class="px-5 py-4 border-b border-linha">
        <h3 class="font-display font-semibold">Resumo</h3>
      </div>
      <div class="px-5 py-4 space-y-2">
        ${linhaR('Aluno', a ? esc(a.nome) : '—')}
        ${linhaR('Turma', t ? esc(t.codigo) : '—')}
        <div class="pt-2 mt-2 border-t border-linha space-y-2">
          ${linhaR('Valor do curso', moeda(sim.valorCurso))}
          ${sim.desconto ? linhaR('Desconto', `− ${moeda(sim.desconto)}`, 'text-bom') : ''}
          ${linhaR('<b class="text-tinta">Total</b>', `<b>${moeda(sim.valorFinal)}</b>`)}
        </div>
      </div>
      <div class="border-t border-linha">
        <p class="px-5 pt-3 pb-1 text-xs font-medium text-tinta-2">Parcelas que serão lançadas</p>
        ${sim.parcelas.length ? `<ol class="px-5 pb-3 max-h-56 overflow-y-auto">${sim.parcelas.map((p) => `<li class="flex justify-between py-1 text-sm tabular-nums"><span class="text-tinta-2">${p.n}/${p.de} · ${dataBr(p.vencimento)}${p.vencimento < hoje ? ' <span class="text-ruim">(já vencida)</span>' : ''}</span><span>${moeda(p.valor)}</span></li>`).join('')}</ol>` : '<p class="px-5 pb-3 text-sm text-tinta-3">Informe valor, parcelas e vencimento.</p>'}
      </div>`;
  }

  render();
})();
