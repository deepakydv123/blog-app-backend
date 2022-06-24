const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Create Schema for the user
const userSchema = new mongoose.Schema(
  {
    firstName: {
      required: [true, "First name is required."],
      type: String,
    },
    lastName: {
      required: [true, "Last name is required."],
      type: String,
    },
    profilePhoto: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    email: {
      type: String,
      required: [true, "Email address is required."],
    },
    bio: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    postCount: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["Admin", "Guest", "Blogger"],
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    accountVerificationToken: String,
    accountVerificationTokenExpires: Date,

    viewedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    followers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    active: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

// ##############################
// ## Virtual method to populate the created post
// #################################
userSchema.virtual("posts", {
  ref: "Post",
  foreignField: "user",
  localField: "_id",
});

//Account Type
userSchema.virtual("accountType").get(function () {
  const totalFollowers = this.followers?.length;
  return totalFollowers >= 5 ? "Pro Account" : "Starter Account";
});

// ################################################
// ## Middleware to Hash Password before saving in the database
// ##########################################
userSchema.pre("save", async function (next) {
  // Only hash the password if modified
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ################################################
// ## Method to check if the entered password is correct or not
// ##########################################
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ########################################################
// ## Create Account Verification Token
// ########################################
userSchema.methods.createAccountVerificationToken = async function () {
  // Create Token using crypto
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Add the account verification token field to the user document
  this.accountVerificationToken = await crypto
    .createHash("sha256", process.env.CRYPTO_SECRET_KEY)
    .update(verificationToken)
    .digest("hex");

  this.accountVerificationTokenExpires = Date.now() + 30 * 60 * 1000;

  return verificationToken;
};

// ########################################################
// ## Create Token for Password Reset
// ########################################
userSchema.methods.createPasswordResetToken = async function () {
  // Create Token using crypto
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Add the account verification token field to the user document after hashing it
  this.passwordResetToken = await crypto
    .createHash("sha256", process.env.CRYPTO_SECRET_KEY)
    .update(verificationToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;

  return verificationToken;
};

// Compile the schema into the model
const User = mongoose.model("User", userSchema);

module.exports = User;
