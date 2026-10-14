// ============================================================
// Certificado emitido: visualização, impressão/PDF, link de validação
// e cancelamento. Os dados são o retrato do momento da emissão.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');

  function render() {
    const c = Aulor.certificado(id);
    if (!c) { tela.innerHTML = vazio('Certificado não encontrado', '', '<a class="btn-sec" href="certificados.html">Voltar</a>'); return; }
    const valido = c.status === 'valido';
    const modelo = Aulor.modeloDoCertificado(c);
    const link = `${Certificado.urlValidacao()}?codigo=${encodeURIComponent(c.codigo)}`;
    const publica = Aulor.temModulo('validacao_publica');
    const acoes = [
      valido ? `<button type="button" data-imprimir class="btn-pri">${ICONE.imprimir}Imprimir ou salvar PDF</button>` : '',
      valido && publica ? `<button type="button" data-copiar class="btn-sec">${ICONE.copiar}Copiar link de validação</button>` : '',
      valido && Shell.pode('certificados', 'cancelar') ? '<button type="button" data-cancelar class="btn-sec text-ruim">Cancelar</button>' : '',
    ].join('');
    tela.innerHTML = `
      <div class="max-w-5xl mx-auto">
        ${parametroUrl('emitido') ? '<div class="mb-4 rounded-xl border border-bom/30 bg-bom/10 px-4 py-3 text-sm text-tinta">Certificado emitido. Imprima, salve em PDF ou envie o link de validação ao aluno.</div>' : ''}
        ${cabecalhoPagina({ titulo: `Certificado ${esc(c.codigo)} <span class="align-middle ml-1">${valido ? pilula('ok', 'Válido') : pilula('neutro', 'Cancelado')}</span>`, subtitulo: `${esc(c.dados.aluno)} · ${esc(c.dados.curso)} · emitido em ${dataBr(c.emitidoEm)} por ${esc(c.emitidoPor)} · modelo ${esc(modelo.nome)}`, voltar: { href: 'certificados.html?aba=emitidos', rotulo: 'Certificados' }, acoes })}
        ${!valido ? `<p class="mb-4 rounded-xl bg-etiqueta px-4 py-3 text-sm">Cancelado em ${dataBr(c.canceladoEm)}: ${esc(c.motivoCancelamento)}. A página de validação informa o cancelamento.</p>` : ''}
        <div class="space-y-4 max-w-4xl">${Certificado.folhas(Certificado.dadosDe(c), { modelo, cancelado: !valido })}</div>
        <p class="text-xs text-tinta-2 mt-4 max-w-4xl">PDF pelo diálogo de impressão do navegador nesta versão. Em produção: PDF gerado no servidor, envio por e-mail e QR code apontando para a validação.</p>
      </div>`;
    tela.querySelector('[data-imprimir]')?.addEventListener('click', () => Certificado.imprimir(Certificado.dadosDe(c), modelo));
    tela.querySelector('[data-copiar]')?.addEventListener('click', () => copiarTexto(link, 'Link de validação copiado'));
    tela.querySelector('[data-cancelar]')?.addEventListener('click', () => modalFormulario({
      id: 'form-cancelar-cert',
      titulo: 'Cancelar certificado',
      subtitulo: `${c.codigo} · ${c.dados.aluno}`,
      rotulo: 'Cancelar certificado',
      largura: 'md',
      foco: '#f-motivo',
      corpo: `<p class="text-sm text-tinta-2">O código continua existindo, mas a validação passa a mostrar "cancelado". Se o motivo for um erro de dados, corrija o cadastro e emita de novo.</p>
        <div><label class="rotulo" for="f-motivo">Motivo <span class="text-ruim">*</span></label><input id="f-motivo" name="motivo" class="campo">${ERRO('motivo')}</div>`,
      aoSalvar: (fd) => {
        const r = Aulor.cancelarCertificado(c.id, fd.get('motivo'), Shell.nome());
        if (r.erros) return r.erros;
        toast('Certificado cancelado');
        render();
        return [];
      },
    }));
  }

  render();
})();
