const express = require('express');
const asyncify = require('express-asyncify');
const router = asyncify(express.Router({ strict: true, caseSensitive: true }));
const validator = require('../../common/validator');
const schema = require('./UsersValidator');
const userController = require('./users.service');

router.get('/', userController.me);

module.exports = router;
