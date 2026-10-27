// ============================================================
// Dados de exemplo do protótipo.
// Em produção, tudo aqui viria do backend.
//
// Hierarquia: PORTAL → MÓDULO → FEATURE/TELA → AÇÕES.
// A ação "visualizar" é o que dá acesso à tela; as demais são os
// níveis de ação dentro dela.
// ============================================================

const PORTAIS = [
  { id: 'administrativo', nome: 'Portal Administrativo' },
  { id: 'professor', nome: 'Portal do Professor' },
  { id: 'aluno', nome: 'Portal do Aluno' },
];

const MODULOS = [
  // Portal Administrativo
  { id: 'pedagogico', portal: 'administrativo', nome: 'Pedagógico' },
  { id: 'comercial', portal: 'administrativo', nome: 'Comercial' },
  { id: 'financeiro', portal: 'administrativo', nome: 'Financeiro' },
  { id: 'contratos', portal: 'administrativo', nome: 'Vendas' },
  { id: 'suporte', portal: 'administrativo', nome: 'Suporte' },
  { id: 'administracao', portal: 'administrativo', nome: 'Administração' },
  // Portal do Professor
  { id: 'prof-aulas', portal: 'professor', nome: 'Aulas e turmas' },
  { id: 'prof-avaliacoes', portal: 'professor', nome: 'Avaliações e materiais' },
  // Portal do Aluno
  { id: 'aluno-estudos', portal: 'aluno', nome: 'Meus estudos' },
  { id: 'aluno-servicos', portal: 'aluno', nome: 'Serviços' },
];

const FEATURES = [
  // ================= Portal Administrativo =================

  // ---------- Pedagógico ----------
  {
    id: 'formacoes', modulo: 'pedagogico', nome: 'Formações',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'editar', nome: 'Editar' },
      { id: 'arquivar', nome: 'Arquivar' },
    ],
  },
  {
    id: 'turmas', modulo: 'pedagogico', nome: 'Turmas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'editar', nome: 'Editar' },
      { id: 'encerrar', nome: 'Encerrar' },
    ],
  },
  {
    id: 'planejamento-aulas', modulo: 'pedagogico', nome: 'Planejamento de aulas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'editar', nome: 'Editar' },
      { id: 'aprovar', nome: 'Aprovar' },
    ],
  },
  {
    id: 'agenda-aulas', modulo: 'pedagogico', nome: 'Agenda de aulas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'agendar', nome: 'Agendar' },
      { id: 'remarcar', nome: 'Remarcar' },
      { id: 'cancelar', nome: 'Cancelar' },
    ],
  },
  {
    id: 'presencas', modulo: 'pedagogico', nome: 'Presenças',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'lancar', nome: 'Lançar' },
      { id: 'retificar', nome: 'Retificar' },
    ],
  },
  {
    id: 'avaliacoes', modulo: 'pedagogico', nome: 'Avaliações',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'lancar-notas', nome: 'Lançar notas' },
      { id: 'publicar', nome: 'Publicar' },
    ],
  },
  {
    id: 'certificados', modulo: 'pedagogico', nome: 'Certificados',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'emitir', nome: 'Emitir' },
      { id: 'revogar', nome: 'Revogar' },
    ],
  },

  // ---------- Comercial ----------
  {
    id: 'cursos-avulsos', modulo: 'comercial', nome: 'Cursos avulsos',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'editar', nome: 'Editar' },
      { id: 'publicar', nome: 'Publicar' },
    ],
  },
  {
    id: 'matriculas', modulo: 'comercial', nome: 'Matrículas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'transferir', nome: 'Transferir' },
      { id: 'cancelar', nome: 'Cancelar' },
    ],
  },
  {
    id: 'descontos', modulo: 'comercial', nome: 'Descontos',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'aprovar', nome: 'Aprovar' },
    ],
  },

  // ---------- Financeiro ----------
  {
    id: 'cobrancas', modulo: 'financeiro', nome: 'Cobranças',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'lancar', nome: 'Lançar' },
      { id: 'editar', nome: 'Editar' },
      { id: 'cancelar', nome: 'Cancelar' },
    ],
  },
  {
    id: 'pagamentos', modulo: 'financeiro', nome: 'Pagamentos',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'registrar', nome: 'Registrar' },
      { id: 'estornar', nome: 'Estornar' },
    ],
  },
  {
    id: 'agendamentos-pagamento', modulo: 'financeiro', nome: 'Agendamentos de pagamento',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'agendar', nome: 'Agendar' },
      { id: 'reagendar', nome: 'Reagendar' },
      { id: 'cancelar', nome: 'Cancelar' },
    ],
  },
  {
    id: 'relatorios-financeiros', modulo: 'financeiro', nome: 'Relatórios financeiros',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'exportar', nome: 'Exportar' },
    ],
  },

  {
    id: 'consulta-spc', modulo: 'financeiro', nome: 'Consulta SPC',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'consultar', nome: 'Consultar (gera custo)' },
    ],
  },
  {
    id: 'auditoria-spc', modulo: 'financeiro', nome: 'Auditoria de consultas SPC',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'exportar', nome: 'Exportar' },
    ],
  },

  // ---------- Contratos ----------
  {
    id: 'contratos-formacao', modulo: 'contratos', nome: 'Vendas de formação',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'enviar-assinatura', nome: 'Enviar p/ assinatura' },
      { id: 'rescindir', nome: 'Rescindir' },
    ],
  },
  {
    id: 'aditivos', modulo: 'contratos', nome: 'Aditivos',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'aprovar', nome: 'Aprovar' },
    ],
  },
  {
    id: 'modelos-contrato', modulo: 'contratos', nome: 'Modelos de contrato',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'editar', nome: 'Editar' },
    ],
  },

  // ---------- Suporte ----------
  {
    id: 'chamados', modulo: 'suporte', nome: 'Chamados',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'abrir', nome: 'Abrir' },
      { id: 'responder', nome: 'Responder' },
      { id: 'encerrar', nome: 'Encerrar' },
    ],
  },
  {
    id: 'base-conhecimento', modulo: 'suporte', nome: 'Base de conhecimento',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'publicar', nome: 'Publicar' },
    ],
  },

  // ---------- Administração ----------
  {
    id: 'usuarios', modulo: 'administracao', nome: 'Usuários',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'editar', nome: 'Editar' },
      { id: 'inativar', nome: 'Inativar' },
    ],
  },
  {
    id: 'perfis-acesso', modulo: 'administracao', nome: 'Perfis de acesso',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'gerenciar', nome: 'Gerenciar' },
    ],
  },
  {
    id: 'configuracoes', modulo: 'administracao', nome: 'Configurações',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'editar', nome: 'Editar' },
    ],
  },

  // ================= Portal do Professor =================

  {
    id: 'minhas-turmas', modulo: 'prof-aulas', nome: 'Minhas turmas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'exportar-lista', nome: 'Exportar lista' },
    ],
  },
  {
    id: 'diario-classe', modulo: 'prof-aulas', nome: 'Diário de classe',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'lancar-presencas', nome: 'Lançar presenças' },
      { id: 'retificar', nome: 'Retificar' },
    ],
  },
  {
    id: 'planejamento-professor', modulo: 'prof-aulas', nome: 'Planejamento de aulas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'criar', nome: 'Criar' },
      { id: 'editar', nome: 'Editar' },
    ],
  },
  {
    id: 'disponibilidade', modulo: 'prof-aulas', nome: 'Disponibilidade de agenda',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'editar', nome: 'Editar' },
    ],
  },
  {
    id: 'notas-professor', modulo: 'prof-avaliacoes', nome: 'Lançamento de notas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'lancar', nome: 'Lançar' },
    ],
  },
  {
    id: 'materiais-aula', modulo: 'prof-avaliacoes', nome: 'Materiais de aula',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'publicar', nome: 'Publicar' },
      { id: 'remover', nome: 'Remover' },
    ],
  },

  // ================= Portal do Aluno =================

  {
    id: 'minhas-aulas', modulo: 'aluno-estudos', nome: 'Minhas aulas',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'acessar-online', nome: 'Acessar aula online' },
    ],
  },
  {
    id: 'minhas-notas', modulo: 'aluno-estudos', nome: 'Minhas notas e frequência',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
    ],
  },
  {
    id: 'certificados-aluno', modulo: 'aluno-estudos', nome: 'Meus certificados',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'baixar', nome: 'Baixar' },
    ],
  },
  {
    id: 'financeiro-aluno', modulo: 'aluno-servicos', nome: 'Meu financeiro',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'gerar-boleto', nome: '2ª via de boleto' },
      { id: 'pagar-online', nome: 'Pagar online' },
    ],
  },
  {
    id: 'contratos-aluno', modulo: 'aluno-servicos', nome: 'Meus contratos',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'assinar', nome: 'Assinar' },
    ],
  },
  {
    id: 'chamados-aluno', modulo: 'aluno-servicos', nome: 'Meus chamados',
    acoes: [
      { id: 'visualizar', nome: 'Visualizar' },
      { id: 'abrir', nome: 'Abrir' },
      { id: 'responder', nome: 'Responder' },
    ],
  },
];

// Concede todas as ações de todas as features (usado no perfil Administrador).
function todasAsPermissoes() {
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.acoes.map((a) => a.id)]));
}

// Perfis: { featureId: [acaoIds ativas] }. Feature ausente = sem acesso.
// "ativo: false" desativa o perfil inteiro sem perder a configuração.
const PERFIS = [
  {
    id: 'admin',
    nome: 'Administrador',
    ativo: true,
    permissoes: todasAsPermissoes(),
  },
  {
    id: 'coordenador',
    nome: 'Coordenador pedagógico',
    ativo: true,
    permissoes: {
      formacoes: ['visualizar', 'criar', 'editar', 'arquivar'],
      turmas: ['visualizar', 'criar', 'editar', 'encerrar'],
      'planejamento-aulas': ['visualizar', 'criar', 'editar', 'aprovar'],
      'agenda-aulas': ['visualizar', 'agendar', 'remarcar', 'cancelar'],
      presencas: ['visualizar', 'retificar'],
      avaliacoes: ['visualizar', 'publicar'],
      certificados: ['visualizar', 'emitir'],
      matriculas: ['visualizar', 'transferir'],
      'contratos-formacao': ['visualizar'],
    },
  },
  {
    id: 'professor',
    nome: 'Professor',
    ativo: true,
    permissoes: {
      'minhas-turmas': ['visualizar', 'exportar-lista'],
      'diario-classe': ['visualizar', 'lancar-presencas'],
      'planejamento-professor': ['visualizar', 'criar', 'editar'],
      disponibilidade: ['visualizar', 'editar'],
      'notas-professor': ['visualizar', 'lancar'],
      'materiais-aula': ['visualizar', 'publicar'],
    },
  },
  {
    id: 'aluno',
    nome: 'Aluno',
    ativo: true,
    permissoes: {
      'minhas-aulas': ['visualizar', 'acessar-online'],
      'minhas-notas': ['visualizar'],
      'certificados-aluno': ['visualizar', 'baixar'],
      'financeiro-aluno': ['visualizar', 'gerar-boleto', 'pagar-online'],
      'contratos-aluno': ['visualizar', 'assinar'],
      'chamados-aluno': ['visualizar', 'abrir', 'responder'],
    },
  },
  {
    id: 'financeiro',
    nome: 'Financeiro',
    ativo: true,
    permissoes: {
      cobrancas: ['visualizar', 'lancar', 'editar', 'cancelar'],
      pagamentos: ['visualizar', 'registrar', 'estornar'],
      'agendamentos-pagamento': ['visualizar', 'agendar', 'reagendar', 'cancelar'],
      'relatorios-financeiros': ['visualizar', 'exportar'],
      'consulta-spc': ['visualizar', 'consultar'],
      'auditoria-spc': ['visualizar', 'exportar'],
      'contratos-formacao': ['visualizar'],
      matriculas: ['visualizar'],
      descontos: ['visualizar', 'aprovar'],
    },
  },
  {
    id: 'comercial',
    nome: 'Comercial',
    ativo: true,
    permissoes: {
      'cursos-avulsos': ['visualizar', 'criar', 'editar', 'publicar'],
      matriculas: ['visualizar', 'criar', 'transferir', 'cancelar'],
      descontos: ['visualizar', 'criar'],
      'contratos-formacao': ['visualizar', 'criar', 'enviar-assinatura'],
      'modelos-contrato': ['visualizar'],
      formacoes: ['visualizar'],
      'consulta-spc': ['visualizar', 'consultar'],
    },
  },
  {
    id: 'suporte',
    nome: 'Suporte',
    ativo: true,
    permissoes: {
      chamados: ['visualizar', 'abrir', 'responder', 'encerrar'],
      'base-conhecimento': ['visualizar', 'criar', 'publicar'],
      matriculas: ['visualizar'],
      cobrancas: ['visualizar'],
      'agenda-aulas': ['visualizar'],
    },
  },
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
  { id: 'gustavo', nome: 'Gustavo Prado', perfis: ['suporte'], extras: {} },
  // Professores (js/instrutores-data.js)
  // André é professor, mas recebeu acesso extra aos relatórios financeiros.
  { id: 'andre', nome: 'André Fontoura Bastos', perfis: ['professor'], extras: { 'relatorios-financeiros': ['visualizar'] } },
  { id: 'tatiana', nome: 'Tatiana Bezerra Sartori', perfis: ['professor'], extras: {} },
  // Otávio dá aulas e também trabalha na equipe: dois perfis, dois portais.
  { id: 'otavio', nome: 'Otávio Rangel Delgado', perfis: ['professor', 'suporte'], extras: {} },
  { id: 'adriana', nome: 'Adriana Vilela Moraes', perfis: [], extras: {} },
  // Alunos (js/clientes-data.js)
  { id: 'gustavo-queiroz', nome: 'Gustavo Fellipe Queiroz', perfis: ['aluno'], extras: {} },
  { id: 'angeli', nome: 'Angeli Yasmim Teixeira', perfis: ['aluno'], extras: {} },
  { id: 'enzo', nome: 'Enzo Eduardo Nogueira', perfis: [], extras: {} },
];
