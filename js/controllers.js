'use strict'

app.controller('main', ['$scope', function($scope) {

    var ferrariEngine = new model.Engine('ferrari', 15000, 0.5, 320);
    var skodaEngine = new model.Engine('skoda', 6500, 0.2, 180);
    var tractorEngine = new model.Engine('tractor', 5000, 0.5, 60);
    var truckEngine = new model.Engine('truck', 7000, 0.15, 80);

    var keys1 = { gas: "w", left: "a", right: "d" };
    var keys2 = { gas: "y", left: "g", right: "j" };
    var keys3 = { gas: "f", left: "x", right: "v" };
    var keys4 = { gas: "p", left: "l", right: "ä" };

    var ferrari = new model.Device('ferrari', keys2, ferrariEngine);
    ferrari.steering = new model.Steering(3);

    var devices = [
        ferrari,
        new model.Device('tractor', keys1, tractorEngine),
        new model.Device('truck', keys3, truckEngine),
        new model.Device('skoda rs', keys4, skodaEngine)
    ];

    $scope.devices = devices;
    $scope.addDevice = false;

}]);