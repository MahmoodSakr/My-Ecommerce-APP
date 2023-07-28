const SubCategory = require("../models/subCategoryModel");
const slugify = require("slugify");
const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");

// @desc Create anew subCategory
// @route Post /subCategories
// @desc Create anew subCategory under specific category id
// @route Post /categories/:id/subcategories
// Access Private/Admin-Manager
exports.createSubCategory = asyncHandler(async (req, res, next) => {
  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
  }
  var newSubCategory = new SubCategory(req.body);
  const subCategory = await newSubCategory.save();
  res.status(201).json({ data: subCategory });
});

// @desc Get all subCategories with/without nested route
// @route Get  /subCategories
// @route Get  /categories/:categoryId/subcategories  (nested Routes)
// Access Public
exports.getAllSubCategories = asyncHandler(async (req, res, next) => {
  let filterObject = {};

  if (req.params.categoryId) {
    // nested route, so you will get the category id from the req params not the req body
    filterObject = { category: req.params.categoryId };
  }
  // 1- build initial query to be chained later
  let subCategoriesQuery = SubCategory.find(filterObject);
  let paginationResult = {};
  
  // Checks if their are filtering options or not
  if (req.query) {
    console.log("req.query", req.query);

    // 2- Filtering setup
    const queryStringObj = { ... req.query }; // virtual copy without the ref copy
    // remove these fields from the filter object
    const execludeFields = [
      "limit",
      "skip",
      "page",
      "sort",
      "fields",
      "keywords",
    ];
    execludeFields.forEach((field) => {
      delete queryStringObj[field];
    });

    // append $ operator before any (gte|gt|lte|lt) in the fields
    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (result) => {
      return "$" + result; // `$${result}`
    });

    subCategoriesQuery = subCategoriesQuery.find(JSON.parse(queryStr));

    // 3- Pagination setup
    let page = req.query.page * 1 || 1; // convert to num by *1
    let limit = req.query.limit * 1 || 50; // number of returned docs per page
    let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
    let endIndex = page * limit; // last index of doc in the page
    let allDocumentsNum = await SubCategory.countDocuments(); // all document that matched with the filtered result

    paginationResult = {};
    paginationResult.currentPage = page;
    paginationResult.limit = limit;
    paginationResult.numberOfPages = Math.ceil(allDocumentsNum / limit);

    if (endIndex < allDocumentsNum) {
      paginationResult.nextPage = page + 1; // value of next page
    }
    if (skip > 0) {
      paginationResult.previousPage = page - 1; // value of previous page
    }

    subCategoriesQuery = subCategoriesQuery.skip(skip).limit(limit);

    // 4- Check for sorting option
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      console.log(sortBy);
      subCategoriesQuery = subCategoriesQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
    } else {
      subCategoriesQuery = subCategoriesQuery.sort("createdAt"); // default setting for sorting based on adding date
    }

    // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
    if (req.query.fields) {
      const selectedFields = req.query.fields.split(",").join(" ");

      /*
 in the selectedFields, if you write the fields as 
 "title slug price" >> hence these fields only will be return with the obj beside id field
 "-title -slug" >> hence all fields will be return except these fields 
    */
      subCategoriesQuery = subCategoriesQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
    } else {
      subCategoriesQuery = subCategoriesQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
    }

    // 6- Checks for searching with specific keyword to be compared/matched with name
    if (req.query.keywords) {
      let query = { name: { $regex: req.query.keywords, $options: "i" } };
      subCategoriesQuery = subCategoriesQuery.find(query);
      /* 
     find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                   { description: { $regex: req.query.keywords, $options: "i" } },]}) 
      */
    }
  }
  // 7- Execute the chained query
  const subCategories = await subCategoriesQuery;
  res.status(200).json({
    results: subCategories.length,
    paginationResult,
    data: subCategories,
  });

  if (!subCategories) {
    const errObj = new ApiError(`No subCategories are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get specific subCategory
// @route Get /subCategory/:id
// Access Public
exports.getSubCategoryById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const subCategory = await SubCategory.findById(id).populate({
    path: "category",
  });
  console.log("subCategory obj", subCategory);
  if (subCategory) {
    return res.status(200).json({ data: subCategory });
  }
  // res.status(404).json({ message: `subCategory with id: ${id} is not found!` });
  const errObj = new ApiError(`subCategory with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific subCategory
// @route Put  /subcategories/:id
// Access Private/Admin-Manager
exports.updateSubCategoryById = asyncHandler(async (req, res, next) => {
  const id = req.params.id; // subCategory Id
  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
  }
  const subCategory = await SubCategory.findByIdAndUpdate(
    id,
    req.body,
    { new: true } // return the new subCategory, if new : false(default), the old subCategory will be returnd
  );
  // checks for the subCategory updating
  if (!subCategory) {
    // return res.status(404).json({ message: `subCategory with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `SubCategory with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "SubCategory is updated successfully", data: subCategory });
});

// @desc Delete specific subCategory
// @route Delete  /subcategories/:id
// Access Private/Admin
exports.deleteSubCategoryById = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const subCategory = await SubCategory.findByIdAndDelete(id);
  if (!subCategory) {
    // return res
    //   .status(404)
    //   .json({ message: `subCategory with id: ${id} is not found! to be deleted` });
    const errObj = new ApiError(
      `SubCategory with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "SubCategory is deleted successfully", data: subCategory });
  // res.status(204).send(); // that means the delete process is done and there is no content
});
