const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const Coupon = require("../models/couponModel");
const User = require("../models/userModel");

// @desc Create a new coupon
// @route Post /coupons
// Access Private/Admin-Manager
exports.createCoupon = asyncHandler(async (req, res, next) => {
  req.body.name = req.body.name.trim().toUpperCase();
  var newCoupon = new Coupon(req.body);
  const coupon = await newCoupon.save();
  res.status(201).json({ data: coupon });
});

// @desc Get all coupons
// @route Get /coupons
// Access Private/Admin-Manager
exports.getAllCoupons = asyncHandler(async (req, res, next) => {
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

  let couponsQuery = Coupon.find(JSON.parse(filterObjStr));
  // 2- Pagination setup
  let page = req.query.page * 1 || 1; // convert to num by *1
  let limit = req.query.limit * 1 || 50; // number of returned docs per page
  let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
  let endIndex = page * limit; // last index of doc in the page
  let allDocumentsNum = await Coupon.countDocuments(); // all document that matched with the filtered result

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

  couponsQuery = couponsQuery.skip(skip).limit(limit);

  // 4- Check for sorting option
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    console.log(sortBy);
    couponsQuery = couponsQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
  } else {
    couponsQuery = couponsQuery.sort("createdAt"); // default setting for sorting based on adding date
  }

  // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",").join(" ");

    /*
in the selectedFields, if you write the fields as 
"title slug price" >> hence these fields only will be return with the obj beside id field
"-title -slug" >> hence all fields will be return except these fields 
   */
    couponsQuery = couponsQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
  } else {
    couponsQuery = couponsQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
  }

  // 6- Checks for searching with specific keyword to be compared/matched with name
  if (req.query.keywords) {
    let query = { name: { $regex: req.query.keywords, $options: "i" } };
    couponsQuery = couponsQuery.find(query);
    /* 
    find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                  { description: { $regex: req.query.keywords, $options: "i" } },]}) 
     */
  }

  // 7- Execute query
  const coupons = await couponsQuery;
  res
    .status(200)
    .json({ results: coupons.length, paginationResult, data: coupons });
  if (!coupons) {
    const errObj = new ApiError(`No coupons are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get specific coupon
// @route Get /coupons/:id
// Access Private/Admin-Manager
exports.getCouponById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const coupon = await Coupon.findById(id);
  if (coupon) {
    return res.status(200).json({ data: coupon });
  }
  // res.status(404).json({ message: `coupon with id: ${id} is not found!` });
  const errObj = new ApiError(`coupon with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific coupon
// @route Put /coupons/:id
// Access Private/Admin-Manager
exports.updateCouponById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const coupon = await Coupon.findByIdAndUpdate(
    id,
    req.body,
    { new: true } // return the new coupon, if new : false(default), the old coupon will be returnd
  );
  // checks for the coupon updating
  if (!coupon) {
    // return res.status(404).json({ message: `coupon with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `coupon with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "coupon is updated successfully", data: coupon });
});

// @desc Delete specific coupon
// @route Delete /coupons/:id
// Access Private/Admin-Manager
exports.deleteCouponById = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    const errObj = new ApiError(
      `coupon with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res
    .status(200)
    .json({ mess: "coupon is deleted successfully", data: coupon });
  // res.status(204).send(); // that means the delete process is done and there is no content
});
