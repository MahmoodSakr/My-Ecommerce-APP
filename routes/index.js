
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

// mount function
const mountRoute = function(app){
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
}

module.exports = mountRoute

