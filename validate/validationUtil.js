const { validate } = require('express-validation');

const validateOptionsDefault = {
  context: true,
  keyByField: true,
};

const customValidate = (schema, options, joiOptions) => {
  return validate(
    schema,
    { ...validateOptionsDefault, ...options },
    joiOptions,
  );
};

module.exports = {
  customValidate,
};
