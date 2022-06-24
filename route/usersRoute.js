const express = require("express");
const {
  userRegisterCtrl,
  logInUserCtrl,
  fetchUsersCtrl,
  deleteUsersCtrl,
  fetchUserDetailsCtrl,
  userProfileCtrl,
  updateUserCtrl,
  updateUserPasswordCtrl,
  followingUserCtrl,
  unfollowUserCtrl,
  blockUserCtrl,
  unBlockUserCtrl,
  generateVerificationTokenCtrl,
  accountVerificationCtrl,
  forgetPasswordToken,
  passwordResetCtrl,
  profilePhotoUploadCtrl,
} = require("./../controllers/users/usersCtrl");
const authMiddleware = require("./../middlewares/auth/authMiddleware");
const {
  photoUpload,
  profilePhotoResize,
} = require("../middlewares/uploads/photoUpload");

const userRouter = express.Router();

userRouter.post("/register", userRegisterCtrl);
userRouter.post("/login", logInUserCtrl);
userRouter.put(
  "/profilephoto-upload",
  authMiddleware,
  photoUpload.single("image"),
  profilePhotoResize,
  profilePhotoUploadCtrl
);

userRouter.get("/", authMiddleware, fetchUsersCtrl);
userRouter.get("/profile/:id", authMiddleware, userProfileCtrl);

userRouter.put("/password", authMiddleware, updateUserPasswordCtrl);
userRouter.post("/forget-password-token", forgetPasswordToken);
userRouter.put("/reset-password", passwordResetCtrl);

userRouter.put("/follow", authMiddleware, followingUserCtrl);
userRouter.post(
  "/generate-verify-email-token",
  authMiddleware,
  generateVerificationTokenCtrl
);
userRouter.put("/verify-account/:id", authMiddleware, accountVerificationCtrl);

userRouter.put("/unfollow", authMiddleware, unfollowUserCtrl);
userRouter.put("/block-user/:id", authMiddleware, blockUserCtrl);
userRouter.put("/unblock-user/:id", authMiddleware, unBlockUserCtrl);

userRouter
  .route("/:id")
  .get(fetchUserDetailsCtrl)
  .put(authMiddleware, updateUserCtrl)
  .delete(deleteUsersCtrl);

module.exports = userRouter;
