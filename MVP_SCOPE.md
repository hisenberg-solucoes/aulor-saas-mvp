# Aulor SaaS — escopo do MVP comercial

Protótipo navegável para o nosso ICP: escolas de cursos livres, profissionalizantes, idiomas e afins. É um clone independente de `snorlax-jornada`; o original não foi alterado. Primeira versão em 10/10/2026. Em 19/10/2026 o corte foi revisto tela por tela contra o original, e as telas foram refeitas no visual em cartões dele.

## Diagnóstico do protótipo original

- São cerca de 120 páginas e 4 MB de JavaScript, no padrão `*-data.js` → `*-motor.js` → `*-app.js`. Cada domínio usa sua própria chave de localStorage.
- **A matrícula não existe como registro.** Ela é um item dentro de uma venda com pacotes × vagas (modelo B2B). As parcelas viram lançamentos por sincronização, e a turma calcula seus alunos lendo as vendas. A integração existe, mas está presa ao modelo corporativo do cliente-piloto: só `contratos-app.js` tem 250 KB.
- **Perfis e permissões têm um motor completo, mas nada aplica as regras.** O menu mostra todos os itens para todos, e o catálogo de permissões não acompanha o menu.
- **No admin não há chamada nem emissão de certificado.** A chamada só existe no portal do professor, e o certificado só é baixado pelo aluno no portal dele.
- Há cerca de 1 MB de dados do cliente-piloto: catálogo, alunos e vendas.
- Várias telas são só demonstração, com números escritos à mão ("Meu dia", resultados e indicadores).

## O ciclo que o MVP cobre

Configurar a escola → cadastrar curso e turma → matricular (aluno e responsável) → dar aula e fazer a chamada → receber as parcelas → concluir a turma com nota e frequência → emitir o certificado. O que fica fora desse ciclo saiu.

## 1. Reaproveitado

| Do original | No MVP |
|---|---|
| Visual "Ficha em cartões" (`DESIGN.md`: tokens da paleta oficial, fontes, cartões, botões, pílulas, abas, tabela), `tema.js`, `tooltip.js`, `img/` | Shell e telas. Os tokens e os componentes ficam em `js/estilo.js` em vez de repetidos em cada página |
| `agenda.js` | Editor de dias e horários da turma e geração das datas das aulas |
| `documento.js`, `ui-form.js` | CPF/CNPJ, combobox com busca, modal de formulário e exibição de erros |
| `permissoes-motor.js`, `permissoes-app.js` | Perfis, matrizes, permissões adicionais e "validar acesso". Recebeu a regra de perfil protegido e um modo só leitura |
| `templates-certificado-motor.js` (CSS, frente/verso, impressão A4) | `js/certificado.js` |
| Regras de geração de parcelas, cálculo de frequência, chamada com todos presentes, turmas em risco (RN11), alertas de frequência, código de validação | `js/aulor.js` |
| Telas de Colaboradores e Instrutores (lista, ficha em cartões, calendário do instrutor, empresa e valor hora, contratos com Clicksign simulado, pagamentos com NF ou recibo, documentos, cadastro pelo link) e o modelo de pessoas e papéis (PJ, RPA ou folha; quem é da equipe e dá aula) | As mesmas telas e motores, sem reescrever. `js/pessoas-mvp.js` liga tudo à base única (19/10/2026) |

## 2. Simplificado

| Original | MVP |
|---|---|
| Venda com pacotes × vagas, empresa contratante, link do pacote, aprovação de alunos, assinatura, Comercial OK/Adm OK, rescisão e NF | **Matrícula**: aluno + turma + valor, desconto, parcelas, 1º vencimento e forma de pagamento; trocar de turma e cancelar |
| Ficha do aluno com empresa e cargo, LGPD, necessidades e acessibilidade, acompanhamento (calendário, dossiês), ocorrências, SPC e "marcar devedor" | Dados, Responsáveis, Endereço e quem paga, Matrículas (com frequência e nota de cada uma) e Financeiro. O aviso de atraso é calculado das parcelas |
| Cadastro de Empresas para o B2B | O responsável financeiro aceita CPF **ou** CNPJ. O segmento B2C × B2B sai do documento de quem paga |
| Responsáveis com tela própria | Responsáveis dentro do aluno (vários, com papéis legal, financeiro e emergência) |
| Cursos + formações + áreas + eixos + requisitos (softwares, sala, instrutores habilitados) + material didático | Curso: carga horária, modalidade, nota mínima (opcional), valor de referência e modelo de certificado; módulos opcionais. A frequência mínima é uma regra da escola |
| Turma com custos e margem, gravações, dossiês, avaliações, requisitos e sala | Turma: curso, professor, agenda, vagas, mínimo para abrir e "local ou link" em texto; alunos, aulas, presença e conclusão |
| Aulas com feriados, salas, remarcação em cadeia e conteúdo distribuído | Aulas geradas pela agenda até completar a carga horária; remarcar uma aula de cada vez |
| Presença P/Atraso/J/F com minutos | Presente, falta ou justificada, mais o conteúdo da aula (diário) |
| Aprovação por frequência e nota sem tela para lançar a nota | Na conclusão da turma, uma nota final por aluno; o curso sem nota mínima aprova só por frequência |
| Financeiro com conciliação Asaas, extrato, saque, boleto/Pix, NF, centro de custo, conta bancária e fornecedor | A receber e a pagar com categoria de lista fixa e baixa manual com multa e juros sugeridos; estorno; resultado do mês |
| Cobranças como tela à parte, repetindo A receber | Aba **Em atraso** do Financeiro, com lembrete pronto |
| Vários modelos de certificado (curso e formação) | Vários modelos de curso, um padrão da escola e escolha por curso; sem formação nem upload de imagens |
| "Meu dia" por perfil com números fixos | Visão geral calculada a partir dos registros e filtrada pelas permissões |
| Três portais (admin, professor, aluno) | Um sistema só, com o **Portal do Professor** dentro dele: quem entra com o perfil Professor vê um menu próprio (Início, Minhas turmas, Minhas aulas). A turma e a chamada são as mesmas telas do admin, limitadas às turmas dele. Sem portal do aluno |

## 3. Fica para depois

**Telas do original que saíram inteiras:**
- Diretoria: Visão executiva, Metas, Resultados, Faturamento por curso, Receitas × Despesas.
- Comercial: Empresas, Ocorrências, Responsáveis (como tela), Consulta SPC.
- Pedagógico: Formações, Áreas, Feedback diário, Questionários, Dossiês e Modelos de dossiê.
- Secretaria e operação: Salas, Agenda de salas, Feriados, Aniversariantes.
- Financeiro: Cobranças (virou aba), a fila geral de Pagamentos de instrutores (os pagamentos ficam na ficha de cada instrutor), Compras, Categorias, Contas bancárias, Centros de custo, Fornecedores, Indicadores.
- Suporte e TI (chamados), portal do aluno e cadastros públicos por link de aluno e empresa (o do instrutor veio com Pessoas).

**Desejável após os primeiros clientes:** cobrança automática por boleto/Pix via provedor, portal do aluno, lembretes por e-mail/WhatsApp, contrato da matrícula em PDF com assinatura eletrônica, taxa de matrícula separada das parcelas, trancamento e rematrícula no próximo nível, relatórios exportáveis, cancelamento e reposição de aula, feriados, avaliações por modalidade (fim de módulo, semanal), QR code no certificado.

**Plano Institucional:** contratos corporativos (pacotes de vagas, in company), portal RH, dossiês, salas, laboratórios e softwares, compras e estoque, CRM, metas e comissões, consulta SPC, multiunidade, SSO, NFS-e, formações com remarcação em cadeia, indicadores especializados.

## 4. Telas da primeira versão comercial

O menu mantém a divisão por módulos do protótipo original. Cada perfil vê só os itens que pode abrir, e um grupo sem itens visíveis some.

| Grupo › tela | Inclui |
|---|---|
| Visão geral | Alunos ativos, recebido × previsto no mês, valor em atraso, turmas em andamento, a fila "Requer atenção", aulas de hoje e matrículas recentes |
| Comercial › Alunos | Cadastro rápido (nome, CPF, celular; responsável obrigatório para menor), busca e filtros. Ficha em abas: **Dados** (com os cartões Quem paga, com CPF ou CNPJ e forma e dia de vencimento preferidos que a matrícula nova já sugere, e Endereço), **Responsáveis** (papéis legal, financeiro e emergência), **Matrículas** (frequência e nota) e **Financeiro** |
| Comercial › Vendas | Lista no desenho das Vendas do original: abas **Vendas** e **Por turma** (faturamento de cada turma), cartões do que pede ação (parcelas vencidas, vendas e cancelamentos do mês, vagas nas turmas a iniciar) e o próximo passo de cada venda. Ficha da venda com **Resumo** (contratante, valores, andamento até o certificado), **Aluno e turma**, **Cobrança** e **Histórico**. **Nova venda** numa tela em três passos com prévia das parcelas; bloqueio de lotação e de duplicidade; **trocar de turma** (a matrícula e as parcelas mudam de turma, se houver vaga); cancelamento que cancela só as parcelas em aberto |
| Comercial › Turmas em risco | Turmas a iniciar abaixo do mínimo de alunos (crítico, alerta, atenção), valor em jogo e atalho para matricular. Mesma regra do original |
| Pedagógico › Cursos | Carga, modalidade, nota mínima (opcional), valor de referência, parcelas sugeridas, modelo de certificado e módulos |
| Pedagógico › Turmas | Contagem por situação (clicável como filtro), busca, filtros por curso, professor e situação; aviso de turmas em risco; ficha com alunos, aulas, grade de presença e **conclusão com nota final por aluno** |
| Portal do Professor | **Início**: aula de hoje com "Fazer a chamada", pendências deduzidas (chamada sem registro, diário em branco, notas finais a lançar), alunos abaixo da frequência mínima, turmas, próximas aulas e últimas chamadas. **Minhas turmas**: busca e situação. **Minhas aulas**: hoje, chamadas pendentes e próximos 7 dias. Chamada e diário no celular; nota final na aba Alunos da turma. Como no original, o admin não tem tela de aulas: a coordenação vê e corrige a chamada pela aba Aulas da turma. Fora: calendário mensal, avaliações, dossiês, contratos, pagamentos, gravações e Meus dados |
| Pedagógico › Alertas de frequência | Quem não alcança mais o mínimo, quem está abaixo e quem está perto, com mensagem pronta para contatar |
| Pedagógico › Certificados e Modelos de certificado | Prontos para emitir (aprovados), emissão em lote, impressão/PDF, cancelamento, validação pública; vários modelos (aparência, frente e verso) com prévia ao vivo, padrão da escola e escolha por curso |
| Financeiro › Financeiro | A receber e a pagar por mês, **Em atraso** com lembrete pronto, baixa manual com multa e juros sugeridos, estorno, resultado do mês |
| Pessoas › Colaboradores, Instrutores e Usuários | As telas do original como estão. **Colaboradores**: equipe com cargo, admissão, afastamento, desligamento e o usuário de acesso (criar, vincular, perfis, bloquear). **Instrutores**: papel docente da pessoa, com remuneração PJ, RPA ou folha; dados, calendário das aulas, empresa e tabela de valor hora, contratos (rascunho → documento → Clicksign → assinado), pagamentos com NF ou recibo, antecedentes e LGPD, convite com link para o próprio instrutor preencher. Quem é da equipe e dá aula é uma pessoa só. **Usuários**: convite, perfis, permissões adicionais e inativação. O Administrador é protegido |
| Configurações › Perfis de acesso | Obrigatório e completo: lista, matriz tela × ação, matriz de usuários, "validar acesso", Administrador protegido; aplicado no menu, nas telas e nos botões |
| Configurações › Escola e regras | Dados da escola, frequência mínima, preferências financeiras (multa, juros, vencimento, certificado com dívida) e plano contratado |

Telas públicas: entrar e validar certificado.

**Planos (hipótese):** os planos ficam em `js/planos.js`, com módulos por plano, alunos incluídos, faixas e condições especiais por cliente. O **Essencial** traz o núcleo acadêmico e de contas a receber. O **Gestão** acrescenta contas a pagar com resultado do mês e a validação pública de certificados. O **Institucional** usa a hipótese de R$ 2.500/mês com 300 alunos incluídos, R$ 6 por aluno de 301 a 500, R$ 5 de 501 a 1.000 e 17% de desconto no anual. Essencial e Gestão ficam **sem preço** de propósito. Perfis e permissões entram em todos os planos.

## 5. Decisões principais

1. **Clone novo na mesma stack, sem podar o original.** Os apps originais misturam a regra corporativa em todo o render; enxugá-los custaria mais que reescrever as telas. A stack é a mesma (HTML + Tailwind CDN + JS global + localStorage), e as peças genéricas foram copiadas.
2. **Uma base de dados e um motor de regras (`js/aulor.js`).** Matrícula, parcela, turma, chamada e certificado leem e gravam os mesmos registros. A consistência não depende de sincronização, e os testes em Node cobrem as regras e a semente em datas diferentes.
3. **Venda no comercial, matrícula no pedagógico.** As telas comerciais dizem Venda, como no original; no MVP uma venda é um aluno num curso, e dela saem a matrícula na turma e as parcelas. Turma, frequência e certificado continuam falando em aluno matriculado. No código o registro segue `matricula` (e os arquivos `matriculas.html`, como o original manteve `contratos.html`). A venda corporativa (empresa, pacote de vagas) vira um módulo do Institucional.
4. **Permissões aplicadas de verdade.** O menu, as páginas e os botões consultam `Permissoes.pode`. O catálogo segue o formato `tela.ação` (`matriculas.criar`), o mesmo do `PermissionCatalog` do backend. O Administrador é protegido, como o `AccessProfile.IsProtected`.
5. **Mesma divisão por módulos do original** (Comercial, Pedagógico, Financeiro, Pessoas, Configurações), com grupos recolhíveis e uma tela por assunto. Os módulos do catálogo de permissões são os mesmos grupos do menu.
6. **Frequência = presenças ÷ aulas com chamada registrada.** Aula sem chamada não conta: ela aparece como pendência, para não reprovar ninguém por esquecimento do professor.
7. **A conclusão da turma é um passo explícito.** Ela recebe a nota final de cada aluno e fecha o resultado: aprovado, reprovado por frequência ou reprovado por nota. O certificado só existe depois dela. Curso sem nota mínima aprova só por frequência. Bloquear o certificado por parcela vencida é opcional.
8. **Trocar de turma não refaz o financeiro.** A matrícula muda de turma com as mesmas parcelas, as presenças da turma antiga ficam no histórico, e a troca respeita a lotação. Trancar e rematricular ficam para depois; rematricular hoje é uma matrícula nova.
9. **Um valor parcelado.** A matrícula tem valor, desconto e parcelas; taxa de matrícula separada fica para depois.
10. **Sem contrato da venda no MVP.** A escola continua usando o modelo dela; o documento gerado e a assinatura eletrônica ficam para depois.
11. **Cobrança manual nesta versão.** Cada lançamento já tem o campo `cobranca` reservado para o identificador do provedor, e as telas dizem claramente que nada é cobrado de verdade.
12. **A semente é gerada a partir da data de hoje**, para a demonstração nunca ficar velha. "Restaurar" volta ao estado inicial. A persistência local é só para demonstrar: não há isolamento entre escolas nem segurança.
13. **Pessoas trazidas como estão (19/10/2026).** Colaboradores e Instrutores entram com as telas e os motores do original, em todos os planos. O instrutor é o registro de `professores` da base (as turmas continuam em `professorId`); o rótulo da seção é *Instrutores*, e turma, perfil e Minhas aulas continuam dizendo professor. Quem só visualiza vê a ficha sem os botões de edição.
