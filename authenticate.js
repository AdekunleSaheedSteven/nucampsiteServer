const passport = require("passport"); //require passport middleware
const LocalStrategy = require("passport-local").Strategy; //require local strategy from the passport-local library
const User = require("./models/user"); //require user module from user module file.

const JwtStrategy = require("passport-jwt").Strategy;

//this is object that will provide us with several helper methods that can be used to extract token from request object
const ExtractJwt = require("passport-jwt").ExtractJwt;

//this is used create, sign, and verify tokens
const jwt = require("jsonwebtoken");

//import the config file that we created
const config = require("./config.js");

//use the passport.use() method to add specific strategy plugin for our passport implementation. Here we use local strategy, the local strategy instance require a verify function function. This function will verify the username and function aginst the locally stored username and password. We use the authenticate() method provided by passport-local-mongoose plugin to solve this issue. This method on user model. it will look like this: User.authenticate()

exports.local = passport.use(new LocalStrategy(User.authenticate()));

//Since we are using passport with session-based authentication not token-based authentication then we need to do couple of operations on the user such as serialization user and deserialization of user.
//when a user has been successfully verified, the user data has to be grab from the sessions and add to the request object. There is a process called deserialization to that data so that can be possible.When we receive data from about the user from the reques object and we need to convert it to store and session data and there is corresponding process called serialization need to happen. We use methods provided by passport and passport-local-mongoose like this: passport.serializeUser(User.serializeUser()) and passport.deserializeUser(User.deserializeUser())
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//export getToken method: this method will receive a object called 'user' this user object will contain an ID for user document.
//inside the function we return token created by jwt.sign() method.
//This jwt.sign() method is part of jwt API, it will take the 'user' object that was pass in as 1st argument
//the 2nd argument is the secret key from the config module we just created.
//the 3rd argument is additional information to configure the secret key to expire in 3600 seconds which is an hour. If this is not configure the token will not be expired. That is not recommended though you can make it last longer.
exports.getToken = (user) => {
  return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

//consfigure web token strategy for passport
// const opts: contains options for jwt strategy and initialize it as empty object.
//we then set two properties in the opts object that we will use to configure the jwt strategy.
//The 1st one is called wtFromRequest, we use the Extract we require earlier and Extract methond ExtractJwt.fromAuthHeaderAsBearerToken(). This actually specifies how jwt should be extracted from incming message. This is because client could send jwt token in various way. It could be sent in header, body or part of URL query parameters.
//the 2nd one is called secretOrKey, this option let us supply the jwt strategy with the key which will sign the token. This is set to the secret key we set up in config.js file.
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

//jwt strategy is now ready for export, it is exported as jwtPassport and assign it to passport.use() that will take instance of jwt strategy as argument. This can be done by using jwt strategy constructor: new jwtPassport() and this constructor will take in two arguments.
//1st argument, is the object with configuration option we configure above which is 'opts'
//2nd argument, is a verify callback function. This callback take in two arguments of its own:
//1st argument, jwt_payload: is an object literal containing the decoded JWT payload
//2nd argument, done: is a passport error first callback function accepting arguments done (error, user, info)
//we use findOne() on User collection and search for user with the same ID in token, 2nd argument of findOne() method is an error callback function.
//if there is an error then we send error to done callback function with these argument (err, false) means send the error and false means no user was found
//If user is found then we have these arguments (null, user) null means no error and then send the user document.
// (null, false) this mean no error and also no user document was found.
exports.jwtPassport = passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    console.log("JWT payload:", jwt_payload);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      } else if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

//this is use to verify incoming user is coming from authenticated user and we use jwt to stated we are use jwt strategy.Sessions: false indicate that we are not using section
exports.verifyUser = passport.authenticate("jwt", { session: false });
