// ============================================================
// Motor dos templates de certificado: regras puras + render da frente e do
// verso (HTML com CSS próprio, sem Tailwind, para valer igual no admin, no
// portal do aluno e na impressão). Persistência em localStorage — trocar o
// sufixo da chave força reset. Depende de templates-certificado-data.js.
//
// Uso:
//   TemplatesCertificado.para('curso', curso)          → template a aplicar
//   TemplatesCertificado.htmlFolhas(t, dados)          → frente + verso
//   TemplatesCertificado.injetarEstilos()              → CSS das folhas (1x)
//   TemplatesCertificado.imprimir(t, dados)            → só as folhas, no @page certo
// ============================================================

const TemplatesCertificado = (() => {
  const CHAVE = 'aulor-v1-templates-certificado-v1';
  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const hojeIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const ehCor = (v) => /^#[0-9a-f]{6}$/i.test(String(v ?? ''));

  // ---------- Persistência ----------

  let cache = null;
  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return clonar(TEMPLATES_CERTIFICADO_SEED);
  }
  function salvar(l) { localStorage.setItem(CHAVE, JSON.stringify(l)); cache = null; }
  const lista = () => (cache ??= carregar());

  const porId = (l, id) => l.find((t) => t.id === id) ?? null;
  function novoId(l) {
    let n = l.length + 1;
    while (l.some((t) => t.id === `tc${n}`)) n += 1;
    return `tc${n}`;
  }

  const aplicaDe = (id) => APLICA_A_CERTIFICADO.find((a) => a.id === id) ?? null;
  const statusDe = (id) => STATUS_TEMPLATE_CERTIFICADO.find((s) => s.id === id) ?? STATUS_TEMPLATE_CERTIFICADO[0];
  const fonteDe = (id) => FONTES_CERTIFICADO.find((f) => f.id === id) ?? FONTES_CERTIFICADO[0];
  const molduraDe = (id) => MOLDURAS_CERTIFICADO.find((m) => m.id === id) ?? MOLDURAS_CERTIFICADO[0];
  const orientacaoDe = (id) => ORIENTACOES_CERTIFICADO.find((o) => o.id === id) ?? ORIENTACOES_CERTIFICADO[0];

  // Template em branco para um tipo (textos mínimos já com as variáveis certas).
  function emBranco(aplicaA) {
    const base = TEMPLATES_CERTIFICADO_SEED.find((t) => t.aplicaA === aplicaA && t.padrao) ?? TEMPLATES_CERTIFICADO_SEED[0];
    const t = clonar(base);
    t.frente.fundoImagem = null; t.frente.logoImagem = null; t.verso.fundoImagem = null;
    t.frente.assinaturas = [{ nome: 'Direção ProWay', cargo: 'Coordenação pedagógica', imagem: null }];
    t.verso.textoLivre = '';
    return { aparencia: t.aparencia, frente: t.frente, verso: t.verso };
  }

  // ---------- Variáveis e texto ----------

  const variaveisPara = (aplicaA) => VARIAVEIS_CERTIFICADO.filter((v) => v.lados.includes(aplicaA));
  const variaveisUsadas = (texto) => [...String(texto ?? '').matchAll(/\{\{\s*([a-zA-Z]+)\s*\}\}/g)].map((m) => m[1]);
  function variaveisInvalidas(texto, aplicaA) {
    const validas = new Set(variaveisPara(aplicaA).map((v) => v.id));
    return [...new Set(variaveisUsadas(texto).filter((v) => !validas.has(v)))];
  }

  // {{var}} → valor (escapado); **trecho** → <strong>. Texto literal também é escapado.
  function substituir(texto, dados = {}) {
    const trecho = (s) => esc(s).replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (m, v) => (v in dados ? esc(dados[v] ?? '') : `<mark class="cert-var-invalida">${esc(m)}</mark>`));
    const partes = String(texto ?? '').split('**');
    return partes.map((p, i) => (i % 2 ? `<strong>${trecho(p)}</strong>` : trecho(p))).join('');
  }

  // ---------- Validação ----------

  function validarDados(dados, l, idAtual = null) {
    const erros = [];
    const nome = String(dados.nome ?? '').trim();
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Dê um nome ao modelo.' });
    else if (l.some((t) => t.id !== idAtual && normalizar(t.nome) === normalizar(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe um modelo com esse nome.' });
    if (!aplicaDe(dados.aplicaA)) erros.push({ campo: 'aplicaA', mensagem: 'Escolha se o modelo é de curso ou de formação.' });
    if (dados.status !== undefined && !STATUS_TEMPLATE_CERTIFICADO.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Situação inválida.' });
    if (idAtual) {
      const atual = porId(l, idAtual);
      if (atual?.padrao && dados.status && dados.status !== 'ativo') erros.push({ campo: 'status', mensagem: 'Este é o modelo padrão — defina outro padrão antes de tirá-lo do ar.' });
      if (atual?.padrao && dados.aplicaA && dados.aplicaA !== atual.aplicaA) erros.push({ campo: 'aplicaA', mensagem: 'O modelo padrão não muda de tipo — defina outro padrão antes.' });
    }
    return erros;
  }

  // Erros da aparência, da frente e do verso (campos com prefixo do lado, ex.: "frente.corpo").
  function validarConteudo(t) {
    const erros = [];
    const a = t.aparencia ?? {};
    if (!ehCor(a.corPrimaria)) erros.push({ campo: 'aparencia.corPrimaria', mensagem: 'Cor no formato #RRGGBB.' });
    if (!ehCor(a.corDestaque)) erros.push({ campo: 'aparencia.corDestaque', mensagem: 'Cor no formato #RRGGBB.' });
    if (!ehCor(a.corTexto)) erros.push({ campo: 'aparencia.corTexto', mensagem: 'Cor no formato #RRGGBB.' });
    const f = t.frente ?? {};
    if (!String(f.titulo ?? '').trim()) erros.push({ campo: 'frente.titulo', mensagem: 'Informe o título da frente.' });
    if (!String(f.corpo ?? '').trim()) erros.push({ campo: 'frente.corpo', mensagem: 'O texto principal é obrigatório — é ele que diz o que o aluno concluiu.' });
    const textosFrente = { 'frente.rotuloTopo': f.rotuloTopo, 'frente.titulo': f.titulo, 'frente.introducao': f.introducao, 'frente.corpo': f.corpo, 'frente.localData': f.localData, 'frente.textoValidacao': f.textoValidacao };
    Object.entries(textosFrente).forEach(([campo, texto]) => {
      const inv = variaveisInvalidas(texto, t.aplicaA);
      if (inv.length) erros.push({ campo, mensagem: `Variável não existe para ${t.aplicaA === 'curso' ? 'curso' : 'formação'}: ${inv.map((v) => `{{${v}}}`).join(', ')}.` });
    });
    const ass = Array.isArray(f.assinaturas) ? f.assinaturas : [];
    if (ass.length > 3) erros.push({ campo: 'frente.assinaturas', mensagem: 'No máximo 3 assinaturas.' });
    ass.forEach((s, i) => {
      if (!String(s.nome ?? '').trim()) erros.push({ campo: `frente.assinaturas.${i}.nome`, mensagem: 'Nome de quem assina.' });
      const inv = variaveisInvalidas(`${s.nome} ${s.cargo}`, t.aplicaA);
      if (inv.length) erros.push({ campo: `frente.assinaturas.${i}.nome`, mensagem: `Variável não existe: ${inv.map((v) => `{{${v}}}`).join(', ')}.` });
    });
    const v = t.verso ?? {};
    if (v.mostrarConteudo && !String(v.titulo ?? '').trim()) erros.push({ campo: 'verso.titulo', mensagem: 'Título da lista de conteúdo.' });
    if (v.mostrarRequisitos && !String(v.tituloRequisitos ?? '').trim()) erros.push({ campo: 'verso.tituloRequisitos', mensagem: 'Título dos requisitos.' });
    ['verso.titulo', 'verso.tituloRequisitos', 'verso.textoLivre', 'verso.rodape'].forEach((campo) => {
      const inv = variaveisInvalidas(v[campo.split('.')[1]], t.aplicaA);
      if (inv.length) erros.push({ campo, mensagem: `Variável não existe para ${t.aplicaA === 'curso' ? 'curso' : 'formação'}: ${inv.map((x) => `{{${x}}}`).join(', ')}.` });
    });
    return erros;
  }

  // ---------- Mutações (devolvem lista nova) ----------

  function incluir(l, dados, { copiarDe = null } = {}) {
    const origem = copiarDe ? porId(l, copiarDe) : null;
    const base = origem ? clonar({ aparencia: origem.aparencia, frente: origem.frente, verso: origem.verso }) : emBranco(dados.aplicaA);
    const hoje = hojeIso();
    const template = {
      id: novoId(l), nome: String(dados.nome).trim(), descricao: String(dados.descricao ?? '').trim(),
      aplicaA: dados.aplicaA, padrao: false, status: 'rascunho',
      ...base, criadoEm: hoje, atualizadoEm: hoje,
    };
    return { lista: [...l, template], template };
  }

  function atualizar(l, id, patch) {
    return l.map((t) => (t.id === id ? { ...t, ...clonar(patch), atualizadoEm: hojeIso() } : t));
  }

  function atualizarDados(l, id, dados) {
    return atualizar(l, id, { nome: String(dados.nome).trim(), descricao: String(dados.descricao ?? '').trim(), aplicaA: dados.aplicaA, status: dados.status });
  }

  function atualizarConteudo(l, id, { aparencia, frente, verso }) {
    return atualizar(l, id, { aparencia, frente, verso });
  }

  function remover(l, id) { return l.filter((t) => t.id !== id); }

  function duplicar(l, id) {
    const o = porId(l, id);
    let nome = `${o.nome} (cópia)`;
    let n = 2;
    while (l.some((t) => normalizar(t.nome) === normalizar(nome))) { nome = `${o.nome} (cópia ${n})`; n += 1; }
    return incluir(l, { nome, descricao: o.descricao, aplicaA: o.aplicaA }, { copiarDe: id });
  }

  // Só um padrão por tipo; precisa estar ativo.
  function definirPadrao(l, id) {
    const t = porId(l, id);
    if (!t) return l;
    return l.map((x) => (x.aplicaA === t.aplicaA ? { ...x, padrao: x.id === id, ...(x.id === id ? { status: 'ativo', atualizadoEm: hojeIso() } : {}) } : x));
  }

  const padraoPara = (l, aplicaA) => l.find((t) => t.aplicaA === aplicaA && t.padrao) ?? null;
  const ativosPara = (l, aplicaA) => l.filter((t) => t.aplicaA === aplicaA && t.status === 'ativo').sort((a, b) => (b.padrao - a.padrao) || a.nome.localeCompare(b.nome, 'pt-BR'));

  // Template a aplicar a um curso/formação: o escolhido no cadastro (se ativo e do tipo certo),
  // senão o padrão do tipo, senão qualquer ativo, senão a semente.
  function para(aplicaA, entidade, l = lista()) {
    const id = entidade?.certificado?.templateId ?? null;
    const escolhido = id ? porId(l, id) : null;
    if (escolhido && escolhido.status === 'ativo' && escolhido.aplicaA === aplicaA) return escolhido;
    return padraoPara(l, aplicaA) ?? ativosPara(l, aplicaA)[0] ?? clonar(TEMPLATES_CERTIFICADO_SEED.find((t) => t.aplicaA === aplicaA));
  }

  // Certificado de curso emitido por uma turma: turma avulsa com template válido → template do curso → padrão.
  // Turma de formação não escolhe (o aluno recebe o certificado da formação; o do curso segue o curso).
  function paraTurma(turma, curso, l = lista()) {
    if (turma && !turma.formacaoId) {
      const id = turma.certificado?.templateId ?? null;
      const t = id ? porId(l, id) : null;
      if (t && t.status === 'ativo' && t.aplicaA === 'curso') return t;
    }
    return para('curso', curso, l);
  }

  // Quem aponta para o template (cursos/formações/turmas avulsas com certificado.templateId).
  function usos(id, cursos = [], formacoes = [], turmas = []) {
    return {
      cursos: cursos.filter((c) => c.certificado?.templateId === id),
      formacoes: formacoes.filter((f) => f.certificado?.templateId === id),
      turmas: turmas.filter((t) => !t.formacaoId && t.certificado?.templateId === id),
    };
  }

  function filtrar(l, { busca = '', aplicaA = '', status = '' } = {}) {
    const b = normalizar(busca);
    return l.filter((t) => (!aplicaA || t.aplicaA === aplicaA) && (!status || t.status === status) && (!b || normalizar(`${t.nome} ${t.descricao}`).includes(b)))
      .sort((a, x) => a.aplicaA.localeCompare(x.aplicaA) || (x.padrao - a.padrao) || a.nome.localeCompare(x.nome, 'pt-BR'));
  }

  // ---------- Dados de exemplo (prévia no admin) ----------

  function dadosExemplo(aplicaA) {
    const comum = {
      aluno: 'Mariana Souza Ribeiro', cpf: '123.456.789-00', cidade: 'Blumenau', dataEmissao: '28 de maio de 2026',
      formacao: 'Formação Ciência de Dados', codigoFormacao: 'FCD',
    };
    if (aplicaA === 'formacao') {
      return {
        ...comum, qtdCursos: '6 cursos', inicio: '10/02/2026', fim: '28/05/2026', periodo: '10/02/2026 a 28/05/2026', cargaHoraria: '240 h',
        codigoValidacao: 'PW-FCD-7B2E-0C91',
        cursos: [
          { nome: 'Lógica de programação com Python', codigo: 'PY-LOGICA', periodo: '10/02/2026 – 26/02/2026', horas: '40 h' },
          { nome: 'Python para Análise de Dados', codigo: 'PY-DADOS', periodo: '03/03/2026 – 26/03/2026', horas: '40 h' },
          { nome: 'SQL e modelagem de dados', codigo: 'SQL-MOD', periodo: '31/03/2026 – 23/04/2026', horas: '40 h' },
          { nome: 'Estatística aplicada', codigo: 'EST-APL', periodo: '28/04/2026 – 14/05/2026', horas: '32 h' },
          { nome: 'Visualização com Power BI', codigo: 'PBI-VIS', periodo: '05/05/2026 – 21/05/2026', horas: '40 h' },
          { nome: 'Projeto integrador', codigo: 'PRJ-DADOS', periodo: '19/05/2026 – 28/05/2026', horas: '48 h' },
        ],
        requisitos: ['Todos os 6 cursos obrigatórios concluídos.', 'Frequência geral de 92% nas 72 aulas da formação.', 'Projeto integrador aprovado pela banca.'],
      };
    }
    return {
      ...comum, curso: 'Python para Análise de Dados', codigoCurso: 'PY-DADOS', turma: 'PYD-2026-02', formato: 'online ao vivo',
      instrutor: 'André Machado', inicio: '03/03/2026', fim: '26/03/2026', periodo: '03/03/2026 a 26/03/2026', cargaHoraria: '40 h',
      codigoValidacao: 'PW-PYD202602-4F1A-9C3E', matricula: 'M-2026-0412',
      modulos: [
        { nome: 'Ambiente e fundamentos', topicos: ['Instalação', 'Jupyter', 'Tipos e estruturas'], horas: '8 h' },
        { nome: 'NumPy e Pandas', topicos: ['Arrays', 'DataFrames', 'Limpeza de dados'], horas: '12 h' },
        { nome: 'Exploração e estatística', topicos: ['Agrupamentos', 'Medidas', 'Outliers'], horas: '8 h' },
        { nome: 'Visualização', topicos: ['Matplotlib', 'Seaborn', 'Storytelling'], horas: '8 h' },
        { nome: 'Projeto final', topicos: ['Dataset real', 'Apresentação'], horas: '4 h' },
      ],
      requisitos: ['Frequência de 95% (mínimo de 75%): 19 presenças em 20 aulas.', 'Aprovação na avaliação do curso (nota 8,5; mínima 7).', 'Curso concluído em 26/03/2026, matrícula M-2026-0412.'],
    };
  }

  // ---------- Render ----------

  const CSS = `
.cert-folha{position:relative;overflow:hidden;width:100%;background:#fff;color:var(--cert-texto,#1e293b);font-family:var(--cert-fonte);container-type:inline-size;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 0 0 1px rgba(15,23,42,.06);line-height:1.35}
.cert-folha[data-orientacao="paisagem"]{aspect-ratio:297/210}
.cert-folha[data-orientacao="retrato"]{aspect-ratio:210/297}
.cert-folha>.cert-corpo{position:absolute;inset:0;font-size:1.45cqw}
.cert-folha[data-orientacao="retrato"]>.cert-corpo{font-size:2.05cqw}
.cert-folha[data-denso="1"]>.cert-corpo{font-size:1.2cqw}
.cert-folha[data-orientacao="retrato"][data-denso="1"]>.cert-corpo{font-size:1.75cqw}
.cert-fundo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.cert-moldura-dupla{position:absolute;inset:0;border:.7em solid var(--cert-primaria)}
.cert-moldura-dupla::after{content:'';position:absolute;inset:.35em;border:1px solid var(--cert-destaque)}
.cert-moldura-simples{position:absolute;inset:1.2em;border:2px solid var(--cert-primaria)}
.cert-moldura-lateral{position:absolute;left:0;top:0;bottom:0;width:1em;background:var(--cert-destaque)}
.cert-marca{position:absolute;right:-9em;bottom:-9em;width:24em;height:24em;border-radius:50%;background:var(--cert-primaria);opacity:.05}
.cert-conteudo{position:relative;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:5% 7%}
.cert-topo{display:flex;align-items:center;justify-content:space-between;gap:1.5em}
.cert-logo{display:flex;align-items:center;gap:.7em}
.cert-logo-mono{width:2.6em;height:2.6em;border-radius:.5em;background:var(--cert-destaque);color:#fff;display:grid;place-items:center;font-weight:700;font-size:1em;letter-spacing:.02em}
.cert-logo-img{height:3em;width:auto;max-width:12em;object-fit:contain}
.cert-inst{font-weight:600;color:var(--cert-primaria);font-size:1.05em;line-height:1.2}
.cert-inst small{display:block;font-weight:400;font-size:.72em;opacity:.7}
.cert-rotulo{font-size:.72em;text-transform:uppercase;letter-spacing:.2em;opacity:.7;text-align:right}
.cert-centro{text-align:center;display:flex;flex-direction:column;gap:.7em;align-items:center}
.cert-titulo{font-size:2.3em;font-weight:600;text-transform:uppercase;letter-spacing:.25em;color:var(--cert-primaria);line-height:1.1}
.cert-intro{font-size:.95em;opacity:.8}
.cert-aluno{font-size:2em;font-weight:600;line-height:1.15}
.cert-cpf{font-size:.78em;opacity:.65;margin-top:-.4em}
.cert-texto{font-size:1.02em;line-height:1.55;max-width:80%}
.cert-texto strong{font-weight:600;color:var(--cert-primaria)}
.cert-base{display:flex;align-items:flex-end;justify-content:space-between;gap:2em}
.cert-local{font-size:.82em}
.cert-codigo{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.72em;opacity:.75;margin-top:.9em}
.cert-codigo b{font-weight:600;opacity:1}
.cert-validacao{font-size:.66em;opacity:.55;margin-top:.2em}
.cert-assinaturas{display:flex;gap:2.5em;text-align:center;font-size:.78em}
.cert-assinatura{min-width:11em}
.cert-assinatura-img{height:3em;width:auto;max-width:11em;object-fit:contain;display:block;margin:0 auto .2em}
.cert-assinatura-linha{height:1px;background:currentColor;opacity:.45;margin:0 auto .45em;width:11em}
.cert-assinatura b{display:block;font-weight:600}
.cert-assinatura span{opacity:.7}
.cert-verso-topo{display:flex;align-items:baseline;justify-content:space-between;gap:1em;border-bottom:2px solid var(--cert-primaria);padding-bottom:.5em}
.cert-verso-titulo{font-size:1.45em;font-weight:600;color:var(--cert-primaria);letter-spacing:.06em;text-transform:uppercase}
.cert-verso-ref{font-size:.8em;opacity:.7;text-align:right}
.cert-verso-meio{flex:1;min-height:0;display:flex;flex-direction:column;gap:1.1em;padding-top:1em}
.cert-lista{list-style:none;margin:0;padding:0;counter-reset:cert;column-gap:2.5em}
.cert-folha[data-orientacao="paisagem"] .cert-lista[data-colunas="2"]{columns:2}
.cert-lista li{break-inside:avoid;display:flex;gap:.7em;align-items:flex-start;padding:.3em 0;font-size:.88em;border-bottom:1px dotted rgba(0,0,0,.12)}
.cert-lista li::before{counter-increment:cert;content:counter(cert) ".";opacity:.45;width:1.4em;flex:0 0 auto;font-variant-numeric:tabular-nums}
.cert-lista .cert-item{flex:1;min-width:0}
.cert-lista .cert-item b{font-weight:600;display:block}
.cert-lista .cert-item small{display:block;font-size:.85em;opacity:.65}
.cert-lista .cert-horas{flex:0 0 auto;font-size:.9em;opacity:.7;font-variant-numeric:tabular-nums}
.cert-req-titulo{font-size:.78em;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--cert-primaria);margin-bottom:.3em}
.cert-requisitos{list-style:none;margin:0;padding:0;font-size:.85em}
.cert-requisitos li{display:flex;gap:.5em;align-items:flex-start;padding:.15em 0}
.cert-requisitos li::before{content:'✓';color:var(--cert-destaque);font-weight:700;flex:0 0 auto}
.cert-livre{font-size:.8em;line-height:1.5;opacity:.85;white-space:pre-line}
.cert-rodape{font-size:.7em;opacity:.6;border-top:1px solid rgba(0,0,0,.15);padding-top:.6em;text-align:center}
.cert-var-invalida{background:#fef3c7;color:#92400e;padding:0 .2em;border-radius:.2em}
.cert-vazio{font-size:.85em;opacity:.55;font-style:italic}
@media print{
  body>:not(#cert-impressao){display:none!important}
  #cert-impressao{display:block!important;position:static}
  #cert-impressao .cert-folha{width:100vw;height:100vh;aspect-ratio:auto;border-radius:0;box-shadow:none;break-after:page;page-break-after:always}
  #cert-impressao .cert-folha:last-child{break-after:auto;page-break-after:auto}
  .cert-var-invalida{background:none;color:inherit}
}`;

  let estilosInjetados = false;
  function injetarEstilos() {
    if (estilosInjetados || typeof document === 'undefined') return;
    const s = document.createElement('style');
    s.id = 'cert-estilos';
    s.textContent = CSS;
    document.head.appendChild(s);
    estilosInjetados = true;
  }

  const iniciais = (nome) => String(nome ?? '').trim().split(/\s+/).map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase() || 'PW';

  function abrirFolha(t, lado, denso = false) {
    const a = t.aparencia;
    const l = t[lado] ?? {};
    const vars = `--cert-primaria:${esc(a.corPrimaria)};--cert-destaque:${esc(a.corDestaque)};--cert-texto:${esc(a.corTexto)};--cert-fonte:${fonteDe(a.fonte).css}`;
    const fundo = l.fundoImagem ? `<img class="cert-fundo" src="${esc(l.fundoImagem)}" alt="" style="opacity:${(Number(l.fundoOpacidade ?? 100) || 0) / 100}">` : '';
    const moldura = a.moldura === 'nenhuma' ? '' : `<div class="cert-moldura-${esc(a.moldura)}"></div>`;
    const marca = lado === 'frente' && a.moldura !== 'nenhuma' ? '<div class="cert-marca"></div>' : '';
    return `<div class="cert-folha" data-lado="${lado}" data-orientacao="${esc(a.orientacao)}" ${denso ? 'data-denso="1"' : ''} style="${vars}"><div class="cert-corpo">${fundo}${moldura}${marca}<div class="cert-conteudo">`;
  }
  const fecharFolha = () => '</div></div></div>';

  function htmlFrente(t, dados) {
    const f = t.frente;
    const r = (x) => substituir(x, dados);
    const logo = f.mostrarLogo
      ? `<div class="cert-logo">${f.logoImagem ? `<img class="cert-logo-img" src="${esc(f.logoImagem)}" alt="">` : `<div class="cert-logo-mono">${esc(iniciais(f.instituicao))}</div>`}<div class="cert-inst">${esc(f.instituicao)}${f.subInstituicao ? `<small>${esc(f.subInstituicao)}</small>` : ''}</div></div>`
      : '<div></div>';
    const assinaturas = (f.assinaturas ?? []).map((s) => `<div class="cert-assinatura">${s.imagem ? `<img class="cert-assinatura-img" src="${esc(s.imagem)}" alt="">` : ''}<div class="cert-assinatura-linha"></div><b>${r(s.nome)}</b><span>${r(s.cargo)}</span></div>`).join('');
    return `${abrirFolha(t, 'frente')}
      <div class="cert-topo">${logo}<p class="cert-rotulo">${r(f.rotuloTopo)}</p></div>
      <div class="cert-centro">
        <p class="cert-titulo">${r(f.titulo)}</p>
        ${f.introducao ? `<p class="cert-intro">${r(f.introducao)}</p>` : ''}
        <p class="cert-aluno">${esc(dados.aluno ?? '')}</p>
        ${f.mostrarCpf && dados.cpf ? `<p class="cert-cpf">CPF ${esc(dados.cpf)}</p>` : ''}
        <p class="cert-texto">${r(f.corpo)}</p>
      </div>
      <div class="cert-base">
        <div class="cert-local">
          ${f.localData ? `<p>${r(f.localData)}</p>` : ''}
          ${f.mostrarCodigo ? `<p class="cert-codigo">Código de validação <b>${esc(dados.codigoValidacao ?? '')}</b></p>` : ''}
          ${f.mostrarCodigo && f.textoValidacao ? `<p class="cert-validacao">${r(f.textoValidacao)}</p>` : ''}
        </div>
        <div class="cert-assinaturas">${assinaturas}</div>
      </div>
    ${fecharFolha()}`;
  }

  function htmlVerso(t, dados) {
    const v = t.verso;
    const r = (x) => substituir(x, dados);
    const itens = t.aplicaA === 'curso' ? (dados.modulos ?? []) : (dados.cursos ?? []);
    const denso = itens.length > 10;
    let conteudo = '';
    if (v.mostrarConteudo) {
      const lis = t.aplicaA === 'curso'
        ? itens.map((m) => `<li><div class="cert-item"><b>${esc(m.nome)}</b>${v.mostrarTopicos && (m.topicos ?? []).length ? `<small>${esc(m.topicos.join(' · '))}</small>` : ''}</div>${v.mostrarCargaPorItem && m.horas ? `<span class="cert-horas">${esc(m.horas)}</span>` : ''}</li>`)
        : itens.map((c) => `<li><div class="cert-item"><b>${esc(c.nome)}</b><small>${esc([c.codigo, c.periodo].filter(Boolean).join(' · '))}</small></div>${v.mostrarCargaPorItem && c.horas ? `<span class="cert-horas">${esc(c.horas)}</span>` : ''}</li>`);
      conteudo = lis.length ? `<ol class="cert-lista" data-colunas="${itens.length > 6 ? 2 : 1}">${lis.join('')}</ol>` : `<p class="cert-vazio">${t.aplicaA === 'curso' ? 'O curso não tem módulos cadastrados.' : 'A formação não tem cursos.'}</p>`;
    }
    const requisitos = v.mostrarRequisitos && (dados.requisitos ?? []).length
      ? `<div><p class="cert-req-titulo">${r(v.tituloRequisitos)}</p><ul class="cert-requisitos">${dados.requisitos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    const ref = t.aplicaA === 'curso'
      ? `${esc(dados.curso ?? '')}<br>${esc([dados.turma, dados.cargaHoraria].filter(Boolean).join(' · '))}`
      : `${esc(dados.formacao ?? '')}<br>${esc([dados.codigoFormacao, dados.cargaHoraria].filter(Boolean).join(' · '))}`;
    return `${abrirFolha(t, 'verso', denso)}
      <div class="cert-verso-topo"><p class="cert-verso-titulo">${r(v.mostrarConteudo ? v.titulo : (v.tituloRequisitos || 'Verso'))}</p><p class="cert-verso-ref">${esc(dados.aluno ?? '')}<br>${ref}</p></div>
      <div class="cert-verso-meio">
        ${conteudo}
        ${requisitos}
        ${v.textoLivre ? `<p class="cert-livre">${r(v.textoLivre)}</p>` : ''}
      </div>
      ${v.rodape ? `<p class="cert-rodape">${r(v.rodape)}</p>` : ''}
    ${fecharFolha()}`;
  }

  const htmlFolhas = (t, dados) => htmlFrente(t, dados) + htmlVerso(t, dados);

  // Imprime só as folhas (frente e verso, uma por página) no tamanho/orientação do template.
  function imprimir(t, dados) {
    injetarEstilos();
    document.getElementById('cert-impressao')?.remove();
    document.getElementById('cert-pagina')?.remove();
    const pagina = document.createElement('style');
    pagina.id = 'cert-pagina';
    pagina.textContent = `@page{size:A4 ${t.aparencia.orientacao === 'retrato' ? 'portrait' : 'landscape'};margin:0}`;
    document.head.appendChild(pagina);
    const area = document.createElement('div');
    area.id = 'cert-impressao';
    area.style.display = 'none';
    area.innerHTML = htmlFolhas(t, dados);
    document.body.appendChild(area);
    const limpar = () => { area.remove(); pagina.remove(); window.removeEventListener('afterprint', limpar); };
    window.addEventListener('afterprint', limpar);
    window.print();
  }

  return {
    CHAVE, carregar, salvar, lista, porId, aplicaDe, statusDe, fonteDe, molduraDe, orientacaoDe, emBranco,
    variaveisPara, variaveisUsadas, variaveisInvalidas, substituir,
    validarDados, validarConteudo,
    incluir, atualizar, atualizarDados, atualizarConteudo, remover, duplicar, definirPadrao,
    padraoPara, ativosPara, para, paraTurma, usos, filtrar, dadosExemplo,
    CSS, injetarEstilos, htmlFrente, htmlVerso, htmlFolhas, imprimir,
  };
})();
