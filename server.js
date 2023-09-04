const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const dbConnection = require("./config/db");
const mountRoutes = require("./routes/index");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const { xss } = require("express-xss-sanitizer");

const { webHookCheckout } = require("./controllers/orderController");

// config file path
dotenv.config({ path: "./config/config.env" });
// db
dbConnection();

// create express app
const app = express();

// middleware
app.use(cors()); // enable other domains/origins to access your APIs - check the responce header to see the differnce
app.options("*", cors());




app.use(compression()); // compress responce data size for enhancing performance - best practice #
// you can test the responce data size with https://www.giftofspeed.com/gzip-test/
app.use(express.static(path.join(__dirname, "upload")));
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Mount routes to their middlewares
mountRoutes(app);
app.post(
  "/webhook-checkout",
  express.raw({ type: 'application/json' }),
  webHookCheckout
);

app.use(express.json({ limit: "70kb" })); // limit req body size - best practise #1

// middleware used to sanitizes user-incoming data to prevent MongoDB Operator Injection - Best practise #3
// by remove $ and . operators from being injected into body,query,params,headers data
app.use(mongoSanitize());

// middleware used to sanitizes user-incoming data with req to prevent cross site scripting - Best practise #3
// prevent any <script>code</script> data from being injected into body,query,params,headers data by replace
// the <script> with any other chars.
app.use(xss());

// Apply rate limit on repeated http req and return 429 status code with provided message
// Protect against brute-foce attacks by rate the limit requests - Best practise #2
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many request from this IP, please try again after 15 min",
});

// Apply the rate limiting middleware to all requests
app.use(limiter);
// app.use('route',limiter) // protect specific route by limiting req rate

// hpp middle ware protects against HTTP parameters pollution attack - Best practise #3
app.use(hpp({ whitelist: ["price", "quantity", "sold"] }));


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
