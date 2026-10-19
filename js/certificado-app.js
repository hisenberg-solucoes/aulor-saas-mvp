// ============================================================
// Certificado emitido, na direção Ficha em cartões: trilha, miniatura da
// frente no lugar do avatar, "Imprimir ou salvar PDF" à vista e o resto no
// "Mais" (link de validação, matrícula, cancelamento). Os dados são o retrato
// do momento da emissão; a folha segue as cores e as fontes do modelo.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');
  // Ícone de documento da linha de chips (ICONE.documento do original; base.js não tem).

  function cancelar(c) {
    modalFormulario({
      id: 'form-cancelar-cert',
      titulo: 'Cancelar certificado',
      subtitulo: `${c.codigo} · ${c.dados.aluno}`,
      rotulo: 'Cancelar certificado',
      largura: 'md',
      foco: '#f-motivo',
      corpo: `<p class="text-sm text-slate-600 dark:text-neutral-300">O código continua existindo, mas a validação passa a mostrar "cancelado". Se o motivo for um erro de dados, corrija o cadastro e emita de novo.</p>
        <div><label class="rotulo" for="f-motivo">Motivo <span class="text-red-600 dark:text-red-400">*</span></label><input id="f-motivo" name="motivo" class="campo">${ERRO('motivo')}</div>`,
      aoSalvar: (fd) => {
        const r = Aulor.cancelarCertificado(c.id, fd.get('motivo'), Shell.nome());
        if (r.erros) return r.erros;
        toast('Certificado cancelado');
        render();
        return [];
      },
    });
  }

  function render() {
    const c = Aulor.certificado(id);
    if (!c) { tela.innerHTML = `<div class="painel max-w-xl mx-auto">${vazio('Certificado não encontrado', '', '<a class="btn-sec" href="certificados.html">Voltar para os certificados</a>')}</div>`; return; }
    const valido = c.status === 'valido';
    const modelo = Aulor.modeloDoCertificado(c);
    const dados = Certificado.dadosDe(c);
    const link = `${Certificado.urlValidacao()}?codigo=${encodeURIComponent(c.codigo)}`;
    const publica = Aulor.temModulo('validacao_publica');
    const podeCancelar = Shell.pode('certificados', 'cancelar');
    const mais = [
      valido && publica ? { nome: 'Copiar link de validação', detalhe: 'Para enviar ao aluno ou a quem vai conferir', acao: () => copiarTexto(link, 'Link de validação copiado') } : null,
      publica ? { nome: 'Abrir a página de validação', detalhe: 'O que aparece para quem confere o código', acao: () => window.open(link, '_blank', 'noopener') } : null,
      c.matriculaId && Aulor.matricula(c.matriculaId) ? { nome: 'Ver a matrícula', detalhe: 'Frequência, nota e parcelas do aluno', acao: () => { location.href = `matricula.html?id=${c.matriculaId}`; } } : null,
      valido ? 'sep' : null,
      valido ? { nome: 'Cancelar certificado', perigo: true, desabilitado: !podeCancelar, detalhe: podeCancelar ? 'A validação passa a mostrar "cancelado"' : 'Seu perfil não cancela certificados', acao: () => cancelar(c) } : null,
    ].filter(Boolean);
    tela.innerHTML = `
      <div class="max-w-5xl mx-auto">
        ${cabecalhoFicha({
          trilha: [{ rotulo: 'Certificados', href: 'certificados.html?aba=emitidos' }, { rotulo: `<span class="font-mono">${esc(c.codigo)}</span>` }],
          avatar: Certificado.miniatura(modelo, { dados, altura: 48 }),
          nome: esc(c.dados.aluno),
          chips: [
            chip(ICONE.cadeado.replace('h-4 w-4', 'h-3.5 w-3.5'), `<span class="font-mono">${esc(c.codigo)}</span>`, 'Código de validação'),
            chip(ICONE.documento, `${esc(c.dados.curso)} · <span class="font-mono">${esc(c.dados.turma)}</span>`, 'Curso e turma'),
            chip(ICONE.calendario, `Emitido em ${dataBr(c.emitidoEm)} por ${esc(c.emitidoPor)}`),
            chip(ICONE.tag, `Modelo ${Shell.pode('configuracoes') && Aulor.modeloCertificado(modelo.id) ? `<a class="hover:underline" href="modelo-certificado.html?id=${encodeURIComponent(modelo.id)}">${esc(modelo.nome)}</a>` : esc(modelo.nome)}`, 'Modelo usado na emissão'),
          ],
          acoes: valido ? `<button type="button" data-imprimir class="btn-pri">${ICONE.imprimir}Imprimir ou salvar PDF</button>` : '',
          mais,
        })}
        ${valido ? '' : faixa('neutra', `<span class="font-medium">Cancelado em ${dataBr(c.canceladoEm)}:</span> ${esc(c.motivoCancelamento)}. A página de validação informa o cancelamento.`)}
        <div class="space-y-4 max-w-4xl">${Certificado.folhas(dados, { modelo, cancelado: !valido })}</div>
        <p class="text-xs ${APOIO_FUNDO} mt-4 max-w-4xl">PDF pelo diálogo de impressão do navegador nesta versão. Em produção: PDF gerado no servidor, envio por e-mail e QR code apontando para a validação.</p>
      </div>`;
    tela.querySelector('[data-imprimir]')?.addEventListener('click', () => Certificado.imprimir(dados, modelo));
    tela.querySelector('[data-mais]')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, mais));
  }

  // Frente deste certificado em 48px de altura, no lugar do avatar (como o modelo na ficha dele).
  render();
  // Vindo da emissão: o aviso é um toast, e o parâmetro sai da URL para não repetir ao recarregar.
  if (parametroUrl('emitido') && Aulor.certificado(id)) {
    toast('Certificado emitido. Imprima, salve em PDF ou envie o link de validação ao aluno.');
    const url = new URL(location.href); url.searchParams.delete('emitido'); history.replaceState(null, '', url);
  }
})();
