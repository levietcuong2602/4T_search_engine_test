const router = require('express').Router();

const asyncMiddleware = require('../middlewares/wrapAsync');
const documentController = require('../controllers/document');

router.post('/documents/_bulk', asyncMiddleware(documentController.bulkIndex));

router.get('/documents/_count', asyncMiddleware(documentController.getCount));

router.get(
  '/documents/_search',
  asyncMiddleware(documentController.searchDocument),
);

module.exports = router;
