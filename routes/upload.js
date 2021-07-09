const router = require('express').Router();

const asyncMiddleware = require('../middlewares/wrapAsync');
const uploadController = require('../controllers/upload');

router.get('/upload/test', asyncMiddleware(uploadController.readFileDoc));

module.exports = router;
