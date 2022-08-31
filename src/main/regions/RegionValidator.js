const Joi = require('joi');

exports.addRegion = Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
})

