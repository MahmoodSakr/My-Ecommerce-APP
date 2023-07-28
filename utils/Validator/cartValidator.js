const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");
const Cart = require("../../models/cartModel");
const ApiError = require("../ApiError");

exports.addProductToCartValidator = [
  check("name")
    .notEmpty()
    .withMessage("name of the Cart is not specified")
    .custom(async (value,{req}) => {
      // Convert the Cart name into UpperCase
      const Cart = await Cart.findOne({ name: value.trim().toUpperCase() });
      if (Cart) {
        throw new ApiError(
          `The Cart name ${value} is existed before in database`
        );
      }
      return true; // move next
    }),
  check("expired")
    .notEmpty()
    .withMessage("Expiration date of the Cart is not specified")
    .isDate()
    .withMessage("Expiration date format is not valid"),
  check("discount")
    .notEmpty()
    .withMessage("Discount price value of the Cart is not specified")
    .isNumeric()
    .withMessage("Discount price value must be number"),
  globalValidatorHandler,
];

exports.getCartValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the Cart is not specified")
    .isMongoId()
    .withMessage("Invalid Cart Id Format!"),
  globalValidatorHandler,
];

exports.updateCartValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the Cart is not specified")
    .isMongoId()
    .withMessage("Invalid Cart Id Format!"),
  check("expired")
    .notEmpty()
    .withMessage("expiration Date of the Cart is not specified")
    .isDate()
    .withMessage("Expiration date format is not valid"),
  check("discount")
    .notEmpty()
    .withMessage("discount value of the Cart is not specified")
    .isNumeric()
    .withMessage("Discount price value must be number"),
  globalValidatorHandler,
];

exports.deleteCartValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the Cart is not specified")
    .isMongoId()
    .withMessage("Invalid Cart Id Format!"),
  globalValidatorHandler,
];
