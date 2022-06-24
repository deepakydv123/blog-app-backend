const expressAsyncHandler = require("express-async-handler");

const Comment = require("../../model/comment/Comment");

// ###################
// ## Create Comment
// ###################
const createCommentCtrl = expressAsyncHandler(async (req, res) => {
  // 1. Get the user
  const user = req.user;

  // 2. Get the post id
  const { postId, description } = req.body;

  try {
    const comment = await Comment.create({
      post: postId,
      user: user,
      description: description,
    });

    res.json(comment);
  } catch (err) {
    res.json(err);
  }
});

// ###################
// ## Fetch All Comments
// ###################
const fetchAllCommentsCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const comments = await Comment.find({}).sort("-created");
    res.json(comments);
  } catch (error) {
    res.json(error);
  }
});

// ###################
// ## Fetch a single comment
// ###################
const fetchCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findById(id);
    res.json(comment);
  } catch (error) {
    res.json(error);
  }
});

// ###################
// ## Update Comment
// ###################
const updateCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const update = await Comment.findByIdAndUpdate(
      id,
      {
        user: req?.user,
        description: req?.body?.description,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    res.json(update);
  } catch (error) {
    res.json(error);
  }
});

// ###################
// ## Delete Comment
// ###################
const deleteCommentCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(req.params);

  try {
    const comment = await Comment.findByIdAndDelete(id);
    res.json(comment);
  } catch (error) {
    res.json(error);
  }
});
module.exports = {
  createCommentCtrl,
  fetchAllCommentsCtrl,
  fetchCommentCtrl,
  updateCommentCtrl,
  deleteCommentCtrl,
};
