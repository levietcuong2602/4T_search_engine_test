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

module.exports = { bulkIndex };
