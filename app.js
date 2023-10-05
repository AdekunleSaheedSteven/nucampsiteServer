const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");

const passport = require("passport"); // require passport
const config = require("./config");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const campsiteRouter = require("./routes/campsiteRouter");
const promotionRouter = require("./routes/promotionRouter");
const partnerRouter = require("./routes/partnerRouter");

const uploadRouter = require("./routes/uploadRouter");

//connecting Express server to MongoDB/ Mongoose.
//require mongoose package.
const mongoose = require("mongoose");

const url = config.mongoUrl;
const connect = mongoose.connect(url, {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//we then handle the PROMISE that was return from mongoose.connect() method above that we connect to the server successfully. We usually use then to handle RESOLVE and use CATCH method to handle FAILURE. There is other way we can handle the failure mostly especially if we are not intending to chain further any other then. We can pass two callback functions into then() method, the first argument will handle resolve while second argument will handle failure. This part conclude the part to establish connection to Mongoose.
connect.then(
  () => console.log("Connected correctly to server"),
  (err) => console.log(err)
);

const app = express();

// Secure traffic only
//req.secure: secure property is automatically set by Express to true
app.all("*", (req, res, next) => {
  if (req.secure) {
    return next();
  } else {
    console.log(
      `Redirecting to: https://${req.hostname}:${app.get("secPort")}${req.url}`
    );
    res.redirect(
      301,
      `https://${req.hostname}:${app.get("secPort")}${req.url}`
    );
  }
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

//these are all middleware.
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//these two are necessary if you are using passport sessions-based authentication. These are two middlewares function provided by passport to see incoming request to see if there is existing sessions for that client if so then the sessions data for that client is loaded into the request as req.user
app.use(passport.initialize());

//indexRouter & usesRouter are place above auth function because we want users to access them before going through authentication.
//We have already have a way of authenticating users through users module so they do not need to be authenticated through auth function again.
//indexRouter above auth function because we directed logout users to that path and the users logout authentication is already done in users module file too.
app.use("/", indexRouter);
app.use("/users", usersRouter); // This router is created by Express Generator. The file created is inside router folder

app.use(express.static(path.join(__dirname, "public")));

app.use("/campsites", campsiteRouter);
app.use("/promotions", promotionRouter);
app.use("/partners", partnerRouter);

app.use("/imageUpload", uploadRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
