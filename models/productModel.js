const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title must be filled"],
      trim: true,
      minLength: [3, "Too short Product description"],
      maxLength: [100, "Too long Product description"],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product descriptipn must be filled"],
      minLength: [3, "Too Short Product descriptipn !"],
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity must be filled"],
    },
    sold: {
      type: Number,
      required: [true, "Product sold number must be filled"],
      min: [0.0, "Product sold numbers must be equal or greater than 0"],
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Product price must be filled"],
      min: [0.0, "Product price must be greater than 0"],
      max: [2000000, "Product price must be greater than 0"],
      trim: true,
    },
    priceAfterDiscount: {
      type: Number,
      min: [0.0, "Product after discount price must be greater than 0"],
      trim: true,
    },

    colors: [String],

    imageCover: {
      type: String,
      required: [true, "Product image cover must be specified"],
    },
    images: [String],
    category: {
      // this field represent the category Id
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Product must be belong to the a Category"],
    },
    subcategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "SubCategory",
      },
    ],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: "Brand",
    },
    ratingAverage: {
      // Avg of the product ratings
      type: Number,
      default: 0,
      min: [0, "Product Rating Average must be greater than or equal to 0"],
      max: [5, "Product Rating Average must be less than or equal to 5"],
    },
    ratingQuantity: {
      // How many users rate this product
      type: Number,
      default: 0,
      min: [0, "Product Rating quantity must be greater than or equal to 0"],
    },
    // this equals to create that field as virtual field as shown below
    /*  reviews: [{
      type: mongoose.Schema.ObjectId,
      ref: "Review",
    }],*/
  },
  {
    timestamps: true,
    // to enable populate with virtual fields in this model
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate
/* create virtual field called reviews [] on Product Model to store on it all reviews from Review model 
per each product id where Review.product = product._id */
// this virtual reviews filed you can make a populate on it when using find() query
ProductSchema.virtual("reviews", {
  // reviews is name of virtual filed
  ref: "Review", // Review Model (Name of other Model)
  foreignField: "product", // Review.product ( the id field inside the other Model)
  localField: "_id", // product._id ( the id field inside this main Model)
});

/* Inti middleware works only with Find, Update and not with Create
Edit the document post/after initialized it in the DB by post mongoose middleware and append the 
server url to its prefix to helps us serve the images from static folder by its name
you can edit any field of this object when you get it by its id  
but this field must be existed in the db already, if not, no change will be done 

Edit the fields of the saved doc object as your like to be as you edited when you find/search for it
*/
ProductSchema.post("init", (Productdocument) => {
  setImageUrl(Productdocument);
});
// to make the last process working with the create process
ProductSchema.post("save", (Productdocument) => {
  setImageUrl(Productdocument);
});

const setImageUrl = (Productdocument) => {
  if (Productdocument.imageCover) {
    const imageUrl = `${process.env.BASE_URL}/products/${Productdocument.imageCover}`;
    Productdocument.imageCover = imageUrl; // edit it to shown in the doc obj
  }
  if (Productdocument.images) {
    Productdocument.images.forEach((arrImageItem, index) => {
      const imageUrl = `${process.env.BASE_URL}/products/${arrImageItem}`;
      Productdocument.images[index] = imageUrl; // edit it to shown in the doc obj
    });
  }
};

module.exports = mongoose.model("Product", ProductSchema);
