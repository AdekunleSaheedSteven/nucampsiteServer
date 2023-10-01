const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
//we require express-session & session-file-store to implement Express session to track user information.
const session = require("express-session");
//two set of parameters afte a function call: JS has first class function which mean a function can return another function.  What happen here is that when we call this function require("session-file-store") then it return another function as it value.Then we immediately call that return function with the second parameter list.
const FileStore = require("session-file-store")(session);

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const campsiteRouter = require("./routes/campsiteRouter");
const promotionRouter = require("./routes/promotionRouter");
const partnerRouter = require("./routes/partnerRouter");

//connecting Express server to MongoDB/ Mongoose.
//require mongoose package.
const mongoose = require("mongoose");

const url = "mongodb://localhost:27017/nucampsite";
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

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

//these are all middleware.
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Create "session middleware" and pass it configuration values as its parameter.
//what you put as "name", "secret" won't matter
//saveUninitialized: false is optional. What it means is that when a new session is created and no update is made to it and at the end of request it won't get save because it will be an empty session without any useful information and no cookies will be sent to the client. That helps to prevent of having bunch of empty session files for cookies being set up.
//resave: false, this is saying once session is created, updated and saved, once request is made for that session, it will continue to resave even if that request did not make any update. This will keep the session active so it doesn't get deleted. This is commonly set and using it depend on the project.
//store: new FileStore() will create a new file store as an object that we can use to save of session information to server hard-disc instead of just running application memory.
//this middleware session will add 'session' to request property.
app.use(
  session({
    name: "session-id",
    secret: "12345-67890-09876-54321",
    saveUninitialized: false,
    resave: false,
    store: new FileStore(),
  })
);

//indexRouter & usesRouter are place above auth function because we want users to access them before going through authentication.
//We have already have a way of authenticating users through users module so they do not need to be authenticated through auth function again.
//indexRouter above auth function because we directed logout users to that path and the users logout authentication is already done in users module file too.
app.use("/", indexRouter);
app.use("/users", usersRouter); // This router is created by Express Generator. The file created is inside router folder

function auth(req, res, next) {
  console.log(req.session);

  //here we are only checking if client is not authenticated so if it doesn't then we use the error handler.
  if (!req.session.user) {
    const err = new Error("You are not authenticated!");

    // this is standard error code if credential is not provided.
    err.status = 401;

    //this will send the error message back to the client.
    return next(err);
  } else {
    //'authenticated' is the value we set for it (req.session.user) in the users router when a user login.
    if (req.session.user === "authenticated") {
      return next();
    } else {
      const err = new Error("You are not authenticated!");
      err.status = 401;
      return next(err);
    }
  }
}

app.use(auth);

app.use(express.static(path.join(__dirname, "public")));

app.use("/campsites", campsiteRouter);
app.use("/promotions", promotionRouter);
app.use("/partners", partnerRouter);

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
