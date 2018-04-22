/*

IMPORT EVERYTHING

*/
const express = require('express'); // used for express.js
const path = require('path'); // allows filesystem access, and directory helper methods
const ejs = require('ejs'); // Effective JS layouts, our template rendering engine
const partials = require('express-partials'); // used with ejs to render partial layouts
const expre

var MongoClient = require('mongodb').MongoClient; // mongo driver

// this URL allows you to connect to the db, to the admin user. Use in your local session
// if you want to manipulate the DB
const db = "mongodb://admin:password@ds253879.mlab.com:53879/keimena";


/* 

SETUP PASSPORT

*/

// passport is the module which provides authentication
const passport = require('passport'),
      LocalStrategy = require('passport-local').Strategy;

// auth strategy for our setup
passport.use(new LocalStrategy(
  function(username, password, done) {
      // TODO: auth username and password against our DB
      console.log("authenticating with passport");

      // TODO: return correct user object when user is done or return err
      return done(null, username);
  }
));

// serialize user object into something to save
passport.serializeUser(function(user, cb) {
  console.log("deserializing");
  cb(null, user);
});

// deserialize serialized user object
passport.deserializeUser(function(user, cb) {
  console.log("deserializing");
  cb(null, user);
});


/*

SETUP EXPRESS and middleware

*/
// initialize express
const app = express();

app.set('view engine', 'ejs');
app.use(partials());
// body parser is important so forms can pass in data to node
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(passport.initialize());
//app.use(passport.session());
app.use(session({secret : 'anything'}));


// directory for public webpages, i.e. front-end
app.use(express.static('public'));


// mock database
const fakeDatabase = {
    'Philip': {job: 'professor', pet: 'cat.jpg'},
      'John': {job: 'student',   pet: 'dog.jpg'},
     'Carol': {job: 'engineer',  pet: 'bear.jpg'}
};

// SAMPLE CODE
// GET a list of all usernames from fake dbe
//
// To test, open this URL in your browser:
//   http://localhost:3000/users
app.get('/users', (req, res) => {
    const allUsernames = Object.keys(fakeDatabase); // returns a list of object keys
      console.log('allUsernames is:', allUsernames);
        res.send(allUsernames);
});


app.post('/login', passport.authenticate('local'), function(req, res) {
  console.log(req.user);
  res.redirect('/');
});


// GET profile data for a user
//
// To test, open these URLs in your browser:
//   http://localhost:3000/users/Philip
//   http://localhost:3000/users/Carol
//   http://localhost:3000/users/invalidusername
app.get('/users/:userid', (req, res) => {
  const nameToLookup = req.params.userid; // matches ':userid' above
  const val = fakeDatabase[nameToLookup];
  console.log(nameToLookup, '->', val); // for debugging
  if (val) {
    res.send(val);
  } else {
    res.send({}); // failed, so return an empty object instead of undefined
  }
});

/*

AJAX MAGIC

*/

app.get('/api/user', (req, res) => {
  if (req.user)
  {
    res.json(req.user);
  }
  else
  {
    res.json(undefined);
  }
});

/*

ROUTING GETS

the get requests for the pages will render and display here
copy the format of the root request ('/') for all the other pages

*/

// index page (/)
app.get(/^\/(index)?$/, (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'boi',
    // set page to render in layout
    page: 'pages/index.ejs'
  });
});

// plans page (plans page)
app.get('/plans', (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Plans',
    // set page to render in layout
    page: 'pages/plans.ejs'
  });
});

// login page
app.get('/login', (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Login',
    // set page to render in layout
    page: 'pages/login.ejs'
  });
});

// profile page
app.get('/profile', (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Profile',
    // set page to render in layout
    page: 'pages/profile.ejs'
  });
});

// social page
app.get('/social', (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Social',
    // set page to render in layout
    page: 'pages/social.ejs'
  });
});

// read page
app.get('/read', (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Read',
    // set page to render in layout
    page: 'pages/read.ejs'
  });
});

// start the server at URL: http://localhost:3000/
app.listen(3000, () => {
    console.log('Server started at http://localhost:3000/');
});
