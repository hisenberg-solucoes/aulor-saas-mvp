// ============================================================
// Modelos de contrato (V1, tela nova): o texto que vai para a assinatura
// digital, com campos {{grupo.campo}} preenchidos com os dados reais da
// venda: contratante, alunos, turma e pagamento. Cada modelo vale para um
// ou mais centros de receita (B2B, B2C, Orion…); a venda usa o modelo ativo
// do centro dela e, sem nenhum, o modelo padrão.
// Cadastro em modelos-contrato.html / modelo-contrato.html; o contrato da
// venda (contrato.html, aba Documentos) sai daqui.
// Persistência: localStorage, chave própria.
// ============================================================

const CAMPOS_CONTRATO = [
  { grupo: 'Escola', campos: [['escola.nome', 'Razão social da escola'], ['escola.email', 'E-mail de contratos da escola']] },
  { grupo: 'Venda', campos: [['venda.codigo', 'Código da venda'], ['venda.data', 'Data da venda'], ['venda.objeto', 'Cursos e turmas vendidos']] },
  { grupo: 'Contratante', campos: [['contratante.nome', 'Nome ou razão social'], ['contratante.documento', 'CPF ou CNPJ'], ['contratante.email', 'E-mail']] },
  { grupo: 'Aluno', campos: [['aluno.nome', 'Nome do aluno'], ['aluno.cpf', 'CPF do aluno'], ['alunos.lista', 'Todos os alunos da venda']] },
  { grupo: 'Turma', campos: [['turma.codigo', 'Código da turma'], ['turma.curso', 'Curso'], ['turma.inicio', 'Início das aulas'], ['turma.fim', 'Fim das aulas'], ['turma.cargaHoraria', 'Carga horária']] },
  { grupo: 'Pagamento', campos: [['pagamento.total', 'Valor total'], ['pagamento.desconto', 'Desconto'], ['pagamento.parcelas', 'Número de parcelas'], ['pagamento.forma', 'Forma de pagamento'], ['pagamento.primeiroVencimento', '1º vencimento']] },
];

const MODELOS_CONTRATO_SEED = [
  {
    id: 'mc-servicos', nome: 'Prestação de serviços educacionais', padrao: true, status: 'ativo',
    descricao: 'Venda para pessoa física, paga pelo aluno ou pelo responsável.', centrosReceita: ['cr-b2c', 'cr-orion'], atualizadoEm: '2026-10-20',
    texto: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS Nº {{venda.codigo}}

CONTRATADA: {{escola.nome}}.
CONTRATANTE: {{contratante.nome}}, inscrito(a) no CPF/CNPJ {{contratante.documento}}, e-mail {{contratante.email}}.
ALUNO(A): {{aluno.nome}}, CPF {{aluno.cpf}}.

CLÁUSULA 1ª – DO OBJETO. A CONTRATADA prestará ao(à) ALUNO(A) o curso {{turma.curso}}, na turma {{turma.codigo}}, com carga horária de {{turma.cargaHoraria}}, de {{turma.inicio}} a {{turma.fim}}.

CLÁUSULA 2ª – DO PREÇO E DO PAGAMENTO. O valor total é de {{pagamento.total}}, com desconto de {{pagamento.desconto}}, pago em {{pagamento.parcelas}} parcela(s) por {{pagamento.forma}}, com o primeiro vencimento em {{pagamento.primeiroVencimento}}.

CLÁUSULA 3ª – DA FREQUÊNCIA E DA REPOSIÇÃO. As aulas seguem o calendário da turma. Aulas canceladas pela CONTRATADA são repostas em data informada com antecedência.

CLÁUSULA 4ª – DOS DADOS PESSOAIS. Os dados do(a) CONTRATANTE e do(a) ALUNO(A) são tratados conforme a Lei nº 13.709/2018 (LGPD), apenas para a execução deste contrato e para as obrigações fiscais, como a emissão da nota fiscal.

CLÁUSULA 5ª – DO CANCELAMENTO. O cancelamento segue as condições da política comercial vigente na data da venda.

E, por estarem de acordo, as partes assinam este contrato digitalmente em {{venda.data}}.`,
  },
  {
    id: 'mc-corporativo', nome: 'Contrato corporativo', padrao: false, status: 'ativo',
    descricao: 'Venda para empresa, com vagas para as pessoas que ela indicar.', centrosReceita: ['cr-b2b'], atualizadoEm: '2026-10-20',
    texto: `CONTRATO DE TREINAMENTO CORPORATIVO Nº {{venda.codigo}}

CONTRATADA: {{escola.nome}}.
CONTRATANTE: {{contratante.nome}}, CNPJ {{contratante.documento}}, e-mail de cobrança {{contratante.email}}.

CLÁUSULA 1ª – DO OBJETO. Treinamento em {{venda.objeto}}.

CLÁUSULA 2ª – DOS PARTICIPANTES. Participam os colaboradores indicados pela CONTRATANTE, relacionados no anexo e atualizados durante a vigência: {{alunos.lista}}.

CLÁUSULA 3ª – DO PREÇO E DO PAGAMENTO. O valor total é de {{pagamento.total}}, em {{pagamento.parcelas}} parcela(s) por {{pagamento.forma}}, com o primeiro vencimento em {{pagamento.primeiroVencimento}}. A nota fiscal é emitida contra a CONTRATANTE.

CLÁUSULA 4ª – DOS DADOS PESSOAIS. Os dados dos participantes são tratados conforme a LGPD, apenas para a execução deste contrato.

E, por estarem de acordo, as partes assinam este contrato digitalmente em {{venda.data}}.`,
  },
];

const ModelosContrato = (() => {
  const CHAVE = 'aulor-v1-modelos-contrato-v1';
  const CONHECIDOS = new Set(CAMPOS_CONTRATO.flatMap((g) => g.campos.map(([id]) => id)));
  const clonar = (x) => JSON.parse(JSON.stringify(x));

  function carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (Array.isArray(salvo)) return salvo;
    } catch (_) { /* semente */ }
    return clonar(MODELOS_CONTRATO_SEED);
  }
  const salvarTodos = (lista) => localStorage.setItem(CHAVE, JSON.stringify(lista));
  const porId = (id, lista = carregar()) => lista.find((m) => m.id === id) ?? null;

  const camposDoTexto = (texto) => [...new Set([...String(texto ?? '').matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]))];
  const desconhecidos = (texto) => camposDoTexto(texto).filter((c) => !CONHECIDOS.has(c));

  function validar(m, lista = carregar()) {
    const erros = {};
    const nome = String(m.nome ?? '').trim();
    if (!nome) erros.nome = 'Informe o nome do modelo.';
    else if (lista.some((x) => x.id !== m.id && x.nome.trim().toLowerCase() === nome.toLowerCase())) erros.nome = 'Já existe um modelo com esse nome.';
    if (!String(m.texto ?? '').trim()) erros.texto = 'Escreva o texto do contrato.';
    else if (desconhecidos(m.texto).length) erros.texto = `Campo desconhecido: ${desconhecidos(m.texto).map((c) => `{{${c}}}`).join(', ')}.`;
    return erros;
  }

  // Grava (cria quando não tem id). Marcar como padrão desmarca os outros. Devolve { erros } ou { modelo }.
  function salvar(dados) {
    let lista = carregar();
    const erros = validar(dados, lista);
    if (Object.keys(erros).length) return { erros };
    const modelo = {
      status: 'ativo', padrao: false, centrosReceita: [], descricao: '',
      ...dados, nome: dados.nome.trim(), descricao: String(dados.descricao ?? '').trim(),
      id: dados.id || `mc-${Date.now().toString(36)}`, atualizadoEm: new Date().toISOString().slice(0, 10),
    };
    if (modelo.padrao) lista = lista.map((m) => ({ ...m, padrao: false }));
    lista = lista.some((m) => m.id === modelo.id) ? lista.map((m) => (m.id === modelo.id ? modelo : m)) : [...lista, modelo];
    salvarTodos(lista);
    return { modelo };
  }

  function remover(id) {
    const m = porId(id);
    if (m?.padrao) return { erro: 'É o modelo padrão: defina outro como padrão antes de excluir.' };
    salvarTodos(carregar().filter((x) => x.id !== id));
    return {};
  }

  // O modelo da venda: o ativo do centro de receita dela; sem nenhum, o padrão.
  function daVenda(c, lista = carregar()) {
    const ativos = lista.filter((m) => m.status !== 'inativo');
    return ativos.find((m) => c?.centroReceitaId && m.centrosReceita?.includes(c.centroReceitaId)) ?? ativos.find((m) => m.padrao) ?? ativos[0] ?? null;
  }

  // Dados reais da venda para os campos. ctx = { alunos, empresas, responsaveis, cursos, formacoes } (como em contratos-app).
  // Campo sem dado fica de fora, e o preenchimento o marca como faltando.
  function dadosDaVenda(c, ctx) {
    const d = {};
    const pos = (chave, valor) => { if (valor != null && valor !== '') d[chave] = String(valor); };
    const data = (iso) => (iso ? Contratos.fmtData(iso) : '');
    pos('escola.nome', typeof ESCOLA_SIGNATARIA !== 'undefined' ? ESCOLA_SIGNATARIA.nome : 'ProWay Informática e Treinamentos');
    pos('escola.email', typeof ESCOLA_SIGNATARIA !== 'undefined' ? ESCOLA_SIGNATARIA.email : '');
    pos('venda.codigo', c.codigo);
    pos('venda.data', data(c.criadoEm ?? c.data ?? c.dataVenda));
    pos('venda.objeto', Contratos.descricao(ctx, c));
    const r = Contratos.responsavelFinanceiro(ctx, c);
    if (c.contratante) { pos('contratante.nome', r.nome); pos('contratante.documento', r.documento); pos('contratante.email', r.email); }
    const alunos = (c.alunos ?? []).filter((v) => v.situacao !== 'removido').map((v) => Clientes.porId(ctx.alunos, v.alunoId)).filter(Boolean);
    if (alunos[0]) { pos('aluno.nome', alunos[0].nomeSocial || alunos[0].nome); pos('aluno.cpf', alunos[0].cpf ? Clientes.fmtCpf(alunos[0].cpf) : ''); }
    pos('alunos.lista', alunos.map((a) => a.nomeSocial || a.nome).join(', '));
    const turmaId = (c.pacotes ?? []).flatMap((p) => p.itens ?? []).find((i) => i.turmaId)?.turmaId;
    const turma = turmaId && typeof Turmas !== 'undefined' ? Turmas.porId(Turmas.carregar(), turmaId) : null;
    if (turma) {
      const curso = ctx.cursos?.find((x) => x.id === turma.cursoId);
      pos('turma.codigo', turma.codigo);
      pos('turma.curso', curso?.nome);
      pos('turma.inicio', data(turma.inicio));
      pos('turma.fim', data(turma.fim));
      pos('turma.cargaHoraria', curso?.cargaHoraria ? `${curso.cargaHoraria} horas` : '');
    }
    const t = Contratos.totais(c);
    pos('pagamento.total', Contratos.fmtMoeda(t.final));
    pos('pagamento.desconto', Contratos.fmtMoeda(t.desconto ?? 0));
    pos('pagamento.parcelas', c.cobranca?.parcelas);
    pos('pagamento.forma', typeof FORMAS_COBRANCA !== 'undefined' ? FORMAS_COBRANCA.find((f) => f.id === c.cobranca?.forma)?.nome?.toLowerCase() : c.cobranca?.forma);
    pos('pagamento.primeiroVencimento', data(c.cobranca?.primeiroVencimento));
    return d;
  }

  // Texto preenchido em HTML: um <p> por parágrafo; campo sem dado vira [Rótulo] marcado (data-faltando).
  function preencherHtml(texto, dados, esc) {
    const rotulo = Object.fromEntries(CAMPOS_CONTRATO.flatMap((g) => g.campos));
    return String(texto ?? '').split(/\n{2,}/).map((par) => `<p>${esc(par).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, campo) => (
      dados[campo] != null ? esc(dados[campo]) : `<mark data-faltando="${campo}" title="Sem dado na venda: {{${campo}}}" class="rounded px-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">[${esc(rotulo[campo] ?? campo)}]</mark>`
    )).replace(/\n/g, '<br>')}</p>`).join('');
  }

  const faltando = (texto, dados) => camposDoTexto(texto).filter((c) => dados[c] == null);

  return { CHAVE, carregar, porId, salvar, remover, validar, camposDoTexto, desconhecidos, daVenda, dadosDaVenda, preencherHtml, faltando };
})();
