// ============================================================
// Financeiro: contas a receber (parcelas das matrículas), quem está em
// atraso (a antiga tela Cobranças) e contas a pagar, nas partes do
// controle segmentado (?aba=receber|atraso|pagar). Mês de vencimento em
// ?mes=AAAA-MM; os indicadores são do mês e Em atraso vale para todos.
// Sem gateway nesta versão: o recebimento é registrado à mão, o lembrete
// é um texto pronto (nada sai sozinho) e o campo `cobranca` do
// lançamento fica reservado para o provedor.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const verReceber = Shell.pode('receber');
  const verPagar = Shell.pode('pagar');
  const RUIM = 'text-red-700 dark:text-red-400'; // só atraso e resultado negativo (Regra do Azul e do Vermelho)
  const comSinal = (v) => (v < 0 ? `− ${moeda(-v)}` : moeda(v));
  // Indicador do DESIGN.md: −0,02em e algarismos proporcionais (o cartaoNumero usa tabulares); cabe R$ 99.999,99 em 5 colunas.

  const PARTES = [
    verReceber && { id: 'receber', nome: 'A receber' },
    verReceber && { id: 'atraso', nome: 'Em atraso' },
    verPagar && { id: 'pagar', nome: 'A pagar' },
  ].filter(Boolean);
  const SITUACOES = (tipo) => [
    { id: 'todas', nome: 'Todas as situações' },
    { id: 'aberto', nome: 'Em aberto no mês' },
    { id: 'a_vencer', nome: 'A vencer' },
    { id: 'vencido', nome: 'Vencidas (todos os meses)' },
    { id: 'pago', nome: tipo === 'receber' ? 'Recebidas' : 'Pagas' },
    { id: 'cancelado', nome: 'Canceladas' },
  ];
  const estado = {
    aba: PARTES.some((p) => p.id === parametroUrl('aba')) ? parametroUrl('aba') : PARTES[0].id,
    mes: /^\d{4}-\d{2}$/.test(parametroUrl('mes') ?? '') ? parametroUrl('mes') : hoje.slice(0, 7),
    situacao: SITUACOES().some((s) => s.id === parametroUrl('situacao')) ? parametroUrl('situacao') : 'todas',
    q: '',
  };
  const nomeMes = () => dataObj(`${estado.mes}-15`).toLocaleDateString('pt-BR', { month: 'long' });

  function filtrar(tipo) {
    const termo = normalizarTexto(estado.q);
    return Aulor.lancamentos().filter((l) => {
      if (l.tipo !== tipo) return false;
      const s = Aulor.situacaoLancamento(l);
      if (estado.situacao === 'vencido') { if (s !== 'vencido') return false; } else {
        if (!l.vencimento.startsWith(estado.mes)) return false;
        if (estado.situacao === 'aberto') { if (s !== 'a_vencer' && s !== 'vencido') return false; }
        else if (estado.situacao !== 'todas' && s !== estado.situacao) return false;
      }
      if (termo) {
        const alvo = `${l.descricao} ${l.fornecedor} ${l.categoria} ${l.alunoId ? Aulor.aluno(l.alunoId).nome : ''}`;
        if (!normalizarTexto(alvo).includes(termo)) return false;
      }
      return true;
    }).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }

  // Do maior atraso para o menor; empate, quem deve mais.
  const emAtraso = () => [...Aulor.inadimplentes()].sort((a, b) => b.maiorAtraso - a.maiorAtraso || b.total - a.total);

  function seletorMes() {
    const anterior = Aulor.somarMeses(`${estado.mes}-01`, -1, 1).slice(0, 7);
    const proximo = Aulor.somarMeses(`${estado.mes}-01`, 1, 1).slice(0, 7);
    return `<div class="inline-flex items-center gap-1" role="group" aria-label="Mês de vencimento">
      <button type="button" data-mes="${anterior}" class="btn-fantasma px-1.5" aria-label="Mês anterior">${ICONE.voltar}</button>
      <span class="min-w-[9.5rem] text-center text-sm font-semibold ${TITULO}" aria-live="polite">${mesAno(`${estado.mes}-01`)}</span>
      <button type="button" data-mes="${proximo}" class="btn-fantasma px-1.5" aria-label="Próximo mês">${ICONE.seta}</button>
      ${estado.mes !== hoje.slice(0, 7) ? `<button type="button" data-mes="${hoje.slice(0, 7)}" class="btn-fantasma">Mês atual</button>` : ''}
    </div>`;
  }

  // Indicadores do mês. "A receber" e "Em atraso" filtram a lista (aria-pressed); os outros só resumem.
  function indicadores(inad) {
    const r = Aulor.resumoMes(estado.mes);
    const mes = nomeMes();
    const cartoes = [];
    if (verReceber) {
      const abertas = contarAbertas();
      const p = r.receberPrevisto ? Math.round((r.recebido / r.receberPrevisto) * 100) : 0;
      const totalAtraso = inad.reduce((s, i) => s + i.total, 0);
      cartoes.push(cartaoNumero({ rotulo: `Recebido em ${mes}`, valor: moeda(r.recebido), ajuda: `<span class="flex mt-0.5 mb-1.5">${medidor(p, { largura: 'w-full' })}</span>de ${moeda(r.receberPrevisto)} previstos no mês` }));
      cartoes.push(cartaoNumero({ rotulo: `A receber em ${mes}`, valor: moeda(r.receberAberto), ajuda: abertas ? `${plural(abertas, 'parcela', 'parcelas')} em aberto no mês` : 'nada em aberto no mês', filtro: 'aberto', ativo: estado.aba === 'receber' && estado.situacao === 'aberto' }));
      cartoes.push(cartaoNumero({ rotulo: 'Em atraso', valor: moeda(totalAtraso), tomValor: totalAtraso ? RUIM : '', ajuda: inad.length ? `${plural(inad.length, 'aluno', 'alunos')}, de todos os meses` : 'ninguém em atraso', filtro: 'atraso', ativo: estado.aba === 'atraso' }));
    }
    if (verPagar) {
      cartoes.push(cartaoNumero({ rotulo: `Pago em ${mes}`, valor: moeda(r.pago), ajuda: `de ${moeda(r.pagarPrevisto)} previstos · ${moeda(r.pagarAberto)} em aberto` }));
      if (verReceber) {
        const resultado = r.recebido - r.pago;
        cartoes.push(cartaoNumero({ rotulo: `Resultado de ${mes}`, valor: comSinal(resultado), tomValor: resultado < 0 ? RUIM : '', ajuda: 'recebido − pago no mês' }));
      }
    }
    return `<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-${cartoes.length} gap-3 mb-4">${cartoes.join('')}</div>`;
  }
  const contarAbertas = () => Aulor.lancamentos().filter((l) => l.tipo === 'receber' && l.vencimento.startsWith(estado.mes) && ['a_vencer', 'vencido'].includes(Aulor.situacaoLancamento(l))).length;

  // Quem e o quê na mesma célula; a forma e a data do pagamento ficam embaixo da situação.
  function linhaLancamento(l) {
    const receber = l.tipo === 'receber';
    const s = Aulor.situacaoLancamento(l);
    const href = receber && l.matriculaId ? `matricula.html?id=${l.matriculaId}` : receber && l.alunoId ? `aluno.html?id=${l.alunoId}` : '';
    const quem = receber && l.alunoId
      ? `<a href="${href}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(Aulor.aluno(l.alunoId).nome)}</a>`
      : `<span class="font-medium ${TITULO}">${esc(l.descricao)}</span>`;
    const apoio = receber ? esc(l.descricao) : `${esc(l.fornecedor || '—')} · ${esc(l.categoria)}`;
    const pagoDiferente = s === 'pago' && l.valorPago != null && Math.abs(l.valorPago - l.valor) > 0.005;
    const detalhe = s === 'pago' ? `${dataBr(l.pagoEm)} · ${esc(nomeForma(l.forma))}` : '';
    return `
      <tr ${href ? `data-href="${href}"` : ''} class="${href ? FOCO_LINHA : ''} ${s === 'cancelado' ? 'linha-apagada' : ''}">
        <td class="tabular-nums whitespace-nowrap align-top">${dataBr(l.vencimento)}</td>
        <td class="align-top">${quem}<p class="text-xs ${APOIO}">${apoio}</p></td>
        <td class="num align-top"><span class="font-medium text-slate-800 dark:text-neutral-100">${moeda(l.valor)}</span>${pagoDiferente ? `<p class="text-xs ${AVISO}" title="Valor efetivamente pago">pago ${moeda(l.valorPago)}</p>` : ''}</td>
        <td class="align-top">${situacaoLancHtml(l)}${detalhe ? `<p class="text-xs ${APOIO} pl-3.5">${detalhe}</p>` : ''}</td>
        <td class="text-right whitespace-nowrap align-top">${acaoParcela(l)}</td>
      </tr>`;
  }

  function parteLancamentos(tipo) {
    const lista = filtrar(tipo);
    const validas = lista.filter((l) => l.status !== 'cancelado');
    const total = validas.reduce((s, l) => s + l.valor, 0);
    const vencido = validas.filter((l) => Aulor.situacaoLancamento(l) === 'vencido').reduce((s, l) => s + l.valor, 0);
    const forte = (v, cor = TITULO) => `<span class="font-semibold tabular-nums ${cor}">${v}</span>`;
    const vazioTxt = estado.situacao === 'vencido' ? 'Nenhuma conta vencida.' : `Nenhum lançamento com vencimento em ${mesAno(`${estado.mes}-01`).toLowerCase()}${estado.situacao !== 'todas' || estado.q ? ' neste filtro' : ''}.`;
    return `
      <div class="mb-3 flex flex-wrap items-center gap-2">
        ${campoBusca('busca', estado.q, tipo === 'receber' ? 'Buscar aluno ou curso' : 'Buscar descrição ou fornecedor')}
        ${selectFiltro('f-situacao', SITUACOES(tipo), estado.situacao, 'Situação')}
      </div>
      <p class="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm ${APOIO_FUNDO}">
        <span>${forte(numero(lista.length))} ${lista.length === 1 ? 'lançamento' : 'lançamentos'}</span>
        <span>Total ${forte(moeda(total))}</span>
        ${vencido ? `<span>Vencido ${forte(moeda(vencido), RUIM)}</span>` : ''}
      </p>
      <div class="painel overflow-hidden" data-lista>
        ${lista.length ? `<div class="overflow-x-auto"><table class="tabela">
          <thead><tr><th>Vencimento</th><th>${tipo === 'receber' ? 'Aluno' : 'Conta'}</th><th class="num">Valor</th><th>Situação</th><th><span class="sr-only">Ações</span></th></tr></thead>
          <tbody>${lista.map(linhaLancamento).join('')}</tbody>
        </table></div>` : vazio('Nada neste filtro', vazioTxt)}
      </div>`;
  }

  // Em atraso (antiga Cobranças): um aluno por linha, com o lembrete pronto. WhatsApp à vista; o resto no ⋯.
  function linhaAtraso(i, k) {
    const pagador = Aulor.contatoCobranca(i.aluno);
    const lembrete = lembreteCobranca(i);
    const fone = String(lembrete.telefone ?? '').replace(/\D/g, '');
    const desde = i.parcelas.reduce((m, l) => (l.vencimento < m ? l.vencimento : m), i.parcelas[0].vencimento);
    const href = `aluno.html?id=${i.aluno.id}&aba=financeiro`;
    return `
      <tr data-href="${href}" class="${FOCO_LINHA}">
        <td class="align-top"><a href="${href}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(i.aluno.nome)}</a>
          <p class="text-xs ${APOIO}">${pagador !== i.aluno ? `Quem paga: ${esc(pagador.nome)} · ` : ''}<span class="tabular-nums">${telefoneFmt(lembrete.telefone)}</span></p></td>
        <td class="num align-top">${i.parcelas.length}<p class="text-xs ${APOIO}">desde ${dataBr(desde)}</p></td>
        <td class="num align-top">${plural(i.maiorAtraso, 'dia', 'dias')}</td>
        <td class="num align-top font-medium ${RUIM}">${moeda(i.total)}</td>
        <td class="text-right whitespace-nowrap align-top">
          <a class="btn-sec btn-pequeno" target="_blank" rel="noopener" href="https://wa.me/${fone ? `55${fone}` : ''}?text=${encodeURIComponent(lembrete.texto)}" aria-label="Enviar o lembrete por WhatsApp para ${esc(pagador.nome)}">${ICONE.whatsapp}WhatsApp</a>
          <button type="button" data-mais-atraso="${k}" class="btn-fantasma px-1.5" aria-label="Mais ações: ${esc(i.aluno.nome)}" aria-haspopup="menu" aria-expanded="false">${ICONE.reticencias}</button>
        </td>
      </tr>`;
  }

  function parteAtraso(lista) {
    const total = lista.reduce((s, i) => s + i.total, 0);
    const vencidoAteHoje = Aulor.lancamentos().filter((l) => l.tipo === 'receber' && l.status !== 'cancelado' && l.vencimento < hoje).reduce((s, l) => s + l.valor, 0);
    const taxa = vencidoAteHoje ? ((total / vencidoAteHoje) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0';
    const forte = (v, cor = TITULO) => `<span class="font-semibold tabular-nums ${cor}">${v}</span>`;
    return `
      <p class="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm ${APOIO_FUNDO}">
        <span>${forte(numero(lista.length))} ${lista.length === 1 ? 'aluno com parcela vencida' : 'alunos com parcela vencida'}</span>
        <span>Total ${forte(moeda(total), total ? RUIM : TITULO)}</span>
        <span title="Vencido em aberto ÷ tudo o que já venceu">Inadimplência ${forte(`${taxa}%`)}</span>
      </p>
      <div class="painel overflow-hidden">
        ${lista.length ? `<div class="overflow-x-auto"><table class="tabela">
          <thead><tr><th>Aluno</th><th class="num">Parcelas vencidas</th><th class="num">Maior atraso</th><th class="num">Total vencido</th><th><span class="sr-only">Ações</span></th></tr></thead>
          <tbody>${lista.map(linhaAtraso).join('')}</tbody>
        </table></div>` : vazio('Ninguém em atraso', 'Todas as parcelas vencidas foram recebidas.')}
      </div>
      <p class="text-xs ${APOIO_FUNDO} mt-3">O lembrete é um texto pronto para o WhatsApp ou o e-mail da escola; nada é enviado sozinho. Para registrar o pagamento, use o ⋯ da linha ou veja <a class="link" href="financeiro.html?aba=receber&situacao=vencido">as parcelas vencidas</a>. Envio automático e régua de cobrança ficam para a integração com o provedor de pagamento.</p>`;
  }

  function render() {
    const inad = verReceber ? emAtraso() : [];
    const partes = PARTES.map((p) => (p.id === 'atraso' && inad.length ? { ...p, n: inad.length } : p));
    const novaContaBtn = estado.aba === 'pagar' && Shell.pode('pagar', 'lancar') ? `<button type="button" data-nova-conta class="btn-pri">${ICONE.mais}Nova conta a pagar</button>` : '';
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({ titulo: 'Financeiro', subtitulo: 'Parcelas das matrículas e despesas da escola, mês a mês. Nada é cobrado sozinho nesta versão: o recebimento é registrado aqui.', acoes: seletorMes() })}
        ${indicadores(inad)}
        ${partes.length > 1 || novaContaBtn ? `<div class="mb-3 flex flex-wrap items-center gap-2">
          ${partes.length > 1 ? segmentado('parte', partes, estado.aba, 'Contas') : ''}
          ${novaContaBtn ? `<div class="ml-auto">${novaContaBtn}</div>` : ''}
        </div>` : ''}
        ${estado.aba === 'atraso' ? parteAtraso(inad) : parteLancamentos(estado.aba)}
      </div>`;
    ligar(inad);
  }

  function atualizarUrl() {
    const url = new URL(location.href);
    url.searchParams.set('aba', estado.aba);
    url.searchParams.set('mes', estado.mes);
    if (estado.situacao !== 'todas') url.searchParams.set('situacao', estado.situacao); else url.searchParams.delete('situacao');
    history.replaceState(null, '', url);
  }

  // O render troca o DOM inteiro: devolve o foco ao controle equivalente.
  function mudar(fn, seletorFoco) {
    fn();
    atualizarUrl();
    render();
    if (seletorFoco) tela.querySelector(seletorFoco)?.focus();
  }

  function ligar(inad) {
    tela.querySelectorAll('[data-mes]').forEach((b) => b.addEventListener('click', () => mudar(() => { estado.mes = b.dataset.mes; }, `[data-mes="${b.dataset.mes}"]`)));
    tela.querySelectorAll('[data-parte]').forEach((b) => b.addEventListener('click', () => mudar(() => { estado.aba = b.dataset.parte; estado.q = ''; }, `[data-parte="${b.dataset.parte}"]`)));
    tela.querySelectorAll('[data-cartao]').forEach((b) => b.addEventListener('click', () => mudar(() => {
      const ativo = b.getAttribute('aria-pressed') === 'true';
      if (b.dataset.cartao === 'atraso') { estado.aba = ativo ? 'receber' : 'atraso'; estado.situacao = 'todas'; }
      else { estado.aba = 'receber'; estado.situacao = ativo ? 'todas' : 'aberto'; }
      estado.q = '';
    }, `[data-cartao="${b.dataset.cartao}"]`)));
    tela.querySelector('#f-situacao')?.addEventListener('change', (e) => mudar(() => { estado.situacao = e.target.value; }, '#f-situacao'));
    const busca = tela.querySelector('#busca');
    busca?.addEventListener('input', () => { estado.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    const lista = tela.querySelector('[data-lista]');
    if (lista) ligarAcoesParcelas(lista, render);
    const podeReceber = Shell.pode('receber', 'registrar');
    tela.querySelectorAll('[data-mais-atraso]').forEach((b) => b.addEventListener('click', () => {
      const i = inad[Number(b.dataset.maisAtraso)];
      abrirMenu(b, [
        { nome: 'Copiar lembrete', detalhe: 'Texto pronto para o e-mail ou outro canal', acao: () => copiarTexto(lembreteCobranca(i).texto, 'Lembrete copiado') },
        podeReceber && 'sep',
        ...(podeReceber ? i.parcelas.map((l) => ({
          nome: `Receber ${l.parcela ? `parcela ${l.parcela.n} de ${l.parcela.de}` : l.descricao}`,
          detalhe: `Venceu em ${dataBr(l.vencimento)} · ${moeda(l.valor)}`,
          acao: () => abrirBaixa(l.id, render),
        })) : []),
      ]);
    }));
    ligarLinhasLink(tela);
    tela.querySelector('[data-nova-conta]')?.addEventListener('click', novaConta);
  }

  function novaConta() {
    const categorias = Aulor.CATEGORIAS.pagar.map((c) => ({ id: c, nome: c }));
    modalFormulario({
      id: 'form-conta',
      titulo: 'Nova conta a pagar',
      subtitulo: 'Despesa da escola: aluguel, professores, contas, fornecedores.',
      rotulo: 'Lançar',
      largura: 'lg',
      foco: '#f-descricao',
      corpo: `
        <div class="grid sm:grid-cols-2 gap-4">
          ${campo('descricao', 'Descrição', '', { obrigatorio: true, classe: 'sm:col-span-2', extra: 'placeholder="Ex.: Conta de água de outubro"' })}
          ${campo('fornecedor', 'Fornecedor', '')}
          <div>
            <label class="rotulo" for="f-categoria">Categoria <span class="text-red-600 dark:text-red-400">*</span></label>
            ${campoCombo('categoria', categorias, '', { vazio: 'Escolha' })}
            ${ERRO('categoria')}
          </div>
          ${campo('valor', 'Valor (R$)', '', { tipo: 'number', obrigatorio: true, extra: 'step="0.01" min="0.01"' })}
          ${campo('vencimento', 'Vencimento', hoje, { tipo: 'date', obrigatorio: true })}
        </div>
        <input type="hidden" name="tipo" value="pagar">
        <label class="flex items-center gap-3 text-sm cursor-pointer"><input type="checkbox" name="jaPago" value="1" class="check">Já está paga</label>`,
      aoSalvar: (fd) => {
        const r = Aulor.lancarConta(Object.fromEntries(fd.entries()), Shell.nome());
        if (r.erros) return r.erros;
        toast('Conta lançada');
        estado.mes = r.lancamento.vencimento.slice(0, 7);
        atualizarUrl();
        render();
        return [];
      },
    });
  }

  render();
})();
