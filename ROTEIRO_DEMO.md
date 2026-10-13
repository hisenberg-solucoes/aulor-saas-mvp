# Roteiro de demonstração: 10 minutos

Para o dono de uma escola com cerca de 200 alunos. A escola fictícia é a **Atlas Cursos Profissionalizantes** (Londrina-PR). O roteiro também aparece no painel **Demonstração**, no rodapé do menu.

## Antes de começar

- Abra o protótipo no Chrome com a janela em 1280 px ou mais.
- No painel **Demonstração**, clique em **Restaurar dados iniciais**. A escola é gerada de novo com as datas de hoje.
- Para mostrar a chamada "no celular", use o modo dispositivo do navegador (DevTools › Toggle device toolbar) **na mesma aba**. Abrir num celular de verdade cria uma cópia separada dos dados, porque não há servidor nesta versão.

## Sequência

| Tempo | Tela | O que fazer | O que dizer |
|---|---|---|---|
| 0:00 | Entrar | Escolha **Marina Azevedo (Diretora)** | "Cada pessoa da escola vê só o que o perfil dela libera." |
| 0:30 | Visão geral | Passe pelos quatro números e pela lista **Precisa de atenção** | "Ao abrir o sistema, você sabe quem está devendo, que chamada falta e que turma precisa ser fechada. Tudo é calculado dos registros, não é painel decorativo." |
| 1:30 | Pedagógico › Turmas, depois Comercial › Turmas em risco | Mostre as contagens por situação e o aviso de turmas que não atingiram o mínimo. Em **Turmas em risco**, aponte **WEB-2026-1** (8 de 20 vagas, começa nas próximas duas semanas). Se quiser, clique em **Nova turma** e mostre a prévia ("12 aulas, de… a…") | "O curso é o produto; a turma é a oferta com professor, horário e vagas. Você vê cedo onde falta aluno para a turma abrir." |
| 2:30 | Turmas em risco › Matricular | Escolha um aluno (ou **+ Cadastrar novo aluno**, que pede só nome, CPF e celular). Desconto de 10%, 5 parcelas. Mostre o resumo à direita e clique em **Confirmar matrícula** | "Três passos. As parcelas que você vê no resumo são exatamente as que entram no financeiro." |
| 4:00 | Matrícula confirmada | Clique em **Receber** na 1ª parcela e confirme | "A baixa muda o status aqui, na ficha do aluno e no financeiro, porque é o mesmo registro." |
| 4:45 | Financeiro › Financeiro e Cobranças | Na aba **A receber**, veja o mês e o "Recebido no mês". Abra **Cobranças** e clique em **Copiar lembrete** | "Quem deve, quanto e há quantos dias, com a mensagem pronta para o WhatsApp. A cobrança automática por boleto/Pix entra numa próxima versão." |
| 5:45 | Trocar usuário | Clique no seu nome (topo) e entre como **Sérgio Albuquerque (Professor)**. Ligue o modo celular | "O professor só vê as turmas dele." |
| 6:15 | Minhas aulas › Chamada | Em **Hoje**, toque em **Fazer chamada**. Todos começam presentes; marque uma falta e toque em **Salvar chamada** | "Um toque por aluno, durante a aula. A frequência é recalculada na hora; quem cai abaixo do mínimo aparece para a coordenação." |
| 7:15 | Voltar como Marina | Desligue o modo celular. Abra a turma **EXC-2026-2**, que mostra "Aguardando conclusão", e clique em **Concluir turma** | "Fechou o curso: o sistema aplica a frequência mínima de 75%. Dez aprovados, um reprovado por frequência, sem planilha." |
| 8:15 | Certificados | **Prontos para emitir** › **Emitir selecionados**. Abra um certificado, mostre **Imprimir ou salvar PDF** e **Copiar link de validação**; cole o link numa aba nova | "Quem recebe o certificado confere a autenticidade pelo código. O reprovado não aparece aqui." |
| 9:15 | Configurações › Perfis de acesso e Escola e regras | Mostre os perfis (Secretaria, Financeiro, Coordenação, Professor), a frequência mínima, multa e juros, e os **Modelos de certificado** (o curso de Python usa o modelo Programação; os demais, o padrão) | "Você ajusta as regras da sua escola sem chamar ninguém." |
| 10:00 | Fecho | — | Pergunte como a escola faz hoje a matrícula, a cobrança e a chamada. |

## Se perguntarem

- **"Emite boleto?"** Hoje o registro é manual, no meio que a escola já usa. A integração com um provedor de pagamento (Asaas ou Stripe) está no backlog logo após os primeiros clientes.
- **"Tem app para o aluno?"** O portal do aluno vem depois. O professor já usa pelo celular.
- **"E empresas, turmas fechadas, vários campi?"** Ficam no plano Institucional (veja **Configurações › Escola e regras › Plano**).
- **"Quanto custa?"** Os planos Essencial e Gestão ainda não têm preço. Não mostre números além da hipótese do Institucional, e só se fizer sentido.
