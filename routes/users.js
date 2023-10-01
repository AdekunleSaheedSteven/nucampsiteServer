const express = require("express");
const User = require("../models/user");
const router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

//sign up router
//this endpoint will allow a new user to register on our website. After the path argument then we need to pass the middleware function as an argument.
//1st thing to do when new user try to sign into our system? Check if the username is not already taking.To do this then we use static method findOne() on the 'user' model to see if there is any user existing document with the same name.
//this is implementation of user registration mechanism. Now, from the client the user will be able to go to '/user/signup' and post a request with username and password. This will be handle by the below endpoint.
router.post("/signup", (req, res, next) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      //username already exist
      if (user) {
        const err = new Error(`User ${req.body.username} already exists!`);
        err.status = 403;
        return next(err);
        //username is avilable so create
      } else {
        User.create({
          username: req.body.username,
          password: req.body.password,
        })
          //Promise return, tell client username successfully created
          .then((user) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({ status: "Registration Successful!", user: user });
          })
          .catch((err) => next(err));
      }
    })
    //catch error from promise return of findOne() method
    .catch((err) => next(err));
});

//login router.
//1st we check if the user already login that is this user already authenticated. if '(!req.session.user)' means the user is not authenticated yet. 'else' means the user alreay authenticated
//the property of 'req.session' object is automatically filled in based on if the request header contain the cookie within the existing session ID.

router.post("/login", (req, res, next) => {
  //the user is not authenticate yet, this also mean the user is not login.
  //
  if (!req.session.user) {
    //grab authorization from request header
    const authHeader = req.headers.authorization;

    //server not getting any authorization credential from client then we challenge the client to provide authorization.
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
    //the authorization header will be parse and then validate the username and password.
    //the authorization header will contain the word BASIC then space follow by the username and password in Based-64 encoding string. Once the code is decoded it will show the username and password separate by colon.
    //in this case we need to take out the username and password out of the HEADER string and put them into a new array.
    //Username will hold index 1 and password will hold index 2 inside the array
    //put the array inside const auth then use the buffer global class in Node. Since Buffer is global in Node means we do not need to REQUIRE it.
    //the Buffer has the static method FROM to decode the username and password Buffer.from()
    //the code inside Buffer.from() will pick the Based-64 encoding username and password and extract the username and password to be able to read and then put them into auth array as first and second items.
    const auth = Buffer.from(authHeader.split(" ")[1], "base64")
      .toString()
      .split(":");
    const username = auth[0];
    const password = auth[1];

    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          const err = new Error(`User ${username} does not exist!`);
          err.status = 401;
          return next(err);
        } else if (user.password !== password) {
          const err = new Error("Your password is incorrect!");
          err.status = 401;
          return next(err);
        } else if (user.username === username && user.password === password) {
          req.session.user = "authenticated";
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("You are authenticated!");
        }
      })
      .catch((err) => next(err));
    //the user alreay authenticated so we return successful code and message to client. This also mean the user already login
  } else {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("You are already authenticated!");
  }
});

//Log out router
//we need to tell the server to stop tracking the session after user has log out.
//'if (req.session)' if a session exist then use destroy() method req.session.destroy() to destroy the session tracking and clearCookie() method clearCookie("session-id") to clear the cookies and then use redirect() method to redirect to the main page.
//otherwise if session is not exist send the error message to the client to tell client it is not login

router.get("/logout", (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie("session-id");
    res.redirect("/");
  } else {
    const err = new Error("You are not logged in!");
    err.status = 401;
    return next(err);
  }
});

module.exports = router;
