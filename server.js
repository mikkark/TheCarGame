/**
 * Created by karkkmik on 9.11.2014.
 */
var connect = require('connect');
var serveStatic = require('serve-static');

var app = connect();

var port = process.env.PORT || 1337;

app.use(serveStatic('www'));
app.use(serveStatic('bower_components'));

var http = require('http').Server(app);

var io = require('socket.io')(http);

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('carMoves', function(car) {
        socket.broadcast.emit('carMoves', car);
    });
});

http.listen(port);