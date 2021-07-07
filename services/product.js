const { EsClient } = require('../utils/elasticsearch');
const { logger } = require('../utils/logger');

const getProduct = async ({ limit = 10, offsets = 0, inputText = '' }) => {
  const query = {
    query: {
      match: {
        name: inputText,
      },
    },
  };

  const {
    body: { hits },
  } = await EsClient.search({
    from: offsets || 0,
    size: limit || 100,
    index: 'products',
    sort: { price: { order: 'asc' } },
    body: query,
  });

  const total = hits.total.value;
  const data = hits.hits.map(hit => {
    return {
      id: hit._id,
      ...hit._source,
    };
  });

  return {
    total,
    data,
  };
};

module.exports = { getProduct };
