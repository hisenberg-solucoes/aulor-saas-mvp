// ============================================================
// Financeiro: contas a receber (parcelas das matrículas) e contas a pagar.
// Período por mês de vencimento (?mes=AAAA-MM). Quem está em atraso fica
// em cobrancas.html.
// Sem gateway nesta versão: recebimentos são registrados manualmente;
// o campo `cobranca` do lançamento fica reservado para o provedor.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const abas = [
    Shell.pode('receber') && { id: 'receber', nome: 'A receber' },
    Shell.pode('pagar') && { id: 'pagar', nome: 'A pagar' },
  ].filter(Boolean);
  const aba = abas.some((a) => a.id === parametroUrl('aba')) ? parametroUrl('aba') : abas[0].id;
  const estado = { mes: /^\d{4}-\d{2}$/.test(parametroUrl('mes') ?? '') ? parametroUrl('mes') : hoje.slice(0, 7), situacao: parametroUrl('situacao') ?? 'todas', q: '' };

  const SITUACOES = (tipo) => [
    { id: 'todas', nome: 'Todas as situações' },
    { id: 'a_vencer', nome: 'A vencer' },
    { id: 'vencido', nome: 'Vencidas (todos os meses)' },
    { id: 'pago', nome: tipo === 'receber' ? 'Recebidas' : 'Pagas' },
    { id: 'cancelado', nome: 'Canceladas' },
  ];

  function filtrar(tipo) {
    const termo = normalizarTexto(estado.q);
    return Aulor.lancamentos().filter((l) => {
      if (l.tipo !== tipo) return false;
      const s = Aulor.situacaoLancamento(l);
      if (estado.situacao === 'vencido') { if (s !== 'vencido') return false; } else {
        if (!l.vencimento.startsWith(estado.mes)) return false;
        if (estado.situacao !== 'todas' && s !== estado.situacao) return false;
      }
      if (termo) {
        const alvo = `${l.descricao} ${l.fornecedor} ${l.categoria} ${l.alunoId ? Aulor.aluno(l.alunoId).nome : ''}`;
        if (!normalizarTexto(alvo).includes(termo)) return false;
      }
      return true;
    }).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }

  function seletorMes() {
    const anterior = Aulor.somarMeses(`${estado.mes}-01`, -1, 1).slice(0, 7);
    const proximo = Aulor.somarMeses(`${estado.mes}-01`, 1, 1).slice(0, 7);
    const btn = (mes, rotulo, icone) => `<button type="button" data-mes="${mes}" class="p-2 rounded-lg text-tinta-2 hover:text-tinta hover:bg-elevado" aria-label="${rotulo}">${icone}</button>`;
    return `<div class="inline-flex items-center gap-1 ${estado.situacao === 'vencido' ? 'opacity-40 pointer-events-none' : ''}">
      ${btn(anterior, 'Mês anterior', ICONE.voltar)}
      <span class="min-w-[9.5rem] text-center text-sm font-semibold text-tinta">${mesAno(`${estado.mes}-01`)}</span>
      ${btn(proximo, 'Próximo mês', ICONE.seta)}
      ${estado.mes !== hoje.slice(0, 7) ? `<button type="button" data-mes="${hoje.slice(0, 7)}" class="ml-1 text-xs font-medium link">Hoje</button>` : ''}
    </div>`;
  }

  function resumo() {
    const r = Aulor.resumoMes(estado.mes);
    // DESIGN.md, Painéis: entrada e saída sem cor; vermelho só no resultado negativo; pendência é ponto cobre.
    const bloco = (rotulo, valor, detalhe = '', cor = '', pendente = false) => `<div class="px-4 py-3 bg-elevado"><p class="flex items-center gap-1.5 text-xs font-medium text-tinta-3">${pendente ? '<span class="h-[7px] w-[7px] rounded-full bg-cobre"></span>' : ''}${rotulo}</p><p class="text-lg font-semibold tabular-nums ${cor || 'text-tinta'}">${moeda(valor)}</p>${detalhe ? `<p class="text-xs text-tinta-3">${detalhe}</p>` : ''}</div>`;
    const blocos = [];
    if (aba === 'receber' || (aba === 'pagar' && !Shell.pode('receber'))) {
      if (Shell.pode('receber')) {
        blocos.push(bloco('Previsto no mês', r.receberPrevisto, 'parcelas com vencimento no mês'));
        blocos.push(bloco('Recebido no mês', r.recebido, 'pagamentos registrados no mês'));
        blocos.push(bloco('Em aberto no mês', r.receberAberto));
        blocos.push(bloco('Vencido (total)', r.vencido, 'todos os meses', '', r.vencido > 0));
      }
    }
    if (aba === 'pagar') {
      blocos.push(bloco('A pagar no mês', r.pagarPrevisto));
      blocos.push(bloco('Pago no mês', r.pago));
      blocos.push(bloco('Em aberto', r.pagarAberto, 'do mês + vencidas'));
      if (Shell.pode('receber')) blocos.push(bloco('Resultado do mês', r.recebido - r.pago, 'recebido − pago', r.recebido - r.pago < 0 ? 'text-ruim' : ''));
    }
    return blocos.length ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-linha border border-linha rounded-xl overflow-hidden mb-4">${blocos.join('')}</div>` : '';
  }

  function abaLancamentos(tipo) {
    const lista = filtrar(tipo);
    const total = lista.filter((l) => l.status !== 'cancelado').reduce((s, l) => s + l.valor, 0);
    const linhas = lista.map((l) => `
      <tr>
        <td class="tabular-nums whitespace-nowrap">${dataBr(l.vencimento)}</td>
        <td>${tipo === 'receber'
          ? `${l.alunoId ? `<a class="font-medium text-tinta hover:underline" href="${l.matriculaId ? `matricula.html?id=${l.matriculaId}` : `aluno.html?id=${l.alunoId}`}">${esc(Aulor.aluno(l.alunoId).nome)}</a>` : ''}<p class="text-xs text-tinta-2">${esc(l.descricao)}</p>`
          : `<span class="font-medium text-tinta">${esc(l.descricao)}</span><p class="text-xs text-tinta-2">${esc(l.fornecedor || '—')} · ${esc(l.categoria)}</p>`}</td>
        <td class="num">${moeda(l.valor)}</td>
        <td>${situacaoLancHtml(l)}</td>
        <td class="text-xs text-tinta-2 whitespace-nowrap">${l.status === 'pago' ? `${dataBr(l.pagoEm)} · ${esc(nomeForma(l.forma))}${l.valorPago !== l.valor ? `<br>${moeda(l.valorPago)}` : ''}` : '—'}</td>
        <td class="text-right whitespace-nowrap">${acaoParcela(l)}</td>
      </tr>`).join('');
    return `
      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${seletorMes()}
        <div class="flex-1"></div>
        ${campoBusca('busca', estado.q, tipo === 'receber' ? 'Buscar aluno ou curso' : 'Buscar descrição ou fornecedor')}
        ${selectFiltro('f-situacao', SITUACOES(tipo), estado.situacao, 'Situação')}
      </div>
      ${resumo()}
      <div class="painel overflow-hidden" data-lista>
        ${lista.length ? `<div class="overflow-x-auto"><table class="tabela">
          <thead><tr><th>Vencimento</th><th>${tipo === 'receber' ? 'Aluno' : 'Conta'}</th><th class="num">Valor</th><th>Situação</th><th>Pagamento</th><th></th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
        <p class="px-4 py-2.5 text-xs text-tinta-2 border-t border-linha">${lista.length} lançamentos · ${moeda(total)}</p>` : vazio('Nada neste filtro', estado.situacao === 'vencido' ? 'Nenhuma conta vencida.' : `Nenhum lançamento com vencimento em ${mesAno(`${estado.mes}-01`).toLowerCase()}.`)}
      </div>`;
  }

  function render() {
    const acoes = aba === 'pagar' && Shell.pode('pagar', 'lancar') ? `<button type="button" data-nova-conta class="btn-pri">${ICONE.mais}Nova conta a pagar</button>` : '';
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Financeiro', subtitulo: `Parcelas das matrículas e despesas da escola, mês a mês.${Shell.pode('receber') ? ' Quem está em atraso fica em <a class="link" href="cobrancas.html">Cobranças</a>.' : ''}`, acoes })}
        ${abas.length > 1 ? abasHtml(abas, aba) : ''}
        ${abaLancamentos(aba)}
      </div>`;
    ligar();
  }

  function atualizarUrl() {
    const url = new URL(location.href);
    url.searchParams.set('mes', estado.mes);
    if (estado.situacao !== 'todas') url.searchParams.set('situacao', estado.situacao); else url.searchParams.delete('situacao');
    history.replaceState(null, '', url);
  }

  function ligar() {
    tela.querySelectorAll('[data-mes]').forEach((b) => b.addEventListener('click', () => { estado.mes = b.dataset.mes; atualizarUrl(); render(); }));
    tela.querySelector('#f-situacao')?.addEventListener('change', (e) => { estado.situacao = e.target.value; atualizarUrl(); render(); });
    const busca = tela.querySelector('#busca');
    busca?.addEventListener('input', () => { estado.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    const lista = tela.querySelector('[data-lista]');
    if (lista) ligarAcoesParcelas(lista, render);
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
            <label class="rotulo" for="f-categoria">Categoria <span class="text-ruim">*</span></label>
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
        render();
        return [];
      },
    });
  }

  render();
})();
