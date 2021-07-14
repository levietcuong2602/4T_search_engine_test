/* eslint-disable no-useless-escape */
/* eslint-disable func-names */
const path = require('path');
const fs = require('fs');
const http = require('https');
const { generateRandomString } = require('../utils/random');

const DESTINATION = 'public';

function mkDirByPathSync(targetDir, opts) {
  const isRelativeToScript = opts && opts.isRelativeToScript;
  const { sep } = path;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    return curDir;
  }, initDir);
}

function getFileExtension(file) {
  if (!file || file === '') {
    return '';
  }
  const index = file.lastIndexOf('.');
  const extend = index > 0 ? file.substring(index + 1) : '';
  return extend;
}

function download(url) {
  const today = new Date();
  const year = today.getFullYear();
  const month =
    today.getMonth() + 1 < 10
      ? `0${today.getMonth() + 1}`
      : today.getMonth() + 1;
  const day = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();
  const destination = `${DESTINATION}/audio/${year}/${month}/${day}`;

  mkDirByPathSync(destination);
  const ext = getFileExtension(url);
  const fileName = `${generateRandomString(16)}.${ext}`;
  const dest = `${destination}/${fileName}`;

  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    let responseSent = false; // flag to make sure that response is sent only once.
    http
      .get(url, response => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (responseSent) return;
            responseSent = true;
            resolve();
          });
        });
      })
      .on('error', err => {
        if (responseSent) return;
        responseSent = true;
        reject(err);
      });
  });
}

function detachSentences(characters) {
  const sentences = characters
    .replace(/(\.+|\:|\!|\?)(\"*|\'*|\)*|}*|]*)(\s|\n|\r|\r\n)/gm, '$1$2|')
    .split('|');
  return sentences;
}

async function writeFileJson({ data, filePath }) {
  const jsonData = data.map(doc => {
    if (doc['']) {
      doc.summary += `. ${doc['']}`;
      delete doc[''];
    }

    return doc;
  });
  try {
    const stringData = JSON.stringify(jsonData, null, '\t');
    await fs.writeFileSync(path.join(__dirname, filePath), stringData, 'utf-8');
  } catch (err) {}

  return true;
}

module.exports = {
  mkDirByPathSync,
  getFileExtension,
  download,
  detachSentences,
  writeFileJson,
};
