// ============================================================
// Motor da tela "Chamados": regras puras (sem DOM).
// Persistência em localStorage — trocar o sufixo da chave força reset.
// Depende de: CHAMADOS_SEED e listas de chamados-data.js.
// Opcionais (para montar solicitantes/atendentes/salas): Colaboradores,
// Clientes, INSTRUTORES (cursos-data) ou chave de Instrutores, Salas.
// ============================================================

const Chamados = (() => {
  const CHAVE = 'aulor-v1-chamados-v2';
  const CHAVE_INSTRUTORES = 'aulor-v1-instrutores-v5';

  const clonar = (x) => JSON.parse(JSON.stringify(x));

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return clonar(CHAMADOS_SEED);
  }

  function salvar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  }

  // ---------- Helpers ----------

  const agora = () => CHAMADOS_AGORA;
  const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const porId = (lista, id) => lista.find((c) => c.id === id) ?? null;
  const porNumero = (lista, numero) => lista.find((c) => c.numero === numero) ?? null;
  const tipoDe = (id) => TIPOS_CHAMADO.find((t) => t.id === id) ?? null;
  const categoriaDe = (id) => CATEGORIAS_CHAMADO.find((c) => c.id === id) ?? null;
  const prioridadeDe = (id) => PRIORIDADES_CHAMADO.find((p) => p.id === id) ?? null;
  const statusDe = (id) => STATUS_CHAMADO.find((s) => s.id === id) ?? null;
  const tipoSolicitanteDe = (id) => TIPOS_SOLICITANTE.find((t) => t.id === id) ?? null;
  const categoriasDe = (tipo) => CATEGORIAS_CHAMADO.filter((c) => c.tipo === tipo);

  const ATIVOS = ['aberto', 'em_atendimento', 'aguardando_solicitante'];
  const ENCERRADOS = ['resolvido', 'fechado', 'cancelado'];
  const ehAtivo = (c) => ATIVOS.includes(c.status);
  const ehEncerrado = (c) => ENCERRADOS.includes(c.status);

  const paraData = (iso) => new Date(iso.length === 10 ? `${iso}T12:00` : iso);
  const fmtData = (iso) => (iso ? paraData(iso).toLocaleDateString('pt-BR') : '');
  const fmtHora = (iso) => (iso ? paraData(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
  const fmtDataHora = (iso) => (iso ? `${fmtData(iso)} ${fmtHora(iso)}` : '');

  function somarHoras(iso, horas) {
    const d = paraData(iso);
    d.setMinutes(d.getMinutes() + Math.round(horas * 60));
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  const horasEntre = (a, b) => (paraData(b) - paraData(a)) / 36e5;

  // "há 2 h", "há 3 dias", "em 40 min", "atrasado 5 h"
  function duracao(horas) {
    const h = Math.abs(horas);
    if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
    if (h < 48) return `${Math.round(h)} h`;
    return `${Math.round(h / 24)} dias`;
  }
  const relativo = (iso, ref = agora()) => `há ${duracao(horasEntre(iso, ref))}`;

  function novoId(lista, prefixo) {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  }
  const idLocal = (prefixo) => `${prefixo}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

  function proximoNumero(lista) {
    const maior = lista.reduce((m, c) => Math.max(m, Number(String(c.numero).replace(/\D/g, '')) || 0), 0);
    return `CH-${String(maior + 1).padStart(4, '0')}`;
  }

  // ---------- Pessoas (quem abre / quem atende) ----------

  const Pessoas = (() => {
    const ordenar = (l) => l.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    function colaboradores() {
      if (typeof Colaboradores === 'undefined') return [];
      return Colaboradores.carregar().filter((c) => c.status !== 'desligado').map((c) => ({
        tipo: 'colaborador', id: c.id, nome: c.nomeSocial || c.nome, detalhe: c.cargo, email: c.contato?.email ?? '', status: c.status, departamentoId: c.departamentoId,
      }));
    }

    function alunos() {
      if (typeof Clientes === 'undefined') return [];
      return Clientes.carregar().alunos.map((a) => ({
        tipo: 'aluno', id: a.id, nome: a.nomeSocial || a.nome, detalhe: a.profissao || 'Aluno', email: a.email ?? '', status: a.status,
      }));
    }

    function instrutores() {
      let base = null;
      try {
        const salvo = localStorage.getItem(CHAVE_INSTRUTORES);
        if (salvo) base = JSON.parse(salvo).map((i) => ({ id: i.id, nome: i.nome, detalhe: i.apelido ? `“${i.apelido}”` : 'Instrutor', email: i.contato?.email ?? '', status: i.status, colaboradorId: i.colaboradorId ?? null }));
      } catch (_) { base = null; }
      if (!base && typeof INSTRUTORES_SEED !== 'undefined') base = INSTRUTORES_SEED.map((i) => ({ id: i.id, nome: i.nome, detalhe: i.apelido ? `“${i.apelido}”` : 'Instrutor', email: i.contato?.email ?? '', status: i.status, colaboradorId: i.colaboradorId ?? null }));
      if (!base && typeof INSTRUTORES !== 'undefined') base = INSTRUTORES.map((i) => ({ id: i.id, nome: i.nome, detalhe: i.especialidade, email: '', status: 'ativo', colaboradorId: i.colaboradorId ?? null }));
      return (base ?? []).map((i) => ({ ...i, tipo: 'instrutor' }));
    }

    // Quem é da equipe e dá aula entra uma vez, como colaborador; `pessoa('instrutor', id)` ainda acha o papel docente.
    function solicitantes(tipo = null) {
      const todos = [...colaboradores(), ...alunos(), ...instrutores().filter((i) => tipo === 'instrutor' || !i.colaboradorId)];
      return ordenar(tipo ? todos.filter((p) => p.tipo === tipo) : todos);
    }

    // Colaboradores ativos; departamento Suporte primeiro.
    function atendentes() {
      const lista = colaboradores().filter((c) => c.status === 'ativo');
      return lista.sort((a, b) => {
        const sa = a.departamentoId === 'suporte' ? 0 : 1;
        const sb = b.departamentoId === 'suporte' ? 0 : 1;
        return sa - sb || a.nome.localeCompare(b.nome, 'pt-BR');
      });
    }

    const atendente = (id) => atendentes().find((a) => a.id === id) ?? colaboradores().find((c) => c.id === id) ?? null;
    const pessoa = (tipo, id) => solicitantes(tipo).find((p) => p.id === id) ?? null;

    function salas() {
      if (typeof Salas === 'undefined') return [];
      return Salas.carregar().map((s) => ({ id: s.id, nome: s.codigo ? `${s.codigo} · ${s.nome}` : s.nome, unidadeId: s.unidadeId }));
    }
    const sala = (id) => salas().find((s) => s.id === id) ?? null;

    return { colaboradores, alunos, instrutores, solicitantes, atendentes, atendente, pessoa, salas, sala };
  })();

  const paginaDe = (pessoa) => {
    const t = tipoSolicitanteDe(pessoa?.tipo);
    return t ? `${t.pagina}?id=${encodeURIComponent(pessoa.id)}` : '#';
  };

  // ---------- Prazos ----------

  const prazo = (c) => somarHoras(c.abertoEm, prioridadeDe(c.prioridade)?.slaHoras ?? 48);
  const atrasado = (c, ref = agora()) => ehAtivo(c) && horasEntre(prazo(c), ref) > 0;
  const horasParaPrazo = (c, ref = agora()) => horasEntre(ref, prazo(c));

  function tempoResolucao(c) {
    const fim = c.resolvidoEm ?? c.fechadoEm;
    return fim ? horasEntre(c.abertoEm, fim) : null;
  }

  // ---------- Consultas ----------

  function filtrar(lista, f = {}) {
    const termo = normalizar(f.busca);
    return lista.filter((c) => {
      if (f.aba === 'fila' && !ehAtivo(c)) return false;
      if (f.aba === 'encerrados' && !ehEncerrado(c)) return false;
      if (f.tipo && c.tipo !== f.tipo) return false;
      if (f.status && c.status !== f.status) return false;
      if (f.prioridade && c.prioridade !== f.prioridade) return false;
      if (f.solicitanteTipo && c.solicitante?.tipo !== f.solicitanteTipo) return false;
      if (f.atendenteId === 'nenhum' ? c.atendenteId : (f.atendenteId && c.atendenteId !== f.atendenteId)) return false;
      if (f.atrasados && !atrasado(c)) return false;
      if (termo) {
        const alvo = normalizar([c.numero, c.titulo, c.descricao, c.solicitante?.nome, categoriaDe(c.categoriaId)?.nome, c.equipamento].join(' '));
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }

  const PESO_PRIORIDADE = { critica: 0, alta: 1, media: 2, baixa: 3 };
  const PESO_STATUS = { aberto: 0, em_atendimento: 1, aguardando_solicitante: 2, resolvido: 3, fechado: 4, cancelado: 5 };

  // Fila: ativos por prioridade, depois prazo mais próximo; encerrados por atualização desc.
  function ordenar(lista) {
    return [...lista].sort((a, b) => {
      const aa = ehAtivo(a) ? 0 : 1;
      const ab = ehAtivo(b) ? 0 : 1;
      if (aa !== ab) return aa - ab;
      if (aa === 0) return (PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade]) || prazo(a).localeCompare(prazo(b));
      return (b.atualizadoEm ?? '').localeCompare(a.atualizadoEm ?? '') || PESO_STATUS[a.status] - PESO_STATUS[b.status];
    });
  }

  function contagem(lista) {
    const c = { total: lista.length, ativos: 0, semAtendente: 0, aguardando: 0, atrasados: 0, resolvidos: 0 };
    STATUS_CHAMADO.forEach((s) => { c[s.id] = 0; });
    lista.forEach((ch) => {
      c[ch.status] += 1;
      if (ehAtivo(ch)) c.ativos += 1;
      if (ehAtivo(ch) && !ch.atendenteId) c.semAtendente += 1;
      if (ch.status === 'aguardando_solicitante') c.aguardando += 1;
      if (atrasado(ch)) c.atrasados += 1;
    });
    c.resolvidos = c.resolvido + c.fechado;
    return c;
  }

  const doSolicitante = (lista, tipo, id) => ordenar(lista.filter((c) => c.solicitante?.tipo === tipo && c.solicitante?.id === id));
  const publicas = (c) => c.interacoes.filter((i) => !i.interna);

  // Sem resposta pública do suporte ainda?
  const semPrimeiraResposta = (c) => ehAtivo(c) && !c.interacoes.some((i) => !i.interna && i.autor?.papel === 'atendente');

  // ---------- Permissões por estado ----------

  const podeAssumir = (c) => ehAtivo(c);
  const podeResponder = (c) => ehAtivo(c);
  const podeResolver = (c) => ehAtivo(c) && (!ehInstalacao(c) || progressoInstalacao(c).completo);
  const motivoNaoResolve = (c) => (ehAtivo(c) && ehInstalacao(c) && !progressoInstalacao(c).completo ? 'Marque cada software como instalado (ou não instalado, com motivo) antes de resolver.' : '');
  const podeFechar = (c) => c.status === 'resolvido';
  const podeReabrir = (c) => c.status === 'resolvido' || c.status === 'fechado';
  const podeCancelar = (c) => ehAtivo(c);
  const podeAvaliar = (c) => (c.status === 'resolvido' || c.status === 'fechado') && !c.avaliacao;
  const podeEditar = (c) => ehAtivo(c);

  // ---------- Validações ----------

  function validarAbertura(d) {
    const erros = [];
    if (!d.solicitante?.tipo || !d.solicitante?.id) erros.push({ campo: 'solicitante', mensagem: 'Escolha quem está abrindo o chamado.' });
    if (!tipoDe(d.tipo)) erros.push({ campo: 'tipo', mensagem: 'Escolha se é infraestrutura ou software.' });
    if (!categoriaDe(d.categoriaId) || categoriaDe(d.categoriaId).tipo !== d.tipo) erros.push({ campo: 'categoriaId', mensagem: 'Escolha a categoria.' });
    if (!String(d.titulo ?? '').trim()) erros.push({ campo: 'titulo', mensagem: 'Resuma o problema em uma linha.' });
    else if (d.titulo.trim().length < 8) erros.push({ campo: 'titulo', mensagem: 'Título muito curto — descreva melhor.' });
    if (!String(d.descricao ?? '').trim()) erros.push({ campo: 'descricao', mensagem: 'Conte o que aconteceu, quando e onde.' });
    if (!prioridadeDe(d.prioridade)) erros.push({ campo: 'prioridade', mensagem: 'Escolha a prioridade.' });
    if (d.categoriaId === 'instalacao') erros.push(...validarInstalacao(d));
    return erros;
  }

  function validarTexto(texto, campo = 'texto', mensagem = 'Escreva a mensagem.') {
    return String(texto ?? '').trim() ? [] : [{ campo, mensagem }];
  }

  function validarAvaliacao(d) {
    const erros = [];
    const n = Number(d.nota);
    if (!Number.isInteger(n) || n < 1 || n > 5) erros.push({ campo: 'nota', mensagem: 'Dê uma nota de 1 a 5.' });
    return erros;
  }

  // ---------- Mutações (todas retornam lista nova) ----------

  function comHistorico(c, autor, texto, em = agora()) {
    return { ...c, atualizadoEm: em, historico: [...c.historico, { em, autor: autor?.nome ?? '', texto }] };
  }
  const atualizar = (lista, id, fn) => lista.map((c) => (c.id === id ? fn(c) : c));

  function abrir(lista, d, autor, em = agora()) {
    const solicitante = { tipo: d.solicitante.tipo, id: d.solicitante.id, nome: d.solicitante.nome, papel: 'solicitante' };
    const chamado = {
      id: novoId(lista, 'ch'), numero: proximoNumero(lista),
      tipo: d.tipo, categoriaId: d.categoriaId, titulo: d.titulo.trim(), descricao: d.descricao.trim(),
      prioridade: d.prioridade, status: 'aberto', solicitante, atendenteId: null,
      salaId: d.salaId || null, equipamento: String(d.equipamento ?? '').trim(),
      instalacao: d.categoriaId === 'instalacao' ? { maquinas: d.instalacao.maquinas, quantidade: d.instalacao.maquinas === 'algumas' ? Number(d.instalacao.quantidade) : null, dataNecessaria: d.instalacao.dataNecessaria, observacao: String(d.instalacao.observacao ?? '').trim(), itens: d.instalacao.itens } : null,
      abertoEm: em, atualizadoEm: em, resolvidoEm: null, fechadoEm: null, canceladoEm: null,
      solucao: '', motivoCancelamento: '', reaberturas: 0, avaliacao: null, interacoes: [],
      historico: [{ em, autor: autor?.nome ?? solicitante.nome, texto: autor && autor.papel === 'atendente' ? `Chamado aberto pelo suporte em nome de ${solicitante.nome}.` : 'Chamado aberto.' }],
    };
    return { lista: [...lista, chamado], chamado };
  }

  function atualizarDados(lista, id, patch, autor) {
    return atualizar(lista, id, (c) => {
      const mudou = [];
      if (patch.tipo && patch.tipo !== c.tipo) mudou.push(`tipo → ${tipoDe(patch.tipo)?.nome}`);
      if (patch.categoriaId && patch.categoriaId !== c.categoriaId) mudou.push(`categoria → ${categoriaDe(patch.categoriaId)?.nome}`);
      if (patch.prioridade && patch.prioridade !== c.prioridade) mudou.push(`prioridade → ${prioridadeDe(patch.prioridade)?.nome}`);
      if (patch.titulo != null && patch.titulo.trim() !== c.titulo) mudou.push('título');
      if ((patch.salaId ?? null) !== (c.salaId ?? null)) mudou.push('local');
      const novo = { ...c, ...patch, titulo: (patch.titulo ?? c.titulo).trim(), equipamento: String(patch.equipamento ?? c.equipamento).trim() };
      return mudou.length ? comHistorico(novo, autor, `Alterou: ${mudou.join(', ')}.`) : novo;
    });
  }

  function atribuir(lista, id, atendenteId, autor) {
    const nome = Pessoas.atendente(atendenteId)?.nome ?? atendenteId;
    return atualizar(lista, id, (c) => {
      const proprio = autor?.id === atendenteId;
      const status = c.status === 'aberto' ? 'em_atendimento' : c.status;
      const texto = !atendenteId ? 'Removeu o atendente; chamado voltou para a fila.' : proprio ? 'Assumiu o chamado.' : `Atribuiu a ${nome}.`;
      return comHistorico({ ...c, atendenteId: atendenteId || null, status: atendenteId ? status : (ehAtivo(c) ? 'aberto' : c.status) }, autor, texto);
    });
  }

  // Resposta pública ou nota interna. Suporte → aguardando solicitante; solicitante → em atendimento.
  function responder(lista, id, autor, texto, interna = false, em = agora()) {
    return atualizar(lista, id, (c) => {
      const interacao = { id: idLocal('x'), em, autor: { tipo: autor.tipo, id: autor.id, nome: autor.nome, papel: autor.papel }, texto: texto.trim(), interna: !!interna };
      let novo = { ...c, interacoes: [...c.interacoes, interacao] };
      if (interna) return comHistorico(novo, autor, 'Adicionou nota interna.', em);
      if (autor.papel === 'atendente') {
        if (!c.atendenteId) novo = comHistorico({ ...novo, atendenteId: autor.id }, autor, 'Assumiu o chamado.', em);
        if (ehAtivo(c)) novo.status = 'aguardando_solicitante';
        return comHistorico(novo, autor, 'Respondeu ao solicitante.', em);
      }
      if (c.status === 'aguardando_solicitante') novo.status = 'em_atendimento';
      return comHistorico(novo, autor, 'Respondeu.', em);
    });
  }

  function resolver(lista, id, autor, solucao, em = agora()) {
    return atualizar(lista, id, (c) => comHistorico({
      ...c, status: 'resolvido', resolvidoEm: em, solucao: solucao.trim(), atendenteId: c.atendenteId ?? (autor.papel === 'atendente' ? autor.id : null),
      interacoes: [...c.interacoes, { id: idLocal('x'), em, autor: { tipo: autor.tipo, id: autor.id, nome: autor.nome, papel: autor.papel }, texto: solucao.trim(), interna: false, solucao: true }],
    }, autor, 'Marcou como resolvido.', em));
  }

  function fechar(lista, id, autor, em = agora()) {
    return atualizar(lista, id, (c) => comHistorico({ ...c, status: 'fechado', fechadoEm: em }, autor, autor.papel === 'solicitante' ? 'Confirmou a solução e fechou o chamado.' : 'Fechou o chamado.', em));
  }

  function reabrir(lista, id, autor, motivo, em = agora()) {
    return atualizar(lista, id, (c) => comHistorico({
      ...c, status: 'em_atendimento', resolvidoEm: null, fechadoEm: null, reaberturas: (c.reaberturas ?? 0) + 1,
      interacoes: [...c.interacoes, { id: idLocal('x'), em, autor: { tipo: autor.tipo, id: autor.id, nome: autor.nome, papel: autor.papel }, texto: motivo.trim(), interna: false, reabertura: true }],
    }, autor, `Reabriu o chamado: ${motivo.trim()}`, em));
  }

  function cancelar(lista, id, autor, motivo, em = agora()) {
    return atualizar(lista, id, (c) => comHistorico({ ...c, status: 'cancelado', canceladoEm: em, motivoCancelamento: motivo.trim() }, autor, `Cancelou: ${motivo.trim()}`, em));
  }

  function avaliar(lista, id, autor, nota, comentario, em = agora()) {
    return atualizar(lista, id, (c) => {
      const fechar = c.status === 'resolvido';
      const base = { ...c, avaliacao: { nota: Number(nota), comentario: String(comentario ?? '').trim(), em }, status: fechar ? 'fechado' : c.status, fechadoEm: fechar ? em : c.fechadoEm };
      return comHistorico(base, autor, `${fechar ? 'Confirmou a solução e fechou o chamado. ' : ''}Avaliação: ${nota}/5.`, em);
    });
  }

  function remover(lista, id) {
    return lista.filter((c) => c.id !== id);
  }

  // ---------- Instalação de software ----------

  const softwareDe = (id) => SOFTWARES_CATALOGO.find((s) => s.id === id) ?? null;
  const formaDe = (id) => FORMAS_INSTALACAO.find((f) => f.id === id) ?? null;
  const ehInstalacao = (c) => c.categoriaId === 'instalacao';
  const statusItemDe = (id) => STATUS_ITEM_INSTALACAO.find((s) => s.id === id) ?? null;

  function validarInstalacao(d) {
    const erros = [];
    const inst = d.instalacao ?? {};
    if (!d.salaId) erros.push({ campo: 'salaId', mensagem: 'Em qual sala/laboratório?' });
    if (!inst.dataNecessaria) erros.push({ campo: 'dataNecessaria', mensagem: 'Para quando precisa (data da primeira aula)?' });
    else if (d.abertoEm && inst.dataNecessaria < d.abertoEm.slice(0, 10)) erros.push({ campo: 'dataNecessaria', mensagem: 'A data já passou.' });
    if (!['todas', 'algumas'].includes(inst.maquinas)) erros.push({ campo: 'maquinas', mensagem: 'Todas as máquinas ou só algumas?' });
    if (inst.maquinas === 'algumas' && !(Number(inst.quantidade) > 0)) erros.push({ campo: 'quantidade', mensagem: 'Quantas máquinas?' });
    if (!inst.itens?.length) erros.push({ campo: 'softwares', mensagem: 'Marque ao menos um software (ou descreva outro).' });
    return erros;
  }

  // Monta os itens a partir dos ids do catálogo + "outros" digitados (um por linha).
  function montarItens(softwareIds = [], outros = '') {
    const doCatalogo = softwareIds.map(softwareDe).filter(Boolean).map((s) => ({ softwareId: s.id, nome: s.nome, versao: s.versao, status: 'pendente', em: null, por: null, observacao: '' }));
    const extras = String(outros ?? '').split('\n').map((l) => l.trim()).filter(Boolean).map((nome, i) => ({ softwareId: `outro-${i + 1}`, nome, versao: '', status: 'pendente', em: null, por: null, observacao: '' }));
    return [...doCatalogo, ...extras];
  }

  function progressoInstalacao(c) {
    const itens = c.instalacao?.itens ?? [];
    const cont = { total: itens.length, pendente: 0, instalado: 0, problema: 0, nao_instalado: 0 };
    itens.forEach((i) => { cont[i.status] = (cont[i.status] ?? 0) + 1; });
    cont.concluidos = cont.instalado + cont.nao_instalado;
    cont.pct = cont.total ? Math.round((cont.instalado / cont.total) * 100) : 0;
    cont.completo = cont.total > 0 && cont.pendente === 0 && cont.problema === 0;
    return cont;
  }

  // Aula já passou e ainda há item pendente/com problema?
  const instalacaoAtrasada = (c, ref = agora()) => ehInstalacao(c) && ehAtivo(c) && !!c.instalacao?.dataNecessaria && c.instalacao.dataNecessaria < ref.slice(0, 10) && !progressoInstalacao(c).completo;

  // Instalação concluída depois da data da aula?
  function instalacaoTerminouTarde(c) {
    if (!ehInstalacao(c) || !c.instalacao?.dataNecessaria) return null;
    const fins = (c.instalacao.itens ?? []).map((i) => i.em).filter(Boolean);
    if (!fins.length || progressoInstalacao(c).pendente) return c.resolvidoEm ? c.resolvidoEm.slice(0, 10) > c.instalacao.dataNecessaria : null;
    return fins.sort().at(-1).slice(0, 10) > c.instalacao.dataNecessaria;
  }

  const instalacaoIncompleta = (c) => ehInstalacao(c) && (c.instalacao?.itens ?? []).some((i) => i.status === 'nao_instalado' || i.status === 'problema');

  function marcarItem(lista, id, softwareId, status, autor, observacao = '', em = agora()) {
    return atualizar(lista, id, (c) => {
      const itens = (c.instalacao?.itens ?? []).map((i) => (i.softwareId === softwareId ? { ...i, status, em: status === 'pendente' ? null : em, por: status === 'pendente' ? null : autor.nome, observacao: String(observacao ?? '').trim() } : i));
      const item = itens.find((i) => i.softwareId === softwareId);
      const novo = { ...c, instalacao: { ...c.instalacao, itens }, status: c.status === 'aberto' ? 'em_atendimento' : c.status, atendenteId: c.atendenteId ?? autor.id };
      return comHistorico(novo, autor, `${item.nome}: ${statusItemDe(status)?.nome.toLowerCase()}${observacao ? ` — ${String(observacao).trim()}` : ''}.`, em);
    });
  }

  // Histórico global de instalações (para KPIs e consulta): um registro por item.
  function historicoInstalacoes(lista) {
    const linhas = [];
    lista.filter(ehInstalacao).forEach((c) => (c.instalacao?.itens ?? []).forEach((i) => linhas.push({
      chamadoId: c.id, numero: c.numero, titulo: c.titulo, salaId: c.salaId, solicitante: c.solicitante, dataNecessaria: c.instalacao.dataNecessaria, abertoEm: c.abertoEm,
      softwareId: i.softwareId, nome: i.nome, versao: i.versao, status: i.status, em: i.em, por: i.por, observacao: i.observacao,
      tarde: i.em ? i.em.slice(0, 10) > c.instalacao.dataNecessaria : (c.instalacao.dataNecessaria < agora().slice(0, 10) && i.status === 'pendente'),
    })));
    return linhas.sort((a, b) => (b.em ?? b.abertoEm).localeCompare(a.em ?? a.abertoEm));
  }

  // ---------- Indicadores ----------

  function indicadores(lista) {
    const encerrados = lista.filter((c) => c.resolvidoEm);
    const tempos = encerrados.map(tempoResolucao).filter((h) => h != null);
    const avaliados = lista.filter((c) => c.avaliacao);
    return {
      tempoMedioHoras: tempos.length ? tempos.reduce((s, h) => s + h, 0) / tempos.length : null,
      notaMedia: avaliados.length ? avaliados.reduce((s, c) => s + c.avaliacao.nota, 0) / avaliados.length : null,
      avaliados: avaliados.length,
      dentroDoPrazo: encerrados.length ? encerrados.filter((c) => horasEntre(prazo(c), c.resolvidoEm) <= 0).length / encerrados.length : null,
    };
  }

  // ---------- KPIs (tela do administrador) ----------

  const Kpis = (() => {
    const semanaDe = (iso) => { const d = paraData(iso); const dia = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dia); d.setHours(12, 0, 0, 0); return d.toISOString().slice(0, 10); };
    const media = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
    const pctDe = (n, d) => (d ? Math.round((n / d) * 100) : null);

    function periodo(lista, dias, ref = agora()) {
      const inicio = somarHoras(ref, -dias * 24);
      return lista.filter((c) => c.abertoEm >= inicio);
    }

    function resumo(lista) {
      const enc = lista.filter((c) => c.resolvidoEm);
      const av = lista.filter((c) => c.avaliacao);
      const inst = lista.filter(ehInstalacao);
      const instEnc = inst.filter((c) => c.resolvidoEm);
      return {
        total: lista.length, ativos: lista.filter(ehAtivo).length, atrasados: lista.filter((c) => atrasado(c)).length, semAtendente: lista.filter((c) => ehAtivo(c) && !c.atendenteId).length,
        semResposta: lista.filter(semPrimeiraResposta).length, reabertos: lista.filter((c) => c.reaberturas > 0).length,
        tempoMedioHoras: media(enc.map(tempoResolucao)), dentroSla: pctDe(enc.filter((c) => horasEntre(prazo(c), c.resolvidoEm) <= 0).length, enc.length),
        notaMedia: media(av.map((c) => c.avaliacao.nota)), avaliados: av.length, taxaAvaliacao: pctDe(av.length, lista.filter((c) => c.status === 'fechado').length),
        insatisfeitos: pctDe(av.filter((c) => c.avaliacao.nota <= 2).length, av.length),
        instalacoes: inst.length, instalacoesTarde: instEnc.filter((c) => instalacaoTerminouTarde(c)).length, instalacoesIncompletas: instEnc.filter(instalacaoIncompleta).length,
        pctInstalacaoNoPrazo: pctDe(instEnc.filter((c) => instalacaoTerminouTarde(c) === false && !instalacaoIncompleta(c)).length, instEnc.length),
        antecedenciaMediaDias: media(inst.map((c) => horasEntre(c.abertoEm, `${c.instalacao.dataNecessaria}T19:00`) / 24)),
        pedidosTardios: inst.filter((c) => horasEntre(c.abertoEm, `${c.instalacao.dataNecessaria}T19:00`) / 24 <= 1.5).length,
      };
    }

    function porSemana(lista, semanas = 10, ref = agora()) {
      const out = [];
      for (let i = semanas - 1; i >= 0; i -= 1) {
        const ini = semanaDe(somarHoras(ref, -i * 7 * 24));
        const fim = somarHoras(`${ini}T00:00`, 7 * 24).slice(0, 10);
        out.push({ semana: ini, abertos: lista.filter((c) => c.abertoEm.slice(0, 10) >= ini && c.abertoEm.slice(0, 10) < fim).length, resolvidos: lista.filter((c) => c.resolvidoEm && c.resolvidoEm.slice(0, 10) >= ini && c.resolvidoEm.slice(0, 10) < fim).length });
      }
      return out;
    }

    function porCategoria(lista) {
      return CATEGORIAS_CHAMADO.map((cat) => {
        const l = lista.filter((c) => c.categoriaId === cat.id);
        const enc = l.filter((c) => c.resolvidoEm);
        return { id: cat.id, nome: cat.nome, tipo: cat.tipo, total: l.length, ativos: l.filter(ehAtivo).length, tempoMedioHoras: media(enc.map(tempoResolucao)), dentroSla: pctDe(enc.filter((c) => horasEntre(prazo(c), c.resolvidoEm) <= 0).length, enc.length), notaMedia: media(l.filter((c) => c.avaliacao).map((c) => c.avaliacao.nota)) };
      }).filter((x) => x.total).sort((a, b) => b.total - a.total);
    }

    function porPrioridade(lista) {
      return PRIORIDADES_CHAMADO.map((p) => {
        const enc = lista.filter((c) => c.prioridade === p.id && c.resolvidoEm);
        return { id: p.id, nome: p.nome, slaHoras: p.slaHoras, total: lista.filter((c) => c.prioridade === p.id).length, tempoMedioHoras: media(enc.map(tempoResolucao)), dentroSla: pctDe(enc.filter((c) => horasEntre(prazo(c), c.resolvidoEm) <= 0).length, enc.length) };
      });
    }

    function porSolicitanteTipo(lista) {
      return TIPOS_SOLICITANTE.map((t) => { const l = lista.filter((c) => c.solicitante?.tipo === t.id); return { id: t.id, nome: t.plural, total: l.length, notaMedia: media(l.filter((c) => c.avaliacao).map((c) => c.avaliacao.nota)) }; });
    }

    function porAtendente(lista) {
      const ids = [...new Set(lista.map((c) => c.atendenteId).filter(Boolean))];
      return ids.map((id) => {
        const l = lista.filter((c) => c.atendenteId === id); const enc = l.filter((c) => c.resolvidoEm);
        return { id, nome: Pessoas.atendente(id)?.nome ?? id, total: l.length, ativos: l.filter(ehAtivo).length, tempoMedioHoras: media(enc.map(tempoResolucao)), dentroSla: pctDe(enc.filter((c) => horasEntre(prazo(c), c.resolvidoEm) <= 0).length, enc.length), notaMedia: media(l.filter((c) => c.avaliacao).map((c) => c.avaliacao.nota)) };
      }).sort((a, b) => b.total - a.total);
    }

    const notas = (lista) => [1, 2, 3, 4, 5].map((n) => ({ nota: n, total: lista.filter((c) => c.avaliacao?.nota === n).length }));

    function porSoftware(lista) {
      const linhas = historicoInstalacoes(lista);
      const ids = [...new Set(linhas.map((l) => l.softwareId))];
      return ids.map((id) => {
        const l = linhas.filter((x) => x.softwareId === id);
        return { id, nome: l[0].nome, pedidos: l.length, instalados: l.filter((x) => x.status === 'instalado').length, problemas: l.filter((x) => x.status === 'problema').length, naoInstalados: l.filter((x) => x.status === 'nao_instalado').length, tarde: l.filter((x) => x.tarde).length, pctOk: pctDe(l.filter((x) => x.status === 'instalado' && !x.tarde).length, l.length) };
      }).sort((a, b) => b.pedidos - a.pedidos);
    }

    // Antecedência do pedido (dias entre abrir e a aula) × resultado.
    function antecedencia(lista) {
      const faixas = [{ id: 'd0', nome: 'Mesmo dia / véspera', max: 1.5 }, { id: 'd2', nome: '2–3 dias', max: 3 }, { id: 'd5', nome: '4–7 dias', max: 7 }, { id: 'd8', nome: '8+ dias', max: Infinity }];
      const inst = lista.filter((c) => ehInstalacao(c) && c.resolvidoEm);
      return faixas.map((f, i) => {
        const min = i ? faixas[i - 1].max : -Infinity;
        const l = inst.filter((c) => { const d = horasEntre(c.abertoEm, `${c.instalacao.dataNecessaria}T19:00`) / 24; return d > min && d <= f.max; });
        return { ...f, total: l.length, ok: l.filter((c) => instalacaoTerminouTarde(c) === false && !instalacaoIncompleta(c)).length, tarde: l.filter((c) => instalacaoTerminouTarde(c)).length, incompletos: l.filter(instalacaoIncompleta).length, notaMedia: media(l.filter((c) => c.avaliacao).map((c) => c.avaliacao.nota)) };
      });
    }

    function motivosNaoInstalacao(lista) {
      const m = {};
      historicoInstalacoes(lista).filter((l) => l.status !== 'instalado' && l.observacao).forEach((l) => { m[l.observacao] = (m[l.observacao] ?? 0) + 1; });
      return Object.entries(m).map(([motivo, total]) => ({ motivo, total })).sort((a, b) => b.total - a.total);
    }

    // Recomendações geradas por regras simples sobre os números.
    function recomendacoes(lista) {
      const r = resumo(lista); const out = [];
      const ant = antecedencia(lista);
      if (r.instalacoes && r.pctInstalacaoNoPrazo != null && r.pctInstalacaoNoPrazo < 70) out.push({ nivel: 'critico', titulo: `Só ${r.pctInstalacaoNoPrazo}% das instalações ficaram prontas e completas antes da aula`, texto: `${r.instalacoesTarde} terminaram depois da data da aula e ${r.instalacoesIncompletas} ficaram com software faltando. Sugestão: checklist padrão por curso (kit de softwares) gerado automaticamente ao criar a turma, com prazo 5 dias úteis antes da 1ª aula.` });
      if (r.pedidosTardios / Math.max(1, r.instalacoes) > 0.3) out.push({ nivel: 'serio', titulo: `${r.pedidosTardios} de ${r.instalacoes} pedidos de instalação chegaram com 1 dia ou menos de antecedência`, texto: `Antecedência média de ${r.antecedenciaMediaDias == null ? '—' : r.antecedenciaMediaDias.toFixed(1)} dias. Faixa "mesmo dia/véspera": ${ant[0].ok} de ${ant[0].total} deram certo. Sugestão: bloquear a agenda da sala até o kit estar instalado e lembrar o instrutor 7 dias antes.` });
      const sw = porSoftware(lista).filter((s) => s.pedidos >= 3 && s.pctOk != null && s.pctOk < 60).slice(0, 3);
      if (sw.length) out.push({ nivel: 'serio', titulo: `Softwares que mais falham: ${sw.map((s) => `${s.nome} (${s.pctOk}% ok)`).join(', ')}`, texto: 'Sugestão: deixá-los na imagem padrão do laboratório ou preparar instalador offline/script em lote — ver observações do catálogo.' });
      if (r.dentroSla != null && r.dentroSla < 80) out.push({ nivel: 'serio', titulo: `${100 - r.dentroSla}% dos chamados estouraram o prazo (SLA)`, texto: 'Ver por prioridade e por categoria abaixo; se a equipe é uma pessoa só, o SLA de "alta" (8 h) pode estar irreal.' });
      if (r.semResposta) out.push({ nivel: 'atencao', titulo: `${r.semResposta} chamado(s) em aberto sem nenhuma resposta do suporte`, texto: 'Primeira resposta em até 2 h, mesmo que seja "recebi, vou olhar".' });
      if (r.insatisfeitos != null && r.insatisfeitos >= 20) out.push({ nivel: 'atencao', titulo: `${r.insatisfeitos}% das avaliações são nota 1 ou 2`, texto: 'Ler os comentários — quase todos falam de aula que começou sem o software.' });
      if (r.taxaAvaliacao != null && r.taxaAvaliacao < 60) out.push({ nivel: 'info', titulo: `Só ${r.taxaAvaliacao}% dos chamados fechados foram avaliados`, texto: 'Pedir avaliação ao fechar (portal) para os KPIs de satisfação serem representativos.' });
      if (!out.length) out.push({ nivel: 'ok', titulo: 'Nenhum alerta no período', texto: 'Indicadores dentro das metas.' });
      return out;
    }

    return { periodo, resumo, porSemana, porCategoria, porPrioridade, porSolicitanteTipo, porAtendente, notas, porSoftware, antecedencia, motivosNaoInstalacao, recomendacoes };
  })();

  return {
    carregar, salvar, normalizar, porId, porNumero, proximoNumero, agora,
    tipoDe, categoriaDe, categoriasDe, prioridadeDe, statusDe, tipoSolicitanteDe, paginaDe,
    ehAtivo, ehEncerrado, ATIVOS, ENCERRADOS,
    fmtData, fmtHora, fmtDataHora, duracao, relativo, horasEntre, somarHoras,
    prazo, atrasado, horasParaPrazo, tempoResolucao,
    filtrar, ordenar, contagem, doSolicitante, publicas, semPrimeiraResposta, indicadores,
    podeAssumir, podeResponder, podeResolver, motivoNaoResolve, podeFechar, podeReabrir, podeCancelar, podeAvaliar, podeEditar,
    softwareDe, formaDe, ehInstalacao, statusItemDe, validarInstalacao, montarItens, progressoInstalacao, instalacaoAtrasada, instalacaoTerminouTarde, instalacaoIncompleta, marcarItem, historicoInstalacoes, Kpis,
    validarAbertura, validarTexto, validarAvaliacao,
    abrir, atualizarDados, atribuir, responder, resolver, fechar, reabrir, cancelar, avaliar, remover,
    Pessoas,
  };
})();
