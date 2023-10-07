const express = require("express");
const User = require("../models/user");
//the passport-local-mongoose plugin provides us with methods that are useful for registering, login users.
const passport = require("passport");

const authenticate = require("../authenticate");
const cors = require("./cors");
const router = express.Router();

/* GET users listing. */
router.get(
  "/",
  cors.corsWithOptions,
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  (req, res, next) => {
    User.find()
      .then((users) => {
        (res.statusCode = 200),
          res.setHeader("Cpntent-Type", "application/json"),
          res.json(users);
      })
      .catch((err) => next(err));
    // res.send("respond with a resource");
  }
);

// //sign up router
// //this endpoint will allow a new user to register on our website. After the path argument then we need to pass the middleware function as an argument.
// //1st thing to do when new user try to sign into our system? Check if the username is not already taking.To do this then we use static method findOne() on the 'user' model to see if there is any user existing document with the same name.
// //this is implementation of user registration mechanism. Now, from the client the user will be able to go to '/user/signup' and post a request with username and password. This will be handle by the below endpoint.

// router.post("/signup", (req, res, next) => {
//   User.findOne({ username: req.body.username })
//     .then((user) => {
//       //username already exist
//       if (user) {
//         const err = new Error(`User ${req.body.username} already exists!`);
//         err.status = 403;
//         return next(err);
//         //username is avilable so create
//       } else {
//         User.create({
//           username: req.body.username,
//           password: req.body.password,
//         })
//           //Promise return, tell client username successfully created
//           .then((user) => {
//             res.statusCode = 200;
//             res.setHeader("Content-Type", "application/json");
//             res.json({ status: "Registration Successful!", user: user });
//           })
//           .catch((err) => next(err));
//       }
//     })
//     //catch error from promise return of findOne() method
//     .catch((err) => next(err));
// });

//the passport-local-mongoose plugin provides us with methods that are useful for registering and authenticating login users so we use the plugin to check if a user and password already exists instead of using session like above
//using passport sessions-based authentication on signup router instead of sessions.
//call a register() stattic method on user to check if user already exist. The register() method has three arguments. The first argument is an object that include the name created by the user giving to us by the client. The second argument is the password, it will also be taken out from the incoming request from the client. The third argument is callback function which will receive an error from register() method if there one. It will ne null if there is no error.
//we check if there is error, the error return from register() is error that occur with server configuration or internal errors not error with user name and password
//res.statusCode = 500 means internal server error so user know error is not from them it is error from the server.
//send back json object error to the client like this: res.json({ err: err }). This will provide information about the error.

router.post("/signup", cors.corsWithOptions, (req, res) => {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.json({ err: err });
      } else {
        if (req.body.firstname) {
          user.firstname = req.body.firstname;
        }
        if (req.body.lastname) {
          user.lastname = req.body.lastname;
        }
        user.save((err) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.json({ err: err });
            return;
          }

          //if there is no error we then use passport to authenticate user. This ensure that registration is successful.
          //this authenticate() method will return a function and we need to call the returning function by passing callback function that will return successful message back to the client.
          passport.authenticate("local")(req, res, () => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({ success: true, status: "Registration Successful!" });
          });
        });
      }
    }
  );
});

// router.post("/signup", (req, res) => {
//   User.register(
//     new User({ username: req.body.username }),
//     req.body.password,
//     (err, user) => {
//       if (err) {
//         res.statusCode = 500;
//         res.setHeader("Content-Type", "application/json");
//         res.json({ err: err });
//       } else {
//         //if there is no error we then use passport to authenticate user. This ensure that registration is successful.
//         //this authenticate() method will return a function and we need to call the returning function by passing callback function that will return successful message back to the client.
//         passport.authenticate("local")(req, res, () => {
//           res.statusCode = 200;
//           res.setHeader("Content-Type", "application/json");
//           res.json({ success: true, status: "Registration Successful!" });
//         });
//       }
//     }
//   );
// });

//login router.
//1st we check if the user already login that is this user already authenticated. if '(!req.session.user)' means the user is not authenticated yet. 'else' means the user alreay authenticated
//the property of 'req.session' object is automatically filled in based on if the request header contain the cookie within the existing session ID.

// router.post("/login", (req, res, next) => {
//   //the user is not authenticate yet, this also mean the user is not login.
//   //
//   if (!req.session.user) {
//     //grab authorization from request header
//     const authHeader = req.headers.authorization;

//     //server not getting any authorization credential from client then we challenge the client to provide authorization.
//     if (!authHeader) {
//       const err = new Error("You are not authenticated!");

//       //this let the client know the server is requesting authentication and the authentication is basic.
//       res.setHeader("WWW-Authenticate", "Basic");

//       // this is standard error code if credential is not provided.
//       err.status = 401;

//       //this will send the error message back to the client.
//       return next(err);
//     }

//     //if the authorization is availbale inside the header sent by the client then all below will happen. Means there is authorization header then our code will skip to below codes.
//     //the authorization header will be parse and then validate the username and password.
//     //the authorization header will contain the word BASIC then space follow by the username and password in Based-64 encoding string. Once the code is decoded it will show the username and password separate by colon.
//     //in this case we need to take out the username and password out of the HEADER string and put them into a new array.
//     //Username will hold index 1 and password will hold index 2 inside the array
//     //put the array inside const auth then use the buffer global class in Node. Since Buffer is global in Node means we do not need to REQUIRE it.
//     //the Buffer has the static method FROM to decode the username and password Buffer.from()
//     //the code inside Buffer.from() will pick the Based-64 encoding username and password and extract the username and password to be able to read and then put them into auth array as first and second items.
//     const auth = Buffer.from(authHeader.split(" ")[1], "base64")
//       .toString()
//       .split(":");
//     const username = auth[0];
//     const password = auth[1];

//     User.findOne({ username: username })
//       .then((user) => {
//         if (!user) {
//           const err = new Error(`User ${username} does not exist!`);
//           err.status = 401;
//           return next(err);
//         } else if (user.password !== password) {
//           const err = new Error("Your password is incorrect!");
//           err.status = 401;
//           return next(err);
//         } else if (user.username === username && user.password === password) {
//           req.session.user = "authenticated";
//           res.statusCode = 200;
//           res.setHeader("Content-Type", "text/plain");
//           res.end("You are authenticated!");
//         }
//       })
//       .catch((err) => next(err));
//     //the user alreay authenticated so we return successful code and message to client. This also mean the user already login
//   } else {
//     res.statusCode = 200;
//     res.setHeader("Content-Type", "text/plain");
//     res.end("You are already authenticated!");
//   }
// });

//remember passport took advantage of multiple middlewares with Express router method
//so, passport.authenticate("local"): enables passport authentication on this router and if there is no error it will continue to the next middleware.
//the passport authenticate() method handles login and user for us and make us to have a short codes than what we have above. It will help us challenge the user for credentials, passing the credential from the request body, and all of that. So if there is error passport would have taken care of that for us. so, we just need to set up response if the login is successful.

// router.post("/login", passport.authenticate("local"), (req, res) => {
//   res.statusCode = 200;
//   res.setHeader("Content-Type", "application/json");
//   res.json({ success: true, status: "You are successfully logged in!" });
// });

//here we are using localStrategy to authenticate the user
//once the user is authenticate then we issue a token for the issue.We use getToken() method we export from authenticate module and pass it an object that contains the payload.
router.post(
  "/login",
  cors.corsWithOptions,
  passport.authenticate("local"),
  (req, res) => {
    const token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({
      success: true,
      token: token,
      status: "You are successfully logged in!",
    });
  }
);

//Log out router
//we need to tell the server to stop tracking the session after user has log out.
//'if (req.session)' if a session exist then use destroy() method req.session.destroy() to destroy the session tracking and clearCookie() method clearCookie("session-id") to clear the cookies and then use redirect() method to redirect to the main page.
//otherwise if session is not exist send the error message to the client to tell client it is not login

// router.get("/logout", cors.corsWithOptions, (req, res, next) => {
//   if (req.session) {
//     req.session.destroy();
//     res.clearCookie("session-id");
//     res.redirect("/");
//   } else {
//     const err = new Error("You are not logged in!");
//     err.status = 401;
//     return next(err);
//   }
// });

// //week3 assignment
// //cors.corsWithOptions: this is not used in the lecture video but I used it since it apply to other routers
// router.get("/users", cors.corsWithOptions, (req, res, next) => {
//   if (req.user.admin) {
//     res.statusCode = 200;
//     res.setHeader("Content-Type", "application/json");
//     res.json(req.user.admin);
//   } else {
//     const err = new Error("unathorized!");
//     err.status = 401;
//     return next(err);
//   }
// });

router.get(
  "/facebook/token",
  passport.authenticate("facebook-token"),
  (req, res) => {
    if (req.user) {
      const token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        token: token,
        status: "You are successfully logged in!",
      });
    }
  }
);

module.exports = router;
