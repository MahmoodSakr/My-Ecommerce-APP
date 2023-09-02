const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
var crypto = require("crypto-js");
const sendMail = require("../utils/sendMail");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method

// Authentication is carried on the basis of three processes (Signup, login, protect)

// @desc create new user account (Not admin), so we need only his name, password and email, phone
// @route Post /auth/signup
// Access Public
exports.signUp = asyncHandler(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    phone: req.body.phone,
  });
  // generate a new token for the user
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
  // return the user data and token to be stored in the client side in cookie or local storage
  res.status(201).json({ data: user, token });
});

// @desc Login with user account (Not admin)
// @route Post /auth/login
// Access Public
exports.login = asyncHandler(async (req, res, next) => {
  // Search for the user by his email
  const userObj = await User.findOne({ email: req.body.email });
  // if email para value equals to any true value like "{'$gt':""}" >> it will work -- no sql query injection

  if (!userObj) {
    // return next(new Error("No user is founded with this email!"));
    return next(new ApiError("No user is founded with this email!", 401));
  } else {
    // Checks whether the given password is matched with the stored hashed user password in db
    const isMatched = await bcrypt.compare(req.body.password, userObj.password);
    if (!isMatched) {
      // return next(new Error("Password is not correct!"));
      return next(new ApiError("Password is not correct!", 401));
    }
  }
  // user is authenticated, generate a token for this user
  const token = jwt.sign({ userId: userObj._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
  res.status(200).json({ data: userObj, token });
});

// @desc will be used to check whether the providing user is existed in ur db (authentic) by five test cases
// Access Public
exports.protect = asyncHandler(async (req, res, next) => {
  // 1- Checks for the token existance in headers.authorization
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res
      .status(401)
      .json({ error: "You are not logined/authentic to access this route" });
  }
  // 2- Verifiy if the existed token is tampered (Invalid signature) or expired
  // jwt.verify method raises an error if the token is tampered or expired
  try {
    var decodedPayload = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    res.status(500).json({
      errorName: error.name,
      errorMess: error.message,
    });
  }

  // 3- Ckeck if the id of the user in token payload is still existed as a user in the db or not
  /* Admin may delete the user in anytime and his token is still valid, 
  so dont let him access any routes with his correctly token */

  const currentUser = await User.findById(decodedPayload.userId);
  console.log("currentUser ", currentUser);

  if (!currentUser) {
    res.status(401).json({
      message: "The user belongs to the provided token is not existed in db!",
    });
  }

  // 4- Ckeck if the user is deactived or not
  if (!currentUser.active) {
    res.status(401).json({
      message:
        "This user account is not active, so the user is not authorized!",
    });
  }

  /* 5- Checks if the user has changed his password after his token has been inntialized (Security concern), 
   it must login again */
  if (currentUser.passwordChangedAt) {
    // convert the last changed time from mille to second
    const changedPasswordTime = currentUser.passwordChangedAt.getTime() / 1000;
    // get the initialized token time
    const tokenInitializedTime = decodedPayload.iat;
    // checks for the difference between them
    if (changedPasswordTime > tokenInitializedTime) {
      return res.status(401).json({
        message:
          "Password has been changed after the token has been created, user must re-login",
      });
    }
  }

  // after all verification processes, append the verified current user to the req object to be used later
  req.user = currentUser;
  next();
});

/* @desc this checks whether the incoming logined user role is authorized to access the next route or not 
(Permission acces) */
// isAllowedTo() function return the inner middleware function
exports.isAllowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // check whether the role of the authentic/loggined user (req.user) is from the roles or not
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Logined user is not authorized to access this route!",
      });
    }
    next(); // the user is authorized to access the next controllers
  });

// @desc this handles the forget password process
// @route Post /auth/forgetPassword
// Access Public
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  // 1- Check for the user existance in the db by the provided email
  const userObj = await User.findOne({ email: req.body.email });
  if (!userObj) {
    return res.status(404).json({
      message: `User for this email ${req.body.email}is not existed!`,
    });
  }

  // 2- generate a random hashed 6 digit -- string format to be acceptable hashed
  const resetCode = Math.floor(100000 + Math.random() * 90000).toString(); // OTP code
  const hashedResetCode = crypto.SHA256(resetCode).toString(); // hashed OTP code

  // 3- store these forget password config into the user collection in db
  userObj.passwordResetCode = hashedResetCode;
  const validTimeInMimutes = 10;
  userObj.passwordResetExpirationTime =
    Date.now() + 1000 * 60 * validTimeInMimutes; // adjust the expiration time >> 10 min from now
  userObj.passwordResetVerified = false; // make the verification process is false until the resetCode is verified
  await userObj.save();

  // 4- send the rest code via the user email either plain text message or html message
  const message = `Hi ${userObj.name},\nPlease find the attached reset password code to your 
  account: ${resetCode}.\nEnter this code to complete your reset password.
  \nThanks to help us makes ur account secure.\nSakration Team.`;

  try {
    await sendMail({
      to: "ma7mouedsakr@gmail.com",
      subject: `Password Reset Code, Its valid only for ${validTimeInMimutes} minutes.`,
      // body: message,
      html: `
      <h1>Hi ${userObj.name}!</h1>
      <p>Please find the attached reset password code to your account: <b style='color:red'>${resetCode}</b> .</p>
      <p>Enter this code to complete your reset password</p> 
      <p>Please not that the reset code is valid only for <i>${validTimeInMimutes} minutes</i></p> 
      <p>Thanks to help us makes ur account secure.</p>
      <h5> Sakration Team. </h5> 
      `,
    });
  } catch (error) {
    // reset the password reset assest in the db
    userObj.passwordResetCode = undefined;
    userObj.passwordResetExpirationTime = undefined;
    userObj.passwordResetVerified = false;
    await userObj.save();
    return res
      .status(200)
      .json({ mess: "There are error during sending mail", err: error });
  }
  // No error
  return res.status(200).json({
    mess: "Reset code has been sent to email!",
    data: userObj,
  });
});

// @desc this handles the verification of the password reset code
// @route Post /auth/verifyPasswordResetCode
// Access Public
exports.verifyPasswordResetCode = asyncHandler(async (req, res, next) => {
  /* Searching for the user existance by the given passwordResetCode, but firstly hash it before comparing with 
  the hashed passwordResetCode */
  const hashedResetCode = crypto.SHA256(req.body.passwordResetCode).toString(); // hashed OTP code
  const userObj = await User.findOne({ passwordResetCode: hashedResetCode });
  if (!userObj) {
    return res.status(404).json({ mess: "No user is founded for this token" });
  }
  // if the user is existed, checks for the expiration time of that reset code
  console.log(
    "userObj.passwordResetExpirationTime",
    userObj.passwordResetExpirationTime
  );
  console.log("Date.now()", Date.now());
  if (userObj.passwordResetExpirationTime < Date.now()) {
    return res.status(403).json({ mess: "Reset code has been expired!" });
  }
  // reset code is not expired and its user is existed, so its valid
  userObj.passwordResetVerified = true;
  await userObj.save();
  return res.status(200).json({ mess: "Reset password code is valid" });
});

// @desc this handles the reset password process
// @route Post /auth/resetPassword
// Access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1- Check for the user existance in the db by the provided email
  const userObj = await User.findOne({ email: req.body.email });
  if (!userObj) {
    return res.status(404).json({
      message: `User for this email ${req.body.email}is not existed!`,
    });
  }
  // 2- Checks for the validaity of the passwordResetCode : user has verified the password resetCode successfully
  if (!userObj.passwordResetVerified) {
    return res.status(403).json({
      message: `User for this email ${req.body.email} has not verified the password resetCode!`,
    });
  }
  // 3- Change the password
  userObj.password = req.body.newPassword; // will be hashed by mongoose middleware save
  userObj.passwordChangedAt = Date.now();
  // reset the password reset assest in the db to be used later successfully
  userObj.passwordResetCode = undefined;
  userObj.passwordResetExpirationTime = undefined;
  userObj.passwordResetVerified = false;
  await userObj.save();

  //4- generate a new token to this user for the authentication purposes later
  const newToken = jwt.sign(
    { userId: userObj._id },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRE_TIME,
    }
  );
  res.status(200).json({ data: userObj, token: newToken });
});
