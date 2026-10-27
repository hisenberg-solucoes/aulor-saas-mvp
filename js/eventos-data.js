// ============================================================
// Eventos (aulões, visitas técnicas, palestras, workshops, viagens…)
// Base compartilhada: o Portal do Aluno lê daqui (portal-aluno/calendario.html);
// um cadastro administrativo pode nascer depois sobre a mesma chave.
// ============================================================

// Tipos de evento com a cor usada nos chips do calendário (clara + dark).
const TIPOS_EVENTO = [
  { id: 'aulao', nome: 'Aulão', chip: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200', ponto: 'bg-violet-500' },
  { id: 'visita_tecnica', nome: 'Visita técnica', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200', ponto: 'bg-emerald-500' },
  { id: 'palestra', nome: 'Palestra', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200', ponto: 'bg-amber-500' },
  { id: 'workshop', nome: 'Workshop', chip: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200', ponto: 'bg-fuchsia-500' },
  { id: 'viagem', nome: 'Viagem', chip: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200', ponto: 'bg-rose-500' },
  { id: 'confraternizacao', nome: 'Confraternização', chip: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200', ponto: 'bg-pink-500' },
  { id: 'certificacao', nome: 'Prova / certificação', chip: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200', ponto: 'bg-teal-500' },
];

const STATUS_EVENTO = [
  { id: 'confirmado', nome: 'Confirmado' },
  { id: 'previsto', nome: 'A confirmar' },
  { id: 'cancelado', nome: 'Cancelado' },
];

// Público: todos os alunos com matrícula ativa | formações (por id) | turmas (por id).
// Restrição de idade: null | 'adolescentes' (< 18 anos na data do evento) | 'adultos' (≥ 18).
// Inscrição: quando necessária, o aluno se inscreve no portal (vagas e prazo opcionais).
const LOCAL_PROWAY = { nome: 'ProWay · Blumenau', endereco: 'Rua 7 de Setembro, 1234 · Centro, Blumenau/SC' };

const eventoSeed = (e) => ({
  id: '', tipo: 'aulao', titulo: '', descricao: '',
  data: '', inicio: null, fim: null, // inicio/fim nulos = dia inteiro
  local: { nome: '', endereco: '' },
  publico: { tipo: 'todos', ids: [] },
  restricao: null,
  inscricao: { necessaria: false, vagas: null, prazo: null },
  custo: 0,
  obrigatorio: false,
  status: 'confirmado',
  ...e,
});

const EVENTOS_SEED = [
  eventoSeed({ id: 'ev1', tipo: 'aulao', titulo: 'Aulão: Git na prática — fluxo de trabalho em equipe', data: '2026-07-18', inicio: '09:00', fim: '12:00',
    descricao: 'Branches, pull requests, revisão de código e resolução de conflitos com um repositório real. Traga o notebook com o Git instalado.',
    local: LOCAL_PROWAY, publico: { tipo: 'todos', ids: [] } }),
  eventoSeed({ id: 'ev2', tipo: 'workshop', titulo: 'Workshop: Entrevista técnica — como se preparar', data: '2026-07-25', inicio: '09:00', fim: '11:30',
    descricao: 'Simulação de entrevistas técnicas com recrutadores parceiros. Dinâmica voltada a quem já está buscando a primeira vaga.',
    local: LOCAL_PROWAY, publico: { tipo: 'todos', ids: [] }, restricao: 'adultos', inscricao: { necessaria: true, vagas: 20, prazo: '2026-07-22' } }),
  eventoSeed({ id: 'ev3', tipo: 'visita_tecnica', titulo: 'Visita técnica à WEG', data: '2026-08-14', inicio: '14:00', fim: '17:00',
    descricao: 'Conhecer o time de engenharia de software da WEG: arquitetura dos sistemas industriais, esteira de deploy e bate-papo com desenvolvedores. Saída em ônibus da ProWay às 13h15.',
    local: { nome: 'WEG — Parque Fabril', endereco: 'Av. Prefeito Waldemar Grubba, 3300 · Jaraguá do Sul/SC' },
    publico: { tipo: 'formacoes', ids: ['sup09'] }, obrigatorio: true, inscricao: { necessaria: true, vagas: 30, prazo: '2026-08-07' } }),
  eventoSeed({ id: 'ev4', tipo: 'palestra', titulo: 'Palestra: Como montar seu portfólio no GitHub', data: '2026-08-28', inicio: '19:30', fim: '21:00',
    descricao: 'O que recrutadores olham num perfil de dev iniciante: README, projetos, commits e organização. Com convidado da área de tech recruiting.',
    local: { nome: 'ProWay · Auditório', endereco: LOCAL_PROWAY.endereco }, publico: { tipo: 'todos', ids: [] } }),
  eventoSeed({ id: 'ev5', tipo: 'aulao', titulo: 'Aulão de revisão: Python OO e MySQL', data: '2026-08-29', inicio: '09:00', fim: '13:00',
    descricao: 'Revisão dos módulos de orientação a objetos e banco de dados antes de entrar na API RESTful. Exercícios em dupla.',
    local: LOCAL_PROWAY, publico: { tipo: 'formacoes', ids: ['sup09'] }, obrigatorio: true }),
  eventoSeed({ id: 'ev6', tipo: 'workshop', titulo: 'Workshop: Docker para desenvolvedores', data: '2026-09-12', inicio: '09:00', fim: '12:00',
    descricao: 'Containers do zero: imagens, volumes, docker compose e como subir a API do curso num container.',
    local: LOCAL_PROWAY, publico: { tipo: 'todos', ids: [] }, inscricao: { necessaria: true, vagas: 25, prazo: '2026-09-10' } }),
  eventoSeed({ id: 'ev7', tipo: 'palestra', titulo: 'Palestra: Cloud na prática (AWS)', data: '2026-09-16', inicio: '19:00', fim: '20:30',
    descricao: 'Cancelada a pedido do palestrante; nova data será divulgada.',
    local: { nome: 'ProWay · Auditório', endereco: LOCAL_PROWAY.endereco }, publico: { tipo: 'todos', ids: [] }, status: 'cancelado' }),
  eventoSeed({ id: 'ev8', tipo: 'visita_tecnica', titulo: 'Visita técnica à Senior Sistemas', data: '2026-10-02', inicio: '14:00', fim: '17:00',
    descricao: 'Tour pelo campus da Senior e conversa com o time de plataforma Java. Saída em ônibus da ProWay às 13h30.',
    local: { nome: 'Senior Sistemas', endereco: 'Rua São Paulo, 825 · Victor Konder, Blumenau/SC' },
    publico: { tipo: 'formacoes', ids: ['sup08'] }, obrigatorio: true, inscricao: { necessaria: true, vagas: 30, prazo: '2026-09-25' } }),
  eventoSeed({ id: 'ev9', tipo: 'viagem', titulo: 'Viagem: Beto Carrero World', data: '2026-10-17', inicio: '07:00', fim: '20:00',
    descricao: 'Dia no parque com as turmas de adolescentes do Super DEV. Ônibus fretado saindo da ProWay às 7h, retorno previsto para 20h. Necessária autorização assinada pelo responsável legal (entregue na secretaria até o prazo).',
    local: { nome: 'Beto Carrero World', endereco: 'Rodovia BR-101, km 100 · Penha/SC' },
    publico: { tipo: 'formacoes', ids: ['sup08', 'sup09', 'sup10'] }, restricao: 'adolescentes',
    inscricao: { necessaria: true, vagas: 40, prazo: '2026-09-30' }, custo: 289.9 }),
  eventoSeed({ id: 'ev10', tipo: 'aulao', titulo: 'Aulão: Lógica com JavaScript — desafios', data: '2026-10-24', inicio: '09:00', fim: '12:00',
    descricao: 'Maratona de exercícios de lógica e JavaScript para fixar o conteúdo do módulo PJS.',
    local: LOCAL_PROWAY, publico: { tipo: 'turmas', ids: ['sup10-pjs'] }, obrigatorio: true }),
  eventoSeed({ id: 'ev11', tipo: 'palestra', titulo: 'Palestra: Segurança de aplicações web (OWASP Top 10)', data: '2026-10-28', inicio: '19:00', fim: '20:30',
    descricao: 'As dez falhas mais comuns em aplicações web e como evitá-las no código do dia a dia.',
    local: { nome: 'ProWay · Auditório', endereco: LOCAL_PROWAY.endereco }, publico: { tipo: 'todos', ids: [] }, status: 'previsto' }),
  eventoSeed({ id: 'ev12', tipo: 'certificacao', titulo: 'Simulado: certificação Python PCEP', data: '2026-11-21', inicio: '09:00', fim: '11:00',
    descricao: 'Simulado nos moldes da prova PCEP (Python Institute), com correção comentada em seguida.',
    local: LOCAL_PROWAY, publico: { tipo: 'formacoes', ids: ['sup07', 'sup09'] }, inscricao: { necessaria: true, vagas: 30, prazo: '2026-11-18' }, status: 'previsto' }),
  eventoSeed({ id: 'ev13', tipo: 'aulao', titulo: 'Aulão: Spring Boot na prática', data: '2026-12-05', inicio: '09:00', fim: '13:00',
    descricao: 'Construção de uma API completa com Spring Boot, do projeto ao deploy, para a turma de API RESTful.',
    local: LOCAL_PROWAY, publico: { tipo: 'turmas', ids: ['sup08-jvs'] }, obrigatorio: true }),
  eventoSeed({ id: 'ev14', tipo: 'confraternizacao', titulo: 'Confraternização de fim de ano', data: '2026-12-12', inicio: '19:00', fim: '23:00',
    descricao: 'Jantar de encerramento do ano com alunos, instrutores e equipe. Valor cobre o jantar e o local; bebidas à parte.',
    local: { nome: 'Salão Vila Germânica — Setor 2', endereco: 'Rua Alberto Stein, 199 · Velha, Blumenau/SC' },
    publico: { tipo: 'todos', ids: [] }, inscricao: { necessaria: true, vagas: 150, prazo: '2026-12-05' }, custo: 60 }),
];
