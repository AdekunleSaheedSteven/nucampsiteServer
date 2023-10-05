//this is Cors module setup
//after installing Cors: npm install cors@2.8.5, then we require it.
const cors = require("cors");
//whitelist is the list of endpoint protocol we want our server to accept from client.
const whitelist = ["http://localhost:3000", "https://localhost:3443"];
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  console.log(req.header("Origin"));
  //if block check index of whitelist so if the index return -1 means the item is not found
  //if item is found then we say origin: true (corsOptions = { origin: true };) which mean our server should accept the endpoints listed in whitelist else origin: false (corsOptions = { origin: false };). means the server should not accept the endpoint.
  //callback(null, corsOptions) means no error has occur and pass the corsOptions object
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

//exporting 2 middleware functions from this module.
//when we call cors it will return to us middleware configue to set the CORS headers of access-control-allow-origin on a response object with a "wildcard" as its value. Which mean it will allow CORS for all origins.
//the second function expoted is CORS with options. This time we call the CORS function again but give it corsOptionsDelegate we created early as its argument. This will also return to us middleware function. This one will check the incoming origins and see if it belong to one of the whitelisted origins, the localhost 3000 or localhost3443 as we have set up. If does then it will send back CORS response header of access-control-allow-origin. This time it will use whitelisted origin as its value. If fail it will not include the CORS header in it response at all.
exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);
