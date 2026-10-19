# Backlog inicial: do protótipo ao SaaS

O backend (`../Aulor`) tem hoje só o contexto **Platform** implementado: tenant, unidade, vínculos, convites, perfis com permissões adicionais e auditoria. Os demais contextos estão como `candidate` no context map. Os itens abaixo usam esses nomes.

## Obrigatório para o primeiro cliente pagante

**Platform (estender o que já existe)**
- Catálogo de permissões do MVP no `PermissionCatalog`: `alunos.*`, `matriculas.*`, `turmas.*`, `receber.*`, `pagar.*`, `frequencia.*`, `minhas-aulas.*`, `certificados.*`, `configuracoes.*`, mais os perfis padrão (Administrador protegido, Secretaria, Financeiro, Coordenação, Professor).
- Login, convite por e-mail e escolha de senha. O professor precisa de acesso pelo celular (web responsiva; PWA opcional).
- Plano e módulos habilitados por tenant (feature flags lidos do catálogo comercial), configurados manualmente pela equipe Aulor.
- Auditoria das ações sensíveis: cancelamento de matrícula, estorno, emissão e cancelamento de certificado, mudança de perfil.

**Academics:** cursos (carga, modalidade, módulos opcionais, valor de referência, nota mínima opcional), turmas (agenda → aulas até a carga horária, instrutor, vagas) e instrutores.

**People (Pessoas):** pessoa uma vez só, com os papéis de equipe (colaborador: cargo, admissão, afastamento, desligamento, vínculo com o usuário) e docente (instrutor: remuneração PJ, RPA ou folha, valor hora, contratos assinados no Clicksign, pagamentos com NF ou recibo, antecedentes anuais, LGPD, convite por link). Ao convidar um instrutor cujo e-mail já é de um colaborador, acrescentar o vínculo ao mesmo usuário.

**EnrollmentContracts:** aluno (cadastro rápido, responsável obrigatório para menor, CPF único por escola), matrícula com geração das parcelas, bloqueio de lotação e duplicidade, troca de turma do mesmo curso sem mexer nas parcelas, cancelamento que cancela só as parcelas em aberto.

**Finance:** contas a receber e a pagar, baixa manual, estorno, inadimplência, multa e juros configuráveis, resumo do mês. Campo de cobrança externa reservado no lançamento.

**Classroom:** chamada (todos presentes por padrão), diário, frequência, pendências de chamada, nota final por aluno (quando o curso tem nota), conclusão da turma com resultado por aluno (aprovado, reprovado por frequência ou por nota).

**Certificados:** modelos por curso com um padrão da escola (cópia do modelo guardada na emissão), PDF gerado no servidor, código único, página pública de validação com CPF mascarado, cancelamento.

**Operação**
- Importação de alunos, cursos e turmas por planilha (CSV/Excel). Sem isso a escola não sai das planilhas.
- LGPD: termos, dados de menores, exportação e exclusão a pedido, backups.
- Visão geral (read model, contexto Reporting).

## Desejável após os primeiros clientes

- Cobrança integrada (Asaas ou Stripe): boleto/Pix na matrícula, baixa por webhook, segunda via, régua de lembretes.
- Lembretes por WhatsApp/e-mail (cobrança, falta seguida, início de turma).
- Portal do aluno: parcelas, frequência, certificados.
- Contrato de matrícula em PDF e assinatura eletrônica.
- Cancelamento e reposição de aula, feriados, trancamento e rematrícula no próximo nível (idiomas).
- Taxa de matrícula separada das parcelas.
- Avaliações por modalidade (fim de módulo, semanal) além da nota final; QR code; logo, fundo e assinatura em imagem nos modelos de certificado.
- Relatórios exportáveis: recebimentos, inadimplência, frequência, matrículas por período.
- Contas a pagar recorrentes; categorias editáveis.
- Responsável como cadastro próprio, compartilhado entre irmãos (no MVP ele fica dentro do aluno); busca de endereço pelo CEP.
- Cobrança do próprio SaaS (faturamento por alunos ativos).

## Funcionalidades avançadas do Institucional

Contratos corporativos (pacotes de vagas, in company, aprovação de inscritos), portal RH e dossiês, formações com remarcação em cadeia, salas, laboratórios e softwares, compras e estoque, CRM, metas e comissões, consulta SPC, multiunidade, SSO, NFS-e, API e integrações, indicadores especializados. Boa parte já está desenhada no `snorlax-jornada` e pode voltar como módulo.

## Riscos e decisões pendentes

| Tema | Situação |
|---|---|
| Preço do Essencial e do Gestão | Não definido. O catálogo aceita `preco: null`, e nenhuma tela inventa valor. |
| Hipótese do Institucional | Este escopo usa R$ 2.500 com 300 alunos incluídos. Há outra versão da hipótese em material comercial anterior; é preciso alinhar antes de qualquer proposta. |
| Condição do cliente-piloto | Mais alunos incluídos cabem como `condicoes.alunosIncluidos` do cliente (`Planos.efetivo`), sem mudar o produto. Os processos específicos dele continuam fora do padrão. |
| "Aluno ativo" para cobrança | Definir: matrícula em curso hoje, ou qualquer matrícula no mês? Muda a fatura. |
| Divisão Essencial × Gestão | Hoje a diferença é contas a pagar e a validação pública. Validar com escolas se isso justifica dois planos. |
| Regra de frequência | Aula sem chamada não conta e falta justificada conta como presença (configurável). Depois de uma troca de turma, só a turma nova conta. Confirmar com coordenações. |
| Certificado com dívida | O bloqueio é opcional e vem desligado. Há escolas que exigem quitação. |
| Cancelamento sem multa | O MVP não calcula rescisão. Escolas com contrato rígido podem precisar disso cedo. |
| Pagamento de instrutor × contas a pagar | Resolvido na demo: programar o pagamento na ficha do instrutor cria a conta a pagar (Professores, em nome da empresa no PJ ou da pessoa no RPA, vencimento no previsto); pagar na ficha dá a baixa e remover a programação cancela a conta. Em Contas a pagar essa conta não tem Pagar nem Estornar: a ficha é a fonte (exige NF/recibo). Falta decidir se o perfil Financeiro, que hoje não vê Instrutores, ganha acesso para pagar instrutores. |
| Provedor de cobrança | Para boleto e Pix, Asaas é o caminho natural; Stripe faz sentido se houver cartão recorrente internacional. |
| Migração das planilhas | O maior esforço de onboarding. Sem importação, o ciclo de venda trava. |
| Persistência do protótipo | O localStorage existe só para a demonstração. Não há multi-tenancy nem segurança: o backend usa RLS por tenant (ADR 0002). |
| Tailwind via CDN | Só no protótipo. Em produção, build próprio. |
