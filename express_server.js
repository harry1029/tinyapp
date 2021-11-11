const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

// Add bodyparser middleware for use
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// Add cookieparser middleware for use
const cookieParser = require('cookie-parser');
app.use(cookieParser());

/*
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
*/

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
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
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route for log in endpoint
app.get("/login", (req, res) => {
  if (users[req.cookies['user_id']] === undefined) {
    const templateVars = { user: users[req.cookies['user_id']] };
    res.render("urls_login", templateVars);
  } else {
    res.redirect('/urls');        // Redirect to /urls if user is already logged in
  }
});

// Route for register endpoint
app.get("/register", (req, res) => {
  if (users[req.cookies['user_id']] === undefined) {
    const templateVars = { user: users[req.cookies['user_id']] };
    res.render("urls_register", templateVars);
  } else {
    res.redirect('/urls');        // Redirect to /urls if user is already logged in
  }
});

// Route to list all the urls in database
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] };
  console.log(templateVars);

  res.render("urls_index", templateVars);
});

// Route for POST request of urls_new form
app.post("/urls", (req, res) => {
  if (users[req.cookies['user_id']] === undefined) {
    res.status(401);
    return res.send("Access denied!");
  }
  const shortURL = generateRandomString(); // Generate random short URL for our new URL
  urlDatabase[shortURL] = { longURL: req.body['longURL'], userID: req.cookies['user_id'] }; // Add new URL to the database for specified user
  res.redirect(`/urls/${shortURL}`); // Redirect to newly generated URL
});

// Route for urls_new.ejs *Must be placed before any /:id routes
app.get("/urls/new", (req, res) => {
  if (users[req.cookies['user_id']] === undefined) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.cookies['user_id']] };
    res.render("urls_new", templateVars);
  }
});

// Route for delete button
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]; // Delete URL entry from database
  res.redirect("/urls");
})

// Route for editing long url in urls_show
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id]['longURL'] = req.body['longURL'];
  res.redirect("."); // Redirects back to main page urls_index
});

// Login page
app.post("/login", (req, res) => {
  if (checkEmail(req.body['email']) === undefined) {
    res.status(403);
    res.send("Email does not exist!")
  }
  const id = checkEmail(req.body['email'], req.body['password'])
  if (id === undefined) {
    res.status(403);
    res.send("Password is incorrect!");
  }
  
  res.cookie('user_id', id); // Set cookie 'user_id' with entered value
  res.redirect('/urls');
});

// Logout button
app.post("/logout", (req, res) => {
  res.clearCookie('user_id'); // Clears user_id cookie
  res.redirect('/urls');
});

// Register button adds new user object
app.post("/register", (req, res) => {
  // Check if empty string is passed
  if (req.body['email'] === '' || !req.body['password'] === '') {
    res.status(400);
    res.send('Invalid Email or password!');
  }
  // Check if email already exist
  if (checkEmail(req.body['email']) !== undefined) {
    res.status(400);
    res.send('Email is already used!');
  }
  const randomID = generateRandomString();
  users[randomID] = { id: randomID, email: req.body['email'], password: req.body['password'] }; // Add new user to object
  res.cookie('user_id', randomID);
  console.log(users);
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL']; // Fetch short URL from route parameter, then access database to fetch long URL with short URL key
  res.redirect(longURL);
});

// Route for individual url, showing short and long url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: users[req.cookies['user_id']] };
  res.render("urls_show", templateVars);
});

/*
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
*/

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let result = '';
  // A string of all possible alphabets and numbers to choose from for our random string
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 6; i++) {
    // Generate a random index to pick a string from our list
    const index = Math.floor(Math.random() * char.length);
    result += char[index];
  }
  return result;
};

function checkEmail(email, password) {
  let result = undefined;
  if (password === undefined) {
    for (const id in users) {
      if (users[id]['email'] === email) {
        return result = id;
      }
    }
  } else {
    for (const id in users) {
      if (users[id]['email'] === email && users[id]['password'] === password) {
        return result = id;
      }
    }
  }

  return result;
};