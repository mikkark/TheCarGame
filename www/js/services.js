app.factory('socketService', function () {
    var socket;
    var service = {};
    var carStartSub = new Rx.Subject();

    service.carStartSub = function () { return carStartSub; };
    service.carMovesSub = new Rx.Subject();
    service.carStopSub = new Rx.Subject();
    service.syncCarPosSub = new Rx.Subject();
    service.onRaceStartClicked = function () { };

    service.startConn = function () {
        if (!socket) {
            socket = io();

            socket.on('carStart', function (car) {
                carStartSub.onNext(car);
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
        var checkpointSubject = new Rx.Subject();

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

        checkpointSubject.timestamp().subscribe(function (data) {
            service.checkpointSub.onNext({ time: data.timestamp, name: data.value.name, id: data.value.id });
        });

        service.registerCheckpoint = function (checkpointCtrl) {
            service.checkpointCtrlsById[checkpointCtrl.checkpoint.id] = checkpointCtrl;
            service.numberOfCheckpoints = service.numberOfCheckpoints + 1;
        };

        service.checkpointReached = function (checkpointController, car) {
            car.nextCheckpointCtrl = service.getNextCheckpoint(checkpointController.checkpoint);

            checkpointSubject.onNext({name: car.name, id: checkpointController.checkpoint.id});

            if (checkpointController.checkpoint.id === service.numberOfCheckpoints) {
                checkpointSubject.onNext({name: car.name, id: 0});
            }
        };

        service.start = function () {
            isRaceOn = true;
            checkpointSubject.onNext({name: 'raceStart'});
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