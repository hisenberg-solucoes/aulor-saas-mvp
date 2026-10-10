// ============================================================
// Configurações da escola: dados, regras acadêmicas, preferências
// financeiras e plano contratado. O modelo do certificado usa o mesmo
// formulário, servido em templates-certificado.html (grupo Pedagógico).
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
  const soModelo = document.body.dataset.pagina === 'modelo-certificado';
  const aba = soModelo ? 'certificado' : ABAS.some((a) => a.id === parametroUrl('aba')) ? parametroUrl('aba') : 'escola';
  const podeEditar = Shell.pode('configuracoes', 'editar');
  const dis = podeEditar ? '' : 'disabled';

  const rodape = (texto = '') => podeEditar ? `
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
      <p class="text-xs text-slate-500 dark:text-neutral-400">${texto}</p>
      <button type="submit" class="btn-pri">Salvar</button>
    </div>` : '<p class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400">Somente leitura: seu perfil não edita as configurações.</p>';

  const cartao = (titulo, descricao, corpo, rodapeTxt = '') => `
    <form id="form-config" novalidate class="painel max-w-3xl">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold">${titulo}</h3>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">${descricao}</p>
      </div>
      <fieldset class="px-5 py-5 space-y-5" ${dis}>${corpo}</fieldset>
      ${rodape(rodapeTxt)}
    </form>`;

  const caixa = (nome, rotulo, marcado, dica = '') => `
    <label class="flex items-start gap-3 text-sm cursor-pointer">
      <input type="checkbox" name="${nome}" value="1" class="check mt-0.5" ${marcado ? 'checked' : ''}>
      <span>${rotulo}${dica ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${dica}</span>` : ''}</span>
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
      <div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-4 py-3 text-sm text-slate-600 dark:text-neutral-300 space-y-1">
        <p class="font-medium text-slate-800 dark:text-neutral-100">Como a regra é aplicada</p>
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
            <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Boleto e Pix emitidos e baixados automaticamente por um provedor de pagamentos (ex.: Asaas ou Stripe).</p>
          </div>
          ${status('neutro', 'Não conectada')}
        </div>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-3">Fora desta versão. Hoje a escola envia a cobrança pelo meio que já usa e registra o recebimento no Aulor. Cada parcela já tem o espaço reservado para o identificador da cobrança no provedor.</p>
      </section>`;
  }

  function abaCertificado() {
    const c = Aulor.config().certificado;
    return `
      <div class="grid xl:grid-cols-2 gap-5 items-start">
        ${cartao('Texto, cores e assinaturas', 'Use as variáveis entre chaves duplas para os dados de cada aluno.', `
          <div class="grid grid-cols-2 gap-4">
            ${campo('corPrimaria', 'Cor principal', c.corPrimaria, { tipo: 'color', extra: 'style="height:2.5rem;padding:.25rem"' })}
            ${campo('corDestaque', 'Cor de destaque', c.corDestaque, { tipo: 'color', extra: 'style="height:2.5rem;padding:.25rem"' })}
            ${campo('titulo', 'Título', c.titulo)}
            ${campo('introducao', 'Introdução', c.introducao)}
          </div>
          <div>
            <label class="rotulo" for="f-corpo">Texto <span class="text-red-600">*</span></label>
            <textarea id="f-corpo" name="corpo" rows="4" class="campo font-mono text-xs">${esc(c.corpo)}</textarea>
            ${ERRO('corpo')}
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Variáveis: ${Certificado.VARIAVEIS.map(([v, n]) => `<code title="${esc(n)}" class="px-1 rounded bg-slate-100 dark:bg-neutral-900">{{${v}}}</code>`).join(' ')}. <b>**negrito**</b>.</p>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            ${campo('ass1Nome', 'Assinatura 1', c.assinaturas[0]?.nome)}
            ${campo('ass1Cargo', 'Cargo 1', c.assinaturas[0]?.cargo)}
            ${campo('ass2Nome', 'Assinatura 2', c.assinaturas[1]?.nome, { dica: 'Use {{professor}} para o professor da turma.' })}
            ${campo('ass2Cargo', 'Cargo 2', c.assinaturas[1]?.cargo)}
          </div>
          ${caixa('mostrarVerso', 'Imprimir verso com conteúdo programático e requisitos', c.mostrarVerso)}`, 'Certificados já emitidos não mudam de texto.')}
        <div class="space-y-3 xl:sticky xl:top-0">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Prévia com dados de exemplo</p>
          <div data-previa class="space-y-3"></div>
        </div>
      </div>`;
  }

  function abaPlano() {
    const ass = Aulor.assinatura();
    const p = Planos.efetivo(ass);
    const ativos = Aulor.alunosAtivos().length;
    const est = Planos.estimar(ass, ativos);
    const noPlano = Planos.MODULOS.filter((m) => p.modulos.includes(m.id));
    const fora = Planos.MODULOS.filter((m) => !p.modulos.includes(m.id));
    const preco = (pl) => pl.preco == null ? '<span class="text-slate-500">A definir</span>' : `${moeda(pl.preco)}<span class="text-xs font-normal text-slate-500">/mês</span>`;
    const item = (m, tom, rotulo) => `<li class="flex items-center justify-between gap-3 py-2 text-sm"><span>${esc(m.nome)}</span>${pilula(tom, rotulo)}</li>`;
    return `
      <div class="grid lg:grid-cols-3 gap-5 items-start">
        <section class="painel lg:col-span-2">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs text-slate-500 dark:text-neutral-400">Plano contratado</p>
              <h3 class="font-display text-xl font-semibold">${esc(p.nome)}</h3>
              <p class="text-sm text-slate-500 dark:text-neutral-400">${esc(p.publico)}</p>
            </div>
            <div class="text-right">
              <p class="font-display text-lg font-semibold">${est ? moeda(est.mensal) : preco(p)}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400">${ativos} alunos ativos${p.alunosIncluidos ? ` · ${p.alunosIncluidos} incluídos` : ''}</p>
            </div>
          </div>
          <div class="px-5 py-4 grid sm:grid-cols-2 gap-x-8">
            <div>
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Incluído</h4>
              <ul class="divide-y divide-slate-100 dark:divide-neutral-900">${noPlano.map((m) => item(m, m.fase === 'futuro' ? 'info' : 'ok', m.fase === 'futuro' ? 'Em breve' : 'Ativo')).join('')}</ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Em outros planos</h4>
              <ul class="divide-y divide-slate-100 dark:divide-neutral-900">${fora.map((m) => item(m, 'neutro', Planos.PLANOS.find((x) => x.modulos.includes(m.id))?.nome ?? '—')).join('')}</ul>
            </div>
          </div>
        </section>
        <section class="painel">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
            <h3 class="font-display font-semibold">Planos</h3>
            <p class="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Hipótese comercial em validação — não é tabela de preços.</p>
          </div>
          <ul class="divide-y divide-slate-100 dark:divide-neutral-900">${Planos.PLANOS.map((pl) => `
            <li class="px-5 py-3 ${pl.id === ass.planoId ? 'bg-petrol-800/5 dark:bg-sky-400/5' : ''}">
              <div class="flex justify-between gap-2"><span class="font-medium">${esc(pl.nome)}${pl.id === ass.planoId ? ' <span class="text-xs text-slate-500">· atual</span>' : ''}</span><span class="text-sm font-semibold">${preco(pl)}</span></div>
              <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${pl.alunosIncluidos ? `${pl.alunosIncluidos} alunos ativos incluídos. ${pl.faixas.map((f) => `${f.de}–${f.ate}: ${moeda(f.porAluno)}/aluno`).join('; ')}; acima, ${pl.acimaDaUltimaFaixa}. Anual com ${pl.descontoAnualPercentual}% de desconto.` : 'Preço e limite de alunos ainda não definidos.'}</p>
            </li>`).join('')}
          </ul>
          <div class="px-5 py-4 border-t border-slate-200 dark:border-neutral-800">
            <label for="sim-alunos" class="rotulo">Simular Institucional</label>
            <div class="flex items-center gap-2"><input id="sim-alunos" type="number" min="0" value="${Math.max(ativos, 350)}" class="campo w-28"><span class="text-sm text-slate-500">alunos ativos</span></div>
            <p data-sim class="text-sm mt-2"></p>
          </div>
        </section>
      </div>`;
  }

  function render() {
    const corpo = { escola: abaEscola, academico: abaAcademico, financeiro: abaFinanceiro, certificado: abaCertificado, plano: abaPlano }[aba]();
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${soModelo
          ? cabecalhoPagina({ titulo: 'Layout do certificado', subtitulo: 'Um modelo para todos os cursos da escola. A prévia usa dados de exemplo; certificados já emitidos não mudam.' })
          : `${cabecalhoPagina({ titulo: 'Escola e regras', subtitulo: 'O básico para a escola operar. Sem painel técnico.' })}${abasHtml(ABAS, aba)}`}
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
    if (aba === 'certificado') {
      const previa = () => {
        const d = Object.fromEntries(new FormData(form).entries());
        const cfg = { ...Aulor.config().certificado, titulo: d.titulo, introducao: d.introducao, corpo: d.corpo, corPrimaria: d.corPrimaria, corDestaque: d.corDestaque, mostrarVerso: !!d.mostrarVerso, assinaturas: [{ nome: d.ass1Nome, cargo: d.ass1Cargo }, { nome: d.ass2Nome, cargo: d.ass2Cargo }].filter((s) => s.nome) };
        tela.querySelector('[data-previa]').innerHTML = Certificado.folhas(Certificado.dadosExemplo(), { cfg });
      };
      form.addEventListener('input', previa);
      form.addEventListener('change', previa);
      previa();
    }
    if (aba === 'plano') {
      const input = tela.querySelector('#sim-alunos');
      const saida = tela.querySelector('[data-sim]');
      const calc = () => {
        const n = Math.max(0, Number(input.value) || 0);
        const e = Planos.estimar({ planoId: 'institucional' }, n);
        saida.innerHTML = e.foraDasFaixas ? 'Acima da última faixa: condição sob consulta.' : `${moeda(e.base)} + ${moeda(e.adicional)} = <b>${moeda(e.mensal)}/mês</b><span class="block text-xs text-slate-500 dark:text-neutral-400">No anual com desconto: ${moeda(e.anualComDesconto)} por ano.</span>`;
      };
      input.addEventListener('input', calc);
      calc();
    }
  }

  render();
})();
