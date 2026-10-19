// ============================================================
// Professores (grupo Pessoas), na direção Ficha em cartões, como Instrutores
// no original, só com o que o MVP tem: nome, contato, especialidade, turmas e
// o acesso opcional ao Aulor. A lista abre a ficha em ?professor=<id> (o
// mesmo endereço que Perfis de acesso usa para o cadastro do professor).
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const filtro = { q: '' };
  const gerencia = Shell.pode('professores', 'gerenciar');
  const urlFicha = (id) => `professores.html?professor=${encodeURIComponent(id)}`;
  const usuarioDe = (p) => USUARIOS.find((u) => u.vinculos.some((v) => v.tipo === 'instrutor' && v.id === p.id));
  const abertas = (p) => Aulor.turmasDoProfessor(p.id).filter((t) => !['concluida', 'cancelada'].includes(Aulor.situacaoTurma(t)));

  // Acesso na lista: sem acesso é opcional (apoio); convite espera o professor; inativo, em apoio.
  function textoAcesso(u) {
    if (!u) return `<span class="${APOIO}">sem acesso</span>`;
    if (u.status === 'convidado') return status('atencao', 'Convite enviado');
    if (u.status === 'inativo') return `<span class="${APOIO}">acesso inativo</span>`;
    return 'Com acesso';
  }

  // ---------- Lista ----------

  const filtrados = () => {
    const termo = normalizarTexto(filtro.q);
    return Aulor.professores().filter((p) => !termo || normalizarTexto(`${p.nome} ${p.especialidade} ${p.email}`).includes(termo));
  };

  function renderLista() {
    const todos = Aulor.professores();
    const lista = filtrados();
    tela.innerHTML = `
      <div>
        ${cabecalhoPagina({
          titulo: `Professores <span class="ml-1 text-base font-normal tabular-nums ${APOIO_FUNDO}">${todos.length}</span>`,
          subtitulo: `Quem dá aulas na escola. Com acesso ao Aulor, o professor vê só as próprias turmas e faz a chamada pelo celular. Quem trabalha na secretaria tem cadastro em ${Shell.pode('usuarios') ? '<a class="link" href="usuarios.html">Usuários</a>' : 'Usuários'}.`,
          acoes: gerencia ? `<button type="button" data-novo class="btn-pri">${ICONE.mais}Novo professor</button>` : '',
        })}
        <div class="flex flex-wrap items-center gap-2 mb-4">${campoBusca('busca', filtro.q, 'Buscar por nome, especialidade ou e-mail')}</div>
        <div data-tabela>${tabela(lista, todos.length)}</div>
      </div>`;
    ligarLinhasLink(tela);
  }

  function tabela(lista, total) {
    return `
      <div class="painel overflow-hidden">
        ${lista.length ? `<div class="overflow-x-auto">
          <table class="tabela table-fixed">
            <thead><tr><th>Professor</th><th class="w-[30%]">Contato</th><th class="w-[20%]">Turmas abertas</th><th class="w-36">Acesso ao Aulor</th></tr></thead>
            <tbody>${lista.map((p) => {
              const turmas = abertas(p);
              return `<tr data-href="${urlFicha(p.id)}" class="${FOCO_LINHA}">
                <td><div class="flex items-center gap-3 min-w-0">${avatar(p.nome, 'h-9 w-9 text-xs')}<div class="min-w-0">
                  <a href="${urlFicha(p.id)}" class="link-registro block truncate font-medium ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(p.nome)}</a>
                  <p class="text-xs ${APOIO} truncate">${esc(p.especialidade) || 'sem especialidade'}</p>
                </div></div></td>
                <td><span class="block truncate" title="${esc(p.email)}">${esc(p.email)}</span><span class="block text-xs ${APOIO} tabular-nums">${telefoneFmt(p.telefone)}</span></td>
                <td>${turmas.length ? `<span class="tabular-nums">${turmas.length} ${turmas.length === 1 ? 'turma' : 'turmas'}</span><span class="block text-xs font-mono ${APOIO} truncate">${turmas.map((t) => esc(t.codigo)).join(', ')}</span>` : `<span class="${APOIO}">nenhuma</span>`}</td>
                <td>${textoAcesso(usuarioDe(p))}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>` : vazio('Nenhum professor encontrado', '', filtro.q ? '<button type="button" data-limpar class="btn-sec">Limpar busca</button>' : '')}
        <p class="px-4 py-2.5 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">${lista.length} ${lista.length === 1 ? 'professor' : 'professores'}${filtro.q ? ` de ${total}` : ''}</p>
      </div>`;
  }

  // ---------- Ficha ----------

  function convidar(p) {
    confirmar({
      titulo: `Convidar ${p.nome} para o Aulor?`,
      mensagem: `O convite vai para ${p.email}. Com o perfil Professor, ele verá só as próprias turmas para fazer chamada, diário e nota final, inclusive pelo celular.`,
      rotulo: 'Enviar convite',
      aoConfirmar: () => {
        const novo = { id: `u${Math.max(0, ...USUARIOS.map((u) => Number(u.id.slice(1)) || 0)) + 1}`, nome: p.nome, email: p.email, cargo: 'Professor(a)', status: 'convidado', vinculos: [{ tipo: 'instrutor', id: p.id }], perfis: ['professor'], extras: {} };
        USUARIOS.push(novo);
        Acessos.salvar();
        toast(`Convite registrado para ${p.email}`);
        renderFicha(p.id);
      },
    });
  }

  function cartaoAcesso(p) {
    const u = usuarioDe(p);
    const verUsuarios = Shell.pode('usuarios');
    if (!u) {
      const pode = Shell.pode('usuarios', 'convidar');
      return cartao({
        titulo: 'Acesso ao sistema',
        contexto: 'Usuário do Aulor e o que ele pode fazer.',
        corpo: `<div class="p-4 space-y-4 text-sm text-slate-800 dark:text-neutral-100">
          <p>Ainda não tem acesso ao Aulor: a chamada das turmas dele é feita pela secretaria.</p>
          ${botaoPermitido(pode, '<button type="button" data-convidar class="btn-pri">Convidar para o Aulor</button>', 'Seu perfil não convida usuários')}
        </div>`,
      });
    }
    const perfis = u.perfis.map((id) => PERFIS.find((x) => x.id === id)).filter(Boolean);
    const extras = Object.values(u.extras ?? {}).reduce((s, a) => s + a.length, 0);
    const situacao = { ativo: 'Com acesso', convidado: status('atencao', 'Convite enviado: ainda não entrou'), inativo: `<span class="${APOIO}">Inativo: não entra no Aulor</span>` }[u.status] ?? esc(u.status);
    return cartao({
      titulo: 'Acesso ao sistema',
      contexto: 'Usuário do Aulor e o que ele pode fazer.',
      acao: verUsuarios ? `<a href="usuarios.html?id=${u.id}" class="btn-fantasma">${ICONE.cadeado.replace('h-4 w-4', 'h-3.5 w-3.5')}Gerenciar acesso</a>` : '',
      corpo: gradeCampos([
        campoValor('Usuário', esc(u.email)),
        campoValor('Situação', situacao),
        campoValor('Perfis de acesso', perfis.length ? `<span class="flex flex-wrap gap-1 mt-0.5">${perfis.map((x) => `<span class="${TAG}">${esc(x.nome)}</span>`).join('')}</span>` : `<span class="font-medium ${AVISO}">Nenhum perfil: o usuário existe, mas não acessa nada.</span>`),
        campoValor('Permissões adicionais', extras ? `${extras} ${extras === 1 ? 'ação' : 'ações'} <span class="${APOIO}">· fora dos perfis</span>` : `<span class="${APOIO}">nenhuma</span>`),
      ]),
    });
  }

  function cartaoTurmas(p) {
    const ORDEM = { em_andamento: 0, a_concluir: 1, planejada: 2, concluida: 3, cancelada: 4 };
    const turmas = Aulor.turmasDoProfessor(p.id).map((t) => ({ t, s: Aulor.situacaoTurma(t) })).sort((a, b) => ORDEM[a.s] - ORDEM[b.s] || b.t.inicio.localeCompare(a.t.inicio));
    const n = turmas.filter((x) => !['concluida', 'cancelada'].includes(x.s)).length;
    return cartao({
      titulo: 'Turmas',
      contexto: turmas.length ? `${n} ${n === 1 ? 'aberta' : 'abertas'} de ${turmas.length}. A turma escolhe o professor no próprio cadastro.` : 'A turma escolhe o professor no próprio cadastro.',
      classe: 'xl:col-span-2 overflow-hidden',
      corpo: turmas.length ? `<div class="mt-3 overflow-x-auto border-t border-slate-200 dark:border-neutral-800"><table class="tabela">
        <thead><tr><th>Turma</th><th>Situação</th><th class="text-right num">Período</th><th class="text-right num">Alunos</th></tr></thead>
        <tbody>${turmas.map(({ t, s }) => `<tr data-href="turma.html?id=${t.id}" class="${FOCO_LINHA}">
          <td><a href="turma.html?id=${t.id}" class="link-registro font-medium font-mono ${TITULO} hover:underline underline-offset-2 focus-visible:outline-none">${esc(t.codigo)}</a><p class="text-xs ${APOIO} truncate">${esc(Aulor.curso(t.cursoId)?.nome ?? '')}</p></td>
          <td>${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome)}</td>
          <td class="num">${dataBr(t.inicio)} a ${dataBr(t.fim)}</td>
          <td class="num">${Aulor.ocupacao(t).ocupadas} / ${t.capacidade}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : `<p class="p-4 text-sm ${APOIO}">Nenhuma turma com este professor ainda.</p>`,
    });
  }

  function renderFicha(id) {
    const p = Aulor.professor(id);
    if (!p) { tela.innerHTML = `<div class="painel max-w-xl mx-auto">${vazio('Professor não encontrado', '', '<a class="btn-sec" href="professores.html">Voltar para os professores</a>')}</div>`; return; }
    const tel = String(p.telefone ?? '').replace(/\D/g, '');
    tela.innerHTML = `
      <div>
        ${cabecalhoFicha({
          trilha: [{ rotulo: 'Professores', href: 'professores.html' }, { rotulo: esc(p.nome) }],
          avatar: avatar(p.nome, 'h-12 w-12 text-base'),
          nome: esc(p.nome),
          chips: [
            p.especialidade ? chip(ICONE.tag, esc(p.especialidade), 'Especialidade') : '',
            p.email ? chip(ICONE.email, `<a href="mailto:${esc(p.email)}" class="hover:underline">${esc(p.email)}</a>`, 'E-mail') : '',
            tel ? chip(ICONE.telefone, `<span class="tabular-nums">${telefoneFmt(p.telefone)}</span>`, 'Celular') : '',
          ],
          acoes: `${tel.length >= 10 ? `<a href="https://wa.me/55${tel}" target="_blank" rel="noopener" class="btn-sec px-2.5" title="Conversar no WhatsApp" aria-label="Conversar com ${esc(p.nome)} no WhatsApp">${ICONE.whatsapp}</a>` : ''}${gerencia ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar dados</button>` : ''}`,
        })}
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          ${cartao({
            titulo: 'Dados',
            contexto: 'Como aparece nas turmas, na chamada e no certificado.',
            acao: gerencia ? '<button type="button" data-editar class="btn-fantasma">Editar</button>' : '',
            corpo: gradeCampos([
              campoValor('Nome completo', esc(p.nome), 'sm:col-span-2'),
              campoValor('E-mail', p.email ? `<a href="mailto:${esc(p.email)}" class="link">${esc(p.email)}</a>` : ''),
              campoValor('Celular', tel ? `<span class="tabular-nums">${telefoneFmt(p.telefone)}</span>` : ''),
              campoValor('Especialidade', esc(p.especialidade), 'sm:col-span-2'),
            ]),
          })}
          ${cartaoAcesso(p)}
          ${cartaoTurmas(p)}
        </div>
      </div>`;
    ligarLinhasLink(tela);
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirFormProfessor({ professor: Aulor.professor(id), aoSalvar: () => { toast('Professor atualizado'); renderFicha(id); } })));
    tela.querySelector('[data-convidar]:not([disabled])')?.addEventListener('click', () => convidar(p));
  }

  // ---------- Início ----------

  const id = parametroUrl('professor');
  if (id) { renderFicha(id); return; }
  renderLista();
  tela.addEventListener('input', (e) => {
    if (e.target.id !== 'busca') return;
    filtro.q = e.target.value;
    tela.querySelector('[data-tabela]').innerHTML = tabela(filtrados(), Aulor.professores().length);
    ligarLinhasLink(tela.querySelector('[data-tabela]'));
  });
  tela.addEventListener('click', (e) => {
    if (e.target.closest('[data-novo]')) abrirFormProfessor({ aoSalvar: (p) => { toast('Professor cadastrado'); location.href = urlFicha(p.id); } });
    if (e.target.closest('[data-limpar]')) { filtro.q = ''; renderLista(); tela.querySelector('#busca').focus(); }
  });
})();
