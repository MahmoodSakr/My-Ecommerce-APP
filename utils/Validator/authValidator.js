const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");
const User = require("../../models/userModel");

// in auth validator all reb body field we need to validate are name,password,email as this user
// will be a normal user, if you need to convert this user to admin, update his data from db

exports.signUpValidator = [
  check("name")
    .notEmpty()
    .withMessage("User name must be filled!")
    .isLength({ min: 3 })
    .withMessage("User name must be more than 3 chars")
    .isLength({ max: 150 })
    .withMessage("User name must be less than 150 chars"),
  check("email")
    .notEmpty()
    .withMessage("Email must be filled!")
    .isEmail()
    .withMessage("Email must be correctly writen")
    .custom(async (value) => {
      const userObj = await User.findOne({ email: value });
      if (userObj) {
        // return Promise.reject(
        //   new Error("Email is existed before, it must be unique")
        // );
        throw new Error("Email is existed before, it must be unique");
      } else {
        return true;
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 chars"),
  check("password_confirm")
    .notEmpty()
    .withMessage("Password confirmation must be required!")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation isn't matched!");
      }
      return true; // to continue the other validations
    }),
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"]) // Mobile phone local >> countries
    .withMessage("Egypt or Sudia Phone number is not valid!"),
  globalValidatorHandler,
];

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email must be filled!")
    .isEmail()
    .withMessage("Email must be correctly writen"),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 chars"),
  globalValidatorHandler,
];

exports.forgetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email must be provided!")
    .isEmail()
    .withMessage("Email format must be correct!"),

  globalValidatorHandler,
];

exports.verifyPasswordResetCodeValidator = [
  check("passwordResetCode")
    .notEmpty()
    .withMessage("passwordResetCode must be provided!")
    .custom((value) => {
      if (`${value}`.length > 6) {
        throw new Error("Password ResetCode must be 6 digit!");
      }
      return true;
    }),
  globalValidatorHandler,
];

exports.resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email must be provided!")
    .isEmail()
    .withMessage("Email format must be correct!"),
  check("newPassword")
    .notEmpty()
    .withMessage("New Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 chars"),
  check("passwordConfirmation")
    .notEmpty()
    .withMessage("New Password confirmation must be required!")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New Password confirmation isn't matched!");
      }
      return true; // to continue the other validations
    }),
  globalValidatorHandler,
];
