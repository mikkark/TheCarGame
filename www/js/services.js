app.factory('socketService', function () {
    var socket;
    var service = {};

    service.carStartSub = new Rx.Subject();
    service.carMovesSub = new Rx.Subject();
    service.carStopSub = new Rx.Subject();
    service.syncCarPosSub = new Rx.Subject();
    service.onRaceStartClicked = function () { };
    service.onBestLapTimeReceived = function (data) { };
    service.onLastLapTimeReceived = function (data) { };

    service.startConn = function () {
        if (!socket) {
            socket = io();

            socket.on('carStart', function (car) {
                service.carStartSub.onNext(car);
            });

            socket.on('carMoves', function (remoteMoves) {
                service.carMovesSub.onNext(remoteMoves);
            });

            socket.on('carStop', function (car) {
                service.carStopSub.onNext(car);
            });

            socket.on('syncPos', function (car) {
                service.syncCarPosSub.onNext(car);
            });

            socket.on('raceStartClicked', function () {
               service.onRaceStartClicked();
            });

            socket.on('lastLapTime', function (data) {
               service.onLastLapTimeReceived(data);
            });
            socket.on('bestLapTime', function (data) {
                service.onBestLapTimeReceived(data);
            });
        }

        return socket;
    };

    service.send = function (eventName, params) {
        if (socket) {
            socket.emit(eventName, params);
        }
    };

    return service;
});

app.factory('checkpointService', function () {

    var checkpointService = function () {

        var service = this;
        var isRaceOn = false;
        var privateCheckpointSub = new Rx.Subject();

        service.isRaceOn = function () {
            return isRaceOn;
        };

        service.numberOfCheckpoints = 0;
        service.numberOfLaps = 0;

        service.getNextCheckpoint = function (currCheckpoint) {
            if (currCheckpoint.id === service.numberOfCheckpoints) {
                return service.checkpointCtrlsById[1];
            } else {
                return service.checkpointCtrlsById[currCheckpoint.id + 1];
            }
        };

        service.checkpointCtrlsById = {};
        service.checkpointSub = new Rx.Subject();

        privateCheckpointSub.timestamp().subscribe(function (data) {
            service.checkpointSub.onNext({ time: data.timestamp, name: data.value.name, id: data.value.id });
        });

        service.registerCheckpoint = function (checkpointCtrl) {
            service.checkpointCtrlsById[checkpointCtrl.checkpoint.id] = checkpointCtrl;
            service.numberOfCheckpoints = service.numberOfCheckpoints + 1;
        };

        service.checkpointReached = function (checkpointController, car) {
            car.nextCheckpointCtrl = service.getNextCheckpoint(checkpointController.checkpoint);

            privateCheckpointSub.onNext({name: car.name, id: checkpointController.checkpoint.id});

            if (checkpointController.checkpoint.id === service.numberOfCheckpoints) {
                privateCheckpointSub.onNext({name: car.name, id: 0});
            }
        };

        service.start = function () {
            isRaceOn = true;
            privateCheckpointSub.onNext({name: 'raceStart'});
        };

        service.getFirstCheckpointCtrl = function () {
            return service.checkpointCtrlsById[1];
        };

        return service;

    };

    return checkpointService();
});

app.factory('lapService', ['checkpointService', function (checkpointService) {

    var service = {};
    service.lapUpSub = new Rx.Subject();

    checkpointService.checkpointSub
        .filter(function (event) {
            return event.id === checkpointService.numberOfCheckpoints
        })
        .subscribe(function (event) {
            service.lapUpSub.onNext({name: event.name});
        });

    return service;
}]);

/*
 Eventbroadcast service. The first version was By Eric Terpstra, see http://ericterpstra.com/2012/09/angular-cats-part-3-communicating-with-broadcast/.
 This has now been modified according to http://www.theroks.com/angularjs-communication-controllers/.
 */
app.factory('eventBroadcast', function ($rootScope) {

    var CAR_STOPS = "car_stops";
    var carStops = function (car) {
        $rootScope.$broadcast(CAR_STOPS, car);
    };

    var onCarStops = function ($scope, handler) {
        $scope.$on(CAR_STOPS, function (event, message) {
            handler(message);
        });
    };

    var CAR_MOVED = "car_moved";
    var carMoved = function (data) {
        $rootScope.$broadcast(CAR_MOVED, data);
    };

    var onCarMoved = function ($scope, handler) {
        $scope.$on(CAR_MOVED, function (event, message) {
            handler(message);
        });
    };

    return {
        carStops: carStops,
        onCarStops: onCarStops,
        carMoved: carMoved,
        oncarMoved: onCarMoved
    };
});