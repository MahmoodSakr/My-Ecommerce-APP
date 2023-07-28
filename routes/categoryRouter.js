const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authController = require("../controllers/authController");
const subCategoryRouter = require("./subCategoryRouter"); // to handle nested routes from cat to subCat

const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/Validator/categoryValidator");

router.route("/").get(categoryController.getAllCategories).post(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("admin", "manager"), // // to check whether the user is authorized or not
  categoryController.uploadCategoryImgMiddleware,
  categoryController.resizeImgMiddleware,
  createCategoryValidator,
  categoryController.createCategory
);

router
  .route("/:id")
  .get(
    // Adding validator rules middleware + Adding Validation handler
    getCategoryValidator,
    categoryController.getCategoryById
  )
  .put(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
    categoryController.uploadCategoryImgMiddleware,
    categoryController.resizeImgMiddleware,
    updateCategoryValidator,
    categoryController.updateCategoryById
  )
  .delete(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin"), // to check whether the user is authorized or not
    deleteCategoryValidator,
    categoryController.deleteCategoryBbyId
  );

// nested route to allow you access subcategoris of specific category id
router.use("/:categoryId/subcategories",subCategoryRouter);

module.exports = router;
