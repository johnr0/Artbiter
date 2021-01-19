

// var app = express();

// app.use(express.static(path.join(__dirname, 'dist')));
// app.use('/img', express.static(path.join(__dirname, 'client/img')));
// app.set('port', process.env.PORT || 8080);



// var server = app.listen(app.get('port'), function() {
//   console.log('listening on port ', server.address().port);
// });

var path = require('path');
// var express = require('express');
const logger = require(path.join(__dirname, 'src/logger'));
console.log(path.join(__dirname, 'src/app'))
const app = require(path.join(__dirname, 'src/app'));
const port = process.env.PORT || app.get('port');
const express = require('@feathersjs/express');

app.use(express.static(path.join(__dirname, 'dist')));
app.use('/img', express.static(path.join(__dirname, 'client/img')));
// app.get('/*', function (req, res) {
//   res.sendFile(path.join(__dirname, './client', 'index.html'));
// });

const server = app.listen(port);

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
);