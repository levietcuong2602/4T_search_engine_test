const ruleService = require('../services/rule');

const getCount = async (req, res) => {
  const result = await ruleService.getCount();
  return res.send({ status: 1, result });
};

const searchRules = async (req, res) => {
  const result = await ruleService.searchRules({ ...req.query });
  return res.send({ status: 1, result });
};

module.exports = { getCount, searchRules };
