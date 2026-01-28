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

    const linhas = veiculos.map((v, i) => `
      <tr>
        <td>${v.placa}</td>
        <td>${v.marcaModelo} (${v.anoFabricacao})</td>
        <td>${v.unidade}</td>
        <td>${v.status}</td>
        <td>
          ${v.manualPath ? `<a href="${v.manualPath}" target="_blank">Manual</a>` : '<span style="color:#6c757d;">-</span>'}
          <div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap;">
            ${(v.fotos || []).slice(0,3).map(f => `<img src="${f.url}" alt="${f.nome}" style="width:46px;height:34px;object-fit:cover;border-radius:4px;border:1px solid #edf0f5;"/>`).join('')}
            ${(v.fotos && v.fotos.length > 3) ? `<span style="font-size:12px;color:#6c757d;">+${v.fotos.length - 3}</span>` : ''}
          </div>
        </td>
        <td class="user-actions">
          <button type="button" class="edit" data-index="${i}">Editar</button>
          <button type="button" class="delete" data-index="${i}">Excluir</button>
        </td>
      </tr>
    `).join('');

    listContainer.innerHTML = `
      <table class="user-table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Veículo</th>
            <th>Unidade</th>
            <th>Status</th>
            <th>Anexos</th>
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

        document.getElementById('veic-marca-modelo').value = v.marcaModelo || '';
        document.getElementById('veic-ano').value = v.anoFabricacao || '';
        document.getElementById('veic-prefixo').value = v.prefixo || '';
        document.getElementById('veic-placa').value = v.placa || '';
        document.getElementById('veic-placa-vinculada').value = v.placaVinculada || '';
        document.getElementById('veic-unidade').value = v.unidade || '';
        document.getElementById('veic-km-atual').value = v.kmAtual ?? '';
        document.getElementById('veic-prox-rev-km').value = v.proximaRevisaoKm ?? '';
        document.getElementById('veic-data-prox-rev').value = v.dataProximaRevisao ? String(v.dataProximaRevisao).slice(0,10) : '';
        document.getElementById('veic-condutor').value = v.condutorAtual || '';
        document.getElementById('veic-cartao').value = v.cartao || '';
        document.getElementById('veic-os-cman').value = v.osCman || '';
        document.getElementById('veic-os-prime').value = v.osPrime || '';
        document.getElementById('veic-status').value = v.status || '';

        editId = v.id;
        form.setAttribute('data-edit-id', String(editId));
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Salvar alterações';
        if (msgEl) { msgEl.textContent = 'Editando veículo selecionado.'; msgEl.style.color = '#495057'; }
      });
    });
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
    const cartao = document.getElementById('veic-cartao').value.trim();
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

    const fotosInput = document.getElementById('veic-fotos');
    const manualInput = document.getElementById('veic-manual');
    if (fotosInput && fotosInput.files) {
      Array.from(fotosInput.files).forEach((file) => fd.append('fotos', file));
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

      if (msgEl) { msgEl.textContent = 'Veículo salvo com sucesso.'; msgEl.style.color = '#2ecc71'; }
      form.reset();
      editId = null; form.removeAttribute('data-edit-id');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Salvar';
      await carregar();
      render();
    } catch (e) {
      if (msgEl) { msgEl.textContent = 'Erro ao comunicar com o servidor.'; msgEl.style.color = '#e74c3c'; }
    }
  });

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      form.reset();
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
    if (!/^\d{5,10}$/.test(novaSenha)) {
      msgEl.textContent = 'Nova senha deve conter somente números e ter entre 5 e 10 dígitos.';
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

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Normaliza matrícula e senha para validação manual com feedback via toast.
    const matricula = document.getElementById('matricula')?.value.trim() || '';
    const password = document.getElementById('password')?.value.trim() || '';
    // Sanitiza matrícula para conter apenas dígitos antes de validar.
    const matriculaSomenteDigitos = apenasDigitos(matricula);

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
    if (!/^\d{5,10}$/.test(password)) {
      showToast('A senha deve ter de 5 a 10 números.');
      return;
    }

    try {
      const resposta = await fetch('/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricula: matriculaSomenteDigitos, senha: password }),
      });

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
      showToast('Erro ao tentar fazer login.');
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

    if (!/^\d{5,10}$/.test(novaSenha)) {
      window.alert('Nova senha deve conter somente números e ter entre 5 e 10 dígitos.');
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
          msgEl.textContent = 'Usuário atualizado com sucesso.';
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
