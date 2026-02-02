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
      try { localStorage.setItem('sgv_usuario_logado', JSON.stringify(data)); } catch {}
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

// ===== Relatório de Veículos =====
(() => {
  const filtersForm = document.getElementById('report-filters-form');
  const runBtn = document.getElementById('report-run');
  const pdfBtn = document.getElementById('report-pdf');
  const tableContainer = document.getElementById('report-table-container');
  const msgEl = document.getElementById('report-message');
  const periodSelect = document.getElementById('filter-period');
  const chartCanvas = document.getElementById('km-chart');
  let kmChart = null;

  // Esconde a tabela de resultados até o usuário gerar o relatório
  if (tableContainer) {
    tableContainer.style.display = 'none';
  }
  // Esconde o gráfico até o usuário selecionar o período
  if (chartCanvas) {
    chartCanvas.style.display = 'none';
  }

  const elTotal = document.getElementById('report-total');
  const elBase = document.getElementById('report-base');
  const elAtiva = document.getElementById('report-ativa');
  const elOficina = document.getElementById('report-oficina');
  const elBaixada = document.getElementById('report-baixada');

  // Só roda na página de relatório
  if (!tableContainer && !filtersForm && !runBtn) return;

  let lista = [];
  let ultimoResultado = [];

  const norm = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const carregar = async () => {
    try {
      const res = await fetch('/api/v1/veiculos');
      if (!res.ok) throw new Error('Falha ao carregar veículos');
      lista = await res.json();
    } catch (e) {
      console.error(e);
      lista = [];
      if (msgEl) { msgEl.textContent = 'Erro ao carregar dados.'; msgEl.style.color = '#e74c3c'; }
    }
  };

  const toSqlTs = (d) => new Date(d).toISOString().slice(0,19).replace('T',' ');

  const getPeriodRange = (key) => {
    const end = new Date();
    const start = new Date(end);
    const subMonths = (m) => { start.setMonth(start.getMonth() - m); };
    if (key === 'semanal') start.setDate(start.getDate() - 7);
    else if (key === 'mensal') subMonths(1);
    else if (key === 'trimestre') subMonths(3);
    else if (key === 'semestre') subMonths(6);
    else if (key === 'anual') subMonths(12);
    return { inicio: toSqlTs(start), fim: toSqlTs(end) };
  };

  const getFilters = () => {
    const status = document.getElementById('filter-status')?.value || '';
    const condutor = document.getElementById('filter-condutor')?.value || '';
    const placa = document.getElementById('filter-placa')?.value || '';
    const placaVinculada = document.getElementById('filter-placa-vinculada')?.value || '';
    const prefixo = document.getElementById('filter-prefixo')?.value || '';
    return { status, condutor, placa, placaVinculada, prefixo };
  };

  const aplica = (v, f) => {
    if (f.status && String(v.status).toUpperCase() !== String(f.status).toUpperCase()) return false;
    if (f.condutor && !norm(v.condutorAtual).includes(norm(f.condutor))) return false;
    if (f.placa && !norm(v.placa).includes(norm(f.placa))) return false;
    if (f.placaVinculada && !norm(v.placaVinculada).includes(norm(f.placaVinculada))) return false;
    if (f.prefixo && !norm(v.prefixo).includes(norm(f.prefixo))) return false;
    return true;
  };

  const atualizarResumo = (data) => {
    const total = data.length;
    const base = data.filter(v => String(v.status).toUpperCase() === 'BASE').length;
    const ativa = data.filter(v => String(v.status).toUpperCase() === 'ATIVA').length;
    const oficina = data.filter(v => String(v.status).toUpperCase() === 'OFICINA').length;
    const baixada = data.filter(v => String(v.status).toUpperCase() === 'BAIXADA').length;
    if (elTotal) elTotal.textContent = total;
    if (elBase) elBase.textContent = base;
    if (elAtiva) elAtiva.textContent = ativa;
    if (elOficina) elOficina.textContent = oficina;
    if (elBaixada) elBaixada.textContent = baixada;
  };

  const renderTabela = (data) => {
    if (!tableContainer) return;
    // Exibe o container quando o relatório for gerado
    tableContainer.style.display = 'block';
    if (!data.length) {
      tableContainer.innerHTML = '<p style="font-size:14px;color:#6c757d;">Nenhum veículo encontrado com os filtros selecionados.</p>';
      return;
    }
    const linhas = data.map(v => `
        <tr>
          <td>${v.prefixo || '-'}</td>
          <td>${v.placa || '-'}</td>
          <td>${v.placaVinculada || '-'}</td>
          <td>${v.marcaModelo || '-'}</td>
          <td>${v.anoFabricacao || '-'}</td>
          <td>${v.unidade || '-'}</td>
          <td>${v.condutorAtual || '-'}</td>
          <td>${String(v.status || '').toUpperCase()}</td>
          <td>${v.osCman || '-'}</td>
          <td>${v.osPrime || '-'}</td>
          <td>${v.kmAtual ?? '-'}</td>
          <td>${v.proximaRevisaoKm ?? '-'}</td>
          <td>${v.dataProximaRevisao ? String(v.dataProximaRevisao).slice(0,10) : '-'}</td>
        </tr>
      `).join('');

    tableContainer.innerHTML = `
        <table class="user-table">
          <thead>
            <tr>
              <th>Prefixo</th>
              <th>Placa</th>
              <th>Placa Vinculada</th>
              <th>Marca/Modelo</th>
              <th>Ano</th>
              <th>Unidade</th>
              <th>Condutor</th>
              <th>Status</th>
              <th>OS CMAN</th>
              <th>OS PRIME</th>
              <th>Km Atual</th>
              <th>Próx. Revisão Km</th>
              <th>Data Próx. Revisão</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      `;
  };

  const carregarKmPeriodo = async (veiculos, periodKey) => {
    const { inicio, fim } = getPeriodRange(periodKey || 'mensal');
    const results = await Promise.all(
      (veiculos || []).map(async (v) => {
        const label = v.marcaModelo || v.prefixo || v.placa || `#${v.id}`;
        if (!v.id) return { label, km: 0 };
        try {
          const url = `/api/v1/veiculos/${v.id}/kms/medias?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Falha ao obter médias');
          const data = await res.json();
          return { label, km: Number(data?.deltaKm || 0) };
        } catch (err) {
          console.warn('KM período erro:', err);
          return { label, km: 0 };
        }
      })
    );
    return results;
  };

  const renderGrafico = async () => {
    if (!chartCanvas) return;
    const periodKey = periodSelect?.value || 'mensal';
    if (msgEl) { msgEl.textContent = 'Calculando gráfico...'; msgEl.style.color = '#495057'; }
    if (!lista.length) await carregar();
    const dados = await carregarKmPeriodo(lista, periodKey);
    const ordenados = dados.sort((a,b) => b.km - a.km);
    const labels = ordenados.map(d => d.label);
    const values = ordenados.map(d => d.km);
    if (kmChart) { kmChart.destroy(); kmChart = null; }
    if (!labels.length) {
      if (msgEl) { msgEl.textContent = 'Nenhum veículo para o gráfico no período selecionado.'; msgEl.style.color = '#6c757d'; }
      return;
    }
    chartCanvas.style.display = 'block';
    chartCanvas.style.height = `${Math.min(ordenados.length * 28, 600)}px`;
    kmChart = new Chart(chartCanvas.getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Km no período', data: values, backgroundColor: '#495ED4' }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Km' }, ticks: { precision: 0 } },
          y: { title: { display: true, text: 'Marca/Modelo' } }
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw} km` } } }
      }
    });
    if (msgEl) msgEl.textContent = '';
  };

  const gerar = async () => {
    if (msgEl) { msgEl.textContent = ''; msgEl.style.color = '#495057'; }
    if (!lista.length) await carregar();
    const f = getFilters();
    ultimoResultado = (lista || []).filter(v => aplica(v, f));
    atualizarResumo(ultimoResultado);
    renderTabela(ultimoResultado);
  };

  const gerarPDF = () => {
    try {
      const jspdf = window.jspdf;
      if (!jspdf || !jspdf.jsPDF) {
        window.alert('Biblioteca PDF não carregada. Verifique sua conexão.');
        return;
      }
      const { jsPDF } = jspdf;
      const doc = new jsPDF('l', 'pt', 'A4'); // paisagem, pontos, A4

      // Cabeçalho
      doc.setFontSize(14);
      doc.text('Relatório de Veículos', 40, 40);
      const hoje = new Date();
      const dataStr = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataStr}`, 40, 58);

      // Resumo
      const total = ultimoResultado.length;
      const base = ultimoResultado.filter(v => String(v.status).toUpperCase() === 'BASE').length;
      const ativa = ultimoResultado.filter(v => String(v.status).toUpperCase() === 'ATIVA').length;
      const oficina = ultimoResultado.filter(v => String(v.status).toUpperCase() === 'OFICINA').length;
      const baixada = ultimoResultado.filter(v => String(v.status).toUpperCase() === 'BAIXADA').length;
      doc.text(`Total: ${total} | Base: ${base} | Ativa: ${ativa} | Oficina: ${oficina} | Baixada: ${baixada}`, 40, 74);

      // Tabela
      const head = [[
        'Prefixo','Placa','Placa Vinculada','Marca/Modelo','Ano','Unidade','Condutor',
        'Status','OS CMAN','OS PRIME','Km Atual','Próx. Revisão Km','Data Próx. Revisão'
      ]];
      const body = ultimoResultado.map(v => [
        v.prefixo || '', v.placa || '', v.placaVinculada || '', v.marcaModelo || '',
        v.anoFabricacao || '', v.unidade || '', v.condutorAtual || '',
        String(v.status || '').toUpperCase(), v.osCman || '', v.osPrime || '',
        v.kmAtual ?? '', v.proximaRevisaoKm ?? '', v.dataProximaRevisao ? String(v.dataProximaRevisao).slice(0,10) : ''
      ]);

      doc.autoTable({
        head,
        body,
        startY: 88,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [73, 94, 196], textColor: 255 },
        theme: 'striped',
      });

      doc.save(`relatorio_veiculos_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error(e);
      window.alert('Falha ao gerar PDF.');
    }
  };

  if (filtersForm) {
    filtersForm.addEventListener('submit', (e) => {
      e.preventDefault();
      gerar();
    });
  }
  if (runBtn) {
    runBtn.addEventListener('click', (e) => {
      e.preventDefault();
      gerar();
    });
  }
  if (pdfBtn) {
    pdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      gerarPDF();
    });
  }

  if (periodSelect) {
    periodSelect.addEventListener('change', async () => {
      await renderGrafico();
    });
  }

  // Não gerar automaticamente: usuário deve clicar em "Gerar Relatório"
})();

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

  const searchInput = document.getElementById('veh-search');
  let termoBusca = '';
  const norm = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      termoBusca = searchInput.value || '';
      render();
    });
  }

  // Removido alerta em alterações de campo: exibir apenas no Salvar alterações

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

    const term = (termoBusca || '').trim();
    const t = norm(term);

    const base = veiculos.map((v, idx) => ({ v, idx }));
    const data = t
      ? base.filter(({ v }) => {
          const combined = [
            v.placa,
            v.placaVinculada,
            v.marcaModelo,
            v.anoFabricacao,
            v.unidade,
            v.condutorAtual,
            v.prefixo,
            v.status,
            v.osCman,
            v.osPrime,
            v.cartao,
          ]
            .map(norm)
            .join(' ');
          return combined.includes(t);
        })
      : base;

    if (t && data.length === 0) {
      listContainer.innerHTML = `<p style="font-size:14px;color:#6c757d;">Nenhum veículo encontrado para "${term}".</p>`;
      listSection.style.display = 'block';
      return;
    }

    const linhas = data
      .map(({ v, idx }) => {
        const sv = getStatusView(v.status);
        return `
      <tr>
        <td>${v.placaVinculada || '-'}</td>
        <td>${v.marcaModelo} (${v.anoFabricacao})</td>
        <td>${v.cor || '-'}</td>
        <td>${v.condutorAtual || '-'}</td>
        <td><span class="${sv.cls}">${sv.label}</span></td>
        <td class="user-actions">
          <button type="button" class="edit" data-index="${idx}">Editar</button>
          <button type="button" class="delete" data-index="${idx}">Excluir</button>
        </td>
      </tr>
    `;
      })
      .join('');

    listContainer.innerHTML = `
      <table class="user-table">
        <thead>
          <tr>
            <th>Placa Vinculada</th>
            <th>Veículo</th>
            <th>Cor</th>
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

        document.getElementById('veic-marca-modelo').value = v.marcaModelo || '';
        document.getElementById('veic-ano').value = v.anoFabricacao || '';
        document.getElementById('veic-prefixo').value = v.prefixo || '';
        document.getElementById('veic-placa').value = v.placa || '';
        document.getElementById('veic-placa-vinculada').value = v.placaVinculada || '';
        document.getElementById('veic-unidade').value = v.unidade || '';
        const corEl = document.getElementById('veic-cor');
        if (corEl) corEl.value = v.cor || '';
        document.getElementById('veic-km-atual').value = v.kmAtual ?? '';
        document.getElementById('veic-prox-rev-km').value = v.proximaRevisaoKm ?? '';
        document.getElementById('veic-data-prox-rev').value = v.dataProximaRevisao ? String(v.dataProximaRevisao).slice(0,10) : '';
        document.getElementById('veic-condutor').value = v.condutorAtual || '';
        const obsEl = document.getElementById('veic-observacoes');
        if (obsEl) obsEl.value = v.observacoes || '';
        const cartaoInput = document.getElementById('veic-cartao');
        if (cartaoInput) {
          if (v.cartao && typeof v.cartao === 'string') {
            const digits = v.cartao.replace(/\D/g, '').slice(0, 16);
            cartaoInput.value = (digits.match(/.{1,4}/g) || []).join('.').slice(0, 19);
          } else {
            cartaoInput.value = '';
          }
          if (typeof cartaoInput._updateCardOverlay === 'function') {
            cartaoInput._updateCardOverlay();
          }
        }
        document.getElementById('veic-os-cman').value = v.osCman || '';
        document.getElementById('veic-os-prime').value = v.osPrime || '';
        document.getElementById('veic-status').value = v.status || '';
        editId = v.id;
        if (fotosHandler) {
          // Repassa o editId atual para o handler de fotos.
          fotosHandler.setExistingFotos(v.fotos || [], editId);
        }
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
    const cor = (document.getElementById('veic-cor')?.value || '').trim();
    const kmAtual = Number(toDigits(document.getElementById('veic-km-atual').value));
    const proximaRevisaoKm = Number(toDigits(document.getElementById('veic-prox-rev-km').value));
    const dataProximaRevisao = document.getElementById('veic-data-prox-rev').value;
    const condutorAtual = document.getElementById('veic-condutor').value.trim();
    const observacoes = (document.getElementById('veic-observacoes')?.value || '').trim();
    const cartaoInput = document.getElementById('veic-cartao');
    const cartaoDigits = (cartaoInput?.value || '').replace(/\D/g, '');
    if (cartaoDigits.length !== 16) erros.push('Informe o Cartão com 16 dígitos.');
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
    fd.append('cor', cor);
    fd.append('kmAtual', String(kmAtual));
    fd.append('proximaRevisaoKm', String(proximaRevisaoKm));
    if (dataProximaRevisao) fd.append('dataProximaRevisao', dataProximaRevisao);
    fd.append('condutorAtual', condutorAtual);
    fd.append('observacoes', observacoes);
    fd.append('cartao', cartaoDigits);
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

      // Feedback: alerta somente ao salvar alterações; toast no cadastro
      if (isEdit) {
        window.alert('Alterações Realizadas com sucesso!');
      } else if (typeof showToast === 'function') {
        showToast('Veículo cadastrado com sucesso');
      }

      // Refletir mensagem abaixo do formulário
      if (msgEl) {
        msgEl.textContent = isEdit ? '' : 'Veículo cadastrado com sucesso';
        msgEl.style.color = isEdit ? '#495057' : '#2ecc71';
      }
      form.reset();
      if (fotosHandler) fotosHandler.limpar();
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
(function () {
  const input = document.getElementById('veic-cartao');
  const overlaySpan = document.querySelector('.card-input-wrapper .card-text');
  if (!input || !overlaySpan) return;

  const onlyDigits = (s) => (s || '').replace(/\D/g, '').slice(0, 16);
  const formatGroups = (s) => (s.match(/.{1,4}/g) || []).join('.');
  const PAD = '________________'; // 16 underscores

  const update = () => {
    const digits = onlyDigits(input.value);
    input.value = formatGroups(digits);
    const padded = (digits + PAD).slice(0, 16);
    const g1 = padded.slice(0, 4);
    const g2 = padded.slice(4, 8);
    const g3 = padded.slice(8, 12);
    const g4 = padded.slice(12, 16);
    overlaySpan.innerHTML = `${g1}.${g2}.${g3}.<span class="last4">${g4}</span>`;
  };

  input._updateCardOverlay = update;

  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    const allow = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allow.includes(e.key)) return;
    if (!/\d/.test(e.key)) e.preventDefault();
  });
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    const digits = onlyDigits(text);
    input.value = formatGroups(digits);
    update();
  });

  update();
})();

// ===== Métricas da Home (contagem de veículos) =====
(() => {
  const elTotal = document.getElementById('metric-total-veiculos');
  const elBaixados = document.getElementById('metric-veiculos-baixados');
  const elOficina = document.getElementById('metric-veiculos-oficina');
  const elBase = document.getElementById('metric-veiculos-base');
  const tableContainer = document.getElementById('home-vehicles-table');

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

      // Renderiza a tabela de veículos na Home, se existir container
      if (tableContainer) {
        if (!Array.isArray(lista) || !lista.length) {
          tableContainer.innerHTML = '<p style="font-size:14px;color:#6c757d;">Nenhum veículo cadastrado.</p>';
        } else {
          const formatCurrencyBR = (val) => {
            try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0)); } catch { return String(val ?? '-'); }
          };

          const linhas = lista
            .map((v) => {
              const status = String(v.status || '').toUpperCase();
              const statusLabel =
                status === 'BAIXADA' ? 'Baixada' : status === 'OFICINA' ? 'Oficina' : status === 'ATIVA' ? 'Ativa' : 'Base';
              const statusCls =
                status === 'BAIXADA' ? 'status-baixada' : status === 'OFICINA' ? 'status-oficina' : status === 'ATIVA' ? 'status-ativa' : 'status-base';
              const kmAtualNum = Number.isFinite(Number(v.kmAtual)) ? Number(v.kmAtual) : null;
              const kmRevNum = Number.isFinite(Number(v.proximaRevisaoKm)) ? Number(v.proximaRevisaoKm) : null;
              const showWarn = kmAtualNum !== null && kmRevNum !== null && (kmRevNum - kmAtualNum) <= 1000;
              const warnHtml = showWarn
                ? ' <span class="warn-icon" title="baixar vtr" aria-label="baixar vtr"><i class="fa-solid fa-triangle-exclamation"></i></span>'
                : '';
              const saldoHtml = (v.saldoAtual !== undefined && v.saldoAtual !== null) ? formatCurrencyBR(v.saldoAtual) : '-';
              return `
                <tr>
                  <td>${v.marcaModelo || '-'}</td>
                  <td>${v.cor || '-'}</td>
                  <td>${v.prefixo || '-'}</td>
                  <td>${v.placaVinculada || '-'}</td>
                  <td>${v.condutorAtual || '-'}</td>
                  <td><span class="${statusCls}">${statusLabel}</span></td>
                  <td>${(v.kmAtual ?? '-') }</td>
                  <td>${(v.proximaRevisaoKm ?? '-') }${warnHtml}</td>
                  <td>${saldoHtml}</td>
                </tr>
              `;
            })
            .join('');

          tableContainer.innerHTML = `
            <table class="user-table">
              <thead>
                <tr>
                  <th>Marca/Modelo</th>
                  <th>Cor</th>
                  <th>Prefixo</th>
                  <th>Placa Vinculada</th>
                  <th>Condutor</th>
                  <th>Status</th>
                  <th>Km atual</th>
                  <th>Km Revisão</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>${linhas}</tbody>
            </table>
          `;
        }
      }
    } catch (e) {
      setAll('-', '-', '-', '-');
      if (tableContainer) {
        tableContainer.innerHTML = '<p style="font-size:14px;color:#e74c3c;">Falha ao carregar dados de veículos.</p>';
      }
    }
  })();
})();

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

// ===== Lançar KM =====
(() => {
  const form = document.getElementById('km-form');
  if (!form) return; // só na página lancar-km

  const inputRef = document.getElementById('km-ref');
  const inputKm = document.getElementById('km-valor');
  const msgEl = document.getElementById('km-form-message');
  const matchInfo = document.getElementById('km-match-info');
  const suggBox = document.getElementById('km-suggestions');
  const historySection = document.getElementById('km-history-section');
  const historyBox = document.getElementById('km-history');

  let veiculos = [];

  const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const toDigits = (v = '') => String(v).replace(/\D/g, '');

  const carregarVeiculos = async () => {
    try {
      const res = await fetch('/api/v1/veiculos');
      if (!res.ok) throw new Error('Falha ao carregar veículos');
      veiculos = await res.json();
    } catch (e) {
      console.error(e);
      veiculos = [];
    }
  };

  const encontrarVeiculo = (refRaw) => {
    const n = norm(refRaw);
    if (!n) return null;
    return (veiculos || []).find(v =>
      norm(v.placa) === n ||
      norm(v.placaVinculada) === n ||
      norm(v.prefixo) === n
    ) || null;
  };

  const renderMatch = (v) => {
    if (!matchInfo) return;
    if (!v) {
      matchInfo.style.display = 'none';
      matchInfo.innerHTML = '';
      return;
    }
    matchInfo.style.display = 'block';
    matchInfo.innerHTML = `
      <div class="form-row">
        <div class="form-field">
          <label>Veículo</label>
          <div>${v.marcaModelo || '-'} (${v.anoFabricacao || '-'})</div>
        </div>
        <div class="form-field">
          <label>Prefixo</label>
          <div>${v.prefixo || '-'}</div>
        </div>
        <div class="form-field">
          <label>Placa</label>
          <div>${v.placa || '-'}</div>
        </div>
        <div class="form-field">
          <label>Placa Vinculada</label>
          <div>${v.placaVinculada || '-'}</div>
        </div>
        <div class="form-field">
          <label>Km atual</label>
          <div>${v.kmAtual ?? '-'}</div>
        </div>
      </div>
    `;
  };

  // Pré-carregar lista
  carregarVeiculos();

  // ===== Autocomplete =====
  const buildSuggestions = (termRaw) => {
    if (!suggBox) return;
    const term = norm(termRaw || '');
    if (!term) {
      suggBox.style.display = 'none';
      suggBox.innerHTML = '';
      return;
    }
    const items = [];
    for (const v of veiculos || []) {
      const keys = [v.placa, v.placaVinculada, v.prefixo].filter(Boolean);
      for (const key of keys) {
        const k = String(key);
        if (norm(k).includes(term)) {
          items.push({ key: k, label: `${k} — ${v.marcaModelo || ''} ${v.prefixo ? '(' + v.prefixo + ')' : ''}`.trim(), v });
          break;
        }
      }
      if (items.length >= 12) break;
    }
    if (!items.length) {
      suggBox.style.display = 'none';
      suggBox.innerHTML = '';
      return;
    }
    suggBox.innerHTML = items
      .map((it, idx) => `
        <div class="km-sugg-item" data-key="${it.key.replace(/"/g,'&quot;')}
          " style="padding:8px 10px; cursor:pointer; border-top:1px solid #eee;">
          ${it.label}
        </div>
      `)
      .join('');
    suggBox.style.display = 'block';

    suggBox.querySelectorAll('.km-sugg-item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        // mousedown para não perder o foco antes do click
        const key = el.getAttribute('data-key');
        if (inputRef && key) {
          inputRef.value = key;
          suggBox.style.display = 'none';
          const v = encontrarVeiculo(key);
          renderMatch(v);
          if (v?.id) renderHistorico(v.id);
        }
        e.preventDefault();
      });
    });
  };

  if (inputRef) {
    inputRef.addEventListener('input', () => buildSuggestions(inputRef.value));
    inputRef.addEventListener('focus', () => buildSuggestions(inputRef.value));
    inputRef.addEventListener('blur', () => {
      // pequeno atraso para permitir clique no item
      setTimeout(() => {
        if (suggBox) { suggBox.style.display = 'none'; }
      }, 120);
    });
  }

  // ===== Histórico (últimos 10) =====
  const formatDateTimeBR = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  };

  const renderHistorico = async (veiculoId) => {
    if (!historyBox || !historySection) return;
    try {
      const res = await fetch(`/api/v1/veiculos/${veiculoId}/kms`);
      if (!res.ok) throw new Error('Falha ao carregar histórico');
      const rows = await res.json();
      // Ordena desc por data/id e pega 10 últimos
      const ordenado = [...rows].sort((a,b) => {
        const da = new Date(a.dataLeitura).getTime();
        const db = new Date(b.dataLeitura).getTime();
        if (db !== da) return db - da;
        return (b.id||0) - (a.id||0);
      }).slice(0, 10);

      if (!ordenado.length) {
        historyBox.innerHTML = '<p style="font-size:14px;color:#6c757d;">Sem registros.</p>';
        historySection.style.display = 'block';
        return;
      }

      const linhas = ordenado.map(r => `
        <tr>
          <td>${formatDateTimeBR(r.dataLeitura)}</td>
          <td>${r.km}</td>
          <td>${(r.origem || '').toString().toUpperCase()}</td>
        </tr>
      `).join('');

      historyBox.innerHTML = `
        <table class="user-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>KM</th>
              <th>Origem</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      `;
      historySection.style.display = 'block';
    } catch (e) {
      console.error(e);
      historyBox.innerHTML = '<p style="font-size:14px;color:#e74c3c;">Erro ao carregar histórico.</p>';
      historySection.style.display = 'block';
    }
  };

  // Ao sair do campo de referência, tenta mostrar o veículo
  if (inputRef) {
    inputRef.addEventListener('blur', () => {
      const v = encontrarVeiculo(inputRef.value);
      renderMatch(v);
      if (v?.id) renderHistorico(v.id);
      if (!v && msgEl) {
        msgEl.textContent = 'Veículo não encontrado.';
        msgEl.style.color = '#e74c3c';
      } else if (msgEl) {
        msgEl.textContent = '';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msgEl) { msgEl.textContent = ''; msgEl.style.color = '#495057'; }

    const ref = (inputRef?.value || '').trim();
    const km = Number(toDigits(inputKm?.value || ''));

    const erros = [];
    if (!ref) erros.push('Informe a referência do veículo.');
    if (!(km >= 0)) erros.push('Informe um KM válido (somente números).');
    if (erros.length) {
      if (msgEl) { msgEl.textContent = erros[0]; msgEl.style.color = '#e74c3c'; }
      return;
    }

    try {
      if (!veiculos.length) await carregarVeiculos();
      const v = encontrarVeiculo(ref);
      renderMatch(v);
      if (!v?.id) {
        if (msgEl) { msgEl.textContent = 'Veículo não encontrado.'; msgEl.style.color = '#e74c3c'; }
        return;
      }

      const res = await fetch(`/api/v1/veiculos/${v.id}/kms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ km }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (msgEl) { msgEl.textContent = data?.message || 'Erro ao registrar KM.'; msgEl.style.color = '#e74c3c'; }
        return;
      }

      window.alert('Km registrado com sucesso!');
      if (inputKm) inputKm.value = '';
      if (msgEl) { msgEl.textContent = ''; }

      await carregarVeiculos();
      const v2 = encontrarVeiculo(ref);
      renderMatch(v2);
      if (v2?.id) renderHistorico(v2.id);
    } catch (err) {
      console.error(err);
      if (msgEl) { msgEl.textContent = 'Falha ao comunicar com o servidor.'; msgEl.style.color = '#e74c3c'; }
    }
  });
})();

// ===== Lançar Saldo =====
(() => {
  const form = document.getElementById('saldo-form');
  if (!form) return; // só na página lancar-saldo

  const inputRef = document.getElementById('saldo-ref');
  const suggBox = document.getElementById('saldo-suggestions');
  const inputSaldo = document.getElementById('saldo-valor');
  const msgEl = document.getElementById('saldo-form-message');
  const matchInfo = document.getElementById('saldo-match-info');
  const historySection = document.getElementById('saldo-history-section');
  const historyBox = document.getElementById('saldo-history');

  let veiculos = [];

  const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  const carregarVeiculos = async () => {
    try {
      const res = await fetch('/api/v1/veiculos');
      if (!res.ok) throw new Error('Falha ao carregar veículos');
      veiculos = await res.json();
    } catch (e) {
      console.error(e);
      veiculos = [];
    }
  };

  const encontrarVeiculo = (refRaw) => {
    const n = norm(refRaw);
    if (!n) return null;
    return (veiculos || []).find(v =>
      norm(v.placa) === n ||
      norm(v.placaVinculada) === n ||
      norm(v.prefixo) === n
    ) || null;
  };

  const renderMatch = (v) => {
    if (!matchInfo) return;
    if (!v) {
      matchInfo.style.display = 'none';
      matchInfo.innerHTML = '';
      return;
    }
    matchInfo.style.display = 'block';
    matchInfo.innerHTML = `
      <div class="form-row">
        <div class="form-field">
          <label>Veículo</label>
          <div>${v.marcaModelo || '-'} (${v.anoFabricacao || '-'})</div>
        </div>
        <div class="form-field">
          <label>Prefixo</label>
          <div>${v.prefixo || '-'}</div>
        </div>
        <div class="form-field">
          <label>Placa</label>
          <div>${v.placa || '-'}${v.placaVinculada ? ' / ' + v.placaVinculada : ''}</div>
        </div>
        <div class="form-field">
          <label>Km atual</label>
          <div>${v.kmAtual ?? '-'}</div>
        </div>
        <div class="form-field">
          <label>Saldo atual</label>
          <div id="saldo-atual">-</div>
        </div>
      </div>
    `;
  };

  const buildSuggestions = (termRaw) => {
    if (!suggBox) return;
    const term = norm(termRaw || '');
    if (!term) {
      suggBox.style.display = 'none';
      suggBox.innerHTML = '';
      return;
    }
    const items = [];
    for (const v of veiculos || []) {
      const keys = [v.placa, v.placaVinculada, v.prefixo].filter(Boolean);
      for (const key of keys) {
        const k = String(key);
        if (norm(k).includes(term)) {
          items.push({ key: k, label: `${k} — ${v.marcaModelo || ''} ${v.prefixo ? '(' + v.prefixo + ')' : ''}`.trim(), v });
          break;
        }
      }
      if (items.length >= 12) break;
    }
    if (!items.length) {
      suggBox.style.display = 'none';
      suggBox.innerHTML = '';
      return;
    }
    suggBox.innerHTML = items
      .map((it) => `
        <div class="saldo-sugg-item" data-key="${it.key.replace(/"/g,'&quot;')}" style="padding:8px 10px; cursor:pointer; border-top:1px solid #eee;">
          ${it.label}
        </div>
      `)
      .join('');
    suggBox.style.display = 'block';

    suggBox.querySelectorAll('.saldo-sugg-item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        const key = el.getAttribute('data-key');
        if (inputRef && key) {
          inputRef.value = key;
          suggBox.style.display = 'none';
          const v = encontrarVeiculo(key);
          renderMatch(v);
        }
        e.preventDefault();
      });
    });
  };

  carregarVeiculos();

  if (inputRef) {
    inputRef.addEventListener('input', () => buildSuggestions(inputRef.value));
    inputRef.addEventListener('focus', () => buildSuggestions(inputRef.value));
    inputRef.addEventListener('blur', () => {
      setTimeout(() => {
        if (suggBox) suggBox.style.display = 'none';
        const v = encontrarVeiculo(inputRef.value);
        renderMatch(v);
        if (!v && msgEl) { msgEl.textContent = 'Veículo não encontrado.'; msgEl.style.color = '#e74c3c'; }
        else if (msgEl) { msgEl.textContent = ''; }
      }, 120);
    });
  }

  const parseSaldo = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return NaN;
    // Converte formato brasileiro: 1.234,56 -> 1234.56
    const norm = s.replace(/\./g, '').replace(',', '.');
    const val = Number(norm);
    return val;
  };

  const formatCurrencyBR = (val) => {
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0)); } catch { return String(val || 0); }
  };

  const formatDateTimeBR = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  };

  const renderHistorico = async (veiculoId) => {
    if (!historySection || !historyBox) return;
    try {
      const res = await fetch(`/api/v1/veiculos/${veiculoId}/saldos`);
      if (!res.ok) throw new Error('Falha ao carregar histórico');
      const rows = await res.json();
      const ordenado = [...rows]
        .sort((a,b) => {
          const cmp = String(b.dataLeitura || '').localeCompare(String(a.dataLeitura || ''));
          if (cmp !== 0) return cmp;
          return (b.id||0) - (a.id||0);
        })
        .slice(0,10);
      if (!ordenado.length) {
        historyBox.innerHTML = '<p style="font-size:14px;color:#6c757d;">Sem registros.</p>';
        historySection.style.display = 'block';
        const elSaldo = document.getElementById('saldo-atual');
        if (elSaldo) elSaldo.textContent = '-';
        return;
      }
      const linhas = ordenado.map(r => `
        <tr>
          <td>${formatDateTimeBR(r.dataLeitura)}</td>
          <td>${formatCurrencyBR(r.valor)}</td>
          <td>${(r.origem || '').toString().toUpperCase()}</td>
        </tr>
      `).join('');
      historyBox.innerHTML = `
        <table class="user-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Saldo</th>
              <th>Origem</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      `;
      historySection.style.display = 'block';
      const elSaldo = document.getElementById('saldo-atual');
      const saldoAtual = ordenado[0]?.valor;
      if (elSaldo) elSaldo.textContent = saldoAtual !== undefined ? formatCurrencyBR(saldoAtual) : '-';
    } catch (e) {
      console.error(e);
      historyBox.innerHTML = '<p style="font-size:14px;color:#e74c3c;">Erro ao carregar histórico.</p>';
      historySection.style.display = 'block';
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msgEl) { msgEl.textContent = ''; msgEl.style.color = '#495057'; }

    const ref = (inputRef?.value || '').trim();
    const saldoVal = parseSaldo(inputSaldo?.value || '');

    const erros = [];
    if (!ref) erros.push('Informe a referência do veículo.');
    if (!(saldoVal >= 0)) erros.push('Informe um saldo válido (ex.: 150,00).');
    if (erros.length) {
      if (msgEl) { msgEl.textContent = erros[0]; msgEl.style.color = '#e74c3c'; }
      return;
    }

    if (!veiculos.length) await carregarVeiculos();
    const v = encontrarVeiculo(ref);
    renderMatch(v);
    if (!v?.id) {
      if (msgEl) { msgEl.textContent = 'Veículo não encontrado.'; msgEl.style.color = '#e74c3c'; }
      return;
    }

    try {
      // Integração com backend: registrar saldo
      const res = await fetch(`/api/v1/veiculos/${v.id}/saldos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: saldoVal }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (msgEl) { msgEl.textContent = data?.message || 'Erro ao registrar saldo.'; msgEl.style.color = '#e74c3c'; }
        return;
      }
      window.alert('Saldo lançado com sucesso');
      if (inputSaldo) inputSaldo.value = '';
      renderHistorico(v.id);
    } catch (err) {
      console.error(err);
      if (msgEl) { msgEl.textContent = 'Falha ao comunicar com o servidor.'; msgEl.style.color = '#e74c3c'; }
    }
  });
})();
