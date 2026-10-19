// ============================================================
// Dados da tela "Instrutores". Um INSTRUTOR é a pessoa física que dá aula;
// ela precisa ter uma EMPRESA (CNPJ) para receber, tem uma TABELA DE VALOR
// HORA (varia por quantidade de alunos/horas da turma), CONTRATOS gerados
// pelo sistema e assinados no Clicksign (instrutor + escola), PAGAMENTOS
// que exigem nota fiscal, DECLARAÇÃO DE ANTECEDENTES anual, aceite da
// política de privacidade (LGPD) e a TAG de estacionamento do prédio.
//
// O instrutor é o PAPEL DOCENTE de uma pessoa (docs/pessoas-papeis.md). A
// `remuneracao` decide o resto: só `pj` tem empresa, contrato e NF; `rpa` recebe
// na conta da própria pessoa com recibo no lugar da NF; `folha` não tem contrato
// nem pagamento aqui. Quem também é da equipe aponta `colaboradorId`: CPF e
// nascimento ficam só no colaborador; nome e contato ficam espelhados aqui
// porque as turmas e o login do portal do professor leem do instrutor.
//
// Trazido do protótipo original. No MVP o instrutor é o registro de
// `professores` da base única e as turmas apontam `turma.professorId`. Só
// catálogos aqui: os instrutores da escola fictícia são gerados em js/semente.js.
// ============================================================

const STATUS_INSTRUTOR = [
  { id: 'ativo', nome: 'Ativo', descricao: 'Pode receber turmas e contratos.' },
  { id: 'inativo', nome: 'Inativo', descricao: 'Não dá mais aula; histórico preservado.' },
];

const REMUNERACOES_INSTRUTOR = [
  { id: 'pj', nome: 'PJ', descricao: 'Empresa (CNPJ), contrato no Clicksign e pagamento só com NF.' },
  { id: 'rpa', nome: 'RPA', descricao: 'Autônomo: recebe na própria conta, com recibo RPA no lugar da NF.' },
  { id: 'folha', nome: 'Folha', descricao: 'Aula faz parte do salário; sem contrato nem pagamento por aqui.' },
];

var UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Fluxo do contrato do instrutor. O documento é gerado pelo sistema; a assinatura
// acontece no Clicksign (instrutor e escola). `assinado` = as duas assinaturas.
const STATUS_CONTRATO_INSTRUTOR = [
  { id: 'rascunho', nome: 'Rascunho', descricao: 'Itens e valores em montagem.' },
  { id: 'gerado', nome: 'Documento gerado', descricao: 'PDF gerado; ainda não foi ao Clicksign.' },
  { id: 'assinatura', nome: 'Em assinatura', descricao: 'Envelope no Clicksign aguardando instrutor e/ou escola.' },
  { id: 'assinado', nome: 'Assinado', descricao: 'Instrutor e escola assinaram; libera pagamentos.' },
  { id: 'encerrado', nome: 'Encerrado', descricao: 'Turmas concluídas e pagamentos quitados.' },
  { id: 'cancelado', nome: 'Cancelado', descricao: 'Sem efeito; histórico preservado.' },
];

const TIPOS_PAGAMENTO = [
  { id: 'curso', nome: 'Curso completo', descricao: 'Valor total de um item (turma) do contrato.' },
  { id: 'parcial', nome: 'Parcial', descricao: 'Parte do curso (ex.: metade das aulas dadas).' },
  // Programados pela tela pagamentos-instrutores.html (motor PagamentosInstrutores):
  { id: 'aulas', nome: 'Aulas avulsas', descricao: 'Aulas realizadas escolhidas — horas × valor hora do item.' },
  { id: 'mensal', nome: 'Mensal', descricao: 'Todas as aulas realizadas na competência (mês), por contrato.' },
];

// Status do pagamento é DERIVADO: sem NF → aguardando NF; NF sem pagamento → liberado; pago.
const STATUS_PAGAMENTO = [
  { id: 'aguardando_nf', nome: 'Aguardando NF', descricao: 'Só paga com a nota fiscal do instrutor.' },
  { id: 'liberado', nome: 'Liberado', descricao: 'NF recebida; pode pagar.' },
  { id: 'pago', nome: 'Pago', descricao: 'Pagamento realizado.' },
];

// Aceite da política de privacidade (mesmo texto do formulário atual de cadastro).
const LGPD_INSTRUTOR = {
  versao: '2026-01',
  link: `https://${Aulor.escola().site}/privacidade`,
  termos: [
    'Li e concordo com a política de privacidade e proteção de dados.',
    `Reconheço e concordo que a coleta dos dados pessoais informados são destinados à execução do contrato de prestação de serviços com a ${Aulor.escola().nome}, conforme as condições que envolvem o tratamento de dados pessoais previstos no Aviso de Privacidade da ${Aulor.escola().nome}.`,
  ],
};
