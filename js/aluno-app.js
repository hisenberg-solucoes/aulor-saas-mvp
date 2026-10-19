// ============================================================
// Ficha do aluno na direção "Ficha em cartões" do original: cabeçalho com
// avatar, chips e "Matricular"; faixas só quando alguém precisa agir (atraso,
// menor sem responsável legal); abas Dados, Responsáveis, Endereço e
// pagamento, Matrículas (frequência, nota e resultado) e Financeiro.
// Aba na URL: ?aba=.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');

  const NOME_PAPEL = Object.fromEntries(Aulor.PAPEIS_RESPONSAVEL.map((p) => [p.id, p.nome]));
  // Âmbar para quem assina pelo menor, petróleo para quem paga, neutra para emergência (DESIGN.md, Pills).
  const TOM_PAPEL = { legal: 'atencao', financeiro: 'info', emergencia: 'neutro' };
  const urlZap = (tel, texto = '') => `https://wa.me/55${tel}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
  const linkZap = (tel) => (tel ? ` <a class="link text-xs ml-1" target="_blank" rel="noopener" href="${urlZap(tel)}">WhatsApp</a>` : '');
  const botaoEditar = (atributo, pode) => (pode ? `<button type="button" ${atributo} class="btn-fantasma">${ICONE.editar}Editar</button>` : '');
  const nomeCurso = (m) => Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome;

  // ---------- Dados ----------

  function cartaoCurso(a, ms) {
    const ativas = ms.filter((m) => m.status === 'ativa');
    const m = ativas[0] ?? ms.find((x) => x.status === 'concluida') ?? ms[0];
    const acao = ms.length ? `<a class="btn-fantasma" href="aluno.html?id=${a.id}&aba=matriculas">Ver matrículas</a>` : '';
    if (!m) return cartao({ titulo: 'Curso', contexto: 'O que o aluno cursa agora.', corpo: `<p class="p-4 text-sm ${APOIO}">Sem matrícula. Matricule em uma turma para gerar as parcelas e acompanhar a frequência.</p>` });
    const t = Aulor.turma(m.turmaId);
    const c = Aulor.curso(t.cursoId);
    const curso = `<a class="link" href="matricula.html?id=${m.id}">${esc(c.nome)}</a>`;
    const turma = `<a class="link" href="turma.html?id=${t.id}">${esc(t.codigo)}</a>`;
    if (m.status === 'ativa') {
      return cartao({ titulo: 'Curso', contexto: 'O que o aluno cursa agora.', acao, corpo: gradeCampos([
        campoValor('Cursando', curso, 'sm:col-span-2'),
        campoValor('Turma', `${turma} · até ${dataBr(t.fim)}`),
        campoValor('Frequência', barraFrequencia(Aulor.frequencia(m))),
        ativas.length > 1 && campoValor('Outros cursos em andamento', esc(ativas.slice(1).map(nomeCurso).join(', ')), 'sm:col-span-2'),
      ]) });
    }
    if (m.status === 'concluida') {
      const r = Aulor.RESULTADO[m.resultado];
      return cartao({ titulo: 'Curso', contexto: 'Nenhum curso em andamento; este é o último concluído.', acao, corpo: gradeCampos([
        campoValor('Último curso', curso, 'sm:col-span-2'),
        campoValor('Turma', `${turma} · concluída em ${dataBr(m.concluidaEm ?? t.fim)}`),
        campoValor('Resultado', r ? status(r.tom, r.nome) : ''),
        Aulor.temNota(c) && campoValor('Nota final', `<span class="tabular-nums">${Aulor.fmtNota(m.notaFinal)}</span> <span class="text-xs ${APOIO}">· mínimo ${Aulor.fmtNota(c.notaMinima)}</span>`),
      ]) });
    }
    return cartao({ titulo: 'Curso', contexto: 'Nenhum curso em andamento.', acao, corpo: `<p class="p-4 text-sm ${APOIO}">Matrícula em ${curso} cancelada em ${dataBr(m.canceladaEm)}.</p>` });
  }

  function cartaoFinanceiro(a, parcelas, devido) {
    const proxima = parcelas.find((l) => Aulor.situacaoLancamento(l) === 'a_vencer');
    const pagas = parcelas.filter((l) => l.status === 'pago');
    return cartao({
      titulo: 'Situação financeira',
      contexto: 'Parcelas vencidas, a próxima a vencer e o que já entrou, de todas as matrículas.',
      acao: parcelas.length ? `<a class="btn-fantasma" href="aluno.html?id=${a.id}&aba=financeiro">Ver parcelas</a>` : '',
      classe: devido ? 'border-red-300 dark:border-red-800' : '',
      corpo: parcelas.length ? gradeCampos([
        campoValor('Em atraso', devido ? `<span class="font-medium text-red-700 dark:text-red-400 tabular-nums">${moeda(devido.total)}</span> · ${plural(devido.parcelas.length, 'parcela', 'parcelas')}, a mais antiga há ${plural(devido.maiorAtraso, 'dia', 'dias')}` : 'Nenhuma parcela vencida.', 'sm:col-span-2'),
        campoValor('Próxima parcela', proxima ? `<span class="tabular-nums">${moeda(proxima.valor)}</span> ${quando(proxima.vencimento)} <span class="text-xs ${APOIO}">· ${dataCurta(proxima.vencimento)}</span>` : ''),
        campoValor('Recebido', pagas.length ? `<span class="tabular-nums">${moeda(pagas.reduce((s, l) => s + (l.valorPago ?? l.valor), 0))}</span> <span class="text-xs ${APOIO}">· ${plural(pagas.length, 'parcela', 'parcelas')}</span>` : ''),
      ]) : `<p class="p-4 text-sm ${APOIO}">Nenhuma parcela gerada ainda.</p>`,
    });
  }

  function abaDados(a, ms, parcelas, devido, editar, verFin) {
    const idade = Aulor.idade(a.nascimento);
    const menor = Aulor.ehMenor(a);
    // Com quem falar quando não é o próprio aluno: quem paga por ele ou, se menor, o responsável principal.
    const r = (a.cobranca?.pagador === 'responsavel' && Aulor.responsavelFinanceiro(a)) || (menor ? Aulor.responsavelPrincipal(a) : null);
    return `
      <div class="grid gap-4 xl:grid-cols-2">
        ${cartao({ titulo: 'Identificação', contexto: 'Como sai no contrato e no certificado.', acao: botaoEditar('data-editar', editar), corpo: gradeCampos([
          campoValor('Nome completo', esc(a.nome), 'sm:col-span-2'),
          campoValor('CPF', `<span class="font-mono">${cpfFmt(a.cpf)}</span>`),
          campoValor('RG', esc(a.rg)),
          campoValor('Nascimento', a.nascimento ? `${dataBr(a.nascimento)}${idade != null ? ` <span class="text-xs ${APOIO}">· ${idade} anos</span>` : ''}` : ''),
          campoValor('Como conheceu a escola', esc(a.origem)),
          campoValor('Aluno desde', dataBr(a.criadoEm)),
        ]) })}
        ${cartao({ titulo: 'Contato', contexto: 'Por onde a escola fala com o aluno: avisos, cobrança e certificado.', acao: botaoEditar('data-editar', editar), corpo: gradeCampos([
          campoValor('Celular / WhatsApp', `<span class="tabular-nums">${telefoneFmt(a.telefone)}</span>${linkZap(a.telefone)}`),
          campoValor('E-mail', esc(a.email)),
          r && campoValor('Falar com', `${esc(r.nome)} <span class="text-xs ${APOIO}">· ${esc([r.parentesco, ...r.papeis.map((p) => NOME_PAPEL[p])].filter(Boolean).join(' · '))}</span><br><span class="tabular-nums">${telefoneFmt(r.telefone)}</span>${linkZap(r.telefone)}`, 'sm:col-span-2'),
          campoValor('Observações', a.observacoes ? `<span class="whitespace-pre-line">${esc(a.observacoes)}</span>` : '', 'sm:col-span-2'),
        ]) })}
        ${cartaoCurso(a, ms)}
        ${verFin ? cartaoFinanceiro(a, parcelas, devido) : ''}
      </div>`;
  }

  // ---------- Responsáveis ----------

  function abaResponsaveis(a, editar) {
    const lista = a.responsaveis ?? [];
    const menor = Aulor.ehMenor(a);
    return `
      ${cartao({
        titulo: 'Responsáveis',
        contexto: menor ? 'Aluno menor de idade: precisa de pelo menos um responsável legal.' : 'Opcional para maiores de idade: quem paga ou contato de emergência.',
        acao: editar ? `<button type="button" data-novo-resp class="btn-fantasma">${ICONE.mais}Novo responsável</button>` : '',
        classe: 'overflow-hidden',
        corpo: lista.length ? `
          <div class="mt-3 overflow-x-auto"><table class="tabela">
            <thead><tr><th>Responsável</th><th>Papéis</th><th>Celular</th><th>CPF</th>${editar ? '<th></th>' : ''}</tr></thead>
            <tbody>${lista.map((r) => `<tr>
              <td><div class="flex items-center gap-3 min-w-[13rem]">${avatar(r.nome)}<div class="min-w-0"><p class="font-medium ${TITULO}">${esc(r.nome)}</p><p class="text-xs ${APOIO} truncate">${esc([r.parentesco, r.email].filter(Boolean).join(' · ') || '—')}</p></div></div></td>
              <td><div class="flex flex-wrap gap-1">${r.papeis.map((p) => pilula(TOM_PAPEL[p], NOME_PAPEL[p])).join('')}</div></td>
              <td class="whitespace-nowrap tabular-nums">${telefoneFmt(r.telefone)}${linkZap(r.telefone)}</td>
              <td class="whitespace-nowrap">${r.cpf ? `<span class="font-mono">${cpfFmt(r.cpf)}</span>` : `<span class="${APOIO}">—</span>`}</td>
              ${editar ? `<td class="text-right"><button type="button" data-menu-resp="${r.id}" class="btn-fantasma btn-pequeno" aria-haspopup="menu" aria-expanded="false" aria-label="Ações de ${esc(r.nome)}">⋯</button></td>` : ''}
            </tr>`).join('')}</tbody>
          </table></div>` : vazio('Nenhum responsável cadastrado', menor ? 'Cadastre o responsável legal para poder matricular.' : ''),
      })}
      <p class="mt-3 text-xs ${APOIO_FUNDO}">Papéis: <b class="font-medium">Legal</b> responde e assina pelo menor · <b class="font-medium">Financeiro</b> é quem paga (contrato e boleto no nome dele; só um por aluno) · <b class="font-medium">Emergência</b> recebe avisos de falta e ocorrências.</p>`;
  }

  // ---------- Endereço e pagamento ----------

  function abaEndereco(a, editar) {
    const e = a.endereco ?? {};
    const c = a.cobranca ?? {};
    const fin = Aulor.responsavelFinanceiro(a);
    const pagaResp = c.pagador === 'responsavel' && fin;
    const botao = botaoEditar('data-editar-endereco', editar);
    const preferencias = [
      campoValor('Forma preferida', c.formaPreferida ? esc(nomeForma(c.formaPreferida)) : ''),
      campoValor('Dia de vencimento', c.diaVencimento ? `Dia ${c.diaVencimento}` : `Padrão da escola (dia ${Aulor.config().financeiro.diaVencimentoPadrao})`),
    ];
    return `
      <div class="grid gap-4 xl:grid-cols-2">
        ${cartao({ titulo: 'Endereço', contexto: 'Vai para o contrato e para a cobrança quando o próprio aluno paga.', acao: botao, corpo: e.logradouro || e.cidade ? gradeCampos([
          campoValor('CEP', e.cep ? e.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : ''),
          campoValor('Logradouro', esc([e.logradouro, e.numero].filter(Boolean).join(', '))),
          campoValor('Complemento', esc(e.complemento)),
          campoValor('Bairro', esc(e.bairro)),
          campoValor('Cidade', e.cidade ? `${esc(e.cidade)}${e.uf ? `/${esc(e.uf)}` : ''}` : ''),
        ]) : `<p class="p-4 text-sm ${APOIO}">Endereço ainda não informado.</p>` })}
        ${cartao({ titulo: 'Quem paga', contexto: 'Em nome de quem saem contrato e cobrança. Vale como sugestão na próxima matrícula.', acao: botao, corpo: gradeCampos(pagaResp ? [
          campoValor('Responsável financeiro', `${esc(fin.nome)}${fin.parentesco ? ` <span class="text-xs ${APOIO}">· ${esc(fin.parentesco)}</span>` : ''}`, 'sm:col-span-2'),
          campoValor('CPF', fin.cpf ? `<span class="font-mono">${cpfFmt(fin.cpf)}</span>` : `<span class="${AVISO}">Falta o CPF</span>`),
          campoValor('Celular', `<span class="tabular-nums">${telefoneFmt(fin.telefone)}</span>`),
          ...preferencias,
        ] : [
          campoValor('Quem paga', `O próprio aluno <span class="block text-xs ${APOIO}">Contrato e cobrança em nome de ${esc(a.nome)}, CPF ${cpfFmt(a.cpf)}.</span>${Aulor.ehMenor(a) ? `<span class="block mt-1 ${AVISO}">Aluno menor de idade: o contrato precisa de um responsável.</span>` : ''}`, 'sm:col-span-2'),
          ...preferencias,
        ]) })}
      </div>`;
  }

  // ---------- Matrículas ----------

  function abaMatriculas(a, ms, verFin) {
    if (!ms.length) return cartao({ titulo: 'Matrículas', corpo: vazio('Ainda sem matrícula', 'Matricule o aluno em uma turma para gerar as parcelas e acompanhar a frequência.') });
    const comNota = ms.some((m) => Aulor.temNota(Aulor.curso(Aulor.turma(m.turmaId).cursoId)));
    const linha = (m) => {
      const t = Aulor.turma(m.turmaId);
      const c = Aulor.curso(t.cursoId);
      const e = Aulor.elegibilidade(m);
      const st = Aulor.STATUS_MATRICULA[m.status];
      const r = m.status === 'concluida' ? Aulor.RESULTADO[m.resultado] : null;
      const ps = Aulor.parcelasDaMatricula(m.id).filter((l) => l.status !== 'cancelado');
      const pagas = ps.filter((l) => l.status === 'pago').length;
      const vencidas = ps.filter((l) => Aulor.situacaoLancamento(l) === 'vencido').length;
      // Certificado só entra na linha de quem foi aprovado (o reprovado já diz o motivo no resultado).
      const certificado = e.id === 'emitido' ? `Certificado <a class="link" href="certificado.html?id=${e.certificado.id}">${esc(e.certificado.codigo)}</a>`
        : e.id === 'elegivel' ? `<span class="${AVISO}">Certificado pronto para emitir</span>`
        : m.status === 'concluida' && m.resultado === 'aprovado' ? `Certificado: ${esc(e.nome.toLowerCase())}` : '';
      return `
        <tr data-href="matricula.html?id=${m.id}" class="${FOCO_LINHA} ${m.status === 'cancelada' ? 'linha-apagada' : ''}">
          <td class="min-w-[15rem]"><a href="matricula.html?id=${m.id}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(c.nome)}</a>
            <p class="text-xs ${APOIO}">Turma <a class="hover:underline" href="turma.html?id=${t.id}">${esc(t.codigo)}</a> · ${dataBr(t.inicio)} a ${dataBr(t.fim)} · matrícula ${esc(m.codigo)}</p></td>
          <td>${m.status === 'cancelada' ? `<span class="${APOIO}">—</span>` : barraFrequencia(Aulor.frequencia(m), { compacta: true })}</td>
          ${comNota ? `<td class="whitespace-nowrap">${Aulor.temNota(c) && m.notaFinal != null ? `<span class="tabular-nums">${Aulor.fmtNota(m.notaFinal)}</span> <span class="text-xs ${APOIO}">mín. ${Aulor.fmtNota(c.notaMinima)}</span>` : `<span class="${APOIO}">—</span>`}</td>` : ''}
          <td>${r ? status(r.tom, r.nome) : status(st.tom, st.nome)}${m.status === 'cancelada' ? `<p class="text-xs ${APOIO}">Em ${dataBr(m.canceladaEm)} — ${esc(m.motivoCancelamento)}</p>` : certificado ? `<p class="text-xs ${APOIO}">${certificado}</p>` : ''}</td>
          ${verFin ? `<td class="whitespace-nowrap">${ps.length ? `<span class="tabular-nums">${pagas} de ${ps.length} pagas</span>${vencidas ? `<p class="text-xs text-red-700 dark:text-red-400">${plural(vencidas, 'vencida', 'vencidas')}</p>` : ''}` : `<span class="${APOIO}">—</span>`}</td>` : ''}
        </tr>`;
    };
    return cartao({
      titulo: 'Matrículas',
      contexto: `Turma, frequência${comNota ? ', nota final' : ''} e resultado de cada curso. A linha abre a matrícula.`,
      classe: 'overflow-hidden',
      corpo: `
        <div class="mt-3 overflow-x-auto"><table class="tabela">
          <thead><tr><th>Curso e turma</th><th>Frequência</th>${comNota ? '<th>Nota final</th>' : ''}<th>Situação</th>${verFin ? '<th>Parcelas</th>' : ''}</tr></thead>
          <tbody>${ms.map(linha).join('')}</tbody>
        </table></div>`,
    });
  }

  // ---------- Financeiro ----------

  function abaFinanceiro(a, parcelas, devido) {
    const somar = (sit) => parcelas.filter((l) => Aulor.situacaoLancamento(l) === sit).reduce((x, l) => x + l.valor, 0);
    const vencido = somar('vencido');
    const aVencer = somar('a_vencer');
    const lembrete = devido && lembreteCobranca(devido);
    return cartao({
      titulo: 'Parcelas de todas as matrículas',
      contexto: vencido || aVencer ? [vencido && `<span class="font-medium text-red-700 dark:text-red-400">${moeda(vencido)} vencido</span>`, aVencer && `${moeda(aVencer)} a vencer`].filter(Boolean).join(' · ') : 'Nada em aberto.',
      acao: lembrete ? `<button type="button" data-copiar-lembrete class="btn-fantasma">${ICONE.copiar}Copiar lembrete</button><a class="btn-fantasma" target="_blank" rel="noopener" href="${urlZap(lembrete.telefone, lembrete.texto)}">${ICONE.whatsapp}Enviar no WhatsApp</a>` : '',
      classe: 'overflow-hidden',
      atributos: 'data-parcelas',
      corpo: `<div class="mt-3">${tabelaParcelas(parcelas, { mostrarCurso: true })}</div>`,
    });
  }

  // ---------- Ficha ----------

  function render() {
    const a = Aulor.aluno(id);
    if (!a) { tela.innerHTML = vazio('Aluno não encontrado', '', '<a class="btn-sec" href="alunos.html">Voltar para Alunos</a>'); return; }
    const s = Aulor.situacaoAluno(a);
    const ms = Aulor.matriculasDoAluno(a.id);
    const parcelas = Aulor.lancamentosDoAluno(a.id).filter((l) => l.status !== 'cancelado');
    const idade = Aulor.idade(a.nascimento);
    const verFin = Shell.pode('receber');
    const editar = Shell.pode('alunos', 'editar');
    const podeMatricular = Shell.pode('matriculas', 'criar');
    const devido = verFin ? Aulor.inadimplentes().find((i) => i.aluno.id === a.id) : null;
    const menor = Aulor.ehMenor(a);
    const semLegal = menor && !(a.responsaveis ?? []).some((r) => r.papeis.includes('legal'));
    const fin = Aulor.responsavelFinanceiro(a);
    const pagaResp = a.cobranca?.pagador === 'responsavel' && fin;
    const novo = !!parametroUrl('novo');
    const abas = [
      { id: 'dados', nome: 'Dados' },
      { id: 'responsaveis', nome: 'Responsáveis', n: (a.responsaveis ?? []).length },
      { id: 'endereco', nome: 'Endereço e pagamento' },
      { id: 'matriculas', nome: 'Matrículas', n: ms.length },
      verFin && { id: 'financeiro', nome: 'Financeiro', n: devido?.parcelas.length, atencao: true },
    ].filter(Boolean);
    const aba = abas.some((x) => x.id === parametroUrl('aba')) ? parametroUrl('aba') : 'dados';
    const motivoEditar = 'Seu perfil não pode editar alunos';
    const mais = [
      !podeMatricular && { nome: 'Matricular', desabilitado: true, detalhe: 'Seu perfil não pode matricular', acao: () => {} },
      { nome: 'Editar dados', detalhe: editar ? 'Identificação e contato' : motivoEditar, desabilitado: !editar, acao: () => editarDados(a) },
      { nome: 'Novo responsável', detalhe: editar ? 'Legal, financeiro ou emergência' : motivoEditar, desabilitado: !editar, acao: () => novoResp(a) },
      { nome: 'Endereço e pagamento', detalhe: editar ? 'Quem paga, forma e dia de vencimento' : motivoEditar, desabilitado: !editar, acao: () => editarPagamento(a) },
    ];
    // Exceções só: "Ativo" e "paga o próprio aluno" não se anunciam; o que a faixa diz não vira pílula.
    const pilulas = [
      s.id !== 'ativo' && !novo ? pilula(s.tom === 'atencao' ? 'atencao' : 'neutro', s.nome) : '',
      menor && !semLegal ? pilula('atencao', 'Menor de idade', `${idade} anos`) : '',
      pagaResp ? pilula('info', 'Paga: responsável', `${fin.nome} (responsável financeiro)`) : '',
    ].join('');
    const faixas = [
      devido && faixa('erro', `<span class="font-medium">${moeda(devido.total)} vencido</span> em ${plural(devido.parcelas.length, 'parcela', 'parcelas')}, a mais antiga há ${plural(devido.maiorAtraso, 'dia', 'dias')}${pagaResp ? `. Quem paga: ${esc(fin.nome)}` : ''}.`, aba === 'financeiro' ? '' : `<a class="btn-sec btn-pequeno" href="aluno.html?id=${a.id}&aba=financeiro">Ver financeiro</a>`),
      semLegal && faixa('aviso', '<span class="font-medium">Menor de idade sem responsável legal.</span> O contrato precisa ser assinado por pai, mãe ou tutor com o papel Legal.', editar ? '<button type="button" data-novo-resp class="btn-sec btn-pequeno">Cadastrar responsável</button>' : ''),
      novo && faixa('passo', '<span class="font-medium">Cadastro criado.</span> Próximo passo: matricular em uma turma.', podeMatricular ? `<a class="btn-sec btn-pequeno" href="matricula-nova.html?aluno=${a.id}">Matricular agora</a>` : ''),
    ].filter(Boolean).join('');
    const corpo = {
      dados: () => abaDados(a, ms, parcelas, devido, editar, verFin),
      responsaveis: () => abaResponsaveis(a, editar),
      endereco: () => abaEndereco(a, editar),
      matriculas: () => abaMatriculas(a, ms, verFin),
      financeiro: () => abaFinanceiro(a, parcelas, devido),
    }[aba]();
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoFicha({
          trilha: [{ rotulo: 'Alunos', href: 'alunos.html' }, { rotulo: esc(a.nome) }],
          avatar: avatar(a.nome, 'h-12 w-12 text-base'),
          nome: esc(a.nome),
          pilulas,
          chips: [
            chip(ICONE.pessoa, `<span class="font-mono">${cpfFmt(a.cpf)}</span>${idade != null ? ` · ${idade} anos` : ''}`, 'CPF · idade'),
            a.telefone && chip(ICONE.telefone, `<span class="tabular-nums">${telefoneFmt(a.telefone)}</span>`, 'Celular'),
            a.email && chip(ICONE.email, esc(a.email), 'E-mail'),
            a.endereco?.cidade && chip(ICONE.local, `${esc(a.endereco.cidade)}${a.endereco.uf ? `/${esc(a.endereco.uf)}` : ''}`, 'Cidade'),
          ],
          acoes: `${a.telefone ? `<a class="btn-sec w-9 px-0" target="_blank" rel="noopener" href="${urlZap(a.telefone)}" title="WhatsApp ${telefoneFmt(a.telefone)}" aria-label="Abrir conversa no WhatsApp">${ICONE.whatsapp}</a>` : ''}${podeMatricular ? `<a href="matricula-nova.html?aluno=${a.id}" class="btn-pri">${ICONE.mais}Matricular</a>` : ''}`,
          mais,
        })}
        ${faixas}
        ${abasHtml(abas, aba)}
        ${corpo}
      </div>`;
    ligar(a, mais);
  }

  const editarDados = (a) => abrirFormAluno({ aluno: a, aoSalvar: () => { toast('Dados atualizados'); render(); } });
  const novoResp = (a) => abrirFormResponsavel({ aluno: a, aoSalvar: () => { toast('Responsável incluído'); render(); } });
  const editarPagamento = (a) => abrirFormEnderecoPagamento({ aluno: a, aoSalvar: () => { toast('Endereço e pagamento atualizados'); render(); } });

  function removerResp(a, r) {
    // A regra é checada antes da confirmação: em vez de "confirmar e falhar", explica e oferece a saída.
    const bloqueio = Aulor.bloqueioRemoverResponsavel(a, r);
    if (bloqueio) {
      const legal = bloqueio.papel === 'legal';
      confirmar({ titulo: `Ainda não dá para remover ${r.nome.split(' ')[0]}`, mensagem: bloqueio.erro, rotulo: legal ? 'Cadastrar outro responsável' : 'Mudar quem paga', aoConfirmar: () => (legal ? novoResp(a) : editarPagamento(a)) });
      return;
    }
    confirmar({ titulo: 'Remover responsável', mensagem: `${r.nome} deixa de constar como responsável por ${a.nome.split(' ')[0]}.`, rotulo: 'Remover', tom: 'perigo', aoConfirmar: () => {
      const res = Aulor.removerResponsavel(a.id, r.id);
      if (res.erro) { toast(res.erro, 'erro'); return; }
      toast('Responsável removido');
      render();
    } });
  }

  function ligar(a, mais) {
    tela.querySelector('[data-mais]')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, mais));
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => editarDados(a)));
    tela.querySelectorAll('[data-novo-resp]').forEach((b) => b.addEventListener('click', () => novoResp(a)));
    tela.querySelectorAll('[data-editar-endereco]').forEach((b) => b.addEventListener('click', () => editarPagamento(a)));
    tela.querySelectorAll('[data-menu-resp]').forEach((b) => b.addEventListener('click', () => {
      const r = a.responsaveis.find((x) => x.id === b.dataset.menuResp);
      abrirMenu(b, [
        { nome: 'Editar responsável', detalhe: 'Dados de contato e papéis', acao: () => abrirFormResponsavel({ aluno: a, responsavel: r, aoSalvar: () => { toast('Responsável atualizado'); render(); } }) },
        'sep',
        { nome: 'Remover', perigo: true, acao: () => removerResp(a, r) },
      ]);
    }));
    ligarLinhasLink(tela);
    const p = tela.querySelector('[data-parcelas]');
    if (p) ligarAcoesParcelas(p, render);
    tela.querySelector('[data-copiar-lembrete]')?.addEventListener('click', () => copiarTexto(lembreteCobranca(Aulor.inadimplentes().find((i) => i.aluno.id === a.id)).texto, 'Lembrete copiado'));
  }

  render();
})();
