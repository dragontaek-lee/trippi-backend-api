const Joi = require('joi');

exports.addRegion = Joi.object({
    name: Joi.string().normalize().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    startDate: Joi.number().required(),
    endDate: Joi.number().required()
})

