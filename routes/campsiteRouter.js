const express = require("express");
const Campsite = require("../models/campsite");
const authenticate = require("../authenticate");
const cors = require("./cors");

const campsiteRouter = express.Router();

//we now authenticate post, put and delete by using the code: authenticate.verifyUser. We did not authenticate get because it is reading action and never change anything in the database.

//option router() is handling preflight request. If the option request is received then we call "cors.corsWithOptions" and callback function to respond back to client with status code of 200.
// for get() method we then include CORS middleware which is "cors.cors"

campsiteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.find()
      .populate("comments.author")
      .then((campsites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsites);
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.create(req.body)
        .then((campsite) => {
          console.log("Campsite is created", campsite);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite);
        })
        .catch((err) => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /campsites");
    }
  )

  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.deleteMany()
        .then((response) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        })
        .catch((err) => next(err));
    }
  );

campsiteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  // .all((req, res, next) => {
  //   res.statusCode = 200;
  //   res.setHeader("Content-Type", "text/plain");
  //   next();
  // })
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate("comments.author")
      .then((campsite) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsite);
      })
      .catch((err) => next(err));
    // res.end(
    //   `Will send details of the campsite: ${req.params.campsiteId} to you`
    // );
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.setHeader("Content-Type", "text/plain");
      res.end(
        `POST operation not supported on /campsites/${req.params.campsiteId}`
      );
    }
  )

  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.findByIdAndUpdate(
        req.params.campsiteId,
        { $set: req.body },
        { new: true }
      )
        .then((campsite) => {
          res.statusCode = 200;
          res.setHeader = ("Content-Type", "application/json");
          res.json(campsite);
        })
        .catch((err) => next(err));
      // res.write(`Updating the campsite: ${req.params.campsiteId}\n`);
      // res.end(`Will update the campsite: ${req.body.name}
      //   with description: ${req.body.description}`);
    }
  )

  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.findByIdAndDelete(req.params.campsiteId)
        .then((response) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        })
        .catch((err) => next(err));
      // res.end(`Deleting campsite: ${req.params.campsiteId}`);
    }
  );

//Endpoint for: /:campsiteId/comments

campsiteRouter
  .route("/:campsiteId/comments")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate("comments.author")
      .then((campsite) => {
        if (campsite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite.comments);
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite) {
          req.body.author = req.user._id;
          campsite.comments.push(req.body);
          campsite
            .save()
            .then((campsite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(campsite);
            })
            .catch((err) => next(err));
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.setHeader("Content-Type", "text/plain");
      res.end(
        `PUT operation not supported on /campsites/${req.params.campsiteId}/comments`
      );
    }
  )

  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
        .then((campsite) => {
          if (campsite) {
            for (let i = campsite.comments.length - 1; i >= 0; i--) {
              campsite.comments.id(campsite.comments[i]._id).remove();
            }
            campsite
              .save()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  );

//Endpoint for: /:campsiteId/comments/:commentId

campsiteRouter
  .route("/:campsiteId/comments/:commentId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate("comments.author")
      .then((campsite) => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite.comments.id(req.params.commentId));
        } else if (!campsite) {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.setHeader("Content-Type", "text/plain");
      res.end(
        `POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`
      );
    }
  )

  //week 3 question 4 first attempt start here
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
        .then((campsite) => {
          const commentToUpdate = campsite.comments.id(req.params.commentId);
          if (campsite && campsite.commentToUpdate) {
            if (String(commentToUpdate.author) === String(req.user._id)) {
              if (req.body.rating) {
                // campsite.comments.id(req.params.commentId).rating = req.body.rating;
                commentToUpdate.rating = req.body.rating;
              }
              if (req.body.text) {
                // campsite.comments.id(req.params.commentId).text = req.body.text;
                commentToUpdate.text = req.body.text;
              }
              campsite
                .save()
                .then((campsite) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(campsite);
                })
                .catch((err) => next(err));
            }
          } else if (String(commentToUpdate.author) !== String(req.user._id)) {
            const err = new Error(
              "You are not authorized to update this comment!"
            );
            err.status = 403;
            return next(err);
          } else if (!campsite) {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
          } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));

      // week 3 question 4 first attempt workshop assignment finished here
    }
  )

  //week 3 question 4 second attempt start here
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
        .then((campsite) => {
          const commentToUpdate = campsite.comments.id(req.params.commentId);
          if (campsite && campsite.commentToUpdate) {
            if (String(commentToUpdate.author) === String(req.user._id)) {
              if (req.body.rating) {
                // campsite.comments.id(req.params.commentId).rating = req.body.rating;
                commentToUpdate.rating = req.body.rating;
              }
              if (req.body.text) {
                // campsite.comments.id(req.params.commentId).text = req.body.text;
                commentToUpdate.text = req.body.text;
              }
              campsite
                .save()
                .then((campsite) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(campsite);
                })
                .catch((err) => next(err));
            }
          } else if (String(commentToUpdate.author) !== String(req.user._id)) {
            const err = new Error(
              "You are not authorized to update this comment!"
            );
            err.status = 403;
            return next(err);
          } else if (!campsite) {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
          } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));

      // week 3 question 4 second attempt workshop assignment finished here
    }
  );

module.exports = campsiteRouter;
