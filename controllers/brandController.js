const Brand = require("../models/brandModel");
const slugify = require("slugify");
const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { uploadSingleImage } = require("../middlewares/uploadImage");

// Upload Image config
exports.uploadBrandImgMiddleware = uploadSingleImage("image");
exports.resizeImgMiddleware = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const ext = "jpeg";
    const filename = `brand-${uuidv4()}-${Date.now()}.${ext}`;
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat(ext)
      .jpeg({ quality: 90 }) // 90% of its quality
      .toFile(`upload/brands/${filename}`);
    // append the image file name to the req.body as this will be saved onto the db on the create controller
    req.body.image = filename;
  }
  next();
});

// @desc Create anew brand
// @route Post /brands
// Access Private/Admin-Manager
exports.createBrand = asyncHandler(async (req, res, next) => {
  const name = req.body.name;
  const image = req.body.image; // image name
  req.body.slug = slugify(name); // will make this pattern A B >> A-B
  var newBrand = new Brand(req.body);
  const brand = await newBrand.save();
  res.status(201).json({ data: brand });
});

// @desc Get all brands
// @route Get  /brands
// Access Public
exports.getAllBrands = asyncHandler(async (req, res, next) => {
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

  let brandsQuery = Brand.find(JSON.parse(filterObjStr));
  // 2- Pagination setup
  let page = req.query.page * 1 || 1; // convert to num by *1
  let limit = req.query.limit * 1 || 50; // number of returned docs per page
  let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
  let endIndex = page * limit; // last index of doc in the page
  let allDocumentsNum = await Brand.countDocuments(); // all document that matched with the filtered result

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

  brandsQuery = brandsQuery.skip(skip).limit(limit);

  // 4- Check for sorting option
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    console.log(sortBy);
    brandsQuery = brandsQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
  } else {
    brandsQuery = brandsQuery.sort("createdAt"); // default setting for sorting based on adding date
  }

  // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",").join(" ");

    /*
in the selectedFields, if you write the fields as 
"title slug price" >> hence these fields only will be return with the obj beside id field
"-title -slug" >> hence all fields will be return except these fields 
   */
    brandsQuery = brandsQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
  } else {
    brandsQuery = brandsQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
  }

  // 6- Checks for searching with specific keyword to be compared/matched with name
  if (req.query.keywords) {
    let query = { name: { $regex: req.query.keywords, $options: "i" } };
    brandsQuery = brandsQuery.find(query);
    /* 
    find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                  { description: { $regex: req.query.keywords, $options: "i" } },]}) 
     */
  }

  // 7- Execute query
  const brands = await brandsQuery;
  res
    .status(200)
    .json({ results: brands.length, paginationResult, data: brands });
  if (!brands) {
    const errObj = new ApiError(`No brands are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get specific brand
// @route Get  /brands/:id
// Access Public
exports.getBrandById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const brand = await Brand.findById(id);
  if (brand) {
    return res.status(200).json({ data: brand });
  }
  // res.status(404).json({ message: `Brand with id: ${id} is not found!` });
  const errObj = new ApiError(`Brand with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific brand
// @route Put  /brands/:id
// Access Private/Admin-Manager
exports.updateBrandById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
  }

  const brand = await Brand.findByIdAndUpdate(
    id,
    req.body,
    { new: true } // return the new brand, if new : false(default), the old brand will be returnd
  );
  // checks for the brand updating
  if (!brand) {
    // return res.status(404).json({ message: `Brand with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `Brand with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({ mess: "Brand is updated successfully", data: brand });
});

// @desc Delete specific brand
// @route Delete  /brands/:id
// Access Private/Admin
exports.deleteBrandBbyId = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) {
    // return res
    //   .status(404)
    //   .json({ message: `Brand with id: ${id} is not found! to be deleted` });
    const errObj = new ApiError(
      `Brand with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({ mess: "Brand is deleted successfully", data: brand });
  // res.status(204).send(); // that means the delete process is done and there is no content
});
