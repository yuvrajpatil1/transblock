// server/utils/validators.js
const Joi = require("joi");

const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("voter", "candidate").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const voteSchema = Joi.object({
  candidateId: Joi.string().required(),
  electionId: Joi.string().required(),
});

const electionSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(2000).required(),
  startDate: Joi.date().greater("now").required(),
  endDate: Joi.date().greater(Joi.ref("startDate")).required(),
  electionType: Joi.string()
    .valid("general", "local", "special", "primary")
    .optional(),
});
