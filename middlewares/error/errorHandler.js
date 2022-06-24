// #########################
// ## Middleware if the route does not exists
//################################
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route does not exists -  ${req.originalUrl}`));
};

// #############################
// # Global Error Handling Middleware
// ###########################
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err?.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { errorHandler, notFound };
