const express = require("express");

/* mergeParams: true allow you access req params from parent route like access subcategories by obtaining its 
specific category id */
const router = express.Router({ mergeParams: true });
const authController = require("../controllers/authController");

const subCategoryController = require("../controllers/subCategoryController");
const {
  getSubCategoryValidator,
  createSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/Validator/subCategoryValidator");

const appendCategoryIdToBodyIfNestedRoute = function (req, res, next) {
  // Handle the nested route to add a subcategory based on a specific category id
  // appendCategoryIdToBodyIfNestedRoute to pybass the validation on category id body field
  if (!req.body.category) {
    req.body.category = req.params.id;
  }
  next();
};

router
  .route("/")
  .post(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
    appendCategoryIdToBodyIfNestedRoute, // to append category Id if there was a nested routes before validation
    createSubCategoryValidator,
    subCategoryController.createSubCategory
  )
  .get(subCategoryController.getAllSubCategories);

router
  .route("/:id")
  .get(
    // Adding validator rules middleware + Adding Validation handler
    getSubCategoryValidator,
    subCategoryController.getSubCategoryById
  )
  .put(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin", "manager"), // to check whether the user is authorized or not
    updateSubCategoryValidator,
    subCategoryController.updateSubCategoryById
  )
  .delete(
    authController.protect, // to check whether the user is authenticated or not
    authController.isAllowedTo("admin"), // to check whether the user is authorized or not
    deleteSubCategoryValidator,
    subCategoryController.deleteSubCategoryById
  );

module.exports = router;
