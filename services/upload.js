/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const fs = require('fs');
const reader = require('any-text');

const { logger } = require('../utils/logger');
const elasticsearch = require('../utils/elasticsearch');

const documentService = require('./document');
const ruleService = require('./rule');

const readFileDoc = async () => {
  try {
    const files = await fs
      .readdirSync(path.join(__dirname, '../test/doc/'))
      .filter(fileName => ['doc', 'docx'].includes(fileName.split('.').pop()));

    const results = [];
    for (const fileName of files) {
      const regex = new RegExp(/(_|_m_)/);
      let name = fileName;
      if (fileName.test(regex)) {
        const { lastIndex } = regex;
        name = fileName.substring(0, lastIndex);
      }

      name = name
        .replace(/(\[|\])/gi, '')
        .replace(/[._]/gi, '/')
        .replace('ND', 'NĐ')
        .replace('CD', 'CĐ')
        .trim();

      results.push(name);
    }

    return results;
  } catch (error) {
    logger.error(error.message);
  }

  return [];
};

const importRuleData = async ({
  text,
  document_id: documentId,
  document_name: documentName,
}) => {
  const document = await documentService.findDocumentById(documentId);
  if (!document) {
    logger.error(`not found document id = ${documentId}`);
    return false;
  }

  const rules = splitText({ text, documentName, documentId, documentType: '' });

  const bulk = [];
  for (const [index, rule] of rules.entries()) {
    bulk.push(
      {
        index: {
          _index: 'rules',
          _type: 'rules',
          _id: `${rule.documentId}_${index + 1}`,
        },
      },
      { ...rule },
    );
  }

  const result = await elasticsearch.Client.bulk({
    index: 'rules',
    type: 'rules',
    body: bulk,
  });

  return result;
};

const splitText = ({
  text,
  documentName,
  documentId,
  documentType,
  download = [],
}) => {
  return text
    .split(/<break_tag>|&lt;break_tag&gt;/)
    .filter(rule =>
      /^(Điều|điều|Điêu|điêu|\nĐiều|\nđiều|\nĐiêu|\nđiêu)\s[0-9]+/gi.test(
        rule.trim(),
      ),
    )
    .map((rule, index) => {
      rule = rule.trim();
      const endRuleIndex = rule.indexOf('\n');

      return {
        id: `${documentId}_${index}`,
        title:
          endRuleIndex !== -1
            ? rule.substring(0, endRuleIndex).trim()
            : rule.substring(endRuleIndex).trim(),
        detail: endRuleIndex !== -1 ? rule.substring(endRuleIndex).trim() : '',
        documentName,
        documentId,
        documentType,
        download,
      };
    });
};

const insertDocument = async ({ text, fileName }) => {
  const regexFileName = /\[([a-zA-Z0-9. _\-,."“”()ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]+)\]/giu;
  const match = fileName.match(regexFileName);
  if (match && match.length >= 3) {
    const documentId = match[0]
      .replace(/(\[|\])/gi, '')
      .replace('TT.NHNN', 'TT-BTTTT')
      .replace(/[._]/gi, '/')
      .trim();
    const documentName = match[1].replace(/(\[|\])/gi, '').trim();
    const quantity = match[2].replace(/(\[|\])/gi, '').trim();
    const document = await documentService.findDocumentById(documentId);
    if (!document) {
      logger.error(
        `Insert file ${fileName} failure because not found document id = ${documentId}`,
      );
      return false;
    }

    const rules = splitText({
      text,
      documentName,
      documentId,
      documentType: document.type,
      download: document.download,
    });

    if (quantity - rules.length !== 0) {
      logger.error(
        `Insert file ${fileName} failure because wrong number rules: quantity=${quantity}, length=${
          rules.length
        }`,
      );
      return false;
    }

    // eslint-disable-next-line no-return-await
    return await ruleService.bulkIndex({ data: rules });
  }

  logger.info({ match });
  logger.error(
    `Insert file ${fileName} failure because not extract info document`,
  );
  return false;
};

const autoloadRuleData = async () => {
  const files = await fs
    .readdirSync(path.join(__dirname, '../test/doc/'))
    .filter(fileName => ['doc', 'docx'].includes(fileName.split('.').pop()));

  const { length } = files;
  logger.info(`Processing total ${length} file.`);
  let countSuccess = 0;
  for (const fileName of files) {
    logger.info(`Process =================> ${fileName} starting ...`);
    const text = await reader.getText(
      path.join(__dirname, `../test/doc/${fileName}`),
    );
    const isSuccess = await insertDocument({ text, fileName });
    if (isSuccess) {
      const currentPath = path.join(__dirname, `../test/doc/${fileName}`);
      const newPath = path.join(__dirname, `../test/done/${fileName}`);
      await fs.renameSync(currentPath, newPath);

      logger.info(`Process =================> ${fileName} successfull!`);
      // eslint-disable-next-line no-plusplus
      countSuccess++;
    }
  }

  logger.info(
    `\nResult =================> ${countSuccess} / ${length} successfull!\n`,
  );
};

const run = async () => {
  // eslint-disable-next-line global-require
  const jsonData = require('../public/json/mic_vbpl.json');
  const bulk = [];
  for (const item of jsonData) {
    if (!item.uuid) {
      bulk.push(
        { index: { _index: 'documents', _type: 'documents', _id: item.uuid } },
        { ...item },
      );
    }
  }

  const result = await elasticsearch.Client.bulk({
    index: 'documents',
    type: 'documents',
    body: bulk,
  });

  return result;
};

module.exports = { readFileDoc, importRuleData, autoloadRuleData, run };
