// ===== Toast utilitário (global) =====
window.showToast = (msg = '') => {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
};

// ===== Login =====
(() => {
  const form = document.getElementById('login-form');
  if (!form) return; // só na tela de login

  const inputMatricula = document.getElementById('matricula');
  const inputSenha = document.getElementById('password');
  const btnLogin = document.getElementById('btn-login');
  const spinner = btnLogin?.querySelector('.btn-spinner');
  const btnText = btnLogin?.querySelector('.btn-text');
  const btnToggle = document.getElementById('toggle-password');

  // Alternar exibição da senha
  if (btnToggle && inputSenha) {
    btnToggle.addEventListener('click', () => {
      const show = inputSenha.type === 'password';
      inputSenha.type = show ? 'text' : 'password';
      btnToggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    });
  }

  const onlyDigits = (v = '') => String(v).replace(/\D/g, '');

  const setLoading = (loading) => {
    if (!btnLogin) return;
    btnLogin.disabled = loading;
    if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
    if (btnText) btnText.style.opacity = loading ? '0.6' : '1';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const matricula = onlyDigits(inputMatricula?.value || '');
    const senha = onlyDigits(inputSenha?.value || '');

    if (!/^\d{8}$/.test(matricula)) {
      showToast('Informe uma matrícula com 8 números.');
      inputMatricula?.focus();
      return;
    }
    if (!/^\d{4}$/.test(senha)) {
      showToast('A senha deve ter 4 números.');
      inputSenha?.focus();
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula, senha }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(data?.message || 'Matrícula ou senha incorretos.');
        return;
      }

      // Guarda o usuário e vai para a Home
      try { localStorage.setItem('sgv:user', JSON.stringify(data)); } catch {}
      window.location.href = '/home.html';
    } catch (err) {
      showToast('Falha ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  });
})();

// Recuperação de senha (modal)
const forgotPasswordLink = document.getElementById('forgot-password-link');
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const forgotCancel = document.getElementById('forgot-cancel');

if (forgotPasswordLink && forgotPasswordModal) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('forgot-password-message').textContent = '';
    forgotPasswordModal.style.display = 'flex';
  });
}

// ===== Cadastro de Veículo: salvar, listar, editar e excluir =====
(() => {
  const form = document.getElementById('vehicle-form');
  const listSection = document.getElementById('vehicle-list-section');
  const listContainer = document.getElementById('vehicle-list-container');
  const btnListar = document.getElementById('veh-btn-listar');
  const msgEl = document.getElementById('vehicle-form-message');
  const btnLimpar = document.getElementById('veh-btn-limpar');

  if (!form) return; // só executa na página cadastro.html

  let veiculos = [];
  let editId = null; // id do veículo em edição

  const toDigits = (v = '') => v.replace(/\D/g, '');
  const validarPlacaBR = (placa) => {
    const p = (placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const reAntiga = /^[A-Z]{3}\d{4}$/; // ABC1234
    const reMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/; // ABC1D23
    return reAntiga.test(p) || reMercosul.test(p);
  };

  const getStatusView = (code) => {
    const c = String(code || '').toUpperCase();
    if (c === 'BAIXADA') return { label: 'Baixada', cls: 'status-baixada' };
    if (c === 'OFICINA') return { label: 'Oficina', cls: 'status-oficina' };
    if (c === 'ATIVA') return { label: 'Ativa', cls: 'status-ativa' };
    return { label: 'Base', cls: 'status-base' };
  };

  const initFotosCadastro = ({ inputEl, previewEl, msgEl, maxCount = 12, maxSizeMb = 5 }) => {
    if (!inputEl || !previewEl) return null;

    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    const selected = [];
    let existing = [];
    let currentVeiculoId = null;

    const setErro = (mensagem) => {
      if (!msgEl) return;
      msgEl.textContent = mensagem;
      msgEl.style.color = '#e74c3c';
    };

    const limparErro = () => {
      if (!msgEl) return;
      if (msgEl.textContent === '') return;
      msgEl.textContent = '';
    };

    const criarCardExistente = (foto) => {
      const card = document.createElement('div');
      card.className = 'fotos-preview__card';

      const thumb = document.createElement('img');
      thumb.className = 'fotos-preview__thumb';
      thumb.alt = foto?.nome || 'Foto existente';
      thumb.src = foto?.url || '';

      const meta = document.createElement('div');
      meta.className = 'fotos-preview__meta';

      const nome = document.createElement('span');
      nome.textContent = foto?.nome || 'Foto existente';

      const tag = document.createElement('span');
      tag.className = 'fotos-preview__tag';
      tag.textContent = 'Existente';

      meta.append(nome, tag);

      const actions = document.createElement('div');
      actions.className = 'fotos-preview__actions';

      const abrir = document.createElement('button');
      abrir.type = 'button';
      abrir.className = 'fotos-preview__action fotos-preview__action--open';
      abrir.textContent = 'Abrir';
      abrir.addEventListener('click', () => {
        if (foto?.url) {
          window.open(foto.url, '_blank', 'noopener');
        }
      });

      const excluir = document.createElement('button');
      excluir.type = 'button';
      excluir.className = 'fotos-preview__action fotos-preview__action--delete';
      excluir.textContent = 'Excluir';
      excluir.addEventListener('click', async () => {
        if (!currentVeiculoId || !foto?.id) return;
        const confirmado = window.confirm('Deseja realmente excluir esse registro?');
        if (!confirmado) return;
        // Dispara a exclusão via handler para manter o estado atualizado.
        const sucesso = await excluirFotoExistente(currentVeiculoId, foto.id);
        if (sucesso && typeof showToast === 'function') {
          showToast('Foto excluída com sucesso.');
        }
      });

      actions.append(abrir, excluir);
      card.append(thumb, meta, actions);

      return card;
    };

    const criarCardNovo = (item, index) => {
      const card = document.createElement('div');
      card.className = 'fotos-preview__card';

      const thumb = document.createElement('img');
      thumb.className = 'fotos-preview__thumb';
      thumb.alt = item.file.name;
      thumb.src = item.previewUrl;

      const meta = document.createElement('div');
      meta.className = 'fotos-preview__meta';

      const nome = document.createElement('span');
      nome.textContent = item.file.name;

      const tag = document.createElement('span');
      tag.className = 'fotos-preview__tag';
      tag.textContent = 'Novo';

      meta.append(nome, tag);

      const remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'fotos-preview__remove';
      remover.textContent = 'Remover';
      remover.addEventListener('click', () => {
        const [removido] = selected.splice(index, 1);
        if (removido?.previewUrl) URL.revokeObjectURL(removido.previewUrl);
        renderizar();
      });

      card.append(thumb, meta, remover);
      return card;
    };

    const renderizar = () => {
      previewEl.innerHTML = '';
      existing.forEach((foto) => {
        previewEl.appendChild(criarCardExistente(foto));
      });
      selected.forEach((item, index) => {
        previewEl.appendChild(criarCardNovo(item, index));
      });
    };

    const adicionarArquivos = (arquivos) => {
      limparErro();
      const lista = Array.from(arquivos || []);
      const erros = [];

      lista.forEach((file) => {
        if (selected.length >= maxCount) {
          erros.push(`Limite de ${maxCount} fotos atingido.`);
          return;
        }
        if (file.size > maxSizeBytes) {
          erros.push(`Arquivo ${file.name} excede ${maxSizeMb}MB.`);
          return;
        }
        selected.push({ file, previewUrl: URL.createObjectURL(file) });
      });

      if (erros.length) {
        setErro(erros[0]);
      }

      renderizar();
      inputEl.value = '';
    };

    inputEl.addEventListener('change', (event) => {
      adicionarArquivos(event.target.files);
    });

    const excluirFotoExistente = async (veiculoId, fotoId) => {
      if (!veiculoId || !fotoId) return false;
      try {
        const res = await fetch(`/api/v1/veiculos/${veiculoId}/fotos/${fotoId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          window.alert('Erro ao excluir foto');
          return false;
        }
        existing = existing.filter((item) => item.id !== fotoId);
        renderizar();
        return true;
      } catch (error) {
        console.error(error);
        window.alert('Erro ao excluir foto');
        return false;
      }
    };

    return {
      excluirFotoExistente,
      setExistingFotos: (fotos, veiculoId = null) => {
        existing = Array.isArray(fotos) ? fotos : [];
        currentVeiculoId = veiculoId;
        renderizar();
      },
      limparSelecionados: () => {
        selected.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        selected.length = 0;
        renderizar();
      },
      limpar: () => {
        selected.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        selected.length = 0;
        existing = [];
        currentVeiculoId = null;
        renderizar();
      },
      getSelectedFiles: () => selected.map((item) => item.file),
    };
  };

  const fotosHandler = initFotosCadastro({
    inputEl: document.getElementById('veic-fotos'),
    previewEl: document.getElementById('veic-fotos-preview'),
    msgEl,
    maxCount: 12,
    maxSizeMb: 5,
  });

  const carregar = async () => {
    try {
      const res = await fetch('/api/v1/veiculos');
      if (!res.ok) throw new Error('Falha ao carregar veículos');
      veiculos = await res.json();
    } catch (e) {
      console.error(e);
      veiculos = [];
    }
  };

  const render = () => {
    if (!listContainer || !listSection) return;
    if (!veiculos.length) {
      listContainer.innerHTML = '<p style="font-size:14px;color:#6c757d;">Nenhum veículo cadastrado.</p>';
      listSection.style.display = 'block';
      return;
    }

    const linhas = veiculos.map((v, i) => {
      const sv = getStatusView(v.status);
      return `
      <tr>
        <td>${v.placaVinculada || '-'}</td>
        <td>${v.marcaModelo} (${v.anoFabricacao})</td>
        <td>${v.condutorAtual || '-'}</td>
        <td><span class="${sv.cls}">${sv.label}</span></td>
        <td class="user-actions">
          <button type="button" class="edit" data-index="${i}">Editar</button>
          <button type="button" class="delete" data-index="${i}">Excluir</button>
        </td>
      </tr>
    `}).join('');

    listContainer.innerHTML = `
      <table class="user-table">
        <thead>
          <tr>
            <th>Placa Vinculada</th>
            <th>Veículo</th>
            <th>Condutor</th>
            <th>Status</th>
            <th style="width:120px;">Ações</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;

    listSection.style.display = 'block';

    // Excluir
    listContainer.querySelectorAll('button.delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-index'));
        const v = veiculos[idx];
        if (!v) return;
        if (!window.confirm('Deseja realmente excluir este veículo?')) return;
        try {
          const res = await fetch(`/api/v1/veiculos/${v.id}` , { method: 'DELETE' });
          if (!res.ok) throw new Error('Erro ao excluir');
          await carregar();
          render();
        } catch (e) {
          console.error(e);
          window.alert('Erro ao excluir veículo');
        }
      });
    });

    // Editar
    listContainer.querySelectorAll('button.edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        const v = veiculos[idx];
        if (!v) return;
        preencherFormularioVeiculo(v);
      });
    });
  };

  const preencherFormularioVeiculo = (veiculo, { mostrarMensagem = true } = {}) => {
    if (!veiculo) return;

    document.getElementById('veic-marca-modelo').value = veiculo.marcaModelo || '';
    document.getElementById('veic-ano').value = veiculo.anoFabricacao || '';
    document.getElementById('veic-prefixo').value = veiculo.prefixo || '';
    document.getElementById('veic-placa').value = veiculo.placa || '';
    document.getElementById('veic-placa-vinculada').value = veiculo.placaVinculada || '';
    document.getElementById('veic-unidade').value = veiculo.unidade || '';
    document.getElementById('veic-km-atual').value = veiculo.kmAtual ?? '';
    document.getElementById('veic-prox-rev-km').value = veiculo.proximaRevisaoKm ?? '';
    document.getElementById('veic-data-prox-rev').value = veiculo.dataProximaRevisao ? String(veiculo.dataProximaRevisao).slice(0,10) : '';
    document.getElementById('veic-condutor').value = veiculo.condutorAtual || '';

    const cartaoInput = document.getElementById('veic-cartao');
    if (veiculo.cartao && typeof veiculo.cartao === 'string' && veiculo.cartao.length === 16) {
      // Mostra apenas os 4 últimos dígitos editáveis
      cartaoInput.value = '4599.0000.0000.' + veiculo.cartao.slice(12);
    } else {
      cartaoInput.value = '4599.0000.0000.';
    }
    if (cartaoInput && typeof cartaoInput._updateCardOverlay === 'function') {
      cartaoInput._updateCardOverlay();
    }

    document.getElementById('veic-os-cman').value = veiculo.osCman || '';
    document.getElementById('veic-os-prime').value = veiculo.osPrime || '';
    document.getElementById('veic-status').value = veiculo.status || '';

    editId = veiculo.id;
    if (fotosHandler) {
      // Repassa o editId atual para o handler de fotos.
      if (typeof fotosHandler.limparSelecionados === 'function') {
        fotosHandler.limparSelecionados();
      }
      fotosHandler.setExistingFotos(veiculo.fotos || [], editId);
    }
    form.setAttribute('data-edit-id', String(editId));
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Salvar alterações';
    if (mostrarMensagem && msgEl) {
      msgEl.textContent = 'Editando veículo selecionado.';
      msgEl.style.color = '#495057';
    }
  };

  // Envio do formulário (POST/PUT) com arquivos (FormData)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msgEl) msgEl.textContent = '';

    const marcaModelo = document.getElementById('veic-marca-modelo').value.trim();
    const anoFabricacao = Number(toDigits(document.getElementById('veic-ano').value));
    const prefixo = document.getElementById('veic-prefixo').value.trim();
    const placa = document.getElementById('veic-placa').value.trim().toUpperCase();
    const placaVinculada = document.getElementById('veic-placa-vinculada').value.trim().toUpperCase();
    const unidade = document.getElementById('veic-unidade').value.trim();
    const kmAtual = Number(toDigits(document.getElementById('veic-km-atual').value));
    const proximaRevisaoKm = Number(toDigits(document.getElementById('veic-prox-rev-km').value));
    const dataProximaRevisao = document.getElementById('veic-data-prox-rev').value;
    const condutorAtual = document.getElementById('veic-condutor').value.trim();
    // Cartão: só permite digitar os 4 últimos dígitos, prefixo fixo
    const cartaoInput = document.getElementById('veic-cartao');
    let cartao = cartaoInput.value.trim();
    // Remove tudo que não for número
    cartao = cartao.replace(/\D/g, '');
    // Garante que o valor tenha pelo menos 4 dígitos finais
    let ultimos4 = cartao.slice(-4);
    if (ultimos4.length < 4) ultimos4 = ultimos4.padStart(4, '0');
    cartao = '459900000000' + ultimos4;
    const osCman = document.getElementById('veic-os-cman').value.trim();
    const osPrime = document.getElementById('veic-os-prime').value.trim();
    const status = document.getElementById('veic-status').value;

    const erros = [];
    if (!marcaModelo) erros.push('Informe Marca/Modelo.');
    const currentYear = new Date().getFullYear();
    if (!(anoFabricacao >= 1970 && anoFabricacao <= currentYear + 1)) erros.push('Informe um ano de fabricação válido.');
    if (!validarPlacaBR(placa)) erros.push('Informe uma placa válida (ABC-1234 ou ABC1D23).');
    if (placaVinculada && !validarPlacaBR(placaVinculada)) erros.push('Placa vinculada inválida.');
    if (!unidade) erros.push('Informe a Unidade.');
    if (!(kmAtual >= 0)) erros.push('Informe Km Atual válido.');
    if (!(proximaRevisaoKm >= 0)) erros.push('Informe Próxima Revisão Km válido.');
    if (!status) erros.push('Selecione o Status.');
    if (erros.length) {
      if (msgEl) { msgEl.textContent = erros[0]; msgEl.style.color = '#e74c3c'; }
      return;
    }

    const fd = new FormData();
    fd.append('marcaModelo', marcaModelo);
    fd.append('anoFabricacao', String(anoFabricacao));
    fd.append('prefixo', prefixo);
    fd.append('placa', placa);
    fd.append('placaVinculada', placaVinculada);
    fd.append('unidade', unidade);
    fd.append('kmAtual', String(kmAtual));
    fd.append('proximaRevisaoKm', String(proximaRevisaoKm));
    if (dataProximaRevisao) fd.append('dataProximaRevisao', dataProximaRevisao);
    fd.append('condutorAtual', condutorAtual);
    fd.append('cartao', cartao);
    fd.append('osCman', osCman);
    fd.append('osPrime', osPrime);
    fd.append('status', status);

    const manualInput = document.getElementById('veic-manual');
    if (fotosHandler) {
      fotosHandler.getSelectedFiles().forEach((file) => fd.append('fotos', file));
    }
    if (manualInput && manualInput.files && manualInput.files[0]) {
      fd.append('manual', manualInput.files[0]);
    }

    try {
      const isEdit = !!editId || !!form.getAttribute('data-edit-id');
      const idPath = editId || form.getAttribute('data-edit-id');
      const url = isEdit ? `/api/v1/veiculos/${idPath}` : '/api/v1/veiculos';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (msgEl) { msgEl.textContent = data?.message || 'Erro ao salvar.'; msgEl.style.color = '#e74c3c'; }
        return;
      }

      // Popup conforme ação solicitada
      if (typeof showToast === 'function') {
        if (isEdit) {
          // Mantém apenas o toast no fluxo de edição para evitar duplicidade.
          showToast('Alterações realizadas com sucesso!');
        } else {
          // Exibe apenas o toast no fluxo de cadastro.
          showToast('Veículo cadastrado com sucesso');
        }
      }

      // Refletir mensagem abaixo do formulário
      if (msgEl) {
        msgEl.textContent = isEdit ? 'Alterações realizadas com sucesso!' : 'Veículo cadastrado com sucesso';
        msgEl.style.color = '#2ecc71';
      }
      if (isEdit) {
        let veiculoAtualizado = null;
        try {
          const detalheRes = await fetch(`/api/v1/veiculos/${idPath}`);
          if (detalheRes.ok) {
            veiculoAtualizado = await detalheRes.json();
          }
        } catch (erro) {
          console.error(erro);
        }
        if (!veiculoAtualizado) {
          await carregar();
          veiculoAtualizado = veiculos.find((veiculo) => String(veiculo.id) === String(idPath));
        }
        if (veiculoAtualizado) {
          preencherFormularioVeiculo(veiculoAtualizado, { mostrarMensagem: false });
        }
        if (listSection && window.getComputedStyle(listSection).display !== 'none') {
          await carregar();
          render();
        }
      } else {
        form.reset();
        if (fotosHandler) fotosHandler.limpar();
        editId = null;
        form.removeAttribute('data-edit-id');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Salvar';
        await carregar();
        render();
      }
    } catch (e) {
      if (msgEl) { msgEl.textContent = 'Erro ao comunicar com o servidor.'; msgEl.style.color = '#e74c3c'; }
    }
  });

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      form.reset();
      if (fotosHandler) fotosHandler.limpar();
      editId = null; form.removeAttribute('data-edit-id');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Salvar';
      if (msgEl) msgEl.textContent = '';
    });
  }

  if (btnListar) {
    btnListar.addEventListener('click', async () => {
      await carregar();
      render();
    });
  }

  // Atualiza a lista após salvamentos feitos em outras lógicas
  document.addEventListener('vehicle-saved', async () => {
    await carregar();
    render();
  });
})();


if (forgotCancel && forgotPasswordModal) {
  forgotCancel.addEventListener('click', () => {
    forgotPasswordModal.style.display = 'none';
  });
}

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('forgot-nome').value.trim();
    const matricula = document.getElementById('forgot-matricula').value.trim();
    const cpf = document.getElementById('forgot-cpf').value.trim();
    const novaSenha = document.getElementById('forgot-nova-senha').value.trim();
    const msgEl = document.getElementById('forgot-password-message');

    if (!nome || !matricula || !cpf || !novaSenha) {
      msgEl.textContent = 'Preencha todos os campos.';
      msgEl.style.color = '#e74c3c';
      return;
    }
    if (!/^\d{4}$/.test(novaSenha)) {
      msgEl.textContent = 'Nova senha deve conter exatamente 4 números.';
      msgEl.style.color = '#e74c3c';
      return;
    }

    try {
      const resposta = await fetch('/api/v1/usuarios/recuperar-senha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, matricula, cpf, novaSenha }),
      });
      const data = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        msgEl.textContent = data?.message || 'Dados não conferem.';
        msgEl.style.color = '#e74c3c';
        return;
      }
      showToast('senha alterada com sucesso');
      msgEl.textContent = 'senha alterada com sucesso';
      msgEl.style.color = '#2ecc71';
      setTimeout(() => {
        forgotPasswordModal.style.display = 'none';
      }, 1200);
    } catch (err) {
      msgEl.textContent = 'Erro ao tentar alterar a senha.';
      msgEl.style.color = '#e74c3c';
    }
  });
}
const apenasDigitos = (valor) => valor.replace(/\D/g, '');

// Máscara e destaque do campo Cartão (xxxx.xxxx.xxxx.xxxx) — últimos 4 dígitos em azul
// Máscara e destaque do campo Cartão (4599.0000.0000.____)
(function () {
  const input = document.getElementById('veic-cartao');
  const overlaySpan = document.querySelector('.card-input-wrapper .card-text');
  if (!input || !overlaySpan) return;

  // Bloqueia edição dos 12 primeiros dígitos
  input.addEventListener('keydown', function (e) {
    const pos = input.selectionStart;
    // Permite navegação, backspace/delete, tab, etc
    if ([8, 9, 37, 39, 46].includes(e.keyCode)) return;
    // Só permite digitar nos últimos 4 dígitos
    if (pos < 15) {
      e.preventDefault();
    }
    // Só permite números
    if (!/\d/.test(e.key) && e.key.length === 1) {
      e.preventDefault();
    }
  });

  // Valor padrão ao focar
  input.addEventListener('focus', function () {
    if (!input.value || input.value.length < 19) {
      input.value = '4599.0000.0000.';
      update();
      setTimeout(() => input.setSelectionRange(15, 19), 0);
    }
  });

  // Seleção automática dos últimos 4 dígitos ao clicar
  input.addEventListener('click', function () {
    if (input.selectionStart < 15) {
      input.setSelectionRange(15, 19);
    }
  });

  // Atualiza overlay
  const update = () => {
    let val = input.value.replace(/\D/g, '');
    if (val.length < 12) val = '459900000000';
    const last4 = val.slice(-4);
    overlaySpan.innerHTML = '4599.0000.0000.' + '<span class="last4">' + last4.padStart(4, '_') + '</span>';
  };
  input._updateCardOverlay = update;
  input.addEventListener('input', update);
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
    const digits = paste.replace(/\D/g, '').slice(-4);
    input.value = '4599.0000.0000.' + digits;
    update();
    setTimeout(() => input.setSelectionRange(15, 19), 0);
  });
  // Inicializa
  update();
})();

// ===== Métricas da Home (contagem de veículos) =====
(() => {
  const elTotal = document.getElementById('metric-total-veiculos');
  const elBaixados = document.getElementById('metric-veiculos-baixados');
  const elOficina = document.getElementById('metric-veiculos-oficina');
  const elBase = document.getElementById('metric-veiculos-base');

  if (!elTotal && !elBaixados && !elOficina && !elBase) return; // não está na home

  const setAll = (t = '-', b = '-', o = '-', ba = '-') => {
    if (elTotal) elTotal.textContent = t;
    if (elBaixados) elBaixados.textContent = b;
    if (elOficina) elOficina.textContent = o;
    if (elBase) elBase.textContent = ba;
  };

  (async () => {
    try {
      const res = await fetch('/api/v1/veiculos');
      if (!res.ok) throw new Error('Falha ao carregar veículos');
      const lista = await res.json();

      const total = Array.isArray(lista) ? lista.length : 0;
      const baixados = (lista || []).filter(v => String(v.status).toUpperCase() === 'BAIXADA').length;
      const oficina = (lista || []).filter(v => String(v.status).toUpperCase() === 'OFICINA').length;
      const base = (lista || []).filter(v => String(v.status).toUpperCase() === 'BASE').length;

      setAll(total, baixados, oficina, base);
    } catch (e) {
      setAll('-', '-', '-', '-');
    }
  })();
})();

// Script principal da tela de login
const loginForm = document.getElementById('login-form');
const toast = document.getElementById('toast');

const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show';
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
};

// Utilitário: fetch com timeout
const fetchWithTimeout = (url, opts = {}, ms = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
};

// Força matrícula a aceitar apenas dígitos enquanto digita
const matriculaInput = document.getElementById('matricula');
if (matriculaInput) {
  matriculaInput.addEventListener('input', () => {
    const v = (matriculaInput.value || '').replace(/\D/g, '').slice(0, 8);
    if (matriculaInput.value !== v) matriculaInput.value = v;
  });
}

// Toggle de visibilidade da senha
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('toggle-password');
if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const isPwd = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPwd ? 'text' : 'password');
    togglePassword.textContent = isPwd ? '🙈' : '👁';
    togglePassword.setAttribute('aria-label', isPwd ? 'Ocultar senha' : 'Mostrar senha');
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Normaliza matrícula e senha para validação manual com feedback via toast.
    const matricula = document.getElementById('matricula')?.value.trim() || '';
    const password = document.getElementById('password')?.value.trim() || '';
    // Sanitiza matrícula para conter apenas dígitos antes de validar.
    const matriculaSomenteDigitos = apenasDigitos(matricula);

    const btn = document.getElementById('btn-login');
    const btnText = btn?.querySelector('.btn-text');
    const btnSpin = btn?.querySelector('.btn-spinner');
    const setLoading = (on) => {
      if (!btn) return;
      btn.disabled = !!on;
      if (btnText && btnSpin) {
        btnText.style.opacity = on ? '0.7' : '1';
        btnSpin.style.display = on ? 'inline-block' : 'none';
      }
    };

    if (!matricula || !password) {
      showToast('Informe matrícula e senha.');
      return;
    }

    // Valida matrícula com 8 dígitos.
    if (!/^\d{8}$/.test(matriculaSomenteDigitos)) {
      showToast('Matrícula deve conter exatamente 8 números.');
      return;
    }

    // Valida senha com 5 a 10 dígitos.
    if (!/^\d{4}$/.test(password)) {
      showToast('A senha deve ter exatamente 4 números.');
      return;
    }

    try {
      setLoading(true);
      const resposta = await fetchWithTimeout('/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricula: matriculaSomenteDigitos, senha: password }),
      }, 10000);

      const data = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        showToast(data?.message || 'Matrícula ou senha incorretos.');
        return;
      }

      try {
        localStorage.setItem('sgv_usuario_logado', JSON.stringify(data));
      } catch (e) {
        // se localStorage não estiver disponível, apenas segue
      }

      window.location.href = '/home.html';
    } catch (error) {
      console.error(error);
      const aborted = (error && (error.name === 'AbortError'));
      showToast(aborted ? 'Servidor não respondeu. Tente novamente.' : 'Erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  });
}

// Comportamento simples de menu ativo na home/usuários
const menuItems = document.querySelectorAll('.sidebar .menu-item');
if (menuItems && menuItems.length) {
  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      menuItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

// Utilitário para obter o usuário logado do localStorage
const getUsuarioLogado = () => {
  try {
    const raw = localStorage.getItem('sgv_usuario_logado');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

// Exibir nome do usuário logado na home (se existir)
const topbarUserName = document.getElementById('topbar-user-name');
if (topbarUserName) {
  const usuarioLogado = getUsuarioLogado();
  if (usuarioLogado?.nome) {
    const posto = usuarioLogado.posto || '';
    const nome = usuarioLogado.nome || '';
    topbarUserName.textContent = posto
      ? `${posto} - ${nome}`
      : nome;
  }
}

// Modal de dados do usuário e alteração de senha
const userModal = document.getElementById('user-modal');
const userModalClose = document.getElementById('user-modal-close');
const passwordModal = document.getElementById('password-modal');
const passwordModalClose = document.getElementById('password-modal-close');
const linkAlterarSenha = document.getElementById('link-alterar-senha');
const btnLogout = document.getElementById('btn-logout');
const changePasswordForm = document.getElementById('change-password-form');

if (topbarUserName && userModal) {
  const usuarioLogado = getUsuarioLogado();

  const openModal = () => {
    if (!usuarioLogado) return;

    const perfilLabel =
      usuarioLogado.perfil === 'ADMIN'
        ? 'Administrador'
        : usuarioLogado.perfil === 'EDITOR'
        ? 'Editor'
        : 'Leitor';

    document.getElementById('modal-user-nome').textContent =
      usuarioLogado.nome || '-';
    document.getElementById('modal-user-matricula').textContent =
      usuarioLogado.matricula || '-';
    document.getElementById('modal-user-posto').textContent =
      usuarioLogado.posto || '-';
    document.getElementById('modal-user-perfil').textContent = perfilLabel;

    userModal.style.display = 'flex';
  };

  const closeModal = () => {
    userModal.style.display = 'none';
  };

  topbarUserName.style.cursor = 'pointer';
  topbarUserName.addEventListener('click', openModal);

  if (userModalClose) {
    userModalClose.addEventListener('click', closeModal);
  }

  userModal.addEventListener('click', (e) => {
    if (e.target === userModal) closeModal();
  });
}

// botão de sair (logout)
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    try {
      localStorage.removeItem('sgv_usuario_logado');
    } catch (e) {
      // se localStorage não estiver disponível, apenas segue
    }

    window.location.href = '/index.html';
  });
}

// abertura/fechamento do popup de alteração de senha
if (linkAlterarSenha && passwordModal) {
  const openPasswordModal = () => {
    const msg = document.getElementById('change-password-message');
    if (msg) msg.textContent = '';
    const current = document.getElementById('current-password');
    const next = document.getElementById('new-password');
    if (current) current.value = '';
    if (next) next.value = '';

    passwordModal.style.display = 'flex';
  };

  const closePasswordModal = () => {
    passwordModal.style.display = 'none';
  };

  linkAlterarSenha.addEventListener('click', (e) => {
    e.preventDefault();
    openPasswordModal();
  });

  if (passwordModalClose) {
    passwordModalClose.addEventListener('click', closePasswordModal);
  }

  passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) closePasswordModal();
  });
}

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioLogado = getUsuarioLogado();

    if (!usuarioLogado?.id) {
      window.alert('Usuário não identificado.');
      return;
    }

    const senhaAtual = document.getElementById('current-password').value;
    const novaSenha = document.getElementById('new-password').value;

    if (!senhaAtual || !novaSenha) {
      window.alert('Preencha a senha atual e a nova senha.');
      return;
    }

    if (!/^\d{4}$/.test(novaSenha)) {
      window.alert('Nova senha deve conter exatamente 4 números.');
      return;
    }

    try {
      const resposta = await fetch(`/api/v1/usuarios/${usuarioLogado.id}/senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        if (resposta.status === 401) {
          window.alert('senha não confere');
          return;
        }

        window.alert(data?.message || 'Erro ao alterar a senha.');
        return;
      }

      changePasswordForm.reset();
      const pm = document.getElementById('password-modal');
      if (pm) pm.style.display = 'none';
      window.alert('Senha alterada com sucesso.');
    } catch (error) {
      console.error(error);
      window.alert('Erro ao alterar a senha.');
    }
  });
}

// ===== Cadastro de Usuários =====

const userForm = document.getElementById('user-form');
const userListSection = document.getElementById('user-list-section');
const userListContainer = document.getElementById('user-list-container');
const btnLimpar = document.getElementById('btn-limpar');
const btnListar = document.getElementById('btn-listar');

const validarCPF = (cpf) => {
  cpf = apenasDigitos(cpf);
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
};

if (userForm) {
  const msgEl = document.getElementById('user-form-message');
  let usuarios = [];
  let indiceEdicao = null;

  const usuarioLogado = getUsuarioLogado();
  const perfilLogado = usuarioLogado?.perfil || 'ADMIN';

  const btnIncluir = userForm.querySelector('button[type="submit"]');

  const apiBase = '/api/v1/usuarios';

  const carregarUsuariosApi = async () => {
    try {
      const resposta = await fetch(apiBase);
      if (!resposta.ok) {
        throw new Error('Erro ao buscar usuários.');
      }
      usuarios = await resposta.json();
    } catch (error) {
      console.error(error);
      msgEl.textContent = 'Não foi possível carregar os usuários do servidor.';
      msgEl.style.color = '#e74c3c';
      usuarios = [];
    }
  };

  const renderizarTabelaUsuarios = () => {
    if (!userListContainer || !userListSection) return;

    if (!usuarios.length) {
      userListContainer.innerHTML = '<p style="font-size:14px;color:#6c757d;">Nenhum usuário cadastrado.</p>';
      userListSection.style.display = 'block';
      return;
    }

    const linhas = usuarios
      .map(
        (u, index) => `
        <tr>
          <td>${u.nome}</td>
          <td>${u.matricula}</td>
          <td>${u.perfilLabel}</td>
          <td class="user-actions">
            <button type="button" data-index="${index}" class="edit">Editar</button>
            <button type="button" data-index="${index}" class="delete">Excluir</button>
          </td>
        </tr>`
      )
      .join('');

    userListContainer.innerHTML = `
      <table class="user-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
            <th>Tipo de Permissão</th>
            <th style="width:120px;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    `;

    userListSection.style.display = 'block';

    // ações de excluir
    const deleteButtons = userListContainer.querySelectorAll('button.delete');
    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (perfilLogado !== 'ADMIN') {
          window.alert('Acesso negado. Procure o administrador do sistema!');
          return;
        }

        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const usuario = usuarios[idx];
        if (!usuario) return;

        const confirma = window.confirm(
          'Deseja realmente excluir esse usuário?'
        );
        if (!confirma) return;

        fetch(`${apiBase}/${usuario.id}`, {
          method: 'DELETE',
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('Erro ao excluir usuário.');
            }
          })
          .then(async () => {
            await carregarUsuariosApi();
            renderizarTabelaUsuarios();
          })
          .catch((error) => {
            console.error(error);
            window.alert('Erro ao excluir usuário no servidor.');
          });
      });
    });

    // ações de editar
    const editButtons = userListContainer.querySelectorAll('button.edit');
    editButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (perfilLogado === 'LEITOR') {
          window.alert('Acesso negado. Procure o administrador do sistema!');
          return;
        }

        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const u = usuarios[idx];
        if (!u) return;

        document.getElementById('user-name').value = u.nome;
        document.getElementById('user-matricula').value = u.matricula;
        document.getElementById('user-posto').value = u.posto;
        document.getElementById('user-cpf').value = u.cpf;
        document.getElementById('user-perfil').value = u.perfil;

        indiceEdicao = idx;
        if (btnIncluir) btnIncluir.textContent = 'Salvar alterações';
        msgEl.textContent = 'Editando usuário selecionado.';
        msgEl.style.color = '#495057';
      });
    });
  };

  // carrega usuários do backend ao abrir a tela
  carregarUsuariosApi().then(() => {
    renderizarTabelaUsuarios();
  });

  // Ajustes visuais conforme perfil (Leitor não pode incluir/alterar)
  if (perfilLogado === 'LEITOR') {
    if (btnIncluir) btnIncluir.disabled = true;
    if (btnLimpar) btnLimpar.disabled = true;
  }

  userForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (perfilLogado === 'LEITOR') {
      window.alert('Acesso negado. Procure o administrador do sistema!');
      return;
    }

    const nome = document.getElementById('user-name').value.trim();
    const matricula = apenasDigitos(
      document.getElementById('user-matricula').value.trim()
    );
    const posto = document.getElementById('user-posto').value.trim();
    const cpf = apenasDigitos(document.getElementById('user-cpf').value.trim());
    const perfil = document.getElementById('user-perfil').value;
      const senha = document.getElementById('user-senha').value;

    const erros = [];

    if (!nome) erros.push('Informe o nome completo.');

    if (!/^\d{8}$/.test(matricula)) {
      erros.push('Matrícula deve conter exatamente 8 números.');
    }

    if (!posto) erros.push('Informe o posto/graduação.');

    if (!/^\d{11}$/.test(cpf)) {
      erros.push('CPF deve conter exatamente 11 números.');
    } else if (!validarCPF(cpf)) {
      erros.push('CPF inválido.');
    }

    if (!perfil) erros.push('Selecione o tipo de perfil.');

      if (!senha || senha.length < 4) {
        erros.push('Informe uma senha com pelo menos 4 caracteres.');
      }

    if (erros.length) {
      msgEl.textContent = erros[0];
      msgEl.style.color = '#e74c3c';
      return;
    }

      const payload = { nome, matricula, posto, cpf, perfil, senha };

    // se estiver editando, faz PUT, senão POST
    if (indiceEdicao !== null && usuarios[indiceEdicao]) {
      const usuarioAtual = usuarios[indiceEdicao];

      fetch(`${apiBase}/${usuarioAtual.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(data?.message || 'Erro ao atualizar usuário.');
          }
          if (typeof showToast === 'function') {
            showToast('Usuário atualizado com sucesso.');
          }
          if (msgEl) {
            msgEl.textContent = '';
          }
          return carregarUsuariosApi();
        })
        .then(() => {
          userForm.reset();
          indiceEdicao = null;
          if (btnIncluir) btnIncluir.textContent = 'Incluir';
          renderizarTabelaUsuarios();
        })
        .catch((error) => {
          console.error(error);
          msgEl.textContent = error.message || 'Erro ao atualizar usuário.';
          msgEl.style.color = '#e74c3c';
        });
    } else {
      fetch(apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(data?.message || 'Erro ao incluir usuário.');
          }
          msgEl.textContent = 'Usuário incluído com sucesso.';
          msgEl.style.color = '#2ecc71';
          return carregarUsuariosApi();
        })
        .then(() => {
          userForm.reset();
          indiceEdicao = null;
          if (btnIncluir) btnIncluir.textContent = 'Incluir';
          renderizarTabelaUsuarios();
        })
        .catch((error) => {
          console.error(error);
          msgEl.textContent = error.message || 'Erro ao incluir usuário.';
          msgEl.style.color = '#e74c3c';
        });
    }
  });

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      userForm.reset();
      if (msgEl) msgEl.textContent = '';
      indiceEdicao = null;
      if (btnIncluir) btnIncluir.textContent = 'Incluir';
    });
  }

  if (btnListar) {
    btnListar.addEventListener('click', async () => {
      await carregarUsuariosApi();
      renderizarTabelaUsuarios();
    });
  }
}
