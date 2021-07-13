const elasticsearch = require('../utils/elasticsearch');
const { logger } = require('../utils/logger');

const data = require('../test/json/mic_vbpl.json');

const bulkIndex = async () => {
  const bulk = [];
  const check = {};
  for (const item of data) {
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

  const total = hits.total.value;
  const results = hits.hits.map(hit => {
    return {
      id: hit._id,
      _score: hit._score,
      ...hit._source,
    };
  });

  return {
    total,
    data: results,
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

module.exports = { bulkIndex, getCount, searchDocument, findDocumentById };
