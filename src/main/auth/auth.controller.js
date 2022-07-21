const express = require('express');
const asyncify = require('express-asyncify');
const router = asyncify(express.Router({ strict: true, caseSensitive: true }));
const validator = require('./../../common/validator');
const schema = require('./AuthValidator');
const AuthKakao = require('./AuthKakao');

router.post('/kakao', validator.body(schema.kakao), AuthKakao.authKakao);
// router.post('/kakao/reauth', AuthKakao.reAuthKakao);

module.exports = router;
