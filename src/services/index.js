const users = require('./users/users.service.js');
const boards = require('./boards/boards.service.js');
const layers = require('./layers/layers.service.js');
const arts = require('./arts/arts.service.js');
const groups = require('./groups/groups.service.js');
const searched_arts = require('./searched_arts/searched_arts.service.js')

module.exports = function (app) {
  app.configure(users);
  app.configure(boards);
  app.configure(layers);
  app.configure(arts);
  app.configure(groups);
  app.configure(searched_arts);
};