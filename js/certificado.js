// ============================================================
// Render do certificado (frente + verso) e impressão em A4.
// CSS e marcação reaproveitados do motor de templates do protótipo
// original (js/templates-certificado-motor.js): HTML com CSS próprio,
// sem Tailwind, para sair igual na tela, na prévia e na impressão.
// A aparência e os textos vêm de um modelo (Aulor.modelosCertificado):
// o do curso na emissão, ou a cópia guardada no certificado emitido.
// ============================================================

const Certificado = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const extenso = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${y}`; };
  const br = (iso) => iso ? iso.split('-').reverse().join('/') : '';

  // {{var}} → valor (escapado); **trecho** → <strong>.
  function substituir(texto, dados = {}) {
    const trecho = (s) => esc(s).replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (m, v) => (v in dados ? esc(dados[v] ?? '') : `<mark class="cert-var-invalida">${esc(m)}</mark>`));
    return String(texto ?? '').split('**').map((p, i) => (i % 2 ? `<strong>${trecho(p)}</strong>` : trecho(p))).join('');
  }

  const VARIAVEIS = Aulor.VARIAVEIS_CERTIFICADO;
  const FONTES = { moderna: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif", classica: "Georgia, 'Times New Roman', Times, serif" };

  const urlValidacao = () => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}validar.html`;

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
.cert-folha[data-orientacao="retrato"] .cert-base{flex-direction:column-reverse;align-items:center;text-align:center;gap:1.6em}
.cert-folha[data-orientacao="retrato"] .cert-titulo{font-size:2em}
.cert-folha[data-orientacao="retrato"] .cert-texto{max-width:92%}
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
    if (estilosInjetados) return;
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    estilosInjetados = true;
  }

  // Abre a folha com as cores, a fonte, a orientação e a moldura do modelo.
  function abrirFolha(modelo, lado) {
    const a = modelo.aparencia;
    const vars = `--cert-primaria:${esc(a.corPrimaria)};--cert-destaque:${esc(a.corDestaque)};--cert-texto:#1E293B;--cert-fonte:${esc(FONTES[a.fonte] ?? FONTES.moderna)}`;
    const moldura = a.moldura === 'nenhuma' ? '' : `<div class="cert-moldura-${esc(a.moldura)}"></div>`;
    const marca = lado === 'frente' && a.moldura === 'dupla' ? '<div class="cert-marca"></div>' : '';
    return `<div class="cert-folha" data-lado="${lado}" data-orientacao="${esc(a.orientacao)}" style="${vars}"><div class="cert-corpo">${moldura}${marca}`;
  }

  // Variáveis do texto a partir do certificado emitido (snapshot do momento da emissão).
  function dadosDe(cert) {
    const d = cert.dados;
    return {
      aluno: d.aluno, cpf: d.cpf ? d.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '', curso: d.curso, modalidade: (d.modalidade || '').toLowerCase(),
      cargaHoraria: `${d.cargaHoraria} horas`, inicio: br(d.inicio), fim: br(d.fim), frequencia: d.frequencia != null ? `${d.frequencia}%` : '—',
      professor: d.professor, turma: d.turma, matricula: d.matricula, cidade: Aulor.escola().cidade, dataEmissao: extenso(cert.emitidoEm),
      codigoValidacao: cert.codigo, modulos: d.modulos ?? [], minimo: Aulor.config().academico.frequenciaMinima,
    };
  }

  function dadosExemplo() {
    return {
      aluno: 'Mariana Souza Lima', cpf: '529.982.247-25', curso: 'Excel Essencial', modalidade: 'presencial', cargaHoraria: '24 horas',
      inicio: '04/08/2026', fim: '10/09/2026', frequencia: '92%', professor: 'Carlos Mendes', turma: 'EXC-2026-2', matricula: '2026-0042',
      cidade: Aulor.escola().cidade, dataEmissao: extenso(Aulor.hoje()), codigoValidacao: `${Aulor.escola().sigla}-2026-7KQ2-M9XA`,
      modulos: [{ nome: 'Interface e primeiras planilhas', cargaHoraria: 6 }, { nome: 'Fórmulas e funções', cargaHoraria: 10 }, { nome: 'Gráficos e tabelas dinâmicas', cargaHoraria: 8 }], minimo: 75,
    };
  }

  const iniciais = (nome) => String(nome ?? '').trim().split(/\s+/).filter((p) => p.length > 2).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';

  function frente(modelo, dados, { cancelado = false } = {}) {
    const f = modelo.frente;
    const escola = Aulor.escola();
    const r = (x) => substituir(x, dados);
    const validacao = Aulor.temModulo('validacao_publica') ? `Valide em ${urlValidacao()}` : 'Autenticidade confirmada pela secretaria da escola';
    const assinaturas = (f.assinaturas ?? []).map((s) => `<div class="cert-assinatura"><div class="cert-assinatura-linha"></div><b>${r(s.nome)}</b><span>${r(s.cargo)}</span></div>`).join('');
    return `${abrirFolha(modelo, 'frente')}
      ${cancelado ? '<div style="position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:2"><span style="transform:rotate(-18deg);border:.25em solid #b91c1c;color:#b91c1c;font-weight:700;font-size:3.2em;letter-spacing:.2em;padding:.1em .5em;opacity:.75">CANCELADO</span></div>' : ''}
      <div class="cert-conteudo">
        <div class="cert-topo"><div class="cert-logo"><div class="cert-logo-mono">${esc(iniciais(escola.nome))}</div><div class="cert-inst">${esc(escola.nome)}<small>${esc(escola.cidade)} — ${esc(escola.uf)}${escola.cnpj ? ` · CNPJ ${esc(Documento.fmtCnpj(escola.cnpj))}` : ''}</small></div></div>${f.rotuloTopo ? `<p class="cert-rotulo">${r(f.rotuloTopo)}</p>` : ''}</div>
        <div class="cert-centro">
          <p class="cert-titulo">${r(f.titulo)}</p>
          ${f.introducao ? `<p class="cert-intro">${r(f.introducao)}</p>` : ''}
          <p class="cert-aluno">${esc(dados.aluno)}</p>
          ${f.mostrarCpf && dados.cpf ? `<p class="cert-cpf">CPF ${esc(dados.cpf)}</p>` : ''}
          <p class="cert-texto">${r(f.corpo)}</p>
        </div>
        <div class="cert-base">
          <div class="cert-local">
            ${f.localData ? `<p>${r(f.localData)}</p>` : ''}
            <p class="cert-codigo">Código de validação <b>${esc(dados.codigoValidacao)}</b></p>
            <p class="cert-validacao">${esc(validacao)}</p>
          </div>
          <div class="cert-assinaturas">${assinaturas}</div>
        </div>
      </div></div></div>`;
  }

  function verso(modelo, dados) {
    const v = modelo.verso;
    const r = (x) => substituir(x, dados);
    const mods = dados.modulos ?? [];
    const lista = mods.length
      ? `<ol class="cert-lista" data-colunas="${mods.length > 6 ? 2 : 1}">${mods.map((x) => `<li><div class="cert-item"><b>${esc(x.nome)}</b></div>${v.mostrarCargaPorItem ? `<span class="cert-horas">${esc(x.cargaHoraria)} h</span>` : ''}</li>`).join('')}</ol>`
      : '<p class="cert-vazio">Curso sem módulos cadastrados.</p>';
    const requisitos = [`Frequência de ${dados.frequencia} (mínimo exigido: ${dados.minimo}%).`, `Carga horária cumprida: ${dados.cargaHoraria}, de ${dados.inicio} a ${dados.fim}.`, `Turma ${dados.turma}${dados.professor ? `, com ${dados.professor}` : ''}.`];
    return `${abrirFolha(modelo, 'verso')}<div class="cert-conteudo">
      <div class="cert-verso-topo"><p class="cert-verso-titulo">${r(v.titulo)}</p><p class="cert-verso-ref">${esc(dados.aluno)}<br>${esc(dados.curso)} · ${esc(dados.cargaHoraria)}</p></div>
      <div class="cert-verso-meio">
        ${lista}
        ${v.mostrarRequisitos ? `<div><p class="cert-req-titulo">Requisitos cumpridos</p><ul class="cert-requisitos">${requisitos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        ${v.textoLivre ? `<p class="cert-livre">${r(v.textoLivre)}</p>` : ''}
      </div>
      <p class="cert-rodape">${esc(Aulor.escola().nome)} · ${esc(Aulor.escola().cidade)} · Código de validação ${esc(dados.codigoValidacao)}</p>
    </div></div></div>`;
  }

  // `lados`: 'frente', 'verso' ou os dois (verso só se o modelo imprime verso).
  function folhas(dados, { modelo = Aulor.modeloPadrao(), cancelado = false, lados = ['frente', 'verso'] } = {}) {
    injetarEstilos();
    return (lados.includes('frente') ? frente(modelo, dados, { cancelado }) : '') + (lados.includes('verso') && modelo.verso.mostrar ? verso(modelo, dados) : '');
  }

  // Imprime só as folhas (A4 na orientação do modelo). "Salvar como PDF" no diálogo do navegador gera o arquivo.
  function imprimir(dados, modelo = Aulor.modeloPadrao()) {
    injetarEstilos();
    document.getElementById('cert-impressao')?.remove();
    document.getElementById('cert-pagina')?.remove();
    const pagina = document.createElement('style');
    pagina.id = 'cert-pagina';
    pagina.textContent = `@page{size:A4 ${modelo.aparencia.orientacao === 'retrato' ? 'portrait' : 'landscape'};margin:0}`;
    document.head.appendChild(pagina);
    const area = document.createElement('div');
    area.id = 'cert-impressao';
    area.style.display = 'none';
    area.innerHTML = folhas(dados, { modelo });
    document.body.appendChild(area);
    const limpar = () => { area.remove(); pagina.remove(); window.removeEventListener('afterprint', limpar); };
    window.addEventListener('afterprint', limpar);
    window.print();
  }

  return { VARIAVEIS, FONTES, substituir, dadosDe, dadosExemplo, folhas, imprimir, urlValidacao };
})();
