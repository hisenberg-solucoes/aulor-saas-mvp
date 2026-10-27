// ============================================================
// Dados da tela "Feriados": calendário de feriados e recessos da escola.
// O motor de aulas (js/aulas-motor.js) consulta Feriados.nome(iso) para
// avisar aulas caídas em feriado e pular o dia ao repor/encaixar.
// Semente = feriados nacionais 2026/2027 (os mesmos que estavam fixos no
// motor de aulas) + Blumenau (sede da ProWay) + recesso de fim de ano.
// ============================================================

// Sem cor por tipo: para o agendamento todo tipo quer dizer "não tem aula"; o tipo aparece em texto.
const TIPOS_FERIADO = [
  { id: 'nacional', nome: 'Nacional', descricao: 'Feriado em todo o país.' },
  { id: 'estadual', nome: 'Estadual', descricao: 'Feriado do estado (SC).' },
  { id: 'municipal', nome: 'Municipal', descricao: 'Feriado da cidade (Blumenau).' },
  { id: 'facultativo', nome: 'Ponto facultativo', descricao: 'Não é feriado por lei; a escola decide não ter aula.' },
  { id: 'recesso', nome: 'Recesso da escola', descricao: 'Período sem aulas definido pela ProWay (fim de ano, férias…).' },
];

// Modelo: { id, nome, tipo, data 'YYYY-MM-DD', dataFim 'YYYY-MM-DD'|null (período),
//           recorrente (repete todo ano no mesmo dia/mês), observacao }
const FERIADOS_SEED = [
  // Fixos — repetem todo ano
  { id: 'fe1', nome: 'Confraternização Universal', tipo: 'nacional', data: '2026-01-01', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe2', nome: 'Tiradentes', tipo: 'nacional', data: '2026-04-21', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe3', nome: 'Dia do Trabalho', tipo: 'nacional', data: '2026-05-01', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe4', nome: 'Independência do Brasil', tipo: 'nacional', data: '2026-09-07', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe5', nome: 'Nossa Senhora Aparecida', tipo: 'nacional', data: '2026-10-12', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe6', nome: 'Finados', tipo: 'nacional', data: '2026-11-02', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe7', nome: 'Proclamação da República', tipo: 'nacional', data: '2026-11-15', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe8', nome: 'Dia da Consciência Negra', tipo: 'nacional', data: '2026-11-20', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe9', nome: 'Natal', tipo: 'nacional', data: '2026-12-25', dataFim: null, recorrente: true, observacao: '' },
  { id: 'fe10', nome: 'Aniversário de Blumenau', tipo: 'municipal', data: '2026-09-02', dataFim: null, recorrente: true, observacao: 'Fundação da cidade (1850).' },
  // Móveis — uma data por ano
  { id: 'fe11', nome: 'Carnaval', tipo: 'facultativo', data: '2026-02-16', dataFim: '2026-02-17', recorrente: false, observacao: 'Ponto facultativo; a escola não tem aula.' },
  { id: 'fe12', nome: 'Quarta-feira de Cinzas', tipo: 'facultativo', data: '2026-02-18', dataFim: null, recorrente: false, observacao: 'Expediente a partir das 14h — sem aulas de manhã.' },
  { id: 'fe13', nome: 'Sexta-feira Santa', tipo: 'nacional', data: '2026-04-03', dataFim: null, recorrente: false, observacao: '' },
  { id: 'fe14', nome: 'Corpus Christi', tipo: 'facultativo', data: '2026-06-04', dataFim: null, recorrente: false, observacao: '' },
  { id: 'fe15', nome: 'Recesso de fim de ano', tipo: 'recesso', data: '2026-12-24', dataFim: '2027-01-03', recorrente: false, observacao: 'Escola fechada; aulas retomam em 04/01/2027.' },
  { id: 'fe16', nome: 'Carnaval', tipo: 'facultativo', data: '2027-02-08', dataFim: '2027-02-09', recorrente: false, observacao: '' },
  { id: 'fe17', nome: 'Sexta-feira Santa', tipo: 'nacional', data: '2027-03-26', dataFim: null, recorrente: false, observacao: '' },
  { id: 'fe18', nome: 'Corpus Christi', tipo: 'facultativo', data: '2027-05-27', dataFim: null, recorrente: false, observacao: '' },
];
