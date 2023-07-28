const slugify = require("slugify");
const { check, body } = require("express-validator");
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");
const Category = require("../../models/categoryModel");
const SubCategory = require("../../models/subCategoryModel");

exports.createProductValidator = [
  check("title")
    .isLength({ min: 3 })
    .withMessage("Product title must be at least 3 chars")
    .notEmpty()
    .withMessage("Product required")
    // .custom((title, { req }) => {
    //   req.body.slug = slugify(title);
    //   return true;
    //   }),
  ,check("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 2000 })
    .withMessage("Too long description"),
  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required")
    .isNumeric()
    .withMessage("Product quantity must be a number"),
  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Product quantity must be a number"),
  check("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isNumeric()
    .withMessage("Product price must be a number")
    .isLength({ max: 32 })
    .withMessage("To long price"),
  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Product priceAfterDiscount must be a number")
    .toFloat()
    .custom((priceAfterDiscount, { req }) => {
      if (req.body.price <= priceAfterDiscount) {
        throw new Error(
          `priceAfterDiscount ${priceAfterDiscount} must be lower than price ${req.body.price}`
        );
      }
      return true;
    }),
  check("colors")
    .optional()
    .isArray()
    .withMessage("availableColors should be array of string"),
    check('imageCover').notEmpty().withMessage('Product imageCover is required'),
    check("images")
    .optional()
    .isArray()
    .withMessage("images should be array of string"),
  check("category")
    .notEmpty()
    .withMessage("Category Id must be specified and also must belongs to specific Product")
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category for this id: ${categoryId}`)
          );
        }
      })
    ),
  check("subcategories") // checks if these subCategories are existed in Subcategories collection
    .optional()
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(
      (subcategories_Ids_ArrofReqBody) =>
        // return all doc where its _id is existed as a field as well matched the ids of subcategories Ids
        SubCategory.find({
          _id: { $exists: true, $in: subcategories_Ids_ArrofReqBody },
        }).then((result) => {
          if (result.length !== subcategories_Ids_ArrofReqBody.length) {
            return Promise.reject(new Error(`Invalid subcategories Ids`));
          }
          return true;
        }) // checks if these subCategories are related to the parent category of this product
    )
    .custom((subcategories_Ids_ArrofReqBody, { req }) =>
      SubCategory.find({ category: req.body.category }).then(
        (subcategoriesArr) => {
          const subCategories_Ids_Of_ParentCategory = []; // will hold the ids only of the returned arr of category objects
          subcategoriesArr.forEach((subCategoryObj) => {
            subCategories_Ids_Of_ParentCategory.push(
              subCategoryObj._id.toString()
            ); // convert id mongo obj to string
          });
          // check if subcategories ids of parent category include the subcategories of req.body (true)
          const checker = (target, arr) =>
            target.every((id_of_target) => arr.includes(id_of_target));
          if (
            !checker(
              subcategories_Ids_ArrofReqBody,
              subCategories_Ids_Of_ParentCategory
            )
          ) {
            return Promise.reject(
              new Error(
                `subcategories of req body are not belonging to the parent category of this product`
              )
            );
          }
        }
      )
    ),
  check("brand").optional().isMongoId().withMessage("Invalid ID formate"),
  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("ratingsAverage must be a number")
    .isLength({ min: 0 })
    .withMessage("Rating must be above or equal 0")
    .isLength({ max: 5 })
    .withMessage("Rating must be below or equal 5.0"),
  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("ratingsQuantity must be a number"),
  globalValidatorHandler,
];

exports.getProductValidator = [
  check("id").isMongoId().withMessage("Invalid ID formate"),
  globalValidatorHandler,
];

exports.updateProductValidator = [
  check("id").isMongoId().withMessage("Invalid ID formate"),
  body("title")
    .optional()
    // .custom((val, { req }) => {
    //   req.body.slug = slugify(val);
    //   return true; // go to the next middleware
    // }
    // )
    ,  globalValidatorHandler,
];

exports.deleteProductValidator = [
  check("id").isMongoId().withMessage("Invalid ID formate"),
  globalValidatorHandler,
];
