const express = require("express");
const authenticate = require("../authenticate");
const cors = require("./cors");
const multer = require("multer");

//custom configuration how multer handle upload files. We could leave it out and multer has a way of working on this on its own but, in this case, we add our own.
//one of the options is diskStorage() method and give it object that contains option configuration setting.
//destination: cb(null, 'public/images') null means no error, public/image is the directory we are saving the image so that users can be able to access it when needed.
//filename: (null, file.originalname) null means no error, file.originalname will ensure the name of the file on client side is also the name of the file on the server. If you don’t set this multer will give random string as the name of the file on the server side.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

//this will check if the file name is not match then it will return error message other it will return true.
const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("You can upload only image files!"), false);
  }
  cb(null, true);
};

//we call multer function here
//Now the multer module is configure to accept image file upload.
const upload = multer({ storage: storage, fileFilter: imageFileFilter });

const uploadRouter = express.Router();

//configure uploadRouter to handle various https request
//we only going to accept post request but we are going to set other up for responses.
uploadRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(
    cors.cors,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end("GET operation not supported on /imageUpload");
    }
  )
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    upload.single("imageFile"),
    (req, res) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(req.file);
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /imageUpload");
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end("DELETE operation not supported on /imageUpload");
    }
  );

module.exports = uploadRouter;
