const express = require("express");
/* mergeParams: true allow you access req nested params from parent route like access reviews by obtaining  
specific category of product id */
const router = express.Router({ mergeParams: true });
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const {
  getReviewValidator,
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require("../utils/Validator/reviewValidator");

// Handle the nested route to add a review based on a specific product id
// this fun to pybass the validation on product id body field
const appendProductAndUserIdToBodyIfNestedRoute = function (req, res, next) {
  if (!req.body.product) {
    req.body.product = req.params.productId;
  }
  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
};

router.route("/").get(reviewController.getAllReviews).post(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  appendProductAndUserIdToBodyIfNestedRoute, // to append product Id into the body if there was a nested routes before validation
  createReviewValidator,
  reviewController.createReview
);

router
  .route("/:id")
  .get(getReviewValidator, reviewController.getReviewById)
  .put(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("user"), // to check whether the user is authorized or not
    updateReviewValidator,
    reviewController.updateReviewById
  )
  .delete(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin", "manager", "user"), // to check whether the user is authorized or not
    deleteReviewValidator,
    reviewController.deleteReviewById
  );

module.exports = router;
