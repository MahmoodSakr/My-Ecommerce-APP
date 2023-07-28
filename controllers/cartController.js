const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Product = require("../models/productModel");

// @desc Add product to login user cart
// @route Post /Carts
// Access Private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  // get the product details which will be added to the cart
  const productId = req.body.product;
  const product = await Product.findById(productId);
  const price = product.price;
  const quantity = req.body.quantity || 1;
  const color = req.body.color;

  // check for the Cart existance for the current login user
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    // create a new cart for the login user
    cart = new Cart({
      cartItems: [{ product: productId, price, quantity, color }],
      user: req.user._id,
    });
    console.log("A new cart has been added to the logined user.", cart);
  } else {
    // the logined user has already cart
    // check if the added product is existed before in the currrent login user cartItems
    const productItemObjIndex = cart.cartItems.findIndex((productItemObj) => {
      return (
        productItemObj.product.toString() == productId &&
        productItemObj.color == color
      );
    });
    // if true, update its qunatity
    if (productItemObjIndex > -1) {
      cart.cartItems[productItemObjIndex].quantity += req.body.quantity || 1;
    }
    // if not, add this product as a new item to the existing cart
    else {
      cart.cartItems.push({ product: productId, price, quantity, color });
    }
  }
  // calculate the total products price in the cart items
  cart.totalItemsPrice = CalculateTotalItemsPrice(cart);
  cart.totalItemsPriceAfterDiscount = undefined;
  await cart.save();
  res.status(201).json({ data: cart });
});

const CalculateTotalItemsPrice = function (cart) {
  let totalItemsPrice = 0;
  cart.cartItems.forEach((productItemObj) => {
    totalItemsPrice += productItemObj.price * productItemObj.quantity;
  });
  return totalItemsPrice.toFixed(2);
};

// @desc Get lgoin user cart
// @route Get /Carts
// Access Private/User
exports.getLoginUserCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    return res.status(200).json({
      user: req.user._id,
      cartItemsNumber: cart.cartItems.length,
      data: cart,
    });
  }
  return res.status(404).json({
    message: `There is no cart for this user with id: ${req.user._id}!`,
  });
  // const errObj = new ApiError(
  //   `There is no cart for this user with id: ${req.user._id}!`,
  //   404
  // );
  // next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Delete productItem from the login user cart
// @route Delete /carts/:ItemId
// Access Private/User
exports.deleteItemFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { cartItems: { _id: req.params.itemId } } }, // delete the Item obj which its _id: req.params.ItemId from the login user cart array if it existed before
    { new: true }
  );

  if (!cart) {
    const errObj = new ApiError(
      `This Item with id: ${req.params.itemId} is not found in the login user cart items!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }

  // re-calculate the total products price in the cart items after delete the given item
  cart.totalItemsPrice = CalculateTotalItemsPrice(cart);
  cart.totalItemsPriceAfterDiscount = undefined;
  cart = await cart.save();

  res.status(200).json({
    mess: `ItemId with id ${req.params.itemId} has been deleted from the login user cart.`,
    userId: req.user._id,
    cartItemsNumber: cart.cartItems.length,
    data: cart,
  });
});

// @desc Delete login user cart
// @route Delete /carts/
// Access Private/User
exports.deleteLoginUserCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndDelete({ user: req.user._id });
  if (!cart) {
    const errObj = new ApiError(
      `No cart is existed for the user with id ${req.user._id}.`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({
    mess: `The cart of the user ${req.user._id} has been deleted successfully.`,
    userId: req.user._id,
    data: cart,
  });
});

// @desc Get all Carts of all user
// @route Get /Carts/all
// Access Private/Manager-Admin
exports.getAllCarts = asyncHandler(async (req, res, next) => {
  const carts = await Cart.find({});
  if (carts) {
    return res.status(200).json({ results: carts.length, data: carts });
  }
  const errObj = new ApiError(`No Carts are founded!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Get specific Cart
// @route Get /Carts/:id
// Access Private/Manager-Admin
exports.getCartById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const cart = await Cart.findById(id);
  if (cart) {
    return res.status(200).json({ data: cart });
  }
  // res.status(404).json({ message: `Cart with id: ${id} is not found!` });
  const errObj = new ApiError(`Cart with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific cart item quantity
// @route Put /Carts/:itemId
// Access Private/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id });
  // checks for the cart existance
  if (!cart) {
    // return res.status(404).json({ message: `cart with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `No cart is founded for this user with id ${req.user._id}`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }

  // check for the existance of the item obj in the logined user cartItems before updating its qunatity
  const itemIndex = cart.cartItems.findIndex((itemObj) => {
    return itemObj.id.toString() == req.params.itemId;
  });
  if (itemIndex == -1) {
    return next(
      new ApiError(
        `There is no item with this id ${req.params.itemId} in the user cart!`,
        404
      )
    );
  }
  // update the item with the provided quantity
  cart.cartItems[itemIndex].quantity = req.body.quantity;

  // re-calculate the total products price in the cart items after update the quantity
  cart.totalItemsPrice = CalculateTotalItemsPrice(cart);
  cart.totalItemsPriceAfterDiscount = undefined;
  cart = await cart.save();

  res.status(200).json({
    mess: `Quantity of the Item with id ${req.params.itemId} has been updated successfully.`,
    userId: req.user._id,
    data: cart,
  });
});

// @desc Delete specific Cart
// @route Delete /Carts/:id
// Access Private/Admin-Manager
exports.deleteCartById = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const cart = await Cart.findByIdAndDelete(id);
  if (!cart) {
    const errObj = new ApiError(
      `cart with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({ mess: "cart is deleted successfully", data: cart });
  // res.status(204).send(); // that means the delete process is done and there is no content
});

// @desc Apply specific Coupon
// @route Delete /Carts/applyCoupon/
// Access Private/user
exports.applyCouponToCart = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findOne({
    name: req.body.couponName.toUpperCase().trim(),
  });
  console.log("coupon name", req.body.couponName.toUpperCase().trim());
  // if coupon is not existed
  if (!coupon) {
    const errObj = new ApiError(
      `Coupon with name: ${req.body.couponName} does not exist`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  // if coupon is existed but expired
  if (coupon.expired < new Date()) {
    const errObj = new ApiError(
      `Coupon with name: ${req.body.couponName} is expired`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  // coupon is valid
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    const errObj = new ApiError(
      `Cart for the login user with id: ${req.user._id} is not existed`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  // card is existed , apply coupon
  cart.totalItemsPriceAfterDiscount = (
    cart.totalItemsPrice - coupon.discount
  ).toFixed(2);
  await cart.save();
  return res
    .status(200)
    .json({ user: req.user._id, couponDiscount: coupon.discount, data: cart });
});
