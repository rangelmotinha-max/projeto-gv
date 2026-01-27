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

    const matricula = document.getElementById('matricula')?.value || '';
    const password = document.getElementById('password')?.value || '';

    if (!matricula || !password) {
      showToast('Informe matrícula e senha.');
      return;
    }

    try {
      const resposta = await fetch('/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricula, senha: password }),
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

// Exibir nome do usuário logado na home (se existir)
const topbarUserName = document.getElementById('topbar-user-name');
if (topbarUserName) {
  const usuarioLogado = getUsuarioLogado();
  if (usuarioLogado?.nome) {
    topbarUserName.textContent = usuarioLogado.nome;
  }
}

// Modal de dados do usuário e alteração de senha
const userModal = document.getElementById('user-modal');
const userModalClose = document.getElementById('user-modal-close');
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

    const msg = document.getElementById('change-password-message');
    if (msg) msg.textContent = '';
    const current = document.getElementById('current-password');
    const next = document.getElementById('new-password');
    if (current) current.value = '';
    if (next) next.value = '';

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

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioLogado = getUsuarioLogado();
    const msgEl = document.getElementById('change-password-message');

    if (!usuarioLogado?.id) {
      if (msgEl) {
        msgEl.textContent = 'Usuário não identificado.';
        msgEl.style.color = '#e74c3c';
      }
      return;
    }

    const senhaAtual = document.getElementById('current-password').value;
    const novaSenha = document.getElementById('new-password').value;

    if (!senhaAtual || !novaSenha) {
      if (msgEl) {
        msgEl.textContent = 'Preencha a senha atual e a nova senha.';
        msgEl.style.color = '#e74c3c';
      }
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
        if (msgEl) {
          msgEl.textContent = data?.message || 'Senha não confere.';
          msgEl.style.color = '#e74c3c';
        }
        return;
      }

      if (msgEl) {
        msgEl.textContent = 'Senha alterada com sucesso.';
        msgEl.style.color = '#2ecc71';
      }
    } catch (error) {
      console.error(error);
      if (msgEl) {
        msgEl.textContent = 'Erro ao alterar a senha.';
        msgEl.style.color = '#e74c3c';
      }
    }
  });
}

// ===== Cadastro de Usuários =====

const userForm = document.getElementById('user-form');
const userListSection = document.getElementById('user-list-section');
const userListContainer = document.getElementById('user-list-container');
const btnLimpar = document.getElementById('btn-limpar');
const btnListar = document.getElementById('btn-listar');

const apenasDigitos = (valor) => valor.replace(/\D/g, '');

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

const getUsuarioLogado = () => {
  try {
    const raw = localStorage.getItem('sgv_usuario_logado');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
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
