const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const wishListController = require("../controllers/wishListController");

const {
  addProductIdToWishListValidator,
  deleteProductIdToWishListValidator,
} = require("../utils/Validator/wishListValidator");

router.post(
  "/",
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  addProductIdToWishListValidator,
  wishListController.addProductToWishList
);

router.get(
  "/",
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  wishListController.getUserWishList
);

router.delete(
  "/:productId",
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  deleteProductIdToWishListValidator,
  wishListController.deleteProductFromWishList
);

module.exports = router;
