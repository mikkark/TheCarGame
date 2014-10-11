'use strict'

app.controller('main', ['$scope', function($scope) {
    var devices = [
        new Device('device 1', 200, 250, "w"),
        new Device('device 2', 300, 90, "p"),
        new Device('device 3', 150, 150, "8"),
        new Device('device 4', 125, 60, "y")
    ];

    $scope.devices = devices;

    $scope.addDevice = false;

    var keyup = Rx.Observable.fromEvent(document, 'keyup');
    var keydown = Rx.Observable.fromEvent(document, 'keydown');

    $scope.keyboard = new Rx.Subject();

    keyup.subscribe($scope.keyboard);
}]);