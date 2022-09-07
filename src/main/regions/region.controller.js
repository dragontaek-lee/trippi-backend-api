const express = require('express');
const asyncify = require('express-asyncify');
const router = asyncify(express.Router({ strict: true, caseSensitive: true }));
const validator = require('./../../common/validator');
const schema = require('./RegionValidator');
const regionController = require('./region.service');

router.get('/', regionController.regionList);

router.post('/', validator.body(schema.addRegion), regionController.addRegion);

router.get('/image', validator.query(schema.getRegionImg), regionController.regionImgList)

module.exports = router;
