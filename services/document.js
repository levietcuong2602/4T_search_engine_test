const elasticsearch = require('../utils/elasticsearch');
const { logger } = require('../utils/logger');

const { ROLE } = require('../constants/index');
const ruleService = require('./rule');

const jsonData = require('../test/json/mic_vbpl.json');

const bulkIndex = async () => {
  const bulk = [];
  const check = {};
  for (const item of jsonData) {
    if (!check[item.id]) {
      bulk.push(
        { index: { _index: 'documents', _type: 'documents', _id: item.id } },
        { ...item },
      );

      check[item.id] = true;
    }
  }

  const result = await elasticsearch.Client.bulk({
    index: 'documents',
    type: 'documents',
    body: bulk,
  });

  return result;
};

const getCount = async () => {
  const result = await elasticsearch.Client.count({
    index: 'documents',
    type: 'documents',
  });
  const {
    body: { count },
  } = result;
  return { count };
};

const searchDocument = async ({ limit = 3, offsets = 0, inputText }) => {
  const result = await elasticsearch.searchDocument({
    from: offsets || 0,
    size: limit || 100,
    index: 'documents',
    body: {
      query: {
        bool: {
          must: {
            multi_match: {
              fields: ['summary', 'fields', 'agency_issued'],
              query: inputText,
            },
          },
        },
      },
    },
  });

  const {
    body: { hits },
  } = result;

  let isMatch = true;
  const total = hits.total.value;
  const results = hits.hits.map((hit, index, array) => {
    if (index > 0 && isMatch)
      isMatch = array[index - 1]._score - hit._score <= 2;

    return {
      id: hit._id,
      _score: hit._score,
      ...hit._source,
      isMatch,
    };
  });

  const data = results.filter(element => {
    return element.isMatch;
  });

  return {
    total,
    data,
  };
};

const findDocumentById = async documentId => {
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
    },
  });
  const {
    body: {
      hits: { hits },
    },
  } = docs;
  const [document] = hits;
  if (document) {
    return document._source;
  }
  return null;
};

const searchAllDocument = async ({ inputText, role }) => {
  const { total: totalRule, data: rules } = await ruleService.searchRules({
    inputText,
  });
  const { total: totalDoc, data: documents } = await searchDocument({
    inputText,
  });

  if (role === ROLE.RULES || totalRule === 0) {
    return rules;
  }
  if (role === ROLE.DOCUMENTS || totalDoc === 0) {
    return documents;
  }

  const ruleScoreAvg =
    rules.reduce(
      (accumulator, currentValue) => accumulator + currentValue._score,
      0,
    ) / rules.length;

  const documentScoreAvg =
    documents.reduce(
      (accumulator, currentValue) => accumulator + currentValue._score,
      0,
    ) / documents.length;

  return ruleScoreAvg > documentScoreAvg
    ? { data: rules, role: ROLE.RULES }
    : { data: documents, role: ROLE.DOCUMENTS };
};

module.exports = {
  bulkIndex,
  getCount,
  searchDocument,
  findDocumentById,
  searchAllDocument,
};
