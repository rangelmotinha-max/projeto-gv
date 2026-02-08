// Controller do endpoint de saúde
const healthService = require('../services/healthService');

const getHealth = async (req, res, next) => {
  try {
    const data = healthService.getHealthStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHealth,
};
