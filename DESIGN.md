---
name: Aulor
description: MVP comercial do Aulor (sistema de escola de cursos livres); direção visual "Ficha" sobre a paleta oficial da marca, trazida do protótipo original.
colors:
  # Paleta oficial (vale nos dois modos)
  azul-profundo: "#071E2C"
  petroleo: "#0F3D4E"
  cobre: "#C47A3A"
  areia: "#F5F0E8"
  cinza: "#64727A"
  # Derivados do modo claro
  elevado: "#FFFFFF"
  faixa: "#F0EADF"
  realce: "#EDE6DA"
  etiqueta: "#EAE3D7"
  linha: "#E4DCCF"
  linha-forte: "#D6CCBC"
  tinta-2: "#4E5B61"
  tinta-3: "#5E6C74"
  etiqueta-tinta: "#3F4B50"
  selecao: "#DFE8EB"
  cobre-tinta: "#985824"
  bom: "#2F7A55"
  ruim: "#B4452F"
  veu: "rgb(7 30 44 / 0.32)"
  # Derivados do modo escuro (html.dark)
  elevado-escuro: "#0C2838"
  faixa-escuro: "#0A2332"
  realce-escuro: "#0E2B3B"
  etiqueta-escuro: "#10303F"
  linha-escuro: "#16313F"
  linha-forte-escuro: "#224050"
  tinta-2-escuro: "#AAB6BB"
  tinta-3-escuro: "#8A989E"
  etiqueta-tinta-escuro: "#CBD5D9"
  selecao-escuro: "#123A4B"
  petroleo-luz: "#9CC3D1"
  cobre-tinta-escuro: "#E2A56D"
  bom-escuro: "#6CC496"
  ruim-escuro: "#F08A72"
  sobre-ruim-escuro: "#1A0D09"
  veu-escuro: "rgb(2 11 17 / 0.6)"
typography:
  destaque:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "52px"
    letterSpacing: "-0.025em"
  registro:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  indicador:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "20px"
  action:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
  body:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
  control:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: "20px"
  label:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  tag:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: "20px"
rounded:
  tag: "4px"
  sm: "6px"
  md: "8px"
  popover: "10px"
  lg: "12px"
  full: "9999px"
spacing:
  tight: "6px"
  sm: "8px"
  control-x: "12px"
  tab: "20px"
  gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.petroleo}"
    textColor: "{colors.areia}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  button-secondary:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.azul-profundo}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  button-secondary-hover:
    backgroundColor: "{colors.realce}"
  button-ghost:
    textColor: "{colors.tinta-2}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 8px"
  button-ghost-hover:
    backgroundColor: "{colors.realce}"
    textColor: "{colors.azul-profundo}"
  button-danger:
    backgroundColor: "{colors.ruim}"
    textColor: "{colors.elevado}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  input:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.azul-profundo}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  segmented:
    backgroundColor: "{colors.etiqueta}"
    rounded: "{rounded.md}"
    padding: "2px"
  segmented-active:
    backgroundColor: "{colors.elevado}"
    textColor: "{colors.azul-profundo}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 10px"
  tab-active:
    textColor: "{colors.azul-profundo}"
    typography: "{typography.action}"
    padding: "10px 0"
  tag:
    backgroundColor: "{colors.etiqueta}"
    textColor: "{colors.etiqueta-tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    height: "24px"
    padding: "0 8px"
  tag-sem-perfil:
    backgroundColor: "#C47A3A26"
    textColor: "{colors.cobre-tinta}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "0 6px"
  switch-on:
    backgroundColor: "{colors.petroleo}"
    rounded: "{rounded.full}"
    height: "20px"
    width: "36px"
  switch-off:
    backgroundColor: "{colors.elevado}"
    rounded: "{rounded.full}"
    height: "20px"
    width: "36px"
  popover:
    backgroundColor: "{colors.elevado}"
    rounded: "{rounded.popover}"
    padding: "6px"
  modal:
    backgroundColor: "{colors.elevado}"
    rounded: "{rounded.lg}"
    padding: "20px"
  toast:
    backgroundColor: "{colors.azul-profundo}"
    textColor: "{colors.areia}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  button-primary-escuro:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.petroleo}"
  button-secondary-escuro:
    backgroundColor: "{colors.elevado-escuro}"
    textColor: "{colors.areia}"
  button-secondary-escuro-hover:
    backgroundColor: "{colors.realce-escuro}"
  input-escuro:
    backgroundColor: "{colors.elevado-escuro}"
    textColor: "{colors.areia}"
  segmented-escuro:
    backgroundColor: "{colors.etiqueta-escuro}"
  segmented-active-escuro:
    backgroundColor: "{colors.elevado-escuro}"
    textColor: "{colors.areia}"
  tag-escuro:
    backgroundColor: "{colors.etiqueta-escuro}"
    textColor: "{colors.etiqueta-tinta-escuro}"
  tag-sem-perfil-escuro:
    textColor: "{colors.cobre-tinta-escuro}"
  switch-on-escuro:
    backgroundColor: "{colors.areia}"
  switch-off-escuro:
    backgroundColor: "{colors.elevado-escuro}"
  popover-escuro:
    backgroundColor: "{colors.elevado-escuro}"
  modal-escuro:
    backgroundColor: "{colors.elevado-escuro}"
  toast-escuro:
    backgroundColor: "{colors.areia}"
    textColor: "{colors.azul-profundo}"
  # Shell: igual nos dois modos (tokens do escuro sempre)
  shell:
    backgroundColor: "{colors.azul-profundo}"
    textColor: "{colors.tinta-2-escuro}"
    typography: "{typography.body}"
  nav-item:
    textColor: "{colors.tinta-2-escuro}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "32px"
    padding: "0 8px"
  nav-item-hover:
    backgroundColor: "{colors.realce-escuro}"
    textColor: "{colors.areia}"
  nav-item-active:
    backgroundColor: "{colors.selecao-escuro}"
    textColor: "{colors.areia}"
    typography: "{typography.title}"
  nav-group-label:
    textColor: "{colors.tinta-3-escuro}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 8px"
  context-title:
    textColor: "{colors.areia}"
    typography: "{typography.title}"
  avatar-shell:
    backgroundColor: "{colors.selecao-escuro}"
    textColor: "{colors.areia}"
    rounded: "{rounded.full}"
    size: "32px"
---

# Design System: Aulor

## Overview

**Creative North Star: "A Ficha"**

O admin da Aulor é uma ficha de arquivo bem preenchida: papel, divisórias finas no lugar de caixas, tinta firme e nada além do que o registro precisa. A metáfora vem do próprio domínio: a secretaria escolar trabalha sobre fichas (de matrícula, do aluno, financeira), e cada tela do admin é a ficha de um registro (aluno, turma, contrato, perfil). Quem usa é a secretaria, a coordenação e o financeiro de uma escola, várias horas por dia, em telas de desktop. A interface precisa ser lida de relance e confiável como um livro de registro. A marca aparece nos detalhes exatos (o petróleo da ação principal, o cobre do que espera por você), não em decoração.

Densidade é virtude: controles de 32px, linhas de 36px, texto de 13px. A hierarquia vem de peso, posição e divisórias, nunca de cards empilhados ou sombras paradas. A cor é rara e semântica: petróleo significa "aja aqui", cobre significa "isto é com você", verde e vermelho só aparecem como estado.

Claro e escuro são de primeira classe, e o escuro não é o claro invertido: é a mesma ficha à noite. No claro, o papel é areia e a tinta é azul profundo; no escuro, os dois trocam de lugar. A troca acontece só nos tokens, nunca no componente.

Este documento é normativo para o MVP comercial. Veio do protótipo original (`snorlax-jornada`, mesmo nome de arquivo) em 2026-10-14, e as duas cópias andam juntas: uma regra nova entra nas duas. No MVP a Ficha vale em todas as telas: tokens, tipografia, shell e componentes compartilhados. O layout de cada tela ainda é o do original (cartões, filtros e tabela), só que nos papéis da Ficha; os cartões em elevado sobre o papel são herança desse layout e saem quando a tela for repaginada. Perfis de acesso ainda não tem o desenho Ficha do original, que também tirou os tipos de usuário do motor.

**Key Characteristics:**
- Papel com divisórias: areia no claro, azul profundo no escuro.
- Dois modos de primeira classe; componente usa o papel do token, nunca o hex.
- O que fica acima da página sobe um degrau de luz (branco no claro).
- Cinco cores oficiais; todo tom de interface deriva delas e passa no contraste AA nos dois modos.
- Petróleo na ação, cobre na pendência, nunca o contrário.
- Atkinson Hyperlegible Next na interface; Source Serif 4 só no nome do registro aberto.
- Status sempre como ponto + texto.
- Desktop primeiro; no celular, só o menu por cima do conteúdo e a chamada do professor.

## Colors

A paleta oficial da marca tem cinco cores e é fixa nos dois modos; a interface acrescenta só tons derivados delas, cada um com motivo registrado.

### Primary
- **Azul-petróleo** (petroleo): a cor institucional. No claro, é o botão primário, o interruptor ligado, a seleção, o anel de foco e os links de ação: a única cor que diz "clique aqui". No escuro, o petróleo puro some sobre o azul profundo, então o primário passa para areia com texto petróleo, e o texto de ação usa o **Petróleo luz** (petroleo-luz, 9:1 sobre o papel escuro).

### Secondary
- **Cobre** (cobre): o acento da marca e o sinal de "é com você": contadores de pendência, "sem perfil", avisos. Como ponto, traço ou fundo a 15%; nunca como fundo de botão. O mesmo valor nos dois modos (5,03:1 sobre o azul profundo).
- **Cobre-tinta** (cobre-tinta, cobre-tinta-escuro): o cobre quando vira texto, e também a cor de aviso; não existe âmbar paralelo. No claro, o cobre oficial dá só 2,99:1 sobre areia e este tom dá 4,93:1. No escuro, um cobre clareado (8:1).

### Neutral
- **Areia** (areia): o papel do modo claro e a tinta do modo escuro, a assinatura da marca sobre fundo escuro.
- **Azul profundo** (azul-profundo): a tinta do modo claro (15:1) e o papel do modo escuro. Também o fundo do shell, nos dois modos, e o toast no claro.
- **Elevado** (elevado, elevado-escuro): o degrau de luz acima do papel, para campos, menus, popovers, modais, botões secundários, interruptores desligados e chips. Branco no claro; azul profundo clareado no escuro.
- **Faixa, Realce, Etiqueta** (e as versões -escuro): o papel em degraus. Faixa é a barra de grupo (portal, módulo); realce é o hover de linha e de botão; etiqueta é o fundo de tag e o trilho do controle segmentado. No claro, areia escurecida; no escuro, azul profundo clareado.
- **Linha e Linha forte** (e as versões -escuro): divisórias e contornos. Linha separa registros; linha forte contorna controles e, no escuro, é o que separa o elevado do papel.
- **Tinta 2 e Tinta 3** (e as versões -escuro): texto secundário e terciário. No claro, tinta 3 é o cinza oficial escurecido o mínimo para passar AA sobre areia (4,78:1; o cinza puro dá 4,38:1). No escuro, tinta 3 dá 5,74:1 sobre o papel e 5,13:1 sobre o elevado.
- **Seleção** (selecao, selecao-escuro): fundo frio, puxado para o petróleo, para o que é "extra" ou selecionado, distinto da etiqueta.
- **Bom e Ruim** (e as versões -escuro): estado. Verde só no ponto de "Ativo" e em confirmações; vermelho em erro e no botão destrutivo.

### Papéis nos dois modos
Componentes nunca escolhem cor: usam o papel. Os valores vivem em `styles.css` como `--f-*`, no `:root` (claro) e no `html.dark` (escuro), e `js/estilo.js` os expõe em utilitários (`bg-papel`, `text-tinta`…) no `@theme inline`, para todas as páginas. O `<body>` inteiro é `.ficha` (anel de foco, seleção e barra de rolagem). A classe `.shell` aplica sempre os valores do escuro, como `.ficha-inverso` aplica os do modo oposto.

| Papel (`--f-*`) | Claro | Escuro |
|---|---|---|
| papel | areia | azul-profundo |
| elevado | elevado | elevado-escuro |
| faixa, realce, etiqueta | faixa, realce, etiqueta | faixa-escuro, realce-escuro, etiqueta-escuro |
| linha, linha-forte | linha, linha-forte | linha-escuro, linha-forte-escuro |
| tinta | azul-profundo | areia |
| tinta-2, tinta-3 | tinta-2, tinta-3 | tinta-2-escuro, tinta-3-escuro |
| marca (primário, interruptor ligado) | petroleo | areia |
| sobre-marca | areia | petroleo |
| marca-tinta, foco | petroleo | petroleo-luz |
| selecao | selecao | selecao-escuro |
| cobre | cobre | cobre |
| cobre-tinta, aviso | cobre-tinta | cobre-tinta-escuro |
| bom, ruim | bom, ruim | bom-escuro, ruim-escuro |
| sobre-ruim | elevado | sobre-ruim-escuro |
| etiqueta-tinta | etiqueta-tinta | etiqueta-tinta-escuro |
| veu (fundo atrás do modal) | veu | veu-escuro |
| dado (série principal de gráfico) | azul-profundo | areia |
| dado-pendente | cobre-tinta | cobre |
| dado-referencia (meta, período anterior) | tinta-3 | tinta-3-escuro |

Os três papéis de dado (ver Painéis) ainda não existem em `styles.css`; entram como `--f-dado`, `--f-dado-pendente` e `--f-dado-referencia` com a primeira tela de painel migrada.

### Named Rules
**A Regra das Cinco Cores.** Toda cor da interface é uma das cinco oficiais ou deriva delas com motivo escrito (normalmente contraste). Valor "quase igual" ao oficial é proibido: ou é o oficial, ou é um derivado documentado.

**A Regra dos Dois Modos.** Componente usa o papel do token, nunca o hex nem uma variante `dark:`. Toda tela é conferida no claro e no escuro antes de ser dada como pronta.

**A Regra do Papel.** O papel é areia no claro e azul profundo no escuro. Nunca branco, preto ou grafite.

**A Regra do Cobre.** Cobre é "é com você", nunca "clique aqui". Não vai em fundo de botão (texto branco sobre cobre dá 3,39:1), não vira texto no valor oficial e não divide a atenção com um âmbar ou amarelo.

**A Regra do Contraste Medido.** Um tom novo de texto só entra se passar 4,5:1 sobre o papel e sobre o elevado dos dois modos, e as razões ficam anotadas ao lado do token.

## Typography

**Display Font:** Source Serif 4 (com Georgia, serif)
**Body Font:** Atkinson Hyperlegible Next (com ui-sans-serif, system-ui)

**Character:** Atkinson Hyperlegible Next faz o trabalho inteiro em 13px. Foi criada pelo Braille Institute para leitura com baixa visão e diferencia caracteres parecidos (Il1, O0), o que importa em CPF, matrícula e código de turma; tem algarismos tabulares e a mesma altura-x da Inter (0,74 da maiúscula) em 7% menos largura numa linha de tabela. A Source Serif 4 continua só no nome do registro aberto, uma vez por tela, como o nome escrito à mão no topo de uma ficha. A Lexend Exa foi avaliada como alternativa para esse papel em 14/10/2026 e ficou de fora por enquanto.

### Hierarchy
- **Destaque** (600, 48px, 52px, −0.025em): o número-chefe de um painel. Uma ocorrência por painel.
- **Registro** (600, 26px, 1.15): nome do perfil ou da pessoa aberta. Uma ocorrência por tela. No MVP: aluno e curso, com `cabecalhoPagina({ registro: true })`.
- **Registro em aba** (600, 22px): nome do registro aberto dentro de uma aba, abaixo do título da página.
- **Indicador** (600, 24px, 28px, −0.02em): valor na linha de indicadores de um painel.
- **Headline** (600, 20px, 28px, −0.01em): título da página ("Quem pode o quê").
- **Title** (600, 13px): cabeçalho de faixa (portal, módulo), títulos de seção dentro de modais e o nome do módulo na barra de contexto.
- **Action** (500, 13px): botões, abas e links de ação.
- **Body** (400, 13px, 20px): texto corrido, células de tabela, campos.
- **Control** (500, 12.5px): controle segmentado e botões fantasma.
- **Label** (500, 12px): cabeçalho de coluna em tinta 3, rótulo de grupo do menu e tags.
- **Tag** (600, 11.5px): marcadores curtos de estado ("sem perfil").

Números de tabela usam algarismos tabulares; números grandes soltos (destaque, indicador) usam os proporcionais.

No MVP, o `text-sm` do Tailwind vale 13px/20px (redefinido no `@theme` de `js/estilo.js`): o texto das telas herdadas já sai no tamanho de body.

### Named Rules
**A Regra da Serifa Única.** Source Serif 4 só no nome do registro aberto. Título de página, botão e tabela são sempre Atkinson Hyperlegible Next.

## Layout

Desktop primeiro. No celular o MVP só abre o menu por cima do conteúdo e mantém a chamada do professor usável; o resto não recebe adaptação. O shell é fixo: sidebar de 240px e barra de contexto de 48px, em azul profundo nos dois modos. No escuro o conteúdo também é azul profundo, então uma divisória de 1px em linha separa os dois: à direita da sidebar e abaixo da barra, alinhada com a divisória sob a marca. A sidebar recolhe por inteiro (botão na barra ou ⌘B/Ctrl+B), e a área de conteúdo ocupa o resto e rola por dentro.

Dentro da Ficha, o conteúdo tem margem lateral de 24px. O topo traz título e resumo (20px do topo), depois as abas (20px entre elas) sobre uma linha divisória. Barras de ferramentas têm 8px de respiro vertical e divisória embaixo. Tabelas e listas vão de borda a borda da área, com cabeçalho fixo e linhas de 36px; não ficam dentro de cards.

Ritmo: 6px entre ícone e texto, 8px entre controles vizinhos, 12px de respiro interno nos botões, 24px de margem.

## Elevation & Depth

Plano por padrão. A profundidade vem de camadas de tom: o papel é o chão, faixa e realce são o papel um degrau mais fundo, e o elevado marca tudo o que fica por cima. No claro, o degrau é areia escurecida e branco; no escuro, azul profundo clareado. Sombra só existe em superfícies flutuantes (popover, modal, toast) e no item ativo do controle segmentado; nada tem sombra parada na página. No escuro a sombra quase não aparece, então o contorno linha forte é o que separa o elevado do papel (o degrau de tom sozinho dá só 1,12:1).

### Shadow Vocabulary
- **Pressionado** (`box-shadow: 0 1px 2px rgba(0,0,0,.1)`): item ativo do controle segmentado.
- **Popover** (`box-shadow: 0 12px 32px -12px rgba(0,0,0,.28)`): menus e seletores.
- **Toast** (`box-shadow: 0 8px 24px -8px rgba(0,0,0,.35)`): aviso no canto.
- **Modal** (`box-shadow: 0 24px 60px -20px rgba(0,0,0,.4)`): diálogo, sobre o véu (veu).

### Named Rules
**A Regra do Degrau de Luz.** O que fica acima da página sobe um degrau de luz: branco no claro, elevado-escuro no escuro. Se é elevado, é um controle ou flutua; se é papel, é o chão. Branco nunca é chão.

## Shapes

Cantos suaves e consistentes por tamanho: 4px em tags, 6px em itens internos (segmento ativo, botão fantasma), 8px em botões, campos e trilhos, 10px em popovers, 12px em modais. Interruptores, avatares e pontos de status são círculos completos. Contornos de 1px em linha forte; divisórias de 1px em linha. Nenhuma borda colorida grossa.

## Components

Discretos e exatos: compactos, de contorno fino, sem sombra parada. A cor só aparece onde há ação ou pendência.

### Buttons
- **Shape:** cantos suaves (8px), altura 32px, 12px de respiro lateral, ícone de 16px a 6px do texto.
- **Primary:** fundo marca, texto sobre-marca: petróleo com texto areia no claro, areia com texto petróleo no escuro. Um por área.
- **Hover / Focus:** marca a 90% no hover; anel de foco de 2px com 2px de afastamento, em petróleo no claro e petróleo luz no escuro.
- **Secondary:** fundo elevado, contorno linha forte, texto tinta; realce no hover; desabilitado a 40% de opacidade.
- **Ghost:** sem fundo, 28px, texto tinta 2; realce e tinta no hover.
- **Danger:** fundo ruim, texto sobre-ruim (branco no claro, quase preto no escuro), só para confirmação destrutiva.

### Chips
- **Style:** tag em etiqueta com texto etiqueta-tinta (4px, 24px de altura). Extra ou selecionado em seleção com texto e contorno marca-tinta (contorno a 40%).
- **State:** "sem perfil" e outras pendências em cobre a 15% com texto cobre-tinta.

### Inputs / Fields
- **Style:** elevado, contorno linha forte, 8px de canto, 32px de altura; busca com ícone de 14px em tinta 3.
- **Focus:** contorno vira marca-tinta (petróleo no claro, petróleo luz no escuro).
- **Error / Disabled:** contorno ruim com `aria-invalid`; mensagem abaixo em ruim.

### Navigation
- **Abas da página:** texto 13px/500 em tinta 3; ativa em tinta com sublinhado de 2px; hover em tinta 2.
- **Controle segmentado:** trilho em etiqueta; ativo em elevado com sombra "pressionado"; contagem em algarismos tabulares tinta 3.
- **Shell:** sidebar e barra de contexto com a classe `.shell`, que aplica os tokens do escuro nos dois modos: fundo papel (azul profundo), Atkinson Hyperlegible Next, `color-scheme: dark` e barra de rolagem em linha forte. A estrutura, os itens e os grupos vêm de `js/shell.js` (o menu só mostra o que o perfil e o plano liberam); o estilo vive só em `styles.css`.
- **Item do menu:** 32px, 13px em tinta 2 (8,22:1), ícone de 16px em tinta 3, cantos de 6px. Hover em realce com texto em tinta. Ativo em seleção, com texto e ícone em tinta e peso 600 (10,68:1); nenhuma barra ou borda colorida.
- **Rótulo de grupo:** botão de 28px que recolhe o grupo, em label (12px/500) e tinta 3 (5,74:1), sem caixa alta; seta de 12px que gira −90° com o grupo fechado.
- **Barra de contexto:** diz onde você está, não o que a tela é. Botão de recolher o menu e o nome do módulo como único h1, em title (13px/600, tinta); à direita, tema e usuário em botões fantasma de 32px. O título da tela fica no conteúdo.
- **Usuário:** avatar de 32px, círculo em seleção com iniciais em tinta; nome em tinta, cargo em tinta 3 (5,74:1). O bloco abre o painel de demonstração (trocar de usuário, plano, restaurar).

### Status
Ponto de 7px + texto. Ativo: ponto bom e texto tinta. Inativo: ponto tinta 3 a 60% e texto tinta 3. Nunca pílula colorida.

### Interruptor
Ligado: trilho marca com bolinha sobre-marca (petróleo e areia no claro, areia e petróleo no escuro). Desligado: trilho elevado com contorno linha forte e bolinha tinta 3. Versão mini (16px) para células de matriz.

### Toast
Aviso curto no canto, sempre no contraste máximo do modo: azul profundo com areia no claro, areia com azul profundo no escuro. Usa a classe `ficha-inverso` (tokens do modo oposto) com fundo papel e texto tinta. Ponto de estado à esquerda: bom, aviso ou ruim.

### Named Rules
**A Regra do Shell Escuro.** O shell é azul profundo nos dois modos e não troca com o tema; o que troca é o conteúdo ao lado. Ele usa os papéis do escuro, nunca hex nem cor do Tailwind, e no escuro é a divisória linha que o separa do conteúdo.

## Do's and Don'ts

### Do:
- **Do** usar os valores exatos da paleta: azul profundo `#071E2C`, petróleo `#0F3D4E`, cobre `#C47A3A`, areia `#F5F0E8`, cinza `#64727A`.
- **Do** usar areia como papel no claro e como tinta no escuro; azul profundo faz o caminho inverso.
- **Do** usar cobre-tinta (ou cobre-tinta-escuro) sempre que o cobre virar texto.
- **Do** medir o contraste de todo tom novo contra o papel e o elevado dos dois modos e anotar as razões no token.
- **Do** conferir toda tela no claro e no escuro antes de dar como pronta.
- **Do** criar todo token novo em par: valor no `:root` e no `html.dark`.
- **Do** usar o gradiente oficial (petróleo até 52%, depois cobre, do canto superior esquerdo ao inferior direito) só no símbolo e em momentos de marca.
- **Do** separar registros com divisórias e faixas, não com cards.

### Don't:
- **Don't** colocar texto branco sobre cobre (3,39:1) nem usar cobre como fundo de botão.
- **Don't** usar o cobre oficial como texto sobre areia (2,99:1).
- **Don't** criar quase-duplicatas da paleta, como `#68737A` no lugar de `#64727A` ou `#13262F` no lugar de `#071E2C`.
- **Don't** usar branco como fundo de página no claro, nem preto ou grafite como papel no escuro.
- **Don't** usar o gradiente em botões, barras ou fundos de interface: o meio da transição vira marrom (`#695B44`).
- **Don't** distinguir significado só por petróleo contra azul profundo (1,46:1); servem como camadas, não como sinal.
- **Don't** criar um âmbar ou amarelo de aviso; atenção é cobre.
- **Don't** escrever hex fixo, cor do Tailwind (slate, neutral, black) ou variante `dark:` dentro de componentes da Ficha; quem troca de modo é o token `--f-*`.

## Painéis

Um painel não é a ficha de um registro: é a folha de resumo que a diretoria lê antes de abrir as fichas. Mesmo papel, mesma tinta, mesmas divisórias; muda a ordem de leitura: número, comparação, evidência, pendência. Validado no original num mock da Visão executiva em 2026-10-14, nos dois modos. No MVP, a linha de indicadores da Visão geral (`inicio.html`) e o resumo do Financeiro já seguem as regras abaixo.

### Named Rules
**A Regra do Número-Chefe.** Um número por painel em `destaque` (Atkinson Hyperlegible Next 600, 48px/52px, −0,025em, algarismos proporcionais). Nunca em serifa: painel não tem registro aberto.

**A Regra da Linha de Indicadores.** Indicadores ficam lado a lado sobre o papel, separados por divisórias de 1px em linha, sem fundo, canto ou sombra. Cada célula: rótulo (label, tinta 3), valor em `indicador` (Atkinson Hyperlegible Next 600, 24px/28px, −0,02em), contexto (12px, tinta 2) e o link para a lista que explica o número. A célula inteira é clicável e ganha realce no hover. Pendência é ponto cobre antes do rótulo; o valor continua em tinta.

**A Regra da Tinta nos Dados.** A série principal de um gráfico é tinta (`dado`: 15,0:1 sobre o papel nos dois modos). Dado pendente usa `dado-pendente` (cobre-tinta no claro, 4,93:1; cobre no escuro, 5,03:1; o cobre oficial como marca no claro dá 2,99:1). Petróleo nunca é cor de série. No máximo duas cores por gráfico; a terceira distinção é forma (hachura a 45°, traço). Mais de duas séries viram gráficos pequenos lado a lado ou tabela.

**A Regra do Traço de Referência.** Meta e período anterior são traço de 2px em `dado-referencia` (tinta 3: 4,78:1 no claro, 5,74:1 no escuro), nunca barra ou área. O que ainda não fechou (mês corrente, parcela a vencer) é hachura de tinta a 45°. Grade em linha de 1px; linha de base em linha forte.

**A Regra do Azul e do Vermelho.** Cor em número só quando a tela sabe se ele é bom ou ruim, nunca só porque subiu ou desceu. Vermelho (`ruim`) é perda: resultado ou saldo negativo, sempre com o sinal −. Positivo fica em tinta, "no azul". Verde (`bom`) confirma o que fechou bem: meta batida no fechamento, parcela quitada, sempre com ✓ ou texto. Entrada e saída não levam cor: sinal e posição (saída abaixo do zero), porque pagar é a operação normal. Variação no meio do período é seta, valor e período nomeado, em tinta 2. Vermelho e cobre quase se confundem (ΔE 6,7 no claro, 10,6 no escuro): vermelho só como número com sinal; cobre só como ponto, traço ou barra, com o valor em tinta.

**A Regra da Tabela por Trás.** Todo gráfico tem o controle segmentado "Gráfico | Tabela" e dica no hover com os valores do ponto. É o canal que não depende de cor.

### Medidor
Trilho em etiqueta, preenchimento `dado`, 6px de altura, cantos completos. O esperado (meta até hoje, mínimo da turma) é traço de 2px em `dado-referencia` com 2px de papel em volta. O preenchimento vira `dado-pendente` quando cruza um limite com ação, como a turma abaixo do mínimo.

### Medidas das cores de gráfico
ΔE em OKLab ×100, daltonismo simulado por Machado 2009. Séries vizinhas precisam de ΔE 15 na visão normal e 8 sob protanopia e deuteranopia; marcas precisam de 3:1 sobre o papel.
- Claro, tinta + cobre-tinta: ΔE 33,4 (normal) e 27,3 (protanopia); marcas 15,0:1 e 4,93:1.
- Escuro, areia + cobre: ΔE 32,9 e 31,6 (deuteranopia); marcas 15,0:1 e 5,03:1.
- Verde × vermelho: ΔE 7,0 no claro e 5,1 no escuro sob deuteranopia; por isso nunca andam sem sinal ou ✓.
- Croma das cores oficiais: só o cobre passa do piso de 0,10 (azul profundo 0,04, petróleo 0,056, cinza 0,021). A paleta não tem uma segunda cor de série.
