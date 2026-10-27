// ============================================================
// Dados da tela "Salas" (espaços físicos e virtuais onde as aulas acontecem).
// Uma SALA tem identificação/localização, capacidade, recursos, máquinas
// (quando é laboratório) e status. A ALOCAÇÃO de salas em turmas/aulas
// fica para depois — esta tela é só o cadastro (as turmas em
// js/cursos-data.js apontam `salaId` para cá, só leitura).
//
// As salas da ProWay Blumenau têm nome de cor: Red, Green, Blue (Fundos),
// Gold, Silver, Black, White, Yellow, Orange, Gray, Pink, Cyan e Magenta.
// ============================================================

const UNIDADES = [
  { id: 'blumenau', nome: 'Blumenau · Matriz', endereco: 'Rua XV de Novembro, 1200 — Centro' },
  { id: 'virtual', nome: 'Virtual', endereco: 'Salas online (Teams / Zoom)' },
];

const TIPOS_SALA = [
  { id: 'laboratorio', nome: 'Laboratório de informática', descricao: 'Um micro por aluno.' },
  { id: 'sala', nome: 'Sala de aula', descricao: 'Sem micros — projetor e quadro.' },
  { id: 'auditorio', nome: 'Auditório', descricao: 'Palestras e eventos; sem mesas.' },
  { id: 'virtual', nome: 'Sala virtual', descricao: 'Link fixo de Teams/Zoom.' },
];

const STATUS_SALA = [
  { id: 'ativa', nome: 'Ativa', descricao: 'Disponível para receber turmas.' },
  { id: 'manutencao', nome: 'Em manutenção', descricao: 'Temporariamente indisponível.' },
  { id: 'inativa', nome: 'Inativa', descricao: 'Fora de uso; histórico preservado.' },
];

const LAYOUTS = [
  { id: 'fileiras', nome: 'Fileiras', descricao: 'Mesas voltadas para a frente.' },
  { id: 'u', nome: 'Em U', descricao: 'Mesas em U, facilita discussão.' },
  { id: 'ilhas', nome: 'Ilhas', descricao: 'Grupos de 4 a 6.' },
  { id: 'auditorio', nome: 'Auditório', descricao: 'Só cadeiras, sem mesas.' },
];

const RECURSOS = [
  { id: 'projetor', nome: 'Projetor' },
  { id: 'tv', nome: 'TV / monitor grande' },
  { id: 'quadro', nome: 'Quadro branco' },
  { id: 'lousa-digital', nome: 'Lousa digital' },
  { id: 'som', nome: 'Caixa de som' },
  { id: 'microfone', nome: 'Microfone' },
  { id: 'ar', nome: 'Ar-condicionado' },
  { id: 'wifi', nome: 'Wi-Fi' },
  { id: 'cabeada', nome: 'Rede cabeada' },
  { id: 'camera', nome: 'Câmera para aula híbrida' },
  { id: 'tomadas', nome: 'Tomadas nas mesas' },
  { id: 'acessivel', nome: 'Acessível (cadeirante)' },
];

const SISTEMAS = [
  { id: 'windows', nome: 'Windows 11' },
  { id: 'windows10', nome: 'Windows 10' },
  { id: 'linux', nome: 'Linux (Ubuntu)' },
  { id: 'macos', nome: 'macOS' },
  { id: 'dual', nome: 'Dual boot Windows/Linux' },
];

const SW_DEV = ['VS Code', 'Google Chrome', 'Git', 'Node.js', 'Python 3.12', 'JDK 21', 'IntelliJ IDEA', '.NET SDK 8', 'DBeaver', 'PostgreSQL', 'MySQL Workbench', 'Insomnia'];
const SW_BASICO = ['VS Code', 'Google Chrome', 'Git', 'Node.js'];

// Fábrica: laboratório padrão da ProWay (o que não for informado usa o padrão).
function salaSeed(d) {
  return {
    tipo: 'laboratorio', unidadeId: 'blumenau', status: 'ativa',
    localizacao: { andar: '', referencia: '' },
    capacidade: { alunos: 16, layout: 'fileiras', area: null },
    recursos: ['projetor', 'quadro', 'ar', 'wifi', 'cabeada', 'tomadas'],
    maquinas: null,
    virtual: { plataforma: '', link: '' },
    manutencao: null, // { motivo, previsao (aaaa-mm-dd ou null) } só em manutenção
    observacoes: '',
    ...d,
  };
}
const maquinas = (quantidade, extra = {}) => ({ quantidade, processador: 'Intel Core i5 12ª ger.', memoria: 16, armazenamento: '512 GB SSD', sistema: 'windows', monitores: 1, softwares: SW_DEV, ...extra });

const SALAS_SEED = [
  salaSeed({
    id: 's1', codigo: 'RED', nome: 'Red',
    localizacao: { andar: '1º andar', referencia: 'Primeira porta à direita da recepção' },
    capacidade: { alunos: 18, layout: 'fileiras', area: 44 },
    recursos: ['projetor', 'quadro', 'ar', 'wifi', 'cabeada', 'tomadas', 'camera'],
    maquinas: maquinas(18, { processador: 'Intel Core i7 13ª ger.', memoria: 32, armazenamento: '1 TB SSD', monitores: 2 }),
    observacoes: 'Sala principal das formações noturnas (Super DEV 9). Câmera para aula híbrida.',
  }),
  salaSeed({
    id: 's2', codigo: 'GREEN', nome: 'Green',
    localizacao: { andar: '1º andar', referencia: 'Ao lado da Red' },
    capacidade: { alunos: 14, layout: 'fileiras', area: 36 },
    maquinas: maquinas(14),
    observacoes: 'Turmas abertas de terça e quinta.',
  }),
  salaSeed({
    id: 's3', codigo: 'BLUE', nome: 'Blue (Fundos)',
    localizacao: { andar: '1º andar', referencia: 'Fundos do prédio, acesso pelo corredor lateral' },
    capacidade: { alunos: 12, layout: 'u', area: 34 },
    maquinas: maquinas(12, { memoria: 16 }),
    observacoes: 'Mais silenciosa — usada pelo Super DEV 7 (encerrado em 08/2026) e para bancas de TCC.',
  }),
  salaSeed({
    id: 's4', codigo: 'GOLD', nome: 'Gold',
    localizacao: { andar: '2º andar', referencia: 'À direita da escada' },
    capacidade: { alunos: 20, layout: 'fileiras', area: 52 },
    recursos: ['projetor', 'tv', 'quadro', 'ar', 'wifi', 'cabeada', 'tomadas', 'acessivel'],
    maquinas: maquinas(20, { processador: 'Intel Core i7 13ª ger.', memoria: 32, armazenamento: '1 TB SSD', monitores: 2 }),
    observacoes: 'Maior laboratório. Super DEV 8 aos sábados (integral).',
  }),
  salaSeed({
    id: 's5', codigo: 'SILVER', nome: 'Silver',
    localizacao: { andar: '2º andar', referencia: 'Em frente à Gold' },
    capacidade: { alunos: 16, layout: 'fileiras', area: 40 },
    maquinas: maquinas(16, { sistema: 'dual' }),
    observacoes: 'Dual boot — preferida para banco de dados e Linux.',
  }),
  salaSeed({
    id: 's6', codigo: 'BLACK', nome: 'Black',
    localizacao: { andar: '2º andar', referencia: 'Fim do corredor' },
    capacidade: { alunos: 16, layout: 'ilhas', area: 40 },
    recursos: ['projetor', 'quadro', 'ar', 'wifi', 'cabeada', 'tomadas', 'som'],
    maquinas: maquinas(16, { processador: 'AMD Ryzen 7', memoria: 32, armazenamento: '1 TB SSD', monitores: 2 }),
    observacoes: 'Placa de vídeo dedicada — usar para IA/ML e edição.',
  }),
  salaSeed({
    id: 's7', codigo: 'WHITE', nome: 'White', tipo: 'sala',
    localizacao: { andar: '1º andar', referencia: 'Ao lado da copa' },
    capacidade: { alunos: 24, layout: 'fileiras', area: 42 },
    recursos: ['projetor', 'quadro', 'ar', 'wifi', 'acessivel'],
    observacoes: 'Sem micros — carreira (Perfil 360), aulões e reuniões com empresas.',
  }),
  salaSeed({
    id: 's8', codigo: 'YELLOW', nome: 'Yellow',
    localizacao: { andar: '3º andar', referencia: '' },
    capacidade: { alunos: 12, layout: 'fileiras', area: 30 },
    maquinas: maquinas(12, { processador: 'Intel Core i5 10ª ger.', memoria: 8, armazenamento: '256 GB SSD', sistema: 'windows10', softwares: SW_BASICO }),
    observacoes: 'Máquinas mais antigas — só front-end e lógica.',
  }),
  salaSeed({
    id: 's9', codigo: 'ORANGE', nome: 'Orange',
    localizacao: { andar: '3º andar', referencia: 'Ao lado da Yellow' },
    capacidade: { alunos: 12, layout: 'u', area: 30 },
    maquinas: maquinas(12),
    observacoes: '',
  }),
  salaSeed({
    id: 's10', codigo: 'GRAY', nome: 'Gray', status: 'manutencao',
    localizacao: { andar: '3º andar', referencia: 'Fim do corredor' },
    capacidade: { alunos: 14, layout: 'fileiras', area: 34 },
    maquinas: maquinas(14),
    manutencao: { motivo: 'Troca do ar-condicionado', previsao: '2026-09-05' },
  }),
  salaSeed({
    id: 's11', codigo: 'PINK', nome: 'Pink', tipo: 'sala',
    localizacao: { andar: '2º andar', referencia: 'Ao lado da Silver' },
    capacidade: { alunos: 10, layout: 'u', area: 22 },
    recursos: ['tv', 'quadro', 'ar', 'wifi'],
    observacoes: 'Sala pequena — mentorias de TCC, entrevistas simuladas e turmas in company reduzidas.',
  }),
  salaSeed({
    id: 's12', codigo: 'CYAN', nome: 'Cyan', tipo: 'auditorio',
    localizacao: { andar: 'Térreo', referencia: 'Entrada lateral' },
    capacidade: { alunos: 60, layout: 'auditorio', area: 90 },
    recursos: ['projetor', 'som', 'microfone', 'ar', 'wifi', 'camera', 'acessivel'],
    observacoes: 'Bate-papo com DEVs, apresentações de TCC e eventos. Reservar com a recepção.',
  }),
  salaSeed({
    id: 's13', codigo: 'MAGENTA', nome: 'Magenta', tipo: 'virtual', unidadeId: 'virtual',
    capacidade: { alunos: 50, layout: null, area: null },
    recursos: [],
    virtual: { plataforma: 'Microsoft Teams', link: 'https://teams.microsoft.com/l/meetup-join/proway-magenta' },
    observacoes: 'Sala online fixa — turmas in company remotas e aulas híbridas. Gravação automática ligada.',
  }),
  // Salas virtuais extras (07/09/2026): com o catálogo completo há várias turmas online no mesmo horário.
  salaSeed({
    id: 's14', codigo: 'VIOLET', nome: 'Violet', tipo: 'virtual', unidadeId: 'virtual',
    capacidade: { alunos: 50, layout: null, area: null },
    recursos: [],
    virtual: { plataforma: 'Google Meet', link: 'https://meet.google.com/proway-violet' },
    observacoes: 'Segunda sala online fixa — turmas abertas online (design, marketing, dados).',
  }),
  salaSeed({
    id: 's15', codigo: 'INDIGO', nome: 'Indigo', tipo: 'virtual', unidadeId: 'virtual',
    capacidade: { alunos: 50, layout: null, area: null },
    recursos: [],
    virtual: { plataforma: 'Google Meet', link: 'https://meet.google.com/proway-indigo' },
    observacoes: 'Terceira sala online fixa — in company remoto.',
  }),
];
