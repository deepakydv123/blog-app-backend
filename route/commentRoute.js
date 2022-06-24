const express = require("express");
const {
  createCommentCtrl,
  fetchAllCommentsCtrl,
  fetchCommentCtrl,
  updateCommentCtrl,
  deleteCommentCtrl,
} = require("../controllers/comments/commentCtrl");
const authMiddleware = require("../middlewares/auth/authMiddleware");

const commentRouter = express.Router();

commentRouter.post("/", authMiddleware, createCommentCtrl);
commentRouter.post("/", authMiddleware, fetchAllCommentsCtrl);
commentRouter.get("/:id", authMiddleware, fetchCommentCtrl);
commentRouter.put("/:id", authMiddleware, updateCommentCtrl);
commentRouter.delete("/:id", authMiddleware, deleteCommentCtrl);

module.exports = commentRouter;
