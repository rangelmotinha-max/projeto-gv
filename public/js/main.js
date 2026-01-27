// Script principal do frontend
const botaoTestar = document.getElementById('btn-testar');
const resultado = document.getElementById('resultado');

const renderResultado = (mensagem, classe) => {
  resultado.textContent = mensagem;
  resultado.className = `resultado ${classe}`;
};

botaoTestar.addEventListener('click', async () => {
  renderResultado('Consultando API...', '');

  try {
    const response = await fetch('/api/v1/health');

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    renderResultado(`Status: ${data.status} | Timestamp: ${data.timestamp}`, 'sucesso');
  } catch (err) {
    renderResultado(`Falha ao acessar a API: ${err.message}`, 'erro');
  }
});
