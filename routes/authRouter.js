const express = require("express");
const router = express.Router();

const {
  signUpValidator,
  loginValidator,
  forgetPasswordValidator,
  verifyPasswordResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/Validator/authValidator");

const authController = require("../controllers/authController");

router.post("/signup", signUpValidator, authController.signUp);
router.post("/login", loginValidator, authController.login);
router.post(
  "/forgetPassword",
  forgetPasswordValidator,
  authController.forgetPassword
);
router.post(
  "/verifyPasswordResetCode",
  verifyPasswordResetCodeValidator,
  authController.verifyPasswordResetCode
);

router.put(
  "/resetPassword",
  resetPasswordValidator,
  authController.resetPassword
);

module.exports = router;