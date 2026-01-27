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
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const matricula = document.getElementById('matricula')?.value || '';
    const password = document.getElementById('password')?.value || '';

    if (matricula === '99999999' && password === '123456') {
      try {
        localStorage.setItem(
          'sgv_usuario_logado',
          JSON.stringify({ matricula, perfil: 'ADMIN' })
        );
      } catch (e) {
        // se localStorage não estiver disponível, apenas segue
      }
      window.location.href = '/home.html';
    } else {
      showToast('Matrícula ou senha incorretos.');
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

  const salvarUsuariosLocal = () => {
    try {
      localStorage.setItem('sgv_usuarios', JSON.stringify(usuarios));
    } catch (e) {
      // ignora falha de armazenamento
    }
  };

  const carregarUsuariosLocal = () => {
    try {
      const data = localStorage.getItem('sgv_usuarios');
      if (data) {
        usuarios = JSON.parse(data);
      }
    } catch (e) {
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
        const confirma = window.confirm(
          'Deseja realmente excluir esse usuário?'
        );
        if (confirma) {
          usuarios.splice(idx, 1);
          salvarUsuariosLocal();
          renderizarTabelaUsuarios();
        }
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

  carregarUsuariosLocal();

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

    if (erros.length) {
      msgEl.textContent = erros[0];
      msgEl.style.color = '#e74c3c';
      return;
    }

    const perfilLabel =
      perfil === 'ADMIN'
        ? 'Administrador'
        : perfil === 'EDITOR'
        ? 'Editor'
        : 'Leitor';

    if (indiceEdicao !== null && usuarios[indiceEdicao]) {
      usuarios[indiceEdicao] = { nome, matricula, posto, cpf, perfil, perfilLabel };
      msgEl.textContent = 'Usuário atualizado com sucesso.';
    } else {
      usuarios.push({ nome, matricula, posto, cpf, perfil, perfilLabel });
      msgEl.textContent = 'Usuário incluído com sucesso.';
    }

    salvarUsuariosLocal();
    msgEl.style.color = '#2ecc71';
    userForm.reset();
    indiceEdicao = null;
    if (btnIncluir) btnIncluir.textContent = 'Incluir';
    renderizarTabelaUsuarios();
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
    btnListar.addEventListener('click', () => {
      renderizarTabelaUsuarios();
    });
  }
}
