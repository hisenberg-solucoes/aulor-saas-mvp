// ============================================================
// Dados da tela "Colaboradores" (trazida do protótipo original). Um
// COLABORADOR é uma pessoa da equipe da escola (direção, pedagógico,
// comercial, financeiro, suporte, administrativo, marketing). Não confundir
// com INSTRUTOR (js/instrutores-data.js), que é o papel docente: um
// colaborador que também dá aula tem um instrutor com `colaboradorId`
// apontando para cá, e o CPF fica só aqui.
//
// O sistema NÃO faz folha de pagamento. O cadastro guarda só o que o sistema
// usa: identificação (matrícula, nome, CPF, nascimento), cargo/departamento,
// admissão e status, contato de trabalho e o vínculo com o USUÁRIO de acesso
// (`acesso.usuarioId`); os perfis continuam sendo geridos em Perfis de acesso.
//
// Só catálogos aqui: a equipe da escola fictícia é gerada em js/semente.js.
// ============================================================

const COLAB_HOJE = Aulor.hoje();

const STATUS_COLABORADOR = [
  { id: 'ativo', nome: 'Ativo', descricao: 'Trabalhando; pode ter acesso ao sistema.' },
  { id: 'afastado', nome: 'Afastado', descricao: 'Licença ou férias longas; o acesso não muda.' },
  { id: 'desligado', nome: 'Desligado', descricao: 'Saiu da empresa; histórico preservado, acesso deve ser bloqueado.' },
];

const DEPARTAMENTOS = [
  { id: 'direcao', nome: 'Direção' },
  { id: 'pedagogico', nome: 'Pedagógico' },
  { id: 'comercial', nome: 'Comercial' },
  { id: 'financeiro', nome: 'Financeiro' },
  { id: 'suporte', nome: 'Suporte' },
  { id: 'administrativo', nome: 'Administrativo' },
  { id: 'marketing', nome: 'Marketing' },
];

const MOTIVOS_AFASTAMENTO = [
  { id: 'maternidade', nome: 'Licença-maternidade/paternidade' },
  { id: 'saude', nome: 'Licença de saúde' },
  { id: 'ferias', nome: 'Férias' },
  { id: 'nao-remunerada', nome: 'Licença não remunerada' },
  { id: 'outro', nome: 'Outro' },
];

const MOTIVOS_DESLIGAMENTO = [
  { id: 'pedido', nome: 'Pedido de desligamento' },
  { id: 'dispensa', nome: 'Dispensa pela empresa' },
  { id: 'fim-contrato', nome: 'Fim de contrato / estágio' },
];

// Valores padrão de um colaborador novo (Colaboradores.incluir).
function colaboradorSeed(d) {
  return {
    nomeSocial: '', cpf: '', nascimento: '',
    status: 'ativo', desligamento: null, afastamento: null,
    contato: { email: '', celular: '' },
    acesso: { usuarioId: null },
    observacoes: '',
    historico: [],
    ...d,
  };
}
