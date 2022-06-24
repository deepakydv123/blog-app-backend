const fs = require("fs").promises;

const expressAsyncHandler = require("express-async-handler");
const Filter = require("bad-words");

const User = require("./../../model/user/User");
const Post = require("../../model/post/Post");
const cloudinaryUploadImg = require("../../utils/cloudinary");
const { validateMongoDbId } = require("../../utils/validateMongoDbID");
const { rmSync } = require("fs");

// ###########################
// ## Create Post
// ###########################
const createPostCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Check if the profane words are present
  const filter = new Filter();
  const isProfaneWord =
    filter.isProfane(req.body.title) || filter.isProfane(req.body.description);

  // Block User
  if (isProfaneWord) {
    await User.findByIdAndUpdate(_id, {
      isBlocked: true,
    });

    throw new Error(
      "Post creation failed because it contains profane words and you have been blocked."
    );
  }
  // 1) Get the local path to the image
  const localPathOfImg = `public/images/post/${req.file.filename}`;
  const imgUploaded = await cloudinaryUploadImg(localPathOfImg);

  // Delete the file from the local machine
  await fs.unlink(`public/images/post/${req.file.filename}`);

  // Create the Post
  try {
    const post = await Post.create({
      ...req.body,
      image: imgUploaded?.url,
      user: _id,
    });
    return res.json(post);
  } catch (err) {
    res.json(err);
  }
});

// ###########################
// ## Fetch All Posts
// ###########################
const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
  const hasCategory = req.query.category;

  try {
    //Check if it has a category
    if (hasCategory && hasCategory.length > 0) {
      const posts = await Post.find({ category: hasCategory })
        .populate("user")
        .populate("comments")
        .sort("-createdAt");

      res.json(posts);
    } else {
      const posts = await Post.find({})
        .populate("user")
        .populate("comments")
        .sort("-createdAt");

      res.json(posts);
    }
  } catch (error) {
    res.json(error);
  }
});

// ###########################
// ## Fetch a single post
// ###########################
const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const post = await Post.findById(id)
      .populate("user")
      .populate("disLikes")
      .populate("likes")
      .populate("comments");

    // Uodate the number of views of the post
    await Post.findByIdAndUpdate(
      post.id,
      {
        $inc: { numViews: 1 },
      },
      { new: true }
    );

    res.json(post);
  } catch (err) {
    res.json(err);
  }
});

// ###########################
// ## Update Post
// ###########################
const updatePostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        ...req.body,
        user: req.user?.id,
      },
      {
        new: true,
      }
    );

    res.json(post);
  } catch (err) {
    res.json(err);
  }

  res.json("Update");
});

// ###########################
// ## Delete Post
// ###########################
const deletePostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const post = await Post.findByIdAndDelete(id);
    res.json(post);
  } catch (err) {
    res.json(err);
  }
});

// ###########################
// ## Like the Post
// ###########################
const toggleAddLikeToPostCtrl = expressAsyncHandler(async (req, res) => {
  //1.Find the post to be liked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  //2. Find the login user
  const loginUserId = req?.user?._id;

  //3.Check if this user has disliked this post
  const alreadyDisliked = post?.disLikes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  //4.remove the user from dislikes array if exists
  if (alreadyDisliked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
      },
      { new: true }
    );
  }

  //Toggle
  //Remove the user if he has liked the post before
  const isLiked = post?.likes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  if (isLiked) {
    // Already liked, remove from the likes
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
      },
      { new: true }
    );
    return res.json(post);
  } else {
    // Add to the likes
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loginUserId },
      },
      { new: true }
    );

    return res.json(post);
  }
});

// ###########################
// ## Dislike the post
// ###########################
const toggleAddDislikeToPostCtrl = expressAsyncHandler(async (req, res) => {
  //1.Find the post to be disLiked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  //2.Find the login user
  const loginUserId = req?.user?._id;

  //3. Check if already like this post
  const alreadyLiked = post?.likes?.find(
    (userId) => userId.toString() === loginUserId?.toString()
  );
  //Remove this user from likes array if it exists
  if (alreadyLiked) {
    const post = await Post.findOneAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
      },
      { new: true }
    );
  }
  //Toggling
  //Remove this user from dislikes if already disliked
  const isDisLiked = post?.disLikes?.find(
    (userId) => userId.toString() === loginUserId?.toString()
  );
  if (isDisLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
      },
      { new: true }
    );
    return res.json(post);
  } else {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { disLikes: loginUserId },
      },
      { new: true }
    );
    return res.json(post);
  }
});

module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  toggleAddLikeToPostCtrl,
  toggleAddDislikeToPostCtrl,
};
