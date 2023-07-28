const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const couponController = require("../controllers/couponController");

const {
  createCouponValidator,
  getCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} = require("../utils/Validator/couponValidator");

// for all routes below
router.use(
  authController.protect, // to check whether the user is authenticated or not
  authController.isAllowedTo("admin", "manager") // to check whether the user is authorized or not
);

router.post("/", createCouponValidator, couponController.createCoupon);

router.get("/", couponController.getAllCoupons);

router.get("/:id", getCouponValidator, couponController.getCouponById);

router.put(
  "/:id",
  updateCouponValidator,
  couponController.updateCouponById
);

router.delete(
  "/:id",
  deleteCouponValidator,
  couponController.deleteCouponById
);

module.exports = router;
