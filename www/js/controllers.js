'use strict'

app.controller('main', ['$scope', 'checkpointService', 'socketService',
    function ($scope, checkpointService, socketService) {

        var socket;
        var ferrariEngine = new model.Engine('ferrari', 15000, 0.5);
        var skodaEngine = new model.Engine('skoda', 6500, 0.2);
        var tractorEngine = new model.Engine('tractor', 5000, 0.5);
        var truckEngine = new model.Engine('truck', 7000, 0.15);

        var keys1 = { gas: 87, left: 65, right: 68, gearUp: 81, gearUpString: String.fromCharCode(81) };
        var keys2 = { gas: 89, left: 71, right: 74, gearUp: 84, gearUpString: String.fromCharCode(84) };
        var keys3 = { gas: 70, left: 88, right: 86, gearUp: 90, gearUpString: String.fromCharCode(90) };
        var keys4 = { gas: 104, left: 100, right: 102, gearUp: 103, gearUpString: String.fromCharCode(103) };

        var addToRemoteCars = function (remoteCar) {
            remoteCar.steering = new model.Steering(remoteCar.steering.turn); //we need an instance here for the turning to work.
            $scope.remoteCars.push(remoteCar);
        };

        var ferrari = new model.Car('ferrari' + (Math.random() * 10).toFixed(0), keys2, ferrariEngine, 320, ((Math.random() * 10) + 1).toFixed(0));
        ferrari.steering = new model.Steering(0.3);

        var cars = [
            //new model.Car('tractor', keys1, tractorEngine, 60, 2),
            //new model.Car('skoda rs', keys4, skodaEngine, 180, 3)
        ];

        $scope.cars = cars;
        $scope.remoteCars = [];
        $scope.numberOfLaps = checkpointService.numberOfLaps = 3;

        $scope.numberOfLapsChanged = function () {
            checkpointService.numberOfLaps = $scope.numberOfLaps;
        };

        var getSocket = function () {
            var socket = socketService.startConn();

            socket.on('gameFull', function () {
                $scope.multiplayerFull = true;
            });

            socket.on('someoneJoinedGame', function (newPlayersCars) {
                if (newPlayersCars.length > 0) {
                    for (var i = 0; i < newPlayersCars.length; i++) {
                        addToRemoteCars(newPlayersCars[i]);
                    }
                    console.log($scope.remoteCars.length);
                    $scope.$apply();
                }
            });

            socket.on('otherPlayers', function (otherPlayersCars) {
                if (otherPlayersCars.length > 0) {
                    for (var j = 0; j < otherPlayersCars.length; j++) {
                        for (var i = 0; i < otherPlayersCars[j].length; i++) {
                            addToRemoteCars(otherPlayersCars[j][i]);
                        }
                    }
                    console.log($scope.remoteCars.length);
                    $scope.$apply();
                }
            });

            socket.on('playerLeft', function (playersCars) {
                if (playersCars.length > 0) {
                    var i;
                    for (var j = 0; j < playersCars.length; j++) {
                        i = $scope.remoteCars
                                .map(function (remoteCar) {
                                    return remoteCar.name;
                                })
                                .indexOf(playersCars[j].name);
                        $scope.remoteCars.splice(i, 1);
                    }
                    $scope.$apply();
                }
            });

            socket.on('settings', function (settings) {
                var syncRate = parseInt(settings.remoteCarSyncRate);

                Rx.Observable.timer(syncRate, syncRate).subscribe(function () {
                    for (var i = 0; i < $scope.cars.length; i++) {
                        socket.emit('syncPos', $scope.cars[i]);
                    }
                });
            });

            return socket;
        };

        $scope.joinMultiplayer = function () {
            if (!socket) {
                socket = getSocket();
            }

            socket.emit('join', $scope.cars);
        };

        $scope.spectateMultiplayer = function () {
            if (!socket) {
                socket = getSocket();
            }

            socket.emit('spectate');
        };

        $scope.addLocalCar = function () {
            ferrari.nextCheckpointCtrl = checkpointService.getFirstCheckpointCtrl();

            cars.push(ferrari);
        };
}]);

app.controller('cpController', ['$scope', '$element', 'checkpointService', function ($scope, $element, checkpointService) {

    var currController = this;

    var getLineIntersection = function (p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
        var s1_x, s1_y, s2_x, s2_y;
        s1_x = p1_x - p0_x;
        s1_y = p1_y - p0_y;
        s2_x = p3_x - p2_x;
        s2_y = p3_y - p2_y;

        var s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
        var t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            // Collision detected
            return true;
        }

        // No collision
        return false;
    };

    this.checkIfCheckpointCrossed = function (car, carPrevX, carPrevY, carNewX, carNewY) {
        var intersect = getLineIntersection(carPrevX, carPrevY, carNewX, carNewY, currController.checkpoint.x1, currController.checkpoint.y1, currController.checkpoint.x2, currController.checkpoint.y2);

        if (intersect) {
            checkpointService.checkpointReached(currController, car);
        }

        return intersect;
    };

    this.checkpoint =  {
        id: Number($element.attr('checkpointId')),
        x1: Number($element.attr('x1')),
        y1: Number($element.attr('y1')),
        x2: Number($element.attr('x2')),
        y2: Number($element.attr('y2'))
    };

    checkpointService.registerCheckpoint(currController);
}]);

app.controller('startlightscontroller', ['$scope', '$element', 'checkpointService', function ($scope, $element, checkpointService) {
    $scope.litupLights = 0;

    $scope.startLights = function () {

        if ($scope.litupLights > 0) { return; }

        Rx.Observable.timer(0, 1000).take(4).subscribe(function () {
            $scope.litupLights = $scope.litupLights + 1;
            if ($scope.litupLights > 3) {
                $scope.litupLights = 0;
                checkpointService.start();
            }
            $scope.$apply();
        });
    };
}]);