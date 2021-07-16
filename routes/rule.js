const router = require('express').Router();

const asyncMiddleware = require('../middlewares/wrapAsync');
const ruleController = require('../controllers/rule');

router.get('/rules/_count', asyncMiddleware(ruleController.getCount));

router.get('/rules/_search', asyncMiddleware(ruleController.searchRules));

module.exports = router;
