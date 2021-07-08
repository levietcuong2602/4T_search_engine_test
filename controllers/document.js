const documentService = require('../services/document');

const bulkIndex = async (req, res) => {
  const result = await documentService.bulkIndex();
  return res.send({ status: 1, result });
};

const getCount = async (req, res) => {
  const result = await documentService.getCount();
  return res.send({ status: 1, result });
};

const searchDocument = async (req, res) => {
  const result = await documentService.searchDocument(req.query);
  return res.send({ status: 1, result });
};

module.exports = {
  bulkIndex,
  getCount,
  searchDocument,
};
