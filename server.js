const express = require('express');
const path = require('path');
const ejs = require('ejs');
var partials = require('express-partials');

const app = express();

app.set('view engine', 'ejs');
app.use(partials());


// directory for public webpages, i.e. front-end
app.use(express.static('public'));


// mock database
const fakeDatabase = {
    'Philip': {job: 'professor', pet: 'cat.jpg'},
      'John': {job: 'student',   pet: 'dog.jpg'},
     'Carol': {job: 'engineer',  pet: 'bear.jpg'}
};


// To learn more about server routing:
// Express - Hello world: http://expressjs.com/en/starter/hello-world.html
// Express - basic routing: http://expressjs.com/en/starter/basic-routing.html
// Express - routing: https://expressjs.com/en/guide/routing.html


// GET a list of all usernames
//
// To test, open this URL in your browser:
//   http://localhost:3000/users
app.get('/users', (req, res) => {
    const allUsernames = Object.keys(fakeDatabase); // returns a list of object keys
      console.log('allUsernames is:', allUsernames);
        res.send(allUsernames);
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
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
*/

/*

ROUTING GETS

the get requests for the pages will render and display here
copy the format of the root request ('/') for all the other pages

*/

// home page (/)
app.get('/', (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'boi',
    // set page to render in layout
    page: 'pages/index.ejs'
  });
});

// data page (/data) (example page)
app.get('/data', (req, res) => {
  // render with ejs
  res.render('layout', {
    // set title
    title: 'Data',
    // set page to render in layout
    page: 'pages/data.ejs'
  });
});

// start the server at URL: http://localhost:3000/
app.listen(3000, () => {
    console.log('Server started at http://localhost:3000/');
});
