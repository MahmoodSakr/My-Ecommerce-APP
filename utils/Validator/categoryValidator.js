const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");

exports.getCategoryValidator = [
  check("id")
  .notEmpty()
  .withMessage("id of the category is not specified")
  .isMongoId()
  .withMessage("Invalid category Id Format!"),
  globalValidatorHandler,
];

exports.createCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("category name must be filled!")
    .isLength({ min: 3 })
    .withMessage("category name must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("category name must be less than 35 chars"),
  globalValidatorHandler,
];

exports.updateCategoryValidator = [
  check("id")
  .notEmpty()
  .withMessage("id of the category is not specified")
  .isMongoId()
  .withMessage("Invalid category Id Format!"),
  check("name")
  .optional()
    .isLength({ min: 3 })
    .withMessage("category name must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("category name must be less than 35 chars"),
  globalValidatorHandler,
];

exports.deleteCategoryValidator = [
  check("id")
  .notEmpty()
  .withMessage("id of the category is not specified")
  .isMongoId()
  .withMessage("Invalid category Id Format!"),
  globalValidatorHandler,
];
