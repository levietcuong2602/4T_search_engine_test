const router = require('express').Router();

const asyncMiddleware = require('../middlewares/wrapAsync');
const uploadController = require('../controllers/upload');

router.get('/upload/test', asyncMiddleware(uploadController.readFileDoc));

router.post(
  '/upload/file',
  // uploadFileValidate,
  asyncMiddleware(uploadController.uploadFile),
);

router.get(
  '/upload/auto-load',
  asyncMiddleware(uploadController.autoloadRuleData),
);

module.exports = router;
