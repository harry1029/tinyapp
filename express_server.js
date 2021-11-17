const { getUserByEmail, generateRandomString, checkHashPassword, checkLogin, urlsForUser } = require('./helpers');
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

// Add bodyparser middleware for use
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


// Add cookieSession middleware for use
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['abcdefg'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Add bycrpt middleware for use
const bcrypt = require('bcryptjs');


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  sgq3y6: {
    longURL: "https://www.yahoo.ca",
    userID: "abcdef"
  }
};

// Temporary users database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route for log in endpoint
app.get("/login", (req, res) => {
  if (!checkLogin(req, users)) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  } else {
    res.redirect('/urls');        // Redirect to /urls if user is already logged in
  }
});

// Route for register endpoint
app.get("/register", (req, res) => {
  if (!checkLogin(req, users)) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  } else {
    res.redirect('/urls');        // Redirect to /urls if user is already logged in
  }
});

// Route to list all the urls in database
app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  // Check if user is logged in
  if (!checkLogin(req, users)) {
    res.render("urls_index_noId", templateVars);
  } else {
    const userURL = urlsForUser(checkLogin(req, users).id, urlDatabase);
    templateVars['urls'] = userURL;
    res.render("urls_index", templateVars);
  }
});

// Route for POST request of urls_new form
app.post("/urls", (req, res) => {
  if (!checkLogin(req, users)) {
    res.status(401);
    return res.send("Access denied!");
  }
  const shortURL = generateRandomString(); // Generate random short URL for our new URL
  urlDatabase[shortURL] = { longURL: req.body['longURL'], userID: req.session.user_id }; // Add new URL to the database for specified user
  res.redirect(`/urls/${shortURL}`); // Redirect to newly generated URL
});

// Route for urls_new.ejs *Must be placed before any /:id routes
app.get("/urls/new", (req, res) => {
  if (!checkLogin(req, users)) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

// Route for delete button
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!checkLogin(req, users)) {
    res.status(401);
    return res.send('No authorization to DELETE!');
  }

  const validUrls = urlsForUser(checkLogin(req, users).id, urlDatabase);
  if (!validUrls[req.params.shortURL]) {
    res.status(401);
    return res.send('No authorization to DELETE!');
  }
  delete urlDatabase[req.params.shortURL]; // Delete URL entry from database
  res.redirect("/urls");
});

// Route for editing long url in urls_show
app.post("/urls/:id", (req, res) => {
  if (!checkLogin(req, users)) {
    res.status(401);
    return res.send('Not logged in! No authorization to EDIT!');
  }

  const validUrls = urlsForUser(checkLogin(req, users).id, urlDatabase);
  if (!validUrls[req.params.id]) {
    res.status(401);
    return res.send('No authorization to EDIT!');
  }
  urlDatabase[req.params.id]['longURL'] = req.body['longURL'];
  res.redirect("."); // Redirects back to main page urls_index
});

// Login page
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body['email'], users);
  // Check if email exists
  if (user === undefined) {
    res.status(403);
    return res.send("Email does not exist!");
  }
  // Check if entered password is correct
  if (!checkHashPassword(req.body['password'], user)) {
    res.status(403);
    return res.send("Password is incorrect!");
  }
  
  req.session.user_id = user['id']; // Set cookie 'user_id' with entered value
  res.redirect('/urls');
});

// Logout button
app.post("/logout", (req, res) => {
  req.session = null; // Clears user_id cookie
  res.redirect('/urls');
});

// Register button adds new user object
app.post("/register", (req, res) => {
  // Check if empty string is passed
  if (req.body['email'] === '' || req.body['password'] === '') {
    res.status(400);
    return res.send('Invalid Email or password!');
  }
  // Check if email already exist
  if (getUserByEmail(req.body['email'], users) !== undefined) {
    res.status(400);
    return res.send('Email already exists!');
  }
  const randomID = generateRandomString();
  const hashPass = bcrypt.hashSync(req.body['password'], 10);
  users[randomID] = { id: randomID, email: req.body['email'], password: hashPass }; // Add new user to object
  req.session.user_id = randomID;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL']; // Fetch short URL from route parameter, then access database to fetch long URL with short URL key
  res.redirect(longURL);
});

// Route for individual url, showing short and long url
app.get("/urls/:shortURL", (req, res) => {
  // Check for valid URL
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400);
    return res.send('Invalid URL!');
  }

  // Check for user identification
  if (!checkLogin(req, users)) {
    res.status(401);
    return res.send('Please Log In first!');
  }

  const validUrls = urlsForUser(checkLogin(req, users).id, urlDatabase);
  if (!validUrls[req.params.shortURL]) {
    res.status(401);
    return res.send('No authorization for this URL!');
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});