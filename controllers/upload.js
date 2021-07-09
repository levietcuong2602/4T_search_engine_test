const uploadService = require('../services/upload');

const readFileDoc = async (req, res) => {
  const result = await uploadService.readFileDoc();
  return res.send({ status: 1, result });
};

module.exports = { readFileDoc };
