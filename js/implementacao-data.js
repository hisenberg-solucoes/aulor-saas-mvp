// ============================================================
// Implementação da V1: cada tela do escopo (documento de 26/10/2026, com as decisões do ESCOPO_V1.md) e o que dela já existe no
// aulor-web e na aulor-api. Retrato à mão, conferido nos commits de RETRATO: rotas e componentes
// do web (src/app) e endpoints e docs/engineering da API. Ao atualizar, mude o retrato junto.
// Cada feature diz a situação em cada lado: 'ok' feito, 'parcial', 'falta' ou 'na' (não se aplica).
// ============================================================

const F = (parte, nome, web, api, nota) => ({ parte, nome, web, api, nota });

const IMPLEMENTACAO = {
  retrato: {
    data: '2026-10-28',
    web: { repo: 'aulor-web', commit: '3d0877c', url: 'https://github.com/hisenberg-solucoes/aulor-web/commit/3d0877c' },
    api: { repo: 'aulor-api', commit: 'bb4eee2', url: 'https://github.com/hisenberg-solucoes/aulor-api/commit/bb4eee2' },
  },

  integracoes: [
    { id: 'auth0', nome: 'Auth0', uso: 'Login, convite e primeiro acesso', situacao: 'ok', nota: 'Entrada do web e identidade da API.' },
    { id: 'asaas', nome: 'Asaas', uso: 'Links de pagamento, cobrança, conciliação, extrato e saque', situacao: 'falta', prazo: true, nota: 'Exige a homologação da conta; prazo externo, começar cedo.' },
    { id: 'nf', nome: 'Emissor de NF', uso: 'NF no Financeiro, travada pelo aceite do termo', situacao: 'falta', prazo: true, nota: 'Provedor e regras ainda a definir.' },
    { id: 'clicksign', nome: 'Clicksign', uso: 'Assinatura dos contratos', situacao: 'falta', nota: 'A confirmar.' },
    { id: 'meet', nome: 'Google Meet', uso: 'Link da sala de cada aula', situacao: 'falta', nota: 'A confirmar.' },
    { id: 'arquivos', nome: 'Arquivos dos materiais', uso: 'Armazenamento dos arquivos das aulas', situacao: 'falta', nota: 'Privado, com links assinados.' },
  ],

  // Raias do mapa, da esquerda para a direita; cada grupo é uma coluna, na ordem do menu do protótipo
  // (js/permissoes-data.js), que o menu do web ainda não segue. As raias com `portal` descem da Entrada.
  raias: [
    {
      id: 'link', nome: 'Cadastro pelo link', descricao: 'Páginas abertas por um link enviado; o convite pede a entrada com o e-mail convidado',
      grupos: [{
        id: 'link', nome: 'Cadastro pelo link',
        telas: [
          {
            id: 'link-aluno', nome: 'Cadastro do aluno', prototipo: ['cadastro-aluno.html', 'cadastro-aluno-steps.html'],
            liga: ['vendas'],
            features: [
              F('Página', 'Abre pelo link do pacote da venda, sem login', 'falta', 'falta', 'A API só cadastra aluno com a sessão da equipe.'),
              F('Página', 'Dados do aluno, endereço e quem paga', 'falta', 'parcial', 'As regras existem no POST /v1/students e no PUT /v1/students/{id}/address-and-payment, mas não numa rota pública.'),
              F('Página', 'Responsável Legal quando o aluno é menor', 'falta', 'parcial', 'Regra do menor pronta no cadastro autenticado.'),
              F('Página', 'Aceite do termo (LGPD), que destrava a NF', 'falta', 'falta'),
              F('Venda', 'O aluno cadastrado entra no pacote da venda', 'falta', 'falta', 'Depende de Vendas.'),
            ],
          },
          {
            id: 'link-empresa', nome: 'Cadastro da empresa', prototipo: ['cadastro-empresa.html', 'cadastro-empresa-steps.html'],
            liga: ['vendas', 'empresas'],
            features: [
              F('Página', 'Abre pelo link da venda, sem login', 'falta', 'falta'),
              F('Página', 'Dados da empresa e contatos', 'falta', 'falta', 'Não há empresas na API.'),
            ],
          },
          {
            // AULOR-007: substitui o link público do instrutor; não há formulário anônimo (D3).
            id: 'convite-cadastro', nome: 'Convite de cadastro', prototipo: ['convite.html'],
            liga: ['instrutores', 'colaboradores'], integracoes: ['auth0'],
            features: [
              F('Entrada', 'Abre pelo e-mail do convite e entra com o e-mail convidado', 'ok', 'ok', 'Confirmação do convite de AULOR-002 (POST /v1/invitations/confirmations), que recusa outro e-mail.'),
              F('Página', 'Complete seu cadastro: CPF, nascimento, nome social e contato', 'falta', 'falta', 'O convite de cadastro do People ainda não existe (TRD de AULOR-007).'),
              F('Página', 'CPF que o acesso não prova fica com a coordenação, sem revelar ninguém', 'falta', 'falta'),
              F('Página', 'Cadastro concluído e o que o perfil permite', 'falta', 'falta'),
              F('Página', 'Convite pela ficha liga a pessoa ao acesso, sem formulário', 'falta', 'falta'),
            ],
          },
        ],
      }],
    },

    {
      id: 'admin', nome: 'Administrativo', portal: true, descricao: 'Secretaria, coordenação, comercial e financeiro',
      grupos: [
        {
          id: 'admin-inicio', nome: 'Início',
          telas: [{
            id: 'admin-home', nome: 'Início', prototipo: ['home.html'], web: '/:slug',
            webArquivos: ['institution/home.ts', 'institution/institution.ts', 'shell/shell.ts'],
            endpoints: ['GET /v1/users/me', 'GET /v1/users/me/context'],
            features: [
              F('Tela', 'Saudação e unidade em uso', 'ok', 'ok'),
              F('Tela', 'Troca de unidade', 'ok', 'ok'),
              F('Tela', 'Atalhos para os módulos que o perfil vê', 'falta', 'ok', 'O web tem só a saudação. O menu esconde Alunos, Cursos, Colaboradores, Instrutores e Perfis; Formações e Turmas aparecem para todos.'),
              F('Tela', 'Aviso de tela fora do perfil', 'parcial', 'ok', 'Só Alunos e Perfis tratam o 403, e com o "Acesso recusado" da escola inteira; não volta ao Início dizendo qual tela.'),
            ],
          }],
        },
        {
          id: 'comercial', nome: 'Comercial',
          telas: [
            {
              id: 'vendas', nome: 'Vendas', prototipo: ['contratos.html', 'contrato.html'], web: '/:slug/vendas',
              webSituacao: 'Em construção', integracoes: ['asaas', 'clicksign', 'nf'],
              liga: ['modelos-contrato', 'centros-receita', 'alunos', 'empresas'],
              features: [
                F('Lista', 'Indicadores, filtros, Por turma e Próximo passo', 'falta', 'falta'),
                F('Nova venda', 'Venda por link: o cliente se cadastra, o vendedor vem de quem está logado', 'falta', 'falta'),
                F('Nova venda', 'Centro de receita obrigatório no lançamento', 'falta', 'falta'),
                F('Resumo', 'Trava de NF pelo aceite do termo e etapa Adm OK', 'falta', 'falta'),
                F('Pacotes e alunos', 'Vendedor externo confirma os alunos pelos quais responde', 'falta', 'falta'),
                F('Cobrança', 'Parcelas e links de pagamento, sem Simular rescisão', 'falta', 'falta'),
                F('Documentos', 'Contrato do modelo, assinatura no Clicksign e NF', 'falta', 'falta'),
                F('Histórico', 'Registro de eventos, só consulta', 'falta', 'falta'),
              ],
              fora: ['Cálculo e simulação de rescisão'],
            },
            {
              id: 'alunos', nome: 'Alunos', prototipo: ['alunos.html', 'aluno.html'], web: '/:slug/alunos',
              webArquivos: ['students/students.ts', 'students/student.ts', 'students/new-student-dialog.ts', 'students/student-details.ts', 'students/guardian-dialog.ts', 'students/student-address-and-payment.ts'],
              endpoints: ['POST /v1/students/search', 'POST /v1/students', 'PUT /v1/students/{id}', 'GET /v1/students/{id}', 'PUT /v1/students/{id}/details', 'PUT /v1/students/{id}/address-and-payment', 'POST /v1/students/{id}/guardians', 'PUT /v1/students/{id}/guardians/{guardianId}', 'DELETE /v1/students/{id}/guardians/{guardianId}'],
              liga: ['responsaveis', 'vendas'],
              features: [
                F('Lista', 'Busca por nome, nome social, CPF, e-mail e celular', 'ok', 'ok'),
                F('Lista', 'Filtros do protótipo (em dia, devedores, com empresa)', 'falta', 'falta', 'A busca da API só recebe o termo.'),
                F('Novo aluno', 'Cadastro com responsável quando menor; CPF já cadastrado adiciona o papel', 'ok', 'ok'),
                F('Ficha · Dados', 'Identificação e contato', 'ok', 'ok'),
                F('Ficha · Dados', 'Quem paga e endereço', 'ok', 'ok'),
                F('Ficha · Responsáveis', 'Legal, Financeiro e Emergência: incluir, alterar e remover', 'ok', 'ok'),
                F('Ficha · Vendas', 'As vendas do aluno', 'falta', 'falta', 'Depende de Vendas.'),
              ],
              fora: ['Acompanhamento', 'Ocorrências', 'SPC'],
            },
            {
              id: 'responsaveis', nome: 'Responsáveis', prototipo: ['responsaveis.html', 'responsavel.html'], web: '/:slug/responsaveis',
              webSituacao: 'Em construção', liga: ['alunos'],
              features: [
                F('Lista', 'Responsáveis Legal, Financeiro e de Emergência', 'falta', 'falta', 'Não há busca de responsáveis; eles só aparecem dentro do aluno.'),
                F('Ficha · Dados', 'Dados do responsável', 'falta', 'parcial', 'Alterados pela ficha de cada aluno.'),
                F('Ficha · Alunos', 'Os alunos pelos quais responde', 'falta', 'falta', 'Na API o responsável pertence a um só aluno (irmãos repetem o mesmo); a lista e esta aba pedem mudar o modelo, não só abrir uma rota.'),
              ],
            },
            {
              id: 'empresas', nome: 'Empresas', prototipo: ['empresas.html', 'empresa.html'], web: '/:slug/empresas',
              webSituacao: 'Em construção', liga: ['vendas'],
              features: [
                F('Lista', 'Empresas que alimentam contrato, boleto e NF', 'falta', 'falta'),
                F('Ficha · Dados', 'Dados da empresa', 'falta', 'falta'),
                F('Ficha · Contatos', 'Contatos da empresa', 'falta', 'falta'),
                F('Ficha · Vendas', 'As vendas da empresa', 'falta', 'falta'),
                F('Ficha · Alunos', 'Os alunos da empresa', 'falta', 'falta'),
                F('Ficha', 'Marcar devedor (saiu do aluno, a confirmar)', 'falta', 'falta'),
              ],
              fora: ['SPC'],
            },
            {
              id: 'modelos-contrato', nome: 'Modelos de contrato', prototipo: ['modelos-contrato.html', 'modelo-contrato.html'],
              webSituacao: 'Fora do menu do web', liga: ['vendas', 'centros-receita'],
              features: [
                F('Lista', 'Um modelo padrão e um por centro de receita', 'falta', 'falta'),
                F('Modelo', 'Texto com campos do aluno, da turma e do pagamento', 'falta', 'falta'),
                F('Modelo', 'Pré-visualização com uma venda real', 'falta', 'falta'),
              ],
            },
          ],
        },
        {
          id: 'pedagogico', nome: 'Pedagógico',
          telas: [
            {
              id: 'cursos', nome: 'Cursos', prototipo: ['cursos.html', 'curso.html'], web: '/:slug/cursos',
              webSituacao: 'Em construção',
              endpoints: ['POST /v1/courses/search', 'GET /v1/courses/areas', 'POST /v1/courses', 'GET /v1/courses/{id}', 'PUT /v1/courses/{id}', 'POST /v1/courses/{id}/deactivate', 'POST /v1/courses/{id}/reactivate'],
              features: [
                F('Lista', 'Busca e modalidade, sem indicadores de receita e margem', 'falta', 'ok'),
                F('Novo curso', 'Nome, sigla, área, modalidades, carga e valor de referência', 'falta', 'ok'),
                F('Dados gerais', 'Inativar e reativar', 'falta', 'ok'),
                F('Conteúdo', 'Módulos e tópicos', 'falta', 'parcial', 'A API tem módulos com horas; faltam os tópicos.'),
                F('Requisitos', 'Lista de softwares para o aluno instalar', 'falta', 'falta'),
              ],
              fora: ['Indicadores de receita e margem', 'Certificado', 'Sala e máquina'],
            },
            {
              id: 'formacoes', nome: 'Formações', prototipo: ['formacoes.html', 'formacao.html'], web: '/:slug/formacoes',
              webSituacao: 'Em construção',
              endpoints: ['POST /v1/programs/search', 'POST /v1/programs', 'GET /v1/programs/{id}', 'PUT /v1/programs/{id}', 'PUT /v1/programs/{id}/sequence', 'PUT /v1/programs/{id}/schedule', 'POST /v1/programs/{id}/activation/preview', 'POST /v1/programs/{id}/activation', 'POST /v1/programs/{id}/schedule-changes/preview', 'POST /v1/programs/{id}/schedule-changes', 'POST /v1/programs/{id}/deactivate', 'POST /v1/programs/{id}/reactivate'],
              liga: ['cursos', 'turmas'],
              features: [
                F('Lista', 'Busca, sem os indicadores do topo', 'falta', 'ok'),
                F('Dados gerais', 'Código, nome e descrição', 'falta', 'ok'),
                F('Cursos', 'Sequência dos cursos, obrigatórios e optativos', 'falta', 'ok'),
                F('Agenda', 'Agenda, início e prévia da linha do tempo', 'falta', 'ok'),
                F('Agenda', 'Ativação, que abre as turmas, e mudança de agenda', 'falta', 'ok'),
                F('Dados gerais', 'Inativar e reativar', 'falta', 'ok'),
              ],
              fora: ['Indicadores do topo', 'Certificado da formação'],
            },
            {
              id: 'turmas', nome: 'Turmas', prototipo: ['turmas.html', 'turma.html'], web: '/:slug/turmas',
              webSituacao: 'Em construção', integracoes: ['meet'],
              endpoints: ['POST /v1/classes/search', 'POST /v1/classes/course-options/search', 'POST /v1/classes/instructor-options/search', 'POST /v1/classes', 'GET /v1/classes/{id}', 'PUT /v1/classes/{id}', 'PUT /v1/classes/{id}/settings', 'POST /v1/classes/{id}/meeting-cancellations/preview', 'POST /v1/classes/{id}/meeting-cancellations', 'POST /v1/classes/{id}/meeting-restorations/preview', 'POST /v1/classes/{id}/meeting-restorations', 'POST /v1/classes/{id}/cancellation/preview', 'POST /v1/classes/{id}/cancellation', 'POST /v1/classes/{id}/reopening/preview', 'POST /v1/classes/{id}/reopening', 'POST /v1/classes/{id}/schedule-changes/preview', 'POST /v1/classes/{id}/schedule-changes'],
              liga: ['formacoes', 'feriados', 'materiais-coord', 'centros-receita'],
              features: [
                F('Lista', 'Busca e filtros, sem indicadores nem risco', 'falta', 'ok'),
                F('Cadastro', 'Turma avulsa: curso, modalidade, agenda, vagas, local e instrutor', 'falta', 'ok'),
                F('Aulas', 'Aulas geradas pela agenda até a carga do curso', 'falta', 'ok'),
                F('Aulas', 'Feriados ficam de fora ao gerar as aulas', 'falta', 'falta', 'A API cancela os encontros de um período (de–até), mas não há cadastro de feriados.'),
                F('Aulas', 'Cancelar e desfazer encontros; cancelar e reabrir a turma', 'falta', 'ok'),
                F('Aulas', 'Link do Google Meet de cada aula', 'falta', 'falta'),
                F('Requisitos', 'Lista de softwares, a mesma do portal do aluno', 'falta', 'falta'),
                F('Cadastro', 'Centro de receita da turma', 'falta', 'falta'),
              ],
              fora: ['Presenças', 'Dossiês', 'Avaliações', 'Indicadores de risco', 'Fórum da turma'],
            },
            {
              id: 'materiais-coord', nome: 'Materiais das aulas', prototipo: ['turma.html'], web: '/:slug/turmas',
              webSituacao: 'Na aba Aulas da turma, ainda em construção', integracoes: ['arquivos'],
              liga: ['turmas', 'prof-materiais', 'aluno-materiais'],
              features: [
                F('Aba Aulas', 'Quantos materiais cada aula tem e o que falta liberar', 'falta', 'falta'),
                F('Painel da aula', 'Cadastrar, liberar, editar e remover materiais', 'falta', 'falta'),
                F('Painel da aula', 'Ver o que o professor cadastrou', 'falta', 'falta'),
                F('Perfis', 'Permissão "Cadastrar e liberar os materiais das aulas"', 'falta', 'falta'),
              ],
            },
            {
              id: 'feriados', nome: 'Feriados', prototipo: ['feriados.html'], webSituacao: 'Fora do menu do web',
              liga: ['turmas', 'aluno-calendario'],
              features: [
                F('Tela', 'Calendário do ano e lista', 'falta', 'falta'),
                F('Tela', 'Cadastrar, alterar e remover feriado', 'falta', 'falta'),
                F('Tela', 'Copiar os feriados de outro ano', 'falta', 'falta'),
              ],
            },
          ],
        },
        {
          id: 'financeiro', nome: 'Financeiro',
          telas: [
            {
              id: 'financeiro', nome: 'Financeiro', prototipo: ['financeiro.html'], webSituacao: 'Fora do menu do web',
              integracoes: ['asaas', 'nf'], liga: ['vendas', 'centros-custo', 'centros-receita', 'contas-bancarias'],
              features: [
                F('Contas', 'A receber', 'falta', 'falta'),
                F('Contas', 'A pagar', 'falta', 'falta', 'Sem compras na V1; o "a pagar" dos instrutores está em discussão.'),
                F('Contas', 'Pagar × receber', 'falta', 'falta'),
                F('Asaas', 'Conciliação', 'falta', 'falta'),
                F('Asaas', 'Extrato', 'falta', 'falta'),
                F('Asaas', 'Saque automático', 'falta', 'falta'),
                F('NF', 'Emissão de NF pelas regras da reunião', 'falta', 'falta', 'Regras ainda não detalhadas.'),
              ],
            },
            {
              id: 'contas-bancarias', nome: 'Contas bancárias', prototipo: ['contas-bancarias.html', 'conta-bancaria.html'],
              webSituacao: 'Fora do menu do web', integracoes: ['asaas'],
              features: [
                F('Lista', 'Contas da escola', 'falta', 'falta'),
                F('Ficha', 'Homologação da conta no Asaas, usada nos links de pagamento', 'falta', 'falta'),
              ],
            },
            {
              id: 'centros-custo', nome: 'Centros de custo', prototipo: ['centros-custo.html'], webSituacao: 'Fora do menu do web',
              features: [
                F('Tela', 'Criar e agrupar os centros de custo (departamentos)', 'falta', 'falta', 'Os departamentos do colaborador não são centros de custo.'),
              ],
            },
            {
              id: 'centros-receita', nome: 'Centros de receita', prototipo: ['centros-receita.html'], webSituacao: 'Fora do menu do web',
              liga: ['vendas', 'turmas'],
              features: [
                F('Tela', 'Criar e agrupar os centros (B2B, B2C, Orion)', 'falta', 'falta'),
                F('Tela', 'Recebido e a receber de cada centro', 'falta', 'falta'),
              ],
            },
          ],
        },
        {
          id: 'pessoas', nome: 'Pessoas',
          telas: [
            {
              id: 'instrutores', nome: 'Instrutores', prototipo: ['instrutores.html', 'instrutor.html'], web: '/:slug/instrutores',
              webSituacao: 'Em construção',
              endpoints: ['POST /v1/instructors/search', 'POST /v1/instructors', 'PUT /v1/instructors/{id}', 'GET /v1/instructors/{id}', 'PUT /v1/instructors/{id}/identification', 'PUT /v1/instructors/{id}/contact', 'PUT /v1/instructors/{id}/notes', 'POST /v1/instructors/{id}/deactivation', 'POST /v1/instructors/{id}/reactivation', 'PUT /v1/instructors/{id}/unit-membership', 'DELETE /v1/instructors/{id}/unit-membership'],
              liga: ['convite-cadastro', 'turmas'],
              features: [
                F('Lista', 'Busca, remuneração e recortes por pendência', 'falta', 'ok'),
                F('Novo instrutor', 'Cadastro; CPF já cadastrado adiciona o papel', 'falta', 'ok'),
                F('Convite', 'Convidar instrutor: nome, e-mail, remuneração e perfil', 'falta', 'falta', 'AULOR-007.'),
                F('Convite', 'Convidados na lista, com selo, Reenviar e Cancelar', 'falta', 'falta'),
                F('Ficha · Dados', 'Enviar convite a quem não tem usuário', 'falta', 'falta'),
                F('Ficha · Dados', 'Identificação, contato e observações', 'falta', 'ok'),
                F('Ficha · Dados', 'Inativar e reativar', 'falta', 'ok'),
                F('Ficha · Dados', 'Pendências: nascimento, e-mail, WhatsApp e acesso', 'falta', 'ok'),
                F('Ficha · Dados', 'Ligação com o usuário de acesso', 'falta', 'ok'),
              ],
              fora: ['Calendário', 'Empresa e valor hora', 'Contratos', 'Pagamentos', 'Documentos'],
            },
            {
              id: 'colaboradores', nome: 'Colaboradores', prototipo: ['colaboradores.html', 'colaborador.html'], web: '/:slug/colaboradores',
              webSituacao: 'Em construção',
              endpoints: ['POST /v1/staff/search', 'GET /v1/staff/departments', 'POST /v1/staff', 'PUT /v1/staff/{id}', 'GET /v1/staff/{id}','PUT /v1/staff/{id}/personal-details', 'PUT /v1/staff/{id}/contact', 'PUT /v1/staff/{id}/position', 'PUT /v1/staff/{id}/notes', 'POST /v1/staff/{id}/leave', 'POST /v1/staff/{id}/return', 'POST /v1/staff/{id}/dismissal', 'POST /v1/staff/{id}/readmission', 'PUT /v1/staff/{id}/unit-membership', 'DELETE /v1/staff/{id}/unit-membership', 'POST /v1/invitations'],
              liga: ['perfis', 'convite-cadastro'],
              features: [
                F('Lista', 'Busca, departamento e recortes (afastados, desligados, com pendência)', 'falta', 'ok'),
                F('Novo colaborador', 'Cadastro; CPF já cadastrado adiciona o papel', 'falta', 'ok'),
                F('Convite', 'Convidar colaborador: cargo, departamento, admissão e perfil', 'falta', 'falta', 'AULOR-007.'),
                F('Convite', 'Convidados na lista, com selo, Reenviar e Cancelar', 'falta', 'falta'),
                F('Ficha', 'Dados pessoais, contato, cargo e observações', 'falta', 'ok'),
                F('Ficha', 'Afastamento, desligamento e readmissão', 'falta', 'ok'),
                F('Ficha', 'Usuário de acesso: vínculo com a unidade', 'falta', 'ok'),
                F('Ficha', 'Enviar convite a quem não tem usuário, que liga no aceite', 'falta', 'falta', 'AULOR-007; hoje o web só confirma o convite e não emite.'),
              ],
            },
          ],
        },
        {
          id: 'configuracoes', nome: 'Configurações',
          telas: [{
            id: 'perfis', nome: 'Perfis de acesso', prototipo: ['perfis.html', 'perfil.html'], web: '/:slug/perfis-de-acesso',
            webArquivos: ['access-profiles/access-profiles.ts', 'access-profiles/access-profile.ts', 'access-profiles/catalog.ts', 'access-profiles/permissions-matrix.ts', 'access-profiles/members-matrix.ts', 'access-profiles/additional-permissions.ts', 'access-profiles/profile-members.ts', 'access-profiles/add-member-dialog.ts'],
            endpoints: ['GET /v1/users/me/context', 'GET /v1/access/profiles', 'POST /v1/access/profiles', 'GET /v1/access/profiles/{id}', 'PUT /v1/access/profiles/{id}', 'POST /v1/access/profiles/{id}/activate', 'POST /v1/access/profiles/{id}/deactivate', 'DELETE /v1/access/profiles/{id}', 'POST /v1/access/members/search', 'GET /v1/access/members/{id}', 'PUT /v1/access/members/{id}/permissions/{permission}', 'DELETE /v1/access/members/{id}/permissions/{permission}', 'PUT /v1/access/members/{id}/profiles/{profileId}', 'DELETE /v1/access/members/{id}/profiles/{profileId}'],
            liga: ['colaboradores', 'alunos', 'vendas'],
            features: [
              F('Lista e perfil', 'Perfis: novo, renomear, inativar, reativar e excluir', 'ok', 'ok'),
              F('Matriz', 'Permissões × perfis', 'ok', 'ok'),
              F('Matriz', 'Usuários × perfis e permissões adicionais', 'ok', 'ok'),
              F('Perfil', 'Usuários do perfil', 'ok', 'ok'),
              F('Catálogo', 'Permissões de todas as telas da V1', 'parcial', 'parcial', 'API: usuários, perfis, alunos, colaboradores, instrutores, cursos, formações e turmas. Web: formações e turmas caem em "Outras", com a chave crua.'),
              F('Vendedor externo', 'Vê só as próprias vendas, confirma os alunos dele e não acessa Alunos', 'falta', 'falta', 'Depende de Vendas; a definir a relação com o perfil Comercial e se ele vê só turmas específicas.'),
            ],
          }],
        },
      ],
    },

    {
      id: 'aluno', nome: 'Portal do aluno', portal: true, descricao: 'O aluno acompanha cursos, aulas, materiais e pagamentos',
      grupos: [
        {
          id: 'aluno-inicio', nome: 'Início',
          telas: [{
            id: 'aluno-home', nome: 'Início', prototipo: ['portal-aluno/home.html'],
            features: [
              F('Tela', 'Próximas aulas e o que espera o aluno', 'falta', 'falta'),
              F('Tela', 'Menus da V1 e Cursos EAD, que leva à Toolzz', 'falta', 'na'),
            ],
            fora: ['Gravações', 'Certificados', 'Suporte', 'Blocos de avaliações e gravações'],
          }],
        },
        {
          id: 'estudos', nome: 'Estudos',
          telas: [
            {
              id: 'aluno-cursos', nome: 'Meus cursos', prototipo: ['portal-aluno/cursos.html', 'portal-aluno/curso.html'],
              liga: ['cursos', 'turmas'],
              features: [
                F('Lista', 'Cursos e turmas do aluno', 'falta', 'falta', 'Não há matrícula nem acesso do aluno na API.'),
                F('Curso', 'Visão geral e conteúdo', 'falta', 'falta'),
                F('Curso · Aulas', 'Aulas futuras, com o material bloqueado até a liberação', 'falta', 'parcial', 'A turma já tem as aulas, mas só para a equipe.'),
                F('Curso', 'Materiais e requisitos: lista de softwares', 'falta', 'falta'),
              ],
              fora: ['Aba Certificado'],
            },
            {
              id: 'aluno-aulas', nome: 'Aulas', prototipo: ['portal-aluno/aulas.html', 'portal-aluno/aula.html'], integracoes: ['meet'],
              features: [
                F('Lista', 'Aulas do aluno, sem presença, avaliação e gravação', 'falta', 'falta'),
                F('Aula', 'Materiais liberados e o link da sala', 'falta', 'falta'),
              ],
            },
            {
              id: 'aluno-calendario', nome: 'Calendário', prototipo: ['portal-aluno/calendario.html'], liga: ['feriados'],
              features: [
                F('Tela', 'Aulas e feriados', 'falta', 'falta'),
              ],
            },
            {
              id: 'aluno-materiais', nome: 'Materiais', prototipo: ['portal-aluno/materiais.html'], integracoes: ['arquivos'],
              liga: ['materiais-coord', 'prof-materiais'],
              features: [
                F('Tela', 'Materiais por aula, com "Ainda não liberado" ou a data marcada', 'falta', 'falta'),
                F('Tela', 'Download por link assinado', 'falta', 'falta'),
              ],
            },
          ],
        },
        {
          id: 'secretaria', nome: 'Secretaria',
          telas: [
            {
              id: 'aluno-financeiro', nome: 'Financeiro', prototipo: ['portal-aluno/financeiro.html'], integracoes: ['asaas'],
              liga: ['financeiro'],
              features: [
                F('Tela', 'Parcelas e o link de pagamento de cada uma', 'falta', 'falta'),
                F('Tela', 'Parcela vencida não bloqueia as aulas', 'falta', 'falta'),
              ],
            },
            {
              id: 'aluno-contratos', nome: 'Contratos', prototipo: ['portal-aluno/contratos.html', 'portal-aluno/contrato.html'],
              integracoes: ['clicksign'], liga: ['vendas'],
              features: [
                F('Lista', 'Contratos do aluno', 'falta', 'falta'),
                F('Contrato', 'Documento e assinatura', 'falta', 'falta'),
              ],
            },
          ],
        },
        {
          id: 'conta', nome: 'Conta',
          telas: [{
            id: 'aluno-dados', nome: 'Meus dados', prototipo: ['portal-aluno/meus-dados.html'], liga: ['alunos'],
            features: [
              F('Tela', 'Dados pessoais, contato e endereço', 'falta', 'parcial', 'A ficha existe para a equipe; falta a leitura pelo próprio aluno.'),
              F('Tela', 'Responsáveis', 'falta', 'parcial', 'Idem.'),
            ],
          }],
        },
      ],
    },

    {
      id: 'professor', nome: 'Portal do professor', portal: true, descricao: 'O professor vê as turmas e cadastra os materiais',
      grupos: [{
        id: 'prof', nome: 'Turmas',
        telas: [
          {
            id: 'prof-turmas', nome: 'Minhas turmas', prototipo: ['portal-professor/turmas.html', 'portal-professor/turma.html'],
            integracoes: ['meet'], liga: ['turmas'],
            features: [
              F('Lista', 'Turmas do professor', 'falta', 'parcial', 'A busca de turmas filtra por instrutor, mas só para a equipe.'),
              F('Turma', 'Aulas da turma', 'falta', 'parcial', 'Idem.'),
              F('Turma', 'Requisitos: lista de softwares', 'falta', 'falta'),
            ],
            fora: ['Calendário', 'Avaliações', 'Dossiês', 'Pagamentos', 'Contratos'],
          },
          {
            id: 'prof-materiais', nome: 'Materiais das aulas', prototipo: ['portal-professor/turma.html'], integracoes: ['arquivos'],
            liga: ['materiais-coord', 'aluno-materiais'],
            features: [
              F('Aula', 'Cadastrar material (arquivo ou link)', 'falta', 'falta'),
              F('Aula', 'Escolher quando liberar: já, numa data ou depois', 'falta', 'falta'),
            ],
          },
        ],
      }],
    },
  ],
};

// A Entrada é a porta dos três portais: fica acima deles no mapa, ligada a cada um.
IMPLEMENTACAO.entrada = {
  id: 'entrada', nome: 'Entrada', prototipo: ['entrar.html'], web: '/-',
  webArquivos: ['session.ts', 'entry/entry.guard.ts', 'entry/callback.ts', 'entry/invitation.guard.ts', 'entry/invitation.ts', 'entry/signed-out.ts'],
  endpoints: ['GET /v1/users/me', 'GET /v1/users/me/context', 'POST /v1/invitations/confirmations', 'GET /v1/people/me/roles'],
  integracoes: ['auth0'],
  features: [
    F('Login', 'Login pelo Auth0 e saída', 'ok', 'ok'),
    F('Login', 'Escolha da instituição e da unidade', 'ok', 'ok'),
    F('Login', 'Escolha do portal: administrativo, aluno ou professor', 'falta', 'parcial', 'GET /v1/people/me/roles só responde a quem tem vínculo com a unidade (colaborador ou instrutor); o aluno não tem vínculo nem convite. O administrativo sai das permissões de /users/me/context.'),
    F('Primeiro acesso', 'Convite da equipe', 'ok', 'ok'),
    F('Primeiro acesso', 'Acesso do aluno', 'falta', 'falta', 'O aluno não tem usuário na API.'),
    F('Primeiro acesso', 'Acesso do professor', 'falta', 'parcial', 'O instrutor já se liga a um usuário da unidade.'),
    F('Senha', 'Recuperação de senha', 'parcial', 'na', 'Fica com o "Esqueceu a senha?" do Auth0, na conexão de e-mail e senha; falta conferir no tenant.'),
  ],
};
