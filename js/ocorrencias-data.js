// ============================================================
// Dados das OCORRÊNCIAS DO ALUNO: catálogos (tipos, canais) e semente.
// A ocorrência é o registro da coordenação/pedagógico sobre o aluno (troca de
// módulo, restrição de horário, contato com responsável, contato por frequência…).
// Não aparece nos portais do aluno nem do professor. Motor em js/ocorrencias-motor.js.
//
// A semente é RELATIVA ao hoje do navegador: cada item traz `diasAtras` + `hora`
// e vira `em: 'AAAA-MM-DDTHH:mm'` na carga (gerarOcorrenciasSeed). Alunos, turmas
// e responsáveis são os da semente real (js/clientes-data.js, js/contratos-data.js).
// ============================================================

const TIPOS_OCORRENCIA = [
  { id: 'troca_modulo', nome: 'Troca de módulo/turma', descricao: 'Pedido de mudar de módulo, turma ou horário dentro da formação, e o motivo.', cor: 'violeta' },
  { id: 'restricao_horario', nome: 'Restrição de dias ou horários', descricao: 'Dias ou horários em que o aluno não pode ter aula (trabalho, escola, saúde).', cor: 'ambar' },
  { id: 'contato_responsavel', nome: 'Contato com responsável', descricao: 'Ligação, mensagem ou conversa com pai, mãe ou responsável.', cor: 'petrol' },
  { id: 'contato_frequencia', nome: 'Contato por frequência', descricao: 'Contato feito por faltas ou risco de reprovação por frequência.', cor: 'vermelha' },
  { id: 'contato_aluno', nome: 'Contato com o aluno', descricao: 'Conversa com o próprio aluno sobre qualquer assunto.', cor: 'verde' },
  { id: 'pedido_cancelamento', nome: 'Pedido de cancelamento', descricao: 'O aluno ou responsável pediu para cancelar ou pausar a matrícula.', cor: 'rosa' },
  { id: 'outro', nome: 'Outro', descricao: 'Qualquer outro acontecimento que precise ficar registrado.', cor: 'neutra' },
];

const CANAIS_OCORRENCIA = [
  { id: 'whatsapp', nome: 'WhatsApp' },
  { id: 'telefone', nome: 'Telefone' },
  { id: 'email', nome: 'E-mail' },
  { id: 'presencial', nome: 'Presencial' },
  { id: 'outro', nome: 'Outro' },
];

// O protótipo admin não tem login: quem registra é a usuária padrão do cabeçalho.
const AUTOR_PADRAO_OCORRENCIA = { nome: 'Ana Souza' };

// Quem mais registra na semente (coordenação pedagógica e secretaria). [sup.]
const AUTORES_SEED_OCORRENCIA = {
  ana: { nome: 'Ana Souza' },
  isabela: { nome: 'Isabela Martins' },
  carla: { nome: 'Carla Ribeiro' },
};

// Itens: aluno × turma reais. `diasAtras` conta a partir do hoje do navegador.
const OCORRENCIAS_SEED_BASE = [
  // Turma SUP09-PYA (Python: API RESTful com Angular, 26/08 → 23/09) — vários alunos com frequência em atenção/risco.
  { id: 'oc1', alunoId: 'a2', turmaId: 'sup09-pya', tipo: 'contato_frequencia', canal: 'whatsapp', responsavelId: null, autor: 'isabela', diasAtras: 1, hora: '10:20',
    texto: 'Faltou nas duas últimas aulas de API. Mandei mensagem perguntando se está tudo bem; respondeu que estava doente e que vai repor com as gravações. Combinado: assistir até sexta e me avisar.' },
  { id: 'oc2', alunoId: 'a13', turmaId: 'sup09-pya', tipo: 'contato_responsavel', canal: 'telefone', responsavelId: 'r5', autor: 'isabela', diasAtras: 2, hora: '15:05',
    texto: 'Liguei para o pai (Cláudio) por causa das faltas. Ele não sabia que o Samuel estava faltando. Vai conversar em casa e pediu para avisarmos a cada nova falta.' },
  { id: 'oc3', alunoId: 'a10', turmaId: 'sup09-pya', tipo: 'pedido_cancelamento', canal: null, responsavelId: null, autor: 'ana', diasAtras: 6, hora: '18:40',
    texto: 'O pai (Jair) veio na recepção pedir para pausar a matrícula: o Lucas passou no vestibular e vai mudar de cidade em outubro. Expliquei o congelamento e a regra de rescisão do contrato. Vai decidir até o fim do mês.' },
  { id: 'oc4', alunoId: 'a12', turmaId: 'sup09-pya', tipo: 'contato_frequencia', canal: 'email', responsavelId: null, autor: 'carla', diasAtras: 3, hora: '09:12',
    texto: 'E-mail para o aluno e cópia para o RH da empresa: duas faltas seguidas em setembro, frequência em 67%. Sem resposta até agora.' },
  { id: 'oc5', alunoId: 'a1', turmaId: 'sup09-pya', tipo: 'restricao_horario', canal: null, responsavelId: null, autor: 'isabela', diasAtras: 12, hora: '11:30',
    texto: 'A mãe avisou que o Gustavo começou curso de inglês nas terças às 19h. Enquanto durar (até dezembro), ele só pode aula às quintas e sábados. Considerar na alocação do próximo módulo.' },
  { id: 'oc6', alunoId: 'a1', turmaId: 'sup09-pya', tipo: 'contato_responsavel', canal: 'whatsapp', responsavelId: 'r1', autor: 'isabela', diasAtras: 4, hora: '16:48',
    texto: 'Márcia (mãe) perguntou pelo desempenho no módulo de API. Passei o retorno do professor: participa bem, mas entrega os exercícios atrasados. Ela vai acompanhar em casa.' },
  { id: 'oc7', alunoId: 'a4', turmaId: 'sup09-pya', tipo: 'contato_aluno', canal: 'presencial', responsavelId: null, autor: 'ana', diasAtras: 8, hora: '19:05',
    texto: 'Enzo veio perguntar se pode trocar o notebook da sala por um dele. Liberado, desde que instale o ambiente antes da próxima aula (lista de softwares enviada).' },
  { id: 'oc8', alunoId: 'a3', turmaId: 'sup09-pya', tipo: 'contato_frequencia', canal: 'whatsapp', responsavelId: null, autor: 'isabela', diasAtras: 9, hora: '10:00',
    texto: 'Primeira falta sem justificativa. Mensagem de acompanhamento enviada; respondeu que confundiu a data. Lembrete do calendário reenviado.' },

  // Turma SUP08-JVO (Java: Orientado a Objetos, 15/08 → 10/10).
  { id: 'oc9', alunoId: 'a27', turmaId: 'sup08-jvo', tipo: 'pedido_cancelamento', canal: null, responsavelId: null, autor: 'ana', diasAtras: 20, hora: '14:15',
    texto: 'Cristiane (mãe) ligou pedindo para congelar: o Augusto vai fazer cirurgia no joelho e fica 6 semanas afastado. Matrícula congelada em JVO e nos Aulões; retoma na próxima edição do módulo.' },
  { id: 'oc10', alunoId: 'a32', turmaId: 'sup08-jvo', tipo: 'contato_frequencia', canal: 'telefone', responsavelId: null, autor: 'carla', diasAtras: 25, hora: '11:50',
    texto: 'Três faltas seguidas. Liguei duas vezes sem atender; deixei mensagem no WhatsApp. Retornou à noite: trocou de emprego e o horário novo bate com a aula. Encaminhei para a coordenação ver troca de turma.' },
  { id: 'oc11', alunoId: 'a32', turmaId: 'sup08-jvo', tipo: 'troca_modulo', canal: null, responsavelId: null, autor: 'isabela', diasAtras: 23, hora: '09:30',
    texto: 'Pediu para sair da turma de sábado de manhã e entrar na próxima edição noturna do JVO (previsão: novembro). Enquanto isso, matrícula congelada. Motivo: novo horário de trabalho.' },
  { id: 'oc12', alunoId: 'a30', turmaId: 'sup08-jvo', tipo: 'contato_aluno', canal: 'whatsapp', responsavelId: null, autor: 'isabela', diasAtras: 5, hora: '17:20',
    texto: 'José Luiz avisou que vai perder a aula do dia 12 por viagem de trabalho. Orientado a ver a gravação e entregar o exercício pelo portal.' },
  { id: 'oc13', alunoId: 'a36', turmaId: 'sup08-jvo', tipo: 'contato_frequencia', canal: 'whatsapp', responsavelId: null, autor: 'carla', diasAtras: 7, hora: '10:45',
    texto: 'Frequência em 75% no JVO. Mandei o aviso padrão de frequência mínima; respondeu que vai regularizar.' },
  { id: 'oc14', alunoId: 'a39', turmaId: 'sup08-jvo', tipo: 'restricao_horario', canal: null, responsavelId: null, autor: 'ana', diasAtras: 33, hora: '13:10',
    texto: 'Yann faz estágio até 18h30 e chega atrasado ~20 min nas aulas de sábado que começam cedo. Pediu para não contar como falta o atraso avisado. Professor ciente.' },

  // Turma SUP10-CSS (CSS3) e SUP10 em geral.
  { id: 'oc15', alunoId: 'a43', turmaId: 'sup10-css', tipo: 'contato_frequencia', canal: 'telefone', responsavelId: null, autor: 'carla', diasAtras: 2, hora: '14:30',
    texto: 'Diego com 67% no CSS3. Ligação atendida: está fazendo horas extras. Vai tentar compensar com as gravações; combinado de rever em duas semanas.' },
  { id: 'oc16', alunoId: 'a40', turmaId: 'sup10-css', tipo: 'contato_responsavel', canal: 'presencial', responsavelId: 'r8', autor: 'isabela', diasAtras: 15, hora: '18:55',
    texto: 'Rosane (mãe) veio buscar o Alexandre e perguntou sobre o certificado do módulo anterior. Expliquei que sai depois da conclusão da formação, com os parciais disponíveis no portal.' },
  { id: 'oc17', alunoId: 'a42', turmaId: 'ta168', tipo: 'troca_modulo', canal: null, responsavelId: null, autor: 'ana', diasAtras: 18, hora: '10:10',
    texto: 'Bianca faz CSS3 (SUP10) e Análise de Dados ao mesmo tempo e pediu para adiantar o módulo de JavaScript. Sem vaga na edição atual; fica na lista para a próxima.' },

  // Design gráfico (DG3B) e Excel (XDPA).
  { id: 'oc18', alunoId: 'a67', turmaId: 'dg3b-psb', tipo: 'pedido_cancelamento', canal: null, responsavelId: null, autor: 'ana', diasAtras: 11, hora: '20:15',
    texto: 'Giovana (mãe) pediu para pausar a matrícula do Caio até o fim das provas do colégio. Congelado no Photoshop Básico; retoma na primeira semana de outubro.' },
  { id: 'oc19', alunoId: 'a66', turmaId: 'dg3b-psb', tipo: 'contato_responsavel', canal: 'telefone', responsavelId: 'r11', autor: 'isabela', diasAtras: 27, hora: '09:40',
    texto: 'Patrícia (mãe) ligou perguntando se a Raquel pode trazer o próprio tablet para as aulas de Illustrator. Liberado; professor avisado.' },
  { id: 'oc20', alunoId: 'a71', turmaId: 'dg3b-psb', tipo: 'contato_aluno', canal: 'presencial', responsavelId: null, autor: 'isabela', diasAtras: 40, hora: '15:00',
    texto: 'Franciele relatou dificuldade de acompanhar o ritmo do Photoshop. Combinada monitoria de 30 min antes da aula nas duas próximas semanas.' },
  { id: 'oc21', alunoId: 'a95', turmaId: 'xdpa-ex1', tipo: 'pedido_cancelamento', canal: null, responsavelId: null, autor: 'ana', diasAtras: 30, hora: '08:50',
    texto: 'Luana (mãe) pediu por e-mail para trancar o Excel Avançado: a Daniela vai fazer intercâmbio em outubro. Congelada até voltar; sem cobrança no período.' },

  // Outras turmas e assuntos.
  { id: 'oc22', alunoId: 'a14', turmaId: 'ta189', tipo: 'restricao_horario', canal: null, responsavelId: null, autor: 'ana', diasAtras: 45, hora: '16:30',
    texto: 'Vitor Hugo joga no juvenil aos sábados de manhã: não pode turma de sábado até o fim do campeonato (dezembro). Mantido na turma noturna de React.' },
  { id: 'oc23', alunoId: 'a18', turmaId: 'ta56', tipo: 'outro', canal: null, responsavelId: null, autor: 'carla', diasAtras: 52, hora: '11:20',
    texto: 'João Vitor esqueceu o notebook na sala 3; guardado na secretaria. Retirou no dia seguinte.' },
  { id: 'oc24', alunoId: 'a25', turmaId: 'sup08-jvo', tipo: 'contato_aluno', canal: 'email', responsavelId: null, autor: 'isabela', diasAtras: 60, hora: '09:00',
    texto: 'Ademir pediu a ementa completa do JVO para o RH da empresa reembolsar o curso. Enviada por e-mail.' },
  { id: 'oc25', alunoId: 'a2', turmaId: null, tipo: 'contato_responsavel', canal: 'whatsapp', responsavelId: 'r2', autor: 'isabela', diasAtras: 70, hora: '14:25',
    texto: 'Simone (mãe) confirmou a troca de telefone de contato e pediu para avisar por WhatsApp em vez de ligar. Atualizado no cadastro.' },
  { id: 'oc26', alunoId: 'a28', turmaId: 'sup08-jvo', tipo: 'contato_responsavel', canal: 'telefone', responsavelId: 'r7', autor: 'ana', diasAtras: 80, hora: '10:35',
    texto: 'Cláudio (pai) ligou para saber se o Guilherme pode fazer o módulo de Spring na próxima edição em vez de agora. Orientado que a sequência da formação permite; anotado para a alocação.' },
  { id: 'oc27', alunoId: 'a8', turmaId: 'sup09-pya', tipo: 'outro', canal: null, responsavelId: null, autor: 'carla', diasAtras: 14, hora: '12:05',
    texto: 'Empresa pediu declaração de matrícula do Guilherme para o plano de desenvolvimento interno. Emitida pela tela do aluno e enviada ao RH.' },
];

// Hoje do navegador em 'AAAA-MM-DD' (o motor expõe Ocorrencias.hoje(); aqui é só para gerar a semente).
function hojeOcorrenciasSeed() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function gerarOcorrenciasSeed(hoje = hojeOcorrenciasSeed()) {
  const [a, m, d] = hoje.split('-').map(Number);
  return OCORRENCIAS_SEED_BASE.map(({ diasAtras, hora, autor, ...o }) => {
    const dt = new Date(a, m - 1, d - diasAtras);
    const data = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    return { ...o, autor: { ...(AUTORES_SEED_OCORRENCIA[autor] ?? AUTOR_PADRAO_OCORRENCIA) }, em: `${data}T${hora}`, editadoEm: null };
  });
}

const OCORRENCIAS_SEED = gerarOcorrenciasSeed();
