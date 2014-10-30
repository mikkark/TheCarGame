'use strict'

app.controller('main', ['$scope', 'checkpointService', function ($scope, checkpointService) {

    var ferrariEngine = new model.Engine('ferrari', 15000, 0.5);
    var skodaEngine = new model.Engine('skoda', 6500, 0.2);
    var tractorEngine = new model.Engine('tractor', 5000, 0.5);
    var truckEngine = new model.Engine('truck', 7000, 0.15);

    var keys1 = { gas: 87, left: 65, right: 68, gearUp: 81, gearUpString: String.fromCharCode(81) };
    var keys2 = { gas: 89, left: 71, right: 74, gearUp: 84, gearUpString: String.fromCharCode(84) };
    var keys3 = { gas: 70, left: 88, right: 86, gearUp: 90, gearUpString: String.fromCharCode(90) };
    var keys4 = { gas: 104, left: 100, right: 102, gearUp: 103, gearUpString: String.fromCharCode(103) };

    var ferrari = new model.Car('ferrari', keys2, ferrariEngine, 320);
    ferrari.steering = new model.Steering(3);

    var cars = [
        ferrari,
        new model.Car('tractor', keys1, tractorEngine, 60),
        new model.Car('truck', keys3, truckEngine, 80),
        new model.Car('skoda rs', keys4, skodaEngine, 180)
    ];

    $scope.cars = cars;
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

    //At startup link all cars to this checkpoint.
    if (this.checkpoint.id === 1) {
        angular.forEach($scope.cars, function(car, key) {
            car.nextCheckpointCtrl = currController;
        });
    }

    checkpointService.registerCheckpoint(currController);
}]);

app.controller('startlightscontroller', ['$scope', '$element', 'raceService', function ($scope, $element, raceService) {
    $scope.litupLights = 0;

    $scope.startLights = function () {

        if ($scope.litupLights > 0) { return; }

        Rx.Observable.timer(0, 1000).take(4).subscribe(function () {
            $scope.litupLights = $scope.litupLights + 1;
            if ($scope.litupLights > 3) {
                $scope.litupLights = 0;
                raceService.startRace();
            }
            $scope.$apply();
        });
    };
}]);