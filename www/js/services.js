app.factory('socketService', function () {
    var socket;
    var service = {};

    service.carStartSub = new Rx.Subject();
    service.carMovesSub = new Rx.Subject();
    service.carStopSub = new Rx.Subject();
    service.syncCarPosSub = new Rx.Subject();

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
        service.lapSubject = new Rx.Subject();
        service.lapPubSubject = new Rx.Subject();

        service.lapSubject.timestamp().subscribe(function (data) {
            service.lapPubSubject.onNext({ time: data.timestamp, name: data.value.name, id: data.value.id });
        });

        service.registerCheckpoint = function (checkpointCtrl) {
            service.checkpointCtrlsById[checkpointCtrl.checkpoint.id] = checkpointCtrl;
            service.numberOfCheckpoints = service.numberOfCheckpoints + 1;
        };

        service.checkpointReached = function (checkpointController, car) {
            car.nextCheckpointCtrl = service.getNextCheckpoint(checkpointController.checkpoint);

            service.lapSubject.onNext({name: car.name, id: checkpointController.checkpoint.id});

            if (checkpointController.checkpoint.id === service.numberOfCheckpoints) {
                service.lapSubject.onNext({name: car.name, id: 0});
            }
        };

        service.start = function () {
            isRaceOn = true;
            service.lapSubject.onNext({name: 'raceStart'});
        };

        return service;

    };

    return checkpointService();
});