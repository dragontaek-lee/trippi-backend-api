const Joi = require('joi');

exports.addRegion = Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
})

exports.getRegionImg = Joi.object({
    publicId: Joi.number().required()
})
