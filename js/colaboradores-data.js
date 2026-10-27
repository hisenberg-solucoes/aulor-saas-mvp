// ============================================================
// Dados da tela "Colaboradores". Um COLABORADOR é uma pessoa da equipe
// da escola (direção, pedagógico, comercial, financeiro, suporte,
// administrativo, marketing). Não confundir com INSTRUTOR
// (js/instrutores-data.js), que é o papel docente: um colaborador que também
// dá aula tem um instrutor com `colaboradorId` apontando para cá, e o CPF fica
// só aqui (docs/pessoas-papeis.md).
//
// O sistema NÃO faz folha de pagamento (decisão de 08/09/2026). O cadastro
// guarda só o que o sistema usa: identificação (matrícula, nome, CPF,
// nascimento), cargo/departamento, admissão e status, contato de trabalho
// e o vínculo com o USUÁRIO de acesso do protótipo de permissões
// (js/permissoes-data.js, chave 'aulor-v1-permissionamento-v6'): o
// colaborador aponta `acesso.usuarioId`; os perfis continuam sendo geridos
// em Perfis de acesso.
//
// Removidos em 08/09/2026 (eram para a folha): vínculo CLT/estágio/PJ,
// PIS/CTPS, empresa PJ, remuneração/benefícios, conta bancária/Pix, RG,
// gênero, endereço, e-mail pessoal, telefone fixo e contato de emergência.
// A despesa "Folha" do financeiro agora vem de uma tabela mock em
// js/lancamentos-data.js (LANC_FOLHA_MOCK), não deste cadastro.
//
// Dados da semente são fictícios (LGPD).
// ============================================================

const COLAB_HOJE = '2026-08-26';

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

// ---------- Helpers da semente (CPF fictício com dígito válido) ----------

function _cpfColab(base9) {
  const dv = (b, n) => { let s = 0; for (let i = 0; i < n; i += 1) s += Number(b[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  const d1 = dv(base9, 9);
  const d2 = dv(base9 + d1, 10);
  return `${base9}${d1}${d2}`;
}

const _evento = (em, texto) => ({ em, texto });

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

const COLABORADORES_SEED = [
  colaboradorSeed({
    id: 'c1', matricula: '0001', nome: 'Ana Souza', cpf: _cpfColab('412857390'), nascimento: '1981-04-12',
    cargo: 'Diretora administrativa', departamentoId: 'direcao', admissao: '2015-03-02',
    contato: { email: 'ana.souza@proway.com.br', celular: '47999120034' },
    acesso: { usuarioId: 'ana' },
    observacoes: 'Responsável legal pela unidade Blumenau.',
    historico: [_evento('2015-03-02', 'Admitida como coordenadora administrativa'), _evento('2019-01-01', 'Promovida a diretora administrativa')],
  }),
  colaboradorSeed({
    id: 'c2', matricula: '0007', nome: 'Bruno Lima', cpf: _cpfColab('573920184'), nascimento: '1987-09-23',
    cargo: 'Coordenador pedagógico', departamentoId: 'pedagogico', admissao: '2019-02-11',
    contato: { email: 'bruno.lima@proway.com.br', celular: '47988745512' },
    acesso: { usuarioId: 'bruno' },
    observacoes: 'Também dá aula, dentro do salário (instrutor i0, folha).',
    historico: [_evento('2019-02-11', 'Admitido como coordenador pedagógico')],
  }),
  colaboradorSeed({
    id: 'c3', matricula: '0012', nome: 'Diego Rocha', cpf: _cpfColab('698301247'), nascimento: '1992-01-30',
    cargo: 'Analista financeiro', departamentoId: 'financeiro', admissao: '2021-06-01',
    contato: { email: 'diego.rocha@proway.com.br', celular: '47996671120' },
    acesso: { usuarioId: 'diego' },
    historico: [_evento('2021-06-01', 'Admitido como assistente financeiro'), _evento('2024-03-01', 'Promovido a analista financeiro')],
  }),
  colaboradorSeed({
    id: 'c4', matricula: '0015', nome: 'Fernanda Alves', cpf: _cpfColab('734512908'), nascimento: '1990-11-05',
    cargo: 'Consultora comercial', departamentoId: 'comercial', admissao: '2022-03-14',
    contato: { email: 'fernanda.alves@proway.com.br', celular: '47984410098' },
    acesso: { usuarioId: 'fernanda' },
    historico: [_evento('2022-03-14', 'Admitida como consultora comercial')],
  }),
  colaboradorSeed({
    id: 'c5', matricula: '0018', nome: 'Gustavo Prado', cpf: _cpfColab('805617342'), nascimento: '1998-06-17',
    cargo: 'Analista de suporte', departamentoId: 'suporte', admissao: '2023-08-07',
    contato: { email: 'gustavo.prado@proway.com.br', celular: '47991108833' },
    acesso: { usuarioId: 'gustavo' },
    historico: [_evento('2023-08-07', 'Admitido como analista de suporte')],
  }),
  colaboradorSeed({
    id: 'c6', matricula: '0024', nome: 'Elisa Martins', cpf: _cpfColab('916728450'), nascimento: '1995-02-08',
    cargo: 'Assistente administrativa', departamentoId: 'administrativo', admissao: '2026-08-17',
    contato: { email: 'elisa.martins@proway.com.br', celular: '47997765541' },
    acesso: { usuarioId: 'elisa' },
    observacoes: 'Admissão em andamento. Usuário criado, ainda sem perfil.',
    historico: [_evento('2026-08-17', 'Admitida como assistente administrativa')],
  }),
  colaboradorSeed({
    id: 'c7', matricula: '0022', nome: 'Juliana Ferreira', cpf: _cpfColab('327845019'), nascimento: '2004-08-21',
    cargo: 'Estagiária de marketing', departamentoId: 'marketing', admissao: '2026-03-02',
    contato: { email: 'juliana.ferreira@proway.com.br', celular: '47992234410' },
    acesso: { usuarioId: null },
    observacoes: 'Estágio via CIEE até 02/03/2027.',
    historico: [_evento('2026-03-02', 'Início do estágio (marketing)')],
  }),
  colaboradorSeed({
    id: 'c8', matricula: '0020', nome: 'Marcos Pereira', cpf: _cpfColab('248093165'), nascimento: '1989-12-02',
    cargo: 'Designer', departamentoId: 'marketing', admissao: '2024-10-01',
    contato: { email: 'marcos.pereira@proway.com.br', celular: '47988012277' },
    acesso: { usuarioId: null },
    historico: [_evento('2024-10-01', 'Início como designer')],
  }),
  colaboradorSeed({
    id: 'c10', matricula: '0026', nome: 'Otávio Rangel Delgado', cpf: _cpfColab('905371268'), nascimento: '1984-08-19',
    cargo: 'Analista de suporte técnico', departamentoId: 'suporte', admissao: '2026-02-02',
    contato: { email: 'otavio.delgado@proway.com.br', celular: '47988410305' },
    acesso: { usuarioId: 'otavio' },
    observacoes: 'Meio período no suporte; também é instrutor PJ (i3, mesmo usuário de acesso).',
    historico: [_evento('2026-02-02', 'Início no suporte (meio período)')],
  }),
  colaboradorSeed({
    id: 'c9', matricula: '0009', nome: 'Patrícia Gomes', cpf: _cpfColab('159384720'), nascimento: '1993-05-19',
    cargo: 'Recepcionista', departamentoId: 'administrativo', admissao: '2020-01-13', status: 'afastado',
    afastamento: { inicio: '2026-07-06', previsaoRetorno: '2026-11-02', motivo: 'maternidade' },
    contato: { email: 'patricia.gomes@proway.com.br', celular: '47995540021' },
    acesso: { usuarioId: null },
    historico: [_evento('2020-01-13', 'Admitida como recepcionista'), _evento('2026-07-06', 'Afastada — licença-maternidade (retorno previsto 02/11/2026)')],
  }),
  // Vendedor externo: parceiro (representante comercial), não funcionário; acessa o sistema com o perfil
  // Vendedor externo (usuário 'rafael' em js/permissoes-data.js), que só vê as vendas dele.
  colaboradorSeed({
    id: 'c12', matricula: '0027', nome: 'Rafael Tonin', cpf: _cpfColab('467203915'), nascimento: '1988-07-14',
    cargo: 'Vendedor externo', departamentoId: 'comercial', admissao: '2026-06-01',
    contato: { email: 'rafael.tonin@parceiro.com.br', celular: '47991357024' },
    acesso: { usuarioId: 'rafael' },
    observacoes: 'Parceiro comercial (representante), não é funcionário da escola. Vende cursos e vê só as próprias vendas.',
    historico: [_evento('2026-06-01', 'Início da parceria como vendedor externo')],
  }),
  colaboradorSeed({
    id: 'c11', matricula: '0016', nome: 'Rafael Santos', cpf: _cpfColab('682417530'), nascimento: '1996-03-28',
    cargo: 'Analista de suporte', departamentoId: 'suporte', admissao: '2022-09-05', status: 'desligado',
    desligamento: { data: '2026-05-29', motivo: 'pedido' },
    contato: { email: '', celular: '47991876650' },
    acesso: { usuarioId: null },
    observacoes: 'Usuário de acesso removido.',
    historico: [_evento('2022-09-05', 'Admitido como analista de suporte'), _evento('2026-05-29', 'Desligado — pedido de desligamento')],
  }),
];
