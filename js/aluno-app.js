// ============================================================
// Ficha do aluno em abas, como no original: Dados, Responsáveis,
// Endereço e pagamento, Matrículas (com frequência e certificado) e
// Financeiro (parcelas de todas as matrículas). Aba na URL: ?aba=.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');

  function blocoMatricula(m) {
    const t = Aulor.turma(m.turmaId);
    const c = Aulor.curso(t.cursoId);
    const f = Aulor.frequencia(m);
    const parcelas = Aulor.parcelasDaMatricula(m.id);
    const pagas = parcelas.filter((l) => l.status === 'pago').length;
    const vencidas = parcelas.filter((l) => Aulor.situacaoLancamento(l) === 'vencido').length;
    const ativas = parcelas.filter((l) => l.status !== 'cancelado').length;
    const e = Aulor.elegibilidade(m);
    const st = Aulor.STATUS_MATRICULA[m.status];
    const resultado = m.status === 'concluida' ? (m.resultado === 'aprovado' ? 'Aprovado' : 'Reprovado por frequência') : st.nome;
    return `
      <li class="px-5 py-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <a href="matricula.html?id=${m.id}" class="font-medium text-tinta hover:underline">${esc(c.nome)}</a>
            <p class="text-xs text-tinta-2">Matrícula ${m.codigo} · <a class="hover:underline" href="turma.html?id=${t.id}">${esc(t.codigo)}</a> · ${dataBr(t.inicio)} a ${dataBr(t.fim)}</p>
          </div>
          ${status(m.status === 'concluida' && m.resultado !== 'aprovado' ? 'perigo' : st.tom, resultado)}
        </div>
        <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><p class="text-xs text-tinta-2 mb-0.5">Frequência</p>${m.status === 'cancelada' ? '<span class="text-tinta-3">—</span>' : barraFrequencia(f, { compacta: true })}</div>
          <div><p class="text-xs text-tinta-2 mb-0.5">Parcelas</p>${ativas ? `<span class="tabular-nums">${pagas} de ${ativas} pagas</span>${vencidas ? ` · <span class="text-ruim">${vencidas} vencida${vencidas > 1 ? 's' : ''}</span>` : ''}` : '<span class="text-tinta-3">—</span>'}</div>
          <div><p class="text-xs text-tinta-2 mb-0.5">Certificado</p>${e.id === 'emitido' ? `<a class="link text-sm" href="certificado.html?id=${e.certificado.id}">${esc(e.certificado.codigo)}</a>` : status(e.tom, e.nome, '', true)}</div>
        </div>
        ${m.status === 'cancelada' ? `<p class="mt-2 text-xs text-tinta-2">Cancelada em ${dataBr(m.canceladaEm)} — ${esc(m.motivoCancelamento)}</p>` : ''}
      </li>`;
  }

  function dado(rotulo, valor, classe = '') {
    return `<div class="${classe}"><dt class="text-xs text-tinta-2">${rotulo}</dt><dd class="text-sm text-tinta mt-0.5 break-words">${valor || '<span class="text-tinta-3">—</span>'}</dd></div>`;
  }

  // Seção no padrão do original: título, explicação e ação à direita.
  const secao = (titulo, descricao, acao, corpo) => `
    <section class="painel">
      <div class="px-5 py-4 border-b border-linha flex items-start justify-between gap-3">
        <div><h3 class="font-display font-semibold">${titulo}</h3>${descricao ? `<p class="text-xs text-tinta-2 mt-0.5">${descricao}</p>` : ''}</div>
        ${acao}
      </div>
      ${corpo}
    </section>`;

  const NOME_PAPEL = Object.fromEntries(Aulor.PAPEIS_RESPONSAVEL.map((p) => [p.id, p.nome]));
  const TOM_PAPEL = { legal: 'info', financeiro: 'ok', emergencia: 'atencao' };

  function abaDados(a, editar) {
    const idade = Aulor.idade(a.nascimento);
    const botao = editar ? `<button type="button" data-editar class="btn-sec btn-pequeno">${ICONE.editar}Editar</button>` : '';
    return `
      <div class="grid xl:grid-cols-2 gap-5 items-start">
        ${secao('Identificação', 'Como sai no contrato e no certificado.', botao, `
          <dl class="p-5 grid grid-cols-2 gap-4">
            ${dado('Nome completo', esc(a.nome), 'col-span-2')}
            ${dado('CPF', `<span class="tabular-nums">${cpfFmt(a.cpf)}</span>`)}
            ${dado('RG', esc(a.rg))}
            ${dado('Nascimento', a.nascimento ? `${dataBr(a.nascimento)}${idade != null ? ` <span class="text-xs text-tinta-3">· ${idade} anos</span>` : ''}` : '')}
            ${dado('Como conheceu a escola', esc(a.origem))}
          </dl>`)}
        ${secao('Contato', 'Por onde a escola fala com o aluno: avisos, cobrança e certificado.', botao, `
          <dl class="p-5 grid grid-cols-2 gap-4">
            ${dado('Celular / WhatsApp', `${telefoneFmt(a.telefone)}${a.telefone ? ` <a class="link text-xs ml-1" target="_blank" rel="noopener" href="https://wa.me/55${a.telefone}">WhatsApp</a>` : ''}`)}
            ${dado('E-mail', esc(a.email))}
            ${dado('Observações', a.observacoes ? `<span class="whitespace-pre-line">${esc(a.observacoes)}</span>` : '', 'col-span-2')}
          </dl>`)}
      </div>`;
  }

  function abaResponsaveis(a, editar) {
    const lista = a.responsaveis ?? [];
    const menor = Aulor.ehMenor(a);
    const semLegal = menor && !lista.some((r) => r.papeis.includes('legal'));
    return `
      ${semLegal ? `<div class="mb-4 rounded-xl border border-cobre/40 bg-cobre/15 px-4 py-3 text-sm text-tinta"><b>Aluno menor de idade sem responsável legal.</b> O contrato precisa ser assinado por pai, mãe ou tutor com o papel Legal.</div>` : ''}
      ${secao(`Responsáveis <span class="font-normal text-tinta-3 text-sm">${lista.length}</span>`, menor ? 'Aluno menor de idade: precisa de pelo menos um responsável legal.' : 'Opcional para maiores de idade: quem paga ou contato de emergência.', editar ? `<button type="button" data-novo-resp class="btn-pri btn-pequeno">${ICONE.mais}Novo responsável</button>` : '', lista.length ? `
        <div class="overflow-x-auto"><table class="tabela">
          <thead><tr><th>Responsável</th><th>Papéis</th><th>Celular</th><th>CPF</th><th></th></tr></thead>
          <tbody>${lista.map((r) => `<tr>
            <td><p class="font-medium text-tinta">${esc(r.nome)}</p><p class="text-xs text-tinta-2">${esc([r.parentesco, r.email].filter(Boolean).join(' · ') || '—')}</p></td>
            <td><div class="flex flex-wrap gap-1">${r.papeis.map((p) => pilula(TOM_PAPEL[p], NOME_PAPEL[p])).join('')}</div></td>
            <td class="whitespace-nowrap tabular-nums">${telefoneFmt(r.telefone)}${r.telefone ? ` <a class="link text-xs ml-1" target="_blank" rel="noopener" href="https://wa.me/55${r.telefone}">WhatsApp</a>` : ''}</td>
            <td class="whitespace-nowrap tabular-nums">${r.cpf ? cpfFmt(r.cpf) : '<span class="text-tinta-3">—</span>'}</td>
            <td class="text-right whitespace-nowrap space-x-2">${editar ? `<button type="button" data-editar-resp="${r.id}" class="text-xs font-semibold link">Editar</button><button type="button" data-remover-resp="${r.id}" class="text-xs font-semibold text-tinta-2 hover:text-ruim">Remover</button>` : ''}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : vazio('Nenhum responsável cadastrado', menor ? 'Cadastre o responsável legal para poder matricular.' : '')) }
      <p class="mt-3 text-xs text-tinta-2">Papéis: <b>Legal</b> responde e assina pelo menor · <b>Financeiro</b> é quem paga (contrato e boleto no nome dele; só um por aluno) · <b>Emergência</b> recebe avisos de falta e ocorrências.</p>`;
  }

  function abaEndereco(a, editar) {
    const e = a.endereco ?? {};
    const c = a.cobranca ?? {};
    const fin = Aulor.responsavelFinanceiro(a);
    const pagaResp = c.pagador === 'responsavel' && fin;
    const botao = editar ? `<button type="button" data-editar-endereco class="btn-sec btn-pequeno">${ICONE.editar}Editar</button>` : '';
    return `
      <div class="grid xl:grid-cols-2 gap-5 items-start">
        ${secao('Endereço', 'Vai para o contrato e para a cobrança quando o próprio aluno paga.', botao, e.logradouro || e.cidade ? `
          <dl class="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            ${dado('CEP', e.cep ? e.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '')}
            ${dado('Logradouro', esc(e.logradouro), 'col-span-1 sm:col-span-3')}
            ${dado('Número', esc(e.numero))}
            ${dado('Complemento', esc(e.complemento))}
            ${dado('Bairro', esc(e.bairro), 'col-span-2')}
            ${dado('Cidade', esc(e.cidade), 'sm:col-span-3')}
            ${dado('UF', esc(e.uf))}
          </dl>` : `<div class="p-5 text-sm text-tinta-2">Endereço ainda não informado.</div>`)}
        ${secao('Quem paga', 'Define em nome de quem saem contrato e cobrança. Vale como sugestão na próxima matrícula.', botao, `
          <div class="p-5 space-y-4">
            <div>${pilula(pagaResp ? 'info' : 'neutro', pagaResp ? 'Responsável financeiro' : 'O próprio aluno')}</div>
            ${pagaResp
              ? `<dl class="grid grid-cols-2 gap-4">${dado('Nome', `${esc(fin.nome)}${fin.parentesco ? ` <span class="text-tinta-3">· ${esc(fin.parentesco)}</span>` : ''}`, 'col-span-2')}${dado('CPF', fin.cpf ? cpfFmt(fin.cpf) : '<span class="text-aviso">Falta o CPF</span>')}${dado('Celular', telefoneFmt(fin.telefone))}</dl>`
              : `<p class="text-sm text-tinta">Contrato e cobrança em nome de <b>${esc(a.nome)}</b>, CPF ${cpfFmt(a.cpf)}.</p>${Aulor.ehMenor(a) ? '<p class="text-sm text-aviso">Aluno menor de idade: o contrato precisa de um responsável.</p>' : ''}`}
            <dl class="grid grid-cols-2 gap-4 pt-4 border-t border-linha">
              ${dado('Forma preferida', esc(c.formaPreferida ? nomeForma(c.formaPreferida) : ''))}
              ${dado('Dia de vencimento', c.diaVencimento ? `Dia ${c.diaVencimento}` : `Padrão da escola (dia ${Aulor.config().financeiro.diaVencimentoPadrao})`)}
            </dl>
          </div>`)}
      </div>`;
  }

  // Faixa-resumo acima das abas: responde no balcão "está em dia, o que cursa e com quem eu falo".
  const bloco = (rotulo, corpo) => `<div class="px-5 py-4 min-w-0"><p class="text-xs font-medium text-tinta-2">${rotulo}</p>${corpo}</div>`;
  const valor = (texto, cor = 'text-tinta') => `<p class="mt-1 font-display text-lg font-semibold leading-snug ${cor}">${texto}</p>`;
  const linha = (texto) => `<p class="mt-0.5 text-sm text-tinta-2">${texto}</p>`;
  const zap = (tel) => (tel ? ` <a class="link text-xs ml-1" target="_blank" rel="noopener" href="https://wa.me/55${tel}">WhatsApp</a>` : '');

  function blocoFinanceiro(a, parcelas) {
    const linkParcelas = `<a class="link text-xs" href="aluno.html?id=${a.id}&aba=financeiro">Ver parcelas</a>`;
    const devido = Aulor.inadimplentes().find((i) => i.aluno.id === a.id);
    if (devido) {
      const antiga = devido.parcelas.reduce((x, l) => (l.vencimento < x.vencimento ? l : x));
      const lembrete = lembreteCobranca(devido);
      const receber = Shell.pode('receber', 'registrar') ? `<button type="button" data-baixar="${antiga.id}" class="btn-sec btn-pequeno">Receber ${dataCurta(antiga.vencimento)}</button>` : '';
      return bloco('Financeiro', `
        ${valor(`${moeda(devido.total)} vencido`, 'text-ruim tabular-nums')}
        ${linha(`${devido.parcelas.length === 1 ? '1 parcela' : `${devido.parcelas.length} parcelas`} · a mais antiga há ${devido.maiorAtraso} ${devido.maiorAtraso === 1 ? 'dia' : 'dias'}`)}
        <div class="mt-3 flex flex-wrap items-center gap-2">
          ${receber}
          <button type="button" data-copiar-lembrete class="btn-sec btn-pequeno">${ICONE.copiar}Copiar lembrete</button>
          <a class="btn-sec btn-pequeno" target="_blank" rel="noopener" href="https://wa.me/55${lembrete.telefone}?text=${encodeURIComponent(lembrete.texto)}">WhatsApp</a>
        </div>`);
    }
    const proxima = parcelas.find((l) => Aulor.situacaoLancamento(l) === 'a_vencer');
    if (proxima) return bloco('Financeiro', `${valor('Em dia', 'text-bom')}${linha(`Próxima: <span class="tabular-nums">${moeda(proxima.valor)}</span> ${quando(proxima.vencimento)} (${dataCurta(proxima.vencimento)})`)}<div class="mt-2">${linkParcelas}</div>`);
    if (parcelas.length) return bloco('Financeiro', `${valor('Tudo pago', 'text-bom')}${linha(`${parcelas.length} ${parcelas.length === 1 ? 'parcela recebida' : 'parcelas recebidas'}`)}<div class="mt-2">${linkParcelas}</div>`);
    return bloco('Financeiro', `${valor('Sem cobranças')}${linha('Nenhuma parcela gerada ainda.')}`);
  }

  function blocoCurso(a, ms) {
    const ativas = ms.filter((m) => m.status === 'ativa');
    const m = ativas[0] ?? ms.find((x) => x.status === 'concluida') ?? ms[0];
    if (!m) return bloco('Curso', `${valor('Sem matrícula')}${linha('Matricule em uma turma para gerar as parcelas e acompanhar a frequência.')}`);
    const t = Aulor.turma(m.turmaId);
    const nome = `<a class="hover:underline" href="matricula.html?id=${m.id}">${esc(Aulor.curso(t.cursoId).nome)}</a>`;
    if (m.status === 'ativa') {
      const outros = ativas.length > 1 ? ` · <a class="link" href="aluno.html?id=${a.id}&aba=matriculas">+${ativas.length - 1} ${ativas.length > 2 ? 'cursos' : 'curso'}</a>` : '';
      return bloco('Cursando', `${valor(nome)}${linha(`Turma <a class="hover:underline" href="turma.html?id=${t.id}">${esc(t.codigo)}</a> · até ${dataBr(t.fim)}${outros}`)}<div class="mt-2">${barraFrequencia(Aulor.frequencia(m))}</div>`);
    }
    if (m.status === 'concluida') return bloco('Último curso', `${valor(nome)}${linha(`Concluído em ${dataBr(t.fim)} · ${m.resultado === 'aprovado' ? 'Aprovado' : 'Reprovado por frequência'}`)}`);
    return bloco('Curso', `${valor('Sem curso ativo')}${linha(`Matrícula em ${nome} cancelada em ${dataBr(m.canceladaEm)}`)}`);
  }

  function blocoContato(a) {
    const menor = Aulor.ehMenor(a);
    const r = (a.cobranca?.pagador === 'responsavel' && Aulor.responsavelFinanceiro(a)) || (menor ? Aulor.responsavelPrincipal(a) : null);
    if (r) {
      return bloco('Com quem falar', `${valor(esc(r.nome))}${linha(esc([r.parentesco, ...r.papeis.map((p) => NOME_PAPEL[p])].filter(Boolean).join(' · ')))}<p class="mt-2 text-sm tabular-nums text-tinta">${telefoneFmt(r.telefone)}${zap(r.telefone)}</p>`);
    }
    if (menor) return bloco('Com quem falar', `${valor('Sem responsável legal', 'text-aviso')}${linha('Aluno menor de idade precisa de pai, mãe ou tutor.')}<div class="mt-2"><a class="link text-xs" href="aluno.html?id=${a.id}&aba=responsaveis">Cadastrar responsável</a></div>`);
    return bloco('Com quem falar', `${valor('O próprio aluno')}${linha('Paga e recebe os avisos.')}<p class="mt-2 text-sm tabular-nums text-tinta">${telefoneFmt(a.telefone)}${zap(a.telefone)}</p>`);
  }

  function resumo(a, ms, parcelas, verFin) {
    const blocos = [verFin && blocoFinanceiro(a, parcelas), blocoCurso(a, ms), blocoContato(a)].filter(Boolean);
    return `<section data-resumo aria-label="Resumo do aluno" class="painel mb-5 grid ${blocos.length === 3 ? 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'lg:grid-cols-2'} divide-y lg:divide-y-0 lg:divide-x divide-linha">${blocos.join('')}</section>`;
  }

  function render() {
    const a = Aulor.aluno(id);
    if (!a) { tela.innerHTML = vazio('Aluno não encontrado', '', '<a class="btn-sec" href="alunos.html">Voltar para Alunos</a>'); return; }
    const s = Aulor.situacaoAluno(a);
    const ms = Aulor.matriculasDoAluno(a.id);
    const parcelas = Aulor.lancamentosDoAluno(a.id).filter((l) => l.status !== 'cancelado');
    const idade = Aulor.idade(a.nascimento);
    const verFin = Shell.pode('receber');
    const editar = Shell.pode('alunos', 'editar');
    const somar = (sit) => parcelas.filter((l) => Aulor.situacaoLancamento(l) === sit).reduce((x, l) => x + l.valor, 0);
    const vencido = somar('vencido');
    const aVencer = somar('a_vencer');
    const abas = [
      { id: 'dados', nome: 'Dados' },
      { id: 'responsaveis', nome: 'Responsáveis', n: (a.responsaveis ?? []).length },
      { id: 'endereco', nome: 'Endereço e pagamento' },
      { id: 'matriculas', nome: 'Matrículas', n: ms.length },
      verFin && { id: 'financeiro', nome: 'Financeiro' },
    ].filter(Boolean);
    const aba = abas.some((x) => x.id === parametroUrl('aba')) ? parametroUrl('aba') : 'dados';
    const acoes = Shell.pode('matriculas', 'criar') ? `<a href="matricula-nova.html?aluno=${a.id}" class="btn-pri">${ICONE.mais}Matricular</a>` : '';
    const corpo = {
      dados: () => abaDados(a, editar),
      responsaveis: () => abaResponsaveis(a, editar),
      endereco: () => abaEndereco(a, editar),
      matriculas: () => `<section class="painel">${ms.length ? `<ul class="divide-y divide-linha">${ms.map(blocoMatricula).join('')}</ul>` : vazio('Ainda sem matrícula', 'Matricule o aluno em uma turma para gerar as parcelas e acompanhar a frequência.', acoes)}</section>`,
      financeiro: () => `
        <section class="painel" data-parcelas>
          <div class="px-5 py-4 border-b border-linha flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-display font-semibold">Parcelas de todas as matrículas</h3>
            <span class="text-xs text-tinta-2 tabular-nums">${vencido || aVencer ? [vencido && `<span class="font-medium text-ruim">${moeda(vencido)} vencido</span>`, aVencer && `${moeda(aVencer)} a vencer`].filter(Boolean).join(' · ') : 'Nada em aberto'}</span>
          </div>
          ${tabelaParcelas(parcelas, { mostrarCurso: true })}
        </section>`,
    }[aba]();
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${parametroUrl('novo') ? `<div class="mb-4 rounded-xl border border-bom/30 bg-bom/10 px-4 py-3 text-sm text-tinta flex flex-wrap items-center justify-between gap-2">Cadastro criado. Próximo passo: matricular em uma turma. ${Shell.pode('matriculas', 'criar') ? `<a class="font-semibold underline" href="matricula-nova.html?aluno=${a.id}">Matricular agora</a>` : ''}</div>` : ''}
        ${cabecalhoPagina({ titulo: `${esc(a.nome)} <span class="align-middle ml-1">${pilula(s.tom, s.nome)}</span>`, subtitulo: `${idade != null ? `${idade} anos · ` : ''}CPF ${cpfFmt(a.cpf)} · ${telefoneFmt(a.telefone)}${a.endereco?.cidade ? ` · ${esc(a.endereco.cidade)}/${esc(a.endereco.uf)}` : ''} · aluno desde ${dataBr(a.criadoEm)}`, voltar: { href: 'alunos.html', rotulo: 'Alunos' }, acoes , registro: true})}
        ${resumo(a, ms, parcelas, verFin)}
        ${abasHtml(abas, aba)}
        ${corpo}
      </div>`;
    ligar(a);
  }

  function ligar(a) {
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirFormAluno({ aluno: a, aoSalvar: () => { toast('Dados atualizados'); render(); } })));
    const novoResp = () => abrirFormResponsavel({ aluno: a, aoSalvar: () => { toast('Responsável incluído'); render(); } });
    const editarPagamento = () => abrirFormEnderecoPagamento({ aluno: a, aoSalvar: () => { toast('Endereço e pagamento atualizados'); render(); } });
    tela.querySelector('[data-novo-resp]')?.addEventListener('click', novoResp);
    tela.querySelectorAll('[data-editar-endereco]').forEach((b) => b.addEventListener('click', editarPagamento));
    tela.querySelectorAll('[data-editar-resp]').forEach((b) => b.addEventListener('click', () => abrirFormResponsavel({ aluno: a, responsavel: a.responsaveis.find((r) => r.id === b.dataset.editarResp), aoSalvar: () => { toast('Responsável atualizado'); render(); } })));
    tela.querySelectorAll('[data-remover-resp]').forEach((b) => b.addEventListener('click', () => {
      const r = a.responsaveis.find((x) => x.id === b.dataset.removerResp);
      // A regra é checada antes da confirmação: em vez de "confirmar e falhar", explica e oferece a saída.
      const bloqueio = Aulor.bloqueioRemoverResponsavel(a, r);
      if (bloqueio) {
        const legal = bloqueio.papel === 'legal';
        confirmar({ titulo: `Ainda não dá para remover ${r.nome.split(' ')[0]}`, mensagem: bloqueio.erro, rotulo: legal ? 'Cadastrar outro responsável' : 'Mudar quem paga', aoConfirmar: legal ? novoResp : editarPagamento });
        return;
      }
      confirmar({ titulo: 'Remover responsável', mensagem: `${r.nome} deixa de constar como responsável por ${a.nome.split(' ')[0]}.`, rotulo: 'Remover', tom: 'perigo', aoConfirmar: () => {
        const res = Aulor.removerResponsavel(a.id, r.id);
        if (res.erro) { toast(res.erro, 'erro'); return; }
        toast('Responsável removido');
        render();
      } });
    }));
    const p = tela.querySelector('[data-parcelas]');
    if (p) ligarAcoesParcelas(p, render);
    ligarAcoesParcelas(tela.querySelector('[data-resumo]'), render);
    tela.querySelector('[data-copiar-lembrete]')?.addEventListener('click', () => copiarTexto(lembreteCobranca(Aulor.inadimplentes().find((i) => i.aluno.id === a.id)).texto, 'Lembrete copiado'));
  }

  render();
})();
