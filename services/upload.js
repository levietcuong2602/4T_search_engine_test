const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

const { logger } = require('../utils/logger');

const readFileDoc = async () => {
  let filePath = path.join(__dirname, '../test/doc/test.doc');

  mammoth
    .extractRawText({ path: filePath })
    .then(function(result) {
      var text = result.value; // The raw text
      var messages = result.messages;
      console.log({ text, messages });
    })
    .done();
};

module.exports = { readFileDoc };
