const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

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
//providing cookie-parse with a secret key as an argument. The secret key can be any string. It doesn't has to be anything meaningful, it is just a cryptographic key that can be used by cookieParse to encrypt information and sign the cookie that sent from server to the client
app.use(cookieParser("12345-67890-54321"));

//adding Basic Authentication
function auth(req, res, next) {
  //the signedCookies property of request object is provided by cookieParse.It will automatically parse signed cookies from the request. If the cookie is not properly signed then it will return a value of false. The additional property called 'user' is the property we ourselve add to the signed cookie. So if the incoming request doesn't include signedCookie.user property or the signed cookie value then it will parse as false so we know the client has not be authenticate then we challenge the client to aunthenticate.
  if (!req.signedCookies.user) {
    //grab authorization from request header
    const authHeader = req.headers.authorization;

    //server not getting any authorization credential from client
    if (!authHeader) {
      const err = new Error("You are not authenticated!");

      //this let the client know the server is requesting authentication and the authentication is basic.
      res.setHeader("WWW-Authenticate", "Basic");

      // this is standard error code if credential is not provided.
      err.status = 401;

      //this will send the error message back to the client.
      return next(err);
    }

    //if the authorization is availbale inside the header sent by the client then all below will happen. Means there is authorization header then our code will skip to below codes.
    //the authorization header will be parse and then valid the username and password.
    //the authorization header will contain the word BASIC then space follow by the username and password in Based-64 encoding string. Once the code is decoded it will show the username and password separate by colon.
    //in this case we need to take out the username and password out of the HEADER string and put them into a new array.
    //Username will hold index 1 and password will hold index 2 inside the array
    //put the array inside const auth then use the buffer global class in Node. Since Buffer is global in Node means we do not need to REQUIRE it.
    //the Buffer has the static method FROM to decode the username and password Buffer.from()
    //the code inside Buffer.from() will pick the Based-64 encoding username and password and extract the username and password to be able to read and then put them into auth array as first and second items.
    const auth = Buffer.from(authHeader.split(" ")[1], "base64")
      .toString()
      .split(":");

    //grab the username and password out of the array.
    const user = auth[0];
    const pass = auth[1];

    //this is a Basic validation
    if (user === "admin" && pass === "password") {
      //the res.cookie() method is part of Express response API. We use it to create a new cookie and pass it a name we want to use for the cookie user and this name will be used to set up a property of user on the signed cookie object.
      //the second value will be a value to store a name property and we give it a string of 'admin'
      //the third argument is optional, it is an object that contains configuration value. By setting '{signed: true}' we let the Express know to use the key from cookieParse to create a signed cookie. This res.cookie() method handles creation of the cookie and set it up in the server response to the client.
      res.cookie("user", "admin", { signed: true });
      //if successful then access is granted
      return next(); // authorized

      //if fail then will send error msg to client
    } else {
      const err = new Error("You are not authenticated!");
      res.setHeader("WWW-Authenticate", "Basic");
      err.status = 401;
      return next(err);
    }
  } else {
    if (res.signedCookies.user === "admin") {
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

app.use("/", indexRouter);
app.use("/users", usersRouter);
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
