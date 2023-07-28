const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authController = require("../controllers/authController");

const reviewRouter = require("./reviewRouter"); // to handle nested routes from product to reviews

const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/Validator/productValidator");

router.route("/").get(productController.getAllProducts).post(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
  productController.uploadProductImages,
  productController.resizeImgMiddleware,
  createProductValidator,
  productController.createProduct
);

router
  .route("/:id")
  .get(
    // Adding validator rules middleware + Adding Validation handler
    getProductValidator,
    productController.getProductById
  )
  .put(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
    productController.uploadProductImages,
    productController.resizeImgMiddleware,
    updateProductValidator,
    productController.updateProductById
  )
  .delete(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin"), // to check whether the user is authorized or not
    deleteProductValidator,
    productController.deleteProductById
  );

  // to route all nested routes traffic to review Router from product router
router.use("/:productId/reviews", reviewRouter);

module.exports = router;
