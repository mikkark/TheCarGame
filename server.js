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

var multiplayerGame = [];
var remoteCarsSyncRate = process.env.REMOTE_CARS_SYNC_RATE || 4000;

io.on('connection', function(socket){
    socket.on('join', function(playersCars) {

        var setAsRemoteCar = function (playersCar) {
            playersCar.isRemote = true;
            return playersCar;
        };

        playersCars = playersCars.map(setAsRemoteCar);

        if (multiplayerGame.length === 2) {
            socket.emit('gameFull');
            return;
        }

        var others = multiplayerGame
            .filter(function (player) { return player.socket.id !== socket.id })
            .map(function (player) { return player.cars; });

        socket.emit('otherPlayers', others);
        socket.broadcast.emit('someoneJoinedGame', playersCars);
        socket.emit('settings', { remoteCarSyncRate: remoteCarsSyncRate });

        multiplayerGame.push({ socket: socket, cars: playersCars });
    });

    socket.on('spectate', function () {
        var allOtherCars = multiplayerGame
            .map(function (player) { return player.cars; });

        socket.emit('otherPlayers', allOtherCars);
    });

    socket.on('raceStartClicked', function () {
        socket.broadcast.emit('raceStartClicked');
    });

    socket.on('carMoves', function (car) {
        socket.broadcast.emit('carMoves', car);
    });
    socket.on('carStart', function (car) {
        socket.broadcast.emit('carStart', car);
    });
    socket.on('carStop', function (car) {
        socket.broadcast.emit('carStop', car);
    });
    socket.on('syncPos', function (car) {
        socket.broadcast.emit('syncPos', car);
    });
    socket.on('disconnect', function () {
        var i = multiplayerGame.map(function (player) { return player.socket.id; }).indexOf(socket.id);
        var leavingCars = [];

        if (i >= 0) {
            leavingCars = multiplayerGame[i].cars;
            multiplayerGame.splice(i, 1);
        }

        multiplayerGame.map(function (otherPlayer) { otherPlayer.socket.emit('playerLeft', leavingCars); });
    });
});

http.listen(port);