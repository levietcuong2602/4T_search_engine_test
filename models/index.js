/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
module.exports = client => {
  require('fs')
    .readdirSync('./models')
    .forEach(async fileName => {
      if (fileName === 'index.js') return;
      if (['js'].indexOf(fileName.split('.').pop()) === -1) return;

      const index = fileName.split('.').shift();
      try {
        const elasticIndex = await client.indices.exists({
          index,
        });
        if (!elasticIndex.body) {
          console.log(`Created index ${index}`);
          await client.indices.create({
            index,
            include_type_name: true,
            type: index,
          });
        }
        await client.indices.putMapping({
          index,
          type: index,
          body: require(`./${fileName}`),
          include_type_name: true,
        });
      } catch (err) {
        console.log(err);
      }
    });
};
