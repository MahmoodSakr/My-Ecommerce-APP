const { check } = require("express-validator"); // Check = param, body, query
const globalValidatorHandler = require("../../middlewares/globalValidatorHandler");

/*
    "addressId" : id
    "alias": "Home",
    "city": "Nasr City",
    "details": "String",
    "phone": "01000169891",
    "postalCode": "32927"
*/

exports.addUserAddressValidator = [
  check("alias")
    .notEmpty()
    .withMessage("alias of the address is not specified")
    .custom(async (value, { req }) => {
      // ensure that the alais is not existed before for the logined user
      req.user.addresses.forEach((address) => {
        if (address.alias == value) {
          throw new Error(
            "Address alias for this user is already registered before!"
          );
        }
      });
      return true;
    }),
  check("city").notEmpty().withMessage("City of the address is not specified"),
  check("details")
    .notEmpty()
    .withMessage("details of the address is not specified"),
  check("phone")
    .notEmpty()
    .withMessage("User phone is not specified")
    .isMobilePhone(["ar-EG", "ar-SA"]) // Mobile phone local >> countries
    .withMessage("Egyptian or Sudian User's Phone number is not valid!"),
  check("postalCode")
    .notEmpty()
    .withMessage("PostalCode of the address is not specified")
    .matches(/^\d{5}$/)
    .withMessage("PostalCode is not valid!")
 , globalValidatorHandler,
];

exports.deleteUserAddressValidator = [
  check("addressId")
    .notEmpty()
    .withMessage("id of the address is not specified")
    .isMongoId()
    .withMessage("Invalid addressId Format!"),
  globalValidatorHandler,
];
