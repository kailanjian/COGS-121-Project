/*
In this file we wrote all the server code
- Code to authorize users and login, and save their data, 
and store it in the form of sessions.
- API code to perform functions like listing users,
adding friends, get pending/confirmed friends, plan data
(current chapter, progress, streak, days on plan, plan text,
times and dates of each bible reading session)
- Routing for all the pages, which renders data using .ejs
formatting.
- database code which initializes the database and mongoose
and schemas
/*

IMPORT EVERYTHING

*/

const DEBUG = false;

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
    //console.log("user exists");
    next();
  }
  else {
    if (req.path == "/login") next();
    else {
      // DEBUG PATH: logs in automatically if you are not on a valid user account
      if (DEBUG) {
        User.findOne({}, (err, user) => {
          //console.log("found user");
          //console.log(JSON.stringify(user));
          req.login(user, function (err) {
            if (err) return next(err);
          });
          next();
        });
      } else {
        console.log("need to login");
        res.redirect('/login');
      }
    }
  }
};

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
  res.json({"success": true})
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// register a new user
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
        currChapNum: 1,
        goal: 4
      });
      plan.save((err, plan) => {
        let user = new User({
          username: username,
          data: {},
          currBook: "Genesis",
          currChapNum: 1,
          plans: [plan._id],
          latestPlan: plan._id
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
    res.json({error: 'You must be logged in'});
  }
  else if (req.user.friends.indexOf(friendUsername) != -1) {
    res.json({success: 'Already added friend'});
  }
  else {
    User.findOneAndUpdate(
      {username: friendUsername},
      // add current user to friends friend inbox
      {$push: {friendsin: req.user.username}},
      {new: true, safe: true, upsert: true},
      (err, friend) => {
        if (err || !friend) {
          res.json({error: 'Could not find username'})
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
                res.json({success: 'Added friend!'});
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
// DEPRECATED
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
    User.findByIdAndUpdate(req.user._id, {$set: {latestPlan: planId}},
      (err, user) => {
        res.send({
          currBook: plan.currBook,
          currChapNum: plan.currChapNum
        })
      });
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
  let goal = req.body.goal;
  let currChapNum = 1;

  let plan = new Plan({
    planName: planName,
    firstBook: firstBook,
    lastBook: lastBook,
    currBook: currBook,
    currChapNum: currChapNum,
    goal: goal
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
    if (plan.planType == "linear") {
      console.log("linear plan entered");
      let firstBook = plan.firstBook;
      let lastBook = plan.lastBook;
      let totalChapterCount = 0;
      let userChapterCount = 0;
      let bibleBooks = bibleApi.bibleBooks;

      console.log(bibleBooks.indexOf(lastBook));
      for (let i = bibleBooks.indexOf(firstBook); i <= bibleBooks.indexOf(lastBook); i++) {
        if (i < bibleBooks.indexOf(plan.currBook)) {
          userChapterCount += bibleApi.bibleChapters[bibleBooks[i]];
        }
        else if (i == bibleBooks.indexOf(plan.currBook)) {
          userChapterCount += plan.currChapNum - 1;
        }

        totalChapterCount += bibleApi.bibleChapters[bibleBooks[i]];
      }

      res.json({
        userChaptersCount: userChapterCount,
        totalChapterCount: totalChapterCount,
        progress: userChapterCount / totalChapterCount
      })
    }
  });
});

// TODO: test code
app.get('/api/plan/:planId/streak', (req, res) => {
  console.log("streak endpoint entered...");
  Plan.findById(req.params.planId, (err, plan) => {
    let dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    let dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
    let dayChapters;
    let currDayChapters = getRangeChapters(req.user, req.params.planId, dayStart, dayEnd);

    const dayTime = 24 * 60 * 60 * 1000;
    let day = 0;
    let dayValid = false;
    do {
      dayValid = false;
      let currDayStart = dayStart - dayTime * day;
      let currDayEnd = dayEnd - dayTime * day;

      dayChapters = getRangeChapters(req.user, req.params.planId, currDayStart, currDayEnd);
      if (dayChapters >= plan.goal) {
        dayValid = true;
        day++;
      }
    } while (dayValid);
    res.json({"streak": day, "readToday": currDayChapters, "goal": plan.goal});
  });
});

// TODO: TOTAL CHAPTER across plans

// helper method to get chapters read in a time range
function getRangeChapters(user, planId, start, end) {
  let chapters = 0;

  for (let i = 0; i < user.log.length; i++) {
    let log = user.log[i];
    if (log.type == "next") {
      if (log.planId == planId || !planId) {
        if (log.date < end && log.date > start) {
          chapters++;
        }
      }
    }
  }
  return chapters;
}

// gets number of chapters today
function getDailyChapters(user, planId) {
  let start = new Date();
  start.setHours(0, 0, 0, 0);

  let end = new Date();
  end.setHours(23, 59, 59, 9999);

  return getRangeChapters(start, end);
}

// get number of chapters read today
app.get('/api/plan/:planId/dailyChapters', (req, res) => {
  res.json({
    chapters: getDailyChapters(req.user)
  })
});

// TODO: put friend on plan

// endpoint to get number of days since start of plan
app.get('/api/plan/:planId/days', (req, res) => {

  console.log("getting days...");
  let oldest = Date.now();
  let log = req.user.log;
  for (let i = 0; i < log.length; i++) {
    console.log(log[i]);
    if (
      log[i].date < oldest &&
      log[i].planId == req.params.planId &&
      log[i].type == "start") {
      oldest = log[i].date;
    }
  }
  let startDate = req.user.log[0].date;
  let diff = Date.now() - oldest;
  let seconds = diff / 1000;
  let hours = seconds / 3600;
  let days = hours / 24;

  res.json({
    time: diff,
    days: days
  })
});

// helper method to get time from logs of planId
function getUserLogTime(user, planId) {
  let totalTime = 0;
  console.log("Plan id: " + JSON.stringify(planId));
  if (!planId) console.log(JSON.stringify(user.log));
  for (let i = 0; i < user.log.length; i++) {
    let log = user.log[i];
    // if there is no planId, just assume we want all plans
    if (!planId || log.planId == planId) {
      if (log.type == "next") {
        totalTime += Number(log.time);
      }
    }
  }
  return totalTime;
}

// NOTE: this must come before the param version or "all"
// will be matched as a planId
app.get('/api/plan/all/time', (req, res) => {
  let time = getUserLogTime(req.user);
  res.json({
    "time": time,
    "hours": time / 3600
  });
});

// get time spent on plan
app.get('/api/plan/:planId/time', (req, res) => {
  let time = getUserLogTime(req.user, req.params.planId);
  res.json({
    "time": time,
    "hours": time / 3600
  });
});


// get text for plan
app.get("/api/:planId/text", (req, res) => {
  Plan.findById(req.params.planId, (err, plan) => {
    User.findByIdAndUpdate(req.user._id, {
      $push: {
        "log": {
          "type": "start",
          "currBook": plan.currBook,
          "currChapNum": plan.currChapNum,
          "date": Date.now(),
          "planId": plan._id
        }
      }
    }, (err, user) => {
      console.log("Got text");
      console.log(err);
      bibleApi.grabChapter(plan.currBook, plan.currChapNum, req, res);
    });
  });
});

app.get('/api/plan/:planId/timedata', (req, res) => {
  let timedata = [];
  for (let i = 0; i < req.user.log.length; i++) {
    if (req.user.log[i].type == "next" && req.user.log[i].planId == req.params.planId) {
      timedata.push({"date": req.user.log[i].date, "time": req.user.log[i].time});
    }
  }
  res.json(timedata);
});

app.get('/api/user/:username/timedata', (req, res) => {
  User.findOne({"username": req.params.username}, (err, user) => {
    let timedata = [];
    for (let i = 0; i < user.log.length; i++) {
      if (user.log[i].type == "next") {
        timedata.push({"date": user.log[i].date, "time": user.log[i].time});
      }
    }
    res.json(timedata);
  })
});

app.post('/api/:planId/text/next', (req, res) => {
  let time = req.body.time;
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
          log: {
            "type": "next",
            "currBook": req.user.currBook,
            "currChapNum": req.user.currChapNum,
            "date": Date.now(),
            "time": time,
            "planId": plan._id
          }
        }
      }, (err, user) => {
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
// app.get(/^\/(index)?$/, checkLoginMiddleware, (req, res) => {
//   // render with ejs
//   res.render('layout', {
//     // set title
//     title: 'Home',
//     // set page to render in layout
//     page: 'pages/index.ejs'
//   });
// });

// plans page (plans page)
app.get(/^\/(plans)?$/, checkLoginMiddleware, (req, res) => {
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
    '_id': {$in: inArray}
  }, function (err, plans) {

    let context = getContext(req, res);
    let completedPlans = [];
    context.plans = [];
    context.books = bibleApi.bibleBooks;

    for (let i = 0; i < plans.length; i++) {
      if (plans[i]._id == req.user.latestPlan) {
        context.latestPlan = plans[i];
      }

      let planEnd = bibleApi.bibleBooks.indexOf(plans[i].lastBook);
      let planCurrent = bibleApi.bibleBooks.indexOf(plans[i].currBook);

      if (planCurrent > planEnd) {
        completedPlans.push(plans[i]);
      }
      else {
        context.plans.push(plans[i]);
      }
    }

    if (!context.latestPlan) {
      context.latestPlan = plans[0];
    }

    context.completedPlans = completedPlans;

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
app.get('/login', checkLoginMiddleware, (req, res) => {
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
app.get('/profile/:userName?', checkLoginMiddleware, (req, res) => {
  let userName = req.params.userName;
  let context = getContext(req, res);
  if (userName) {
    let context = getContext(req, res);
    User.findOne({"username": userName}, (err, user) => {
      context.profile = user;
      res.render('layout', {
        title: 'Profile',
        page: 'pages/profile.ejs',
        context: context,
        logout: false
      })
    });
  }
  else {
    console.log("no user name");
    context.profile = req.user;
    // render with ejs
    res.render('layout', {
      // set title
      title: 'Profile',
      // set page to render in layout
      page: 'pages/profile.ejs',
      // context
      context: context,
      logout: true,
    });
  }
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
app.get('/read', checkLoginMiddleware, (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Read',
    // set page to render in layout
    page: 'pages/read.ejs'
  });
});

app.get('/plan/:planId', checkLoginMiddleware, (req, res) => {
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
    plans: [String], // items are {planId, currBook, currChapNum}
    latestPlan: String
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
    goal: Number
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
