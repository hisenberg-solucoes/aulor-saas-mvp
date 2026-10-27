// ============================================================
// Home por perfil (home.html) — DADOS DEMONSTRATIVOS (mock).
// Os números espelham a história da semente (26/08/2026).
// Cada perfil responde: "o que eu preciso ver/fazer HOJE?" — fila de
// pendências acionáveis + 4 sinais do dia + agenda + atalhos. Pessoas e
// valores são [sup.].
// ============================================================

const HOME_PERFIS = [
  {
    id: 'administracao', nome: 'Administração',
    pessoa: { nome: 'Ana Souza', papel: 'Administradora', iniciais: 'AS' },
    pergunta: 'O que precisa da minha atenção agora?',
    tiles: [
      { rotulo: 'Aulas hoje', valor: '2', ajuda: '19h–22h · presencial e online', href: 'aulas.html' },
      { rotulo: 'Aguardando assinatura', valor: '3', tom: 'alerta', ajuda: 'vendas paradas no fluxo', href: 'contratos.html?filtro=assinatura' },
      { rotulo: 'Parcelas vencidas', valor: '50', tom: 'ruim', ajuda: 'R$ 66,1 mil a tratar', href: 'financeiro.html?situacao=vencido' },
      { rotulo: 'Diários pendentes', valor: '34', tom: 'alerta', ajuda: 'aulas do mês sem fechamento', href: 'turmas.html' },
    ],
    pendencias: [
      { nivel: 'critico', texto: '3 chamados fora do prazo', detalhe: '2 ainda estão sem atendente', href: 'chamados.html' },
      { nivel: 'alerta', texto: '3 vendas aguardam assinatura', detalhe: 'abra as vendas e cobre as partes', href: 'contratos.html?filtro=assinatura' },
      { nivel: 'alerta', texto: '3 alunos abaixo da frequência mínima', detalhe: 'contato preventivo antes da próxima aula', href: 'alertas-frequencia.html' },
      { nivel: 'info', texto: '11 notas fiscais aguardam conferência', detalhe: 'pagamentos da semana dependem disso', href: 'pagamentos-instrutores.html' },
    ],
    hoje: { titulo: 'Hoje na operação', itens: [
      { titulo: '19h · PY2 N — Python II', sub: 'sala 2 · chamada pendente', href: 'aulas.html' },
      { titulo: '19h · HT5 N — HTML5 & CSS', sub: 'online · 12 alunos', href: 'aulas.html' },
      { titulo: 'Instalação para a aula de amanhã', sub: 'CH-0013 · 2 softwares pendentes', href: 'chamados.html' },
    ] },
    atalhos: [
      { href: 'contratos.html', nome: 'Vendas' }, { href: 'turmas.html', nome: 'Turmas' },
      { href: 'financeiro.html', nome: 'Financeiro' }, { href: 'chamados.html', nome: 'Chamados' },
    ],
  },
  {
    id: 'diretor', nome: 'Diretoria',
    pessoa: { nome: 'Marina Lopes', papel: 'Diretora', iniciais: 'ML' },
    pergunta: 'A operação está rodando e o resultado está vindo?',
    tiles: [
      { rotulo: 'Turmas em andamento', valor: '4', ajuda: '3 a começar nas próximas semanas', href: 'turmas.html' },
      { rotulo: 'Alunos ativos', valor: '33', ajuda: '50 vagas vendidas · 0 livres', href: 'diretoria.html' },
      { rotulo: 'Inadimplência', valor: 'R$ 66,1 mil', tom: 'alerta', ajuda: '50 parcelas · 2 vendas em cobrança', href: 'cobrancas.html', tip: 'Espelho do painel financeiro (inclui carteira legado).' },
      { rotulo: 'Aulas realizadas hoje', valor: '2', ajuda: '2 turmas no período noturno', href: 'aulas.html' },
    ],
    pendencias: [
      { nivel: 'critico', texto: '4 vendas aguardando aprovação administrativa', detalhe: 'alunos já frequentando as aulas em 1 deles', href: 'contratos.html' },
      { nivel: 'alerta', texto: '41 turmas com custo de instrutor estimado', detalhe: 'margem real depende de fechar os contratos de instrutor', href: 'faturamento.html' },
      { nivel: 'alerta', texto: '3 chamados fora do prazo no suporte', detalhe: '2 sem atendente definido', href: 'chamados.html' },
      { nivel: 'info', texto: 'Aniversariantes da semana: 3 alunos, 1 instrutor', detalhe: 'oportunidade de relacionamento', href: 'aniversariantes.html' },
    ],
    hoje: { titulo: 'Hoje na escola', itens: [
      { titulo: '2 turmas à noite (19h–22h)', sub: 'PY2 N · sala 2 e HT5 N · sala 3', href: 'agenda-salas.html' },
      { titulo: 'SUP10 termina módulo em 28/08', sub: 'avaliação final e abertura do próximo módulo', href: 'formacoes.html' },
      { titulo: 'Ocupação das salas: 31%', sub: 'capacidade ociosa à tarde', href: 'agenda-salas.html' },
    ] },
    atalhos: [
      { href: 'diretoria.html', nome: 'Visão executiva' }, { href: 'faturamento.html', nome: 'Faturamento por curso' },
      { href: 'agenda-salas.html', nome: 'Agenda de salas' }, { href: 'colaboradores.html', nome: 'Colaboradores' },
    ],
  },
  {
    id: 'comercial', nome: 'Comercial',
    pessoa: { nome: 'Ana Souza', papel: 'Comercial', iniciais: 'AS' },
    pergunta: 'O que fecho hoje e o que está parado no funil?',
    tiles: [
      { rotulo: 'Aguardando assinatura', valor: '3', tom: 'alerta', ajuda: 'vendas paradas no fluxo', href: 'contratos.html?filtro=assinatura' },
      { rotulo: 'Documentação pendente', valor: '3', tom: 'alerta', ajuda: 'cadastro ou condição incompleta', href: 'contratos.html?filtro=documentos' },
      { rotulo: 'Matrículas sem turma', valor: '33', tom: 'ruim', ajuda: 'itens ativos sem alocação', href: 'contratos.html?filtro=sem-turma' },
      // 08/09/2026: no lugar de "Vagas disponíveis" (0, sem ação) — turmas que ainda não atingiram o mínimo de alunos (docs/turmas.md RN11).
      { rotulo: 'Turmas em risco', valor: '10', tom: 'ruim', ajuda: 'não atingiram o mínimo · início em até 15 dias', href: 'turmas-risco.html' },
    ],
    pendencias: [
      { nivel: 'critico', texto: '10 turmas em risco de não fechar (início em menos de 15 dias)', detalhe: 'MLP TQ tem só 2 de 6 alunos; nas outras 9 falta 1 matrícula — focar a venda nelas', href: 'turmas-risco.html' },
      { nivel: 'critico', texto: 'Venda ct30 aguardando assinatura há 6 meses', detalhe: 'aluno frequenta as aulas sem contrato assinado', href: 'contratos.html' },
      { nivel: 'alerta', texto: '2 cadastros de aluno aguardando conferência', detalhe: 'chegaram pelo link do pacote', href: 'contratos.html' },
      { nivel: 'alerta', texto: 'Turma GIT · Senior sem venda vinculada', detalhe: '12 alunos em turma in-company sem faturamento', href: 'turmas.html' },
      { nivel: 'info', texto: 'Renovação WEG: proposta até 15/09', detalhe: 'contrato atual termina em setembro', href: 'empresas.html' },
    ],
    hoje: { titulo: 'Follow-ups de hoje', itens: [
      { titulo: '3 propostas paradas há mais de 15 dias', sub: 'reaquecer ou marcar como perdidas', href: 'contratos.html' },
      { titulo: 'Turma JS/Lógica começa em 14/09 com 5 vagas', sub: 'curso com melhor score de marketing', href: 'turmas.html' },
      { titulo: 'Retornar consulta SPC de 1 aluno', sub: 'análise de crédito pendente', href: 'spc.html' },
    ] },
    atalhos: [
      { href: 'contratos.html', nome: 'Vendas' }, { href: 'spc.html', nome: 'Consulta SPC' },
      { href: 'alunos.html', nome: 'Alunos' }, { href: 'empresas.html', nome: 'Empresas' },
    ],
  },
  {
    id: 'pedagogico', nome: 'Pedagógico',
    pessoa: { nome: 'Paula Ribeiro', papel: 'Coordenação pedagógica', iniciais: 'PR' },
    pergunta: 'As aulas de hoje estão prontas e quem precisa de atenção?',
    tiles: [
      { rotulo: 'Aulas hoje', valor: '2', ajuda: '19h–22h · presencial e online', href: 'aulas.html' },
      { rotulo: 'Diários pendentes', valor: '34', tom: 'ruim', ajuda: 'aulas do mês sem fechamento', href: 'turmas.html' },
      { rotulo: 'Avaliações em atenção', valor: '3', tom: 'alerta', ajuda: 'retorno ou aplicação pendente', href: 'avaliacoes.html' },
      { rotulo: 'Encerramentos próximos', valor: '1', ajuda: 'turma encerra nos próximos 7 dias', href: 'turmas.html' },
    ],
    pendencias: [
      { nivel: 'critico', texto: 'Reposição da PY2 N marcada para hoje', detalhe: 'confirmar sala e presença do instrutor', href: 'aulas.html' },
      { nivel: 'alerta', texto: '3 alunos em risco de reprovar por frequência', detalhe: 'contato preventivo antes da próxima aula', href: 'alertas-frequencia.html' },
      { nivel: 'alerta', texto: '23 turmas sem aulas agendadas', detalhe: 'agenda ainda na prévia — gerar agendamento', href: 'turmas.html' },
      { nivel: 'info', texto: 'Avaliação final da SUP09 a aplicar', detalhe: 'módulo encerra esta semana', href: 'avaliacoes.html' },
    ],
    hoje: { titulo: 'Aulas de hoje', itens: [
      { titulo: '19h · PY2 N — Python II', sub: 'Rogério · sala 2 · 8 alunos · chamada pendente', href: 'aulas.html' },
      { titulo: '19h · HT5 N — HTML5 & CSS', sub: 'Bruna · online · 12 alunos', href: 'aulas.html' },
      { titulo: 'Software da aula de amanhã em instalação', sub: 'CH-0013 no suporte · acompanhar', href: 'chamados.html' },
    ] },
    atalhos: [
      { href: 'turmas.html', nome: 'Turmas' }, { href: 'alunos.html', nome: 'Alunos' },
      { href: 'aulas.html', nome: 'Agendamento de aulas' }, { href: 'avaliacoes.html', nome: 'Feedback diário' },
    ],
  },
  {
    id: 'suporte', nome: 'Suporte e TI',
    pessoa: { nome: 'Diego Martins', papel: 'Suporte e TI', iniciais: 'DM' },
    pergunta: 'O que está na fila e o que estoura primeiro?',
    tiles: [
      { rotulo: 'Críticos ativos', valor: '1', tom: 'ruim', ajuda: 'prioridade máxima', href: 'chamados.html?filtro=criticos' },
      { rotulo: 'SLA em risco', valor: '1', tom: 'ruim', ajuda: 'vence em menos de 2h', href: 'chamados.html?filtro=sla' },
      { rotulo: 'Sem atendente', valor: '3', tom: 'alerta', ajuda: 'assumir ou distribuir', href: 'chamados.html?filtro=sem-atendente' },
      { rotulo: 'Instalações pendentes', valor: '1', tom: 'alerta', ajuda: 'a próxima aula depende dela', href: 'chamados.html?filtro=instalacoes' },
    ],
    pendencias: [
      { nivel: 'critico', texto: 'CH-0013: instalação para a aula de amanhã', detalhe: '2 softwares pendentes na sala 3', href: 'chamados.html' },
      { nivel: 'critico', texto: '3 chamados sem primeira resposta', detalhe: 'CH-0002, CH-0005 e CH-0006', href: 'chamados.html' },
      { nivel: 'alerta', texto: 'Máquina 07 da sala 2 reincidente', detalhe: '3 chamados no mês — avaliar troca', href: 'chamados.html' },
      { nivel: 'info', texto: '1 chamado crítico ativo há 2 dias', detalhe: 'prioridade crítica tem SLA de 2h', href: 'chamados.html' },
    ],
    hoje: { titulo: 'Instalações dos próximos 7 dias', itens: [
      { titulo: 'Amanhã 19h · sala 3 — kit Python', sub: 'CH-0013 em andamento · 2 de 4 softwares prontos', href: 'chamados.html' },
      { titulo: '01/09 · sala 2 — kit front-end', sub: 'pedido dentro do prazo · não iniciado', href: 'chamados.html' },
      { titulo: '03/09 · online — licenças JetBrains', sub: 'renovação anual vence antes da turma', href: 'chamados.html' },
    ] },
    atalhos: [
      { href: 'chamados.html', nome: 'Chamados' }, { href: 'meus-chamados.html', nome: 'Meus chamados' },
      { href: 'salas.html', nome: 'Salas' }, { href: 'agenda-salas.html', nome: 'Agenda de salas' },
    ],
  },
  {
    id: 'financeiro', nome: 'Financeiro',
    pessoa: { nome: 'Sofia Almeida', papel: 'Financeiro', iniciais: 'SA' },
    pergunta: 'O caixa fecha e o que vence agora?',
    tiles: [
      { rotulo: 'A receber hoje', valor: 'R$ 0', ajuda: 'nenhum lançamento vence hoje', href: 'financeiro.html?aba=receber&vencimento=hoje' },
      { rotulo: 'A receber vencido', valor: 'R$ 66,1 mil', tom: 'ruim', ajuda: '50 parcelas · 31 com +90 dias', href: 'financeiro.html?situacao=vencido' },
      { rotulo: 'A pagar em 7 dias', valor: 'R$ 7,2 mil', tom: 'alerta', ajuda: '3 lançamentos previstos', href: 'financeiro.html?aba=pagar&vencimento=7-dias' },
      { rotulo: 'Sem conciliação', valor: '261', tom: 'alerta', ajuda: '254 com sugestão · 7 sem par', href: 'financeiro.html?aba=conciliacao' },
    ],
    pendencias: [
      { nivel: 'critico', texto: 'Folha de agosto vence em 05/09', detalhe: '10 títulos previstos em Pagar', href: 'financeiro.html?aba=pagar' },
      { nivel: 'alerta', texto: '4 compras aguardando aprovação', detalhe: 'R$ 5,2 mil · 3 acima da alçada do gestor', href: 'compras.html?status=solicitada' },
      { nivel: 'alerta', texto: '11 NFs de instrutores a conferir', detalhe: 'pagamentos da semana dependem da conferência', href: 'pagamentos-instrutores.html' },
      { nivel: 'alerta', texto: 'Boletos de setembro a emitir (5 vendas)', detalhe: 'emitir até 28/08 para vencer dia 05', href: 'cobrancas.html' },
      { nivel: 'info', texto: 'Transferência BB → Asaas a conciliar', detalhe: 'R$ 12,5 mil sem par no extrato', href: 'contas-bancarias.html' },
    ],
    hoje: { titulo: 'Vencimentos desta semana', itens: [
      { titulo: '28/08 · coffee break R$ 4,3 mil', sub: '10 turmas · lançamento previsto', href: 'financeiro.html?aba=pagar&vencimento=7-dias' },
      { titulo: '30/08 · instrutor R$ 1,3 mil', sub: 'segunda metade do contrato', href: 'financeiro.html?aba=pagar&vencimento=7-dias' },
      { titulo: '31/08 · taxas Asaas R$ 1,6 mil', sub: '1,2% do recebido no mês', href: 'financeiro.html?aba=pagar&vencimento=7-dias' },
    ] },
    atalhos: [
      { href: 'financeiro.html', nome: 'Lançamentos' }, { href: 'contas-bancarias.html', nome: 'Contas bancárias' },
      { href: 'cobrancas.html', nome: 'Cobranças' }, { href: 'pagamentos-instrutores.html', nome: 'Pagamentos de instrutores' },
    ],
  },
];
