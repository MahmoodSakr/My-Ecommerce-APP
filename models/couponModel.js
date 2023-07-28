const mongoose = require("mongoose");
const { Schema } = mongoose;
const couponSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Coupon name must be provided"],
      unique: [true, "Coupon name must be unique"],
    },
    expired: {
      type: Date,
      required: [true, "Coupon expired date must be provided"],
    },
    discount: {
      type: String,
      required: [true, "Coupon discount value must be provided"],
    },
  },
  { timestamps: true } // create two fields createdAt, updatedAt
);

module.exports = mongoose.model("Coupon", couponSchema);
