/*

IMPORT EVERYTHING

*/
const express = require('express'); // used for express.js
const path = require('path'); // allows filesystem access, and directory helper methods
const ejs = require('ejs'); // Effective JS layouts, our template rendering engine
const partials = require('express-partials'); // used with ejs to render partial layout

var MongoClient = require('mongodb').MongoClient; // mongo driver
const mongoose = require('mongoose');

// get num of chapters in each book of the bible
const bibleApi = require('./bibleApi');

// this URL allows you to connect to the db, to the admin user. Use in your local session
// if you want to manipulate the DB
const dburl = "mongodb://admin:password@ds253879.mlab.com:53879/keimena";
mongoose.connect(dburl);
const db = mongoose.connection;


// mongoose collections
// (initialized later)
let User;
/*
SETUP PASSPORT

*/

// passport is the module which provides authentication
const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

// auth strategy for our setup
passport.use(new LocalStrategy(
    function (username, password, done) {
        // TODO: auth username and password against our DB
        console.log("authenticating with passport");

        User.findOne({username: username}, (err, user) => {
            if (user.password == password) {
                return done(null, user)
            }
            else {
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


// directory for public webpages, i.e. front-end
app.use(express.static('public'));

app.post('/login', passport.authenticate('local'), function (req, res) {
    console.log(req.user);
    res.redirect('/');
});

app.post('/register', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    let user = new User(
        {
            username: username,
            password: password
        });

    User.findOne({username: username}, (err, match) => {
        if (match || err) {
            console.log("cannot register user");
            // TODO send error somehow
            res.redirect('/login');
        }
        else {
            user.save((err, user) => {
                if (err) console.log("problem adding user");
            });
            res.redirect('/');
        }
    });

});


// GET profile data for a user
//
// To test, open these URLs in your browser:
//   http://localhost:3000/users/Philip
//   http://localhost:3000/users/Carol
//   http://localhost:3000/users/invalidusername
app.get('/users/:userid', (req, res) => {
    const nameToLookup = req.params.userid; // matches ':userid' above

    User.findOne({username: nameToLookup}, (err, match) => {
        if (match) {
            res.send(match);
        }
        else {
            res.send({error: "user not found"});
        }
    });
});
/*

AJAX MAGIC

*/

app.get('/api/user', (req, res) => {
    if (req.user) {
        res.json(req.user);
    }
    else {
        res.json(undefined);
    }
});


app.get('/api/text', (req, res) => {
    bibleApi.getChapter('John', '1', req, res);
});

app.get('/api/text/next', (req, res) => {
    bibleApi.getNextChapter('Haggai', '2', req, res);
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


// initialize db and start app 
db.once('open', function () {
    // connected to db
    console.log("database initialized")

    var userSchema = mongoose.Schema({
        username: String,
        password: String,
        data: Object
    });

    /* initialize collections */
    User = mongoose.model('User', userSchema);

    // start the server at URL: http://localhost:3000/
    app.listen(3000, () => {
        console.log('Server started at http://localhost:3000/');
    });
});
