const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Order must be belong to the user!"],
    },
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
    taxPrice: {
      type: Number,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    totalOrderPrice: Number,
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    shippingAddress: {
      alias: String,
      city: String,
      details: String,
      phone: String,
      postalCode: String,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliverdAt: Date,
  },
  { timestamps: true } // create two fields createdAt, updatedAt
);

orderSchema.pre(/find/, function (next) {
  this.populate({
    path: "user",
    select: "name profileImage email phone",
  }).populate({
    path: "cartItems.product",
    select: "title imageCover ratingQuantity",
  });
  next();
});

module.exports = mongoose.model("Order", orderSchema);
