# Escopo da V1 no protótipo

Como cada decisão do documento "Aulor – Escopo da primeira versão (V1)" (26/10/2026) ficou neste protótipo. O que não aparece aqui ficou como no `snorlax-jornada`.

## Administrativo

| Área | Telas | Como ficou |
|---|---|---|
| Vendas | `contratos.html`, `contrato.html` | Lista com indicadores, filtros, Por turma e Próximo passo. Nova venda por link: o vendedor não informa o cliente, o aluno se cadastra pelo link do pacote, e o vendedor vem de quem está logado. Centro de receita obrigatório no lançamento. Resumo com a trava de NF pelo aceite do termo e o Adm OK; Pacotes e alunos; Cobrança sem "Simular rescisão"; Documentos com contrato (do modelo), Clicksign e NF; Histórico só consulta |
| Modelos de contrato (novo) | `modelos-contrato.html`, `modelo-contrato.html` | Texto com campos preenchidos pelos dados reais do aluno, da turma e do pagamento; modelo por centro de receita e um padrão; pré-visualização com uma venda real |
| Cursos | `cursos.html`, `curso.html` | Sem indicadores de receita e margem; sem associação de certificado; Conteúdo com módulos e tópicos; Requisitos só com a lista de softwares |
| Formações | `formacoes.html`, `formacao.html` | Sem indicadores do topo; Cursos define a sequência; sem o cartão Certificado da formação |
| Turmas e Feriados | `turmas.html`, `turma.html`, `feriados.html` | Sem indicadores nem risco. Turma com cadastro, aulas e requisitos; ao gerar as aulas, os feriados ficam de fora e há a opção de criar o link do Google Meet de cada aula; centro de receita da turma. Sem presenças, dossiês e avaliações |
| Materiais das aulas (novo) | `materiais.html` | A coordenação vê o que os professores cadastraram, por turma e aula, e também cadastra e libera |
| Alunos, Responsáveis e Empresas | `alunos.html`, `aluno.html`, `responsaveis.html`, `responsavel.html`, `empresas.html`, `empresa.html` | Aluno com Dados, Responsáveis e Vendas; empresa com Dados, Contatos, Vendas e Alunos; responsável com Dados e Alunos. Sem Acompanhamento, Ocorrências e SPC |
| Financeiro | `financeiro.html`, `contas-bancarias.html`, `conta-bancaria.html` | Contas (a receber, a pagar, pagar × receber), Conciliação Asaas, Extrato, Saque automático e NF. Contas bancárias para a homologação do Asaas |
| Centros de custo | `centros-custo.html` | Cria e agrupa os centros de custo (departamentos) das despesas |
| Centros de receita | `centros-receita.html` | Cria e agrupa os centros de receita (B2B, B2C, Orion), escolhidos no lançamento da venda e na turma; as parcelas da venda levam o centro, e a tela mostra o recebido e o a receber de cada um |
| Pessoas | `instrutores.html`, `instrutor.html`, `colaboradores.html`, `colaborador.html` | Instrutor com cadastro (e cadastro pelo link) e só a aba Dados; colaboradores como equipe e usuários |
| Perfis de acesso | `perfis.html`, `perfil.html` | Catálogo das telas da V1 e o perfil Vendedor externo, que vê só as vendas dele, confirma os alunos pelos quais responde e não acessa Alunos |
| Entrada (nova) | `entrar.html` | Primeiro a escolha do portal (administrativo, aluno ou professor), depois login, primeiro acesso e recuperação de senha naquele portal |

## Portais

Os dois portais usam o shell e os papéis do `DESIGN.md` do aulor-web, os mesmos do administrativo (sidebar e barra de contexto em azul profundo, Atkinson Hyperlegible Next, cartões brancos sobre o fundo frio). O "hoje" vai em petróleo e o cobre fica só no que espera a pessoa. As telas são as do `snorlax-jornada`, recortadas para a V1.

| Portal | Como ficou |
|---|---|
| Aluno (`portal-aluno/`) | Início, Meus cursos, Aulas, Calendário, Materiais, Financeiro, Contratos, Meus dados e Cursos EAD (leva à Toolzz). Sem Gravações, Certificados e Suporte, nem os blocos de avaliações e gravações. O curso mostra também as aulas futuras, bloqueadas até o professor liberar os materiais; em Materiais e requisitos, só a lista de softwares (sem máquina e sala) |
| Professor (`portal-professor/`) | Minhas turmas e o cadastro dos materiais de cada aula, com a escolha de quando liberar. Requisitos da turma só com a lista de softwares, como no curso (sem máquina e sala). Sem Calendário, Avaliações, Dossiês, Pagamentos e Contratos |

## Simulado no protótipo

Asaas, emissor de NF, Clicksign e Google Meet não estão integrados: os botões registram o que aconteceria. O material da aula guarda só o nome do arquivo (na V1 real, armazenamento privado com links assinados). Login e permissões só demonstram, no navegador; na V1 real, o back-end autentica e aplica as permissões.

## Pontos em aberto

- **Vendedor externo vendo só turmas específicas:** viabilidade a verificar (o documento remete a "Pontos a definir"); hoje ele vê só as vendas dele.
- **Perfil Comercial × Vendedor externo:** a relação está a definir; são perfis separados.
- **Regras de NF:** ficou o que o protótipo tinha; as regras da reunião ainda não estão detalhadas.
- **Marcar devedor:** saiu do aluno (a marcação existente só aparece) e ficou na empresa, que só perdeu a aba SPC. Confirmar.
- **Aulas da turma:** geram uma vez, com ou sem Meet; não há regerar nem incluir o Meet depois. Dia de feriado fica de fora (não vira aula cancelada).
- **Compras:** fora da V1, então as contas a pagar de compras não aparecem no Financeiro.
- **Pendências do instrutor:** valor hora, antecedentes e LGPD ainda aparecem como pendência, mas só o cadastro pelo link resolve parte delas.
