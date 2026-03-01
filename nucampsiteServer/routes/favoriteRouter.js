const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');


const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then(favoriteDoc => {
                console.log(favoriteDoc);

                if (favoriteDoc.length === 0 || favoriteDoc[0].campsites.length <= 0) {
                    console.log('test 1')
                    const err = new Error('There are no favorites for this user');
                    err.status = 404;
                    return next(err)
                }

                console.log('test2')
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favoriteDoc)
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favoriteDoc => {
                console.log(favoriteDoc)
                if (!favoriteDoc) {
                    console.log('Creating new favorite document');
                    return Favorite.create({
                        user: req.user._id,
                        campsites: req.body.map(item => item._id)
                    })
                }

                let duplicate;
                console.log('Updating existing favorite document');

                req.body.forEach(item => {
                    if (!favoriteDoc.campsites.includes(item._id)) {
                        favoriteDoc.campsites.push(item._id)
                    } else {
                        duplicate = true;
                    }
                });

                if (duplicate) {
                    res.statusCode = 409;
                    res.setHeader('Content-Type', 'application/json');
                    res.json('Campsites already in favorites list');
                    return null;
                }

                return favoriteDoc.save();


            })
            .then(updatedFavoriteDoc => {
                if (updatedFavoriteDoc) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(updatedFavoriteDoc);
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then(deletedDoc => {
                console.log(deletedDoc);

                if (!deletedDoc) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You do not have any favorites to delete.')
                    return null;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(deletedDoc)
            })
            .catch(err => next(err));
    })


favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/:campsiteId');
    })
    .post(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favoriteDoc => {
                console.log(favoriteDoc)

                if (!favoriteDoc) {
                    console.log('Creating new favorite documement');
                    return Favorite.create({
                        user: req.user._id,
                        campsites: [req.params.campsiteId]
                    })
                }

                if (favoriteDoc.campsites.includes(req.params.campsiteId)) {
                    console.log('it includes!');
                    res.statusCode = 409;
                    res.setHeader('Content-type', 'text/plain');
                    res.end('That campsite is already in the list of favorites!')
                    return null;
                } else {
                    favoriteDoc.campsites.push(req.params.campsiteId)
                    return favoriteDoc.save();
                }
            })
            .then(updatedFavoriteDoc => {
                if (!updatedFavoriteDoc) return;

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(updatedFavoriteDoc)
            })
            .catch(err => next(err));
    })
    .put(cors.cors, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/:campsiteId');
    })
    .delete(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favoriteDoc => {
                console.log(favoriteDoc);

                if (!favoriteDoc) {
                    res.statusCode = 409;
                    res.setHeader('Content-Type', 'application/json');
                    res.json('No favorites list');
                    return null;
                }

                const exists = favoriteDoc.campsites.some(id => id.equals(req.params.campsiteId));

                if (!exists) {
                    res.statusCode = 409;
                    res.setHeader('Content-Type', 'application/json');
                    res.json('This is not in your favorites list');
                    return null;
                }

                favoriteDoc.campsites.pull(req.params.campsiteId);
                return favoriteDoc.save();

            })
            .then(updatedFavoriteDoc => {
                if (!updatedFavoriteDoc) return;
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(updatedFavoriteDoc);

            })
            .catch(err => next(err));
    })


module.exports = favoriteRouter;