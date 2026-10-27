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
// Os ids (i0–i8) são os mesmos de `INSTRUTORES` em js/cursos-data.js, que as
// turmas apontam (`turma.instrutorId`) e os cursos habilitam (`curso.instrutorIds`).
// Dados pessoais/bancários da semente são fictícios (LGPD).
// ============================================================

const INSTRUTOR_SEED_HOJE = '2026-08-26';

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
  // Programados pela tela de pagamentos por semana (fora da V1; motor PagamentosInstrutores):
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
  link: 'https://www.proway.com.br/dpo',
  termos: [
    'Li e concordo com a política de privacidade e proteção de dados.',
    'Reconheço e concordo que a coleta dos dados pessoais informados são destinados à execução do contrato de prestação de serviços com a ProWay, conforme as condições que envolvem o tratamento de dados pessoais previstos no Aviso de Privacidade da ProWay.',
  ],
};

// ---------- Helpers da semente (documentos fictícios com dígito válido) ----------

function _dvMod11(base, pesos) {
  const s = base.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const r = s % 11;
  return r < 2 ? 0 : 11 - r;
}
function cpfSeed(base9) {
  const d1 = (() => { let s = 0; for (let i = 0; i < 9; i += 1) s += Number(base9[i]) * (10 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; })();
  const d2 = (() => { const b = base9 + d1; let s = 0; for (let i = 0; i < 10; i += 1) s += Number(b[i]) * (11 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; })();
  return `${base9}${d1}${d2}`;
}
function cnpjSeed(base12) {
  const d1 = _dvMod11(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = _dvMod11(base12 + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base12}${d1}${d2}`;
}

let _vh = 0;
const faixaHora = (nome, valor, cond = {}) => ({ id: `vh${++_vh}`, nome, valor, alunosMin: null, alunosMax: null, horasMin: null, horasMax: null, ...cond });

// Tabela padrão: valor base + degraus por tamanho de turma e por curso longo.
const tabelaPadrao = (base) => [
  faixaHora('Padrão', base),
  faixaHora('Turma pequena (até 8 alunos)', Math.round(base * 0.85), { alunosMax: 8 }),
  faixaHora('Turma grande (16+ alunos)', Math.round(base * 1.15), { alunosMin: 16 }),
  faixaHora('Curso longo (40 h ou mais)', Math.round(base * 0.95), { horasMin: 40 }),
];

function instrutorSeed(d) {
  return {
    status: 'ativo', remuneracao: 'pj', colaboradorId: null, foto: null, apelido: '', nascimento: '', cpf: '', rg: '', especialidade: '', bio: '',
    endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: '', whatsapp: '', emergencia: { nome: '', telefone: '' } },
    empresa: null,
    contaPessoal: null, // só RPA: { banco, agencia, conta, pix } em nome da própria pessoa
    custoHoraReferencia: null, // só folha: custo-hora (salário + encargos ÷ horas) usado no DRE da turma
    valoresHora: [],
    contratos: [],
    pagamentos: [],
    antecedentes: [],
    lgpd: null,
    tagEstacionamento: { possui: false, identificacao: '', cedidaEm: '', devolvidaEm: '' },
    cadastro: null, // link de auto-cadastro (token) — ver Instrutores.gerarCadastro
    observacoes: '',
    historico: [],
    ...d,
  };
}
const empresa = (cnpj, razaoSocial, extra = {}) => ({ cnpj, razaoSocial, banco: 'Viacredi', agencia: '0101', conta: '', pix: '', ...extra });
const antecedente = (ano, enviadoEm, arquivo = `antecedentes-${ano}.pdf`) => ({ id: `ant-${ano}`, ano, enviadoEm, arquivo });
const lgpdOk = (aceitoEm) => ({ aceitoEm, versao: LGPD_INSTRUTOR.versao });
const evento = (em, texto) => ({ em, texto });

// ---------- Contratos e pagamentos da semente ----------
// Itens vêm das turmas reais (TURMAS_CURSO em js/cursos-data.js) do instrutor.

function _cursoSeed(id) { return CURSOS_SEED.find((c) => c.id === id); }
function _turmasDo(instrutorId, filtro) {
  return TURMAS_CURSO.filter((t) => t.instrutorId === instrutorId && filtro(t));
}
function _itemDe(t, valoresHora) {
  const curso = _cursoSeed(t.cursoId);
  const horas = curso?.cargaHoraria ?? 0;
  const alunos = t.vagas ?? 0;
  // Mesma regra do motor (Instrutores.valorHoraPara): faixa mais específica que casa.
  const casa = (f) => (f.alunosMin == null || alunos >= f.alunosMin) && (f.alunosMax == null || alunos <= f.alunosMax) && (f.horasMin == null || horas >= f.horasMin) && (f.horasMax == null || horas <= f.horasMax);
  const esp = (f) => [f.alunosMin, f.alunosMax, f.horasMin, f.horasMax].filter((x) => x != null).length;
  const f = [...valoresHora].filter(casa).sort((a, b) => esp(b) - esp(a))[0] ?? valoresHora[0];
  return { id: `it-${t.id}`, turmaId: t.id, cursoId: t.cursoId, horas, alunos, valorHoraId: f?.id ?? null, valorHora: f?.valor ?? 0, total: horas * (f?.valor ?? 0) };
}
function contratoInstrutorSeed({ id, codigo, tipo, formacaoId = null, turmas, valoresHora, status, criadoEm, geradoEm = null, enviadoEm = null, instrutorAssinouEm = null, escolaAssinouEm = null, envelopeId = null }) {
  const itens = turmas.map((t) => _itemDe(t, valoresHora));
  const historico = [evento(criadoEm, 'Contrato criado')];
  if (geradoEm) historico.push(evento(geradoEm, 'Documento gerado (v1)'));
  if (enviadoEm) historico.push(evento(enviadoEm, 'Enviado ao Clicksign'));
  if (instrutorAssinouEm) historico.push(evento(instrutorAssinouEm, 'Assinado pelo instrutor (Clicksign)'));
  if (escolaAssinouEm) historico.push(evento(escolaAssinouEm, 'Assinado pela escola (Clicksign)'));
  return {
    id, codigo, tipo, formacaoId, itens, status, criadoEm,
    documento: geradoEm ? { versao: 1, geradoEm } : null,
    clicksign: enviadoEm ? { envelopeId, enviadoEm, instrutorAssinouEm, escolaAssinouEm } : null,
    observacoes: '', historico,
  };
}
let _pg = 0;
const pagamento = (contratoId, tipo, descricao, valor, previsto, { itemId = null, nf = null, pagoEm = null } = {}) => ({ id: `pg${++_pg}`, contratoId, itemId, tipo, descricao, valor, previsto, nf, pagoEm });
const nf = (numero, emitidaEm) => ({ numero, emitidaEm, arquivo: `nf-${numero}.pdf` });

// ---------- Semente ----------

const VH_I1 = tabelaPadrao(95);
const VH_I2 = tabelaPadrao(90);
const VH_I3 = tabelaPadrao(110);
const VH_I4 = [faixaHora('Padrão', 120), faixaHora('Aulão / palestra (até 8 h)', 160, { horasMax: 8 })];
const VH_I5 = tabelaPadrao(100);
const VH_I6 = tabelaPadrao(85);
const VH_I7 = tabelaPadrao(105);
const VH_I8 = tabelaPadrao(115);

const T_I1_SUP10 = _turmasDo('i1', (t) => t.formacaoId === 'sup10');
const T_I1_SUP09 = _turmasDo('i1', (t) => t.formacaoId === 'sup09');
const T_I3_SUP08 = _turmasDo('i3', (t) => t.formacaoId === 'sup08');
const T_I5_AVULSAS = _turmasDo('i5', (t) => t.tipo === 'aberta');
const T_I7_GIT = _turmasDo('i7', (t) => t.tipo === 'incompany');
const T_I2_SUP09 = _turmasDo('i2', (t) => t.formacaoId === 'sup09');
const T_I2_SUP08 = _turmasDo('i2', (t) => t.formacaoId === 'sup08');

const INSTRUTORES_SEED = [
  instrutorSeed({
    id: 'i1', nome: 'André Fontoura Bastos', apelido: 'André', nascimento: '1987-06-09', cpf: cpfSeed('317204958'), rg: '4.812.337',
    especialidade: 'Front-end, lógica e Angular', bio: 'Desenvolvedor front-end há 12 anos, instrutor da ProWay desde 2019. Dá a base web e Angular das formações.',
    endereco: { cep: '89025-100', logradouro: 'Rua Engenheiro Paul Werner', numero: '480', complemento: 'Ap. 704', bairro: 'Bom Retiro', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'andre.bastos@exemplo.com.br', whatsapp: '47988410101', emergencia: { nome: 'Mariana Bastos', telefone: '47988410102' } },
    empresa: empresa(cnpjSeed('418206350001'), 'A. F. Bastos Tecnologia Ltda', { conta: '84210-3', pix: cnpjSeed('418206350001') }),
    valoresHora: VH_I1,
    contratos: [
      contratoInstrutorSeed({ id: 'ci1-1', codigo: 'CI-2026-003', tipo: 'formacao', formacaoId: 'sup09', turmas: T_I1_SUP09, valoresHora: VH_I1, status: 'assinado', criadoEm: '2026-02-10', geradoEm: '2026-02-11', enviadoEm: '2026-02-11', instrutorAssinouEm: '2026-02-12', escolaAssinouEm: '2026-02-13', envelopeId: 'cs-7f3a91' }),
      contratoInstrutorSeed({ id: 'ci1-2', codigo: 'CI-2026-011', tipo: 'formacao', formacaoId: 'sup10', turmas: T_I1_SUP10, valoresHora: VH_I1, status: 'assinatura', criadoEm: '2026-08-03', geradoEm: '2026-08-04', enviadoEm: '2026-08-04', instrutorAssinouEm: '2026-08-05', envelopeId: 'cs-b21c40' }),
    ],
    antecedentes: [antecedente(2025, '2025-02-03'), antecedente(2026, '2026-01-20')],
    lgpd: lgpdOk('2025-02-03'),
    tagEstacionamento: { possui: true, identificacao: 'TAG-0142', cedidaEm: '2024-03-01', devolvidaEm: '' },
    historico: [evento('2019-03-01', 'Cadastro criado'), evento('2026-01-20', 'Declaração de antecedentes 2026 recebida')],
  }),
  instrutorSeed({
    id: 'i2', nome: 'Tatiana Bezerra Sartori', apelido: 'Tati', nascimento: '1992-04-03', cpf: cpfSeed('482069137'), rg: '5.903.221',
    especialidade: 'Banco de dados (MySQL e PostgreSQL)', bio: 'DBA e analista de dados; leciona modelagem e SQL nas formações.',
    endereco: { cep: '89052-000', logradouro: 'Rua Progresso', numero: '1240', complemento: '', bairro: 'Progresso', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'tatiana.sartori@exemplo.com.br', whatsapp: '47988410203', emergencia: { nome: 'Paulo Sartori', telefone: '47988410204' } },
    empresa: empresa(cnpjSeed('327519840001'), 'Tatiana Sartori Dados ME', { conta: '73155-9', pix: 'tatiana.sartori@exemplo.com.br' }),
    valoresHora: VH_I2,
    contratos: [
      contratoInstrutorSeed({ id: 'ci2-1', codigo: 'CI-2026-005', tipo: 'formacao', formacaoId: 'sup09', turmas: T_I2_SUP09, valoresHora: VH_I2, status: 'assinado', criadoEm: '2026-02-18', geradoEm: '2026-02-18', enviadoEm: '2026-02-19', instrutorAssinouEm: '2026-02-19', escolaAssinouEm: '2026-02-20', envelopeId: 'cs-91d0e2' }),
      // PTG do Super DEV 8 (agosto/2026) — pagamentos em duas parcelas nas próximas semanas.
      contratoInstrutorSeed({ id: 'ci2-2', codigo: 'CI-2026-013', tipo: 'formacao', formacaoId: 'sup08', turmas: T_I2_SUP08, valoresHora: VH_I2, status: 'assinado', criadoEm: '2026-07-20', geradoEm: '2026-07-21', enviadoEm: '2026-07-21', instrutorAssinouEm: '2026-07-22', escolaAssinouEm: '2026-07-23', envelopeId: 'cs-2ab9e7' }),
    ],
    antecedentes: [antecedente(2025, '2025-01-15'), antecedente(2026, '2026-02-02')],
    lgpd: lgpdOk('2025-01-15'),
    historico: [evento('2021-08-10', 'Cadastro criado')],
  }),
  instrutorSeed({
    // Também é da equipe (suporte, c10): CPF e nascimento estão no colaborador.
    id: 'i3', colaboradorId: 'c10', nome: 'Otávio Rangel Delgado', apelido: 'Otávio', rg: '6.114.870',
    especialidade: 'Java e Spring', bio: 'Arquiteto Java; responsável pela trilha Java do Super DEV 8.',
    endereco: { cep: '89056-000', logradouro: 'Rua Hermann Hering', numero: '615', complemento: 'Casa', bairro: 'Bom Retiro', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'otavio.delgado@exemplo.com.br', whatsapp: '47988410305', emergencia: { nome: 'Luciana Delgado', telefone: '47988410306' } },
    empresa: empresa(cnpjSeed('905143720001'), 'O. R. Delgado Consultoria Ltda', { conta: '90822-4', pix: '47988410305' }),
    valoresHora: VH_I3,
    contratos: [
      contratoInstrutorSeed({ id: 'ci3-1', codigo: 'CI-2025-018', tipo: 'formacao', formacaoId: 'sup08', turmas: T_I3_SUP08, valoresHora: VH_I3, status: 'assinado', criadoEm: '2025-09-01', geradoEm: '2025-09-02', enviadoEm: '2025-09-02', instrutorAssinouEm: '2025-09-03', escolaAssinouEm: '2025-09-03', envelopeId: 'cs-40aa17' }),
    ],
    antecedentes: [antecedente(2025, '2025-03-10'), antecedente(2026, '2026-03-05')],
    lgpd: lgpdOk('2025-03-10'),
    tagEstacionamento: { possui: true, identificacao: 'TAG-0157', cedidaEm: '2025-09-01', devolvidaEm: '' },
    historico: [evento('2020-02-01', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i4', nome: 'Adriana Vilela Moraes', apelido: 'Adri', nascimento: '1980-02-11', cpf: cpfSeed('260148739'), rg: '3.220.945',
    especialidade: 'Carreira e soft skills', bio: 'Psicóloga organizacional; conduz o Perfil Profissional 360 e os aulões de carreira.',
    endereco: { cep: '89216-000', logradouro: 'Rua Otto Boehm', numero: '220', complemento: 'Sala 12', bairro: 'América', cidade: 'Joinville', uf: 'SC' },
    contato: { email: 'adriana.moraes@exemplo.com.br', whatsapp: '47988410407', emergencia: { nome: '', telefone: '' } },
    empresa: empresa(cnpjSeed('271869430001'), 'Moraes Desenvolvimento Humano Ltda', { conta: '41708-2', pix: cnpjSeed('271869430001') }),
    valoresHora: VH_I4,
    antecedentes: [antecedente(2025, '2025-04-22')],
    lgpd: lgpdOk('2025-04-22'),
    historico: [evento('2022-05-12', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i5', nome: 'Rogério Vidal Trindade', apelido: 'Rogério', nascimento: '1993-12-27', cpf: cpfSeed('739021546'), rg: '7.008.412',
    especialidade: 'Python, APIs e IA', bio: 'Engenheiro de dados; Python, FastAPI e Machine Learning nas formações e turmas abertas.',
    endereco: { cep: '89030-200', logradouro: 'Rua Antônio da Veiga', numero: '340', complemento: 'Ap. 502', bairro: 'Victor Konder', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'rogerio.trindade@exemplo.com.br', whatsapp: '47988410509', emergencia: { nome: 'Beatriz Trindade', telefone: '47988410510' } },
    empresa: empresa(cnpjSeed('683095210001'), 'R. Trindade Engenharia de Dados Ltda', { conta: '65309-7', pix: 'rogerio.trindade@exemplo.com.br' }),
    valoresHora: VH_I5,
    contratos: [
      contratoInstrutorSeed({ id: 'ci5-1', codigo: 'CI-2026-012', tipo: 'cursos', turmas: T_I5_AVULSAS, valoresHora: VH_I5, status: 'gerado', criadoEm: '2026-08-12', geradoEm: '2026-08-14' }),
    ],
    antecedentes: [antecedente(2026, '2026-01-08')],
    lgpd: lgpdOk('2024-11-02'),
    historico: [evento('2024-11-02', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i6', nome: 'Bruna Cordeiro Salgado', apelido: 'Bru', nascimento: '1989-10-05', cpf: cpfSeed('154893027'), rg: '5.447.190',
    especialidade: 'UX e aulões', bio: 'Designer de produto; aulões de UX e Figma.',
    endereco: { cep: '89070-100', logradouro: 'Rua Pastor Oswaldo Hesse', numero: '155', complemento: '', bairro: 'Itoupava Seca', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'bruna.salgado@exemplo.com.br', whatsapp: '47988410611', emergencia: { nome: 'Carlos Salgado', telefone: '47988410612' } },
    empresa: null, // ainda sem empresa aberta → não pode receber
    valoresHora: VH_I6,
    antecedentes: [antecedente(2025, '2025-06-30')],
    lgpd: null,
    historico: [evento('2025-06-30', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i7', nome: 'Sílvio Barcelos Furlan', apelido: 'Sílvio', nascimento: '1986-07-23', cpf: cpfSeed('628037491'), rg: '6.735.028',
    especialidade: 'C#/.NET, Git e cloud', bio: 'Arquiteto .NET; trilha C# do Super DEV 10 e turmas in company de Git.',
    endereco: { cep: '89046-000', logradouro: 'Rua Araranguá', numero: '890', complemento: '', bairro: 'Fortaleza', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'silvio.furlan@exemplo.com.br', whatsapp: '47988410713', emergencia: { nome: 'Fernanda Furlan', telefone: '47988410714' } },
    empresa: empresa(cnpjSeed('540972860001'), 'Furlan Software Ltda', { conta: '52964-8', pix: cnpjSeed('540972860001') }),
    valoresHora: VH_I7,
    contratos: [
      contratoInstrutorSeed({ id: 'ci7-1', codigo: 'CI-2026-010', tipo: 'cursos', turmas: T_I7_GIT, valoresHora: VH_I7, status: 'rascunho', criadoEm: '2026-08-20' }),
    ],
    antecedentes: [antecedente(2025, '2025-02-14'), antecedente(2026, '2026-02-10')],
    lgpd: lgpdOk('2025-02-14'),
    historico: [evento('2023-03-20', 'Cadastro criado')],
  }),
  // Instrutor recém-cadastrado: documentação em dia, mas ainda sem turmas nem contrato.
  instrutorSeed({
    id: 'i8', nome: 'Francisco Tramontin Bergamo', apelido: 'Chico', nascimento: '1990-05-16', cpf: cpfSeed('491576238'), rg: '4.309.661',
    especialidade: 'Cloud, DevOps e containers', bio: 'Engenheiro de plataforma; Docker, Kubernetes e esteiras de CI/CD. Cadastrado em agosto/2026, ainda sem turma atribuída.',
    endereco: { cep: '89036-500', logradouro: 'Rua Gustavo Zimmermann', numero: '2110', complemento: '', bairro: 'Itoupava Central', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'francisco.bergamo@exemplo.com.br', whatsapp: '47988410815', emergencia: { nome: 'Helena Bergamo', telefone: '47988410816' } },
    empresa: empresa(cnpjSeed('736284190001'), 'F. Bergamo Treinamentos Ltda', { conta: '38471-5', pix: cnpjSeed('736284190001') }),
    valoresHora: VH_I8,
    antecedentes: [antecedente(2026, '2026-08-18')],
    lgpd: lgpdOk('2026-08-18'),
    historico: [evento('2026-08-18', 'Cadastro criado')],
  }),
  // Coordenador pedagógico (c2) que dá aula dentro do salário. Id fora da faixa do gerador (i9+).
  instrutorSeed({
    id: 'i0', colaboradorId: 'c2', remuneracao: 'folha', nome: 'Bruno Lima', apelido: 'Bruno',
    custoHoraReferencia: 85,
    especialidade: 'Didática e acolhimento de turmas', bio: 'Coordenador pedagógico; dá a aula inaugural das formações e cobre falta de instrutor.',
    contato: { email: 'bruno.lima@proway.com.br', whatsapp: '47988745512', emergencia: { nome: '', telefone: '' } },
    antecedentes: [antecedente(2026, '2026-02-10')],
    lgpd: lgpdOk('2026-02-10'),
    historico: [evento('2026-10-19', 'Papel de instrutor adicionado ao colaborador Bruno Lima')],
  }),
];

// Pagamentos da semente: por item já concluído dos contratos assinados.
(function pagamentosSeed() {
  const porInstrutor = { i1: [], i2: [], i3: [] };
  const concluidas = (c) => c.itens.filter((it) => (TURMAS_CURSO.find((t) => t.id === it.turmaId)?.fim ?? '') <= INSTRUTOR_SEED_HOJE);
  const i1 = INSTRUTORES_SEED.find((i) => i.id === 'i1');
  concluidas(i1.contratos[0]).forEach((it, k) => {
    const t = TURMAS_CURSO.find((x) => x.id === it.turmaId);
    const curso = _cursoSeed(it.cursoId);
    const pago = k < concluidas(i1.contratos[0]).length - 1;
    porInstrutor.i1.push(pagamento('ci1-1', 'curso', `${curso?.codigo} · ${t.codigo}`, it.total, t.fim, { itemId: it.id, nf: pago ? nf(`${1200 + k}`, t.fim) : null, pagoEm: pago ? t.fim : null }));
  });
  const i2 = INSTRUTORES_SEED.find((i) => i.id === 'i2');
  concluidas(i2.contratos[0]).forEach((it, k) => {
    const t = TURMAS_CURSO.find((x) => x.id === it.turmaId);
    const curso = _cursoSeed(it.cursoId);
    porInstrutor.i2.push(pagamento('ci2-1', 'curso', `${curso?.codigo} · ${t.codigo}`, it.total, t.fim, { itemId: it.id, nf: nf(`${300 + k}`, t.fim), pagoEm: k === 0 ? t.fim : null }));
  });
  const i3 = INSTRUTORES_SEED.find((i) => i.id === 'i3');
  const itensI3 = i3.contratos[0].itens;
  if (itensI3[0]) {
    const t = TURMAS_CURSO.find((x) => x.id === itensI3[0].turmaId);
    const curso = _cursoSeed(itensI3[0].cursoId);
    porInstrutor.i3.push(pagamento('ci3-1', 'parcial', `${curso?.codigo} · ${t.codigo} — 1ª metade`, Math.round(itensI3[0].total / 2), '2026-05-30', { itemId: itensI3[0].id, nf: nf('88', '2026-05-28'), pagoEm: '2026-05-30' }));
    porInstrutor.i3.push(pagamento('ci3-1', 'parcial', `${curso?.codigo} · ${t.codigo} — 2ª metade`, itensI3[0].total - Math.round(itensI3[0].total / 2), '2026-08-30', { itemId: itensI3[0].id }));
  }
  // Movimento para a tela de pagamentos por semana (fora da V1).
  // Deixa saldo/aulas livres para testar as três formas: JVA (concluída) meio paga
  // → "conclusão da turma" paga o saldo; JVO (em andamento) com o sábado 15/08 já
  // programado como AULAS AVULSAS (em atraso) → o sábado 22/08 fica livre para
  // "aulas avulsas" e "mensal" de agosto. As aulas gravadas seguem a agenda do
  // Super DEV 8 (sábados 08:00–12:00 e 13:00–19:00) — a chave é data|inicio.
  const _itemI3 = (turmaId) => itensI3.find((it) => it.turmaId === turmaId);
  const _baseDe = (it) => { const t = TURMAS_CURSO.find((x) => x.id === it.turmaId); return `${_cursoSeed(it.cursoId)?.codigo} · ${t?.codigo}`; };
  const jva = _itemI3('sup08-jva');
  if (jva) {
    porInstrutor.i3.push(pagamento('ci3-1', 'parcial', `${_baseDe(jva)} — 1ª metade`, Math.round(jva.total / 2), '2026-08-21', { itemId: jva.id, nf: nf('412', '2026-08-20'), pagoEm: '2026-08-21' }));
  }
  const jvo = _itemI3('sup08-jvo');
  if (jvo) {
    const aulas1508 = [{ data: '2026-08-15', inicio: '08:00', fim: '12:00', horas: 4 }, { data: '2026-08-15', inicio: '13:00', fim: '19:00', horas: 6 }];
    const horas = aulas1508.reduce((s, a) => s + a.horas, 0);
    porInstrutor.i3.push({ ...pagamento('ci3-1', 'aulas', `${_baseDe(jvo)} — 2 aulas (15/08)`, Math.round(horas * jvo.valorHora), '2026-08-21', { itemId: jvo.id }), horas, aulas: aulas1508 });
  }
  // Tatiana · PTG (concluída em 08/08): duas metades nas próximas semanas — a 1ª já com NF (liberada), a 2ª aguardando.
  const ptg = i2.contratos[1]?.itens[0];
  if (ptg) {
    const t = TURMAS_CURSO.find((x) => x.id === ptg.turmaId);
    const curso = _cursoSeed(ptg.cursoId);
    const metade = Math.round(ptg.total / 2);
    porInstrutor.i2.push(pagamento('ci2-2', 'parcial', `${curso?.codigo} · ${t.codigo} — 1ª metade`, metade, '2026-09-04', { itemId: ptg.id, nf: nf('318', '2026-08-24') }));
    porInstrutor.i2.push(pagamento('ci2-2', 'parcial', `${curso?.codigo} · ${t.codigo} — 2ª metade`, ptg.total - metade, '2026-09-18', { itemId: ptg.id }));
  }
  Object.entries(porInstrutor).forEach(([id, lista]) => { INSTRUTORES_SEED.find((i) => i.id === id).pagamentos = lista; });
})();

// >>> CATALOGO-PROWAY instrutores (gerado por _tools/semente-catalogo/gerar.py — não editar à mão)
const VH_I9 = tabelaPadrao(90);
const VH_I10 = tabelaPadrao(90);
const VH_I11 = tabelaPadrao(105);
const VH_I12 = tabelaPadrao(105);
const VH_I13 = tabelaPadrao(85);
const VH_I14 = tabelaPadrao(95);
const VH_I15 = tabelaPadrao(120);
const VH_I16 = tabelaPadrao(90);
const VH_I17 = tabelaPadrao(100);
const VH_I19 = tabelaPadrao(95);
const VH_I20 = tabelaPadrao(85);
const VH_I18 = tabelaPadrao(95);
INSTRUTORES_SEED.push(
  instrutorSeed({
    id: 'i9', nome: 'Camila Hoffmann Ristow', apelido: 'Camila', nascimento: '1991-03-14', cpf: cpfSeed('864731028'), rg: '8.195.281',
    especialidade: 'Design gráfico (Illustrator, Photoshop e InDesign)', bio: 'Designer gráfica e diretora de arte; dá os cursos Adobe e as formações de design gráfico.',
    endereco: { cep: '89032-400', logradouro: 'Rua Almirante Barroso', numero: '512', complemento: '', bairro: 'Vila Nova', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'camila.ristow@exemplo.com.br', whatsapp: '47988411063', emergencia: { nome: 'Natália Ristow', telefone: '47988412063' } },
    empresa: empresa(cnpjSeed('626425100001'), 'Camila Ristow Treinamentos ME', { conta: '42571-2', pix: 'camila.ristow@exemplo.com.br' }),
    valoresHora: VH_I9,
    contratos: [contratoInstrutorSeed({ id: 'ci9-1', codigo: 'CI-2026-109', tipo: 'cursos', turmas: _turmasDo('i9', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I9, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-09a3838' }), contratoInstrutorSeed({ id: 'ci9-2', codigo: 'CI-2026-138', tipo: 'formacao', formacaoId: 'dg3b', turmas: _turmasDo('i9', (t) => t.formacaoId === 'dg3b'), valoresHora: VH_I9, status: 'assinado', criadoEm: '2026-07-20', geradoEm: '2026-07-21', enviadoEm: '2026-07-21', instrutorAssinouEm: '2026-07-22', escolaAssinouEm: '2026-07-23', envelopeId: 'cs-09f8365' }), contratoInstrutorSeed({ id: 'ci9-3', codigo: 'CI-2026-139', tipo: 'formacao', formacaoId: 'dg3c', turmas: _turmasDo('i9', (t) => t.formacaoId === 'dg3c'), valoresHora: VH_I9, status: 'assinatura', criadoEm: '2026-09-19', geradoEm: '2026-09-20', enviadoEm: '2026-09-20', envelopeId: 'cs-09f1359' })],
    antecedentes: [antecedente(2026, '2026-03-15')],
    lgpd: lgpdOk('2025-07-25'),
    historico: [evento('2021-01-15', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i10', nome: 'Diego Amorim Lenzi', apelido: 'Diego', nascimento: '1988-09-02', cpf: cpfSeed('636932346'), rg: '5.173.957',
    especialidade: 'Vídeo e motion (Premiere e After Effects)', bio: 'Editor e motion designer; produção audiovisual, vinhetas e efeitos.',
    endereco: { cep: '89045-854', logradouro: 'Rua Dois de Setembro', numero: '1880', complemento: '', bairro: 'Itoupava Norte', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'diego.lenzi@exemplo.com.br', whatsapp: '47988411070', emergencia: { nome: 'Débora Lenzi', telefone: '47988412070' } },
    empresa: empresa(cnpjSeed('869697890001'), 'Diego Lenzi Treinamentos ME', { conta: '22641-3', pix: 'diego.lenzi@exemplo.com.br' }),
    valoresHora: VH_I10,
    contratos: [contratoInstrutorSeed({ id: 'ci10-1', codigo: 'CI-2026-110', tipo: 'cursos', turmas: _turmasDo('i10', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I10, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-10a6150' }), contratoInstrutorSeed({ id: 'ci10-2', codigo: 'CI-2026-140', tipo: 'formacao', formacaoId: 'avpa', turmas: _turmasDo('i10', (t) => t.formacaoId === 'avpa'), valoresHora: VH_I10, status: 'assinado', criadoEm: '2026-06-23', geradoEm: '2026-06-24', enviadoEm: '2026-06-24', instrutorAssinouEm: '2026-06-25', escolaAssinouEm: '2026-06-26', envelopeId: 'cs-10f3749' })],
    antecedentes: [antecedente(2026, '2026-02-24')],
    lgpd: lgpdOk('2025-03-26'),
    historico: [evento('2020-09-15', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i11', nome: 'Marcelo Dallabrida Kuhn', apelido: 'Marcelo', nascimento: '1983-11-27', cpf: cpfSeed('799913409'), rg: '6.925.992',
    especialidade: 'CAD e BIM (AutoCAD, Revit, SketchUp e Promob)', bio: 'Arquiteto e urbanista; projetos em CAD/BIM e interiores há 15 anos.',
    endereco: { cep: '89016-377', logradouro: 'Rua Amazonas', numero: '2190', complemento: '', bairro: 'Garcia', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'marcelo.kuhn@exemplo.com.br', whatsapp: '47988411077', emergencia: { nome: 'Caio Kuhn', telefone: '47988412077' } },
    empresa: empresa(cnpjSeed('782336780001'), 'Marcelo Kuhn Treinamentos ME', { conta: '38004-9', pix: 'marcelo.kuhn@exemplo.com.br' }),
    valoresHora: VH_I11,
    contratos: [contratoInstrutorSeed({ id: 'ci11-1', codigo: 'CI-2026-111', tipo: 'cursos', turmas: _turmasDo('i11', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I11, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-11a3195' }), contratoInstrutorSeed({ id: 'ci11-2', codigo: 'CI-2026-142', tipo: 'formacao', formacaoId: 'cada', turmas: _turmasDo('i11', (t) => t.formacaoId === 'cada'), valoresHora: VH_I11, status: 'assinado', criadoEm: '2026-05-23', geradoEm: '2026-05-24', enviadoEm: '2026-05-24', instrutorAssinouEm: '2026-05-25', escolaAssinouEm: '2026-05-26', envelopeId: 'cs-11f8087' }), contratoInstrutorSeed({ id: 'ci11-3', codigo: 'CI-2026-143', tipo: 'formacao', formacaoId: 'rpia', turmas: _turmasDo('i11', (t) => t.formacaoId === 'rpia'), valoresHora: VH_I11, status: 'assinado', criadoEm: '2026-07-21', geradoEm: '2026-07-22', enviadoEm: '2026-07-22', instrutorAssinouEm: '2026-07-23', escolaAssinouEm: '2026-07-24', envelopeId: 'cs-11f5250' })],
    antecedentes: [antecedente(2026, '2026-01-10')],
    lgpd: lgpdOk('2025-07-16'),
    historico: [evento('2018-08-13', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i12', nome: 'Renata Zanella Pires', apelido: 'Renata', nascimento: '1990-06-18', cpf: cpfSeed('748626639'), rg: '7.784.150',
    especialidade: 'SolidWorks e impressão 3D', bio: 'Engenheira mecânica; projetos mecânicos, chapas metálicas e prototipagem.',
    endereco: { cep: '89055-722', logradouro: 'Rua Bahia', numero: '4040', complemento: '', bairro: 'Fortaleza', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'renata.pires@exemplo.com.br', whatsapp: '47988411084', emergencia: { nome: 'Rafaela Pires', telefone: '47988412084' } },
    empresa: empresa(cnpjSeed('391814320001'), 'Renata Pires Treinamentos ME', { conta: '84347-9', pix: 'renata.pires@exemplo.com.br' }),
    valoresHora: VH_I12,
    contratos: [contratoInstrutorSeed({ id: 'ci12-1', codigo: 'CI-2026-112', tipo: 'cursos', turmas: _turmasDo('i12', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I12, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-12a9071' })],
    antecedentes: [antecedente(2026, '2026-01-24')],
    lgpd: lgpdOk('2025-02-11'),
    historico: [evento('2022-09-27', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i13', nome: 'Juliana Petry Andrade', apelido: 'Ju', nascimento: '1994-01-30', cpf: cpfSeed('011198681'), rg: '4.300.412',
    especialidade: 'Excel, Power BI e Office', bio: 'Analista de BI; Excel do básico ao avançado, dashboards e Power BI.',
    endereco: { cep: '89052-510', logradouro: 'Rua São Paulo', numero: '1312', complemento: '', bairro: 'Velha', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'ju.andrade@exemplo.com.br', whatsapp: '47988411091', emergencia: { nome: 'Sofia Andrade', telefone: '47988412091' } },
    empresa: empresa(cnpjSeed('705293030001'), 'Juliana Andrade Treinamentos ME', { conta: '76040-6', pix: 'ju.andrade@exemplo.com.br' }),
    valoresHora: VH_I13,
    contratos: [contratoInstrutorSeed({ id: 'ci13-1', codigo: 'CI-2026-113', tipo: 'cursos', turmas: _turmasDo('i13', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I13, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-13a3446' }), contratoInstrutorSeed({ id: 'ci13-2', codigo: 'CI-2026-146', tipo: 'formacao', formacaoId: 'xdpa', turmas: _turmasDo('i13', (t) => t.formacaoId === 'xdpa'), valoresHora: VH_I13, status: 'assinado', criadoEm: '2026-07-28', geradoEm: '2026-07-29', enviadoEm: '2026-07-29', instrutorAssinouEm: '2026-07-30', escolaAssinouEm: '2026-07-31', envelopeId: 'cs-13f6014' }), contratoInstrutorSeed({ id: 'ci13-3', codigo: 'CI-2026-147', tipo: 'formacao', formacaoId: 'expb', turmas: _turmasDo('i13', (t) => t.formacaoId === 'expb'), valoresHora: VH_I13, status: 'assinatura', criadoEm: '2026-08-18', geradoEm: '2026-08-19', enviadoEm: '2026-08-19', envelopeId: 'cs-13f7877' })],
    antecedentes: [antecedente(2026, '2026-01-23')],
    lgpd: lgpdOk('2025-07-13'),
    historico: [evento('2018-02-21', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i14', nome: 'Leonardo Schmitt Vieira', apelido: 'Léo', nascimento: '1989-04-08', cpf: cpfSeed('573015392'), rg: '3.609.118',
    especialidade: 'Marketing digital, tráfego e SEO', bio: 'Gestor de tráfego e consultor de marketing digital; Meta e Google Ads, Analytics e SEO.',
    endereco: { cep: '89031-226', logradouro: 'Rua Humberto de Campos', numero: '77', complemento: '', bairro: 'Ponta Aguda', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'leo.vieira@exemplo.com.br', whatsapp: '47988411098', emergencia: { nome: 'Rafaela Vieira', telefone: '47988412098' } },
    empresa: empresa(cnpjSeed('454955090001'), 'Leonardo Vieira Treinamentos ME', { conta: '52490-6', pix: 'leo.vieira@exemplo.com.br' }),
    valoresHora: VH_I14,
    contratos: [contratoInstrutorSeed({ id: 'ci14-1', codigo: 'CI-2026-114', tipo: 'cursos', turmas: _turmasDo('i14', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I14, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-14a3140' }), contratoInstrutorSeed({ id: 'ci14-2', codigo: 'CI-2026-148', tipo: 'formacao', formacaoId: 'md1a', turmas: _turmasDo('i14', (t) => t.formacaoId === 'md1a'), valoresHora: VH_I14, status: 'assinado', criadoEm: '2026-05-18', geradoEm: '2026-05-19', enviadoEm: '2026-05-19', instrutorAssinouEm: '2026-05-20', escolaAssinouEm: '2026-05-21', envelopeId: 'cs-14f2889' }), contratoInstrutorSeed({ id: 'ci14-3', codigo: 'CI-2026-149', tipo: 'formacao', formacaoId: 'brpa', turmas: _turmasDo('i14', (t) => t.formacaoId === 'brpa'), valoresHora: VH_I14, status: 'gerado', criadoEm: '2026-08-18', geradoEm: '2026-08-19' })],
    antecedentes: [antecedente(2026, '2026-01-21')],
    lgpd: lgpdOk('2025-07-16'),
    historico: [evento('2019-07-22', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i15', nome: 'Patrícia Wolff Baumgarten', apelido: 'Patrícia', nascimento: '1979-12-05', cpf: cpfSeed('844618184'), rg: '6.360.566',
    especialidade: 'Liderança, comunicação, ágeis e finanças pessoais', bio: 'Consultora em gestão de pessoas; liderança, comunicação e metodologias ágeis in company.',
    endereco: { cep: '89036-380', logradouro: 'Rua Frei Estanislau Schaette', numero: '250', complemento: '', bairro: 'Jardim Blumenau', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'patricia.baumgarten@exemplo.com.br', whatsapp: '47988411105', emergencia: { nome: 'Tainá Baumgarten', telefone: '47988412105' } },
    empresa: empresa(cnpjSeed('844289110001'), 'Patrícia Baumgarten Treinamentos ME', { conta: '99622-7', pix: 'patricia.baumgarten@exemplo.com.br' }),
    valoresHora: VH_I15,
    contratos: [contratoInstrutorSeed({ id: 'ci15-1', codigo: 'CI-2026-115', tipo: 'cursos', turmas: _turmasDo('i15', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I15, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-15a1399' })],
    antecedentes: [antecedente(2026, '2026-03-18')],
    lgpd: lgpdOk('2025-07-22'),
    historico: [evento('2022-01-19', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i16', nome: 'Fernanda Girardi Kroeger', apelido: 'Fê', nascimento: '1992-08-21', cpf: cpfSeed('924680821'), rg: '7.483.498',
    especialidade: 'Moda e estamparia têxtil', bio: 'Estilista e designer de estampas; desenho técnico, croqui e finalização para estamparia.',
    endereco: { cep: '89063-644', logradouro: 'Rua Pandiá Calógeras', numero: '615', complemento: '', bairro: 'Água Verde', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'fe.kroeger@exemplo.com.br', whatsapp: '47988411112', emergencia: { nome: 'Fernanda Kroeger', telefone: '47988412112' } },
    empresa: empresa(cnpjSeed('685382120001'), 'Fernanda Kroeger Treinamentos ME', { conta: '91528-5', pix: 'fe.kroeger@exemplo.com.br' }),
    valoresHora: VH_I16,
    contratos: [contratoInstrutorSeed({ id: 'ci16-1', codigo: 'CI-2026-116', tipo: 'cursos', turmas: _turmasDo('i16', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I16, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-16a4007' }), contratoInstrutorSeed({ id: 'ci16-2', codigo: 'CI-2026-152', tipo: 'formacao', formacaoId: 'tx2a', turmas: _turmasDo('i16', (t) => t.formacaoId === 'tx2a'), valoresHora: VH_I16, status: 'assinado', criadoEm: '2026-08-10', geradoEm: '2026-08-11', enviadoEm: '2026-08-11', instrutorAssinouEm: '2026-08-12', escolaAssinouEm: '2026-08-13', envelopeId: 'cs-16f3997' })],
    antecedentes: [antecedente(2026, '2026-03-24')],
    lgpd: lgpdOk('2025-09-24'),
    historico: [evento('2021-09-25', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i17', nome: 'Henrique Sasse Duarte', apelido: 'Henrique', nascimento: '1995-05-11', cpf: cpfSeed('651599719'), rg: '3.907.441',
    especialidade: 'Dados, Python e automação', bio: 'Cientista de dados; análise de dados, RPA e machine learning em Python.',
    endereco: { cep: '89072-848', logradouro: 'Rua Coronel Feddersen', numero: '1502', complemento: '', bairro: 'Escola Agrícola', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'henrique.duarte@exemplo.com.br', whatsapp: '47988411119', emergencia: { nome: 'Alexandre Duarte', telefone: '47988412119' } },
    empresa: empresa(cnpjSeed('412889930001'), 'Henrique Duarte Treinamentos ME', { conta: '58714-4', pix: 'henrique.duarte@exemplo.com.br' }),
    valoresHora: VH_I17,
    contratos: [contratoInstrutorSeed({ id: 'ci17-1', codigo: 'CI-2026-117', tipo: 'cursos', turmas: _turmasDo('i17', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I17, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-17a1274' }), contratoInstrutorSeed({ id: 'ci17-2', codigo: 'CI-2026-154', tipo: 'formacao', formacaoId: 'fpsa', turmas: _turmasDo('i17', (t) => t.formacaoId === 'fpsa'), valoresHora: VH_I17, status: 'assinado', criadoEm: '2026-07-27', geradoEm: '2026-07-28', enviadoEm: '2026-07-28', instrutorAssinouEm: '2026-07-29', escolaAssinouEm: '2026-07-30', envelopeId: 'cs-17f3767' }), contratoInstrutorSeed({ id: 'ci17-3', codigo: 'CI-2026-155', tipo: 'formacao', formacaoId: 'fdsa', turmas: _turmasDo('i17', (t) => t.formacaoId === 'fdsa'), valoresHora: VH_I17, status: 'assinado', criadoEm: '2026-02-21', geradoEm: '2026-02-22', enviadoEm: '2026-02-22', instrutorAssinouEm: '2026-02-23', escolaAssinouEm: '2026-02-24', envelopeId: 'cs-17f4161' })],
    antecedentes: [antecedente(2026, '2026-03-12')],
    lgpd: lgpdOk('2025-01-26'),
    historico: [evento('2024-08-26', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i19', nome: 'Rafael Bonatelli Moser', apelido: 'Rafa', nascimento: '1993-10-09', cpf: cpfSeed('323244790'), rg: '5.928.494',
    especialidade: 'JavaScript, React, Node e mobile', bio: 'Desenvolvedor full stack JavaScript; React, React Native, Node e TypeScript nas turmas abertas.',
    endereco: { cep: '89031-419', logradouro: 'Rua Progresso', numero: '3300', complemento: '', bairro: 'Itoupava Central', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'rafa.moser@exemplo.com.br', whatsapp: '47988411133', emergencia: { nome: 'Douglas Moser', telefone: '47988412133' } },
    empresa: empresa(cnpjSeed('036249710001'), 'Rafael Moser Treinamentos ME', { conta: '95627-5', pix: 'rafa.moser@exemplo.com.br' }),
    valoresHora: VH_I19,
    contratos: [contratoInstrutorSeed({ id: 'ci19-1', codigo: 'CI-2026-119', tipo: 'cursos', turmas: _turmasDo('i19', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I19, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-19a1346' })],
    antecedentes: [antecedente(2026, '2026-02-27')],
    lgpd: lgpdOk('2025-05-10'),
    historico: [evento('2019-03-17', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i20', nome: 'Bianca Sartori Lemke', apelido: 'Bia', nascimento: '1996-07-19', cpf: cpfSeed('917435747'), rg: '8.624.885',
    especialidade: 'Social media, conteúdo e tráfego pago', bio: 'Social media e produtora de conteúdo; tráfego pago e Analytics nas turmas abertas de marketing.',
    endereco: { cep: '89021-665', logradouro: 'Rua Itajaí', numero: '1420', complemento: '', bairro: 'Vorstadt', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'bia.lemke@exemplo.com.br', whatsapp: '47988411140', emergencia: { nome: 'Fabiano Lemke', telefone: '47988412140' } },
    empresa: empresa(cnpjSeed('077153780001'), 'Bianca Lemke Treinamentos ME', { conta: '92198-4', pix: 'bia.lemke@exemplo.com.br' }),
    valoresHora: VH_I20,
    contratos: [contratoInstrutorSeed({ id: 'ci20-1', codigo: 'CI-2026-120', tipo: 'cursos', turmas: _turmasDo('i20', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I20, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-20a4107' }), contratoInstrutorSeed({ id: 'ci20-2', codigo: 'CI-2026-160', tipo: 'formacao', formacaoId: 'md1a', turmas: _turmasDo('i20', (t) => t.formacaoId === 'md1a'), valoresHora: VH_I20, status: 'assinado', criadoEm: '2026-05-18', geradoEm: '2026-05-19', enviadoEm: '2026-05-19', instrutorAssinouEm: '2026-05-20', escolaAssinouEm: '2026-05-21', envelopeId: 'cs-20f9033' }), contratoInstrutorSeed({ id: 'ci20-3', codigo: 'CI-2026-161', tipo: 'formacao', formacaoId: 'md1b', turmas: _turmasDo('i20', (t) => t.formacaoId === 'md1b'), valoresHora: VH_I20, status: 'assinatura', criadoEm: '2026-09-22', geradoEm: '2026-09-23', enviadoEm: '2026-09-23', envelopeId: 'cs-20f6027' })],
    antecedentes: [antecedente(2026, '2026-02-17')],
    lgpd: lgpdOk('2025-02-22'),
    historico: [evento('2021-02-10', 'Cadastro criado')],
  }),
  instrutorSeed({
    id: 'i18', nome: 'Vanessa Ramos Bertoldi', apelido: 'Vanessa', nascimento: '1987-02-17', cpf: cpfSeed('014078558'), rg: '7.801.880',
    especialidade: 'UX/UI e suporte técnico', bio: 'Product designer; UX/UI na prática e formação de profissionais de suporte.',
    endereco: { cep: '89072-679', logradouro: 'Rua Sete de Setembro', numero: '1090', complemento: '', bairro: 'Centro', cidade: 'Blumenau', uf: 'SC' },
    contato: { email: 'vanessa.bertoldi@exemplo.com.br', whatsapp: '47988411126', emergencia: { nome: 'Débora Bertoldi', telefone: '47988412126' } },
    empresa: empresa(cnpjSeed('176521210001'), 'Vanessa Bertoldi Treinamentos ME', { conta: '89534-1', pix: 'vanessa.bertoldi@exemplo.com.br' }),
    valoresHora: VH_I18,
    contratos: [contratoInstrutorSeed({ id: 'ci18-1', codigo: 'CI-2026-118', tipo: 'cursos', turmas: _turmasDo('i18', (t) => t.tipo !== 'formacao' && t.fim >= '2026-07-01'), valoresHora: VH_I18, status: 'assinado', criadoEm: '2026-06-22', geradoEm: '2026-06-23', enviadoEm: '2026-06-23', instrutorAssinouEm: '2026-06-24', escolaAssinouEm: '2026-06-25', envelopeId: 'cs-18a1059' }), contratoInstrutorSeed({ id: 'ci18-2', codigo: 'CI-2026-156', tipo: 'formacao', formacaoId: 'fpsa', turmas: _turmasDo('i18', (t) => t.formacaoId === 'fpsa'), valoresHora: VH_I18, status: 'assinado', criadoEm: '2026-07-27', geradoEm: '2026-07-28', enviadoEm: '2026-07-28', instrutorAssinouEm: '2026-07-29', escolaAssinouEm: '2026-07-30', envelopeId: 'cs-18f8448' })],
    antecedentes: [antecedente(2026, '2026-02-14')],
    lgpd: lgpdOk('2025-07-10'),
    historico: [evento('2023-09-17', 'Cadastro criado')],
  }),
);
// <<< CATALOGO-PROWAY instrutores
