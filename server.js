const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const dbConnection = require("./config/db");
const ApiError = require("./utils/ApiError");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const mountRoutes = require("./routes/index");
const compression = require('compression')

// config file
dotenv.config({ path: "./config/config.env" });
// db
dbConnection();

// create express app
const app = express();

// middleware
app.use(cors()) // enable other domains to access your APIs
app.options('*', cors()) 
app.use(compression()); // compress all responces
app.use(express.json());
app.use(express.static(path.join(__dirname, "upload")));
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Mount routes to their middlewares
mountRoutes(app);

// error middleware - global error handler (unregistered routes)
app.all("*", (req, res, next) => {
  /* Instead of create a manually error obj, you can create a class inherit Error class with your error setup
   const err = new Error(`This url is not founded ${req.originalUrl}`);
   next(err.message); // pass this error with its message to the error handling middleware 
   */
  const errObj = new ApiError(
    `This url is not founded ${req.originalUrl}`,
    404
  );
  next(errObj); // this error obj will be passed to the next error middleware to be send as json responce
});

// global error handling middleware to handle only the errors of express (throwed by you or by interpreter)
// and customize it on your logic before send the responce to the client side
app.use(globalErrorHandler);

// launch the server
const port = process.env.port || 8000;
const server = app.listen(port, () => {
  console.log(
    `Server is started at port ${port} on ${process.env.NODE_ENV} mode`
  );
});

/*
handled (non-express/ outside express errors) .e.g. promise rejection error which emit an event called by unhandledRejection and you 
handle the corresponding error in the attached callback so this a way to handle promise rejection error without catch() of Promise 
*/
process.on("unhandledRejection", (err) => {
  console.error(
    `UnhandledRejection err ... name:${err.name} | message:${err.message}`
  );
  // Server will be exited after all pending requests are handled
  server.close(() => {
    console.log("Server is shutting down now ...");
    process.exit(1);
  });
});
