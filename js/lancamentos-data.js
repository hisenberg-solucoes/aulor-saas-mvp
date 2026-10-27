// ============================================================
// Dados do módulo Financeiro (contas a receber / a pagar).
//
// Aqui ficam as CONSTANTES (status, formas, tipos de pessoa, grupos),
// a SEMENTE DO PLANO (categorias com os códigos do sistema atual, centros
// de custo, contas bancárias, fornecedores), o GERADOR da semente de
// lançamentos manuais (despesas recorrentes set/2025 → ago/2026 + alguns
// previstos set–out/2026) e o GERADOR do extrato Asaas simulado.
//
// Nada aqui usa Math.random: as variações vêm de um PRNG com seed fixa,
// então a semente é sempre a mesma (e os ids são determinísticos).
// Os geradores recebem do motor (js/lancamentos-motor.js) os agregados
// que dependem de outros domínios (receita recebida por mês, contratos
// criados, turmas presenciais) — este arquivo não lê Contratos/Cursos.
//
// Não confundir com js/financeiro-data.js (custos por turma da tela de
// faturamento). Globais deste arquivo têm prefixo LANC_/PLANO_/EXTRATO_.
// ============================================================

// ---------- Constantes ----------

// Status persistido. 'vencido' NÃO é status: é derivado (previsto/emitido com vencimento < hoje).
const LANC_STATUS = [
  { id: 'previsto', nome: 'Previsto', descricao: 'Planejado; cobrança/boleto ainda não emitido.' },
  { id: 'emitido', nome: 'Emitido', descricao: 'Cobrança emitida (boleto/Pix Asaas ou NF do fornecedor recebida).' },
  { id: 'pago', nome: 'Pago', descricao: 'Baixa registrada.' },
  { id: 'cancelado', nome: 'Cancelado', descricao: 'Sem efeito; fica no histórico.' },
];

// Situação exibida (status + vencido derivado).
const LANC_SITUACOES = [
  { id: 'previsto', nome: 'Previsto', tom: 'neutro' },
  { id: 'emitido', nome: 'Emitido', tom: 'info' },
  { id: 'vencido', nome: 'Vencido', tom: 'critico' },
  { id: 'pago', nome: 'Pago', tom: 'bom' },
  { id: 'cancelado', nome: 'Cancelado', tom: 'apagado' },
];

const LANC_TIPOS = [
  { id: 'receita', nome: 'Receita', descricao: 'Entrada: contas a receber.' },
  { id: 'despesa', nome: 'Despesa', descricao: 'Saída: contas a pagar.' },
];

const LANC_FORMAS = [
  { id: 'boleto', nome: 'Boleto' },
  { id: 'pix', nome: 'Pix' },
  { id: 'cartao', nome: 'Cartão' },
  { id: 'transferencia', nome: 'Transferência / TED' },
  { id: 'dinheiro', nome: 'Dinheiro' },
  { id: 'debito_automatico', nome: 'Débito automático' },
];

const LANC_TIPOS_PESSOA = [
  { id: 'aluno', nome: 'Aluno', descricao: 'Cadastro de Clientes › Alunos.' },
  { id: 'empresa', nome: 'Empresa', descricao: 'Cadastro de Clientes › Empresas.' },
  { id: 'responsavel', nome: 'Responsável', descricao: 'Responsável financeiro cadastrado em Responsáveis.' },
  { id: 'fornecedor', nome: 'Fornecedor', descricao: 'Cadastro Fornecedores do menu Financeiro.' },
  { id: 'instrutor', nome: 'Instrutor', descricao: 'Cadastro de Instrutores (PJ).' },
  { id: 'colaborador', nome: 'Colaborador', descricao: 'Cadastro de Colaboradores.' },
];

// Grupo da categoria = linha do DRE em que ela cai.
const LANC_GRUPOS_CATEGORIA = [
  { id: 'receita_cursos', nome: 'Receita de cursos', tipo: 'receita', descricao: 'Treinamentos, formações, in company, assinaturas e material.' },
  { id: 'custo_direto', nome: 'Custo direto', tipo: 'despesa', descricao: 'O que a turma consome: instrutor, material, coffee, licenças.' },
  { id: 'pessoas', nome: 'Pessoas', tipo: 'despesa', descricao: 'Folha, benefícios, 13º e comissões.' },
  { id: 'ocupacao', nome: 'Ocupação', tipo: 'despesa', descricao: 'Aluguel, energia, internet, limpeza da sede.' },
  { id: 'administrativo', nome: 'Administrativo e financeiro', tipo: 'despesa', descricao: 'Contabilidade, softwares, taxas bancárias.' },
  { id: 'marketing', nome: 'Marketing', tipo: 'despesa', descricao: 'Mídia, agência, eventos de divulgação.' },
  { id: 'tributos', nome: 'Tributos', tipo: 'despesa', descricao: 'DAS/ISS sobre a receita.' },
  { id: 'investimento', nome: 'Investimento', tipo: 'despesa', descricao: 'Equipamentos e aplicações (abaixo do EBITDA).' },
  { id: 'outros', nome: 'Outros', tipo: null, descricao: 'Receitas/despesas fora da operação.' },
];

// Segmento B2C/B2B: DERIVADO da natureza de quem contratou (CNPJ → B2B, CPF → B2C; Lancamentos.segmentoDe).
// Fica no lançamento só para leitura/gráficos.
const LANC_SEGMENTOS = [
  { id: 'b2c', nome: 'For You (B2C)', descricao: 'Aluno ou responsável pagando por conta própria.' },
  { id: 'b2b', nome: 'Corporativo (B2B)', descricao: 'Empresa contratante, in company ou assinatura corporativa.' },
];

const LANC_ORIGENS = [
  { id: 'contrato', nome: 'Venda', descricao: 'Parcela de venda de aluno/empresa (fonte de verdade: Vendas).' },
  { id: 'instrutor', nome: 'Instrutor', descricao: 'Pagamento programado no contrato do instrutor.' },
  { id: 'folha', nome: 'Folha', descricao: 'Custo mensal de pessoal (tabela mock LANC_FOLHA_MOCK; o sistema não faz folha).' },
  { id: 'manual', nome: 'Manual', descricao: 'Lançado à mão no financeiro.' },
];

const LANC_TIPOS_CONTA = [
  { id: 'gateway', nome: 'Gateway de pagamento' },
  { id: 'corrente', nome: 'Conta corrente' },
  { id: 'caixa', nome: 'Caixa (dinheiro)' },
];

const LANC_STATUS_ASAAS = [
  { id: 'PENDING', nome: 'Aguardando pagamento' },
  { id: 'RECEIVED', nome: 'Recebida' },
  { id: 'OVERDUE', nome: 'Vencida' },
  { id: 'REFUNDED', nome: 'Estornada' },
];

// Taxas do Asaas (sandbox) por tipo de cobrança.
const LANC_TAXAS_ASAAS = { BOLETO: 3.49, PIX: 1.99 };

// Categorias cuja linha manual mensal é reduzida do que as compras recebidas já lançaram no mês
// (material didático, coffee break, limpeza e material de escritório/copa — as compras passam a ser a fonte).
const LANC_CATEGORIAS_REDUZIDAS_POR_COMPRAS = new Set(['320', '330', '710', '750']);

// Parâmetros da semente (também usados pelo motor para novos meses).
const LANC_PARAMETROS = {
  impostoPct: 34,          // DAS sobre a receita recebida do mês anterior (reunião: "impostos 34%")
  taxaAsaasPct: 1.2,       // taxa média do gateway sobre o recebido no mês
  comissaoPct: 3,          // comissão comercial sobre contratos criados no mês anterior
  diaFolha: 5,             // folha paga no dia 5 do mês seguinte
  diaDas: 20,
  mesInicioSemente: '2025-09',
};

// [sup.] Folha MOCK por colaborador (08/09/2026). O sistema NÃO faz folha de
// pagamento e o cadastro de Colaboradores não guarda mais salário; a despesa
// "Folha" do financeiro continua existindo só para os painéis terem custo de
// pessoal. Valores = salário + VR × 22 que a semente antiga tinha, para os
// números do financeiro não mudarem. `decimoTerceiro` = base do 13º em
// dezembro (null para quem não tinha). Colaborador fora desta tabela não
// gera folha. No produto real isto entra por lançamento manual/importação.
const LANC_FOLHA_MOCK = {
  c1: { mensal: 15336, decimoTerceiro: 14500 },   // Ana Souza
  c2: { mensal: 9736, decimoTerceiro: 8900 },     // Bruno Lima
  c3: { mensal: 7036, decimoTerceiro: 6200, forma: 'transferencia' }, // Diego Rocha
  c4: { mensal: 5136, decimoTerceiro: 4300 },     // Fernanda Alves
  c5: { mensal: 4736, decimoTerceiro: 3900 },     // Gustavo Prado
  c6: { mensal: 3636, decimoTerceiro: 2800 },     // Elisa Martins
  c7: { mensal: 1400, decimoTerceiro: null },     // Juliana Ferreira (estágio)
  c8: { mensal: 5500, decimoTerceiro: null },     // Marcos Pereira (PJ)
  c9: { mensal: 3486, decimoTerceiro: 2650 },     // Patrícia Gomes (afastada — não gera enquanto afastada)
  c10: { mensal: 4200, decimoTerceiro: null },    // Otávio Rangel Delgado (PJ, meio período)
  c11: { mensal: 4536, decimoTerceiro: 3700 },    // Rafael Santos (desligado — não gera)
};

// ---------- Semente do plano ----------

const PLANO_CATEGORIAS_SEED = [
  // Receitas
  { id: 'cat-100', codigo: '100', nome: 'Treinamento ProWay', tipo: 'receita', grupo: 'receita_cursos', descricao: 'Cursos e formações vendidos a alunos e empresas.', status: 'ativo' },
  { id: 'cat-110', codigo: '110', nome: 'Treinamento in company', tipo: 'receita', grupo: 'receita_cursos', descricao: 'Turmas fechadas na empresa do cliente.', status: 'ativo' },
  { id: 'cat-120', codigo: '120', nome: 'Assinatura', tipo: 'receita', grupo: 'receita_cursos', descricao: 'Assinatura mensal (Barão Tech).', status: 'ativo' },
  { id: 'cat-130', codigo: '130', nome: 'Material / certificado', tipo: 'receita', grupo: 'receita_cursos', descricao: 'Apostila impressa, 2ª via de certificado.', status: 'ativo' },
  { id: 'cat-190', codigo: '190', nome: 'Outras receitas', tipo: 'receita', grupo: 'outros', descricao: 'Rendimentos, locação de sala, reembolsos.', status: 'ativo' },
  // Pessoas
  { id: 'cat-200', codigo: '200', nome: 'Salários (folha)', tipo: 'despesa', grupo: 'pessoas', descricao: 'Salário, bolsa-auxílio e PJ mensal da equipe.', status: 'ativo' },
  { id: 'cat-210', codigo: '210', nome: 'Benefícios colaboradores (VT/VR/Plano)', tipo: 'despesa', grupo: 'pessoas', descricao: 'Vale-transporte, vale-refeição, plano de saúde.', status: 'ativo' },
  { id: 'cat-212', codigo: '212', nome: 'Benefícios / Eventos', tipo: 'despesa', grupo: 'pessoas', descricao: 'Confraternizações e eventos internos.', status: 'ativo' },
  { id: 'cat-213', codigo: '213', nome: 'Benefícios / Batimento de metas', tipo: 'despesa', grupo: 'pessoas', descricao: 'Bônus por meta batida.', status: 'ativo' },
  { id: 'cat-214', codigo: '214', nome: 'Benefícios / Datas comemorativas & aniversários', tipo: 'despesa', grupo: 'pessoas', descricao: 'Presentes e lembranças.', status: 'ativo' },
  { id: 'cat-220', codigo: '220', nome: '13º Salário', tipo: 'despesa', grupo: 'pessoas', descricao: 'Décimo terceiro (CLT).', status: 'ativo' },
  { id: 'cat-230', codigo: '230', nome: 'Comissões', tipo: 'despesa', grupo: 'pessoas', descricao: 'Comissão comercial sobre vendas fechadas.', status: 'ativo' },
  // Custo direto
  { id: 'cat-310', codigo: '310', nome: 'Instrutores (PJ)', tipo: 'despesa', grupo: 'custo_direto', descricao: 'Pagamentos dos contratos de instrutor.', status: 'ativo' },
  { id: 'cat-320', codigo: '320', nome: 'Material didático', tipo: 'despesa', grupo: 'custo_direto', descricao: 'Apostilas, impressão, certificados.', status: 'ativo' },
  { id: 'cat-330', codigo: '330', nome: 'Coffee break', tipo: 'despesa', grupo: 'custo_direto', descricao: 'Coffee das turmas presenciais.', status: 'ativo' },
  { id: 'cat-340', codigo: '340', nome: 'Licenças e laboratório', tipo: 'despesa', grupo: 'custo_direto', descricao: 'Licenças de software e infraestrutura de laboratório por turma.', status: 'ativo' },
  // Marketing
  { id: 'cat-410', codigo: '410', nome: 'Marketing e mídia', tipo: 'despesa', grupo: 'marketing', descricao: 'Agência, anúncios, produção de conteúdo.', status: 'ativo' },
  // Ocupação
  { id: 'cat-701', codigo: '701', nome: 'Aluguel', tipo: 'despesa', grupo: 'ocupacao', descricao: 'Aluguel da sede.', status: 'ativo' },
  { id: 'cat-702', codigo: '702', nome: 'Energia', tipo: 'despesa', grupo: 'ocupacao', descricao: 'Celesc.', status: 'ativo' },
  { id: 'cat-703', codigo: '703', nome: 'Internet e telefonia', tipo: 'despesa', grupo: 'ocupacao', descricao: 'Link dedicado e telefonia.', status: 'ativo' },
  { id: 'cat-710', codigo: '710', nome: 'Limpeza e manutenção', tipo: 'despesa', grupo: 'ocupacao', descricao: 'Limpeza terceirizada e pequenos reparos.', status: 'ativo' },
  // Administrativo
  { id: 'cat-720', codigo: '720', nome: 'Contabilidade', tipo: 'despesa', grupo: 'administrativo', descricao: 'Honorários do escritório contábil.', status: 'ativo' },
  { id: 'cat-730', codigo: '730', nome: 'Softwares e assinaturas', tipo: 'despesa', grupo: 'administrativo', descricao: 'Google Workspace, licenças, ferramentas.', status: 'ativo' },
  { id: 'cat-740', codigo: '740', nome: 'Taxas bancárias / gateway', tipo: 'despesa', grupo: 'administrativo', descricao: 'Tarifas do Asaas e do banco.', status: 'ativo' },
  // 08/09/2026 (módulo Compras) [sup.]: café e copa e material de escritório não tinham categoria; plano salvo sem ela recebe em Lancamentos.plano().
  { id: 'cat-750', codigo: '750', nome: 'Material de escritório e copa', tipo: 'despesa', grupo: 'administrativo', descricao: 'Café, açúcar, copos, papel, toner e itens de escritório comprados pelo módulo Compras.', status: 'ativo' },
  // Tributos
  { id: 'cat-910', codigo: '910', nome: 'Impostos (DAS/ISS)', tipo: 'despesa', grupo: 'tributos', descricao: 'DAS do Simples / ISS sobre a receita recebida.', status: 'ativo' },
  // Investimento
  { id: 'cat-950', codigo: '950', nome: 'Aquisição de equipamentos', tipo: 'despesa', grupo: 'investimento', descricao: 'Computadores, projetores, mobiliário.', status: 'ativo' },
  { id: 'cat-980', codigo: '980', nome: 'Aplicações e reservas', tipo: 'despesa', grupo: 'investimento', descricao: 'Transferência para aplicação financeira / reserva.', status: 'ativo' },
];

// Centros do plano, numa lista só (plano.centrosCusto), pelo tipo:
// · 'custo' = departamentos (DEPARTAMENTOS em colaboradores-data.js): de quem é o gasto. A categoria diz o quê; o centro, quem consumiu.
// · 'receita' = de onde vem a venda (B2B, B2C, Orion…): CENTROS_RECEITA_SEED, de js/centros-receita.js (carregar antes deste).
// `grupoId` (opcional) agrupa centros do mesmo tipo sob outro centro de primeiro nível.
const PLANO_CENTROS_SEED = [
  { id: 'cc-100', codigo: '100', nome: 'Direção', descricao: 'Diretoria e custos da empresa como um todo: impostos sobre a receita.', tipo: 'custo', status: 'ativo' },
  { id: 'cc-200', codigo: '200', nome: 'Pedagógico', descricao: 'Entrega das aulas: instrutores, material didático, coffee, licenças e equipamentos das salas.', tipo: 'custo', status: 'ativo' },
  { id: 'cc-300', codigo: '300', nome: 'Comercial', descricao: 'Equipe de vendas, comissões e bônus de meta.', tipo: 'custo', status: 'ativo' },
  { id: 'cc-400', codigo: '400', nome: 'Marketing', descricao: 'Mídia, agência e equipe de marketing.', tipo: 'custo', status: 'ativo' },
  { id: 'cc-500', codigo: '500', nome: 'Suporte', descricao: 'Atendimento a alunos e professores e suporte técnico.', tipo: 'custo', status: 'ativo' },
  { id: 'cc-600', codigo: '600', nome: 'Financeiro', descricao: 'Contabilidade, taxas do banco e do Asaas, aplicações.', tipo: 'custo', status: 'ativo' },
  { id: 'cc-700', codigo: '700', nome: 'Administrativo', descricao: 'Sede (aluguel, energia, internet, limpeza), copa, escritório, softwares da equipe e benefícios.', tipo: 'custo', status: 'ativo' },
  ...CENTROS_RECEITA_SEED,
];

// `saldoInicialEm` = data de abertura no sistema; o saldo atual soma só os lançamentos pagos a partir dela.
const PLANO_CONTAS_SEED = [
  { id: 'cb-asaas', nome: 'Asaas — conta digital', instituicaoId: 'asaas', banco: 'Asaas', tipo: 'gateway', agencia: '0001', conta: '4402913-7', saldoInicial: 12340.55, saldoInicialEm: '2026-08-01', padraoRecebimento: true, padraoPagamento: false, status: 'ativo' },
  { id: 'cb-bb', nome: 'Banco do Brasil — c/c', instituicaoId: '019f0a7c-cb3e-7965-b0b9-2341b583f213', banco: 'Banco do Brasil Empresas', tipo: 'corrente', agencia: '1234-5', conta: '58.213-0', saldoInicial: 186400, saldoInicialEm: '2026-08-01', padraoRecebimento: false, padraoPagamento: true, status: 'ativo' },
  { id: 'cb-caixa', nome: 'Caixa interno', instituicaoId: 'caixa-interno', banco: 'Caixa interno (dinheiro)', tipo: 'caixa', agencia: '', conta: '', saldoInicial: 1250, saldoInicialEm: '2026-08-01', padraoRecebimento: false, padraoPagamento: false, status: 'ativo' },
];

const PLANO_FORNECEDORES_SEED = [
  { id: 'for-imob', nome: 'Imobiliária Vale Administradora', documento: '05.412.887/0001-40', categoriaId: 'cat-701', centroCustoId: 'cc-700', contato: { nome: 'Sandra Kohler', email: 'locacao@valeadm.com.br', telefone: '(47) 3322-1180' }, pix: '05412887000140', observacoes: 'Contrato de locação até 12/2027, reajuste IGP-M em janeiro.', status: 'ativo' },
  { id: 'for-celesc', nome: 'Celesc Distribuição', documento: '08.336.783/0001-90', categoriaId: 'cat-702', centroCustoId: 'cc-700', contato: { nome: 'Atendimento', email: 'faturas@celesc.com.br', telefone: '0800 048 0120' }, pix: '', observacoes: 'UC 3214-8. Débito automático no BB.', status: 'ativo' },
  { id: 'for-unifique', nome: 'Unifique Telecomunicações', documento: '02.255.187/0001-08', categoriaId: 'cat-703', centroCustoId: 'cc-700', contato: { nome: 'Suporte corporativo', email: 'corporativo@unifique.com.br', telefone: '(47) 3234-0000' }, pix: '', observacoes: 'Link dedicado 500 Mb + 2 ramais.', status: 'ativo' },
  { id: 'for-contab', nome: 'Contábil Blumenau Assessoria', documento: '11.980.302/0001-61', categoriaId: 'cat-720', centroCustoId: 'cc-600', contato: { nome: 'Ricardo Steinbach', email: 'ricardo@contabilblu.com.br', telefone: '(47) 3037-4410' }, pix: 'ricardo@contabilblu.com.br', observacoes: 'Honorários mensais; DAS enviado até o dia 15.', status: 'ativo' },
  { id: 'for-grafica', nome: 'Gráfica Nova Letra', documento: '79.115.664/0001-02', categoriaId: 'cat-320', centroCustoId: 'cc-200', contato: { nome: 'Marcelo Vieira', email: 'orcamento@novaletra.com.br', telefone: '(47) 3323-7880' }, pix: '79115664000102', observacoes: 'Apostilas e certificados; prazo 5 dias úteis.', status: 'ativo' },
  { id: 'for-buffet', nome: 'Buffet Sabor & Cia', documento: '21.447.905/0001-33', categoriaId: 'cat-330', centroCustoId: 'cc-200', contato: { nome: 'Cláudia Ramos', email: 'claudia@saborecia.com.br', telefone: '(47) 99911-2030' }, pix: '47999112030', observacoes: 'Coffee das turmas presenciais; fecha por mês.', status: 'ativo' },
  { id: 'for-agencia', nome: 'Agência Pulso Digital', documento: '33.612.778/0001-55', categoriaId: 'cat-410', centroCustoId: 'cc-400', contato: { nome: 'Thiago Muller', email: 'thiago@pulsodigital.com.br', telefone: '(47) 98811-4567' }, pix: 'financeiro@pulsodigital.com.br', observacoes: 'Fee mensal + mídia paga (Meta/Google).', status: 'ativo' },
  { id: 'for-google', nome: 'Google Workspace', documento: '06.990.590/0001-23', categoriaId: 'cat-730', centroCustoId: 'cc-700', contato: { nome: 'Faturamento', email: 'billing-noreply@google.com', telefone: '' }, pix: '', observacoes: 'Business Standard, 18 contas. Cartão corporativo.', status: 'ativo' },
  { id: 'for-jetbrains', nome: 'JetBrains / licenças de laboratório', documento: '—', categoriaId: 'cat-730', centroCustoId: 'cc-200', contato: { nome: 'Sales', email: 'sales@jetbrains.com', telefone: '' }, pix: '', observacoes: 'Licenças educacionais + Visual Studio; cobrança anual rateada.', status: 'ativo' },
  { id: 'for-limpeza', nome: 'Limpeza Total Serviços', documento: '15.203.441/0001-77', categoriaId: 'cat-710', centroCustoId: 'cc-700', contato: { nome: 'Joana Batista', email: 'contato@limpezatotal.com.br', telefone: '(47) 3329-5510' }, pix: '15203441000177', observacoes: '3x por semana; produtos inclusos.', status: 'ativo' },
  { id: 'for-asaas', nome: 'Asaas Gestão Financeira', documento: '19.540.550/0001-21', categoriaId: 'cat-740', centroCustoId: 'cc-600', contato: { nome: 'Suporte', email: 'suporte@asaas.com', telefone: '' }, pix: '', observacoes: 'Taxas de boleto/Pix descontadas na conta digital.', status: 'ativo' },
  { id: 'for-receita', nome: 'Receita Federal — DAS (Simples Nacional)', documento: '00.394.460/0058-87', categoriaId: 'cat-910', centroCustoId: 'cc-100', contato: { nome: '', email: '', telefone: '' }, pix: '', observacoes: 'Guia gerada pelo contador; vence dia 20.', status: 'ativo' },
  { id: 'for-dell', nome: 'Dell Computadores do Brasil', documento: '72.381.189/0001-10', categoriaId: 'cat-950', centroCustoId: 'cc-200', contato: { nome: 'Conta corporativa', email: 'vendas_br@dell.com', telefone: '0800 970 3355' }, pix: '', observacoes: 'Notebooks e monitores dos laboratórios.', status: 'ativo' },
  { id: 'for-bb', nome: 'Banco do Brasil — aplicações', documento: '00.000.000/0001-91', categoriaId: 'cat-980', centroCustoId: 'cc-600', contato: { nome: 'Gerente PJ', email: '', telefone: '(47) 3326-2000' }, pix: '', observacoes: 'CDB/RDB da reserva.', status: 'ativo' },
  { id: 'for-havan', nome: 'Havan', documento: '79.379.491/0001-83', categoriaId: 'cat-214', centroCustoId: 'cc-700', contato: { nome: '', email: '', telefone: '' }, pix: '', observacoes: 'Presentes de aniversário e datas comemorativas.', status: 'ativo' },
];

const PLANO_SEED = {
  categorias: PLANO_CATEGORIAS_SEED,
  centrosCusto: PLANO_CENTROS_SEED,
  contasBancarias: PLANO_CONTAS_SEED,
  fornecedores: PLANO_FORNECEDORES_SEED,
};

// ---------- Helpers determinísticos ----------

// PRNG mulberry32 com seed fixa: mesma sequência em toda carga.
function lancPrng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash curto e estável de uma string (para ids Asaas determinísticos).
function lancHash(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// Id no formato do Asaas: 'pay_' + 12 caracteres (derivado do texto).
function lancIdAsaas(texto) {
  const alfabeto = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const rnd = lancPrng(lancHash(texto));
  let s = '';
  for (let i = 0; i < 12; i += 1) s += alfabeto[Math.floor(rnd() * alfabeto.length)];
  return `pay_${s}`;
}

const lancArred = (n) => Math.round((Number(n) || 0) * 100) / 100;
const lancMesesEntre = (ini, fim) => {
  const out = []; let [a, m] = ini.split('-').map(Number); const [af, mf] = fim.split('-').map(Number);
  while (a < af || (a === af && m <= mf)) { out.push(`${a}-${String(m).padStart(2, '0')}`); m += 1; if (m > 12) { m = 1; a += 1; } }
  return out;
};
const lancMesAnterior = (ym) => { const [a, m] = ym.split('-').map(Number); return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`; };
const lancMesSeguinte = (ym) => { const [a, m] = ym.split('-').map(Number); return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`; };
const lancUltimoDia = (ym) => { const [a, m] = ym.split('-').map(Number); return new Date(a, m, 0).getDate(); };
const lancDia = (ym, d) => `${ym}-${String(Math.min(d, lancUltimoDia(ym))).padStart(2, '0')}`;
const lancSomarDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const lancRotuloMes = (ym) => `${ym.slice(5, 7)}/${ym.slice(0, 4)}`;

// ---------- Semente de lançamentos manuais ----------

// Gera as despesas (e poucas receitas) manuais de set/2025 → mês de `hoje`, mais
// os previstos dos 2 meses seguintes. `agregados` vem do motor:
//   { receitaPagaPorMes: { 'YYYY-MM': valor }, contratosCriadosPorMes: { 'YYYY-MM': { n, valor, valorB2b } },
//     turmasPresenciaisPorMes: { 'YYYY-MM': { total, incompany } }, colaboradorComissao: { id, nome, documento } | null,
//     alunos: [{ id, nome, documento }], empresas: [{ id, nome, documento }], cursos: ['nome', …],  ← para o legado Iugu
//     comprasPorMes: { 'YYYY-MM': { '330': valor, … } } }  ← compras recebidas do módulo Compras, por mês de competência e código de categoria
// Dupla contagem (08/09/2026): as compras recebidas geram a própria conta a pagar (origem 'compra'); nas categorias
// LANC_CATEGORIAS_REDUZIDAS_POR_COMPRAS a linha manual do mesmo mês é reduzida do que já entrou via Compras (e some se
// ficar ≤ R$ 1), para o total mensal por categoria ficar na mesma ordem de grandeza de antes.
function gerarLancamentosManuaisSeed(agregados, plano = PLANO_SEED, hoje = (typeof TURMA_SEED_HOJE !== 'undefined' ? TURMA_SEED_HOJE : new Date().toISOString().slice(0, 10))) {
  const rnd = lancPrng(20260829);
  const entre = (a, b) => a + rnd() * (b - a);
  const cat = (codigo) => plano.categorias.find((c) => c.codigo === codigo);
  const centro = (codigo) => plano.centrosCusto.find((c) => c.codigo === codigo);
  const forn = (id) => plano.fornecedores.find((f) => f.id === id);
  const contaRec = plano.contasBancarias.find((c) => c.padraoRecebimento) ?? plano.contasBancarias[0];
  const contaPag = plano.contasBancarias.find((c) => c.padraoPagamento) ?? plano.contasBancarias[0];
  const contaAsaas = plano.contasBancarias.find((c) => c.tipo === 'gateway') ?? contaRec;
  const mesHoje = hoje.slice(0, 7);
  const meses = lancMesesEntre(LANC_PARAMETROS.mesInicioSemente, lancMesSeguinte(lancMesSeguinte(mesHoje)));
  const { contratosCriadosPorMes = {}, turmasPresenciaisPorMes = {}, colaboradorComissao = null, alunos = [], empresas = [], cursos = [], comprasPorMes = {} } = agregados ?? {};
  // Saldo ainda não abatido das compras, por mês e categoria (cada linha manual consome o que puder).
  const restoCompras = Object.fromEntries(Object.entries(comprasPorMes).map(([ym, porCod]) => [ym, { ...porCod }]));
  // Receita recebida por mês = contratos (vem do motor) + legado Iugu (gerado abaixo); base das taxas 740 e do DAS 910.
  const receitaPagaPorMes = { ...(agregados?.receitaPagaPorMes ?? {}) };

  // Vencidos de propósito (não pagos apesar de vencimento < hoje): energia e internet de ago/2026, marketing de jul/2026.
  const naoPagar = new Set([`702:${mesHoje}`, `703:${mesHoje}`, `410:${lancMesAnterior(mesHoje)}`]);

  const lista = [];
  const pessoaForn = (f) => ({ tipo: 'fornecedor', id: f.id, nome: f.nome, documento: f.documento });
  const lancar = ({ codigo, ym, dia, valor, descricao, fornecedorId = null, pessoa = null, centroCodigo = null, forma = 'boleto', tipo = 'despesa', contaId = null, sufixo = '', competencia = null, observacao = '' }) => {
    const c = cat(codigo);
    const f = fornecedorId ? forn(fornecedorId) : null;
    const vencimento = lancDia(ym, dia);
    const chave = `${codigo}:${ym}`;
    // Abate o que as compras recebidas do mês já lançaram nesta categoria (ver comentário do gerador).
    if (LANC_CATEGORIAS_REDUZIDAS_POR_COMPRAS.has(codigo) && (restoCompras[ym]?.[codigo] ?? 0) > 0) {
      const abatido = Math.min(restoCompras[ym][codigo], valor);
      restoCompras[ym][codigo] = lancArred(restoCompras[ym][codigo] - abatido);
      valor = lancArred(valor - abatido);
      if (valor <= 1) return null;
      observacao = [observacao, `Valor líquido: ${abatido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} deste mês já entraram pelo módulo Compras.`].filter(Boolean).join(' ');
    }
    const vencido = vencimento <= hoje;
    const pago = vencido && !naoPagar.has(chave);
    const atraso = Math.floor(entre(0, 3.99));
    const status = pago ? 'pago' : 'previsto';
    const criadoEm = `${lancSomarDias(vencimento, -20)}T09:00:00`;
    const l = {
      id: `lm-${codigo}-${ym}${sufixo}`, tipo, descricao, valor: lancArred(valor), desconto: 0,
      competencia: competencia ?? ym, vencimento, pagoEm: pago ? lancSomarDias(vencimento, atraso) : null,
      status, forma,
      // Receita não tem centro de custo; o segmento B2C/B2B o motor deriva da pessoa.
      categoriaId: c?.id ?? null, centroCustoId: tipo === 'receita' ? null : centro(centroCodigo ?? '')?.id ?? (f ? f.centroCustoId : null),
      contaBancariaId: contaId ?? (tipo === 'receita' ? contaRec.id : contaPag.id), segmento: null,
      pessoa: pessoa ?? (f ? pessoaForn(f) : null),
      turmaId: null, cursoId: null,
      origem: { tipo: 'manual' },
      asaas: null, nf: null, conciliado: null,
      observacao, criadoEm, atualizadoEm: criadoEm,
      historico: [{ em: criadoEm, texto: 'Lançamento criado (semente)' }, ...(pago ? [{ em: `${lancSomarDias(vencimento, atraso)}T10:00:00`, texto: `Baixa registrada — ${LANC_FORMAS.find((x) => x.id === forma)?.nome ?? forma}` }] : [])],
    };
    lista.push(l);
    return l;
  };

  // [sup.] legado Iugu — só para a semente ter volume. A semente de contratos cobre uma fração da
  // carteira; as faturas do gateway antigo (Iugu) completam a receita mensal para ~R$ 95–120 mil com
  // sazonalidade (jan/fev e jul/ago mais fortes, dezembro fraco). B2B ≈ 27% do total.
  const LEGADO = { alvoBase: 126000, fator: { 1: 1.15, 2: 1.15, 7: 1.12, 8: 1.12, 12: 0.72, 6: 0.95, 11: 0.95 }, pctB2b: 0.27, pctNaoPagos: 0.04, emitidosProximoMes: 12 };
  let nFatura = 4100;
  let iAluno = 0; let iEmpresa = 0;
  const rotativo = (lista, i) => (lista.length ? lista[i % lista.length] : null);
  const cursoNome = () => (cursos.length ? cursos[Math.floor(rnd() * cursos.length)] : 'Curso');
  const fatura = ({ ym, b2b, valor, futuro }) => {
    nFatura += 1;
    const pessoaBase = b2b ? rotativo(empresas, iEmpresa++) : rotativo(alunos, iAluno++);
    const pessoa = pessoaBase ? { tipo: b2b ? 'empresa' : 'aluno', id: pessoaBase.id, nome: pessoaBase.nome, documento: pessoaBase.documento ?? '' } : { tipo: b2b ? 'empresa' : 'aluno', id: null, nome: b2b ? 'Empresa (legado)' : 'Aluno (legado)', documento: '' };
    const dia = 1 + Math.floor(rnd() * 27);
    const vencimento = lancDia(ym, dia);
    const forma = b2b ? (rnd() < 0.6 ? 'boleto' : 'transferencia') : (rnd() < 0.65 ? 'boleto' : 'pix');
    const vencido = vencimento <= hoje;
    const naoPago = vencido && rnd() < LEGADO.pctNaoPagos;
    const pago = vencido && !naoPago;
    const pagoEm = pago ? lancSomarDias(vencimento, Math.floor(rnd() * 5)) : null;
    if (pago) receitaPagaPorMes[pagoEm.slice(0, 7)] = lancArred((receitaPagaPorMes[pagoEm.slice(0, 7)] ?? 0) + valor);
    const criadoEm = `${lancSomarDias(vencimento, -12)}T09:00:00`;
    const curso = cursoNome();
    lista.push({
      id: `lm-iugu-${nFatura}`, tipo: 'receita', descricao: `Fatura Iugu #${nFatura} — ${curso}`, valor: lancArred(valor), desconto: 0,
      competencia: ym, vencimento, pagoEm, status: pago ? 'pago' : 'emitido', forma,
      categoriaId: cat(b2b ? '110' : '100')?.id ?? null, centroCustoId: null,
      contaBancariaId: contaRec.id, segmento: b2b ? 'b2b' : 'b2c', pessoa, turmaId: null, cursoId: null,
      origem: { tipo: 'manual', legado: 'iugu', fatura: nFatura },
      asaas: null, nf: null, conciliado: null, observacao: futuro ? 'Fatura emitida no Iugu (legado).' : '', criadoEm, atualizadoEm: criadoEm,
      historico: [{ em: criadoEm, texto: `Fatura #${nFatura} emitida no Iugu (legado)` }, ...(pago ? [{ em: `${pagoEm}T10:00:00`, texto: 'Baixa registrada — Iugu' }] : [])],
    });
  };
  lancMesesEntre(LANC_PARAMETROS.mesInicioSemente, mesHoje).forEach((ym) => {
    const mes = Number(ym.slice(5, 7));
    const alvo = LEGADO.alvoBase * (LEGADO.fator[mes] ?? 1) - (agregados?.receitaPagaPorMes?.[ym] ?? 0);
    let restoB2b = alvo * LEGADO.pctB2b; let restoB2c = alvo - restoB2b;
    while (restoB2b > 4000) { const v = Math.min(restoB2b, 4000 + rnd() * 14000); fatura({ ym, b2b: true, valor: v }); restoB2b -= v; }
    while (restoB2c > 300) { const v = Math.min(restoB2c, 300 + rnd() * 2600); fatura({ ym, b2b: false, valor: v }); restoB2c -= v; }
  });
  // Faturas já emitidas para o mês seguinte (a receber).
  for (let k = 0; k < LEGADO.emitidosProximoMes; k += 1) fatura({ ym: lancMesSeguinte(mesHoje), b2b: k % 4 === 0, valor: k % 4 === 0 ? 4000 + rnd() * 9000 : 300 + rnd() * 2600, futuro: true });

  meses.forEach((ym) => {
    const [ano, mes] = ym.split('-').map(Number);
    const verao = mes === 12 || mes <= 3;
    const campanha = mes === 1 || mes === 2 || mes === 7 || mes === 8;
    const futuro = ym > mesHoje;
    const rot = lancRotuloMes(ym);

    // Ocupação
    lancar({ codigo: '701', ym, dia: 10, valor: ano >= 2026 ? 10290 : 9800, descricao: `Aluguel da sede — ${rot}`, fornecedorId: 'for-imob', centroCodigo: '700', forma: 'boleto' });
    lancar({ codigo: '702', ym, dia: 15, valor: verao ? entre(1550, 1900) : entre(1100, 1450), descricao: `Energia elétrica — ${rot}`, fornecedorId: 'for-celesc', centroCodigo: '700', forma: 'debito_automatico' });
    lancar({ codigo: '703', ym, dia: 12, valor: 640, descricao: `Internet e telefonia — ${rot}`, fornecedorId: 'for-unifique', centroCodigo: '700', forma: 'boleto' });
    lancar({ codigo: '710', ym, dia: 8, valor: 1900, descricao: `Limpeza da sede — ${rot}`, fornecedorId: 'for-limpeza', centroCodigo: '700', forma: 'pix' });
    // Administrativo
    lancar({ codigo: '720', ym, dia: 15, valor: 1450, descricao: `Honorários contábeis — ${rot}`, fornecedorId: 'for-contab', centroCodigo: '600', forma: 'boleto' });
    lancar({ codigo: '730', ym, dia: 5, valor: 890, descricao: `Google Workspace (18 contas) — ${rot}`, fornecedorId: 'for-google', centroCodigo: '700', forma: 'cartao', sufixo: '-a' });
    lancar({ codigo: '730', ym, dia: 5, valor: 1410, descricao: `Licenças JetBrains / laboratório — ${rot}`, fornecedorId: 'for-jetbrains', centroCodigo: '200', forma: 'cartao', sufixo: '-b' });
    // Marketing: maior nas campanhas de matrícula (jan/fev e jul/ago).
    // [sup.] legado Iugu — só para a semente ter volume: marketing na faixa baixa da spec para o resultado fechar.
    lancar({ codigo: '410', ym, dia: 25, valor: campanha ? entre(5200, 6400) : entre(3000, 3600), descricao: `Agência + mídia paga — ${rot}`, fornecedorId: 'for-agencia', centroCodigo: '400', forma: 'transferencia' });

    // Custo direto proporcional às turmas presenciais/híbridas do mês.
    const tp = turmasPresenciaisPorMes[ym] ?? { total: 0, incompany: 0 };
    const abertas = Math.max(0, tp.total - tp.incompany);
    // [sup.] legado Iugu — só para a semente ter volume: material/coffee na faixa baixa (≈R$ 320/≈R$ 450 por turma).
    if (abertas) {
      lancar({ codigo: '320', ym, dia: 20, valor: abertas * entre(290, 350), descricao: `Apostilas e certificados — ${abertas} turma${abertas > 1 ? 's' : ''} (${rot})`, fornecedorId: 'for-grafica', centroCodigo: '200', forma: 'pix' });
      lancar({ codigo: '330', ym, dia: 28, valor: abertas * entre(420, 480), descricao: `Coffee break — ${abertas} turma${abertas > 1 ? 's' : ''} (${rot})`, fornecedorId: 'for-buffet', centroCodigo: '200', forma: 'pix' });
    }
    if (tp.incompany) {
      lancar({ codigo: '320', ym, dia: 20, valor: tp.incompany * entre(290, 350), descricao: `Apostilas in company — ${tp.incompany} turma${tp.incompany > 1 ? 's' : ''} (${rot})`, fornecedorId: 'for-grafica', centroCodigo: '200', forma: 'pix', sufixo: '-b2b' });
      lancar({ codigo: '330', ym, dia: 28, valor: tp.incompany * entre(420, 480), descricao: `Coffee break in company — ${tp.incompany} turma${tp.incompany > 1 ? 's' : ''} (${rot})`, fornecedorId: 'for-buffet', centroCodigo: '200', forma: 'pix', sufixo: '-b2b' });
    }

    // Taxas do gateway: % do recebido no mês, debitadas no último dia (na própria conta Asaas).
    const recebido = receitaPagaPorMes[ym] ?? 0;
    if (recebido > 0) {
      lancar({ codigo: '740', ym, dia: 31, valor: recebido * (LANC_PARAMETROS.taxaAsaasPct / 100), descricao: `Taxas Asaas (${LANC_PARAMETROS.taxaAsaasPct.toLocaleString('pt-BR')}% do recebido) — ${rot}`, fornecedorId: 'for-asaas', centroCodigo: '600', forma: 'debito_automatico', contaId: contaAsaas.id });
    }
    // Impostos: DAS = 34% da receita RECEBIDA no mês anterior, vence dia 20.
    const mesAnt = lancMesAnterior(ym);
    const baseDas = receitaPagaPorMes[mesAnt] ?? 0;
    if (baseDas > 0) {
      lancar({ codigo: '910', ym, dia: LANC_PARAMETROS.diaDas, valor: baseDas * (LANC_PARAMETROS.impostoPct / 100), descricao: `DAS — competência ${lancRotuloMes(mesAnt)}`, fornecedorId: 'for-receita', centroCodigo: '100', forma: 'boleto', competencia: mesAnt, observacao: `${LANC_PARAMETROS.impostoPct}% sobre R$ ${baseDas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebidos em ${lancRotuloMes(mesAnt)}.` });
    }
    // Comissões: 3% dos contratos criados no mês anterior, pagas com a folha (dia 5).
    const cc = contratosCriadosPorMes[mesAnt];
    if (cc && cc.valor > 0 && colaboradorComissao) {
      const b2c = cc.valor - (cc.valorB2b ?? 0);
      if (b2c > 0) lancar({ codigo: '230', ym, dia: LANC_PARAMETROS.diaFolha, valor: b2c * (LANC_PARAMETROS.comissaoPct / 100), descricao: `Comissão ${LANC_PARAMETROS.comissaoPct}% — ${cc.n} venda${cc.n > 1 ? 's' : ''} de ${lancRotuloMes(mesAnt)}`, pessoa: { tipo: 'colaborador', ...colaboradorComissao }, centroCodigo: '300', forma: 'pix', competencia: mesAnt });
      if ((cc.valorB2b ?? 0) > 0) lancar({ codigo: '230', ym, dia: LANC_PARAMETROS.diaFolha, valor: cc.valorB2b * (LANC_PARAMETROS.comissaoPct / 100), descricao: `Comissão ${LANC_PARAMETROS.comissaoPct}% — vendas B2B de ${lancRotuloMes(mesAnt)}`, pessoa: { tipo: 'colaborador', ...colaboradorComissao }, centroCodigo: '300', forma: 'pix', competencia: mesAnt, sufixo: '-b2b' });
    }

    // Receita recorrente fora dos contratos: assinatura Barão Tech (B2B, Pix na conta Asaas).
    if (!futuro || ym === lancMesSeguinte(mesHoje)) {
      lancar({ tipo: 'receita', codigo: '120', ym, dia: 10, valor: 1290, descricao: `Assinatura Barão Tech — ${rot}`, pessoa: { tipo: 'empresa', id: null, nome: 'Barão Tech Soluções Ltda', documento: '41.220.735/0001-09' }, forma: 'pix', contaId: contaAsaas.id });
    }
  });

  // Pontuais
  lancar({ codigo: '950', ym: '2025-11', dia: 18, valor: 8940, descricao: 'Notebooks Dell Inspiron (2 un.) — laboratório 2', fornecedorId: 'for-dell', centroCodigo: '200', forma: 'boleto' });
  lancar({ codigo: '950', ym: '2026-04', dia: 22, valor: 4750, descricao: 'Projetor + 2 monitores 27" — sala 4', fornecedorId: 'for-dell', centroCodigo: '200', forma: 'cartao' });
  lancar({ codigo: '980', ym: '2026-01', dia: 15, valor: 15000, descricao: 'Aplicação CDB — reserva de caixa', fornecedorId: 'for-bb', centroCodigo: '600', forma: 'transferencia' });
  lancar({ codigo: '212', ym: '2025-12', dia: 19, valor: 2400, descricao: 'Confraternização de fim de ano da equipe', fornecedorId: 'for-buffet', centroCodigo: '700', forma: 'pix' });
  lancar({ codigo: '214', ym: '2025-12', dia: 15, valor: 950, descricao: 'Presentes de Natal — equipe', fornecedorId: 'for-havan', centroCodigo: '700', forma: 'cartao' });
  lancar({ codigo: '214', ym: '2026-03', dia: 8, valor: 320, descricao: 'Dia da Mulher — lembranças', fornecedorId: 'for-havan', centroCodigo: '700', forma: 'cartao' });
  lancar({ codigo: '214', ym: '2026-06', dia: 12, valor: 260, descricao: 'Aniversariantes do semestre — bolo e lembranças', fornecedorId: 'for-havan', centroCodigo: '700', forma: 'dinheiro', contaId: plano.contasBancarias.find((c) => c.tipo === 'caixa')?.id });
  if (colaboradorComissao) lancar({ codigo: '213', ym: '2026-03', dia: 5, valor: 1800, descricao: 'Bônus — meta de matrículas do Super DEV 9 batida', pessoa: { tipo: 'colaborador', ...colaboradorComissao }, centroCodigo: '300', forma: 'pix', competencia: '2026-02' });
  lancar({ tipo: 'receita', codigo: '190', ym: '2026-05', dia: 9, valor: 800, descricao: 'Locação da sala 1 — evento Meetup Python Blumenau', pessoa: { tipo: 'empresa', id: null, nome: 'Comunidade Python Blumenau', documento: '' }, forma: 'pix', contaId: contaAsaas.id });
  lancar({ tipo: 'receita', codigo: '130', ym: '2026-07', dia: 14, valor: 60, descricao: '2ª via de certificado — Super DEV 7', pessoa: { tipo: 'aluno', id: null, nome: 'Aluno avulso (balcão)', documento: '' }, forma: 'dinheiro', contaId: plano.contasBancarias.find((c) => c.tipo === 'caixa')?.id });

  return lista;
}

// ---------- Extrato Asaas simulado ----------

// Movimentos da conta Asaas nos últimos 90 dias a partir dos lançamentos pagos nela:
// um crédito por receita paga (referência = asaas.id quando houver), o débito da taxa
// por crédito (referência = asaas.id ou 'taxa'), 2 transferências para o BB, 3 créditos sem lançamento e 1 crédito com valor
// divergente. Dois lançamentos pagos ficam de fora para a conciliação apontar "sem movimento".
// Também gera o crédito espelho das transferências na conta do BB e os pagamentos dela (gerarExtratoPagamentosSeed).
function gerarExtratoAsaasSeed(lancamentos, plano = PLANO_SEED, hoje = (typeof TURMA_SEED_HOJE !== 'undefined' ? TURMA_SEED_HOJE : new Date().toISOString().slice(0, 10))) {
  const contaAsaas = plano.contasBancarias.find((c) => c.tipo === 'gateway') ?? plano.contasBancarias[0];
  const contaBb = plano.contasBancarias.find((c) => c.padraoPagamento && c.id !== contaAsaas.id) ?? null;
  const de = lancSomarDias(hoje, -90);
  const cat = (codigo) => plano.categorias.find((c) => c.codigo === codigo)?.id ?? null;
  const movs = [];
  let n = 0;
  const mov = (d) => { n += 1; movs.push({ id: `mov-${String(n).padStart(4, '0')}`, contaId: contaAsaas.id, referencia: null, categoriaSugerida: null, ...d }); };

  const pagas = lancamentos
    .filter((l) => l.status === 'pago' && l.contaBancariaId === contaAsaas.id && l.pagoEm && l.pagoEm >= de && l.pagoEm <= hoje)
    .sort((a, b) => a.pagoEm.localeCompare(b.pagoEm) || a.id.localeCompare(b.id));
  const receitas = pagas.filter((l) => l.tipo === 'receita');
  // Dois lançamentos pagos que "não caíram" no extrato (sem movimento).
  const semMovimento = new Set(receitas.filter((_, i) => i % 9 === 4).slice(0, 2).map((l) => l.id));
  // Um crédito com valor divergente (sem referência, para não casar pelo id).
  const divergente = receitas.filter((l) => !semMovimento.has(l.id))[Math.min(3, Math.max(0, receitas.length - 1))]?.id ?? null;

  receitas.forEach((l) => {
    if (semMovimento.has(l.id)) return;
    const valorFinal = lancArred((Number(l.valor) || 0) - (Number(l.desconto) || 0));
    const nome = l.pessoa?.nome ?? '';
    const ehDiv = l.id === divergente;
    const tipoCob = l.asaas?.tipo ?? (l.forma === 'pix' ? 'PIX' : 'BOLETO');
    mov({ data: l.pagoEm, tipo: 'credito', valor: ehDiv ? lancArred(valorFinal + 12.5) : valorFinal, descricao: `${tipoCob === 'PIX' ? 'Pix' : 'Boleto'} – ${nome}`, referencia: ehDiv ? null : (l.asaas?.id ?? null), categoriaSugerida: l.categoriaId });
    mov({ data: l.pagoEm, tipo: 'debito', valor: LANC_TAXAS_ASAAS[tipoCob] ?? 3.49, descricao: `Taxa ${tipoCob === 'PIX' ? 'Pix' : 'boleto'} – ${nome}`, referencia: l.asaas?.id ?? 'taxa', categoriaSugerida: cat('740') });
  });
  // Despesas pagas na conta Asaas (ex.: taxas mensais) também aparecem.
  pagas.filter((l) => l.tipo === 'despesa').forEach((l) => {
    mov({ data: l.pagoEm, tipo: 'debito', valor: lancArred((Number(l.valor) || 0) - (Number(l.desconto) || 0)), descricao: l.descricao, referencia: null, categoriaSugerida: l.categoriaId });
  });
  // Transferências para o BB (débito aqui, crédito lá).
  [[-62, 9000], [-21, 12500]].forEach(([dias, valor]) => {
    const data = lancSomarDias(hoje, dias);
    mov({ data, tipo: 'debito', valor, descricao: `Transferência para Banco do Brasil ag. ${contaBb?.agencia ?? ''} c/c ${contaBb?.conta ?? ''}`, referencia: 'transf', categoriaSugerida: 'transferencia' });
    if (contaBb) { n += 1; movs.push({ id: `mov-${String(n).padStart(4, '0')}`, contaId: contaBb.id, data, tipo: 'credito', valor, descricao: 'TED recebida — Asaas Gestão Financeira', referencia: 'transf', categoriaSugerida: 'transferencia' }); }
  });
  // Créditos sem lançamento correspondente.
  [[-40, 350, 'Pix recebido – Lucas Andrade (aluno)'], [-17, 1290, 'Pix recebido – Barão Tech Soluções'], [-6, 120, 'Pix recebido – Mariana Kretzer (certificado)']].forEach(([dias, valor, descricao]) => {
    mov({ data: lancSomarDias(hoje, dias), tipo: 'credito', valor, descricao, referencia: null, categoriaSugerida: cat('190') });
  });
  return [...movs, ...gerarExtratoPagamentosSeed(lancamentos, plano, hoje)].sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
}

// Extrato da conta padrão de pagamento (fora do gateway): um débito por despesa paga nela (crédito, se for receita), no dia
// da baixa, desde a abertura da conta ou dos últimos 90 dias, o que vier antes. Sem buracos de propósito: o extrato fecha
// com o saldo de Lancamentos.balanco e a conciliação acha cada um por valor e data. Id `mov-<lançamento>`: estável e sem
// colidir com os `mov-NNNN` do Asaas (a migração do extrato salvo v2 → v3 só acrescenta estes).
const LANC_EXTRATO_PAGAMENTO = { boleto: 'PAG BOLETO', pix: 'PIX ENVIADO', transferencia: 'TED ENVIADA', debito_automatico: 'DÉBITO AUTOMÁTICO', cartao: 'COMPRA CARTÃO DÉBITO' };
function gerarExtratoPagamentosSeed(lancamentos, plano = PLANO_SEED, hoje = (typeof TURMA_SEED_HOJE !== 'undefined' ? TURMA_SEED_HOJE : new Date().toISOString().slice(0, 10))) {
  const conta = plano.contasBancarias.find((c) => c.padraoPagamento && c.tipo !== 'gateway');
  if (!conta) return [];
  const noventa = lancSomarDias(hoje, -90);
  const de = conta.saldoInicialEm && conta.saldoInicialEm < noventa ? conta.saldoInicialEm : noventa;
  return lancamentos
    .filter((l) => l.status === 'pago' && l.contaBancariaId === conta.id && l.pagoEm && l.pagoEm >= de && l.pagoEm <= hoje)
    .map((l) => {
      const credito = l.tipo === 'receita';
      const rotulo = credito ? (l.forma === 'pix' ? 'PIX RECEBIDO' : 'TED RECEBIDA') : (LANC_EXTRATO_PAGAMENTO[l.forma] ?? 'DÉBITO');
      return { id: `mov-${l.id}`, contaId: conta.id, data: l.pagoEm, tipo: credito ? 'credito' : 'debito', valor: lancArred((Number(l.valor) || 0) - (Number(l.desconto) || 0)), descricao: l.pessoa?.nome ? `${rotulo} – ${l.pessoa.nome}` : rotulo, referencia: null, categoriaSugerida: l.categoriaId ?? null };
    });
}

// ---------- Saque automático (transferência automática da conta Asaas) ----------
// Config-semente do saque automático diário (estilo "Transferência automática" do Asaas real):
// todo dia útil às 17h transfere para a conta de pagamento o que passar de `saldoMinimo`, desde
// que o valor a sacar seja ≥ `valorMinimo`. `contaDestinoId` e `criadoEm` são preenchidos pelo
// motor (Lancamentos.carregarSaques) relativos ao plano e a hoje(); o histórico dos dias
// anteriores nasce da primeira chamada de Lancamentos.processarSaques — a semente do extrato
// (gerarExtratoAsaasSeed) NÃO gera saques.
const SAQUES_ASAAS_SEED_CONFIG = { ativo: true, diasUteis: true, horario: '17:00', contaDestinoId: null, saldoMinimo: 5000, valorMinimo: 100 };

// Compatibilidade com o nome previsto na especificação: a semente do extrato
// depende dos lançamentos, então é uma função e não uma constante.
const EXTRATO_ASAAS_SEED = gerarExtratoAsaasSeed;

// ---------- Vendas por área (FICTÍCIO) ----------
// [sup.] Só para o gráfico de pizza "Vendas por área" dos dashboards: participação de cada área
// no mês, determinística por mês (mesmo mês → mesmos números), sem ligação com os lançamentos.
// `areas` = Areas.carregar() (usa nome e cor); devolve [{ area, valor, pct }] ordenado por valor.
function gerarVendasPorAreaFicticio(mes, areas, totalMes = 120000) {
  const rnd = lancPrng(lancHash(`vendas-area-${mes}`));
  const pesoBase = { dev: 34, infra: 12, design: 14, marketing: 11, produtividade: 13, gestao: 8, engenharia: 8 };
  const ativas = (areas ?? []).filter((a) => a.status !== 'inativa');
  const brutos = ativas.map((a) => ({ area: a, peso: (pesoBase[a.id] ?? 6) * (0.7 + rnd() * 0.6) }));
  const soma = brutos.reduce((t, b) => t + b.peso, 0) || 1;
  const itens = brutos.map((b) => ({ area: b.area, valor: lancArred(totalMes * b.peso / soma) }));
  const total = itens.reduce((t, i) => t + i.valor, 0) || 1;
  return itens.map((i) => ({ ...i, pct: Math.round((i.valor / total) * 1000) / 10 })).sort((a, b) => b.valor - a.valor);
}
