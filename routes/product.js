const router = require('express').Router();

const asyncMiddleware = require('../middlewares/wrapAsync');
const productController = require('../controllers/product');

router.get('/products/_search', asyncMiddleware(productController.getProduct));

router.get('/products/_mapping', asyncMiddleware(productController.getMapping));

module.exports = router;
