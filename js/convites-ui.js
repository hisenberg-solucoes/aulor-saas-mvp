// ============================================================
// UI do convite de cadastro (AULOR-007), igual em Instrutores e Colaboradores:
// a lista "Convidados", o formulário de convidar e reenviar, o convite depois
// do aceite e o convite pela ficha no cartão Acesso ao sistema. Regras em
// js/convites-cadastro.js.
// Depende do que cada tela já tem, lido na hora da chamada: esc, toast,
// abrirModal e fecharModal (avaliacoes-ui), drawerFormulario, campoTexto,
// campoSelect, cartoesRadio e ERRO (o *-app.js), as classes BOTAO_*, APOIO,
// CARTAO, TH, TD e FOCO_LINHA, e Acesso (acesso.js). Carregar antes do *-app.js.
// ============================================================

const ConvitesUI = (() => {
  const PAPEL = {
    instrutor: { tela: 'instrutores', convidar: 'Convidar instrutor', vazio: 'Nenhum instrutor convidado aguardando.' },
    colaborador: { tela: 'colaboradores', convidar: 'Convidar colaborador', vazio: 'Nenhum colaborador convidado aguardando.' },
  };
  const urlFicha = (ref) => (ref.papel === 'instrutor' ? 'instrutor.html' : 'colaborador.html') + `?id=${encodeURIComponent(ref.id)}`;
  const ENVIAR = '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>';
  const EXTERNO = '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>';
  const SELO = {
    neutra: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
    falta: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  };
  const PERIGO = 'px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40';
  const LINK_PERIGO = 'inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 hover:underline';
  const fmt = (iso) => Instrutores.fmtData(iso);

  // D8: convidar, reenviar e cancelar pedem a permissão do papel (Cadastrar na lista, Editar na ficha) e as do
  // convite. shortcut: o protótipo não tem "Convidar usuários" nem "Gerenciar perfis"; o Editar de Perfis de acesso faz as duas.
  const pode = (papel, acao) => Acesso.pode(PAPEL[papel].tela, acao) && Acesso.pode('perfis', 'editar');

  function selo(cv) {
    const s = Convites.situacaoDe(cv);
    return `<span title="${esc(s.descricao)}" class="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${s.acao ? SELO.falta : SELO.neutra}">${esc(s.nome)}</span>`;
  }
  function quando(cv) {
    const s = Convites.situacao(cv);
    if (s === 'enviado') return `Enviado em ${fmt(cv.emitidoEm)} · vale até ${fmt(Convites.expiraEm(cv))}`;
    if (s === 'expirado') return `Enviado em ${fmt(cv.emitidoEm)} · venceu em ${fmt(Convites.expiraEm(cv))}`;
    if (cv.aceitoEm) return `Aceito em ${fmt(cv.aceitoEm)}`;
    return `Emitido em ${fmt(cv.emitidoEm)}`;
  }
  const detalhe = (cv) => (cv.papel === 'instrutor'
    ? [REMUNERACOES_INSTRUTOR.find((r) => r.id === cv.dados.remuneracao)?.nome, cv.dados.especialidade]
    : [cv.dados.cargo, DEPARTAMENTOS.find((d) => d.id === cv.dados.departamentoId)?.nome]).filter(Boolean).join(' · ');
  // O link do e-mail não aparece na tela (D5); no protótipo, este atalho faz o papel dele.
  const comoConvidado = (cv) => (['enviando', 'falha'].includes(cv.estado) ? '' : `
    <p class="${APOIO}"><a href="convite.html?id=${encodeURIComponent(cv.id)}" target="_blank" rel="noopener" class="${BOTAO_LINK}">Abrir como o convidado ${EXTERNO}</a> · protótipo: faz o papel do link do e-mail.</p>`);

  // ---------- Lista "Convidados" ----------

  function tabela(convites, papel, buscando) {
    const linha = (cv) => `
      <tr data-convite="${cv.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA}">
        <td class="${TH}">
          <div class="flex items-center gap-3 min-w-0">
            <div aria-hidden="true" class="h-9 w-9 shrink-0 rounded-full border border-dashed border-slate-400 dark:border-neutral-600 text-slate-600 dark:text-neutral-300 grid place-items-center font-display text-xs font-semibold">${esc(Instrutores.iniciais(cv.nome))}</div>
            <div class="min-w-0">
              <p class="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-neutral-100"><button type="button" data-abrir-convite="${cv.id}" class="link-registro max-w-full truncate text-left hover:underline underline-offset-2 focus-visible:outline-none">${esc(cv.nome)}</button></p>
              <p class="mt-0.5 flex items-center gap-1.5 min-w-0">${selo(cv)}<span class="${APOIO} truncate">${esc(detalhe(cv))}</span></p>
            </div>
          </div>
        </td>
        <td class="${TD}"><p class="truncate" title="${esc(cv.email)}">${esc(cv.email)}</p>${cv.dados.whatsapp ? `<p class="${APOIO} tabular-nums">${esc(Instrutores.fmtTelefone(cv.dados.whatsapp))}</p>` : ''}</td>
        <td class="${TD}"><p class="${APOIO}">${quando(cv)}</p></td>
      </tr>`;
    return `
      <div class="${CARTAO} overflow-x-auto">
        <table data-tabela-convites class="w-full table-fixed text-left">
          <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">
            <tr><th class="${TH}">Convidado</th><th class="${TH} w-[240px]">E-mail do convite</th><th class="${TH} w-[220px]">Convite</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
            ${convites.length ? convites.map(linha).join('') : `<tr><td colspan="3" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">${buscando ? 'Nenhum convite corresponde à busca.' : PAPEL[papel].vazio}</td></tr>`}
          </tbody>
        </table>
        <div class="px-4 py-2 border-t border-slate-100 dark:border-neutral-900 ${APOIO} tabular-nums">${convites.length} ${convites.length === 1 ? 'convite' : 'convites'} · some da lista quando a pessoa envia o cadastro</div>
      </div>`;
  }
  function ligarTabela(el, aoMudar) {
    el.querySelector('[data-tabela-convites]')?.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-convite]');
      if (tr && !getSelection().toString()) abrirConvite(tr.dataset.convite, aoMudar);
    });
  }

  // ---------- Convidar e reenviar ----------

  // pessoa: { id, nome, email } no convite pela ficha; cv: o convite a reenviar (antes do aceite).
  function abrirFormulario({ papel, cv = null, pessoa = null, aoMudar }) {
    const pessoaId = pessoa?.id ?? cv?.pessoaId ?? null;
    const d = cv ? { nome: cv.nome, email: cv.email, perfilId: cv.perfilId, ...cv.dados } : { email: pessoa?.email ?? '', remuneracao: 'pj' };
    const s = cv && Convites.situacaoDe(cv);
    const perfil = campoSelect('perfilId', 'Perfil de acesso', Convites.perfisAtivos().map((p) => ({ id: p.id, nome: p.nome })), d.perfilId, { vazio: 'Escolha o perfil' });
    const email = `${campoTexto('email', 'E-mail do convite', d.email, { tipo: 'email', max: 120, placeholder: 'nome@exemplo.com.br' })}
      <div data-aviso-email aria-live="polite"></div>`;
    const doPapel = pessoaId ? '' : papel === 'instrutor' ? `
      <fieldset><legend class="rotulo">Remuneração</legend>${cartoesRadio('remuneracao', REMUNERACOES_INSTRUTOR, d.remuneracao)}${ERRO('remuneracao')}</fieldset>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('whatsapp', 'WhatsApp', Instrutores.fmtTelefone(d.whatsapp), { placeholder: '(47) 99999-9999', max: 16, extra: 'inputmode="tel"', opcional: true })}
        ${campoTexto('especialidade', 'Especialidade', d.especialidade, { placeholder: 'Ex.: Java e Spring', max: 80, opcional: true })}
      </div>` : `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('cargo', 'Cargo', d.cargo, { placeholder: 'Ex.: Analista financeiro', max: 60 })}
        ${campoSelect('departamentoId', 'Departamento', DEPARTAMENTOS, d.departamentoId, { vazio: 'Escolha o departamento' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('admissao', 'Admissão', d.admissao, { tipo: 'date' })}
        ${campoTexto('emailCorporativo', 'E-mail corporativo', d.emailCorporativo, { tipo: 'email', max: 120, opcional: true })}
      </div>
      <p class="${APOIO}">O e-mail do convite pode ser o corporativo ou outro, conforme a escola entra (Microsoft ou e-mail e senha).</p>`;
    const nome = pessoa?.nome ?? cv?.nome ?? '';
    const { form, fechar } = drawerFormulario({
      id: 'form-convite',
      titulo: cv ? 'Convite de cadastro' : pessoaId ? 'Enviar convite' : PAPEL[papel].convidar,
      subtitulo: pessoaId ? `Dá acesso ao Aulor a <strong>${esc(nome)}</strong>. Quando aceitar o convite, a ficha fica ligada ao usuário dele, sem formulário.`
        : `Só o que a escola sabe. ${papel === 'instrutor' ? 'O instrutor' : 'O colaborador'} entra com este e-mail e completa CPF, nascimento e contato. Ninguém entra na lista de ${PAPEL[papel].tela} antes disso.`,
      rotulo: cv ? 'Reenviar convite' : 'Enviar convite',
      largura: 'max-w-lg',
      foco: pessoaId ? '#f-email' : '#f-nome',
      corpo: `
        ${s ? `<div class="space-y-1.5"><p>${selo(cv)}</p><p class="${APOIO}">${quando(cv)} · ${esc(s.descricao)} Reenviar corrige os dados e renova o prazo de ${Convites.PRAZO_DIAS} dias.</p></div>` : ''}
        ${pessoaId ? '' : campoTexto('nome', 'Nome completo', d.nome, { max: 120 })}
        ${email}
        ${perfil}
        ${doPapel}
        <p class="${APOIO}">O e-mail sai pelo Aulor, sem link na tela. Ele vale por ${Convites.PRAZO_DIAS} dias.</p>
        ${cv ? `<div class="pt-1 flex flex-wrap items-center gap-x-4 gap-y-2"><button type="button" data-cancelar-convite class="${LINK_PERIGO}">Cancelar convite</button></div>${comoConvidado(cv)}` : ''}`,
      aoSalvar: (fd) => {
        const dados = Object.fromEntries(fd);
        const erros = Convites.validar(dados, { papel, pessoaId, excetoId: cv?.id });
        if (erros.length) return erros;
        const novo = cv ? Convites.reenviar(cv.id, dados) : Convites.emitir(dados, { papel, pessoaId, nome });
        toast(cv ? `Convite reenviado para ${novo.email}; vale por mais ${Convites.PRAZO_DIAS} dias.` : `Convite enviado para ${novo.email}.`);
        aoMudar(novo);
      },
    });
    form.querySelector('[data-cancelar-convite]')?.addEventListener('click', () => { fechar(); confirmarCancelar(cv, aoMudar); });
    // Avisos do e-mail enquanto digita: o convite pendente (recusado no envio) e o contato de quem já é do papel (só avisa).
    const aviso = form.querySelector('[data-aviso-email]');
    const avisar = () => {
      const valor = form.email.value;
      const pendente = Convites.pendenteDoEmail(valor, cv?.id);
      const coincide = !pessoaId && !pendente && Convites.contatoCoincide(papel, valor);
      aviso.innerHTML = pendente ? `
        <div class="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
          <p>Já há um convite de cadastro pendente para este e-mail.</p>
          <button type="button" data-ir-convite="${pendente.id}" class="${BOTAO_LINK} mt-1">Abrir o convite</button>
        </div>` : coincide ? `
        <div class="mt-2 rounded-lg bg-petrol-800/5 dark:bg-sky-950/40 px-3 py-2.5 text-sm text-slate-800 dark:text-neutral-100">
          <p><strong>${esc(coincide.nome)}</strong> já é ${papel} com este e-mail. Para dar acesso a quem já está cadastrado, use "Enviar convite" na ficha.</p>
          <a href="${urlFicha({ papel, id: coincide.id })}" class="${BOTAO_LINK} mt-1">Abrir a ficha</a>
        </div>` : '';
      aviso.querySelector('[data-ir-convite]')?.addEventListener('click', (e) => { fechar(); abrirConvite(e.currentTarget.dataset.irConvite, aoMudar); });
    };
    form.email.addEventListener('input', avisar);
    avisar();
  }

  // ---------- Convite aberto ----------

  // Antes do aceite, o convite abre no próprio formulário de reenviar; depois, ou sem as permissões do D8, só para consulta.
  function abrirConvite(id, aoMudar) {
    const cv = Convites.porId(id);
    if (!cv) return;
    const podeMexer = pode(cv.papel, cv.pessoaId ? 'editar' : 'criar');
    if (Convites.antesDoAceite(cv) && podeMexer) { abrirFormulario({ papel: cv.papel, cv, aoMudar }); return; }
    const s = Convites.situacaoDe(cv);
    const perfil = Convites.perfisAtivos().find((p) => p.id === cv.perfilId);
    const campo = (rotulo, valor) => `<div><p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p><p class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valor}</p></div>`;
    const root = abrirModal(`
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${esc(cv.nome)}</h3>
        <p class="mt-1 flex flex-wrap items-center gap-2">${selo(cv)} <span class="${APOIO}">${quando(cv)}</span></p>
      </div>
      <div class="px-5 py-4 space-y-4 overflow-y-auto">
        <p class="text-sm text-slate-700 dark:text-neutral-200">${esc(s.descricao)}</p>
        ${cv.estado === 'coordenacao' && cv.envolvido ? `
        <div class="rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
          <p>O convidado não vê nome nem CPF de ninguém. Confira a pessoa, ligue o acesso com <em>Vincular usuário</em> (e adicione o papel, se faltar) e cancele este convite.</p>
          <a href="${urlFicha(cv.envolvido)}" class="${BOTAO_LINK} mt-1">Abrir a ficha da pessoa</a>
        </div>` : ''}
        <div class="grid grid-cols-2 gap-4">
          ${campo('E-mail do convite', esc(cv.email))}
          ${Acesso.pode('perfis') ? campo('Perfil de acesso', esc(perfil?.nome ?? '—')) : ''}
          ${cv.papel === 'instrutor' ? `
            ${campo('Remuneração', esc(REMUNERACOES_INSTRUTOR.find((r) => r.id === cv.dados.remuneracao)?.nome ?? '—'))}
            ${campo('WhatsApp', cv.dados.whatsapp ? esc(Instrutores.fmtTelefone(cv.dados.whatsapp)) : '—')}
            ${campo('Especialidade', esc(cv.dados.especialidade || '—'))}` : `
            ${campo('Cargo', esc(cv.dados.cargo))}
            ${campo('Departamento', esc(DEPARTAMENTOS.find((x) => x.id === cv.dados.departamentoId)?.nome ?? '—'))}
            ${campo('Admissão', esc(fmt(cv.dados.admissao)))}
            ${campo('E-mail corporativo', esc(cv.dados.emailCorporativo || '—'))}`}
        </div>
        ${comoConvidado(cv)}
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
        ${podeMexer ? `<button type="button" data-cancelar-convite class="${PERIGO}">Cancelar convite</button>` : ''}
      </div>`);
    root.querySelector('[data-cancelar-convite]')?.addEventListener('click', () => { fecharModal(); confirmarCancelar(cv, aoMudar); });
  }

  function confirmarCancelar(cv, aoMudar) {
    const aceito = !Convites.antesDoAceite(cv);
    const root = abrirModal(`
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Cancelar convite</h3></div>
      <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
        <p>Cancelar o convite de <strong>${esc(cv.nome)}</strong> (${esc(cv.email)})?</p>
        <p class="text-slate-500 dark:text-neutral-400">${aceito
          ? 'O convite sai da lista, mas o acesso que a pessoa ganhou no aceite continua. Para tirá-lo, suspenda o vínculo em <a href="perfis.html" class="underline">Perfis de acesso</a>.'
          : 'O convite deixa de valer: o link do e-mail não abre mais.'}</p>
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Voltar</button>
        <button type="button" data-confirmar class="${PERIGO}">Cancelar convite</button>
      </div>`);
    root.querySelector('[data-confirmar]').addEventListener('click', () => {
      Convites.cancelar(cv.id);
      fecharModal();
      toast(aceito ? 'Convite cancelado. O acesso criado continua.' : 'Convite cancelado.');
      aoMudar(null);
    });
  }

  // ---------- Convite pela ficha (GAC-6) ----------

  // Cartão Acesso ao sistema de quem não está ligado a um usuário. pessoa: { id, nome, email };
  // vincular: o botão "Vincular usuário" da tela, que segue para quem já tem vínculo na unidade.
  function ficha(papel, pessoa, vincular = '', espaco = 'p-4') {
    const cv = Convites.daFicha(papel, pessoa.id);
    const podeEnviar = pode(papel, 'editar');
    const enviar = podeEnviar ? `<button type="button" data-enviar-convite class="${BOTAO_PRI}">${ENVIAR} Enviar convite</button>` : '';
    const bloco = (texto, botoes) => `
      <div class="${espaco} text-sm text-slate-800 dark:text-neutral-100 space-y-4">
        ${texto}
        ${botoes.trim() ? `<div class="flex flex-wrap items-center gap-2">${botoes}</div>` : ''}
      </div>`;
    if (!cv) return bloco('<p>Ainda não tem usuário no sistema — não entra em nenhum portal.</p>', enviar + vincular);
    const s = Convites.situacaoDe(cv);
    const para = `para <strong>${esc(cv.email)}</strong>`;
    if (s.id === 'nao-ligado') return bloco(`<p>O convite ${para} foi aceito em ${fmt(cv.aceitoEm)}, mas não ligou: a pessoa ou o acesso já estava ligado a outro. O acesso vale; ligue com <em>Vincular usuário</em>.</p>`, enviar + vincular);
    if (s.id === 'aceito') return bloco(`<p>${selo(cv)} Convite ${para} aceito em ${fmt(cv.aceitoEm)}; a ficha liga na próxima entrada da pessoa.</p>`, vincular);
    return bloco(`
      <div class="space-y-1.5">
        <p class="flex flex-wrap items-center gap-2">${selo(cv)} <span>Convite ${para}</span></p>
        <p class="${APOIO}">${quando(cv)}. ${esc(s.descricao)}</p>
        ${comoConvidado(cv)}
      </div>`, `${podeEnviar ? `<button type="button" data-reenviar-convite class="${BOTAO_SEC}">${ENVIAR} Reenviar</button>` : ''}${vincular}${podeEnviar ? `<button type="button" data-cancelar-convite class="${LINK_PERIGO} ml-1">Cancelar convite</button>` : ''}`);
  }
  function ligarFicha(raiz, papel, pessoa, aoMudar) {
    const cv = () => Convites.daFicha(papel, pessoa.id);
    raiz.querySelector('[data-enviar-convite]')?.addEventListener('click', () => abrirFormulario({ papel, pessoa, aoMudar }));
    raiz.querySelector('[data-reenviar-convite]')?.addEventListener('click', () => abrirFormulario({ papel, cv: cv(), aoMudar }));
    raiz.querySelector('[data-cancelar-convite]')?.addEventListener('click', () => confirmarCancelar(cv(), aoMudar));
  }

  return { pode, tabela, ligarTabela, abrirFormulario, abrirConvite, ficha, ligarFicha };
})();
