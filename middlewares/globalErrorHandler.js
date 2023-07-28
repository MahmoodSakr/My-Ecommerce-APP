const globalErrorHandler = (errObj, req, res, next) => {
  statusCode = errObj.statusCode || 500;
  status = errObj.status || "error";
  message = errObj.message;
  stack = errObj.stack;
  err = errObj; // could be your manually set error or be another thrown error
  // Error pattern in development mode
  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({ statusCode, status, message, err, stack });
  } else {
    // Error pattern in Production mode
    res.status(statusCode).json({ statusCode, status, message });
  }
};

module.exports = globalErrorHandler;
