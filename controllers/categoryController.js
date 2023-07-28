const Category = require("../models/categoryModel");
const slugify = require("slugify");
const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { uploadSingleImage } = require("../middlewares/uploadImage");

// Upload Image config
exports.uploadCategoryImgMiddleware = uploadSingleImage("image");
exports.resizeImgMiddleware = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const ext = "jpeg";
    const filename = `category-${uuidv4()}-${Date.now()}.${ext}`;
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat(ext)
      .jpeg({ quality: 90 }) // 90% of its quality
      .toFile(`upload/categories/${filename}`); // save it in this path by this file name
    // append the image file name to the req.body to be saved into the db through the create controller
    req.body.image = filename;
  }
  next();
});

// @desc Create anew category
// @route Post /categories
// Access Private/Admin-Manager
exports.createCategory = asyncHandler(async (req, res, next) => {
  req.body.slug = slugify(req.body.name);
  console.log("body obj", req.body);
  var newCategory = new Category(req.body);
  const category = await newCategory.save();
  res.status(201).json({ data: category });
});

// @desc Get all categories
// @route Get  /categories
// Access Public
exports.getAllCategories = asyncHandler(async (req, res, next) => {
  // 1- Filtering setup
  const filterObj = { ...req.query };
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
    delete filterObj[field];
  });

  // append $ operator before any (gte|gt|lte|lt) in the fields
  let filterObjStr = JSON.stringify(filterObj);
  filterObjStr = filterObjStr.replace(/\b(gte|gt|lte|lt)\b/g, (result) => {
    return "$" + result; // `$${result}`
  });

  let categoriesQuery = Category.find(JSON.parse(filterObjStr));
  // 2- Pagination setup
  let page = req.query.page * 1 || 1; // convert to num by *1
  let limit = req.query.limit * 1 || 50; // number of returned docs per page
  let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
  let endIndex = page * limit; // last index of doc in the page
  let allDocumentsNum = await Category.countDocuments(); // all document that matched with the filtered result

  const paginationResult = {};
  paginationResult.currentPage = page;
  paginationResult.limit = limit;
  paginationResult.numberOfPages = Math.ceil(allDocumentsNum / limit);

  if (endIndex < allDocumentsNum) {
    paginationResult.nextPage = page + 1; // value of next page
  }
  if (skip > 0) {
    paginationResult.previousPage = page - 1; // value of previous page
  }

  categoriesQuery = categoriesQuery.skip(skip).limit(limit);

  // 4- Check for sorting option
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    console.log(sortBy);
    categoriesQuery = categoriesQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
  } else {
    categoriesQuery = categoriesQuery.sort("createdAt"); // default setting for sorting based on adding date
  }

  // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",").join(" ");

    /*
 in the selectedFields, if you write the fields as 
 "title slug price" >> hence these fields only will be return with the obj beside id field
 "-title -slug" >> hence all fields will be return except these fields 
    */
    categoriesQuery = categoriesQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
  } else {
    categoriesQuery = categoriesQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
  }

  // 6- Checks for searching with specific keyword to be compared/matched with name
  if (req.query.keywords) {
    let query = { name: { $regex: req.query.keywords, $options: "i" } };
    categoriesQuery = categoriesQuery.find(query);
    /* 
     find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                   { description: { $regex: req.query.keywords, $options: "i" } },]}) 
      */
  }

  // 7- Execute query
  const categories = await categoriesQuery;
  res
    .status(200)
    .json({ results: categories.length, paginationResult, data: categories });
  if (!categories) {
    const errObj = new ApiError(`No categories are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get specific category
// @route Get  /categories/:id
// Access Public
exports.getCategoryById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const category = await Category.findById(id);
  if (category) {
    return res.status(200).json({ data: category });
  }
  // res.status(404).json({ message: `Category with id: ${id} is not found!` });
  const errObj = new ApiError(`Category with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific category
// @route Put  /categories/:id
// Access Private/Admin-Manager
exports.updateCategoryById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
  }
  const category = await Category.findByIdAndUpdate(
    id,
    req.body,
    { new: true } // return the new category, if new : false(default), the old category will be returnd
  );
  // checks for the category updating
  if (!category) {
    // return res.status(404).json({ message: `Category with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `Category with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "Category is updated successfully", data: category });
});

// @desc Delete specific category
// @route Delete  /categories/:id
// Access Private/Admin
exports.deleteCategoryBbyId = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    // return res
    //   .status(404)
    //   .json({ message: `Category with id: ${id} is not found! to be deleted` });
    const errObj = new ApiError(
      `Category with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "Category is deleted successfully", data: category });
  // res.status(204).send(); // that means the delete process is done and there is no content
});
