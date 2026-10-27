// ============================================================
// Dados do módulo Compras (grupo Financeiro): constantes e SEMENTE.
//
// Uma COMPRA é a solicitação de algo que a escola compra fora da folha e dos
// contratos de instrutor — café e copa, material do professor (canetas de
// quadro, apagadores), material de escritório, produtos de limpeza para a
// terceirizada, coffee break das turmas presenciais, licenças e pequenos
// equipamentos. O fluxo é solicitação → aprovação → pedido ao fornecedor →
// recebimento → conta a pagar gerada no Financeiro (js/lancamentos-motor.js,
// origem { tipo: 'compra' }).
//
// Semente determinística: ~36 compras entre mar/2026 e out/2026 usando ids
// REAIS das outras sementes — fornecedores (PLANO_FORNECEDORES_SEED),
// categorias/centros de custo (PLANO_SEED), colaboradores (COLABORADORES_SEED)
// e turmas presenciais (TURMAS_CURSO). Datas fixas: a semente foi montada para
// "hoje" = 08/09/2026 (apresentação em 10/09/2026); hoje() do motor é a data
// local do navegador. Globais deste arquivo têm prefixo COMPRAS_.
// ============================================================

const COMPRAS_SEED_HOJE = '2026-09-08';

// Status persistido. 'concluida' NÃO é status: é derivado (recebida com NF conferida) — ver Compras.situacao.
const COMPRAS_STATUS = [
  { id: 'rascunho', nome: 'Rascunho', curto: 'Rascunho', descricao: 'Em preparação: os itens são montados na página da compra; ainda não foi solicitada a ninguém.' },
  { id: 'solicitada', nome: 'Aguardando aprovação', curto: 'Solicitada', descricao: 'Pedido interno registrado; aguarda o gestor aprovar ou reprovar.' },
  { id: 'aprovada', nome: 'Aprovada', curto: 'Aprovada', descricao: 'Aprovada; falta enviar o pedido ao fornecedor.' },
  { id: 'pedida', nome: 'Aguardando entrega', curto: 'Pedida', descricao: 'Pedido enviado ao fornecedor; aguardando a entrega.' },
  { id: 'recebida', nome: 'Recebida', curto: 'Recebida', descricao: 'Entregue e conferida; a conta a pagar já está no Financeiro. Vira "Concluída" quando a NF é conferida.' },
  { id: 'reprovada', nome: 'Reprovada', curto: 'Reprovada', descricao: 'O gestor não aprovou; fica no histórico.' },
  { id: 'cancelada', nome: 'Cancelada', curto: 'Cancelada', descricao: 'Cancelada antes do recebimento; não gera conta a pagar.' },
];

// Situação exibida = status + 'concluida' derivada (recebida com NF conferida).
const COMPRAS_SITUACOES = [
  ...COMPRAS_STATUS.filter((s) => s.id !== 'reprovada' && s.id !== 'cancelada'),
  { id: 'concluida', nome: 'Concluída', curto: 'Concluída', descricao: 'Recebida, NF conferida e conta a pagar gerada.' },
  ...COMPRAS_STATUS.filter((s) => s.id === 'reprovada' || s.id === 'cancelada'),
];

const COMPRAS_UNIDADES = [
  { id: 'un', nome: 'un' }, { id: 'cx', nome: 'cx' }, { id: 'pct', nome: 'pct' }, { id: 'fardo', nome: 'fardo' },
  { id: 'kg', nome: 'kg' }, { id: 'l', nome: 'L' }, { id: 'resma', nome: 'resma' }, { id: 'licenca', nome: 'licença' },
  { id: 'servico', nome: 'serviço' }, { id: 'mes', nome: 'mês' },
];

// [sup.] Alçada do gestor: acima deste total a tela avisa "acima da alçada do gestor — aprovação da diretoria".
// Só informativo: uma aprovação basta (a aprovação da diretoria fica registrada na observação).
const COMPRAS_ALCADA_GESTOR = 1000;

// ---------- Semente ----------

// Pessoas que aparecem nas etapas (ids de COLABORADORES_SEED).
const COMPRAS_PESSOAS = {
  ana: { colaboradorId: 'c1', nome: 'Ana Souza' },            // diretora administrativa — aprova
  bruno: { colaboradorId: 'c2', nome: 'Bruno Lima' },         // coordenador pedagógico — material do professor, coffee
  diego: { colaboradorId: 'c3', nome: 'Diego Rocha' },        // analista financeiro — registra pedidos
  fernanda: { colaboradorId: 'c4', nome: 'Fernanda Alves' },  // comercial — coffee in company
  gustavo: { colaboradorId: 'c5', nome: 'Gustavo Prado' },    // suporte — equipamentos/licenças
  elisa: { colaboradorId: 'c6', nome: 'Elisa Martins' },      // assistente administrativa (desde 17/08/2026) — copa, limpeza, escritório
  marcos: { colaboradorId: 'c8', nome: 'Marcos Pereira' },    // designer — licenças de design
  patricia: { colaboradorId: 'c9', nome: 'Patrícia Gomes' },  // recepcionista (afastada desde 06/07/2026) — copa e limpeza até junho
  otavio: { colaboradorId: 'c10', nome: 'Otávio Rangel Delgado' }, // suporte técnico — sala híbrida
};

// Kits de itens recorrentes (café mensal, limpeza, material do professor) — "Duplicar" na tela faz o mesmo.
const COMPRAS_KITS = {
  cafe: [
    { descricao: 'Café em grãos torrado 1 kg', quantidade: 5, unidade: 'kg', valorUnitario: 35.96 },
    { descricao: 'Açúcar refinado 5 kg', quantidade: 2, unidade: 'pct', valorUnitario: 22.5 },
    { descricao: 'Copo descartável 200 ml (cx 2.000)', quantidade: 1, unidade: 'cx', valorUnitario: 78 },
    { descricao: 'Filtro de papel nº 103 (cx 30)', quantidade: 3, unidade: 'cx', valorUnitario: 9.9 },
  ], // 179,80 + 45,00 + 78,00 + 29,70 = 332,50
  professor: [
    { descricao: 'Caneta para quadro branco azul', quantidade: 24, unidade: 'un', valorUnitario: 4.9 },
    { descricao: 'Caneta para quadro branco preta', quantidade: 24, unidade: 'un', valorUnitario: 4.9 },
    { descricao: 'Caneta para quadro branco vermelha', quantidade: 12, unidade: 'un', valorUnitario: 4.9 },
    { descricao: 'Apagador para quadro branco', quantidade: 6, unidade: 'un', valorUnitario: 12.9 },
  ], // 117,60 + 117,60 + 58,80 + 77,40 = 371,40
  limpeza: [
    { descricao: 'Desinfetante concentrado 5 L', quantidade: 4, unidade: 'un', valorUnitario: 24.9 },
    { descricao: 'Detergente neutro 5 L', quantidade: 2, unidade: 'un', valorUnitario: 19.9 },
    { descricao: 'Papel higiênico folha dupla (fardo 64 rolos)', quantidade: 2, unidade: 'fardo', valorUnitario: 89 },
    { descricao: 'Papel toalha interfolha (cx 1.000)', quantidade: 3, unidade: 'cx', valorUnitario: 42 },
    { descricao: 'Álcool em gel 70% 5 L', quantidade: 1, unidade: 'un', valorUnitario: 69 },
  ], // 99,60 + 39,80 + 178,00 + 126,00 + 69,00 = 512,40
  limpezaReduzido: [
    { descricao: 'Desinfetante concentrado 5 L', quantidade: 4, unidade: 'un', valorUnitario: 24.9 },
    { descricao: 'Papel higiênico folha dupla (fardo 64 rolos)', quantidade: 2, unidade: 'fardo', valorUnitario: 89 },
    { descricao: 'Papel toalha interfolha (cx 1.000)', quantidade: 2, unidade: 'cx', valorUnitario: 42 },
    { descricao: 'Saco de lixo 100 L (pct 100)', quantidade: 2, unidade: 'pct', valorUnitario: 38.5 },
  ], // 99,60 + 178,00 + 84,00 + 77,00 = 438,60
};

// Um item de coffee break por encontro da turma: "Coffee break (N pessoas)" × nº de encontros.
const comprasCoffee = (pessoas, encontros, valor) => [{ descricao: `Coffee break (${pessoas} pessoas)`, quantidade: encontros, unidade: 'servico', valorUnitario: valor }];

// Monta uma compra da semente a partir das etapas informadas. `status` é derivado das etapas
// presentes (cancelamento > reprovação > recebimento > pedido > aprovação > solicitada) e o histórico é
// gerado na ordem das etapas. Datas só com dia recebem uma hora fixa por etapa.
function compraSeed(d) {
  const P = COMPRAS_PESSOAS;
  const dt = (data, hora) => (data && data.length === 10 ? `${data}T${hora}` : data);
  const criadoEm = dt(d.criadoEm, '09:10:00');
  const aprovacao = d.aprovacao ? { por: d.aprovacao.por ?? P.ana, em: dt(d.aprovacao.em, '14:30:00'), observacao: d.aprovacao.observacao ?? '' } : null;
  const reprovacao = d.reprovacao ? { por: d.reprovacao.por ?? P.ana, em: dt(d.reprovacao.em, '14:40:00'), motivo: d.reprovacao.motivo } : null;
  const pedido = d.pedido ? { por: d.pedido.por ?? P.diego, em: dt(d.pedido.em, '10:00:00'), numero: d.pedido.numero ?? '', previsaoEntrega: d.pedido.previsaoEntrega ?? null, formaPagamento: d.pedido.formaPagamento ?? 'pix', vencimento: d.pedido.vencimento } : null;
  const recebimento = d.recebimento ? { por: d.recebimento.por ?? d.solicitante, em: dt(d.recebimento.em, '11:20:00'), nf: d.recebimento.nf ?? null, conferido: d.recebimento.conferido !== false, observacao: d.recebimento.observacao ?? '' } : null;
  const cancelamento = d.cancelamento ? { por: d.cancelamento.por ?? d.solicitante, em: dt(d.cancelamento.em, '16:00:00'), motivo: d.cancelamento.motivo } : null;
  const status = d.rascunho ? 'rascunho' : cancelamento ? 'cancelada' : reprovacao ? 'reprovada' : recebimento ? 'recebida' : pedido ? 'pedida' : aprovacao ? 'aprovada' : 'solicitada';
  // Rascunho (08/09/2026): criado e ainda não enviado. Nas demais, a solicitação foi enviada no mesmo momento da criação [sup.].
  const historico = d.rascunho
    ? [{ em: criadoEm, por: d.solicitante, acao: 'rascunho', detalhe: 'Rascunho criado' }]
    : [{ em: criadoEm, por: d.solicitante, acao: 'solicitada', detalhe: 'Solicitação enviada — aguardando aprovação' }];
  if (aprovacao) historico.push({ em: aprovacao.em, por: aprovacao.por, acao: 'aprovada', detalhe: aprovacao.observacao ? `Aprovada — ${aprovacao.observacao}` : 'Aprovada' });
  if (reprovacao) historico.push({ em: reprovacao.em, por: reprovacao.por, acao: 'reprovada', detalhe: `Reprovada — ${reprovacao.motivo}` });
  if (pedido) historico.push({ em: pedido.em, por: pedido.por, acao: 'pedida', detalhe: `Pedido enviado ao fornecedor${pedido.numero ? ` (nº ${pedido.numero})` : ''} · vencimento ${pedido.vencimento.slice(8, 10)}/${pedido.vencimento.slice(5, 7)}` });
  if (recebimento) historico.push({ em: recebimento.em, por: recebimento.por, acao: 'recebida', detalhe: `Recebimento registrado${recebimento.nf ? ` · NF ${recebimento.nf.numero}` : ' · sem NF'}${recebimento.conferido ? ' · conferido' : ' · conferência pendente'} — conta a pagar gerada no Financeiro` });
  if (cancelamento) historico.push({ em: cancelamento.em, por: cancelamento.por, acao: 'cancelada', detalhe: `Cancelada — ${cancelamento.motivo}` });
  return {
    id: d.id, codigo: d.codigo, status, criadoEm, solicitadaEm: d.rascunho ? null : criadoEm, atualizadoEm: historico[historico.length - 1].em,
    solicitante: d.solicitante, centroCustoId: d.centroCustoId, categoriaId: d.categoriaId,
    fornecedorId: d.fornecedorId ?? null, turmaId: d.turmaId ?? null,
    justificativa: d.justificativa ?? '', necessarioEm: d.necessarioEm ?? null,
    itens: d.itens.map((i) => ({ ...i })),
    aprovacao, reprovacao, pedido, recebimento, cancelamento,
    lancamentoId: recebimento ? `lc-compra-${d.id}` : null,
    historico,
  };
}

const COMPRAS_SEED = (() => {
  const P = COMPRAS_PESSOAS; const K = COMPRAS_KITS;
  const nf = (numero, emitidaEm) => ({ numero, emitidaEm });
  // Recorrentes: café e copa e limpeza (Havan, Administrativo), material do professor e coffee (Havan/Buffet, Pedagógico).
  const cafe = (n, mes, sol, criadoEm, aprov, ped, rec, venc, nfN) => compraSeed({
    id: `pc${n}`, codigo: `PC-2026-${String(n).padStart(3, '0')}`, criadoEm, solicitante: sol,
    centroCustoId: 'cc-700', categoriaId: 'cat-750', fornecedorId: 'for-havan',
    justificativa: `Café e copa de ${mes} — consumo da equipe e dos alunos entre as aulas.`, necessarioEm: ped,
    itens: K.cafe,
    aprovacao: { em: aprov }, pedido: { em: aprov, formaPagamento: 'pix', vencimento: venc, previsaoEntrega: ped },
    recebimento: rec ? { em: rec, por: sol, nf: nfN ? nf(nfN, rec) : null } : null,
  });
  const limpeza = (n, mes, sol, itens, criadoEm, aprov, ped, rec, venc, nfN) => compraSeed({
    id: `pc${n}`, codigo: `PC-2026-${String(n).padStart(3, '0')}`, criadoEm, solicitante: sol,
    centroCustoId: 'cc-700', categoriaId: 'cat-710', fornecedorId: 'for-havan',
    justificativa: `Produtos de limpeza de ${mes} para a equipe terceirizada (Limpeza Total) — a escola fornece os insumos.`, necessarioEm: ped,
    itens,
    aprovacao: { em: aprov }, pedido: { em: aprov, formaPagamento: 'pix', vencimento: venc, previsaoEntrega: ped },
    recebimento: rec ? { em: rec, por: sol, nf: nfN ? nf(nfN, rec) : null } : null,
  });
  const professor = (n, motivo, criadoEm, aprov, ped, rec, venc, nfN, extra = {}) => compraSeed({
    id: `pc${n}`, codigo: `PC-2026-${String(n).padStart(3, '0')}`, criadoEm, solicitante: P.bruno,
    centroCustoId: 'cc-200', categoriaId: 'cat-320', fornecedorId: 'for-havan',
    justificativa: `Material do professor — ${motivo}.`, necessarioEm: ped,
    itens: extra.itens ?? K.professor,
    aprovacao: { em: aprov }, pedido: { em: aprov, formaPagamento: 'pix', vencimento: venc, previsaoEntrega: ped },
    recebimento: rec ? { em: rec, por: P.bruno, nf: nfN ? nf(nfN, rec) : null, ...(extra.recebimento ?? {}) } : null,
  });
  const coffee = (n, sol, centro, turmaId, turmaNome, pessoas, encontros, valor, criadoEm, aprov, ped, rec, venc, nfN, extra = {}) => compraSeed({
    id: `pc${n}`, codigo: `PC-2026-${String(n).padStart(3, '0')}`, criadoEm, solicitante: sol,
    centroCustoId: centro, categoriaId: 'cat-330', fornecedorId: 'for-buffet', turmaId,
    justificativa: `Coffee break da turma ${turmaNome} — ${encontros} encontros presenciais.`, necessarioEm: extra.necessarioEm ?? ped,
    itens: comprasCoffee(pessoas, encontros, valor),
    aprovacao: aprov ? { em: aprov } : null,
    pedido: ped && aprov && !extra.semPedido ? { em: ped, formaPagamento: 'boleto', vencimento: venc, previsaoEntrega: extra.previsaoEntrega ?? rec ?? null } : null,
    recebimento: rec ? { em: rec, por: sol, nf: nfN ? nf(nfN, rec) : null } : null,
    cancelamento: extra.cancelamento ?? null,
  });

  return [
    // --- Março ---
    cafe(1, 'março', P.patricia, '2026-03-02', '2026-03-02', '2026-03-05', '2026-03-05', '2026-03-10', '31.204'),
    professor(2, 'início das turmas de março (SUP09, DG3-01)', '2026-03-03', '2026-03-03', '2026-03-06', '2026-03-06', '2026-03-13', '31.288'),
    coffee(3, P.bruno, 'cc-200', 'sup09-ht5', 'HT5 N (Super DEV 9)', 18, 8, 58, '2026-03-04', '2026-03-04', '2026-03-04', '2026-03-13', '2026-03-28', '2.981'),
    limpeza(4, 'março', P.patricia, K.limpeza, '2026-03-09', '2026-03-09', '2026-03-12', '2026-03-12', '2026-03-19', '31.577'),
    // --- Abril ---
    cafe(5, 'abril', P.patricia, '2026-04-01', '2026-04-01', '2026-04-06', '2026-04-06', '2026-04-10', '32.019'),
    coffee(6, P.bruno, 'cc-200', 'ta160', 'TRP N1 (Tráfego pago)', 20, 10, 62, '2026-04-06', '2026-04-06', '2026-04-06', '2026-04-21', '2026-04-30', '3.044'),
    compraSeed({
      id: 'pc7', codigo: 'PC-2026-007', criadoEm: '2026-04-13', solicitante: P.marcos,
      centroCustoId: 'cc-200', categoriaId: 'cat-340', fornecedorId: 'for-jetbrains',
      justificativa: 'Adobe Creative Cloud (12 meses) para os 8 postos do laboratório de design — turmas DG3 e Photoshop/Illustrator abertas.', necessarioEm: '2026-04-20',
      itens: [{ descricao: 'Adobe Creative Cloud — licença educacional 12 meses', quantidade: 8, unidade: 'licenca', valorUnitario: 1290 }],
      aprovacao: { em: '2026-04-14', observacao: 'Acima da alçada — aprovado em reunião de diretoria de 14/04.' },
      pedido: { em: '2026-04-15', numero: 'ADB-77812', formaPagamento: 'boleto', vencimento: '2026-05-10', previsaoEntrega: '2026-04-20' },
      recebimento: { em: '2026-04-20', por: P.marcos, nf: nf('8.115', '2026-04-20'), observacao: 'Chaves recebidas por e-mail e ativadas nas 8 máquinas.' },
    }),
    limpeza(8, 'abril', P.patricia, K.limpezaReduzido, '2026-04-27', '2026-04-27', '2026-04-30', '2026-04-30', '2026-05-08', '32.410'),
    // --- Maio ---
    cafe(9, 'maio', P.patricia, '2026-05-04', '2026-05-04', '2026-05-07', '2026-05-07', '2026-05-12', '33.002'),
    coffee(10, P.fernanda, 'cc-200', 'ta241', 'ECS · Cremer (in company)', 14, 6, 68, '2026-05-04', '2026-05-04', '2026-05-04', '2026-05-13', '2026-05-28', '3.120'),
    professor(11, 'reposição de maio + blocos de flip chart', '2026-05-18', '2026-05-18', '2026-05-21', '2026-05-21', '2026-05-28', '33.377', {
      itens: [
        { descricao: 'Caneta para quadro branco azul', quantidade: 24, unidade: 'un', valorUnitario: 4.9 },
        { descricao: 'Caneta para quadro branco preta', quantidade: 24, unidade: 'un', valorUnitario: 4.9 },
        { descricao: 'Apagador para quadro branco', quantidade: 4, unidade: 'un', valorUnitario: 12.9 },
        { descricao: 'Bloco flip chart 50 folhas', quantidade: 3, unidade: 'un', valorUnitario: 32 },
      ], // 382,80
    }),
    // --- Junho ---
    cafe(12, 'junho', P.patricia, '2026-06-01', '2026-06-01', '2026-06-04', '2026-06-04', '2026-06-10', '33.690'),
    limpeza(13, 'junho', P.patricia, K.limpeza, '2026-06-08', '2026-06-08', '2026-06-11', '2026-06-11', '2026-06-18', '33.871'),
    compraSeed({
      id: 'pc14', codigo: 'PC-2026-014', criadoEm: '2026-06-15', solicitante: P.gustavo,
      centroCustoId: 'cc-200', categoriaId: 'cat-950', fornecedorId: 'for-dell',
      justificativa: 'Dois monitores 24" com suporte articulado para a sala 2 — os atuais apresentam falha no painel.', necessarioEm: '2026-06-29',
      itens: [
        { descricao: 'Monitor Dell P2422H 24"', quantidade: 2, unidade: 'un', valorUnitario: 1189 },
        { descricao: 'Suporte articulado para monitor', quantidade: 2, unidade: 'un', valorUnitario: 189 },
      ], // 2.756,00
      aprovacao: { em: '2026-06-16', observacao: 'Acima da alçada — diretoria aprovou por e-mail em 16/06.' },
      pedido: { em: '2026-06-17', numero: 'DL-2026-40311', formaPagamento: 'boleto', vencimento: '2026-07-15', previsaoEntrega: '2026-06-26' },
      recebimento: { em: '2026-06-26', por: P.gustavo, nf: nf('455.812', '2026-06-24') },
    }),
    coffee(15, P.fernanda, 'cc-200', 'ta240', 'PBI · WEG (in company)', 10, 12, 55, '2026-06-22', '2026-06-22', '2026-06-22', '2026-07-29', '2026-08-10', '3.302'),
    // --- Julho ---
    cafe(16, 'julho', P.diego, '2026-07-01', '2026-07-01', '2026-07-06', '2026-07-06', '2026-07-10', '34.118'),
    limpeza(17, 'julho', P.diego, K.limpezaReduzido, '2026-07-13', '2026-07-13', '2026-07-16', '2026-07-16', '2026-07-23', '34.302'),
    // --- Agosto ---
    cafe(18, 'agosto', P.diego, '2026-08-03', '2026-08-03', '2026-08-06', '2026-08-06', '2026-08-10', '34.655'),
    professor(19, 'início da DG3-02 e das turmas noturnas de agosto', '2026-08-10', '2026-08-10', '2026-08-13', '2026-08-13', '2026-08-20', '34.801'),
    // Recebida em 28/08 com vencimento 12/09: fica em aberto em Contas a pagar (a vencer).
    coffee(20, P.bruno, 'cc-200', 'sup10-ht5', 'HT5 N (Super DEV 10, híbrida)', 16, 8, 58, '2026-08-17', '2026-08-17', '2026-08-17', '2026-08-28', '2026-09-12', '3.487'),
    limpeza(21, 'agosto', P.elisa, K.limpeza, '2026-08-18', '2026-08-18', '2026-08-21', '2026-08-21', '2026-08-31', '34.960'),
    // Reprovada
    compraSeed({
      id: 'pc22', codigo: 'PC-2026-022', criadoEm: '2026-08-20', solicitante: P.elisa,
      centroCustoId: 'cc-700', categoriaId: 'cat-950', fornecedorId: 'for-havan',
      justificativa: 'Cafeteira expresso automática para a copa — a atual é de filtro e a equipe pede café expresso.', necessarioEm: '2026-09-01',
      itens: [{ descricao: 'Cafeteira expresso automática', quantidade: 1, unidade: 'un', valorUnitario: 2499 }],
      reprovacao: { em: '2026-08-21', motivo: 'Fora do orçamento do semestre; manter a cafeteira atual e reavaliar em janeiro.' },
    }),
    // Cancelada depois de aprovada
    coffee(23, P.bruno, 'cc-200', 'ta205', 'OFS T1 (Office essencial)', 24, 5, 72, '2026-08-24', '2026-08-24', null, null, null, null, {
      semPedido: true, necessarioEm: '2026-08-24',
      cancelamento: { em: '2026-08-25', por: P.bruno, motivo: 'Turma remarcada pelo comercial; nova solicitação será feita com as datas definitivas.' },
    }),
    // --- Setembro (situações em aberto para a tela) ---
    // Recebida SEM NF: fornecedor não enviou a nota com a entrega.
    compraSeed({
      id: 'pc24', codigo: 'PC-2026-024', criadoEm: '2026-08-31', solicitante: P.elisa,
      centroCustoId: 'cc-700', categoriaId: 'cat-750', fornecedorId: 'for-havan',
      justificativa: 'Café e copa de setembro — consumo da equipe e dos alunos entre as aulas.', necessarioEm: '2026-09-03',
      itens: K.cafe,
      aprovacao: { em: '2026-08-31' },
      pedido: { em: '2026-09-01', formaPagamento: 'pix', vencimento: '2026-09-15', previsaoEntrega: '2026-09-03' },
      recebimento: { em: '2026-09-03', por: P.elisa, nf: null, conferido: true, observacao: 'Entrega conferida; a NF não veio com a mercadoria — cobrar do fornecedor.' },
    }),
    // Recebida com NF, conferência pendente.
    professor(25, 'reposição de setembro', '2026-09-01', '2026-09-01', '2026-09-04', '2026-09-04', '2026-09-18', '35.240', {
      recebimento: { conferido: false, observacao: 'Faltou conferir a quantidade de apagadores — caixa veio lacrada.' },
    }),
    // Pedidas, aguardando entrega
    compraSeed({
      id: 'pc26', codigo: 'PC-2026-026', criadoEm: '2026-08-27', solicitante: P.elisa,
      centroCustoId: 'cc-700', categoriaId: 'cat-710', fornecedorId: 'for-havan',
      justificativa: 'Produtos de limpeza de setembro para a equipe terceirizada (Limpeza Total).', necessarioEm: '2026-09-11',
      itens: K.limpeza,
      aprovacao: { em: '2026-08-28' },
      pedido: { em: '2026-09-02', formaPagamento: 'pix', vencimento: '2026-09-20', previsaoEntrega: '2026-09-11' },
    }),
    coffee(27, P.fernanda, 'cc-200', 'ta235', 'CLP · Hering (in company)', 12, 6, 68, '2026-08-28', '2026-08-28', '2026-08-31', null, '2026-09-25', null, { previsaoEntrega: '2026-09-10', necessarioEm: '2026-09-01' }),
    compraSeed({
      id: 'pc28', codigo: 'PC-2026-028', criadoEm: '2026-09-01', solicitante: P.gustavo,
      centroCustoId: 'cc-700', categoriaId: 'cat-730', fornecedorId: 'for-google',
      justificativa: 'Duas contas adicionais do Google Workspace (12 meses) para os colaboradores admitidos em agosto.', necessarioEm: '2026-09-09',
      itens: [{ descricao: 'Google Workspace Business Standard — conta adicional 12 meses', quantidade: 2, unidade: 'licenca', valorUnitario: 428.4 }],
      aprovacao: { em: '2026-09-01' },
      pedido: { em: '2026-09-02', formaPagamento: 'cartao', vencimento: '2026-09-30', previsaoEntrega: '2026-09-09' },
    }),
    compraSeed({
      id: 'pc29', codigo: 'PC-2026-029', criadoEm: '2026-09-02', solicitante: P.otavio,
      centroCustoId: 'cc-200', categoriaId: 'cat-950', fornecedorId: 'for-dell',
      justificativa: 'Headsets e webcams para a sala 5 (turmas híbridas do Super DEV 10) — áudio dos alunos remotos está ruim.', necessarioEm: '2026-09-16',
      itens: [
        { descricao: 'Headset Dell Pro Stereo', quantidade: 4, unidade: 'un', valorUnitario: 389 },
        { descricao: 'Webcam Dell UltraSharp 4K', quantidade: 2, unidade: 'un', valorUnitario: 1099 },
      ], // 3.754,00
      aprovacao: { em: '2026-09-03', observacao: 'Acima da alçada — aprovado com a diretoria (prioridade das turmas híbridas).' },
      pedido: { em: '2026-09-04', numero: 'DL-2026-51877', formaPagamento: 'boleto', vencimento: '2026-10-05', previsaoEntrega: '2026-09-16' },
    }),
    // Aprovadas, sem pedido
    coffee(30, P.bruno, 'cc-200', 'ta57', 'MLP TQ (Machine Learning)', 14, 8, 58, '2026-09-03', '2026-09-04', null, null, null, null, { semPedido: true, necessarioEm: '2026-09-15' }),
    compraSeed({
      id: 'pc31', codigo: 'PC-2026-031', criadoEm: '2026-09-04', solicitante: P.elisa,
      centroCustoId: 'cc-700', categoriaId: 'cat-750', fornecedorId: null,
      justificativa: 'Material de escritório da recepção e do financeiro — papel, toner e pastas acabaram.', necessarioEm: '2026-09-18',
      itens: [
        { descricao: 'Papel A4 75 g (cx 10 resmas)', quantidade: 2, unidade: 'cx', valorUnitario: 249 },
        { descricao: 'Toner HP 85A', quantidade: 2, unidade: 'un', valorUnitario: 189 },
        { descricao: 'Grampeador de mesa', quantidade: 2, unidade: 'un', valorUnitario: 34.9 },
        { descricao: 'Pasta suspensa (cx 25)', quantidade: 2, unidade: 'cx', valorUnitario: 64.9 },
      ], // 1.075,60
      aprovacao: { em: '2026-09-04', observacao: 'Passou pouco da alçada; diretoria ciente. Cotar em dois fornecedores antes do pedido.' },
    }),
    compraSeed({
      id: 'pc32', codigo: 'PC-2026-032', criadoEm: '2026-09-04', solicitante: P.elisa,
      centroCustoId: 'cc-700', categoriaId: 'cat-710', fornecedorId: 'for-havan',
      justificativa: 'Reposição extra de álcool e papel toalha — consumo maior com as turmas de setembro.', necessarioEm: '2026-09-11',
      itens: [
        { descricao: 'Álcool 70% líquido 5 L', quantidade: 3, unidade: 'un', valorUnitario: 44.9 },
        { descricao: 'Papel toalha interfolha (cx 1.000)', quantidade: 2, unidade: 'cx', valorUnitario: 42 },
      ], // 218,70
      aprovacao: { em: '2026-09-07' },
    }),
    // Aguardando aprovação
    compraSeed({
      id: 'pc33', codigo: 'PC-2026-033', criadoEm: '2026-09-04', solicitante: P.elisa,
      centroCustoId: 'cc-700', categoriaId: 'cat-750', fornecedorId: 'for-havan',
      justificativa: 'Água mineral e biscoitos para a apresentação à diretoria em 10/09.', necessarioEm: '2026-09-10',
      itens: [
        { descricao: 'Água mineral 500 ml (fardo 12)', quantidade: 4, unidade: 'fardo', valorUnitario: 18.9 },
        { descricao: 'Biscoito amanteigado 400 g', quantidade: 6, unidade: 'pct', valorUnitario: 12.9 },
      ], // 153,00
    }),
    coffee(34, P.bruno, 'cc-200', 'ta58', 'AJS TQ (Angular)', 14, 10, 58, '2026-09-07', null, null, null, null, null, { necessarioEm: '2026-09-29' }),
    compraSeed({
      id: 'pc35', codigo: 'PC-2026-035', criadoEm: '2026-09-07', solicitante: P.marcos,
      centroCustoId: 'cc-200', categoriaId: 'cat-340', fornecedorId: 'for-jetbrains',
      justificativa: 'Figma Professional (3 assentos, 12 meses) para as turmas de UX/UI — o plano gratuito limita os arquivos por equipe.', necessarioEm: '2026-09-21',
      itens: [{ descricao: 'Figma Professional — assento anual', quantidade: 3, unidade: 'licenca', valorUnitario: 900 }], // 2.700,00
    }),
    compraSeed({
      id: 'pc36', codigo: 'PC-2026-036', criadoEm: '2026-09-08', solicitante: P.gustavo,
      centroCustoId: 'cc-200', categoriaId: 'cat-950', fornecedorId: 'for-havan',
      justificativa: 'Quatro cadeiras da sala 3 estão com o pistão quebrado; reposição para a turma de 15/09.', necessarioEm: '2026-09-25',
      itens: [{ descricao: 'Cadeira giratória com braços', quantidade: 4, unidade: 'un', valorUnitario: 449 }], // 1.796,00
    }),
    // Rascunho: itens ainda sendo montados na página da compra (08/09/2026)
    compraSeed({
      id: 'pc37', codigo: 'PC-2026-037', criadoEm: '2026-09-08', solicitante: P.elisa, rascunho: true,
      centroCustoId: 'cc-700', categoriaId: 'cat-750', fornecedorId: 'for-havan',
      justificativa: 'Café e copa de outubro — consumo da equipe e dos alunos entre as aulas.', necessarioEm: '2026-10-01',
      itens: [
        { descricao: 'Café em grãos torrado 1 kg', quantidade: 5, unidade: 'kg', valorUnitario: 35.96 },
        { descricao: 'Açúcar refinado 5 kg', quantidade: 2, unidade: 'pct', valorUnitario: 22.5 },
      ], // 224,80 — faltam copos e filtros
    }),
  ];
})();
