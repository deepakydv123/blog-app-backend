const express = require("express");
const {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  toggleAddLikeToPostCtrl,
  toggleAddDislikeToPostCtrl,
} = require("../controllers/posts/postCtrl");
const authMiddleware = require("../middlewares/auth/authMiddleware");
const {
  photoUpload,
  postImgResize,
} = require("../middlewares/uploads/photoUpload");

const postRouter = express.Router();

postRouter.post(
  "/",
  authMiddleware,
  photoUpload.single("image"),
  postImgResize,
  createPostCtrl
);

postRouter.put("/likes", authMiddleware, toggleAddLikeToPostCtrl);
postRouter.put("/dislikes", authMiddleware, toggleAddDislikeToPostCtrl);

postRouter.get("/", fetchPostsCtrl);
postRouter.get("/:id", fetchPostCtrl);
postRouter.put("/:id", authMiddleware, updatePostCtrl);
postRouter.delete("/:id", authMiddleware, deletePostCtrl);

module.exports = postRouter;
