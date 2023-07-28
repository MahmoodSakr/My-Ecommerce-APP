const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");
const Product = require("../../models/productModel");
const ApiError = require("../ApiError");


exports.addProductIdToWishListValidator = [
     check("productId")
     .notEmpty()
     .withMessage("id of the product is not specified")
     .isMongoId()
     .withMessage("Invalid product Id Format!")
     .custom(async (value) => {
       // checks for the product existance
       const product = await Product.findById(value);
       if (!product) {
         throw new ApiError(
           `The product id ${value} is not existed in database`
         );
       }
       return true;
     }),
   globalValidatorHandler,
];

exports.deleteProductIdToWishListValidator = [
  check("productId")
    .notEmpty()
    .withMessage("id of the product is not specified")
    .isMongoId()
    .withMessage("Invalid product Id Format!")
    .custom(async (value) => {
      // checks for the product existance
      const product = await Product.findById(value);
      if (!product) {
        throw new ApiError(
          `The product id ${value} is not existed in database`
        );
      }
      return true;
    }),
  globalValidatorHandler,
];
