const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const asyncHandler = require("express-async-handler"); // instead of using try catch inside async method
const ApiError = require("../utils/ApiError");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { uploadSingleImage } = require("../middlewares/uploadImage");

// Upload Image config if there an img in the multi-form of the body
exports.uploadUserImgMiddleware = uploadSingleImage("profileImage");
exports.resizeImgMiddleware = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const ext = "jpeg";
    const filename = `user-${uuidv4()}-${Date.now()}.${ext}`;
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat(ext)
      .jpeg({ quality: 90 }) // 90% of its quality
      .toFile(`upload/users/${filename}`);

    // append the profileImage filed name to the req.body as this will be saved onto the db on the create controller
    req.body.profileImage = filename;
  }
  next();
});

// @desc Create anew user
// @route Post /users
// Access Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  req.body.slug = slugify(req.body.name); // will make this pattern A B >> A-B
  var newUser = new User(req.body);
  const user = await newUser.save();
  res.status(201).json({ data: user });
});

// @desc Get all users
// @route Get  /users
// Access Private/Admin-Manager
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  // 1- Filtering setup
  const filterObj = { ...req.query };
  // remove these fields from the filter object
  const execludeFields = [
    "limit",
    "skip",
    "page",
    "sort",
    "fields",
    "keywords",
  ];
  execludeFields.forEach((field) => {
    delete filterObj[field];
  });

  // append $ operator before any (gte|gt|lte|lt) in the fields
  let filterObjStr = JSON.stringify(filterObj);
  filterObjStr = filterObjStr.replace(/\b(gte|gt|lte|lt)\b/g, (result) => {
    return "$" + result; // `$${result}`
  });

  let usersQuery = User.find(JSON.parse(filterObjStr));
  // 2- Pagination setup
  let page = req.query.page * 1 || 1; // convert to num by *1
  let limit = req.query.limit * 1 || 50; // number of returned docs per page
  let skip = (page - 1) * limit; // number of document to be skiped from the begining of results when rendering on other pages
  let endIndex = page * limit; // last index of doc in the page
  let allDocumentsNum = await User.countDocuments(); // all document that matched with the filtered result

  const paginationResult = {};
  paginationResult.currentPage = page;
  paginationResult.limit = limit;
  paginationResult.numberOfPages = Math.ceil(allDocumentsNum / limit);

  if (endIndex < allDocumentsNum) {
    paginationResult.nextPage = page + 1; // value of next page
  }
  if (skip > 0) {
    paginationResult.previousPage = page - 1; // value of previous page
  }

  usersQuery = usersQuery.skip(skip).limit(limit);

  // 4- Check for sorting option
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    console.log(sortBy);
    usersQuery = usersQuery.sort(sortBy); //sort("price") sort("price sold") sort("+price -sold")
  } else {
    usersQuery = usersQuery.sort("createdAt"); // default setting for sorting based on adding date
  }

  // 5- Check for (Limiting Fields) selecting sepcific fields to be existed/removed  from the req.query object
  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",").join(" ");

    /*
in the selectedFields, if you write the fields as 
"title slug price" >> hence these fields only will be return with the obj beside id field
"-title -slug" >> hence all fields will be return except these fields 
   */
    usersQuery = usersQuery.select(selectedFields); //select("title slug price")  // select("-title -slug")
  } else {
    usersQuery = usersQuery.select("-__v"); //default setting for selection by exclude the __v from obj data
  }

  // 6- Checks for searching with specific keyword to be compared/matched with name
  if (req.query.keywords) {
    let query = { name: { $regex: req.query.keywords, $options: "i" } };
    usersQuery = usersQuery.find(query);
    /* 
    find( { $or: [{ title: { $regex: req.query.keywords, $options: "i" } } ,
                  { description: { $regex: req.query.keywords, $options: "i" } },]}) 
     */
  }

  // 7- Execute query
  const users = await usersQuery;
  res
    .status(200)
    .json({ results: users.length, paginationResult, data: users });
  if (!users) {
    const errObj = new ApiError(`No users are found!`, 404);
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
});

// @desc Get specific user
// @route Get /users/:id
// Access Private/Admin-Manager
exports.getUserById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (user) {
    return res.status(200).json({ data: user });
  }
  // res.status(404).json({ message: `user with id: ${id} is not found!` });
  const errObj = new ApiError(`User with id: ${id} is not found!`, 404);
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// @desc Update specific user data except the password
// @route Put  /users/:id , req.body >> all user data except the password
// Access Private/Admin
exports.updateUserById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
  }
  const user = await User.findByIdAndUpdate(
    id,
    {
      name: req.body.name,
      slug: req.body.slug,
      email: req.body.email,
      phone: req.body.phone,
      active: req.body.active,
      role: req.body.role,
    },
    { new: true } // return the new user, if new : false(default), the old user will be returnd
  );
  // checks for the user updating
  if (!user) {
    // return res.status(404).json({ message: `user with id: ${id} is not found! to be updated` });
    const errObj = new ApiError(
      `user with id: ${id} is not found! to be updated`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({ mess: "user is updated successfully", data: user });
});

// @desc Update specific user data except the password
// @route Put  /users/:id , req.body >> the password of the user data
// Access Private/Admin
exports.updateUserPassword = asyncHandler(async function (req, res, next) {
  const id = req.params.id;
  const user = await User.findByIdAndUpdate(
    id,
    {
      password: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );
  if (user) {
    return res.status(200).json({
      mess: "user new password has been updated successfully",
      data: user,
    });
  } else {
    const errObj = new ApiError(
      `Password of user with id: ${id} is not changed, some error occured!`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce  }
  }
});

// @desc Delete specific user
// @route Delete  /users/:id
// Access Private/Admin
exports.deleteUserBbyId = asyncHandler(async (req, res, next) => {
  // grap id
  const id = req.params.id;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    // return res
    //   .status(404)
    //   .json({ message: `user with id: ${id} is not found! to be deleted` });
    const errObj = new ApiError(
      `user with id: ${id} is not found! to be deleted`,
      404
    );
    return next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
  }
  res.status(200).json({ mess: "user is deleted successfully", data: user });
  // res.status(204).send(); // that means the delete process is done and there is no content
});

// @desc this get the current user data -- accessed by the loggined user to get his data internally
// @route Post /users/getMe
// Access Private/LoggedUser
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  // append the user id to the params obj to be used later in getting user data by id
  req.params.id = req.user._id;
  next();
});

/* @desc this update the current user password and generate a new token 
-- accessed by the loggined user to update his data internally
-- it differs form the updatePassword route as it return a new token after updating the password
*/
// @route Post /users/updateMyPassword
// Access Private/LoggedUser
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // append the user id to the params obj to be used later in getting user data by id
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );
  if (!user) {
    const errObj = new ApiError(`User is not existed!`, 404);
    return next(errObj);
  }
  // generate a new token
  const newToken = jwt.sign(
    { userId: req.user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRE_TIME }
  );
  return res.status(200).json({
    mess: "user new password has been updated successfully",
    data: user,
    token: newToken,
  });
});

/* @desc this update the current user data except password, role
-- accessed by the loggined user to update his data internally
-- it differs form the updateUser route as it return a new token after updating the password
*/
// @route Post /users/updateMe
// Access Private/LoggedUser
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  // append the user id to the params obj to be used later in getting user data by id
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    },
    { new: true }
  );
  if (!user) {
    const errObj = new ApiError(`User is not existed!`, 404);
    return next(errObj);
  }
  // generate a new token
  const newToken = jwt.sign(
    { userId: req.user._id },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRE_TIME,
    }
  );
  return res.status(200).json({
    mess: "user data has been updated successfully",
    data: user,
    token: newToken,
  });
});

/* @desc this delete the current user data by the user itself
-- accessed by the loggined user to update his data internally
-- it differs form the updateUser route as it return a new token after updating the password
*/
// @route Post /users/deleteMe
// Access Private/LoggedUser
exports.deactivateLoggedUserData = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      active: false,
    },
    { new: true }
  );
  if (!user) {
    const errObj = new ApiError(`User is not deactivated Successfully!`, 404);
    return next(errObj);
  }
  // res.status(204).send();// if you want to send responce without any message
  return res.status(200).json({
    mess: "user data has been de-activated successfully",
    data: user,
  });
});
