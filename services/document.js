const elasticsearch = require('../utils/elasticsearch');
const { logger } = require('../utils/logger');

const data = require('../data/mic_vbpl.json');

const bulkIndex = async () => {
  const bulk = [];
  for (const item of data) {
    bulk.push(
      { index: { _index: 'documents', _type: 'documents' } },
      { ...item },
    );
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
  const data = hits.hits.map(hit => {
    return {
      id: hit._id,
      _score: hit._score,
      ...hit._source,
    };
  });

  return {
    total,
    data,
  };
};

module.exports = { bulkIndex, getCount, searchDocument };
