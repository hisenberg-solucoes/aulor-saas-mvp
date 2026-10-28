# Escopo da V1 no protótipo

Como cada decisão do documento "Aulor – Escopo da primeira versão (V1)" (26/10/2026) ficou neste protótipo. O que não aparece aqui ficou como no `snorlax-jornada`.

## Administrativo

| Área | Telas | Como ficou |
|---|---|---|
| Vendas | `contratos.html`, `contrato.html` | Lista com indicadores, filtros, Por turma e Próximo passo. Nova venda por link: o vendedor não informa o cliente, o aluno se cadastra pelo link do pacote, e o vendedor vem de quem está logado. Centro de receita obrigatório no lançamento. Resumo com a trava de NF pelo aceite do termo e o Adm OK; Pacotes e alunos; Cobrança sem "Simular rescisão"; Documentos com contrato (do modelo), Clicksign e NF; Histórico só consulta |
| Modelos de contrato (novo) | `modelos-contrato.html`, `modelo-contrato.html` | Texto com campos preenchidos pelos dados reais do aluno, da turma e do pagamento; modelo por centro de receita e um padrão; pré-visualização com uma venda real |
| Cursos | `cursos.html`, `curso.html` | Sem indicadores de receita e margem; sem associação de certificado; só as abas Dados gerais, Conteúdo programático e Requisitos (saem Material didático e Onde é oferecido). Dados gerais sem pré-requisitos em texto livre, "Como é vendido" e "Site da ProWay"; Área em texto livre e opcional, com sugestões das já usadas (como na API, sem cadastro de áreas), e sem Eixo; Conteúdo com módulos e tópicos; Requisitos só com a lista de softwares, sem cursos pré-requisito e sem instrutores habilitados: a turma aceita qualquer instrutor |
| Formações | `formacoes.html`, `formacao.html` | Sem indicadores do topo; Cursos define a sequência, sem carga por eixo nem visão por eixo; Área em texto livre, como no curso; sem o cartão Certificado da formação |
| Turmas e Feriados | `turmas.html`, `turma.html`, `feriados.html` | Sem indicadores nem risco. Turma com cadastro, aulas e requisitos; ao gerar as aulas, os feriados ficam de fora e há a opção de criar o link do Google Meet de cada aula; centro de receita da turma. Sem presenças, dossiês e avaliações |
| Materiais das aulas (novo) | `turma.html`, aba Aulas | Sem tela própria: a lista de aulas da turma mostra quantos materiais cada aula tem e o que ainda não foi liberado; a aula abre num painel com os materiais, onde a coordenação vê o que o professor cadastrou e também cadastra, libera, edita e remove. Permissão na tela Turmas (Cadastrar e liberar os materiais das aulas) |
| Alunos, Responsáveis e Empresas | `alunos.html`, `aluno.html`, `responsaveis.html`, `responsavel.html`, `empresas.html`, `empresa.html` | Aluno com Dados, Responsáveis e Vendas; empresa com Dados, Contatos, Vendas e Alunos; responsável com Dados e Alunos. Sem Acompanhamento, Ocorrências e SPC |
| Financeiro | `financeiro.html`, `contas-bancarias.html`, `conta-bancaria.html` | Contas (a receber, a pagar, pagar × receber), Conciliação Asaas, Extrato, Saque automático e NF. Contas bancárias para a homologação do Asaas |
| Centros de custo | `centros-custo.html` | Cria e agrupa os centros de custo (departamentos) das despesas |
| Centros de receita | `centros-receita.html` | Cria e agrupa os centros de receita (B2B, B2C, Orion), escolhidos no lançamento da venda e na turma; as parcelas da venda levam o centro, e a tela mostra o recebido e o a receber de cada um |
| Pessoas | `instrutores.html`, `instrutor.html`, `colaboradores.html`, `colaborador.html` | Instrutor com cadastro e só a aba Dados; colaboradores como equipe e usuários. As duas fichas têm o cartão Acesso ao sistema |
| Convite de cadastro (AULOR-007) | `instrutores.html`, `colaboradores.html`, as duas fichas e `convite.html` | "Convidar instrutor" (nome, e-mail, remuneração e perfil) e "Convidar colaborador" (nome, e-mail, cargo, departamento, admissão e perfil). O convite fica no filtro Convidados, com selo (enviando, falha no envio, enviado, expirado em 7 dias, aguardando cadastro, cadastro pela coordenação), Reenviar e Cancelar; ninguém vira instrutor ou colaborador antes de enviar o cadastro. A pessoa entra com o e-mail convidado e completa CPF, nascimento, nome social e contato; o CPF que o acesso não prova vai para a coordenação, sem revelar ninguém. Na ficha de quem não tem usuário, "Enviar convite" liga a pessoa ao acesso no aceite. Acesso nasce só de convite: saíram o link público do instrutor (com endereço, empresa, antecedentes e LGPD) e o "Criar usuário de acesso" |
| Perfis de acesso | `perfis.html`, `perfil.html` | Catálogo das telas da V1 e o perfil Vendedor externo, que vê só as vendas dele, confirma os alunos pelos quais responde e não acessa Alunos |
| Entrada (nova) | `entrar.html` | Primeiro a escolha do portal (administrativo, aluno ou professor), depois login, primeiro acesso e recuperação de senha naquele portal |

## Portais

Os dois portais usam o shell e os papéis do `DESIGN.md` do aulor-web, os mesmos do administrativo (sidebar e barra de contexto em azul profundo, Atkinson Hyperlegible Next, cartões brancos sobre o fundo frio). O "hoje" vai em petróleo e o cobre fica só no que espera a pessoa. As telas são as do `snorlax-jornada`, recortadas para a V1.

| Portal | Como ficou |
|---|---|
| Aluno (`portal-aluno/`) | Início, Meus cursos, Aulas, Calendário, Materiais, Financeiro, Contratos, Meus dados e Cursos EAD (leva à Toolzz). Sem Gravações, Certificados e Suporte, nem os blocos de avaliações e gravações. O curso mostra também as aulas futuras; o material de cada aula aparece quando o professor libera, e até lá a aula diz "Ainda não liberado" ou a data marcada, do mesmo jeito na aba Aulas do curso, em Aulas e no detalhe da aula. Em Materiais e requisitos, só a lista de softwares (sem máquina e sala), os materiais das aulas e o público-alvo; não há materiais do curso, só os das aulas, também na tela Materiais. Calendário só com aulas e feriados: os eventos do protótipo (palestras, workshops e inscrições) não estão no documento nem têm cadastro na V1. Parcela vencida não bloqueia as aulas |
| Professor (`portal-professor/`) | Minhas turmas e o cadastro dos materiais de cada aula, com a escolha de quando liberar. Requisitos da turma só com a lista de softwares, como no curso (sem máquina e sala). Sem Calendário, Avaliações, Dossiês, Pagamentos e Contratos |

## Simulado no protótipo

Asaas, emissor de NF, Clicksign e Google Meet não estão integrados: os botões registram o que aconteceria. O e-mail do convite de cadastro não sai: "Abrir como o convidado", no convite, faz o papel do link do e-mail. Convidar exige Cadastrar (ou Editar, na ficha) do papel e Editar em Perfis de acesso, que no protótipo faz as vezes de Convidar usuários e Gerenciar perfis. O material da aula guarda só o nome do arquivo (na V1 real, armazenamento privado com links assinados). Login e permissões só demonstram, no navegador; na V1 real, o back-end autentica e aplica as permissões.

## Pontos em aberto

- **Vendedor externo vendo só turmas específicas:** viabilidade a verificar (o documento remete a "Pontos a definir"); hoje ele vê só as vendas dele.
- **Perfil Comercial × Vendedor externo:** a relação está a definir; são perfis separados.
- **Regras de NF:** ficou o que o protótipo tinha; as regras da reunião ainda não estão detalhadas.
- **Marcar devedor:** saiu do aluno (a marcação existente só aparece) e ficou na empresa, que só perdeu a aba SPC. Confirmar.
- **Aulas da turma:** geram uma vez, com ou sem Meet; não há regerar nem incluir o Meet depois. Dia de feriado fica de fora (não vira aula cancelada).
- **Compras:** fora da V1, então as contas a pagar de compras não aparecem no Financeiro.
- **Pendências do instrutor:** valor hora e antecedentes ainda aparecem como pendência e não se resolvem na V1 (ficam com contratos e pagamentos, D11 de AULOR-005); o aceite LGPD saiu com o link (D15 de AULOR-007). A ficha ainda mostra endereço, contato de emergência, tag e empresa do `snorlax-jornada`, que o AULOR-005 também deixa para contratos e pagamentos.
