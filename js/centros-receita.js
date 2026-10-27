// ============================================================
// Centros de receita (V1): identificam o tipo de cada venda (B2B, B2C, Orion…).
// Moram no plano financeiro, na mesma lista dos centros de custo
// (plano.centrosCusto, com tipo 'receita'; os de custo têm tipo 'custo' ou
// nenhum), e se cadastram em centros-receita.html. A venda leva o centro no
// lançamento (contrato.centroReceitaId) e a turma pode levar um padrão
// (turma.centroReceitaId), que a venda da turma herda.
// Este arquivo é a semente e a leitura leve para Vendas e Turmas, que não
// carregam o Financeiro. Carregar antes de lancamentos-data.js.
// ============================================================

const CENTROS_RECEITA_SEED = [
  { id: 'cr-b2b', codigo: 'R10', nome: 'B2B', tipo: 'receita', descricao: 'Vendas para empresas: turmas fechadas e vagas compradas por CNPJ.', status: 'ativo' },
  { id: 'cr-b2c', codigo: 'R20', nome: 'B2C', tipo: 'receita', descricao: 'Vendas para pessoa física, pagas pelo aluno ou pelo responsável.', status: 'ativo' },
  { id: 'cr-orion', codigo: 'R30', nome: 'Orion', tipo: 'receita', descricao: 'Vendas do programa Orion.', status: 'ativo' },
];

const CentrosReceita = (() => {
  const CHAVE_PLANO = 'aulor-v1-financeiro-plano-v2'; // a mesma de Lancamentos (js/lancamentos-motor.js)

  function todos() {
    try {
      const p = JSON.parse(localStorage.getItem(CHAVE_PLANO));
      if (p && Array.isArray(p.centrosCusto)) return p.centrosCusto.filter((c) => c.tipo === 'receita');
    } catch (_) { /* semente */ }
    return CENTROS_RECEITA_SEED;
  }

  return {
    todos,
    ativos: () => todos().filter((c) => c.status !== 'inativo'),
    porId: (id) => todos().find((c) => c.id === id) ?? null,
    nome: (id) => todos().find((c) => c.id === id)?.nome ?? '',
  };
})();
