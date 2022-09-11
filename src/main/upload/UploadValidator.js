const Joi = require('joi');

exports.insert = Joi.object({
    publicId: Joi.string().required(),
    title:Joi.string().required()
}).options({ stripUnknown: true });

exports.delete = Joi.object({
    id: Joi.string().normalize().required(),
    filename: Joi.string().normalize().required()
}).options({ stripUnknown: true });