const productService = require('../services/product');

const getProduct = async (req, res) => {
  const result = await productService.getProduct(req.query);
  return res.send({ status: 1, result });
};

const getMapping = async (req, res) => {
  const result = await productService.getMapping(req.query);
  return res.send({ status: 1, result });
};

module.exports = { getProduct, getMapping };
