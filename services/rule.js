const elasticsearch = require('../utils/elasticsearch');

const bulkIndex = async ({ data }) => {
  try {
    const bulk = [];
    const check = {};
    for (const item of data) {
      if (!check[item.id]) {
        bulk.push(
          {
            index: {
              _index: 'rules',
              _type: 'rules',
              _id: `${item.id}`,
            },
          },
          { ...item },
        );

        check[item.id] = true;
      }
    }

    const result = await elasticsearch.Client.bulk({
      index: 'rules',
      type: 'rules',
      body: bulk,
    });

    return result;
  } catch (error) {
    console.log(error.message);
  }

  return false;
};

const getCount = async () => {
  const result = await elasticsearch.Client.count({
    index: 'rules',
    type: 'rules',
  });
  const {
    body: { count },
  } = result;
  return { count };
};

const searchRules = async ({ limit = 3, offsets = 0, inputText }) => {
  const result = await elasticsearch.searchDocument({
    from: offsets || 0,
    size: limit || 100,
    index: 'rules',
    body: {
      query: {
        bool: {
          must: {
            multi_match: {
              fields: ['documentName', 'title', 'detail'],
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

module.exports = { bulkIndex, getCount, searchRules };
