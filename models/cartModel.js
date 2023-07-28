const mongoose = require("mongoose");
const { Schema } = mongoose;
const couponSchema = new Schema(
  {
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        color: String,
        price: Number,
      },
    ],
    totalItemsPrice: Number,
    totalItemsPriceAfterDiscount: Number,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true } // create two fields createdAt, updatedAt
);

module.exports = mongoose.model("Cart", couponSchema);
