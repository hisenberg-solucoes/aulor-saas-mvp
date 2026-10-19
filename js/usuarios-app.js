// ============================================================
// Usuários, na direção Ficha em cartões, como Colaboradores no original, só
// com o que o MVP tem: quem acessa o Aulor, com quais perfis e permissões
// adicionais, e o ciclo do convite (convidado → ativo → inativo), no mesmo
// desenho do módulo Platform do backend. A lista abre a ficha em ?id=<id>.
// Perfis e matriz de permissões ficam em perfis.html. O Administrador é
// protegido: a escola nunca fica sem um Administrador ativo.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: '', status: 'todos' };
  const ehAdmin = (u) => u.perfis.includes('administrador') && u.status === 'ativo';
  const ultimoAdmin = (u) => ehAdmin(u) && USUARIOS.filter(ehAdmin).length === 1;
  const tipoDe = (u) => (u.vinculos.some((v) => v.tipo === 'instrutor') ? 'instrutor' : 'colaborador');
  const professorDe = (u) => Aulor.professor(u.vinculos.find((v) => v.tipo === 'instrutor')?.id);
  const urlFicha = (id) => `usuarios.html?id=${encodeURIComponent(id)}`;
  const contaExtras = (u) => Object.values(u.extras ?? {}).reduce((s, a) => s + a.length, 0);
  const perfisDe = (u) => u.perfis.map((id) => PERFIS.find((p) => p.id === id)).filter(Boolean);

  // ---------- Lista ----------

  function lista() {
    const termo = normalizarTexto(filtro.q);
    const ORDEM = { convidado: 0, ativo: 0, inativo: 1 }; // inativo vai para o fim
    return USUARIOS.filter((u) => (filtro.status === 'todos' || u.status === filtro.status) && (!termo || normalizarTexto(`${u.nome} ${u.email} ${u.cargo}`).includes(termo)))
      .sort((a, b) => (ORDEM[a.status] ?? 1) - (ORDEM[b.status] ?? 1) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // Pílula só de exceção: convite pendente e inativo. "Ativo" não aparece.
  const pilulasUsuario = (u) => [
    u.status === 'convidado' ? pilula('atencao', 'Convite enviado', 'A pessoa ainda não aceitou o convite') : '',
    u.status === 'inativo' ? pilula('neutro', 'Inativo', 'Não entra no Aulor; perfis e histórico ficam guardados') : '',
  ].join('');

  function tabela() {
    const itens = lista();
    const filtrando = filtro.q || filtro.status !== 'todos';
    const eu = Shell.usuario().id;
    if (!itens.length) return `<div class="painel">${vazio('Nenhum usuário com esse filtro', '', '<button type="button" data-limpar class="btn-sec">Limpar filtros</button>')}</div>`;
    return `
      <div class="painel overflow-hidden">
        <div class="overflow-x-auto"><table class="tabela table-fixed">
          <thead><tr><th>Usuário</th><th class="w-28">Tipo</th><th class="w-[28%]">Perfis</th><th class="text-right num w-28">Adicionais</th></tr></thead>
          <tbody>${itens.map((u) => {
            const perfis = perfisDe(u);
            return `<tr data-href="${urlFicha(u.id)}" class="${FOCO_LINHA} ${u.status === 'inativo' ? 'linha-apagada' : ''}">
              <td><div class="flex items-center gap-3 min-w-0">${avatar(u.nome, 'h-9 w-9 text-xs')}<div class="min-w-0">
                <p class="flex flex-wrap items-center gap-x-2 gap-y-0.5"><a href="${urlFicha(u.id)}" class="link-registro font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(u.nome)}</a>${u.id === eu ? `<span class="text-xs ${APOIO}">· você</span>` : ''}${pilulasUsuario(u)}</p>
                <p class="text-xs ${APOIO} truncate">${esc(u.cargo)} · ${esc(u.email)}</p>
              </div></div></td>
              <td>${tipoDe(u) === 'instrutor' ? 'Professor' : 'Equipe'}</td>
              <td>${perfis.length ? `<span class="block truncate" title="${esc(perfis.map((p) => p.nome).join(' · '))}">${esc(perfis.map((p) => p.nome).join(' · '))}</span>` : `<span class="text-xs font-medium ${AVISO}">sem perfil</span>`}</td>
              <td class="num">${contaExtras(u) || `<span class="${APOIO}">—</span>`}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
        <p class="px-4 py-2.5 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">${itens.length} ${itens.length === 1 ? 'usuário' : 'usuários'}${filtrando ? ` de ${USUARIOS.length}` : ''}</p>
      </div>`;
  }

  function renderLista() {
    const pendentes = USUARIOS.filter((u) => u.status === 'convidado').length;
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({
          titulo: `Usuários <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${USUARIOS.length}</span>`,
          subtitulo: `Quem acessa o Aulor. Cada pessoa recebe um ou mais perfis; o acesso efetivo é a soma dos perfis com as permissões adicionais.${pendentes ? ` <span class="${AVISO} font-medium">${pendentes} ${pendentes === 1 ? 'convite pendente' : 'convites pendentes'}.</span>` : ''}`,
          acoes: Shell.pode('usuarios', 'convidar') ? `<button type="button" data-convidar class="btn-pri">${ICONE.mais}Convidar usuário</button>` : '',
        })}
        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por nome, e-mail ou cargo')}
          <div class="ml-auto">${selectFiltro('f-status', [{ id: 'todos', nome: 'Todas as situações' }, { id: 'ativo', nome: 'Ativos' }, { id: 'convidado', nome: 'Convites pendentes' }, { id: 'inativo', nome: 'Inativos' }], filtro.status, 'Situação')}</div>
        </div>
        <div data-tabela>${tabela()}</div>
        <p class="text-xs ${APOIO_FUNDO} mt-3">Demonstração: o convite não envia e-mail. Em produção, a pessoa recebe o convite, cria a senha e entra com os perfis definidos aqui.</p>
      </div>`;
    ligarLinhasLink(tela);
  }

  // ---------- Ficha ----------

  function aceitar(u) {
    u.status = 'ativo';
    Acessos.salvar();
    toast(`${u.nome} aceitou o convite e já pode entrar`);
    renderFicha(u.id);
  }

  function alternarAtivo(u) {
    if (u.status !== 'inativo' && ultimoAdmin(u)) { toast('A escola precisa de pelo menos um Administrador ativo.', 'erro'); return; }
    const reativar = u.status === 'inativo';
    confirmar({
      titulo: reativar ? `Reativar ${u.nome}?` : `Inativar ${u.nome}?`,
      mensagem: reativar ? 'A pessoa volta a entrar com os mesmos perfis.' : 'A pessoa deixa de entrar no Aulor. Perfis e histórico ficam guardados.',
      rotulo: reativar ? 'Reativar' : 'Inativar',
      tom: reativar ? 'pri' : 'perigo',
      aoConfirmar: () => { u.status = reativar ? 'ativo' : 'inativo'; Acessos.salvar(); toast(reativar ? 'Usuário reativado' : 'Usuário inativado'); renderFicha(u.id); },
    });
  }

  // Inativar fica à vista no "Mais" e travado com o motivo quando não pode (Regra do Motivo Escrito).
  function itemInativar(u) {
    const eu = u.id === Shell.usuario().id;
    if (u.status === 'inativo') return null; // reativar fica na faixa
    const motivo = !Shell.pode('usuarios', 'inativar') ? 'Seu perfil não inativa usuários'
      : eu ? 'Você não pode inativar o próprio acesso'
        : ultimoAdmin(u) ? 'É o único Administrador ativo: dê o perfil a outra pessoa antes' : '';
    return { nome: 'Inativar', perigo: true, desabilitado: Boolean(motivo), detalhe: motivo || 'Deixa de entrar no Aulor; perfis e histórico ficam guardados', acao: () => alternarAtivo(u) };
  }

  function cartaoPerfis(u) {
    const perfis = perfisDe(u);
    const inativos = perfis.filter((p) => !p.ativo);
    const editar = Shell.pode('usuarios', 'editar') && u.status !== 'inativo';
    const telas = Shell.itensVisiveis(u).map((i) => i.nome);
    return cartao({
      titulo: 'Perfis de acesso',
      contexto: 'O que a pessoa vê e faz no Aulor. Um perfil inativo não concede nada.',
      acao: editar ? '<button type="button" data-editar class="btn-fantasma">Editar</button>' : '',
      corpo: `<div class="p-4 space-y-3">
        ${perfis.length ? `<div class="flex flex-wrap gap-1">${perfis.map((p) => `<span class="${TAG} ${p.ativo ? '' : 'line-through opacity-70'}" title="${p.ativo ? (p.protegido ? 'Acesso total. Perfil protegido: não é editado nem inativado.' : '') : 'Perfil inativo: não concede nada'}">${esc(p.nome)}${p.protegido ? `<span class="ml-1 font-normal ${APOIO}">· acesso total</span>` : ''}</span>`).join('')}</div>`
          : `<p class="text-sm font-medium ${AVISO}">Nenhum perfil: o usuário existe, mas não acessa nada.</p>`}
        ${inativos.length ? `<p class="text-xs ${AVISO}">${inativos.map((p) => esc(p.nome)).join(', ')}: perfil inativo.</p>` : ''}
        ${campoValor('Telas que vê', telas.length ? esc(telas.join(', ')) : '')}
        ${ultimoAdmin(u) ? `<p class="text-xs ${APOIO}">É o único Administrador ativo: o perfil não pode sair dele nem ele ser inativado.</p>` : ''}
        ${Shell.pode('perfis-acesso') ? `<p class="text-xs ${APOIO}"><a class="link" href="perfis.html?aba=validacao&usuario=${u.id}">Ver o acesso efetivo de ${esc(u.nome.split(' ')[0])}</a></p>` : ''}
      </div>`,
    });
  }

  function cartaoExtras(u) {
    const extras = Object.entries(u.extras ?? {}).filter(([, acoes]) => acoes.length);
    const nomeAcao = (f, a) => f?.acoes.find((x) => x.id === a)?.nome ?? a;
    return cartao({
      titulo: 'Permissões adicionais',
      contexto: 'Ações fora dos perfis, só para esta pessoa.',
      acao: Shell.pode('perfis-acesso', 'gerenciar') ? '<a href="perfis.html?aba=matriz-usuarios" class="btn-fantasma">Editar</a>' : '',
      corpo: extras.length ? `<ul class="p-4 space-y-1.5 text-sm text-slate-800 dark:text-neutral-100">${extras.map(([fid, acoes]) => {
        const f = FEATURES.find((x) => x.id === fid);
        return `<li><span class="font-medium">${esc(f?.nome ?? fid)}:</span> ${acoes.map((a) => esc(nomeAcao(f, a))).join(', ')}</li>`;
      }).join('')}</ul>` : `<p class="p-4 text-sm ${APOIO}">Nenhuma: o acesso é só o dos perfis.</p>`,
    });
  }

  function renderFicha(id) {
    const u = USUARIOS.find((x) => x.id === id);
    if (!u) { tela.innerHTML = `<div class="painel max-w-xl mx-auto">${vazio('Usuário não encontrado', '', '<a class="btn-sec" href="usuarios.html">Voltar para os usuários</a>')}</div>`; return; }
    const eu = u.id === Shell.usuario().id;
    const prof = professorDe(u);
    const editar = Shell.pode('usuarios', 'editar') && u.status !== 'inativo';
    const mais = [
      Shell.pode('perfis-acesso') ? { nome: 'Ver o acesso efetivo', detalhe: 'Tela por tela, somando perfis e adicionais', acao: () => { location.href = `perfis.html?aba=validacao&usuario=${u.id}`; } } : null,
      prof && Shell.pode('professores') ? { nome: 'Abrir o cadastro de professor', detalhe: 'Contato e turmas', acao: () => { location.href = `professores.html?professor=${prof.id}`; } } : null,
      'sep',
      itemInativar(u),
    ].filter(Boolean);
    const faixaHtml = u.status === 'convidado'
      ? faixa('aviso', `<span class="font-medium">Convite enviado</span> para ${esc(u.email)}. A pessoa ainda não criou a senha nem entrou.`, Shell.pode('usuarios', 'convidar') ? '<button type="button" data-aceite class="btn-sec btn-pequeno" title="Na demonstração, simula a pessoa aceitando o convite por e-mail">Simular aceite</button>' : '')
      : u.status === 'inativo'
        ? faixa('neutra', '<span class="font-medium">Inativo:</span> não entra no Aulor. Perfis e histórico ficam guardados.', Shell.pode('usuarios', 'inativar') ? '<button type="button" data-reativar class="btn-sec btn-pequeno">Reativar</button>' : '')
        : '';
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoFicha({
          trilha: [{ rotulo: 'Usuários', href: 'usuarios.html' }, { rotulo: esc(u.nome) }],
          avatar: avatar(u.nome, 'h-12 w-12 text-base'),
          nome: esc(u.nome),
          pilulas: eu ? pilula('neutro', 'Você') : '',
          chips: [
            chip(ICONE.pessoa, esc(u.cargo), 'Cargo'),
            chip(ICONE.email, `<a href="mailto:${esc(u.email)}" class="hover:underline">${esc(u.email)}</a>`, 'E-mail de acesso'),
            chip(ICONE.pessoas, tipoDe(u) === 'instrutor' ? 'Professor' : 'Equipe da escola', 'Tipo de usuário'),
          ],
          acoes: editar ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar acesso</button>` : '',
          mais: mais.filter((x) => x !== 'sep').length ? mais : null,
        })}
        ${faixaHtml}
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          ${cartao({
            titulo: 'Dados',
            contexto: tipoDe(u) === 'instrutor' ? 'Nome e e-mail vêm do cadastro de professor.' : 'Nome e e-mail do convite; o e-mail é o login.',
            acao: editar ? '<button type="button" data-editar class="btn-fantasma">Editar</button>' : '',
            corpo: gradeCampos([
              campoValor('Nome', esc(u.nome), 'sm:col-span-2'),
              campoValor('E-mail', esc(u.email)),
              campoValor('Cargo', esc(u.cargo)),
              campoValor('Tipo', tipoDe(u) === 'instrutor' ? `Professor${prof ? ` · ${Shell.pode('professores') ? `<a class="link" href="professores.html?professor=${prof.id}">${esc(prof.nome)}</a>` : esc(prof.nome)}` : ''}` : 'Equipe da escola', 'sm:col-span-2'),
            ]),
          })}
          ${cartaoPerfis(u)}
          ${cartaoExtras(u)}
        </div>
      </div>`;
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirForm(u)));
    tela.querySelector('[data-mais]')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, mais));
    tela.querySelector('[data-aceite]')?.addEventListener('click', () => aceitar(u));
    tela.querySelector('[data-reativar]')?.addEventListener('click', () => alternarAtivo(u));
  }

  // ---------- Convite e edição ----------

  function opcoesPerfis(tipo, marcados) {
    return PERFIS.filter((p) => p.tipos.includes(tipo)).map((p) => `
      <label class="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2.5 cursor-pointer has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
        <input type="checkbox" name="perfil" value="${p.id}" class="check mt-0.5" ${marcados.includes(p.id) ? 'checked' : ''} ${p.ativo ? '' : 'disabled'}>
        <span class="text-sm text-slate-800 dark:text-neutral-100"><span class="font-medium">${esc(p.nome)}</span>${p.protegido ? ` <span class="text-xs ${APOIO}">· acesso total</span>` : ''}${p.ativo ? '' : ` <span class="text-xs ${AVISO}">· inativo</span>`}
          <span class="block text-xs ${APOIO}">${esc(Shell.itensVisiveis({ ...Shell.usuario(), perfis: [p.id], extras: {} }).map((i) => i.nome).join(', ') || 'Sem telas')}</span></span>
      </label>`).join('');
  }

  const OPCAO_TIPO = 'rounded-lg border px-3 py-2.5 text-sm cursor-pointer border-slate-300 dark:border-neutral-700 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--f-foco)]';

  function abrirForm(u = null) {
    const tipo = u ? tipoDe(u) : 'colaborador';
    const semUsuario = Aulor.professores().filter((p) => !USUARIOS.some((x) => x.vinculos.some((v) => v.tipo === 'instrutor' && v.id === p.id)));
    const { form } = modalFormulario({
      id: 'form-usuario',
      titulo: u ? `Editar acesso de ${u.nome}` : 'Convidar usuário',
      subtitulo: u ? u.email : 'A pessoa recebe um convite por e-mail e entra com os perfis escolhidos.',
      rotulo: u ? 'Salvar' : 'Enviar convite',
      largura: 'lg',
      corpo: `
        ${u ? '' : `
        <fieldset>
          <legend class="rotulo">Quem é</legend>
          <div class="grid grid-cols-2 gap-2">
            <label class="${OPCAO_TIPO}"><input type="radio" name="tipo" value="colaborador" class="sr-only" checked><span class="block font-medium ${TITULO}">Equipe da escola</span><span class="block text-xs ${APOIO}">Direção, secretaria, financeiro…</span></label>
            <label class="${OPCAO_TIPO} ${semUsuario.length ? '' : 'opacity-50 pointer-events-none'}"><input type="radio" name="tipo" value="instrutor" class="sr-only" ${semUsuario.length ? '' : 'disabled'}><span class="block font-medium ${TITULO}">Professor</span><span class="block text-xs ${APOIO}">${semUsuario.length ? 'Do cadastro de professores' : 'Todos já têm acesso'}</span></label>
          </div>
        </fieldset>
        <div data-campos-equipe class="grid sm:grid-cols-2 gap-4">
          ${campo('nome', 'Nome', '', { obrigatorio: true, classe: 'sm:col-span-2' })}
          ${campo('email', 'E-mail', '', { obrigatorio: true, tipo: 'email' })}
          ${campo('cargo', 'Cargo', '', { extra: 'placeholder="Secretária, auxiliar…"' })}
        </div>
        <div data-campos-professor class="hidden">
          <label class="rotulo" for="f-professorId">Professor</label>
          ${campoCombo('professorId', semUsuario.map((p) => ({ id: p.id, nome: p.nome, descricao: p.email })), '', { vazio: 'Escolha o professor' })}
          ${ERRO('professorId')}
        </div>`}
        ${u ? campo('cargo', 'Cargo', u.cargo) : ''}
        <div>
          <p class="rotulo">Perfis de acesso</p>
          <div data-perfis class="grid gap-2">${opcoesPerfis(tipo, u ? u.perfis : [])}</div>
          ${ERRO('perfil')}
          ${u && Shell.pode('perfis-acesso') ? `<p class="text-xs ${APOIO} mt-2"><a class="link" href="perfis.html?aba=validacao&usuario=${u.id}">Ver o acesso efetivo de ${esc(u.nome.split(' ')[0])}</a> · permissões adicionais em <a class="link" href="perfis.html?aba=matriz-usuarios">Usuários × perfis</a>.</p>` : ''}
        </div>`,
      aoSalvar: (fd) => {
        const perfis = fd.getAll('perfil');
        const erros = [];
        if (!perfis.length) erros.push({ campo: 'perfil', mensagem: 'Escolha ao menos um perfil.' });
        if (u) {
          if (erros.length) return erros;
          if (ultimoAdmin(u) && !perfis.includes('administrador')) return [{ campo: 'perfil', mensagem: 'A escola precisa de pelo menos um Administrador ativo.' }];
          Object.assign(u, { perfis, cargo: String(fd.get('cargo') ?? '').trim() || u.cargo });
          Acessos.salvar();
          toast('Acesso atualizado');
          if (u.id === Shell.usuario().id) { location.reload(); return []; }
          renderFicha(u.id);
          return [];
        }
        const t = fd.get('tipo');
        let novo;
        if (t === 'instrutor') {
          const p = Aulor.professor(fd.get('professorId'));
          if (!p) erros.push({ campo: 'professorId', mensagem: 'Escolha o professor.' });
          if (erros.length) return erros;
          novo = { nome: p.nome, email: p.email, cargo: 'Professor(a)', vinculos: [{ tipo: 'instrutor', id: p.id }] };
        } else {
          const nome = String(fd.get('nome') ?? '').trim();
          const email = String(fd.get('email') ?? '').trim().toLowerCase();
          if (nome.split(/\s+/).length < 2) erros.push({ campo: 'nome', mensagem: 'Nome e sobrenome.' });
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
          else if (USUARIOS.some((x) => x.email === email)) erros.push({ campo: 'email', mensagem: 'Já existe um usuário com este e-mail.' });
          if (erros.length) return erros;
          novo = { nome, email, cargo: String(fd.get('cargo') ?? '').trim() || 'Equipe', vinculos: [] };
        }
        const id = `u${Math.max(0, ...USUARIOS.map((x) => Number(x.id.slice(1)) || 0)) + 1}`;
        if (!novo.vinculos.length) novo.vinculos = [{ tipo: 'colaborador', id }];
        USUARIOS.push({ id, ...novo, status: 'convidado', perfis, extras: {} });
        Acessos.salvar();
        toast(`Convite registrado para ${novo.email}`);
        location.href = urlFicha(id);
        return [];
      },
    });
    form.querySelectorAll('[name="tipo"]').forEach((r) => r.addEventListener('change', () => {
      const t = form.querySelector('[name="tipo"]:checked').value;
      form.querySelector('[data-campos-equipe]').classList.toggle('hidden', t !== 'colaborador');
      form.querySelector('[data-campos-professor]').classList.toggle('hidden', t !== 'instrutor');
      form.querySelector('[data-perfis]').innerHTML = opcoesPerfis(t, t === 'instrutor' ? ['professor'] : []);
    }));
  }

  // ---------- Início ----------

  const id = parametroUrl('id');
  if (id) { renderFicha(id); return; }
  renderLista();
  tela.addEventListener('input', (e) => {
    if (e.target.id !== 'busca') return;
    filtro.q = e.target.value;
    tela.querySelector('[data-tabela]').innerHTML = tabela();
    ligarLinhasLink(tela.querySelector('[data-tabela]'));
  });
  tela.addEventListener('change', (e) => {
    if (e.target.id !== 'f-status') return;
    filtro.status = e.target.value;
    tela.querySelector('[data-tabela]').innerHTML = tabela();
    ligarLinhasLink(tela.querySelector('[data-tabela]'));
  });
  tela.addEventListener('click', (e) => {
    if (e.target.closest('[data-convidar]')) abrirForm();
    if (e.target.closest('[data-limpar]')) { filtro.q = ''; filtro.status = 'todos'; renderLista(); tela.querySelector('#busca').focus(); }
  });
})();
