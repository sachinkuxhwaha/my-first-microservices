const Joi = require("joi");

// Validate media upload data
const validateCreatePost = (data) => {
  const schema = Joi.object({
    content: Joi.string().min(3).max(5000).required(),
  });
  return schema.validate(data);
};

module.exports = { validateCreatePost };
