// ============================================================
// Configurações da escola: dados, regras acadêmicas, preferências
// financeiras e plano contratado. Os modelos de certificado têm tela própria
// (templates-certificado.html, grupo Pedagógico).
// As regras daqui são lidas pelo motor (não há valor fixo nas telas).
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const ABAS = [
    { id: 'escola', nome: 'Escola' },
    { id: 'academico', nome: 'Regras acadêmicas' },
    { id: 'financeiro', nome: 'Financeiro' },
    { id: 'plano', nome: 'Plano' },
  ];
  const aba = ABAS.some((a) => a.id === parametroUrl('aba')) ? parametroUrl('aba') : 'escola';
  const podeEditar = Shell.pode('configuracoes', 'editar');
  const dis = podeEditar ? '' : 'disabled';

  const rodape = (texto = '') => podeEditar ? `
    <div class="px-5 py-3 border-t border-linha flex items-center justify-between gap-3">
      <p class="text-xs text-tinta-2">${texto}</p>
      <button type="submit" class="btn-pri">Salvar</button>
    </div>` : '<p class="px-5 py-3 border-t border-linha text-xs text-tinta-2">Somente leitura: seu perfil não edita as configurações.</p>';

  const cartao = (titulo, descricao, corpo, rodapeTxt = '') => `
    <form id="form-config" novalidate class="painel max-w-3xl">
      <div class="px-5 py-4 border-b border-linha">
        <h3 class="font-display font-semibold">${titulo}</h3>
        <p class="text-sm text-tinta-2 mt-0.5">${descricao}</p>
      </div>
      <fieldset class="px-5 py-5 space-y-5" ${dis}>${corpo}</fieldset>
      ${rodape(rodapeTxt)}
    </form>`;

  const caixa = (nome, rotulo, marcado, dica = '') => `
    <label class="flex items-start gap-3 text-sm cursor-pointer">
      <input type="checkbox" name="${nome}" value="1" class="check mt-0.5" ${marcado ? 'checked' : ''}>
      <span>${rotulo}${dica ? `<span class="block text-xs text-tinta-2">${dica}</span>` : ''}</span>
    </label>`;

  function abaEscola() {
    const e = Aulor.escola();
    return cartao('Dados da escola', 'Aparecem no certificado, nos lembretes de cobrança e na página de validação.', `
      <div class="grid sm:grid-cols-6 gap-4">
        ${campo('nome', 'Nome da escola', e.nome, { obrigatorio: true, classe: 'sm:col-span-4' })}
        ${campo('sigla', 'Sigla', e.sigla, { obrigatorio: true, classe: 'sm:col-span-2', extra: 'maxlength="5" style="text-transform:uppercase"', dica: 'Prefixo do código dos certificados.' })}
        ${campo('cnpj', 'CNPJ', Documento.fmtCnpj(e.cnpj), { classe: 'sm:col-span-3', extra: 'data-mascara="cnpj"' })}
        ${campo('telefone', 'Telefone', telefoneFmt(e.telefone), { classe: 'sm:col-span-3', tipo: 'tel' })}
        ${campo('email', 'E-mail', e.email, { classe: 'sm:col-span-3', tipo: 'email' })}
        ${campo('site', 'Site', e.site, { classe: 'sm:col-span-3' })}
        ${campo('endereco', 'Endereço', e.endereco, { classe: 'sm:col-span-6' })}
        ${campo('cidade', 'Cidade', e.cidade, { obrigatorio: true, classe: 'sm:col-span-4' })}
        ${campo('uf', 'UF', e.uf, { classe: 'sm:col-span-2', extra: 'maxlength="2" style="text-transform:uppercase"' })}
        ${campo('diretor', 'Responsável pela escola', e.diretor, { classe: 'sm:col-span-3' })}
        ${campo('cargoDiretor', 'Cargo', e.cargoDiretor, { classe: 'sm:col-span-3' })}
      </div>`);
  }

  function abaAcademico() {
    const a = Aulor.config().academico;
    return cartao('Regras acadêmicas', 'Valem para todas as turmas: frequência, conclusão e certificado.', `
      <div class="grid sm:grid-cols-2 gap-4">
        ${campo('frequenciaMinima', 'Frequência mínima para aprovação (%)', a.frequenciaMinima, { tipo: 'number', obrigatorio: true, extra: 'min="0" max="100" step="1"', dica: 'Abaixo disso o aluno é reprovado por frequência ao concluir a turma e não recebe certificado.' })}
      </div>
      ${caixa('justificadaContaPresenca', 'Falta justificada conta como presença', a.justificadaContaPresenca, 'Ex.: atestado médico. Desmarcado, a justificada só fica registrada mas conta como falta.')}
      <div class="rounded-lg bg-faixa px-4 py-3 text-sm text-tinta-2 space-y-1">
        <p class="font-medium text-tinta">Como a regra é aplicada</p>
        <p>Frequência = presenças ÷ aulas com chamada registrada desde a matrícula. Aula sem chamada não conta e aparece como pendência.</p>
        <p>Ao concluir a turma, cada aluno vira "aprovado" ou "reprovado por frequência"; só os aprovados ficam prontos para o certificado.</p>
      </div>`, 'Mudanças valem para os próximos cálculos; turmas já concluídas mantêm o resultado.');
  }

  function abaFinanceiro() {
    const f = Aulor.config().financeiro;
    return `
      ${cartao('Preferências financeiras', 'Sugestões usadas na matrícula e no registro de recebimentos.', `
        <div class="grid sm:grid-cols-3 gap-4">
          ${campo('diaVencimentoPadrao', 'Dia de vencimento padrão', f.diaVencimentoPadrao, { tipo: 'number', extra: 'min="1" max="28"' })}
          ${campo('parcelasMaximas', 'Máximo de parcelas', f.parcelasMaximas, { tipo: 'number', extra: 'min="1" max="24"' })}
          ${campo('descontoMaximoPercentual', 'Desconto máximo (%)', f.descontoMaximoPercentual, { tipo: 'number', extra: 'min="0" max="100" step="0.5"' })}
          ${campo('multaPercentual', 'Multa por atraso (%)', f.multaPercentual, { tipo: 'number', extra: 'min="0" max="2" step="0.1"', dica: 'Limite legal de 2%.' })}
          ${campo('jurosMensalPercentual', 'Juros ao mês (%)', f.jurosMensalPercentual, { tipo: 'number', extra: 'min="0" max="1" step="0.1"', dica: 'Pró-rata por dia de atraso.' })}
        </div>
        ${caixa('bloquearCertificadoInadimplente', 'Não liberar certificado para aluno com parcela vencida', f.bloquearCertificadoInadimplente, 'Parcelas futuras não bloqueiam; só as vencidas e não pagas.')}`)}
      <section class="painel max-w-3xl mt-5 px-5 py-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-display font-semibold">Cobrança automática</h3>
            <p class="text-sm text-tinta-2 mt-0.5">Boleto e Pix emitidos e baixados automaticamente por um provedor de pagamentos (ex.: Asaas ou Stripe).</p>
          </div>
          ${status('neutro', 'Não conectada')}
        </div>
        <p class="text-xs text-tinta-2 mt-3">Fora desta versão. Hoje a escola envia a cobrança pelo meio que já usa e registra o recebimento no Aulor. Cada parcela já tem o espaço reservado para o identificador da cobrança no provedor.</p>
      </section>`;
  }

  function abaPlano() {
    const ass = Aulor.assinatura();
    const p = Planos.efetivo(ass);
    const ativos = Aulor.alunosAtivos().length;
    const est = Planos.estimar(ass, ativos);
    const noPlano = Planos.MODULOS.filter((m) => p.modulos.includes(m.id));
    const fora = Planos.MODULOS.filter((m) => !p.modulos.includes(m.id));
    const preco = (pl) => pl.preco == null ? '<span class="text-tinta-2">A definir</span>' : `${moeda(pl.preco)}<span class="text-xs font-normal text-tinta-2">/mês</span>`;
    const item = (m, tom, rotulo) => `<li class="flex items-center justify-between gap-3 py-2 text-sm"><span>${esc(m.nome)}</span>${pilula(tom, rotulo)}</li>`;
    return `
      <div class="grid lg:grid-cols-3 gap-5 items-start">
        <section class="painel lg:col-span-2">
          <div class="px-5 py-4 border-b border-linha flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs text-tinta-2">Plano contratado</p>
              <h3 class="font-display text-xl font-semibold">${esc(p.nome)}</h3>
              <p class="text-sm text-tinta-2">${esc(p.publico)}</p>
            </div>
            <div class="text-right">
              <p class="font-display text-lg font-semibold">${est ? moeda(est.mensal) : preco(p)}</p>
              <p class="text-xs text-tinta-2">${ativos} alunos ativos${p.alunosIncluidos ? ` · ${p.alunosIncluidos} incluídos` : ''}</p>
            </div>
          </div>
          <div class="px-5 py-4 grid sm:grid-cols-2 gap-x-8">
            <div>
              <h4 class="text-xs font-medium text-tinta-2 mb-1">Incluído</h4>
              <ul class="divide-y divide-linha">${noPlano.map((m) => item(m, m.fase === 'futuro' ? 'info' : 'ok', m.fase === 'futuro' ? 'Em breve' : 'Ativo')).join('')}</ul>
            </div>
            <div>
              <h4 class="text-xs font-medium text-tinta-2 mb-1">Em outros planos</h4>
              <ul class="divide-y divide-linha">${fora.map((m) => item(m, 'neutro', Planos.PLANOS.find((x) => x.modulos.includes(m.id))?.nome ?? '—')).join('')}</ul>
            </div>
          </div>
        </section>
        <section class="painel">
          <div class="px-5 py-4 border-b border-linha">
            <h3 class="font-display font-semibold">Planos</h3>
            <p class="text-xs text-aviso mt-0.5">Hipótese comercial em validação — não é tabela de preços.</p>
          </div>
          <ul class="divide-y divide-linha">${Planos.PLANOS.map((pl) => `
            <li class="px-5 py-3 ${pl.id === ass.planoId ? 'bg-selecao' : ''}">
              <div class="flex justify-between gap-2"><span class="font-medium">${esc(pl.nome)}${pl.id === ass.planoId ? ' <span class="text-xs text-tinta-2">· atual</span>' : ''}</span><span class="text-sm font-semibold">${preco(pl)}</span></div>
              <p class="text-xs text-tinta-2 mt-0.5">${pl.alunosIncluidos ? `${pl.alunosIncluidos} alunos ativos incluídos. ${pl.faixas.map((f) => `${f.de}–${f.ate}: ${moeda(f.porAluno)}/aluno`).join('; ')}; acima, ${pl.acimaDaUltimaFaixa}. Anual com ${pl.descontoAnualPercentual}% de desconto.` : 'Preço e limite de alunos ainda não definidos.'}</p>
            </li>`).join('')}
          </ul>
          <div class="px-5 py-4 border-t border-linha">
            <label for="sim-alunos" class="rotulo">Simular Institucional</label>
            <div class="flex items-center gap-2"><input id="sim-alunos" type="number" min="0" value="${Math.max(ativos, 350)}" class="campo w-28"><span class="text-sm text-tinta-2">alunos ativos</span></div>
            <p data-sim class="text-sm mt-2"></p>
          </div>
        </section>
      </div>`;
  }

  function render() {
    const corpo = { escola: abaEscola, academico: abaAcademico, financeiro: abaFinanceiro, plano: abaPlano }[aba]();
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Escola e regras', subtitulo: 'O básico para a escola operar. Sem painel técnico.' })}${abasHtml(ABAS, aba)}
        ${corpo}
      </div>`;
    ligar();
  }

  function ligar() {
    const form = tela.querySelector('#form-config');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      const r = aba === 'escola' ? Aulor.atualizarEscola(d) : Aulor.atualizarConfig(aba, d);
      if (mostrarErros(form, r.erros ?? [])) return;
      toast('Configurações salvas');
      render();
    });
    if (aba === 'plano') {
      const input = tela.querySelector('#sim-alunos');
      const saida = tela.querySelector('[data-sim]');
      const calc = () => {
        const n = Math.max(0, Number(input.value) || 0);
        const e = Planos.estimar({ planoId: 'institucional' }, n);
        saida.innerHTML = e.foraDasFaixas ? 'Acima da última faixa: condição sob consulta.' : `${moeda(e.base)} + ${moeda(e.adicional)} = <b>${moeda(e.mensal)}/mês</b><span class="block text-xs text-tinta-2">No anual com desconto: ${moeda(e.anualComDesconto)} por ano.</span>`;
      };
      input.addEventListener('input', calc);
      calc();
    }
  }

  render();
})();
