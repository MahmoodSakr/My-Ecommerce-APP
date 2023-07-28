const mongoose = require("mongoose");
const subCategorySchema = mongoose.Schema(
  {
    name: {
      type: "string",
      trim: true,
      unique: [true, "SubCategory name must be unique"],
      minLength: [2, "Too short SubCategory name"],
      maxLength: [100, "Too long SubCategory name"],
    },
    slug: {
      type: "string",
      lowercase: true,
    },
    category: { // this field represent the category Id
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "SubCategory must be belong to the parent Category"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubCategory", subCategorySchema);
