// ============================================================
// Catálogo de permissões da V1 e perfis padrão.
// Em produção, tudo aqui viria do backend, que é quem aplica as regras
// (dados pessoais e financeiros); o protótipo só esconde menu e telas.
//
// Hierarquia: PORTAL → MÓDULO → TELA → AÇÕES. A ação "visualizar" é o que
// dá acesso à tela; as demais são os níveis de ação dentro dela. No portal
// administrativo, o id da tela é o arquivo da lista (contratos → contratos.html),
// e os módulos são os grupos do menu (js/menu.js).
// ============================================================

const PORTAIS = [
  { id: 'administrativo', nome: 'Portal Administrativo' },
  { id: 'professor', nome: 'Portal do Professor' },
  { id: 'aluno', nome: 'Portal do Aluno' },
];

const MODULOS = [
  { id: 'comercial', portal: 'administrativo', nome: 'Comercial' },
  { id: 'pedagogico', portal: 'administrativo', nome: 'Pedagógico' },
  { id: 'financeiro', portal: 'administrativo', nome: 'Financeiro' },
  { id: 'pessoas', portal: 'administrativo', nome: 'Pessoas' },
  { id: 'configuracoes', portal: 'administrativo', nome: 'Configurações' },
  { id: 'prof-turmas', portal: 'professor', nome: 'Turmas e materiais' },
  { id: 'aluno-estudos', portal: 'aluno', nome: 'Meus estudos' },
  { id: 'aluno-servicos', portal: 'aluno', nome: 'Serviços' },
];

const VER = { id: 'visualizar', nome: 'Visualizar' };
const CRIAR = { id: 'criar', nome: 'Criar' };
const EDITAR = { id: 'editar', nome: 'Editar' };

const FEATURES = [
  // ---------- Comercial ----------
  {
    id: 'contratos', modulo: 'comercial', nome: 'Vendas',
    acoes: [
      VER, CRIAR, EDITAR,
      // Sem esta ação, a pessoa vê só as vendas em que é a vendedora (perfil Vendedor externo).
      { id: 'ver-todas', nome: 'Ver as vendas de todos os vendedores' },
      { id: 'confirmar-alunos', nome: 'Confirmar o cadastro dos alunos' },
      { id: 'adm-ok', nome: 'Dar o Adm OK' },
      { id: 'cancelar', nome: 'Cancelar' },
    ],
  },
  { id: 'alunos', modulo: 'comercial', nome: 'Alunos', acoes: [VER, CRIAR, EDITAR] },
  { id: 'responsaveis', modulo: 'comercial', nome: 'Responsáveis', acoes: [VER, CRIAR, EDITAR] },
  { id: 'empresas', modulo: 'comercial', nome: 'Empresas', acoes: [VER, CRIAR, EDITAR] },

  // ---------- Pedagógico ----------
  { id: 'cursos', modulo: 'pedagogico', nome: 'Cursos', acoes: [VER, CRIAR, EDITAR] },
  { id: 'formacoes', modulo: 'pedagogico', nome: 'Formações', acoes: [VER, CRIAR, EDITAR] },
  { id: 'turmas', modulo: 'pedagogico', nome: 'Turmas', acoes: [VER, CRIAR, EDITAR, { id: 'gerar-aulas', nome: 'Gerar e remarcar aulas' }] },
  { id: 'feriados', modulo: 'pedagogico', nome: 'Feriados', acoes: [VER, EDITAR] },
  { id: 'materiais', modulo: 'pedagogico', nome: 'Materiais das aulas', acoes: [VER, { id: 'publicar', nome: 'Cadastrar e liberar' }] },

  // ---------- Financeiro ----------
  {
    id: 'financeiro', modulo: 'financeiro', nome: 'Financeiro',
    acoes: [
      VER,
      { id: 'lancar', nome: 'Lançar contas' },
      { id: 'baixar', nome: 'Dar baixa' },
      { id: 'emitir-nf', nome: 'Emitir NF' },
      { id: 'conciliar', nome: 'Conciliar com o Asaas' },
      { id: 'sacar', nome: 'Configurar o saque automático' },
    ],
  },
  { id: 'contas-bancarias', modulo: 'financeiro', nome: 'Contas bancárias', acoes: [VER, EDITAR] },
  { id: 'centros-custo', modulo: 'financeiro', nome: 'Centros de custo', acoes: [VER, EDITAR] },
  { id: 'centros-receita', modulo: 'financeiro', nome: 'Centros de receita', acoes: [VER, EDITAR] },

  // ---------- Pessoas ----------
  { id: 'instrutores', modulo: 'pessoas', nome: 'Instrutores', acoes: [VER, CRIAR, EDITAR] },
  { id: 'colaboradores', modulo: 'pessoas', nome: 'Colaboradores', acoes: [VER, CRIAR, EDITAR, { id: 'dar-acesso', nome: 'Dar acesso ao sistema' }] },

  // ---------- Configurações ----------
  { id: 'perfis', modulo: 'configuracoes', nome: 'Perfis de acesso', acoes: [VER, EDITAR] },
  { id: 'modelos-contrato', modulo: 'configuracoes', nome: 'Modelos de contrato', acoes: [VER, EDITAR] },

  // ================= Portal do Professor =================
  { id: 'minhas-turmas', modulo: 'prof-turmas', nome: 'Minhas turmas', acoes: [VER] },
  { id: 'materiais-aula', modulo: 'prof-turmas', nome: 'Materiais das aulas', acoes: [VER, { id: 'publicar', nome: 'Cadastrar e liberar' }] },

  // ================= Portal do Aluno =================
  { id: 'meus-cursos', modulo: 'aluno-estudos', nome: 'Meus cursos', acoes: [VER] },
  { id: 'minhas-aulas', modulo: 'aluno-estudos', nome: 'Aulas e calendário', acoes: [VER, { id: 'acessar-online', nome: 'Acessar aula online' }] },
  { id: 'materiais-aluno', modulo: 'aluno-estudos', nome: 'Materiais', acoes: [VER] },
  { id: 'financeiro-aluno', modulo: 'aluno-servicos', nome: 'Meu financeiro', acoes: [VER, { id: 'gerar-boleto', nome: '2ª via de boleto' }, { id: 'pagar-online', nome: 'Pagar online' }] },
  { id: 'contratos-aluno', modulo: 'aluno-servicos', nome: 'Meus contratos', acoes: [VER, { id: 'assinar', nome: 'Assinar' }] },
  { id: 'meus-dados', modulo: 'aluno-servicos', nome: 'Meus dados', acoes: [VER, EDITAR] },
];

// Concede todas as ações de todas as features (usado no perfil Administrador).
function todasAsPermissoes() {
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.acoes.map((a) => a.id)]));
}

const tudo = (...ids) => Object.fromEntries(ids.map((id) => [id, FEATURES.find((f) => f.id === id).acoes.map((a) => a.id)]));
const ver = (...ids) => Object.fromEntries(ids.map((id) => [id, ['visualizar']]));

// Perfis: { featureId: [acaoIds ativas] }. Feature ausente = sem acesso.
// "ativo: false" desativa o perfil inteiro sem perder a configuração.
const PERFIS = [
  { id: 'admin', nome: 'Administrador', ativo: true, permissoes: todasAsPermissoes() },
  {
    id: 'coordenador', nome: 'Coordenador pedagógico', ativo: true,
    permissoes: { ...tudo('cursos', 'formacoes', 'turmas', 'feriados', 'materiais', 'instrutores'), ...ver('alunos', 'responsaveis', 'contratos') },
  },
  {
    id: 'comercial', nome: 'Comercial', ativo: true,
    permissoes: {
      ...tudo('alunos', 'responsaveis', 'empresas'),
      contratos: ['visualizar', 'criar', 'editar', 'ver-todas', 'confirmar-alunos', 'cancelar'],
      ...ver('cursos', 'formacoes', 'turmas', 'modelos-contrato'),
    },
  },
  {
    // Escopo da V1: vê só as vendas dele, cria venda por link e confirma os alunos pelos quais responde;
    // não acessa Alunos. A relação com o perfil Comercial está a definir.
    id: 'vendedor_externo', nome: 'Vendedor externo', ativo: true,
    permissoes: { contratos: ['visualizar', 'criar', 'confirmar-alunos'] },
  },
  {
    id: 'financeiro', nome: 'Financeiro', ativo: true,
    permissoes: {
      ...tudo('financeiro', 'contas-bancarias', 'centros-custo', 'centros-receita'),
      contratos: ['visualizar', 'ver-todas', 'adm-ok'],
      ...ver('alunos', 'responsaveis', 'empresas', 'instrutores'),
    },
  },
  { id: 'professor', nome: 'Professor', ativo: true, permissoes: tudo('minhas-turmas', 'materiais-aula') },
  { id: 'aluno', nome: 'Aluno', ativo: true, permissoes: tudo('meus-cursos', 'minhas-aulas', 'materiais-aluno', 'financeiro-aluno', 'contratos-aluno', 'meus-dados') },
];

// Usuários, os perfis em que estão incluídos e permissões EXTRAS
// individuais ({ featureId: [acaoIds] }), concedidas além dos perfis.
// As permissões efetivas são: união dos perfis ATIVOS + extras do usuário.
const USUARIOS = [
  // Colaboradores (js/colaboradores-data.js)
  { id: 'ana', nome: 'Ana Souza', perfis: ['admin'], extras: {} },
  { id: 'bruno', nome: 'Bruno Lima', perfis: ['coordenador'], extras: {} },
  { id: 'diego', nome: 'Diego Rocha', perfis: ['financeiro'], extras: {} },
  { id: 'elisa', nome: 'Elisa Martins', perfis: [], extras: {} },
  { id: 'fernanda', nome: 'Fernanda Alves', perfis: ['comercial'], extras: {} },
  { id: 'gustavo', nome: 'Gustavo Prado', perfis: [], extras: {} },
  // Vendedor externo (representante parceiro, não é da equipe): vê só as vendas dele.
  { id: 'rafael', nome: 'Rafael Tonin', perfis: ['vendedor_externo'], extras: {} },
  // Professores (js/instrutores-data.js)
  // André é professor, mas recebeu acesso extra para ver as turmas no administrativo.
  { id: 'andre', nome: 'André Fontoura Bastos', perfis: ['professor'], extras: { turmas: ['visualizar'] } },
  { id: 'tatiana', nome: 'Tatiana Bezerra Sartori', perfis: ['professor'], extras: {} },
  // Otávio dá aulas e também coordena: dois perfis, dois portais.
  { id: 'otavio', nome: 'Otávio Rangel Delgado', perfis: ['professor', 'coordenador'], extras: {} },
  { id: 'adriana', nome: 'Adriana Vilela Moraes', perfis: [], extras: {} },
  // Alunos (js/clientes-data.js)
  { id: 'gustavo-queiroz', nome: 'Gustavo Fellipe Queiroz', perfis: ['aluno'], extras: {} },
  { id: 'angeli', nome: 'Angeli Yasmim Teixeira', perfis: ['aluno'], extras: {} },
  { id: 'enzo', nome: 'Enzo Eduardo Nogueira', perfis: [], extras: {} },
];
