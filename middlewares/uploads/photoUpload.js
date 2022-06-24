const path = require("path");

const multer = require("multer");
const sharp = require("sharp");

// Storage
const multerStorage = multer.memoryStorage();

// File Type Checking
// {req, fileUploaded and the callback functon}
const multerFilter = (req, file, cb) => {
  // Check fileType
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      {
        message: "File type not supported",
      },
      false
    );
  }
};

const photoUpload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 100000000 },
});

// ########################################################
// ## Resizing the profile pic
const profilePhotoResize = async (req, res, next) => {
  // Check if file is present
  if (!req.file) return next(new Error("Please attach profile photo."));

  // Create name to ensure there are no two images with same name
  req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

  // Resize the image
  await sharp(req.file.buffer)
    .resize(250, 250)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(`public/images/profile/${req.file.filename}`));

  next();
};

// ########################################################
// ## Resizing the post pic
const postImgResize = async (req, res, next) => {
  // Check if file is present
  if (!req.file) return next(new Error("Please attach profile photo."));

  // Create name to ensure there are no two images with same name
  req.file.filename = `user-${Date.now()}-${req.file.originalname}`;

  // Resize the image
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(`public/images/post/${req.file.filename}`));

  next();
};

module.exports = { photoUpload, profilePhotoResize, postImgResize };
