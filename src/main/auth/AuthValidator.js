const Joi = require('joi');

exports.kakao = Joi.object({
    accessToken: Joi.string().normalize().required(),
});

exports.reAuthKakao = Joi.object({
    idToken: Joi.string().normalize().required()
});
