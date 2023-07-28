const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const addressesController = require("../controllers/addressesController");

const {
  addUserAddressValidator,
  deleteUserAddressValidator,
} = require("../utils/Validator/userAddressesValidator");

router.post(
  "/",
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
   addUserAddressValidator,
  addressesController.addUserAddress
);

router.get(
  "/",
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  addressesController.getUserAddresses
);

router.delete(
  "/:addressId",
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("user"), // to check whether the user is authorized or not
  // deleteUserAddressValidator,
  addressesController.deleteUserAddress
);

module.exports = router;
