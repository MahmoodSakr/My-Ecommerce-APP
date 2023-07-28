const Product = require("../models/productModel");
const slugify = require("slugify");
const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { uploadMultipleImages } = require("../middlewares/uploadImage");

// middleware to upload many files and receive them in req.files
exports.uploadProductImages = uploadMultipleImages([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

// img processing for product imageCoverName and images array and append them as fields in req.body
// because these fields are required in db and in req fields validation layer
exports.resizeImgMiddleware = asyncHandler(async (req, res, next) => {
  if (req.files.imageCover) {
    const ext = "jpeg";
    // adjust its name because the image is uploaded without any ext
    const imageCoverfileName = `product-${uuidv4()}-${Date.now()}-cover.${ext}`;
    // apply resizing
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat(ext)
      .jpeg({ quality: 95 }) // 90% of its quality
      .toFile(`upload/products/${imageCoverfileName}`); // save it in this path by this file name
    // append the imageCoverName filed to the req.body to be saved into the db through the create controller
    // as it considered a required field so it must be appended to req.body to pass from validation layer
    req.body.imageCover = imageCoverfileName;
  }

  // processing images array
  if (req.files.images) {
    const productImagesArray = [];
    await Promise.all(
      req.files.images.map(async (imageObj, index) => {
        const ext = "jpeg";
        // make the image name as string to be saved in db as string
        const imageFileName = `product-${uuidv4()}-${Date.now()}-${
          index + 1
        }.${ext}`;
        await sharp(imageObj.buffer)
          .resize(2000, 1333)
          .toFormat(ext)
          .jpeg({ quality: 95 }) // 90% of its quality
          .toFile(`upload/products/${imageFileName}`); // save it in this path by this file name
        // append the imageCoverName filed to the req.body to be saved into the db through the create controller
        // as it considered a required field so it must be appended to req.body to pass from validation layer
        productImagesArray.push(imageFileName);
        req.body.images = productImagesArray;
      })
    );
  }
  next();
});

// @desc Create anew products
// @route Post /products
// Access Private/Admin-Manager
exports.createProduct = asyncHandler(async (req, res, next) => {
  // append slug title field to the req body, this can be make in validation layer by custom method
  req.body.slug = slugify(req.body.title);
  var newProduct = new Product(req.body);
  const product = await newProduct.save();
  return res.status(201).json({ data: product });
});

// @desc Get all products
// @route Get /products
// Access Public
exports.getAllProducts = asyncHandler(async (req, res, next) => {
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

  let productsQuery = Product.find(JSON.parse(filterObjStr)).populate({
    path: "category",
    select: "name",
  });

  // 2- Pagination setup
  let page = req.query.page * 1 || 1; // convert to num by *1
  let limit = req.query.limit * 1 || 50; // number of returned docs per page
  let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
  let endIndex = page * limit; // last index of doc in the page
  let allDocumentsNum = await Product.countDocuments(); // all document that matched with the filtered result

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

  productsQuery = productsQuery.skip(skip).limit(limit);

  // 4- Check for sorting option
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    console.log(sortBy);
    productsQuery = productsQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
  } else {
    productsQuery = productsQuery.sort("createdAt"); // default setting for sorting based on adding date
  }

  // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",").join(" ");

    /*
in the selectedFields, if you write the fields as 
"title slug price" >> hence these fields only will be return with the obj beside id field
"-title -slug" >> hence all fields will be return except these fields 
   */
    productsQuery = productsQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
  } else {
    productsQuery = productsQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
  }

  // 6- Checks for searching with specific keyword to be compared/matched with either title or description
  if (req.query.keywords) {
    const query = {}; // {$or:[ { title: { $regex: req.query.keywords, $options: "i" } },{ description: { $regex: req.query.keywords, $options: "i" } }]}
    query.$or = [
      { title: { $regex: req.query.keywords, $options: "i" } },
      { description: { $regex: req.query.keywords, $options: "i" } },
    ];
    productsQuery = productsQuery.find(query);
    /* 
    find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                  { description: { $regex: req.query.keywords, $options: "i" } },]}) 
     */
  }

  // 7- Execute query
  const products = await productsQuery;

  res
    .status(200)
    .json({ results: products.length, paginationResult, data: products });
  if (!products) {
    const errObj = new ApiError(`No products are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get specific product
// @route Get  /products/:id
// Access Public
exports.getProductById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id).populate({
    path: "category reviews", // reviews is not existed in model but its a virtual field in the model
    select: "name",
  });
  if (product) {
    return res.status(200).json({ data: product });
  }
  // res.status(404).json({ message: `Product with id: ${id} is not found!` });
  const errObj = new ApiError(`Product with id: ${id} is not found!`, 404);
  return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific product
// @route Put  /products/:id
// Access Private/Admin-Manager
exports.updateProductById = asyncHandler(async (req, res, next) => {
  // while updating, if title existed in the req.body, append slug title field to the req body
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true } // return the new product, if new : false(default), the old product will be returnd
  );
  // checks for the product updating
  if (!product) {
    // return res.status(404).json({ message: `Product with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `Product with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "Product is updated successfully", data: product });
});

// @desc Delete specific product
// @route Delete  /products/:id
// Access Private/Admin
exports.deleteProductById = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    // return res
    //   .status(404)
    //   .json({ message: `Product with id: ${id} is not found! to be deleted` });
    const errObj = new ApiError(
      `Product with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "Product is deleted successfully", data: product });
  // res.status(204).send(); // that means the delete process is done and there is no content
});


