// ============================================================
// Dados da consulta ao SPC: motivos, situações, tipos de pendência e a
// semente do LOG de consultas (quem consultou quem, quando e por quê).
// A resposta do bureau é SIMULADA no motor (Spc.simular) — em produção
// viria da API do SPC Brasil; o log continuaria igual, pois é ele que
// alimenta a auditoria.
// ============================================================

// Motivos aceitos para consultar. "Outro" exige justificativa escrita.
const MOTIVOS_SPC = [
  { id: 'novo-contrato', nome: 'Nova venda', descricao: 'Análise de crédito antes de fechar uma venda ou matrícula.' },
  { id: 'renegociacao', nome: 'Renegociação', descricao: 'Aluno/empresa com parcelas em atraso pedindo novas condições.' },
  { id: 'cobranca', nome: 'Cobrança em atraso', descricao: 'Verificar se há outras restrições antes de negativar ou protestar.' },
  { id: 'pre-matricula', nome: 'Pré-matrícula', descricao: 'Interessado ainda sem venda; consulta prévia autorizada pelo comercial.' },
  { id: 'outro', nome: 'Outro (justificar)', descricao: 'Qualquer outro motivo — a justificativa fica registrada na auditoria.' },
];

// Situação devolvida pelo bureau.
const SITUACOES_SPC = [
  { id: 'regular', nome: 'Nada consta', curto: 'Regular', descricao: 'Nenhuma restrição ativa no CPF/CNPJ.' },
  { id: 'restricao', nome: 'Com restrição', curto: 'Restrição', descricao: 'Há pendências registradas (dívida, cheque, protesto).' },
  { id: 'indisponivel', nome: 'Indisponível', curto: 'Indisponível', descricao: 'O bureau não respondeu; a consulta foi registrada mas não cobrada.' },
];

const TIPOS_PENDENCIA_SPC = [
  { id: 'divida', nome: 'Dívida vencida' },
  { id: 'cheque', nome: 'Cheque sem fundos' },
  { id: 'protesto', nome: 'Protesto em cartório' },
  { id: 'acao', nome: 'Ação judicial' },
];

// Credores fictícios para compor as pendências simuladas.
const CREDORES_SPC = [
  'Banco Bradesco S.A.', 'Caixa Econômica Federal', 'Celesc Distribuição', 'Claro S.A.', 'Lojas Renner', 'Magazine Luiza',
  'Nubank', 'Riachuelo', 'Samae Blumenau', 'Vivo S.A.', 'Casas Bahia', 'Havan', 'Banco do Brasil', 'Itaú Unibanco',
];

// Origem da consulta: de que tela ela partiu. Serve para a auditoria.
const ORIGENS_CONSULTA_SPC = [
  { id: 'spc', nome: 'Tela Consulta SPC' },
  { id: 'aluno', nome: 'Ficha do aluno' },
  { id: 'empresa', nome: 'Ficha da empresa' },
  { id: 'contrato', nome: 'Venda' },
];

// Quem pode aparecer como operador (mesmos usuários do protótipo de permissões).
const OPERADORES_SPC = [
  { id: 'ana', nome: 'Ana Souza', perfil: 'Administradora' },
  { id: 'bruno', nome: 'Bruno Lima', perfil: 'Coordenador pedagógico' },
  { id: 'diego', nome: 'Diego Rocha', perfil: 'Financeiro' },
  { id: 'fernanda', nome: 'Fernanda Alves', perfil: 'Comercial' },
];

// Usuário logado no protótipo (chip do cabeçalho).
const OPERADOR_ATUAL_SPC = 'ana';

// Parâmetros das regras de auditoria (ver Spc.alertas).
const REGRAS_AUDITORIA_SPC = {
  maxPorDia: 8,           // acima disto num único dia vira alerta de volume
  janelaVinculoDias: 45,  // consulta "sem vínculo" = sem contrato antes nem até N dias depois
  minParaPercentual: 5,   // só avalia % sem vínculo a partir deste número de consultas
  pctSemVinculoAlerta: 50,
  repeticaoDias: 30,      // mesmo documento consultado ≥ N vezes em 30 dias
  repeticaoMin: 3,
  horaInicio: 7, horaFim: 20, // fora deste intervalo (ou fim de semana) = fora do horário
};

// ---------- Semente do log ----------
// Datas absolutas, alinhadas aos contratos reais da semente de contratos
// (SUP09 em fev/2026, SUP10 em jul–ago/2026), para o cálculo de "vínculo
// comercial" da auditoria fazer sentido. O resultado é preenchido pelo motor
// com Spc.simular(documento), portanto é determinístico.
// Padrão suspeito plantado: Fernanda (comercial) faz muitas consultas em
// 3 dias, várias à noite, de alunos antigos sem contrato novo e repete
// documentos — é o caso que a tela de auditoria precisa evidenciar.
const CONSULTAS_SPC_SEED = [
  // SUP09 — consultas 2–4 dias antes de cada contrato (Ana, comercial → adm).
  { data: '2026-01-29T09:12', op: 'ana', tipo: 'empresa', id: 'e1', motivo: 'novo-contrato', origem: 'contrato' },
  { data: '2026-01-30T10:40', op: 'ana', tipo: 'responsavel', id: 'a1', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-02T10:52', op: 'ana', tipo: 'responsavel', id: 'a2', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-03T14:05', op: 'ana', tipo: 'aluno', id: 'a3', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-06T11:30', op: 'ana', tipo: 'responsavel', id: 'a4', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-06T11:41', op: 'ana', tipo: 'aluno', id: 'a5', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-09T15:20', op: 'ana', tipo: 'aluno', id: 'a6', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-10T09:48', op: 'ana', tipo: 'aluno', id: 'a7', motivo: 'novo-contrato', origem: 'spc' },
  { data: '2026-02-13T16:10', op: 'ana', tipo: 'aluno', id: 'a9', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-13T16:18', op: 'ana', tipo: 'responsavel', id: 'a10', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-16T10:15', op: 'ana', tipo: 'aluno', id: 'a11', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-20T13:42', op: 'ana', tipo: 'responsavel', id: 'a13', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-02-20T13:50', op: 'ana', tipo: 'aluno', id: 'a14', motivo: 'novo-contrato', origem: 'spc' },

  // Cobrança / renegociação pelo financeiro (Diego) — clientes com contrato.
  { data: '2026-06-15T14:05', op: 'diego', tipo: 'aluno', id: 'a17', motivo: 'cobranca', origem: 'spc' },
  { data: '2026-07-02T15:20', op: 'diego', tipo: 'aluno', id: 'a18', motivo: 'renegociacao', origem: 'spc' },
  { data: '2026-07-30T16:10', op: 'diego', tipo: 'aluno', id: 'a20', motivo: 'cobranca', origem: 'spc' },
  { data: '2026-08-10T14:50', op: 'diego', tipo: 'aluno', id: 'a9', motivo: 'renegociacao', origem: 'spc' },
  { data: '2026-08-19T11:12', op: 'diego', tipo: 'empresa', id: 'e1', motivo: 'cobranca', origem: 'empresa' },

  // SUP10 — consultas antes dos contratos de jul–ago/2026.
  { data: '2026-07-17T09:05', op: 'ana', tipo: 'aluno', id: 'a40', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-07-18T11:25', op: 'ana', tipo: 'aluno', id: 'a41', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-07-20T10:02', op: 'ana', tipo: 'aluno', id: 'a42', motivo: 'novo-contrato', origem: 'spc' },
  { data: '2026-07-24T15:33', op: 'ana', tipo: 'aluno', id: 'a43', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-07-25T09:40', op: 'ana', tipo: 'aluno', id: 'a45', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-07-27T16:45', op: 'ana', tipo: 'aluno', id: 'a46', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-07-31T10:20', op: 'ana', tipo: 'aluno', id: 'a47', motivo: 'novo-contrato', origem: 'contrato' },
  { data: '2026-08-11T14:08', op: 'fernanda', tipo: 'aluno', id: 'a50', motivo: 'novo-contrato', origem: 'aluno' },
  { data: '2026-07-16T13:30', op: 'bruno', tipo: 'aluno', id: 'a44', motivo: 'pre-matricula', origem: 'spc' },

  // Padrão suspeito — Fernanda, 3 dias, volume alto, noite, sem contrato, repetições.
  { data: '2026-08-20T18:32', op: 'fernanda', tipo: 'aluno', id: 'a21', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-20T18:35', op: 'fernanda', tipo: 'aluno', id: 'a22', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-20T18:39', op: 'fernanda', tipo: 'aluno', id: 'a23', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-20T18:44', op: 'fernanda', tipo: 'aluno', id: 'a24', motivo: 'outro', justificativa: 'Cliente pediu', origem: 'spc' },
  { data: '2026-08-20T21:10', op: 'fernanda', tipo: 'aluno', id: 'a25', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-20T21:14', op: 'fernanda', tipo: 'aluno', id: 'a26', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-20T21:19', op: 'fernanda', tipo: 'aluno', id: 'a21', motivo: 'outro', justificativa: 'Conferência', origem: 'spc' },
  { data: '2026-08-20T21:26', op: 'fernanda', tipo: 'aluno', id: 'a27', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-20T22:03', op: 'fernanda', tipo: 'aluno', id: 'a28', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-20T22:07', op: 'fernanda', tipo: 'aluno', id: 'a29', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-21T19:05', op: 'fernanda', tipo: 'aluno', id: 'a21', motivo: 'outro', justificativa: 'Reconferir', origem: 'spc' },
  { data: '2026-08-21T19:12', op: 'fernanda', tipo: 'aluno', id: 'a30', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-21T19:18', op: 'fernanda', tipo: 'aluno', id: 'a22', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-21T23:41', op: 'fernanda', tipo: 'aluno', id: 'a31', motivo: 'outro', justificativa: 'Indicação de amigo', origem: 'spc' },
  { data: '2026-08-21T23:47', op: 'fernanda', tipo: 'aluno', id: 'a32', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-22T12:30', op: 'fernanda', tipo: 'aluno', id: 'a22', motivo: 'pre-matricula', origem: 'spc' }, // sábado
  { data: '2026-08-22T12:36', op: 'fernanda', tipo: 'aluno', id: 'a48', motivo: 'pre-matricula', origem: 'spc' },
  { data: '2026-08-22T12:41', op: 'fernanda', tipo: 'aluno', id: 'a49', motivo: 'pre-matricula', origem: 'spc' },
];
