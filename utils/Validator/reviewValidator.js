const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");
const Product = require("../../models/productModel");
const Review = require("../../models/reviewModel");
const ApiError = require("../ApiError");

exports.createReviewValidator = [
  check("title")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Review title must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("Review title must be less than 35 chars"),
  check("rating")
    .notEmpty()
    .withMessage("Review rating must not be empty")
    .isNumeric({ min: 0, max: 5 })
    .withMessage("Review rating must be between 0 and 5"),
  check("user")
    .optional()
    .isMongoId()
    .withMessage("Id of rating user is not valid!")
    .custom(async (reviewUserId, { req }) => {
      // checks that this logined user is the same as the user who creates the review
      if (reviewUserId.toString() != req.user._id) {
        throw new ApiError(
          "Sorry, the loggned user is not as the user who creates the review!"
        );
      }
      return true;
    }),
  check("product")
    .notEmpty()
    .withMessage("Product id must be provided")
    .isMongoId()
    .withMessage("Id of product is not valid!")
    .custom(async (value, { req }) => {
      // checks for the product existance 
      const product = await Product.findById(value);
      if (!product) {
        throw new ApiError(
          `The product with id ${value} does not exists!`
        );
      }
      // checks that the loggined user has not posted review on the same product before
      const review = await Review.findOne({
        user: req.user._id, // got from the login user token
        product: value,
      });
      if (review) {
        throw new ApiError(
          "Sorry, any user has to review the product only one time"
        );
      }
      return true;
    }),
  globalValidatorHandler,
];

exports.getReviewValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the Review is not specified")
    .isMongoId()
    .withMessage("Invalid Review Id Format!"),
  globalValidatorHandler,
];

exports.updateReviewValidator = [
  check("id")
    .notEmpty()
    .withMessage("Id of review must be provided!")
    .custom(async (reviewId, { req }) => {
      // checks for the existance of the review
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new ApiError(
          `The requested review with id ${reviewId} does not exists!`
        );
      }
      //check that the logined user is the owner of this review
      if (review.user._id.toString() != req.user._id.toString()) {
        throw new ApiError(
          `The logined user has not posted this review before to update it!`
        );
      }
      return true; // if all the above cases are okay
    }),
  check("title")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Review title must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("Review title must be less than 35 chars"),
  check("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Review rating must be between 0 and 5"),
  check("user")
    .optional()
    .isMongoId()
    .withMessage("Id of rating user is not valid!")
    .custom(async (value, { req }) => {
      // checks that this review belongs before to the user id provided
      const review = await Review.findOne({
        user: value,
      });
      if (!review) {
        throw new ApiError(
          "Sorry, this review doesn't belong to the provided user id!"
        );
      }
      return true;
    }),
  check("product")
    .optional()
    .isMongoId()
    .withMessage("Id of rating product is not valid!")
    .custom(async (value, { req }) => {
      // checks that this review belongs to the product provided
      const review = await Review.findOne({
        product: value,
      });
      if (!review) {
        throw new ApiError(
          "Sorry, this review doesn't belong to the provided product!"
        );
      }
      return true;
    }),
  globalValidatorHandler,
];

exports.deleteReviewValidator = [
  check("id")
    .notEmpty()
    .withMessage("Id of review must be provided!")
    .isMongoId()
    .withMessage("Invalid Review Id Format!")
    .custom(async (reviewId, { req }) => {
      // checks for the existance of the review
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new ApiError(
          `The requested review with id ${reviewId} does not exists!`
        );
      }
      // if the logined user is admin or manager so they can delete any review without checking their owenership
      //check that the logined user is the owner of this review
      if (req.user._id.role == "user") {
        if (review.user.toString() != req.user._id.toString()) {
          throw new ApiError(
            `The logined user has not posted this review before to delete it!`
          );
        }
      }
      return true; // if all the above cases are okay
    }),
  globalValidatorHandler,
];