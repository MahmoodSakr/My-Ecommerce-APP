const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const authController = require("../controllers/authController");

const {
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../utils/Validator/brandValidator");

router.route("/").get(brandController.getAllBrands).post(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
  brandController.uploadBrandImgMiddleware,
  brandController.resizeImgMiddleware,
  createBrandValidator,
  brandController.createBrand
);

router
  .route("/:id")
  .get(
    // Adding validator rules middleware + Adding Validation handler
    getBrandValidator,
    brandController.getBrandById
  )
  .put(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
    brandController.uploadBrandImgMiddleware,
    brandController.resizeImgMiddleware,
    updateBrandValidator,
    brandController.updateBrandById
  )
  .delete(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin"), // to check whether the user is authorized or not
    deleteBrandValidator,
    brandController.deleteBrandBbyId
  );

module.exports = router;
