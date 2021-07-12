const path = require('path');
const fs = require('fs');
const reader = require('any-text');

const { logger } = require('../utils/logger');
const elasticsearch = require('../utils/elasticsearch');

const readFileDoc = async () => {
  try {
    const filePath = path.join(__dirname, '../test/doc/test.doc');
  } catch (error) {
    console.log(error.message);
  }
};

const importRuleData = async ({
  text,
  document_id: documentId,
  document_name: documentName,
}) => {
  let download = [];
  if (documentId) {
    const docs = await elasticsearch.searchDocument({
      from: 0,
      size: 1,
      index: 'documents',
      body: {
        query: {
          term: {
            _id: documentId,
          },
        },
        _source: ['id', 'download'],
      },
    });
    const {
      body: {
        hits: { hits },
      },
    } = docs;
    const [document] = hits;
    if (document) {
      ({ download } = document._source);
    }
  }

  const rules = text
    .split('<break_tag>')
    .filter(rule => /^(Điều|điều|\nĐiều|\nđiều)\s[0-9]+/gi.test(rule.trim()))
    .map(rule => {
      rule = rule.trim();
      const endRuleIndex = rule.indexOf('\n');

      return {
        name: rule.substring(0, endRuleIndex).trim(),
        detail: rule.substring(endRuleIndex).trim(),
        documentId,
        documentName,
        download,
      };
    });

  const bulk = [];
  for (const [index, rule] of rules.entries()) {
    bulk.push(
      {
        index: {
          _index: 'rules',
          _type: 'rules',
          _id: `${rule.documentId}_${index + 1}`,
        },
      },
      { ...rule },
    );
  }

  const result = await elasticsearch.Client.bulk({
    index: 'rules',
    type: 'rules',
    body: bulk,
  });

  return result;
};

const splitText = text => {
  const rules = text
    .split('<break_tag>')
    .filter(rule => /^(Điều|điều|\nĐiều|\nđiều)\s[0-9]+/gi.test(rule.trim()))
    .map(rule => {
      rule = rule.trim();
      const endRuleIndex = rule.indexOf('\n');

      return {
        name: rule.substring(0, endRuleIndex).trim(),
        detail: rule.substring(endRuleIndex).trim(),
      };
    });
};

const loadRuleData = async () => {
  const files = await fs.readdirSync('../test/data/');
  const { length } = files;
  const idx = 0;
  fs.readdirSync('../test/data/').forEach(async fileName => {
    if (fileName === 'index.js') return;
    if (['js'].indexOf(fileName.split('.').pop()) === -1) return;
    const text = await reader.getText(
      path.join(__dirname, `../test/doc/${fileName}`),
    );
    const result = splitText(text);

    console.log(result);
  });
};

module.exports = { readFileDoc, importRuleData, loadRuleData };
