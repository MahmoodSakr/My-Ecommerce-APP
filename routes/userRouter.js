const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  updateLoginedUserPasswordValidator,
  updateUserPasswordValidator,
  updateLoginedUserDataValidator,
  deleteUserValidator,
} = require("../utils/Validator/userValidator");

// This will apply to all below routes
// to check whether the user is authenticated or not
router.use(authController.protect);

// This route for the loggined User
router.get(
  "/getMe",
  userController.getLoggedUserData,
  userController.getUserById
);
router.put(
  "/updateMyPassword",
  updateLoginedUserPasswordValidator,
  userController.updateLoggedUserPassword
);
router.put(
  "/updateMe",
  updateLoginedUserDataValidator,
  userController.updateLoggedUserData
);
router.put("/deactivateMe", userController.deactivateLoggedUserData);

// This will apply to all below routes
// to check whether the user is authorized or not
router.use(authController.isAllowedTo("admin", "manager"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(
    userController.uploadUserImgMiddleware,
    userController.resizeImgMiddleware,
    createUserValidator,
    userController.createUser
  );

router.put(
  "/changePassword/:id",
  updateUserPasswordValidator,
  userController.updateUserPassword
);

router
  .route("/:id")
  .get(getUserValidator, userController.getUserById)
  .put(
    userController.uploadUserImgMiddleware,
    userController.resizeImgMiddleware,
    updateUserValidator,
    userController.updateUserById
  )
  .delete(deleteUserValidator, userController.deleteUserBbyId);

module.exports = router;
