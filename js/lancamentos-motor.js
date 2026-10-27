// ============================================================
// Motor do Financeiro — contas a receber / a pagar, plano de contas,
// Asaas simulado, extrato/conciliação e consolidações para o dashboard.
//
// Regras:
// - Contratos continuam a fonte de verdade das receitas de contrato: cada
//   parcela vira UM lançamento (id 'lc-<contratoId>-<n>') sincronizado em
//   todo carregar(). Baixa/estorno passam por Contratos.registrarPagamento /
//   estornarPagamento e voltam a sincronizar.
// - Pagamentos dos contratos de instrutor viram despesas ('li-<instrutorId>-<pagamentoId>');
//   só dá baixa com NF (Instrutores.registrarPagamento exige).
// - Folha: um lançamento por colaborador ativo por mês ('lf-<colaboradorId>-<YYYY-MM>'),
//   13º em dezembro ('lf-<colaboradorId>-<YYYY>-13').
// - Compras: cada compra RECEBIDA no módulo Compras (js/compras-motor.js) vira uma
//   despesa ('lc-compra-<compraId>', origem { tipo: 'compra' }) — pessoa = fornecedor,
//   categoria/centro da compra, vencimento e forma do pedido, NF do recebimento.
// - Manuais: semente determinística (js/lancamentos-data.js) criada uma vez,
//   quando a chave ainda não existe.
// - 'vencido' é derivado (previsto/emitido com vencimento < hoje).
// - Segmento B2C/B2B da receita = natureza de quem contratou (CNPJ → B2B, CPF → B2C),
//   derivado em toda sincronização. Centros de custo (tipo 'custo') são os departamentos; os de receita (tipo 'receita',
//   B2B/B2C/Orion…) vêm da venda (contrato.centroReceitaId) e o lançamento da parcela os leva em centroCustoId.
//
// Depende de: Contratos, Clientes, Cursos, Formacoes; opcionais (typeof):
// Instrutores, Turmas, Colaboradores/COLABORADORES_SEED, Areas, Compras.
// Não confundir com `Financeiro` (js/financeiro-motor.js): faturamento por turma.
// ============================================================

const Lancamentos = (() => {
  // v4 (19/10/2026): centros de custo viraram departamentos e o centro de receita saiu (ids cc-* mudaram de sentido);
  // v3 (08/09/2026): módulo Compras — a semente manual passou a abater coffee/material/limpeza já lançados pelas compras
  // (dupla contagem); v2 (07/09/2026): só manuais + derivados alterados ficam no storage.
  const CHAVE = 'aulor-v1-financeiro-lancamentos-v4';
  const CHAVE_PLANO = 'aulor-v1-financeiro-plano-v2'; // a mesma de js/centros-receita.js; centros de custo e de receita na mesma lista
  // v3 (19/10/2026): a semente passou a trazer os pagamentos da conta de pagamento (BB); o v2 salvo é migrado em carregarExtrato.
  const CHAVE_EXTRATO = 'aulor-v1-financeiro-extrato-v3';
  const CHAVE_EXTRATO_V2 = 'aulor-v1-financeiro-extrato-v2';
  const CHAVE_SAQUES = 'aulor-v1-financeiro-saques-v1';

  // ---------- Helpers ----------

  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const arred = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const soma = (xs, f) => arred(xs.reduce((s, x) => s + (Number(f(x)) || 0), 0));
  // Data de referência do protótipo (semente congelada em 26/08/2026).
  const hoje = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); // data local do navegador
  const agora = () => `${hoje()}T${new Date().toISOString().slice(11, 19)}`;
  const fmtMoeda = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }));
  const fmtMoedaCentavos = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  const fmtData = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '');
  const fmtPct = (p) => (p == null ? '—' : `${Number(p).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
  const pct = (parte, todo) => (todo ? arred((parte / todo) * 100) : null);
  const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const digitos = (v) => String(v ?? '').replace(/\D/g, '');
  const porId = (lista, id) => (lista ?? []).find((x) => x.id === id) ?? null;
  const mesDe = (iso) => String(iso ?? '').slice(0, 7);
  const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const rotuloMes = (ym) => { const [a, m] = ym.split('-'); return `${MESES_CURTOS[Number(m) - 1]}/${a.slice(2)}`; };
  const mesesEntre = lancMesesEntre;
  const somarDias = lancSomarDias;
  const primeiroDia = (ym) => `${ym}-01`;
  const ultimoDia = (ym) => lancDia(ym, 31);
  const diasEntre = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
  // Aceita 'YYYY-MM' ou 'YYYY-MM-DD' e devolve o par de datas ISO fechado.
  const periodoDe = ({ de = null, ate = null } = {}) => ({
    de: de ? (de.length === 7 ? primeiroDia(de) : de) : '0000-01-01',
    ate: ate ? (ate.length === 7 ? ultimoDia(ate) : ate) : '9999-12-31',
  });
  // Últimos 12 meses fechados até hoje (padrão do dashboard).
  function periodoPadrao(ref = hoje()) {
    const fim = mesDe(ref);
    const [a, m] = fim.split('-').map(Number);
    const ini = m === 12 ? `${a}-01` : `${a - 1}-${String(m + 1).padStart(2, '0')}`;
    return { de: primeiroDia(ini), ate: ultimoDia(fim) };
  }
  const agrupar = (xs, chave) => { const m = new Map(); xs.forEach((x) => { const k = chave(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return m; };

  // ---------- Constantes expostas ----------

  const STATUS = LANC_STATUS;
  const SITUACOES = LANC_SITUACOES;
  const TIPOS = LANC_TIPOS;
  const FORMAS = LANC_FORMAS;
  const TIPOS_PESSOA = LANC_TIPOS_PESSOA;
  const GRUPOS_CATEGORIA = LANC_GRUPOS_CATEGORIA;
  const SEGMENTOS = LANC_SEGMENTOS;
  const ORIGENS = LANC_ORIGENS;
  const TIPOS_CONTA = LANC_TIPOS_CONTA;
  const STATUS_ASAAS = LANC_STATUS_ASAAS;
  const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? id ?? '';

  // ---------- Plano (categorias, centros, contas, fornecedores) ----------

  // Carrega o plano salvo ou a semente.
  function plano() {
    try {
      const salvo = localStorage.getItem(CHAVE_PLANO);
      if (salvo) {
        const p = { categorias: [], centrosCusto: [], contasBancarias: [], fornecedores: [], ...JSON.parse(salvo) };
        // Categoria 750 (material de escritório e copa) entrou com o módulo Compras (08/09/2026): plano salvo antes recebe a semente dela.
        const cat750 = PLANO_CATEGORIAS_SEED.find((c) => c.codigo === '750');
        if (cat750 && !p.categorias.some((c) => c.codigo === '750')) { p.categorias = [...p.categorias, clonar(cat750)]; salvarPlano(p); }
        // Centros de receita entraram na V1: plano salvo sem nenhum recebe a semente (B2B, B2C, Orion).
        if (!p.centrosCusto.some((c) => c.tipo === 'receita')) { p.centrosCusto = [...p.centrosCusto, ...clonar(CENTROS_RECEITA_SEED)]; salvarPlano(p); }
        // Contas salvas antes do catálogo de instituições (30/08/2026): casa pelo nome do banco.
        if (typeof buscarInstituicoes === 'function' && p.contasBancarias.some((c) => c.instituicaoId === undefined)) {
          p.contasBancarias = p.contasBancarias.map((c) => (c.instituicaoId !== undefined ? c : { ...c, instituicaoId: instituicaoPorNome(c.banco)?.id ?? null }));
          salvarPlano(p);
        }
        return p;
      }
    } catch (_) { /* semente */ }
    return clonar(PLANO_SEED);
  }
  function salvarPlano(p) { localStorage.setItem(CHAVE_PLANO, JSON.stringify(p)); }
  // Instituição financeira do catálogo (js/instituicoes-data.js) — opcional na página.
  const instituicaoDaConta = (c) => (typeof instituicaoDe === 'function' && c?.instituicaoId ? instituicaoDe(c.instituicaoId) : null);
  function instituicaoPorNome(nome) {
    if (typeof buscarInstituicoes !== 'function' || !nome) return null;
    const n = normalizar(nome);
    const lista = buscarInstituicoes('', { comBandeiras: true });
    return lista.find((i) => normalizar(i.nome) === n) ?? lista.find((i) => n.startsWith(normalizar(i.nome)) || normalizar(i.nome).startsWith(n)) ?? null;
  }
  // Nome do banco a gravar: o da instituição escolhida, senão o texto informado.
  const bancoDe = (dados) => { const i = typeof instituicaoDe === 'function' && dados.instituicaoId ? instituicaoDe(dados.instituicaoId) : null; return i ? i.nome : String(dados.banco ?? '').trim(); };

  const categoriaDe = (p, id) => porId(p.categorias, id);
  const categoriaPorCodigo = (p, codigo) => p.categorias.find((c) => c.codigo === String(codigo)) ?? null;
  const centroDe = (p, id) => porId(p.centrosCusto, id);
  const centroPorCodigo = (p, codigo) => p.centrosCusto.find((c) => c.codigo === String(codigo)) ?? null;
  // Centro sem tipo é de custo (os salvos antes dos centros de receita).
  const tipoCentro = (c) => (c?.tipo === 'receita' ? 'receita' : 'custo');
  const centrosDoTipo = (p, tipo, { soAtivos = true } = {}) => p.centrosCusto.filter((c) => tipoCentro(c) === tipo && (!soAtivos || c.status === 'ativo'));
  const TIPOS_CENTRO = [{ id: 'custo', nome: 'Custo' }, { id: 'receita', nome: 'Receita' }];
  // Centro de custo de cada departamento (DEPARTAMENTOS em colaboradores-data.js); folha e regras padrão usam este mapa.
  const CENTRO_POR_DEPARTAMENTO = { direcao: '100', pedagogico: '200', comercial: '300', marketing: '400', suporte: '500', financeiro: '600', administrativo: '700' };
  const centroDoDepartamento = (p, dep) => centroPorCodigo(p, CENTRO_POR_DEPARTAMENTO[dep] ?? '700');
  // Segmento B2C/B2B da receita = natureza de quem contratou (PJ → B2B; PF ou sem pessoa → B2C). Despesa → null.
  const segmentoDe = (l) => (l.tipo !== 'receita' ? null : naturezaPessoa(l.pessoa) === 'pj' ? 'b2b' : 'b2c');
  const contaDe = (p, id) => porId(p.contasBancarias, id);
  const fornecedorDe = (p, id) => porId(p.fornecedores, id);
  const contaPadrao = (p, papel) => p.contasBancarias.find((c) => c.status === 'ativo' && (papel === 'recebimento' ? c.padraoRecebimento : c.padraoPagamento)) ?? p.contasBancarias.find((c) => c.status === 'ativo') ?? p.contasBancarias[0] ?? null;
  const contaAsaas = (p) => p.contasBancarias.find((c) => c.tipo === 'gateway') ?? contaPadrao(p, 'recebimento');
  const categoriasDoTipo = (p, tipo, { soAtivas = true } = {}) => p.categorias.filter((c) => c.tipo === tipo && (!soAtivas || c.status === 'ativo')).sort((a, b) => a.codigo.localeCompare(b.codigo));

  // Quantos lançamentos apontam para cada registro do plano (coluna "Em uso").
  function usoDoPlano(lista) {
    const uso = { categorias: {}, centrosCusto: {}, contasBancarias: {}, fornecedores: {} };
    const inc = (mapa, id) => { if (id) mapa[id] = (mapa[id] ?? 0) + 1; };
    lista.forEach((l) => { inc(uso.categorias, l.categoriaId); inc(uso.centrosCusto, l.centroCustoId); inc(uso.contasBancarias, l.contaBancariaId); if (l.pessoa?.tipo === 'fornecedor') inc(uso.fornecedores, l.pessoa.id); });
    return uso;
  }

  // CRUD genérico do plano: `colecao` ∈ categorias | centrosCusto | contasBancarias | fornecedores.
  const PREFIXO_PLANO = { categorias: 'cat', centrosCusto: 'cc', contasBancarias: 'cb', fornecedores: 'for' };
  function novoIdPlano(p, colecao) {
    let n = p[colecao].length + 1;
    while (p[colecao].some((x) => x.id === `${PREFIXO_PLANO[colecao]}-n${n}`)) n += 1;
    return `${PREFIXO_PLANO[colecao]}-n${n}`;
  }
  function validarPlano(p, colecao, dados, excetoId = null) {
    const erros = [];
    const nome = String(dados.nome ?? '').trim();
    // Na ordem dos campos do formulário (tipo, código, nome, grupo), para o foco ir ao primeiro erro de cima.
    const ehCentro = colecao === 'centrosCusto';
    const tipoC = ehCentro ? (dados.tipo ?? 'custo') : null;
    // O código liga o centro ao departamento (CENTRO_POR_DEPARTAMENTO): folha e regras padrão acham o centro por ele.
    const ligado = ehCentro && excetoId ? centroDe(p, excetoId) : null;
    const doDepartamento = Boolean(ligado) && Object.values(CENTRO_POR_DEPARTAMENTO).includes(ligado.codigo);
    const filhos = ehCentro && excetoId ? p.centrosCusto.filter((x) => x.grupoId === excetoId) : [];
    if (ehCentro) {
      if (!TIPOS_CENTRO.some((t) => t.id === tipoC)) erros.push({ campo: 'tipo', mensagem: 'Escolha custo ou receita.' });
      else if (doDepartamento && tipoC !== 'custo') erros.push({ campo: 'tipo', mensagem: `O centro ${ligado.codigo} é de um departamento e continua de custo.` });
      else if (filhos.some((x) => tipoCentro(x) !== tipoC)) erros.push({ campo: 'tipo', mensagem: 'Os centros deste grupo são do outro tipo; tire-os do grupo antes.' });
    }
    if (colecao === 'categorias' || ehCentro) {
      const codigo = String(dados.codigo ?? '').trim();
      const repetido = p[colecao].find((x) => x.codigo === codigo && x.id !== excetoId);
      // Centro de receita numera em R + dezena (R10 B2B, R20 B2C…), para não cruzar com as centenas dos departamentos.
      const receita = tipoC === 'receita';
      if (doDepartamento && codigo !== ligado.codigo) erros.push({ campo: 'codigo', mensagem: `O código ${ligado.codigo} liga este centro a um departamento; mantenha ${ligado.codigo}.` });
      else if (!(receita ? /^R\d{2}$/ : /^\d{3}$/).test(codigo)) erros.push({ campo: 'codigo', mensagem: receita ? 'Código com R e 2 dígitos (ex.: R40).' : `Código com 3 dígitos (ex.: ${ehCentro ? '800' : '701'}).` });
      else if (repetido) erros.push({ campo: 'codigo', mensagem: `O código ${codigo} já é de "${repetido.nome}".` });
    }
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome.' });
    // Grupo: um centro de primeiro nível, do mesmo tipo; um grupo não entra em outro.
    if (ehCentro && dados.grupoId) {
      const g = centroDe(p, dados.grupoId);
      if (!g || g.id === excetoId) erros.push({ campo: 'grupoId', mensagem: 'Escolha um grupo da lista.' });
      else if (tipoCentro(g) !== tipoC) erros.push({ campo: 'grupoId', mensagem: `"${g.nome}" é centro de ${tipoCentro(g)}; o grupo precisa ser do mesmo tipo.` });
      else if (g.grupoId) erros.push({ campo: 'grupoId', mensagem: `"${g.nome}" já está dentro de outro grupo; escolha um de primeiro nível.` });
      else if (filhos.length) erros.push({ campo: 'grupoId', mensagem: 'Este centro já agrupa outros; um grupo não entra em outro grupo.' });
    }
    if (colecao === 'categorias') {
      if (!TIPOS.some((t) => t.id === dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha receita ou despesa.' });
      if (!GRUPOS_CATEGORIA.some((g) => g.id === dados.grupo)) erros.push({ campo: 'grupo', mensagem: 'Escolha o grupo (linha do DRE).' });
    }
    if (colecao === 'contasBancarias') {
      if (!TIPOS_CONTA.some((t) => t.id === dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo da conta.' });
      if (dados.saldoInicial !== '' && dados.saldoInicial != null && Number.isNaN(Number(dados.saldoInicial))) erros.push({ campo: 'saldoInicial', mensagem: 'Saldo inicial inválido.' });
      if (!dados.saldoInicialEm) erros.push({ campo: 'saldoInicialEm', mensagem: 'Informe a data do saldo inicial.' });
      // O saldo inicial entra no saldo de hoje; com data futura, a conta mostraria hoje um dinheiro que ainda não tem.
      else if (dados.saldoInicialEm > hoje()) erros.push({ campo: 'saldoInicialEm', mensagem: 'Use a data de hoje ou uma anterior: o saldo inicial é o que a conta já tinha.' });
    }
    if (colecao === 'fornecedores' && typeof Documento !== 'undefined') { const e = Documento.erro(dados.documento); if (e) erros.push({ campo: 'documento', mensagem: e }); }
    // Mesmo CNPJ/CPF em dois cadastros divide o histórico de pagamentos; compara só os dígitos.
    const doc = String(dados.documento ?? '').replace(/\D/g, '');
    const repetido = colecao === 'fornecedores' && doc.length >= 11 && p.fornecedores.find((x) => x.id !== excetoId && String(x.documento ?? '').replace(/\D/g, '') === doc);
    if (repetido && !erros.some((e) => e.campo === 'documento')) erros.push({ campo: 'documento', mensagem: `Já cadastrado como "${repetido.nome}".` });
    if (colecao === 'fornecedores' && dados.contato?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(dados.contato.email).trim())) erros.push({ campo: 'contato.email', mensagem: 'E-mail inválido.' });
    return erros;
  }
  function incluirNoPlano(p, colecao, dados) {
    const item = { status: 'ativo', ...dados, id: novoIdPlano(p, colecao), nome: String(dados.nome).trim() };
    if (colecao === 'contasBancarias') {
      item.saldoInicial = arred(dados.saldoInicial);
      item.banco = bancoDe(dados); item.instituicaoId = dados.instituicaoId || null;
      // Só uma conta padrão por papel.
      return { ...p, contasBancarias: [...p.contasBancarias.map((c) => ({ ...c, padraoRecebimento: item.padraoRecebimento ? false : c.padraoRecebimento, padraoPagamento: item.padraoPagamento ? false : c.padraoPagamento })), item] };
    }
    return { ...p, [colecao]: [...p[colecao], item] };
  }
  function atualizarNoPlano(p, colecao, id, dados) {
    const lista = p[colecao].map((x) => (x.id === id ? { ...x, ...dados, id, nome: String(dados.nome ?? x.nome).trim(), ...(colecao === 'contasBancarias' ? { ...(dados.saldoInicial != null ? { saldoInicial: arred(dados.saldoInicial) } : {}), ...('instituicaoId' in dados || 'banco' in dados ? { banco: bancoDe({ ...x, ...dados }), instituicaoId: dados.instituicaoId ?? x.instituicaoId ?? null } : {}) } : {}) } : x));
    if (colecao === 'contasBancarias') {
      const nova = lista.find((c) => c.id === id);
      return { ...p, contasBancarias: lista.map((c) => (c.id === id ? c : { ...c, padraoRecebimento: nova.padraoRecebimento ? false : c.padraoRecebimento, padraoPagamento: nova.padraoPagamento ? false : c.padraoPagamento })) };
    }
    return { ...p, [colecao]: lista };
  }
  const alterarStatusPlano = (p, colecao, id, status) => ({ ...p, [colecao]: p[colecao].map((x) => (x.id === id ? { ...x, status } : x)) });
  const removerDoPlano = (p, colecao, id) => ({ ...p, [colecao]: p[colecao].filter((x) => x.id !== id) });

  // ---------- Lançamento: campos derivados ----------

  const valorFinal = (l) => arred((Number(l.valor) || 0) - (Number(l.desconto) || 0));
  // 'previsto' | 'emitido' | 'vencido' | 'pago' | 'cancelado' — vencido é derivado.
  const situacao = (l, ref = hoje()) => ((l.status === 'previsto' || l.status === 'emitido') && l.vencimento < ref ? 'vencido' : l.status);
  const situacaoDe = (l, ref = hoje()) => SITUACOES.find((s) => s.id === situacao(l, ref)) ?? SITUACOES[0];
  const diasAtraso = (l, ref = hoje()) => (situacao(l, ref) === 'vencido' ? diasEntre(l.vencimento, ref) : 0);
  const emAberto = (l) => l.status === 'previsto' || l.status === 'emitido';
  const ehContrato = (l) => l.origem?.tipo === 'contrato';
  const ehInstrutor = (l) => l.origem?.tipo === 'instrutor';
  const ehFolha = (l) => l.origem?.tipo === 'folha';
  const ehCompra = (l) => l.origem?.tipo === 'compra';
  const ehManual = (l) => !l.origem || l.origem.tipo === 'manual';

  // Texto da origem: "Contrato 2026-02-003 · parcela 3/6", "Contrato do instrutor CI-2026-003 · pg2", "Folha 03/2026".
  function descricaoOrigem(l) {
    const o = l.origem ?? { tipo: 'manual' };
    if (o.tipo === 'contrato') return `Venda ${o.codigo ?? o.contratoId} · parcela ${o.parcelaN}${o.totalParcelas ? `/${o.totalParcelas}` : ''}`;
    if (o.tipo === 'instrutor') return `Contrato do instrutor ${o.codigo ?? ''} · pagamento ${o.pagamentoId}`.replace(/\s+/g, ' ');
    if (o.tipo === 'folha') return `Folha ${lancRotuloMes(l.competencia)}`;
    if (o.tipo === 'compra') return `Compra ${o.codigo ?? o.compraId}`;
    return 'Lançamento manual';
  }
  // Link para a tela de origem.
  function linkOrigem(l) {
    const o = l.origem ?? {};
    if (o.tipo === 'contrato') return `contrato.html?id=${encodeURIComponent(o.contratoId)}`;
    if (o.tipo === 'instrutor') return `instrutor.html?id=${encodeURIComponent(o.instrutorId)}`;
    if (o.tipo === 'folha') return `colaborador.html?id=${encodeURIComponent(o.colaboradorId)}`;
    return null;
  }
  // Link para o cadastro da pessoa do lançamento (quando há cadastro).
  function linkPessoa(l) {
    const p = l.pessoa; if (!p?.id) return null;
    return { aluno: `aluno.html?id=${p.id}`, empresa: `empresa.html?id=${p.id}`, responsavel: `responsavel.html?id=${p.id}`, instrutor: `instrutor.html?id=${p.id}`, colaborador: `colaborador.html?id=${p.id}` }[p.tipo] ?? null;
  }

  // Campos que a tela pode editar conforme a origem.
  const CAMPOS_LOCAIS = ['categoriaId', 'centroCustoId', 'contaBancariaId', 'observacao', 'nf'];
  const CAMPOS_TODOS = ['tipo', 'descricao', 'pessoa', 'valor', 'desconto', 'competencia', 'vencimento', 'forma', 'categoriaId', 'centroCustoId', 'contaBancariaId', 'turmaId', 'cursoId', 'observacao', 'nf'];
  function camposEditaveis(l) {
    if (ehContrato(l) || ehInstrutor(l) || ehCompra(l)) return CAMPOS_LOCAIS; // compra: valor, vencimento, forma e fornecedor vêm da compra
    if (ehFolha(l)) return [...CAMPOS_LOCAIS, 'vencimento', 'forma', 'valor', 'desconto'];
    return CAMPOS_TODOS;
  }
  const podeEditar = (l) => l.status !== 'cancelado';
  // Só manual, folha e compra cancelam aqui; contrato/instrutor cancelam na origem.
  // Compra recebida não volta atrás no módulo Compras, então o cancelamento da conta fica no Financeiro [sup.].
  const podeCancelar = (l) => l.status !== 'pago' && l.status !== 'cancelado' && (ehManual(l) || ehFolha(l) || ehCompra(l));
  const podeRemover = (l) => ehManual(l) && l.status !== 'pago';
  // Baixa: aberto; instrutor só com NF.
  function podeBaixar(l) {
    if (!emAberto(l)) return { ok: false, motivo: l.status === 'pago' ? 'Já está pago.' : 'Lançamento cancelado.' };
    if (ehInstrutor(l) && !l.nf) return { ok: false, motivo: 'Aguardando NF do instrutor.' };
    return { ok: true, motivo: '' };
  }
  const podeEstornar = (l) => l.status === 'pago';
  const podeGerarCobranca = (l) => l.tipo === 'receita' && emAberto(l) && !l.asaas;

  // ---------- Contexto (outros domínios) ----------

  function contexto() {
    const cursos = typeof Cursos !== 'undefined' ? Cursos.carregar() : [];
    const turmas = typeof Turmas !== 'undefined' ? Turmas.carregar() : (typeof Cursos !== 'undefined' ? Cursos.todasTurmas() : []);
    const formacoes = typeof Formacoes !== 'undefined' ? Formacoes.carregar() : [];
    const clientes = typeof Clientes !== 'undefined' ? Clientes.carregar() : { empresas: [], alunos: [], responsaveis: [] };
    const ctxContratos = { empresas: clientes.empresas, alunos: clientes.alunos, responsaveis: clientes.responsaveis ?? [], cursos, formacoes };
    const contratos = typeof Contratos !== 'undefined' ? Contratos.carregar() : [];
    const instrutores = typeof Instrutores !== 'undefined' ? Instrutores.carregar() : [];
    const colaboradores = typeof Colaboradores !== 'undefined' ? Colaboradores.carregar() : (typeof COLABORADORES_SEED !== 'undefined' ? clonar(COLABORADORES_SEED) : []);
    return { cursos, turmas, formacoes, clientes, ctxContratos, contratos, instrutores, colaboradores, plano: plano() };
  }
  const turmaDe = (ctx, id) => (id ? porId(ctx.turmas, id) : null);

  // ---------- Sincronização ----------

  const STATUS_PARCELA_PARA_LANC = { prevista: 'previsto', emitida: 'emitido', paga: 'pago', cancelada: 'cancelado' };
  const registrar = (l, texto) => ({ ...l, atualizadoEm: agora(), historico: [...(l.historico ?? []), { em: agora(), texto }] });
  const lancamentoBase = (d) => ({
    tipo: 'despesa', descricao: '', valor: 0, desconto: 0, competencia: '', vencimento: '', pagoEm: null, status: 'previsto', forma: 'boleto',
    categoriaId: null, centroCustoId: null, contaBancariaId: null, segmento: null, pessoa: null, turmaId: null, cursoId: null,
    origem: { tipo: 'manual' }, asaas: null, nf: null, conciliado: null, observacao: '', criadoEm: agora(), atualizadoEm: agora(), historico: [],
    ...d,
  });

  // Turma/curso do 1º item do contrato com turma (ou só curso).
  function turmaDoContrato(ctx, c) {
    const itens = [...c.alunos.flatMap((v) => v.itens), ...c.pacotes.flatMap((p) => p.itens)];
    const comTurma = itens.find((i) => i.turmaId) ?? itens[0] ?? null;
    if (!comTurma) return { turmaId: null, cursoId: null, incompany: false };
    const t = turmaDe(ctx, comTurma.turmaId);
    return { turmaId: comTurma.turmaId ?? null, cursoId: comTurma.cursoId ?? t?.cursoId ?? null, incompany: t?.tipo === 'incompany' };
  }

  // Asaas determinístico para a semente (parcelas emitidas/pagas por boleto/pix "já nascem no Asaas").
  function asaasSemente(l, forma, parcela) {
    if (!['boleto', 'pix'].includes(forma) || parcela.status === 'prevista' || parcela.status === 'cancelada') return null;
    const tipo = forma === 'pix' ? 'PIX' : 'BOLETO';
    const id = lancIdAsaas(l.id);
    const criadoEm = parcela.emitidaEm ?? parcela.pagoEm ?? parcela.vencimento;
    return montarAsaas(id, tipo, valorFinal(l), criadoEm, parcela.status === 'paga' ? 'RECEIVED' : (parcela.vencimento < hoje() ? 'OVERDUE' : 'PENDING'));
  }
  function montarAsaas(id, tipo, valor, criadoEm, status = 'PENDING') {
    const taxa = LANC_TAXAS_ASAAS[tipo] ?? 3.49;
    const h = lancHash(id);
    const dig = (n) => String(h).padStart(10, '0').repeat(6).slice(0, n);
    const linha = `23793.${dig(5)} ${dig(5)}.${dig(6)} ${dig(5)}.${dig(6)} ${String(h % 10)} ${dig(14)}`;
    return {
      id, status, tipo, url: `https://sandbox.asaas.com/i/${id.slice(4)}`,
      linhaDigitavel: tipo === 'BOLETO' ? linha : null,
      pixCopiaCola: `00020126580014br.gov.bcb.pix0136${id}-${dig(8)}-asaas-sandbox5204000053039865406${valor.toFixed(2)}5802BR5915PROWAY TREINAM6008BLUMENAU62070503***6304${dig(4).toUpperCase()}`,
      criadoEm: String(criadoEm).slice(0, 10), valorLiquido: arred(valor - taxa), taxa,
    };
  }

  // Materializa/atualiza um lançamento por parcela de contrato. Mantém o que é local.
  function sincronizarContratos(lista, ctx) {
    const p = ctx.plano;
    const mapa = new Map(lista.map((l) => [l.id, l]));
    const cat100 = categoriaPorCodigo(p, '100'); const cat110 = categoriaPorCodigo(p, '110');
    const contaRec = contaPadrao(p, 'recebimento');
    const ativos = new Set();
    ctx.contratos.forEach((c) => {
      const foraDoFluxo = c.status === 'rascunho' || c.status === 'cancelado';
      const rf = Contratos.responsavelFinanceiro(ctx.ctxContratos, c);
      const tc = turmaDoContrato(ctx, c);
      const pessoa = { tipo: rf.tipo === 'terceiro' ? 'aluno' : (rf.tipo ?? 'aluno'), id: rf.empresa?.id ?? rf.responsavel?.id ?? rf.aluno?.id ?? null, nome: rf.nome, documento: rf.documento ?? '' };
      const forma = ['boleto', 'pix', 'cartao', 'transferencia'].includes(c.cobranca?.forma) ? c.cobranca.forma : 'boleto';
      const centroReceita = centroDe(p, c.centroReceitaId);
      c.parcelas.forEach((pc) => {
        const id = `lc-${c.id}-${pc.n}`;
        const atual = mapa.get(id);
        if (!atual && (foraDoFluxo || pc.status === 'cancelada')) return;
        const status = foraDoFluxo ? 'cancelado' : STATUS_PARCELA_PARA_LANC[pc.status] ?? 'previsto';
        const sincro = {
          tipo: 'receita', descricao: `${Contratos.descricao(ctx.ctxContratos, c)} — parcela ${pc.n}/${c.parcelas.length}`,
          valor: arred(pc.valor), competencia: mesDe(pc.vencimento), vencimento: pc.vencimento, pagoEm: pc.pagoEm ?? null,
          status: status === 'previsto' && atual?.asaas && atual.asaas.status !== 'REFUNDED' ? 'emitido' : status,
          forma, pessoa, turmaId: tc.turmaId, cursoId: tc.cursoId,
          centroCustoId: tipoCentro(centroReceita) === 'receita' ? centroReceita.id : null,
          origem: { tipo: 'contrato', contratoId: c.id, codigo: c.codigo, parcelaN: pc.n, totalParcelas: c.parcelas.length },
        };
        if (atual) {
          const mudou = Object.keys(sincro).some((k) => JSON.stringify(atual[k]) !== JSON.stringify(sincro[k]));
          mapa.set(id, mudou ? { ...atual, ...sincro, atualizadoEm: agora() } : atual);
          if (sincro.status === 'pago' && atual.asaas && atual.asaas.status === 'PENDING') mapa.set(id, { ...mapa.get(id), asaas: { ...atual.asaas, status: 'RECEIVED' } });
        } else {
          const criadoEm = `${String(c.criadoEm).slice(0, 10)}T09:00:00`;
          let novo = lancamentoBase({
            id, ...sincro, desconto: 0,
            categoriaId: (tc.incompany ? cat110 : cat100)?.id ?? null,
            contaBancariaId: contaRec?.id ?? null, criadoEm, atualizadoEm: criadoEm,
            historico: [{ em: criadoEm, texto: `Gerado da parcela ${pc.n}/${c.parcelas.length} da venda ${c.codigo}` }],
          });
          novo.asaas = asaasSemente(novo, forma, pc);
          mapa.set(id, novo);
        }
        ativos.add(id);
      });
    });
    // Lançamentos de contrato órfãos (contrato/parcela removidos) viram cancelados.
    mapa.forEach((l, id) => { if (ehContrato(l) && !ativos.has(id) && l.status !== 'cancelado') mapa.set(id, { ...l, status: 'cancelado', atualizadoEm: agora() }); });
    return [...mapa.values()];
  }

  // Um lançamento por pagamento programado nos contratos de instrutor.
  function sincronizarInstrutores(lista, ctx) {
    if (!ctx.instrutores.length) return lista;
    const p = ctx.plano;
    const mapa = new Map(lista.map((l) => [l.id, l]));
    const cat310 = categoriaPorCodigo(p, '310');
    const ccPedagogico = centroDoDepartamento(p, 'pedagogico');
    const contaPag = contaPadrao(p, 'pagamento');
    const fmtCnpj = (v) => (typeof Instrutores !== 'undefined' && Instrutores.fmtCnpj ? Instrutores.fmtCnpj(v) : v);
    const fmtCpf = (v) => (typeof Instrutores !== 'undefined' && Instrutores.fmtCpf ? Instrutores.fmtCpf(v) : v);
    ctx.instrutores.forEach((i) => {
      (i.pagamentos ?? []).forEach((pg) => {
        const id = `li-${i.id}-${pg.id}`;
        const atual = mapa.get(id);
        const contrato = (i.contratos ?? []).find((c) => c.id === pg.contratoId) ?? null;
        const item = contrato?.itens.find((it) => it.id === pg.itemId) ?? null;
        const t = item?.turmaId ? turmaDe(ctx, item.turmaId) : null;
        const cancelado = contrato?.status === 'cancelado' && !pg.pagoEm;
        const sincro = {
          tipo: 'despesa', descricao: `${pg.descricao || 'Pagamento de instrutor'} — ${i.nome}`,
          valor: arred(pg.valor), competencia: mesDe(pg.previsto), vencimento: pg.previsto, pagoEm: pg.pagoEm ?? null,
          status: cancelado ? 'cancelado' : pg.pagoEm ? 'pago' : pg.nf ? 'emitido' : 'previsto',
          nf: pg.nf ? { numero: pg.nf.numero, emitidaEm: pg.nf.emitidaEm } : null,
          pessoa: { tipo: 'instrutor', id: i.id, nome: i.empresa?.razaoSocial ? `${i.nome} (${i.empresa.razaoSocial})` : i.nome, documento: i.empresa?.cnpj ? fmtCnpj(i.empresa.cnpj) : fmtCpf(i.cpf) },
          turmaId: item?.turmaId ?? null, cursoId: t?.cursoId ?? null,
          origem: { tipo: 'instrutor', instrutorId: i.id, pagamentoId: pg.id, contratoId: pg.contratoId, codigo: contrato?.codigo ?? '' },
        };
        if (atual) {
          const mudou = Object.keys(sincro).some((k) => JSON.stringify(atual[k]) !== JSON.stringify(sincro[k]));
          mapa.set(id, mudou ? { ...atual, ...sincro, atualizadoEm: agora() } : atual);
        } else {
          const criadoEm = `${String(pg.previsto).slice(0, 10)}T09:00:00`;
          mapa.set(id, lancamentoBase({
            id, ...sincro, desconto: 0, forma: 'transferencia',
            categoriaId: cat310?.id ?? null, centroCustoId: ccPedagogico?.id ?? null, contaBancariaId: contaPag?.id ?? null,
            criadoEm, atualizadoEm: criadoEm, historico: [{ em: criadoEm, texto: `Gerado do pagamento ${pg.id} do contrato ${contrato?.codigo ?? pg.contratoId}` }],
          }));
        }
      });
    });
    return [...mapa.values()];
  }

  // Folha: valor mensal MOCK por colaborador ativo (LANC_FOLHA_MOCK em lancamentos-data.js — o
  // cadastro de Colaboradores não tem salário; o sistema não faz folha), mês a mês, vencendo dia 5
  // do mês seguinte; 13º em dezembro para quem tem base na tabela.
  function sincronizarFolha(lista, ctx) {
    if (!ctx.colaboradores.length || typeof LANC_FOLHA_MOCK === 'undefined') return lista;
    const p = ctx.plano;
    const mapa = new Map(lista.map((l) => [l.id, l]));
    const cat200 = categoriaPorCodigo(p, '200'); const cat220 = categoriaPorCodigo(p, '220');
    const contaPag = contaPadrao(p, 'pagamento');
    const ref = hoje();
    const meses = mesesEntre(LANC_PARAMETROS.mesInicioSemente, mesDe(ref));
    const fmtCpf = (v) => (typeof Colaboradores !== 'undefined' && Colaboradores.fmtCpf ? Colaboradores.fmtCpf(v) : v);
    ctx.colaboradores.filter((c) => c.status === 'ativo' && Number(LANC_FOLHA_MOCK[c.id]?.mensal) > 0).forEach((c) => {
      const folha = LANC_FOLHA_MOCK[c.id];
      const admissao = mesDe(c.admissao || meses[0]);
      const pessoa = { tipo: 'colaborador', id: c.id, nome: c.nome, documento: fmtCpf(c.cpf) };
      const centroId = centroDoDepartamento(p, c.departamentoId)?.id ?? null;
      const criar = (id, ym, vencimento, valor, descricao, categoria) => {
        const atual = mapa.get(id);
        const pago = vencimento <= ref;
        if (atual) {
          // Valor mudou na tabela: acompanha só enquanto não pago.
          if (atual.status === 'previsto' && Math.abs(atual.valor - valor) > 0.005) mapa.set(id, { ...atual, valor, atualizadoEm: agora() });
          return;
        }
        const criadoEm = `${lancDia(ym, 25)}T09:00:00`;
        mapa.set(id, lancamentoBase({
          id, tipo: 'despesa', descricao, valor, competencia: ym, vencimento, pagoEm: pago ? vencimento : null, status: pago ? 'pago' : 'previsto',
          forma: folha.forma ?? 'pix', categoriaId: categoria?.id ?? null, centroCustoId: centroId, contaBancariaId: contaPag?.id ?? null,
          pessoa, origem: { tipo: 'folha', colaboradorId: c.id, competencia: ym }, criadoEm, atualizadoEm: criadoEm,
          historico: [{ em: criadoEm, texto: 'Gerado da folha (custo de pessoal por colaborador)' }, ...(pago ? [{ em: `${vencimento}T10:00:00`, texto: 'Baixa registrada — folha' }] : [])],
        }));
      };
      meses.forEach((ym) => {
        if (ym < admissao) return;
        criar(`lf-${c.id}-${ym}`, ym, lancDia(lancMesSeguinte(ym), LANC_PARAMETROS.diaFolha), arred(folha.mensal), `Folha ${lancRotuloMes(ym)} — ${c.nome}`, cat200);
        if (ym.endsWith('-12') && folha.decimoTerceiro) {
          const ano = ym.slice(0, 4);
          const mesesAno = mesesEntre(`${ano}-01`, ym).filter((m) => m >= admissao).length;
          criar(`lf-${c.id}-${ano}-13`, ym, `${ano}-12-20`, arred((folha.decimoTerceiro / 12) * mesesAno), `13º salário ${ano} — ${c.nome} (${mesesAno}/12 avos)`, cat220);
        }
      });
    });
    return [...mapa.values()];
  }

  // Compras: uma despesa por compra RECEBIDA no módulo Compras ('lc-compra-<compraId>'). O que vem da compra
  // (descrição, valor, vencimento/forma do pedido, fornecedor, turma, NF do recebimento) é sincronizado; categoria,
  // centro, conta, observação e o STATUS (baixa, estorno, cancelamento) são locais do Financeiro.
  // [sup.] Ao nascer com vencimento anterior a hoje o lançamento já vem pago no vencimento (como a folha) — assim a
  // semente não abre com meses de compras "vencidas"; no fluxo real a compra é recebida antes de vencer.
  function sincronizarCompras(lista, ctx) {
    if (typeof Compras === 'undefined') return lista;
    const compras = Compras.carregar();
    const p = ctx.plano;
    const mapa = new Map(lista.map((l) => [l.id, l]));
    const contaPag = contaPadrao(p, 'pagamento');
    const ref = hoje();
    const ativos = new Set();
    compras.forEach((c) => {
      if (!Compras.geraLancamento(c) || !c.pedido || !c.recebimento) return;
      const id = Compras.idLancamento(c);
      const atual = mapa.get(id);
      const f = fornecedorDe(p, c.fornecedorId);
      const t = turmaDe(ctx, c.turmaId);
      const nf = c.recebimento.nf?.numero ? { numero: c.recebimento.nf.numero, emitidaEm: c.recebimento.nf.emitidaEm } : null;
      const sincro = {
        tipo: 'despesa', descricao: Compras.descricaoLancamento(c),
        valor: arred(Compras.total(c)), competencia: mesDe(c.recebimento.em), vencimento: c.pedido.vencimento,
        forma: FORMAS.some((x) => x.id === c.pedido.formaPagamento) ? c.pedido.formaPagamento : 'boleto',
        pessoa: { tipo: 'fornecedor', id: f?.id ?? c.fornecedorId ?? null, nome: f?.nome ?? 'Fornecedor não cadastrado', documento: f?.documento ?? '' },
        turmaId: c.turmaId ?? null, cursoId: t?.cursoId ?? null,
        origem: { tipo: 'compra', compraId: c.id, codigo: c.codigo },
        ...(nf ? { nf } : {}), // sem NF na compra, a NF registrada no Financeiro é local
      };
      if (atual) {
        const mudou = Object.keys(sincro).some((k) => JSON.stringify(atual[k]) !== JSON.stringify(sincro[k]));
        let novo = mudou ? { ...atual, ...sincro, atualizadoEm: agora() } : atual;
        if (nf && !atual.nf && novo.status === 'previsto') novo = { ...novo, status: 'emitido' }; // NF chegou depois: despesa com NF = emitida
        mapa.set(id, novo);
      } else {
        const criadoEm = `${String(c.recebimento.em).slice(0, 10)}T${String(c.recebimento.em).length > 10 ? String(c.recebimento.em).slice(11, 19) : '12:00:00'}`;
        const pago = sincro.vencimento < ref;
        mapa.set(id, lancamentoBase({
          id, ...sincro, desconto: 0,
          categoriaId: categoriaDe(p, c.categoriaId)?.id ?? f?.categoriaId ?? null, centroCustoId: centroDe(p, c.centroCustoId)?.id ?? f?.centroCustoId ?? null,
          contaBancariaId: contaPag?.id ?? null,
          status: pago ? 'pago' : nf ? 'emitido' : 'previsto', pagoEm: pago ? sincro.vencimento : null,
          criadoEm, atualizadoEm: criadoEm,
          historico: [{ em: criadoEm, texto: `Gerado do recebimento da compra ${c.codigo}${nf ? ` (NF ${nf.numero})` : ' — sem NF'}` }, ...(pago ? [{ em: `${sincro.vencimento}T10:00:00`, texto: 'Baixa registrada — compra' }] : [])],
        }));
      }
      ativos.add(id);
    });
    // Lançamentos de compra órfãos (compra removida) viram cancelados.
    mapa.forEach((l, id) => { if (ehCompra(l) && !ativos.has(id) && l.status !== 'cancelado') mapa.set(id, { ...l, status: 'cancelado', atualizadoEm: agora() }); });
    return [...mapa.values()];
  }

  // Agregados que a semente manual precisa (receita recebida, contratos criados, turmas presenciais por mês,
  // compras recebidas por mês e categoria).
  function agregadosParaSemente(ctx) {
    const receitaPagaPorMes = {};
    const contratosCriadosPorMes = {};
    ctx.contratos.forEach((c) => {
      if (c.status === 'rascunho' || c.status === 'cancelado') return;
      c.parcelas.forEach((pc) => { if (pc.status === 'paga' && pc.pagoEm) { const m = mesDe(pc.pagoEm); receitaPagaPorMes[m] = arred((receitaPagaPorMes[m] ?? 0) + pc.valor); } });
      const m = mesDe(c.criadoEm);
      const t = Contratos.totais(c);
      const b2b = c.contratante === 'empresa' ? t.final : 0;
      const acc = contratosCriadosPorMes[m] ?? { n: 0, valor: 0, valorB2b: 0 };
      contratosCriadosPorMes[m] = { n: acc.n + 1, valor: arred(acc.valor + t.final), valorB2b: arred(acc.valorB2b + b2b) };
    });
    const turmasPresenciaisPorMes = {};
    ctx.turmas.filter((t) => t.status !== 'cancelada' && t.formato !== 'online').forEach((t) => {
      mesesEntre(mesDe(t.inicio), mesDe(t.fim)).forEach((m) => {
        const acc = turmasPresenciaisPorMes[m] ?? { total: 0, incompany: 0 };
        turmasPresenciaisPorMes[m] = { total: acc.total + 1, incompany: acc.incompany + (t.tipo === 'incompany' ? 1 : 0) };
      });
    });
    // Compras recebidas por mês de competência (recebimento) e código de categoria — a semente manual abate isto.
    const comprasPorMes = {};
    if (typeof Compras !== 'undefined') {
      Compras.carregar().filter((c) => Compras.geraLancamento(c) && c.recebimento?.em).forEach((c) => {
        const cod = categoriaDe(ctx.plano, c.categoriaId)?.codigo; if (!cod) return;
        const ym = mesDe(c.recebimento.em);
        comprasPorMes[ym] = comprasPorMes[ym] ?? {};
        comprasPorMes[ym][cod] = arred((comprasPorMes[ym][cod] ?? 0) + Compras.total(c));
      });
    }
    const comercial = ctx.colaboradores.find((c) => c.departamentoId === 'comercial' && c.status === 'ativo') ?? null;
    const fmtCpf = (v) => (typeof Colaboradores !== 'undefined' && Colaboradores.fmtCpf ? Colaboradores.fmtCpf(v) : v);
    // [sup.] legado Iugu — só para a semente ter volume: pessoas e cursos que as faturas legadas usam.
    const fmtCpfCli = (v) => (typeof Clientes !== 'undefined' && Clientes.fmtCpf ? Clientes.fmtCpf(v) : v);
    const fmtCnpjCli = (v) => (typeof Clientes !== 'undefined' && Clientes.fmtCnpj ? Clientes.fmtCnpj(v) : v);
    const alunos = (ctx.clientes.alunos ?? []).filter((a) => a.status !== 'inativo').map((a) => ({ id: a.id, nome: a.nomeSocial || a.nome, documento: fmtCpfCli(a.cpf) }));
    const empresas = (ctx.clientes.empresas ?? []).filter((e) => e.status === 'ativo').map((e) => ({ id: e.id, nome: e.nomeFantasia || e.razaoSocial, documento: fmtCnpjCli(e.cnpj) }));
    const cursos = ctx.cursos.filter((c) => c.status !== 'inativo').map((c) => c.nome);
    return { receitaPagaPorMes, contratosCriadosPorMes, turmasPresenciaisPorMes, comprasPorMes, colaboradorComissao: comercial ? { id: comercial.id, nome: comercial.nome, documento: fmtCpf(comercial.cpf) } : null, alunos, empresas, cursos };
  }

  // Segmento sempre igual à natureza da pessoa (receita) ou null (despesa); acompanha troca de pessoa/documento.
  function sincronizarSegmento(lista) {
    let mudou = false;
    const out = lista.map((l) => {
      const segmento = segmentoDe(l);
      if (segmento === (l.segmento ?? null)) return l;
      mudou = true;
      return { ...l, segmento };
    });
    return mudou ? out : lista;
  }

  // Idempotente: cria o que falta e atualiza o que veio da origem; nunca duplica.
  function sincronizar(lista, ctx = contexto()) {
    let out = sincronizarContratos(lista, ctx);
    out = sincronizarInstrutores(out, ctx);
    out = sincronizarFolha(out, ctx);
    out = sincronizarCompras(out, ctx);
    out = sincronizarSegmento(out);
    out = sincronizarStatusAsaas(out);
    return out;
  }

  // ---------- Persistência ----------

  // Lista sincronizada com Contratos/Instrutores/Folha/Compras; a semente manual entra só na 1ª carga.
  // v2 (07/09/2026): no localStorage ficam só os lançamentos MANUAIS e os derivados (contrato/instrutor/folha) que foram
  // ALTERADOS em relação ao que a sincronização produz sozinha. Os derivados intactos são recriados a cada carga (ids
  // determinísticos) — com o catálogo completo eram ~3.700 lançamentos, quase 4 MB, e estouravam a cota do navegador.
  const VOLATEIS = new Set(['criadoEm', 'atualizadoEm', 'historico']);
  function mesmoLancamento(a, b) {
    const chaves = new Set([...Object.keys(a), ...Object.keys(b)].filter((k) => !VOLATEIS.has(k)));
    return [...chaves].every((k) => JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null));
  }
  function carregar() {
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(CHAVE)); } catch (_) { salvo = null; }
    const ctx = contexto();
    let lista = Array.isArray(salvo) ? salvo : gerarLancamentosManuaisSeed(agregadosParaSemente(ctx), ctx.plano, hoje());
    lista = sincronizar(lista, ctx);
    if (!Array.isArray(salvo)) salvar(lista, ctx);
    return lista;
  }
  function salvar(lista, ctx = contexto()) {
    const derivados = new Map(sincronizar([], ctx).map((l) => [l.id, l]));
    const persistir = lista.filter((l) => { const d = derivados.get(l.id); return !d || !mesmoLancamento(l, d); });
    localStorage.setItem(CHAVE, JSON.stringify(persistir));
  }

  // Movimentos do extrato (todas as contas); semente gerada dos lançamentos quando a chave está vazia.
  function carregarExtrato(lista = null) {
    try {
      const salvo = localStorage.getItem(CHAVE_EXTRATO);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* semente */ }
    // v2 salvo: mantém tudo (saques já processados, ids que os lançamentos conciliados apontam) e só acrescenta os pagamentos.
    let v2 = null;
    try { v2 = JSON.parse(localStorage.getItem(CHAVE_EXTRATO_V2)); } catch (_) { v2 = null; }
    const movs = Array.isArray(v2) ? [...v2, ...gerarExtratoPagamentosSeed(lista ?? carregar(), plano(), hoje())] : gerarExtratoAsaasSeed(lista ?? carregar(), plano(), hoje());
    salvarExtrato(movs);
    return movs;
  }
  function salvarExtrato(movs) { localStorage.setItem(CHAVE_EXTRATO, JSON.stringify(movs)); }

  let _seqLocal = 0;
  // Id para lançamentos manuais (timestamp + sequência, sem colisão na mesma sessão).
  const proximoId = () => `lm-${Date.now().toString(36)}${(++_seqLocal).toString(36)}`;

  // ---------- Natureza da pessoa (PF / PJ) ----------

  const NATUREZAS_PESSOA = [{ id: 'pf', nome: 'Pessoa física', curto: 'PF' }, { id: 'pj', nome: 'Pessoa jurídica', curto: 'PJ' }];
  const NATUREZA_POR_TIPO = { empresa: 'pj', fornecedor: 'pj', aluno: 'pf', responsavel: 'pf', colaborador: 'pf', instrutor: 'pf' };
  // 'pf' | 'pj' | null. Pelos dígitos do documento (11 = CPF, 14 = CNPJ); sem documento cai no tipo da pessoa; sem pessoa é null.
  function naturezaPessoa(pessoa) {
    if (!pessoa) return null;
    const n = digitos(pessoa.documento).length;
    if (n === 11) return 'pf';
    if (n === 14) return 'pj';
    return NATUREZA_POR_TIPO[pessoa.tipo] ?? null;
  }

  // ---------- Filtros e totais ----------

  function filtrar(lista, { tipo = '', de = '', ate = '', campoPeriodo = 'vencimento', situacao: sit = '', forma = '', pessoaTipo = '', natureza = '', pessoaId = '', busca = '', turmaId = '', centroCustoId = '', categoriaId = '', contaBancariaId = '', segmento = '', origem = '', soAsaas = false, incluirCancelados = true } = {}) {
    const ref = hoje();
    const q = normalizar(busca); const qd = digitos(busca);
    const { de: d0, ate: d1 } = periodoDe({ de: de || null, ate: ate || null });
    return lista.filter((l) => {
      if (tipo && l.tipo !== tipo) return false;
      if (!incluirCancelados && l.status === 'cancelado') return false;
      if (de || ate) {
        const campo = campoPeriodo === 'competencia' ? (l.competencia ? `${l.competencia}-15` : null) : l[campoPeriodo];
        if (!campo || campo < d0 || campo > d1) return false;
      }
      if (sit) {
        const s = situacao(l, ref);
        if (sit === 'aberto' ? !['previsto', 'emitido', 'vencido'].includes(s) : s !== sit) return false;
      }
      if (forma && l.forma !== forma) return false;
      if (pessoaTipo && l.pessoa?.tipo !== pessoaTipo) return false;
      if (natureza && naturezaPessoa(l.pessoa) !== natureza) return false;
      if (pessoaId && String(l.pessoa?.id) !== String(pessoaId)) return false;
      if (turmaId && l.turmaId !== turmaId) return false;
      if (centroCustoId && l.centroCustoId !== centroCustoId) return false;
      if (categoriaId && l.categoriaId !== categoriaId) return false;
      if (contaBancariaId && l.contaBancariaId !== contaBancariaId) return false;
      if (segmento && l.segmento !== segmento) return false;
      if (origem && (l.origem?.tipo ?? 'manual') !== origem) return false;
      if (soAsaas && !l.asaas) return false;
      if (q) {
        const alvo = normalizar(`${l.descricao} ${l.pessoa?.nome ?? ''} ${l.origem?.codigo ?? ''} ${l.asaas?.id ?? ''} ${l.nf?.numero ?? ''}`);
        const doc = digitos(l.pessoa?.documento ?? '');
        if (!alvo.includes(q) && !(qd && doc.includes(qd))) return false;
      }
      return true;
    });
  }

  // Totais da lista filtrada (cancelados não somam).
  function totais(lista, ref = hoje()) {
    const vivos = lista.filter((l) => l.status !== 'cancelado');
    const vencidos = vivos.filter((l) => situacao(l, ref) === 'vencido');
    return {
      n: vivos.length, valor: soma(vivos, (l) => l.valor), desconto: soma(vivos, (l) => l.desconto), final: soma(vivos, valorFinal),
      pago: soma(vivos.filter((l) => l.status === 'pago'), valorFinal), aberto: soma(vivos.filter(emAberto), valorFinal),
      vencido: soma(vencidos, valorFinal), nVencidos: vencidos.length,
    };
  }

  // Ordena por 'vencimento' | 'pessoa' | 'valor' | 'status' | 'pagoEm' | 'descricao'.
  function ordenar(lista, campo = 'vencimento', direcao = 'asc') {
    const ordemSit = { vencido: 0, emitido: 1, previsto: 2, pago: 3, cancelado: 4 };
    const chave = { vencimento: (l) => l.vencimento, pessoa: (l) => normalizar(l.pessoa?.nome), valor: (l) => valorFinal(l), status: (l) => ordemSit[situacao(l)], pagoEm: (l) => l.pagoEm ?? '', descricao: (l) => normalizar(l.descricao) }[campo] ?? ((l) => l.vencimento);
    const s = direcao === 'desc' ? -1 : 1;
    return [...lista].sort((a, b) => { const x = chave(a); const y = chave(b); return (x < y ? -1 : x > y ? 1 : 0) * s || a.id.localeCompare(b.id); });
  }

  // ---------- CRUD ----------

  const numero = (v) => (typeof v === 'number' ? v : v === '' || v == null ? null : Number(String(v).replace(/\./g, '').replace(',', '.')));

  function validar(dados, p = plano(), atual = null) {
    const erros = [];
    const editaveis = atual ? camposEditaveis(atual) : CAMPOS_TODOS;
    const pode = (campo) => editaveis.includes(campo);
    if (pode('tipo') && !TIPOS.some((t) => t.id === dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha receita ou despesa.' });
    if (pode('descricao') && !String(dados.descricao ?? '').trim()) erros.push({ campo: 'descricao', mensagem: 'Informe a descrição.' });
    const valor = numero(dados.valor); const desconto = numero(dados.desconto) ?? 0;
    if (pode('valor') && (valor == null || Number.isNaN(valor) || valor <= 0)) erros.push({ campo: 'valor', mensagem: 'Informe um valor maior que zero.' });
    if (pode('desconto') && (Number.isNaN(desconto) || desconto < 0 || (valor != null && desconto > valor))) erros.push({ campo: 'desconto', mensagem: 'Desconto entre zero e o valor.' });
    if (pode('vencimento') && !/^\d{4}-\d{2}-\d{2}$/.test(String(dados.vencimento ?? ''))) erros.push({ campo: 'vencimento', mensagem: 'Informe o vencimento.' });
    if (pode('competencia') && dados.competencia && !/^\d{4}-\d{2}$/.test(String(dados.competencia))) erros.push({ campo: 'competencia', mensagem: 'Competência no formato mês/ano.' });
    if (pode('forma') && !FORMAS.some((f) => f.id === dados.forma)) erros.push({ campo: 'forma', mensagem: 'Escolha a forma.' });
    const cat = categoriaDe(p, dados.categoriaId);
    if (!cat) erros.push({ campo: 'categoriaId', mensagem: 'Escolha a categoria.' });
    else if ((dados.tipo ?? atual?.tipo) && cat.tipo !== (dados.tipo ?? atual?.tipo)) erros.push({ campo: 'categoriaId', mensagem: `Categoria de ${cat.tipo}; o lançamento é ${dados.tipo ?? atual?.tipo}.` });
    const centro = centroDe(p, dados.centroCustoId);
    if ((dados.tipo ?? atual?.tipo) === 'despesa' && (!centro || tipoCentro(centro) !== 'custo')) erros.push({ campo: 'centroCustoId', mensagem: 'Escolha o centro de custo.' });
    if (!contaDe(p, dados.contaBancariaId)) erros.push({ campo: 'contaBancariaId', mensagem: 'Escolha a conta bancária.' });
    if (pode('pessoa')) {
      const pe = dados.pessoa;
      if (!pe || !String(pe.nome ?? '').trim()) erros.push({ campo: 'pessoa', mensagem: 'Informe a pessoa (aluno, empresa, fornecedor…).' });
      else if (!TIPOS_PESSOA.some((t) => t.id === pe.tipo)) erros.push({ campo: 'pessoa', mensagem: 'Escolha o tipo da pessoa.' });
    }
    if (dados.nf && (!String(dados.nf.numero ?? '').trim() || !dados.nf.emitidaEm)) erros.push({ campo: 'nf', mensagem: 'NF precisa de número e data de emissão.' });
    return erros;
  }

  function incluir(lista, dados) {
    const em = agora();
    const l = lancamentoBase({
      id: dados.id ?? proximoId(), tipo: dados.tipo, descricao: String(dados.descricao).trim(), valor: arred(numero(dados.valor)), desconto: arred(numero(dados.desconto) ?? 0),
      competencia: dados.competencia || mesDe(dados.vencimento), vencimento: dados.vencimento, forma: dados.forma,
      categoriaId: dados.categoriaId, centroCustoId: dados.tipo === 'receita' ? null : dados.centroCustoId, contaBancariaId: dados.contaBancariaId,
      pessoa: dados.pessoa ? { tipo: dados.pessoa.tipo, id: dados.pessoa.id ?? null, nome: String(dados.pessoa.nome).trim(), documento: dados.pessoa.documento ?? '' } : null,
      turmaId: dados.turmaId || null, cursoId: dados.cursoId || null, nf: dados.nf ?? null, observacao: String(dados.observacao ?? '').trim(),
      status: dados.status ?? 'previsto', pagoEm: dados.pagoEm ?? null, criadoEm: em, atualizadoEm: em, historico: [{ em, texto: 'Lançamento criado' }],
    });
    l.segmento = segmentoDe(l);
    return { lista: [...lista, l], lancamento: l };
  }

  // Atualiza só os campos editáveis para a origem (contrato/instrutor: categoria, centro, conta, observação, NF).
  function atualizar(lista, id, dados) {
    return lista.map((l) => {
      if (l.id !== id) return l;
      const permitidos = camposEditaveis(l);
      const novo = { ...l };
      permitidos.forEach((k) => {
        if (!(k in dados)) return;
        if (k === 'valor' || k === 'desconto') novo[k] = arred(numero(dados[k]) ?? 0);
        else if (k === 'descricao' || k === 'observacao') novo[k] = String(dados[k] ?? '').trim();
        else if (k === 'pessoa') novo.pessoa = dados.pessoa ? { tipo: dados.pessoa.tipo, id: dados.pessoa.id ?? null, nome: String(dados.pessoa.nome).trim(), documento: dados.pessoa.documento ?? '' } : null;
        else novo[k] = dados[k] ?? null;
      });
      if (permitidos.includes('competencia') && !novo.competencia) novo.competencia = mesDe(novo.vencimento);
      novo.segmento = segmentoDe(novo);
      if (novo.tipo === 'receita') novo.centroCustoId = ehContrato(l) ? l.centroCustoId : null; // o centro de receita vem da venda
      return registrar(novo, 'Lançamento editado');
    });
  }

  function cancelar(lista, id, motivo = '') {
    return lista.map((l) => (l.id === id && podeCancelar(l) ? registrar({ ...l, status: 'cancelado', asaas: l.asaas ? { ...l.asaas, status: 'REFUNDED' } : null }, `Cancelado${motivo ? ` — ${motivo}` : ''}`) : l));
  }
  const remover = (lista, id) => lista.filter((l) => !(l.id === id && podeRemover(l)));

  // ---------- Baixa e estorno ----------

  // Baixa (unitária). Contrato → Contratos.registrarPagamento + salvar; instrutor → Instrutores.registrarPagamento (só com NF).
  function baixar(lista, id, { pagoEm = hoje(), contaBancariaId = null, valorPago = null, forma = null, observacao = '' } = {}) {
    const l = porId(lista, id);
    if (!l) return { lista, erro: 'Lançamento não encontrado.' };
    const ok = podeBaixar(l);
    if (!ok.ok) return { lista, erro: ok.motivo };
    const vf = valorFinal(l);
    const vp = valorPago == null || valorPago === '' ? vf : arred(numero(valorPago));
    let aviso = null;
    const extras = {};
    if (Math.abs(vp - vf) > 0.005) {
      extras.valorPago = vp;
      aviso = `Valor pago (${fmtMoedaCentavos(vp)}) diferente do previsto (${fmtMoedaCentavos(vf)}).`;
    }
    if (ehContrato(l) && typeof Contratos !== 'undefined') {
      const cs = Contratos.registrarPagamento(Contratos.carregar(), l.origem.contratoId, l.origem.parcelaN, pagoEm);
      Contratos.salvar(cs);
      aviso = aviso ?? `Baixa refletida na parcela ${l.origem.parcelaN}/${l.origem.totalParcelas} da venda ${l.origem.codigo}.`;
    }
    if (ehInstrutor(l) && typeof Instrutores !== 'undefined') {
      Instrutores.salvar(Instrutores.registrarPagamento(Instrutores.carregar(), l.origem.instrutorId, l.origem.pagamentoId, pagoEm));
    }
    const texto = `Baixa registrada em ${fmtData(pagoEm)}${observacao ? ` — ${observacao}` : ''}`;
    let out = lista.map((x) => (x.id === id ? registrar({ ...x, status: 'pago', pagoEm, contaBancariaId: contaBancariaId ?? x.contaBancariaId, forma: forma ?? x.forma, observacao: observacao ? [x.observacao, observacao].filter(Boolean).join(' · ') : x.observacao, ...extras, asaas: x.asaas ? { ...x.asaas, status: 'RECEIVED' } : null }, texto) : x));
    if (ehContrato(l) || ehInstrutor(l)) out = sincronizar(out);
    return { lista: out, aviso };
  }

  function baixarEmMassa(lista, ids, dados = {}) {
    let out = lista; const erros = []; let n = 0;
    ids.forEach((id) => { const r = baixar(out, id, dados); if (r.erro) erros.push({ id, mensagem: r.erro }); else { out = r.lista; n += 1; } });
    return { lista: out, n, erros };
  }

  // Estorno: volta para emitido (se tinha cobrança) ou previsto; reflete no contrato/instrutor.
  function estornar(lista, id) {
    const l = porId(lista, id);
    if (!l || !podeEstornar(l)) return { lista, erro: 'Só lançamentos pagos podem ser estornados.' };
    if (ehContrato(l) && typeof Contratos !== 'undefined') Contratos.salvar(Contratos.estornarPagamento(Contratos.carregar(), l.origem.contratoId, l.origem.parcelaN));
    if (ehInstrutor(l) && typeof Instrutores !== 'undefined') {
      Instrutores.salvar(Instrutores.carregar().map((i) => (i.id === l.origem.instrutorId ? { ...i, pagamentos: i.pagamentos.map((pg) => (pg.id === l.origem.pagamentoId ? { ...pg, pagoEm: null } : pg)) } : i)));
    }
    let out = lista.map((x) => {
      if (x.id !== id) return x;
      const { valorPago, ...resto } = x;
      return registrar({ ...resto, status: x.asaas || x.nf ? 'emitido' : 'previsto', pagoEm: null, conciliado: null, asaas: x.asaas ? { ...x.asaas, status: x.vencimento < hoje() ? 'OVERDUE' : 'PENDING' } : null }, 'Pagamento estornado');
    });
    if (ehContrato(l) || ehInstrutor(l)) out = sincronizar(out);
    return { lista: out };
  }

  // NF: no instrutor libera o pagamento (Instrutores.registrarNf); na receita é a NF de saída.
  function registrarNf(lista, id, { numero: num, emitidaEm }) {
    const l = porId(lista, id);
    if (!l) return lista;
    const nf = { numero: String(num).trim(), emitidaEm };
    if (ehInstrutor(l) && typeof Instrutores !== 'undefined') {
      Instrutores.salvar(Instrutores.registrarNf(Instrutores.carregar(), l.origem.instrutorId, l.origem.pagamentoId, nf));
      return sincronizar(lista.map((x) => (x.id === id ? registrar({ ...x, nf }, `NF ${nf.numero} registrada`) : x)));
    }
    return lista.map((x) => (x.id === id ? registrar({ ...x, nf, status: x.status === 'previsto' && x.tipo === 'despesa' ? 'emitido' : x.status }, `NF ${nf.numero} registrada`) : x));
  }

  // ---------- Asaas (simulado) ----------

  // Cria a cobrança (boleto/Pix) no sandbox; o lançamento vira emitido e a parcela do contrato também.
  function gerarCobranca(lista, id, { tipo = 'BOLETO' } = {}) {
    const l = porId(lista, id);
    if (!l) return { lista, erro: 'Lançamento não encontrado.' };
    if (l.tipo !== 'receita') return { lista, erro: 'Despesa não gera cobrança no Asaas.' };
    if (!emAberto(l)) return { lista, erro: 'Só lançamentos em aberto geram cobrança.' };
    if (l.asaas && l.asaas.status !== 'REFUNDED') return { lista, erro: 'Já existe uma cobrança para este lançamento.' };
    const t = tipo === 'PIX' ? 'PIX' : 'BOLETO';
    const asaas = montarAsaas(lancIdAsaas(`${l.id}:${Date.now()}`), t, valorFinal(l), hoje(), l.vencimento < hoje() ? 'OVERDUE' : 'PENDING');
    if (ehContrato(l) && typeof Contratos !== 'undefined') {
      const ctx = contexto();
      Contratos.salvar(Contratos.emitirBoletos(Contratos.carregar(), ctx.ctxContratos, l.origem.contratoId, [l.origem.parcelaN]));
    }
    let out = lista.map((x) => (x.id === id ? registrar({ ...x, asaas, status: 'emitido', forma: t === 'PIX' ? 'pix' : 'boleto', contaBancariaId: contaAsaas(plano())?.id ?? x.contaBancariaId }, `Cobrança Asaas ${t === 'PIX' ? 'Pix' : 'boleto'} gerada (${asaas.id})`) : x));
    if (ehContrato(l)) out = sincronizar(out);
    return { lista: out, asaas };
  }

  // Webhook PAYMENT_RECEIVED: marca a cobrança recebida e dá baixa na conta Asaas.
  function simularPagamentoAsaas(lista, id, pagoEm = hoje()) {
    const l = porId(lista, id);
    if (!l?.asaas) return { lista, erro: 'Lançamento sem cobrança Asaas.' };
    if (l.status === 'pago') return { lista, erro: 'Já está pago.' };
    const r = baixar(lista, id, { pagoEm, contaBancariaId: contaAsaas(plano())?.id ?? null, forma: l.asaas.tipo === 'PIX' ? 'pix' : 'boleto', observacao: 'Webhook Asaas PAYMENT_RECEIVED' });
    if (r.erro) return r;
    return { lista: r.lista.map((x) => (x.id === id ? { ...x, asaas: { ...x.asaas, status: 'RECEIVED' } } : x)), aviso: r.aviso };
  }

  // PENDING vencido → OVERDUE; pago → RECEIVED; cancelado → REFUNDED.
  function sincronizarStatusAsaas(lista, ref = hoje()) {
    let mudou = false;
    const out = lista.map((l) => {
      if (!l.asaas) return l;
      const alvo = l.status === 'pago' ? 'RECEIVED' : l.status === 'cancelado' ? 'REFUNDED' : l.vencimento < ref ? 'OVERDUE' : 'PENDING';
      if (l.asaas.status === alvo) return l;
      mudou = true;
      return { ...l, asaas: { ...l.asaas, status: alvo } };
    });
    return mudou ? out : lista;
  }

  // ---------- Extrato e conciliação ----------

  // Movimentos de uma conta no período com saldo acumulado desde `saldoInicial` da conta.
  function extrato(contaId, { de = null, ate = null } = {}, movimentos = null, p = plano()) {
    const conta = contaDe(p, contaId);
    const movs = (movimentos ?? carregarExtrato()).filter((m) => m.contaId === contaId).sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
    const periodo = periodoDe({ de, ate });
    const abertura = conta?.saldoInicialEm ?? '0000-01-01';
    // Movimento anterior à abertura já está dentro de `saldoInicial`: o extrato nunca começa antes dela.
    const d0 = periodo.de < abertura ? abertura : periodo.de;
    const d1 = periodo.ate;
    const sinal = (m) => (m.tipo === 'credito' ? m.valor : -m.valor);
    const anteriores = movs.filter((m) => m.data < d0 && m.data >= abertura);
    const saldoInicial = arred((conta?.saldoInicial ?? 0) + anteriores.reduce((s, m) => s + sinal(m), 0));
    let saldo = saldoInicial;
    const linhas = movs.filter((m) => m.data >= d0 && m.data <= d1).map((m) => { saldo = arred(saldo + sinal(m)); return { ...m, saldo }; });
    return {
      conta, de: d0, ate: d1, saldoInicial, movimentos: linhas, saldoFinal: saldo,
      creditos: soma(linhas.filter((m) => m.tipo === 'credito'), (m) => m.valor), debitos: soma(linhas.filter((m) => m.tipo === 'debito'), (m) => m.valor),
      n: linhas.length,
    };
  }

  // Para cada movimento: conciliado | sugestao | sem_lancamento | transferencia | taxa; e lançamentos pagos na conta sem movimento.
  // Período padrão: últimos 90 dias (o mesmo do extrato da semente). Taxas do gateway por cobrança não têm lançamento
  // próprio (entram consolidadas no lançamento mensal 740), por isso ganham situação própria.
  function conciliacao(lista, movimentos, { contaId = null, de = null, ate = null } = {}) {
    const { de: d0, ate: d1 } = periodoDe({ de: de ?? somarDias(hoje(), -90), ate: ate ?? hoje() });
    const movs = movimentos.filter((m) => (!contaId || m.contaId === contaId) && m.data >= d0 && m.data <= d1).sort((a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id));
    const pagos = lista.filter((l) => l.status === 'pago' && l.pagoEm && (!contaId || l.contaBancariaId === contaId));
    const conciliadosPorMov = new Map(pagos.filter((l) => l.conciliado?.movimentoId).map((l) => [l.conciliado.movimentoId, l]));
    const usados = new Set([...conciliadosPorMov.values()].map((l) => l.id));
    const itens = movs.map((m) => {
      const ligado = conciliadosPorMov.get(m.id);
      if (ligado) return { movimento: m, situacao: 'conciliado', lancamento: ligado };
      if (m.categoriaSugerida === 'transferencia' || m.referencia === 'transf') return { movimento: m, situacao: 'transferencia', lancamento: null };
      if (m.tipo === 'debito' && m.referencia && (m.referencia.startsWith('pay_') || m.referencia === 'taxa')) return { movimento: m, situacao: 'taxa', lancamento: null };
      const tipoLanc = m.tipo === 'credito' ? 'receita' : 'despesa';
      const candidatos = pagos.filter((l) => l.tipo === tipoLanc && !l.conciliado && !usados.has(l.id) && l.contaBancariaId === m.contaId);
      let sug = m.referencia && m.referencia.startsWith('pay_') && m.tipo === 'credito' ? candidatos.find((l) => l.asaas?.id === m.referencia) ?? null : null;
      const porId = Boolean(sug);
      if (!sug) {
        // Mesmo valor em até 3 dias; entre empates, primeiro quem tem o nome na descrição do movimento, depois a data mais perto
        // (dois boletos de R$ 1.096,66 com 2 dias de diferença não trocam de dono).
        const desc = normalizar(m.descricao);
        const temNome = (l) => (l.pessoa?.nome && desc.includes(normalizar(l.pessoa.nome)) ? 1 : 0);
        const longe = (l) => Math.abs(diasEntre(l.pagoEm, m.data));
        sug = candidatos.filter((l) => Math.abs(valorFinal(l) - m.valor) <= 0.01 && longe(l) <= 3)
          .sort((x, y) => temNome(y) - temNome(x) || longe(x) - longe(y))[0] ?? null;
      }
      if (!sug) return { movimento: m, situacao: 'sem_lancamento', lancamento: null };
      usados.add(sug.id);
      // `motivo.dias` > 0: o movimento caiu depois da baixa.
      return { movimento: m, situacao: 'sugestao', lancamento: sug, motivo: { porId, dias: diasEntre(sug.pagoEm, m.data) } };
    });
    const idsMov = new Set(movimentos.map((m) => m.id));
    const semMovimento = pagos.filter((l) => l.pagoEm >= d0 && l.pagoEm <= d1 && !usados.has(l.id) && !(l.conciliado && idsMov.has(l.conciliado.movimentoId)))
      .filter((l) => !contaId || l.contaBancariaId === contaId)
      .sort((a, b) => b.pagoEm.localeCompare(a.pagoEm));
    const conta = (s) => itens.filter((i) => i.situacao === s).length;
    return {
      itens, semMovimento,
      resumo: { movimentos: itens.length, conciliados: conta('conciliado'), automaticos: itens.filter((i) => i.lancamento?.conciliado?.automatico).length, comSugestao: conta('sugestao'), semLancamento: conta('sem_lancamento'), transferencias: conta('transferencia'), taxas: conta('taxa'), semMovimento: semMovimento.length },
    };
  }

  function conciliar(lista, lancamentoId, movimentoId) {
    return lista.map((l) => (l.id === lancamentoId && l.status === 'pago' ? registrar({ ...l, conciliado: { movimentoId, em: agora() } }, `Conciliado com o movimento ${movimentoId}`) : l));
  }
  // Guarda o movimento desfeito para conciliarPeloId não religar o par sozinho.
  function desconciliar(lista, lancamentoId) {
    return lista.map((l) => (l.id === lancamentoId && l.conciliado ? registrar({ ...l, conciliado: null, conciliacaoDesfeita: l.conciliado.movimentoId }, 'Conciliação desfeita') : l));
  }
  // Crédito com o id da cobrança Asaas é o mesmo pagamento: concilia sem pedir confirmação.
  function conciliarPeloId(lista, movimentos) {
    const ligados = new Set(lista.filter((l) => l.conciliado?.movimentoId).map((l) => l.conciliado.movimentoId));
    const porCobranca = new Map(lista.filter((l) => l.status === 'pago' && !l.conciliado && l.asaas?.id).map((l) => [l.asaas.id, l]));
    const pares = new Map();
    movimentos.forEach((m) => {
      if (m.tipo !== 'credito' || !m.referencia?.startsWith('pay_') || ligados.has(m.id)) return;
      const l = porCobranca.get(m.referencia);
      if (!l || l.contaBancariaId !== m.contaId || l.conciliacaoDesfeita === m.id || pares.has(l.id)) return;
      pares.set(l.id, m.id);
    });
    if (!pares.size) return { lista, n: 0 };
    const out = lista.map((l) => (pares.has(l.id) ? registrar({ ...l, conciliado: { movimentoId: pares.get(l.id), em: agora(), automatico: true } }, `Conciliado sozinho: o crédito ${l.asaas.id} é desta cobrança Asaas`) : l));
    return { lista: out, n: pares.size };
  }
  // Concilia todas as sugestões de uma vez.
  function conciliarSugestoes(lista, movimentos, opcoes = {}) {
    const c = conciliacao(lista, movimentos, opcoes);
    let out = lista; let n = 0;
    c.itens.filter((i) => i.situacao === 'sugestao').forEach((i) => { out = conciliar(out, i.lancamento.id, i.movimento.id); n += 1; });
    return { lista: out, n };
  }
  // Cria um lançamento já pago a partir de um movimento sem lançamento e concilia.
  function criarDoMovimento(lista, movimento, dados = {}) {
    const p = plano();
    const tipo = movimento.tipo === 'credito' ? 'receita' : 'despesa';
    const catPadrao = categoriaDe(p, movimento.categoriaSugerida) ?? categoriaPorCodigo(p, tipo === 'receita' ? '190' : '740');
    // Receita sem venda fica sem centro; o fallback de centro vale só para despesa (e só centro de custo).
    const escolhido = centroDe(p, dados.centroCustoId);
    const centro = tipo === 'despesa' ? (escolhido && tipoCentro(escolhido) === 'custo' ? escolhido : centroDoDepartamento(p, 'administrativo')) : null;
    const categoriaId = dados.categoriaId ?? catPadrao?.id ?? null;
    const r = incluir(lista, {
      tipo, descricao: dados.descricao ?? movimento.descricao, valor: movimento.valor, desconto: 0, competencia: mesDe(movimento.data), vencimento: movimento.data,
      forma: dados.forma ?? (/pix/i.test(movimento.descricao) ? 'pix' : /boleto/i.test(movimento.descricao) ? 'boleto' : 'transferencia'),
      categoriaId, centroCustoId: centro?.id ?? null, contaBancariaId: movimento.contaId,
      pessoa: dados.pessoa ?? { tipo: tipo === 'receita' ? 'aluno' : 'fornecedor', id: null, nome: movimento.descricao.replace(/^.*?[–-]\s*/, '').trim() || movimento.descricao, documento: '' },
      observacao: dados.observacao ?? `Criado a partir do extrato (${movimento.id})`, status: 'pago', pagoEm: movimento.data,
    });
    return { lista: conciliar(r.lista, r.lancamento.id, movimento.id), lancamento: r.lancamento };
  }

  // ---------- Saque automático (transferência automática Asaas → banco) ----------
  //
  // Estilo "Transferência automática" do Asaas real: uma config única; todo dia de saque (dia útil,
  // quando `diasUteis`) no `horario` configurado, transfere para `contaDestinoId` o que passar de
  // `saldoMinimo`, desde que o valor seja ≥ `valorMinimo`. Cada saque concluído vira DOIS movimentos
  // do extrato (débito na Asaas + crédito no destino) com `referencia: 'saque'` e
  // `categoriaSugerida: 'transferencia'` — assim conciliacao() já os classifica como 'transferencia' e
  // balanco() já os soma nas transferências da conta, sem mudar nada lá.
  // Dia D só é processado se D < hoje, ou D == hoje e `agora` já passou do horário. Dias não úteis não
  // geram registro; dia de saque sem valor suficiente vira saque `pulado` (com motivo).
  // Chave: CHAVE_SAQUES → { config, saques }. Tudo puro, exceto carregarSaques/salvarSaques.

  const HORARIO_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const diaSemana = (iso) => new Date(`${iso}T12:00:00`).getDay();
  const ehFeriado = (iso) => typeof Feriados !== 'undefined' && typeof Feriados.nome === 'function' && Feriados.nome(iso) !== null;
  const ehDiaUtil = (iso) => { const d = diaSemana(iso); return d !== 0 && d !== 6 && !ehFeriado(iso); };
  // Data/hora locais de um Date (mesmo critério de hoje()).
  const dataDe = (dt) => new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const horaDe = (dt) => `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  const contaDestinoPadrao = (p) => p.contasBancarias.find((c) => c.status === 'ativo' && c.padraoPagamento && c.tipo !== 'gateway') ?? p.contasBancarias.find((c) => c.status === 'ativo' && c.tipo !== 'gateway') ?? null;
  const nomeBanco = (c) => instituicaoDaConta(c)?.nome ?? c?.banco ?? c?.nome ?? '';
  const descricaoConta = (c) => `${nomeBanco(c)}${c?.agencia ? ` ag. ${c.agencia}` : ''}${c?.conta ? ` c/c ${c.conta}` : ''}`;

  function configSaquesSemente(p = plano()) {
    const em = `${somarDias(hoje(), -14)}T09:00:00`;
    return { ...clonar(SAQUES_ASAAS_SEED_CONFIG), contaDestinoId: contaDestinoPadrao(p)?.id ?? null, criadoEm: em, atualizadoEm: em, ultimaExecucaoEm: null };
  }
  function carregarSaques() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_SAQUES));
      if (salvo && salvo.config) return { config: salvo.config, saques: Array.isArray(salvo.saques) ? salvo.saques : [] };
    } catch (_) { /* semente */ }
    const dados = { config: configSaquesSemente(), saques: [] };
    salvarSaques(dados);
    return dados;
  }
  function salvarSaques(dados) { localStorage.setItem(CHAVE_SAQUES, JSON.stringify(dados)); }

  function validarSaques(config, p = plano()) {
    const erros = [];
    const destino = contaDe(p, config?.contaDestinoId);
    const asaas = contaAsaas(p);
    if (!destino) erros.push({ campo: 'contaDestinoId', mensagem: 'Escolha a conta bancária de destino.' });
    else if (destino.status !== 'ativo') erros.push({ campo: 'contaDestinoId', mensagem: 'A conta de destino está inativa.' });
    else if (destino.id === asaas?.id || destino.tipo === 'gateway') erros.push({ campo: 'contaDestinoId', mensagem: 'O destino precisa ser diferente da conta Asaas.' });
    if (!HORARIO_RE.test(String(config?.horario ?? ''))) erros.push({ campo: 'horario', mensagem: 'Horário no formato HH:MM (ex.: 17:00).' });
    const sm = Number(config?.saldoMinimo);
    if (config?.saldoMinimo === '' || config?.saldoMinimo == null || Number.isNaN(sm) || sm < 0) erros.push({ campo: 'saldoMinimo', mensagem: 'Saldo mínimo a manter na Asaas: zero ou mais.' });
    const vm = Number(config?.valorMinimo);
    if (config?.valorMinimo === '' || config?.valorMinimo == null || Number.isNaN(vm) || vm <= 0) erros.push({ campo: 'valorMinimo', mensagem: 'Valor mínimo do saque maior que zero.' });
    return erros;
  }

  // Saldo da conta Asaas até `ate` (saldo inicial da conta + movimentos desde `saldoInicialEm`).
  function saldoAsaas(movimentos, p = plano(), ate = hoje()) {
    const conta = contaAsaas(p);
    if (!conta) return 0;
    return extrato(conta.id, { de: conta.saldoInicialEm ?? null, ate }, movimentos ?? [], p).saldoFinal;
  }
  const ehDiaDeSaque = (config, data) => Boolean(config?.ativo) && (!config.diasUteis || ehDiaUtil(data));
  // Último dia que já pode ser processado em `agora`: hoje se o horário já passou, senão ontem.
  const ultimoDiaProcessavel = (config, agora) => { const d = dataDe(agora); return horaDe(agora) >= config.horario ? d : somarDias(d, -1); };

  function novoIdSaque(saques, data) {
    const base = `saq-${data.replace(/-/g, '')}`;
    let n = saques.filter((s) => s.data === data).length + 1;
    while (saques.some((s) => s.id === `${base}-${n}`)) n += 1;
    return `${base}-${n}`;
  }
  // Os dois movimentos do extrato de um saque concluído.
  function movimentosDoSaque(saque, p) {
    const destino = contaDe(p, saque.contaDestinoId);
    const rotulo = saque.origem === 'manual' ? 'manual' : 'automático';
    const comum = { data: saque.data, valor: saque.valor, referencia: 'saque', categoriaSugerida: 'transferencia', saqueId: saque.id };
    return [
      { id: `mov-${saque.id}-d`, contaId: saque.contaOrigemId, tipo: 'debito', descricao: `Saque ${rotulo} → ${descricaoConta(destino)}`, ...comum },
      { id: `mov-${saque.id}-c`, contaId: saque.contaDestinoId, tipo: 'credito', descricao: `TED recebida — Asaas Gestão Financeira (saque ${rotulo})`, ...comum },
    ];
  }

  // Processa os dias pendentes (de ultimaExecucaoEm + 1, ou de criadoEm, até o último dia processável).
  // O saldo de cada dia inclui os saques gerados nos dias anteriores. Idempotente. `novos` = só os concluídos desta chamada.
  function processarSaques(dados, movimentos, p = plano(), agora = new Date()) {
    const config = dados?.config;
    const nada = { dados, movimentos, novos: [] };
    if (!config?.ativo || validarSaques(config, p).length) return nada;
    const asaas = contaAsaas(p);
    if (!asaas) return nada;
    const inicio = config.ultimaExecucaoEm ? somarDias(config.ultimaExecucaoEm, 1) : String(config.criadoEm ?? hoje()).slice(0, 10);
    const fim = ultimoDiaProcessavel(config, agora);
    if (inicio > fim) return nada;
    const saques = [...(dados.saques ?? [])];
    let movs = [...(movimentos ?? [])];
    const novos = [];
    const saldoMinimo = arred(config.saldoMinimo); const valorMinimo = arred(config.valorMinimo);
    for (let d = inicio; d <= fim; d = somarDias(d, 1)) {
      if (!ehDiaDeSaque(config, d)) continue;
      const saldoAntes = saldoAsaas(movs, p, d);
      const valor = arred(saldoAntes - saldoMinimo);
      const base = { id: novoIdSaque(saques, d), data: d, horario: config.horario, contaOrigemId: asaas.id, contaDestinoId: config.contaDestinoId, origem: 'automatico', criadoEm: `${d}T${config.horario}:00` };
      if (valor < valorMinimo) {
        const motivo = saldoAntes < saldoMinimo
          ? `Saldo de ${fmtMoedaCentavos(saldoAntes)} abaixo do mínimo de ${fmtMoedaCentavos(saldoMinimo)}`
          : `Valor de ${fmtMoedaCentavos(Math.max(0, valor))} abaixo do mínimo de ${fmtMoedaCentavos(valorMinimo)}`;
        saques.push({ ...base, valor: 0, saldoAntes, saldoDepois: saldoAntes, status: 'pulado', motivo });
        continue;
      }
      const saque = { ...base, valor, saldoAntes, saldoDepois: arred(saldoAntes - valor), status: 'concluido', motivo: null };
      saques.push(saque); novos.push(saque);
      movs = movs.concat(movimentosDoSaque(saque, p));
    }
    return { dados: { ...dados, config: { ...config, ultimaExecucaoEm: fim }, saques }, movimentos: movs, novos };
  }

  // Saque manual imediato. Não mexe em ultimaExecucaoEm (o automático do dia continua valendo).
  function sacarAgora(dados, movimentos, p = plano(), { valor, contaDestinoId = dados?.config?.contaDestinoId, data = hoje(), agora = new Date() } = {}) {
    const asaas = contaAsaas(p);
    if (!asaas) return { erro: 'Conta Asaas não encontrada no plano de contas.' };
    const v = arred(numero(valor));
    if (!(v > 0)) return { erro: 'Informe um valor maior que zero.' };
    const destino = contaDe(p, contaDestinoId);
    if (!destino) return { erro: 'Escolha a conta bancária de destino.' };
    if (destino.status !== 'ativo') return { erro: 'A conta de destino está inativa.' };
    if (destino.id === asaas.id || destino.tipo === 'gateway') return { erro: 'O destino precisa ser diferente da conta Asaas.' };
    const saldoAntes = saldoAsaas(movimentos, p, data);
    if (v > saldoAntes + 0.005) return { erro: `Valor acima do saldo disponível na Asaas (${fmtMoedaCentavos(saldoAntes)}).` };
    const saques = dados?.saques ?? [];
    const saque = {
      id: novoIdSaque(saques, data), data, horario: horaDe(agora), valor: v, saldoAntes, saldoDepois: arred(saldoAntes - v),
      contaOrigemId: asaas.id, contaDestinoId: destino.id, origem: 'manual', status: 'concluido', motivo: null, criadoEm: `${dataDe(agora)}T${horaDe(agora)}:${String(agora.getSeconds()).padStart(2, '0')}`,
    };
    return { dados: { ...dados, saques: [...saques, saque] }, movimentos: [...(movimentos ?? []), ...movimentosDoSaque(saque, p)], saque };
  }

  // Próximo saque automático: data (hoje se ainda não passou do horário e é dia de saque; senão o próximo dia de saque)
  // e valor previsto com o saldo de agora. Config inativa → data null.
  function previsaoSaque(dados, movimentos, p = plano(), agora = new Date()) {
    const config = dados?.config ?? {};
    const hj = dataDe(agora);
    const saldoAtual = saldoAsaas(movimentos, p, hj);
    const saldoMinimo = arred(config.saldoMinimo ?? 0); const valorMinimo = arred(config.valorMinimo ?? 0);
    if (!config.ativo) return { data: null, horario: config.horario ?? null, valor: 0, saldoAtual, saldoMinimo, motivo: 'Saque automático pausado' };
    let data = horaDe(agora) < config.horario && ehDiaDeSaque(config, hj) ? hj : null;
    for (let d = somarDias(hj, 1), i = 0; !data && i < 60; d = somarDias(d, 1), i += 1) if (ehDiaDeSaque(config, d)) data = d;
    const disponivel = arred(saldoAtual - saldoMinimo);
    if (disponivel >= valorMinimo) return { data, horario: config.horario, valor: disponivel, saldoAtual, saldoMinimo, motivo: null };
    const motivo = saldoAtual < saldoMinimo
      ? `Saldo de ${fmtMoedaCentavos(saldoAtual)} abaixo do mínimo de ${fmtMoedaCentavos(saldoMinimo)}`
      : `Valor de ${fmtMoedaCentavos(Math.max(0, disponivel))} abaixo do mínimo de ${fmtMoedaCentavos(valorMinimo)}`;
    return { data, horario: config.horario, valor: 0, saldoAtual, saldoMinimo, motivo };
  }
  const ultimoSaque = (dados) => [...(dados?.saques ?? [])].filter((s) => s.status === 'concluido').sort((a, b) => a.data.localeCompare(b.data) || String(a.criadoEm).localeCompare(String(b.criadoEm))).pop() ?? null;

  // ---------- Consolidações ----------

  // Lançamentos que contam no período pelo regime: caixa = pagos por pagoEm; competência = não cancelados por competência.
  function noPeriodo(lista, { de = null, ate = null, regime = 'caixa' } = {}) {
    const { de: d0, ate: d1 } = periodoDe({ de, ate });
    if (regime === 'competencia') return lista.filter((l) => l.status !== 'cancelado' && l.competencia && `${l.competencia}-15` >= d0 && `${l.competencia}-15` <= d1);
    return lista.filter((l) => l.status === 'pago' && l.pagoEm && l.pagoEm >= d0 && l.pagoEm <= d1);
  }
  const mesDoRegime = (l, regime) => (regime === 'competencia' ? l.competencia : mesDe(l.pagoEm));

  // Série por mês: receita, despesa, resultado, B2C/B2B e acumulado.
  function serieMensal(lista, { de = null, ate = null, regime = 'caixa' } = {}) {
    const per = de && ate ? { de, ate } : periodoPadrao();
    const { de: d0, ate: d1 } = periodoDe(per);
    const meses = mesesEntre(mesDe(d0), mesDe(d1));
    const acc = Object.fromEntries(meses.map((m) => [m, { mes: m, rotulo: rotuloMes(m), receita: 0, despesa: 0, receitaB2c: 0, receitaB2b: 0, n: 0 }]));
    noPeriodo(lista, { de: d0, ate: d1, regime }).forEach((l) => {
      const x = acc[mesDoRegime(l, regime)]; if (!x) return;
      const v = valorFinal(l); x.n += 1;
      if (l.tipo === 'receita') { x.receita += v; if (l.segmento === 'b2b') x.receitaB2b += v; else x.receitaB2c += v; } else x.despesa += v;
    });
    let acumulado = 0;
    return meses.map((m) => { const x = acc[m]; const resultado = arred(x.receita - x.despesa); acumulado = arred(acumulado + resultado); return { ...x, receita: arred(x.receita), despesa: arred(x.despesa), receitaB2c: arred(x.receitaB2c), receitaB2b: arred(x.receitaB2b), resultado, acumulado }; });
  }

  // Inadimplência por mês de VENCIMENTO das receitas (independe do regime): de tudo que venceu no mês,
  // quanto foi pago em dia, pago com atraso, e quanto segue em aberto hoje (= inadimplência). Meses
  // depois de `ref` entram como "a vencer" (sem taxa). Taxa = em aberto vencido ÷ total vencido no mês.
  // Pago até `toleranciaDias` após o vencimento conta como "em dia" (compensação de boleto/Pix) [sup.].
  const TOLERANCIA_ATRASO_DIAS = 3;
  function inadimplenciaMensal(lista, { de = null, ate = null, toleranciaDias = TOLERANCIA_ATRASO_DIAS } = {}, ref = hoje()) {
    const per = de && ate ? { de, ate } : periodoPadrao();
    const { de: d0, ate: d1 } = periodoDe(per);
    const meses = mesesEntre(mesDe(d0), mesDe(d1));
    const acc = Object.fromEntries(meses.map((m) => [m, { mes: m, rotulo: rotuloMes(m), futuro: `${m}-01` > ref, total: 0, pagoEmDia: 0, pagoAtraso: 0, emAberto: 0, aVencer: 0, n: 0, nEmAberto: 0, nAtraso: 0, diasAtraso: 0 }]));
    lista.filter((l) => l.tipo === 'receita' && l.status !== 'cancelado' && l.vencimento >= d0 && l.vencimento <= d1).forEach((l) => {
      const x = acc[mesDe(l.vencimento)]; if (!x) return;
      const v = valorFinal(l); x.total += v; x.n += 1;
      if (l.status === 'pago') {
        const atraso = l.pagoEm ? diasEntre(l.vencimento, l.pagoEm) : 0;
        if (atraso > toleranciaDias) { x.pagoAtraso += v; x.nAtraso += 1; x.diasAtraso += atraso; } else x.pagoEmDia += v;
      } else if (l.vencimento < ref) { x.emAberto += v; x.nEmAberto += 1; } else x.aVencer += v;
    });
    return meses.map((m) => {
      const x = acc[m];
      const vencido = arred(x.total - x.aVencer);
      return { ...x, total: arred(x.total), vencido, pagoEmDia: arred(x.pagoEmDia), pagoAtraso: arred(x.pagoAtraso), emAberto: arred(x.emAberto), aVencer: arred(x.aVencer), pct: vencido ? pct(x.emAberto, vencido) : null, pctAtraso: vencido ? pct(x.pagoAtraso + x.emAberto, vencido) : null, mediaDiasAtraso: x.nAtraso ? Math.round(x.diasAtraso / x.nAtraso) : 0 };
    });
  }
  // Totais da série de inadimplência (só meses já vencidos).
  function totaisInadimplencia(serie) {
    const v = serie.filter((m) => m.vencido > 0);
    const vencido = soma(v, (m) => m.vencido); const emAberto = soma(v, (m) => m.emAberto); const pagoAtraso = soma(v, (m) => m.pagoAtraso);
    const nAtraso = v.reduce((s, m) => s + m.nAtraso, 0); const dias = v.reduce((s, m) => s + m.diasAtraso, 0);
    return { vencido, emAberto, pagoAtraso, pagoEmDia: soma(v, (m) => m.pagoEmDia), nEmAberto: v.reduce((s, m) => s + m.nEmAberto, 0), nAtraso, pct: pct(emAberto, vencido), pctAtraso: pct(pagoAtraso + emAberto, vencido), mediaDiasAtraso: nAtraso ? Math.round(dias / nAtraso) : 0, pior: v.reduce((a, m) => (a == null || (m.pct ?? 0) > (a.pct ?? 0) ? m : a), null) };
  }

  // Receita/despesa por centro de custo, ordenado por despesa.
  function porCentroCusto(lista, { de = null, ate = null, regime = 'caixa' } = {}, p = plano()) {
    const per = de && ate ? { de, ate } : periodoPadrao();
    const itens = noPeriodo(lista, { ...per, regime });
    const grupos = agrupar(itens, (l) => l.centroCustoId ?? '__sem');
    const totalDespesa = soma(itens.filter((l) => l.tipo === 'despesa'), valorFinal);
    return [...grupos.entries()].map(([id, ls]) => {
      const receita = soma(ls.filter((l) => l.tipo === 'receita'), valorFinal);
      const despesa = soma(ls.filter((l) => l.tipo === 'despesa'), valorFinal);
      return { centro: centroDe(p, id) ?? { id, codigo: '', nome: 'Sem centro de custo' }, receita, despesa, resultado: arred(receita - despesa), pctDespesa: pct(despesa, totalDespesa), n: ls.length };
    }).sort((a, b) => b.despesa - a.despesa || b.receita - a.receita);
  }

  // Valor por categoria (de um tipo), com % do total do tipo.
  function porCategoria(lista, { tipo = 'despesa', de = null, ate = null, regime = 'caixa' } = {}, p = plano()) {
    const per = de && ate ? { de, ate } : periodoPadrao();
    const itens = noPeriodo(lista, { ...per, regime }).filter((l) => l.tipo === tipo);
    const total = soma(itens, valorFinal);
    return [...agrupar(itens, (l) => l.categoriaId ?? '__sem').entries()].map(([id, ls]) => {
      const valor = soma(ls, valorFinal);
      return { categoria: categoriaDe(p, id) ?? { id, codigo: '', nome: 'Sem categoria', tipo, grupo: 'outros' }, valor, pct: pct(valor, total), n: ls.length };
    }).sort((a, b) => b.valor - a.valor);
  }

  // Segmento B2C × B2B (receitas) pela natureza de quem contratou, com ticket médio por contrato.
  function porSegmento(lista, { de = null, ate = null, regime = 'caixa' } = {}) {
    const per = de && ate ? { de, ate } : periodoPadrao();
    const receitas = noPeriodo(lista, { ...per, regime }).filter((l) => l.tipo === 'receita');
    const bloco = (seg) => {
      const ls = receitas.filter((l) => segmentoDe(l) === seg);
      const contratos = new Set(ls.filter(ehContrato).map((l) => l.origem.contratoId)).size;
      const receita = soma(ls, valorFinal);
      return { receita, n: ls.length, contratos, ticket: contratos ? arred(receita / contratos) : null, pct: null };
    };
    const b2c = bloco('b2c'); const b2b = bloco('b2b');
    const total = arred(b2c.receita + b2b.receita);
    b2c.pct = pct(b2c.receita, total); b2b.pct = pct(b2b.receita, total);
    return { b2c, b2b, total, pctB2b: b2b.pct, contratos: b2c.contratos + b2b.contratos };
  }

  // DRE gerencial pelo `grupo` da categoria (740 sai do administrativo para "financeiro").
  function dre(lista, { de = null, ate = null, regime = 'caixa' } = {}, p = plano()) {
    const per = de && ate ? { de, ate } : periodoPadrao();
    const itens = noPeriodo(lista, { ...per, regime });
    const cat = (l) => categoriaDe(p, l.categoriaId);
    const somaSe = (f) => soma(itens.filter(f), valorFinal);
    const grupo = (l) => cat(l)?.grupo ?? 'outros';
    const codigo = (l) => cat(l)?.codigo ?? '';
    const receitaBruta = somaSe((l) => l.tipo === 'receita');
    const impostos = somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'tributos');
    const receitaLiquida = arred(receitaBruta - impostos);
    const cd = (cod) => somaSe((l) => l.tipo === 'despesa' && codigo(l) === cod);
    const custosDiretos = { instrutores: cd('310'), material: cd('320'), coffee: cd('330'), licencas: cd('340') };
    custosDiretos.outros = arred(somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'custo_direto') - custosDiretos.instrutores - custosDiretos.material - custosDiretos.coffee - custosDiretos.licencas);
    custosDiretos.total = arred(custosDiretos.instrutores + custosDiretos.material + custosDiretos.coffee + custosDiretos.licencas + custosDiretos.outros);
    const margemContribuicao = arred(receitaLiquida - custosDiretos.total);
    const financeiro = cd('740');
    const despesas = {
      pessoas: somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'pessoas'),
      ocupacao: somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'ocupacao'),
      administrativo: arred(somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'administrativo') - financeiro),
      marketing: somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'marketing'),
      financeiro,
      outros: somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'outros'),
    };
    despesas.total = arred(despesas.pessoas + despesas.ocupacao + despesas.administrativo + despesas.marketing + despesas.financeiro + despesas.outros);
    const ebitda = arred(margemContribuicao - despesas.total);
    const investimentos = somaSe((l) => l.tipo === 'despesa' && grupo(l) === 'investimento');
    const resultado = arred(ebitda - investimentos);
    return {
      periodo: periodoDe(per), regime, n: itens.length,
      receitaBruta, impostos, impostosPct: pct(impostos, receitaBruta), receitaLiquida, custosDiretos, margemContribuicao, margemPct: pct(margemContribuicao, receitaBruta),
      despesas, ebitda, ebitdaPct: pct(ebitda, receitaBruta), investimentos, resultado, resultadoPct: pct(resultado, receitaBruta),
    };
  }

  // Envelhecimento das contas em aberto (vencido, até 30, 31–60, > 60 dias a partir de `ref`).
  function envelhecer(ls, ref) {
    const out = { total: 0, vencido: 0, ate30: 0, ate60: 0, mais60: 0, n: ls.length, nVencidos: 0 };
    ls.forEach((l) => {
      const v = valorFinal(l); const d = diasEntre(ref, l.vencimento);
      out.total += v;
      if (d < 0) { out.vencido += v; out.nVencidos += 1; } else if (d <= 30) out.ate30 += v; else if (d <= 60) out.ate60 += v; else out.mais60 += v;
    });
    Object.keys(out).forEach((k) => { out[k] = arred(out[k]); });
    return out;
  }

  // Saldo por conta (saldo inicial + pagos desde `saldoInicialEm` + transferências do extrato), a receber/pagar e posição líquida.
  function balanco(lista, p = plano(), movimentos = null, ref = hoje()) {
    const movs = movimentos ?? [];
    const saldoContas = p.contasBancarias.filter((c) => c.status === 'ativo').map((c) => {
      const desde = c.saldoInicialEm ?? '0000-01-01';
      const pagos = lista.filter((l) => l.status === 'pago' && l.contaBancariaId === c.id && l.pagoEm && l.pagoEm >= desde && l.pagoEm <= ref);
      const entradas = soma(pagos.filter((l) => l.tipo === 'receita'), (l) => l.valorPago ?? valorFinal(l));
      const saidas = soma(pagos.filter((l) => l.tipo === 'despesa'), (l) => l.valorPago ?? valorFinal(l));
      const transf = movs.filter((m) => m.contaId === c.id && (m.categoriaSugerida === 'transferencia' || m.referencia === 'transf') && m.data >= desde && m.data <= ref);
      const transferencias = arred(transf.reduce((s, m) => s + (m.tipo === 'credito' ? m.valor : -m.valor), 0));
      return { conta: c, saldoInicial: c.saldoInicial, entradas, saidas, transferencias, saldo: arred(c.saldoInicial + entradas - saidas + transferencias) };
    });
    const saldoTotal = soma(saldoContas, (x) => x.saldo);
    const abertos = lista.filter(emAberto);
    const aReceber = envelhecer(abertos.filter((l) => l.tipo === 'receita'), ref);
    const aPagar = envelhecer(abertos.filter((l) => l.tipo === 'despesa'), ref);
    return { ref, saldoContas, saldoTotal, aReceber, aPagar, posicaoLiquida: arred(saldoTotal + aReceber.total - aPagar.total) };
  }

  // Tudo que a aba Visão geral precisa (tiles + séries), para a tela não recalcular.
  function painel(lista, p = plano(), movimentos = null, { de = null, ate = null, regime = 'caixa', contaBancariaId = '' } = {}) {
    const per = de && ate ? { de, ate } : periodoPadrao();
    const ref = hoje();
    const base = contaBancariaId ? lista.filter((l) => l.contaBancariaId === contaBancariaId) : lista;
    const itens = noPeriodo(base, { ...per, regime });
    const receita = soma(itens.filter((l) => l.tipo === 'receita'), valorFinal);
    const despesa = soma(itens.filter((l) => l.tipo === 'despesa'), valorFinal);
    const resultado = arred(receita - despesa);
    const bal = balanco(base, p, movimentos, ref);
    const vencidosReceber = ordenar(base.filter((l) => l.tipo === 'receita' && situacao(l, ref) === 'vencido'), 'vencimento');
    const vencidosPagar = ordenar(base.filter((l) => l.tipo === 'despesa' && situacao(l, ref) === 'vencido'), 'vencimento');
    const proximos = ordenar(base.filter((l) => emAberto(l) && l.vencimento >= ref && l.vencimento <= somarDias(ref, 15)), 'vencimento');
    return {
      ref, periodo: periodoDe(per), regime,
      tiles: {
        saldo: bal.saldoTotal, receita, despesa, resultado, resultadoPct: pct(resultado, receita),
        aReceberVencido: { total: soma(vencidosReceber, valorFinal), n: vencidosReceber.length },
        aPagarVencido: { total: soma(vencidosPagar, valorFinal), n: vencidosPagar.length },
        aReceber: bal.aReceber, aPagar: bal.aPagar, posicaoLiquida: bal.posicaoLiquida,
      },
      serie: serieMensal(base, { ...per, regime }),
      inadimplencia: inadimplenciaMensal(base, per, ref),
      porSegmento: porSegmento(base, { ...per, regime }),
      porCentroCusto: porCentroCusto(base, { ...per, regime }, p),
      porCategoriaDespesa: porCategoria(base, { tipo: 'despesa', ...per, regime }, p),
      porCategoriaReceita: porCategoria(base, { tipo: 'receita', ...per, regime }, p),
      dre: dre(base, { ...per, regime }, p),
      balanco: bal, vencidosReceber, vencidosPagar, proximos,
    };
  }

  // Opções do select de período da Visão geral (ids estáveis para a tela).
  function periodosPainel(ref = hoje()) {
    const m = mesDe(ref); const ano = ref.slice(0, 4);
    const mesPassado = lancMesAnterior(m);
    const tresAtras = lancMesAnterior(lancMesAnterior(m));
    return [
      { id: 'mes', nome: 'Este mês', de: primeiroDia(m), ate: ultimoDia(m) },
      { id: 'mes_passado', nome: 'Mês passado', de: primeiroDia(mesPassado), ate: ultimoDia(mesPassado) },
      { id: '3m', nome: 'Últimos 3 meses', de: primeiroDia(tresAtras), ate: ultimoDia(m) },
      { id: '12m', nome: 'Últimos 12 meses', ...periodoPadrao(ref) },
      { id: 'ano', nome: 'Este ano', de: `${ano}-01-01`, ate: `${ano}-12-31` },
      { id: 'ano_passado', nome: 'Ano passado', de: `${Number(ano) - 1}-01-01`, ate: `${Number(ano) - 1}-12-31` },
      { id: 'personalizado', nome: 'Personalizado', de: null, ate: null },
    ];
  }

  // CSV (separador ;) dos lançamentos para download.
  function csv(lista, p = plano()) {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const cab = ['Tipo', 'Vencimento', 'Competência', 'Pessoa', 'Documento', 'PF/PJ', 'Descrição', 'Origem', 'Categoria', 'Centro de custo', 'Conta', 'Valor', 'Desconto', 'Valor final', 'Forma', 'Pagamento', 'Situação', 'Asaas', 'NF'];
    const linhas = lista.map((l) => [
      nomeDe(TIPOS, l.tipo), fmtData(l.vencimento), l.competencia, l.pessoa?.nome, l.pessoa?.documento, porId(NATUREZAS_PESSOA, naturezaPessoa(l.pessoa))?.curto ?? '', l.descricao, descricaoOrigem(l),
      categoriaDe(p, l.categoriaId) ? `${categoriaDe(p, l.categoriaId).codigo} ${categoriaDe(p, l.categoriaId).nome}` : '', centroDe(p, l.centroCustoId)?.nome, contaDe(p, l.contaBancariaId)?.nome,
      String(l.valor).replace('.', ','), String(l.desconto ?? 0).replace('.', ','), String(valorFinal(l)).replace('.', ','), nomeDe(FORMAS, l.forma), fmtData(l.pagoEm), situacaoDe(l).nome, l.asaas?.id ?? '', l.nf?.numero ?? '',
    ].map(esc).join(';'));
    return `﻿${cab.map(esc).join(';')}\n${linhas.join('\n')}`;
  }

  return {
    CHAVE, CHAVE_PLANO, CHAVE_EXTRATO, CHAVE_SAQUES,
    STATUS, SITUACOES, TIPOS, FORMAS, TIPOS_PESSOA, NATUREZAS_PESSOA, GRUPOS_CATEGORIA, SEGMENTOS, ORIGENS, TIPOS_CONTA, STATUS_ASAAS,
    // helpers
    arred, hoje, fmtMoeda, fmtMoedaCentavos, fmtData, fmtPct, pct, normalizar, porId, numero, mesDe, rotuloMes, mesesEntre, somarDias, periodoDe, periodoPadrao, periodosPainel, nomeDe,
    // persistência e contexto
    carregar, salvar, plano, salvarPlano, carregarExtrato, salvarExtrato, contexto, sincronizar, proximoId,
    // plano
    categoriaDe, categoriaPorCodigo, centroDe, centroPorCodigo, centroDoDepartamento, tipoCentro, centrosDoTipo, TIPOS_CENTRO, CENTRO_POR_DEPARTAMENTO, segmentoDe, contaDe, fornecedorDe, contaPadrao, contaAsaas, categoriasDoTipo, usoDoPlano,
    validarPlano, incluirNoPlano, atualizarNoPlano, alterarStatusPlano, removerDoPlano, instituicaoDaConta, instituicaoPorNome,
    // lançamento
    naturezaPessoa, valorFinal, situacao, situacaoDe, diasAtraso, emAberto, descricaoOrigem, linkOrigem, linkPessoa, camposEditaveis,
    podeEditar, podeCancelar, podeRemover, podeBaixar, podeEstornar, podeGerarCobranca,
    filtrar, totais, ordenar, validar, incluir, atualizar, cancelar, remover,
    baixar, baixarEmMassa, estornar, registrarNf,
    gerarCobranca, simularPagamentoAsaas, sincronizarStatusAsaas,
    extrato, conciliacao, conciliar, desconciliar, conciliarPeloId, conciliarSugestoes, criarDoMovimento,
    // saque automático (Asaas → banco)
    carregarSaques, salvarSaques, validarSaques, saldoAsaas, ehDiaDeSaque, processarSaques, sacarAgora, previsaoSaque, ultimoSaque,
    serieMensal, inadimplenciaMensal, totaisInadimplencia, TOLERANCIA_ATRASO_DIAS, porCentroCusto, porCategoria, porSegmento, dre, balanco, painel, csv,
  };
})();
