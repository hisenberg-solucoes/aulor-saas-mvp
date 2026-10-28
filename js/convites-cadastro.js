// ============================================================
// Convite de cadastro de instrutores e colaboradores (AULOR-007).
// A escola convida com o mínimo: nome, e-mail, perfil e os dados do papel
// que cabem a ela (remuneração do instrutor; cargo, departamento e admissão
// do colaborador). A pessoa entra com a conta do e-mail convidado e completa
// o próprio cadastro, que nasce já ligado ao acesso dela. O convite pela
// ficha (pessoaId) dá acesso a quem já está cadastrado e liga sozinho.
// Ninguém vira instrutor ou colaborador antes do envio do cadastro.
// Diferente dos outros motores, este grava direto: concluir mexe nos
// convites, nas pessoas e nos acessos de uma vez.
// Protótipo: o e-mail do convite (AULOR-002) não sai daqui; convite.html?id=
// faz o papel do link do e-mail. Depende de Instrutores, Colaboradores (e o
// Acesso dele), REMUNERACOES_INSTRUTOR e DEPARTAMENTOS.
// ============================================================

const Convites = (() => {
  const CHAVE = 'aulor-v1-convites-cadastro';
  const PRAZO_DIAS = 7;

  const hoje = () => Instrutores.hoje();
  const somarDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const norm = (s) => String(s ?? '').trim().toLowerCase();
  const digitos = (v) => String(v ?? '').replace(/\D/g, '');
  const texto = (v) => String(v ?? '').trim();
  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(v));
  const telefoneValido = (v) => !digitos(v) || [10, 11].includes(digitos(v).length);
  const nomeCompleto = (v) => texto(v).split(/\s+/).filter((p) => p.length > 1).length >= 2;

  // Um convite em cada estado que a lista mostra, com as datas contadas a partir de hoje.
  function semente() {
    const dia = (n) => somarDias(hoje(), -n);
    return [
      { id: 'cv1', papel: 'instrutor', pessoaId: null, nome: 'Marina Duarte Kowalski', email: 'marina.kowalski@exemplo.com.br', perfilId: 'professor', dados: { remuneracao: 'pj', whatsapp: '47988412201', especialidade: 'Power BI e Excel' }, estado: 'enviado', emitidoEm: dia(2) },
      { id: 'cv2', papel: 'instrutor', pessoaId: null, nome: 'Caio Henrique Lenz', email: 'caio.lenz@exemplo.com.br', perfilId: 'professor', dados: { remuneracao: 'rpa', whatsapp: '', especialidade: 'Redes Cisco' }, estado: 'enviado', emitidoEm: dia(9) },
      { id: 'cv3', papel: 'instrutor', pessoaId: null, nome: 'Letícia Ramos Prates', email: 'leticia.prates@gmail.com', perfilId: 'professor', dados: { remuneracao: 'pj', whatsapp: '47988412245', especialidade: 'UX Design' }, estado: 'aceito', emitidoEm: dia(4), aceitoEm: dia(3), usuarioId: 'leticia' },
      // Rogério já era instrutor (i5) e foi convidado de novo pelo e-mail pessoal: o CPF dele não liga sozinho (D13).
      { id: 'cv4', papel: 'instrutor', pessoaId: null, nome: 'Rogério Vidal Trindade', email: 'rogerio.vidal@gmail.com', perfilId: 'professor', dados: { remuneracao: 'pj', whatsapp: '', especialidade: '' }, estado: 'coordenacao', emitidoEm: dia(6), aceitoEm: dia(5), usuarioId: 'rogerio', envolvido: { papel: 'instrutor', id: 'i5' } },
      { id: 'cv5', papel: 'colaborador', pessoaId: null, nome: 'Paulo Sérgio Wendt', email: 'paulo.wendt@proway.com.br', perfilId: 'comercial', dados: { cargo: 'Consultor comercial', departamentoId: 'comercial', admissao: '2026-11-03', emailCorporativo: 'paulo.wendt@proway.com.br' }, estado: 'falha', emitidoEm: dia(1) },
      { id: 'cv6', papel: 'colaborador', pessoaId: null, nome: 'Sabrina Teles Hoffmann', email: 'sabrina.hoffmann@outlook.com', perfilId: 'financeiro', dados: { cargo: 'Assistente financeiro', departamentoId: 'financeiro', admissao: '2026-11-10', emailCorporativo: '' }, estado: 'enviando', emitidoEm: dia(0) },
    ];
  }

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return semente();
  }
  const salvar = (lista) => localStorage.setItem(CHAVE, JSON.stringify(lista));
  const porId = (id, lista = carregar()) => lista.find((c) => c.id === id) ?? null;

  function gravar(id, patch) {
    const lista = carregar().map((c) => (c.id === id ? { ...c, ...patch } : c));
    salvar(lista);
    return porId(id, lista);
  }

  // ---------- Estado ----------

  const expiraEm = (cv) => somarDias(cv.emitidoEm, PRAZO_DIAS);
  // O estado guardado, com o prazo de sete dias aplicado ao convite ainda não aceito.
  const situacao = (cv) => (cv.estado === 'enviado' && hoje() > expiraEm(cv) ? 'expirado' : cv.estado);
  const SITUACOES = {
    enviando: { nome: 'Enviando', descricao: 'O e-mail do convite ainda não saiu.' },
    falha: { nome: 'Falha no envio', descricao: 'O e-mail do convite não foi entregue. Confira o endereço e reenvie.', acao: true },
    enviado: { nome: 'Convite enviado', descricao: 'Esperando a pessoa aceitar o convite.' },
    expirado: { nome: 'Convite expirado', descricao: 'Sete dias sem aceite. Reenviar renova o prazo.', acao: true },
    aceito: { nome: 'Aguardando cadastro', descricao: 'Aceitou o convite e ainda não enviou o cadastro.' },
    coordenacao: { nome: 'Cadastro pela coordenação', descricao: 'O CPF ou o acesso já é de outra pessoa da unidade: a coordenação conclui pela ficha.', acao: true },
    'nao-ligado': { nome: 'Não ligado', descricao: 'Aceito, mas a pessoa ou o acesso já estava ligado a outro: ligue com Vincular usuário.', acao: true },
  };
  const situacaoDe = (cv) => {
    const s = situacao(cv);
    return { id: s, ...SITUACOES[s], ...(s === 'aceito' && cv.pessoaId ? { nome: 'Aceito' } : {}) };
  };
  const ABERTOS = ['enviando', 'falha', 'enviado', 'aceito', 'coordenacao'];
  const aberto = (cv) => ABERTOS.includes(cv.estado);
  const antesDoAceite = (cv) => ['enviando', 'falha', 'enviado'].includes(cv.estado);

  // Os convites de cadastro que a lista do papel mostra (filtro "Convidados"), pela busca de nome e e-mail.
  function daLista(papel, busca = '') {
    const termo = Instrutores.normalizar(busca);
    return carregar()
      .filter((c) => c.papel === papel && !c.pessoaId && aberto(c))
      .filter((c) => !termo || Instrutores.normalizar(`${c.nome} ${c.email}`).includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  // O último convite pela ficha da pessoa, enquanto interessa ao cartão Acesso ao sistema.
  const daFicha = (papel, pessoaId) => carregar().filter((c) => c.papel === papel && c.pessoaId === pessoaId && (aberto(c) || c.estado === 'nao-ligado')).pop() ?? null;
  // Um convite de cadastro pendente por e-mail na unidade (D14), da lista ou da ficha.
  const pendenteDoEmail = (email, excetoId = null) => carregar().find((c) => c.id !== excetoId && aberto(c) && norm(c.email) === norm(email)) ?? null;
  // O convite de cadastro que espera o envio deste e-mail (o convidado entrou e ainda não concluiu).
  const aguardando = (email) => carregar().find((c) => !c.pessoaId && c.estado === 'aceito' && norm(c.email) === norm(email)) ?? null;

  // ---------- Pessoas e acessos ----------

  const perfisAtivos = () => Colaboradores.Acesso.perfis().filter((p) => p.ativo !== false);

  // A pessoa da unidade: o colaborador, quando há (o instrutor da equipe aponta para ele), ou o instrutor de fora.
  function pessoas() {
    const instrutores = Instrutores.carregar();
    const colaboradores = Colaboradores.carregar();
    return [
      ...colaboradores.map((c) => ({ cpf: c.cpf, usuarioId: c.acesso.usuarioId, colaborador: c, instrutor: instrutores.find((i) => i.colaboradorId === c.id) ?? null })),
      ...instrutores.filter((i) => !i.colaboradorId).map((i) => ({ cpf: i.cpf, usuarioId: i.acesso?.usuarioId ?? null, colaborador: null, instrutor: i })),
    ];
  }
  // A ficha a abrir para a pessoa envolvida numa recusa: a do papel convidado, quando ela já tem.
  const fichaDe = (p, papel) => (p[papel] ? { papel, id: p[papel].id } : p.instrutor ? { papel: 'instrutor', id: p.instrutor.id } : { papel: 'colaborador', id: p.colaborador.id });

  // E-mail do convite igual ao contato de alguém do papel: avisa, sem bloquear, que o caminho é a ficha (GAC-1).
  function contatoCoincide(papel, email) {
    if (!emailValido(email)) return null;
    const r = papel === 'instrutor'
      ? Instrutores.carregar().find((i) => norm(i.contato.email) === norm(email))
      : Colaboradores.carregar().find((c) => norm(c.contato.email) === norm(email));
    return r ? { id: r.id, nome: r.nomeSocial || r.nome } : null;
  }

  // ---------- Emitir, reenviar e cancelar ----------

  // dados: os campos do formulário. Pela ficha (pessoaId), a escola só informa e-mail e perfil.
  function validar(d, { papel, pessoaId = null, excetoId = null }) {
    const erros = [];
    if (!pessoaId && !nomeCompleto(d.nome)) erros.push({ campo: 'nome', mensagem: 'Informe nome e sobrenome.' });
    const outros = carregar().filter((c) => c.id !== excetoId && aberto(c));
    const email = texto(d.email);
    const pendente = pendenteDoEmail(email, excetoId);
    if (!email) erros.push({ campo: 'email', mensagem: 'Informe o e-mail com que a pessoa vai entrar.' });
    else if (!emailValido(email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    else if (pendente) erros.push({ campo: 'email', mensagem: 'Já há um convite de cadastro pendente para este e-mail.', conviteId: pendente.id });
    if (!perfisAtivos().some((p) => p.id === d.perfilId)) erros.push({ campo: 'perfilId', mensagem: 'Escolha o perfil de acesso.' });
    if (pessoaId) return erros;
    if (papel === 'instrutor') {
      if (!REMUNERACOES_INSTRUTOR.some((r) => r.id === d.remuneracao)) erros.push({ campo: 'remuneracao', mensagem: 'Escolha a remuneração.' });
      if (!telefoneValido(d.whatsapp)) erros.push({ campo: 'whatsapp', mensagem: 'WhatsApp com DDD: 10 ou 11 dígitos.' });
      return erros;
    }
    if (!texto(d.cargo)) erros.push({ campo: 'cargo', mensagem: 'Informe o cargo.' });
    if (!DEPARTAMENTOS.some((x) => x.id === d.departamentoId)) erros.push({ campo: 'departamentoId', mensagem: 'Escolha o departamento.' });
    if (!d.admissao) erros.push({ campo: 'admissao', mensagem: 'Informe a admissão.' });
    const corp = texto(d.emailCorporativo);
    if (corp && !emailValido(corp)) erros.push({ campo: 'emailCorporativo', mensagem: 'E-mail inválido.' });
    else if (corp && (Colaboradores.carregar().some((c) => norm(c.contato.email) === norm(corp)) || outros.some((c) => c.papel === 'colaborador' && norm(c.dados?.emailCorporativo) === norm(corp)))) {
      erros.push({ campo: 'emailCorporativo', mensagem: 'E-mail corporativo de outro colaborador ou de outro convite.' });
    }
    return erros;
  }

  const dadosDoPapel = (papel, d) => (papel === 'instrutor'
    ? { remuneracao: d.remuneracao, whatsapp: digitos(d.whatsapp), especialidade: texto(d.especialidade) }
    : { cargo: texto(d.cargo), departamentoId: d.departamentoId, admissao: d.admissao, emailCorporativo: texto(d.emailCorporativo) });
  const campos = (papel, pessoaId, d) => ({ email: texto(d.email), perfilId: d.perfilId, ...(pessoaId ? {} : { nome: texto(d.nome), dados: dadosDoPapel(papel, d) }) });

  // Manda o e-mail do convite de AULOR-002 (simulado) e põe o convite na lista ou no cartão da ficha.
  function emitir(d, { papel, pessoaId = null, nome = '' }) {
    const lista = carregar();
    let n = lista.length + 1;
    while (lista.some((c) => c.id === `cv${n}`)) n += 1;
    const cv = { id: `cv${n}`, papel, pessoaId, nome, dados: {}, ...campos(papel, pessoaId, d), estado: 'enviado', emitidoEm: hoje() };
    salvar([...lista, cv]);
    return cv;
  }
  // Antes do aceite, inclusive depois de falha ou do prazo: corrige os dados e renova os sete dias.
  function reenviar(id, d) {
    const cv = porId(id);
    if (!cv || !antesDoAceite(cv)) return null;
    return gravar(id, { ...campos(cv.papel, cv.pessoaId, d), estado: 'enviado', emitidoEm: hoje() });
  }
  // Vale em qualquer estado; depois do aceite, o acesso criado continua (D12).
  const cancelar = (id) => gravar(id, { estado: 'cancelado', canceladoEm: hoje() });

  // ---------- Entrada do convidado ----------

  // A conta do e-mail: a que nasceu num aceite, a do colaborador ou a do instrutor que já tem vínculo na unidade.
  function contaDoEmail(email) {
    const e = norm(email);
    return Colaboradores.Acesso.usuarios().find((u) => norm(u.email) === e)?.id
      ?? Colaboradores.carregar().find((c) => c.acesso.usuarioId && norm(c.contato.email) === e)?.acesso.usuarioId
      ?? Instrutores.carregar().find((i) => i.acesso?.usuarioId && norm(i.contato.email) === e)?.acesso.usuarioId
      ?? null;
  }
  // Por que o convite não abre: null quando abre.
  function bloqueio(cv) {
    if (!cv || cv.estado === 'cancelado' || ['enviando', 'falha'].includes(cv.estado)) return 'indisponivel';
    if (situacao(cv) === 'expirado') return 'expirado';
    return null;
  }

  // O aceite de AULOR-002: exige o e-mail do convite; a conta nasce com o nome do convite ou é a que a pessoa
  // já tem, e ganha o perfil. Pelo convite da ficha, a mesma entrada já liga a pessoa ao acesso (GAC-6).
  function aceitar(id, email) {
    let cv = porId(id);
    const motivo = bloqueio(cv);
    if (motivo) return { erro: motivo };
    if (norm(email) !== norm(cv.email)) return { erro: 'email' };
    const temConta = Colaboradores.Acesso.usuarios().some((u) => u.id === cv.usuarioId);
    if (!antesDoAceite(cv) && (cv.estado !== 'aceito' || temConta)) return { convite: cv };
    const nome = cv.nome || nomeDaPessoa(cv);
    let usuarioId = contaDoEmail(cv.email);
    if (usuarioId) {
      const u = Colaboradores.Acesso.usuarios().find((x) => x.id === usuarioId);
      if (u && !u.perfis.includes(cv.perfilId)) Colaboradores.Acesso.definirPerfis(usuarioId, [...u.perfis, cv.perfilId]);
    } else {
      usuarioId = Colaboradores.Acesso.criar(nome, [cv.perfilId], cv.email).id;
    }
    cv = gravar(id, { estado: 'aceito', aceitoEm: hoje(), usuarioId });
    return { convite: cv.pessoaId ? ligarPelaFicha(cv) : cv };
  }

  function nomeDaPessoa(cv) {
    const r = cv.papel === 'instrutor' ? Instrutores.porId(Instrutores.carregar(), cv.pessoaId) : Colaboradores.porId(Colaboradores.carregar(), cv.pessoaId);
    return r ? r.nomeSocial || r.nome : '';
  }

  // Liga a pessoa da ficha ao acesso, a não ser que um dos dois já esteja ligado a outro (estado "não ligado").
  function ligarPelaFicha(cv) {
    const ps = pessoas();
    const p = ps.find((x) => x[cv.papel]?.id === cv.pessoaId);
    const ocupado = ps.some((x) => x !== p && x.usuarioId === cv.usuarioId);
    if (!p || p.usuarioId || ocupado) return gravar(cv.id, { estado: 'nao-ligado' });
    ligar(p, cv.usuarioId);
    return gravar(cv.id, { estado: 'concluido', concluidoEm: hoje() });
  }

  function ligar(p, usuarioId) {
    if (p.colaborador) Colaboradores.salvar(Colaboradores.vincularUsuario(Colaboradores.carregar(), p.colaborador.id, usuarioId));
    else Instrutores.salvar(Instrutores.vincularUsuario(Instrutores.carregar(), p.instrutor.id, usuarioId));
  }

  // Quem já entrou com o e-mail do convite nesta aba (convite.html e a entrada).
  const CHAVE_ENTRADA = 'aulor-v1-convidado';
  const marcarEntrada = (id, email) => sessionStorage.setItem(CHAVE_ENTRADA, JSON.stringify({ id, email: norm(email) }));
  function entrada(id) {
    try { const e = JSON.parse(sessionStorage.getItem(CHAVE_ENTRADA)); return e?.id === id ? e.email : null; } catch (_) { return null; }
  }

  // ---------- Cadastro do convidado ----------

  function validarCadastro(f, papel) {
    const erros = [];
    if (!nomeCompleto(f.nome)) erros.push({ campo: 'nome', mensagem: 'Informe nome e sobrenome.' });
    if (!digitos(f.cpf)) erros.push({ campo: 'cpf', mensagem: 'Informe o CPF.' });
    else if (!Instrutores.cpfValido(f.cpf)) erros.push({ campo: 'cpf', mensagem: 'CPF inválido.' });
    const anos = Instrutores.idade(f.nascimento);
    if (f.nascimento && (f.nascimento > hoje() || anos > 100)) erros.push({ campo: 'nascimento', mensagem: 'Data de nascimento inválida.' });
    else if (f.nascimento && papel === 'instrutor' && anos < 18) erros.push({ campo: 'nascimento', mensagem: 'Para dar aula é preciso ter 18 anos ou mais.' });
    if (papel === 'instrutor') {
      if (!telefoneValido(f.whatsapp)) erros.push({ campo: 'whatsapp', mensagem: 'WhatsApp com DDD: 10 ou 11 dígitos.' });
      if (texto(f.email) && !emailValido(f.email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    } else if (!telefoneValido(f.celular)) erros.push({ campo: 'celular', mensagem: 'Celular com DDD: 10 ou 11 dígitos.' });
    return erros;
  }

  // O envio só liga sozinho o que o próprio acesso prova (D13): CPF novo com o acesso livre, ou o CPF da pessoa
  // já ligada a esse acesso. Qualquer outro caso é recusado de vez, sem revelar ninguém, e a coordenação conclui.
  // Devolve { erros } | { recusado: true } | { convite }.
  function concluir(id, f) {
    const cv = porId(id);
    if (!cv || cv.pessoaId || cv.estado !== 'aceito') return { recusado: cv?.estado === 'coordenacao', convite: cv };
    const erros = validarCadastro(f, cv.papel);
    if (erros.length) return { erros };
    const ps = pessoas();
    const doCpf = ps.find((p) => digitos(p.cpf) === digitos(f.cpf)) ?? null;
    const doAcesso = ps.find((p) => p.usuarioId === cv.usuarioId) ?? null;
    const corp = cv.dados.emailCorporativo;
    const corpOcupado = cv.papel === 'colaborador' && corp ? ps.find((p) => p.colaborador && p !== doAcesso && norm(p.colaborador.contato.email) === norm(corp)) : null;
    const envolvido = (doCpf && doCpf !== doAcesso) ? doCpf : (doAcesso && !doCpf) ? doAcesso : corpOcupado;
    if (envolvido) {
      gravar(id, { estado: 'coordenacao', envolvido: fichaDe(envolvido, cv.papel) });
      return { recusado: true };
    }
    if (doAcesso) adicionarPapel(doAcesso, cv, f);
    else criarPessoa(cv, f);
    return { convite: gravar(id, { estado: 'concluido', concluidoEm: hoje() }) };
  }

  const contatoInstrutor = (f) => ({ email: texto(f.email), whatsapp: digitos(f.whatsapp), emergenciaNome: '', emergenciaTelefone: '' });

  function criarPessoa(cv, f) {
    if (cv.papel === 'instrutor') {
      const d = cv.dados;
      let r = Instrutores.incluir(Instrutores.carregar(), { nome: texto(f.nome), apelido: texto(f.apelido), nascimento: f.nascimento || '', cpf: f.cpf, rg: '', especialidade: d.especialidade, bio: texto(f.bio), remuneracao: d.remuneracao });
      const iid = r.instrutor.id;
      let lista = Instrutores.atualizarContato(r.lista, iid, contatoInstrutor(f));
      lista = Instrutores.vincularUsuario(lista, iid, cv.usuarioId).map((i) => (i.id === iid ? { ...i, nomeSocial: texto(f.nomeSocial), historico: [...i.historico, { em: hoje(), texto: 'Cadastro enviado pelo próprio instrutor, pelo convite' }] } : i));
      Instrutores.salvar(lista);
      return;
    }
    const d = cv.dados;
    const r = Colaboradores.incluir(Colaboradores.carregar(), { nome: f.nome, cpf: f.cpf, cargo: d.cargo, departamentoId: d.departamentoId, admissao: d.admissao, email: d.emailCorporativo });
    const cid = r.colaborador.id;
    let lista = Colaboradores.atualizarPessoais(r.lista, cid, { nomeSocial: f.nomeSocial, nascimento: f.nascimento });
    lista = Colaboradores.atualizarContato(lista, cid, { celular: f.celular });
    Colaboradores.salvar(Colaboradores.vincularUsuario(lista, cid, cv.usuarioId));
  }

  // A pessoa já ligada ao acesso ganha o papel e mantém nome, nome social, CPF e nascimento; o contato vem do formulário.
  function adicionarPapel(p, cv, f) {
    if (p[cv.papel]) return;
    if (cv.papel === 'instrutor') {
      const r = Instrutores.incluirDeColaborador(Instrutores.carregar(), p.colaborador, { remuneracao: cv.dados.remuneracao });
      const lista = Instrutores.atualizarContato(r.lista, r.instrutor.id, contatoInstrutor(f));
      Instrutores.salvar(lista.map((i) => (i.id === r.instrutor.id ? { ...i, especialidade: cv.dados.especialidade, apelido: texto(f.apelido) || i.apelido, bio: texto(f.bio) } : i)));
      return;
    }
    // O instrutor de fora passa a ser da equipe: CPF, nascimento e o acesso vão para o colaborador (docs/pessoas-papeis.md).
    const i = p.instrutor;
    const d = cv.dados;
    const r = Colaboradores.incluir(Colaboradores.carregar(), { nome: i.nome, cpf: i.cpf, cargo: d.cargo, departamentoId: d.departamentoId, admissao: d.admissao, email: d.emailCorporativo });
    let lista = Colaboradores.atualizarPessoais(r.lista, r.colaborador.id, { nomeSocial: i.nomeSocial ?? '', nascimento: i.nascimento });
    lista = Colaboradores.atualizarContato(lista, r.colaborador.id, { celular: f.celular });
    Colaboradores.salvar(Colaboradores.vincularUsuario(lista, r.colaborador.id, cv.usuarioId));
    Instrutores.salvar(Instrutores.carregar().map((x) => (x.id === i.id ? { ...x, colaboradorId: r.colaborador.id, acesso: { usuarioId: null } } : x)));
  }

  return {
    PRAZO_DIAS, carregar, salvar, porId, expiraEm, situacao, situacaoDe, antesDoAceite, daLista, daFicha, pendenteDoEmail, aguardando,
    perfisAtivos, contatoCoincide, validar, emitir, reenviar, cancelar,
    bloqueio, aceitar, marcarEntrada, entrada, validarCadastro, concluir,
  };
})();
