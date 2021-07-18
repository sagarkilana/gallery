const http = require('http');
var express = require('express');
var app                     = express();
var bodyParser              = require('body-parser');
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ limit: "20mb", extended: true, parameterLimit: 20000 }));

var bodyParser = require('body-parser');
const hostname = 'http://localhost:4000';
const port = 4000;
var gallery                  = require('./controller/gallery.controller');
app.use('/api/gallery', gallery);
const server = http.createServer(app);
server.setTimeout(300000);
server.listen(port, () => {
  console.log(`Server running at http://${hostname}/`);
});


process.on('unhandledException', (err) => {
    console.log('whoops! there was an unhandledException at ',err);
  });
  
   process.on('uncaughtException', (err) => {
    console.log('whoops! there was an uncaughtException ',err);
   });