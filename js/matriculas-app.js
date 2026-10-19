// ============================================================
// Vendas (grupo Comercial), no desenho das Vendas do original (contratos.html):
// abas Vendas e Por turma, cartões do que pede ação e a tabela com o próximo
// passo. No MVP uma venda é um aluno num curso: dela saem a matrícula na
// turma e as parcelas em Contas a receber. O arquivo continua matriculas.html,
// como o original manteve contratos.html.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const aba = parametroUrl('aba') === 'turmas' ? 'turmas' : 'vendas';
  const verFin = Shell.pode('receber');
  const FOCOS = ['vencidas', 'mes', 'canceladas'];
  const filtro = {
    q: parametroUrl('q') ?? '',
    status: ['ativa', 'concluida', 'cancelada'].includes(parametroUrl('status')) ? parametroUrl('status') : '',
    cobranca: '', curso: Aulor.curso(parametroUrl('curso')) ? parametroUrl('curso') : '', vendedor: '',
    foco: FOCOS.includes(parametroUrl('filtro')) && (verFin || parametroUrl('filtro') !== 'vencidas') ? parametroUrl('filtro') : '',
  };
  const turmasAbertas = new Set();
  let buscaTurma = '';

  const todas = () => Aulor.matriculas();
  const parcelas = (m) => Aulor.parcelasDaMatricula(m.id).filter((l) => l.status !== 'cancelado');
  const vencidas = (m) => parcelas(m).filter((l) => Aulor.situacaoLancamento(l) === 'vencido');
  const doMes = (m) => m.data.startsWith(hoje.slice(0, 7));
  const canceladaNoMes = (m) => m.status === 'cancelada' && (m.canceladaEm ?? '').startsWith(hoje.slice(0, 7));

  // Cobrança da venda: quitada, com parcela vencida ou em dia (o que ainda não venceu).
  function cobranca(m) {
    const ps = parcelas(m);
    if (!ps.length) return '';
    if (ps.every((l) => l.status === 'pago')) return 'quitada';
    return vencidas(m).length ? 'vencida' : 'em_dia';
  }

  // Contra quem sai o boleto: o próprio aluno ou o responsável financeiro dele.
  function contratante(m) {
    const a = Aulor.aluno(m.alunoId);
    const r = m.pagador === 'responsavel' ? Aulor.responsavelFinanceiro(a) : null;
    return r
      ? { nome: r.nome, apoio: `responsável por ${esc(a.nome)}`, aluno: a }
      : { nome: a.nome, apoio: `<span class="font-mono">${cpfFmt(a.cpf)}</span>`, aluno: a };
  }

  // ---------- Aba Vendas ----------

  function filtrar() {
    const termo = normalizarTexto(filtro.q);
    const lista = todas().filter((m) => {
      const t = Aulor.turma(m.turmaId);
      if (filtro.status && m.status !== filtro.status) return false;
      if (filtro.curso && t.cursoId !== filtro.curso) return false;
      if (filtro.vendedor && (m.criadaPor ?? '') !== filtro.vendedor) return false;
      if (filtro.cobranca && cobranca(m) !== filtro.cobranca) return false;
      if (filtro.foco === 'vencidas' && !vencidas(m).length) return false;
      if (filtro.foco === 'mes' && !(doMes(m) && m.status !== 'cancelada')) return false;
      if (filtro.foco === 'canceladas' && !canceladaNoMes(m)) return false;
      if (termo && !normalizarTexto(`${m.codigo} ${Aulor.aluno(m.alunoId).nome} ${contratante(m).nome} ${t.codigo} ${Aulor.curso(t.cursoId).nome}`).includes(termo)) return false;
      return true;
    });
    // Quem abre "Parcelas vencidas" vai cobrar: o atraso mais antigo primeiro.
    const atraso = (m) => Math.max(0, ...vencidas(m).map((l) => Aulor.diasAtraso(l)));
    return filtro.foco === 'vencidas'
      ? lista.sort((a, b) => atraso(b) - atraso(a))
      : lista.sort((a, b) => b.data.localeCompare(a.data) || b.codigo.localeCompare(a.codigo));
  }

  function cartoes() {
    const ativas = todas().filter((m) => m.status !== 'cancelada');
    const comVencida = ativas.filter((m) => vencidas(m).length);
    const valorVencido = comVencida.reduce((s, m) => s + vencidas(m).reduce((x, l) => x + l.valor, 0), 0);
    const mes = ativas.filter(doMes);
    const canceladas = todas().filter(canceladaNoMes);
    const abertas = Aulor.turmas().filter((t) => Aulor.situacaoTurma(t) === 'planejada');
    const vagas = abertas.reduce((s, t) => s + Aulor.ocupacao(t).livres, 0);
    const nomeMes = mesAno(hoje).split(' ')[0].toLowerCase();
    return `
      <div class="grid grid-cols-3 xl:grid-cols-5 gap-3 mb-4" role="group" aria-label="Filtrar vendas">
        ${verFin ? cartaoNumero({ rotulo: 'Parcelas vencidas', valor: comVencida.length ? moedaCurta(valorVencido) : 0, ajuda: comVencida.length ? `em ${plural(comVencida.length, 'venda')}` : 'nenhuma parcela em atraso', filtro: 'vencidas', ativo: filtro.foco === 'vencidas', tomValor: comVencida.length ? 'text-red-700 dark:text-red-400' : '' }) : ''}
        ${cartaoNumero({ rotulo: 'Vendas no mês', valor: mes.length, ajuda: mes.length ? `${moeda(mes.reduce((s, m) => s + m.valorFinal, 0))} em ${nomeMes}` : `nenhuma venda em ${nomeMes}`, filtro: 'mes', ativo: filtro.foco === 'mes' })}
        ${cartaoNumero({ rotulo: 'Canceladas no mês', valor: canceladas.length, ajuda: canceladas.length ? `${moeda(canceladas.reduce((s, m) => s + m.valorFinal, 0))} que deixam de entrar` : 'nenhum cancelamento', filtro: 'canceladas', ativo: filtro.foco === 'canceladas' })}
        ${cartaoNumero({ rotulo: 'Vagas disponíveis', valor: vagas, ajuda: vagas ? `nas ${plural(abertas.length, 'turma', 'turmas')} a iniciar` : 'turmas a iniciar lotadas' })}
      </div>`;
  }

  // Próximo passo: a dívida primeiro (quanto e há quanto tempo), depois o que destrava o aluno; nada quando não há o que fazer.
  function proximoPasso(m) {
    const vs = verFin ? vencidas(m) : [];
    if (vs.length) {
      const dias = Math.max(...vs.map((l) => Aulor.diasAtraso(l)));
      return `<p class="font-medium text-red-700 dark:text-red-400 tabular-nums">${plural(vs.length, 'parcela vencida', 'parcelas vencidas')} · ${moeda(vs.reduce((s, l) => s + l.valor, 0))}</p>
        <p class="text-xs ${APOIO} tabular-nums">há ${plural(dias, 'dia')}</p>`;
    }
    if (m.status !== 'ativa' && m.status !== 'concluida') return '';
    const e = Aulor.elegibilidade(m);
    if (e.id === 'elegivel') return '<p>Emitir o certificado.</p>';
    const t = Aulor.turma(m.turmaId);
    if (m.status === 'ativa' && Aulor.situacaoTurma(t) === 'a_concluir') return `<p>Aulas terminaram: concluir a turma ${esc(t.codigo)}.</p>`;
    return '';
  }

  function linha(m) {
    const t = Aulor.turma(m.turmaId);
    const c = contratante(m);
    return `<tr data-href="matricula.html?id=${m.id}" class="${FOCO_LINHA} ${m.status === 'cancelada' ? 'linha-apagada' : ''}">
      <td>
        <p class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"><a href="matricula.html?id=${m.id}" class="${LINK_REGISTRO} font-mono">${esc(m.codigo)}</a>${m.status === 'cancelada' ? pilula('neutro', 'Cancelada') : ''}</p>
        <p class="text-xs ${APOIO} truncate">${dataBr(m.data)}${m.criadaPor ? ` · ${esc(m.criadaPor)}` : ''}</p>
      </td>
      <td><div class="flex items-center gap-2.5">${avatar(c.nome)}<div class="min-w-0">
        <p class="text-sm font-medium ${TITULO} truncate">${esc(c.nome)}</p>
        <p class="text-xs ${APOIO} truncate">${c.apoio}</p>
      </div></div></td>
      <td><p class="truncate" title="${esc(Aulor.curso(t.cursoId).nome)}">${esc(Aulor.curso(t.cursoId).nome)}</p><p class="text-xs ${APOIO} truncate">${esc(t.codigo)}${m.trocas?.length ? ' · trocou de turma' : ''}</p></td>
      <td class="num">${moeda(m.valorFinal)}${m.desconto ? `<p class="text-xs ${APOIO} line-through">${moeda(m.valorCurso)}</p>` : ''}</td>
      <td>${proximoPasso(m)}</td>
    </tr>`;
  }

  function abaVendas() {
    const itens = filtrar();
    const total = todas().length;
    const filtrando = !!(filtro.q || filtro.status || filtro.cobranca || filtro.curso || filtro.vendedor || filtro.foco);
    const soma = itens.filter((m) => m.status !== 'cancelada').reduce((s, m) => s + m.valorFinal, 0);
    const vendedores = [...new Set(todas().map((m) => m.criadaPor).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return `
      ${cartoes()}
      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${campoBusca('busca', filtro.q, 'Buscar venda ou aluno')}
        <div class="ml-auto flex flex-wrap items-center gap-2">
          ${selectFiltro('f-status', [{ id: '', nome: 'Situação' }, { id: 'ativa', nome: 'Em curso' }, { id: 'concluida', nome: 'Concluídas' }, { id: 'cancelada', nome: 'Canceladas' }], filtro.status, 'Situação')}
          ${verFin ? selectFiltro('f-cobranca', [{ id: '', nome: 'Cobrança' }, { id: 'em_dia', nome: 'Em dia' }, { id: 'vencida', nome: 'Com parcela vencida' }, { id: 'quitada', nome: 'Quitada' }], filtro.cobranca, 'Cobrança') : ''}
          ${selectFiltro('f-curso', [{ id: '', nome: 'Curso' }, ...Aulor.cursos().map((c) => ({ id: c.id, nome: c.nome }))], filtro.curso, 'Curso')}
          ${vendedores.length > 1 ? selectFiltro('f-vendedor', [{ id: '', nome: 'Vendedor' }, ...vendedores.map((v) => ({ id: v, nome: v }))], filtro.vendedor, 'Vendedor') : ''}
          ${filtrando ? `<button type="button" data-limpar class="${BOTAO_LINK}">Limpar</button>` : ''}
        </div>
      </div>
      <div class="painel overflow-hidden">
        <div class="overflow-x-auto"><table class="tabela table-fixed min-w-[960px]">
          <thead><tr><th class="w-[170px]">Código</th><th class="w-[24%]">Contratante / responsável financeiro</th><th class="w-[22%]">O que foi vendido</th><th class="num w-[116px]">Valor final</th><th>Próximo passo</th></tr></thead>
          <tbody>${itens.length ? itens.map(linha).join('') : `
            <tr><td colspan="5" class="py-10 text-center text-sm ${APOIO}">${total ? `Nenhuma venda corresponde aos filtros.${filtrando ? ` <button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar filtros</button>` : ''}` : 'Nenhuma venda ainda.'}</td></tr>`}</tbody>
        </table></div>
        <div class="${RODAPE_TABELA} flex flex-wrap items-center justify-between gap-2"><span>${plural(itens.length, 'venda')}${filtrando ? ` de ${total}` : ''}</span><span>Soma (sem canceladas): <strong class="font-semibold">${moeda(soma)}</strong></span></div>
      </div>`;
  }

  // ---------- Aba Por turma: quem entrou em cada turma por venda e quanto a turma fatura ----------

  function grupos() {
    const termo = normalizarTexto(buscaTurma);
    const porTurma = new Map();
    todas().filter((m) => m.status !== 'cancelada').forEach((m) => {
      if (!porTurma.has(m.turmaId)) porTurma.set(m.turmaId, []);
      porTurma.get(m.turmaId).push(m);
    });
    return [...porTurma.entries()].map(([id, vendas]) => ({ t: Aulor.turma(id), vendas: vendas.sort((a, b) => Aulor.aluno(a.alunoId).nome.localeCompare(Aulor.aluno(b.alunoId).nome, 'pt-BR')) }))
      .filter(({ t, vendas }) => !termo || normalizarTexto(`${t.codigo} ${Aulor.curso(t.cursoId).nome} ${vendas.map((m) => `${m.codigo} ${Aulor.aluno(m.alunoId).nome}`).join(' ')}`).includes(termo))
      .sort((a, b) => b.t.inicio.localeCompare(a.t.inicio));
  }

  function naTurma(m) {
    if (m.status === 'concluida') { const r = Aulor.RESULTADO[m.resultado]; return status(r.tom, r.nome); }
    const s = Aulor.STATUS_MATRICULA[m.status];
    return status(s.tom, s.nome);
  }

  function celulaCobranca(m) {
    const vs = vencidas(m);
    if (vs.length) return `<span class="font-medium text-red-700 dark:text-red-400 tabular-nums">${plural(vs.length, 'vencida')} · ${moeda(vs.reduce((s, l) => s + l.valor, 0))}</span>`;
    return { quitada: 'Quitada', em_dia: 'Em dia', '': `<span class="${APOIO}">—</span>` }[cobranca(m)];
  }

  function abaTurmas() {
    const gs = grupos();
    const aberto = (g) => Boolean(buscaTurma) || turmasAbertas.has(g.t.id);
    const todosAbertos = gs.length > 0 && gs.every(aberto);
    const bloco = (g) => {
      const c = Aulor.curso(g.t.cursoId);
      const ativos = g.vendas.filter((m) => m.status === 'ativa').length;
      const fat = g.vendas.reduce((s, m) => s + m.valorFinal, 0);
      return `
      <section class="painel overflow-hidden">
        <button type="button" data-turma="${g.t.id}" aria-expanded="${aberto(g)}" class="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/50">
          <span class="flex items-center gap-2 min-w-0">
            <svg class="h-4 w-4 shrink-0 text-slate-400 dark:text-neutral-500 transition-transform ${aberto(g) ? 'rotate-90' : ''}" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            <span class="min-w-0">
              <span class="block font-display text-[15px] font-semibold ${TITULO}">${esc(g.t.codigo)} · ${esc(c.nome)}</span>
              <span class="block mt-0.5 text-xs ${APOIO}">${esc(Agenda.descrever(g.t.agenda))} · ${dataBr(g.t.inicio)} a ${dataBr(g.t.fim)} · ${plural(ativos, 'aluno cursando', 'alunos cursando')} · ${plural(g.vendas.length, 'venda')}</span>
            </span>
          </span>
          <span class="text-right"><span class="block text-xs font-medium ${APOIO}">Faturamento da turma</span><span class="block font-display text-lg font-semibold ${TITULO} tabular-nums">${moeda(fat)}</span></span>
        </button>
        ${aberto(g) ? `<div class="overflow-x-auto"><table class="tabela">
          <thead><tr><th>Venda</th><th>Aluno</th><th>Na turma</th>${verFin ? '<th>Cobrança</th>' : ''}<th class="num">Valor final</th></tr></thead>
          <tbody>${g.vendas.map((m) => `<tr>
            <td><a class="link font-mono text-xs" href="matricula.html?id=${m.id}">${esc(m.codigo)}</a></td>
            <td class="font-medium ${TITULO}">${Shell.pode('alunos') ? `<a class="hover:underline underline-offset-2" href="aluno.html?id=${m.alunoId}">${esc(Aulor.aluno(m.alunoId).nome)}</a>` : esc(Aulor.aluno(m.alunoId).nome)}</td>
            <td>${naTurma(m)}</td>
            ${verFin ? `<td>${celulaCobranca(m)}</td>` : ''}
            <td class="num">${moeda(m.valorFinal)}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : ''}
      </section>`;
    };
    return `
      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${campoBusca('busca-turma', buscaTurma, 'Buscar turma, curso, aluno ou venda', 'w-80')}
        <div class="ml-auto flex items-center gap-3">
          <span class="text-xs ${APOIO_FUNDO}">Vendas canceladas ficam de fora.</span>
          <button type="button" data-todos class="btn-sec" ${gs.length ? '' : 'disabled'}>${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}</button>
        </div>
      </div>
      <div class="space-y-4">${gs.length ? gs.map(bloco).join('') : `<div class="painel px-4 py-10 text-center text-sm ${APOIO}">${buscaTurma ? 'Nenhuma turma corresponde à busca.' : 'Nenhuma turma com vendas.'}</div>`}</div>`;
  }

  // ---------- Página ----------

  function render() {
    const nTurmas = new Set(todas().filter((m) => m.status !== 'cancelada').map((m) => m.turmaId)).size;
    tela.innerHTML = `
      ${cabecalhoPagina({
        titulo: 'Vendas',
        subtitulo: 'Cada venda leva um curso a um aluno. Dela saem a matrícula na turma e as parcelas em Contas a receber.',
        acoes: Shell.pode('matriculas', 'criar') ? `<a href="matricula-nova.html" class="btn-pri">${ICONE.mais}Nova venda</a>` : '',
      })}
      ${abasHtml([{ id: 'vendas', nome: 'Vendas', n: todas().length }, { id: 'turmas', nome: 'Por turma', n: nTurmas }], aba)}
      ${aba === 'turmas' ? abaTurmas() : abaVendas()}`;
    ligar();
  }

  function gravarUrl() {
    const url = new URL(location.href);
    [['status', filtro.status], ['curso', filtro.curso], ['filtro', filtro.foco]].forEach(([k, v]) => { if (v) url.searchParams.set(k, v); else url.searchParams.delete(k); });
    history.replaceState(null, '', url);
  }

  function manterBusca(id, aplicar) {
    const el = tela.querySelector(`#${id}`);
    el?.addEventListener('input', () => { aplicar(el.value); const pos = el.selectionStart; render(); const n = tela.querySelector(`#${id}`); n.focus(); n.setSelectionRange(pos, pos); });
  }

  function ligar() {
    if (aba === 'turmas') {
      manterBusca('busca-turma', (v) => { buscaTurma = v; });
      tela.querySelectorAll('[data-turma]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.turma;
        if (turmasAbertas.has(id)) turmasAbertas.delete(id); else turmasAbertas.add(id);
        render();
        tela.querySelector(`[data-turma="${id}"]`)?.focus();
      }));
      tela.querySelector('[data-todos]')?.addEventListener('click', () => {
        const gs = grupos();
        if (gs.every((g) => turmasAbertas.has(g.t.id))) turmasAbertas.clear(); else gs.forEach((g) => turmasAbertas.add(g.t.id));
        render();
        tela.querySelector('[data-todos]')?.focus();
      });
      return;
    }
    ligarLinhasLink(tela);
    manterBusca('busca', (v) => { filtro.q = v; });
    [['f-status', 'status'], ['f-cobranca', 'cobranca'], ['f-curso', 'curso'], ['f-vendedor', 'vendedor']].forEach(([el, k]) => tela.querySelector(`#${el}`)?.addEventListener('change', (e) => {
      filtro[k] = e.target.value; gravarUrl(); render(); tela.querySelector(`#${el}`).focus();
    }));
    tela.querySelectorAll('[data-cartao]').forEach((b) => b.addEventListener('click', () => {
      filtro.foco = filtro.foco === b.dataset.cartao ? '' : b.dataset.cartao; gravarUrl(); render();
      tela.querySelector(`[data-cartao="${b.dataset.cartao}"]`)?.focus();
    }));
    tela.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => {
      Object.assign(filtro, { q: '', status: '', cobranca: '', curso: '', vendedor: '', foco: '' }); gravarUrl(); render(); tela.querySelector('#busca').focus();
    }));
  }

  render();
})();
