const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .populate('user')
            .populate('campsites')

            .then(userFavorites => {
                
                console.log(userFavorites)
                if (!userFavorites) {
                    console.log('test');
                    const err = new Error('There are no favorites associated with this user');
                    err.status = 404
                    return next(err);
                } else if (userFavorites.campsites.length === 0) {
                    console.log('test');
                    const err = new Error('There are no favorites associated with this user');
                    err.status = 404
                    return next(err);
                } else {
                    console.log('test2')
                    res.statusCode = (200);
                    res.setHeader('Content-Type', 'application/json');
                    res.json(userFavorites)
                }

            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {

                if (!favorite) {
                    console.log('creating new favorite document')
                    return Favorite.create({
                        user: req.user._id,
                        campsites: req.body.map(item => item._id)
                    })
                }

                if (favorite.campsites.length === 0) {
                    favorite.deleteOne();
                    return Favorite.create({
                        user: req.user._id,
                        campsites: req.body.map(item => item._id)
                    })
                }

                let duplicate = false;

                console.log('Updating users favorite document')

                req.body.forEach(item => {
                    if (!favorite.campsites.includes(item._id)) {
                        favorite.campsites.push(item._id)
                    } else {
                        duplicate = true;
                    }
                })
                if (duplicate) {
                    res.statusCode = 409;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({
                        message: 'That campsite is already a favorite'
                    });
                    return null;

                }

                return favorite.save();

            })
            .then(updatedFavorite => {
                if (updatedFavorite) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ updatedFavorite });
                }

            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites')
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then(deletedFavorite => {

                if (!deletedFavorite) {
                    return res.status(409).type('text/plain').json('You do not have any favorites to delete');
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(deletedFavorite);
            })
            .catch(err => next(err));
    })

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/:campsiteId');
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        const campsiteId = req.params.campsiteId
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {

                if (!favorite) {
                    console.log('creating new favorite document')
                    return Favorite.create({
                        user: req.user._id,
                        campsites: [campsiteId]
                    })
                }

                const alreadyFavorite = favorite.campsites.some(id => id.equals(campsiteId));

                if (alreadyFavorite) {
                    res.status(409).type('application/json').json({
                        message: 'That campsite is already in the list of favorites!'
                    });
                    return null;
                }

                favorite.campsites.push(campsiteId);
                return favorite.save()
            })
            .then(updatedFavorite => {
                if (!updatedFavorite) return;

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(updatedFavorite);


            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/campsiteId');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

        const campsiteId = req.params.campsiteId

        Favorite.findOne({ user: req.user._id })
            .then(favorite => {

                if (!favorite) {
                    return res.status(409).type('application/json').json({ message: "You don't any favorites" });

                }

                const exists = favorite.campsites.some(id => id.equals(campsiteId))

                if (!exists) {
                    res.status(409).type('application/json').json({ message: 'This campsite is not in your favorites list' });
                    return null;
                }

                favorite.campsites.pull(campsiteId)
                return favorite.save();

            })
            .then(updatedFavorite => {
                if (!updatedFavorite) return;

                return res.status(200).type('application/json').json(updatedFavorite);


            })
            .catch(err => next(err));

    })

module.exports = favoriteRouter