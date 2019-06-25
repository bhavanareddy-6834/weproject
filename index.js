const express = require('express');
const finapp = new express();

var firebase = require('firebase/app');
require('firebase/auth');
const ejs = require('ejs');
var bodyParser = require("body-parser");

finapp.set('view engine', 'ejs');
finapp.use(bodyParser.urlencoded({ extended: false }));
finapp.use(bodyParser.json());

var firebaseConfig = {
    apiKey: "AIzaSyATl5klh-cuxfH4_rmYpQAT10Bcuq2VH7E",
    authDomain: "weproject-e79b0.firebaseapp.com",
    databaseURL: "https://weproject-e79b0.firebaseio.com",
    projectId: "weproject-e79b0",
    storageBucket: "",
    messagingSenderId: "406876267281",
    appId: "1:406876267281:web:0da0a8986e90d1f8"
  };

  firebase.initializeApp(firebaseConfig);

console.log('hello')

finapp.get('/', function(req, res){
    res.render('indes');
})

finapp.get('/register', function(req, res){
    res.render('register');
})

finapp.get('/login', function(req, res){
    res.render('login');
})

finapp.get('/logout', function(req, res){
    res.render('index');
    firebase.auth().signOut().then(function(){
            console.log('signed out successfully');
    }).catch(function(error){

    });
    res.render('indes');
});

finapp.post('/authenticate', function(req, res){
    var email = req.body.mail;
    var password = req.body.psw;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error){
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });
    res.render('home.ejs');
});

finapp.get('/addfile', function(req, res){
    res.render('addfile.ejs');
})
finapp.post('/add', function(req, res){
    var email = req.body.mail;
    var password = req.body.psw;
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error){
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });
    
    res.render('home.ejs');
});

finapp.listen(process.env.PORT || 5002, function(){
    console.log('Your node js server is running');
  });