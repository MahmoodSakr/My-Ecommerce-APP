const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");

exports.getSubCategoryValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the subCategory is not specified")
    .isMongoId()
    .withMessage("Invalid subCategory Id Format!"),
  globalValidatorHandler,
];

exports.createSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("subCategory name must be filled!")
    .isLength({ min: 2 })
    .withMessage("subCategory name must be more than 2 chars")
    .isLength({ max: 35 })
    .withMessage("subCategory name must be less than 35 chars"),
  check("category")
    .notEmpty()
    .withMessage("id of the parent category must be specified")
    .isMongoId()
    .withMessage("Invalid parent category Id Format!"),
  globalValidatorHandler,
];

exports.updateSubCategoryValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the subCategory is not specified")
    .isMongoId()
    .withMessage("Invalid subCategory Id Format!"),
  check("name")
  .optional()
    .isLength({ min: 2 })
    .withMessage("subCategory name must be more than 2 chars")
    .isLength({ max: 35 })
    .withMessage("subCategory name must be less than 35 chars"),
  check("category")
    .notEmpty()
    .withMessage("id of the parent category must be specified")
    .isMongoId()
    .withMessage("Invalid parent category Id Format!"),
  globalValidatorHandler,
];

exports.deleteSubCategoryValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the subCategory is not specified")
    .isMongoId()
    .withMessage("Invalid subCategory Id Format!"),
  globalValidatorHandler,
];
