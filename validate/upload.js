const { join } = require('bluebird');
const { Joi } = require('express-validation');

const { customValidate } = require('./validationUtil');

const uploadFile = {
  body: Joi.object({
    documentId: Joi.string().required(),
    documentName: Joi.string().required(),
  }),
};

module.exports = {
  uploadFileValidate: customValidate(uploadFile, {}, { allowUnknown: true }),
};
