// ============================================================
// Motor da tela "Clientes": regras puras (sem DOM) para empresas e alunos.
// Persistência em localStorage — trocar o sufixo da chave força reset.
// ============================================================

const Clientes = (() => {
  const CHAVE = 'aulor-v1-clientes-v5';

  const clonar = (x) => JSON.parse(JSON.stringify(x));

  // Garante os campos novos (inadimplência, necessidades, responsáveis) em dados salvos por versões anteriores.
  function completar(dados) {
    const base = {
      ...dados,
      empresas: dados.empresas.map((e) => ({ ...e, inadimplencia: { ...inadimplenciaVazia(), ...(e.inadimplencia ?? {}) }, convite: e.convite ?? null, cadastro: e.cadastro ?? null })),
      alunos: dados.alunos.map((a) => ({ ...a, inadimplencia: { ...inadimplenciaVazia(), ...(a.inadimplencia ?? {}) }, necessidades: { ...necessidadesVazias(), ...(a.necessidades ?? {}) }, convite: a.convite ?? null, responsaveis: a.responsaveis ?? [] })),
      responsaveis: (dados.responsaveis ?? []).map((r) => responsavelSeed(r)),
    };
    return migrarResponsaveisFinanceiros(base);
  }

  // Aluno com "quem paga = outra pessoa" preenchido à mão (versões antigas ou cadastro público) e sem vínculo
  // com papel financeiro: cria/reaproveita o cadastro do responsável pelo CPF e vincula como financeiro.
  function migrarResponsaveisFinanceiros(dados) {
    let d = dados;
    dados.alunos.forEach((a) => {
      if (a.pagador !== 'terceiro' || !a.responsavel?.nome || !cpfValido(a.responsavel.cpf)) return;
      if (a.responsaveis.some((v) => v.papeis.includes('financeiro'))) return;
      const cpf = digitos(a.responsavel.cpf);
      let r = d.responsaveis.find((x) => x.cpf === cpf);
      if (!r) {
        r = responsavelSeed({ id: novoId(d.responsaveis, 'r'), nome: a.responsavel.nome, cpf, email: a.responsavel.email ?? '', celular: digitos(a.responsavel.celular), endereco: { ...a.endereco } });
        d = { ...d, responsaveis: [...d.responsaveis, r] };
      }
      const parentesco = PARENTESCOS.find((p) => normalizar(p.nome) === normalizar(a.responsavel.parentesco))?.id ?? (a.responsavel.parentesco ? 'outro' : '');
      const papeis = menorDeIdade(a.nascimento) ? ['legal', 'financeiro'] : ['financeiro'];
      const existente = a.responsaveis.find((v) => v.responsavelId === r.id);
      const vinculos = existente
        ? a.responsaveis.map((v) => (v.responsavelId === r.id ? { ...v, papeis: [...new Set([...v.papeis, ...papeis])] } : v))
        : [...a.responsaveis, { responsavelId: r.id, parentesco, papeis, principal: a.responsaveis.length === 0 }];
      d = atualizarAluno(d, a.id, { responsaveis: vinculos });
    });
    return d;
  }

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return completar(JSON.parse(salvo));
    } catch (_) { /* volta para a semente */ }
    return completar({ empresas: clonar(EMPRESAS_SEED), alunos: clonar(ALUNOS_SEED), responsaveis: clonar(RESPONSAVEIS_SEED) });
  }

  function salvar(dados) {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  }

  function normalizar(texto) {
    return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  const digitos = (v) => String(v ?? '').replace(/\D/g, '');

  function novoId(lista, prefixo) {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  }

  const porId = (lista, id) => lista.find((x) => x.id === id) ?? null;

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

  function fmtCpf(v) { const d = digitos(v); return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : v || ''; }
  function fmtCnpj(v) { if (typeof Documento !== 'undefined') return Documento.fmtCnpj(v); const d = digitos(v); return d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : v || ''; }
  function fmtCep(v) { const d = digitos(v); return d.length === 8 ? d.replace(/(\d{5})(\d{3})/, '$1-$2') : v || ''; }
  function fmtTelefone(v) {
    const d = digitos(v);
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return v || '';
  }
  function fmtData(iso) {
    return iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '';
  }
  function idade(iso) {
    if (!iso) return null;
    const n = new Date(`${iso}T12:00:00`); const h = new Date();
    let a = h.getFullYear() - n.getFullYear();
    if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) a -= 1;
    return a;
  }
  const menorDeIdade = (iso) => { const a = idade(iso); return a != null && a < 18; };

  function enderecoCompleto(e) {
    return Boolean(e && digitos(e.cep).length === 8 && e.logradouro.trim() && e.numero.trim() && e.bairro.trim() && e.cidade.trim() && e.uf);
  }

  function enderecoLinha(e) {
    if (!e || !e.logradouro) return '';
    return `${e.logradouro}, ${e.numero}${e.complemento ? ` – ${e.complemento}` : ''} · ${e.bairro} · ${e.cidade}/${e.uf} · CEP ${fmtCep(e.cep)}`;
  }

  // ---------- Empresas ----------

  // `devedor` como em filtrarAlunos: a tela passa um que também lê os contratos.
  function filtrarEmpresas(empresas, alunos, { busca = '', status = '', segmento = '', financeiro = '' } = {}, devedor = (e) => e.inadimplencia.devedor) {
    const termo = normalizar(busca);
    const termoDig = /\d/.test(busca) ? limparCnpj(busca) : ''; // só busca por CNPJ quando o termo tem número
    return empresas
      .filter((e) => !termo || normalizar(`${e.razaoSocial} ${e.nomeFantasia} ${e.endereco.cidade} ${e.contatos.map((c) => c.nome).join(' ')}`).includes(termo) || (termoDig && limparCnpj(e.cnpj).includes(termoDig)))
      .filter((e) => !status || e.status === status)
      .filter((e) => !financeiro || (financeiro === 'devedor') === Boolean(devedor(e)))
      .filter((e) => !segmento || e.segmento === segmento)
      .sort((a, b) => (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial, 'pt-BR'));
  }

  const alunosDaEmpresa = (alunos, empresaId) => alunos.filter((a) => a.empresaId === empresaId).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const contatoPrincipal = (e) => e.contatos.find((c) => c.principal) ?? e.contatos[0] ?? null;
  const contatoFinanceiro = (e) => e.contatos.find((c) => c.papel === 'financeiro') ?? null;

  // O que falta para a empresa fechar contrato e receber boleto/NF.
  function pendenciasEmpresa(e) {
    const p = [];
    if (!cnpjValido(e.cnpj)) p.push('CNPJ válido');
    if (!enderecoCompleto(e.endereco)) p.push('Endereço completo');
    if (!e.cobranca.emailCobranca && !e.email) p.push('E-mail de cobrança');
    if (!contatoPrincipal(e)) p.push('Pessoa de contato');
    if (!contatoFinanceiro(e) && !e.cobranca.emailCobranca) p.push('Contato financeiro');
    return p;
  }

  function validarEmpresa(d, empresas, idAtual = null) {
    const erros = [];
    const outros = empresas.filter((e) => e.id !== idAtual);
    const razao = String(d.razaoSocial ?? '').trim();
    const cnpj = limparCnpj(d.cnpj);
    if (!razao) erros.push({ campo: 'razaoSocial', mensagem: 'Informe a razão social.' });
    else if (outros.some((e) => normalizar(e.razaoSocial) === normalizar(razao))) erros.push({ campo: 'razaoSocial', mensagem: 'Já existe uma empresa com essa razão social.' });
    if (!cnpj) erros.push({ campo: 'cnpj', mensagem: 'Informe o CNPJ.' });
    else if (!cnpjValido(cnpj)) erros.push({ campo: 'cnpj', mensagem: erroCnpj(cnpj) });
    else if (outros.some((e) => limparCnpj(e.cnpj) === cnpj)) erros.push({ campo: 'cnpj', mensagem: 'CNPJ já utilizado em outro cadastro.' });
    if (!emailValido(d.email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    if (d.status && !STATUS_CLIENTE.some((s) => s.id === d.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    return erros;
  }

  function limparEmpresa(d) {
    return {
      razaoSocial: String(d.razaoSocial).trim(),
      nomeFantasia: String(d.nomeFantasia ?? '').trim(),
      cnpj: limparCnpj(d.cnpj),
      inscricaoEstadual: String(d.inscricaoEstadual ?? '').trim(),
      site: String(d.site ?? '').trim(),
      porte: d.porte || null,
      segmento: d.segmento || null,
      origem: d.origem || null,
      email: String(d.email ?? '').trim(),
      telefone: digitos(d.telefone),
      observacoes: String(d.observacoes ?? '').trim(),
      ...(d.status ? { status: d.status } : {}),
    };
  }

  function incluirEmpresa(dados, d) {
    const empresa = empresaSeed({ id: novoId(dados.empresas, 'e'), ...limparEmpresa(d) });
    return { dados: { ...dados, empresas: [...dados.empresas, empresa] }, empresa };
  }

  function atualizarEmpresa(dados, id, patch) {
    return { ...dados, empresas: dados.empresas.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
  }

  const atualizarDadosEmpresa = (dados, id, d) => atualizarEmpresa(dados, id, limparEmpresa(d));

  // Excluir empresa desvincula os alunos (eles continuam cadastrados).
  function removerEmpresa(dados, id) {
    return {
      empresas: dados.empresas.filter((e) => e.id !== id),
      alunos: dados.alunos.map((a) => (a.empresaId === id ? { ...a, empresaId: null, cargo: '', pagador: a.pagador === 'empresa' ? 'proprio' : a.pagador } : a)),
    };
  }

  function validarEndereco(e) {
    const erros = [];
    const cep = digitos(e.cep);
    if (cep && cep.length !== 8) erros.push({ campo: 'cep', mensagem: 'CEP com 8 dígitos.' });
    if (e.uf && !UFS.includes(e.uf)) erros.push({ campo: 'uf', mensagem: 'UF inválida.' });
    return erros;
  }

  function limparEndereco(e) {
    return {
      cep: digitos(e.cep), logradouro: String(e.logradouro ?? '').trim(), numero: String(e.numero ?? '').trim(), complemento: String(e.complemento ?? '').trim(),
      bairro: String(e.bairro ?? '').trim(), cidade: String(e.cidade ?? '').trim(), uf: e.uf || '',
    };
  }

  function validarCobrancaEmpresa(c) {
    const erros = [];
    if (!emailValido(c.emailCobranca)) erros.push({ campo: 'emailCobranca', mensagem: 'E-mail inválido.' });
    const dia = c.diaVencimento === '' || c.diaVencimento == null ? null : Number(c.diaVencimento);
    if (dia != null && (!Number.isInteger(dia) || dia < 1 || dia > 31)) erros.push({ campo: 'diaVencimento', mensagem: 'Dia entre 1 e 31.' });
    return erros;
  }

  function atualizarEnderecoCobrancaEmpresa(dados, id, { endereco, cobranca }) {
    const dia = cobranca.diaVencimento === '' || cobranca.diaVencimento == null ? null : Number(cobranca.diaVencimento);
    return atualizarEmpresa(dados, id, {
      endereco: limparEndereco(endereco),
      cobranca: { emailCobranca: String(cobranca.emailCobranca ?? '').trim(), formaPreferida: cobranca.formaPreferida || null, diaVencimento: dia, exigePedidoCompra: Boolean(cobranca.exigePedidoCompra), observacoes: String(cobranca.observacoes ?? '').trim() },
    });
  }

  // Contatos (pessoas) da empresa.
  function validarContato(c) {
    const erros = [];
    if (!String(c.nome ?? '').trim()) erros.push({ campo: 'nome', mensagem: 'Informe o nome.' });
    if (!c.papel) erros.push({ campo: 'papel', mensagem: 'Escolha o papel.' });
    if (!emailValido(c.email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    if (!String(c.email ?? '').trim() && !digitos(c.celular)) erros.push({ campo: 'email', mensagem: 'Informe e-mail ou celular.' });
    return erros;
  }

  function limparContato(c) {
    return { nome: String(c.nome).trim(), papel: c.papel, cargo: String(c.cargo ?? '').trim(), email: String(c.email ?? '').trim(), celular: digitos(c.celular), principal: Boolean(c.principal) };
  }

  function salvarContato(dados, empresaId, contatoId, c) {
    const e = porId(dados.empresas, empresaId);
    const limpo = limparContato(c);
    let contatos = contatoId ? e.contatos.map((x) => (x.id === contatoId ? { ...x, ...limpo } : x)) : [...e.contatos, { id: novoId(e.contatos, `${empresaId}-ct`), ...limpo }];
    if (limpo.principal) contatos = contatos.map((x) => ({ ...x, principal: contatoId ? x.id === contatoId : x === contatos[contatos.length - 1] }));
    if (!contatos.some((x) => x.principal) && contatos.length) contatos[0] = { ...contatos[0], principal: true };
    return atualizarEmpresa(dados, empresaId, { contatos });
  }

  function removerContato(dados, empresaId, contatoId) {
    const e = porId(dados.empresas, empresaId);
    const contatos = e.contatos.filter((x) => x.id !== contatoId);
    if (!contatos.some((x) => x.principal) && contatos.length) contatos[0] = { ...contatos[0], principal: true };
    return atualizarEmpresa(dados, empresaId, { contatos });
  }

  // ---------- Alunos ----------

  // `devedor` decide o filtro financeiro; a tela passa um que também lê os contratos (debitoDoAluno).
  function filtrarAlunos(alunos, empresas, { busca = '', status = '', empresaId = '', pagador = '', financeiro = '' } = {}, devedor = (a) => a.inadimplencia.devedor) {
    const termo = normalizar(busca);
    const termoDig = digitos(busca);
    return alunos
      .filter((a) => !termo || normalizar(`${a.nome} ${a.nomeSocial} ${a.email} ${a.endereco.cidade} ${porId(empresas, a.empresaId)?.nomeFantasia ?? ''}`).includes(termo) || (termoDig && (a.cpf.includes(termoDig) || a.celular.includes(termoDig))))
      .filter((a) => !status || a.status === status)
      .filter((a) => !empresaId || (empresaId === 'sem' ? !a.empresaId : a.empresaId === empresaId))
      .filter((a) => !pagador || a.pagador === pagador)
      .filter((a) => !financeiro || (financeiro === 'devedor') === Boolean(devedor(a)))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // O que falta para o aluno assinar contrato e receber boleto.
  function pendenciasAluno(a, empresas) {
    const p = [];
    if (!cpfValido(a.cpf)) p.push('CPF válido');
    if (!a.email) p.push('E-mail');
    if (!digitos(a.celular)) p.push('Celular');
    if (!a.nascimento) p.push('Data de nascimento');
    if (menorDeIdade(a.nascimento) && !(a.responsaveis ?? []).some((v) => v.papeis.includes('legal'))) p.push('Responsável legal (menor de idade)');
    if (a.pagador === 'proprio') {
      if (!enderecoCompleto(a.endereco)) p.push('Endereço completo (boleto)');
      if (menorDeIdade(a.nascimento)) p.push('Menor de idade não pode ser o pagador');
    }
    if (a.pagador === 'terceiro') {
      if (!a.responsavel.nome || !cpfValido(a.responsavel.cpf)) p.push('Responsável financeiro com CPF válido');
      if (!enderecoCompleto(a.endereco)) p.push('Endereço completo (boleto)');
    }
    if (a.pagador === 'empresa') {
      const e = porId(empresas, a.empresaId);
      if (!e) p.push('Empresa vinculada');
      else if (e.status !== 'ativo') p.push('Empresa inativa');
    }
    if (!a.consentimentos.termoAceiteEm) p.push('Aceite do termo (LGPD)');
    return p;
  }

  function validarAluno(d, alunos, idAtual = null) {
    const erros = [];
    const outros = alunos.filter((a) => a.id !== idAtual);
    const nome = String(d.nome ?? '').trim();
    const cpf = digitos(d.cpf);
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome completo.' });
    else if (nome.split(/\s+/).length < 2) erros.push({ campo: 'nome', mensagem: 'Nome e sobrenome.' });
    if (!cpf) erros.push({ campo: 'cpf', mensagem: 'Informe o CPF.' });
    else if (!cpfValido(cpf)) erros.push({ campo: 'cpf', mensagem: 'CPF inválido.' });
    else if (outros.some((a) => a.cpf === cpf)) erros.push({ campo: 'cpf', mensagem: 'CPF já utilizado em outro cadastro.' });
    if (!emailValido(d.email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    if (d.nascimento && Number.isNaN(new Date(d.nascimento).getTime())) erros.push({ campo: 'nascimento', mensagem: 'Data inválida.' });
    if (d.nascimento && new Date(d.nascimento) > new Date()) erros.push({ campo: 'nascimento', mensagem: 'Data no futuro.' });
    const cel = digitos(d.celular);
    if (cel && cel.length !== 11) erros.push({ campo: 'celular', mensagem: 'Celular com DDD (11 dígitos).' });
    if (d.status && !STATUS_CLIENTE.some((s) => s.id === d.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    return erros;
  }

  function limparAluno(d) {
    return {
      nome: String(d.nome).trim(), nomeSocial: String(d.nomeSocial ?? '').trim(), cpf: digitos(d.cpf), rg: String(d.rg ?? '').trim(),
      nascimento: d.nascimento || '', genero: d.genero || '', profissao: String(d.profissao ?? '').trim(), escolaridade: d.escolaridade || null, origem: d.origem || null,
      email: String(d.email ?? '').trim(), celular: digitos(d.celular), telefone: digitos(d.telefone), observacoes: String(d.observacoes ?? '').trim(),
      ...(d.status ? { status: d.status } : {}),
    };
  }

  function incluirAluno(dados, d) {
    const aluno = alunoSeed({ id: novoId(dados.alunos, 'a'), ...limparAluno(d), ...(d.empresaId ? { empresaId: d.empresaId, cargo: String(d.cargo ?? '').trim(), pagador: 'empresa' } : {}) });
    return { dados: { ...dados, alunos: [...dados.alunos, aluno] }, aluno };
  }

  function atualizarAluno(dados, id, patch) {
    return { ...dados, alunos: dados.alunos.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
  }

  const atualizarDadosAluno = (dados, id, d) => atualizarAluno(dados, id, limparAluno(d));

  function removerAluno(dados, id) {
    return { ...dados, alunos: dados.alunos.filter((a) => a.id !== id) };
  }

  function validarPagamentoAluno(d) {
    const erros = [];
    if (!PAGADORES.some((p) => p.id === d.pagador)) erros.push({ campo: 'pagador', mensagem: 'Escolha quem paga.' });
    if (d.pagador === 'terceiro') {
      if (d.responsavelId !== undefined) {
        // Dentro do sistema: o financeiro é um dos responsáveis vinculados ao aluno.
        if (!d.responsavelId) erros.push({ campo: 'responsavelId', mensagem: 'Escolha qual responsável paga.' });
      } else {
        // Cadastro público (link do aluno): dados digitados; viram cadastro de responsável na migração.
        if (!String(d.responsavel.nome ?? '').trim()) erros.push({ campo: 'responsavel.nome', mensagem: 'Informe o nome do responsável.' });
        if (!cpfValido(d.responsavel.cpf)) erros.push({ campo: 'responsavel.cpf', mensagem: 'CPF do responsável inválido.' });
        if (!emailValido(d.responsavel.email)) erros.push({ campo: 'responsavel.email', mensagem: 'E-mail inválido.' });
      }
    }
    if (d.pagador === 'empresa' && !d.empresaId) erros.push({ campo: 'pagador', mensagem: 'Vincule o aluno a uma empresa antes.' });
    const dia = d.cobranca.diaVencimento === '' || d.cobranca.diaVencimento == null ? null : Number(d.cobranca.diaVencimento);
    if (dia != null && (!Number.isInteger(dia) || dia < 1 || dia > 31)) erros.push({ campo: 'cobranca.diaVencimento', mensagem: 'Dia entre 1 e 31.' });
    return erros;
  }

  function atualizarEnderecoCobrancaAluno(dados, id, { endereco, pagador, responsavel, responsavelId, cobranca }) {
    const dia = cobranca.diaVencimento === '' || cobranca.diaVencimento == null ? null : Number(cobranca.diaVencimento);
    let d = atualizarAluno(dados, id, {
      endereco: limparEndereco(endereco),
      pagador,
      cobranca: { formaPreferida: cobranca.formaPreferida || null, diaVencimento: dia },
    });
    if (responsavelId !== undefined) {
      // Dentro do sistema: o papel "financeiro" passa para o responsável escolhido (ou sai de todos).
      const a = porId(d.alunos, id);
      d = atualizarAluno(d, id, { responsaveis: a.responsaveis.map((v) => ({ ...v, papeis: pagador === 'terceiro' && v.responsavelId === responsavelId ? [...new Set([...v.papeis, 'financeiro'])] : v.papeis.filter((p) => p !== 'financeiro') })) });
      return sincronizarFinanceiro(d, id);
    }
    return atualizarAluno(d, id, {
      responsavel: pagador === 'terceiro'
        ? { nome: String(responsavel.nome ?? '').trim(), cpf: digitos(responsavel.cpf), parentesco: String(responsavel.parentesco ?? '').trim(), email: String(responsavel.email ?? '').trim(), celular: digitos(responsavel.celular) }
        : { nome: '', cpf: '', parentesco: '', email: '', celular: '' },
    });
  }

  // ---------- Responsáveis (cadastro próprio) e vínculos com alunos ----------

  function filtrarResponsaveis(responsaveis, alunos, { busca = '', status = '', papel = '', vinculo = '' } = {}) {
    const termo = normalizar(busca);
    const termoDig = digitos(busca);
    const nomesAlunos = (r) => alunosDoResponsavel({ alunos, responsaveis }, r.id).map((x) => x.aluno.nome).join(' ');
    return responsaveis
      .filter((r) => !termo || normalizar(`${r.nome} ${r.email} ${r.endereco.cidade} ${nomesAlunos(r)}`).includes(termo) || (termoDig && (r.cpf.includes(termoDig) || r.celular.includes(termoDig))))
      .filter((r) => !status || r.status === status)
      .filter((r) => !papel || alunosDoResponsavel({ alunos, responsaveis }, r.id).some((x) => x.vinculo.papeis.includes(papel)))
      .filter((r) => !vinculo || (vinculo === 'sem' ? alunosDoResponsavel({ alunos, responsaveis }, r.id).length === 0 : alunosDoResponsavel({ alunos, responsaveis }, r.id).length > 0))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // Alunos vinculados a um responsável: [{ aluno, vinculo }], em ordem alfabética.
  function alunosDoResponsavel(dados, responsavelId) {
    return dados.alunos
      .flatMap((a) => { const v = (a.responsaveis ?? []).find((x) => x.responsavelId === responsavelId); return v ? [{ aluno: a, vinculo: v }] : []; })
      .sort((x, y) => x.aluno.nome.localeCompare(y.aluno.nome, 'pt-BR'));
  }

  // Responsáveis de um aluno: [{ responsavel, vinculo }], principal primeiro, depois alfabético.
  function responsaveisDoAluno(dados, alunoId) {
    const a = porId(dados.alunos, alunoId);
    if (!a) return [];
    return (a.responsaveis ?? [])
      .map((v) => ({ vinculo: v, responsavel: porId(dados.responsaveis, v.responsavelId) }))
      .filter((x) => x.responsavel)
      .sort((x, y) => Number(y.vinculo.principal) - Number(x.vinculo.principal) || x.responsavel.nome.localeCompare(y.responsavel.nome, 'pt-BR'));
  }

  const responsavelFinanceiroDoAluno = (dados, alunoId) => responsaveisDoAluno(dados, alunoId).find((x) => x.vinculo.papeis.includes('financeiro')) ?? null;

  // O que falta no cadastro do responsável para assinar contrato / receber boleto.
  function pendenciasResponsavel(r) {
    const p = [];
    if (!cpfValido(r.cpf)) p.push('CPF válido');
    if (!r.email) p.push('E-mail');
    if (!digitos(r.celular)) p.push('Celular');
    if (!enderecoCompleto(r.endereco)) p.push('Endereço completo (boleto)');
    return p;
  }

  function validarResponsavel(d, responsaveis, idAtual = null) {
    const erros = [];
    const outros = responsaveis.filter((r) => r.id !== idAtual);
    const nome = String(d.nome ?? '').trim();
    const cpf = digitos(d.cpf);
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome completo.' });
    else if (nome.split(/\s+/).length < 2) erros.push({ campo: 'nome', mensagem: 'Nome e sobrenome.' });
    if (!cpf) erros.push({ campo: 'cpf', mensagem: 'Informe o CPF.' });
    else if (!cpfValido(cpf)) erros.push({ campo: 'cpf', mensagem: 'CPF inválido.' });
    else if (outros.some((r) => r.cpf === cpf)) erros.push({ campo: 'cpf', mensagem: 'CPF já utilizado em outro cadastro.' });
    if (!emailValido(d.email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    if (d.nascimento && Number.isNaN(new Date(d.nascimento).getTime())) erros.push({ campo: 'nascimento', mensagem: 'Data inválida.' });
    if (d.nascimento && new Date(d.nascimento) > new Date()) erros.push({ campo: 'nascimento', mensagem: 'Data no futuro.' });
    const cel = digitos(d.celular);
    if (!cel) erros.push({ campo: 'celular', mensagem: 'Informe o celular.' });
    else if (cel.length !== 11) erros.push({ campo: 'celular', mensagem: 'Celular com DDD (11 dígitos).' });
    if (d.status && !STATUS_CLIENTE.some((s) => s.id === d.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    return erros;
  }

  function limparResponsavel(d) {
    return {
      nome: String(d.nome).trim(), cpf: digitos(d.cpf), rg: String(d.rg ?? '').trim(), nascimento: d.nascimento || '', profissao: String(d.profissao ?? '').trim(),
      email: String(d.email ?? '').trim(), celular: digitos(d.celular), telefone: digitos(d.telefone), observacoes: String(d.observacoes ?? '').trim(),
      ...(d.status ? { status: d.status } : {}),
    };
  }

  function incluirResponsavel(dados, d) {
    const responsavel = responsavelSeed({ id: novoId(dados.responsaveis, 'r'), ...limparResponsavel(d) });
    return { dados: { ...dados, responsaveis: [...dados.responsaveis, responsavel] }, responsavel };
  }

  function atualizarResponsavel(dados, id, patch) {
    return { ...dados, responsaveis: dados.responsaveis.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
  }

  // Dados do responsável mudaram: refaz a cópia `aluno.responsavel` de quem o tem como financeiro.
  function atualizarDadosResponsavel(dados, id, d) {
    let r = atualizarResponsavel(dados, id, limparResponsavel(d));
    alunosDoResponsavel(r, id).forEach(({ aluno }) => { r = sincronizarFinanceiro(r, aluno.id); });
    return r;
  }

  const atualizarEnderecoResponsavel = (dados, id, endereco) => atualizarResponsavel(dados, id, { endereco: limparEndereco(endereco) });

  // Só sem alunos vinculados (a UI desabilita o botão).
  function removerResponsavel(dados, id) {
    if (alunosDoResponsavel(dados, id).length) return dados;
    return { ...dados, responsaveis: dados.responsaveis.filter((r) => r.id !== id) };
  }

  function validarVinculo(v, aluno, jaVinculado = false) {
    const erros = [];
    if (!v.responsavelId) erros.push({ campo: 'responsavelId', mensagem: 'Escolha o responsável.' });
    else if (jaVinculado) erros.push({ campo: 'responsavelId', mensagem: 'Este responsável já está vinculado ao aluno.' });
    if (!PARENTESCOS.some((p) => p.id === v.parentesco)) erros.push({ campo: 'parentesco', mensagem: 'Informe o parentesco.' });
    const papeis = (v.papeis ?? []).filter((p) => PAPEIS_RESPONSAVEL.some((x) => x.id === p));
    if (!papeis.length) erros.push({ campo: 'papeis', mensagem: 'Marque pelo menos um papel.' });
    if (aluno && v.responsavelId === aluno.id) erros.push({ campo: 'responsavelId', mensagem: 'Responsável inválido.' });
    return erros;
  }

  // Cria ou atualiza o vínculo aluno × responsável. Só um "financeiro" e só um "principal" por aluno.
  // Papel financeiro ⇒ quem paga = outra pessoa; perder o papel financeiro ⇒ volta a "o próprio aluno".
  function vincularResponsavel(dados, alunoId, { responsavelId, parentesco, papeis, principal }) {
    const a = porId(dados.alunos, alunoId);
    const limpo = { responsavelId, parentesco, papeis: [...new Set(papeis)], principal: Boolean(principal) };
    const existe = a.responsaveis.some((v) => v.responsavelId === responsavelId);
    let vinculos = existe ? a.responsaveis.map((v) => (v.responsavelId === responsavelId ? { ...v, ...limpo } : v)) : [...a.responsaveis, limpo];
    if (limpo.papeis.includes('financeiro')) vinculos = vinculos.map((v) => (v.responsavelId === responsavelId ? v : { ...v, papeis: v.papeis.filter((p) => p !== 'financeiro') }));
    if (limpo.principal) vinculos = vinculos.map((v) => (v.responsavelId === responsavelId ? v : { ...v, principal: false }));
    if (!vinculos.some((v) => v.principal)) vinculos = vinculos.map((v, i) => ({ ...v, principal: i === 0 }));
    return sincronizarFinanceiro(atualizarAluno(dados, alunoId, { responsaveis: vinculos }), alunoId);
  }

  function desvincularResponsavel(dados, alunoId, responsavelId) {
    const a = porId(dados.alunos, alunoId);
    let vinculos = a.responsaveis.filter((v) => v.responsavelId !== responsavelId);
    if (vinculos.length && !vinculos.some((v) => v.principal)) vinculos = vinculos.map((v, i) => ({ ...v, principal: i === 0 }));
    return sincronizarFinanceiro(atualizarAluno(dados, alunoId, { responsaveis: vinculos }), alunoId);
  }

  // Mantém `aluno.pagador` e a cópia `aluno.responsavel` coerentes com o vínculo de papel financeiro.
  function sincronizarFinanceiro(dados, alunoId) {
    const a = porId(dados.alunos, alunoId);
    const fin = responsavelFinanceiroDoAluno(dados, alunoId);
    if (fin) {
      const { responsavel: r, vinculo: v } = fin;
      return atualizarAluno(dados, alunoId, { pagador: 'terceiro', responsavel: { nome: r.nome, cpf: r.cpf, parentesco: PARENTESCOS.find((p) => p.id === v.parentesco)?.nome ?? '', email: r.email, celular: r.celular } });
    }
    if (a.pagador === 'terceiro') return atualizarAluno(dados, alunoId, { pagador: 'proprio', responsavel: { nome: '', cpf: '', parentesco: '', email: '', celular: '' } });
    return dados;
  }

  function vincularEmpresa(dados, alunoId, empresaId, cargo = '') {
    const a = porId(dados.alunos, alunoId);
    return atualizarAluno(dados, alunoId, { empresaId, cargo: String(cargo ?? '').trim(), ...(empresaId ? {} : { pagador: a.pagador === 'empresa' ? 'proprio' : a.pagador }) });
  }

  function vincularAlunos(dados, empresaId, alunoIds) {
    return { ...dados, alunos: dados.alunos.map((a) => (alunoIds.includes(a.id) ? { ...a, empresaId } : a)) };
  }

  function atualizarConsentimentos(dados, id, c) {
    return atualizarAluno(dados, id, { consentimentos: { comunicacoes: Boolean(c.comunicacoes), imagem: Boolean(c.imagem), termoAceiteEm: c.termoAceiteEm || '' } });
  }

  // ---------- Inadimplência (aluno ou empresa) ----------

  function validarInadimplencia(i) {
    const erros = [];
    if (!i.motivo) erros.push({ campo: 'motivo', mensagem: 'Escolha o motivo.' });
    if (!i.desde) erros.push({ campo: 'desde', mensagem: 'Informe desde quando.' });
    if (i.valor !== '' && i.valor != null && !(Number(i.valor) >= 0)) erros.push({ campo: 'valor', mensagem: 'Valor inválido.' });
    return erros;
  }

  function marcarDevedor(dados, tipo, id, i) {
    const inadimplencia = { devedor: true, desde: i.desde, valor: i.valor === '' || i.valor == null ? null : Number(i.valor), motivo: i.motivo, observacoes: String(i.observacoes ?? '').trim() };
    return tipo === 'empresa' ? atualizarEmpresa(dados, id, { inadimplencia }) : atualizarAluno(dados, id, { inadimplencia });
  }

  function regularizar(dados, tipo, id) {
    const inadimplencia = inadimplenciaVazia();
    return tipo === 'empresa' ? atualizarEmpresa(dados, id, { inadimplencia }) : atualizarAluno(dados, id, { inadimplencia });
  }

  // ---------- Necessidades do aluno ----------

  function validarNecessidades(n) {
    const erros = [];
    if (n.tipos.includes('outra') && !String(n.detalhes ?? '').trim()) erros.push({ campo: 'detalhes', mensagem: 'Descreva a necessidade.' });
    return erros;
  }

  function atualizarNecessidades(dados, id, n) {
    return atualizarAluno(dados, id, { necessidades: { tipos: TIPOS_NECESSIDADE.map((t) => t.id).filter((t) => n.tipos.includes(t)), detalhes: String(n.detalhes ?? '').trim(), atendimento: String(n.atendimento ?? '').trim() } });
  }

  // ---------- Convite: o próprio aluno preenche o cadastro ----------

  const hoje = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); // data local do navegador
  const gerarToken = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

  // Gera (ou regenera) o link — um novo token invalida o anterior.
  function gerarConvite(dados, id) {
    return atualizarAluno(dados, id, { convite: { token: gerarToken(), criadoEm: hoje(), preenchidoEm: '' } });
  }

  const alunoPorToken = (dados, token) => (token ? dados.alunos.find((a) => a.convite?.token === token) ?? null : null);

  const paginaAluno = (variante) => (variante === 'passos' ? 'cadastro-aluno-steps.html' : 'cadastro-aluno.html');
  const urlConvite = (a, variante = 'formulario') => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}${paginaAluno(variante)}?token=${a.convite.token}`;

  // O que o aluno manda pela página pública: identificação + contato + endereço + quem paga + necessidades + aceite.
  function validarPreenchimentoAluno(d, alunos, idAtual) {
    const erros = validarAluno(d, alunos, idAtual);
    if (!d.nascimento) erros.push({ campo: 'nascimento', mensagem: 'Informe a data de nascimento.' });
    if (!String(d.email ?? '').trim()) erros.push({ campo: 'email', mensagem: 'Informe o e-mail.' });
    if (!digitos(d.celular)) erros.push({ campo: 'celular', mensagem: 'Informe o celular.' });
    erros.push(...validarEndereco(d.endereco), ...validarPagamentoAluno(d));
    if (d.pagador !== 'empresa' && menorDeIdade(d.nascimento) && d.pagador !== 'terceiro') erros.push({ campo: 'pagador', mensagem: 'Menor de idade precisa de um responsável financeiro.' });
    erros.push(...validarNecessidades(d.necessidades));
    if (!d.aceite) erros.push({ campo: 'aceite', mensagem: 'É preciso aceitar o termo para continuar.' });
    return erros;
  }

  function preencherPeloAluno(dados, token, d) {
    const a = alunoPorToken(dados, token);
    if (!a) return dados;
    let r = atualizarDadosAluno(dados, a.id, { ...d, origem: a.origem });
    r = atualizarEnderecoCobrancaAluno(r, a.id, { ...d, empresaId: a.empresaId });
    r = atualizarNecessidades(r, a.id, d.necessidades);
    r = atualizarConsentimentos(r, a.id, { termoAceiteEm: hoje(), comunicacoes: d.comunicacoes, imagem: d.imagem });
    r = atualizarAluno(r, a.id, { convite: { ...a.convite, preenchidoEm: new Date().toISOString() } });
    return migrarResponsaveisFinanceiros(r); // responsável digitado no formulário público vira cadastro + vínculo financeiro
  }

  // ---------- Link para a própria empresa completar o cadastro ----------

  function gerarCadastroEmpresa(dados, id) {
    return atualizarEmpresa(dados, id, { cadastro: { token: gerarToken(), criadoEm: hoje(), preenchidoEm: '' } });
  }

  const empresaPorTokenCadastro = (dados, token) => (token ? dados.empresas.find((e) => e.cadastro?.token === token) ?? null : null);
  // variante: 'formulario' (página única) ou 'passos' (stepper) — mesmo token, mesma gravação.
  const urlCadastroEmpresa = (e, variante = 'formulario') => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}${variante === 'passos' ? 'cadastro-empresa-steps.html' : 'cadastro-empresa.html'}?token=${e.cadastro.token}`;

  // O que a empresa manda: identificação + contato geral + endereço fiscal + cobrança + responsável pelo treinamento (+ financeiro).
  function validarPreenchimentoEmpresa(d, empresas, idAtual) {
    const erros = validarEmpresa(d, empresas, idAtual);
    if (!String(d.email ?? '').trim()) erros.push({ campo: 'email', mensagem: 'Informe o e-mail.' });
    if (!digitos(d.telefone)) erros.push({ campo: 'telefone', mensagem: 'Informe o telefone.' });
    erros.push(...validarEndereco(d.endereco), ...validarCobrancaEmpresa(d.cobranca));
    if (!String(d.cobranca.emailCobranca ?? '').trim()) erros.push({ campo: 'emailCobranca', mensagem: 'Informe o e-mail que recebe boleto e NF.' });
    erros.push(...validarContato(d.contatoRh).map((x) => ({ ...x, campo: `rh.${x.campo}` })));
    if (!d.mesmoFinanceiro) erros.push(...validarContato({ ...d.contatoFinanceiro, papel: 'financeiro' }).map((x) => ({ ...x, campo: `fin.${x.campo}` })));
    if (!d.aceite) erros.push({ campo: 'aceite', mensagem: 'É preciso aceitar o termo para continuar.' });
    return erros;
  }

  function preencherPelaEmpresa(dados, token, d) {
    const e = empresaPorTokenCadastro(dados, token);
    if (!e) return dados;
    let r = atualizarDadosEmpresa(dados, e.id, { ...d, origem: e.origem });
    r = atualizarEnderecoCobrancaEmpresa(r, e.id, { endereco: d.endereco, cobranca: d.cobranca });
    const rh = { ...d.contatoRh, papel: d.contatoRh.papel || 'rh', principal: true };
    const outros = e.contatos.filter((c) => digitos(c.celular) !== digitos(rh.celular) && normalizar(c.email) !== normalizar(rh.email));
    let contatos = [{ id: novoId(outros, `${e.id}-ct`), ...limparContato(rh) }];
    if (!d.mesmoFinanceiro) contatos.push({ id: novoId([...outros, ...contatos], `${e.id}-ct`), ...limparContato({ ...d.contatoFinanceiro, papel: 'financeiro', principal: false }) });
    contatos = [...contatos, ...outros.map((c) => ({ ...c, principal: false }))];
    r = atualizarEmpresa(r, e.id, { contatos, cadastro: { ...e.cadastro, preenchidoEm: new Date().toISOString() } });
    return r;
  }

  // ---------- Convite da empresa: link reutilizável para colaboradores se cadastrarem ----------

  function gerarConviteEmpresa(dados, id, { limite = null } = {}) {
    const lim = limite === '' || limite == null ? null : Number(limite);
    return atualizarEmpresa(dados, id, { convite: { token: gerarToken(), criadoEm: hoje(), ativo: true, limite: lim && lim > 0 ? lim : null, usos: [] } });
  }

  function alterarConviteEmpresa(dados, id, patch) {
    const e = porId(dados.empresas, id);
    if (!e.convite) return dados;
    const lim = patch.limite === '' || patch.limite == null ? null : Number(patch.limite);
    return atualizarEmpresa(dados, id, { convite: { ...e.convite, ...('ativo' in patch ? { ativo: Boolean(patch.ativo) } : {}), ...('limite' in patch ? { limite: lim && lim > 0 ? lim : null } : {}) } });
  }

  const empresaPorToken = (dados, token) => (token ? dados.empresas.find((e) => e.convite?.token === token) ?? null : null);
  const usosRestantes = (e) => (e.convite.limite == null ? Infinity : Math.max(0, e.convite.limite - e.convite.usos.length));
  const conviteEmpresaAberto = (e) => Boolean(e.convite && e.convite.ativo && e.status === 'ativo' && usosRestantes(e) > 0);
  const urlConviteEmpresa = (e, variante = 'formulario') => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}${paginaAluno(variante)}?empresa=${e.convite.token}`;

  // Gravação comum dos cadastros públicos que criam o aluno do zero (link da empresa, link do contrato).
  // `idReaproveitar`: aluno pré-cadastrado pela escola ainda sem preenchimento — completa em vez de duplicar.
  // Retorna { dados, alunoId }. Validar antes (validarPreenchimentoAluno).
  function cadastrarAlunoPublico(dados, d, { idReaproveitar = null, empresaId = null, origem = null, convite = {} } = {}) {
    let r = dados;
    let id = idReaproveitar;
    const orig = idReaproveitar ? (porId(dados.alunos, idReaproveitar)?.origem ?? origem) : origem;
    if (!id) {
      const inc = incluirAluno(r, { ...d, empresaId, cargo: d.cargo, origem: orig });
      r = inc.dados; id = inc.aluno.id;
    }
    r = atualizarDadosAluno(r, id, { ...d, origem: orig });
    r = atualizarAluno(r, id, empresaId ? { empresaId, cargo: String(d.cargo ?? '').trim() } : { empresaId: null, cargo: '' });
    r = atualizarEnderecoCobrancaAluno(r, id, empresaId ? { ...d, pagador: 'empresa', empresaId } : { ...d, empresaId: null });
    r = atualizarNecessidades(r, id, d.necessidades);
    r = atualizarConsentimentos(r, id, { termoAceiteEm: hoje(), comunicacoes: d.comunicacoes, imagem: d.imagem });
    r = atualizarAluno(r, id, { convite: { token: '', criadoEm: hoje(), preenchidoEm: new Date().toISOString(), ...convite } });
    return { dados: migrarResponsaveisFinanceiros(r), alunoId: id };
  }

  // Colaborador se cadastra pelo link da empresa: cria o aluno vinculado, pago pela empresa.
  // Se o CPF já existe como colaborador desta empresa ainda sem preenchimento, completa esse cadastro em vez de duplicar.
  function cadastrarPeloLinkEmpresa(dados, token, d) {
    const e = empresaPorToken(dados, token);
    if (!e || !conviteEmpresaAberto(e)) return { dados, erros: [{ campo: 'nome', mensagem: 'Este link não está mais disponível.' }] };
    const cpf = digitos(d.cpf);
    const existente = dados.alunos.find((a) => a.cpf === cpf);
    const reaproveita = existente && existente.empresaId === e.id && !existente.convite?.preenchidoEm;
    const erros = validarPreenchimentoAluno({ ...d, pagador: 'empresa', empresaId: e.id }, dados.alunos, reaproveita ? existente.id : null);
    if (erros.length) return { dados, erros };
    const agora = new Date().toISOString();
    const { dados: r0, alunoId: id } = cadastrarAlunoPublico(dados, d, { idReaproveitar: reaproveita ? existente.id : null, empresaId: e.id, origem: 'empresa', convite: { criadoEm: e.convite.criadoEm, preenchidoEm: agora, via: 'empresa' } });
    const r = atualizarEmpresa(r0, e.id, { convite: { ...e.convite, usos: [...e.convite.usos, { alunoId: id, em: agora }] } });
    return { dados: r, erros: [], alunoId: id };
  }

  const temNecessidades = (a) => a.necessidades.tipos.length > 0 || Boolean(a.necessidades.detalhes);

  function alterarStatus(dados, tipo, id, status) {
    if (tipo === 'responsavel') return atualizarResponsavel(dados, id, { status });
    return tipo === 'empresa' ? atualizarEmpresa(dados, id, { status }) : atualizarAluno(dados, id, { status });
  }

  // Histórico vem dos contratos reais (tela Contratos). `Contratos` é opcional: sem ele, listas vazias.
  function contextoContratos(dados) {
    if (typeof Contratos === 'undefined') return null;
    return { lista: Contratos.carregar(), ctx: { empresas: dados.empresas, alunos: dados.alunos, responsaveis: dados.responsaveis ?? [], cursos: Cursos.carregar(), formacoes: Formacoes.carregar() } };
  }
  function matriculasDoAluno(dados, alunoId) {
    const cc = contextoContratos(dados);
    return cc ? Contratos.historicoAluno(cc.lista, cc.ctx, alunoId) : [];
  }
  function contratosDaEmpresa(dados, empresaId) {
    const cc = contextoContratos(dados);
    return cc ? Contratos.historicoEmpresa(cc.lista, cc.ctx, empresaId).map((c) => ({ contrato: c, ctx: cc.ctx })) : [];
  }
  // Parcelas vencidas nos contratos do aluno, separadas por quem paga (Contratos.debitoDoAluno).
  // null quando a página não carrega o motor de contratos. `cc` deixa a lista montar o contexto uma vez só.
  function debitoDoAluno(dados, alunoId, cc = contextoContratos(dados)) {
    return cc ? Contratos.debitoDoAluno(cc.lista, cc.ctx, alunoId) : null;
  }
  // Débito de empresas e responsáveis pelos contratos que pagam (Contratos.debitosPorPagador); null sem o motor.
  function debitosPorPagador(dados, cc = contextoContratos(dados)) {
    return cc ? Contratos.debitosPorPagador(cc.lista, cc.ctx) : null;
  }
  // Contratos em que o aluno está (qualquer contratante) — usado para travar a exclusão.
  function contratosDoAluno(dados, alunoId) {
    const cc = contextoContratos(dados);
    return cc ? Contratos.contratosDoAluno(cc.lista, alunoId) : [];
  }
  // Aba Contratos do aluno: cada contrato com o contexto, o vínculo (pacote + situação) e o valor dos itens DESTE aluno (mais recente primeiro).
  function contratosDetalhadosDoAluno(dados, alunoId) {
    const cc = contextoContratos(dados);
    if (!cc) return [];
    return Contratos.contratosDoAluno(cc.lista, alunoId)
      .map((c) => {
        const itens = Contratos.itensDoAluno(c, alunoId);
        const vinculo = Contratos.vinculoDe(c, alunoId);
        return { contrato: c, ctx: cc.ctx, itens, vinculo, pacote: Contratos.pacoteDe(c, vinculo.pacoteId), valorAluno: Contratos.ocupaVaga(vinculo) ? itens.reduce((s, it) => s + Contratos.valorMatricula(c, it), 0) : 0 };
      })
      .sort((a, b) => b.contrato.criadoEm.localeCompare(a.contrato.criadoEm));
  }

  return {
    carregar, salvar, normalizar, digitos, porId,
    cpfValido, cnpjValido, emailValido, fmtCpf, fmtCnpj, fmtCep, fmtTelefone, fmtData, idade, menorDeIdade, enderecoCompleto, enderecoLinha,
    filtrarEmpresas, alunosDaEmpresa, contatoPrincipal, contatoFinanceiro, pendenciasEmpresa, validarEmpresa, incluirEmpresa, atualizarDadosEmpresa, removerEmpresa,
    validarEndereco, validarCobrancaEmpresa, atualizarEnderecoCobrancaEmpresa, validarContato, salvarContato, removerContato,
    filtrarAlunos, pendenciasAluno, validarAluno, incluirAluno, atualizarDadosAluno, removerAluno, validarPagamentoAluno, atualizarEnderecoCobrancaAluno,
    vincularEmpresa, vincularAlunos, atualizarConsentimentos, alterarStatus,
    filtrarResponsaveis, alunosDoResponsavel, responsaveisDoAluno, responsavelFinanceiroDoAluno, pendenciasResponsavel, validarResponsavel, incluirResponsavel, atualizarDadosResponsavel, atualizarEnderecoResponsavel, removerResponsavel,
    validarVinculo, vincularResponsavel, desvincularResponsavel,
    validarInadimplencia, marcarDevedor, regularizar, validarNecessidades, atualizarNecessidades, temNecessidades,
    gerarConvite, alunoPorToken, urlConvite, validarPreenchimentoAluno, preencherPeloAluno,
    gerarCadastroEmpresa, empresaPorTokenCadastro, urlCadastroEmpresa, validarPreenchimentoEmpresa, preencherPelaEmpresa,
    gerarConviteEmpresa, alterarConviteEmpresa, empresaPorToken, usosRestantes, conviteEmpresaAberto, urlConviteEmpresa, cadastrarPeloLinkEmpresa, cadastrarAlunoPublico, matriculasDoAluno, contratosDaEmpresa, contratosDoAluno, contratosDetalhadosDoAluno, contextoContratos, debitoDoAluno, debitosPorPagador,
  };
})();
