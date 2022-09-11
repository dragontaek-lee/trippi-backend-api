const express = require('express');
const asyncify = require('express-asyncify');
const router = asyncify(express.Router({ strict: true, caseSensitive: true }));
const validator = require('./../../common/validator');
const schema = require('./UploadValidator');
const uploadController = require('./upload.service');
const multer = require('multer');
const os = require('os')
const upload = multer({ dest: os.tmpdir() });

router.post('/', upload.array('data'), uploadController.insert);
router.delete('/', uploadController.delete);

module.exports = router;
