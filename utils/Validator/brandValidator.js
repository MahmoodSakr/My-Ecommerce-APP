const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");

exports.getBrandValidator = [
  check("id")
  .notEmpty()
  .withMessage("id of the brand is not specified")
  .isMongoId()
  .withMessage("Invalid brand Id Format!"),
  globalValidatorHandler,
];

exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("brand name must be filled!")
    .isLength({ min: 3 })
    .withMessage("brand name must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("brand name must be less than 35 chars"),
  globalValidatorHandler,
];

exports.updateBrandValidator = [
  check("id")
  .notEmpty()
  .withMessage("id of the brand is not specified")
  .isMongoId()
  .withMessage("Invalid brand Id Format!"),
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("brand name must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("brand name must be less than 35 chars"),
  globalValidatorHandler,
];

exports.deleteBrandValidator = [
  check("id")
  .notEmpty()
  .withMessage("id of the brand is not specified")
  .isMongoId()
  .withMessage("Invalid brand Id Format!"),
  globalValidatorHandler,
];
