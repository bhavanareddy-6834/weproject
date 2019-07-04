const express = require('express');
const finapp = new express();
const pdf = require('pdf-parse');
var back = require('express-back');

var firebase = require('firebase');
// require('firebase/auth');
// var database = require('firebase/database');
const ejs = require('ejs');
var bodyParser = require("body-parser");
const {Storage} = require('@google-cloud/storage');
const Multer = require('multer');
var session = require('express-session');
var fs = require('fs');
//var sync = require('synchronize');
//var database = firebase.database();

//sync(fs, 'readFile')


const storage = new Storage({
  projectId: "your projrct id",
  keyFilename: "json file path"
});

finapp.set('view engine', 'ejs');
finapp.use(bodyParser.urlencoded({ extended: false }));
finapp.use(bodyParser.json());
finapp.use(session({secret: 'notsosecretkey123',resave:false,saveUninitialized:true}));
finapp.use(back());

var firebaseConfig = {
    apiKey: "your api key",
    authDomain: "your auth domain",
    databaseURL: "database url",
    projectId: "your project id",
    storageBucket: "url",
    messagingSenderId: "id",
    appId: "your app id"
  };

firebase.initializeApp(firebaseConfig);

var admin = require("firebase-admin");

var serviceAccount = require("json file path");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "url"
});

var bucket = admin.storage().bucket();

//const bucket = storage.bucket("weproject-e79b0.appspot.com");

// 'bucket' is an object defined in the @google-cloud/storage library.
// See https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/latest/storage/bucket
// for more details.

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
  });

console.log('hello')

finapp.get('/', function(req, res){
    res.render('index');
})

finapp.get('/register', function(req, res){
    res.render('register');
})

finapp.get('/login', function(req, res){
    res.render('login');
})

finapp.get('/logout', function(req, res){
    firebase.auth().signOut().then(function(){
            console.log('signed out successfully');
            res.redirect('/');
    }).catch(function(error){

    });
});

finapp.post('/authenticate', function(req, res){
    var email = req.body.mail;
    var password = req.body.psw;
    var errorCode = null;
    var errorMessage = null
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error){
        errorCode = error.code;
        errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    })
    .then(function(userRecord) {
        if(errorCode==null)
        {userId = userRecord.user.uid
        console.log(userRecord.user.uid)
    email = email.replace('@', '');
    email = email.replace('.', '');
    req.session.username = email;
    res.redirect('home');
        }
});
});

finapp.post('/add', function(req, res){
    var email = req.body.mail;
    var password = req.body.psw;
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error){
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage)
    });
    res.redirect('home');
});

finapp.get('/home', function(req, res){
  var bookNames = [];
  var bookUrls = [];
  var notesUrls = [];
  firebase.database().ref('users/' + req.session.username + '/Books').once('value')
  .then(snap => {
    snap.forEach(childSnap => {
      bookname = childSnap.val().bookname;
      bookurl = childSnap.val().bookUrl;
      noteurl = childSnap.val().notesUrl;
      if (bookname != null){
        bookNames.push(bookname);
        bookUrls.push(bookurl);
        notesUrls.push(noteurl);
      }
    });
    console.log(bookNames);
    console.log(bookUrls);
    res.render('home', {b1: bookNames, b2: bookUrls, n: notesUrls});
    return null;
  }).catch(error => {
    //handle the error
    console.log(error)
  });
});

finapp.post('/upload', multer.single('file'), function(req, res){
    var file = req.file; 
  if (file) {
    uploadFileToStorage(file, req).then((success) => {
      res.status(200).send({
        status: 'success'
      });
    }).catch((error) => {
      console.error(error);
    });
  }
  res.redirect('home');
});

const uploadFileToStorage = (file, req) => {
    return new Promise((resolve, reject) => {
      var url = null;
      var data = null;
      if (!file) {
        reject('No image file');
      }
      var newFileName = `${file.originalname}`;
  
      var fileUpload = bucket.file(newFileName);
  
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype
        }
      });
  
      blobStream.on('error', (error) => {
        
        reject('Something is wrong! Unable to upload at the moment.' + error);
      });
  
      blobStream.on('finish', () => {
        req.file.cloudStorageObject = newFileName;
        fileUpload.makePublic().then(() => {
          req.file.cloudStoragePublicUrl = getPublicUrl(newFileName);
        });
      });
  
      blobStream.end(file.buffer);
      addBookDetails(newFileName, req);
    });
  
}

function getPublicUrl (filename) {
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

finapp.post('/notes', function(req, res){
  var data = null;
  console.log(req.body.notes);
  fs.readFile(req.body.notes, function(err, buf) {
    data = buf.toString();
    console.log(buf.toString());
    console.log(data);
  res.render('notes', {text: data});
  });
})

finapp.post('/book', function(req, res){
  req.session.bookname = req.body.bookname;
  if (!fs.existsSync(req.body.bookname)){

  var remoteFile = bucket.file(req.body.bookname);
  var x = async() => { remoteFile.createReadStream()
  .on('error', function(err) {})
  .on('response', function(response) {
    // Server connected and responded with the specified status and headers.
   })
  .on('end', function() {
    // The file is fully downloaded.
  })
  .pipe(fs.createWriteStream(req.body.bookname)); }
  x();
}
    // fs.readFileSync(req.body.bookname)
  var dataBuffer = fs.readFileSync(req.body.bookname);
  pdf(dataBuffer).then(function(data) {
 
    // number of pages
    console.log(data.numpages);
    // number of rendered pages
    console.log(data.numrender);
    // PDF info
    console.log(data.info);
    // PDF metadata
    console.log(data.metadata); 
    // PDF.js version
    // check https://mozilla.github.io/pdf.js/getting_started/
    console.log(data.version);
    // PDF text
    console.log(data.text); 

    res.render('book2', {text: data.text, bookname: req.body.bookname});
        
});

});

finapp.get('/book', function(req, res){
  // var bookurl = req.body.book;
  // const url = new URL(import.meta.bookurl);var remoteFile = bucket.file(req.body.bookname);
  //var data = null;
  if (!fs.existsSync(req.session.bookname)){

  var remoteFile = bucket.file(req.session.bookname);
  var x = async() => { remoteFile.createReadStream()
  .on('error', function(err) {})
  .on('response', function(response) {
    // Server connected and responded with the specified status and headers.
   })
  .on('end', function() {
    // The file is fully downloaded.
  })
  .pipe(fs.createWriteStream(req.session.bookname)); }
  x();
}
    // fs.readFileSync(req.body.bookname)
  var dataBuffer = fs.readFileSync(req.session.bookname);
  pdf(dataBuffer).then(function(data) {
 
    // number of pages
    console.log(data.numpages);
    // number of rendered pages
    console.log(data.numrender);
    // PDF info
    console.log(data.info);
    // PDF metadata
    console.log(data.metadata); 
    // PDF.js version
    // check https://mozilla.github.io/pdf.js/getting_started/
    console.log(data.version);
    // PDF text
    console.log(data.text); 

    res.render('book2', {text: data.text, bookname: req.session.bookname});
        
});

});

finapp.post('/appendText', function(req, res){
  fs.appendFile(req.body.bookname+"_Notes.txt", req.body.content, function (err) {
    if (err) throw err;
    console.log('Saved!');
    return res.back();
  });
})

function addBookDetails(newFileName, req){
  var username = req.session.username;
    username = username.replace('@','');
    username = username.replace('.','');
    var databaseRef = firebase.database().ref('users/' + username + "/Books");
    var nextRef = databaseRef.push();
    nextRef.set({
        'bookname': newFileName,
        'bookUrl': getPublicUrl(newFileName),
        'notesUrl': 'C:/Project/'+newFileName+ '_Notes.txt',
        //'content' : data
    });
    var writeStream = fs.createWriteStream(newFileName + "_Notes.txt");
    writeStream.write("");
    writeStream.end();
    //console.log(data);
}

finapp.get('/demo', function(req, res){
  var data = null;
  fs.readFile('HTML and CSS basics.txt_Notes.txt', function(err, buf) {
    data = "hello " + buf.toString();
    console.log(buf.toString());
    // res.render('notes', {text: data})
    console.log(data);
    res.render('notes', {text: data});
  });
})
finapp.listen(process.env.PORT || 5002, function(){
    console.log('Your node js server is running');
  });
