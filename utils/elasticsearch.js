const elasticsearch = require('@elastic/elasticsearch');
const { logger } = require('./logger');
require('dotenv').config();

const {
  ELASTICSEARCH_URL,
  ELASTICSEARCH_USERNAME,
  ELASTICSEARCH_PASSWORD,
} = process.env;

const client = new elasticsearch.Client({
  node: ELASTICSEARCH_URL || 'http://localhost:9200',
  // auth: {
  //   username: ELASTICSEARCH_USERNAME,
  //   password: ELASTICSEARCH_PASSWORD,
  // },
});

const indexDefault = 'products';
const typeDefault = 'products';
/**
 * @function createIndex
 * @returns {void}
 * @description Creates an index in ElasticSearch.
 */

const createIndex = async index => {
  try {
    await client.indices.create({ index });
    logger.info(`Created index ${index}`);
  } catch (err) {
    logger.error(`An error occurred while creating the index ${index}:`);
    logger.error(err);
  }
};
/**
 * @function searchDocument
 * @param {*} query
 * @returns data document
 */
const searchDocument = query => {
  return client.search(query);
};

/**
 * @function putMapping
 * @param {*} option
 */
const putMapping = option => {
  return client.indices.putMapping(option);
};

const getMapping = option => {
  return client.indices.getMapping(option);
};
/**
 * @function setProductsMapping,
 * @returns {void}
 * @description Sets the products mapping to the database.
 */
const setProductsMapping = async () => {
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
        type: 'boolean',
      },
    };

    await putMapping({
      index: indexDefault,
      type: typeDefault,
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
};
/**
 * @function checkConnection
 * @returns {Promise<Boolean>}
 * @description Checks if the client is connected to ElasticSearch
 */
const checkConnection = () => {
  return new Promise(async resolve => {
    logger.info('Checking connection to ElasticSearch...');
    let isConnected = false;
    while (!isConnected) {
      try {
        await client.cluster.health({});
        logger.info('Successfully connected to ElasticSearch');
        isConnected = true;
        // eslint-disable-next-line no-empty
      } catch (_) {}
    }
    resolve(true);
  });
};

const connect = async () => {
  const isElasticReady = await checkConnection();

  if (isElasticReady) {
    const elasticIndex = await client.indices.exists({
      index: indexDefault,
    });

    if (!elasticIndex.body) {
      await createIndex(indexDefault);
      await setProductsMapping();
    }
  }
};

module.exports = {
  createIndex,
  searchDocument,
  connect,
  getMapping,
  Client: client,
};
