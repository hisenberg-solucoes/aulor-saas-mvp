// ============================================================
// Catálogo de permissões e perfis padrão do Aulor MVP.
// Mesma estrutura do protótipo original (PORTAL → MÓDULO → TELA → AÇÕES),
// com o catálogo reduzido ao escopo do MVP. "visualizar" dá acesso à tela;
// as demais ações liberam botões dentro dela.
//
// Chave de permissão no backend: `<tela>.<ação>` (ex.: "matriculas.criar"),
// no mesmo formato do PermissionCatalog do módulo Platform ("users.view").
// Os dados de usuários e perfis ficam salvos em localStorage
// (Acessos.CHAVE, em js/shell.js); este arquivo é só a semente.
// ============================================================

const TIPOS_USUARIO = [
  { id: 'colaborador', nome: 'Equipe', plural: 'Equipe da escola', descricao: 'Direção, secretaria, financeiro e coordenação. Usa o sistema da escola.', portal: 'escola', cadastro: 'usuarios.html?id=', lista: 'Usuários' },
  { id: 'instrutor', nome: 'Professor', plural: 'Professores', descricao: 'Dá aulas nas turmas. Vê as próprias aulas e registra chamada e diário.', portal: 'escola', cadastro: 'professores.html?professor=', lista: 'Professores' },
];

const PORTAIS = [
  { id: 'escola', nome: 'Sistema da escola' },
];

const MODULOS = [
  // Mesmos grupos do menu lateral (js/shell.js).
  { id: 'visao', portal: 'escola', nome: 'Visão geral' },
  { id: 'comercial', portal: 'escola', nome: 'Comercial' },
  { id: 'pedagogico', portal: 'escola', nome: 'Pedagógico' },
  { id: 'financeiro', portal: 'escola', nome: 'Financeiro' },
  { id: 'pessoas', portal: 'escola', nome: 'Pessoas' },
  { id: 'configuracoes', portal: 'escola', nome: 'Configurações' },
];

const ACAO_ = (id, nome) => ({ id, nome });
const VER = ACAO_('visualizar', 'Visualizar');

const FEATURES = [
  { id: 'painel', modulo: 'visao', nome: 'Painel da escola', acoes: [VER] },

  { id: 'alunos', modulo: 'comercial', nome: 'Alunos', acoes: [VER, ACAO_('criar', 'Cadastrar'), ACAO_('editar', 'Editar')] },
  { id: 'matriculas', modulo: 'comercial', nome: 'Matrículas', acoes: [VER, ACAO_('criar', 'Matricular'), ACAO_('trocar', 'Trocar de turma'), ACAO_('cancelar', 'Cancelar matrícula')] },

  { id: 'cursos', modulo: 'pedagogico', nome: 'Cursos', acoes: [VER, ACAO_('criar', 'Criar'), ACAO_('editar', 'Editar')] },
  { id: 'turmas', modulo: 'pedagogico', nome: 'Turmas', acoes: [VER, ACAO_('criar', 'Criar'), ACAO_('editar', 'Editar'), ACAO_('concluir', 'Concluir turma')] },
  { id: 'professores', modulo: 'pessoas', nome: 'Professores', acoes: [VER, ACAO_('gerenciar', 'Cadastrar e editar')] },

  { id: 'frequencia', modulo: 'pedagogico', nome: 'Frequência de todas as turmas', acoes: [VER, ACAO_('registrar', 'Lançar e corrigir chamada e notas')] },
  { id: 'minhas-aulas', modulo: 'pedagogico', nome: 'Minhas aulas (professor)', acoes: [VER, ACAO_('registrar', 'Fazer chamada, diário e nota final')] },

  { id: 'certificados', modulo: 'pedagogico', nome: 'Certificados', acoes: [VER, ACAO_('emitir', 'Emitir'), ACAO_('cancelar', 'Cancelar certificado')] },

  { id: 'receber', modulo: 'financeiro', nome: 'Contas a receber', acoes: [VER, ACAO_('registrar', 'Registrar recebimento'), ACAO_('estornar', 'Estornar')] },
  { id: 'pagar', modulo: 'financeiro', nome: 'Contas a pagar', acoes: [VER, ACAO_('lancar', 'Lançar conta'), ACAO_('pagar', 'Registrar pagamento')] },

  { id: 'usuarios', modulo: 'pessoas', nome: 'Usuários', acoes: [VER, ACAO_('convidar', 'Convidar'), ACAO_('editar', 'Editar'), ACAO_('inativar', 'Inativar')] },
  { id: 'perfis-acesso', modulo: 'configuracoes', nome: 'Perfis de acesso', acoes: [VER, ACAO_('gerenciar', 'Gerenciar')] },
  { id: 'configuracoes', modulo: 'configuracoes', nome: 'Configurações da escola', acoes: [VER, ACAO_('editar', 'Editar')] },
];

function todasAsPermissoes() {
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.acoes.map((a) => a.id)]));
}

// Administrador é protegido (como o AccessProfile.IsProtected do backend):
// sempre tem tudo e não pode ser editado, inativado nem excluído.
const PERFIS = [
  { id: 'administrador', nome: 'Administrador', tipos: ['colaborador'], ativo: true, protegido: true, permissoes: todasAsPermissoes() },
  {
    id: 'secretaria', nome: 'Secretaria', tipos: ['colaborador'], ativo: true,
    permissoes: {
      painel: ['visualizar'], alunos: ['visualizar', 'criar', 'editar'], matriculas: ['visualizar', 'criar', 'trocar', 'cancelar'],
      cursos: ['visualizar'], turmas: ['visualizar'], professores: ['visualizar'], frequencia: ['visualizar'],
      certificados: ['visualizar', 'emitir'], receber: ['visualizar', 'registrar'],
    },
  },
  {
    id: 'financeiro', nome: 'Financeiro', tipos: ['colaborador'], ativo: true,
    permissoes: {
      painel: ['visualizar'], alunos: ['visualizar'], matriculas: ['visualizar'],
      receber: ['visualizar', 'registrar', 'estornar'], pagar: ['visualizar', 'lancar', 'pagar'],
    },
  },
  {
    id: 'coordenacao', nome: 'Coordenação pedagógica', tipos: ['colaborador'], ativo: true,
    permissoes: {
      painel: ['visualizar'], alunos: ['visualizar', 'editar'], matriculas: ['visualizar', 'trocar'],
      cursos: ['visualizar', 'criar', 'editar'], turmas: ['visualizar', 'criar', 'editar', 'concluir'], professores: ['visualizar', 'gerenciar'],
      frequencia: ['visualizar', 'registrar'], certificados: ['visualizar', 'emitir', 'cancelar'],
    },
  },
  {
    id: 'professor', nome: 'Professor', tipos: ['instrutor'], ativo: true,
    permissoes: { 'minhas-aulas': ['visualizar', 'registrar'] },
  },
];

// status: ativo | convidado (convite enviado, ainda sem acesso) | inativo.
// vinculos: colaborador aponta para o próprio usuário; professor aponta para o cadastro do professor (pr*).
const USUARIOS = [
  { id: 'u1', nome: 'Marina Azevedo', email: 'marina@escolaatlas.com.br', cargo: 'Diretora', status: 'ativo', vinculos: [{ tipo: 'colaborador', id: 'u1' }], perfis: ['administrador'], extras: {} },
  { id: 'u2', nome: 'Paula Ribeiro', email: 'paula@escolaatlas.com.br', cargo: 'Secretária', status: 'ativo', vinculos: [{ tipo: 'colaborador', id: 'u2' }], perfis: ['secretaria'], extras: {} },
  { id: 'u3', nome: 'Renato Siqueira', email: 'renato@escolaatlas.com.br', cargo: 'Financeiro', status: 'ativo', vinculos: [{ tipo: 'colaborador', id: 'u3' }], perfis: ['financeiro'], extras: {} },
  { id: 'u4', nome: 'Camila Duarte', email: 'camila@escolaatlas.com.br', cargo: 'Coordenadora pedagógica', status: 'ativo', vinculos: [{ tipo: 'colaborador', id: 'u4' }], perfis: ['coordenacao'], extras: { matriculas: ['criar'] } },
  { id: 'u5', nome: 'Carlos Mendes', email: 'carlos.mendes@escolaatlas.com.br', cargo: 'Professor', status: 'ativo', vinculos: [{ tipo: 'instrutor', id: 'pr1' }], perfis: ['professor'], extras: {} },
  { id: 'u6', nome: 'Juliana Prado', email: 'juliana.prado@escolaatlas.com.br', cargo: 'Professora', status: 'ativo', vinculos: [{ tipo: 'instrutor', id: 'pr2' }], perfis: ['professor'], extras: {} },
  { id: 'u7', nome: 'Rafael Teixeira', email: 'rafael.teixeira@escolaatlas.com.br', cargo: 'Professor', status: 'ativo', vinculos: [{ tipo: 'instrutor', id: 'pr3' }], perfis: ['professor'], extras: {} },
  { id: 'u8', nome: 'Beatriz Nogueira', email: 'beatriz.nogueira@escolaatlas.com.br', cargo: 'Professora', status: 'ativo', vinculos: [{ tipo: 'instrutor', id: 'pr4' }], perfis: ['professor'], extras: {} },
  { id: 'u9', nome: 'Sérgio Albuquerque', email: 'sergio.albuquerque@escolaatlas.com.br', cargo: 'Professor', status: 'ativo', vinculos: [{ tipo: 'instrutor', id: 'pr5' }], perfis: ['professor'], extras: {} },
  { id: 'u10', nome: 'Lucas Fernandes', email: 'lucas@escolaatlas.com.br', cargo: 'Auxiliar administrativo', status: 'convidado', vinculos: [{ tipo: 'colaborador', id: 'u10' }], perfis: ['secretaria'], extras: {} },
];
