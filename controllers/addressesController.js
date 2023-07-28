const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const User = require("../models/userModel");

// @desc Add address obj to User addresses array
// @route Post /address
// Access Private/Protect/User
exports.addUserAddress = asyncHandler(async (req, res, next) => {
  // addressId will be generated automatically in the DB
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { addresses: req.body } }, // add the address obj to the addresses array if not existed before
    { new: true }
  );

  if (!user) {
    const errObj = new ApiError(
      `User with id: ${req.user._id} is not found!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `New address has been added to the addresses of the user id ${req.user._id}.`,
    results: user.addresses.length,
    userId: user._id,
    data: user.addresses,
  });
});

// @desc Get all Addresses of Logged User
// @route Get /address/
// Access Private/Protect/User
exports.getUserAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    const errObj = new ApiError(
      `User with id: ${req.user._id} is not found!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    results: user.addresses.length,
    userId: user._id,
    data: user.addresses,
  });
});

// @desc Delete address obj from User addresses array
// @route Delete /address/:addressId
// Access Private/Protect/User
exports.deleteUserAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { addresses: { _id: req.params.addressId } } }, // delete the address obj which has _id: req.params.addressId from the login user addresses array if it existed before
    { new: true }
  );
  if (!user) {
    const errObj = new ApiError(
      `User with id: ${req.user._id} is not found!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `Address with id ${req.params.addressId} has been deleted from the addresses of the user id ${req.user._id}.`,
    results: user.addresses.length,
    userId: user._id,
    data: user.addresses,
  });
});
