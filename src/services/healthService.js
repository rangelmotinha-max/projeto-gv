// Regras de negócio para saúde da API
const getHealthStatus = () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getHealthStatus,
};
