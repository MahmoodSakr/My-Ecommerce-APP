const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// This model represent the admin/non admin user data fields
// You will create two controller above this one for admin (UserController) and the other for user (authController)
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "User Name is required!"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "User Password is required!"],
      minLength: [3, "Password must be between 3 and 30 characters"],
      //   select: false,  if you want to prevent the password from being returned with the responce
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpirationTime: Date,
    passwordResetVerified: Boolean,
    email: {
      type: String,
      required: [true, "User Email is required!"],
      trim: true,
      unique: [true, "User Email must be unique!"],
      lowercase: true,
    },
    phone: String,
    active: {
      type: Boolean,
      default: true,
    },
    profileImage: String,
    role: {
      type: String,
      enum: ["admin", "manager", "user"],
      default: "user",
    },
    // child ref for product inside the User model - One > Many
    wishList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    addresses: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId }, // will be generated Automatically
        alias: String,
        city: String,
        details: String,
        phone: String,
        postalCode: String,
      },
    ],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  // the object/document before saved to the db is presented by this object

  // if the password is not modified don't hashing it again and waste time and space
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12); // 10 is the salt : the powerful of pass hashing
  next(); // go to the next middleware
});

module.exports = mongoose.model("User", UserSchema);
