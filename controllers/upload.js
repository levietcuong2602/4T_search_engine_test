/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable func-names */
const path = require('path');
const multer = require('multer');
const reader = require('any-text');

const CustomError = require('../errors/CustomError');
const errorCodes = require('../errors/statusCode');
const uploadService = require('../services/upload');

const { generateRandomString } = require('../utils/random');
const { mkDirByPathSync } = require('../utils/file');
const { normalizeString } = require('../utils/string');

const DESTINATION = 'public';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date();
    const year = today.getFullYear();
    const month =
      today.getMonth() + 1 < 10
        ? `0${today.getMonth() + 1}`
        : today.getMonth() + 1;
    const day = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();
    const destination = `${DESTINATION}/documents/${year}/${month}/${day}`;

    mkDirByPathSync(destination);

    return cb(null, destination);
  },
  filename: (req, file, cb) => {
    const filename = `${generateRandomString(16)}${path.extname(
      file.originalname,
    )}`; // eslint-disable-line prettier/prettier
    return cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    const mimetype = allowedTypes.includes(file.mimetype);
    const filetypes = /docx|txt|doc/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(
      new CustomError(
        errorCodes.INVALID_FILE_TYPE,
        `File upload only support the following filetypes: ${filetypes}`,
      ),
    );
  },
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

async function uploadFile(req, res, next) {
  upload.single('file')(req, res, async err => {
    if (err instanceof multer.MulterError) {
      /* eslint-disable prettier/prettier */
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return next(new CustomError(errorCodes.LIMIT_FILE_SIZE, err.message));
        case 'LIMIT_PART_COUNT':
          return next(
            new CustomError(errorCodes.LIMIT_PART_COUNT, err.message),
          );
        case 'LIMI_FILE_COUNT':
          return next(new CustomError(errorCodes.LIMI_FILE_COUNT, err.message));
        case 'LIMIT_FIELD_KEY':
          return next(new CustomError(errorCodes.LIMIT_FIELD_KEY, err.message));
        case 'LIMIT_FIELD_VALUE':
          return next(
            new CustomError(errorCodes.LIMIT_FIELD_VALUE, err.message),
          );
        case 'LIMIT_FIELD_COUNT':
          return next(
            new CustomError(errorCodes.LIMIT_FIELD_COUNT, err.message),
          );
        case 'LIMIT_UNEXPECTED_FILE':
          return next(
            new CustomError(errorCodes.LIMIT_UNEXPECTED_FILE, err.message),
          );
        default:
          return next(new CustomError(errorCodes.ERROR_UPLOAD, err.message));
        /* eslint-enable prettier/prettier */
      }
    } else if (err) {
      return next(err);
    }

    // reader file
    const { file } = req;
    let content = '';

    content = await reader.getText(file.path);
    content = normalizeString(content);

    const result = await uploadService.importRuleData({
      text: content,
      ...req.body,
    });
    return res.send({ status: 1, result });
  });
}

const readFileDoc = async (req, res) => {
  const result = await uploadService.readFileDoc();
  return res.send({ status: 1, result });
};

const autoloadRuleData = async (req, res) => {
  const result = await uploadService.autoloadRuleData();
  return res.send({ status: 1, result });
};

module.exports = { readFileDoc, uploadFile, autoloadRuleData };
