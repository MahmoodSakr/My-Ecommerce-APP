const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");
const Coupon = require("../../models/couponModel");
const ApiError = require("../ApiError");

exports.createCouponValidator = [
  check("name")
    .notEmpty()
    .withMessage("name of the coupon is not specified")
    .custom(async (value,{req}) => {
      // Convert the coupon name into UpperCase
      const coupon = await Coupon.findOne({ name: value.trim().toUpperCase() });
      if (coupon) {
        throw new ApiError(
          `The coupon name ${value} is existed before in database`
        );
      }
      return true; // move next
    }),
  check("expired")
    .notEmpty()
    .withMessage("Expiration date of the coupon is not specified")
    .isDate()
    .withMessage("Expiration date format is not valid"),
  check("discount")
    .notEmpty()
    .withMessage("Discount price value of the coupon is not specified")
    .isNumeric()
    .withMessage("Discount price value must be number"),
  globalValidatorHandler,
];

exports.getCouponValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the Coupon is not specified")
    .isMongoId()
    .withMessage("Invalid Coupon Id Format!"),
  globalValidatorHandler,
];

exports.updateCouponValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the Coupon is not specified")
    .isMongoId()
    .withMessage("Invalid Coupon Id Format!"),
  check("expired")
    .notEmpty()
    .withMessage("expiration Date of the Coupon is not specified")
    .isDate()
    .withMessage("Expiration date format is not valid"),
  check("discount")
    .notEmpty()
    .withMessage("discount value of the Coupon is not specified")
    .isNumeric()
    .withMessage("Discount price value must be number"),
  globalValidatorHandler,
];

exports.deleteCouponValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the Coupon is not specified")
    .isMongoId()
    .withMessage("Invalid Coupon Id Format!"),
  globalValidatorHandler,
];
