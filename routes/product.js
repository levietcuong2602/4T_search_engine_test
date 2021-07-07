const router = require('express').Router();

const asyncMiddleware = require('../middlewares/wrapAsync');
const productController = require('../controllers/product');

router.get('/products', asyncMiddleware(productController.getProduct));

module.exports = router;
