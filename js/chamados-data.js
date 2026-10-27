// ============================================================
// Dados de referência e semente da tela "Chamados" (suporte).
// Quem abre: colaboradores (equipe interna), alunos e instrutores.
// Quem atende: colaboradores ativos (os do departamento Suporte primeiro).
// ============================================================

// "Agora" fixo do protótipo para prazos/atrasos ficarem estáveis.
const CHAMADOS_AGORA = '2026-08-28T09:00';

const TIPOS_CHAMADO = [
  { id: 'infra', nome: 'Infraestrutura', descricao: 'Máquinas, rede, projetor, salas, acessos físicos.' },
  { id: 'software', nome: 'Software', descricao: 'Sistema Aulor, portal do aluno, Google Workspace, licenças.' },
];

const CATEGORIAS_CHAMADO = [
  { id: 'rede', tipo: 'infra', nome: 'Rede / internet' },
  { id: 'computador', tipo: 'infra', nome: 'Computador / laboratório' },
  { id: 'projetor', tipo: 'infra', nome: 'Projetor / TV / som' },
  { id: 'impressora', tipo: 'infra', nome: 'Impressora' },
  { id: 'sala', tipo: 'infra', nome: 'Sala (ar, mobiliário, tomadas)' },
  { id: 'acesso-fisico', tipo: 'infra', nome: 'Acesso físico / tag / estacionamento' },
  { id: 'outro-infra', tipo: 'infra', nome: 'Outro (infra)' },
  { id: 'erro', tipo: 'software', nome: 'Erro no sistema' },
  { id: 'acesso', tipo: 'software', nome: 'Acesso / senha / permissão' },
  { id: 'duvida', tipo: 'software', nome: 'Dúvida de uso' },
  { id: 'melhoria', tipo: 'software', nome: 'Sugestão de melhoria' },
  { id: 'dados', tipo: 'software', nome: 'Dado incorreto / correção' },
  { id: 'instalacao', tipo: 'software', nome: 'Instalação de software', especial: 'instalacao' },
  { id: 'outro-software', tipo: 'software', nome: 'Outro (software)' },
];

// Prazo de solução (SLA) em horas corridas a partir da abertura.
const PRIORIDADES_CHAMADO = [
  { id: 'baixa', nome: 'Baixa', slaHoras: 120, descricao: 'Sem impacto no dia a dia; 5 dias.' },
  { id: 'media', nome: 'Média', slaHoras: 48, descricao: 'Atrapalha, mas tem contorno; 2 dias.' },
  { id: 'alta', nome: 'Alta', slaHoras: 8, descricao: 'Bloqueia uma pessoa ou aula; 8 horas.' },
  { id: 'critica', nome: 'Crítica', slaHoras: 2, descricao: 'Aula parada ou sistema fora; 2 horas.' },
];

const STATUS_CHAMADO = [
  { id: 'aberto', nome: 'Aberto', descricao: 'Ninguém assumiu ainda.' },
  { id: 'em_atendimento', nome: 'Em atendimento', descricao: 'Tem atendente trabalhando.' },
  { id: 'aguardando_solicitante', nome: 'Aguardando solicitante', descricao: 'Suporte respondeu e espera retorno.' },
  { id: 'resolvido', nome: 'Resolvido', descricao: 'Solução registrada; solicitante pode confirmar ou reabrir.' },
  { id: 'fechado', nome: 'Fechado', descricao: 'Encerrado de vez; ainda pode ser reaberto.' },
  { id: 'cancelado', nome: 'Cancelado', descricao: 'Sem efeito (duplicado, engano).' },
];

const TIPOS_SOLICITANTE = [
  { id: 'colaborador', nome: 'Colaborador', plural: 'Colaboradores', pagina: 'colaborador.html' },
  { id: 'aluno', nome: 'Aluno', plural: 'Alunos', pagina: 'aluno.html' },
  { id: 'instrutor', nome: 'Instrutor', plural: 'Instrutores', pagina: 'instrutor.html' },
];

// ---------- Instalação de software ----------

const FORMAS_INSTALACAO = [
  { id: 'instalador', nome: 'Instalador (exe/msi/pkg)', descricao: 'Baixar do site e rodar o instalador em cada máquina.' },
  { id: 'script', nome: 'Script / winget / choco', descricao: 'Comando no terminal; dá para aplicar em lote.' },
  { id: 'portable', nome: 'Portable / zip', descricao: 'Descompactar numa pasta; sem instalação.' },
  { id: 'loja', nome: 'Loja (Microsoft Store / extensão)', descricao: 'Instalado pela loja ou pelo gerenciador de extensões.' },
  { id: 'licenca', nome: 'Com licença / chave', descricao: 'Precisa de chave ou login da escola.' },
  { id: 'imagem', nome: 'Imagem do laboratório', descricao: 'Já vem na imagem padrão; só conferir a versão.' },
];

const STATUS_ITEM_INSTALACAO = [
  { id: 'pendente', nome: 'Pendente' },
  { id: 'instalado', nome: 'Instalado' },
  { id: 'problema', nome: 'Com problema' },
  { id: 'nao_instalado', nome: 'Não instalado' },
];

// ---------- Semente ----------

const _atendente = (id, nome) => ({ tipo: 'colaborador', id, nome, papel: 'atendente' });
const _sol = (tipo, id, nome) => ({ tipo, id, nome, papel: 'solicitante' });
const ANA = _atendente('c1', 'Ana Souza');
const GUSTAVO = _atendente('c5', 'Gustavo Prado');

let _seqCh = 0;
function chamadoSeed(d) {
  _seqCh += 1;
  const numero = `CH-${String(_seqCh).padStart(4, '0')}`;
  return {
    id: `ch${_seqCh}`, numero, tipo: 'infra', categoriaId: null, titulo: '', descricao: '', prioridade: 'media', status: 'aberto',
    solicitante: null, atendenteId: null, salaId: null, equipamento: '',
    abertoEm: CHAMADOS_AGORA, atualizadoEm: null, resolvidoEm: null, fechadoEm: null, canceladoEm: null,
    solucao: '', motivoCancelamento: '', reaberturas: 0, avaliacao: null,
    interacoes: [], historico: [],
    ...d,
    atualizadoEm: d.atualizadoEm ?? d.abertoEm ?? CHAMADOS_AGORA,
    historico: d.historico ?? [{ em: d.abertoEm ?? CHAMADOS_AGORA, autor: d.solicitante?.nome ?? '', texto: 'Chamado aberto.' }],
  };
}

const CHAMADOS_SEED = [
  chamadoSeed({
    tipo: 'infra', categoriaId: 'projetor', prioridade: 'critica', status: 'em_atendimento',
    titulo: 'Projetor da sala Red não liga',
    descricao: 'Aula de Angular começa às 19h e o projetor não responde ao controle nem ao botão do aparelho. Já testei trocar a tomada.',
    solicitante: _sol('instrutor', 'i1', 'André Fontoura Bastos'), atendenteId: 'c5', salaId: 's1', equipamento: 'Projetor Epson — sala Red',
    abertoEm: '2026-08-28T08:20', atualizadoEm: '2026-08-28T08:35',
    interacoes: [
      { id: 'x1', em: '2026-08-28T08:35', autor: GUSTAVO, texto: 'Estou subindo com o projetor reserva. Se não resolver, movemos a turma para a Green.', interna: false },
      { id: 'x2', em: '2026-08-28T08:36', autor: GUSTAVO, texto: 'Lâmpada com 3.900 h — provável fim de vida. Pedir orçamento.', interna: true },
    ],
    historico: [
      { em: '2026-08-28T08:20', autor: 'André Fontoura Bastos', texto: 'Chamado aberto.' },
      { em: '2026-08-28T08:31', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
    ],
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'acesso', prioridade: 'alta', status: 'aberto',
    titulo: 'Não consigo entrar no portal do aluno',
    descricao: 'Aparece "usuário ou senha inválidos" mesmo depois de redefinir a senha pelo e-mail. Preciso enviar o exercício de hoje.',
    solicitante: _sol('aluno', 'a1', 'Gustavo Fellipe Queiroz'),
    abertoEm: '2026-08-28T07:48',
  }),
  chamadoSeed({
    tipo: 'infra', categoriaId: 'rede', prioridade: 'alta', status: 'aguardando_solicitante',
    titulo: 'Wi-Fi cai toda hora no laboratório Green',
    descricao: 'Durante a aula de ontem à noite a rede caiu umas 5 vezes. Alunos não conseguiram baixar o SDK.',
    solicitante: _sol('instrutor', 'i5', 'Rogério Vidal Trindade'), atendenteId: 'c5', salaId: 's2',
    abertoEm: '2026-08-27T22:10', atualizadoEm: '2026-08-28T08:05',
    interacoes: [
      { id: 'x3', em: '2026-08-28T08:05', autor: GUSTAVO, texto: 'Troquei o access point da Green pelo reserva às 8h. Consegue testar na aula de hoje e me dizer se ficou estável?', interna: false },
    ],
    historico: [
      { em: '2026-08-27T22:10', autor: 'Rogério Vidal Trindade', texto: 'Chamado aberto.' },
      { em: '2026-08-28T07:50', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-28T08:05', autor: 'Gustavo Prado', texto: 'Respondeu ao solicitante.' },
    ],
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'erro', prioridade: 'media', status: 'em_atendimento',
    titulo: 'Erro ao gerar boleto de venda in company',
    descricao: 'Ao clicar em "Gerar cobrança" na venda C-2026-009 aparece "Erro inesperado" e nada é gerado. Acontece só nessa venda.',
    solicitante: _sol('colaborador', 'c3', 'Diego Rocha'), atendenteId: 'c1',
    abertoEm: '2026-08-27T15:30', atualizadoEm: '2026-08-27T16:40',
    interacoes: [
      { id: 'x4', em: '2026-08-27T16:40', autor: ANA, texto: 'Reproduzi. A venda está sem CNPJ do pagador — vou abrir correção com o fornecedor e te aviso.', interna: false },
      { id: 'x5', em: '2026-08-27T16:41', autor: ANA, texto: 'Ticket no fornecedor: #JRN-4471.', interna: true },
    ],
    historico: [
      { em: '2026-08-27T15:30', autor: 'Diego Rocha', texto: 'Chamado aberto.' },
      { em: '2026-08-27T15:45', autor: 'Ana Souza', texto: 'Assumiu o chamado.' },
      { em: '2026-08-27T16:40', autor: 'Ana Souza', texto: 'Respondeu ao solicitante.' },
      { em: '2026-08-27T17:02', autor: 'Diego Rocha', texto: 'Respondeu.' },
    ],
  }),
  chamadoSeed({
    tipo: 'infra', categoriaId: 'computador', prioridade: 'media', status: 'aberto',
    titulo: 'Máquina 07 da Blue sem som',
    descricao: 'O micro 07 não reproduz áudio nos fones nem na saída traseira. Aluno usa o vídeo das aulas gravadas.',
    solicitante: _sol('aluno', 'a3', 'Elias Felipe Zimmermann'), salaId: 's3', equipamento: 'Micro 07',
    abertoEm: '2026-08-26T19:40',
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'dados', prioridade: 'baixa', status: 'aberto',
    titulo: 'Meu nome está errado no certificado',
    descricao: 'O certificado da turma de Banco de Dados saiu como "Angeli Yasmin" e o correto é "Angeli Yasmim".',
    solicitante: _sol('aluno', 'a2', 'Angeli Yasmim Teixeira'),
    abertoEm: '2026-08-25T10:15',
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'instalacao', prioridade: 'media', status: 'resolvido',
    titulo: 'Instalar .NET SDK 8 nas máquinas da Green',
    instalacao: { maquinas: 'todas', quantidade: 14, dataNecessaria: '2026-08-31', observacao: 'Turma de C# começa segunda 31/08 às 19h.', itens: [
      { softwareId: 'dotnet', nome: '.NET SDK 8', versao: '8.0.8', status: 'instalado', em: '2026-08-26T17:30', por: 'Gustavo Prado', observacao: 'Via script nas 14 máquinas.' },
      { softwareId: 'vscode', nome: 'VS Code', versao: 'latest', status: 'instalado', em: '2026-08-26T16:10', por: 'Gustavo Prado', observacao: 'Já estava; atualizado.' },
      { softwareId: 'csharp-devkit', nome: 'C# Dev Kit (extensão VS Code)', versao: '', status: 'instalado', em: '2026-08-26T17:30', por: 'Gustavo Prado', observacao: '' },
    ] },
    descricao: 'Turma de C# começa segunda. Preciso do .NET SDK 8 e do VS Code com a extensão C# Dev Kit em todas as 14 máquinas.',
    solicitante: _sol('instrutor', 'i7', 'Sílvio Barcelos Furlan'), atendenteId: 'c5', salaId: 's2',
    abertoEm: '2026-08-21T14:00', atualizadoEm: '2026-08-26T17:30', resolvidoEm: '2026-08-26T17:30',
    solucao: 'SDK 8.0.8 e C# Dev Kit instalados nas 14 máquinas via script; testado build de projeto console em todas.',
    interacoes: [
      { id: 'x6', em: '2026-08-22T09:10', autor: GUSTAVO, texto: 'Vou fazer na sexta à tarde, quando a Green fica livre.', interna: false },
      { id: 'x7', em: '2026-08-26T17:30', autor: GUSTAVO, texto: 'Feito nas 14 máquinas. Pode conferir antes da aula de segunda.', interna: false },
    ],
    historico: [
      { em: '2026-08-21T14:00', autor: 'Sílvio Barcelos Furlan', texto: 'Chamado aberto.' },
      { em: '2026-08-22T09:05', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-26T17:30', autor: 'Gustavo Prado', texto: 'Marcou como resolvido.' },
    ],
  }),
  chamadoSeed({
    tipo: 'infra', categoriaId: 'acesso-fisico', prioridade: 'baixa', status: 'fechado',
    titulo: 'Tag do estacionamento não abre a cancela',
    descricao: 'Minha tag parou de funcionar desde a troca da cancela.',
    solicitante: _sol('colaborador', 'c4', 'Fernanda Alves'), atendenteId: 'c5',
    abertoEm: '2026-08-18T08:30', atualizadoEm: '2026-08-20T10:00', resolvidoEm: '2026-08-19T11:20', fechadoEm: '2026-08-20T10:00',
    solucao: 'Tag recadastrada no novo controlador da cancela.',
    avaliacao: { nota: 5, comentario: 'Rápido, obrigada!', em: '2026-08-20T10:00' },
    interacoes: [
      { id: 'x8', em: '2026-08-19T11:20', autor: GUSTAVO, texto: 'Recadastrei sua tag. Testa na saída de hoje?', interna: false },
      { id: 'x9', em: '2026-08-20T09:58', autor: _sol('colaborador', 'c4', 'Fernanda Alves'), texto: 'Funcionou, valeu!', interna: false },
    ],
    historico: [
      { em: '2026-08-18T08:30', autor: 'Fernanda Alves', texto: 'Chamado aberto.' },
      { em: '2026-08-18T09:00', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-19T11:20', autor: 'Gustavo Prado', texto: 'Marcou como resolvido.' },
      { em: '2026-08-20T10:00', autor: 'Fernanda Alves', texto: 'Confirmou a solução e fechou o chamado. Avaliação: 5/5.' },
    ],
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'melhoria', prioridade: 'baixa', status: 'em_atendimento',
    titulo: 'Filtro por instrutor na agenda de salas',
    descricao: 'Seria útil filtrar a agenda de salas pelo instrutor, para eu montar a escala da semana.',
    solicitante: _sol('colaborador', 'c2', 'Bruno Lima'), atendenteId: 'c1',
    abertoEm: '2026-08-14T11:00', atualizadoEm: '2026-08-15T09:00', reaberturas: 1,
    interacoes: [
      { id: 'x10', em: '2026-08-14T16:00', autor: ANA, texto: 'Anotado no backlog do sistema; entra na próxima rodada de melhorias.', interna: false },
      { id: 'x11', em: '2026-08-15T08:50', autor: _sol('colaborador', 'c2', 'Bruno Lima'), texto: 'Reabri porque foi fechado sem a melhoria estar no ar — prefiro acompanhar por aqui.', interna: false },
    ],
    historico: [
      { em: '2026-08-14T11:00', autor: 'Bruno Lima', texto: 'Chamado aberto.' },
      { em: '2026-08-14T15:55', autor: 'Ana Souza', texto: 'Assumiu o chamado.' },
      { em: '2026-08-14T16:00', autor: 'Ana Souza', texto: 'Marcou como resolvido.' },
      { em: '2026-08-15T08:50', autor: 'Bruno Lima', texto: 'Reabriu o chamado: melhoria ainda não está no ar.' },
    ],
  }),
  chamadoSeed({
    tipo: 'infra', categoriaId: 'impressora', prioridade: 'media', status: 'cancelado',
    titulo: 'Impressora da recepção atolando',
    descricao: 'Atola a cada 3 folhas.',
    solicitante: _sol('colaborador', 'c9', 'Patrícia Gomes'),
    abertoEm: '2026-08-11T09:00', atualizadoEm: '2026-08-11T09:20', canceladoEm: '2026-08-11T09:20',
    motivoCancelamento: 'Duplicado: a recepção já tinha aberto outro chamado para a mesma impressora.',
    historico: [
      { em: '2026-08-11T09:00', autor: 'Patrícia Gomes', texto: 'Chamado aberto.' },
      { em: '2026-08-11T09:20', autor: 'Gustavo Prado', texto: 'Cancelou: duplicado de outro chamado da recepção.' },
    ],
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'duvida', prioridade: 'baixa', status: 'fechado',
    titulo: 'Como baixar a gravação da aula?',
    descricao: 'Não achei onde ficam as gravações da turma de Python.',
    solicitante: _sol('aluno', 'a4', 'Enzo Eduardo Nogueira'), atendenteId: 'c5',
    abertoEm: '2026-08-05T20:10', atualizadoEm: '2026-08-06T09:30', resolvidoEm: '2026-08-05T20:40', fechadoEm: '2026-08-06T09:30',
    solucao: 'Orientado: Turma → aba Gravações. Link enviado por WhatsApp.',
    avaliacao: { nota: 4, comentario: '', em: '2026-08-06T09:30' },
    interacoes: [
      { id: 'x12', em: '2026-08-05T20:40', autor: GUSTAVO, texto: 'Na sua turma, aba "Gravações" — cada aula tem o link do Meet. Te mandei o caminho no WhatsApp também.', interna: false },
    ],
    historico: [
      { em: '2026-08-05T20:10', autor: 'Enzo Eduardo Nogueira', texto: 'Chamado aberto.' },
      { em: '2026-08-05T20:30', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-05T20:40', autor: 'Gustavo Prado', texto: 'Marcou como resolvido.' },
      { em: '2026-08-06T09:30', autor: 'Enzo Eduardo Nogueira', texto: 'Confirmou a solução e fechou o chamado. Avaliação: 4/5.' },
    ],
  }),
  chamadoSeed({
    tipo: 'infra', categoriaId: 'sala', prioridade: 'media', status: 'aguardando_solicitante',
    titulo: 'Ar-condicionado da Blue pingando',
    descricao: 'Está pingando em cima da bancada da frente; coloquei um balde.',
    solicitante: _sol('colaborador', 'c6', 'Elisa Martins'), atendenteId: 'c5', salaId: 's3',
    abertoEm: '2026-08-24T14:20', atualizadoEm: '2026-08-25T10:00',
    interacoes: [
      { id: 'x13', em: '2026-08-25T10:00', autor: GUSTAVO, texto: 'Técnico da refrigeração vem quinta (28/08) de manhã. Consegue liberar a Blue das 8h às 10h?', interna: false },
    ],
    historico: [
      { em: '2026-08-24T14:20', autor: 'Elisa Martins', texto: 'Chamado aberto.' },
      { em: '2026-08-24T15:00', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-25T10:00', autor: 'Gustavo Prado', texto: 'Respondeu ao solicitante.' },
    ],
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'instalacao', prioridade: 'alta', status: 'em_atendimento',
    titulo: 'Android Studio e JDK na Red para turma mobile',
    descricao: 'Turma de Android começa sábado (29/08) às 8h. Preciso do Android Studio com um emulador já criado, JDK e Git nas 18 máquinas da Red.',
    solicitante: _sol('instrutor', 'i1', 'André Fontoura Bastos'), atendenteId: 'c5', salaId: 's1',
    instalacao: { maquinas: 'todas', quantidade: 18, dataNecessaria: '2026-08-29', observacao: 'Criar um emulador Pixel 7 em cada máquina — o download do SDK é pesado, não deixar para a hora.', itens: [
      { softwareId: 'jdk', nome: 'JDK (Temurin)', versao: '21 LTS', status: 'instalado', em: '2026-08-27T15:10', por: 'Gustavo Prado', observacao: '' },
      { softwareId: 'git', nome: 'Git', versao: '2.x', status: 'instalado', em: '2026-08-27T15:40', por: 'Gustavo Prado', observacao: '' },
      { softwareId: 'android-studio', nome: 'Android Studio', versao: 'Ladybug', status: 'problema', em: '2026-08-27T18:20', por: 'Gustavo Prado', observacao: 'Instalado em 12 máquinas; nas 6 antigas (i3) o emulador não roda sem virtualização — precisa habilitar na BIOS.' },
    ] },
    abertoEm: '2026-08-25T10:30', atualizadoEm: '2026-08-27T18:20',
    interacoes: [
      { id: 'x14', em: '2026-08-27T18:25', autor: GUSTAVO, texto: 'JDK e Git prontos. Android Studio está em 12 das 18 máquinas; nas 6 antigas preciso ligar a virtualização na BIOS — faço amanhã cedo.', interna: false },
    ],
    historico: [
      { em: '2026-08-25T10:30', autor: 'André Fontoura Bastos', texto: 'Chamado aberto.' },
      { em: '2026-08-25T11:00', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-27T15:10', autor: 'Gustavo Prado', texto: 'JDK (Temurin): instalado.' },
      { em: '2026-08-27T15:40', autor: 'Gustavo Prado', texto: 'Git: instalado.' },
      { em: '2026-08-27T18:20', autor: 'Gustavo Prado', texto: 'Android Studio: com problema — Instalado em 12 máquinas; nas 6 antigas (i3) o emulador não roda sem virtualização.' },
      { em: '2026-08-27T18:25', autor: 'Gustavo Prado', texto: 'Respondeu ao solicitante.' },
    ],
  }),
  // Abertos pelo portal do aluno (portal-aluno/suporte.html): campos extras `origem` e `contexto`.
  chamadoSeed({
    tipo: 'software', categoriaId: 'duvida', prioridade: 'media', status: 'aguardando_solicitante',
    titulo: 'Gravação da aula de sábado não abre',
    descricao: 'Cliquei no link da gravação de 22/08 e o Drive diz que preciso pedir acesso. As outras abrem normal.\n\n— Informado pelo portal do aluno —\nTurma: Super DEV 9 — Full Stack Python',
    solicitante: _sol('aluno', 'a1', 'Gustavo Fellipe Queiroz'), atendenteId: 'c5',
    origem: 'portal-aluno', contexto: { assuntoId: 'gravacoes', turmaId: null, turmaCodigo: null, cursoNome: 'Super DEV 9 — Full Stack Python', softwareId: null, sistemaOperacional: null, anexos: ['print-drive.png'] },
    abertoEm: '2026-08-24T21:05', atualizadoEm: '2026-08-25T09:12',
    interacoes: [
      { id: 'x15', em: '2026-08-25T09:12', autor: GUSTAVO, texto: 'Liberei o compartilhamento da gravação de 22/08 para a turma inteira. Consegue testar de novo e me avisar?', interna: false },
    ],
    historico: [
      { em: '2026-08-24T21:05', autor: 'Gustavo Fellipe Queiroz', texto: 'Chamado aberto.' },
      { em: '2026-08-25T09:00', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-25T09:12', autor: 'Gustavo Prado', texto: 'Respondeu ao solicitante.' },
    ],
  }),
  chamadoSeed({
    tipo: 'software', categoriaId: 'duvida', prioridade: 'media', status: 'fechado',
    titulo: 'Erro ao instalar o Python no meu notebook',
    descricao: 'Instalei o Python mas no terminal aparece "python não é reconhecido como comando". Já reinstalei duas vezes.\n\n— Informado pelo portal do aluno —\nTurma: Super DEV 9 — Full Stack Python\nPrograma: Python 3.12\nComputador do aluno: Windows 11',
    solicitante: _sol('aluno', 'a3', 'Elias Felipe Zimmermann'), atendenteId: 'c5', equipamento: 'Computador pessoal · Windows 11',
    origem: 'portal-aluno', contexto: { assuntoId: 'instalacao', turmaId: null, turmaCodigo: null, cursoNome: 'Super DEV 9 — Full Stack Python', softwareId: 'python', sistemaOperacional: 'windows11', anexos: [] },
    abertoEm: '2026-08-19T20:30', atualizadoEm: '2026-08-20T19:05', resolvidoEm: '2026-08-20T10:40', fechadoEm: '2026-08-20T19:05',
    solucao: 'Faltou marcar "Add python.exe to PATH" no instalador. Orientado a reinstalar com a opção marcada.',
    avaliacao: { nota: 5, comentario: 'Resolveu na hora, obrigado!', em: '2026-08-20T19:05' },
    interacoes: [
      { id: 'x16', em: '2026-08-20T10:40', autor: GUSTAVO, texto: 'Na tela inicial do instalador, marca a caixinha "Add python.exe to PATH" antes de clicar em Install. Depois fecha e abre o terminal de novo e testa `python --version`.', interna: false, solucao: true },
      { id: 'x17', em: '2026-08-20T19:00', autor: _sol('aluno', 'a3', 'Elias Felipe Zimmermann'), texto: 'Era isso mesmo, funcionou!', interna: false },
    ],
    historico: [
      { em: '2026-08-19T20:30', autor: 'Elias Felipe Zimmermann', texto: 'Chamado aberto.' },
      { em: '2026-08-20T10:30', autor: 'Gustavo Prado', texto: 'Assumiu o chamado.' },
      { em: '2026-08-20T10:40', autor: 'Gustavo Prado', texto: 'Marcou como resolvido.' },
      { em: '2026-08-20T19:05', autor: 'Elias Felipe Zimmermann', texto: 'Confirmou a solução e fechou o chamado. Avaliação: 5/5.' },
    ],
  }),
];

// ---------- Semente gerada: histórico de ~10 semanas para os KPIs ----------
// Determinística (sem Math.random): o mesmo conjunto aparece sempre. Muitos chamados
// de instalação de software, boa parte chegando tarde ou ficando incompleta — é o
// problema real que a tela de KPIs precisa mostrar.

(function gerarHistorico() {
  const seq = (n) => { let x = n; return () => { x = (x * 48271) % 2147483647; return x / 2147483647; }; };
  const rnd = seq(20260828);
  const escolher = (l) => l[Math.floor(rnd() * l.length)];
  const dt = (dias, hora) => {
    const d = new Date('2026-08-28T09:00');
    d.setDate(d.getDate() - dias); d.setHours(hora, Math.floor(rnd() * 60), 0, 0);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const mais = (iso, horas) => {
    const d = new Date(iso); d.setMinutes(d.getMinutes() + Math.round(horas * 60));
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const SOL = [
    _sol('instrutor', 'i1', 'André Fontoura Bastos'), _sol('instrutor', 'i2', 'Tatiana Bezerra Sartori'), _sol('instrutor', 'i3', 'Otávio Rangel Delgado'),
    _sol('instrutor', 'i5', 'Rogério Vidal Trindade'), _sol('instrutor', 'i7', 'Sílvio Barcelos Furlan'), _sol('instrutor', 'i6', 'Bruna Cordeiro Salgado'),
    _sol('colaborador', 'c2', 'Bruno Lima'), _sol('colaborador', 'c4', 'Fernanda Alves'), _sol('colaborador', 'c6', 'Elisa Martins'), _sol('colaborador', 'c9', 'Patrícia Gomes'),
    _sol('aluno', 'a5', 'Erick Krüger'), _sol('aluno', 'a7', 'Felipe Akio Cavalcante Vilanova Barros'), _sol('aluno', 'a9', 'Gustavo Tavares Guimarães'), _sol('aluno', 'a12', 'Rafael Coelho'),
  ];
  const SALAS = ['s1', 's2', 's3'];
  const KITS = [
    { titulo: 'Preparar Green para turma de Java', itens: ['jdk', 'intellij', 'git', 'postgres', 'dbeaver'], sol: 2 },
    { titulo: 'Instalar ambiente Python na Blue', itens: ['python', 'vscode', 'py-ext', 'git'], sol: 3 },
    { titulo: 'Ambiente .NET para turma de C#', itens: ['dotnet', 'vs2022', 'git'], sol: 4 },
    { titulo: 'Front-end: Node e VS Code na Red', itens: ['node', 'vscode', 'live-server', 'git', 'chrome'], sol: 0 },
    { titulo: 'Banco de dados: MySQL e Workbench', itens: ['mysql', 'dbeaver'], sol: 1 },
    { titulo: 'Redes: Packet Tracer e VirtualBox', itens: ['packet-tracer', 'virtualbox'], sol: 6 },
    { titulo: 'Android Studio para turma mobile', itens: ['android-studio', 'jdk', 'git'], sol: 0 },
    { titulo: 'Docker para aula de DevOps', itens: ['docker', 'git', 'vscode'], sol: 4 },
    { titulo: 'Power BI e Excel para turma de dados', itens: ['powerbi', 'office'], sol: 5 },
    { titulo: 'Figma para turma de UX', itens: ['figma', 'chrome'], sol: 5 },
  ];
  const OUTROS = [
    ['infra', 'projetor', 'Projetor sem imagem na {sala}', 'alta'], ['infra', 'rede', 'Internet lenta na {sala}', 'media'], ['infra', 'computador', 'Máquina {n} não liga', 'media'],
    ['infra', 'computador', 'Máquina {n} travando ao abrir a IDE', 'media'], ['infra', 'sala', 'Ar-condicionado da {sala} não gela', 'baixa'], ['infra', 'computador', 'Teclado da máquina {n} com teclas falhando', 'baixa'],
    ['software', 'acesso', 'Não consigo acessar o portal', 'alta'], ['software', 'erro', 'Erro ao lançar presença na turma', 'media'], ['software', 'duvida', 'Onde vejo a gravação da aula?', 'baixa'],
    ['software', 'dados', 'Nome errado na lista de presença', 'baixa'], ['software', 'erro', 'Avaliação do dia não abre no celular', 'media'], ['infra', 'rede', 'Wi-Fi não conecta no meu notebook', 'media'],
    ['infra', 'impressora', 'Impressora sem toner', 'baixa'], ['software', 'acesso', 'Senha do Google Workspace expirou', 'alta'], ['software', 'melhoria', 'Sugestão: lembrete de avaliação por WhatsApp', 'baixa'],
  ];
  const nomeSala = { s1: 'Red', s2: 'Green', s3: 'Blue' };
  const AT = [GUSTAVO, GUSTAVO, GUSTAVO, ANA];

  for (let dias = 70; dias >= 2; dias -= 1) {
    const qtd = rnd() < 0.55 ? 1 : (rnd() < 0.5 ? 0 : 2);
    for (let k = 0; k < qtd; k += 1) {
      const instalacao = rnd() < 0.45;
      const abertoEm = dt(dias, 8 + Math.floor(rnd() * 12));
      const atend = escolher(AT);
      if (instalacao) {
        const kit = escolher(KITS);
        const salaId = escolher(SALAS);
        const solicitante = SOL[kit.sol];
        const antecedencia = escolher([0.5, 1, 1, 2, 3, 5, 7, 10]);  // dias entre pedido e aula
        const dataNecessaria = mais(abertoEm, antecedencia * 24).slice(0, 10);
        const tarde = antecedencia <= 1;
        const encerrado = dias > 6 || rnd() < 0.3;
        const parcial = rnd() < 0.35;                                   // ficou software faltando
        const idxFalha = Math.floor(rnd() * kit.itens.length);
        const atrasou = tarde ? rnd() < 0.7 : rnd() < 0.25;             // instalação terminou depois da aula
        const fimHoras = atrasou ? antecedencia * 24 + 4 + rnd() * 30 : Math.max(2, antecedencia * 24 - 2 - rnd() * 20);
        const resolvidoEm = mais(abertoEm, fimHoras);
        const itens = kit.itens.map((id, i) => {
          const sw = SOFTWARES_CATALOGO.find((x) => x.id === id);
          const falhou = parcial && i === idxFalha;
          const problema = !falhou && rnd() < 0.08;
          const status = !encerrado ? (i < 1 ? 'instalado' : 'pendente') : falhou ? 'nao_instalado' : problema ? 'problema' : 'instalado';
          const em = status === 'pendente' ? null : mais(abertoEm, Math.min(fimHoras, 1 + i * (fimHoras / kit.itens.length)));
          const obs = falhou ? escolher(['Faltou tempo antes da aula.', 'Download bloqueado pelo proxy.', 'Máquinas antigas não rodam.', 'Instalador pedia login que não tínhamos.'])
            : problema ? escolher(['Instalado, mas não abre nas máquinas 03 e 07.', 'Versão diferente da apostila.', 'Sem PATH configurado em 4 máquinas.']) : '';
          return { softwareId: id, nome: sw.nome, versao: sw.versao, status, em, por: em ? atend.nome : null, observacao: obs };
        });
        const status = !encerrado ? 'em_atendimento' : 'fechado';
        const avaliou = encerrado && rnd() < 0.7;
        const nota = avaliou ? (parcial || atrasou ? escolher([1, 2, 2, 3]) : escolher([3, 4, 5, 5])) : null;
        const hist = [{ em: abertoEm, autor: solicitante.nome, texto: 'Chamado aberto.' }, { em: mais(abertoEm, 1 + rnd() * 6), autor: atend.nome, texto: 'Assumiu o chamado.' }];
        itens.filter((it) => it.em).forEach((it) => hist.push({ em: it.em, autor: atend.nome, texto: `${it.nome}: ${STATUS_ITEM_INSTALACAO.find((s) => s.id === it.status).nome.toLowerCase()}${it.observacao ? ` — ${it.observacao}` : ''}.` }));
        if (encerrado) hist.push({ em: resolvidoEm, autor: atend.nome, texto: 'Marcou como resolvido.' }, { em: mais(resolvidoEm, 12), autor: solicitante.nome, texto: `${nota ? 'Confirmou a solução e fechou o chamado. ' : 'Fechou o chamado. '}${nota ? `Avaliação: ${nota}/5.` : ''}`.trim() });
        CHAMADOS_SEED.push(chamadoSeed({
          tipo: 'software', categoriaId: 'instalacao', prioridade: tarde ? 'alta' : 'media', status,
          titulo: kit.titulo.replace('Green', nomeSala[salaId]).replace('Blue', nomeSala[salaId]).replace('Red', nomeSala[salaId]),
          descricao: `Preciso de ${itens.map((i) => i.nome).join(', ')} nas máquinas da ${nomeSala[salaId]} para a aula de ${dataNecessaria.split('-').reverse().join('/')}.`,
          solicitante, atendenteId: atend.id, salaId,
          instalacao: { maquinas: 'todas', quantidade: 14, dataNecessaria, observacao: tarde ? 'Aula é amanhã!' : '', itens },
          abertoEm, atualizadoEm: encerrado ? mais(resolvidoEm, 12) : abertoEm, resolvidoEm: encerrado ? resolvidoEm : null, fechadoEm: encerrado ? mais(resolvidoEm, 12) : null,
          solucao: encerrado ? (parcial ? 'Instalado o que deu tempo; um item ficou de fora.' : 'Tudo instalado e testado.') : '',
          avaliacao: nota ? { nota, comentario: nota <= 2 ? escolher(['Aula começou sem o software.', 'Metade das máquinas não tinha o programa.', 'Perdi 40 min da aula instalando.']) : '', em: mais(resolvidoEm, 12) } : null,
          interacoes: encerrado ? [{ id: `g${dias}${k}`, em: resolvidoEm, autor: atend, texto: parcial ? 'Instalado o que deu tempo; um item ficou de fora.' : 'Tudo instalado e testado.', interna: false, solucao: true }] : [],
          historico: hist,
        }));
      } else {
        const [tipo, categoriaId, tit, prioridade] = escolher(OUTROS);
        const salaId = escolher(SALAS);
        const solicitante = escolher(SOL);
        const encerrado = dias > 4 || rnd() < 0.4;
        const sla = { baixa: 120, media: 48, alta: 8, critica: 2 }[prioridade];
        const fimHoras = rnd() < 0.7 ? sla * (0.2 + rnd() * 0.7) : sla * (1.1 + rnd() * 1.5);
        const resolvidoEm = mais(abertoEm, fimHoras);
        const nota = encerrado && rnd() < 0.6 ? (fimHoras > sla ? escolher([2, 3, 3, 4]) : escolher([4, 5, 5])) : null;
        CHAMADOS_SEED.push(chamadoSeed({
          tipo, categoriaId, prioridade, status: encerrado ? 'fechado' : (rnd() < 0.5 ? 'aberto' : 'em_atendimento'),
          titulo: tit.replace('{sala}', nomeSala[salaId]).replace('{n}', String(1 + Math.floor(rnd() * 14)).padStart(2, '0')),
          descricao: 'Registrado pelo histórico do suporte.',
          solicitante, atendenteId: encerrado || rnd() < 0.5 ? atend.id : null, salaId: tipo === 'infra' ? salaId : null,
          abertoEm, atualizadoEm: encerrado ? resolvidoEm : abertoEm, resolvidoEm: encerrado ? resolvidoEm : null, fechadoEm: encerrado ? mais(resolvidoEm, 6) : null,
          solucao: encerrado ? 'Resolvido.' : '',
          avaliacao: nota ? { nota, comentario: '', em: mais(resolvidoEm, 6) } : null,
          interacoes: encerrado ? [{ id: `h${dias}${k}`, em: resolvidoEm, autor: atend, texto: 'Resolvido.', interna: false, solucao: true }] : [],
          historico: [{ em: abertoEm, autor: solicitante.nome, texto: 'Chamado aberto.' }, ...(encerrado ? [{ em: resolvidoEm, autor: atend.nome, texto: 'Marcou como resolvido.' }, { em: mais(resolvidoEm, 6), autor: solicitante.nome, texto: nota ? `Confirmou a solução e fechou o chamado. Avaliação: ${nota}/5.` : 'Fechou o chamado.' }] : [])],
        }));
      }
    }
  }
})();
