const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const userRoute = require("./route/usersRoute");
const postRoute = require("./route/postRoute");
const commentRoute = require("./route/commentRoute");
const emailMsgRoute = require("./route/emailMsgRoute");
const categoryRoute = require("./route/categoryRoute");

const dbConnect = require("./config/db/dbConnect");
const { errorHandler, notFound } = require("./middlewares/error/errorHandler");

const app = express();
app.use(cors());

// Connect with the database
dbConnect();

app.use(express.json());

// User Route
app.use("/api/users", userRoute);
// Post Route
app.use("/api/posts", postRoute);
// Commnd Route
app.use("/api/comments", commentRoute);
// Email Message
app.use("/api/email", emailMsgRoute);
// Category Route
app.use("/api/category", categoryRoute);

// Middleware if the route does not exists
app.use(notFound);

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on Port ${PORT}...`);
});
