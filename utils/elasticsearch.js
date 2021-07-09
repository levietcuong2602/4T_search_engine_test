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
});
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
 * @function connection
 * @returns {Promise<Boolean>}
 * @description Checks if the client is connected to ElasticSearch
 */
const connection = () => {
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

module.exports = {
  searchDocument,
  connection,
  getMapping,
  Client: client,
};
