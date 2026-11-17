const Joi = require("joi");

// Validate user registration data
const validateRegistrationSchema = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

module.exports = { validateRegistrationSchema };
