const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const orderController = require("../controllers/orderController");

// const {
//   getOrderValidator,
//   createOrderValidator,
//   updateOrderValidator,
//   deleteOrderValidator,
// } = require("../utils/Validator/OrderValidator");

router.route("/:cartId").post(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  // createOrderValidator,
  orderController.createCashOrder
);

router.route("/checkout-session/:cartId").get(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  orderController.createCheckoutSession
);

router.route("/").get(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  orderController.getLoginUserOrder
);

router.route("/all").get(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
  orderController.getAllUsersOrders
);

router.route("/:id/paid").put(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
  // updateOrderValidator,
  orderController.updateOrderToPaid
);

router.route("/:id/delivered").put(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
  // updateOrderValidator,
  orderController.updateOrderToDelivered
);

router
  .route("/:id")
  .get(
    authController.protect,
    authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
    // getOrderValidator,
    orderController.getOrderById
  )
  .delete(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("user", "admin", "manager"), // to check whether the user is authorized or not
    // deleteOrderValidator,
    orderController.deleteOrderById
  );

module.exports = router;
