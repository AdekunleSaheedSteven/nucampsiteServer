const express = require("express");
const authenticate = require("../authenticate");
const cors = require("./cors");
const Favorite = require("../models/favorite");

const favoriteRouter = express.Router();

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("user")
      .populate("campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const userId = req.user._id;
    const campsiteIdsToAdd = req.body.map((item) => item._id);

    Favorite.findOne({ user: userId })
      .then((favorite) => {
        if (favorite) {
          // Check which campsite IDs are not already in the favorite document
          const newCampsiteIds = campsiteIdsToAdd.filter(
            (id) => !favorite.campsites.includes(id)
          );

          // Add new campsite IDs to the favorite document
          favorite.campsites.push(...newCampsiteIds);

          // Save the updated favorite document
          favorite
            .save()
            .then((updatedFavorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(updatedFavorite);
            })
            .catch((err) => next(err));
        } else {
          // Create a new favorite document
          Favorite.create({ user: userId, campsites: campsiteIdsToAdd })
            .then((newFavorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(newFavorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain");
    res.end("PUT operation not supported on /favorites");
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete()
      .then((favorite) => {
        if (favorite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        } else {
          res.statusCode = 403;
          res.setHeader("Content-Type", "text/plain");
          res.end("You do not have any favorites to delete.");
        }
      })
      .catch((err) => next(err));
  });
favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res) => {
    res.statusCode = 403;
    res.end("GET operation not supported on /favorites");
  })

  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const campsiteId = req.params.campsiteId;

    // Find the favorite document for the user
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          // Check if the campsite is already in the favorite.campsites array
          if (favorite.campsites.includes(campsiteId)) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            res.end("That campsite is already in the list of favorites!");
          } else {
            // Add the campsite to the favorite.campsites array
            favorite.campsites.push(campsiteId);

            // Save the updated favorite document
            favorite
              .save()
              .then((updatedFavorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(updatedFavorite);
              })
              .catch((err) => next(err));
          }
        } else {
          // Create a new favorite document for the user and add the campsite to it
          Favorite.create({ user: req.user._id, campsites: [campsiteId] })
            .then((newFavorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(newFavorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })

  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain");
    res.end("PUT operation not supported on /favorites");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const campsiteId = req.params.campsiteId;

    // Find the favorite document for the user
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          // Check if the campsiteId is in the favorite.campsites array
          const index = favorite.campsites.indexOf(campsiteId);
          if (index !== -1) {
            // Remove the campsiteId using splice
            favorite.campsites.splice(index, 1);

            // Save the updated favorite document
            favorite
              .save()
              .then((updatedFavorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(updatedFavorite);
              })
              .catch((err) => next(err));
          } else {
            // If campsiteId is not found in the array, respond with a message
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            res.end("Campsite is not in your favorites.");
          }
        } else {
          // If no favorite document exists, respond with a message
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("You have no favorites to delete.");
        }
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
