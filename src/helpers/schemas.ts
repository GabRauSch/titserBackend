import Joi from 'joi'
export const FullRetrieveSchema = Joi.object({
    userId: Joi.number().required().greater(0),
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }).required(),
    gender: Joi.string().valid('male', 'female').required(),
    ageRange: Joi.array().items(Joi.number()).required(),
    rangeInMeters: Joi.number().greater(0).required(),
    idsRetrieved: Joi.array().items(Joi.number()).required(),
  });