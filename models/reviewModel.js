const mongoose = require("mongoose");
const Product = require("./productModel");

const reviewSchema = new mongoose.Schema(
  {
    title: { type: String },
    slug: {
      type: String,
      lowercase: true,
    },
    rating: {
      required: [true, "Review rating must provided"],
      type: Number,
      min: [1, "Ratining value must be at least 1"],
      max: [5, "Ratining value must be at most 5"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belongs to User"],
    },
    // Parent ref for product inside the Review model - Many > One
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belongs to Product"],
    },
  },
  { timestamp: true }
);

// populate the user id field to represrent and show the full/specific details of the user data
reviewSchema.pre(/^find/, function (next) {
  // this mimcs the find query itself
  // the id fields are space separared as well as the fields to be selected to shown are space separated not comma
  this.populate({ path: "user product", select: "name role" });
  next();
});

reviewSchema.statics.calculate_AvgRating_Quantity = async function (productId) {
  console.log("calculate_AvgRating_Quantity fun - with product id ", productId);

  // create aggregate pipeline stages on the Review model
  const results = await this.aggregate([
    // stage 1: get all products document with the given id
    { $match: { product: productId } },
    // stage 2: group all matched documents based on the product id and calculate their avgRating and ratingQunatity
    {
      $group: {
        _id: "product", // _id is the product field in the Product model, product is the id field in Review model
        avgRating: { $avg: "$rating" }, // avgRating is a variable, rating is a field in Review model
        ratingQantity: { $sum: +1 }, // ratingQantity is a field in Product model
      },
    },
  ]);
  console.log("results arr", results);

  // update the product collections based on the result arr result
  let updatedProduct = {};
  if (results.length > 0) {
    updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        ratingAverage: results[0].avgRating,
        ratingQuantity: results[0].ratingQantity,
      },
      { new: true }
    );
  } else {
    updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        ratingAverage: 0,
        ratingQuantity: 0,
      },
      { new: true }
    );
  }
  console.log("updatedProduct ", updatedProduct);
};
// this event will be triggered to execute the calculate_AvgRating_Quantity function after each review creating/updating
reviewSchema.post("save", function (productDoc) {
  let productId;
  if (productDoc.product._id) {
    productId = productDoc.product._id;
  } else {
    productId = productDoc.product;
  }
  console.log("create/update event with product id:", productId);
  this.constructor.calculate_AvgRating_Quantity(productId);
});

// this event will be triggered to execute the calculate_AvgRating_Quantity function after each review removing
reviewSchema.post("remove", function (productDoc) {
  console.log("inside remove event");
  let productId;
  if (productDoc.product._id) {
    productId = productDoc.product._id;
  } else {
    productId = productDoc.product;
  }
  console.log("remove event with product id:", productId);
  this.constructor.calculate_AvgRating_Quantity(productId);
});
const ReviewModel = mongoose.model("Review", reviewSchema);

module.exports = ReviewModel;
