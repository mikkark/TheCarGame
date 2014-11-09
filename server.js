/**
 * Created by karkkmik on 9.11.2014.
 */
var http = require('http')
var connect = require('connect');
var serveStatic = require('serve-static');

var app = connect();

var port = process.env.PORT || 1337;

app.use(serveStatic('www'));
app.use(serveStatic('bower_components'));

http.createServer(app).listen(port);