// ============================================================
// Regras da tela "Instrutores". Funções puras sobre a lista de instrutores.
// Trazido do protótipo original (snorlax-jornada). No MVP o instrutor é o
// registro de `professores` da base única (js/aulor.js): carregar/salvar leem
// e gravam lá, e as turmas apontam `turma.professorId`. Turmas e cursos chegam
// por `Cursos` (js/pessoas-mvp.js); Formacoes é opcional (o MVP não tem).
// ============================================================

const Instrutores = (() => {
  const carregar = () => clonar(Aulor.professores());

  function salvar(lista) {
    Aulor.carregar().professores = clonar(lista);
    Aulor.salvar();
  }

  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const hoje = () => Aulor.hoje();
  const anoAtual = () => Number(hoje().slice(0, 4));
  const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const digitos = (v) => String(v ?? '').replace(/\D/g, '');
  const numero = (v) => (v === '' || v == null ? null : Number(v));
  const porId = (lista, id) => lista.find((x) => x.id === id) ?? null;

  function novoId(lista, prefixo) {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  }
  const idLocal = (prefixo) => `${prefixo}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

  // ---------- Documentos e formatos ----------

  function cpfValido(v) {
    if (typeof Documento !== 'undefined') return Documento.cpfValido(v);
    const d = digitos(v);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    const calc = (n) => { let s = 0; for (let i = 0; i < n; i += 1) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
  }
  function cnpjValido(v) {
    if (typeof Documento !== 'undefined') return Documento.cnpjValido(v);
    const d = digitos(v);
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const calc = (n) => { const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < n; i += 1) s += Number(d[i]) * pesos[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; };
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
  }
  // CNPJ pode ser alfanumérico: normaliza com Documento.limpar (mantém letras); fallback só dígitos.
  const limparCnpj = (v) => (typeof Documento !== 'undefined' ? Documento.limpar(v) : digitos(v));
  const erroCnpj = (v) => (typeof Documento !== 'undefined' ? Documento.erroCnpj(v) : (cnpjValido(v) ? '' : 'CNPJ inválido.'));
  const emailValido = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  const fmtCpf = (v) => { const d = digitos(v); return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : v || ''; };
  const fmtCnpj = (v) => { if (typeof Documento !== 'undefined') return Documento.fmtCnpj(v); const d = digitos(v); return d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : v || ''; };
  const fmtCep = (v) => { const d = digitos(v); return d.length === 8 ? d.replace(/(\d{5})(\d{3})/, '$1-$2') : v || ''; };
  function fmtTelefone(v) {
    const d = digitos(v);
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return v || '';
  }
  const fmtData = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '');
  const fmtMoeda = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  function idade(iso) {
    if (!iso) return null;
    const n = new Date(`${iso}T12:00:00`); const h = new Date(`${hoje()}T12:00:00`);
    let a = h.getFullYear() - n.getFullYear();
    if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) a -= 1;
    return a;
  }
  const iniciais = (nome) => String(nome ?? '').split(/\s+/).filter(Boolean).filter((p, i, arr) => i === 0 || i === arr.length - 1).map((p) => p[0].toUpperCase()).join('');

  // ---------- Fontes externas (turmas, cursos, formações) ----------

  const cursos = () => (typeof Cursos !== 'undefined' ? Cursos.carregar() : []);
  const cursoDe = (id) => cursos().find((c) => c.id === id) ?? null;
  const turmas = () => (typeof Cursos !== 'undefined' ? Cursos.todasTurmas() : []);
  const turmaDe = (id) => turmas().find((t) => t.id === id) ?? null;
  const formacoes = () => (typeof Formacoes !== 'undefined' ? Formacoes.carregar() : []);
  const formacaoDe = (id) => formacoes().find((f) => f.id === id) ?? null;
  // Opcional (só nas telas internas): o cadastro público não deve revelar quem é da equipe.
  const colaboradores = () => (typeof Colaboradores !== 'undefined' ? Colaboradores.carregar() : []);

  // Turmas em que o instrutor está escalado (turma.instrutorId).
  const turmasDoInstrutor = (id) => turmas().filter((t) => t.instrutorId === id && t.status !== 'cancelada').sort((a, b) => a.inicio.localeCompare(b.inicio));
  // Cursos em que o instrutor está habilitado (curso.instrutorIds).
  const cursosHabilitados = (id) => cursos().filter((c) => (c.instrutorIds ?? []).includes(id)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  // Turmas já contempladas em algum contrato não cancelado do instrutor.
  function turmasContratadas(i, excetoContratoId = null) {
    const ids = new Set();
    i.contratos.filter((c) => c.status !== 'cancelado' && c.id !== excetoContratoId).forEach((c) => c.itens.forEach((it) => ids.add(it.turmaId)));
    return ids;
  }

  // ---------- Valor hora ----------

  const especificidade = (f) => [f.alunosMin, f.alunosMax, f.horasMin, f.horasMax].filter((x) => x != null).length;
  const faixaCasa = (f, { alunos, horas }) => (f.alunosMin == null || alunos >= f.alunosMin) && (f.alunosMax == null || alunos <= f.alunosMax) && (f.horasMin == null || horas >= f.horasMin) && (f.horasMax == null || horas <= f.horasMax);

  // Faixa que vale para uma turma: a mais específica que casa; empate → maior valor. Sem condição = padrão.
  function valorHoraPara(i, ctx) {
    const candidatas = i.valoresHora.filter((f) => faixaCasa(f, ctx)).sort((a, b) => especificidade(b) - especificidade(a) || b.valor - a.valor);
    return candidatas[0] ?? null;
  }
  const faixaPadrao = (i) => i.valoresHora.find((f) => especificidade(f) === 0) ?? null;
  function descricaoFaixa(f) {
    const p = [];
    if (f.alunosMin != null && f.alunosMax != null) p.push(`${f.alunosMin}–${f.alunosMax} alunos`);
    else if (f.alunosMin != null) p.push(`${f.alunosMin}+ alunos`);
    else if (f.alunosMax != null) p.push(`até ${f.alunosMax} alunos`);
    if (f.horasMin != null && f.horasMax != null) p.push(`${f.horasMin}–${f.horasMax} h`);
    else if (f.horasMin != null) p.push(`${f.horasMin} h ou mais`);
    else if (f.horasMax != null) p.push(`até ${f.horasMax} h`);
    return p.length ? p.join(' · ') : 'qualquer turma';
  }

  // ---------- Contratos ----------

  const contratoDe = (i, id) => i.contratos.find((c) => c.id === id) ?? null;
  const totalContrato = (c) => c.itens.reduce((s, it) => s + (Number(it.total) || 0), 0);
  const horasContrato = (c) => c.itens.reduce((s, it) => s + (Number(it.horas) || 0), 0);
  const contratosAtivos = (i) => i.contratos.filter((c) => ['assinatura', 'assinado', 'gerado', 'rascunho'].includes(c.status));
  const podeEditarContrato = (c) => c.status === 'rascunho';
  const podeGerar = (c) => c.status === 'rascunho' && c.itens.length > 0;
  const podeEnviarClicksign = (c) => c.status === 'gerado';
  const podeReabrir = (c) => c.status === 'gerado';
  const podeCancelarContrato = (c) => !['cancelado', 'encerrado'].includes(c.status);
  const podeEncerrar = (i, c) => c.status === 'assinado' && pagamentosDoContrato(i, c.id).every((p) => statusPagamento(p) === 'pago');

  function proximoCodigoContrato(lista) {
    const ano = anoAtual();
    const n = lista.reduce((acc, i) => acc + i.contratos.filter((c) => c.codigo.startsWith(`CI-${ano}-`)).length, 0) + 1;
    return `CI-${ano}-${String(n).padStart(3, '0')}`;
  }

  // Monta um item a partir da turma: horas = carga do curso; alunos = vagas da turma (matrículas reais vêm dos contratos de clientes).
  function itemDeTurma(i, turmaId) {
    const t = turmaDe(turmaId);
    const curso = t ? cursoDe(t.cursoId) : null;
    const horas = curso?.cargaHoraria ?? 0;
    const alunos = t?.vagas ?? 0;
    const f = valorHoraPara(i, { alunos, horas });
    return { id: `it-${turmaId}`, turmaId, cursoId: t?.cursoId ?? null, horas, alunos, valorHoraId: f?.id ?? null, valorHora: f?.valor ?? 0, total: horas * (f?.valor ?? 0) };
  }

  function validarContrato(dados, i, excetoId = null) {
    const erros = [];
    if (!['formacao', 'cursos'].includes(dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha formação ou cursos avulsos.' });
    if (dados.tipo === 'formacao' && !dados.formacaoId) erros.push({ campo: 'formacaoId', mensagem: 'Escolha a formação.' });
    if (!dados.turmaIds?.length) erros.push({ campo: 'turmaIds', mensagem: 'Escolha ao menos uma turma.' });
    const usadas = turmasContratadas(i, excetoId);
    const repetida = (dados.turmaIds ?? []).find((id) => usadas.has(id));
    if (repetida) erros.push({ campo: 'turmaIds', mensagem: `A turma ${turmaDe(repetida)?.codigo ?? repetida} já está em outro contrato.` });
    if (i.remuneracao === 'folha') erros.push({ campo: 'tipo', mensagem: 'Instrutor de folha não tem contrato: a aula já faz parte do salário.' });
    else if (!i.valoresHora.length) erros.push({ campo: 'turmaIds', mensagem: 'Cadastre ao menos um valor hora antes de montar o contrato.' });
    return erros;
  }

  function registrar(obj, texto) {
    return { ...obj, historico: [...(obj.historico ?? []), { em: hoje(), texto }] };
  }

  function atualizarInstrutor(lista, id, fn) {
    return lista.map((i) => (i.id === id ? fn(i) : i));
  }
  function atualizarContrato(lista, id, contratoId, fn) {
    return atualizarInstrutor(lista, id, (i) => ({ ...i, contratos: i.contratos.map((c) => (c.id === contratoId ? fn(c, i) : c)) }));
  }

  function incluirContrato(lista, id, dados) {
    const i = porId(lista, id);
    const contrato = registrar({
      id: idLocal('ci'), codigo: proximoCodigoContrato(lista), tipo: dados.tipo, formacaoId: dados.tipo === 'formacao' ? dados.formacaoId : null,
      itens: dados.turmaIds.map((t) => itemDeTurma(i, t)), status: 'rascunho', criadoEm: hoje(), documento: null, clicksign: null, observacoes: String(dados.observacoes ?? '').trim(), historico: [],
    }, 'Contrato criado');
    return { lista: atualizarInstrutor(lista, id, (x) => ({ ...x, contratos: [...x.contratos, contrato] })), contrato };
  }

  function atualizarItensContrato(lista, id, contratoId, dados) {
    return atualizarContrato(lista, id, contratoId, (c, i) => {
      const itens = dados.turmaIds.map((t) => c.itens.find((it) => it.turmaId === t) ?? itemDeTurma(i, t));
      return registrar({ ...c, tipo: dados.tipo, formacaoId: dados.tipo === 'formacao' ? dados.formacaoId : null, itens, observacoes: String(dados.observacoes ?? '').trim() }, 'Itens atualizados');
    });
  }

  // Ajuste manual do valor hora de um item (ex.: negociado). Recalcula o total.
  function ajustarItem(lista, id, contratoId, itemId, { valorHora, horas }) {
    return atualizarContrato(lista, id, contratoId, (c) => ({
      ...c,
      itens: c.itens.map((it) => {
        if (it.id !== itemId) return it;
        const vh = numero(valorHora) ?? it.valorHora; const h = numero(horas) ?? it.horas;
        return { ...it, valorHora: vh, horas: h, valorHoraId: vh === it.valorHora ? it.valorHoraId : null, total: vh * h };
      }),
    }));
  }

  function gerarDocumento(lista, id, contratoId) {
    return atualizarContrato(lista, id, contratoId, (c) => {
      const versao = (c.documento?.versao ?? 0) + 1;
      return registrar({ ...c, status: 'gerado', documento: { versao, geradoEm: hoje() } }, `Documento gerado (v${versao})`);
    });
  }
  function reabrirContrato(lista, id, contratoId) {
    return atualizarContrato(lista, id, contratoId, (c) => registrar({ ...c, status: 'rascunho' }, 'Reaberto para edição'));
  }
  // Simulação do envio ao Clicksign: cria o envelope com os dois signatários.
  function enviarClicksign(lista, id, contratoId) {
    return atualizarContrato(lista, id, contratoId, (c) => registrar({
      ...c, status: 'assinatura',
      clicksign: { envelopeId: `cs-${Math.random().toString(16).slice(2, 8)}`, enviadoEm: hoje(), instrutorAssinouEm: null, escolaAssinouEm: null },
    }, 'Enviado ao Clicksign (instrutor e escola)'));
  }
  // Simulação do retorno (webhook) do Clicksign para cada signatário.
  function registrarAssinatura(lista, id, contratoId, quem) {
    return atualizarContrato(lista, id, contratoId, (c) => {
      const cs = { ...c.clicksign, [quem === 'instrutor' ? 'instrutorAssinouEm' : 'escolaAssinouEm']: hoje() };
      const completo = cs.instrutorAssinouEm && cs.escolaAssinouEm;
      return registrar({ ...c, clicksign: cs, status: completo ? 'assinado' : 'assinatura' }, `Assinado ${quem === 'instrutor' ? 'pelo instrutor' : 'pela escola'} (Clicksign)${completo ? ' — contrato assinado' : ''}`);
    });
  }
  function cancelarContrato(lista, id, contratoId, motivo) {
    return atualizarContrato(lista, id, contratoId, (c) => registrar({ ...c, status: 'cancelado', motivoCancelamento: String(motivo ?? '').trim() }, `Cancelado${motivo ? `: ${motivo}` : ''}`));
  }
  function encerrarContrato(lista, id, contratoId) {
    return atualizarContrato(lista, id, contratoId, (c) => registrar({ ...c, status: 'encerrado' }, 'Contrato encerrado'));
  }
  function removerContrato(lista, id, contratoId) {
    return atualizarInstrutor(lista, id, (i) => ({ ...i, contratos: i.contratos.filter((c) => c.id !== contratoId), pagamentos: i.pagamentos.filter((p) => p.contratoId !== contratoId) }));
  }
  const assinaturasPendentes = (c) => {
    if (c.status !== 'assinatura' || !c.clicksign) return [];
    const p = [];
    if (!c.clicksign.instrutorAssinouEm) p.push('instrutor');
    if (!c.clicksign.escolaAssinouEm) p.push('escola');
    return p;
  };

  // ---------- Pagamentos ----------

  const pagamentosDoContrato = (i, contratoId) => i.pagamentos.filter((p) => p.contratoId === contratoId);
  const statusPagamento = (p) => (p.pagoEm ? 'pago' : p.nf ? 'liberado' : 'aguardando_nf');
  const totalPago = (i, contratoId) => pagamentosDoContrato(i, contratoId).filter((p) => p.pagoEm).reduce((s, p) => s + p.valor, 0);
  const totalProgramado = (i, contratoId) => pagamentosDoContrato(i, contratoId).reduce((s, p) => s + p.valor, 0);
  const podeProgramarPagamento = (c) => c.status === 'assinado';

  function validarPagamento(dados, i, c) {
    const erros = [];
    if (!['curso', 'parcial'].includes(dados.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha o tipo.' });
    if (!dados.itemId || !c.itens.some((it) => it.id === dados.itemId)) erros.push({ campo: 'itemId', mensagem: 'Escolha a turma do contrato.' });
    const v = numero(dados.valor);
    if (v == null || Number.isNaN(v) || v <= 0) erros.push({ campo: 'valor', mensagem: 'Valor maior que zero.' });
    const item = c.itens.find((it) => it.id === dados.itemId);
    if (item && v != null) {
      const jaProgramado = pagamentosDoContrato(i, c.id).filter((p) => p.itemId === item.id).reduce((s, p) => s + p.valor, 0);
      if (jaProgramado + v > item.total + 0.005) erros.push({ campo: 'valor', mensagem: `Passa do total do item (${fmtMoeda(item.total)}; já programado ${fmtMoeda(jaProgramado)}).` });
    }
    if (!dados.previsto) erros.push({ campo: 'previsto', mensagem: 'Informe a data prevista.' });
    if (dados.tipo === 'parcial' && !String(dados.descricao ?? '').trim()) erros.push({ campo: 'descricao', mensagem: 'Descreva o que este parcial cobre.' });
    return erros;
  }

  function incluirPagamento(lista, id, contratoId, dados) {
    const i = porId(lista, id); const c = contratoDe(i, contratoId);
    const item = c.itens.find((it) => it.id === dados.itemId);
    const t = turmaDe(item.turmaId); const curso = cursoDe(item.cursoId);
    const base = `${curso?.codigo ?? ''} · ${t?.codigo ?? ''}`;
    const pg = { id: idLocal('pg'), contratoId, itemId: item.id, tipo: dados.tipo, descricao: dados.tipo === 'curso' ? base : `${base} — ${String(dados.descricao).trim()}`, valor: numero(dados.valor), previsto: dados.previsto, nf: null, pagoEm: null };
    return { lista: atualizarInstrutor(lista, id, (x) => ({ ...x, pagamentos: [...x.pagamentos, pg] })), pagamento: pg };
  }
  function validarNf(dados, rotulo = 'da NF') {
    const erros = [];
    if (!String(dados.numero ?? '').trim()) erros.push({ campo: 'numero', mensagem: `Número ${rotulo}.` });
    if (!dados.emitidaEm) erros.push({ campo: 'emitidaEm', mensagem: 'Data de emissão.' });
    return erros;
  }
  function registrarNf(lista, id, pagamentoId, dados) {
    return atualizarInstrutor(lista, id, (i) => ({ ...i, pagamentos: i.pagamentos.map((p) => (p.id === pagamentoId ? { ...p, nf: { numero: String(dados.numero).trim(), emitidaEm: dados.emitidaEm, arquivo: String(dados.arquivo ?? '').trim() || `nf-${String(dados.numero).trim()}.pdf` } } : p)) }));
  }
  // Só paga com NF — regra dura.
  function registrarPagamento(lista, id, pagamentoId, pagoEm) {
    return atualizarInstrutor(lista, id, (i) => ({ ...i, pagamentos: i.pagamentos.map((p) => (p.id === pagamentoId && p.nf ? { ...p, pagoEm: pagoEm || hoje() } : p)) }));
  }
  function removerPagamento(lista, id, pagamentoId) {
    return atualizarInstrutor(lista, id, (i) => ({ ...i, pagamentos: i.pagamentos.filter((p) => p.id !== pagamentoId || p.pagoEm) }));
  }

  // ---------- Documentos anuais, LGPD, tag ----------

  const antecedentesDoAno = (i, ano = anoAtual()) => i.antecedentes.find((a) => a.ano === ano) ?? null;
  const antecedentesEmDia = (i) => !!antecedentesDoAno(i);
  function registrarAntecedentes(lista, id, dados) {
    const ano = Number(dados.ano);
    return atualizarInstrutor(lista, id, (i) => registrar({ ...i, antecedentes: [...i.antecedentes.filter((a) => a.ano !== ano), { id: `ant-${ano}`, ano, enviadoEm: dados.enviadoEm || hoje(), arquivo: String(dados.arquivo ?? '').trim() || `antecedentes-${ano}.pdf` }].sort((a, b) => b.ano - a.ano) }, `Declaração de antecedentes ${ano} recebida`));
  }
  function removerAntecedentes(lista, id, ano) {
    return atualizarInstrutor(lista, id, (i) => ({ ...i, antecedentes: i.antecedentes.filter((a) => a.ano !== ano) }));
  }
  function registrarLgpd(lista, id) {
    return atualizarInstrutor(lista, id, (i) => registrar({ ...i, lgpd: { aceitoEm: hoje(), versao: LGPD_INSTRUTOR.versao } }, 'Aceite da política de privacidade registrado'));
  }
  function atualizarTag(lista, id, dados) {
    const possui = dados.possui === 'sim' || dados.possui === true;
    return atualizarInstrutor(lista, id, (i) => registrar({ ...i, tagEstacionamento: { possui, identificacao: possui ? String(dados.identificacao ?? '').trim() : '', cedidaEm: possui ? dados.cedidaEm || '' : '', devolvidaEm: possui ? '' : dados.devolvidaEm || '' } }, possui ? 'Tag de estacionamento cedida' : 'Tag de estacionamento devolvida/não possui'));
  }

  // ---------- Pendências (avisam; bloqueio real só em pagamento e contrato) ----------

  const semContaPessoal = (i) => !i.contaPessoal?.pix && !i.contaPessoal?.conta;

  function pendencias(i) {
    const p = [];
    // Da equipe: CPF fica no colaborador, que não guarda endereço nem emergência (decisão de 08/09/2026).
    const vinculado = Boolean(i.colaboradorId);
    if (!i.foto) p.push('Sem foto');
    if (!vinculado && !cpfValido(i.cpf)) p.push('CPF inválido ou ausente');
    if (!i.contato.email) p.push('Sem e-mail');
    if (!i.contato.whatsapp) p.push('Sem WhatsApp');
    if (!vinculado && !i.contato.emergencia?.nome) p.push('Sem contato de emergência');
    if (!vinculado && (!i.endereco.cep || !i.endereco.logradouro)) p.push('Endereço incompleto');
    if (i.remuneracao === 'pj') {
      if (!i.empresa) p.push('Sem empresa para pagamento');
      else {
        if (!cnpjValido(i.empresa.cnpj)) p.push('CNPJ inválido');
        if (!i.empresa.pix && !i.empresa.conta) p.push('Sem PIX nem conta bancária');
      }
    }
    if (i.remuneracao === 'rpa' && semContaPessoal(i)) p.push('Sem PIX nem conta bancária');
    if (i.remuneracao !== 'folha' && !i.valoresHora.length) p.push('Sem valor hora');
    if (!antecedentesEmDia(i)) p.push(`Declaração de antecedentes ${anoAtual()} pendente`);
    if (!i.lgpd) p.push('Aceite da política de privacidade pendente');
    return p;
  }
  // O que impede pagar de verdade. Folha não entra: sem contrato, não há pagamento a bloquear.
  function pendenciasPagamento(i) {
    const p = [];
    if (i.remuneracao === 'folha') return p;
    if (i.remuneracao === 'rpa') { if (semContaPessoal(i)) p.push('sem PIX nem conta'); }
    else if (!i.empresa) p.push('sem empresa (CNPJ) cadastrada');
    else if (!cnpjValido(i.empresa.cnpj)) p.push('CNPJ inválido');
    else if (!i.empresa.pix && !i.empresa.conta) p.push('sem PIX nem conta');
    if (!antecedentesEmDia(i)) p.push(`declaração de antecedentes ${anoAtual()} pendente`);
    return p;
  }

  // ---------- Lista ----------

  function filtrar(lista, { busca = '', status = '', situacao = '', remuneracao = '' } = {}) {
    const termo = normalizar(busca);
    return lista
      .filter((i) => !termo || normalizar(`${i.nome} ${i.apelido} ${i.especialidade} ${i.contato.email} ${i.empresa?.razaoSocial ?? ''}`).includes(termo))
      .filter((i) => !status || i.status === status)
      .filter((i) => !remuneracao || i.remuneracao === remuneracao)
      .filter((i) => {
        if (!situacao) return true;
        if (situacao === 'pendencias') return pendencias(i).length > 0;
        if (situacao === 'sem-empresa') return i.remuneracao === 'pj' && !i.empresa;
        if (situacao === 'antecedentes') return !antecedentesEmDia(i);
        if (situacao === 'aguardando') return aguardandoCadastro(i);
        if (situacao === 'aguardando-nf') return i.pagamentos.some((p) => statusPagamento(p) === 'aguardando_nf');
        if (situacao === 'assinatura') return i.contratos.some((c) => c.status === 'assinatura');
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  function contagem(lista) {
    return { ativo: lista.filter((i) => i.status === 'ativo').length, inativo: lista.filter((i) => i.status === 'inativo').length, pendentes: lista.filter((i) => pendencias(i).length).length };
  }

  // ---------- Validações de cadastro ----------

  function validarDados(dados, lista, excetoId = null) {
    const erros = [];
    const atual = porId(lista, excetoId);
    const nome = String(dados.nome ?? '').trim();
    if (nome.length < 3) erros.push({ campo: 'nome', mensagem: 'Nome completo com pelo menos 3 letras.' });
    if (!String(dados.apelido ?? '').trim()) erros.push({ campo: 'apelido', mensagem: 'Como gosta de ser chamado.' });
    // Da equipe: nascimento, CPF e RG ficam no cadastro de Colaboradores.
    if (!atual?.colaboradorId) {
      if (!dados.nascimento) erros.push({ campo: 'nascimento', mensagem: 'Data de nascimento.' });
      else if ((idade(dados.nascimento) ?? 0) < 18) erros.push({ campo: 'nascimento', mensagem: 'Instrutor precisa ser maior de idade.' });
      const colab = colaboradores().find((c) => digitos(c.cpf) === digitos(dados.cpf));
      if (!cpfValido(dados.cpf)) erros.push({ campo: 'cpf', mensagem: 'CPF inválido.' });
      else if (lista.some((i) => i.id !== excetoId && digitos(i.cpf) === digitos(dados.cpf))) erros.push({ campo: 'cpf', mensagem: 'Já existe instrutor com este CPF.' });
      else if (colab) erros.push({ campo: 'cpf', mensagem: `CPF de ${colab.nome}, que já é colaborador: o papel de instrutor entra no cadastro dele.` });
      if (!String(dados.rg ?? '').trim()) erros.push({ campo: 'rg', mensagem: 'RG.' });
    }
    if (dados.status && !STATUS_INSTRUTOR.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    if (dados.remuneracao && !REMUNERACOES_INSTRUTOR.some((r) => r.id === dados.remuneracao)) erros.push({ campo: 'remuneracao', mensagem: 'Remuneração inválida.' });
    else if (dados.remuneracao === 'folha' && atual && contratosAtivos(atual).length) erros.push({ campo: 'remuneracao', mensagem: 'Encerre ou cancele os contratos ativos antes de passar para folha.' });
    const ch = dados.custoHoraReferencia;
    if (dados.remuneracao === 'folha' && ch != null && String(ch).trim() !== '' && !(Number(ch) > 0)) erros.push({ campo: 'custoHoraReferencia', mensagem: 'Custo-hora maior que zero, ou deixe em branco.' });
    return erros;
  }
  function validarContato(dados) {
    const erros = [];
    if (!String(dados.email ?? '').trim()) erros.push({ campo: 'email', mensagem: 'E-mail.' });
    else if (!emailValido(dados.email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    if (digitos(dados.whatsapp).length < 10) erros.push({ campo: 'whatsapp', mensagem: 'WhatsApp com DDD.' });
    if (String(dados.emergenciaNome ?? '').trim() && digitos(dados.emergenciaTelefone).length < 10) erros.push({ campo: 'emergenciaTelefone', mensagem: 'Telefone do contato de emergência.' });
    return erros;
  }
  function validarEndereco(dados) {
    const erros = [];
    if (digitos(dados.cep).length !== 8) erros.push({ campo: 'cep', mensagem: 'CEP com 8 dígitos.' });
    if (!String(dados.logradouro ?? '').trim()) erros.push({ campo: 'logradouro', mensagem: 'Endereço.' });
    if (!String(dados.cidade ?? '').trim()) erros.push({ campo: 'cidade', mensagem: 'Cidade.' });
    if (!UFS.includes(dados.uf)) erros.push({ campo: 'uf', mensagem: 'UF.' });
    return erros;
  }
  function validarEmpresa(dados, lista, excetoId = null) {
    const erros = [];
    if (!cnpjValido(dados.cnpj)) erros.push({ campo: 'cnpj', mensagem: erroCnpj(dados.cnpj) || 'CNPJ inválido.' });
    else if (lista.some((i) => i.id !== excetoId && i.empresa && limparCnpj(i.empresa.cnpj) === limparCnpj(dados.cnpj))) erros.push({ campo: 'cnpj', mensagem: 'CNPJ já usado por outro instrutor.' });
    if (String(dados.razaoSocial ?? '').trim().length < 3) erros.push({ campo: 'razaoSocial', mensagem: 'Razão social.' });
    if (!String(dados.pix ?? '').trim() && !String(dados.conta ?? '').trim()) erros.push({ campo: 'pix', mensagem: 'Informe a chave PIX ou a conta bancária.' });
    return erros;
  }
  function validarContaPessoal(dados) {
    return !String(dados.pix ?? '').trim() && !String(dados.conta ?? '').trim() ? [{ campo: 'pix', mensagem: 'Informe a chave PIX ou a conta bancária.' }] : [];
  }
  function validarFaixa(dados, i, excetoId = null) {
    const erros = [];
    if (!String(dados.nome ?? '').trim()) erros.push({ campo: 'nome', mensagem: 'Nome da faixa.' });
    const v = numero(dados.valor);
    if (v == null || Number.isNaN(v) || v <= 0) erros.push({ campo: 'valor', mensagem: 'Valor hora maior que zero.' });
    const aMin = numero(dados.alunosMin); const aMax = numero(dados.alunosMax); const hMin = numero(dados.horasMin); const hMax = numero(dados.horasMax);
    if (aMin != null && aMax != null && aMin > aMax) erros.push({ campo: 'alunosMax', mensagem: 'Máximo de alunos menor que o mínimo.' });
    if (hMin != null && hMax != null && hMin > hMax) erros.push({ campo: 'horasMax', mensagem: 'Máximo de horas menor que o mínimo.' });
    const semCondicao = aMin == null && aMax == null && hMin == null && hMax == null;
    if (semCondicao && i.valoresHora.some((f) => f.id !== excetoId && especificidade(f) === 0)) erros.push({ campo: 'nome', mensagem: 'Já existe uma faixa padrão (sem condição). Edite-a ou dê uma condição a esta.' });
    return erros;
  }

  // ---------- CRUD ----------

  function instrutorNovo(dados) {
    return {
      status: 'ativo', remuneracao: 'pj', colaboradorId: null, foto: null, apelido: '', nascimento: '', cpf: '', rg: '', especialidade: '', bio: '',
      endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: Aulor.escola().cidade, uf: Aulor.escola().uf },
      contato: { email: '', whatsapp: '', emergencia: { nome: '', telefone: '' } },
      empresa: null, contaPessoal: null, custoHoraReferencia: null, valoresHora: [], contratos: [], pagamentos: [], antecedentes: [], lgpd: null, cadastro: null,
      tagEstacionamento: { possui: false, identificacao: '', cedidaEm: '', devolvidaEm: '' },
      observacoes: '', historico: [],
      ...dados,
    };
  }
  function limparDados(dados) {
    return { nome: String(dados.nome).trim(), apelido: String(dados.apelido).trim(), nascimento: dados.nascimento, cpf: digitos(dados.cpf), rg: String(dados.rg).trim(), especialidade: String(dados.especialidade ?? '').trim(), bio: String(dados.bio ?? '').trim(), ...(dados.status ? { status: dados.status } : {}), ...(dados.remuneracao ? { remuneracao: dados.remuneracao } : {}), ...('custoHoraReferencia' in dados ? { custoHoraReferencia: dados.remuneracao === 'folha' && Number(dados.custoHoraReferencia) > 0 ? Number(dados.custoHoraReferencia) : null } : {}) };
  }
  function incluir(lista, dados) {
    const i = registrar(instrutorNovo({ id: novoId(lista, 'pr'), ...limparDados(dados) }), 'Cadastro criado');
    return { lista: [...lista, i], instrutor: i };
  }
  const atualizarDados = (lista, id, dados) => atualizarInstrutor(lista, id, (i) => ({ ...i, ...limparDados(dados) }));
  const atualizarFoto = (lista, id, foto) => atualizarInstrutor(lista, id, (i) => ({ ...i, foto: foto || null }));
  const atualizarContato = (lista, id, d) => atualizarInstrutor(lista, id, (i) => ({ ...i, contato: { email: String(d.email ?? '').trim(), whatsapp: digitos(d.whatsapp), emergencia: { nome: String(d.emergenciaNome ?? '').trim(), telefone: digitos(d.emergenciaTelefone) } } }));
  const atualizarEndereco = (lista, id, d) => atualizarInstrutor(lista, id, (i) => ({ ...i, endereco: { cep: digitos(d.cep), logradouro: String(d.logradouro ?? '').trim(), numero: String(d.numero ?? '').trim(), complemento: String(d.complemento ?? '').trim(), bairro: String(d.bairro ?? '').trim(), cidade: String(d.cidade ?? '').trim(), uf: d.uf } }));
  const atualizarEmpresa = (lista, id, d) => atualizarInstrutor(lista, id, (i) => registrar({ ...i, empresa: { cnpj: limparCnpj(d.cnpj), razaoSocial: String(d.razaoSocial ?? '').trim(), banco: String(d.banco ?? '').trim(), agencia: String(d.agencia ?? '').trim(), conta: String(d.conta ?? '').trim(), pix: String(d.pix ?? '').trim() } }, i.empresa ? 'Dados da empresa atualizados' : 'Empresa cadastrada para pagamento'));
  const atualizarContaPessoal = (lista, id, d) => atualizarInstrutor(lista, id, (i) => registrar({ ...i, contaPessoal: { banco: String(d.banco ?? '').trim(), agencia: String(d.agencia ?? '').trim(), conta: String(d.conta ?? '').trim(), pix: String(d.pix ?? '').trim() } }, i.contaPessoal ? 'Conta pessoal atualizada' : 'Conta pessoal cadastrada para o RPA'));
  const removerEmpresa = (lista, id) => atualizarInstrutor(lista, id, (i) => registrar({ ...i, empresa: null }, 'Empresa removida'));
  const atualizarObservacoes = (lista, id, texto) => atualizarInstrutor(lista, id, (i) => ({ ...i, observacoes: String(texto ?? '').trim() }));
  const alterarStatus = (lista, id, status) => atualizarInstrutor(lista, id, (i) => registrar({ ...i, status }, status === 'ativo' ? 'Reativado' : 'Inativado'));
  const podeExcluir = (i) => !i.contratos.some((c) => c.status !== 'rascunho') && !i.pagamentos.some((p) => p.pagoEm);
  const remover = (lista, id) => lista.filter((i) => i.id !== id);

  const limparFaixa = (d) => ({ nome: String(d.nome).trim(), valor: numero(d.valor), alunosMin: numero(d.alunosMin), alunosMax: numero(d.alunosMax), horasMin: numero(d.horasMin), horasMax: numero(d.horasMax) });
  const incluirFaixa = (lista, id, d) => atualizarInstrutor(lista, id, (i) => ({ ...i, valoresHora: [...i.valoresHora, { id: idLocal('vh'), ...limparFaixa(d) }] }));
  const atualizarFaixa = (lista, id, faixaId, d) => atualizarInstrutor(lista, id, (i) => ({ ...i, valoresHora: i.valoresHora.map((f) => (f.id === faixaId ? { ...f, ...limparFaixa(d) } : f)) }));
  const removerFaixa = (lista, id, faixaId) => atualizarInstrutor(lista, id, (i) => ({ ...i, valoresHora: i.valoresHora.filter((f) => f.id !== faixaId) }));


  // ---------- Papel docente de quem é da equipe ----------

  const instrutorDoColaborador = (lista, colaboradorId) => lista.find((i) => i.colaboradorId === colaboradorId) ?? null;
  // Nascimento e CPF de quem também é colaborador moram no cadastro dele.
  function pessoaDe(i) {
    const c = i.colaboradorId ? colaboradores().find((x) => x.id === i.colaboradorId) ?? null : null;
    return { colaborador: c, nascimento: c ? c.nascimento : i.nascimento, cpf: c ? c.cpf : i.cpf };
  }
  // O colaborador ganha o papel de instrutor: nome e contato de trabalho vêm junto; o CPF fica com ele.
  function incluirDeColaborador(lista, c, { remuneracao }) {
    const existente = instrutorDoColaborador(lista, c.id);
    if (existente) return { lista, instrutor: existente };
    const i = registrar(instrutorNovo({
      id: novoId(lista, 'pr'), colaboradorId: c.id, remuneracao, nome: c.nome, apelido: (c.nomeSocial || c.nome).split(/\s+/)[0],
      contato: { email: c.contato?.email ?? '', whatsapp: digitos(c.contato?.celular), emergencia: { nome: '', telefone: '' } },
    }), `Papel de instrutor adicionado ao colaborador ${c.nome}`);
    return { lista: [...lista, i], instrutor: i };
  }

  // ---------- Link para o próprio instrutor preencher o cadastro ----------
  // A escola convida (nome + contato) e manda o link; o instrutor completa dados
  // pessoais, endereço, empresa para pagamento, antecedentes e o aceite LGPD.
  // Protótipo: token só vale neste navegador (mesmo localStorage).

  const gerarToken = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

  // Gera (ou regenera) o link — um novo token invalida o anterior.
  function gerarCadastro(lista, id) {
    return atualizarInstrutor(lista, id, (i) => ({ ...i, cadastro: { token: gerarToken(), criadoEm: hoje(), preenchidoEm: '' } }));
  }
  const porTokenCadastro = (lista, token) => (token ? lista.find((i) => i.cadastro?.token === token) ?? null : null);
  const aguardandoCadastro = (i) => Boolean(i.cadastro && !i.cadastro.preenchidoEm);
  // variante: 'formulario' (página única) ou 'passos' (stepper) — mesmo token, mesma gravação.
  const urlCadastro = (i, variante = 'formulario') => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}${variante === 'passos' ? 'cadastro-instrutor-steps.html' : 'cadastro-instrutor.html'}?token=${i.cadastro.token}`;

  // Convite: cadastro mínimo (a escola só sabe o nome e como falar com a pessoa).
  function validarConvite(d, lista) {
    const erros = [];
    if (String(d.nome ?? '').trim().length < 3) erros.push({ campo: 'nome', mensagem: 'Nome completo com pelo menos 3 letras.' });
    if (!String(d.email ?? '').trim()) erros.push({ campo: 'email', mensagem: 'E-mail para mandar o link.' });
    else if (!emailValido(d.email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    else if (lista.some((i) => normalizar(i.contato.email) === normalizar(d.email))) erros.push({ campo: 'email', mensagem: 'Já existe instrutor com este e-mail.' });
    if (digitos(d.whatsapp).length < 10) erros.push({ campo: 'whatsapp', mensagem: 'WhatsApp com DDD.' });
    return erros;
  }
  function convidar(lista, d) {
    const nome = String(d.nome).trim();
    const i = registrar(instrutorNovo({
      id: novoId(lista, 'pr'),
      nome,
      apelido: String(d.apelido ?? '').trim() || nome.split(/\s+/)[0],
      especialidade: String(d.especialidade ?? '').trim(),
      contato: { email: String(d.email ?? '').trim(), whatsapp: digitos(d.whatsapp), emergencia: { nome: '', telefone: '' } },
      cadastro: { token: gerarToken(), criadoEm: hoje(), preenchidoEm: '' },
    }), 'Convite enviado — aguardando o instrutor preencher o cadastro');
    return { lista: [...lista, i], instrutor: i };
  }

  // O que o instrutor manda pela página pública: identificação + contato + endereço + empresa + aceite.
  function validarPreenchimento(d, lista, excetoId) {
    const erros = validarDados(d, lista, excetoId);
    erros.push(...validarContato(d.contato));
    if (!String(d.contato.emergenciaNome ?? '').trim()) erros.push({ campo: 'emergenciaNome', mensagem: 'Quem avisamos numa emergência.' });
    erros.push(...validarEndereco(d.endereco));
    erros.push(...validarEmpresa(d.empresa, lista, excetoId));
    if (!d.aceite) erros.push({ campo: 'aceite', mensagem: 'É preciso aceitar para continuar.' });
    if (!d.aceiteDados) erros.push({ campo: 'aceiteDados', mensagem: 'É preciso aceitar para continuar.' });
    return erros;
  }

  function preencherPeloInstrutor(lista, token, d) {
    const i = porTokenCadastro(lista, token);
    if (!i) return lista;
    let r = atualizarDados(lista, i.id, d);
    if (d.foto) r = atualizarFoto(r, i.id, d.foto);
    r = atualizarContato(r, i.id, d.contato);
    r = atualizarEndereco(r, i.id, d.endereco);
    r = atualizarEmpresa(r, i.id, d.empresa);
    if (String(d.antecedentes?.arquivo ?? '').trim()) r = registrarAntecedentes(r, i.id, { ano: anoAtual(), enviadoEm: hoje(), arquivo: d.antecedentes.arquivo });
    r = registrarLgpd(r, i.id);
    return atualizarInstrutor(r, i.id, (x) => registrar({ ...x, cadastro: { ...x.cadastro, preenchidoEm: new Date().toISOString() } }, 'Cadastro preenchido pelo instrutor'));
  }

  return {
    carregar, salvar, normalizar, porId, numero, digitos, hoje, anoAtual,
    cpfValido, cnpjValido, fmtCpf, fmtCnpj, fmtCep, fmtTelefone, fmtData, fmtMoeda, idade, iniciais,
    cursoDe, turmaDe, formacaoDe, formacoes, turmasDoInstrutor, cursosHabilitados, turmasContratadas,
    valorHoraPara, faixaPadrao, descricaoFaixa, especificidade,
    contratoDe, totalContrato, horasContrato, contratosAtivos, podeEditarContrato, podeGerar, podeEnviarClicksign, podeReabrir, podeCancelarContrato, podeEncerrar, assinaturasPendentes,
    validarContrato, incluirContrato, atualizarItensContrato, ajustarItem, gerarDocumento, reabrirContrato, enviarClicksign, registrarAssinatura, cancelarContrato, encerrarContrato, removerContrato, itemDeTurma,
    pagamentosDoContrato, statusPagamento, totalPago, totalProgramado, podeProgramarPagamento, validarPagamento, incluirPagamento, validarNf, registrarNf, registrarPagamento, removerPagamento,
    antecedentesDoAno, antecedentesEmDia, registrarAntecedentes, removerAntecedentes, registrarLgpd, atualizarTag,
    pendencias, pendenciasPagamento, filtrar, contagem,
    validarDados, validarContato, validarEndereco, validarEmpresa, validarContaPessoal, validarFaixa,
    incluir, atualizarDados, atualizarFoto, atualizarContato, atualizarEndereco, atualizarEmpresa, atualizarContaPessoal, removerEmpresa,
    instrutorDoColaborador, pessoaDe, incluirDeColaborador, atualizarObservacoes, alterarStatus, podeExcluir, remover,
    incluirFaixa, atualizarFaixa, removerFaixa,
    gerarCadastro, porTokenCadastro, aguardandoCadastro, urlCadastro, validarConvite, convidar, validarPreenchimento, preencherPeloInstrutor,
  };
})();
