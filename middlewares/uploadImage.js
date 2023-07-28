const multer = require("multer");
const ApiError = require("../utils/ApiError");

const multerOption = () => {

  // Multer config
  /*
// 1- Disk Storage -- to upload files of Brands and store them on disk
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload/brands"); //  path of folder which used to store the images
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const filename = `brand-${uuidv4()}-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});
*/
  // 2- Memory Storage -- to upload files of Brands and store them on memory as buffer
  // used if you will apply some processing on the image before saving it
  const multerStorage = multer.memoryStorage();

  // allow only uploading images file
  const multerFileFilter = function (req, file, cb) {
    // uploaded file is stored in req.file
    if (file.mimetype.startsWith("image")) {
      cb(null, true); // null >> no errors , true >> success process
    } else {
      cb(
        new ApiError("Images file only are allowed to be uploaded!", 400),
        false
      ); // errors , false >> failed process
    }
  };
  // file upload middleware
  const uploadFile = multer({
    storage: multerStorage,
    fileFilter: multerFileFilter,
  });
  return uploadFile;
};

// Upload single image file
exports.uploadSingleImage = (formFieldName) => {
  // return uploadBrandImgMiddleware to be used
  return multerOption().single(formFieldName);
};

// Upload multiple images files
exports.uploadMultipleImages = (arrayOfFormImageFields) => {
  // return uploadBrandImgMiddleware to be used
  return multerOption().fields(arrayOfFormImageFields);
};
