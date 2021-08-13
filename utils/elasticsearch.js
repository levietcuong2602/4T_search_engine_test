const elasticsearch = require('@elastic/elasticsearch');
const { logger } = require('./logger');
require('dotenv').config();

const { ELASTICSEARCH_URL } = process.env;

const getClient = () => {
  const client = new elasticsearch.Client({
    node: ELASTICSEARCH_URL || 'http://localhost:9201',
  });
  return client;
};
/**
 * @function searchDocument
 * @param {*} query
 * @returns data document
 */
const searchDocument = query => {
  return getClient().search(query);
};

const getMapping = option => {
  return getClient().indices.getMapping(option);
};
/**
 * @function connection
 * @returns {Promise<Boolean>}
 * @description Checks if the client is connected to ElasticSearch
 */
const connection = () => {
  return new Promise(async resolve => {
    logger.info('Checking connection to ElasticSearch...');
    try {
      await getClient().cluster.health({});
      logger.info('Successfully connected to ElasticSearch');
    } catch (_) {
      logger.error(`Connect to ElasticSearch failure because ${_.message}`);
    }
    resolve(true);
  });
};

module.exports = {
  searchDocument,
  connection,
  getMapping,
  getClient,
};
