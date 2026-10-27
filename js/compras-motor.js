// ============================================================
// Motor do módulo Compras: regras puras (sem DOM) + persistência.
//
// Fluxo: solicitada → aprovada | reprovada; aprovada → pedida (pedido enviado ao
// fornecedor — fornecedor obrigatório); pedida → recebida (registra NF e
// conferência). No RECEBIMENTO a compra passa a gerar a conta a pagar no
// Financeiro: o motor de lançamentos (js/lancamentos-motor.js) materializa em
// todo carregar() um lançamento por compra recebida, id determinístico
// 'lc-compra-<compraId>', origem { tipo: 'compra' } — mesmo mecanismo das
// parcelas de contrato, folha e instrutores (Lancamentos.sincronizar). Este
// motor NÃO cria lançamentos: só expõe `geraLancamento`, `idLancamento` e os
// dados de que o Financeiro precisa. Qualquer status não final → cancelada
// (motivo obrigatório); cancelada/reprovada não geram conta a pagar.
//
// Persistência em localStorage['aulor-v1-compras-v1']; semente COMPRAS_SEED
// (js/compras-data.js) quando a chave não existe. hoje() = data local do
// navegador. Depende de: compras-data.js; opcionais (typeof): Colaboradores /
// COLABORADORES_SEED (solicitantes), Turmas (turma opcional).
// ============================================================

const Compras = (() => {
  const CHAVE = 'aulor-v1-compras-v3'; // v3 (19/10/2026): centros de custo viraram departamentos (cc-* mudaram de sentido); v2 (08/09/2026): etapa de rascunho (status 'rascunho', solicitadaEm) + pc37 na semente

  // ---------- Helpers ----------

  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const arred = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const numero = (v) => (typeof v === 'number' ? v : v === '' || v == null ? null : Number(String(v).replace(/\./g, '').replace(',', '.')));
  const porId = (lista, id) => (lista ?? []).find((x) => x.id === id) ?? null;
  const mesDe = (iso) => String(iso ?? '').slice(0, 7);
  const dataDe = (iso) => String(iso ?? '').slice(0, 10);
  function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const agora = () => { const d = new Date(); return `${hoje()}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`; };
  const fmtMoeda = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  const fmtData = (iso) => (iso ? new Date(`${dataDe(iso)}T12:00:00`).toLocaleDateString('pt-BR') : '');
  const ultimoDia = (ym) => { const [a, m] = ym.split('-').map(Number); return `${ym}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}`; };
  const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? id ?? '';

  // ---------- Constantes expostas ----------

  const STATUS = COMPRAS_STATUS;
  const SITUACOES = COMPRAS_SITUACOES;
  const UNIDADES = COMPRAS_UNIDADES;
  const ALCADA_GESTOR = COMPRAS_ALCADA_GESTOR;
  const FORMAS = typeof LANC_FORMAS !== 'undefined' ? LANC_FORMAS : [
    { id: 'boleto', nome: 'Boleto' }, { id: 'pix', nome: 'Pix' }, { id: 'cartao', nome: 'Cartão' },
    { id: 'transferencia', nome: 'Transferência / TED' }, { id: 'dinheiro', nome: 'Dinheiro' }, { id: 'debito_automatico', nome: 'Débito automático' },
  ];
  const EM_ANDAMENTO = ['rascunho', 'solicitada', 'aprovada', 'pedida', 'recebida'];
  const FINAIS = ['reprovada', 'cancelada'];

  // ---------- Persistência ----------

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* semente */ }
    return clonar(COMPRAS_SEED);
  }
  function salvar(lista) { localStorage.setItem(CHAVE, JSON.stringify(lista)); }

  // ---------- Campos derivados ----------

  const totalItem = (i) => arred((numero(i.quantidade) ?? 0) * (numero(i.valorUnitario) ?? 0));
  const total = (c) => arred((c.itens ?? []).reduce((s, i) => s + totalItem(i), 0));
  const acimaDaAlcada = (c) => total(c) > ALCADA_GESTOR;
  // "Café em grãos 5 kg · +2 itens"
  function resumoItens(c) {
    const itens = c.itens ?? [];
    if (!itens.length) return 'Sem itens';
    const primeiro = itens[0];
    const q = numero(primeiro.quantidade) ?? 0;
    const un = nomeDe(UNIDADES, primeiro.unidade);
    const cabeca = `${primeiro.descricao} ${q} ${un}`.trim();
    return itens.length > 1 ? `${cabeca} · +${itens.length - 1} ${itens.length - 1 === 1 ? 'item' : 'itens'}` : cabeca;
  }
  const nfConferida = (c) => Boolean(c.recebimento?.nf?.numero) && c.recebimento?.conferido === true;
  // 'solicitada' | 'aprovada' | 'pedida' | 'recebida' | 'concluida' (derivada) | 'reprovada' | 'cancelada'
  const situacao = (c) => (c.status === 'recebida' && nfConferida(c) ? 'concluida' : c.status);
  const situacaoDe = (c) => SITUACOES.find((s) => s.id === situacao(c)) ?? SITUACOES[0];
  const emAndamento = (c) => EM_ANDAMENTO.includes(c.status) && situacao(c) !== 'concluida';
  const recebidaSemNf = (c) => c.status === 'recebida' && !nfConferida(c);
  const atrasada = (c, ref = hoje()) => Boolean(c.necessarioEm) && emAndamento(c) && c.status !== 'recebida' && c.necessarioEm < ref;

  // Compra recebida gera a conta a pagar (Lancamentos.sincronizar materializa 'lc-compra-<id>').
  const geraLancamento = (c) => c.status === 'recebida';
  const idLancamento = (c) => `lc-compra-${c.id}`;
  const descricaoLancamento = (c) => `Compra ${c.codigo} · ${resumoItens(c)}`;

  // Permissões por status.
  // Rascunho (08/09/2026): a compra nasce como rascunho, os itens são montados na página de detalhe e
  // "Enviar solicitação" a leva para 'solicitada' (aí valem as regras completas de `validar`).
  const podeEditar = (c) => c.status === 'rascunho' || c.status === 'solicitada';
  const podeEditarItens = (c) => c.status === 'rascunho' || c.status === 'solicitada';
  const podeSolicitar = (c) => c.status === 'rascunho';
  const podeAprovar = (c) => c.status === 'solicitada';
  const podeReprovar = (c) => c.status === 'solicitada';
  const podePedir = (c) => c.status === 'aprovada';
  const podeReceber = (c) => c.status === 'pedida';
  const podeRegistrarNf = (c) => c.status === 'recebida' && !nfConferida(c);
  const podeCancelar = (c) => ['solicitada', 'aprovada', 'pedida'].includes(c.status);
  const podeExcluir = (c) => c.status === 'rascunho' || c.status === 'solicitada' || FINAIS.includes(c.status);

  // ---------- Contexto (outros domínios, opcionais) ----------

  function colaboradores() {
    if (typeof Colaboradores !== 'undefined') return Colaboradores.carregar();
    return typeof COLABORADORES_SEED !== 'undefined' ? clonar(COLABORADORES_SEED) : [];
  }
  const solicitantesAtivos = () => colaboradores().filter((c) => c.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const turmas = () => (typeof Turmas !== 'undefined' ? Turmas.carregar() : []);

  // ---------- Código ----------

  // 'PC-<ano>-<sequência>' por ano da solicitação.
  function proximoCodigo(lista, data = hoje()) {
    const ano = String(data).slice(0, 4);
    const usados = lista.map((c) => c.codigo).filter((k) => k.startsWith(`PC-${ano}-`)).map((k) => Number(k.split('-')[2]) || 0);
    const n = (usados.length ? Math.max(...usados) : 0) + 1;
    return `PC-${ano}-${String(n).padStart(3, '0')}`;
  }
  let _seq = 0;
  const proximoId = (lista) => { let id; do { id = `pc-${Date.now().toString(36)}${(++_seq).toString(36)}`; } while (lista.some((c) => c.id === id)); return id; };

  // ---------- Validação ----------

  const limparItens = (itens) => (itens ?? [])
    .map((i) => ({ descricao: String(i.descricao ?? '').trim(), quantidade: numero(i.quantidade), unidade: i.unidade || 'un', valorUnitario: numero(i.valorUnitario) }))
    .filter((i) => i.descricao || i.quantidade != null || i.valorUnitario != null);

  // Solicitação (nova/edição). `plano` = Lancamentos.plano() quando disponível (valida categoria/centro).
  function validar(dados, { plano = null } = {}) {
    const erros = [];
    if (!dados.solicitante?.colaboradorId && !String(dados.solicitante?.nome ?? '').trim()) erros.push({ campo: 'solicitanteId', mensagem: 'Escolha o solicitante.' });
    if (!dados.centroCustoId) erros.push({ campo: 'centroCustoId', mensagem: 'Escolha o centro de custo.' });
    else if (plano && !porId(plano.centrosCusto, dados.centroCustoId)) erros.push({ campo: 'centroCustoId', mensagem: 'Centro de custo inexistente.' });
    if (!dados.categoriaId) erros.push({ campo: 'categoriaId', mensagem: 'Escolha a categoria.' });
    else if (plano) {
      const cat = porId(plano.categorias, dados.categoriaId);
      if (!cat) erros.push({ campo: 'categoriaId', mensagem: 'Categoria inexistente.' });
      else if (cat.tipo !== 'despesa') erros.push({ campo: 'categoriaId', mensagem: 'Compra usa categoria de despesa.' });
    }
    if (plano && dados.fornecedorId && !porId(plano.fornecedores, dados.fornecedorId)) erros.push({ campo: 'fornecedorId', mensagem: 'Fornecedor inexistente.' });
    if (!String(dados.justificativa ?? '').trim()) erros.push({ campo: 'justificativa', mensagem: 'Informe a justificativa da compra.' });
    if (dados.necessarioEm && !/^\d{4}-\d{2}-\d{2}$/.test(String(dados.necessarioEm))) erros.push({ campo: 'necessarioEm', mensagem: 'Data inválida.' });
    const itens = limparItens(dados.itens);
    if (!itens.length) erros.push({ campo: 'itens', mensagem: 'Inclua pelo menos um item.' });
    itens.forEach((i, n) => {
      if (!i.descricao) erros.push({ campo: `item-${n}-descricao`, mensagem: 'Descreva o item.' });
      if (i.quantidade == null || Number.isNaN(i.quantidade) || i.quantidade <= 0) erros.push({ campo: `item-${n}-quantidade`, mensagem: 'Quantidade maior que zero.' });
      if (!UNIDADES.some((u) => u.id === i.unidade)) erros.push({ campo: `item-${n}-unidade`, mensagem: 'Escolha a unidade.' });
      if (i.valorUnitario == null || Number.isNaN(i.valorUnitario) || i.valorUnitario < 0) erros.push({ campo: `item-${n}-valorUnitario`, mensagem: 'Valor unitário inválido.' });
    });
    return erros;
  }

  // Rascunho: nada é obrigatório, só o que foi preenchido precisa fazer sentido (formato de data, categoria de despesa,
  // números não negativos). As exigências completas ficam para `validar`, na hora de enviar a solicitação.
  function validarRascunho(dados, { plano = null } = {}) {
    const erros = [];
    if (plano && dados.centroCustoId && !porId(plano.centrosCusto, dados.centroCustoId)) erros.push({ campo: 'centroCustoId', mensagem: 'Centro de custo inexistente.' });
    if (plano && dados.categoriaId) {
      const cat = porId(plano.categorias, dados.categoriaId);
      if (!cat) erros.push({ campo: 'categoriaId', mensagem: 'Categoria inexistente.' });
      else if (cat.tipo !== 'despesa') erros.push({ campo: 'categoriaId', mensagem: 'Compra usa categoria de despesa.' });
    }
    if (plano && dados.fornecedorId && !porId(plano.fornecedores, dados.fornecedorId)) erros.push({ campo: 'fornecedorId', mensagem: 'Fornecedor inexistente.' });
    if (dados.necessarioEm && !/^\d{4}-\d{2}-\d{2}$/.test(String(dados.necessarioEm))) erros.push({ campo: 'necessarioEm', mensagem: 'Data inválida.' });
    limparItens(dados.itens).forEach((i, n) => {
      if (i.quantidade != null && (Number.isNaN(i.quantidade) || i.quantidade < 0)) erros.push({ campo: `item-${n}-quantidade`, mensagem: 'Quantidade inválida.' });
      if (i.valorUnitario != null && (Number.isNaN(i.valorUnitario) || i.valorUnitario < 0)) erros.push({ campo: `item-${n}-valorUnitario`, mensagem: 'Valor unitário inválido.' });
    });
    return erros;
  }

  // Só os itens (edição inline no detalhe). Estrito = regras completas (compra já solicitada).
  function validarItens(itens, { estrito = false } = {}) {
    if (!estrito) return validarRascunho({ itens });
    return validar({ itens, solicitante: { nome: 'x' }, centroCustoId: 'x', categoriaId: 'x', justificativa: 'x' }).filter((e) => e.campo === 'itens' || e.campo.startsWith('item-'));
  }

  // O que falta para o rascunho poder ser enviado (mensagens curtas, para a página de detalhe).
  function pendenciasParaSolicitar(c, { plano = null } = {}) {
    return validar(c, { plano });
  }

  function validarPedido(dados, { plano = null } = {}) {
    const erros = [];
    if (!dados.fornecedorId) erros.push({ campo: 'fornecedorId', mensagem: 'Escolha o fornecedor — o pedido vai para ele.' });
    else if (plano && !porId(plano.fornecedores, dados.fornecedorId)) erros.push({ campo: 'fornecedorId', mensagem: 'Fornecedor inexistente.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dados.em ?? ''))) erros.push({ campo: 'em', mensagem: 'Informe a data do pedido.' });
    if (dados.previsaoEntrega && !/^\d{4}-\d{2}-\d{2}$/.test(String(dados.previsaoEntrega))) erros.push({ campo: 'previsaoEntrega', mensagem: 'Data inválida.' });
    if (!FORMAS.some((f) => f.id === dados.formaPagamento)) erros.push({ campo: 'formaPagamento', mensagem: 'Escolha a forma de pagamento.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dados.vencimento ?? ''))) erros.push({ campo: 'vencimento', mensagem: 'Informe o vencimento — vira o vencimento da conta a pagar.' });
    else if (dados.em && dados.vencimento < dados.em) erros.push({ campo: 'vencimento', mensagem: 'Vencimento antes da data do pedido.' });
    return erros;
  }

  function validarRecebimento(dados) {
    const erros = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dados.em ?? ''))) erros.push({ campo: 'em', mensagem: 'Informe a data do recebimento.' });
    const num = String(dados.nf?.numero ?? '').trim();
    if (num && !dados.nf?.emitidaEm) erros.push({ campo: 'nfEmitidaEm', mensagem: 'Informe a data de emissão da NF.' });
    if (!num && dados.nf?.emitidaEm) erros.push({ campo: 'nfNumero', mensagem: 'Informe o número da NF.' });
    if (dados.conferido && !num && !String(dados.observacao ?? '').trim()) erros.push({ campo: 'observacao', mensagem: 'Sem NF, registre na observação como foi conferido / quando a NF vem.' });
    return erros;
  }

  // ---------- Transições ----------

  const registrar = (c, por, acao, detalhe) => ({ ...c, atualizadoEm: agora(), historico: [...(c.historico ?? []), { em: agora(), por, acao, detalhe }] });
  const erroTransicao = (c, acao) => `Não dá para ${acao} uma compra ${nomeDe(SITUACOES, situacao(c)).toLowerCase()}.`;
  const mapear = (lista, id, f) => { let erro = null; let erros = null; let compra = null; const out = lista.map((c) => { if (c.id !== id) return c; const r = f(c); if (r.erro) { erro = r.erro; erros = r.erros ?? null; return c; } compra = r.compra; return compra; }); if (!compra && !erro) erro = 'Compra não encontrada.'; return { lista: out, compra, erro, ...(erros ? { erros } : {}) }; };
  const pessoa = (por) => (por && (por.colaboradorId || por.nome) ? { colaboradorId: por.colaboradorId ?? null, nome: String(por.nome ?? '').trim() } : { colaboradorId: null, nome: 'Sistema' });

  function montarSolicitacao(dados, lista, atual = null, statusNovo = 'solicitada') {
    const em = agora();
    // Sem solicitante (rascunho) fica vazio — `pessoa()` daria "Sistema" e o rascunho passaria em `validar` sem querer.
    const sol = dados.solicitante && (dados.solicitante.colaboradorId || String(dados.solicitante.nome ?? '').trim()) ? pessoa(dados.solicitante) : { colaboradorId: null, nome: '' };
    return {
      id: atual?.id ?? proximoId(lista), codigo: atual?.codigo ?? proximoCodigo(lista), status: atual?.status ?? statusNovo,
      criadoEm: atual?.criadoEm ?? em, solicitadaEm: atual?.solicitadaEm ?? (statusNovo === 'solicitada' ? em : null), atualizadoEm: em,
      solicitante: sol, centroCustoId: dados.centroCustoId || null, categoriaId: dados.categoriaId || null,
      fornecedorId: dados.fornecedorId || null, turmaId: dados.turmaId || null,
      justificativa: String(dados.justificativa ?? '').trim(), necessarioEm: dados.necessarioEm || null,
      itens: limparItens(dados.itens).map((i) => ({ ...i, quantidade: arred(i.quantidade), valorUnitario: arred(i.valorUnitario) })),
      aprovacao: atual?.aprovacao ?? null, reprovacao: atual?.reprovacao ?? null, pedido: atual?.pedido ?? null, recebimento: atual?.recebimento ?? null, cancelamento: atual?.cancelamento ?? null,
      lancamentoId: atual?.lancamentoId ?? null,
      historico: atual?.historico ?? [],
    };
  }

  // Nova solicitação. `por` = quem registrou (pode ser o próprio solicitante).
  function incluir(lista, dados, por = dados.solicitante) {
    const c = montarSolicitacao(dados, lista);
    const compra = registrar(c, pessoa(por), 'solicitada', `Solicitação enviada — aguardando aprovação${acimaDaAlcada(c) ? ` · acima da alçada do gestor (${fmtMoeda(ALCADA_GESTOR)})` : ''}`);
    return { lista: [...lista, compra], compra };
  }

  // Edita os dados da compra (rascunho ou solicitada). Sem `dados.itens`, mantém os itens atuais.
  function atualizar(lista, id, dados, por) {
    return mapear(lista, id, (c) => {
      if (!podeEditar(c)) return { erro: erroTransicao(c, 'editar') };
      const novo = montarSolicitacao({ ...dados, itens: dados.itens ?? c.itens }, lista, c);
      return { compra: c.status === 'rascunho' ? { ...novo } : registrar(novo, pessoa(por), 'editada', 'Solicitação editada') };
    });
  }

  // Rascunho: nasce sem exigências; os itens são montados no detalhe e `solicitar` fecha a etapa.
  function criarRascunho(lista, dados, por) {
    const c = montarSolicitacao(dados, lista, null, 'rascunho');
    const compra = registrar(c, pessoa(por), 'rascunho', `Rascunho criado${dados.duplicadaDe ? ` a partir de ${dados.duplicadaDe}` : ''}`);
    return { lista: [...lista, compra], compra };
  }

  // Troca a lista de itens (edição inline no detalhe). Em rascunho não registra histórico a cada alteração;
  // solicitada registra "Itens editados" (o aprovador vê a versão nova).
  function definirItens(lista, id, itens, por) {
    return mapear(lista, id, (c) => {
      if (!podeEditarItens(c)) return { erro: erroTransicao(c, 'alterar os itens de') };
      const erros = validarItens(itens, { estrito: c.status !== 'rascunho' });
      if (erros.length) return { erro: erros[0].mensagem };
      const novos = limparItens(itens).map((i) => ({ ...i, quantidade: i.quantidade == null ? null : arred(i.quantidade), valorUnitario: i.valorUnitario == null ? null : arred(i.valorUnitario) }));
      const novo = { ...c, itens: novos, atualizadoEm: agora() };
      return { compra: c.status === 'rascunho' ? novo : registrar(novo, pessoa(por), 'editada', `Itens editados · ${novos.length} ${novos.length === 1 ? 'item' : 'itens'} · ${fmtMoeda(total(novo))}`) };
    });
  }

  // Rascunho → solicitada: aqui valem as regras completas (solicitante, centro, categoria, justificativa, itens válidos).
  function solicitar(lista, id, { por, plano = null } = {}) {
    return mapear(lista, id, (c) => {
      if (!podeSolicitar(c)) return { erro: erroTransicao(c, 'solicitar') };
      const erros = validar(c, { plano });
      if (erros.length) return { erro: erros[0].mensagem, erros };
      const em = agora();
      const novo = { ...c, status: 'solicitada', solicitadaEm: em };
      return { compra: registrar(novo, pessoa(por), 'solicitada', `Solicitação enviada — aguardando aprovação · ${c.itens.length} ${c.itens.length === 1 ? 'item' : 'itens'} · ${fmtMoeda(total(c))}${acimaDaAlcada(c) ? ` · acima da alçada do gestor (${fmtMoeda(ALCADA_GESTOR)})` : ''}`) };
    });
  }

  function aprovar(lista, id, { por, observacao = '' } = {}) {
    return mapear(lista, id, (c) => {
      if (!podeAprovar(c)) return { erro: erroTransicao(c, 'aprovar') };
      const obs = String(observacao ?? '').trim();
      const aprovacao = { por: pessoa(por), em: agora(), observacao: obs };
      return { compra: registrar({ ...c, status: 'aprovada', aprovacao }, aprovacao.por, 'aprovada', `Aprovada${obs ? ` — ${obs}` : ''}${acimaDaAlcada(c) ? ' · acima da alçada do gestor' : ''}`) };
    });
  }

  function reprovar(lista, id, { por, motivo = '' } = {}) {
    const m = String(motivo ?? '').trim();
    if (!m) return { lista, compra: null, erro: 'Informe o motivo da reprovação.' };
    return mapear(lista, id, (c) => {
      if (!podeReprovar(c)) return { erro: erroTransicao(c, 'reprovar') };
      const reprovacao = { por: pessoa(por), em: agora(), motivo: m };
      return { compra: registrar({ ...c, status: 'reprovada', reprovacao }, reprovacao.por, 'reprovada', `Reprovada — ${m}`) };
    });
  }

  // Pedido enviado ao fornecedor: fornecedor obrigatório (pode trocar o sugerido na solicitação).
  function registrarPedido(lista, id, dados, { plano = null } = {}) {
    const erros = validarPedido(dados, { plano });
    if (erros.length) return { lista, compra: null, erro: erros[0].mensagem, erros };
    return mapear(lista, id, (c) => {
      if (!podePedir(c)) return { erro: erroTransicao(c, 'registrar o pedido de') };
      const por = pessoa(dados.por);
      const pedido = { por, em: dados.em, numero: String(dados.numero ?? '').trim(), previsaoEntrega: dados.previsaoEntrega || null, formaPagamento: dados.formaPagamento, vencimento: dados.vencimento };
      return { compra: registrar({ ...c, status: 'pedida', fornecedorId: dados.fornecedorId, pedido }, por, 'pedida', `Pedido enviado ao fornecedor${pedido.numero ? ` (nº ${pedido.numero})` : ''} · ${nomeDe(FORMAS, pedido.formaPagamento)} · vencimento ${fmtData(pedido.vencimento)}`) };
    });
  }

  // Recebimento: a partir daqui a compra gera a conta a pagar ('lc-compra-<id>', criada por Lancamentos.sincronizar).
  function receber(lista, id, dados) {
    const erros = validarRecebimento(dados);
    if (erros.length) return { lista, compra: null, erro: erros[0].mensagem, erros };
    return mapear(lista, id, (c) => {
      if (!podeReceber(c)) return { erro: erroTransicao(c, 'receber') };
      const por = pessoa(dados.por);
      const num = String(dados.nf?.numero ?? '').trim();
      const recebimento = { por, em: dados.em, nf: num ? { numero: num, emitidaEm: dados.nf.emitidaEm } : null, conferido: Boolean(dados.conferido), observacao: String(dados.observacao ?? '').trim() };
      const novo = { ...c, status: 'recebida', recebimento };
      novo.lancamentoId = idLancamento(novo);
      return { compra: registrar(novo, por, 'recebida', `Recebimento registrado${recebimento.nf ? ` · NF ${recebimento.nf.numero}` : ' · sem NF'}${recebimento.conferido ? ' · conferido' : ' · conferência pendente'} — conta a pagar gerada no Financeiro`) };
    });
  }

  // NF / conferência depois do recebimento (compra recebida sem NF conferida → concluída).
  function registrarNf(lista, id, dados) {
    const num = String(dados.nf?.numero ?? '').trim();
    if (!num) return { lista, compra: null, erro: 'Informe o número da NF.' };
    if (!dados.nf?.emitidaEm) return { lista, compra: null, erro: 'Informe a data de emissão da NF.' };
    return mapear(lista, id, (c) => {
      if (!podeRegistrarNf(c)) return { erro: erroTransicao(c, 'registrar a NF de') };
      const por = pessoa(dados.por);
      const recebimento = { ...c.recebimento, nf: { numero: num, emitidaEm: dados.nf.emitidaEm }, conferido: dados.conferido !== false, observacao: String(dados.observacao ?? c.recebimento?.observacao ?? '').trim() };
      return { compra: registrar({ ...c, recebimento }, por, 'nf', `NF ${num} registrada${recebimento.conferido ? ' e conferida' : ''}`) };
    });
  }

  function cancelar(lista, id, { por, motivo = '' } = {}) {
    const m = String(motivo ?? '').trim();
    if (!m) return { lista, compra: null, erro: 'Informe o motivo do cancelamento.' };
    return mapear(lista, id, (c) => {
      if (!podeCancelar(c)) return { erro: c.status === 'recebida' ? 'Compra recebida não cancela: a conta a pagar já está no Financeiro.' : c.status === 'rascunho' ? 'Rascunho não se cancela — exclua-o.' : erroTransicao(c, 'cancelar') };
      const cancelamento = { por: pessoa(por), em: agora(), motivo: m };
      return { compra: registrar({ ...c, status: 'cancelada', cancelamento }, cancelamento.por, 'cancelada', `Cancelada — ${m}`) };
    });
  }

  const remover = (lista, id) => lista.filter((c) => !(c.id === id && podeExcluir(c)));

  // Dados para o formulário "Nova compra" a partir de outra (compras recorrentes: café mensal…).
  function modeloDuplicacao(c) {
    return {
      solicitante: c.solicitante, centroCustoId: c.centroCustoId, categoriaId: c.categoriaId, fornecedorId: c.fornecedorId ?? null,
      turmaId: null, justificativa: c.justificativa, necessarioEm: null, itens: clonar(c.itens ?? []), duplicadaDe: c.codigo,
    };
  }

  // ---------- Filtros, ordenação, indicadores ----------

  // Períodos do filtro da lista (pela data da solicitação).
  function periodos(ref = hoje()) {
    const m = mesDe(ref); const [a, mm] = m.split('-').map(Number);
    const mesAnterior = mm === 1 ? `${a - 1}-12` : `${a}-${String(mm - 1).padStart(2, '0')}`;
    const tresAtras = (() => { let y = a; let x = mm - 2; if (x <= 0) { x += 12; y -= 1; } return `${y}-${String(x).padStart(2, '0')}`; })();
    return [
      { id: 'mes', nome: 'Este mês', de: `${m}-01`, ate: ultimoDia(m) },
      { id: 'mes_passado', nome: 'Mês passado', de: `${mesAnterior}-01`, ate: ultimoDia(mesAnterior) },
      { id: '3m', nome: 'Últimos 3 meses', de: `${tresAtras}-01`, ate: ultimoDia(m) },
      { id: 'ano', nome: 'Este ano', de: `${a}-01-01`, ate: `${a}-12-31` },
      { id: 'todos', nome: 'Todo o período', de: null, ate: null },
    ];
  }

  // `status`: '' (todas) | 'andamento' (solicitada+aprovada+pedida+recebida não concluída) | 'recebida_sem_nf' | 'recebidas' (recebida+concluída)
  // | 'recebidas_mes' (recebidas no mês de `ref`, pela data do recebimento — o mesmo recorte de indicadores().gastoMes) | id de situação.
  function filtrar(lista, { busca = '', status = 'andamento', centroCustoId = '', fornecedorId = '', turmaId = '', solicitanteId = '', de = null, ate = null, ref = hoje() } = {}, ctx = {}) {
    const q = normalizar(busca);
    const nomeForn = (id) => (ctx.plano ? porId(ctx.plano.fornecedores, id)?.nome : '') ?? '';
    const nomeTurma = (id) => (ctx.turmas ? porId(ctx.turmas, id)?.nome ?? porId(ctx.turmas, id)?.codigo : '') ?? '';
    return lista.filter((c) => {
      const s = situacao(c);
      if (status === 'andamento' && !emAndamento(c)) return false;
      else if (status === 'recebida_sem_nf' && !recebidaSemNf(c)) return false;
      else if (status === 'recebidas' && c.status !== 'recebida') return false;
      else if (status === 'recebidas_mes' && !(c.status === 'recebida' && mesDe(c.recebimento?.em) === mesDe(ref))) return false;
      else if (status && !['andamento', 'recebida_sem_nf', 'recebidas', 'recebidas_mes'].includes(status) && s !== status) return false;
      if (centroCustoId && c.centroCustoId !== centroCustoId) return false;
      if (fornecedorId && c.fornecedorId !== fornecedorId) return false;
      if (turmaId && c.turmaId !== turmaId) return false;
      if (solicitanteId && c.solicitante?.colaboradorId !== solicitanteId) return false;
      const d = dataDe(c.criadoEm);
      if (de && d < de) return false;
      if (ate && d > ate) return false;
      if (q) {
        const alvo = normalizar([c.codigo, c.justificativa, c.solicitante?.nome, nomeForn(c.fornecedorId), nomeTurma(c.turmaId), c.pedido?.numero, c.recebimento?.nf?.numero, ...(c.itens ?? []).map((i) => i.descricao)].filter(Boolean).join(' '));
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }

  // 'data' (solicitação) | 'total' | 'status' | 'necessarioEm' | 'codigo'
  function ordenar(lista, campo = 'data', direcao = 'desc') {
    const ordemSit = { rascunho: -1, solicitada: 0, aprovada: 1, pedida: 2, recebida: 3, concluida: 4, reprovada: 5, cancelada: 6 };
    const chave = { data: (c) => c.criadoEm, total: (c) => total(c), status: (c) => ordemSit[situacao(c)] ?? 9, necessarioEm: (c) => c.necessarioEm ?? '9999', codigo: (c) => c.codigo }[campo] ?? ((c) => c.criadoEm);
    const s = direcao === 'desc' ? -1 : 1;
    return [...lista].sort((a, b) => { const x = chave(a); const y = chave(b); return (x < y ? -1 : x > y ? 1 : 0) * s || a.codigo.localeCompare(b.codigo) * s; });
  }

  // Números do topo da lista. Gasto do mês = compras recebidas no mês corrente (data do recebimento) [sup.].
  function indicadores(lista, ref = hoje()) {
    const m = mesDe(ref);
    const somar = (xs) => ({ n: xs.length, total: arred(xs.reduce((s, c) => s + total(c), 0)) });
    return {
      rascunhos: somar(lista.filter((c) => c.status === 'rascunho')),
      aguardandoAprovacao: somar(lista.filter((c) => c.status === 'solicitada')),
      aprovadasSemPedido: somar(lista.filter((c) => c.status === 'aprovada')),
      aguardandoEntrega: somar(lista.filter((c) => c.status === 'pedida')),
      recebidasSemNf: somar(lista.filter(recebidaSemNf)),
      gastoMes: somar(lista.filter((c) => c.status === 'recebida' && mesDe(c.recebimento?.em) === m)),
      atrasadas: somar(lista.filter((c) => atrasada(c, ref))),
    };
  }

  // Etapas da linha do tempo do detalhe: [{ id, nome, feita, atual, negativa, em, por, detalhe }].
  // A "Conta a pagar" é concluída junto com o recebimento (o Financeiro a materializa na hora).
  // Reprovada/cancelada: a etapa seguinte à última concluída vira negativa, com quem/quando/motivo.
  function etapas(c, lancamento = null) {
    const negativa = FINAIS.includes(c.status);
    const ultima = c.status === 'recebida' ? 4 : c.status === 'pedida' ? 2 : c.status === 'aprovada' ? 1 : c.status === 'solicitada' ? 0 : c.status === 'rascunho' ? -1 : (c.pedido ? 2 : c.aprovacao ? 1 : 0);
    const fim = c.reprovacao ?? c.cancelamento ?? null;
    const base = [
      { id: 'solicitada', nome: 'Solicitada', em: c.status === 'rascunho' ? null : (c.solicitadaEm ?? c.criadoEm), por: c.status === 'rascunho' ? null : c.solicitante, detalhe: c.status === 'rascunho' ? 'rascunho em preparação' : '' },
      { id: 'aprovada', nome: 'Aprovada', em: c.aprovacao?.em ?? null, por: c.aprovacao?.por ?? null, detalhe: c.aprovacao?.observacao ?? '' },
      { id: 'pedida', nome: 'Pedida', em: c.pedido?.em ?? null, por: c.pedido?.por ?? null, detalhe: c.pedido ? `${nomeDe(FORMAS, c.pedido.formaPagamento)} · vence ${fmtData(c.pedido.vencimento)}` : '' },
      { id: 'recebida', nome: 'Recebida', em: c.recebimento?.em ?? null, por: c.recebimento?.por ?? null, detalhe: c.recebimento ? (c.recebimento.nf ? `NF ${c.recebimento.nf.numero}${c.recebimento.conferido ? ' conferida' : ' a conferir'}` : 'sem NF') : '' },
      { id: 'financeiro', nome: 'Conta a pagar', em: c.status === 'recebida' ? (lancamento?.criadoEm ?? c.recebimento?.em ?? null) : null, por: null, detalhe: lancamento ? `${lancamento.situacaoNome ?? lancamento.status} · vence ${fmtData(lancamento.vencimento)}` : (c.status === 'recebida' ? 'gerada no Financeiro' : '') },
    ];
    return base.map((e, i) => {
      const neg = negativa && i === ultima + 1;
      return {
        ...e, feita: i <= ultima, atual: !negativa && i === ultima + 1, negativa: neg,
        ...(neg ? { nome: c.status === 'reprovada' ? 'Reprovada' : 'Cancelada', em: fim?.em ?? null, por: fim?.por ?? null, detalhe: fim?.motivo ?? '' } : {}),
      };
    });
  }

  // ---------- CSV ----------

  function csv(lista, ctx = {}) {
    const e = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const cab = ['Código', 'Solicitada em', 'Solicitante', 'Situação', 'Itens', 'Centro de custo', 'Categoria', 'Fornecedor', 'Turma', 'Total', 'Necessário em', 'Pedido em', 'Vencimento', 'Forma', 'Recebida em', 'NF', 'Lançamento'];
    const nomeCentro = (id) => (ctx.plano ? porId(ctx.plano.centrosCusto, id)?.nome : id) ?? '';
    const nomeCat = (id) => { const c = ctx.plano ? porId(ctx.plano.categorias, id) : null; return c ? `${c.codigo} ${c.nome}` : id ?? ''; };
    const nomeForn = (id) => (ctx.plano ? porId(ctx.plano.fornecedores, id)?.nome : id) ?? '';
    const nomeTurma = (id) => { const t = ctx.turmas ? porId(ctx.turmas, id) : null; return t ? (t.nome ?? t.codigo) : id ?? ''; };
    const linhas = lista.map((c) => [
      c.codigo, fmtData(c.criadoEm), c.solicitante?.nome, situacaoDe(c).nome, (c.itens ?? []).map((i) => `${i.descricao} ${i.quantidade} ${nomeDe(UNIDADES, i.unidade)} × ${String(i.valorUnitario).replace('.', ',')}`).join(' | '),
      nomeCentro(c.centroCustoId), nomeCat(c.categoriaId), nomeForn(c.fornecedorId), nomeTurma(c.turmaId), String(total(c)).replace('.', ','), fmtData(c.necessarioEm),
      fmtData(c.pedido?.em), fmtData(c.pedido?.vencimento), c.pedido ? nomeDe(FORMAS, c.pedido.formaPagamento) : '', fmtData(c.recebimento?.em), c.recebimento?.nf?.numero ?? '', c.lancamentoId ?? '',
    ].map(e).join(';'));
    return `﻿${cab.map(e).join(';')}\n${linhas.join('\n')}`;
  }

  return {
    CHAVE, STATUS, SITUACOES, UNIDADES, FORMAS, ALCADA_GESTOR, EM_ANDAMENTO,
    // helpers
    hoje, agora, arred, numero, normalizar, porId, fmtMoeda, fmtData, mesDe, nomeDe,
    // persistência e contexto
    carregar, salvar, colaboradores, solicitantesAtivos, turmas,
    // derivados
    totalItem, total, acimaDaAlcada, resumoItens, nfConferida, situacao, situacaoDe, emAndamento, recebidaSemNf, atrasada,
    geraLancamento, idLancamento, descricaoLancamento,
    podeEditar, podeEditarItens, podeSolicitar, podeAprovar, podeReprovar, podePedir, podeReceber, podeRegistrarNf, podeCancelar, podeExcluir,
    // fluxo
    proximoCodigo, validar, validarRascunho, validarItens, pendenciasParaSolicitar, validarPedido, validarRecebimento, incluir, criarRascunho, definirItens, solicitar, atualizar, aprovar, reprovar, registrarPedido, receber, registrarNf, cancelar, remover, modeloDuplicacao,
    // lista
    periodos, filtrar, ordenar, indicadores, etapas, csv,
  };
})();
