// Página pública: o próprio instrutor completa o cadastro a partir do link (token) que a escola mandou.
// Protótipo: lê/grava o mesmo localStorage da tela de instrutores — em produção é um endpoint com token de uso único.

const estado = { instrutor: null, token: '', d: null };

const CAMPOS = ['nome', 'apelido', 'nascimento', 'cpf', 'rg', 'especialidade', 'bio', 'email', 'whatsapp', 'emergenciaNome', 'emergenciaTelefone',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cnpj', 'razaoSocial', 'banco', 'agencia', 'conta', 'pix',
  'antecedentesArquivo', 'aceite', 'aceiteDados'];

function coletar(form) {
  const fd = new FormData(form);
  CAMPOS.forEach((c) => {
    const el = form.querySelector(`[name="${c}"]`);
    if (!el) return;
    estado.d[c] = el.type === 'checkbox' ? fd.has(c) : (fd.get(c) ?? '');
  });
}

function render() {
  const i = estado.instrutor;
  const d = estado.d;
  document.getElementById('tela').innerHTML = `
    <div class="mb-6">
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">Cadastro de instrutor da ${esc(Aulor.escola().nome)}</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">Olá, ${esc((i.apelido || i.nome).split(' ')[0])}! Confira o que já foi preenchido e complete o restante — precisamos disso para emitir seu contrato e pagar suas aulas. Leva uns 5 minutos.</p>
    </div>
    <form id="form" novalidate class="space-y-5">
      ${secaoFoto(d)}
      ${secaoDados(d)}
      ${secaoContato(d)}
      ${secaoEndereco(d)}
      ${secaoEmpresa(d)}
      ${secaoDocumentos(d)}
      ${secaoLgpd(d)}
      <div class="flex items-center justify-end gap-3 pb-8">
        <button type="submit" class="${BOTAO_PRI}">Enviar cadastro</button>
      </div>
    </form>`;

  const form = document.getElementById('form');
  ligarFoto(form, (foto) => {
    coletar(form);
    estado.d.foto = foto;
    render();
  });
  ligarAntecedentes(form);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    coletar(form);
    const atuais = Instrutores.carregar();
    const erros = Instrutores.validarPreenchimento(montar(estado.d), atuais, i.id);
    if (mostrarErros(form, erros)) { toast('Confira os campos destacados.'); return; }
    Instrutores.salvar(Instrutores.preencherPeloInstrutor(atuais, estado.token, montar(estado.d)));
    window.scrollTo({ top: 0 });
    telaAviso('Cadastro enviado. Obrigado!', `A ${Aulor.escola().nome} já recebeu seus dados. O próximo passo é o contrato de prestação de serviço, que chega para assinatura no Clicksign.`, 'ok');
  });
}

(function iniciar() {
  const token = new URLSearchParams(location.search).get('token');
  const lista = Instrutores.carregar();
  const i = Instrutores.porTokenCadastro(lista, token);
  if (!i) { telaAviso('Link inválido ou expirado', `Peça um novo link para a ${Aulor.escola().nome} pelo WhatsApp ou e-mail.`); return; }
  if (i.cadastro.preenchidoEm) { telaAviso('Cadastro já enviado', `Recebemos seus dados em ${esc(Instrutores.fmtData(i.cadastro.preenchidoEm.slice(0, 10)))}. Se precisar corrigir algo, fale com a coordenação.`, 'ok'); return; }
  estado.instrutor = i; estado.token = token; estado.d = dadosIniciais(i);
  render();
})();
