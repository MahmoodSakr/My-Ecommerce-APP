const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const cartController = require("../controllers/cartController");

const {
  addProductToCartValidator,
  getCartValidator,
  updateCartValidator,
  deleteCartValidator,
} = require("../utils/Validator/cartValidator");

// for all routes below
router.use(
  authController.protect // to check whether the user is authenticated or not
);

router.post(
  "/",
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  cartController.addProductToCart
);

router.get(
  "/",
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  cartController.getLoginUserCart
);

router.get(
  "/all",
  authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
  cartController.getAllCarts
);

router.get(
  "/applyCoupon/",
  authController.isAllowedTo("user", "admin", "manager"), // to check whether the user is authorized or not
  cartController.applyCouponToCart
);


router.get(
  "/:id",
  authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
  cartController.getCartById
);

router.put(
  "/:itemId",
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  cartController.updateCartItemQuantity
);

// router.put(
//   "/:id",
//   // authController.isAllowedTo("admin","manager"), // to check whether the user is authorized or not
//   // updateCartValidator,
//   cartController.updateCartById
// );

router.delete(
  "/:itemId",
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  // deleteCartValidator,
  cartController.deleteItemFromCart
);

router.delete(
  "/",
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  cartController.deleteLoginUserCart
);

// router.delete(
//   "/:id",
//   authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
//   // deleteCartValidator,
//   cartController.deleteCartById
// );

module.exports = router;
