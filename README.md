# Aulor — protótipo da V1

Protótipo navegável da primeira versão do Aulor, no escopo que a ProWay aprovou em 26/10/2026 ("Aulor – Escopo da primeira versão (V1)"). As telas vêm do protótipo [`snorlax-jornada`](https://github.com/hisenberg-solucoes/snorlax-jornada), de onde o escopo foi tirado, cortadas tela a tela para a V1, no visual do `DESIGN.md` do [`aulor-web`](https://github.com/hisenberg-solucoes/aulor-web) ("Ficha em cartões"). Os dados são os do protótipo original.

- [ESCOPO_V1.md](ESCOPO_V1.md): o que entrou, onde está cada decisão do documento e os pontos em aberto.
- [`implementacao.html`](implementacao.html): para o time, o mapa das telas da V1 com o que cada uma já tem no aulor-web e na aulor-api, feature por feature. Os dados são um retrato à mão em `js/implementacao-data.js`, com os commits conferidos; ao atualizar, mude o retrato junto.

**Demonstração online:** https://hisenberg-solucoes.github.io/aulor-saas-mvp/ (os dados ficam no navegador de quem abre).

## Rodar localmente

Na raiz deste diretório:

```bash
python3 -m http.server 8770
```

Abra `http://localhost:8770/`. A entrada pede primeiro o portal (administrativo, aluno ou professor) e lista as contas de demonstração dele (senha `123456`): administradora, comercial, vendedor externo, coordenação, financeiro, professor e aluno. Não há build nem dependências: HTML estático, Tailwind v4 pelo CDN e JavaScript sem framework.

## Testes

```bash
node --test tests/*.mjs
```

`tests/links.test.mjs` acusa qualquer página ou script citado que não existe; os outros cobrem os motores (vendas, turmas e aulas, feriados, financeiro, centros de receita, instrutores, convites de cadastro, materiais, modelos de contrato e área do curso).

## Estrutura

Cada tela é um `.html` com o shell, os dados (`js/*-data.js`), as regras (`js/*-motor.js`) e a tela (`js/*-app.js`), no padrão do protótipo original. O que é da V1:

| Arquivo | Papel |
|---|---|
| `styles.css` | Shell e papéis do `DESIGN.md` do aulor-web. As telas usam as classes do Tailwind do protótipo, e as variáveis dessas cores passam a valer os papéis (tinta, apoio, elevado, linha, acento, estado), com o escuro em degraus sobre o azul profundo |
| `js/menu.js` | Menu com os módulos da V1, unidade, Início, nome do módulo na barra e o menu da pessoa; `Sessao` |
| `js/menu-portal.js` | O mesmo shell nos portais do aluno e do professor; cada portal declara os itens em `portal-*/js/menu.js` |
| `js/acesso.js` | No `<head>` de cada tela do administrativo: sem sessão vai para a entrada; tela fora do perfil volta ao Início |
| `entrar.html`, `js/entrar-app.js` | Entrada única: login, escolha do portal, primeiro acesso e recuperação de senha |
| `js/entrada.js` | Quem entra e em qual portal, pelo e-mail; usado pela entrada e pelo convite |
| `js/convites-cadastro.js`, `js/convites-ui.js` | Convite de cadastro de instrutores e colaboradores (AULOR-007): regras e a UI das listas e do cartão Acesso ao sistema |
| `convite.html`, `js/convite-app.js` | Onde o e-mail do convite leva: entrar com o e-mail convidado, "Complete seu cadastro" e "Cadastro concluído" |
| `js/permissoes-data.js` | Catálogo de permissões das telas da V1 e os perfis, com o Vendedor externo |
| `js/centros-receita.js` | Centros de receita (B2B, B2C, Orion), lidos por Vendas e Turmas |
| `js/materiais-motor.js` | Materiais das aulas: cadastro e liberação por data |
| `js/modelos-contrato.js` | Modelos de contrato e o preenchimento com os dados da venda |

Os dados ficam no `localStorage` com chaves `aulor-v1-*`, separadas das do protótipo original (no GitHub Pages os dois dividem a origem). Login e permissões só demonstram: na V1 real, quem autentica e aplica as permissões é o back-end.
