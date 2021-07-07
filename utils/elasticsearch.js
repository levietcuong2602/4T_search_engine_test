const { Client } = require('@elastic/elasticsearch');
const { logger } = require('./logger');
require('dotenv').config();

const elasticUrl = process.env.ELASTIC_URL || 'http://localhost:9200';
const EsClient = new Client({ node: elasticUrl });
const index = 'products';
const type = 'products';
/**
 * @function createIndex
 * @returns {void}
 * @description Creates an index in ElasticSearch.
 */
async function createIndex(index) {
  try {
    await EsClient.indices.create({ index });
    logger.info(`Created index ${index}`);
  } catch (err) {
    logger.info(`An error occurred while creating the index ${index}:`);
    logger.info(err);
  }
}
/**
 * @function setProductsMapping,
 * @returns {void}
 * @description Sets the products mapping to the database.
 */
async function setProductsMapping() {
  try {
    const schema = {
      description: {
        type: 'text',
      },
      name: {
        type: 'text',
      },
      price: {
        type: 'float',
      },
      in_stock: {
        type: 'integer',
      },
      sold: {
        type: 'float',
      },
      is_active: {
        type: 'bool',
      },
    };

    await EsClient.indices.putMapping({
      index,
      type,
      include_type_name: true,
      body: {
        properties: schema,
      },
    });

    logger.info('Products mapping created successfully');
  } catch (err) {
    logger.info('An error occurred while setting the products mapping:');
    logger.info(err);
  }
}
/**
 * @function checkConnection
 * @returns {Promise<Boolean>}
 * @description Checks if the client is connected to ElasticSearch
 */
function checkConnection() {
  return new Promise(async resolve => {
    logger.info('Checking connection to ElasticSearch...');
    let isConnected = false;
    while (!isConnected) {
      try {
        await EsClient.cluster.health({});
        logger.info('Successfully connected to ElasticSearch');
        isConnected = true;
        // eslint-disable-next-line no-empty
      } catch (_) {}
    }
    resolve(true);
  });
}

async function connect() {
  const isElasticReady = await checkConnection();

  if (isElasticReady) {
    const elasticIndex = await EsClient.indices.exists({
      index,
    });

    if (!elasticIndex.body) {
      await createIndex(index);
      await setProductsMapping();
      // await data.populateDatabase();
    }
  }
}

module.exports = {
  EsClient,
  setProductsMapping,
  checkConnection,
  createIndex,
  index,
  type,
  connect,
};
