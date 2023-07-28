const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");
const User = require("../../models/userModel");
const bcrypt = require("bcryptjs");

exports.createUserValidator = [
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
  check("profileImage").optional(),
  check("role").optional(),
  globalValidatorHandler,
];

exports.updateUserValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the User is not specified")
    .isMongoId()
    .withMessage("Invalid User Id Format!"),
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("User name must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("User name must be less than 35 chars"),
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
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"]) // Mobile phone local >> countries
    .withMessage("Egypt or Sudia Phone number is not valid!"),
  globalValidatorHandler,
];

exports.updateUserPasswordValidator = [
  check("id")
    .notEmpty()
    .withMessage("User id must be existed")
    .isMongoId()
    .withMessage("Invalid user id"),
  check("currentPassword")
    .notEmpty()
    .withMessage("Current password is required!")
    .isLength({ min: 6 })
    .withMessage("Current Password must be at least 6 chars")
    .custom(async (value, { req }) => {
      // validate the user with given id param
      const userObj = await User.findById(req.params.id);
      if (!userObj) {
        throw new Error("User does not exist for the given password!");
      }
      // match the provided current non hashed password with the existed hashed user password in db
      const isMatched = await bcrypt.compare(value, userObj.password);
      if (!isMatched) {
        throw new Error(
          "The given current password for this user id is not correct!"
        );
      }
      return true;
    }),
  check("newPassword")
    .notEmpty()
    .withMessage("New password is required!")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 chars"),
  check("password_confirm")
    .notEmpty()
    .withMessage("confirmPassword password is required!")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm New Passowrd Does Not Match");
      }
      return true;
    }),
  globalValidatorHandler,
];

exports.updateLoginedUserPasswordValidator = [
  check("newPassword")
    .notEmpty()
    .withMessage("New password is required!")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 chars"),
  check("passwordConfirmation")
    .notEmpty()
    .withMessage("confirmPassword password is required!")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm New Passowrd Does Not Match");
      }
      return true;
    }),
  globalValidatorHandler,
];
exports.updateLoginedUserDataValidator = [
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("User name must be more than 3 chars")
    .isLength({ max: 35 })
    .withMessage("User name must be less than 35 chars"),
  check("email")
    .notEmpty()
    .withMessage("Email must be filled!")
    .isEmail()
    .withMessage("Email must be correctly writen"),
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"]) // Mobile phone local >> countries
    .withMessage("Egypt or Sudia Phone number is not valid!"),
  globalValidatorHandler,
];

exports.getUserValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the User is not specified")
    .isMongoId()
    .withMessage("Invalid User Id Format!"),
  globalValidatorHandler,
];

exports.deleteUserValidator = [
  check("id")
    .notEmpty()
    .withMessage("id of the User is not specified")
    .isMongoId()
    .withMessage("Invalid User Id Format!"),
  globalValidatorHandler,
];
