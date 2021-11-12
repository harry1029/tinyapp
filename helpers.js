const bcrypt = require('bcryptjs');

const getUserByEmail = function(email, database) {
  let userID = undefined;
  for (const id in database) {
    if (database[id]['email'] === email) {
      userID = id;
      return database[userID];
    }
  }
  return userID;
};

const generateRandomString = function() {
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

// Check if password entered is the same as hashed password
const checkHashPassword = function(pass, user) {
  return bcrypt.compareSync(pass, user['password']);     // Compare hashed user entered password with stored password
};

// Helper function returns true if logged in
const checkLogin = function(req, database) {
  return database[req.session.user_id];
};

// Return URLs given the user_id
const urlsForUser = function(id, database) {
  let result = Object.assign({}, database);
  for (let url in result) {
    if (result[url]['userID'] !== id) {
      delete result[url];
    }
  }
  return result;
};

// Check if email exists within users database and returns the user id if found
// RETIRED HELPER FUNCTION
/*
const checkEmail = function(email, database) {
  let result = undefined;
  for (const id in database) {
    if (database[id]['email'] === email) {
      result = id;
      return result;
    }
  }
  return result;
};
*/

module.exports = { getUserByEmail, generateRandomString, checkHashPassword, checkLogin, urlsForUser };