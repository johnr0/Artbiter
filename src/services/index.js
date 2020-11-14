const users = require('./users/users.service.js');
const boards = require('./boards/boards.service.js');

module.exports = function (app) {
  app.configure(users);
  app.configure(boards);
};