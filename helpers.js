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

module.exports = { getUserByEmail };