# Aulor SaaS — escopo do MVP comercial

Protótipo navegável para escolas de cursos livres (tecnologia, profissionalizantes, idiomas). É um clone independente de `snorlax-jornada`; o original não foi alterado. Data: 10/10/2026 (navegação revista no mesmo dia para seguir os módulos do original).

## Diagnóstico do protótipo original

- São cerca de 120 páginas e 4 MB de JavaScript, no padrão `*-data.js` → `*-motor.js` → `*-app.js`. Cada domínio usa sua própria chave de localStorage.
- **A matrícula não existe como registro.** Ela é um item dentro de um contrato com pacotes × vagas (modelo B2B). As parcelas viram lançamentos por sincronização, e a turma calcula seus alunos lendo os contratos. A integração existe, mas está presa ao modelo corporativo do cliente-piloto: só `contratos-app.js` tem 250 KB.
- **Perfis e permissões têm um motor completo, mas nada aplica as regras.** O menu mostra os 40 itens para todos, e "usuário atual" existe em três versões que não se falam.
- Há cerca de 1 MB de dados do cliente-piloto: catálogo, alunos e contratos.
- Várias telas são só demonstração, com números escritos à mão (jornadas, resultados e indicadores).

## 1. Reaproveitado

| Do original | No MVP |
|---|---|
| `tema.js`, `tooltip.js`, `styles.css`, `img/`, tokens `@theme` (petróleo, cobre, areia, Plus Jakarta Sans) | Shell visual. Os tokens foram centralizados em `js/estilo.js` em vez de repetidos em cada página |
| `agenda.js` | Editor de dias e horários da turma e geração das datas das aulas |
| `documento.js`, `ui-form.js` | CPF/CNPJ, combobox com busca, modal de formulário e exibição de erros |
| `permissoes-motor.js`, `permissoes-app.js` | Perfis, matrizes, permissões adicionais e "validar acesso". Recebeu a regra de perfil protegido e um modo só leitura |
| `templates-certificado-motor.js` (CSS, frente/verso, impressão A4) | `js/certificado.js` |
| Regras de `gerarParcelas`, cálculo de frequência, chamada com todos presentes por padrão, código de validação | `js/aulor.js` |

## 2. Simplificado

| Original | MVP |
|---|---|
| Contrato com pacotes, vagas, assinatura e aprovações | **Matrícula**: aluno + turma + valor, desconto, parcelas, 1º vencimento e forma de pagamento |
| Plano de contas, centros de custo/receita, conciliação, saques Asaas | Contas a receber e a pagar com categorias simples e baixa manual |
| Cursos + formações + áreas + eixos + salas + softwares | Curso (com módulos opcionais) e turma (agenda, professor, vagas, local em texto) |
| Aulas com feriados, salas e remarcação em cadeia | Aulas geradas pela agenda até completar a carga horária do curso |
| Presença P/A/J/F com minutos | Presente, falta ou justificada, mais o conteúdo da aula (diário) |
| Vários modelos de certificado (curso/formação) | Vários modelos de curso, um padrão da escola e escolha por curso; sem formação nem upload de imagens |
| Home por persona com números fixos | Visão geral calculada a partir dos registros e filtrada pelas permissões |
| Telas de Turmas, Turmas em risco e Alertas de frequência com indicadores financeiros e de integração | As mesmas telas, com contagens e filtros calculados só dos dados do MVP (sem KPIs que dependem de integrações) |
| Três portais (admin, professor, aluno) | Um sistema só. O professor entra com o perfil Professor e vê apenas "Minhas aulas", que funciona no celular |

## 3. Fica para depois

**Ficaram de fora do menu do original** (voltam como módulo quando fizer sentido): Diretoria (metas, resultados, faturamento por curso, receitas × despesas), empresas e contratos, ocorrências, responsáveis, SPC, formações, áreas, avaliações e questionários, dossiês, salas e feriados, aniversariantes, pagamentos de instrutores, compras, plano de contas, chamados.

**Desejável após os primeiros clientes:** cobrança automática por boleto/Pix via provedor, portal do aluno, lembretes por e-mail/WhatsApp, contrato em PDF com assinatura eletrônica, relatórios exportáveis, cancelamento e reposição de aula, feriados, transferência e trancamento, notas e avaliações, QR code no certificado.

**Plano Institucional:** contratos corporativos (pacotes de vagas, in company), portal RH, dossiês, instrutores PJ e repasses, salas, laboratórios e softwares, compras e estoque, CRM, metas e comissões, consulta SPC, multiunidade, SSO, NFS-e, formações com remarcação em cadeia, indicadores especializados.

## 4. Escopo recomendado para a primeira versão comercial

O menu mantém a divisão por módulos do protótipo original. Cada perfil vê só os itens que pode abrir, e um grupo sem itens visíveis some.

| Grupo › tela | Inclui |
|---|---|
| Visão geral | Alunos ativos, recebido × previsto no mês, valor em atraso, turmas em andamento, a fila "Precisa de atenção", aulas de hoje e matrículas recentes |
| Comercial › Alunos | Cadastro rápido (nome, CPF, celular; responsável obrigatório para menor), busca e filtros. Ficha em abas como no original: **Dados** (identificação e contato), **Responsáveis** (vários, com papéis legal, financeiro e emergência), **Endereço e pagamento** (endereço, quem paga, forma e dia de vencimento preferidos, que a matrícula nova já sugere), **Matrículas** e **Financeiro** |
| Comercial › Matrículas | Uma tela em três passos com prévia das parcelas, cancelamento (cancela só as parcelas em aberto) e bloqueio de lotação e duplicidade |
| Comercial › Turmas em risco | Turmas a iniciar abaixo do mínimo de alunos (crítico, alerta, atenção), valor em jogo e atalho para matricular. Mesma regra do original |
| Pedagógico › Cursos | Carga, modalidade, valor de referência e módulos |
| Pedagógico › Turmas | Contagem por situação (clicável como filtro), busca, filtros por curso, professor e situação; aviso de turmas em risco; turma com professor, agenda, vagas, mínimo para abrir e local |
| Pedagógico › Aulas e chamadas | Aulas de hoje, chamadas pendentes e próximos 7 dias. Para o professor vira "Minhas aulas", com chamada e diário no celular |
| Pedagógico › Alertas de frequência | Quem não alcança mais o mínimo, quem está abaixo e quem está perto, com mensagem pronta para contatar |
| Pedagógico › Certificados e Modelos de certificado | Prontos para emitir, emissão em lote, impressão/PDF, cancelamento, validação pública; vários modelos (aparência, frente e verso) com prévia ao vivo, padrão da escola e escolha por curso |
| Financeiro › Financeiro e Cobranças | A receber e a pagar por mês, baixa manual com multa e juros sugeridos, estorno; inadimplentes com lembrete pronto |
| Pessoas › Professores e Usuários | Professores com acesso opcional ao Aulor; convite, perfis, permissões adicionais e inativação de usuários. O Administrador é protegido |
| Configurações › Perfis de acesso e Escola e regras | Matriz de permissões; dados da escola, frequência mínima, preferências financeiras e plano contratado |

**Planos (hipótese):** os planos ficam em `js/planos.js`, com módulos por plano, alunos incluídos, faixas e condições especiais por cliente. O **Essencial** traz o núcleo acadêmico e de contas a receber. O **Gestão** acrescenta contas a pagar com resultado do mês e a validação pública de certificados. O **Institucional** usa a hipótese de R$ 2.500/mês com 300 alunos incluídos, R$ 6 por aluno de 301 a 500, R$ 5 de 501 a 1.000 e 17% de desconto no anual. Essencial e Gestão ficam **sem preço** de propósito. Perfis e permissões entram em todos os planos.

## 5. Decisões principais

1. **Clone novo na mesma stack, sem podar o original.** Os apps originais misturam a regra corporativa em todo o render; enxugá-los custaria mais que reescrever as telas. A stack é a mesma (HTML + Tailwind CDN + JS global + localStorage), e as peças genéricas foram copiadas.
2. **Uma base de dados e um motor de regras (`js/aulor.js`).** Matrícula, parcela, turma, chamada e certificado leem e gravam os mesmos registros. A consistência não depende de sincronização, e há 11 testes em Node cobrindo as regras e a semente em cinco datas diferentes.
3. **Matrícula como registro próprio.** É o que uma escola de cursos livres entende ("matriculei a Ana no Excel em 5×"). O contrato corporativo vira um módulo do Institucional.
4. **Permissões aplicadas de verdade.** O menu, as páginas e os botões consultam `Permissoes.pode`. O catálogo segue o formato `tela.ação` (`matriculas.criar`), o mesmo do `PermissionCatalog` do backend. O Administrador é protegido, como o `AccessProfile.IsProtected`.
5. **Mesma divisão por módulos do original** (Comercial, Pedagógico, Financeiro, Pessoas, Configurações), com grupos recolhíveis e uma tela por assunto. Os módulos do catálogo de permissões são os mesmos grupos do menu. Como cada perfil vê só o que pode usar, o financeiro vê 2 grupos e o professor só "Minhas aulas".
6. **Frequência = presenças ÷ aulas com chamada registrada.** Aula sem chamada não conta: ela aparece como pendência, para não reprovar ninguém por esquecimento do professor.
7. **A conclusão da turma é um passo explícito.** Ela fecha o resultado de cada aluno (aprovado ou reprovado por frequência), e o certificado só existe depois dela. Bloquear o certificado por parcela vencida é opcional.
8. **Cobrança manual nesta versão.** Cada lançamento já tem o campo `cobranca` reservado para o identificador do provedor, e as telas dizem claramente que nada é cobrado de verdade.
9. **A semente é gerada a partir da data de hoje**, para a demonstração nunca ficar velha. "Restaurar" volta ao estado inicial. A persistência local é só para demonstrar: não há isolamento entre escolas nem segurança.
