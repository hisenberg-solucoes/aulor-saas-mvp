// ============================================================
// Catálogo comercial (HIPÓTESE em validação — não é política de preços).
// Fonte única de planos, módulos por plano, alunos incluídos e faixas.
// Nenhuma tela ou regra deve repetir esses números: leia daqui.
//
// A assinatura da escola (qual plano + condições especiais) fica nos dados
// da escola (Aulor.assinatura()). Condições especiais sobrescrevem o plano
// para um cliente específico, ex.: { alunosIncluidos: 500 } num contrato
// fundador — sem mudar o comportamento geral do produto.
// ============================================================

const Planos = (() => {
  // fase: 'mvp' = existe neste protótipo; 'futuro' = roadmap; 'institucional' = só no plano superior.
  const MODULOS = [
    { id: 'painel', nome: 'Visão geral da escola', fase: 'mvp' },
    { id: 'cadastros', nome: 'Alunos, cursos, turmas e professores', fase: 'mvp' },
    { id: 'matriculas', nome: 'Matrículas com parcelamento', fase: 'mvp' },
    { id: 'receber', nome: 'Contas a receber e inadimplência', fase: 'mvp' },
    { id: 'frequencia', nome: 'Aulas, chamada e diário', fase: 'mvp' },
    { id: 'certificados', nome: 'Certificados com código de validação', fase: 'mvp' },
    { id: 'acessos', nome: 'Usuários, perfis e permissões', fase: 'mvp' },
    { id: 'pagar', nome: 'Contas a pagar e resultado do mês', fase: 'mvp' },
    { id: 'validacao_publica', nome: 'Página pública de validação de certificados', fase: 'mvp' },
    { id: 'cobranca_integrada', nome: 'Cobrança automática (boleto/Pix) via provedor', fase: 'futuro' },
    { id: 'portal_aluno', nome: 'Portal do aluno', fase: 'futuro' },
    { id: 'relatorios', nome: 'Relatórios exportáveis', fase: 'futuro' },
    { id: 'comunicacao', nome: 'Lembretes por e-mail/WhatsApp', fase: 'futuro' },
    { id: 'assinatura_eletronica', nome: 'Contrato com assinatura eletrônica', fase: 'futuro' },
    { id: 'contratos_corporativos', nome: 'Contratos corporativos (in company, pacotes de vagas)', fase: 'institucional' },
    { id: 'multiunidade', nome: 'Múltiplas unidades', fase: 'institucional' },
    { id: 'instrutores_pj', nome: 'Gestão de instrutores PJ e repasses', fase: 'institucional' },
    { id: 'infraestrutura', nome: 'Salas, laboratórios e softwares', fase: 'institucional' },
    { id: 'compras', nome: 'Compras e estoque', fase: 'institucional' },
    { id: 'crm', nome: 'CRM, metas e comissionamento', fase: 'institucional' },
    { id: 'nfse', nome: 'Emissão de NFS-e', fase: 'institucional' },
    { id: 'sso', nome: 'SSO corporativo', fase: 'institucional' },
  ];

  const ESSENCIAL = ['painel', 'cadastros', 'matriculas', 'receber', 'frequencia', 'certificados', 'acessos'];
  const GESTAO = [...ESSENCIAL, 'pagar', 'validacao_publica', 'cobranca_integrada', 'portal_aluno', 'relatorios', 'comunicacao'];
  const INSTITUCIONAL = MODULOS.map((m) => m.id);

  // preco: null = ainda não definido. Nunca mostrar um número inventado.
  const PLANOS = [
    {
      id: 'essencial', nome: 'Essencial', publico: 'Escolas menores: núcleo acadêmico e financeiro.',
      preco: null, alunosIncluidos: null, faixas: [], modulos: ESSENCIAL,
    },
    {
      id: 'gestao', nome: 'Gestão', publico: 'Operações mais estruturadas: despesas, validação pública e acompanhamento.',
      preco: null, alunosIncluidos: null, faixas: [], modulos: GESTAO,
    },
    {
      id: 'institucional', nome: 'Institucional', publico: 'Operações complexas, processos corporativos e necessidades especializadas.',
      preco: 2500, alunosIncluidos: 300,
      faixas: [
        { de: 301, ate: 500, porAluno: 6 },
        { de: 501, ate: 1000, porAluno: 5 },
      ],
      acimaDaUltimaFaixa: 'sob consulta',
      descontoAnualPercentual: 17,
      modulos: INSTITUCIONAL,
    },
  ];

  const plano = (id) => PLANOS.find((p) => p.id === id) ?? null;
  const modulo = (id) => MODULOS.find((m) => m.id === id) ?? null;

  // Plano efetivo = plano do catálogo + condições especiais do cliente.
  function efetivo(assinatura) {
    const base = plano(assinatura?.planoId) ?? PLANOS[0];
    const c = assinatura?.condicoes ?? {};
    return {
      ...base,
      alunosIncluidos: c.alunosIncluidos ?? base.alunosIncluidos,
      preco: c.preco ?? base.preco,
      modulos: [...new Set([...base.modulos, ...(c.modulosExtras ?? [])])],
      condicoes: c,
    };
  }

  const tem = (assinatura, moduloId) => efetivo(assinatura).modulos.includes(moduloId);

  // Mensalidade estimada pela faixa (cobrança graduada). Devolve null se o plano não tem preço definido.
  function estimar(assinatura, alunosAtivos) {
    const p = efetivo(assinatura);
    if (p.preco == null) return null;
    const incluidos = p.alunosIncluidos ?? 0;
    let adicional = 0;
    let foraDasFaixas = false;
    const excedente = Math.max(0, alunosAtivos - incluidos);
    if (excedente > 0) {
      let restante = excedente;
      let atual = incluidos + 1;
      for (const f of p.faixas) {
        if (restante <= 0) break;
        const inicio = Math.max(f.de, atual);
        if (inicio > f.ate) continue;
        const qtd = Math.min(restante, f.ate - inicio + 1);
        adicional += qtd * f.porAluno;
        restante -= qtd;
        atual = inicio + qtd;
      }
      foraDasFaixas = restante > 0;
    }
    const mensal = p.preco + adicional;
    const anualComDesconto = p.descontoAnualPercentual ? Math.round(mensal * 12 * (1 - p.descontoAnualPercentual / 100) * 100) / 100 : null;
    return { base: p.preco, adicional, mensal, anualComDesconto, foraDasFaixas };
  }

  return { MODULOS, PLANOS, plano, modulo, efetivo, tem, estimar };
})();
