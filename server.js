/*

IMPORT EVERYTHING

*/
const express = require('express'); // used for express.js
const https = require('https');
const path = require('path'); // allows filesystem access, and directory helper methods
const ejs = require('ejs'); // Effective JS layouts, our template rendering engine
const partials = require('express-partials'); // used with ejs to render partial layout

var MongoClient = require('mongodb').MongoClient; // mongo driver
const mongoose = require('mongoose');

// this URL allows you to connect to the db, to the admin user. Use in your local session
// if you want to manipulate the DB
const dburl = "mongodb://admin:password@ds253879.mlab.com:53879/keimena";
mongoose.connect(dburl);
const db = mongoose.connection;

// the tongue is like a flame
const bibleurl = "http://api.esv.org/v3/passage/text/?q=";
const bibleOptions = "&include-crossrefs=false&attach-audio-link-to=heading&include-short-copyright=false&include-copyright=false";
const bibleToken = "e47bdf3fcb120666e61cd06ca194b8ac3f733aa7";

// mongoose collections
// (initialized later)
let User;
let Auth;

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

      Auth.findOne({username: username}, (err, user) => {
        if (user && user.password == password)
        {
          console.log("found user");
          User.findById(user.userId, (err, res) => {
            return done(null, res)
          });
        }
        else
        {
          console.log("failed auth");
          return done("error authenticating");
        }
      });
      // TODO: return correct user object when user is done or return err
  }
));

// serialize user object into something to save
passport.serializeUser(function (user, cb) {
    console.log("deserializing");
    cb(null, user._id);
});

// deserialize serialized user object
passport.deserializeUser(function (id, cb) {
    console.log("deserializing");
    User.findById(id, (err, user) => {
        cb(null, user);
    });
});

const checkLoginMiddleware = function (req, res, next) {
  if (req.user)
  {
    console.log("user exists");
    next();
  }
  else
  {
    if (req.path == "/login") next();
    else
    {
      console.log("need to login");
      res.redirect('/login');
    }
  }
}

/*

SETUP EXPRESS and middleware

*/
// initialize express
const app = express();

app.set('view engine', 'ejs');
app.use(partials());
// body parser is important so forms can pass in data to node
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'keyboard cat', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(checkLoginMiddleware);


// directory for public webpages, i.e. front-end
app.use(express.static('public'));

app.post('/login', passport.authenticate('local'), function (req, res) {
    console.log(req.user);
    res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.post('/register', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  console.log("registering");
  let auth = new Auth(
    {username: username,
      password: password});

  // find match from auth db
  Auth.findOne({username: username}, (err, match) => {
    if (match || err)
    {
      if (match)
      {
        console.log("user already exists");
      }
      else
      {
        console.log("other user");
      }
      // TODO send error somehow
      console.log("error registering");
      res.redirect('/login');
    }
    else
    {
      let user = new User({
        username: username,
        data: {}
      });
      user.save((err, user) => {
        if (err) {
          console.log("error adding user");
          res.redirect('/login');
        }
        auth.userId = user._id;
        auth.save((err, auth) => {
          if (err) {
            console.log("err saving auth");
            res.redirect('/login');
          }
          res.redirect('/login');
        });
      });
    }
  });

});


// GET profile data for a user
//
// To test, open these URLs in your browser:
//   http://localhost:3000/users/Philip
//   http://localhost:3000/users/Carol
//   http://localhost:3000/users/invalidusername
app.get('/api/users/find/:userid', (req, res) => {
  const nameToLookup = req.params.userid; // matches ':userid' above
  
  User.findOne({username: nameToLookup}, (err, match) => {
    if (match) 
    {
      res.send(match);
    }
    else
    {
      res.send({error: "user not found"});
    }
  });
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
    res.json({error: "current user not found"});
  }
});

app.get('/api/users/all', (req, res) => {
  User.find({}, (err, docs) => {
    res.json(docs);
  });
});

const text = `The purpose of the quarter-long project is to give you hands-on experience with building a full-stack web application with the following basic components:

A server backend
A database
Connecting to external APIs
A frontend that loads data from backend without page refreshes (Ajax)
Using a data visualization library or API on the frontend

(We will not place as much emphasis on the concepts in the What will we not cover in this course? section at the bottom of the course description page.)`

app.get('/api/text', (req, res) => {
  res.send(text);
});

app.get('/api/text', (req, sres) => {
    let text = '';
    https.get({
        protocol: "https:",
        host: "api.esv.org",
        path: "/v3/passage/html/?q=Luke%209%2023-25" + bibleOptions,
        rejectUnauthorized: false,
        headers: {"Authorization": "Token " + bibleToken}
    }, function (res) {
        let body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            text = JSON.parse(body);
            sres.send(text);
        });
    }).on('error', function (e) {
        console.log("Error:", e);
    });
})
;


/*

ROUTING GETS

the get requests for the pages will render and display here
copy the format of the root request ('/') for all the other pages

*/

function getContext(req, res) {
  return {
    user: req.user
  }
}

// index page (/)
app.get(/^\/(index)?$/, checkLoginMiddleware, (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Home',
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
        hideNav: true,
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
    page: 'pages/profile.ejs',
    // context
    context: getContext(req, res)
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


// initialize db and start app 
db.once('open', function(){
  // connected to db
  console.log("database initialized")

  var userSchema = mongoose.Schema({
    username: String,
    data: Object 
  });

  var authSchema = mongoose.Schema({
    username: String,
    password: String,
    userId: String
  })

  /* initialize collections */
  User = mongoose.model('User', userSchema);
  Auth = mongoose.model('Auth', authSchema);

  // start the server at URL: http://localhost:3000/
  app.listen(3000, () => {
      console.log('Server started at http://localhost:3000/');
  });
});
