/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const fs = require('fs');
const reader = require('any-text');

const { logger } = require('../utils/logger');
const elasticsearch = require('../utils/elasticsearch');

const documentService = require('./document');
const ruleService = require('./rules');

const readFileDoc = async () => {
  try {
    const filePath = path.join(__dirname, '../test/doc/test.doc');
  } catch (error) {
    console.log(error.message);
  }
};

const importRuleData = async ({
  text,
  document_id: documentId,
  document_name: documentName,
}) => {
  let download = [];
  if (documentId) {
    const docs = await elasticsearch.searchDocument({
      from: 0,
      size: 1,
      index: 'documents',
      body: {
        query: {
          term: {
            _id: documentId,
          },
        },
        _source: ['id', 'download'],
      },
    });
    const {
      body: {
        hits: { hits },
      },
    } = docs;
    const [document] = hits;
    if (document) {
      ({ download } = document._source);
    }
  }

  const rules = text
    .split('<break_tag>')
    .filter(rule => /^(Điều|điều|\nĐiều|\nđiều)\s[0-9]+/gi.test(rule.trim()))
    .map(rule => {
      rule = rule.trim();
      const endRuleIndex = rule.indexOf('\n');

      return {
        name: rule.substring(0, endRuleIndex).trim(),
        detail: rule.substring(endRuleIndex).trim(),
        documentId,
        documentName,
        download,
      };
    });

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

const splitText = ({ text, documentName, documentId, documentType }) => {
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
        title: rule.substring(0, endRuleIndex).trim(),
        detail: rule.substring(endRuleIndex).trim(),
        documentName,
        documentId,
        documentType,
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

  console.log({ match });
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
  console.log(`Processing total ${length} file.`);
  let countSuccess = 0;
  for (const fileName of files) {
    console.log(`Process =================> ${fileName} starting ...`);
    const text = await reader.getText(
      path.join(__dirname, `../test/doc/${fileName}`),
    );
    const isSuccess = await insertDocument({ text, fileName });
    if (isSuccess) {
      const currentPath = path.join(__dirname, `../test/doc/${fileName}`);
      const newPath = path.join(__dirname, `../test/done/${fileName}`);
      await fs.renameSync(currentPath, newPath);

      console.log(`Process =================> ${fileName} successfull!`);
      // eslint-disable-next-line no-plusplus
      countSuccess++;
    }
  }

  console.log(
    `Result =================> ${countSuccess} / ${length} successfull!`,
  );
};

module.exports = { readFileDoc, importRuleData, autoloadRuleData };
