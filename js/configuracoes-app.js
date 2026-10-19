// ============================================================
// Configurações da escola: dados, regras acadêmicas, preferências
// financeiras e plano contratado. Os modelos de certificado têm tela própria
// (templates-certificado.html, grupo Pedagógico).
// As regras daqui são lidas pelo motor (não há valor fixo nas telas).
// Cada cartão mostra os valores; "Editar" abre o formulário em modal.
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
  const pc = (v) => `${Number(v).toLocaleString('pt-BR')}%`;

  const botaoEditar = (secao) => botaoPermitido(podeEditar, `<button type="button" data-editar="${secao}" class="btn-fantasma">${ICONE.editar}Editar</button>`, 'Seu perfil não edita as configurações');

  const caixa = (nome, rotulo, marcado, dica = '') => `
    <label class="flex items-start gap-3 text-sm cursor-pointer">
      <input type="checkbox" name="${nome}" value="1" class="check mt-0.5" ${marcado ? 'checked' : ''}>
      <span>${rotulo}${dica ? `<span class="block text-xs ${APOIO}">${dica}</span>` : ''}</span>
    </label>`;

  // Formulário de cada seção: campos, título e o que salva. Os mesmos campos e validações de antes.
  const FORMS = {
    escola: () => {
      const e = Aulor.escola();
      return {
        titulo: 'Dados da escola', subtitulo: 'Aparecem no certificado, nos lembretes de cobrança e na página de validação.', largura: 'xl', foco: '#f-nome',
        corpo: `
          <div class="grid sm:grid-cols-6 gap-4">
            ${campo('nome', 'Nome da escola', e.nome, { obrigatorio: true, classe: 'sm:col-span-4' })}
            ${campo('sigla', 'Sigla', e.sigla, { obrigatorio: true, classe: 'sm:col-span-2', extra: 'maxlength="5" style="text-transform:uppercase"', dica: 'Prefixo do código dos certificados.' })}
            ${campo('cnpj', 'CNPJ', e.cnpj ? Documento.fmtCnpj(e.cnpj) : '', { classe: 'sm:col-span-3', extra: 'data-mascara="cnpj"' })}
            ${campo('telefone', 'Telefone', e.telefone ? telefoneFmt(e.telefone) : '', { classe: 'sm:col-span-3', tipo: 'tel' })}
            ${campo('email', 'E-mail', e.email, { classe: 'sm:col-span-3', tipo: 'email' })}
            ${campo('site', 'Site', e.site, { classe: 'sm:col-span-3' })}
            ${campo('endereco', 'Endereço', e.endereco, { classe: 'sm:col-span-6' })}
            ${campo('cidade', 'Cidade', e.cidade, { obrigatorio: true, classe: 'sm:col-span-4' })}
            ${campo('uf', 'UF', e.uf, { classe: 'sm:col-span-2', extra: 'maxlength="2" style="text-transform:uppercase"' })}
            ${campo('diretor', 'Responsável pela escola', e.diretor, { classe: 'sm:col-span-3' })}
            ${campo('cargoDiretor', 'Cargo', e.cargoDiretor, { classe: 'sm:col-span-3' })}
          </div>`,
        salvar: (d) => Aulor.atualizarEscola(d),
      };
    },
    academico: () => {
      const a = Aulor.config().academico;
      return {
        titulo: 'Frequência e aprovação', subtitulo: 'Mudanças valem para os próximos cálculos; turmas já concluídas mantêm o resultado.', largura: 'lg', foco: '#f-frequenciaMinima',
        corpo: `
          ${campo('frequenciaMinima', 'Frequência mínima para aprovação (%)', a.frequenciaMinima, { tipo: 'number', obrigatorio: true, extra: 'min="0" max="100" step="1"', dica: 'Abaixo disso o aluno é reprovado por frequência ao concluir a turma e não recebe certificado.' })}
          ${caixa('justificadaContaPresenca', 'Falta justificada conta como presença', a.justificadaContaPresenca, 'Ex.: atestado médico. Desmarcado, a justificada só fica registrada mas conta como falta.')}`,
        salvar: (d) => Aulor.atualizarConfig('academico', d),
      };
    },
    financeiro: () => {
      const f = Aulor.config().financeiro;
      return {
        titulo: 'Preferências financeiras', subtitulo: 'Sugestões usadas na matrícula e no registro de recebimentos.', largura: 'xl', foco: '#f-diaVencimentoPadrao',
        corpo: `
          <div class="grid sm:grid-cols-3 gap-4">
            ${campo('diaVencimentoPadrao', 'Dia de vencimento padrão', f.diaVencimentoPadrao, { tipo: 'number', extra: 'min="1" max="28"' })}
            ${campo('parcelasMaximas', 'Máximo de parcelas', f.parcelasMaximas, { tipo: 'number', extra: 'min="1" max="24"' })}
            ${campo('descontoMaximoPercentual', 'Desconto máximo (%)', f.descontoMaximoPercentual, { tipo: 'number', extra: 'min="0" max="100" step="0.5"' })}
            ${campo('multaPercentual', 'Multa por atraso (%)', f.multaPercentual, { tipo: 'number', extra: 'min="0" max="2" step="0.1"', dica: 'Limite legal de 2%.' })}
            ${campo('jurosMensalPercentual', 'Juros ao mês (%)', f.jurosMensalPercentual, { tipo: 'number', extra: 'min="0" max="1" step="0.1"', dica: 'Pró-rata por dia de atraso.' })}
          </div>
          ${caixa('bloquearCertificadoInadimplente', 'Não liberar certificado para aluno com parcela vencida', f.bloquearCertificadoInadimplente, 'Parcelas futuras não bloqueiam; só as vencidas e não pagas.')}`,
        salvar: (d) => Aulor.atualizarConfig('financeiro', d),
      };
    },
  };

  function editar(secao) {
    const f = FORMS[secao]();
    modalFormulario({
      id: `form-${secao}`, titulo: f.titulo, subtitulo: f.subtitulo, corpo: f.corpo, rotulo: 'Salvar', largura: f.largura, foco: f.foco,
      aoSalvar: (fd) => {
        const r = f.salvar(Object.fromEntries(fd.entries()));
        if (r.erros) return r.erros;
        toast('Configurações salvas');
        render();
        return [];
      },
    });
  }

  function abaEscola() {
    const e = Aulor.escola();
    return cartao({
      titulo: 'Dados da escola',
      contexto: 'Aparecem no certificado, nos lembretes de cobrança e na página de validação.',
      acao: botaoEditar('escola'),
      corpo: gradeCampos([
        campoValor('Nome da escola', esc(e.nome)),
        campoValor('Sigla', e.sigla ? `${esc(e.sigla)} <span class="text-xs ${APOIO}">· prefixo do código dos certificados</span>` : ''),
        campoValor('CNPJ', e.cnpj ? `<span class="font-mono">${esc(Documento.fmtCnpj(e.cnpj))}</span>` : ''),
        campoValor('Telefone', e.telefone ? `<span class="tabular-nums">${esc(telefoneFmt(e.telefone))}</span>` : ''),
        campoValor('E-mail', esc(e.email)),
        campoValor('Site', esc(e.site)),
        campoValor('Endereço', esc(e.endereco), 'sm:col-span-2'),
        campoValor('Cidade', e.cidade ? `${esc(e.cidade)}${e.uf ? ` – ${esc(e.uf)}` : ''}` : ''),
        campoValor('Responsável pela escola', e.diretor ? `${esc(e.diretor)}${e.cargoDiretor ? ` <span class="${APOIO}">· ${esc(e.cargoDiretor)}</span>` : ''}` : ''),
      ]),
    });
  }

  function abaAcademico() {
    const a = Aulor.config().academico;
    return `
      <div class="grid xl:grid-cols-2 gap-4">
        ${cartao({
          titulo: 'Frequência e aprovação',
          contexto: 'Valem para todas as turmas: frequência, conclusão e certificado.',
          acao: botaoEditar('academico'),
          corpo: gradeCampos([
            campoValor('Frequência mínima para aprovação', pc(a.frequenciaMinima)),
            campoValor('Falta justificada', a.justificadaContaPresenca ? 'Conta como presença' : 'Conta como falta; só fica registrada'),
          ]),
        })}
        ${cartao({
          titulo: 'Como a regra é aplicada',
          contexto: 'Mudanças valem para os próximos cálculos; turmas já concluídas mantêm o resultado.',
          corpo: `<div class="p-4 space-y-2 text-sm text-slate-700 dark:text-neutral-300">
            <p>Frequência = presenças ÷ aulas com chamada registrada desde a matrícula. Aula sem chamada não conta e aparece como pendência.</p>
            <p>Ao concluir a turma, cada aluno vira "aprovado" ou "reprovado por frequência"; só os aprovados ficam prontos para o certificado.</p>
          </div>`,
        })}
      </div>`;
  }

  function abaFinanceiro() {
    const f = Aulor.config().financeiro;
    return `
      <div class="grid xl:grid-cols-2 gap-4">
        ${cartao({
          titulo: 'Preferências financeiras',
          contexto: 'Sugestões usadas na matrícula e no registro de recebimentos.',
          acao: botaoEditar('financeiro'),
          corpo: gradeCampos([
            campoValor('Dia de vencimento padrão', `Dia ${f.diaVencimentoPadrao}`),
            campoValor('Máximo de parcelas', `${f.parcelasMaximas}×`),
            campoValor('Desconto máximo', pc(f.descontoMaximoPercentual)),
            campoValor('Multa por atraso', pc(f.multaPercentual)),
            campoValor('Juros ao mês', `${pc(f.jurosMensalPercentual)} <span class="text-xs ${APOIO}">· pró-rata por dia de atraso</span>`),
            campoValor('Certificado com parcela vencida', f.bloquearCertificadoInadimplente ? 'Não é liberado' : 'É liberado normalmente'),
          ]),
        })}
        ${cartao({
          titulo: 'Cobrança automática',
          contexto: 'Boleto e Pix emitidos e baixados por um provedor de pagamentos (ex.: Asaas ou Stripe).',
          acao: pilula('neutro', 'Não conectada'),
          corpo: `<p class="p-4 text-sm text-slate-700 dark:text-neutral-300">Fora desta versão. Hoje a escola envia a cobrança pelo meio que já usa e registra o recebimento no Aulor. Cada parcela já tem o espaço reservado para o identificador da cobrança no provedor.</p>`,
        })}
      </div>`;
  }

  function abaPlano() {
    const ass = Aulor.assinatura();
    const p = Planos.efetivo(ass);
    const ativos = Aulor.alunosAtivos().length;
    const est = Planos.estimar(ass, ativos);
    const noPlano = Planos.MODULOS.filter((m) => p.modulos.includes(m.id));
    const fora = Planos.MODULOS.filter((m) => !p.modulos.includes(m.id));
    const preco = (pl) => (pl.preco == null ? `<span class="${APOIO}">A definir</span>` : `${moeda(pl.preco)}<span class="text-xs font-normal ${APOIO}">/mês</span>`);
    // Pílula de Exceção: módulo ativo é o comum e não se anuncia; só "Em breve" e o plano que traz o que falta.
    const item = (m, extra = '') => `<li class="flex items-center justify-between gap-3 py-2 text-sm text-slate-700 dark:text-neutral-200"><span>${esc(m.nome)}</span>${extra}</li>`;
    const grupo = (titulo, itens) => `<div><h4 class="text-xs font-medium ${APOIO} mb-1">${titulo}</h4><ul class="divide-y divide-slate-100 dark:divide-neutral-900">${itens}</ul></div>`;
    return `
      <div class="grid lg:grid-cols-3 gap-4 items-start">
        ${cartao({
          titulo: 'Plano contratado',
          contexto: esc(p.publico),
          classe: 'lg:col-span-2',
          corpo: `
            ${gradeCampos([
              campoValor('Plano', `<span class="font-semibold">${esc(p.nome)}</span>`),
              campoValor('Mensalidade estimada', est ? `<span class="tabular-nums">${moeda(est.mensal)}</span>` : preco(p)),
              campoValor('Alunos ativos', `<span class="tabular-nums">${numero(ativos)}</span>${p.alunosIncluidos ? ` <span class="${APOIO}">· ${numero(p.alunosIncluidos)} incluídos</span>` : ''}`),
            ])}
            <div class="px-4 pb-4 grid sm:grid-cols-2 gap-x-8 gap-y-4">
              ${grupo('Incluído', noPlano.map((m) => item(m, m.fase === 'futuro' ? pilula('info', 'Em breve') : '')).join(''))}
              ${grupo('Em outros planos', fora.map((m) => item(m, pilula('neutro', Planos.PLANOS.find((x) => x.modulos.includes(m.id))?.nome ?? '—'))).join(''))}
            </div>`,
        })}
        ${cartao({
          titulo: 'Planos',
          contexto: 'Hipótese comercial em validação, não é tabela de preços.',
          classe: 'overflow-hidden',
          corpo: `
            <ul class="mt-3 divide-y divide-slate-100 dark:divide-neutral-900 border-t border-slate-100 dark:border-neutral-900">${Planos.PLANOS.map((pl) => `
              <li class="px-4 py-3 ${pl.id === ass.planoId ? 'bg-petrol-800/5 dark:bg-sky-400/5' : ''}">
                <div class="flex justify-between gap-2 text-sm"><span class="font-medium ${TITULO}">${esc(pl.nome)}${pl.id === ass.planoId ? ` <span class="text-xs font-normal ${APOIO}">· atual</span>` : ''}</span><span class="font-semibold tabular-nums ${TITULO}">${preco(pl)}</span></div>
                <p class="text-xs ${APOIO} mt-0.5">${pl.alunosIncluidos ? `${pl.alunosIncluidos} alunos ativos incluídos. ${pl.faixas.map((f) => `${f.de}–${f.ate}: ${moeda(f.porAluno)}/aluno`).join('; ')}; acima, ${pl.acimaDaUltimaFaixa}. Anual com ${pl.descontoAnualPercentual}% de desconto.` : 'Preço e limite de alunos ainda não definidos.'}</p>
              </li>`).join('')}
            </ul>
            <div class="px-4 py-4 border-t border-slate-100 dark:border-neutral-900">
              <label for="sim-alunos" class="rotulo">Simular o Institucional</label>
              <div class="flex items-center gap-2"><input id="sim-alunos" type="number" min="0" value="${Math.max(ativos, 350)}" class="campo w-28"><span class="text-sm ${APOIO}">alunos ativos</span></div>
              <p data-sim class="text-sm mt-2 text-slate-700 dark:text-neutral-200" aria-live="polite"></p>
            </div>`,
        })}
      </div>`;
  }

  function render() {
    const corpo = { escola: abaEscola, academico: abaAcademico, financeiro: abaFinanceiro, plano: abaPlano }[aba]();
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({ titulo: 'Escola e regras', subtitulo: `O básico para a escola operar. Sem painel técnico.${podeEditar ? '' : ' Seu perfil só consulta estas configurações.'}` })}
        ${abasHtml(ABAS, aba)}
        ${corpo}
      </div>`;
    ligar();
  }

  function ligar() {
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => editar(b.dataset.editar)));
    if (aba === 'plano') {
      const input = tela.querySelector('#sim-alunos');
      const saida = tela.querySelector('[data-sim]');
      const calc = () => {
        const n = Math.max(0, Number(input.value) || 0);
        const e = Planos.estimar({ planoId: 'institucional' }, n);
        saida.innerHTML = e.foraDasFaixas ? 'Acima da última faixa: condição sob consulta.' : `${moeda(e.base)} + ${moeda(e.adicional)} = <b class="font-semibold ${TITULO}">${moeda(e.mensal)}/mês</b><span class="block text-xs ${APOIO}">No anual com desconto: ${moeda(e.anualComDesconto)} por ano.</span>`;
      };
      input.addEventListener('input', calc);
      calc();
    }
  }

  render();
})();
