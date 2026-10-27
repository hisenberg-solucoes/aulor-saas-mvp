// ============================================================
// Motor da consulta ao SPC: regras puras (sem DOM).
//  - simular(): resposta determinística do "bureau" a partir do documento
//    (em produção é a API do SPC Brasil — só esta função muda).
//  - consultar(): valida, chama o bureau e REGISTRA no log (auditoria).
//  - alertas(): heurísticas de uso indevido por operador.
// Persistência em localStorage — trocar o sufixo da chave força reset.
// ============================================================

const Spc = (() => {
  const CHAVE = 'prototipo-spc-v1';
  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const digitos = (v) => String(v ?? '').replace(/\D/g, '');
  const porId = (lista, id) => lista.find((x) => x.id === id) ?? null;

  // ---------- Alvo da consulta ----------
  // tipo: 'aluno' (CPF do aluno) | 'responsavel' (CPF do responsável financeiro do aluno) | 'empresa' (CNPJ).
  // clienteTipo/clienteId apontam para o cadastro; assim a ficha do aluno vê as consultas do responsável também.
  function alvoDe(dadosClientes, tipo, id) {
    if (tipo === 'empresa') {
      const e = porId(dadosClientes.empresas, id);
      if (!e) return null;
      return { tipo, clienteTipo: 'empresa', clienteId: e.id, nome: e.nomeFantasia || e.razaoSocial, documento: (typeof Documento !== 'undefined' ? Documento.limpar(e.cnpj) : digitos(e.cnpj)), docTipo: 'CNPJ' };
    }
    const a = porId(dadosClientes.alunos, id);
    if (!a) return null;
    if (tipo === 'responsavel') {
      const r = a.responsavel;
      if (!r || !digitos(r.cpf)) return null;
      return { tipo, clienteTipo: 'aluno', clienteId: a.id, nome: r.nome, documento: digitos(r.cpf), docTipo: 'CPF', detalhe: `${r.parentesco ? `${r.parentesco} de ` : 'Responsável por '}${a.nomeSocial || a.nome}` };
    }
    return { tipo: 'aluno', clienteTipo: 'aluno', clienteId: a.id, nome: a.nomeSocial || a.nome, documento: digitos(a.cpf), docTipo: 'CPF' };
  }

  // Alvos possíveis de um cliente: o próprio e, no aluno, o responsável financeiro (quem paga).
  function alvosDoCliente(dadosClientes, clienteTipo, clienteId) {
    if (clienteTipo === 'empresa') return [alvoDe(dadosClientes, 'empresa', clienteId)].filter(Boolean);
    const a = porId(dadosClientes.alunos, clienteId);
    if (!a) return [];
    const lista = [alvoDe(dadosClientes, 'aluno', a.id)];
    if (a.pagador === 'terceiro' && a.responsavel && digitos(a.responsavel.cpf)) lista.push(alvoDe(dadosClientes, 'responsavel', a.id));
    return lista.filter(Boolean);
  }

  // ---------- Bureau simulado ----------
  function hash(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i += 1) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function gerador(semente) {
    let s = semente || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  const arred = (n) => Math.round(n * 100) / 100;
  function dataMenos(iso, dias) { const d = new Date(iso); d.setDate(d.getDate() - dias); return d.toISOString().slice(0, 10); }

  // Determinístico pelo documento: o mesmo CPF devolve sempre a mesma situação
  // (com "protocolo" diferente por consulta). Simula ~70% regular, ~26% restrição, ~4% indisponível.
  function simular(documento, quandoIso) {
    const doc = digitos(documento);
    const h = hash(doc);
    const r = gerador(h);
    const sorteio = r();
    const protocolo = `SPC-${String(hash(doc + quandoIso)).padStart(10, '0').slice(0, 10)}`;
    if (h % 25 === 0) return { situacao: 'indisponivel', score: null, pendencias: [], totalPendente: 0, protocolo, consultadoEm: quandoIso, custo: 0 };
    if (sorteio < 0.7) {
      return { situacao: 'regular', score: 620 + Math.floor(r() * 360), pendencias: [], totalPendente: 0, protocolo, consultadoEm: quandoIso, custo: 3.9 };
    }
    const n = 1 + Math.floor(r() * 3);
    const pendencias = Array.from({ length: n }, () => {
      const tipo = TIPOS_PENDENCIA_SPC[Math.floor(r() * TIPOS_PENDENCIA_SPC.length)].id;
      return {
        tipo, credor: CREDORES_SPC[Math.floor(r() * CREDORES_SPC.length)],
        valor: arred(80 + r() * 4200), inclusao: dataMenos(quandoIso, 20 + Math.floor(r() * 700)), cidade: r() < 0.7 ? 'Blumenau/SC' : 'Gaspar/SC',
      };
    });
    return { situacao: 'restricao', score: 120 + Math.floor(r() * 380), pendencias, totalPendente: arred(pendencias.reduce((s, p) => s + p.valor, 0)), protocolo, consultadoEm: quandoIso, custo: 3.9 };
  }

  // ---------- Persistência ----------
  function montarSemente(dadosClientes) {
    const consultas = CONSULTAS_SPC_SEED.map((s, i) => {
      const alvo = alvoDe(dadosClientes, s.tipo, s.id);
      if (!alvo) return null;
      const data = `${s.data}:00`;
      return { id: `spc${i + 1}`, data, operadorId: s.op, alvo, motivo: s.motivo, justificativa: s.justificativa ?? '', origem: s.origem, resultado: simular(alvo.documento, data) };
    }).filter(Boolean);
    return { consultas };
  }

  function carregar(dadosClientes) {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return montarSemente(dadosClientes);
  }
  function salvar(dados) { localStorage.setItem(CHAVE, JSON.stringify(dados)); }

  // ---------- Consultar ----------
  function validar({ alvo, motivo, justificativa }) {
    const erros = {};
    if (!alvo) erros.alvo = 'Escolha quem consultar.';
    else if (!(alvo.docTipo === 'CNPJ' ? Clientes.cnpjValido(alvo.documento) : Clientes.cpfValido(alvo.documento))) erros.alvo = `${alvo.docTipo} inválido no cadastro — corrija antes de consultar.`;
    if (!motivo) erros.motivo = 'Informe o motivo.';
    if (motivo === 'outro' && String(justificativa ?? '').trim().length < 10) erros.justificativa = 'Justifique com pelo menos 10 caracteres.';
    return erros;
  }

  function novoId(lista) {
    let n = lista.length + 1;
    while (lista.some((c) => c.id === `spc${n}`)) n += 1;
    return `spc${n}`;
  }

  function consultar(dados, { alvo, motivo, justificativa = '', operadorId, origem = 'spc', agora = new Date() }) {
    const erros = validar({ alvo, motivo, justificativa });
    if (Object.keys(erros).length) return { dados, consulta: null, erros };
    const data = isoLocal(agora);
    const consulta = { id: novoId(dados.consultas), data, operadorId, alvo: clonar(alvo), motivo, justificativa: String(justificativa).trim(), origem, resultado: simular(alvo.documento, data) };
    return { dados: { ...dados, consultas: [...dados.consultas, consulta] }, consulta, erros: {} };
  }

  function isoLocal(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  // ---------- Leitura ----------
  const ordenarRecentes = (lista) => [...lista].sort((a, b) => (a.data < b.data ? 1 : -1));

  function consultasDoCliente(dados, clienteTipo, clienteId) {
    return ordenarRecentes(dados.consultas.filter((c) => c.alvo.clienteTipo === clienteTipo && c.alvo.clienteId === clienteId));
  }
  function consultasDoDocumento(dados, documento) {
    const d = digitos(documento);
    return ordenarRecentes(dados.consultas.filter((c) => c.alvo.documento === d));
  }
  function ultimaConsulta(dados, alvo) {
    return alvo ? consultasDoDocumento(dados, alvo.documento)[0] ?? null : null;
  }
  function diasDesde(iso, agora = new Date()) {
    return Math.floor((agora - new Date(iso)) / 86400000);
  }
  // Resumo por cliente para a ficha: última consulta de cada alvo (aluno e responsável).
  function situacaoDoCliente(dados, dadosClientes, clienteTipo, clienteId) {
    return alvosDoCliente(dadosClientes, clienteTipo, clienteId).map((alvo) => ({ alvo, ultima: ultimaConsulta(dados, alvo) }));
  }

  // ---------- Vínculo comercial ----------
  // A consulta tem "vínculo" quando existe um contrato do cliente criado até N dias antes/depois dela
  // (novo contrato / pré-matrícula que virou contrato), ou quando o motivo é cobrança/renegociação e o
  // cliente já tinha contrato antes da consulta. Sem isso, a consulta não se explica pelo negócio.
  function vinculo(consulta, contratos, regras = REGRAS_AUDITORIA_SPC) {
    if (!contratos) return { tem: null, contrato: null };
    const { clienteTipo, clienteId } = consulta.alvo;
    const meus = contratos.filter((c) => c.status !== 'rascunho' && (clienteTipo === 'empresa' ? c.empresaId === clienteId : (c.alunos ?? []).some((v) => v.alunoId === clienteId && v.situacao !== 'recusado')));
    const t = new Date(consulta.data).getTime();
    const janela = regras.janelaVinculoDias * 86400000;
    const perto = meus.find((c) => Math.abs(new Date(c.criadoEm).getTime() - t) <= janela);
    if (perto) return { tem: true, contrato: perto, motivo: 'Venda próxima da data da consulta' };
    if (['cobranca', 'renegociacao'].includes(consulta.motivo)) {
      const antes = meus.find((c) => new Date(c.criadoEm).getTime() < t);
      if (antes) return { tem: true, contrato: antes, motivo: 'Cobrança de venda existente' };
    }
    return { tem: false, contrato: null, motivo: meus.length ? 'Venda antiga, sem relação com a consulta' : 'Cliente nunca teve venda' };
  }

  function foraDoHorario(iso, regras = REGRAS_AUDITORIA_SPC) {
    const d = new Date(iso);
    const dia = d.getDay();
    const h = d.getHours() + d.getMinutes() / 60;
    return dia === 0 || dia === 6 || h < regras.horaInicio || h >= regras.horaFim;
  }

  // Repetição: mesmo documento consultado ≥ N vezes dentro de X dias (custo sem necessidade).
  function repetidaEm(consulta, todas, regras = REGRAS_AUDITORIA_SPC) {
    const t = new Date(consulta.data).getTime();
    const janela = regras.repeticaoDias * 86400000;
    const iguais = todas.filter((c) => c.alvo.documento === consulta.alvo.documento && Math.abs(new Date(c.data).getTime() - t) <= janela);
    return iguais.length >= regras.repeticaoMin;
  }

  // Enriquecimento de cada consulta para a auditoria.
  function anotar(dados, contratos, regras = REGRAS_AUDITORIA_SPC) {
    return ordenarRecentes(dados.consultas).map((c) => {
      const v = vinculo(c, contratos, regras);
      return { ...c, vinculo: v, foraHorario: foraDoHorario(c.data, regras), repetida: repetidaEm(c, dados.consultas, regras) };
    });
  }

  // ---------- Filtros da auditoria ----------
  function filtrar(anotadas, f, agora = new Date()) {
    const busca = Clientes.normalizar(f.busca ?? '');
    const limite = f.dias ? agora.getTime() - Number(f.dias) * 86400000 : null;
    return anotadas.filter((c) => {
      if (limite && new Date(c.data).getTime() < limite) return false;
      if (f.operadorId && c.operadorId !== f.operadorId) return false;
      if (f.tipo && c.alvo.tipo !== f.tipo) return false;
      if (f.situacao && c.resultado.situacao !== f.situacao) return false;
      if (f.motivo && c.motivo !== f.motivo) return false;
      if (f.sinal === 'sem-vinculo' && c.vinculo.tem !== false) return false;
      if (f.sinal === 'fora-horario' && !c.foraHorario) return false;
      if (f.sinal === 'repetida' && !c.repetida) return false;
      if (f.sinal === 'qualquer' && !(c.vinculo.tem === false || c.foraHorario || c.repetida)) return false;
      if (busca && !Clientes.normalizar(`${c.alvo.nome} ${c.alvo.documento} ${c.justificativa} ${c.resultado.protocolo}`).includes(busca)) return false;
      return true;
    });
  }

  function resumo(lista) {
    const total = lista.length;
    const semVinculo = lista.filter((c) => c.vinculo.tem === false).length;
    const foraHorario = lista.filter((c) => c.foraHorario).length;
    const repetidas = lista.filter((c) => c.repetida).length;
    const restricao = lista.filter((c) => c.resultado.situacao === 'restricao').length;
    const custo = arred(lista.reduce((s, c) => s + (c.resultado.custo || 0), 0));
    const operadores = new Set(lista.map((c) => c.operadorId)).size;
    return { total, semVinculo, foraHorario, repetidas, restricao, custo, operadores };
  }

  // ---------- Alertas por operador ----------
  function alertas(anotadas, regras = REGRAS_AUDITORIA_SPC) {
    const porOperador = new Map();
    anotadas.forEach((c) => { if (!porOperador.has(c.operadorId)) porOperador.set(c.operadorId, []); porOperador.get(c.operadorId).push(c); });
    const saida = [];
    porOperador.forEach((lista, operadorId) => {
      const porDia = new Map();
      lista.forEach((c) => { const d = c.data.slice(0, 10); porDia.set(d, (porDia.get(d) ?? 0) + 1); });
      let picoDia = '', pico = 0;
      porDia.forEach((n, d) => { if (n > pico) { pico = n; picoDia = d; } });
      const semVinculo = lista.filter((c) => c.vinculo.tem === false).length;
      const pctSemVinculo = lista.length ? Math.round((semVinculo / lista.length) * 100) : 0;
      const foraHorario = lista.filter((c) => c.foraHorario).length;
      const repetidas = lista.filter((c) => c.repetida).length;
      const sinais = [];
      if (pico > regras.maxPorDia) sinais.push({ id: 'volume', texto: `${pico} consultas em ${fmtData(picoDia)} (limite ${regras.maxPorDia}/dia)` });
      if (lista.length >= regras.minParaPercentual && pctSemVinculo >= regras.pctSemVinculoAlerta) sinais.push({ id: 'sem-vinculo', texto: `${pctSemVinculo}% sem venda relacionada (${semVinculo} de ${lista.length})` });
      if (repetidas >= regras.repeticaoMin) sinais.push({ id: 'repetida', texto: `${repetidas} consultas repetidas do mesmo documento em ${regras.repeticaoDias} dias` });
      if (foraHorario >= 3) sinais.push({ id: 'fora-horario', texto: `${foraHorario} consultas fora do horário (${regras.horaInicio}h–${regras.horaFim}h, dias úteis)` });
      const nivel = sinais.length >= 3 ? 'alto' : sinais.length >= 1 ? 'medio' : null;
      saida.push({ operadorId, total: lista.length, pico, picoDia, semVinculo, pctSemVinculo, foraHorario, repetidas, sinais, nivel, ultima: lista[0]?.data ?? null });
    });
    return saida.sort((a, b) => (b.sinais.length - a.sinais.length) || (b.total - a.total));
  }

  // ---------- Formatação ----------
  function fmtData(iso) { return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : ''; }
  function fmtDataHora(iso) { return iso ? `${fmtData(iso)} ${iso.slice(11, 16)}` : ''; }
  function fmtDocumento(alvo) { return alvo.docTipo === 'CNPJ' ? Clientes.fmtCnpj(alvo.documento) : Clientes.fmtCpf(alvo.documento); }
  const fmtMoeda = (n) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function csv(lista) {
    const cab = ['id', 'data', 'operador', 'alvo', 'documento', 'tipo', 'motivo', 'justificativa', 'origem', 'situacao', 'score', 'protocolo', 'vinculo', 'fora_horario', 'repetida'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const linhas = lista.map((c) => [c.id, c.data, c.operadorId, c.alvo.nome, c.alvo.documento, c.alvo.tipo, c.motivo, c.justificativa, c.origem, c.resultado.situacao, c.resultado.score ?? '', c.resultado.protocolo, c.vinculo?.tem == null ? '' : c.vinculo.tem ? 'sim' : 'nao', c.foraHorario ? 'sim' : 'nao', c.repetida ? 'sim' : 'nao'].map(esc).join(';'));
    return [cab.join(';'), ...linhas].join('\n');
  }

  return {
    CHAVE, carregar, salvar, alvoDe, alvosDoCliente, simular, validar, consultar,
    consultasDoCliente, consultasDoDocumento, ultimaConsulta, diasDesde, situacaoDoCliente,
    vinculo, foraDoHorario, repetidaEm, anotar, filtrar, resumo, alertas,
    fmtData, fmtDataHora, fmtDocumento, fmtMoeda, csv,
  };
})();
