const crypto = require("crypto");
const fs = require("fs").promises;

const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");

const User = require("./../../model/user/User");
const generateToken = require("./../../config/token/generateToken");
const { validateMongoDbId } = require("./../../utils/validateMongoDbID");
const { findByIdAndDelete } = require("./../../model/user/User");
const cloudinaryUploadImg = require("../../utils/cloudinary");

// ###############################
// ###  Register User
// ###############################
module.exports.userRegisterCtrl = expressAsyncHandler(async (req, res) => {
  // Check if the user already exists
  const userExists = await User.findOne({ email: req?.body?.email });
  if (userExists) throw new Error("User Already Exists.");

  try {
    // Create the User document
    const user = await User.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      password: req?.body?.password,
    });

    res.json(user);
  } catch (error) {
    res.json(error);
  }
});

// #####################################
// ## LogIn User
// ##################################
module.exports.logInUserCtrl = expressAsyncHandler(async (req, res) => {
  // Check if the user exists
  const userExists = await User.findOne({ email: req?.body?.email });
  if (!userExists || !(await userExists.isPasswordMatched(req.body.password))) {
    res.status(401);
    res.json({ message: `Invalid LogIn credentials.` });
  } else {
    res.json({
      _id: userExists?._id,
      firstName: userExists?.firstName,
      lastName: userExists?.lastName,
      email: userExists?.email,
      profilePhoto: userExists?.profilePhoto,
      isAdmin: userExists?.isAdmin,
      token: generateToken(userExists?._id),
    });
  }
});

// #########################
// #### Get all Users
// ##########################
module.exports.fetchUsersCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const allUsers = await User.find({});
    res.json(allUsers);
  } catch (err) {
    res.json(err);
  }
});

// #########################
// #### Delete User
// ##########################
module.exports.deleteUsersCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if the id is valid or not, if not valid, throw error
  validateMongoDbId(id);

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    res.json(deletedUser);
  } catch (err) {
    res.json(err);
  }
});

// #########################
// #### Get details of a particular user
// ##########################
module.exports.fetchUserDetailsCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("Hi");
  // Check if the id is valid or not, if not valid, throw error
  validateMongoDbId(id);
  try {
    const userFound = await User.findOne({ _id: id });
    res.json(userFound);
  } catch (err) {
    res.json(err);
  }
});

// ######################################
// #### Get User Profile (For the logged in user )
// ######################################
module.exports.userProfileCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  //1.Find the login user
  //2. Check this particular if the login user exists in the array of viewedBy

  //Get the login user
  const loginUserId = req?.user?._id?.toString();
  console.log(typeof loginUserId);
  try {
    const myProfile = await User.findById(id)
      .populate("posts")
      .populate("viewedBy")
      .populate("followers");
    const alreadyViewed = myProfile?.viewedBy?.find((user) => {
      return user?._id?.toString() === loginUserId;
    });
    if (alreadyViewed || myProfile.id.toString() === loginUserId) {
      res.json(myProfile);
    } else {
      const profile = await User.findByIdAndUpdate(myProfile?._id, {
        $push: { viewedBy: loginUserId },
      });

      const updatedProfile = await User.findById(myProfile?._id)
        .populate("posts")
        .populate("viewedBy")
        .populate("followers");
      res.json(profile);
    }
  } catch (error) {
    res.json(error);
  }
});

// ######################################
// ## Update the details of a user
// ######################################
module.exports.updateUserCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user; // Get the details of looged in user
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id },
      {
        firstName: req?.body?.firstName,
        lastName: req?.body?.lastName,
        email: req?.body?.email,
        bio: req?.body?.bio,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json(updatedUser);
  } catch (err) {
    res.json(err);
  }
});

// ######################################
// ## Update password of user
// ######################################
module.exports.updateUserPasswordCtrl = expressAsyncHandler(
  async (req, res) => {
    // Destrucutre the id of logged in user
    const { _id } = req?.user;
    const { password } = req?.body;

    validateMongoDbId(_id);
    const user = await User.findById(_id);

    if (password) {
      user.password = password;
      const updatedUser = await user.save();
      res.json(updatedUser);
    }

    return;
  }
);

// ######################################
// ## Follow a user (Id of the person to follow in the request)
// ######################################
module.exports.followingUserCtrl = expressAsyncHandler(async (req, res) => {
  /*
       1) Find the id of the person to follow
       2) Update the followers of the person to be followed
       3) Update the following array of the current user logged in
    */

  const { followId } = req.body;
  const logInUserId = req.user.id;

  validateMongoDbId(followId);

  const targetUser = await User.findById(followId);
  // Check if user with followId exists or not
  if (!targetUser) {
    throw new Error("User to be followed does not exists.");
  }

  const alreadyFollowing = targetUser?.followers?.find(
    (user) => user?.toString() === logInUserId.toString()
  );

  // Throw error if already following
  if (alreadyFollowing) {
    throw new Error("You are already following this user.");
  }

  // 1) Add the current user id in the followers array of the required user
  await User.findByIdAndUpdate(
    followId,
    {
      $push: { followers: logInUserId },
    },
    { new: true }
  );

  // 2) Update the current user following array
  await User.findByIdAndUpdate(
    logInUserId,
    {
      $push: { following: followId },
    },
    { new: true }
  );

  res.json("You have successfully followed this user.");
});

// ######################################
// ## Unfollow a user
// ######################################
module.exports.unfollowUserCtrl = expressAsyncHandler(async (req, res) => {
  const { unFollowId } = req.body;
  const logInUserId = req.user.id;

  await User.findByIdAndUpdate(
    unFollowId,
    {
      $pull: { followers: logInUserId },
    },
    { new: true }
  );

  await User.findByIdAndUpdate(
    logInUserId,
    {
      $pull: { following: unFollowId },
    },
    {
      $new: true,
    }
  );

  res.json("You have successfully unfollowed this user.");
});

// ######################################
// ## Blocking a User (With the id of the user to be blocked in the params)
// ######################################
module.exports.blockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: true },
    { new: true }
  );

  res.json(user);
});

// ######################################
// ## UnBlocking a User (With the id of the user to be blocked in the params)
// ######################################
module.exports.unBlockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: false },
    { new: true }
  );

  res.json(user);
});

// ######################################################
// ## Generate verification token and send it to the user
// ######################################################
module.exports.generateVerificationTokenCtrl = expressAsyncHandler(
  async (req, res) => {
    const logInUserId = req.user.id;
    const user = await User.findById(logInUserId);

    const verificationToken = await user.createAccountVerificationToken();
    const updatedUser = await user.save();

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: process.env.OUTLOOK_EMAIL,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });

    const options = {
      from: process.env.OUTLOOK_EMAIL,
      to: user.email,
      subject: "Please verify your account.",
      html: `Please verify your account by clicking on the below link within 10 minutes: <a href="http://localhost:3000/api/users/verify-account/${verificationToken}">Click Here</a>`,
    };

    transporter.sendMail(options, function (err, info) {
      if (err) res.json(err);
      else res.json("Email successfully sent to the user.");
    });
  }
);

// ###################################################################################################
// ## Account verification controller to verify the account (the request body contains the required token)
// ###################################################################################################
module.exports.accountVerificationCtrl = expressAsyncHandler(
  async (req, res) => {
    // Get the token from the url
    const { id: token } = req.params;
    const hashedToken = await crypto
      .createHash("sha256", process.env.CRYPTO_SECRET_KEY)
      .update(token)
      .digest("hex");

    // Find the user by this hashedToken
    const userFound = await User.findOne({
      id: req.user.id,
      accountVerificationToken: hashedToken,
      accountVerificationTokenExpires: { $gt: new Date() },
    });

    if (!userFound) return res.json("Token Expired, Try Again");

    userFound.isAccountVerified = true;
    userFound.accountVerificationToken = undefined;
    userFound.accountVerificationTokenExpires = undefined;
    await userFound.save();

    res.json(userFound);
  }
);

// ###################################################################################################
// ## Forgot Password Controller to send a link to reset the password
// ###################################################################################################
module.exports.forgetPasswordToken = expressAsyncHandler(async (req, res) => {
  // Find the user by email
  const { email } = req?.body;
  if (!email) throw new Error("Please add the email id in the request.");

  const user = await User.findOne({ email: email });
  if (!user) throw new Error("Email Id does not exists.");

  try {
    // Generate the token and send it back to the user
    const token = await user.createPasswordResetToken();
    await user.save(); // Save the user with the uppdated details

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: process.env.OUTLOOK_EMAIL,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });

    const options = {
      from: process.env.OUTLOOK_EMAIL,
      to: email,
      subject: "Please verify your account.",
      html: `Please verify your account by clicking on the below link within 10 minutes: <a href="http://localhost:3000/reset-password/${token}">Click Here</a>`,
    };

    transporter.sendMail(options, function (err, info) {
      if (err) return res.json(err);
      else return res.json("Email successfully sent to the user.");
    });

    return res.json({ message: "Email Sent with link to reset the password." });
  } catch (err) {
    res.send(err);
  }
});

// ###################################################################################################
// ## Forgot Password Controller to send a link to reset the password
// ###################################################################################################
module.exports.passwordResetCtrl = expressAsyncHandler(async (req, res) => {
  const { token, password } = req?.body;

  const hashedToken = await crypto
    .createHash("sha256", process.env.CRYPTO_SECRET_KEY)
    .update(token)
    .digest("hex");

  // Find the user by this hashedToken
  const userFound = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!userFound) return res.json("Token Expired, Try Again");
  userFound.password = password;
  userFound.passwordResetToken = undefined;
  userFound.passwordResetExpires = undefined;
  await userFound.save();

  res.json({ message: "Reset Password Successful" });
});

// ########################
// ## Profile Photo Upload
// ########################
module.exports.profilePhotoUploadCtrl = expressAsyncHandler(
  async (req, res) => {
    // 1) Get the local path to the image
    const localPathOfImg = `public/images/profile/${req.file.filename}`;
    const imgUploaded = await cloudinaryUploadImg(localPathOfImg);

    // Delete the file from the local machine
    await fs.unlink(`public/images/profile/${req.file.filename}`);

    // Find the user and update the profile picture key of the user
    const userFound = await User.findByIdAndUpdate(
      req.user.id,
      {
        profilePhoto: imgUploaded?.url,
      },
      { new: true }
    );

    await res.json(localPathOfImg);
  }
);
