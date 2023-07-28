const Review = require("../models/reviewModel");
const slugify = require("slugify");
const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");

// @desc Create anew review
// @route Post /reviews
// @desc Create anew review under specific product id
// @route Post /products/:id/reviews
// Access Private/Protect/User
exports.createReview = asyncHandler(async (req, res, next) => {
  if (req.body.title) {
    req.body.slug = slugify(req.body.title); // will make this pattern A B >> A-B
  }
  var newReview = new Review(req.body);
  const review = await newReview.save();
  res.status(201).json({ data: review });
});

// @desc Get all review with/without nested route
// @route Get /reviews
// @desc Get all review of a specific product
// @route Get products/id/reviews (nested route)
// Access Public
exports.getAllReviews = asyncHandler(async (req, res, next) => {
  let filterObject = {};

  if (req.params.productId) {
    filterObject = { product: req.params.productId };
  }
  // 1- build initial query to be chained later
  let reviewsQuery = Review.find(filterObject);
  let paginationResult = {};

  // Checks if their are filtering options or not
  if (req.query) {
    console.log("req.query", req.query);

    // 2- Apply Filtering setup
    const queryStringObj = { ...req.query }; // virtual copy without the ref copy
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

    reviewsQuery = reviewsQuery.find(JSON.parse(queryStr));
    // 3- Pagination setup
    let page = req.query.page * 1 || 1; // convert to num by *1
    let limit = req.query.limit * 1 || 50; // number of returned docs per page
    let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
    let endIndex = page * limit; // last index of doc in the page
    let allDocumentsNum = await Review.countDocuments(); // all document that matched with the filtered result

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

    reviewsQuery = reviewsQuery.skip(skip).limit(limit);

    // 4- Check for sorting option
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      console.log(sortBy);
      reviewsQuery = reviewsQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
    } else {
      reviewsQuery = reviewsQuery.sort("createdAt"); // default setting for sorting based on adding date
    }

    // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
    if (req.query.fields) {
      const selectedFields = req.query.fields.split(",").join(" ");

      /*
 in the selectedFields, if you write the fields as 
 "title slug price" >> hence these fields only will be return with the obj beside id field
 "-title -slug" >> hence all fields will be return except these fields 
    */
      reviewsQuery = reviewsQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
    } else {
      reviewsQuery = reviewsQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
    }

    // 6- Checks for searching with specific keyword to be compared/matched with name
    if (req.query.keywords) {
      let query = { name: { $regex: req.query.keywords, $options: "i" } };
      reviewsQuery = reviewsQuery.find(query);
      /* 
     find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                   { description: { $regex: req.query.keywords, $options: "i" } },]}) 
      */
    }
  }
  // 7- Execute the chained query
  const reviews = await reviewsQuery;
  res.status(200).json({
    results: reviews.length,
    paginationResult,
    data: reviews,
  });
  if (!reviews) {
    const errObj = new ApiError(`No reviews are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get specific review
// @route Get  /review/:id
// Access Public
exports.getReviewById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const review = await Review.findById(id);
  if (review) {
    return res.status(200).json({ data: review });
  }
  // res.status(404).json({ message: `Review with id: ${id} is not found!` });
  const errObj = new ApiError(`review with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific review
// @route Put  /review/:id
// Access Private/Protect/User
exports.updateReviewById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const review = await Review.findByIdAndUpdate(
    id,
    req.body,
    { new: true } // return the new review, if new : false(default), the old review will be returnd
  );
  // checks for the review updating
  if (!review) {
    // return res.status(404).json({ message: `review with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `review with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  await review.save(); // to trigger the save event existed in the Review model
  res
    .status(200)
    .json({ mess: "review is updated successfully", data: Review });
});

// @desc Delete specific review
// @route Delete  /review/:id
// Access Private/Protect/Admin-Manager-User
exports.deleteReviewById = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const review = await Review.findByIdAndDelete(id);
  if (!review) {
    // return res
    //   .status(404)
    //   .json({ message: `review with id: ${id} is not found! to be deleted` });
    const errObj = new ApiError(
      `review with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  await review.deleteOne(); // to trigger the remove event existed in the Review model
  res
    .status(200)
    .json({ mess: "review is deleted successfully", data: review });
  // res.status(204).send(); // that means the delete process is done and there is no content
});
