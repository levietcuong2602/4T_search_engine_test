const { searchDocument, EsClient: Client } = require('../utils/elasticsearch');
const { logger } = require('../utils/logger');

const getProduct = async ({ limit = 10, offsets = 0, inputText }) => {
  const query = {
    query: {
      multi_match: {
        query: inputText,
        fields: ['name', 'title', 'description'],
      },
    },
  };

  const result = await searchDocument({
    from: offsets || 0,
    size: limit || 100,
    index: 'products',
    body: query,
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

const getMapping = async () => {
  const result = await Client.indices.getMapping({
    index: 'products',
  });

  return result;
};

module.exports = { getProduct, getMapping };
