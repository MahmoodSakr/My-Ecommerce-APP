const express = require("express");

// routes
const authRouter = require("./authRouter");
const userRouter = require("./userRouter");
const categoryRouter = require("./categoryRouter");
const subCategoryRouter = require("./subCategoryRouter");
const brandRouter = require("./brandRouter");
const productRouter = require("./productRouter");
const reviewRouter = require("./reviewRouter");
const wishListRouter = require("./wishListRouter");
const addressRouter = require("./addressRouter");
const couponRouter = require("./couponRouter");
const cartRouter = require("./cartRouter");
const orderRouter = require("./orderRouter");
const { webHookCheckout } = require("../controllers/orderController");
const globalErrorHandler = require("../middlewares/globalErrorHandler");
const ApiError = require("../utils/ApiError");

// mount function
const mountRoute = function (app) {
  app.use("/auth", authRouter);
  app.use("/users", userRouter);
  app.use("/categories", categoryRouter);
  app.use("/subcategories", subCategoryRouter);
  app.use("/brands", brandRouter);
  app.use("/products", productRouter);
  app.use("/reviews", reviewRouter);
  app.use("/wishList", wishListRouter);
  app.use("/address", addressRouter);
  app.use("/coupons", couponRouter);
  app.use("/carts", cartRouter);
  app.use("/orders", orderRouter);
  app.post(
    "/webhook-checkout",
    express.raw({ type: "application/json" }),
    webHookCheckout
  );
  // error middleware - global error handler (unregistered routes)
  app.all("*", (req, res, next) => {
    /* Instead of create a manually error obj, you can create a class inherit Error class with your error setup
      const err = new Error(`This url is not founded ${req.originalUrl}`);
      next(err.message); // pass this error with its message to the error handling middleware 
      */
    const errObj = new ApiError(
      `This url is not founded ${req.originalUrl}`,
      404
    );
    next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  });
  // global error handling middleware to handle only the errors of express (throwed by you or by interpreter)
  // and customize it on your logic before send the responce to the client side
  app.use(globalErrorHandler);
};

module.exports = mountRoute;
