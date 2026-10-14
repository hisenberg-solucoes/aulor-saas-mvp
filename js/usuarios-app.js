// ============================================================
// Usuários: quem acessa o Aulor, com quais perfis, e o ciclo do convite
// (convidado → ativo → inativo), no mesmo desenho do módulo Platform do
// backend (convite, vínculo e perfis por unidade). Perfis e matriz de
// permissões ficam em perfis.html (app de permissões do original).
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: '', status: 'todos' };
  const ehAdmin = (u) => u.perfis.includes('administrador') && u.status === 'ativo';
  const tipoDe = (u) => (u.vinculos.some((v) => v.tipo === 'instrutor') ? 'instrutor' : 'colaborador');
  const STATUS = { ativo: ['ok', 'Ativo'], convidado: ['atencao', 'Convite enviado'], inativo: ['neutro', 'Inativo'] };

  function lista() {
    const termo = normalizarTexto(filtro.q);
    return USUARIOS.filter((u) => (filtro.status === 'todos' || u.status === filtro.status) && (!termo || normalizarTexto(`${u.nome} ${u.email} ${u.cargo}`).includes(termo)))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function render() {
    const itens = lista();
    const extras = (u) => Object.values(u.extras ?? {}).reduce((s, a) => s + a.length, 0);
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Usuários', subtitulo: 'Cada pessoa recebe um ou mais perfis. O acesso efetivo é a soma dos perfis ativos com as permissões adicionais.', acoes: Shell.pode('usuarios', 'convidar') ? `<button type="button" data-convidar class="btn-pri">${ICONE.mais}Convidar usuário</button>` : '' })}
        <div class="flex flex-wrap gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por nome, e-mail ou cargo')}
          ${selectFiltro('f-status', [{ id: 'todos', nome: 'Todas as situações' }, { id: 'ativo', nome: 'Ativos' }, { id: 'convidado', nome: 'Convites pendentes' }, { id: 'inativo', nome: 'Inativos' }], filtro.status, 'Situação')}
        </div>
        <div class="painel overflow-hidden"><div class="overflow-x-auto"><table class="tabela">
          <thead><tr><th>Usuário</th><th>Tipo</th><th>Perfis</th><th class="num">Adicionais</th><th>Situação</th><th></th></tr></thead>
          <tbody>${itens.map((u) => {
            const [tom, nome] = STATUS[u.status] ?? STATUS.inativo;
            const eu = u.id === Shell.usuario().id;
            return `<tr class="${u.status === 'inativo' ? 'opacity-60' : ''}">
              <td><div class="flex items-center gap-3 max-w-[18rem]">${avatar(u.nome)}<div class="min-w-0"><p class="font-medium text-tinta">${esc(u.nome)}${eu ? ' <span class="text-xs font-normal text-tinta-3">· você</span>' : ''}</p><p class="text-xs text-tinta-2 truncate">${esc(u.cargo)} · ${esc(u.email)}</p></div></div></td>
              <td>${tipoDe(u) === 'instrutor' ? pilula('info', 'Professor') : pilula('neutro', 'Equipe')}</td>
              <td class="text-sm">${u.perfis.map((id) => { const p = PERFIS.find((x) => x.id === id); return p ? (Shell.pode('perfis-acesso') ? `<a class="link" href="perfil.html?id=${p.id}">${esc(p.nome)}</a>` : esc(p.nome)) : ''; }).join(', ') || '<span class="text-tinta-3">nenhum</span>'}</td>
              <td class="num">${extras(u) || '<span class="text-tinta-3">—</span>'}</td>
              <td>${status(tom, nome)}${u.status === 'convidado' && Shell.pode('usuarios', 'convidar') ? `<br><button type="button" data-aceite="${u.id}" class="text-xs font-semibold link" title="Na demonstração, simula a pessoa aceitando o convite por e-mail">Simular aceite</button>` : ''}</td>
              <td class="text-right whitespace-nowrap space-x-2">
                ${Shell.pode('usuarios', 'editar') && u.status !== 'inativo' ? `<button type="button" data-editar="${u.id}" class="text-xs font-semibold link">Editar</button>` : ''}
                ${Shell.pode('usuarios', 'inativar') && !eu ? `<button type="button" data-inativar="${u.id}" class="text-xs font-semibold ${u.status === 'inativo' ? 'link' : 'text-tinta-2 hover:text-ruim'}">${u.status === 'inativo' ? 'Reativar' : 'Inativar'}</button>` : ''}
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div></div>
        <p class="text-xs text-tinta-2 mt-3">Demonstração: o convite não envia e-mail. Em produção, a pessoa recebe o convite, cria a senha e entra com os perfis definidos aqui.</p>
      </div>`;
    ligar();
  }

  function ligar() {
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('#f-status').addEventListener('change', (e) => { filtro.status = e.target.value; render(); });
    tela.querySelector('[data-convidar]')?.addEventListener('click', () => abrirForm());
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirForm(USUARIOS.find((u) => u.id === b.dataset.editar))));
    tela.querySelectorAll('[data-aceite]').forEach((b) => b.addEventListener('click', () => {
      const u = USUARIOS.find((x) => x.id === b.dataset.aceite);
      u.status = 'ativo';
      Acessos.salvar();
      toast(`${u.nome} aceitou o convite e já pode entrar`);
      render();
    }));
    tela.querySelectorAll('[data-inativar]').forEach((b) => b.addEventListener('click', () => {
      const u = USUARIOS.find((x) => x.id === b.dataset.inativar);
      if (u.status !== 'inativo' && ehAdmin(u) && USUARIOS.filter(ehAdmin).length === 1) { toast('A escola precisa de pelo menos um Administrador ativo.', 'erro'); return; }
      const reativar = u.status === 'inativo';
      confirmar({
        titulo: reativar ? `Reativar ${u.nome}?` : `Inativar ${u.nome}?`,
        mensagem: reativar ? 'A pessoa volta a entrar com os mesmos perfis.' : 'A pessoa deixa de entrar no Aulor. Perfis e histórico ficam guardados.',
        rotulo: reativar ? 'Reativar' : 'Inativar',
        tom: reativar ? 'pri' : 'perigo',
        aoConfirmar: () => { u.status = reativar ? 'ativo' : 'inativo'; Acessos.salvar(); toast(reativar ? 'Usuário reativado' : 'Usuário inativado'); render(); },
      });
    }));
  }

  function opcoesPerfis(marcados) {
    return PERFIS.map((p) => `
      <label class="flex items-start gap-3 rounded-lg border border-linha px-3 py-2.5 cursor-pointer has-[:checked]:border-marca">
        <input type="checkbox" name="perfil" value="${p.id}" class="check mt-0.5" ${marcados.includes(p.id) ? 'checked' : ''} ${p.ativo ? '' : 'disabled'}>
        <span class="text-sm"><span class="font-medium">${esc(p.nome)}</span>${p.protegido ? ' <span class="text-xs text-tinta-3">· acesso total</span>' : ''}${p.ativo ? '' : ' <span class="text-xs text-aviso">· inativo</span>'}
          <span class="block text-xs text-tinta-2">${esc(Shell.itensVisiveis({ ...Shell.usuario(), perfis: [p.id], extras: {} }).map((i) => i.nome).join(', ') || 'Sem telas')}</span></span>
      </label>`).join('');
  }

  function abrirForm(u = null) {
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
            <label class="rounded-lg border px-3 py-2.5 text-sm cursor-pointer border-linha-forte has-[:checked]:border-marca has-[:checked]:bg-selecao"><input type="radio" name="tipo" value="colaborador" class="sr-only" checked><b>Equipe da escola</b><span class="block text-xs text-tinta-2">Direção, secretaria, financeiro…</span></label>
            <label class="rounded-lg border px-3 py-2.5 text-sm cursor-pointer border-linha-forte has-[:checked]:border-marca has-[:checked]:bg-selecao ${semUsuario.length ? '' : 'opacity-50 pointer-events-none'}"><input type="radio" name="tipo" value="instrutor" class="sr-only"><b>Professor</b><span class="block text-xs text-tinta-2">${semUsuario.length ? 'Do cadastro de professores' : 'Todos já têm acesso'}</span></label>
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
          <div data-perfis class="grid gap-2">${opcoesPerfis(u ? u.perfis : [])}</div>
          ${ERRO('perfil')}
          ${u && Shell.pode('perfis-acesso') ? `<p class="text-xs text-tinta-2 mt-2"><a class="link" href="perfis.html?aba=validacao&usuario=${u.id}">Ver o acesso efetivo de ${esc(u.nome.split(' ')[0])}</a> · permissões adicionais em <a class="link" href="perfis.html?aba=matriz-usuarios">Usuários × perfis</a>.</p>` : ''}
        </div>`,
      aoSalvar: (fd) => {
        const perfis = fd.getAll('perfil');
        const erros = [];
        if (!perfis.length) erros.push({ campo: 'perfil', mensagem: 'Escolha ao menos um perfil.' });
        if (u) {
          if (erros.length) return erros;
          if (ehAdmin(u) && !perfis.includes('administrador') && USUARIOS.filter(ehAdmin).length === 1) return [{ campo: 'perfil', mensagem: 'A escola precisa de pelo menos um Administrador ativo.' }];
          Object.assign(u, { perfis, cargo: String(fd.get('cargo') ?? '').trim() || u.cargo });
          Acessos.salvar();
          toast('Acesso atualizado');
          if (u.id === Shell.usuario().id) { location.reload(); return []; }
          render();
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
        render();
        return [];
      },
    });
    form.querySelectorAll('[name="tipo"]').forEach((r) => r.addEventListener('change', () => {
      const t = form.querySelector('[name="tipo"]:checked').value;
      form.querySelector('[data-campos-equipe]').classList.toggle('hidden', t !== 'colaborador');
      form.querySelector('[data-campos-professor]').classList.toggle('hidden', t !== 'instrutor');
      form.querySelector('[data-perfis]').innerHTML = opcoesPerfis(t === 'instrutor' ? ['professor'] : []);
    }));
  }

  render();
  const alvo = USUARIOS.find((u) => u.id === parametroUrl('id'));
  if (alvo && Shell.pode('usuarios', 'editar') && alvo.status !== 'inativo') abrirForm(alvo);
})();
