/*

IMPORT EVERYTHING

*/

const DEBUG = true;

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
let Auth;
let Plans;

/* 

SETUP PASSPORT

*/

// passport is the module which provides authentication
const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

// auth strategy for our setup
passport.use(new LocalStrategy(
//   good for debugging
//   function (username, password, done) {
//     // TODO: auth username and password against our DB
//     console.log("authenticating with passport");

//     User.findOne({username: username}, (err, user) => {
//       if (user.password == password) {
//         return done(null, user)
//       }
//       else {
//         return done("error authenticating");
//       }
//     });

  function (username, password, done) {
    // TODO: auth username and password against our DB
    console.log("authenticating with passport");

    Auth.findOne({username: username}, (err, user) => {
      if (user && user.password == password) {
        console.log("found user");
        User.findById(user.userId, (err, res) => {
          return done(null, res)
        });
      }
      else {
        console.log("failed auth");
        return done("error authenticating");
      }
    });
    // TODO: return correct user object when user is done or return err

  }
));

// serialize user object into something to save
passport.serializeUser(function (user, cb) {
  cb(null, user._id);
});

// deserialize serialized user object
passport.deserializeUser(function (id, cb) {
  User.findById(id, (err, user) => {
    cb(null, user);
  });
});

const checkLoginMiddleware = function (req, res, next) {
  if (req.user) {
    console.log("user exists");
    next();
  }
  else {
    if (req.path == "/login") next();
    else
    {
      // DEBUG PATH: logs in automatically if you are not on a valid user account
      if (DEBUG) {
        User.findOne({}, (err, user) => {
          console.log("found user");
          console.log(JSON.stringify(user));
          req.login(user, function(err){
            if(err) return next(err);
          });
          next();
        });
      } else
      {
      console.log("need to login");
      res.redirect('/login');
      }
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

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.post('/register', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  console.log("registering");
  let auth = new Auth(
    {
      username: username,
      password: password
    });

  // find match from auth db
  Auth.findOne({username: username}, (err, match) => {
    if (match || err) {
      if (match) {
        console.log("user already exists");
      }
      else {
        console.log("other user");
      }
      // TODO send error somehow
      console.log("error registering");
      res.redirect('/login');
    }
    else {
      let plan = new Plan({
        planName: "Bible in 365 Days",
        firstBook: "Genesis",
        lastBook: "Revelation",
        currBook: "Genesis",
        currChapNum: 1
      })
      plan.save((err, plan) => {
        let user = new User({
          username: username,
          data: {},
          currBook: "Genesis",
          currChapNum: 1,
          plans: [plan._id]
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
  } else {
    res.json({error: "current user not found"});
  }
});

app.get('/api/users/all', (req, res) => {
  User.find({}, (err, docs) => {
    res.json(docs);
  });
});

app.post('/api/friends/add', (req, res) => {
  let friendUsername = req.body.username;
  if (!req.user) {
    res.json({error: 'must be logged in'});
  }
  else {
    User.findOneAndUpdate(
      {username: friendUsername},
      // add current user to friends friend inbox
      {$push: {friendsin: req.user.username}},
      {new: true, safe: true, upsert: true},
      (err, friend) => {
        if (err || !friend) {
          res.json({error: 'could not find username'})
        }
        else {
          User.findByIdAndUpdate(
            // the id of the item to find
            req.user._id,
            // changes to make
            //add friend to users friend list
            {$push: {friends: friendUsername}},
            // ask for updated document
            {new: true, safe: true, upsert: true},
            // the callback function
            (err, user) => {
              // Handle any possible database errors
              if (err) return res.json({error: 'failed to update json', info: err});
              else {
                res.json({})
              }
            });
        }
      });

  }
});

// endpoint for friends waiting for users response
app.get('/api/friends/get/pending', (req, res) => {
  let friendsin = req.user.friendsin;
  let filteredFriends = [];
  for (let i = 0; i < friendsin.length; i++) {
    if (req.user.friends.indexOf(friendsin[i]) == -1) {
      filteredFriends.push({username: friendsin[i]});
    }
  }
  res.json(filteredFriends);
});

// endpoint for friends user is waiting for to respond
app.get('/api/friends/get/requested', (req, res) => {
  let friends = req.user.friends;
  let filteredFriends = [];
  for (let i = 0; i < friends.length; i++) {
    if (req.user.friendsin.indexOf(friends[i]) == -1) {
      filteredFriends.push({username: friends[i]});
    }
  }
  res.json(filteredFriends);
});

// endpoint for friends which have responded and confirmed
app.get('/api/friends/get/confirmed', (req, res) => {
  let friends = req.user.friends;
  let filteredFriends = [];
  for (let i = 0; i < friends.length; i++) {
    if (req.user.friendsin.indexOf(friends[i]) != -1) {
      filteredFriends.push({username: friends[i]});
    }
  }
  res.json(filteredFriends);
});

// DEPRECATED
app.get('/api/currChapter', (req, res) => {
  res.send({
    currBook: req.user.currBook,
    currChapNum: req.user.currChapNum
  });
});

// end point to get a chapter plan
// GET endpoint to get the next chapter for a plan for a user
app.get('/api/plan/:planId/currChapter', (req, res) => {
  let planId = req.params.planId;
  console.log("curr chapter")
  Plan.findById(planId, (err, plan) => {
    res.send({
      currBook: plan.currBook,
      currChapNum: plan.currChapNum
    })
  });
});

// end point to add a plan
// body params: planName, firstBook, lastBook
// POST these to create a plan
app.post('/api/plan/add', (req, res) => {
  console.log("ADDING PLAN");
  console.log(JSON.stringify(req.body));
  let planName = req.body.planName;
  let firstBook = req.body.firstBook;
  let lastBook = req.body.lastBook;
  let currBook = req.body.firstBook;
  let currChapNum = 1;

  let plan = new Plan({
    planName: planName,
    firstBook: firstBook,
    lastBook: lastBook,
    currBook: currBook,
    currChapNum: currChapNum
  });

  plan.save((err, plan) => {
    User.findByIdAndUpdate(
      req.user._id, 
      {$push: {plans: plan._id}},
      (err, user) => {
        res.json({
          success: true,
          plan: plan
        });
    });
  })
});

// end point to get plan progress 
app.get('/api/plan/:planId/progress', (req, res) => {
  console.log("endpoint reached");
  Plan.findById(req.params.planId, (err, plan) => {
    // default plan type. if statemennt allows us to make assumptions
    // about plan structure so we can add in alternate types later
    console.log("getting plan " + JSON.stringify(plan));
    if (plan.planType == "linear") 
    {
      console.log("linear plan entered");
      let firstBook = plan.firstBook;
      let lastBook = plan.lastBook;
      let totalChapterCount = 0;
      let userChapterCount = 0;
      let bibleBooks = bibleApi.bibleBooks;

      console.log(bibleBooks.indexOf(lastBook));
      for (let i = bibleBooks.indexOf(firstBook); i <= bibleBooks.indexOf(lastBook); i++)
      {
        console.log("i: " + JSON.stringify(i));
        if (i < bibleBooks.indexOf(plan.currBook))
        {
          userChapterCount += bibleApi.bibleChapters[bibleBooks[i]];
        }
        else if (i == bibleBooks.indexOf(plan.currBook))
        {
          userChapterCount += plan.currChapNum - 1;
        }

        console.log("i: " + JSON.stringify(i));
        totalChapterCount += bibleApi.bibleChapters[bibleBooks[i]];
      }

      res.json({
        userChaptersCount: userChapterCount,
        totalChapterCount: totalChapterCount,
        progress: userChapterCount/totalChapterCount 
      })
    }
  });
});

app.get('/api/plan/:planId/streak', (req, res) => {
  
});

// DEPRECATED
app.get('/api/text', (req, res) => {
  console.log("boibobiobib");
  bibleApi.grabChapter(req.user.currBook, req.user.currChapNum, req, res);
  User.findByIdAndUpdate(req.user._id, {
    $push: {
      log: {"type": "start", "currBook": req.user.currBook, "currChapNum": req.user.currChapNum} 
    }
  })
});

app.get("/api/:planId/text", (req, res) => {
  Plan.findById(req.params.planId, (err, plan) => {
    console.log("CALLED API");
    console.log(JSON.stringify(plan));
    User.findByIdAndUpdate(req.user._id, {
      $push: {
        "log": {"type": "start", "currBook": plan.currBook, "currChapNum": plan.currChapNum}
      }
    }, (err, user) => {
      console.log("Got text");
      console.log(err);
      bibleApi.grabChapter(plan.currBook, plan.currChapNum, req, res);
    });
  });
});

app.get('/api/text/next', (req, res) => {
  // TODO fix this
  const chapterDesc = bibleApi.getNextChapter(req.user.currBook, req.user.currChapNum);
  User.findByIdAndUpdate(req.user._id, {
    $set: {
      currBook: chapterDesc.book,
      currChapNum: chapterDesc.chapter
    },
    $push: {
      log: {"type": "next", "currBook": req.user.currBook, "currChapNum": req.user.currChapNum}
    }
  }, () => {
    bibleApi.grabChapter(chapterDesc.book, chapterDesc.chapter, req, res);
  });
});

app.get('/api/:planId/text/next', (req, res) => {
  let planId = req.params.planId;
  Plan.findById(planId, (err, plan) => {
    console.log("running getNextChapter");
    const chapterDesc = bibleApi.getNextChapter(plan.currBook, plan.currChapNum);
    Plan.findByIdAndUpdate(planId, {
      $set: {
        currBook: chapterDesc.book,
        currChapNum: chapterDesc.chapter
      }
    }, () => {
      console.log("updated plan");
      User.findByIdAndUpdate(req.user._id, {
        $push: {
          log: {"type": "next", "currBook": req.user.currBook, "currChapNum": req.user.currChapNum}
        }}, (err, user) => {
          console.log("running grab chapter");
          bibleApi.grabChapter(chapterDesc.book, chapterDesc.chapter, req, res);
        });
    });
  });
});


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
  // TODO get plan data before posting page
  // render with ejs
  let plans = [];
  
  // form list of ids to query for in mongoose
  let inArray = [];
  for (let i = 0; i < req.user.plans.length; i++) {
    let planId = req.user.plans[i];
    inArray.push(mongoose.Types.ObjectId(planId));
  }

  Plan.find({
    '_id': { $in: inArray}
  }, function(err, plans){

      let context = getContext(req, res);
      context.plans = plans;

      console.log("PLANS ARRAY");
      console.log(JSON.stringify(plans));
      res.render('layout', {
        // set title
        title: 'Plans',
        // set page to render in layout
        page: 'pages/plans.ejs',
        context: context
      });
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
app.get('/social', checkLoginMiddleware, (req, res) => {
    // render with ejs
    res.render('layout', {
        // set title
        title: 'Social',
        // set page to render in layout
        page: 'pages/social.ejs',
        context: getContext(req, res)
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

app.get('/addplan', (req, res) => {
    let context = getContext(req, res);
    context.books = bibleApi.bibleBooks;

    // render with ejs
    res.render('layout', {
      title: 'Plan',
      page: 'pages/addplan.ejs',
      context: context
    })
});

app.get('/plan/:planId', (req, res) => {
  Plan.findById(req.params.planId, (err, plan) => {
    let context = getContext(req, res);
    context.planId = plan._id;
    context.planName = plan.planName;
    context.currBook = plan.currBook;
    context.currChapNum = plan.currChapNum;

    // render with ejs
    res.render('layout', {
      title: 'Plan',
      page: 'pages/plan.ejs',
      context: context
    })
  });
});


// initialize db and start app 
db.once('open', function () {
  // connected to db
  console.log("database initialized")

  var userSchema = mongoose.Schema({
    username: String, // username
    currBook: String,
    currChapNum: Number,
    friends: [String],
    friendsin: [String],
    log: [],
    data: Object,
    plans: [String] // items are {planId, currBook, currChapNum}
  });

  var authSchema = mongoose.Schema({
    username: String,
    password: String,
    userId: String
  });

  var planSchema = mongoose.Schema({
    // name of plan e.g. Bible in 365 days
    planName: String,
    // plan type is in case we decide to add more complex plans than book to book
    planType: {type: String, enum: ['linear'], default: 'linear'}, 
    // for regular plan type. Read from start of first book to start of last book
    firstBook: String,
    lastBook: String,
    currBook: String,
    currChapNum: String,
  });

  /* initialize collections */
  User = mongoose.model('User', userSchema);
  Auth = mongoose.model('Auth', authSchema);
  Plan = mongoose.model('Plan', planSchema);

  // start the server at URL: http://localhost:3000/
  app.listen(3000, () => {
    console.log('Server started at http://localhost:3000/');
  });
});
