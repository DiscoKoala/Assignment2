/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

require('dotenv').config();
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //hack
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };

        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successfully created new user.'})
    }
});

router.post('/signin', (req, res) => {
    var user = db.findOne(req.body.username);

    if (!user) {
        res.status(401).send({success: false, message: 'Authentication failed. User not found.'});
    } else {
        if (req.body.password == user.password) {
            var userToken = { id: user.id, username: user.username };
            var token = jwt.sign(userToken, process.env.SECRET_KEY);
            res.json ({success: true, token: 'JWT ' + token});
        }
        else {
            res.status(401).send({success: false, message: 'Authentication failed.'});
        }
    }
});

router.get('/movies', (req, res) => {
    var movie = db.findOneMovie(req.body.title);

    if(!movie){
        res.status(404).send({success: false, message: 'Query failed. Movie not found.'});
    } else {
        if(req.body.title == movie.title) {
            // var movieToken = { id: movie.title };
            // var token = jwt.sign(movieToken, process.env.SECRET_KEY);
            res.status(200).json({success: true, message: 'GET movies'});
        }
        else{
            res.status(404).send({success: false, message: 'Query failed.'});
        }
    }
});

router.post('/movies', (req, res) => {
    var newMovie = {
        title: req.body.title
    };
    // var token = jwt.sign(newMovie, process.env.SECRET_KEY);
    db.saveMovie(newMovie); //no duplicate checking
    res.status(200).json({success: true, message: 'movie saved'});
});

router.delete('/movies', authController.isAuthenticated, (req, res) => {
    var movie = db.findOneMovie(req.body.title);

    if(!movie){
        res.status(404).send({success: false, message: 'Query failed. Movie not found.'});
    } else{
        if(req.body.title == movie.title){
            db.removeMovie(movie.title);
            res.status(200).json({success: true, message: 'movie deleted'});
        }
        else{
        res.status(404).send({success: false, message: 'Query failed. Movie not found.'});
        }
    }
});

router.put('/movies', authJwtController.isAuthenticated, (req, res) => {
    var movie = db.findOneMovie(req.body.title);

    if(!movie){
        res.status(404).send({success: false, message: 'Query failed. Movie not found.'});
    } else{
        if(req.body.title == movie.title){
            db.updateMovie(movie);
            var movieToken = {title: movie.title};
            var token = jwt.sign(movieToken, process.env.SECRET_KEY)
            res.status(200).json({success: true, message: 'movie updated', token});
        }
        else{
        res.status(404).send({success: false, message: 'Query failed. Movie not found.'});
        }
    }
});

router.route('/testcollection')
    .delete(authController.isAuthenticated, (req, res) => {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    )
    .put(authJwtController.isAuthenticated, (req, res) => {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    );
    
app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


