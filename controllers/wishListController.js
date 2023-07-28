const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const Product = require("../models/productModel");
const User = require("../models/userModel");

// @desc Add Product to wishList
// @route Post /wishList
// Access Private/Protect/User
exports.addProductToWishList = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishList: req.body.productId } }, // add the product id to the wish list array if not existed before
    { new: true }
  );

  if (!user) {
    // return res.status(404).json({ message: `review with id: ${req.user._id} is not found! to be updated` });
    const errObj = new ApiError(
      `User with id: ${req.user._id} is not found!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `User wishlist has added the product id ${req.body.productId}.`,
    data: user,
  });
});

// @desc Get all Products from Logged User WishList
// @route Get /wishList
// Access Private/Protect/User
exports.getUserWishList = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("wishList");
  if (!user) {
    // return res.status(404).json({ message: `review with id: ${req.user._id} is not found! to be updated` });
    const errObj = new ApiError(
      `User with id: ${req.user._id} is not found!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({ results: user.wishList.length, data: user });
});

// @desc Delete Product Id From WishList
// @route Delete /wishList/:id
// Access Private/Protect/User
exports.deleteProductFromWishList = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishList: req.params.productId } }, // delete the product id from the wish list array if it existed before
    { new: true }
  );
  if (!user) {
    // return res.status(404).json({ message: `review with id: ${req.user._id} is not found! to be updated` });
    const errObj = new ApiError(
      `User with id: ${req.user._id} is not found!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `User wishlist has deleted the product id ${req.params.productId}.`,
    data: user,
  });
});
