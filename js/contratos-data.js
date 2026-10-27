// ============================================================
// Dados da tela "Contratos" (modelo v7, 29/08/2026 — pacotes × vagas).
// Um CONTRATO vende N PACOTES: cada pacote é uma formação (cursos rateados
// por carga horária) ou cursos avulsos, com valores negociados e um número
// de VAGAS (cobradas mesmo vazias). Os ALUNOS entram depois — pela escola
// ou pelo link do pacote — cada um em exatamente um pacote, recebendo uma
// CÓPIA dos itens do molde (a matrícula: aluno × curso/turma, valor, status),
// ajustável por aluno. O contratante (empresa ou particular com um
// responsável financeiro único) pode ficar vazio em rascunho. Dele saem o
// documento (pacotes × vagas; alunos como anexo vivo), as parcelas/boletos e
// a nota fiscal. Depende de js/clientes-data.js, js/cursos-data.js
// (CURSOS_SEED, TURMAS_CURSO, EDICOES) e js/formacoes-data.js (FORMACOES_SEED).
//
// A semente é GERADA a partir das edições do Super DEV no formato antigo
// (v6: itens presos ao aluno) e convertida por `contratoV6ParaV7` — a mesma
// função que `Contratos.carregar()` usa para migrar dados salvos na chave v6.
// Super DEV 10 (.NET) tem contrato só para os alunos "Ativo" da chamada; os "Interessado" ficam sem.
// ============================================================

const TIPOS_CONTRATANTE = [
  { id: 'empresa', nome: 'Empresa', descricao: 'In company ou empresa pagando pelos colaboradores. Contrato, boleto e NF contra o CNPJ.' },
  { id: 'particular', nome: 'Particular', descricao: 'Um responsável financeiro único (cadastro de Responsável ou um aluno) paga por todos os alunos da venda.' },
];

// Quem é o responsável financeiro de um contrato particular.
const TIPOS_RESPONSAVEL_CONTRATO = [
  { id: 'responsavel', nome: 'Responsável cadastrado', descricao: 'Pai, mãe ou quem paga — cadastro em Responsáveis.' },
  { id: 'aluno', nome: 'Um aluno', descricao: 'O próprio aluno (ou o responsável financeiro cadastrado nele).' },
];

// Situação do vínculo aluno × pacote. Ocupam vaga: aguardando e aprovado.
const SITUACOES_VINCULO = [
  { id: 'aguardando', nome: 'Aguardando conferência', descricao: 'Entrou pelo link do pacote; a escola ainda não aprovou.' },
  { id: 'aprovado', nome: 'Aprovado', descricao: 'Conferido: conta em turma, faturamento e no anexo do documento.' },
  { id: 'recusado', nome: 'Recusado', descricao: 'Não entra; a vaga foi liberada e o cadastro permanece em Clientes.' },
  { id: 'desistente', nome: 'Desistente', descricao: 'Saiu depois do documento; a vaga foi liberada.' },
];

const ORIGENS_VINCULO = [
  { id: 'escola', nome: 'Adicionado pela escola' },
  { id: 'link', nome: 'Entrou pelo link do pacote' },
];

// O que um pacote vende (modal de novo contrato e "+ Pacote").
const TIPOS_VENDA = [
  { id: 'formacao', nome: 'Formação', descricao: 'Trilha completa; o preço da formação é rateado entre os cursos.' },
  { id: 'cursos', nome: 'Cursos avulsos', descricao: 'Um ou mais cursos do catálogo, cada um com seu preço.' },
];

// Fluxo do contrato. `ordem` define o andamento; `terminal` encerra o fluxo.
const STATUS_CONTRATO = [
  { id: 'rascunho', nome: 'Rascunho', ordem: 0, descricao: 'Em montagem: contratante, alunos e itens ainda podem mudar livremente.' },
  { id: 'aguardando', nome: 'Aguardando assinatura e pagamento', curto: 'Aguardando', ordem: 1, descricao: 'Documento gerado e enviado. Falta a assinatura e/ou o pagamento da 1ª parcela.' },
  { id: 'comercial_ok', nome: 'Comercial OK', ordem: 2, descricao: 'Assinado e com a 1ª parcela paga — o comercial fechou.' },
  { id: 'adm_ok', nome: 'Adm OK', ordem: 3, descricao: 'Conferido pela administração: matrículas e cobrança batidas, NF emitida.' },
  { id: 'cancelado', nome: 'Cancelada', ordem: 9, terminal: true, descricao: 'Cancelada; parcelas em aberto são canceladas e matrículas encerradas.' },
];

// Situação de cobrança derivada das parcelas (não é um status escolhido à mão).
const SITUACOES_COBRANCA = [
  { id: 'em_dia', nome: 'Em dia' },
  { id: 'inadimplente', nome: 'Inadimplente' },
  { id: 'recuperante', nome: 'Recuperante' },
  { id: 'quitado', nome: 'Quitado' },
  { id: 'sem_parcelas', nome: 'Sem parcelas' },
];

// Status de cada item (= matrícula do aluno naquele curso/turma).
const STATUS_MATRICULA = [
  { id: 'matriculado', nome: 'Matriculado', descricao: 'Vai cursar / está cursando.' },
  { id: 'congelada', nome: 'Congelada', descricao: 'Aluno pausou a matrícula: não frequenta as aulas e fica fora das contas de frequência até voltar. Segue ocupando a vaga e valendo na venda.' },
  { id: 'concluido', nome: 'Concluído', descricao: 'Terminou a turma.' },
  { id: 'desistiu', nome: 'Desistiu', descricao: 'Saiu da turma; o valor deixa de contar no faturamento dela.' },
  { id: 'cancelada', nome: 'Cancelada', descricao: 'Matrícula cancelada junto com a venda.' },
];

// Motivo do cancelamento de uma matrícula (item "desistiu" ou "cancelada"), gravado em `item.cancelamento = { em, tipo, texto }`.
// [sup.] lista minha, sem base no sistema atual — alimenta "Motivos de cancelamento" nos indicadores pedagógicos.
const MOTIVOS_CANCELAMENTO = [
  { id: 'financeiro', nome: 'Dificuldade financeira' },
  { id: 'horario', nome: 'Horário / trabalho incompatível' },
  { id: 'mudanca', nome: 'Mudança de cidade' },
  { id: 'saude', nome: 'Saúde / família' },
  { id: 'insatisfacao', nome: 'Insatisfação com o curso' },
  { id: 'expectativa', nome: 'Mudou de área / não era o esperado' },
  { id: 'contrato', nome: 'Rescisão do contrato' },
  { id: 'outro', nome: 'Outro' },
  { id: 'nao_informado', nome: 'Não informado' },
];

const STATUS_PARCELA = [
  { id: 'prevista', nome: 'Prevista', descricao: 'Planejada, boleto ainda não emitido.' },
  { id: 'emitida', nome: 'Boleto emitido', descricao: 'Boleto gerado e enviado ao responsável financeiro.' },
  { id: 'paga', nome: 'Paga', descricao: 'Pagamento confirmado.' },
  { id: 'cancelada', nome: 'Cancelada', descricao: 'Cancelada com a venda ou renegociada.' },
];

const MEIOS_ASSINATURA = [
  { id: 'eletronica', nome: 'Assinatura eletrônica (Clicksign)' },
  { id: 'fisica', nome: 'Assinatura física (papel)' },
  { id: 'aceite', nome: 'Aceite por e-mail' },
];

// Quem assina o contrato. As DUAS PARTES são obrigatórias: o contratante
// (empresa ou aluno/responsável) e a escola (ProWay). Alunos que não são o
// contratante entram como signatários opcionais no Clicksign.
const PAPEIS_SIGNATARIO = [
  { id: 'contratante', nome: 'Contratante', descricao: 'Responsável financeiro: empresa (contato principal), o próprio aluno ou o responsável dele.' },
  { id: 'aluno', nome: 'Aluno', descricao: 'Aluno da venda que não é o responsável financeiro (ex.: colaborador da empresa).' },
  { id: 'escola', nome: 'ProWay', descricao: 'A escola, representada pela administração.' },
];
// Partes cuja assinatura é obrigatória para o contrato valer como assinado.
const PARTES_ASSINATURA = [
  { id: 'contratante', nome: 'Contratante (empresa/aluno)' },
  { id: 'escola', nome: 'ProWay' },
];

// Status do envelope no Clicksign.
const STATUS_ENVELOPE = [
  { id: 'enviado', nome: 'Aguardando assinaturas', descricao: 'Envelope criado; cada signatário recebe o link por e-mail.' },
  { id: 'assinado', nome: 'Assinado', descricao: 'Todos os signatários assinaram; o documento assinado fica arquivado.' },
  { id: 'recusado', nome: 'Recusado', descricao: 'Um signatário recusou; é preciso revisar e enviar um novo envelope.' },
  { id: 'cancelado', nome: 'Cancelado', descricao: 'Cancelado pela escola antes de concluir.' },
];

const ESCOLA_SIGNATARIA = { nome: 'ProWay Informática e Treinamentos', email: 'contratos@proway.com.br' };

const VENDEDORES = [
  { id: 'ana', nome: 'Ana Souza' },
  { id: 'bruno', nome: 'Bruno Lima' },
  { id: 'carla', nome: 'Carla Mendes' },
];

const contratoSeed = (d) => ({
  descricao: '', observacoes: '', vendedorId: 'ana',
  contratante: null, // 'empresa' | 'particular' | null (só em rascunho)
  empresaId: null,
  responsavel: null, // { tipo: 'responsavel' | 'aluno', id } quando contratante = particular
  // Pacotes = o que se vende: molde de itens (formação rateada ou avulsos) × vagas. `convite` = link de auto-cadastro do pacote.
  pacotes: [], // [{ id, nome, formacaoId|null, itens: [{ formacaoId|null, cursoId, turmaId|null, valorBase, valorFinal }], vagas, convite: { token, criadoEm, ativo, usos: [{ alunoId, em }] } | null }]
  // Vínculos aluno × pacote. `itens` = cópia do molde (a matrícula, com status próprio); `codigo` = matrícula "codigo-NN".
  alunos: [], // [{ alunoId, pacoteId, situacao, origem, codigo, itens: [{ id, formacaoId|null, cursoId, turmaId|null, valorBase, valorFinal, status }], ajustado, entrouEm, conferidoEm|null, recusa: { em, motivo } | null }]
  cobranca: { forma: 'boleto', parcelas: 1, primeiroVencimento: '', pedidoCompra: '' },
  parcelas: [],
  documento: null, // { geradoEm, versao }
  // Assinatura das duas partes; o contrato só conta como assinado com as duas.
  assinaturas: { contratante: null, escola: null }, // cada uma { assinadoEm, meio, por, envelopeId|null } | null
  envelopes: [], // envelopes Clicksign: { id, envelopeId, versao, enviadoEm, enviadoPor, prazoDias, status, signatarios: [{ id, papel, nome, email, status, assinadoEm, motivo }], concluidoEm, cancelamento, eventos: [{ em, texto, por }] }
  nf: null, // { numero, emitidaEm }
  recuperacao: null, // { desde, acordo }
  cancelamento: null, // { em, motivo, rescisao }
  duplicadoDe: null, // id do contrato de origem quando criado por "Duplicar"
  historico: [],
  ...d,
});

// ---------- Migração v6 → v7 (RN-32) ----------
// v6: `alunoIds`, `responsavelAlunoId`, `itens` (um por aluno × curso) e `convite` por contrato.
// v7: alunos com itens IGUAIS (formação, cursos, valores) viram um pacote (vagas = tamanho do grupo);
// aluno com item a mais/menos vira pacote próprio; vínculos aprovados pela escola; contratante 'alunos'
// vira 'particular' com responsável = o aluno responsável; o link por contrato é descartado.
function contratoV6ParaV7(c, { formacoes = FORMACOES_SEED, cursos = CURSOS_SEED } = {}) {
  if (!Array.isArray(c.alunoIds) && Array.isArray(c.pacotes)) return c;
  const alunoIds = c.alunoIds ?? [];
  const itensV6 = c.itens ?? [];
  const nomeFormacao = (id) => formacoes.find((f) => f.id === id)?.nome ?? id;
  const nomeCurso = (id) => cursos.find((x) => x.id === id)?.nome ?? id;
  const molde = ({ formacaoId, cursoId, turmaId, valorBase, valorFinal }) => ({ formacaoId: formacaoId ?? null, cursoId, turmaId: turmaId ?? null, valorBase: arred2(valorBase), valorFinal: arred2(valorFinal) });
  const assinatura = (its) => JSON.stringify(its.map((i) => [i.formacaoId ?? null, i.cursoId, arred2(i.valorBase), arred2(i.valorFinal)]).sort());
  const grupos = [];
  alunoIds.forEach((alunoId) => {
    const its = itensV6.filter((i) => i.alunoId === alunoId);
    const chave = assinatura(its);
    let g = grupos.find((x) => x.chave === chave);
    if (!g) { g = { chave, alunoIds: [], itens: its.map(molde) }; grupos.push(g); }
    g.alunoIds.push(alunoId);
  });
  const nomePacote = (its) => {
    const formacaoId = its.find((i) => i.formacaoId)?.formacaoId ?? null;
    const avulsos = its.filter((i) => !i.formacaoId);
    if (formacaoId) return `${nomeFormacao(formacaoId)}${avulsos.length ? ` + ${avulsos.length === 1 ? nomeCurso(avulsos[0].cursoId) : `${avulsos.length} cursos avulsos`}` : ''}`;
    if (!avulsos.length) return 'Sem itens';
    return avulsos.length === 1 ? nomeCurso(avulsos[0].cursoId) : `${avulsos.length} cursos avulsos`;
  };
  const pacotes = grupos.map((g, i) => ({ id: `p${i + 1}`, nome: nomePacote(g.itens), formacaoId: g.itens.find((x) => x.formacaoId)?.formacaoId ?? null, itens: g.itens, vagas: g.alunoIds.length, convite: null }));
  const alunos = alunoIds.map((alunoId, idx) => {
    const p = pacotes[grupos.findIndex((g) => g.alunoIds.includes(alunoId))];
    const its = itensV6.filter((i) => i.alunoId === alunoId);
    const desistiu = its.length > 0 && its.every((i) => i.status === 'desistiu');
    return {
      alunoId, pacoteId: p.id, situacao: desistiu ? 'desistente' : 'aprovado', origem: 'escola',
      codigo: its[0]?.codigo ?? `${c.codigo}-${String(idx + 1).padStart(2, '0')}`,
      itens: its.map(({ id, formacaoId, cursoId, turmaId, valorBase, valorFinal, status, cancelamento }) => ({ id, formacaoId: formacaoId ?? null, cursoId, turmaId: turmaId ?? null, valorBase: arred2(valorBase), valorFinal: arred2(valorFinal), status, cancelamento: cancelamento ?? null })),
      ajustado: false, entrouEm: c.criadoEm, conferidoEm: c.criadoEm, recusa: null,
    };
  });
  const { alunoIds: _a, itens: _i, responsavelAlunoId, convite: _c, ...resto } = c;
  const contratante = c.contratante === 'alunos' ? 'particular' : (c.contratante ?? null);
  return contratoSeed({
    ...resto, contratante,
    empresaId: contratante === 'empresa' ? (c.empresaId ?? null) : null,
    responsavel: contratante === 'particular' ? { tipo: 'aluno', id: responsavelAlunoId ?? alunoIds[0] ?? null } : null,
    pacotes, alunos, duplicadoDe: c.duplicadoDe ?? null,
  });
}

// ---------- Geração da semente ----------

// Data de referência da semente (fixa, para o estado das parcelas não mudar com o relógio).
const SEED_HOJE = '2026-08-26';
const arred2 = (n) => Math.round(n * 100) / 100;
const nomeVendedor = (id) => VENDEDORES.find((v) => v.id === id)?.nome ?? 'Ana Souza';
const somarMeses = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); const t = y * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };
const somarDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// Código "AAAA-MM-NNN" sequencial por mês de criação.
const _seq = {};
function codigoContrato(criadoEm) {
  const mes = criadoEm.slice(0, 7);
  _seq[mes] = (_seq[mes] ?? 0) + 1;
  return `${mes}-${String(_seq[mes]).padStart(3, '0')}`;
}

// Rateio do preço da formação por carga horária (mesma regra de Contratos.ratear; centavos no último).
function ratearSeed(valor, cursos) {
  const total = cursos.reduce((s, c) => s + (Number(c.cargaHoraria) || 0), 0);
  const partes = cursos.map((c) => arred2(valor * (Number(c.cargaHoraria) || 0) / total));
  const soma = arred2(partes.reduce((s, v) => s + v, 0));
  partes[partes.length - 1] = arred2(partes[partes.length - 1] + (arred2(valor) - soma));
  return partes;
}

const cursoSeedDe = (id) => CURSOS_SEED.find((c) => c.id === id);
const turmaSeedDe = (id) => TURMAS_CURSO.find((t) => t.id === id) ?? null;

// Modelos de item de uma formação numa edição: um por curso, apontando a turma da edição, rateado por carga horária.
function itensFormacao(formacaoId, edicao, precoBase, fator = 1) {
  const f = FORMACOES_SEED.find((x) => x.id === formacaoId);
  const cursos = f.itens.map((i) => cursoSeedDe(i.cursoId));
  const base = ratearSeed(precoBase, cursos);
  const final = fator === 1 ? base : ratearSeed(arred2(precoBase * fator), cursos);
  return cursos.map((c, i) => ({ formacaoId, cursoId: c.id, turmaId: turmaSeedDe(`${edicao}-${c.id}`) ? `${edicao}-${c.id}` : null, valorBase: base[i], valorFinal: final[i] }));
}

// Modelo de item avulso: preço de referência do curso, turma opcional.
// Os ids das turmas avulsas (`ta56`…) mudam quando a semente de turmas cresce; se o id pedido
// não existir, usa a turma avulsa mais próxima do curso (aberta ou in company).
function itemAvulso(cursoId, turmaId, valorFinal = null) {
  const preco = Number(cursoSeedDe(cursoId).comercial.precoReferencia) || 0;
  const turma = turmaSeedDe(turmaId) ?? TURMAS_CURSO.find((t) => t.cursoId === cursoId && t.tipo !== 'formacao') ?? null;
  return { formacaoId: null, cursoId, turmaId: turma?.id ?? null, valorBase: preco, valorFinal: valorFinal ?? preco };
}

// Itens (= matrículas) de cada aluno a partir dos modelos. `porAluno` = { alunoId: [modelos] }.
// Status pela turma: terminou antes de SEED_HOJE → concluído; senão matriculado.
// `desistencias` = { alunoId: 'AAAA-MM-DD' | { em, motivo, texto } } → itens cujas turmas começam depois da data viram "desistiu"
// (com `cancelamento` = { em, tipo: motivo, texto }; string pura = motivo não informado).
// `congelamentos` = { alunoId: 'AAAA-MM-DD' } → itens ainda matriculados cujas turmas não terminaram antes da data viram "congelada".
function itensDe(codigo, alunoIds, porAluno, { desistencias = {}, congelamentos = {}, todas = null } = {}) {
  const itens = [];
  alunoIds.forEach((alunoId, ai) => (porAluno[alunoId] ?? []).forEach((mod) => {
    const turma = turmaSeedDe(mod.turmaId);
    let status = todas ?? (turma && turma.fim < SEED_HOJE ? 'concluido' : 'matriculado');
    const des = desistencias[alunoId];
    const desde = typeof des === 'string' ? des : des?.em;
    if (desde && turma && turma.inicio >= desde) status = 'desistiu';
    if (desde && !turma) status = 'desistiu';
    const congelouEm = congelamentos[alunoId];
    if (congelouEm && status === 'matriculado' && (!turma || turma.fim >= congelouEm)) status = 'congelada';
    const cancelamento = status === 'desistiu' ? { em: `${desde}T10:00:00`, tipo: typeof des === 'object' ? des.motivo ?? 'nao_informado' : 'nao_informado', texto: typeof des === 'object' ? des.texto ?? '' : '' }
      : status === 'cancelada' ? { em: null, tipo: 'contrato', texto: '' } : null;
    itens.push({ id: `i${itens.length + 1}`, alunoId, codigo: `${codigo}-${String(ai + 1).padStart(2, '0')}`, ...mod, status, cancelamento });
  }));
  return itens;
}

// Parcelas iguais (centavos na 1ª). Vencidas antes de SEED_HOJE ficam pagas, salvo as listadas em `atrasadas`.
// `emitidas`: boletos já gerados (senão ficam previstas). `canceladasAPartir`: nº da parcela a partir da qual cancelam.
function parcelasDe(total, n, primeiro, { emitidas = true, emitidaEm = null, atrasadas = [], canceladasAPartir = null, pagasAte = null } = {}) {
  const valor = arred2(total / n);
  const primeira = arred2(total - valor * (n - 1));
  return Array.from({ length: n }, (_, i) => {
    const num = i + 1;
    const vencimento = somarMeses(primeiro, i);
    const p = { n: num, vencimento, valor: i === 0 ? primeira : valor, status: 'prevista', emitidaEm: null, pagoEm: null };
    if (canceladasAPartir && num >= canceladasAPartir) return { ...p, status: 'cancelada' };
    if (!emitidas) return p;
    p.emitidaEm = emitidaEm ?? somarDias(primeiro, -20);
    p.status = 'emitida';
    const vencida = vencimento < SEED_HOJE || (pagasAte && vencimento <= pagasAte);
    if (vencida && !atrasadas.includes(num)) { p.status = 'paga'; p.pagoEm = somarDias(vencimento, -(num % 3)); }
    return p;
  });
}

// Histórico padrão conforme o status alcançado.
function historicoDe({ criadoEm, vendedorId, status, documento, assinaturas, envelopes = [], nf, parcelas, extras = [] }) {
  const por = nomeVendedor(vendedorId);
  const ev = (em, texto, quem = por) => ({ em, texto, por: quem });
  const h = [ev(criadoEm, 'Venda criada')];
  if (documento) h.push(ev(documento.geradoEm, `Documento gerado (v${documento.versao})`));
  envelopes.forEach((e) => e.eventos.forEach((x) => h.push(ev(x.em, x.texto, x.por))));
  PARTES_ASSINATURA.forEach((p) => { const a = assinaturas?.[p.id]; if (a && !a.envelopeId) h.push(ev(`${a.assinadoEm}T${p.id === 'escola' ? '11' : '10'}:00:00`, `${p.nome} assinou fora do Clicksign (${MEIOS_ASSINATURA.find((m) => m.id === a.meio)?.nome.toLowerCase()}) — ${a.por}`)); });
  const emitida = parcelas.find((p) => p.emitidaEm);
  if (emitida) h.push(ev(`${emitida.emitidaEm}T09:00:00`, `Boletos 1 a ${parcelas.filter((p) => p.emitidaEm).length} emitidos`, 'Sistema'));
  const paga1 = parcelas.find((p) => p.n === 1 && p.status === 'paga');
  if (paga1 && ['comercial_ok', 'adm_ok'].includes(status)) h.push(ev(`${paga1.pagoEm}T14:00:00`, `Parcela 1/${parcelas.length} paga · Comercial OK`));
  if (nf) h.push(ev(`${nf.emitidaEm}T11:00:00`, `NF ${nf.numero} emitida · Adm OK`, 'Sistema'));
  return [...h, ...extras].sort((a, b) => a.em.localeCompare(b.em));
}

let _nf = 0;
const nfDe = (data) => ({ numero: `${data.slice(0, 4)}-${String(100 + (++_nf) * 7).padStart(6, '0')}`, emitidaEm: data });

// Envelope Clicksign da semente (só meio eletrônico). Escola assina logo após o envio;
// o contratante assina em `assinatura.assinadoEm` ou fica pendente. `lembretes` = datas de reenvio.
let _env = 0;
function envelopeSeed({ documento, assinatura, contratante, alunosExtras = [], por, cancelamento = null, lembretes = [] }) {
  const id = `env${++_env}`;
  const envelopeId = `CS-${String(2600 + _env * 37).padStart(6, '0')}`;
  const enviadoEm = documento.geradoEm.slice(0, 16).replace(/(\d{2}):(\d{2})$/, (_, h, m) => `${h}:${String(Number(m) + 5).padStart(2, '0')}`) + ':00';
  const escolaEm = enviadoEm.slice(0, 11) + '18:30:00';
  const eventos = [{ em: enviadoEm, texto: `Enviado ao Clicksign (${envelopeId}) para ${[contratante.nome, ...alunosExtras.map((a) => a.nome), 'ProWay'].join(', ')}`, por }];
  const sig = (papel, pessoa, assinadoEm, idx = '') => ({ id: `${papel}${idx}`, papel, nome: pessoa.nome, email: pessoa.email, status: assinadoEm ? 'assinado' : 'pendente', assinadoEm: assinadoEm ?? null, motivo: '' });
  const escola = sig('escola', ESCOLA_SIGNATARIA, escolaEm);
  eventos.push({ em: escolaEm, texto: 'ProWay assinou (Clicksign)', por: 'Clicksign' });
  const assinouEm = assinatura ? `${assinatura.assinadoEm}T19:10:00` : null;
  const contr = sig('contratante', contratante, assinouEm);
  const alunos = alunosExtras.map((a, i) => sig('aluno', a, assinatura ? `${assinatura.assinadoEm}T${20 + i}:20:00` : null, `:${i + 1}`));
  lembretes.forEach((d) => eventos.push({ em: `${d}T09:00:00`, texto: `Lembrete reenviado para ${[contr, ...alunos].filter((x) => !x.assinadoEm).map((x) => x.nome).join(', ')}`, por }));
  if (assinouEm) {
    eventos.push({ em: assinouEm, texto: `${contratante.nome} assinou (Clicksign)`, por: 'Clicksign' });
    alunos.forEach((a) => eventos.push({ em: a.assinadoEm, texto: `${a.nome} assinou (Clicksign)`, por: 'Clicksign' }));
    const fim = alunos.length ? alunos[alunos.length - 1].assinadoEm : assinouEm;
    eventos.push({ em: fim, texto: 'Todos assinaram — documento assinado arquivado', por: 'Clicksign' });
  }
  if (cancelamento) eventos.push({ em: cancelamento.em, texto: `Envelope cancelado: ${cancelamento.motivo}`, por });
  const status = cancelamento ? 'cancelado' : assinouEm ? 'assinado' : 'enviado';
  return { id, envelopeId, versao: documento.versao, enviadoEm, enviadoPor: por, prazoDias: 7, status, signatarios: [contr, ...alunos, escola], concluidoEm: status === 'assinado' ? eventos[eventos.length - 1].em : null, cancelamento, eventos: eventos.sort((a, b) => a.em.localeCompare(b.em)) };
}

const alunoSeedDe = (id) => ALUNOS_SEED.find((a) => a.id === id);
const empresaSeedDe = (id) => EMPRESAS_SEED.find((e) => e.id === id);
// Signatário contratante: contato principal da empresa, o responsável do aluno (terceiro) ou o próprio aluno.
function signatarioContratante({ empresaId, alunoId, nome }) {
  if (empresaId) { const e = empresaSeedDe(empresaId); const ct = e.contatos.find((c) => c.principal) ?? e.contatos[0]; return { nome: nome || ct?.nome || e.nomeFantasia, email: ct?.email || e.email }; }
  const a = alunoSeedDe(alunoId);
  if (a.pagador === 'terceiro' && a.responsavel?.nome) return { nome: a.responsavel.nome, email: a.responsavel.email || a.email };
  return { nome: a.nomeSocial || a.nome, email: a.email };
}

// Assinaturas das duas partes. Eletrônica: datas vêm do envelope (escola assina no dia do envio,
// contratante em `dataAss`). Física/aceite: as duas assinam em `dataAss`.
function assinaturasSeed({ dataAss, meio, assinadoPor, envelope, escolaSempre = false }) {
  const vazio = { contratante: null, escola: null };
  if (envelope) {
    const sig = (papel) => envelope.signatarios.find((x) => x.papel === papel);
    const e = sig('escola'); const c = sig('contratante');
    return {
      contratante: c?.assinadoEm ? { assinadoEm: c.assinadoEm.slice(0, 10), meio: 'eletronica', por: c.nome, envelopeId: envelope.envelopeId } : null,
      escola: e?.assinadoEm && envelope.status !== 'cancelado' ? { assinadoEm: e.assinadoEm.slice(0, 10), meio: 'eletronica', por: e.nome, envelopeId: envelope.envelopeId } : null,
    };
  }
  if (!dataAss) return escolaSempre ? { ...vazio } : vazio;
  return { contratante: { assinadoEm: dataAss, meio, por: assinadoPor, envelopeId: null }, escola: { assinadoEm: dataAss, meio, por: 'Administração ProWay', envelopeId: null } };
}

// Contrato de formação para uma edição. `alunoIds` do contrato; empresa quando `empresaId`.
// `extras` = { alunoId: [modelos de item avulso] } para alunos que compraram algo a mais no mesmo contrato.
function contratoFormacao({ id, edicao, formacaoId, criadoEm, vendedorId = 'ana', alunoIds, empresaId = null, responsavelAlunoId = null, preco, fator = 1, parcelas: n, primeiroVencimento, forma = 'boleto', pedidoCompra = '', status = 'adm_ok', assinadoPor, meio = 'eletronica', assinado = null, lembretes = [], atrasadas = [], desistencias = {}, congelamentos = {}, recuperacao = null, observacoes = '', descricao = '', extras: extrasPorAluno = {} }) {
  const codigo = codigoContrato(criadoEm);
  const modelos = itensFormacao(formacaoId, edicao, preco, fator);
  const porAluno = Object.fromEntries(alunoIds.map((a) => [a, [...modelos, ...(extrasPorAluno[a] ?? [])]]));
  const itens = itensDe(codigo, alunoIds, porAluno, { desistencias, congelamentos });
  const total = arred2(itens.reduce((s, i) => s + i.valorFinal, 0));
  const dia = criadoEm.slice(0, 10);
  const documento = status === 'rascunho' ? null : { geradoEm: `${dia}T${criadoEm.slice(11, 13)}:45:00`, versao: fator === 1 ? 1 : 2 };
  const dataAss = assinado?.assinadoEm ?? (['comercial_ok', 'adm_ok'].includes(status) ? somarDias(dia, 1) : null);
  const envelopes = documento && meio === 'eletronica' ? [envelopeSeed({ documento, assinatura: dataAss ? { assinadoEm: dataAss } : null, contratante: signatarioContratante({ empresaId, alunoId: responsavelAlunoId ?? alunoIds[0], nome: empresaId ? assinadoPor : '' }), alunosExtras: empresaId ? alunoIds.map((a) => ({ nome: nomeAluno(a), email: alunoSeedDe(a).email })) : [], por: nomeVendedor(vendedorId), lembretes })] : [];
  const assinaturas = assinaturasSeed({ dataAss, meio, assinadoPor, envelope: envelopes[0] ?? null });
  const emitidas = status !== 'rascunho' && status !== 'aguardando';
  const canceladasAPartir = Object.keys(desistencias).length && alunoIds.length === 1 ? Math.max(2, Math.ceil(n / 2)) : null;
  const parcelas = status === 'rascunho' ? [] : parcelasDe(total, n, primeiroVencimento, { emitidas, emitidaEm: somarDias(dia, 2), atrasadas, canceladasAPartir });
  const nf = status === 'adm_ok' ? nfDe(somarDias(primeiroVencimento, 2)) : null;
  const extras = [];
  Object.entries(desistencias).forEach(([alunoId, d]) => { const em = typeof d === 'string' ? d : d.em; const motivo = typeof d === 'object' ? MOTIVOS_CANCELAMENTO.find((m) => m.id === d.motivo)?.nome : null; extras.push({ em: `${em}T10:00:00`, texto: `Desistência registrada${motivo ? ` (${motivo.toLowerCase()})` : ''} — matrículas seguintes encerradas e parcelas restantes canceladas`, por: nomeVendedor(vendedorId) }); });
  Object.entries(congelamentos).forEach(([alunoId, data]) => extras.push({ em: `${data}T10:00:00`, texto: 'Matrícula congelada a pedido do aluno — fora das aulas e das contas de frequência até retomar', por: nomeVendedor(vendedorId) }));
  if (recuperacao) extras.push({ em: `${recuperacao.desde}T15:00:00`, texto: `Acordo de recuperação: ${recuperacao.acordo}`, por: nomeVendedor(vendedorId) });
  return contratoSeed({
    id, codigo, criadoEm, status, vendedorId, descricao: descricao || `${EDICOES[edicao].nome} · ${EDICOES[edicao].periodo}`, observacoes,
    contratante: empresaId ? 'empresa' : 'alunos', empresaId, alunoIds, responsavelAlunoId: empresaId ? null : (responsavelAlunoId ?? alunoIds[0]),
    itens,
    cobranca: { forma, parcelas: n, primeiroVencimento, pedidoCompra },
    parcelas, documento, assinaturas, envelopes, nf, recuperacao,
    historico: historicoDe({ criadoEm, vendedorId, status, documento, assinaturas, envelopes, nf, parcelas, extras }),
  });
}

// Contrato de cursos avulsos (um aluno). `itens` = modelos de item avulso.
function contratoAvulso({ id, criadoEm, vendedorId = 'ana', alunoId, itens: modelos, parcelas: n = 1, primeiroVencimento, forma = 'pix', status = 'adm_ok', assinadoPor, meio = 'eletronica', cancelamento = null, observacoes = '' }) {
  const codigo = codigoContrato(criadoEm);
  const dia = criadoEm.slice(0, 10);
  const itens = itensDe(codigo, [alunoId], { [alunoId]: modelos }, { todas: status === 'cancelado' ? 'cancelada' : null }).map((i) => (i.status === 'cancelada' ? { ...i, cancelamento: { em: cancelamento?.em ?? null, tipo: 'contrato', texto: cancelamento?.motivo ?? '' } } : i));
  const total = arred2(itens.reduce((s, i) => s + i.valorFinal, 0));
  const documento = status === 'rascunho' ? null : { geradoEm: `${dia}T${criadoEm.slice(11, 13)}:30:00`, versao: 1 };
  const dataAss = ['comercial_ok', 'adm_ok'].includes(status) ? dia : null;
  const envelopes = documento && meio === 'eletronica' ? [envelopeSeed({ documento, assinatura: dataAss ? { assinadoEm: dia } : null, contratante: signatarioContratante({ alunoId }), por: nomeVendedor(vendedorId), cancelamento: cancelamento ? { em: cancelamento.em, motivo: 'venda cancelada' } : null })] : [];
  const assinaturas = assinaturasSeed({ dataAss, meio, assinadoPor, envelope: envelopes[0] ?? null });
  const parcelas = status === 'rascunho' ? [] : parcelasDe(total, n, primeiroVencimento, { emitidas: !['aguardando', 'cancelado'].includes(status), emitidaEm: somarDias(dia, 1), canceladasAPartir: status === 'cancelado' ? 1 : null });
  const nf = status === 'adm_ok' ? nfDe(somarDias(primeiroVencimento, 1)) : null;
  const extras = cancelamento ? [{ em: cancelamento.em, texto: `Venda cancelada: ${cancelamento.motivo}`, por: nomeVendedor(vendedorId) }] : [];
  return contratoSeed({
    id, codigo, criadoEm, status, vendedorId, observacoes,
    contratante: 'alunos', alunoIds: [alunoId], responsavelAlunoId: alunoId,
    itens,
    cobranca: { forma, parcelas: n, primeiroVencimento, pedidoCompra: '' },
    parcelas, documento, assinaturas, envelopes, nf, cancelamento,
    historico: historicoDe({ criadoEm, vendedorId, status, documento, assinaturas, envelopes, nf, parcelas, extras }),
  });
}

// ---------- Semente ----------
// Alunos (js/clientes-data.js): a1–a14 Super DEV 9 · a15–a24 Super DEV 7 · a25–a39 Super DEV 8 · a40–a50 Super DEV 10.
// Preço da formação por edição: SD7 R$ 8.900 (2025) · SD8 R$ 9.400 · SD9 R$ 9.900 · SD10 R$ 10.900 (.NET).

const nomeAluno = (id) => ALUNOS_SEED.find((a) => a.id === id)?.nome ?? '';
const assinaAluno = (id) => { const a = ALUNOS_SEED.find((x) => x.id === id); return a.pagador === 'terceiro' && a.responsavel.nome ? `${a.responsavel.nome} (responsável)` : a.nome; };

const CONTRATOS_SEED_V6 = [
  // ===== Super DEV 7 · noturno · Python (jun/2025 → ago/2026) — concluída =====
  contratoFormacao({ id: 'ct1', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-05-12T10:00:00', vendedorId: 'bruno', alunoIds: ['a15'], preco: 8900, parcelas: 18, primeiroVencimento: '2025-06-10', assinadoPor: assinaAluno('a15') }),
  contratoFormacao({ id: 'ct2', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-05-14T15:20:00', alunoIds: ['a16'], preco: 8900, parcelas: 12, primeiroVencimento: '2025-06-15', assinadoPor: assinaAluno('a16') }),
  contratoFormacao({ id: 'ct3', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-05-20T09:10:00', vendedorId: 'carla', alunoIds: ['a17'], preco: 8900, fator: 0.9, parcelas: 18, primeiroVencimento: '2025-06-20', assinadoPor: assinaAluno('a17'), observacoes: 'Desconto de 10% — indicação de ex-aluno.' }),
  contratoFormacao({ id: 'ct4', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-05-26T11:00:00', alunoIds: ['a18'], preco: 8900, parcelas: 18, primeiroVencimento: '2025-06-10', assinadoPor: assinaAluno('a18') }),
  contratoFormacao({ id: 'ct5', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-06-02T14:00:00', vendedorId: 'bruno', alunoIds: ['a19'], preco: 8900, parcelas: 15, primeiroVencimento: '2025-07-05', forma: 'cartao', assinadoPor: assinaAluno('a19') }),
  contratoFormacao({ id: 'ct6', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-06-03T16:30:00', alunoIds: ['a20'], preco: 8900, parcelas: 18, primeiroVencimento: '2025-07-10', assinadoPor: assinaAluno('a20') }),
  // Desistente: saiu antes do módulo Python (dez/2025); parcelas restantes canceladas.
  contratoFormacao({ id: 'ct7', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-06-05T10:40:00', vendedorId: 'carla', alunoIds: ['a21'], preco: 8900, parcelas: 18, primeiroVencimento: '2025-07-10', assinadoPor: assinaAluno('a21'), desistencias: { a21: { em: '2025-12-01', motivo: 'mudanca', texto: 'Mudou-se para Curitiba' } }, observacoes: 'Desistência em 01/12/2025 (mudança de cidade). Multa contratual negociada.' }),
  contratoFormacao({ id: 'ct8', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-06-09T09:00:00', alunoIds: ['a24'], preco: 8900, parcelas: 10, primeiroVencimento: '2025-07-01', forma: 'pix', assinadoPor: assinaAluno('a24') }),
  // Empresa: Malwee paga por dois colaboradores (PO exigido? não — Malwee não exige).
  contratoFormacao({ id: 'ct9', edicao: 'sup07', formacaoId: 'sup07', criadoEm: '2025-06-10T13:00:00', vendedorId: 'carla', empresaId: 'e4', alunoIds: ['a22', 'a23'], preco: 8900, fator: 0.85, parcelas: 12, primeiroVencimento: '2025-07-20', assinadoPor: 'Fernanda Ribeiro (Malwee)', descricao: 'Super DEV 7 · Malwee · 2 colaboradores', observacoes: 'Desconto de 15% por volume (2 alunos).' }),

  // ===== Super DEV 8 · sábado · Java (set/2025 → jul/2027) — em andamento =====
  // Empresa: Senior paga por dois analistas.
  contratoFormacao({ id: 'ct10', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-08-18T10:00:00', vendedorId: 'carla', empresaId: 'e2', alunoIds: ['a25', 'a38'], preco: 9400, fator: 0.9, parcelas: 24, primeiroVencimento: '2025-09-10', assinadoPor: 'Diego Fontana (Senior)', descricao: 'Super DEV 8 · Senior · 2 colaboradores', observacoes: 'Desconto de 10% (2 alunos). Boletos no dia 10 (política da Senior). Um analista também faz Machine Learning avulso (turma de setembro).', extras: { a38: [itemAvulso('mlp', 'ta2')] } }),
  contratoFormacao({ id: 'ct11', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-08-19T15:00:00', alunoIds: ['a26'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-09-15', assinadoPor: assinaAluno('a26') }),
  // Menores: responsável assina e paga.
  contratoFormacao({ id: 'ct12', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-08-21T09:30:00', vendedorId: 'bruno', alunoIds: ['a27'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-09-05', assinadoPor: assinaAluno('a27'), meio: 'fisica', congelamentos: { a27: '2026-03-02' }, observacoes: 'Matrícula congelada em 02/03/2026 (viagem de trabalho de 6 meses); retoma na próxima edição.' }),
  contratoFormacao({ id: 'ct13', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-08-21T11:00:00', vendedorId: 'bruno', alunoIds: ['a28'], preco: 9400, parcelas: 20, primeiroVencimento: '2025-09-10', assinadoPor: assinaAluno('a28') }),
  // Recuperante: atrasou mai–jul/2026 e fez acordo.
  contratoFormacao({ id: 'ct14', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-08-25T14:00:00', alunoIds: ['a29'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-09-20', assinadoPor: assinaAluno('a29'), atrasadas: [10, 11, 12], recuperacao: { desde: '2026-08-05', acordo: 'Parcelas 10, 11 e 12 unificadas com vencimento em 20/09/2026, sem juros.' } }),
  contratoFormacao({ id: 'ct15', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-08-26T10:15:00', vendedorId: 'carla', alunoIds: ['a30'], preco: 9400, parcelas: 18, primeiroVencimento: '2025-09-10', assinadoPor: assinaAluno('a30') }),
  // Vinculado ao Studio Pixel mas paga do próprio bolso.
  contratoFormacao({ id: 'ct16', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-08-28T16:00:00', alunoIds: ['a31'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-09-05', forma: 'pix', assinadoPor: assinaAluno('a31') }),
  contratoFormacao({ id: 'ct17', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-09-01T09:00:00', vendedorId: 'bruno', alunoIds: ['a32'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-09-15', assinadoPor: assinaAluno('a32'), congelamentos: { a32: '2026-05-04' }, observacoes: 'Matrícula congelada em 04/05/2026 (licença-saúde).' }),
  contratoFormacao({ id: 'ct18', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-09-02T11:20:00', alunoIds: ['a33'], preco: 9400, fator: 0.95, parcelas: 24, primeiroVencimento: '2025-09-20', assinadoPor: assinaAluno('a33'), observacoes: 'Desconto de 5% — pagamento em dia garantido por débito automático.' }),
  contratoFormacao({ id: 'ct19', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-09-03T14:45:00', vendedorId: 'carla', alunoIds: ['a34'], preco: 9400, parcelas: 12, primeiroVencimento: '2025-09-10', assinadoPor: assinaAluno('a34'), desistencias: { a34: { em: '2026-06-01', motivo: 'horario', texto: 'Passou a trabalhar à noite' } }, observacoes: 'Desistência em 01/06/2026 (novo turno de trabalho).' }),
  // Inadimplente: parcelas de jul e ago/2026 vencidas sem acordo.
  contratoFormacao({ id: 'ct20', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-09-05T10:00:00', alunoIds: ['a35'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-09-25', assinadoPor: assinaAluno('a35'), atrasadas: [11, 12] }),
  // Comercial OK: assinado e pago, mas a NF ainda não saiu (adm não bateu).
  contratoFormacao({ id: 'ct21', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-09-08T15:30:00', vendedorId: 'bruno', alunoIds: ['a36'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-09-25', status: 'comercial_ok', assinadoPor: assinaAluno('a36'), observacoes: 'Aluno pediu NF em nome da mãe — aguardando definição da adm.' }),
  contratoFormacao({ id: 'ct22', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-09-10T09:40:00', alunoIds: ['a37'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-10-05', assinadoPor: assinaAluno('a37'), desistencias: { a37: { em: '2026-05-04', motivo: 'financeiro', texto: 'Perdeu o emprego' } }, observacoes: 'Desistência em 04/05/2026 (dificuldade financeira); parcelas restantes canceladas.' }),
  contratoFormacao({ id: 'ct23', edicao: 'sup08', formacaoId: 'sup08', criadoEm: '2025-09-12T13:10:00', vendedorId: 'carla', alunoIds: ['a39'], preco: 9400, parcelas: 24, primeiroVencimento: '2025-10-10', assinadoPor: assinaAluno('a39') }),

  // ===== Super DEV 9 · noturno · Python (mar/2026 → mar/2027) — em andamento =====
  // Empresa: WEG paga por dois colaboradores; exige PO na NF.
  contratoFormacao({ id: 'ct24', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-02T10:00:00', vendedorId: 'carla', empresaId: 'e1', alunoIds: ['a8', 'a12'], preco: 9900, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-03-25', pedidoCompra: 'PO-451930', assinadoPor: 'Roberta Klein (WEG)', descricao: 'Super DEV 9 · WEG · 2 colaboradores', observacoes: 'Desconto de 10% (2 alunos). NF cita a PO. Um dos colaboradores também faz PostgreSQL avulso na mesma venda.', extras: { a12: [itemAvulso('ptg', 'ta4')] } }),
  // Menores (responsável assina/paga).
  contratoFormacao({ id: 'ct25', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-03T14:00:00', vendedorId: 'bruno', alunoIds: ['a1'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-10', assinadoPor: assinaAluno('a1') }),
  contratoFormacao({ id: 'ct26', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-04T09:20:00', alunoIds: ['a2'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-10', forma: 'cartao', assinadoPor: assinaAluno('a2') }),
  contratoFormacao({ id: 'ct27', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-05T16:10:00', vendedorId: 'carla', alunoIds: ['a3'], preco: 9900, parcelas: 18, primeiroVencimento: '2026-03-15', assinadoPor: assinaAluno('a3') }),
  contratoFormacao({ id: 'ct28', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-09T10:30:00', alunoIds: ['a4'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-05', assinadoPor: assinaAluno('a4'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct29', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-10T11:00:00', vendedorId: 'bruno', alunoIds: ['a5'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-10', assinadoPor: assinaAluno('a5'), desistencias: { a5: { em: '2026-06-15', motivo: 'saude', texto: 'Tratamento de saúde na família' } }, observacoes: 'Desistência em 15/06/2026 (saúde na família).' }),
  // Aguardando: aluno ainda não aceitou o termo LGPD nem assinou — boletos não podem ser emitidos.
  contratoFormacao({ id: 'ct30', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-11T15:00:00', alunoIds: ['a6'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-10', status: 'aguardando', assinadoPor: assinaAluno('a6'), lembretes: ['2026-08-20'], observacoes: 'Está frequentando as aulas. Falta assinar o contrato e aceitar o termo (LGPD) — lembrete enviado em 20/08.' }),
  contratoFormacao({ id: 'ct31', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-12T09:00:00', vendedorId: 'carla', alunoIds: ['a7'], preco: 9900, fator: 0.9, parcelas: 20, primeiroVencimento: '2026-03-20', assinadoPor: assinaAluno('a7'), observacoes: 'Desconto de 10% — matrícula antecipada.' }),
  contratoFormacao({ id: 'ct32', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-16T14:20:00', alunoIds: ['a9'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-15', assinadoPor: assinaAluno('a9') }),
  contratoFormacao({ id: 'ct33', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-17T10:00:00', vendedorId: 'bruno', alunoIds: ['a10'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-20', assinadoPor: assinaAluno('a10'), congelamentos: { a10: '2026-07-06' }, observacoes: 'Matrícula congelada em 06/07/2026 (mudança de turno no trabalho); volta prevista para a SUP10.' }),
  contratoFormacao({ id: 'ct34', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-18T16:40:00', alunoIds: ['a11'], preco: 9900, parcelas: 12, primeiroVencimento: '2026-03-05', forma: 'pix', assinadoPor: assinaAluno('a11'), desistencias: { a11: { em: '2026-07-01', motivo: 'expectativa', texto: 'Decidiu seguir em dados, não em desenvolvimento' } }, observacoes: 'Desistência em 01/07/2026 (mudou de área).' }),
  // Aguardando: menor sem endereço cadastrado — responsável assinou, mas o boleto está bloqueado.
  contratoFormacao({ id: 'ct35', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-23T11:30:00', vendedorId: 'carla', alunoIds: ['a13'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-10', status: 'aguardando', assinadoPor: assinaAluno('a13'), assinado: { assinadoEm: '2026-02-24' }, observacoes: 'Responsável pagou a 1ª parcela por Pix fora do sistema; falta o endereço do aluno para emitir os boletos.' }),
  contratoFormacao({ id: 'ct36', edicao: 'sup09', formacaoId: 'sup09', criadoEm: '2026-02-24T09:15:00', alunoIds: ['a14'], preco: 9900, parcelas: 24, primeiroVencimento: '2026-03-15', assinadoPor: assinaAluno('a14'), desistencias: { a14: { em: '2026-08-03', motivo: 'financeiro', texto: '' } }, observacoes: 'Desistência em 03/08/2026 (dificuldade financeira).' }),

  // ===== Super DEV 10 · noturno híbrido · .NET (ago/2026 → out/2027) — começou há 1 semana =====
  // Só os 8 alunos "Ativo" da chamada têm contrato; a44, a48 e a49 são "Interessado" (assistindo sem contrato).
  contratoFormacao({ id: 'ct41', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-07-20T10:00:00', vendedorId: 'carla', alunoIds: ['a40'], preco: 10900, parcelas: 24, primeiroVencimento: '2026-08-10', assinadoPor: assinaAluno('a40'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct42', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-07-21T15:30:00', alunoIds: ['a41'], preco: 10900, parcelas: 24, primeiroVencimento: '2026-08-15', assinadoPor: assinaAluno('a41') }),
  contratoFormacao({ id: 'ct43', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-07-22T09:10:00', vendedorId: 'bruno', alunoIds: ['a42'], preco: 10900, fator: 0.9, parcelas: 18, primeiroVencimento: '2026-08-10', assinadoPor: assinaAluno('a42'), observacoes: 'Desconto de 10% — matrícula antecipada.' }),
  contratoFormacao({ id: 'ct44', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-07-27T14:00:00', alunoIds: ['a43'], preco: 10900, parcelas: 24, primeiroVencimento: '2026-08-20', forma: 'cartao', assinadoPor: assinaAluno('a43') }),
  contratoFormacao({ id: 'ct45', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-07-28T11:00:00', vendedorId: 'carla', alunoIds: ['a45'], preco: 10900, parcelas: 24, primeiroVencimento: '2026-08-15', assinadoPor: assinaAluno('a45') }),
  contratoFormacao({ id: 'ct46', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-07-29T16:20:00', alunoIds: ['a46'], preco: 10900, parcelas: 24, primeiroVencimento: '2026-08-20', assinadoPor: assinaAluno('a46') }),
  // Comercial OK: assinado e 1ª parcela paga, NF ainda não emitida.
  contratoFormacao({ id: 'ct47', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-08-03T10:40:00', vendedorId: 'bruno', alunoIds: ['a47'], preco: 10900, parcelas: 24, primeiroVencimento: '2026-08-20', status: 'comercial_ok', assinadoPor: assinaAluno('a47') }),
  // Aguardando: entrou na última hora, documento enviado e ainda não assinado.
  contratoFormacao({ id: 'ct48', edicao: 'sup10', formacaoId: 'sup10', criadoEm: '2026-08-14T17:00:00', alunoIds: ['a50'], preco: 10900, parcelas: 24, primeiroVencimento: '2026-09-10', status: 'aguardando', assinadoPor: assinaAluno('a50'), observacoes: 'Matriculou-se no dia da 1ª aula; contrato enviado por e-mail em 14/08.' }),

  // ===== Cursos avulsos (turmas abertas) =====
  // Ex-aluno do SD7 fez PostgreSQL avulso em junho.
  contratoAvulso({ id: 'ct37', criadoEm: '2026-05-18T10:00:00', alunoId: 'a24', itens: [itemAvulso('ptg', 'ta4')], parcelas: 2, primeiroVencimento: '2026-06-01', forma: 'boleto', assinadoPor: nomeAluno('a24') }),
  // Aguardando: Machine Learning avulso (turma de setembro).
  contratoAvulso({ id: 'ct38', criadoEm: '2026-08-19T15:30:00', vendedorId: 'bruno', alunoId: 'a17', itens: [itemAvulso('mlp', 'ta2')], parcelas: 2, primeiroVencimento: '2026-09-10', status: 'aguardando', assinadoPor: nomeAluno('a17') }),
  // Cancelado antes de assinar.
  contratoAvulso({ id: 'ct39', criadoEm: '2026-08-10T11:00:00', vendedorId: 'carla', alunoId: 'a16', itens: [itemAvulso('mlp', 'ta2')], parcelas: 1, primeiroVencimento: '2026-09-10', status: 'cancelado', assinadoPor: nomeAluno('a16'), cancelamento: { em: '2026-08-20T10:00:00', motivo: 'Aluno conseguiu emprego com horário incompatível; pediu para cancelar antes da assinatura.' } }),
  // Rascunho: Angular avulso ainda sendo montado.
  contratoAvulso({ id: 'ct40', criadoEm: '2026-08-25T16:00:00', alunoId: 'a18', itens: [itemAvulso('ajs', 'ta3'), itemAvulso('py1', 'ta1')], parcelas: 3, primeiroVencimento: '', status: 'rascunho', assinadoPor: nomeAluno('a18'), observacoes: 'Aluno quer revisar Angular e Python antes de tentar vaga júnior; ainda decidindo se faz os dois.' }),
];

// >>> CATALOGO-PROWAY contratos (gerado por _tools/semente-catalogo/gerar.py — não editar à mão)
// Contrato de turma(s) avulsa(s) vendido a uma EMPRESA para vários colaboradores (in company): mesmos itens para todos.
function contratoTurmas({ id, criadoEm, vendedorId = 'carla', empresaId, alunoIds, modelos, parcelas: n = 1, primeiroVencimento, forma = 'boleto', pedidoCompra = '', status = 'adm_ok', assinadoPor, meio = 'eletronica', descricao = '', observacoes = '' }) {
  const codigo = codigoContrato(criadoEm);
  const dia = criadoEm.slice(0, 10);
  const itens = itensDe(codigo, alunoIds, Object.fromEntries(alunoIds.map((a) => [a, modelos])));
  const total = arred2(itens.reduce((s, i) => s + i.valorFinal, 0));
  const documento = status === 'rascunho' ? null : { geradoEm: `${dia}T${criadoEm.slice(11, 13)}:45:00`, versao: 1 };
  const dataAss = ['comercial_ok', 'adm_ok'].includes(status) ? somarDias(dia, 2) : null;
  const envelopes = documento && meio === 'eletronica' ? [envelopeSeed({ documento, assinatura: dataAss ? { assinadoEm: dataAss } : null, contratante: signatarioContratante({ empresaId, alunoId: alunoIds[0], nome: assinadoPor }), alunosExtras: alunoIds.map((a) => ({ nome: nomeAluno(a), email: alunoSeedDe(a).email })), por: nomeVendedor(vendedorId) })] : [];
  const assinaturas = assinaturasSeed({ dataAss, meio, assinadoPor, envelope: envelopes[0] ?? null });
  const emitidas = status !== 'rascunho' && status !== 'aguardando';
  const parcelas = status === 'rascunho' ? [] : parcelasDe(total, n, primeiroVencimento, { emitidas, emitidaEm: somarDias(dia, 3) });
  const nf = status === 'adm_ok' ? nfDe(somarDias(primeiroVencimento, 2)) : null;
  return contratoSeed({
    id, codigo, criadoEm, status, vendedorId, descricao, observacoes,
    contratante: 'empresa', empresaId, alunoIds, responsavelAlunoId: null,
    itens, cobranca: { forma, parcelas: n, primeiroVencimento, pedidoCompra },
    parcelas, documento, assinaturas, envelopes, nf,
    historico: historicoDe({ criadoEm, vendedorId, status, documento, assinaturas, envelopes, nf, parcelas }),
  });
}
CONTRATOS_SEED_V6.push(
  contratoAvulso({ id: 'ct193', criadoEm: '2025-07-27T15:00:00', vendedorId: 'bruno', alunoId: 'a206', itens: [itemAvulso('ill', 'ta134')], parcelas: 3, primeiroVencimento: '2025-08-10', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a206') }),
  contratoAvulso({ id: 'ct197', criadoEm: '2025-07-30T13:00:00', vendedorId: 'ana', alunoId: 'a210', itens: [itemAvulso('ill', 'ta134')], parcelas: 1, primeiroVencimento: '2025-08-17', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a210') }),
  contratoAvulso({ id: 'ct195', criadoEm: '2025-07-31T10:30:00', vendedorId: 'ana', alunoId: 'a208', itens: [itemAvulso('ill', 'ta134'), itemAvulso('ila', 'ta135')], parcelas: 3, primeiroVencimento: '2025-08-07', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a208') }),
  contratoAvulso({ id: 'ct205', criadoEm: '2025-07-31T14:30:00', vendedorId: 'bruno', alunoId: 'a216', itens: [itemAvulso('exb', 'ta136')], parcelas: 2, primeiroVencimento: '2025-08-19', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a216'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct200', criadoEm: '2025-08-02T16:30:00', vendedorId: 'ana', alunoId: 'a207', itens: [itemAvulso('exb', 'ta136'), itemAvulso('exi', 'ta137')], parcelas: 1, primeiroVencimento: '2025-08-07', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a207') }),
  contratoAvulso({ id: 'ct198', criadoEm: '2025-08-03T18:00:00', vendedorId: 'bruno', alunoId: 'a211', itens: [itemAvulso('ill', 'ta134'), itemAvulso('ila', 'ta135')], parcelas: 3, primeiroVencimento: '2025-08-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a211') }),
  contratoAvulso({ id: 'ct196', criadoEm: '2025-08-07T16:45:00', vendedorId: 'ana', alunoId: 'a209', itens: [itemAvulso('ill', 'ta134'), itemAvulso('ila', 'ta135')], parcelas: 3, primeiroVencimento: '2025-08-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a209'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct201', criadoEm: '2025-08-10T10:30:00', vendedorId: 'ana', alunoId: 'a210', itens: [itemAvulso('exb', 'ta136'), itemAvulso('exi', 'ta137')], parcelas: 1, primeiroVencimento: '2025-08-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a210'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct202', criadoEm: '2025-08-12T17:30:00', vendedorId: 'ana', alunoId: 'a213', itens: [itemAvulso('exb', 'ta136')], parcelas: 1, primeiroVencimento: '2025-08-31', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a213'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct203', criadoEm: '2025-08-19T14:45:00', vendedorId: 'bruno', alunoId: 'a214', itens: [itemAvulso('exb', 'ta136')], parcelas: 1, primeiroVencimento: '2025-09-04', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a214') }),
  contratoAvulso({ id: 'ct208', criadoEm: '2025-08-22T09:45:00', vendedorId: 'ana', alunoId: 'a219', itens: [itemAvulso('exi', 'ta137')], parcelas: 3, primeiroVencimento: '2025-09-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a219') }),
  contratoAvulso({ id: 'ct206', criadoEm: '2025-08-22T12:30:00', vendedorId: 'bruno', alunoId: 'a217', itens: [itemAvulso('ila', 'ta135')], parcelas: 3, primeiroVencimento: '2025-09-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a217'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct199', criadoEm: '2025-08-22T17:15:00', vendedorId: 'bruno', alunoId: 'a212', itens: [itemAvulso('ill', 'ta134')], parcelas: 1, primeiroVencimento: '2025-08-31', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a212') }),
  contratoAvulso({ id: 'ct204', criadoEm: '2025-08-23T13:00:00', vendedorId: 'carla', alunoId: 'a215', itens: [itemAvulso('exb', 'ta136'), itemAvulso('exi', 'ta137')], parcelas: 1, primeiroVencimento: '2025-09-03', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a215') }),
  contratoAvulso({ id: 'ct194', criadoEm: '2025-08-26T18:30:00', vendedorId: 'bruno', alunoId: 'a207', itens: [itemAvulso('ill', 'ta134')], parcelas: 1, primeiroVencimento: '2025-09-15', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a207'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct213', criadoEm: '2025-08-28T16:00:00', vendedorId: 'ana', alunoId: 'a214', itens: [itemAvulso('pbi', 'ta139')], parcelas: 3, primeiroVencimento: '2025-09-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a214'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct209', criadoEm: '2025-08-30T13:45:00', vendedorId: 'ana', alunoId: 'a220', itens: [itemAvulso('exi', 'ta137')], parcelas: 1, primeiroVencimento: '2025-09-18', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a220'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct207', criadoEm: '2025-08-30T14:15:00', vendedorId: 'ana', alunoId: 'a218', itens: [itemAvulso('ila', 'ta135')], parcelas: 3, primeiroVencimento: '2025-09-07', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a218') }),
  contratoAvulso({ id: 'ct211', criadoEm: '2025-08-31T09:45:00', vendedorId: 'carla', alunoId: 'a217', itens: [itemAvulso('pbi', 'ta139')], parcelas: 2, primeiroVencimento: '2025-09-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a217') }),
  contratoAvulso({ id: 'ct224', criadoEm: '2025-08-31T09:45:00', vendedorId: 'carla', alunoId: 'a227', itens: [itemAvulso('mti', 'ta140')], parcelas: 3, primeiroVencimento: '2025-09-06', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a227') }),
  contratoAvulso({ id: 'ct216', criadoEm: '2025-09-01T18:45:00', vendedorId: 'bruno', alunoId: 'a223', itens: [itemAvulso('pbi', 'ta139')], parcelas: 6, primeiroVencimento: '2025-09-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a223'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct219', criadoEm: '2025-09-02T17:15:00', vendedorId: 'bruno', alunoId: 'a221', itens: [itemAvulso('mti', 'ta140')], parcelas: 1, primeiroVencimento: '2025-09-10', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a221') }),
  contratoAvulso({ id: 'ct215', criadoEm: '2025-09-08T09:45:00', vendedorId: 'ana', alunoId: 'a222', itens: [itemAvulso('pbi', 'ta139')], parcelas: 4, primeiroVencimento: '2025-09-19', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a222'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct222', criadoEm: '2025-09-10T10:30:00', vendedorId: 'carla', alunoId: 'a225', itens: [itemAvulso('mti', 'ta140')], parcelas: 1, primeiroVencimento: '2025-09-15', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a225'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct227', criadoEm: '2025-09-13T12:00:00', vendedorId: 'ana', alunoId: 'a223', itens: [itemAvulso('ex1', 'ta138')], parcelas: 3, primeiroVencimento: '2025-09-18', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a223'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct223', criadoEm: '2025-09-14T18:30:00', vendedorId: 'ana', alunoId: 'a226', itens: [itemAvulso('mti', 'ta140')], parcelas: 2, primeiroVencimento: '2025-09-27', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a226'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct229', criadoEm: '2025-09-15T18:30:00', vendedorId: 'bruno', alunoId: 'a229', itens: [itemAvulso('ex1', 'ta138')], parcelas: 1, primeiroVencimento: '2025-09-25', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a229'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct228', criadoEm: '2025-09-16T09:15:00', vendedorId: 'ana', alunoId: 'a228', itens: [itemAvulso('ex1', 'ta138')], parcelas: 3, primeiroVencimento: '2025-09-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a228') }),
  contratoAvulso({ id: 'ct212', criadoEm: '2025-09-20T13:30:00', vendedorId: 'ana', alunoId: 'a215', itens: [itemAvulso('pbi', 'ta139')], parcelas: 4, primeiroVencimento: '2025-10-07', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a215'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct218', criadoEm: '2025-09-20T14:00:00', vendedorId: 'bruno', alunoId: 'a223', itens: [itemAvulso('mti', 'ta140')], parcelas: 2, primeiroVencimento: '2025-10-04', forma: 'cartao', status: 'cancelado', assinadoPor: assinaAluno('a223'), meio: 'fisica', cancelamento: { em: '2025-09-24T11:00:00', motivo: 'Não conseguiu liberação da empresa' } }),
  contratoAvulso({ id: 'ct217', criadoEm: '2025-09-21T15:30:00', vendedorId: 'ana', alunoId: 'a218', itens: [itemAvulso('mti', 'ta140')], parcelas: 3, primeiroVencimento: '2025-09-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a218'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct210', criadoEm: '2025-09-22T15:45:00', vendedorId: 'ana', alunoId: 'a220', itens: [itemAvulso('pbi', 'ta139')], parcelas: 2, primeiroVencimento: '2025-10-03', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a220') }),
  contratoAvulso({ id: 'ct220', criadoEm: '2025-09-23T12:45:00', vendedorId: 'bruno', alunoId: 'a206', itens: [itemAvulso('mti', 'ta140')], parcelas: 3, primeiroVencimento: '2025-10-11', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a206'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct235', criadoEm: '2025-09-25T10:00:00', vendedorId: 'ana', alunoId: 'a232', itens: [itemAvulso('gda', 'ta141')], parcelas: 2, primeiroVencimento: '2025-10-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a232') }),
  contratoAvulso({ id: 'ct221', criadoEm: '2025-09-26T15:45:00', vendedorId: 'bruno', alunoId: 'a224', itens: [itemAvulso('mti', 'ta140')], parcelas: 2, primeiroVencimento: '2025-10-07', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a224'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct214', criadoEm: '2025-09-27T16:30:00', vendedorId: 'bruno', alunoId: 'a221', itens: [itemAvulso('pbi', 'ta139')], parcelas: 4, primeiroVencimento: '2025-10-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a221') }),
  contratoAvulso({ id: 'ct225', criadoEm: '2025-10-01T14:45:00', vendedorId: 'bruno', alunoId: 'a219', itens: [itemAvulso('ex1', 'ta138')], parcelas: 3, primeiroVencimento: '2025-10-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a219') }),
  contratoAvulso({ id: 'ct226', criadoEm: '2025-10-05T12:00:00', vendedorId: 'ana', alunoId: 'a215', itens: [itemAvulso('ex1', 'ta138')], parcelas: 1, primeiroVencimento: '2025-10-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a215') }),
  contratoAvulso({ id: 'ct234', criadoEm: '2025-10-07T09:00:00', vendedorId: 'carla', alunoId: 'a231', itens: [itemAvulso('gda', 'ta141')], parcelas: 1, primeiroVencimento: '2025-10-21', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a231') }),
  contratoAvulso({ id: 'ct233', criadoEm: '2025-10-08T13:15:00', vendedorId: 'carla', alunoId: 'a230', itens: [itemAvulso('gda', 'ta141')], parcelas: 3, primeiroVencimento: '2025-10-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a230') }),
  contratoAvulso({ id: 'ct239', criadoEm: '2025-10-12T17:15:00', vendedorId: 'bruno', alunoId: 'a227', itens: [itemAvulso('clp', 'ta143')], parcelas: 2, primeiroVencimento: '2025-10-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a227'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct231', criadoEm: '2025-10-13T11:15:00', vendedorId: 'ana', alunoId: 'a218', itens: [itemAvulso('gda', 'ta141')], parcelas: 1, primeiroVencimento: '2025-10-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a218') }),
  contratoAvulso({ id: 'ct237', criadoEm: '2025-10-17T12:30:00', vendedorId: 'bruno', alunoId: 'a229', itens: [itemAvulso('clp', 'ta143')], parcelas: 2, primeiroVencimento: '2025-10-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a229') }),
  contratoAvulso({ id: 'ct242', criadoEm: '2025-10-18T09:15:00', vendedorId: 'ana', alunoId: 'a235', itens: [itemAvulso('clp', 'ta143')], parcelas: 3, primeiroVencimento: '2025-11-02', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a235'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct232', criadoEm: '2025-10-18T17:30:00', vendedorId: 'ana', alunoId: 'a226', itens: [itemAvulso('gda', 'ta141')], parcelas: 1, primeiroVencimento: '2025-11-06', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a226') }),
  contratoAvulso({ id: 'ct238', criadoEm: '2025-10-24T14:45:00', vendedorId: 'ana', alunoId: 'a211', itens: [itemAvulso('clp', 'ta143')], parcelas: 2, primeiroVencimento: '2025-11-03', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a211'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct230', criadoEm: '2025-10-28T18:45:00', vendedorId: 'ana', alunoId: 'a216', itens: [itemAvulso('gda', 'ta141')], parcelas: 3, primeiroVencimento: '2025-11-05', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a216') }),
  contratoAvulso({ id: 'ct241', criadoEm: '2025-10-29T09:15:00', vendedorId: 'carla', alunoId: 'a234', itens: [itemAvulso('clp', 'ta143')], parcelas: 1, primeiroVencimento: '2025-11-16', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a234') }),
  contratoAvulso({ id: 'ct236', criadoEm: '2025-10-31T18:15:00', vendedorId: 'bruno', alunoId: 'a226', itens: [itemAvulso('clp', 'ta143')], parcelas: 1, primeiroVencimento: '2025-11-05', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a226') }),
  contratoAvulso({ id: 'ct247', criadoEm: '2025-11-04T15:30:00', vendedorId: 'ana', alunoId: 'a237', itens: [itemAvulso('od1', 'ta142')], parcelas: 1, primeiroVencimento: '2025-11-13', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a237') }),
  contratoAvulso({ id: 'ct240', criadoEm: '2025-11-06T14:45:00', vendedorId: 'carla', alunoId: 'a233', itens: [itemAvulso('clp', 'ta143')], parcelas: 3, primeiroVencimento: '2025-11-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a233'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct243', criadoEm: '2025-11-14T11:15:00', vendedorId: 'ana', alunoId: 'a47', itens: [itemAvulso('od1', 'ta142')], parcelas: 1, primeiroVencimento: '2025-11-21', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a47'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct244', criadoEm: '2025-11-23T15:15:00', vendedorId: 'carla', alunoId: 'a41', itens: [itemAvulso('od1', 'ta142')], parcelas: 3, primeiroVencimento: '2025-12-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a41') }),
  contratoAvulso({ id: 'ct246', criadoEm: '2025-11-25T16:45:00', vendedorId: 'bruno', alunoId: 'a236', itens: [itemAvulso('od1', 'ta142')], parcelas: 2, primeiroVencimento: '2025-12-10', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a236') }),
  contratoAvulso({ id: 'ct245', criadoEm: '2025-11-28T09:30:00', vendedorId: 'carla', alunoId: 'a210', itens: [itemAvulso('od1', 'ta142')], parcelas: 1, primeiroVencimento: '2025-12-07', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a210') }),
  contratoFormacao({ id: 'ct83', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2025-12-18T17:00:00', vendedorId: 'carla', alunoIds: ['a88'], preco: 3990, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-01-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a88') }),
  contratoFormacao({ id: 'ct78', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2025-12-19T11:00:00', vendedorId: 'carla', alunoIds: ['a83'], preco: 3990, parcelas: 12, primeiroVencimento: '2025-12-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a83') }),
  contratoFormacao({ id: 'ct82', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2025-12-22T13:00:00', vendedorId: 'ana', alunoIds: ['a87'], preco: 3990, parcelas: 12, primeiroVencimento: '2026-01-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a87') }),
  contratoAvulso({ id: 'ct261', criadoEm: '2025-12-25T09:45:00', vendedorId: 'bruno', alunoId: 'a213', itens: [itemAvulso('aub', 'ta152')], parcelas: 2, primeiroVencimento: '2026-01-10', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a213'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct80', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2025-12-25T16:20:00', vendedorId: 'ana', alunoIds: ['a85'], preco: 3990, parcelas: 6, primeiroVencimento: '2026-01-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a85') }),
  contratoAvulso({ id: 'ct272', criadoEm: '2025-12-25T17:15:00', vendedorId: 'ana', alunoId: 'a38', itens: [itemAvulso('jsf', 'ta167')], parcelas: 3, primeiroVencimento: '2025-12-30', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a38') }),
  contratoAvulso({ id: 'ct267', criadoEm: '2025-12-27T14:45:00', vendedorId: 'ana', alunoId: 'a228', itens: [itemAvulso('dmi', 'ta164')], parcelas: 1, primeiroVencimento: '2026-01-13', forma: 'boleto', status: 'cancelado', assinadoPor: assinaAluno('a228'), meio: 'fisica', cancelamento: { em: '2026-01-06T11:00:00', motivo: 'Escolheu outra data' } }),
  contratoAvulso({ id: 'ct274', criadoEm: '2025-12-28T17:45:00', vendedorId: 'carla', alunoId: 'a242', itens: [itemAvulso('jsf', 'ta167')], parcelas: 1, primeiroVencimento: '2026-01-15', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a242'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct289', criadoEm: '2025-12-31T09:30:00', vendedorId: 'ana', alunoId: 'a257', itens: [itemAvulso('ppv', 'ta150')], parcelas: 3, primeiroVencimento: '2026-01-18', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a257') }),
  contratoAvulso({ id: 'ct280', criadoEm: '2025-12-31T18:00:00', vendedorId: 'carla', alunoId: 'a244', itens: [itemAvulso('rvt', 'ta154')], parcelas: 1, primeiroVencimento: '2026-01-09', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a244'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct288', criadoEm: '2026-01-01T17:15:00', vendedorId: 'ana', alunoId: 'a256', itens: [itemAvulso('ppv', 'ta150')], parcelas: 1, primeiroVencimento: '2026-01-18', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a256'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct278', criadoEm: '2026-01-02T15:00:00', vendedorId: 'carla', alunoId: 'a246', itens: [itemAvulso('rvt', 'ta154')], parcelas: 3, primeiroVencimento: '2026-01-16', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a246') }),
  contratoAvulso({ id: 'ct258', criadoEm: '2026-01-02T17:15:00', vendedorId: 'carla', alunoId: 'a241', itens: [itemAvulso('ill', 'ta148')], parcelas: 3, primeiroVencimento: '2026-01-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a241') }),
  contratoAvulso({ id: 'ct281', criadoEm: '2026-01-04T09:45:00', vendedorId: 'bruno', alunoId: 'a252', itens: [itemAvulso('rvt', 'ta154')], parcelas: 2, primeiroVencimento: '2026-01-18', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a252') }),
  contratoAvulso({ id: 'ct262', criadoEm: '2026-01-04T10:45:00', vendedorId: 'bruno', alunoId: 'a237', itens: [itemAvulso('aub', 'ta152')], parcelas: 1, primeiroVencimento: '2026-01-21', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a237'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct75', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2026-01-05T10:00:00', vendedorId: 'carla', empresaId: 'e2', alunoIds: ['a79', 'a80'], preco: 3990, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-01-30', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Diego Fontana (Senior)' }),
  contratoAvulso({ id: 'ct287', criadoEm: '2026-01-05T13:45:00', vendedorId: 'ana', alunoId: 'a255', itens: [itemAvulso('ppv', 'ta150'), itemAvulso('fpv', 'ta151')], parcelas: 3, primeiroVencimento: '2026-01-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a255'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct263', criadoEm: '2026-01-05T18:30:00', vendedorId: 'carla', alunoId: 'a243', itens: [itemAvulso('aub', 'ta152')], parcelas: 1, primeiroVencimento: '2026-01-24', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a243'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct266', criadoEm: '2026-01-06T12:15:00', vendedorId: 'ana', alunoId: 'a246', itens: [itemAvulso('aub', 'ta152')], parcelas: 2, primeiroVencimento: '2026-01-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a246') }),
  contratoAvulso({ id: 'ct273', criadoEm: '2026-01-06T18:30:00', vendedorId: 'ana', alunoId: 'a217', itens: [itemAvulso('jsf', 'ta167')], parcelas: 2, primeiroVencimento: '2026-01-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a217'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct256', criadoEm: '2026-01-07T10:15:00', vendedorId: 'ana', alunoId: 'a211', itens: [itemAvulso('ill', 'ta148')], parcelas: 1, primeiroVencimento: '2026-01-24', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a211') }),
  contratoAvulso({ id: 'ct257', criadoEm: '2026-01-07T11:15:00', vendedorId: 'ana', alunoId: 'a206', itens: [itemAvulso('ill', 'ta148')], parcelas: 2, primeiroVencimento: '2026-01-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a206'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct76', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2026-01-07T18:40:00', vendedorId: 'carla', alunoIds: ['a81'], preco: 3990, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-02-01', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a81') }),
  contratoAvulso({ id: 'ct250', criadoEm: '2026-01-08T15:45:00', vendedorId: 'bruno', alunoId: 'a227', itens: [itemAvulso('exb', 'ta144'), itemAvulso('exi', 'ta145')], parcelas: 2, primeiroVencimento: '2026-01-28', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a227') }),
  contratoAvulso({ id: 'ct282', criadoEm: '2026-01-09T15:30:00', vendedorId: 'carla', alunoId: 'a253', itens: [itemAvulso('rvt', 'ta154')], parcelas: 1, primeiroVencimento: '2026-01-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a253') }),
  contratoAvulso({ id: 'ct253', criadoEm: '2026-01-10T09:00:00', vendedorId: 'bruno', alunoId: 'a239', itens: [itemAvulso('exb', 'ta144')], parcelas: 1, primeiroVencimento: '2026-01-16', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a239') }),
  contratoAvulso({ id: 'ct254', criadoEm: '2026-01-10T10:30:00', vendedorId: 'ana', alunoId: 'a240', itens: [itemAvulso('exb', 'ta144')], parcelas: 1, primeiroVencimento: '2026-01-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a240') }),
  contratoAvulso({ id: 'ct255', criadoEm: '2026-01-11T10:15:00', vendedorId: 'bruno', alunoId: 'a235', itens: [itemAvulso('ill', 'ta148')], parcelas: 2, primeiroVencimento: '2026-01-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a235') }),
  contratoAvulso({ id: 'ct291', criadoEm: '2026-01-11T12:15:00', vendedorId: 'bruno', alunoId: 'a232', itens: [itemAvulso('mkd', 'ta158')], parcelas: 1, primeiroVencimento: '2026-01-19', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a232'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct269', criadoEm: '2026-01-11T18:00:00', vendedorId: 'bruno', alunoId: 'a226', itens: [itemAvulso('dmi', 'ta164')], parcelas: 3, primeiroVencimento: '2026-01-16', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a226') }),
  contratoFormacao({ id: 'ct77', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2026-01-12T10:40:00', vendedorId: 'ana', alunoIds: ['a82'], preco: 3990, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-01-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a82'), desistencias: { a82: { em: '2026-04-06', motivo: 'financeiro', texto: 'Comunicou por WhatsApp.' } } }),
  contratoAvulso({ id: 'ct249', criadoEm: '2026-01-12T16:00:00', vendedorId: 'ana', alunoId: 'a218', itens: [itemAvulso('exb', 'ta144'), itemAvulso('exi', 'ta145')], parcelas: 2, primeiroVencimento: '2026-01-30', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a218') }),
  contratoAvulso({ id: 'ct279', criadoEm: '2026-01-12T17:30:00', vendedorId: 'carla', alunoId: 'a245', itens: [itemAvulso('rvt', 'ta154')], parcelas: 3, primeiroVencimento: '2026-01-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a245') }),
  contratoFormacao({ id: 'ct79', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2026-01-13T13:00:00', vendedorId: 'carla', alunoIds: ['a84'], preco: 3990, parcelas: 10, primeiroVencimento: '2026-01-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a84'), congelamentos: { a84: '2026-08-05' } }),
  contratoFormacao({ id: 'ct173', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-01-13T13:00:00', vendedorId: 'bruno', alunoIds: ['a186'], preco: 7900, fator: 0.95, parcelas: 12, primeiroVencimento: '2026-02-04', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a186'), desistencias: { a186: { em: '2026-04-02', motivo: 'financeiro', texto: 'Comunicou por WhatsApp.' } } }),
  contratoAvulso({ id: 'ct286', criadoEm: '2026-01-14T11:45:00', vendedorId: 'bruno', alunoId: 'a206', itens: [itemAvulso('ppv', 'ta150')], parcelas: 1, primeiroVencimento: '2026-01-22', forma: 'pix', status: 'cancelado', assinadoPor: assinaAluno('a206'), meio: 'fisica', cancelamento: { em: '2026-01-22T11:00:00', motivo: 'Escolheu outra data' } }),
  contratoAvulso({ id: 'ct295', criadoEm: '2026-01-14T13:15:00', vendedorId: 'carla', alunoId: 'a259', itens: [itemAvulso('mkd', 'ta158')], parcelas: 3, primeiroVencimento: '2026-01-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a259') }),
  contratoFormacao({ id: 'ct178', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-01-14T18:00:00', vendedorId: 'bruno', alunoIds: ['a191'], preco: 7900, fator: 0.95, parcelas: 10, primeiroVencimento: '2026-02-04', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a191') }),
  contratoAvulso({ id: 'ct296', criadoEm: '2026-01-15T12:00:00', vendedorId: 'ana', alunoId: 'a260', itens: [itemAvulso('mkd', 'ta158')], parcelas: 1, primeiroVencimento: '2026-01-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a260'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct57', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-01-15T14:40:00', vendedorId: 'carla', alunoIds: ['a59'], preco: 2790, fator: 0.9, parcelas: 4, primeiroVencimento: '2026-02-04', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a59') }),
  contratoFormacao({ id: 'ct172', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-01-15T15:20:00', vendedorId: 'bruno', alunoIds: ['a185'], preco: 7900, parcelas: 12, primeiroVencimento: '2026-01-26', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a185') }),
  contratoAvulso({ id: 'ct294', criadoEm: '2026-01-15T18:00:00', vendedorId: 'ana', alunoId: 'a258', itens: [itemAvulso('mkd', 'ta158')], parcelas: 1, primeiroVencimento: '2026-02-01', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a258') }),
  contratoAvulso({ id: 'ct284', criadoEm: '2026-01-16T10:30:00', vendedorId: 'bruno', alunoId: 'a219', itens: [itemAvulso('ppv', 'ta150'), itemAvulso('fpv', 'ta151')], parcelas: 1, primeiroVencimento: '2026-01-25', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a219') }),
  contratoAvulso({ id: 'ct293', criadoEm: '2026-01-16T13:15:00', vendedorId: 'bruno', alunoId: 'a230', itens: [itemAvulso('mkd', 'ta158'), itemAvulso('smd', 'ta159')], parcelas: 1, primeiroVencimento: '2026-02-05', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a230'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct260', criadoEm: '2026-01-16T16:45:00', vendedorId: 'ana', alunoId: 'a238', itens: [itemAvulso('aub', 'ta152')], parcelas: 1, primeiroVencimento: '2026-01-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a238'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct277', criadoEm: '2026-01-16T18:30:00', vendedorId: 'ana', alunoId: 'a251', itens: [itemAvulso('jsf', 'ta167')], parcelas: 1, primeiroVencimento: '2026-01-28', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a251'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct265', criadoEm: '2026-01-17T14:45:00', vendedorId: 'bruno', alunoId: 'a245', itens: [itemAvulso('aub', 'ta152')], parcelas: 2, primeiroVencimento: '2026-01-24', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a245'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct299', criadoEm: '2026-01-17T18:15:00', vendedorId: 'carla', alunoId: 'a262', itens: [itemAvulso('exi', 'ta145')], parcelas: 1, primeiroVencimento: '2026-01-26', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a262') }),
  contratoFormacao({ id: 'ct58', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-01-18T10:20:00', vendedorId: 'carla', alunoIds: ['a60'], preco: 2790, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-01-29', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a60') }),
  contratoAvulso({ id: 'ct290', criadoEm: '2026-01-19T10:00:00', vendedorId: 'ana', alunoId: 'a231', itens: [itemAvulso('mkd', 'ta158')], parcelas: 3, primeiroVencimento: '2026-02-01', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a231') }),
  contratoFormacao({ id: 'ct175', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-01-19T15:00:00', vendedorId: 'carla', alunoIds: ['a188'], preco: 7900, parcelas: 10, primeiroVencimento: '2026-02-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a188'), congelamentos: { a188: '2026-08-05' } }),
  contratoAvulso({ id: 'ct276', criadoEm: '2026-01-20T09:15:00', vendedorId: 'bruno', alunoId: 'a250', itens: [itemAvulso('jsf', 'ta167')], parcelas: 3, primeiroVencimento: '2026-01-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a250') }),
  contratoAvulso({ id: 'ct252', criadoEm: '2026-01-20T09:30:00', vendedorId: 'ana', alunoId: 'a238', itens: [itemAvulso('exb', 'ta144')], parcelas: 1, primeiroVencimento: '2026-02-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a238') }),
  contratoFormacao({ id: 'ct81', edicao: 'dg2a', formacaoId: 'dg2a', criadoEm: '2026-01-20T17:20:00', vendedorId: 'ana', alunoIds: ['a86'], preco: 3990, parcelas: 12, primeiroVencimento: '2026-02-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a86'), atrasadas: [6, 7] }),
  contratoAvulso({ id: 'ct270', criadoEm: '2026-01-21T11:15:00', vendedorId: 'bruno', alunoId: 'a247', itens: [itemAvulso('dmi', 'ta164')], parcelas: 1, primeiroVencimento: '2026-02-04', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a247'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct316', criadoEm: '2026-01-21T15:15:00', vendedorId: 'ana', alunoId: 'a249', itens: [itemAvulso('od1', 'ta165')], parcelas: 1, primeiroVencimento: '2026-01-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a249') }),
  contratoAvulso({ id: 'ct338', criadoEm: '2026-01-22T10:45:00', vendedorId: 'bruno', alunoId: 'a281', itens: [itemAvulso('ecs', 'ta162')], parcelas: 1, primeiroVencimento: '2026-02-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a281') }),
  contratoAvulso({ id: 'ct275', criadoEm: '2026-01-22T12:00:00', vendedorId: 'carla', alunoId: 'a249', itens: [itemAvulso('jsf', 'ta167')], parcelas: 3, primeiroVencimento: '2026-02-05', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a249'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct283', criadoEm: '2026-01-22T13:15:00', vendedorId: 'ana', alunoId: 'a254', itens: [itemAvulso('rvt', 'ta154')], parcelas: 1, primeiroVencimento: '2026-02-07', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a254') }),
  contratoAvulso({ id: 'ct331', criadoEm: '2026-01-22T18:15:00', vendedorId: 'carla', alunoId: 'a277', itens: [itemAvulso('mby', 'ta157')], parcelas: 4, primeiroVencimento: '2026-02-03', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a277') }),
  contratoAvulso({ id: 'ct259', criadoEm: '2026-01-23T10:45:00', vendedorId: 'carla', alunoId: 'a242', itens: [itemAvulso('ill', 'ta148')], parcelas: 3, primeiroVencimento: '2026-02-05', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a242') }),
  contratoAvulso({ id: 'ct271', criadoEm: '2026-01-23T11:45:00', vendedorId: 'ana', alunoId: 'a248', itens: [itemAvulso('dmi', 'ta164')], parcelas: 1, primeiroVencimento: '2026-01-30', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a248') }),
  contratoAvulso({ id: 'ct251', criadoEm: '2026-01-23T13:00:00', vendedorId: 'carla', alunoId: 'a221', itens: [itemAvulso('exb', 'ta144'), itemAvulso('exi', 'ta145')], parcelas: 3, primeiroVencimento: '2026-01-31', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a221') }),
  contratoAvulso({ id: 'ct322', criadoEm: '2026-01-23T14:15:00', vendedorId: 'bruno', alunoId: 'a207', itens: [itemAvulso('psb', 'ta149')], parcelas: 1, primeiroVencimento: '2026-01-28', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a207') }),
  contratoFormacao({ id: 'ct56', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-01-23T18:00:00', vendedorId: 'bruno', alunoIds: ['a58'], preco: 2790, fator: 0.9, parcelas: 3, primeiroVencimento: '2026-02-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a58') }),
  contratoAvulso({ id: 'ct321', criadoEm: '2026-01-24T12:15:00', vendedorId: 'ana', alunoId: 'a273', itens: [itemAvulso('od1', 'ta165')], parcelas: 1, primeiroVencimento: '2026-02-06', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a273') }),
  contratoAvulso({ id: 'ct248', criadoEm: '2026-01-24T13:45:00', vendedorId: 'ana', alunoId: 'a223', itens: [itemAvulso('exb', 'ta144')], parcelas: 1, primeiroVencimento: '2026-02-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a223') }),
  contratoAvulso({ id: 'ct268', criadoEm: '2026-01-25T12:15:00', vendedorId: 'ana', alunoId: 'a216', itens: [itemAvulso('dmi', 'ta164')], parcelas: 2, primeiroVencimento: '2026-02-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a216') }),
  contratoFormacao({ id: 'ct179', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-01-25T17:00:00', vendedorId: 'bruno', alunoIds: ['a192'], preco: 7900, parcelas: 12, primeiroVencimento: '2026-02-15', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a192') }),
  contratoAvulso({ id: 'ct292', criadoEm: '2026-01-26T14:15:00', vendedorId: 'carla', alunoId: 'a247', itens: [itemAvulso('mkd', 'ta158')], parcelas: 1, primeiroVencimento: '2026-02-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a247') }),
  contratoAvulso({ id: 'ct347', criadoEm: '2026-01-26T15:30:00', vendedorId: 'ana', alunoId: 'a286', itens: [itemAvulso('uxp', 'ta166')], parcelas: 6, primeiroVencimento: '2026-02-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a286') }),
  contratoAvulso({ id: 'ct349', criadoEm: '2026-01-26T15:30:00', vendedorId: 'ana', alunoId: 'a224', itens: [itemAvulso('swx', 'ta155')], parcelas: 6, primeiroVencimento: '2026-02-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a224'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct344', criadoEm: '2026-01-27T11:30:00', vendedorId: 'bruno', alunoId: 'a283', itens: [itemAvulso('uxp', 'ta166')], parcelas: 6, primeiroVencimento: '2026-02-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a283') }),
  contratoAvulso({ id: 'ct264', criadoEm: '2026-01-27T17:30:00', vendedorId: 'ana', alunoId: 'a244', itens: [itemAvulso('aub', 'ta152')], parcelas: 2, primeiroVencimento: '2026-02-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a244') }),
  contratoFormacao({ id: 'ct49', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-01-28T18:40:00', vendedorId: 'ana', alunoIds: ['a51'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-02-14', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a51') }),
  contratoAvulso({ id: 'ct304', criadoEm: '2026-01-29T11:00:00', vendedorId: 'ana', alunoId: 'a231', itens: [itemAvulso('pbi', 'ta156')], parcelas: 6, primeiroVencimento: '2026-02-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a231') }),
  contratoAvulso({ id: 'ct312', criadoEm: '2026-01-29T14:30:00', vendedorId: 'bruno', alunoId: 'a267', itens: [itemAvulso('mti', 'ta161')], parcelas: 2, primeiroVencimento: '2026-02-09', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a267') }),
  contratoAvulso({ id: 'ct340', criadoEm: '2026-01-29T14:30:00', vendedorId: 'bruno', alunoId: 'a28', itens: [itemAvulso('uxp', 'ta166')], parcelas: 2, primeiroVencimento: '2026-02-14', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a28') }),
  contratoAvulso({ id: 'ct319', criadoEm: '2026-01-29T16:15:00', vendedorId: 'ana', alunoId: 'a271', itens: [itemAvulso('od1', 'ta165')], parcelas: 1, primeiroVencimento: '2026-02-17', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a271'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct335', criadoEm: '2026-01-29T18:00:00', vendedorId: 'ana', alunoId: 'a245', itens: [itemAvulso('ecs', 'ta162')], parcelas: 1, primeiroVencimento: '2026-02-16', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a245'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct308', criadoEm: '2026-01-30T10:15:00', vendedorId: 'ana', alunoId: 'a220', itens: [itemAvulso('mti', 'ta161')], parcelas: 1, primeiroVencimento: '2026-02-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a220') }),
  contratoAvulso({ id: 'ct342', criadoEm: '2026-01-30T13:45:00', vendedorId: 'bruno', alunoId: 'a271', itens: [itemAvulso('uxp', 'ta166')], parcelas: 3, primeiroVencimento: '2026-02-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a271') }),
  contratoAvulso({ id: 'ct297', criadoEm: '2026-01-30T18:30:00', vendedorId: 'bruno', alunoId: 'a222', itens: [itemAvulso('exi', 'ta145')], parcelas: 1, primeiroVencimento: '2026-02-19', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a222'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct361', criadoEm: '2026-01-31T13:00:00', vendedorId: 'carla', alunoId: 'a293', itens: [itemAvulso('smd', 'ta159')], parcelas: 1, primeiroVencimento: '2026-02-19', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a293') }),
  contratoAvulso({ id: 'ct356', criadoEm: '2026-01-31T15:30:00', vendedorId: 'bruno', alunoId: 'a259', itens: [itemAvulso('smd', 'ta159')], parcelas: 1, primeiroVencimento: '2026-02-20', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a259'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct171', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-02-01T10:00:00', vendedorId: 'carla', empresaId: 'e1', alunoIds: ['a183', 'a184'], preco: 7900, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-02-26', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Roberto Klein (WEG)', pedidoCompra: 'PO-97049' }),
  contratoFormacao({ id: 'ct174', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-02-01T12:00:00', vendedorId: 'carla', alunoIds: ['a187'], preco: 7900, fator: 0.95, parcelas: 10, primeiroVencimento: '2026-02-10', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a187') }),
  contratoAvulso({ id: 'ct334', criadoEm: '2026-02-01T16:15:00', vendedorId: 'bruno', alunoId: 'a225', itens: [itemAvulso('ecs', 'ta162')], parcelas: 3, primeiroVencimento: '2026-02-09', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a225') }),
  contratoAvulso({ id: 'ct305', criadoEm: '2026-02-02T09:45:00', vendedorId: 'ana', alunoId: 'a264', itens: [itemAvulso('pbi', 'ta156')], parcelas: 3, primeiroVencimento: '2026-02-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a264'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct320', criadoEm: '2026-02-02T11:15:00', vendedorId: 'bruno', alunoId: 'a272', itens: [itemAvulso('od1', 'ta165')], parcelas: 3, primeiroVencimento: '2026-02-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a272') }),
  contratoAvulso({ id: 'ct285', criadoEm: '2026-02-02T11:45:00', vendedorId: 'ana', alunoId: 'a209', itens: [itemAvulso('ppv', 'ta150')], parcelas: 3, primeiroVencimento: '2026-02-18', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a209'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct326', criadoEm: '2026-02-02T15:15:00', vendedorId: 'bruno', alunoId: 'a275', itens: [itemAvulso('psb', 'ta149')], parcelas: 1, primeiroVencimento: '2026-02-20', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a275'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct300', criadoEm: '2026-02-02T17:45:00', vendedorId: 'bruno', alunoId: 'a263', itens: [itemAvulso('exi', 'ta145'), itemAvulso('ex1', 'ta146')], parcelas: 1, primeiroVencimento: '2026-02-07', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a263') }),
  contratoAvulso({ id: 'ct343', criadoEm: '2026-02-03T11:15:00', vendedorId: 'ana', alunoId: 'a237', itens: [itemAvulso('uxp', 'ta166')], parcelas: 2, primeiroVencimento: '2026-02-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a237') }),
  contratoAvulso({ id: 'ct325', criadoEm: '2026-02-03T14:00:00', vendedorId: 'ana', alunoId: 'a274', itens: [itemAvulso('psb', 'ta149')], parcelas: 1, primeiroVencimento: '2026-02-14', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a274') }),
  contratoAvulso({ id: 'ct298', criadoEm: '2026-02-04T10:30:00', vendedorId: 'ana', alunoId: 'a261', itens: [itemAvulso('exi', 'ta145')], parcelas: 2, primeiroVencimento: '2026-02-15', forma: 'cartao', status: 'cancelado', assinadoPor: assinaAluno('a261'), cancelamento: { em: '2026-02-14T11:00:00', motivo: 'Aluno desistiu antes do início — sem multa' } }),
  contratoAvulso({ id: 'ct333', criadoEm: '2026-02-04T10:45:00', vendedorId: 'carla', alunoId: 'a279', itens: [itemAvulso('mby', 'ta157')], parcelas: 4, primeiroVencimento: '2026-02-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a279') }),
  contratoAvulso({ id: 'ct355', criadoEm: '2026-02-05T09:30:00', vendedorId: 'bruno', alunoId: 'a290', itens: [itemAvulso('fpv', 'ta151')], parcelas: 1, primeiroVencimento: '2026-02-23', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a290'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct176', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-02-05T14:20:00', vendedorId: 'ana', alunoIds: ['a189'], preco: 7900, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-02-16', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a189') }),
  contratoAvulso({ id: 'ct303', criadoEm: '2026-02-05T17:00:00', vendedorId: 'ana', alunoId: 'a257', itens: [itemAvulso('pbi', 'ta156')], parcelas: 4, primeiroVencimento: '2026-02-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a257'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct332', criadoEm: '2026-02-06T12:45:00', vendedorId: 'ana', alunoId: 'a278', itens: [itemAvulso('mby', 'ta157')], parcelas: 4, primeiroVencimento: '2026-02-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a278') }),
  contratoAvulso({ id: 'ct323', criadoEm: '2026-02-06T17:15:00', vendedorId: 'ana', alunoId: 'a241', itens: [itemAvulso('psb', 'ta149')], parcelas: 1, primeiroVencimento: '2026-02-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a241') }),
  contratoFormacao({ id: 'ct53', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-02-07T09:40:00', vendedorId: 'ana', alunoIds: ['a55'], preco: 2790, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-02-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a55') }),
  contratoFormacao({ id: 'ct52', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-02-07T15:20:00', vendedorId: 'ana', alunoIds: ['a54'], preco: 2790, parcelas: 3, primeiroVencimento: '2026-02-25', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a54') }),
  contratoFormacao({ id: 'ct50', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-02-08T16:00:00', vendedorId: 'ana', alunoIds: ['a52'], preco: 2790, fator: 0.95, parcelas: 3, primeiroVencimento: '2026-02-22', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a52'), desistencias: { a52: { em: '2026-04-12', motivo: 'pessoal', texto: 'Comunicou por WhatsApp.' } } }),
  contratoAvulso({ id: 'ct339', criadoEm: '2026-02-09T10:30:00', vendedorId: 'ana', alunoId: 'a282', itens: [itemAvulso('ecs', 'ta162')], parcelas: 1, primeiroVencimento: '2026-02-27', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a282'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct54', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-02-09T13:00:00', vendedorId: 'ana', alunoIds: ['a56'], preco: 2790, parcelas: 6, primeiroVencimento: '2026-02-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a56'), atrasadas: [3, 4] }),
  contratoAvulso({ id: 'ct309', criadoEm: '2026-02-10T13:30:00', vendedorId: 'ana', alunoId: 'a242', itens: [itemAvulso('mti', 'ta161')], parcelas: 1, primeiroVencimento: '2026-02-18', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a242'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct330', criadoEm: '2026-02-10T16:30:00', vendedorId: 'ana', alunoId: 'a216', itens: [itemAvulso('mby', 'ta157')], parcelas: 3, primeiroVencimento: '2026-02-20', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a216') }),
  contratoAvulso({ id: 'ct318', criadoEm: '2026-02-11T18:00:00', vendedorId: 'ana', alunoId: 'a251', itens: [itemAvulso('od1', 'ta165')], parcelas: 1, primeiroVencimento: '2026-02-17', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a251') }),
  contratoAvulso({ id: 'ct311', criadoEm: '2026-02-12T10:15:00', vendedorId: 'ana', alunoId: 'a225', itens: [itemAvulso('mti', 'ta161')], parcelas: 1, primeiroVencimento: '2026-02-24', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a225'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct301', criadoEm: '2026-02-12T11:15:00', vendedorId: 'ana', alunoId: 'a222', itens: [itemAvulso('pbi', 'ta156')], parcelas: 3, primeiroVencimento: '2026-02-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a222') }),
  contratoFormacao({ id: 'ct177', edicao: 'fdsa', formacaoId: 'fdsa', criadoEm: '2026-02-13T10:20:00', vendedorId: 'ana', alunoIds: ['a190'], preco: 7900, parcelas: 10, primeiroVencimento: '2026-02-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a190'), atrasadas: [5, 6] }),
  contratoAvulso({ id: 'ct346', criadoEm: '2026-02-13T12:15:00', vendedorId: 'bruno', alunoId: 'a285', itens: [itemAvulso('uxp', 'ta166')], parcelas: 4, primeiroVencimento: '2026-02-19', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a285') }),
  contratoAvulso({ id: 'ct324', criadoEm: '2026-02-13T17:30:00', vendedorId: 'bruno', alunoId: 'a239', itens: [itemAvulso('psb', 'ta149')], parcelas: 2, primeiroVencimento: '2026-03-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a239') }),
  contratoAvulso({ id: 'ct328', criadoEm: '2026-02-14T13:15:00', vendedorId: 'carla', alunoId: 'a269', itens: [itemAvulso('mby', 'ta157')], parcelas: 2, primeiroVencimento: '2026-03-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a269') }),
  contratoAvulso({ id: 'ct352', criadoEm: '2026-02-14T18:00:00', vendedorId: 'ana', alunoId: 'a288', itens: [itemAvulso('swx', 'ta155')], parcelas: 6, primeiroVencimento: '2026-02-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a288') }),
  contratoFormacao({ id: 'ct55', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-02-15T10:00:00', vendedorId: 'ana', alunoIds: ['a57'], preco: 2790, fator: 0.95, parcelas: 3, primeiroVencimento: '2026-03-05', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a57') }),
  contratoAvulso({ id: 'ct329', criadoEm: '2026-02-15T12:45:00', vendedorId: 'bruno', alunoId: 'a240', itens: [itemAvulso('mby', 'ta157')], parcelas: 6, primeiroVencimento: '2026-03-07', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a240') }),
  contratoAvulso({ id: 'ct353', criadoEm: '2026-02-15T15:00:00', vendedorId: 'carla', alunoId: 'a217', itens: [itemAvulso('fpv', 'ta151')], parcelas: 1, primeiroVencimento: '2026-02-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a217') }),
  contratoAvulso({ id: 'ct317', criadoEm: '2026-02-16T12:30:00', vendedorId: 'ana', alunoId: 'a237', itens: [itemAvulso('od1', 'ta165')], parcelas: 2, primeiroVencimento: '2026-02-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a237') }),
  contratoAvulso({ id: 'ct307', criadoEm: '2026-02-16T13:15:00', vendedorId: 'carla', alunoId: 'a266', itens: [itemAvulso('pbi', 'ta156')], parcelas: 3, primeiroVencimento: '2026-03-05', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a266'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct51', edicao: 'dg3a', formacaoId: 'dg3a', criadoEm: '2026-02-16T13:20:00', vendedorId: 'ana', alunoIds: ['a53'], preco: 2790, parcelas: 6, primeiroVencimento: '2026-03-02', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a53') }),
  contratoAvulso({ id: 'ct313', criadoEm: '2026-02-16T14:00:00', vendedorId: 'ana', alunoId: 'a268', itens: [itemAvulso('mti', 'ta161')], parcelas: 1, primeiroVencimento: '2026-02-28', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a268') }),
  contratoAvulso({ id: 'ct336', criadoEm: '2026-02-18T10:15:00', vendedorId: 'ana', alunoId: 'a233', itens: [itemAvulso('ecs', 'ta162')], parcelas: 2, primeiroVencimento: '2026-03-07', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a233') }),
  contratoAvulso({ id: 'ct306', criadoEm: '2026-02-18T13:00:00', vendedorId: 'carla', alunoId: 'a265', itens: [itemAvulso('pbi', 'ta156')], parcelas: 4, primeiroVencimento: '2026-02-27', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a265') }),
  contratoAvulso({ id: 'ct315', criadoEm: '2026-02-19T16:15:00', vendedorId: 'ana', alunoId: 'a270', itens: [itemAvulso('mti', 'ta161')], parcelas: 3, primeiroVencimento: '2026-03-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a270') }),
  contratoAvulso({ id: 'ct354', criadoEm: '2026-02-20T09:45:00', vendedorId: 'ana', alunoId: 'a289', itens: [itemAvulso('fpv', 'ta151')], parcelas: 1, primeiroVencimento: '2026-02-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a289') }),
  contratoAvulso({ id: 'ct365', criadoEm: '2026-02-20T15:45:00', vendedorId: 'carla', alunoId: 'a295', itens: [itemAvulso('ex1', 'ta146')], parcelas: 2, primeiroVencimento: '2026-03-04', forma: 'boleto', status: 'cancelado', assinadoPor: assinaAluno('a295'), meio: 'fisica', cancelamento: { em: '2026-03-01T11:00:00', motivo: 'Aluno desistiu antes do início — sem multa' } }),
  contratoAvulso({ id: 'ct371', criadoEm: '2026-02-20T15:45:00', vendedorId: 'bruno', alunoId: 'a298', itens: [itemAvulso('aua', 'ta153')], parcelas: 1, primeiroVencimento: '2026-03-09', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a298') }),
  contratoAvulso({ id: 'ct327', criadoEm: '2026-02-20T17:45:00', vendedorId: 'ana', alunoId: 'a276', itens: [itemAvulso('psb', 'ta149')], parcelas: 1, primeiroVencimento: '2026-03-07', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a276'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct345', criadoEm: '2026-02-21T12:00:00', vendedorId: 'bruno', alunoId: 'a284', itens: [itemAvulso('uxp', 'ta166')], parcelas: 6, primeiroVencimento: '2026-03-07', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a284') }),
  contratoAvulso({ id: 'ct314', criadoEm: '2026-02-21T13:45:00', vendedorId: 'bruno', alunoId: 'a269', itens: [itemAvulso('mti', 'ta161')], parcelas: 1, primeiroVencimento: '2026-03-10', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a269'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct348', criadoEm: '2026-02-21T14:15:00', vendedorId: 'ana', alunoId: 'a244', itens: [itemAvulso('swx', 'ta155')], parcelas: 6, primeiroVencimento: '2026-02-26', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a244') }),
  contratoAvulso({ id: 'ct310', criadoEm: '2026-02-21T14:30:00', vendedorId: 'carla', alunoId: 'a260', itens: [itemAvulso('mti', 'ta161')], parcelas: 1, primeiroVencimento: '2026-03-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a260') }),
  contratoAvulso({ id: 'ct337', criadoEm: '2026-02-21T15:45:00', vendedorId: 'ana', alunoId: 'a280', itens: [itemAvulso('ecs', 'ta162')], parcelas: 3, primeiroVencimento: '2026-03-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a280') }),
  contratoAvulso({ id: 'ct350', criadoEm: '2026-02-22T15:45:00', vendedorId: 'ana', alunoId: 'a245', itens: [itemAvulso('swx', 'ta155')], parcelas: 6, primeiroVencimento: '2026-03-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a245') }),
  contratoAvulso({ id: 'ct341', criadoEm: '2026-02-22T16:45:00', vendedorId: 'carla', alunoId: 'a250', itens: [itemAvulso('uxp', 'ta166')], parcelas: 4, primeiroVencimento: '2026-03-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a250'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct360', criadoEm: '2026-02-23T18:00:00', vendedorId: 'carla', alunoId: 'a292', itens: [itemAvulso('smd', 'ta159')], parcelas: 3, primeiroVencimento: '2026-03-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a292') }),
  contratoAvulso({ id: 'ct302', criadoEm: '2026-02-23T18:15:00', vendedorId: 'ana', alunoId: 'a259', itens: [itemAvulso('pbi', 'ta156')], parcelas: 2, primeiroVencimento: '2026-03-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a259') }),
  contratoAvulso({ id: 'ct357', criadoEm: '2026-02-25T15:15:00', vendedorId: 'carla', alunoId: 'a232', itens: [itemAvulso('smd', 'ta159')], parcelas: 3, primeiroVencimento: '2026-03-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a232'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct351', criadoEm: '2026-02-25T17:15:00', vendedorId: 'bruno', alunoId: 'a287', itens: [itemAvulso('swx', 'ta155')], parcelas: 2, primeiroVencimento: '2026-03-11', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a287') }),
  contratoAvulso({ id: 'ct368', criadoEm: '2026-03-01T15:00:00', vendedorId: 'bruno', alunoId: 'a245', itens: [itemAvulso('aua', 'ta153')], parcelas: 1, primeiroVencimento: '2026-03-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a245') }),
  contratoAvulso({ id: 'ct359', criadoEm: '2026-03-01T18:00:00', vendedorId: 'ana', alunoId: 'a291', itens: [itemAvulso('smd', 'ta159')], parcelas: 1, primeiroVencimento: '2026-03-09', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a291'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct358', criadoEm: '2026-03-02T12:45:00', vendedorId: 'ana', alunoId: 'a208', itens: [itemAvulso('smd', 'ta159')], parcelas: 1, primeiroVencimento: '2026-03-13', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a208') }),
  contratoAvulso({ id: 'ct364', criadoEm: '2026-03-02T16:00:00', vendedorId: 'ana', alunoId: 'a294', itens: [itemAvulso('ex1', 'ta146')], parcelas: 3, primeiroVencimento: '2026-03-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a294'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct388', criadoEm: '2026-03-03T13:30:00', vendedorId: 'ana', alunoId: 'a305', itens: [itemAvulso('ofs', 'ta163')], parcelas: 1, primeiroVencimento: '2026-03-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a305') }),
  contratoAvulso({ id: 'ct381', criadoEm: '2026-03-05T16:00:00', vendedorId: 'ana', alunoId: 'a302', itens: [itemAvulso('trp', 'ta160')], parcelas: 2, primeiroVencimento: '2026-03-14', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a302'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct379', criadoEm: '2026-03-06T12:45:00', vendedorId: 'bruno', alunoId: 'a232', itens: [itemAvulso('trp', 'ta160')], parcelas: 2, primeiroVencimento: '2026-03-14', forma: 'cartao', status: 'cancelado', assinadoPor: assinaAluno('a232'), cancelamento: { em: '2026-03-14T11:00:00', motivo: 'Não conseguiu liberação da empresa' } }),
  contratoAvulso({ id: 'ct384', criadoEm: '2026-03-07T12:00:00', vendedorId: 'carla', alunoId: 'a262', itens: [itemAvulso('ofs', 'ta163')], parcelas: 3, primeiroVencimento: '2026-03-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a262') }),
  contratoAvulso({ id: 'ct370', criadoEm: '2026-03-07T15:15:00', vendedorId: 'ana', alunoId: 'a297', itens: [itemAvulso('aua', 'ta153')], parcelas: 1, primeiroVencimento: '2026-03-15', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a297') }),
  contratoAvulso({ id: 'ct375', criadoEm: '2026-03-07T17:15:00', vendedorId: 'ana', alunoId: 'a299', itens: [itemAvulso('zla', 'ta169')], parcelas: 3, primeiroVencimento: '2026-03-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a299'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct367', criadoEm: '2026-03-09T11:45:00', vendedorId: 'bruno', alunoId: 'a246', itens: [itemAvulso('aua', 'ta153')], parcelas: 1, primeiroVencimento: '2026-03-20', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a246'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct387', criadoEm: '2026-03-10T11:15:00', vendedorId: 'carla', alunoId: 'a304', itens: [itemAvulso('ofs', 'ta163')], parcelas: 3, primeiroVencimento: '2026-03-24', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a304') }),
  contratoFormacao({ id: 'ct100', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-03-11T12:40:00', vendedorId: 'ana', alunoIds: ['a108'], preco: 1890, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-03-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a108') }),
  contratoAvulso({ id: 'ct366', criadoEm: '2026-03-12T10:00:00', vendedorId: 'ana', alunoId: 'a296', itens: [itemAvulso('ex1', 'ta146')], parcelas: 3, primeiroVencimento: '2026-03-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a296') }),
  contratoAvulso({ id: 'ct363', criadoEm: '2026-03-12T10:45:00', vendedorId: 'ana', alunoId: 'a261', itens: [itemAvulso('ex1', 'ta146')], parcelas: 2, primeiroVencimento: '2026-03-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a261'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct362', criadoEm: '2026-03-13T11:00:00', vendedorId: 'ana', alunoId: 'a218', itens: [itemAvulso('ex1', 'ta146'), itemAvulso('exd', 'ta147')], parcelas: 2, primeiroVencimento: '2026-03-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a218'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct374', criadoEm: '2026-03-14T09:15:00', vendedorId: 'bruno', alunoId: 'a243', itens: [itemAvulso('zla', 'ta169')], parcelas: 3, primeiroVencimento: '2026-03-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a243') }),
  contratoFormacao({ id: 'ct97', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-03-14T18:20:00', vendedorId: 'ana', alunoIds: ['a105'], preco: 1890, parcelas: 4, primeiroVencimento: '2026-04-05', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a105') }),
  contratoAvulso({ id: 'ct377', criadoEm: '2026-03-15T09:30:00', vendedorId: 'carla', alunoId: 'a266', itens: [itemAvulso('trp', 'ta160')], parcelas: 1, primeiroVencimento: '2026-03-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a266') }),
  contratoAvulso({ id: 'ct380', criadoEm: '2026-03-15T16:30:00', vendedorId: 'bruno', alunoId: 'a301', itens: [itemAvulso('trp', 'ta160')], parcelas: 1, primeiroVencimento: '2026-03-22', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a301') }),
  contratoFormacao({ id: 'ct96', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-03-16T15:00:00', vendedorId: 'ana', alunoIds: ['a104'], preco: 1890, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-04-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a104'), desistencias: { a104: { em: '2026-06-26', motivo: 'trabalho', texto: 'Comunicou por WhatsApp.' } } }),
  contratoAvulso({ id: 'ct389', criadoEm: '2026-03-20T17:00:00', vendedorId: 'carla', alunoId: 'a295', itens: [itemAvulso('exd', 'ta147')], parcelas: 2, primeiroVencimento: '2026-03-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a295'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct376', criadoEm: '2026-03-21T17:30:00', vendedorId: 'bruno', alunoId: 'a300', itens: [itemAvulso('zla', 'ta169')], parcelas: 2, primeiroVencimento: '2026-04-10', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a300') }),
  contratoAvulso({ id: 'ct378', criadoEm: '2026-03-23T17:15:00', vendedorId: 'ana', alunoId: 'a248', itens: [itemAvulso('trp', 'ta160')], parcelas: 3, primeiroVencimento: '2026-04-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a248') }),
  contratoAvulso({ id: 'ct369', criadoEm: '2026-03-23T18:00:00', vendedorId: 'ana', alunoId: 'a287', itens: [itemAvulso('aua', 'ta153')], parcelas: 3, primeiroVencimento: '2026-03-31', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a287') }),
  contratoFormacao({ id: 'ct94', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-03-24T10:00:00', vendedorId: 'carla', empresaId: 'e9', alunoIds: ['a101', 'a102'], preco: 1890, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-04-18', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Aline Koehler (Karsten)', pedidoCompra: 'PO-96839' }),
  contratoAvulso({ id: 'ct391', criadoEm: '2026-03-26T11:30:00', vendedorId: 'carla', alunoId: 'a306', itens: [itemAvulso('exd', 'ta147')], parcelas: 1, primeiroVencimento: '2026-04-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a306'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct382', criadoEm: '2026-03-26T17:45:00', vendedorId: 'ana', alunoId: 'a225', itens: [itemAvulso('ofs', 'ta163')], parcelas: 3, primeiroVencimento: '2026-04-09', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a225'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct372', criadoEm: '2026-03-27T09:45:00', vendedorId: 'bruno', alunoId: 'a34', itens: [itemAvulso('zla', 'ta169')], parcelas: 6, primeiroVencimento: '2026-04-01', forma: 'boleto', status: 'cancelado', assinadoPor: assinaAluno('a34'), meio: 'fisica', cancelamento: { em: '2026-04-01T11:00:00', motivo: 'Não conseguiu liberação da empresa' } }),
  contratoAvulso({ id: 'ct390', criadoEm: '2026-03-28T14:45:00', vendedorId: 'ana', alunoId: 'a256', itens: [itemAvulso('exd', 'ta147')], parcelas: 1, primeiroVencimento: '2026-04-12', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a256'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct373', criadoEm: '2026-03-29T12:45:00', vendedorId: 'ana', alunoId: 'a21', itens: [itemAvulso('zla', 'ta169')], parcelas: 4, primeiroVencimento: '2026-04-06', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a21'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct385', criadoEm: '2026-03-30T17:00:00', vendedorId: 'ana', alunoId: 'a267', itens: [itemAvulso('ofs', 'ta163')], parcelas: 1, primeiroVencimento: '2026-04-10', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a267') }),
  contratoFormacao({ id: 'ct98', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-03-31T16:00:00', vendedorId: 'bruno', alunoIds: ['a106'], preco: 1890, parcelas: 4, primeiroVencimento: '2026-04-24', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a106') }),
  contratoAvulso({ id: 'ct383', criadoEm: '2026-04-02T16:15:00', vendedorId: 'ana', alunoId: 'a269', itens: [itemAvulso('ofs', 'ta163')], parcelas: 2, primeiroVencimento: '2026-04-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a269') }),
  contratoAvulso({ id: 'ct386', criadoEm: '2026-04-02T18:00:00', vendedorId: 'bruno', alunoId: 'a303', itens: [itemAvulso('ofs', 'ta163')], parcelas: 2, primeiroVencimento: '2026-04-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a303') }),
  contratoFormacao({ id: 'ct102', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-04-06T11:40:00', vendedorId: 'carla', alunoIds: ['a110'], preco: 1890, fator: 0.95, parcelas: 6, primeiroVencimento: '2026-04-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a110') }),
  contratoTurmas({ id: 'ct393', criadoEm: '2026-04-07T10:00:00', vendedorId: 'carla', empresaId: 'e10', alunoIds: ['a308', 'a309', 'a310', 'a311', 'a312', 'a313', 'a314', 'a315', 'a316', 'a317', 'a318', 'a319', 'a320', 'a321'], modelos: [itemAvulso('ecs', 'ta241')], parcelas: 2, primeiroVencimento: '2026-04-27', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Paulo Vogel (Cremer)', pedidoCompra: '', descricao: 'Comunicação Eficiente · in company' }),
  contratoFormacao({ id: 'ct122', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-04-14T17:40:00', vendedorId: 'ana', alunoIds: ['a131'], preco: 1990, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-05-03', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a131') }),
  contratoFormacao({ id: 'ct95', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-04-14T18:00:00', vendedorId: 'bruno', alunoIds: ['a103'], preco: 1890, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-04-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a103') }),
  contratoFormacao({ id: 'ct137', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-04-16T09:00:00', vendedorId: 'ana', alunoIds: ['a146'], preco: 4490, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-04-24', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a146') }),
  contratoFormacao({ id: 'ct115', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-04-18T15:00:00', vendedorId: 'ana', alunoIds: ['a124'], preco: 1990, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-05-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a124'), desistencias: { a124: { em: '2026-07-24', motivo: 'trabalho', texto: 'Comunicou por WhatsApp.' } } }),
  contratoAvulso({ id: 'ct392', criadoEm: '2026-04-18T15:45:00', vendedorId: 'ana', alunoId: 'a307', itens: [itemAvulso('exd', 'ta147')], parcelas: 1, primeiroVencimento: '2026-04-25', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a307') }),
  contratoFormacao({ id: 'ct114', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-04-19T10:00:00', vendedorId: 'bruno', alunoIds: ['a123'], preco: 1990, parcelas: 4, primeiroVencimento: '2026-05-12', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a123') }),
  contratoFormacao({ id: 'ct120', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-04-19T11:40:00', vendedorId: 'ana', alunoIds: ['a129'], preco: 1990, fator: 0.9, parcelas: 3, primeiroVencimento: '2026-05-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a129') }),
  contratoFormacao({ id: 'ct99', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-04-21T16:20:00', vendedorId: 'carla', alunoIds: ['a107'], preco: 1890, fator: 0.9, parcelas: 3, primeiroVencimento: '2026-04-29', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a107') }),
  contratoFormacao({ id: 'ct133', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-04-22T12:00:00', vendedorId: 'carla', alunoIds: ['a142'], preco: 4490, parcelas: 10, primeiroVencimento: '2026-05-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a142') }),
  contratoFormacao({ id: 'ct101', edicao: 'expa', formacaoId: 'expa', criadoEm: '2026-04-23T09:40:00', vendedorId: 'bruno', alunoIds: ['a109'], preco: 1890, parcelas: 6, primeiroVencimento: '2026-05-01', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a109') }),
  contratoFormacao({ id: 'ct119', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-04-26T18:20:00', vendedorId: 'ana', alunoIds: ['a128'], preco: 1990, parcelas: 4, primeiroVencimento: '2026-05-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a128') }),
  contratoFormacao({ id: 'ct139', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-04-27T15:00:00', vendedorId: 'carla', alunoIds: ['a148'], preco: 4490, parcelas: 10, primeiroVencimento: '2026-05-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a148') }),
  contratoFormacao({ id: 'ct134', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-04-29T13:20:00', vendedorId: 'bruno', alunoIds: ['a143'], preco: 4490, parcelas: 10, primeiroVencimento: '2026-05-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a143'), desistencias: { a143: { em: '2026-07-02', motivo: 'pessoal', texto: 'Comunicou por WhatsApp.' } } }),
  contratoFormacao({ id: 'ct121', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-04-30T10:40:00', vendedorId: 'bruno', alunoIds: ['a130'], preco: 1990, fator: 0.9, parcelas: 3, primeiroVencimento: '2026-05-18', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a130') }),
  contratoFormacao({ id: 'ct117', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-05-07T13:20:00', vendedorId: 'bruno', alunoIds: ['a126'], preco: 1990, parcelas: 3, primeiroVencimento: '2026-05-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a126') }),
  contratoFormacao({ id: 'ct136', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-05-08T16:00:00', vendedorId: 'carla', alunoIds: ['a145'], preco: 4490, parcelas: 10, primeiroVencimento: '2026-05-20', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a145'), congelamentos: { a145: '2026-07-28' } }),
  contratoFormacao({ id: 'ct138', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-05-10T13:40:00', vendedorId: 'ana', alunoIds: ['a147'], preco: 4490, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-05-25', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a147') }),
  contratoFormacao({ id: 'ct135', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-05-13T13:20:00', vendedorId: 'bruno', alunoIds: ['a144'], preco: 4490, parcelas: 10, primeiroVencimento: '2026-05-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a144') }),
  contratoFormacao({ id: 'ct148', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-05-13T14:20:00', vendedorId: 'ana', alunoIds: ['a158'], preco: 3490, parcelas: 4, primeiroVencimento: '2026-05-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a158'), congelamentos: { a158: '2026-08-20' } }),
  contratoFormacao({ id: 'ct118', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-05-15T15:20:00', vendedorId: 'bruno', alunoIds: ['a127'], preco: 1990, parcelas: 6, primeiroVencimento: '2026-05-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a127') }),
  contratoFormacao({ id: 'ct147', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-05-16T14:40:00', vendedorId: 'ana', alunoIds: ['a157'], preco: 3490, parcelas: 6, primeiroVencimento: '2026-05-25', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a157') }),
  contratoFormacao({ id: 'ct141', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-05-19T13:20:00', vendedorId: 'ana', alunoIds: ['a150'], preco: 4490, fator: 0.95, parcelas: 10, primeiroVencimento: '2026-05-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a150') }),
  contratoFormacao({ id: 'ct140', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-05-19T14:00:00', vendedorId: 'ana', alunoIds: ['a149'], preco: 4490, parcelas: 10, primeiroVencimento: '2026-06-02', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a149') }),
  contratoTurmas({ id: 'ct394', criadoEm: '2026-05-20T10:00:00', vendedorId: 'carla', empresaId: 'e1', alunoIds: ['a322', 'a323', 'a324', 'a325', 'a326', 'a327', 'a328', 'a329', 'a330', 'a331'], modelos: [itemAvulso('pbi', 'ta240')], parcelas: 1, primeiroVencimento: '2026-06-09', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Roberto Klein (WEG)', pedidoCompra: 'PO-90364', descricao: 'Power BI: Análise e Visualização de Dados · in company' }),
  contratoFormacao({ id: 'ct116', edicao: 'cada', formacaoId: 'cada', criadoEm: '2026-05-20T14:00:00', vendedorId: 'carla', alunoIds: ['a125'], preco: 1990, fator: 0.95, parcelas: 6, primeiroVencimento: '2026-06-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a125') }),
  contratoFormacao({ id: 'ct142', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-05-22T10:00:00', vendedorId: 'carla', alunoIds: ['a151'], preco: 4490, fator: 0.95, parcelas: 10, primeiroVencimento: '2026-06-10', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a151') }),
  contratoFormacao({ id: 'ct143', edicao: 'md1a', formacaoId: 'md1a', criadoEm: '2026-05-22T17:00:00', vendedorId: 'bruno', alunoIds: ['a152'], preco: 4490, parcelas: 12, primeiroVencimento: '2026-06-07', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a152') }),
  contratoFormacao({ id: 'ct153', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-05-28T12:00:00', vendedorId: 'bruno', alunoIds: ['a163'], preco: 3490, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-06-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a163') }),
  contratoFormacao({ id: 'ct152', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-05-30T16:20:00', vendedorId: 'ana', alunoIds: ['a162'], preco: 3490, parcelas: 3, primeiroVencimento: '2026-06-19', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a162') }),
  contratoFormacao({ id: 'ct149', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-06-04T12:40:00', vendedorId: 'ana', alunoIds: ['a159'], preco: 3490, fator: 0.9, parcelas: 4, primeiroVencimento: '2026-06-19', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a159') }),
  contratoFormacao({ id: 'ct144', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-06-06T10:00:00', vendedorId: 'carla', empresaId: 'e7', alunoIds: ['a153', 'a154'], preco: 3490, fator: 0.9, parcelas: 10, primeiroVencimento: '2026-07-01', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Marina Lauth (Hering)', pedidoCompra: 'PO-71287' }),
  contratoFormacao({ id: 'ct64', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-06-09T12:00:00', vendedorId: 'ana', alunoIds: ['a68'], preco: 2790, fator: 0.9, parcelas: 4, primeiroVencimento: '2026-06-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a68') }),
  contratoFormacao({ id: 'ct145', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-06-13T13:20:00', vendedorId: 'ana', alunoIds: ['a155'], preco: 3490, parcelas: 3, primeiroVencimento: '2026-06-27', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a155') }),
  contratoFormacao({ id: 'ct130', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-06-13T17:00:00', vendedorId: 'ana', alunoIds: ['a139'], preco: 3290, parcelas: 3, primeiroVencimento: '2026-06-29', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a139') }),
  contratoFormacao({ id: 'ct66', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-06-14T12:20:00', vendedorId: 'carla', alunoIds: ['a70'], preco: 2790, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-07-04', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a70') }),
  contratoFormacao({ id: 'ct126', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-06-14T15:00:00', vendedorId: 'carla', alunoIds: ['a135'], preco: 3290, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-06-25', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a135'), congelamentos: { a135: '2026-08-09' } }),
  contratoAvulso({ id: 'ct396', criadoEm: '2026-06-16T09:15:00', vendedorId: 'ana', alunoId: 'a282', itens: [itemAvulso('ad3', 'ta168')], parcelas: 1, primeiroVencimento: '2026-06-26', forma: 'boleto', status: 'cancelado', assinadoPor: assinaAluno('a282'), cancelamento: { em: '2026-06-26T11:00:00', motivo: 'Não conseguiu liberação da empresa' } }),
  contratoFormacao({ id: 'ct63', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-06-17T12:00:00', vendedorId: 'bruno', alunoIds: ['a67'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-07-03', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a67'), congelamentos: { a67: '2026-07-29' } }),
  contratoFormacao({ id: 'ct150', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-06-18T12:00:00', vendedorId: 'bruno', alunoIds: ['a160'], preco: 3490, parcelas: 6, primeiroVencimento: '2026-07-12', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a160') }),
  contratoFormacao({ id: 'ct151', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-06-19T11:20:00', vendedorId: 'carla', alunoIds: ['a161'], preco: 3490, fator: 0.9, parcelas: 4, primeiroVencimento: '2026-07-08', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a161') }),
  contratoFormacao({ id: 'ct132', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-06-19T13:20:00', vendedorId: 'ana', alunoIds: ['a141'], preco: 3290, parcelas: 3, primeiroVencimento: '2026-07-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a141') }),
  contratoFormacao({ id: 'ct168', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-06-21T16:40:00', vendedorId: 'ana', alunoIds: ['a180'], preco: 6900, fator: 0.95, parcelas: 6, primeiroVencimento: '2026-07-05', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a180') }),
  contratoFormacao({ id: 'ct92', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-06-21T18:40:00', vendedorId: 'ana', alunoIds: ['a99'], preco: 2390, parcelas: 3, primeiroVencimento: '2026-07-12', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a99') }),
  contratoFormacao({ id: 'ct146', edicao: 'avpa', formacaoId: 'avpa', criadoEm: '2026-06-23T15:40:00', vendedorId: 'bruno', alunoIds: ['a156'], preco: 3490, parcelas: 6, primeiroVencimento: '2026-07-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a156'), desistencias: { a156: { em: '2026-08-03', motivo: 'financeiro', texto: 'Comunicou por WhatsApp.' } } }),
  contratoFormacao({ id: 'ct165', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-06-24T11:20:00', vendedorId: 'ana', alunoIds: ['a177'], preco: 6900, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-07-03', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a177'), desistencias: { a177: { em: '2026-09-22', motivo: 'trabalho', texto: 'Comunicou por WhatsApp.' } } }),
  contratoFormacao({ id: 'ct131', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-06-24T13:20:00', vendedorId: 'ana', alunoIds: ['a140'], preco: 3290, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-07-15', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a140') }),
  contratoFormacao({ id: 'ct61', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-06-24T16:20:00', vendedorId: 'carla', alunoIds: ['a65'], preco: 2790, parcelas: 6, primeiroVencimento: '2026-07-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a65'), desistencias: { a65: { em: '2026-09-15', motivo: 'financeiro', texto: 'Comunicou por WhatsApp.' } } }),
  contratoFormacao({ id: 'ct129', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-06-26T14:00:00', vendedorId: 'bruno', alunoIds: ['a138'], preco: 3290, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-07-15', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a138') }),
  contratoFormacao({ id: 'ct59', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-06-29T10:00:00', vendedorId: 'carla', empresaId: 'e12', alunoIds: ['a61', 'a62', 'a63'], preco: 2790, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-07-24', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Débora Kraemer (Círculo)' }),
  contratoAvulso({ id: 'ct397', criadoEm: '2026-06-30T13:30:00', vendedorId: 'ana', alunoId: 'a270', itens: [itemAvulso('ad3', 'ta168')], parcelas: 3, primeiroVencimento: '2026-07-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a270') }),
  contratoFormacao({ id: 'ct86', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-01T18:00:00', vendedorId: 'bruno', alunoIds: ['a93'], preco: 2390, parcelas: 6, primeiroVencimento: '2026-07-19', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a93'), desistencias: { a93: { em: '2026-09-10', motivo: 'pessoal', texto: 'Comunicou por WhatsApp.' } } }),
  contratoFormacao({ id: 'ct154', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-07-04T12:00:00', vendedorId: 'carla', alunoIds: ['a164'], preco: 2790, parcelas: 3, primeiroVencimento: '2026-07-29', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a164') }),
  contratoFormacao({ id: 'ct164', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-07-05T09:00:00', vendedorId: 'carla', alunoIds: ['a176'], preco: 6900, parcelas: 12, primeiroVencimento: '2026-07-13', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a176') }),
  contratoAvulso({ id: 'ct398', criadoEm: '2026-07-05T11:00:00', vendedorId: 'ana', alunoId: 'a332', itens: [itemAvulso('ad3', 'ta168')], parcelas: 1, primeiroVencimento: '2026-07-20', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a332'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct162', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-07-05T15:40:00', vendedorId: 'bruno', alunoIds: ['a172'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-07-24', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a172') }),
  contratoAvulso({ id: 'ct395', criadoEm: '2026-07-05T17:45:00', vendedorId: 'carla', alunoId: 'a42', itens: [itemAvulso('ad3', 'ta168')], parcelas: 3, primeiroVencimento: '2026-07-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a42'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct127', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-07-06T11:00:00', vendedorId: 'ana', alunoIds: ['a136'], preco: 3290, fator: 0.9, parcelas: 4, primeiroVencimento: '2026-07-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a136') }),
  contratoFormacao({ id: 'ct62', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-07-07T14:00:00', vendedorId: 'ana', alunoIds: ['a66'], preco: 2790, parcelas: 3, primeiroVencimento: '2026-07-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a66') }),
  contratoFormacao({ id: 'ct160', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-07-08T09:20:00', vendedorId: 'bruno', alunoIds: ['a170'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-07-16', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a170') }),
  contratoFormacao({ id: 'ct184', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-07-08T11:00:00', vendedorId: 'ana', alunoIds: ['a197'], preco: 1490, parcelas: 6, primeiroVencimento: '2026-07-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a197') }),
  contratoFormacao({ id: 'ct185', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-07-08T14:00:00', vendedorId: 'bruno', alunoIds: ['a198'], preco: 1490, fator: 0.95, parcelas: 3, primeiroVencimento: '2026-07-22', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a198') }),
  contratoFormacao({ id: 'ct123', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-07-08T14:20:00', vendedorId: 'carla', alunoIds: ['a132'], preco: 3290, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-07-31', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a132') }),
  contratoFormacao({ id: 'ct128', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-07-08T17:00:00', vendedorId: 'bruno', alunoIds: ['a137'], preco: 3290, fator: 0.95, parcelas: 3, primeiroVencimento: '2026-07-23', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a137') }),
  contratoFormacao({ id: 'ct88', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-09T10:20:00', vendedorId: 'bruno', alunoIds: ['a95'], preco: 2390, parcelas: 3, primeiroVencimento: '2026-07-30', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a95'), congelamentos: { a95: '2026-08-05' } }),
  contratoFormacao({ id: 'ct182', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-07-09T15:40:00', vendedorId: 'bruno', alunoIds: ['a195'], preco: 1490, parcelas: 4, primeiroVencimento: '2026-07-24', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a195') }),
  contratoFormacao({ id: 'ct89', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-10T15:20:00', vendedorId: 'ana', alunoIds: ['a96'], preco: 2390, fator: 0.95, parcelas: 3, primeiroVencimento: '2026-07-28', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a96') }),
  contratoFormacao({ id: 'ct91', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-10T15:20:00', vendedorId: 'ana', alunoIds: ['a98'], preco: 2390, parcelas: 3, primeiroVencimento: '2026-07-29', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a98') }),
  contratoAvulso({ id: 'ct408', criadoEm: '2026-07-10T16:00:00', vendedorId: 'ana', alunoId: 'a336', itens: [itemAvulso('ill', 'ta173')], parcelas: 2, primeiroVencimento: '2026-07-17', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a336') }),
  contratoFormacao({ id: 'ct183', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-07-10T16:20:00', vendedorId: 'bruno', alunoIds: ['a196'], preco: 1490, parcelas: 3, primeiroVencimento: '2026-07-30', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a196') }),
  contratoAvulso({ id: 'ct413', criadoEm: '2026-07-10T18:45:00', vendedorId: 'carla', alunoId: 'a268', itens: [itemAvulso('exb', 'ta171')], parcelas: 1, primeiroVencimento: '2026-07-27', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a268'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct90', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-11T09:20:00', vendedorId: 'ana', alunoIds: ['a97'], preco: 2390, parcelas: 6, primeiroVencimento: '2026-08-05', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a97') }),
  contratoAvulso({ id: 'ct399', criadoEm: '2026-07-11T09:30:00', vendedorId: 'ana', alunoId: 'a333', itens: [itemAvulso('ad3', 'ta168')], parcelas: 1, primeiroVencimento: '2026-07-22', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a333') }),
  contratoAvulso({ id: 'ct415', criadoEm: '2026-07-11T13:30:00', vendedorId: 'ana', alunoId: 'a339', itens: [itemAvulso('exb', 'ta171')], parcelas: 3, primeiroVencimento: '2026-07-18', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a339'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct93', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-11T16:00:00', vendedorId: 'ana', alunoIds: ['a100'], preco: 2390, parcelas: 4, primeiroVencimento: '2026-07-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a100') }),
  contratoFormacao({ id: 'ct84', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-12T10:00:00', vendedorId: 'carla', empresaId: 'e12', alunoIds: ['a89', 'a90', 'a91'], preco: 2390, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-08-06', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Débora Kraemer (Círculo)' }),
  contratoFormacao({ id: 'ct67', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-07-12T12:20:00', vendedorId: 'carla', alunoIds: ['a71'], preco: 2790, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-07-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a71') }),
  contratoAvulso({ id: 'ct401', criadoEm: '2026-07-12T13:45:00', vendedorId: 'ana', alunoId: 'a265', itens: [itemAvulso('exi', 'ta203')], parcelas: 1, primeiroVencimento: '2026-07-23', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a265') }),
  contratoFormacao({ id: 'ct68', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-07-13T16:00:00', vendedorId: 'ana', alunoIds: ['a72'], preco: 2790, parcelas: 3, primeiroVencimento: '2026-07-22', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a72') }),
  contratoAvulso({ id: 'ct414', criadoEm: '2026-07-14T18:15:00', vendedorId: 'bruno', alunoId: 'a264', itens: [itemAvulso('exb', 'ta171')], parcelas: 3, primeiroVencimento: '2026-07-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a264') }),
  contratoAvulso({ id: 'ct419', criadoEm: '2026-07-15T09:00:00', vendedorId: 'carla', alunoId: 'a256', itens: [itemAvulso('psb', 'ta208')], parcelas: 1, primeiroVencimento: '2026-07-31', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a256') }),
  contratoFormacao({ id: 'ct163', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-07-15T10:00:00', vendedorId: 'carla', empresaId: 'e8', alunoIds: ['a173', 'a174', 'a175'], preco: 6900, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-08-09', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Rodrigo Stolf (Altenburg)' }),
  contratoFormacao({ id: 'ct158', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-07-15T10:20:00', vendedorId: 'carla', alunoIds: ['a168'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-08-09', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a168') }),
  contratoFormacao({ id: 'ct124', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-07-15T14:40:00', vendedorId: 'bruno', alunoIds: ['a133'], preco: 3290, parcelas: 3, primeiroVencimento: '2026-08-01', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a133'), desistencias: { a133: { em: '2026-10-02', motivo: 'financeiro', texto: 'Comunicou por WhatsApp.' } } }),
  contratoFormacao({ id: 'ct155', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-07-15T15:20:00', vendedorId: 'bruno', alunoIds: ['a165'], preco: 2790, fator: 0.9, parcelas: 3, primeiroVencimento: '2026-08-05', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a165'), desistencias: { a165: { em: '2026-10-19', motivo: 'financeiro', texto: 'Comunicou por WhatsApp.' } } }),
  contratoFormacao({ id: 'ct108', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-07-16T12:20:00', vendedorId: 'carla', alunoIds: ['a117'], preco: 1690, fator: 0.95, parcelas: 6, primeiroVencimento: '2026-07-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a117') }),
  contratoFormacao({ id: 'ct166', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-07-16T14:40:00', vendedorId: 'carla', alunoIds: ['a178'], preco: 6900, parcelas: 10, primeiroVencimento: '2026-08-01', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a178') }),
  contratoFormacao({ id: 'ct103', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-07-17T10:00:00', vendedorId: 'carla', empresaId: 'e7', alunoIds: ['a111', 'a112'], preco: 1690, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-08-11', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Marina Lauth (Hering)', pedidoCompra: 'PO-90571' }),
  contratoAvulso({ id: 'ct402', criadoEm: '2026-07-17T10:00:00', vendedorId: 'ana', alunoId: 'a276', itens: [itemAvulso('exi', 'ta203')], parcelas: 1, primeiroVencimento: '2026-08-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a276') }),
  contratoAvulso({ id: 'ct451', criadoEm: '2026-07-18T09:00:00', vendedorId: 'ana', alunoId: 'a356', itens: [itemAvulso('svr', 'ta177')], parcelas: 2, primeiroVencimento: '2026-08-03', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a356') }),
  contratoTurmas({ id: 'ct520', criadoEm: '2026-07-18T10:00:00', vendedorId: 'carla', empresaId: 'e7', alunoIds: ['a402', 'a403', 'a404', 'a405', 'a406', 'a407', 'a408', 'a409', 'a410', 'a411', 'a412', 'a413'], modelos: [itemAvulso('clp', 'ta235')], parcelas: 2, primeiroVencimento: '2026-08-07', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Marina Lauth (Hering)', pedidoCompra: 'PO-10491', descricao: 'Liderança na Prática: Gestão de Pessoas e Equipes · in company' }),
  contratoAvulso({ id: 'ct439', criadoEm: '2026-07-18T17:45:00', vendedorId: 'carla', alunoId: 'a350', itens: [itemAvulso('ofs', 'ta205')], parcelas: 1, primeiroVencimento: '2026-08-06', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a350') }),
  contratoAvulso({ id: 'ct424', criadoEm: '2026-07-19T12:00:00', vendedorId: 'bruno', alunoId: 'a276', itens: [itemAvulso('psb', 'ta175')], parcelas: 2, primeiroVencimento: '2026-07-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a276') }),
  contratoFormacao({ id: 'ct60', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-07-19T12:20:00', vendedorId: 'ana', alunoIds: ['a64'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-07-30', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a64') }),
  contratoFormacao({ id: 'ct125', edicao: 'rpia', formacaoId: 'rpia', criadoEm: '2026-07-19T17:40:00', vendedorId: 'ana', alunoIds: ['a134'], preco: 3290, parcelas: 3, primeiroVencimento: '2026-08-03', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a134') }),
  contratoAvulso({ id: 'ct406', criadoEm: '2026-07-19T18:15:00', vendedorId: 'bruno', alunoId: 'a259', itens: [itemAvulso('ill', 'ta173')], parcelas: 2, primeiroVencimento: '2026-08-04', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a259') }),
  contratoAvulso({ id: 'ct447', criadoEm: '2026-07-20T10:45:00', vendedorId: 'carla', alunoId: 'a256', itens: [itemAvulso('svr', 'ta177')], parcelas: 3, primeiroVencimento: '2026-08-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a256'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct161', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-07-20T11:00:00', vendedorId: 'carla', alunoIds: ['a171'], preco: 2790, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-08-14', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a171') }),
  contratoFormacao({ id: 'ct65', edicao: 'dg3b', formacaoId: 'dg3b', criadoEm: '2026-07-20T15:00:00', vendedorId: 'ana', alunoIds: ['a69'], preco: 2790, parcelas: 3, primeiroVencimento: '2026-08-10', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a69') }),
  contratoFormacao({ id: 'ct167', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-07-21T17:40:00', vendedorId: 'carla', alunoIds: ['a179'], preco: 6900, parcelas: 10, primeiroVencimento: '2026-08-10', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a179'), congelamentos: { a179: '2026-08-04' } }),
  contratoAvulso({ id: 'ct473', criadoEm: '2026-07-22T12:15:00', vendedorId: 'ana', alunoId: 'a286', itens: [itemAvulso('seo', 'ta183')], parcelas: 1, primeiroVencimento: '2026-07-27', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a286'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct422', criadoEm: '2026-07-22T15:45:00', vendedorId: 'ana', alunoId: 'a343', itens: [itemAvulso('psb', 'ta208')], parcelas: 1, primeiroVencimento: '2026-08-01', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a343') }),
  contratoAvulso({ id: 'ct433', criadoEm: '2026-07-22T18:30:00', vendedorId: 'ana', alunoId: 'a347', itens: [itemAvulso('mti', 'ta180')], parcelas: 2, primeiroVencimento: '2026-08-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a347'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct503', criadoEm: '2026-07-23T10:15:00', vendedorId: 'ana', alunoId: 'a287', itens: [itemAvulso('gda', 'ta184')], parcelas: 1, primeiroVencimento: '2026-08-08', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a287'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct481', criadoEm: '2026-07-23T11:15:00', vendedorId: 'ana', alunoId: 'a233', itens: [itemAvulso('aub', 'ta179')], parcelas: 1, primeiroVencimento: '2026-07-31', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a233'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct459', criadoEm: '2026-07-23T13:15:00', vendedorId: 'ana', alunoId: 'a261', itens: [itemAvulso('iaf', 'ta191')], parcelas: 1, primeiroVencimento: '2026-08-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a261'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct409', criadoEm: '2026-07-23T15:15:00', vendedorId: 'ana', alunoId: 'a337', itens: [itemAvulso('ill', 'ta173')], parcelas: 3, primeiroVencimento: '2026-07-29', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a337') }),
  contratoAvulso({ id: 'ct497', criadoEm: '2026-07-24T10:30:00', vendedorId: 'carla', alunoId: 'a390', itens: [itemAvulso('rjw', 'ta189')], parcelas: 1, primeiroVencimento: '2026-08-03', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a390'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct417', criadoEm: '2026-07-24T11:00:00', vendedorId: 'carla', alunoId: 'a341', itens: [itemAvulso('exb', 'ta171')], parcelas: 1, primeiroVencimento: '2026-07-30', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a341') }),
  contratoAvulso({ id: 'ct483', criadoEm: '2026-07-24T11:15:00', vendedorId: 'ana', alunoId: 'a264', itens: [itemAvulso('aub', 'ta179')], parcelas: 3, primeiroVencimento: '2026-08-07', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a264') }),
  contratoAvulso({ id: 'ct505', criadoEm: '2026-07-24T12:30:00', vendedorId: 'carla', alunoId: 'a394', itens: [itemAvulso('gda', 'ta184')], parcelas: 1, primeiroVencimento: '2026-08-13', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a394') }),
  contratoAvulso({ id: 'ct501', criadoEm: '2026-07-24T15:00:00', vendedorId: 'carla', alunoId: 'a247', itens: [itemAvulso('gda', 'ta184'), itemAvulso('trp', 'ta214')], parcelas: 1, primeiroVencimento: '2026-07-31', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a247') }),
  contratoAvulso({ id: 'ct514', criadoEm: '2026-07-24T17:30:00', vendedorId: 'ana', alunoId: 'a399', itens: [itemAvulso('uxp', 'ta188')], parcelas: 6, primeiroVencimento: '2026-08-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a399'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct453', criadoEm: '2026-07-25T09:45:00', vendedorId: 'ana', alunoId: 'a288', itens: [itemAvulso('swx', 'ta178')], parcelas: 2, primeiroVencimento: '2026-08-01', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a288') }),
  contratoFormacao({ id: 'ct112', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-07-25T11:20:00', vendedorId: 'carla', alunoIds: ['a121'], preco: 1690, parcelas: 4, primeiroVencimento: '2026-08-12', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a121') }),
  contratoAvulso({ id: 'ct421', criadoEm: '2026-07-25T14:15:00', vendedorId: 'bruno', alunoId: 'a342', itens: [itemAvulso('psb', 'ta208')], parcelas: 1, primeiroVencimento: '2026-08-13', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a342') }),
  contratoAvulso({ id: 'ct426', criadoEm: '2026-07-25T14:15:00', vendedorId: 'bruno', alunoId: 'a344', itens: [itemAvulso('psb', 'ta175')], parcelas: 3, primeiroVencimento: '2026-08-10', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a344') }),
  contratoAvulso({ id: 'ct430', criadoEm: '2026-07-25T15:45:00', vendedorId: 'carla', alunoId: 'a233', itens: [itemAvulso('mti', 'ta180')], parcelas: 2, primeiroVencimento: '2026-08-01', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a233'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct105', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-07-25T17:40:00', vendedorId: 'ana', alunoIds: ['a114'], preco: 1690, parcelas: 4, primeiroVencimento: '2026-08-05', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a114') }),
  contratoFormacao({ id: 'ct170', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-07-25T18:40:00', vendedorId: 'ana', alunoIds: ['a182'], preco: 6900, parcelas: 6, primeiroVencimento: '2026-08-15', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a182') }),
  contratoFormacao({ id: 'ct181', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-07-26T10:20:00', vendedorId: 'bruno', alunoIds: ['a194'], preco: 1490, parcelas: 3, primeiroVencimento: '2026-08-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a194') }),
  contratoAvulso({ id: 'ct474', criadoEm: '2026-07-26T13:00:00', vendedorId: 'ana', alunoId: 'a244', itens: [itemAvulso('seo', 'ta183')], parcelas: 1, primeiroVencimento: '2026-08-07', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a244') }),
  contratoAvulso({ id: 'ct476', criadoEm: '2026-07-26T13:00:00', vendedorId: 'carla', alunoId: 'a380', itens: [itemAvulso('seo', 'ta183')], parcelas: 2, primeiroVencimento: '2026-08-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a380') }),
  contratoFormacao({ id: 'ct169', edicao: 'fpsa', formacaoId: 'fpsa', criadoEm: '2026-07-26T15:40:00', vendedorId: 'ana', alunoIds: ['a181'], preco: 6900, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-08-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a181') }),
  contratoAvulso({ id: 'ct437', criadoEm: '2026-07-26T17:15:00', vendedorId: 'carla', alunoId: 'a282', itens: [itemAvulso('ofs', 'ta205')], parcelas: 2, primeiroVencimento: '2026-08-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a282'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct535', criadoEm: '2026-07-26T17:45:00', vendedorId: 'ana', alunoId: 'a420', itens: [itemAvulso('gla', 'ta209')], parcelas: 1, primeiroVencimento: '2026-08-15', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a420') }),
  contratoFormacao({ id: 'ct87', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-26T18:40:00', vendedorId: 'ana', alunoIds: ['a94'], preco: 2390, fator: 0.95, parcelas: 6, primeiroVencimento: '2026-08-06', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a94') }),
  contratoAvulso({ id: 'ct438', criadoEm: '2026-07-27T11:30:00', vendedorId: 'ana', alunoId: 'a349', itens: [itemAvulso('ofs', 'ta205')], parcelas: 2, primeiroVencimento: '2026-08-05', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a349'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct404', criadoEm: '2026-07-27T14:45:00', vendedorId: 'ana', alunoId: 'a335', itens: [itemAvulso('exi', 'ta203')], parcelas: 1, primeiroVencimento: '2026-08-13', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a335'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct470', criadoEm: '2026-07-27T18:00:00', vendedorId: 'ana', alunoId: 'a377', itens: [itemAvulso('exb', 'ta207')], parcelas: 2, primeiroVencimento: '2026-08-12', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a377'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct502', criadoEm: '2026-07-27T18:00:00', vendedorId: 'carla', alunoId: 'a295', itens: [itemAvulso('gda', 'ta184')], parcelas: 3, primeiroVencimento: '2026-08-03', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a295') }),
  contratoAvulso({ id: 'ct444', criadoEm: '2026-07-28T09:45:00', vendedorId: 'carla', alunoId: 'a305', itens: [itemAvulso('jsa', 'ta206')], parcelas: 3, primeiroVencimento: '2026-08-14', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a305') }),
  contratoTurmas({ id: 'ct457', criadoEm: '2026-07-28T10:00:00', vendedorId: 'carla', empresaId: 'e2', alunoIds: ['a359', 'a360', 'a361', 'a362', 'a363', 'a364', 'a365', 'a366', 'a367', 'a368', 'a369', 'a370', 'a371', 'a372'], modelos: [itemAvulso('fhd', 'ta236')], parcelas: 1, primeiroVencimento: '2026-08-17', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Diego Fontana (Senior)', pedidoCompra: '', descricao: 'Suporte Técnico Profissional: Atendimento, Processos e Soluções · in company' }),
  contratoAvulso({ id: 'ct469', criadoEm: '2026-07-28T11:00:00', vendedorId: 'bruno', alunoId: 'a341', itens: [itemAvulso('exb', 'ta207'), itemAvulso('exi', 'ta172')], parcelas: 1, primeiroVencimento: '2026-08-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a341') }),
  contratoAvulso({ id: 'ct513', criadoEm: '2026-07-28T11:00:00', vendedorId: 'ana', alunoId: 'a398', itens: [itemAvulso('uxp', 'ta188')], parcelas: 6, primeiroVencimento: '2026-08-15', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a398'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct507', criadoEm: '2026-07-28T15:00:00', vendedorId: 'ana', alunoId: 'a272', itens: [itemAvulso('uxp', 'ta188')], parcelas: 3, primeiroVencimento: '2026-08-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a272') }),
  contratoAvulso({ id: 'ct428', criadoEm: '2026-07-28T15:30:00', vendedorId: 'bruno', alunoId: 'a269', itens: [itemAvulso('mti', 'ta180')], parcelas: 1, primeiroVencimento: '2026-08-07', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a269'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct407', criadoEm: '2026-07-28T17:00:00', vendedorId: 'ana', alunoId: 'a276', itens: [itemAvulso('ill', 'ta173')], parcelas: 1, primeiroVencimento: '2026-08-09', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a276') }),
  contratoFormacao({ id: 'ct159', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-07-29T09:20:00', vendedorId: 'ana', alunoIds: ['a169'], preco: 2790, parcelas: 3, primeiroVencimento: '2026-08-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a169') }),
  contratoAvulso({ id: 'ct420', criadoEm: '2026-07-29T13:15:00', vendedorId: 'ana', alunoId: 'a230', itens: [itemAvulso('psb', 'ta208')], parcelas: 1, primeiroVencimento: '2026-08-13', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a230') }),
  contratoAvulso({ id: 'ct524', criadoEm: '2026-07-29T15:15:00', vendedorId: 'bruno', alunoId: 'a347', itens: [itemAvulso('ecs', 'ta181')], parcelas: 3, primeiroVencimento: '2026-08-03', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a347') }),
  contratoAvulso({ id: 'ct496', criadoEm: '2026-07-29T16:30:00', vendedorId: 'ana', alunoId: 'a283', itens: [itemAvulso('rjw', 'ta189')], parcelas: 1, primeiroVencimento: '2026-08-09', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a283') }),
  contratoFormacao({ id: 'ct85', edicao: 'xdpa', formacaoId: 'xdpa', criadoEm: '2026-07-29T17:00:00', vendedorId: 'ana', alunoIds: ['a92'], preco: 2390, parcelas: 4, primeiroVencimento: '2026-08-12', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a92') }),
  contratoFormacao({ id: 'ct109', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-07-29T18:00:00', vendedorId: 'carla', alunoIds: ['a118'], preco: 1690, fator: 0.9, parcelas: 6, primeiroVencimento: '2026-08-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a118') }),
  contratoAvulso({ id: 'ct466', criadoEm: '2026-07-29T18:30:00', vendedorId: 'carla', alunoId: 'a376', itens: [itemAvulso('iaf', 'ta191')], parcelas: 2, primeiroVencimento: '2026-08-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a376') }),
  contratoAvulso({ id: 'ct487', criadoEm: '2026-07-30T09:00:00', vendedorId: 'carla', alunoId: 'a50', itens: [itemAvulso('od1', 'ta186'), itemAvulso('od2', 'ta187')], parcelas: 1, primeiroVencimento: '2026-08-10', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a50'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct472', criadoEm: '2026-07-30T12:00:00', vendedorId: 'carla', alunoId: 'a302', itens: [itemAvulso('seo', 'ta183')], parcelas: 2, primeiroVencimento: '2026-08-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a302') }),
  contratoAvulso({ id: 'ct482', criadoEm: '2026-07-30T15:45:00', vendedorId: 'ana', alunoId: 'a332', itens: [itemAvulso('aub', 'ta179'), itemAvulso('aua', 'ta223')], parcelas: 1, primeiroVencimento: '2026-08-06', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a332') }),
  contratoAvulso({ id: 'ct461', criadoEm: '2026-07-31T10:30:00', vendedorId: 'ana', alunoId: 'a335', itens: [itemAvulso('iaf', 'ta191')], parcelas: 1, primeiroVencimento: '2026-08-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a335') }),
  contratoFormacao({ id: 'ct106', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-07-31T13:00:00', vendedorId: 'ana', alunoIds: ['a115'], preco: 1690, fator: 0.95, parcelas: 6, primeiroVencimento: '2026-08-14', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a115') }),
  contratoAvulso({ id: 'ct435', criadoEm: '2026-07-31T15:00:00', vendedorId: 'ana', alunoId: 'a349', itens: [itemAvulso('mti', 'ta180')], parcelas: 3, primeiroVencimento: '2026-08-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a349'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct519', criadoEm: '2026-07-31T15:00:00', vendedorId: 'ana', alunoId: 'a401', itens: [itemAvulso('dmi', 'ta192'), itemAvulso('dmt', 'ta211')], parcelas: 3, primeiroVencimento: '2026-08-13', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a401') }),
  contratoAvulso({ id: 'ct425', criadoEm: '2026-08-01T09:15:00', vendedorId: 'ana', alunoId: 'a336', itens: [itemAvulso('psb', 'ta175')], parcelas: 3, primeiroVencimento: '2026-08-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a336') }),
  contratoAvulso({ id: 'ct465', criadoEm: '2026-08-01T10:00:00', vendedorId: 'ana', alunoId: 'a375', itens: [itemAvulso('iaf', 'ta191')], parcelas: 3, primeiroVencimento: '2026-08-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a375'), meio: 'fisica' }),
  contratoTurmas({ id: 'ct598', criadoEm: '2026-08-01T10:00:00', vendedorId: 'carla', empresaId: 'e9', alunoIds: ['a447', 'a448', 'a449', 'a450', 'a451', 'a452', 'a453', 'a454', 'a455', 'a456', 'a457', 'a458', 'a459', 'a460', 'a461', 'a462'], modelos: [itemAvulso('exi', 'ta238')], parcelas: 2, primeiroVencimento: '2026-08-21', forma: 'boleto', status: 'comercial_ok', assinadoPor: 'Aline Koehler (Karsten)', pedidoCompra: 'PO-47486', descricao: 'Excel: Recursos Intermediários · in company' }),
  contratoAvulso({ id: 'ct478', criadoEm: '2026-08-01T15:45:00', vendedorId: 'ana', alunoId: 'a381', itens: [itemAvulso('exi', 'ta172')], parcelas: 3, primeiroVencimento: '2026-08-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a381'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct441', criadoEm: '2026-08-01T17:15:00', vendedorId: 'carla', alunoId: 'a352', itens: [itemAvulso('ofs', 'ta205')], parcelas: 1, primeiroVencimento: '2026-08-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a352') }),
  contratoAvulso({ id: 'ct531', criadoEm: '2026-08-01T17:30:00', vendedorId: 'ana', alunoId: 'a248', itens: [itemAvulso('gla', 'ta209')], parcelas: 1, primeiroVencimento: '2026-08-18', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a248'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct156', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-08-02T09:20:00', vendedorId: 'bruno', alunoIds: ['a166'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-08-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a166') }),
  contratoAvulso({ id: 'ct479', criadoEm: '2026-08-02T10:15:00', vendedorId: 'carla', alunoId: 'a382', itens: [itemAvulso('exi', 'ta172')], parcelas: 3, primeiroVencimento: '2026-08-21', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a382') }),
  contratoAvulso({ id: 'ct431', criadoEm: '2026-08-02T14:15:00', vendedorId: 'ana', alunoId: 'a266', itens: [itemAvulso('mti', 'ta180')], parcelas: 1, primeiroVencimento: '2026-08-19', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a266') }),
  contratoAvulso({ id: 'ct537', criadoEm: '2026-08-02T18:45:00', vendedorId: 'ana', alunoId: 'a267', itens: [itemAvulso('smd', 'ta185')], parcelas: 2, primeiroVencimento: '2026-08-18', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a267') }),
  contratoFormacao({ id: 'ct180', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-08-03T09:00:00', vendedorId: 'bruno', alunoIds: ['a193'], preco: 1490, parcelas: 6, primeiroVencimento: '2026-08-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a193') }),
  contratoAvulso({ id: 'ct529', criadoEm: '2026-08-03T09:45:00', vendedorId: 'ana', alunoId: 'a417', itens: [itemAvulso('ecs', 'ta181')], parcelas: 3, primeiroVencimento: '2026-08-22', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a417'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct405', criadoEm: '2026-08-03T10:00:00', vendedorId: 'bruno', alunoId: 'a303', itens: [itemAvulso('ill', 'ta173')], parcelas: 1, primeiroVencimento: '2026-08-10', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a303') }),
  contratoAvulso({ id: 'ct544', criadoEm: '2026-08-03T11:15:00', vendedorId: 'ana', alunoId: 'a423', itens: [itemAvulso('ill', 'ta204')], parcelas: 3, primeiroVencimento: '2026-08-14', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a423'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct403', criadoEm: '2026-08-03T12:00:00', vendedorId: 'bruno', alunoId: 'a334', itens: [itemAvulso('exi', 'ta203')], parcelas: 2, primeiroVencimento: '2026-08-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a334') }),
  contratoAvulso({ id: 'ct458', criadoEm: '2026-08-03T13:45:00', vendedorId: 'carla', alunoId: 'a262', itens: [itemAvulso('iaf', 'ta191')], parcelas: 1, primeiroVencimento: '2026-08-15', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a262') }),
  contratoAvulso({ id: 'ct540', criadoEm: '2026-08-03T14:30:00', vendedorId: 'ana', alunoId: 'a422', itens: [itemAvulso('smd', 'ta185')], parcelas: 2, primeiroVencimento: '2026-08-10', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a422') }),
  contratoAvulso({ id: 'ct446', criadoEm: '2026-08-03T14:45:00', vendedorId: 'carla', alunoId: 'a354', itens: [itemAvulso('jsa', 'ta206')], parcelas: 1, primeiroVencimento: '2026-08-21', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a354') }),
  contratoAvulso({ id: 'ct455', criadoEm: '2026-08-03T15:30:00', vendedorId: 'carla', alunoId: 'a357', itens: [itemAvulso('swx', 'ta178')], parcelas: 3, primeiroVencimento: '2026-08-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a357'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct528', criadoEm: '2026-08-03T16:00:00', vendedorId: 'carla', alunoId: 'a416', itens: [itemAvulso('ecs', 'ta181')], parcelas: 2, primeiroVencimento: '2026-08-21', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a416') }),
  contratoAvulso({ id: 'ct488', criadoEm: '2026-08-03T16:30:00', vendedorId: 'ana', alunoId: 'a27', itens: [itemAvulso('od1', 'ta186')], parcelas: 2, primeiroVencimento: '2026-08-09', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a27') }),
  contratoAvulso({ id: 'ct534', criadoEm: '2026-08-04T09:00:00', vendedorId: 'ana', alunoId: 'a419', itens: [itemAvulso('gla', 'ta209')], parcelas: 1, primeiroVencimento: '2026-08-22', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a419'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct553', criadoEm: '2026-08-04T09:15:00', vendedorId: 'carla', alunoId: 'a339', itens: [itemAvulso('iaf', 'ta210')], parcelas: 1, primeiroVencimento: '2026-08-18', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a339'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct436', criadoEm: '2026-08-04T09:45:00', vendedorId: 'ana', alunoId: 'a286', itens: [itemAvulso('ofs', 'ta205')], parcelas: 3, primeiroVencimento: '2026-08-10', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a286'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct448', criadoEm: '2026-08-04T11:00:00', vendedorId: 'ana', alunoId: 'a253', itens: [itemAvulso('svr', 'ta177')], parcelas: 1, primeiroVencimento: '2026-08-18', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a253'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct400', criadoEm: '2026-08-04T12:45:00', vendedorId: 'bruno', alunoId: 'a278', itens: [itemAvulso('exi', 'ta203')], parcelas: 1, primeiroVencimento: '2026-08-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a278') }),
  contratoAvulso({ id: 'ct410', criadoEm: '2026-08-04T14:15:00', vendedorId: 'ana', alunoId: 'a338', itens: [itemAvulso('ill', 'ta173')], parcelas: 1, primeiroVencimento: '2026-08-21', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a338') }),
  contratoFormacao({ id: 'ct104', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-08-04T15:20:00', vendedorId: 'bruno', alunoIds: ['a113'], preco: 1690, parcelas: 4, primeiroVencimento: '2026-08-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a113') }),
  contratoAvulso({ id: 'ct471', criadoEm: '2026-08-04T16:15:00', vendedorId: 'ana', alunoId: 'a378', itens: [itemAvulso('exb', 'ta207')], parcelas: 1, primeiroVencimento: '2026-08-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a378'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct522', criadoEm: '2026-08-05T09:30:00', vendedorId: 'bruno', alunoId: 'a414', itens: [itemAvulso('dmt', 'ta211')], parcelas: 3, primeiroVencimento: '2026-08-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a414'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct557', criadoEm: '2026-08-05T10:00:00', vendedorId: 'carla', alunoId: 'a428', itens: [itemAvulso('iaf', 'ta210')], parcelas: 2, primeiroVencimento: '2026-08-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a428') }),
  contratoAvulso({ id: 'ct498', criadoEm: '2026-08-05T11:15:00', vendedorId: 'ana', alunoId: 'a391', itens: [itemAvulso('rjw', 'ta189')], parcelas: 2, primeiroVencimento: '2026-08-19', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a391') }),
  contratoFormacao({ id: 'ct187', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-08-05T16:40:00', vendedorId: 'carla', alunoIds: ['a200'], preco: 1490, fator: 0.95, parcelas: 4, primeiroVencimento: '2026-08-28', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a200') }),
  contratoAvulso({ id: 'ct432', criadoEm: '2026-08-05T18:15:00', vendedorId: 'ana', alunoId: 'a346', itens: [itemAvulso('mti', 'ta180')], parcelas: 1, primeiroVencimento: '2026-08-12', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a346'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct113', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-08-05T18:40:00', vendedorId: 'ana', alunoIds: ['a122'], preco: 1690, fator: 0.95, parcelas: 3, primeiroVencimento: '2026-08-27', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a122') }),
  contratoFormacao({ id: 'ct110', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-08-06T10:20:00', vendedorId: 'ana', alunoIds: ['a119'], preco: 1690, parcelas: 4, primeiroVencimento: '2026-08-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a119') }),
  contratoAvulso({ id: 'ct596', criadoEm: '2026-08-06T13:45:00', vendedorId: 'carla', alunoId: 'a445', itens: [itemAvulso('pip', 'ta202')], parcelas: 1, primeiroVencimento: '2026-08-26', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a445'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct506', criadoEm: '2026-08-06T14:45:00', vendedorId: 'ana', alunoId: 'a395', itens: [itemAvulso('gda', 'ta184')], parcelas: 1, primeiroVencimento: '2026-08-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a395') }),
  contratoAvulso({ id: 'ct527', criadoEm: '2026-08-06T15:00:00', vendedorId: 'ana', alunoId: 'a384', itens: [itemAvulso('ecs', 'ta181')], parcelas: 1, primeiroVencimento: '2026-08-21', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a384') }),
  contratoAvulso({ id: 'ct418', criadoEm: '2026-08-06T16:45:00', vendedorId: 'ana', alunoId: 'a289', itens: [itemAvulso('psb', 'ta208')], parcelas: 2, primeiroVencimento: '2026-08-17', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a289') }),
  contratoAvulso({ id: 'ct554', criadoEm: '2026-08-06T17:00:00', vendedorId: 'ana', alunoId: 'a351', itens: [itemAvulso('iaf', 'ta210')], parcelas: 3, primeiroVencimento: '2026-08-22', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a351') }),
  contratoAvulso({ id: 'ct477', criadoEm: '2026-08-06T17:45:00', vendedorId: 'carla', alunoId: 'a213', itens: [itemAvulso('exi', 'ta172')], parcelas: 2, primeiroVencimento: '2026-08-26', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a213') }),
  contratoFormacao({ id: 'ct186', edicao: 'brpa', formacaoId: 'brpa', criadoEm: '2026-08-07T12:20:00', vendedorId: 'carla', alunoIds: ['a199'], preco: 1490, parcelas: 6, primeiroVencimento: '2026-08-14', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a199') }),
  contratoAvulso({ id: 'ct427', criadoEm: '2026-08-07T14:00:00', vendedorId: 'ana', alunoId: 'a345', itens: [itemAvulso('psb', 'ta175')], parcelas: 1, primeiroVencimento: '2026-08-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a345'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct595', criadoEm: '2026-08-07T14:15:00', vendedorId: 'bruno', alunoId: 'a353', itens: [itemAvulso('pip', 'ta202')], parcelas: 2, primeiroVencimento: '2026-08-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a353'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct442', criadoEm: '2026-08-07T15:00:00', vendedorId: 'carla', alunoId: 'a46', itens: [itemAvulso('jsa', 'ta206')], parcelas: 1, primeiroVencimento: '2026-08-24', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a46') }),
  contratoAvulso({ id: 'ct510', criadoEm: '2026-08-07T15:00:00', vendedorId: 'ana', alunoId: 'a389', itens: [itemAvulso('uxp', 'ta188')], parcelas: 3, primeiroVencimento: '2026-08-26', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a389'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct449', criadoEm: '2026-08-07T15:30:00', vendedorId: 'bruno', alunoId: 'a246', itens: [itemAvulso('svr', 'ta177')], parcelas: 1, primeiroVencimento: '2026-08-27', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a246') }),
  contratoAvulso({ id: 'ct515', criadoEm: '2026-08-07T15:30:00', vendedorId: 'ana', alunoId: 'a283', itens: [itemAvulso('dmi', 'ta192')], parcelas: 3, primeiroVencimento: '2026-08-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a283'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct512', criadoEm: '2026-08-07T18:45:00', vendedorId: 'ana', alunoId: 'a397', itens: [itemAvulso('uxp', 'ta188')], parcelas: 2, primeiroVencimento: '2026-08-26', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a397'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct593', criadoEm: '2026-08-08T10:30:00', vendedorId: 'bruno', alunoId: 'a415', itens: [itemAvulso('pip', 'ta202')], parcelas: 1, primeiroVencimento: '2026-08-23', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a415') }),
  contratoAvulso({ id: 'ct445', criadoEm: '2026-08-08T12:45:00', vendedorId: 'ana', alunoId: 'a353', itens: [itemAvulso('jsa', 'ta206')], parcelas: 1, primeiroVencimento: '2026-08-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a353') }),
  contratoAvulso({ id: 'ct530', criadoEm: '2026-08-08T13:30:00', vendedorId: 'ana', alunoId: 'a418', itens: [itemAvulso('ecs', 'ta181')], parcelas: 3, primeiroVencimento: '2026-08-19', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a418') }),
  contratoAvulso({ id: 'ct412', criadoEm: '2026-08-08T13:45:00', vendedorId: 'ana', alunoId: 'a213', itens: [itemAvulso('exb', 'ta171')], parcelas: 2, primeiroVencimento: '2026-08-16', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a213'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct541', criadoEm: '2026-08-08T14:45:00', vendedorId: 'bruno', alunoId: 'a242', itens: [itemAvulso('ill', 'ta204'), itemAvulso('ila', 'ta174')], parcelas: 1, primeiroVencimento: '2026-08-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a242') }),
  contratoAvulso({ id: 'ct556', criadoEm: '2026-08-08T17:15:00', vendedorId: 'ana', alunoId: 'a238', itens: [itemAvulso('iaf', 'ta210')], parcelas: 1, primeiroVencimento: '2026-08-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a238') }),
  contratoAvulso({ id: 'ct516', criadoEm: '2026-08-08T18:00:00', vendedorId: 'bruno', alunoId: 'a305', itens: [itemAvulso('dmi', 'ta192')], parcelas: 1, primeiroVencimento: '2026-08-19', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a305') }),
  contratoAvulso({ id: 'ct450', criadoEm: '2026-08-08T18:45:00', vendedorId: 'ana', alunoId: 'a355', itens: [itemAvulso('svr', 'ta177')], parcelas: 1, primeiroVencimento: '2026-08-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a355') }),
  contratoFormacao({ id: 'ct107', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-08-09T09:00:00', vendedorId: 'bruno', alunoIds: ['a116'], preco: 1690, parcelas: 3, primeiroVencimento: '2026-08-18', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a116') }),
  contratoTurmas({ id: 'ct760', criadoEm: '2026-08-09T10:00:00', vendedorId: 'carla', empresaId: 'e2', alunoIds: ['a559', 'a560', 'a561', 'a562', 'a563', 'a564', 'a565', 'a566', 'a567', 'a568', 'a569', 'a570'], modelos: [itemAvulso('git', 'ta60')], parcelas: 1, primeiroVencimento: '2026-08-29', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Diego Fontana (Senior)', pedidoCompra: '', descricao: 'Git e GitHub · in company' }),
  contratoAvulso({ id: 'ct460', criadoEm: '2026-08-09T13:30:00', vendedorId: 'ana', alunoId: 'a294', itens: [itemAvulso('iaf', 'ta191')], parcelas: 2, primeiroVencimento: '2026-08-16', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a294') }),
  contratoAvulso({ id: 'ct411', criadoEm: '2026-08-09T15:00:00', vendedorId: 'ana', alunoId: 'a277', itens: [itemAvulso('exb', 'ta171')], parcelas: 1, primeiroVencimento: '2026-08-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a277') }),
  contratoAvulso({ id: 'ct587', criadoEm: '2026-08-09T15:45:00', vendedorId: 'carla', alunoId: 'a442', itens: [itemAvulso('zla', 'ta195')], parcelas: 3, primeiroVencimento: '2026-08-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a442') }),
  contratoAvulso({ id: 'ct552', criadoEm: '2026-08-09T17:00:00', vendedorId: 'carla', alunoId: 'a427', itens: [itemAvulso('mti', 'ta212')], parcelas: 3, primeiroVencimento: '2026-08-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a427') }),
  contratoAvulso({ id: 'ct429', criadoEm: '2026-08-10T12:15:00', vendedorId: 'ana', alunoId: 'a235', itens: [itemAvulso('mti', 'ta180')], parcelas: 1, primeiroVencimento: '2026-08-18', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a235') }),
  contratoAvulso({ id: 'ct416', criadoEm: '2026-08-10T15:00:00', vendedorId: 'carla', alunoId: 'a340', itens: [itemAvulso('exb', 'ta171'), itemAvulso('exi', 'ta172')], parcelas: 3, primeiroVencimento: '2026-08-19', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a340') }),
  contratoAvulso({ id: 'ct560', criadoEm: '2026-08-10T16:00:00', vendedorId: 'ana', alunoId: 'a305', itens: [itemAvulso('ofs', 'ta182')], parcelas: 2, primeiroVencimento: '2026-08-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a305'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct561', criadoEm: '2026-08-11T12:45:00', vendedorId: 'ana', alunoId: 'a234', itens: [itemAvulso('ofs', 'ta182')], parcelas: 1, primeiroVencimento: '2026-08-18', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a234') }),
  contratoAvulso({ id: 'ct454', criadoEm: '2026-08-11T13:15:00', vendedorId: 'bruno', alunoId: 'a355', itens: [itemAvulso('swx', 'ta178')], parcelas: 2, primeiroVencimento: '2026-08-24', forma: 'cartao', status: 'cancelado', assinadoPor: assinaAluno('a355'), meio: 'fisica', cancelamento: { em: '2026-08-15T11:00:00', motivo: 'Aluno desistiu antes do início — sem multa' } }),
  contratoAvulso({ id: 'ct484', criadoEm: '2026-08-11T13:30:00', vendedorId: 'ana', alunoId: 'a384', itens: [itemAvulso('aub', 'ta179')], parcelas: 3, primeiroVencimento: '2026-08-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a384') }),
  contratoAvulso({ id: 'ct559', criadoEm: '2026-08-11T14:30:00', vendedorId: 'carla', alunoId: 'a430', itens: [itemAvulso('iaf', 'ta210')], parcelas: 1, primeiroVencimento: '2026-08-18', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a430'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct491', criadoEm: '2026-08-11T18:00:00', vendedorId: 'ana', alunoId: 'a388', itens: [itemAvulso('od1', 'ta186')], parcelas: 1, primeiroVencimento: '', forma: 'pix', status: 'rascunho', assinadoPor: assinaAluno('a388'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct581', criadoEm: '2026-08-11T18:00:00', vendedorId: 'ana', alunoId: 'a439', itens: [itemAvulso('ad3', 'ta194')], parcelas: 1, primeiroVencimento: '2026-08-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a439'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct499', criadoEm: '2026-08-12T11:45:00', vendedorId: 'ana', alunoId: 'a392', itens: [itemAvulso('rjw', 'ta189')], parcelas: 2, primeiroVencimento: '2026-08-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a392'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct492', criadoEm: '2026-08-12T12:00:00', vendedorId: 'ana', alunoId: 'a389', itens: [itemAvulso('od1', 'ta186')], parcelas: 2, primeiroVencimento: '2026-08-20', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a389'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct508', criadoEm: '2026-08-13T09:45:00', vendedorId: 'carla', alunoId: 'a392', itens: [itemAvulso('uxp', 'ta188')], parcelas: 4, primeiroVencimento: '2026-08-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a392') }),
  contratoAvulso({ id: 'ct443', criadoEm: '2026-08-13T12:30:00', vendedorId: 'ana', alunoId: 'a249', itens: [itemAvulso('jsa', 'ta206')], parcelas: 3, primeiroVencimento: '2026-09-02', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a249') }),
  contratoAvulso({ id: 'ct585', criadoEm: '2026-08-13T13:15:00', vendedorId: 'bruno', alunoId: 'a284', itens: [itemAvulso('zla', 'ta195')], parcelas: 2, primeiroVencimento: '2026-08-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a284') }),
  contratoAvulso({ id: 'ct614', criadoEm: '2026-08-13T13:30:00', vendedorId: 'ana', alunoId: 'a480', itens: [itemAvulso('i3d', 'ta193')], parcelas: 1, primeiroVencimento: '2026-09-02', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a480') }),
  contratoFormacao({ id: 'ct157', edicao: 'tx2a', formacaoId: 'tx2a', criadoEm: '2026-08-13T13:40:00', vendedorId: 'ana', alunoIds: ['a167'], preco: 2790, parcelas: 3, primeiroVencimento: '2026-08-25', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a167') }),
  contratoAvulso({ id: 'ct468', criadoEm: '2026-08-13T14:45:00', vendedorId: 'bruno', alunoId: 'a376', itens: [itemAvulso('exb', 'ta207')], parcelas: 2, primeiroVencimento: '2026-08-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a376') }),
  contratoAvulso({ id: 'ct440', criadoEm: '2026-08-13T15:00:00', vendedorId: 'ana', alunoId: 'a351', itens: [itemAvulso('ofs', 'ta205')], parcelas: 1, primeiroVencimento: '2026-08-23', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a351') }),
  contratoAvulso({ id: 'ct423', criadoEm: '2026-08-13T15:30:00', vendedorId: 'carla', alunoId: 'a274', itens: [itemAvulso('psb', 'ta175')], parcelas: 1, primeiroVencimento: '2026-08-27', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a274') }),
  contratoAvulso({ id: 'ct463', criadoEm: '2026-08-13T16:30:00', vendedorId: 'bruno', alunoId: 'a373', itens: [itemAvulso('iaf', 'ta191')], parcelas: 3, primeiroVencimento: '2026-08-29', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a373') }),
  contratoAvulso({ id: 'ct532', criadoEm: '2026-08-13T18:45:00', vendedorId: 'ana', alunoId: 'a383', itens: [itemAvulso('gla', 'ta209')], parcelas: 3, primeiroVencimento: '2026-08-23', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a383'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct462', criadoEm: '2026-08-14T10:00:00', vendedorId: 'bruno', alunoId: 'a295', itens: [itemAvulso('iaf', 'ta191')], parcelas: 2, primeiroVencimento: '2026-08-20', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a295'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct493', criadoEm: '2026-08-14T10:30:00', vendedorId: 'ana', alunoId: 'a14', itens: [itemAvulso('rjw', 'ta189')], parcelas: 2, primeiroVencimento: '2026-08-19', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a14') }),
  contratoAvulso({ id: 'ct467', criadoEm: '2026-08-14T12:00:00', vendedorId: 'carla', alunoId: 'a282', itens: [itemAvulso('exb', 'ta207')], parcelas: 1, primeiroVencimento: '2026-08-23', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a282') }),
  contratoAvulso({ id: 'ct464', criadoEm: '2026-08-14T13:30:00', vendedorId: 'carla', alunoId: 'a374', itens: [itemAvulso('iaf', 'ta191')], parcelas: 3, primeiroVencimento: '2026-08-24', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a374') }),
  contratoAvulso({ id: 'ct589', criadoEm: '2026-08-14T18:15:00', vendedorId: 'bruno', alunoId: 'a273', itens: [itemAvulso('ppv', 'ta197')], parcelas: 3, primeiroVencimento: '2026-08-20', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a273') }),
  contratoAvulso({ id: 'ct577', criadoEm: '2026-08-15T09:15:00', vendedorId: 'ana', alunoId: 'a24', itens: [itemAvulso('ad3', 'ta194')], parcelas: 1, primeiroVencimento: '2026-08-23', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a24') }),
  contratoAvulso({ id: 'ct480', criadoEm: '2026-08-15T12:00:00', vendedorId: 'carla', alunoId: 'a383', itens: [itemAvulso('exi', 'ta172')], parcelas: 2, primeiroVencimento: '2026-08-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a383'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct579', criadoEm: '2026-08-15T12:00:00', vendedorId: 'ana', alunoId: 'a251', itens: [itemAvulso('ad3', 'ta194')], parcelas: 3, primeiroVencimento: '2026-08-29', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a251'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct111', edicao: 'expb', formacaoId: 'expb', criadoEm: '2026-08-15T12:20:00', vendedorId: 'bruno', alunoIds: ['a120'], preco: 1690, fator: 0.9, parcelas: 4, primeiroVencimento: '2026-08-24', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a120') }),
  contratoAvulso({ id: 'ct452', criadoEm: '2026-08-15T13:00:00', vendedorId: 'carla', alunoId: 'a297', itens: [itemAvulso('swx', 'ta178')], parcelas: 2, primeiroVencimento: '2026-08-21', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a297'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct456', criadoEm: '2026-08-15T14:00:00', vendedorId: 'ana', alunoId: 'a358', itens: [itemAvulso('swx', 'ta178')], parcelas: 6, primeiroVencimento: '2026-08-26', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a358') }),
  contratoAvulso({ id: 'ct536', criadoEm: '2026-08-15T14:00:00', vendedorId: 'bruno', alunoId: 'a380', itens: [itemAvulso('smd', 'ta185')], parcelas: 1, primeiroVencimento: '2026-08-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a380') }),
  contratoAvulso({ id: 'ct533', criadoEm: '2026-08-15T15:00:00', vendedorId: 'carla', alunoId: 'a286', itens: [itemAvulso('gla', 'ta209')], parcelas: 3, primeiroVencimento: '2026-08-30', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a286'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct509', criadoEm: '2026-08-15T15:15:00', vendedorId: 'ana', alunoId: 'a334', itens: [itemAvulso('uxp', 'ta188')], parcelas: 4, primeiroVencimento: '2026-08-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a334') }),
  contratoAvulso({ id: 'ct539', criadoEm: '2026-08-15T17:15:00', vendedorId: 'ana', alunoId: 'a421', itens: [itemAvulso('smd', 'ta185')], parcelas: 1, primeiroVencimento: '2026-08-29', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a421') }),
  contratoAvulso({ id: 'ct475', criadoEm: '2026-08-16T09:15:00', vendedorId: 'bruno', alunoId: 'a379', itens: [itemAvulso('seo', 'ta183')], parcelas: 1, primeiroVencimento: '2026-08-28', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a379'), meio: 'fisica' }),
  contratoTurmas({ id: 'ct604', criadoEm: '2026-08-16T10:00:00', vendedorId: 'carla', empresaId: 'e11', alunoIds: ['a465', 'a466', 'a467', 'a468', 'a469', 'a470', 'a471', 'a472', 'a473', 'a474', 'a475', 'a476'], modelos: [itemAvulso('mby', 'ta237')], parcelas: 3, primeiroVencimento: '2026-09-05', forma: 'boleto', status: 'comercial_ok', assinadoPor: 'Camila Ferreira (Bunge)', pedidoCompra: 'PO-61883', descricao: 'Office & Google: Domine os Recursos Avançados da Nuvem · in company' }),
  contratoAvulso({ id: 'ct523', criadoEm: '2026-08-16T11:30:00', vendedorId: 'ana', alunoId: 'a415', itens: [itemAvulso('dmt', 'ta211')], parcelas: 3, primeiroVencimento: '2026-08-30', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a415') }),
  contratoAvulso({ id: 'ct586', criadoEm: '2026-08-16T15:45:00', vendedorId: 'bruno', alunoId: 'a441', itens: [itemAvulso('zla', 'ta195')], parcelas: 2, primeiroVencimento: '2026-08-21', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a441') }),
  contratoAvulso({ id: 'ct551', criadoEm: '2026-08-16T16:00:00', vendedorId: 'carla', alunoId: 'a426', itens: [itemAvulso('mti', 'ta212')], parcelas: 2, primeiroVencimento: '2026-08-30', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a426'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct486', criadoEm: '2026-08-17T09:30:00', vendedorId: 'bruno', alunoId: 'a386', itens: [itemAvulso('aub', 'ta179')], parcelas: 1, primeiroVencimento: '2026-08-30', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a386'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct547', criadoEm: '2026-08-17T09:30:00', vendedorId: 'bruno', alunoId: 'a270', itens: [itemAvulso('mti', 'ta212')], parcelas: 1, primeiroVencimento: '2026-08-29', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a270') }),
  contratoAvulso({ id: 'ct591', criadoEm: '2026-08-17T11:00:00', vendedorId: 'ana', alunoId: 'a443', itens: [itemAvulso('ppv', 'ta197')], parcelas: 1, primeiroVencimento: '2026-09-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a443'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct434', criadoEm: '2026-08-17T12:15:00', vendedorId: 'ana', alunoId: 'a348', itens: [itemAvulso('mti', 'ta180')], parcelas: 1, primeiroVencimento: '2026-08-24', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a348') }),
  contratoFormacao({ id: 'ct69', edicao: 'dg3c', formacaoId: 'dg3c', criadoEm: '2026-08-17T17:00:00', vendedorId: 'ana', alunoIds: ['a73'], preco: 2790, parcelas: 6, primeiroVencimento: '2026-09-01', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a73') }),
  contratoAvulso({ id: 'ct597', criadoEm: '2026-08-18T10:00:00', vendedorId: 'bruno', alunoId: 'a446', itens: [itemAvulso('pip', 'ta202')], parcelas: 2, primeiroVencimento: '2026-09-06', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a446') }),
  contratoAvulso({ id: 'ct571', criadoEm: '2026-08-18T16:15:00', vendedorId: 'carla', alunoId: 'a435', itens: [itemAvulso('afe', 'ta198')], parcelas: 1, primeiroVencimento: '2026-09-06', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a435') }),
  contratoAvulso({ id: 'ct489', criadoEm: '2026-08-19T10:30:00', vendedorId: 'ana', alunoId: 'a264', itens: [itemAvulso('od1', 'ta186'), itemAvulso('od2', 'ta187')], parcelas: 3, primeiroVencimento: '2026-09-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a264'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct490', criadoEm: '2026-08-19T13:30:00', vendedorId: 'ana', alunoId: 'a387', itens: [itemAvulso('od1', 'ta186')], parcelas: 3, primeiroVencimento: '2026-08-30', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a387'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct504', criadoEm: '2026-08-19T16:15:00', vendedorId: 'carla', alunoId: 'a393', itens: [itemAvulso('gda', 'ta184')], parcelas: 2, primeiroVencimento: '2026-08-29', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a393') }),
  contratoAvulso({ id: 'ct511', criadoEm: '2026-08-19T16:45:00', vendedorId: 'ana', alunoId: 'a396', itens: [itemAvulso('uxp', 'ta188')], parcelas: 4, primeiroVencimento: '2026-09-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a396') }),
  contratoAvulso({ id: 'ct500', criadoEm: '2026-08-19T17:30:00', vendedorId: 'ana', alunoId: 'a258', itens: [itemAvulso('gda', 'ta184')], parcelas: 1, primeiroVencimento: '2026-09-06', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a258') }),
  contratoAvulso({ id: 'ct574', criadoEm: '2026-08-20T09:00:00', vendedorId: 'carla', alunoId: 'a356', itens: [itemAvulso('rvt', 'ta201')], parcelas: 1, primeiroVencimento: '2026-09-03', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a356') }),
  contratoFormacao({ id: 'ct188', edicao: 'md1b', formacaoId: 'md1b', criadoEm: '2026-08-20T09:20:00', vendedorId: 'ana', alunoIds: ['a201'], preco: 4490, fator: 0.95, parcelas: 10, primeiroVencimento: '2026-08-30', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a201') }),
  contratoAvulso({ id: 'ct624', criadoEm: '2026-08-20T10:00:00', vendedorId: 'ana', alunoId: 'a256', itens: [itemAvulso('psa', 'ta176')], parcelas: 1, primeiroVencimento: '2026-09-01', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a256'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct562', criadoEm: '2026-08-20T11:00:00', vendedorId: 'ana', alunoId: 'a350', itens: [itemAvulso('ofs', 'ta182')], parcelas: 1, primeiroVencimento: '2026-08-28', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a350'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct618', criadoEm: '2026-08-20T12:00:00', vendedorId: 'ana', alunoId: 'a481', itens: [itemAvulso('c3d', 'ta200')], parcelas: 2, primeiroVencimento: '2026-08-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a481') }),
  contratoAvulso({ id: 'ct608', criadoEm: '2026-08-20T12:30:00', vendedorId: 'carla', alunoId: 'a477', itens: [itemAvulso('hta', 'ta213')], parcelas: 2, primeiroVencimento: '2026-09-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a477') }),
  contratoAvulso({ id: 'ct606', criadoEm: '2026-08-20T14:30:00', vendedorId: 'ana', alunoId: 'a26', itens: [itemAvulso('hta', 'ta213')], parcelas: 1, primeiroVencimento: '2026-08-31', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a26') }),
  contratoAvulso({ id: 'ct625', criadoEm: '2026-08-20T14:45:00', vendedorId: 'ana', alunoId: 'a343', itens: [itemAvulso('psa', 'ta176')], parcelas: 3, primeiroVencimento: '2026-09-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a343'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct599', criadoEm: '2026-08-21T13:15:00', vendedorId: 'bruno', alunoId: 'a414', itens: [itemAvulso('njw', 'ta190')], parcelas: 1, primeiroVencimento: '2026-09-08', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a414') }),
  contratoAvulso({ id: 'ct495', criadoEm: '2026-08-21T13:45:00', vendedorId: 'carla', alunoId: 'a377', itens: [itemAvulso('rjw', 'ta189')], parcelas: 1, primeiroVencimento: '', forma: 'pix', status: 'rascunho', assinadoPor: assinaAluno('a377') }),
  contratoAvulso({ id: 'ct617', criadoEm: '2026-08-21T17:15:00', vendedorId: 'ana', alunoId: 'a284', itens: [itemAvulso('c3d', 'ta200')], parcelas: 1, primeiroVencimento: '2026-08-27', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a284') }),
  contratoAvulso({ id: 'ct518', criadoEm: '2026-08-22T16:15:00', vendedorId: 'ana', alunoId: 'a400', itens: [itemAvulso('dmi', 'ta192'), itemAvulso('dmt', 'ta211')], parcelas: 1, primeiroVencimento: '2026-09-04', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a400') }),
  contratoAvulso({ id: 'ct485', criadoEm: '2026-08-22T16:30:00', vendedorId: 'ana', alunoId: 'a385', itens: [itemAvulso('aub', 'ta179')], parcelas: 2, primeiroVencimento: '2026-09-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a385') }),
  contratoAvulso({ id: 'ct576', criadoEm: '2026-08-22T18:00:00', vendedorId: 'ana', alunoId: 'a437', itens: [itemAvulso('rvt', 'ta201')], parcelas: 1, primeiroVencimento: '2026-08-31', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a437') }),
  contratoFormacao({ id: 'ct70', edicao: 'dg3c', formacaoId: 'dg3c', criadoEm: '2026-08-23T10:20:00', vendedorId: 'ana', alunoIds: ['a74'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-09-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a74') }),
  contratoFormacao({ id: 'ct74', edicao: 'dg3c', formacaoId: 'dg3c', criadoEm: '2026-08-23T10:20:00', vendedorId: 'bruno', alunoIds: ['a78'], preco: 2790, parcelas: 6, primeiroVencimento: '2026-09-17', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a78') }),
  contratoAvulso({ id: 'ct521', criadoEm: '2026-08-23T10:45:00', vendedorId: 'bruno', alunoId: 'a393', itens: [itemAvulso('dmt', 'ta211')], parcelas: 1, primeiroVencimento: '2026-08-31', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a393'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct526', criadoEm: '2026-08-23T11:45:00', vendedorId: 'ana', alunoId: 'a258', itens: [itemAvulso('ecs', 'ta181')], parcelas: 1, primeiroVencimento: '2026-09-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a258') }),
  contratoAvulso({ id: 'ct542', criadoEm: '2026-08-23T18:00:00', vendedorId: 'ana', alunoId: 'a252', itens: [itemAvulso('ill', 'ta204')], parcelas: 1, primeiroVencimento: '2026-09-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a252'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct580', criadoEm: '2026-08-23T18:30:00', vendedorId: 'ana', alunoId: 'a438', itens: [itemAvulso('ad3', 'ta194')], parcelas: 3, primeiroVencimento: '2026-08-30', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a438') }),
  contratoAvulso({ id: 'ct525', criadoEm: '2026-08-24T10:30:00', vendedorId: 'ana', alunoId: 'a353', itens: [itemAvulso('ecs', 'ta181')], parcelas: 1, primeiroVencimento: '', forma: 'boleto', status: 'rascunho', assinadoPor: assinaAluno('a353'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct189', edicao: 'md1b', formacaoId: 'md1b', criadoEm: '2026-08-24T12:00:00', vendedorId: 'ana', alunoIds: ['a202'], preco: 4490, fator: 0.9, parcelas: 12, primeiroVencimento: '2026-09-16', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a202') }),
  contratoAvulso({ id: 'ct494', criadoEm: '2026-08-24T12:00:00', vendedorId: 'carla', alunoId: 'a292', itens: [itemAvulso('rjw', 'ta189')], parcelas: 1, primeiroVencimento: '2026-09-03', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a292') }),
  contratoAvulso({ id: 'ct567', criadoEm: '2026-08-24T14:30:00', vendedorId: 'ana', alunoId: 'a394', itens: [itemAvulso('afe', 'ta198')], parcelas: 3, primeiroVencimento: '2026-09-03', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a394') }),
  contratoAvulso({ id: 'ct565', criadoEm: '2026-08-24T17:15:00', vendedorId: 'ana', alunoId: 'a432', itens: [itemAvulso('ofs', 'ta182')], parcelas: 1, primeiroVencimento: '2026-09-12', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a432'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct543', criadoEm: '2026-08-25T09:30:00', vendedorId: 'ana', alunoId: 'a214', itens: [itemAvulso('ill', 'ta204')], parcelas: 1, primeiroVencimento: '2026-09-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a214'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct594', criadoEm: '2026-08-25T11:30:00', vendedorId: 'ana', alunoId: 'a386', itens: [itemAvulso('pip', 'ta202')], parcelas: 1, primeiroVencimento: '2026-08-31', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a386') }),
  contratoAvulso({ id: 'ct517', criadoEm: '2026-08-25T14:00:00', vendedorId: 'carla', alunoId: 'a337', itens: [itemAvulso('dmi', 'ta192')], parcelas: 1, primeiroVencimento: '2026-09-04', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a337'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct558', criadoEm: '2026-08-25T15:00:00', vendedorId: 'carla', alunoId: 'a429', itens: [itemAvulso('iaf', 'ta210')], parcelas: 2, primeiroVencimento: '2026-09-03', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a429') }),
  contratoAvulso({ id: 'ct570', criadoEm: '2026-08-25T17:00:00', vendedorId: 'bruno', alunoId: 'a434', itens: [itemAvulso('afe', 'ta198')], parcelas: 1, primeiroVencimento: '2026-08-30', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a434') }),
  contratoAvulso({ id: 'ct623', criadoEm: '2026-08-26T14:30:00', vendedorId: 'bruno', alunoId: 'a484', itens: [itemAvulso('ila', 'ta174')], parcelas: 2, primeiroVencimento: '2026-09-11', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a484') }),
  contratoAvulso({ id: 'ct628', criadoEm: '2026-08-26T14:30:00', vendedorId: 'ana', alunoId: 'a486', itens: [itemAvulso('psa', 'ta176')], parcelas: 1, primeiroVencimento: '2026-09-13', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a486') }),
  contratoAvulso({ id: 'ct632', criadoEm: '2026-08-26T14:30:00', vendedorId: 'ana', alunoId: 'a487', itens: [itemAvulso('exd', 'ta217')], parcelas: 1, primeiroVencimento: '2026-09-08', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a487'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct572', criadoEm: '2026-08-26T18:30:00', vendedorId: 'carla', alunoId: 'a296', itens: [itemAvulso('rvt', 'ta201')], parcelas: 3, primeiroVencimento: '', forma: 'boleto', status: 'rascunho', assinadoPor: assinaAluno('a296') }),
  contratoAvulso({ id: 'ct538', criadoEm: '2026-08-27T15:45:00', vendedorId: 'bruno', alunoId: 'a260', itens: [itemAvulso('smd', 'ta185')], parcelas: 2, primeiroVencimento: '2026-09-14', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a260'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct642', criadoEm: '2026-08-27T16:15:00', vendedorId: 'ana', alunoId: 'a493', itens: [itemAvulso('trp', 'ta214')], parcelas: 1, primeiroVencimento: '2026-09-12', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a493'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct583', criadoEm: '2026-08-28T11:00:00', vendedorId: 'bruno', alunoId: 'a38', itens: [itemAvulso('zla', 'ta195')], parcelas: 2, primeiroVencimento: '2026-09-11', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a38') }),
  contratoAvulso({ id: 'ct584', criadoEm: '2026-08-28T11:30:00', vendedorId: 'carla', alunoId: 'a355', itens: [itemAvulso('zla', 'ta195')], parcelas: 2, primeiroVencimento: '2026-09-15', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a355') }),
  contratoAvulso({ id: 'ct566', criadoEm: '2026-08-28T16:30:00', vendedorId: 'bruno', alunoId: 'a433', itens: [itemAvulso('ofs', 'ta182')], parcelas: 3, primeiroVencimento: '2026-09-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a433'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct548', criadoEm: '2026-08-28T17:45:00', vendedorId: 'bruno', alunoId: 'a417', itens: [itemAvulso('mti', 'ta212')], parcelas: 3, primeiroVencimento: '2026-09-12', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a417'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct611', criadoEm: '2026-08-29T09:30:00', vendedorId: 'bruno', alunoId: 'a288', itens: [itemAvulso('i3d', 'ta193')], parcelas: 3, primeiroVencimento: '2026-09-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a288'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct550', criadoEm: '2026-08-29T16:15:00', vendedorId: 'ana', alunoId: 'a425', itens: [itemAvulso('mti', 'ta212')], parcelas: 1, primeiroVencimento: '2026-09-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a425'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct578', criadoEm: '2026-08-30T09:15:00', vendedorId: 'ana', alunoId: 'a44', itens: [itemAvulso('ad3', 'ta194')], parcelas: 2, primeiroVencimento: '2026-09-19', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a44') }),
  contratoFormacao({ id: 'ct72', edicao: 'dg3c', formacaoId: 'dg3c', criadoEm: '2026-08-30T12:20:00', vendedorId: 'bruno', alunoIds: ['a76'], preco: 2790, parcelas: 4, primeiroVencimento: '2026-09-07', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a76') }),
  contratoAvulso({ id: 'ct635', criadoEm: '2026-08-30T13:00:00', vendedorId: 'carla', alunoId: 'a436', itens: [itemAvulso('aua', 'ta223')], parcelas: 1, primeiroVencimento: '2026-09-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a436'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct616', criadoEm: '2026-08-31T11:45:00', vendedorId: 'bruno', alunoId: 'a445', itens: [itemAvulso('c3d', 'ta200')], parcelas: 1, primeiroVencimento: '2026-09-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a445'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct590', criadoEm: '2026-08-31T12:30:00', vendedorId: 'carla', alunoId: 'a212', itens: [itemAvulso('ppv', 'ta197')], parcelas: 2, primeiroVencimento: '', forma: 'boleto', status: 'rascunho', assinadoPor: assinaAluno('a212'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct546', criadoEm: '2026-08-31T14:30:00', vendedorId: 'ana', alunoId: 'a303', itens: [itemAvulso('mti', 'ta212')], parcelas: 1, primeiroVencimento: '2026-09-07', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a303'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct601', criadoEm: '2026-08-31T15:00:00', vendedorId: 'carla', alunoId: 'a287', itens: [itemAvulso('njw', 'ta190')], parcelas: 1, primeiroVencimento: '2026-09-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a287'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct564', criadoEm: '2026-08-31T16:00:00', vendedorId: 'ana', alunoId: 'a431', itens: [itemAvulso('ofs', 'ta182')], parcelas: 1, primeiroVencimento: '2026-09-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a431') }),
  contratoAvulso({ id: 'ct563', criadoEm: '2026-08-31T18:30:00', vendedorId: 'ana', alunoId: 'a418', itens: [itemAvulso('ofs', 'ta182')], parcelas: 3, primeiroVencimento: '2026-09-08', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a418'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct605', criadoEm: '2026-09-01T10:15:00', vendedorId: 'bruno', alunoId: 'a29', itens: [itemAvulso('hta', 'ta213')], parcelas: 1, primeiroVencimento: '2026-09-06', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a29'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct645', criadoEm: '2026-09-01T10:15:00', vendedorId: 'carla', alunoId: 'a425', itens: [itemAvulso('clp', 'ta216')], parcelas: 3, primeiroVencimento: '2026-09-12', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a425'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct545', criadoEm: '2026-09-01T11:30:00', vendedorId: 'bruno', alunoId: 'a424', itens: [itemAvulso('ill', 'ta204')], parcelas: 3, primeiroVencimento: '2026-09-18', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a424') }),
  contratoAvulso({ id: 'ct646', criadoEm: '2026-09-01T11:45:00', vendedorId: 'carla', alunoId: 'a235', itens: [itemAvulso('clp', 'ta216')], parcelas: 2, primeiroVencimento: '2026-09-14', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a235'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct573', criadoEm: '2026-09-01T12:00:00', vendedorId: 'carla', alunoId: 'a243', itens: [itemAvulso('rvt', 'ta201'), itemAvulso('rvf', 'ta225')], parcelas: 1, primeiroVencimento: '2026-09-20', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a243'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct612', criadoEm: '2026-09-01T12:00:00', vendedorId: 'carla', alunoId: 'a355', itens: [itemAvulso('i3d', 'ta193')], parcelas: 2, primeiroVencimento: '2026-09-09', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a355'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct73', edicao: 'dg3c', formacaoId: 'dg3c', criadoEm: '2026-09-01T17:00:00', vendedorId: 'ana', alunoIds: ['a77'], preco: 2790, parcelas: 6, primeiroVencimento: '2026-09-19', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a77') }),
  contratoAvulso({ id: 'ct592', criadoEm: '2026-09-02T09:00:00', vendedorId: 'ana', alunoId: 'a444', itens: [itemAvulso('ppv', 'ta197')], parcelas: 2, primeiroVencimento: '2026-09-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a444'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct610', criadoEm: '2026-09-02T11:00:00', vendedorId: 'ana', alunoId: 'a383', itens: [itemAvulso('i3d', 'ta193')], parcelas: 1, primeiroVencimento: '2026-09-17', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a383') }),
  contratoAvulso({ id: 'ct549', criadoEm: '2026-09-02T14:45:00', vendedorId: 'bruno', alunoId: 'a348', itens: [itemAvulso('mti', 'ta212')], parcelas: 1, primeiroVencimento: '2026-09-08', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a348'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct190', edicao: 'md1b', formacaoId: 'md1b', criadoEm: '2026-09-02T17:40:00', vendedorId: 'bruno', alunoIds: ['a203'], preco: 4490, parcelas: 12, primeiroVencimento: '2026-09-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a203') }),
  contratoAvulso({ id: 'ct575', criadoEm: '2026-09-03T13:00:00', vendedorId: 'bruno', alunoId: 'a436', itens: [itemAvulso('rvt', 'ta201')], parcelas: 2, primeiroVencimento: '2026-09-11', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a436'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct615', criadoEm: '2026-09-03T13:30:00', vendedorId: 'carla', alunoId: 'a384', itens: [itemAvulso('c3d', 'ta200')], parcelas: 3, primeiroVencimento: '2026-09-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a384') }),
  contratoAvulso({ id: 'ct619', criadoEm: '2026-09-04T09:00:00', vendedorId: 'ana', alunoId: 'a482', itens: [itemAvulso('c3d', 'ta200')], parcelas: 1, primeiroVencimento: '2026-09-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a482') }),
  contratoAvulso({ id: 'ct555', criadoEm: '2026-09-04T15:00:00', vendedorId: 'ana', alunoId: 'a422', itens: [itemAvulso('iaf', 'ta210')], parcelas: 3, primeiroVencimento: '2026-09-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a422'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct588', criadoEm: '2026-09-04T15:00:00', vendedorId: 'ana', alunoId: 'a248', itens: [itemAvulso('ppv', 'ta197')], parcelas: 1, primeiroVencimento: '2026-09-18', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a248') }),
  contratoAvulso({ id: 'ct620', criadoEm: '2026-09-04T16:00:00', vendedorId: 'bruno', alunoId: 'a303', itens: [itemAvulso('ila', 'ta174')], parcelas: 1, primeiroVencimento: '2026-09-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a303') }),
  contratoAvulso({ id: 'ct569', criadoEm: '2026-09-04T17:45:00', vendedorId: 'ana', alunoId: 'a212', itens: [itemAvulso('afe', 'ta198')], parcelas: 2, primeiroVencimento: '2026-09-21', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a212') }),
  contratoAvulso({ id: 'ct639', criadoEm: '2026-09-04T18:00:00', vendedorId: 'carla', alunoId: 'a258', itens: [itemAvulso('trp', 'ta214')], parcelas: 1, primeiroVencimento: '', forma: 'pix', status: 'rascunho', assinadoPor: assinaAluno('a258') }),
  contratoAvulso({ id: 'ct656', criadoEm: '2026-09-04T18:00:00', vendedorId: 'bruno', alunoId: 'a236', itens: [itemAvulso('pbi', 'ta170')], parcelas: 2, primeiroVencimento: '2026-09-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a236'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct191', edicao: 'md1b', formacaoId: 'md1b', criadoEm: '2026-09-05T11:00:00', vendedorId: 'ana', alunoIds: ['a204'], preco: 4490, fator: 0.95, parcelas: 10, primeiroVencimento: '2026-09-25', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a204') }),
  contratoAvulso({ id: 'ct568', criadoEm: '2026-09-05T14:15:00', vendedorId: 'bruno', alunoId: 'a338', itens: [itemAvulso('afe', 'ta198')], parcelas: 1, primeiroVencimento: '2026-09-16', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a338') }),
  contratoAvulso({ id: 'ct630', criadoEm: '2026-09-06T10:15:00', vendedorId: 'ana', alunoId: 'a262', itens: [itemAvulso('exd', 'ta217')], parcelas: 3, primeiroVencimento: '2026-09-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a262'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct647', criadoEm: '2026-09-06T12:45:00', vendedorId: 'carla', alunoId: 'a494', itens: [itemAvulso('clp', 'ta216')], parcelas: 1, primeiroVencimento: '2026-09-12', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a494') }),
  contratoAvulso({ id: 'ct650', criadoEm: '2026-09-06T15:30:00', vendedorId: 'ana', alunoId: 'a290', itens: [itemAvulso('idb', 'ta220')], parcelas: 1, primeiroVencimento: '2026-09-20', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a290') }),
  contratoAvulso({ id: 'ct603', criadoEm: '2026-09-06T16:30:00', vendedorId: 'bruno', alunoId: 'a464', itens: [itemAvulso('njw', 'ta190')], parcelas: 1, primeiroVencimento: '2026-09-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a464') }),
  contratoAvulso({ id: 'ct582', criadoEm: '2026-09-07T15:00:00', vendedorId: 'carla', alunoId: 'a440', itens: [itemAvulso('ad3', 'ta194'), itemAvulso('ad1', 'ta232')], parcelas: 2, primeiroVencimento: '2026-09-16', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a440') }),
  contratoAvulso({ id: 'ct653', criadoEm: '2026-09-07T18:30:00', vendedorId: 'ana', alunoId: 'a497', itens: [itemAvulso('idb', 'ta220')], parcelas: 3, primeiroVencimento: '2026-09-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a497'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct600', criadoEm: '2026-09-08T15:15:00', vendedorId: 'carla', alunoId: 'a438', itens: [itemAvulso('njw', 'ta190')], parcelas: 3, primeiroVencimento: '2026-09-18', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a438'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct649', criadoEm: '2026-09-08T16:00:00', vendedorId: 'carla', alunoId: 'a496', itens: [itemAvulso('clp', 'ta216')], parcelas: 1, primeiroVencimento: '2026-09-23', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a496') }),
  contratoAvulso({ id: 'ct602', criadoEm: '2026-09-08T17:15:00', vendedorId: 'ana', alunoId: 'a463', itens: [itemAvulso('njw', 'ta190')], parcelas: 1, primeiroVencimento: '2026-09-17', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a463'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct675', criadoEm: '2026-09-09T10:30:00', vendedorId: 'ana', alunoId: 'a506', itens: [itemAvulso('ex1', 'ta218')], parcelas: 1, primeiroVencimento: '2026-09-27', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a506') }),
  contratoAvulso({ id: 'ct607', criadoEm: '2026-09-09T12:45:00', vendedorId: 'bruno', alunoId: 'a348', itens: [itemAvulso('hta', 'ta213')], parcelas: 3, primeiroVencimento: '2026-09-14', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a348') }),
  contratoAvulso({ id: 'ct673', criadoEm: '2026-09-09T13:45:00', vendedorId: 'ana', alunoId: 'a341', itens: [itemAvulso('ex1', 'ta218')], parcelas: 3, primeiroVencimento: '2026-09-19', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a341'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct641', criadoEm: '2026-09-09T17:00:00', vendedorId: 'ana', alunoId: 'a492', itens: [itemAvulso('trp', 'ta214')], parcelas: 3, primeiroVencimento: '2026-09-21', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a492') }),
  contratoAvulso({ id: 'ct609', criadoEm: '2026-09-09T17:30:00', vendedorId: 'ana', alunoId: 'a478', itens: [itemAvulso('hta', 'ta213')], parcelas: 1, primeiroVencimento: '2026-09-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a478'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct637', criadoEm: '2026-09-10T17:00:00', vendedorId: 'ana', alunoId: 'a490', itens: [itemAvulso('aua', 'ta223')], parcelas: 1, primeiroVencimento: '2026-09-27', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a490') }),
  contratoAvulso({ id: 'ct651', criadoEm: '2026-09-10T17:30:00', vendedorId: 'bruno', alunoId: 'a337', itens: [itemAvulso('idb', 'ta220')], parcelas: 1, primeiroVencimento: '2026-09-21', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a337') }),
  contratoAvulso({ id: 'ct644', criadoEm: '2026-09-11T10:15:00', vendedorId: 'carla', alunoId: 'a354', itens: [itemAvulso('clp', 'ta216')], parcelas: 1, primeiroVencimento: '', forma: 'cartao', status: 'rascunho', assinadoPor: assinaAluno('a354'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct71', edicao: 'dg3c', formacaoId: 'dg3c', criadoEm: '2026-09-11T10:40:00', vendedorId: 'ana', alunoIds: ['a75'], preco: 2790, fator: 0.95, parcelas: 3, primeiroVencimento: '2026-10-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a75') }),
  contratoAvulso({ id: 'ct613', criadoEm: '2026-09-12T14:30:00', vendedorId: 'bruno', alunoId: 'a479', itens: [itemAvulso('i3d', 'ta193')], parcelas: 1, primeiroVencimento: '2026-10-02', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a479') }),
  contratoAvulso({ id: 'ct688', criadoEm: '2026-09-13T12:00:00', vendedorId: 'carla', alunoId: 'a512', itens: [itemAvulso('pbi', 'ta226')], parcelas: 2, primeiroVencimento: '2026-09-25', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a512'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct660', criadoEm: '2026-09-13T16:00:00', vendedorId: 'ana', alunoId: 'a500', itens: [itemAvulso('pbi', 'ta170')], parcelas: 3, primeiroVencimento: '2026-10-01', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a500') }),
  contratoAvulso({ id: 'ct627', criadoEm: '2026-09-13T18:30:00', vendedorId: 'bruno', alunoId: 'a485', itens: [itemAvulso('psa', 'ta176')], parcelas: 1, primeiroVencimento: '2026-09-19', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a485'), meio: 'fisica' }),
  contratoFormacao({ id: 'ct192', edicao: 'md1b', formacaoId: 'md1b', criadoEm: '2026-09-14T09:40:00', vendedorId: 'ana', alunoIds: ['a205'], preco: 4490, parcelas: 6, primeiroVencimento: '2026-09-27', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a205') }),
  contratoAvulso({ id: 'ct622', criadoEm: '2026-09-14T09:45:00', vendedorId: 'ana', alunoId: 'a483', itens: [itemAvulso('ila', 'ta174')], parcelas: 2, primeiroVencimento: '2026-09-19', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a483'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct679', criadoEm: '2026-09-14T15:00:00', vendedorId: 'carla', alunoId: 'a301', itens: [itemAvulso('afp', 'ta222')], parcelas: 2, primeiroVencimento: '2026-09-27', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a301'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct667', criadoEm: '2026-09-15T10:15:00', vendedorId: 'carla', alunoId: 'a436', itens: [itemAvulso('swp', 'ta224')], parcelas: 4, primeiroVencimento: '2026-09-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a436') }),
  contratoAvulso({ id: 'ct659', criadoEm: '2026-09-15T14:30:00', vendedorId: 'bruno', alunoId: 'a499', itens: [itemAvulso('pbi', 'ta170')], parcelas: 4, primeiroVencimento: '2026-09-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a499'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct654', criadoEm: '2026-09-15T15:15:00', vendedorId: 'ana', alunoId: 'a498', itens: [itemAvulso('idb', 'ta220'), itemAvulso('ida', 'ta221')], parcelas: 1, primeiroVencimento: '2026-09-20', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a498') }),
  contratoAvulso({ id: 'ct664', criadoEm: '2026-09-17T12:30:00', vendedorId: 'ana', alunoId: 'a300', itens: [itemAvulso('gla', 'ta215')], parcelas: 2, primeiroVencimento: '2026-10-01', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a300') }),
  contratoAvulso({ id: 'ct678', criadoEm: '2026-09-17T14:30:00', vendedorId: 'carla', alunoId: 'a338', itens: [itemAvulso('afp', 'ta222')], parcelas: 1, primeiroVencimento: '2026-09-27', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a338'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct621', criadoEm: '2026-09-17T15:00:00', vendedorId: 'bruno', alunoId: 'a343', itens: [itemAvulso('ila', 'ta174')], parcelas: 1, primeiroVencimento: '2026-10-04', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a343') }),
  contratoAvulso({ id: 'ct670', criadoEm: '2026-09-17T15:45:00', vendedorId: 'ana', alunoId: 'a504', itens: [itemAvulso('swp', 'ta224')], parcelas: 6, primeiroVencimento: '2026-09-28', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a504') }),
  contratoAvulso({ id: 'ct640', criadoEm: '2026-09-17T17:15:00', vendedorId: 'carla', alunoId: 'a491', itens: [itemAvulso('trp', 'ta214')], parcelas: 1, primeiroVencimento: '2026-10-06', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a491'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct690', criadoEm: '2026-09-18T14:00:00', vendedorId: 'ana', alunoId: 'a49', itens: [itemAvulso('oca', 'ta229')], parcelas: 1, primeiroVencimento: '2026-10-01', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a49') }),
  contratoAvulso({ id: 'ct687', criadoEm: '2026-09-18T16:45:00', vendedorId: 'ana', alunoId: 'a511', itens: [itemAvulso('pbi', 'ta226')], parcelas: 4, primeiroVencimento: '2026-09-29', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a511') }),
  contratoAvulso({ id: 'ct693', criadoEm: '2026-09-19T09:15:00', vendedorId: 'ana', alunoId: 'a514', itens: [itemAvulso('oca', 'ta229')], parcelas: 1, primeiroVencimento: '2026-09-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a514'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct662', criadoEm: '2026-09-19T18:00:00', vendedorId: 'bruno', alunoId: 'a395', itens: [itemAvulso('gla', 'ta215')], parcelas: 1, primeiroVencimento: '2026-09-25', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a395') }),
  contratoAvulso({ id: 'ct668', criadoEm: '2026-09-20T10:45:00', vendedorId: 'ana', alunoId: 'a253', itens: [itemAvulso('swp', 'ta224')], parcelas: 3, primeiroVencimento: '2026-10-07', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a253') }),
  contratoAvulso({ id: 'ct626', criadoEm: '2026-09-21T09:45:00', vendedorId: 'ana', alunoId: 'a387', itens: [itemAvulso('psa', 'ta176')], parcelas: 2, primeiroVencimento: '2026-09-29', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a387'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct661', criadoEm: '2026-09-21T14:00:00', vendedorId: 'bruno', alunoId: 'a501', itens: [itemAvulso('pbi', 'ta170')], parcelas: 2, primeiroVencimento: '2026-10-02', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a501') }),
  contratoAvulso({ id: 'ct652', criadoEm: '2026-09-21T17:15:00', vendedorId: 'ana', alunoId: 'a241', itens: [itemAvulso('idb', 'ta220')], parcelas: 1, primeiroVencimento: '2026-10-04', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a241'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct698', criadoEm: '2026-09-23T09:30:00', vendedorId: 'carla', alunoId: 'a255', itens: [itemAvulso('dmd', 'ta228')], parcelas: 3, primeiroVencimento: '2026-10-10', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a255') }),
  contratoAvulso({ id: 'ct636', criadoEm: '2026-09-23T12:15:00', vendedorId: 'ana', alunoId: 'a489', itens: [itemAvulso('aua', 'ta223')], parcelas: 2, primeiroVencimento: '2026-10-02', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a489') }),
  contratoAvulso({ id: 'ct702', criadoEm: '2026-09-23T12:30:00', vendedorId: 'ana', alunoId: 'a532', itens: [itemAvulso('dmd', 'ta228')], parcelas: 2, primeiroVencimento: '2026-10-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a532') }),
  contratoAvulso({ id: 'ct634', criadoEm: '2026-09-23T13:15:00', vendedorId: 'bruno', alunoId: 'a384', itens: [itemAvulso('aua', 'ta223')], parcelas: 3, primeiroVencimento: '2026-10-09', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a384') }),
  contratoAvulso({ id: 'ct695', criadoEm: '2026-09-24T09:30:00', vendedorId: 'bruno', alunoId: 'a28', itens: [itemAvulso('od2', 'ta187')], parcelas: 1, primeiroVencimento: '2026-10-13', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a28') }),
  contratoAvulso({ id: 'ct708', criadoEm: '2026-09-24T17:00:00', vendedorId: 'ana', alunoId: 'a290', itens: [itemAvulso('ida', 'ta221')], parcelas: 1, primeiroVencimento: '2026-10-12', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a290'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct657', criadoEm: '2026-09-24T17:30:00', vendedorId: 'ana', alunoId: 'a488', itens: [itemAvulso('pbi', 'ta170')], parcelas: 3, primeiroVencimento: '2026-10-02', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a488'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct676', criadoEm: '2026-09-25T10:00:00', vendedorId: 'ana', alunoId: 'a507', itens: [itemAvulso('ex1', 'ta218')], parcelas: 3, primeiroVencimento: '2026-10-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a507'), meio: 'fisica' }),
  contratoTurmas({ id: 'ct694', criadoEm: '2026-09-25T10:00:00', vendedorId: 'carla', empresaId: 'e8', alunoIds: ['a515', 'a516', 'a517', 'a518', 'a519', 'a520', 'a521', 'a522', 'a523', 'a524', 'a525', 'a526', 'a527', 'a528', 'a529'], modelos: [itemAvulso('mti', 'ta239')], parcelas: 3, primeiroVencimento: '2026-10-15', forma: 'boleto', status: 'adm_ok', assinadoPor: 'Rodrigo Stolf (Altenburg)', pedidoCompra: '', descricao: 'Metodologias Ágeis: Fundamentos e Aplicação Prática · in company' }),
  contratoAvulso({ id: 'ct704', criadoEm: '2026-09-25T10:15:00', vendedorId: 'bruno', alunoId: 'a257', itens: [itemAvulso('tif', 'ta199')], parcelas: 1, primeiroVencimento: '2026-10-07', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a257'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct689', criadoEm: '2026-09-25T15:15:00', vendedorId: 'carla', alunoId: 'a40', itens: [itemAvulso('oca', 'ta229')], parcelas: 3, primeiroVencimento: '2026-10-02', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a40'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct696', criadoEm: '2026-09-26T14:00:00', vendedorId: 'ana', alunoId: 'a5', itens: [itemAvulso('od2', 'ta187')], parcelas: 2, primeiroVencimento: '2026-10-15', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a5'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct629', criadoEm: '2026-09-26T14:15:00', vendedorId: 'carla', alunoId: 'a373', itens: [itemAvulso('exd', 'ta217')], parcelas: 3, primeiroVencimento: '2026-10-11', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a373'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct631', criadoEm: '2026-09-26T14:30:00', vendedorId: 'ana', alunoId: 'a240', itens: [itemAvulso('exd', 'ta217')], parcelas: 3, primeiroVencimento: '', forma: 'boleto', status: 'rascunho', assinadoPor: assinaAluno('a240'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct674', criadoEm: '2026-09-26T17:15:00', vendedorId: 'bruno', alunoId: 'a294', itens: [itemAvulso('ex1', 'ta218')], parcelas: 1, primeiroVencimento: '2026-10-04', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a294') }),
  contratoAvulso({ id: 'ct643', criadoEm: '2026-09-27T10:45:00', vendedorId: 'ana', alunoId: 'a417', itens: [itemAvulso('clp', 'ta216')], parcelas: 1, primeiroVencimento: '2026-10-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a417') }),
  contratoAvulso({ id: 'ct638', criadoEm: '2026-09-28T11:30:00', vendedorId: 'ana', alunoId: 'a295', itens: [itemAvulso('trp', 'ta214')], parcelas: 1, primeiroVencimento: '2026-10-07', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a295'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct663', criadoEm: '2026-09-28T11:30:00', vendedorId: 'ana', alunoId: 'a260', itens: [itemAvulso('gla', 'ta215')], parcelas: 2, primeiroVencimento: '2026-10-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a260'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct648', criadoEm: '2026-09-28T13:00:00', vendedorId: 'carla', alunoId: 'a495', itens: [itemAvulso('clp', 'ta216')], parcelas: 3, primeiroVencimento: '2026-10-03', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a495'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct633', criadoEm: '2026-09-28T16:00:00', vendedorId: 'ana', alunoId: 'a488', itens: [itemAvulso('exd', 'ta217')], parcelas: 3, primeiroVencimento: '', forma: 'cartao', status: 'rascunho', assinadoPor: assinaAluno('a488'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct706', criadoEm: '2026-09-29T18:30:00', vendedorId: 'ana', alunoId: 'a533', itens: [itemAvulso('tif', 'ta199')], parcelas: 1, primeiroVencimento: '2026-10-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a533'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct692', criadoEm: '2026-09-30T11:30:00', vendedorId: 'bruno', alunoId: 'a513', itens: [itemAvulso('oca', 'ta229')], parcelas: 2, primeiroVencimento: '2026-10-07', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a513') }),
  contratoAvulso({ id: 'ct714', criadoEm: '2026-10-01T13:30:00', vendedorId: 'bruno', alunoId: 'a537', itens: [itemAvulso('ad1', 'ta232')], parcelas: 1, primeiroVencimento: '2026-10-18', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a537'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct671', criadoEm: '2026-10-02T12:30:00', vendedorId: 'bruno', alunoId: 'a505', itens: [itemAvulso('swp', 'ta224')], parcelas: 6, primeiroVencimento: '2026-10-09', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a505') }),
  contratoAvulso({ id: 'ct666', criadoEm: '2026-10-02T12:45:00', vendedorId: 'bruno', alunoId: 'a503', itens: [itemAvulso('gla', 'ta215')], parcelas: 1, primeiroVencimento: '2026-10-13', forma: 'cartao', status: 'comercial_ok', assinadoPor: assinaAluno('a503'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct665', criadoEm: '2026-10-02T18:45:00', vendedorId: 'ana', alunoId: 'a502', itens: [itemAvulso('gla', 'ta215')], parcelas: 1, primeiroVencimento: '2026-10-20', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a502'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct700', criadoEm: '2026-10-03T14:30:00', vendedorId: 'ana', alunoId: 'a238', itens: [itemAvulso('dmd', 'ta228')], parcelas: 2, primeiroVencimento: '2026-10-11', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a238'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct691', criadoEm: '2026-10-04T09:00:00', vendedorId: 'ana', alunoId: 'a340', itens: [itemAvulso('oca', 'ta229')], parcelas: 1, primeiroVencimento: '2026-10-15', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a340') }),
  contratoAvulso({ id: 'ct684', criadoEm: '2026-10-05T13:15:00', vendedorId: 'bruno', alunoId: 'a441', itens: [itemAvulso('pbi', 'ta226')], parcelas: 3, primeiroVencimento: '2026-10-18', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a441'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct711', criadoEm: '2026-10-05T14:45:00', vendedorId: 'bruno', alunoId: 'a536', itens: [itemAvulso('ida', 'ta221')], parcelas: 2, primeiroVencimento: '2026-10-10', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a536'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct713', criadoEm: '2026-10-05T17:45:00', vendedorId: 'ana', alunoId: 'a273', itens: [itemAvulso('ad1', 'ta232')], parcelas: 1, primeiroVencimento: '2026-10-22', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a273'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct658', criadoEm: '2026-10-06T10:45:00', vendedorId: 'bruno', alunoId: 'a222', itens: [itemAvulso('pbi', 'ta170')], parcelas: 4, primeiroVencimento: '2026-10-13', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a222') }),
  contratoAvulso({ id: 'ct655', criadoEm: '2026-10-06T11:00:00', vendedorId: 'carla', alunoId: 'a278', itens: [itemAvulso('pbi', 'ta170')], parcelas: 4, primeiroVencimento: '2026-10-12', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a278') }),
  contratoAvulso({ id: 'ct685', criadoEm: '2026-10-06T13:30:00', vendedorId: 'ana', alunoId: 'a340', itens: [itemAvulso('pbi', 'ta226')], parcelas: 2, primeiroVencimento: '2026-10-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a340') }),
  contratoAvulso({ id: 'ct699', criadoEm: '2026-10-07T17:30:00', vendedorId: 'ana', alunoId: 'a271', itens: [itemAvulso('dmd', 'ta228')], parcelas: 1, primeiroVencimento: '2026-10-24', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a271') }),
  contratoAvulso({ id: 'ct677', criadoEm: '2026-10-08T16:45:00', vendedorId: 'bruno', alunoId: 'a435', itens: [itemAvulso('afp', 'ta222')], parcelas: 1, primeiroVencimento: '2026-10-23', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a435') }),
  contratoAvulso({ id: 'ct681', criadoEm: '2026-10-09T09:30:00', vendedorId: 'ana', alunoId: 'a509', itens: [itemAvulso('afp', 'ta222')], parcelas: 2, primeiroVencimento: '2026-10-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a509') }),
  contratoAvulso({ id: 'ct716', criadoEm: '2026-10-09T10:30:00', vendedorId: 'ana', alunoId: 'a415', itens: [itemAvulso('cgc', 'ta227')], parcelas: 1, primeiroVencimento: '2026-10-26', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a415'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct680', criadoEm: '2026-10-09T15:30:00', vendedorId: 'ana', alunoId: 'a508', itens: [itemAvulso('afp', 'ta222')], parcelas: 3, primeiroVencimento: '2026-10-22', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a508'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct683', criadoEm: '2026-10-09T15:30:00', vendedorId: 'bruno', alunoId: 'a346', itens: [itemAvulso('pbi', 'ta226')], parcelas: 6, primeiroVencimento: '2026-10-17', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a346') }),
  contratoAvulso({ id: 'ct669', criadoEm: '2026-10-10T11:15:00', vendedorId: 'bruno', alunoId: 'a444', itens: [itemAvulso('swp', 'ta224')], parcelas: 4, primeiroVencimento: '2026-10-17', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a444') }),
  contratoAvulso({ id: 'ct709', criadoEm: '2026-10-10T13:00:00', vendedorId: 'ana', alunoId: 'a435', itens: [itemAvulso('ida', 'ta221')], parcelas: 3, primeiroVencimento: '2026-10-24', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a435'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct703', criadoEm: '2026-10-10T13:15:00', vendedorId: 'ana', alunoId: 'a212', itens: [itemAvulso('tif', 'ta199')], parcelas: 3, primeiroVencimento: '2026-10-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a212') }),
  contratoAvulso({ id: 'ct672', criadoEm: '2026-10-10T17:15:00', vendedorId: 'carla', alunoId: 'a278', itens: [itemAvulso('ex1', 'ta218')], parcelas: 1, primeiroVencimento: '', forma: 'pix', status: 'rascunho', assinadoPor: assinaAluno('a278') }),
  contratoAvulso({ id: 'ct682', criadoEm: '2026-10-10T18:15:00', vendedorId: 'carla', alunoId: 'a376', itens: [itemAvulso('pbi', 'ta226')], parcelas: 4, primeiroVencimento: '2026-10-22', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a376') }),
  contratoAvulso({ id: 'ct712', criadoEm: '2026-10-11T12:45:00', vendedorId: 'ana', alunoId: 'a282', itens: [itemAvulso('ad1', 'ta232')], parcelas: 3, primeiroVencimento: '2026-10-23', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a282') }),
  contratoAvulso({ id: 'ct686', criadoEm: '2026-10-11T17:15:00', vendedorId: 'bruno', alunoId: 'a510', itens: [itemAvulso('pbi', 'ta226')], parcelas: 6, primeiroVencimento: '2026-10-17', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a510'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct697', criadoEm: '2026-10-14T09:30:00', vendedorId: 'ana', alunoId: 'a530', itens: [itemAvulso('od2', 'ta187')], parcelas: 2, primeiroVencimento: '2026-10-30', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a530') }),
  contratoAvulso({ id: 'ct710', criadoEm: '2026-10-14T16:00:00', vendedorId: 'bruno', alunoId: 'a535', itens: [itemAvulso('ida', 'ta221')], parcelas: 2, primeiroVencimento: '2026-10-21', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a535'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct721', criadoEm: '2026-10-15T09:30:00', vendedorId: 'bruno', alunoId: 'a436', itens: [itemAvulso('rvf', 'ta225')], parcelas: 3, primeiroVencimento: '2026-10-30', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a436'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct729', criadoEm: '2026-10-15T11:45:00', vendedorId: 'ana', alunoId: 'a544', itens: [itemAvulso('jsf', 'ta196')], parcelas: 3, primeiroVencimento: '2026-10-31', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a544') }),
  contratoAvulso({ id: 'ct736', criadoEm: '2026-10-17T17:30:00', vendedorId: 'bruno', alunoId: 'a548', itens: [itemAvulso('mby', 'ta219')], parcelas: 2, primeiroVencimento: '2026-11-03', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a548'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct720', criadoEm: '2026-10-18T17:00:00', vendedorId: 'ana', alunoId: 'a540', itens: [itemAvulso('cgc', 'ta227')], parcelas: 3, primeiroVencimento: '2026-10-29', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a540'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct705', criadoEm: '2026-10-19T09:15:00', vendedorId: 'carla', alunoId: 'a485', itens: [itemAvulso('tif', 'ta199')], parcelas: 3, primeiroVencimento: '', forma: 'boleto', status: 'rascunho', assinadoPor: assinaAluno('a485') }),
  contratoAvulso({ id: 'ct701', criadoEm: '2026-10-19T16:45:00', vendedorId: 'ana', alunoId: 'a531', itens: [itemAvulso('dmd', 'ta228')], parcelas: 1, primeiroVencimento: '2026-10-27', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a531') }),
  contratoAvulso({ id: 'ct734', criadoEm: '2026-10-19T17:15:00', vendedorId: 'ana', alunoId: 'a546', itens: [itemAvulso('mby', 'ta219')], parcelas: 3, primeiroVencimento: '2026-10-30', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a546') }),
  contratoAvulso({ id: 'ct732', criadoEm: '2026-10-20T12:45:00', vendedorId: 'carla', alunoId: 'a506', itens: [itemAvulso('mby', 'ta219')], parcelas: 4, primeiroVencimento: '2026-10-29', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a506'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct724', criadoEm: '2026-10-20T14:00:00', vendedorId: 'ana', alunoId: 'a542', itens: [itemAvulso('rvf', 'ta225')], parcelas: 2, primeiroVencimento: '2026-11-03', forma: 'boleto', status: 'aguardando', assinadoPor: assinaAluno('a542') }),
  contratoAvulso({ id: 'ct718', criadoEm: '2026-10-20T15:00:00', vendedorId: 'carla', alunoId: 'a348', itens: [itemAvulso('cgc', 'ta227')], parcelas: 3, primeiroVencimento: '2026-11-05', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a348') }),
  contratoAvulso({ id: 'ct707', criadoEm: '2026-10-21T10:30:00', vendedorId: 'carla', alunoId: 'a534', itens: [itemAvulso('tif', 'ta199')], parcelas: 2, primeiroVencimento: '2026-10-26', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a534'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct735', criadoEm: '2026-10-22T14:45:00', vendedorId: 'ana', alunoId: 'a547', itens: [itemAvulso('mby', 'ta219')], parcelas: 3, primeiroVencimento: '2026-11-10', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a547'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct731', criadoEm: '2026-10-23T13:30:00', vendedorId: 'carla', alunoId: 'a383', itens: [itemAvulso('mby', 'ta219')], parcelas: 2, primeiroVencimento: '2026-11-10', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a383') }),
  contratoAvulso({ id: 'ct715', criadoEm: '2026-10-23T18:00:00', vendedorId: 'ana', alunoId: 'a538', itens: [itemAvulso('ad1', 'ta232')], parcelas: 1, primeiroVencimento: '2026-11-05', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a538') }),
  contratoAvulso({ id: 'ct719', criadoEm: '2026-10-23T18:45:00', vendedorId: 'ana', alunoId: 'a539', itens: [itemAvulso('cgc', 'ta227')], parcelas: 1, primeiroVencimento: '2026-11-03', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a539') }),
  contratoAvulso({ id: 'ct722', criadoEm: '2026-10-27T12:45:00', vendedorId: 'ana', alunoId: 'a441', itens: [itemAvulso('rvf', 'ta225')], parcelas: 2, primeiroVencimento: '2026-11-14', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a441') }),
  contratoAvulso({ id: 'ct723', criadoEm: '2026-10-27T17:45:00', vendedorId: 'ana', alunoId: 'a541', itens: [itemAvulso('rvf', 'ta225')], parcelas: 1, primeiroVencimento: '2026-11-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a541'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct717', criadoEm: '2026-10-28T14:30:00', vendedorId: 'ana', alunoId: 'a427', itens: [itemAvulso('cgc', 'ta227')], parcelas: 1, primeiroVencimento: '2026-11-12', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a427') }),
  contratoAvulso({ id: 'ct725', criadoEm: '2026-10-28T17:30:00', vendedorId: 'bruno', alunoId: 'a7', itens: [itemAvulso('jsf', 'ta196')], parcelas: 1, primeiroVencimento: '2026-11-09', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a7') }),
  contratoAvulso({ id: 'ct741', criadoEm: '2026-10-30T11:00:00', vendedorId: 'ana', alunoId: 'a550', itens: [itemAvulso('psb', 'ta234')], parcelas: 3, primeiroVencimento: '2026-11-04', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a550'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct740', criadoEm: '2026-11-01T11:30:00', vendedorId: 'carla', alunoId: 'a549', itens: [itemAvulso('psb', 'ta234')], parcelas: 1, primeiroVencimento: '2026-11-11', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a549') }),
  contratoAvulso({ id: 'ct739', criadoEm: '2026-11-01T18:15:00', vendedorId: 'ana', alunoId: 'a275', itens: [itemAvulso('psb', 'ta234')], parcelas: 1, primeiroVencimento: '2026-11-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a275') }),
  contratoAvulso({ id: 'ct737', criadoEm: '2026-11-02T15:45:00', vendedorId: 'ana', alunoId: 'a241', itens: [itemAvulso('psb', 'ta234')], parcelas: 1, primeiroVencimento: '2026-11-14', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a241') }),
  contratoAvulso({ id: 'ct730', criadoEm: '2026-11-03T17:30:00', vendedorId: 'ana', alunoId: 'a545', itens: [itemAvulso('jsf', 'ta196')], parcelas: 3, primeiroVencimento: '2026-11-14', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a545') }),
  contratoAvulso({ id: 'ct742', criadoEm: '2026-11-05T17:30:00', vendedorId: 'ana', alunoId: 'a41', itens: [itemAvulso('tys', 'ta230')], parcelas: 3, primeiroVencimento: '2026-11-17', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a41') }),
  contratoAvulso({ id: 'ct733', criadoEm: '2026-11-07T10:30:00', vendedorId: 'ana', alunoId: 'a261', itens: [itemAvulso('mby', 'ta219')], parcelas: 3, primeiroVencimento: '2026-11-15', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a261') }),
  contratoAvulso({ id: 'ct728', criadoEm: '2026-11-07T15:30:00', vendedorId: 'bruno', alunoId: 'a543', itens: [itemAvulso('jsf', 'ta196')], parcelas: 1, primeiroVencimento: '2026-11-22', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a543') }),
  contratoAvulso({ id: 'ct750', criadoEm: '2026-11-08T14:15:00', vendedorId: 'ana', alunoId: 'a538', itens: [itemAvulso('mkd', 'ta233')], parcelas: 2, primeiroVencimento: '2026-11-19', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a538'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct745', criadoEm: '2026-11-09T15:30:00', vendedorId: 'carla', alunoId: 'a284', itens: [itemAvulso('tys', 'ta230')], parcelas: 1, primeiroVencimento: '2026-11-20', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a284') }),
  contratoAvulso({ id: 'ct746', criadoEm: '2026-11-11T12:45:00', vendedorId: 'bruno', alunoId: 'a551', itens: [itemAvulso('tys', 'ta230')], parcelas: 2, primeiroVencimento: '2026-11-20', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a551'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct753', criadoEm: '2026-11-11T18:30:00', vendedorId: 'bruno', alunoId: 'a555', itens: [itemAvulso('mkd', 'ta233')], parcelas: 1, primeiroVencimento: '2026-11-19', forma: 'pix', status: 'aguardando', assinadoPor: assinaAluno('a555'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct726', criadoEm: '2026-11-13T15:30:00', vendedorId: 'carla', alunoId: 'a27', itens: [itemAvulso('jsf', 'ta196')], parcelas: 2, primeiroVencimento: '2026-11-24', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a27') }),
  contratoAvulso({ id: 'ct738', criadoEm: '2026-11-13T16:45:00', vendedorId: 'ana', alunoId: 'a208', itens: [itemAvulso('psb', 'ta234')], parcelas: 1, primeiroVencimento: '', forma: 'boleto', status: 'rascunho', assinadoPor: assinaAluno('a208'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct727', criadoEm: '2026-11-14T09:45:00', vendedorId: 'ana', alunoId: 'a378', itens: [itemAvulso('jsf', 'ta196')], parcelas: 2, primeiroVencimento: '2026-11-28', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a378'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct752', criadoEm: '2026-11-15T15:30:00', vendedorId: 'ana', alunoId: 'a554', itens: [itemAvulso('mkd', 'ta233')], parcelas: 1, primeiroVencimento: '2026-11-20', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a554') }),
  contratoAvulso({ id: 'ct744', criadoEm: '2026-11-19T10:15:00', vendedorId: 'bruno', alunoId: 'a477', itens: [itemAvulso('tys', 'ta230')], parcelas: 1, primeiroVencimento: '', forma: 'pix', status: 'rascunho', assinadoPor: assinaAluno('a477') }),
  contratoAvulso({ id: 'ct751', criadoEm: '2026-11-19T13:45:00', vendedorId: 'carla', alunoId: 'a240', itens: [itemAvulso('mkd', 'ta233')], parcelas: 1, primeiroVencimento: '2026-12-02', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a240') }),
  contratoAvulso({ id: 'ct747', criadoEm: '2026-11-20T13:30:00', vendedorId: 'bruno', alunoId: 'a552', itens: [itemAvulso('tys', 'ta230')], parcelas: 2, primeiroVencimento: '2026-12-01', forma: 'cartao', status: 'adm_ok', assinadoPor: assinaAluno('a552') }),
  contratoAvulso({ id: 'ct743', criadoEm: '2026-11-21T09:15:00', vendedorId: 'ana', alunoId: 'a31', itens: [itemAvulso('tys', 'ta230')], parcelas: 2, primeiroVencimento: '2026-12-08', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a31') }),
  contratoAvulso({ id: 'ct758', criadoEm: '2026-11-29T15:00:00', vendedorId: 'ana', alunoId: 'a557', itens: [itemAvulso('ang', 'ta231')], parcelas: 2, primeiroVencimento: '2026-12-19', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a557') }),
  contratoAvulso({ id: 'ct749', criadoEm: '2026-12-02T18:00:00', vendedorId: 'ana', alunoId: 'a512', itens: [itemAvulso('mkd', 'ta233')], parcelas: 3, primeiroVencimento: '2026-12-22', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a512') }),
  contratoAvulso({ id: 'ct757', criadoEm: '2026-12-06T13:00:00', vendedorId: 'ana', alunoId: 'a556', itens: [itemAvulso('ang', 'ta231')], parcelas: 1, primeiroVencimento: '2026-12-21', forma: 'pix', status: 'adm_ok', assinadoPor: assinaAluno('a556') }),
  contratoAvulso({ id: 'ct748', criadoEm: '2026-12-08T10:30:00', vendedorId: 'carla', alunoId: 'a553', itens: [itemAvulso('tys', 'ta230')], parcelas: 2, primeiroVencimento: '2026-12-18', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a553') }),
  contratoAvulso({ id: 'ct756', criadoEm: '2026-12-11T09:45:00', vendedorId: 'bruno', alunoId: 'a344', itens: [itemAvulso('ang', 'ta231')], parcelas: 3, primeiroVencimento: '2026-12-16', forma: 'cartao', status: 'aguardando', assinadoPor: assinaAluno('a344') }),
  contratoAvulso({ id: 'ct754', criadoEm: '2026-12-15T15:45:00', vendedorId: 'carla', alunoId: 'a373', itens: [itemAvulso('ang', 'ta231')], parcelas: 1, primeiroVencimento: '2026-12-26', forma: 'boleto', status: 'comercial_ok', assinadoPor: assinaAluno('a373') }),
  contratoAvulso({ id: 'ct759', criadoEm: '2026-12-16T16:00:00', vendedorId: 'carla', alunoId: 'a558', itens: [itemAvulso('ang', 'ta231')], parcelas: 1, primeiroVencimento: '2027-01-01', forma: 'boleto', status: 'adm_ok', assinadoPor: assinaAluno('a558'), meio: 'fisica' }),
  contratoAvulso({ id: 'ct755', criadoEm: '2026-12-28T13:00:00', vendedorId: 'carla', alunoId: 'a434', itens: [itemAvulso('ang', 'ta231')], parcelas: 1, primeiroVencimento: '2027-01-15', forma: 'pix', status: 'comercial_ok', assinadoPor: assinaAluno('a434') }),
);
// <<< CATALOGO-PROWAY contratos

// Semente no modelo v7 (pacotes × vagas). `CONTRATOS_SEED_V6` fica exposta só para testar a migração.
const CONTRATOS_SEED = CONTRATOS_SEED_V6.map((c) => contratoV6ParaV7(c));
